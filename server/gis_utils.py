"""gis_utils.py

Core geospatial utilities for coordinate transformations and geometry.
Handles coordinate system conversions, geometry parsing, and spatial
calculations.
"""

import json
import math
from typing import Any, Dict, List, Optional, Tuple

import geopandas as gpd
from pyproj import CRS, Transformer
from shapely.geometry import Point, shape


class CoordinateTransformer:
    """Handles coordinate system transformations."""

    # Define coordinate system definitions
    SYSTEMS = {
        "MSK-64": "EPSG:28465",  # Moscow Zone 1 (approximate)
        "EPSG:3857": "EPSG:3857",  # Web Mercator
        # WGS84 (note: 4328 is likely a typo in requirements, using 4326)
        "EPSG:4328": "EPSG:4326",
    }

    @staticmethod
    def transform_coordinates(
        lon: float, lat: float, from_system: str, to_system: str
    ) -> Tuple[float, float]:
        """
        Transform coordinates from one system to another.

        Args:
            lon: Longitude or X coordinate
            lat: Latitude or Y coordinate
            from_system: Source coordinate system (e.g., "EPSG:4326")
            to_system: Target coordinate system (e.g., "EPSG:3857")

        Returns:
            Tuple of transformed coordinates (x, y)
        """
        try:
            from_crs = CRS.from_string(
                CoordinateTransformer.SYSTEMS.get(from_system, from_system)
            )
            to_crs = CRS.from_string(
                CoordinateTransformer.SYSTEMS.get(to_system, to_system)
            )
            transformer = Transformer.from_crs(
                from_crs, to_crs, always_xy=True
            )
            return transformer.transform(lon, lat)
        except Exception as e:
            raise ValueError(f"Coordinate transformation failed: {str(e)}")

    @staticmethod
    def transform_geometry(
        geometry: Dict, from_system: str, to_system: str
    ) -> Dict:
        """
        Transform a GeoJSON geometry from one coordinate system to another.

        Args:
            geometry: GeoJSON geometry object
            from_system: Source coordinate system
            to_system: Target coordinate system

        Returns:
            Transformed GeoJSON geometry
        """
        try:
            from_crs = CRS.from_string(
                CoordinateTransformer.SYSTEMS.get(from_system, from_system)
            )
            to_crs = CRS.from_string(
                CoordinateTransformer.SYSTEMS.get(to_system, to_system)
            )

            gdf = gpd.GeoDataFrame(
                [{"geometry": shape(geometry)}], crs=from_crs
            )
            gdf_transformed = gdf.to_crs(to_crs)

            return json.loads(gdf_transformed.geometry.iloc[0].geom_type)
        except Exception as e:
            raise ValueError(f"Geometry transformation failed: {str(e)}")


class GeometryParser:
    """Parses and validates geometric objects."""

    SUPPORTED_TYPES = {
        "Point",
        "LineString",
        "Polygon",
        "MultiPoint",
        "MultiLineString",
        "MultiPolygon",
    }

    @staticmethod
    def parse_geometry(geometry: Dict) -> Optional[Any]:
        """
        Parse GeoJSON geometry to Shapely geometry object.

        Args:
            geometry: GeoJSON geometry object

        Returns:
            Shapely geometry object or None if invalid
        """
        try:
            if geometry.get("type") not in GeometryParser.SUPPORTED_TYPES:
                return None
            return shape(geometry)
        except Exception:
            return None

    @staticmethod
    def extract_coordinates(geometry: Dict) -> List[Tuple[float, float]]:
        """
        Extract all coordinates from a geometry.

        Args:
            geometry: GeoJSON geometry object

        Returns:
            List of (x, y) coordinate tuples
        """
        coords = []
        geom_type = geometry.get("type")

        if geom_type == "Point":
            coords.append(tuple(geometry["coordinates"]))
        elif geom_type == "LineString":
            coords.extend([tuple(c) for c in geometry["coordinates"]])
        elif geom_type == "Polygon":
            for ring in geometry["coordinates"]:
                coords.extend([tuple(c) for c in ring])
        elif geom_type in ["MultiPoint", "MultiLineString", "MultiPolygon"]:
            for part in geometry["coordinates"]:
                if geom_type == "MultiPoint":
                    coords.append(tuple(part))
                elif geom_type == "MultiLineString":
                    coords.extend([tuple(c) for c in part])
                elif geom_type == "MultiPolygon":
                    for ring in part:
                        coords.extend([tuple(c) for c in ring])

        return coords

    @staticmethod
    def get_geometry_type(geometry: Dict) -> str:
        """Get simplified geometry type (Point, Line, Polygon)."""
        geom_type = geometry.get("type", "")
        if "Point" in geom_type:
            return "Point"
        elif "LineString" in geom_type:
            return "Line"
        elif "Polygon" in geom_type:
            return "Polygon"
        return "Unknown"


