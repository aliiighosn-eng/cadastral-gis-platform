"""
Telegram bot interface for cadastral data queries and file delivery.
Handles /start_parse command and cadastral number input.
"""

import json
import logging
from datetime import datetime
from typing import Dict, Optional

from telegram import ReplyKeyboardMarkup, ReplyKeyboardRemove, Update
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    ConversationHandler,
    MessageHandler,
    filters,
)

# Configure logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

# Conversation states
SELECTING_TYPE, ENTERING_CADASTRAL = range(2)


class GazpromTelegramBot:
    """Telegram bot for Gazprom Proekt service."""

    def __init__(self, token: str):
        """
        Initialize bot.

        Args:
            token: Telegram bot token
        """
        self.token = token
        self.application = None
        self.user_states = {}

    async def start_command(
        self, update: Update, context: ContextTypes.DEFAULT_TYPE
    ) -> int:
        """Handle /start command."""
        user_name = update.effective_user.first_name

        welcome_message = (
            f"Привет, {user_name}! 👋\n\n"
            "Добро пожаловать в сервис Газпром Проект.\n"
            "Я помогу вам получить информацию о кадастровых участках.\n\n"
            "Используйте команду /start_parse для начала поиска."
        )

        await update.message.reply_text(welcome_message)
        return ConversationHandler.END

    async def start_parse_command(
        self, update: Update, context: ContextTypes.DEFAULT_TYPE
    ) -> int:
        """Handle /start_parse command."""
        user_id = update.effective_user.id

        # Store user state
        self.user_states[user_id] = {
            "state": "selecting_type",
            "started_at": datetime.utcnow().isoformat(),
        }

        # Create keyboard with property type options
        keyboard = [
            ["🏠 Земельный участок", "🏢 Здание"],
            ["📍 Помещение", "❌ Отмена"],
        ]

        reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True)

        message = (
            "Выберите тип объекта недвижимости:\n\n"
            "🏠 Земельный участок - для поиска земельных участков\n"
            "🏢 Здание - для поиска зданий\n"
            "📍 Помещение - для поиска помещений"
        )

        await update.message.reply_text(message, reply_markup=reply_markup)
        return SELECTING_TYPE

    async def handle_type_selection(
        self, update: Update, context: ContextTypes.DEFAULT_TYPE
    ) -> int:
        """Handle property type selection."""
        user_id = update.effective_user.user_id
        selected_type = update.message.text

        if selected_type == "❌ Отмена":
            await update.message.reply_text(
                "Поиск отменен.", reply_markup=ReplyKeyboardRemove()
            )
            return ConversationHandler.END

        # Map selection to type
        type_map = {
            "🏠 Земельный участок": "land_plot",
            "🏢 Здание": "building",
            "📍 Помещение": "room",
        }

        property_type = type_map.get(selected_type, "land_plot")

        # Store selection
        if user_id in self.user_states:
            self.user_states[user_id]["property_type"] = property_type

        # Ask for cadastral number
        message = (
            f"Вы выбрали: {selected_type}\n\n"
            "Введите кадастровый номер объекта.\n\n"
            "Примеры формата:\n"
            "• 78:06:0002108 - номер кадастрового квартала\n"
            "• 78:6:2108:6:3 - учетный номер объекта адресной системы"
        )

        await update.message.reply_text(message, reply_markup=ReplyKeyboardRemove())

        return ENTERING_CADASTRAL

    async def handle_cadastral_input(
        self, update: Update, context: ContextTypes.DEFAULT_TYPE
    ) -> int:
        """Handle cadastral number input."""
        cadastral_number = update.message.text.strip()

        # Validate cadastral number format
        if not self.validate_cadastral_number(cadastral_number):
            await update.message.reply_text(
                "❌ Неверный формат кадастрового номера.\n\n"
                "Пожалуйста, введите номер в одном из форматов:\n"
                "• 78:06:0002108\n"
                "• 78:6:2108:6:3"
            )
            return ENTERING_CADASTRAL

        # Show processing message
        processing_msg = await update.message.reply_text(
            "⏳ Обработка запроса...\n" "Пожалуйста, подождите."
        )

        try:
            # Fetch property data
            property_data = await self.fetch_property_data(cadastral_number)

            if property_data:
                # Create GeoJSON file
                geojson_file = await self.create_geojson_file(property_data)

                # Send file to user
                await update.message.reply_document(
                    document=open(geojson_file, "rb"),
                    filename=(
                        f"property_{cadastral_number.replace(':', '_')}" ".geojson"
                    ),
                    caption=(
                        f"📄 Данные для кадастрового номера: " f"{cadastral_number}"
                    ),
                )

                # Send property info
                info_message = self.format_property_info(property_data)
                await update.message.reply_text(info_message)
            else:
                error_msg = (
                    f"❌ Объект с кадастровым номером "
                    f"{cadastral_number} не найден.\n"
                    "Пожалуйста, проверьте номер и попробуйте снова."
                )
                await update.message.reply_text(error_msg)

        except Exception as e:
            logger.error(f"Error processing cadastral number: {str(e)}")
            await update.message.reply_text(
                "❌ Произошла ошибка при обработке запроса.\n"
                "Пожалуйста, попробуйте позже."
            )

        finally:
            # Delete processing message
            try:
                await processing_msg.delete()
            except Exception:
                pass

        return ConversationHandler.END

    @staticmethod
    def validate_cadastral_number(cadastral_number: str) -> bool:
        """Validate cadastral number format."""
        parts = cadastral_number.split(":")

        if len(parts) not in [3, 4, 5]:
            return False

        # Check if all parts are numeric
        for part in parts:
            if not part.isdigit():
                return False

        return True

    async def fetch_property_data(self, cadastral_number: str) -> Optional[Dict]:
        """
        Fetch property data from RGIS or database.

        Args:
            cadastral_number: Cadastral number

        Returns:
            Property data dictionary or None
        """
        # This would integrate with actual RGIS API or database
        # For now, return mock data
        return {
            "cadastral_number": cadastral_number,
            "address": "ул. Невский проспект, д. 1",
            "area": 1500.5,
            "land_use": "Жилищное строительство",
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [30.3, 59.9],
                        [30.31, 59.9],
                        [30.31, 59.91],
                        [30.3, 59.91],
                        [30.3, 59.9],
                    ]
                ],
            },
        }

    async def create_geojson_file(self, property_data: Dict) -> str:
        """
        Create GeoJSON file from property data.

        Args:
            property_data: Property data dictionary

        Returns:
            Path to created file
        """
        geojson = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "cadastral_number": property_data.get("cadastral_number"),
                        "address": property_data.get("address"),
                        "area": property_data.get("area"),
                        "land_use": property_data.get("land_use"),
                    },
                    "geometry": property_data.get("geometry"),
                }
            ],
        }

        # Save to temporary file
        cad_num = property_data.get("cadastral_number", "unknown")
        filename = f"/tmp/property_{cad_num.replace(':', '_')}.geojson"

        with open(filename, "w", encoding="utf-8") as f:
            json.dump(geojson, f, ensure_ascii=False, indent=2)

        return filename

    @staticmethod
    def format_property_info(property_data: Dict) -> str:
        """Format property information for display."""
        cad_num = property_data.get("cadastral_number", "N/A")
        address = property_data.get("address", "N/A")
        area = property_data.get("area", "N/A")
        land_use = property_data.get("land_use", "N/A")
        message = (
            f"📋 Информация об объекте:\n\n"
            f"🔢 Кадастровый номер: {cad_num}\n"
            f"📍 Адрес: {address}\n"
            f"📐 Площадь: {area} м²\n"
            f"🏗️ Назначение: {land_use}\n"
        )

        return message

    async def cancel_command(
        self, update: Update, context: ContextTypes.DEFAULT_TYPE
    ) -> int:
        """Handle /cancel command."""
        await update.message.reply_text(
            "Операция отменена.", reply_markup=ReplyKeyboardRemove()
        )
        return ConversationHandler.END

    async def help_command(
        self, update: Update, context: ContextTypes.DEFAULT_TYPE
    ) -> None:
        """Handle /help command."""
        help_text = (
            "Доступные команды:\n\n"
            "/start - Начать работу с ботом\n"
            "/start_parse - Начать поиск кадастрового объекта\n"
            "/help - Показать эту справку\n"
            "/cancel - Отменить текущую операцию\n\n"
            "Для получения информации о кадастровом объекте "
            "используйте команду /start_parse"
        )

        await update.message.reply_text(help_text)

    def setup_handlers(self) -> None:
        """Setup message handlers."""
        # Create conversation handler
        conv_handler = ConversationHandler(
            entry_points=[CommandHandler("start_parse", self.start_parse_command)],
            states={
                SELECTING_TYPE: [
                    MessageHandler(
                        filters.TEXT & ~filters.COMMAND,
                        self.handle_type_selection,
                    )
                ],
                ENTERING_CADASTRAL: [
                    MessageHandler(
                        filters.TEXT & ~filters.COMMAND,
                        self.handle_cadastral_input,
                    )
                ],
            },
            fallbacks=[CommandHandler("cancel", self.cancel_command)],
        )

        # Add handlers
        self.application.add_handler(CommandHandler("start", self.start_command))
        self.application.add_handler(CommandHandler("help", self.help_command))
        self.application.add_handler(conv_handler)

    async def start(self) -> None:
        """Start the bot."""
        self.application = Application.builder().token(self.token).build()

        # Setup handlers
        self.setup_handlers()

        # Start bot
        await self.application.initialize()
        await self.application.start()
        await self.application.updater.start_polling()

    async def stop(self) -> None:
        """Stop the bot."""
        if self.application:
            await self.application.updater.stop()
            await self.application.stop()
            await self.application.shutdown()


def create_bot(token: str) -> GazpromTelegramBot:
    """Create and return bot instance."""
    return GazpromTelegramBot(token)
