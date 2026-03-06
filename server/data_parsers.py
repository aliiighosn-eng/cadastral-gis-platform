"""
Data parsers for RGIS and CIAN integration.
Handles web scraping and API interactions for cadastral and market data.
"""

import time
from datetime import datetime
from typing import Dict, List, Optional

import aiohttp
import requests
from bs4 import BeautifulSoup


class RGISParser:
    """Parser for Regional Geographic Information System (RGIS) data."""

    BASE_URL = "https://rgis.spb.ru"
    TIMEOUT = 30

    @staticmethod
    def parse_cadastral_number(cadastral_number: str) -> Dict:
        """
        Parse cadastral number into components.

        Format: XX:XX:XXXXXXX:XXXX or XX:XX:XXXXXXX
        where XX = region, XX = district, XXXXXXX = quarter, XXXX = parcel

        Args:
            cadastral_number: Cadastral number string

        Returns:
            Dictionary with parsed components
        """
        parts = cadastral_number.split(":")

        if len(parts) == 3:
            # Quarter format
            return {
                "region": parts[0],
                "district": parts[1],
                "quarter": parts[2],
                "parcel": None,
                "type": "quarter",
            }
        elif len(parts) == 4:
            # Parcel format
            return {
                "region": parts[0],
                "district": parts[1],
                "quarter": parts[2],
                "parcel": parts[3],
                "type": "parcel",
            }
        elif len(parts) == 5:
            # Address object format
            return {
                "region": parts[0],
                "district": parts[1],
                "quarter": parts[2],
                "parcel": parts[3],
                "address_object": parts[4],
                "type": "address_object",
            }
        else:
            raise ValueError(f"Invalid cadastral number format: {cadastral_number}")

    @staticmethod
    async def fetch_property_data(cadastral_number: str) -> Optional[Dict]:
        """
        Fetch property data from RGIS API.

        Args:
            cadastral_number: Cadastral number

        Returns:
            Property data dictionary or None if not found
        """
        try:
            # Validate cadastral number format
            RGISParser.parse_cadastral_number(cadastral_number)

            # Build API URL (example - actual URL depends on RGIS API)
            url = f"{RGISParser.BASE_URL}/api/property/{cadastral_number}"

            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=RGISParser.TIMEOUT) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data
                    else:
                        return None
        except (aiohttp.ClientError, ValueError) as e:
            print(f"Error fetching RGIS data: {str(e)}")
            return None

    @staticmethod
    def parse_property_response(response_data: Dict) -> Dict:
        """
        Parse RGIS API response into standardized format.

        Args:
            response_data: Raw API response

        Returns:
            Standardized property data
        """
        try:
            return {
                "cadastral_number": response_data.get("cadastralNumber"),
                "address": response_data.get("address"),
                "area": response_data.get("area"),
                "land_use": response_data.get("landUse"),
                "owner": response_data.get("owner"),
                "geometry": response_data.get("geometry"),
                "attributes": response_data.get("attributes", {}),
                "fetched_at": datetime.utcnow().isoformat(),
            }
        except (KeyError, AttributeError, TypeError):
            return {}