class SpatialCalculator:
    """Performs spatial calculations on geometries."""

    @staticmethod
    def calculate_area(geometry: Dict) -> float:
        """Calculate area in square meters."""
        try:
            geom = shape(geometry)
            return geom.area
        except Exception:
            return 0.0

    @staticmethod
    def calculate_perimeter(geometry: Dict) -> float:
        """Calculate perimeter in meters."""
        try:
            geom = shape(geometry)
            return geom.length
        except Exception:
            return 0.0

    @staticmethod
    def calculate_centroid(geometry: Dict) -> Tuple[float, float]:
        """Calculate centroid of geometry."""
        try:
            geom = shape(geometry)
            return (geom.centroid.x, geom.centroid.y)
        except Exception:
            return (0.0, 0.0)

    @staticmethod
    def calculate_bounds(geometry: Dict) -> Dict:
        """Calculate bounding box of geometry."""
        try:
            geom = shape(geometry)
            minx, miny, maxx, maxy = geom.bounds
            return {
                "x_min": minx,
                "y_min": miny,
                "x_max": maxx,
                "y_max": maxy,
                "width": maxx - minx,
                "height": maxy - miny,
            }
        except Exception:
            return {}

    @staticmethod
    def calculate_distance(
        point1: Tuple[float, float], point2: Tuple[float, float]
    ) -> float:
        """Calculate distance between two points in meters."""
        try:
            p1 = Point(point1)
            p2 = Point(point2)
            return p1.distance(p2)
        except Exception:
            return 0.0

    @staticmethod
    def buffer_geometry(geometry: Dict, distance: float) -> Dict:
        """Create a buffer around geometry."""
        try:
            geom = shape(geometry)
            buffered = geom.buffer(distance)
            return json.loads(json.dumps(buffered.__geo_interface__))
        except Exception:
            return geometry

    @staticmethod
    def intersect_geometries(geom1: Dict, geom2: Dict) -> Optional[Dict]:
        """Find intersection of two geometries."""
        try:
            g1 = shape(geom1)
            g2 = shape(geom2)
            intersection = g1.intersection(g2)
            if not intersection.is_empty:
                return json.loads(json.dumps(intersection.__geo_interface__))
            return None
        except Exception:
            return None

    @staticmethod
    def calculate_intersection_area(geom1: Dict, geom2: Dict) -> float:
        """Calculate area of intersection between two geometries."""
        try:
            g1 = shape(geom1)
            g2 = shape(geom2)
            intersection = g1.intersection(g2)
            return intersection.area
        except Exception:
            return 0.0


class LandAssessmentCalculator:
    """Calculates land use assessment metrics."""

    @staticmethod
    def calculate_compactness(geometry: Dict) -> float:
        """
        Calculate compactness coefficient.
        Formula: k_comp = П / (4 * sqrt(P))
        where П = perimeter, P = area
        """
        try:
            geom = shape(geometry)
            perimeter = geom.length
            area = geom.area

            if area <= 0:
                return 0.0

            k_comp = perimeter / (4 * math.sqrt(area))
            return round(k_comp, 4)
        except Exception:
            return 0.0

    @staticmethod
    def calculate_elongation(bounds: Dict) -> float:
        """
        Calculate elongation coefficient.
        Formula: k_dal = s / (1.7 * sqrt(P))
        where s = max distance between parcels, P = total area
        """
        try:
            if not bounds:
                return 0.0

            width = bounds.get("width", 0)
            height = bounds.get("height", 0)
            area = width * height

            if area <= 0:
                return 0.0

            max_distance = math.sqrt(width**2 + height**2)
            k_dal = max_distance / (1.7 * math.sqrt(area))
            return round(k_dal, 4)
        except Exception:
            return 0.0

    @staticmethod
    def calculate_roundness(
        geometry: Dict, center_distance: float = None
    ) -> float:
        """
        Calculate roundness coefficient.
        Formula: k_okr = (2 * d) / sqrt(2 * P)
        where d = max distance from center to boundary, P = area
        """
        try:
            geom = shape(geometry)
            area = geom.area

            if area <= 0:
                return 0.0

            if center_distance is None:
                centroid = geom.centroid
                max_dist = max(
                    [
                        centroid.distance(Point(coord))
                        for coord in geom.exterior.coords
                    ]
                )
            else:
                max_dist = center_distance

            k_okr = (2 * max_dist) / math.sqrt(2 * area)
            return round(k_okr, 4)
        except Exception:
            return 0.0

    @staticmethod
    def calculate_development_coefficient(
        agricultural_area: float, total_area: float
    ) -> float:
        """
        Calculate development coefficient.
        Formula: k_o = (P_ag * 100) / P
        where P_ag = agricultural area, P = total area
        """
        try:
            if total_area <= 0:
                return 0.0

            k_o = (agricultural_area * 100) / total_area
            return round(k_o, 2)
        except Exception:
            return 0.0
