"""
Database models for Gazprom Proekt Cadastral Service.
Defines core entities for cadastral data, land parcels, pricing factors, and analysis results.
"""

import enum
from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class CoordinateSystem(str, enum.Enum):
    """Supported coordinate systems for transformations."""

    MSK64 = "MSK-64"
    EPSG3857 = "EPSG:3857"
    EPSG4328 = "EPSG:4328"


class ProcessingStatus(str, enum.Enum):
    """Status of processing tasks."""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class CadastralParcel(Base):
    """Represents a cadastral land parcel."""

    __tablename__ = "cadastral_parcels"

    id = Column(Integer, primary_key=True, index=True)
    cadastral_number = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=True)
    land_use = Column(String(100), nullable=True)
    area = Column(Float, nullable=True)  # in square meters
    geometry = Column(JSON, nullable=False)  # GeoJSON geometry
    coordinate_system = Column(String(20), default=CoordinateSystem.EPSG4328)
    attributes = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    assessments = relationship("LandAssessment", back_populates="parcel")
    pricing_factors = relationship("PricingFactor", back_populates="parcel")
    valuations = relationship("CadastralValuation", back_populates="parcel")


class LandAssessment(Base):
    """Stores land use assessment metrics."""

    __tablename__ = "land_assessments"

    id = Column(Integer, primary_key=True, index=True)
    parcel_id = Column(Integer, ForeignKey("cadastral_parcels.id"), nullable=False)
    compactness_coefficient = Column(Float, nullable=True)
    elongation_coefficient = Column(Float, nullable=True)
    roundness_coefficient = Column(Float, nullable=True)
    average_distance_to_centers = Column(Float, nullable=True)
    development_coefficient = Column(Float, nullable=True)
    perimeter = Column(Float, nullable=True)
    calculated_at = Column(DateTime, default=datetime.utcnow)

    parcel = relationship("CadastralParcel", back_populates="assessments")


class PricingFactor(Base):
    """Stores pricing factors for land parcels."""

    __tablename__ = "pricing_factors"

    id = Column(Integer, primary_key=True, index=True)
    parcel_id = Column(Integer, ForeignKey("cadastral_parcels.id"), nullable=False)
    water_proximity = Column(Float, nullable=True)  # Distance to water bodies in meters
    local_center_distance = Column(Float, nullable=True)  # Distance to nearest local center
    population_density = Column(Float, nullable=True)  # Weighted population density
    factor_type = Column(String(50), nullable=True)  # Type of factor
    calculated_at = Column(DateTime, default=datetime.utcnow)

    parcel = relationship("CadastralParcel", back_populates="pricing_factors")


class CadastralValuation(Base):
    """Stores cadastral valuation results."""

    __tablename__ = "cadastral_valuations"

    id = Column(Integer, primary_key=True, index=True)
    parcel_id = Column(Integer, ForeignKey("cadastral_parcels.id"), nullable=False)
    valuation_value = Column(Float, nullable=False)  # Calculated cadastral value
    model_r_squared = Column(Float, nullable=True)  # R² metric
    model_coefficients = Column(JSON, nullable=True)  # Regression model coefficients
    calculation_method = Column(String(100), nullable=True)
    valuation_date = Column(DateTime, default=datetime.utcnow)

    parcel = relationship("CadastralParcel", back_populates="valuations")


class GISFile(Base):
    """Stores metadata for uploaded GIS files."""

    __tablename__ = "gis_files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(20), nullable=False)  # dxf, geojson, tab
    file_path = Column(String(500), nullable=False)  # S3 path
    file_size = Column(Integer, nullable=True)
    s3_url = Column(String(500), nullable=True)
    coordinate_system = Column(String(20), default=CoordinateSystem.EPSG4328)
    feature_count = Column(Integer, nullable=True)
    upload_date = Column(DateTime, default=datetime.utcnow)
    processed = Column(Boolean, default=False)
    processing_status = Column(String(20), default=ProcessingStatus.PENDING)


class ProcessingTask(Base):
    """Tracks long-running processing tasks."""

    __tablename__ = "processing_tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_type = Column(String(100), nullable=False)  # export, merge, assess, etc.
    status = Column(String(20), default=ProcessingStatus.PENDING)
    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)


class RegressionModel(Base):
    """Stores trained regression models for cadastral valuation."""

    __tablename__ = "regression_models"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False)
    region = Column(String(100), nullable=False)  # e.g., "Saint Petersburg"
    coefficients = Column(JSON, nullable=False)  # Model coefficients {a0, a1, a2, ...}
    r_squared = Column(Float, nullable=False)
    feature_names = Column(JSON, nullable=False)  # List of feature names
    training_samples = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class MarketData(Base):
    """Stores market data from CIAN and other sources."""

    __tablename__ = "market_data"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(50), nullable=False)  # cian, rgis, etc.
    property_type = Column(String(50), nullable=False)  # apartment, land, etc.
    region = Column(String(100), nullable=False)
    price = Column(Float, nullable=True)
    area = Column(Float, nullable=True)
    rooms = Column(Integer, nullable=True)
    address = Column(String(255), nullable=True)
    coordinates = Column(JSON, nullable=True)  # {lat, lon}
    raw_data = Column(JSON, nullable=True)
    collected_at = Column(DateTime, default=datetime.utcnow)


class TelegramUser(Base):
    """Stores Telegram user information for bot interactions."""

    __tablename__ = "telegram_users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(String(50), unique=True, index=True, nullable=False)
    username = Column(String(100), nullable=True)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    state = Column(String(50), default="idle")  # idle, waiting_for_cadastral_number, etc.
    last_interaction = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


class RenderedImage(Base):
    """Stores metadata for rendered GIS images."""

    __tablename__ = "rendered_images"

    id = Column(Integer, primary_key=True, index=True)
    source_file_id = Column(Integer, ForeignKey("gis_files.id"), nullable=True)
    image_path = Column(String(500), nullable=False)  # S3 path
    s3_url = Column(String(500), nullable=True)
    image_format = Column(String(20), default="png")
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    stroke_color = Column(String(20), default="#000000")
    fill_color = Column(String(20), default="#FFFFFF")
    stroke_width = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)