class CIANScraper:
    """Scraper for CIAN real estate portal data."""

    BASE_URL = "https://spb.cian.ru"
    HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    REQUEST_DELAY = 2  # Delay between requests to avoid blocking

    @staticmethod
    def build_search_url(
        region: str = "spb", property_type: str = "apartment", rooms: int = 1, max_area: int = 30
    ) -> str:
        """
        Build CIAN search URL with filters.

        Args:
            region: Region code
            property_type: Type of property
            rooms: Number of rooms
            max_area: Maximum area in m²

        Returns:
            Search URL
        """
        params = {
            "region": region,
            "type": property_type,
            "rooms": rooms,
            "maxArea": max_area,
            "deal_type": "sale",
        }

        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{CIANScraper.BASE_URL}/search/?{query_string}"

    @staticmethod
    def scrape_listings(url: str, max_pages: int = 5, delay: float = 2.0) -> List[Dict]:
        """
        Scrape apartment listings from CIAN.

        Args:
            url: Search URL
            max_pages: Maximum pages to scrape
            delay: Delay between requests in seconds

        Returns:
            List of listing dictionaries
        """
        listings = []

        try:
            for page in range(1, max_pages + 1):
                page_url = f"{url}&page={page}"

                try:
                    response = requests.get(page_url, headers=CIANScraper.HEADERS, timeout=10)
                    response.raise_for_status()

                    soup = BeautifulSoup(response.content, "html.parser")

                    # Extract listings (selectors may need adjustment based on current CIAN layout)
                    listing_elements = soup.find_all("div", class_="listing-item")

                    if not listing_elements:
                        break

                    for element in listing_elements:
                        listing = CIANScraper.parse_listing_element(element)
                        if listing:
                            listings.append(listing)

                    # Respect rate limiting
                    time.sleep(delay)

                except requests.RequestException as e:
                    print(f"Error fetching page {page}: {str(e)}")
                    break

            return listings

        except requests.RequestException as e:
            print(f"Error scraping CIAN: {str(e)}")
            return listings

    @staticmethod
    def parse_listing_element(element: object) -> Optional[Dict]:
        """
        Parse individual listing element.

        Args:
            element: BeautifulSoup element

        Returns:
            Listing dictionary or None
        """
        try:
            listing = {
                "title": element.find("h2", class_="listing-title").text.strip(),
                "price": CIANScraper.extract_price(element),
                "area": CIANScraper.extract_area(element),
                "address": element.find("div", class_="listing-address").text.strip(),
                "rooms": CIANScraper.extract_rooms(element),
                "url": element.find("a", class_="listing-link").get("href"),
                "scraped_at": datetime.utcnow().isoformat(),
            }
            return listing
        except (AttributeError, TypeError):
            return None

    @staticmethod
    def extract_price(element: object) -> Optional[float]:
        """Extract price from listing element."""
        try:
            price_text = element.find("div", class_="listing-price").text
            # Remove currency symbols and spaces, convert to float
            price_str = "".join(c for c in price_text if c.isdigit() or c == ".")
            return float(price_str)
        except (ValueError, AttributeError):
            return None

    @staticmethod
    def extract_area(element: object) -> Optional[float]:
        """Extract area from listing element."""
        try:
            area_text = element.find("div", class_="listing-area").text
            # Extract numeric value
            area_str = "".join(c for c in area_text if c.isdigit() or c == ".")
            return float(area_str)
        except (ValueError, AttributeError):
            return None

    @staticmethod
    def extract_rooms(element: object) -> Optional[int]:
        """Extract number of rooms from listing element."""
        try:
            rooms_text = element.find("div", class_="listing-rooms").text
            # Extract numeric value
            rooms_str = "".join(c for c in rooms_text if c.isdigit())
            return int(rooms_str) if rooms_str else None
        except (ValueError, AttributeError):
            return None


class GeocodingService:
    """Geocoding service for address to coordinate conversion."""

    @staticmethod
    def geocode_address(address: str, region: str = "Russia") -> Optional[Dict]:
        """
        Convert address to coordinates using Nominatim.

        Args:
            address: Street address
            region: Region/country

        Returns:
            Dictionary with coordinates or None
        """
        try:
            from geopy.geocoders import Nominatim

            geolocator = Nominatim(user_agent="gazprom_proekt")
            location = geolocator.geocode(f"{address}, {region}")

            if location:
                return {
                    "address": location.address,
                    "latitude": location.latitude,
                    "longitude": location.longitude,
                    "raw": location.raw,
                }
            return None
        except (ImportError, Exception) as e:
            print(f"Geocoding error: {str(e)}")
            return None

    @staticmethod
    def reverse_geocode(latitude: float, longitude: float) -> Optional[Dict]:
        """
        Convert coordinates to address.

        Args:
            latitude: Latitude
            longitude: Longitude

        Returns:
            Dictionary with address or None
        """
        try:
            from geopy.geocoders import Nominatim

            geolocator = Nominatim(user_agent="gazprom_proekt")
            location = geolocator.reverse(f"{latitude}, {longitude}")

            if location:
                return {
                    "address": location.address,
                    "latitude": location.latitude,
                    "longitude": location.longitude,
                    "raw": location.raw,
                }
            return None
        except (ImportError, Exception) as e:
            print(f"Reverse geocoding error: {str(e)}")
            return None

    @staticmethod
    def batch_geocode(addresses: List[str]) -> List[Dict]:
        """
        Geocode multiple addresses.

        Args:
            addresses: List of addresses

        Returns:
            List of geocoding results
        """
        results = []
        for address in addresses:
            result = GeocodingService.geocode_address(address)
            if result:
                results.append(result)
            time.sleep(1)  # Rate limiting

        return results
