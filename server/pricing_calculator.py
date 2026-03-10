"""pricing_calculator.py

Pricing factors calculator for automated land valuation.
Handles buffer zone analysis, distance calculations, and weighted area
computations.
"""

import json
from typing import Dict, List, Optional

from shapely.geometry import shape


class PricingFactorCalculator:
    """Calculates pricing factors for land parcels."""

    @staticmethod
    def calculate_water_proximity(
        parcel_geometry: Dict,
        water_features: List[Dict],
        buffer_distances: List[float] = None,
    ) -> Optional[float]:
        """
        Calculate water proximity factor using buffer zones.

        Algorithm:
        1. Create buffer zones around parcel (10m, 50m, 150m)
        2. Check intersection with water features
        3. Return smallest buffer distance with intersection

        Args:
            parcel_geometry: GeoJSON geometry of parcel
            water_features: List of water feature geometries
            buffer_distances: Buffer distances in meters
                (default: [10, 50, 150])

        Returns:
            Smallest buffer distance with intersection, or None if no
            intersection
        """
        if buffer_distances is None:
            buffer_distances = [10, 50, 150]

        try:
            parcel = shape(parcel_geometry)

            # Sort buffer distances to check smallest first
            for buffer_dist in sorted(buffer_distances):
                buffer_zone = parcel.buffer(buffer_dist)

                # Check intersection with any water feature
                for water_geom in water_features:
                    water = shape(water_geom)
                    if buffer_zone.intersects(water):
                        return float(buffer_dist)

            return None
        except Exception:
            return None

    @staticmethod
    def calculate_local_center_distance(
        parcel_geometry: Dict, center_features: List[Dict]
    ) -> Optional[float]:
        """
        Calculate distance to nearest local center.

        Args:
            parcel_geometry: GeoJSON geometry of parcel
            center_features: List of center point geometries

        Returns:
            Distance to nearest center in meters, or None if no centers
        """
        try:
            parcel = shape(parcel_geometry)
            parcel_centroid = parcel.centroid

            min_distance = float("inf")

            for center_geom in center_features:
                center = shape(center_geom)
                if center.geom_type == "Point":
                    distance = parcel_centroid.distance(center)
                else:
                    # For non-point geometries, use centroid
                    distance = parcel_centroid.distance(center.centroid)

                min_distance = min(min_distance, distance)

            return min_distance if min_distance != float("inf") else None
        except Exception:
            return None

    @staticmethod
    def calculate_population_density(
        parcel_geometry: Dict, density_cells: List[Dict]
    ) -> Optional[float]:
        """
        Calculate weighted population density.

        Algorithm:
        1. Find all density cells intersecting parcel
        2. Split parcel by intersecting cells
        3. Calculate area of each part
        4. Compute weighted average: sum(density * area) / total_area

        Args:
            parcel_geometry: GeoJSON geometry of parcel
            density_cells: List of density cell geometries with density values

        Returns:
            Weighted average population density, or None if no intersections
        """
        try:
            parcel = shape(parcel_geometry)
            parcel_area = parcel.area

            if parcel_area <= 0:
                return None

            weighted_sum = 0.0
            intersected_area = 0.0

            for cell_data in density_cells:
                cell_geom = shape(cell_data.get("geometry", {}))
                density_value = cell_data.get("properties", {}).get("density", 0)

                # Calculate intersection
                intersection = parcel.intersection(cell_geom)

                if not intersection.is_empty:
                    intersection_area = intersection.area
                    intersected_area += intersection_area
                    weighted_sum += density_value * intersection_area

            if intersected_area > 0:
                return weighted_sum / intersected_area

            return None
        except Exception:
            return None

    @staticmethod
    def calculate_composite_factor(
        water_proximity: Optional[float],
        center_distance: Optional[float],
        population_density: Optional[float],
        weights: Dict[str, float] = None,
    ) -> float:
        """
        Calculate composite pricing factor from multiple factors.

        Args:
            water_proximity: Water proximity value (smaller is better)
            center_distance: Distance to center (smaller is better)
            population_density: Population density (larger is better)
            weights: Weights for each factor (default: equal weights)

        Returns:
            Composite factor value (0-1 scale)
        """
        if weights is None:
            weights = {"water": 0.33, "center": 0.33, "density": 0.34}

        factors = []

        # Normalize water proximity (inverse: closer is better)
        if water_proximity is not None:
            # Normalize to 0-1 scale (150m = 0, 10m = 1)
            water_factor = max(0, 1 - (water_proximity / 150))
            factors.append(("water", water_factor))

        # Normalize center distance (inverse: closer is better)
        if center_distance is not None:
            # Normalize to 0-1 scale (5000m = 0, 0m = 1)
            center_factor = max(0, 1 - (center_distance / 5000))
            factors.append(("center", center_factor))

        # Normalize population density (direct: higher is better)
        if population_density is not None:
            # Normalize to 0-1 scale (assuming max density ~1000 per km²)
            density_factor = min(1, population_density / 1000)
            factors.append(("density", density_factor))

        if not factors:
            return 0.0

        # Calculate weighted average
        total_weight = sum(weights.get(name, 0) for name, _ in factors)
        if total_weight == 0:
            return 0.0

        composite = (
            sum(value * weights.get(name, 0) for name, value in factors) / total_weight
        )

        return round(composite, 4)


class BufferAnalyzer:
    """Analyzes buffer zones for spatial analysis."""

    @staticmethod
    def create_buffer_zones(
        geometry: Dict, distances: List[float]
    ) -> Dict[float, Dict]:
        """
        Create multiple buffer zones around a geometry.

        Args:
            geometry: GeoJSON geometry
            distances: List of buffer distances

        Returns:
            Dictionary mapping distance to buffer geometry
        """
        try:
            geom = shape(geometry)
            buffers = {}

            for distance in distances:
                buffer_geom = geom.buffer(distance)
                buffers[distance] = json.loads(
                    json.dumps(buffer_geom.__geo_interface__)
                )

            return buffers
        except Exception:
            return {}

    @staticmethod
    def calculate_buffer_intersection_area(
        buffer_geometry: Dict, feature_geometry: Dict
    ) -> float:
        """Calculate area of intersection between buffer and feature."""
        try:
            buffer = shape(buffer_geometry)
            feature = shape(feature_geometry)
            intersection = buffer.intersection(feature)
            return intersection.area
        except Exception:
            return 0.0

    @staticmethod
    def find_features_in_buffer(
        buffer_geometry: Dict, features: List[Dict]
    ) -> List[Dict]:
        """Find all features intersecting with buffer zone."""
        try:
            buffer = shape(buffer_geometry)
            intersecting_features = []

            for feature in features:
                feature_geom = shape(feature.get("geometry", {}))
                if buffer.intersects(feature_geom):
                    intersecting_features.append(feature)

            return intersecting_features
        except Exception:
            return []
