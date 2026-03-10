"""test_gis_utils.py

Unit tests for geospatial utilities.
Tests coordinate transformations, geometry operations, and spatial
calculations.
"""

import pytest

from server.gis_utils import (
    CoordinateTransformer,
    GeometryParser,
    LandAssessmentCalculator,
    SpatialCalculator,
)


class TestCoordinateTransformer:
    """Test coordinate system transformations."""

    def test_wgs84_to_web_mercator(self) -> None:
        """Test WGS84 to Web Mercator transformation."""
        # Saint Petersburg coordinates
        lat, lon = 59.9311, 30.3609

        transformer = CoordinateTransformer("EPSG:4326", "EPSG:3857")
        x, y = transformer.transform(lon, lat)

        # Web Mercator coordinates for Saint Petersburg
        assert 3380000 < x < 3390000
        assert 7500000 < y < 7510000

    def test_identity_transformation(self) -> None:
        """Test transformation to same coordinate system."""
        lat, lon = 59.9311, 30.3609

        transformer = CoordinateTransformer("EPSG:4326", "EPSG:4326")
        x, y = transformer.transform(lon, lat)

        assert abs(x - lon) < 0.0001
        assert abs(y - lat) < 0.0001

    def test_batch_transformation(self) -> None:
        """Test batch coordinate transformation."""
        coords = [(30.3609, 59.9311), (30.3, 59.9), (30.4, 60.0)]

        transformer = CoordinateTransformer("EPSG:4326", "EPSG:3857")
        transformed = transformer.transform_batch(coords)

        assert len(transformed) == 3
        for x, y in transformed:
            assert 3370000 < x < 3400000
            assert 7490000 < y < 7520000


class TestGeometryParser:
    """Test geometry parsing and validation."""

    def test_parse_point(self) -> None:
        """Test parsing point geometry."""
        geom = {"type": "Point", "coordinates": [30.3609, 59.9311]}

        parsed = GeometryParser.parse_geometry(geom)

        assert parsed is not None
        assert parsed.geom_type == "Point"

    def test_parse_polygon(self) -> None:
        """Test parsing polygon geometry."""
        geom = {
            "type": "Polygon",
            "coordinates": [
                [
                    [30.0, 59.9],
                    [30.1, 59.9],
                    [30.1, 60.0],
                    [30.0, 60.0],
                    [30.0, 59.9],
                ]
            ],
        }

        parsed = GeometryParser.parse_geometry(geom)

        assert parsed is not None
        assert parsed.geom_type == "Polygon"

    def test_validate_geometry(self) -> None:
        """Test geometry validation."""
        valid_geom = {
            "type": "Polygon",
            "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
        }

        is_valid = GeometryParser.validate_geometry(valid_geom)
        assert is_valid is True

    def test_invalid_geometry(self) -> None:
        """Test invalid geometry detection."""
        invalid_geom = {"type": "Polygon", "coordinates": []}

        is_valid = GeometryParser.validate_geometry(invalid_geom)
        assert is_valid is False


class TestSpatialCalculator:
    """Test spatial calculations."""

    def test_calculate_distance(self) -> None:
        """Test distance calculation between two points."""
        p1 = (30.3609, 59.9311)
        p2 = (30.3609, 59.9311)

        distance = SpatialCalculator.calculate_distance(p1, p2)

        assert distance == 0.0

    def test_calculate_distance_non_zero(self) -> None:
        """Test non-zero distance calculation."""
        p1 = (0, 0)
        p2 = (3, 4)

        distance = SpatialCalculator.calculate_distance(p1, p2)

        # Haversine distance in meters
        assert distance > 0

    def test_calculate_bounds(self) -> None:
        """Test bounding box calculation."""
        geom = {
            "type": "Polygon",
            "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
        }

        bounds = SpatialCalculator.calculate_bounds(geom)

        assert bounds["min_x"] == 0
        assert bounds["max_x"] == 1
        assert bounds["min_y"] == 0
        assert bounds["max_y"] == 1

    def test_calculate_centroid(self) -> None:
        """Test centroid calculation."""
        geom = {
            "type": "Polygon",
            "coordinates": [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]],
        }

        centroid = SpatialCalculator.calculate_centroid(geom)

        assert centroid is not None
        assert centroid[0] == pytest.approx(1.0, abs=0.1)
        assert centroid[1] == pytest.approx(1.0, abs=0.1)

    def test_calculate_perimeter(self) -> None:
        """Test perimeter calculation."""
        geom = {
            "type": "Polygon",
            "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
        }

        perimeter = SpatialCalculator.calculate_perimeter(geom)

        assert perimeter == pytest.approx(4.0, abs=0.1)

    def test_calculate_area(self) -> None:
        """Test area calculation."""
        geom = {
            "type": "Polygon",
            "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
        }

        area = SpatialCalculator.calculate_area(geom)

        assert area == pytest.approx(1.0, abs=0.01)

    def test_buffer_geometry(self) -> None:
        """Test geometry buffering."""
        geom = {"type": "Point", "coordinates": [0, 0]}

        buffered = SpatialCalculator.buffer_geometry(geom, 100)

        assert buffered is not None
        assert buffered.geom_type == "Polygon"

    def test_intersection(self) -> None:
        """Test geometry intersection."""
        geom1 = {
            "type": "Polygon",
            "coordinates": [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]],
        }

        geom2 = {
            "type": "Polygon",
            "coordinates": [[[1, 1], [3, 1], [3, 3], [1, 3], [1, 1]]],
        }

        intersection = SpatialCalculator.intersection(geom1, geom2)

        assert intersection is not None
        assert intersection.geom_type == "Polygon"


class TestLandAssessmentCalculator:
    """Test land assessment metric calculations."""

    def test_calculate_compactness(self) -> None:
        """Test compactness coefficient calculation."""
        # Square polygon (most compact)
        geom = {
            "type": "Polygon",
            "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
        }

        compactness = LandAssessmentCalculator.calculate_compactness(geom)

        # Square should have compactness close to 1
        assert 0.8 < compactness < 1.2

    def test_calculate_elongation(self) -> None:
        """Test elongation coefficient calculation."""
        # Rectangular polygon (elongated)
        geom = {
            "type": "Polygon",
            "coordinates": [[[0, 0], [2, 0], [2, 0.5], [0, 0.5], [0, 0]]],
        }

        bounds = SpatialCalculator.calculate_bounds(geom)
        elongation = LandAssessmentCalculator.calculate_elongation(bounds)

        assert elongation > 0

    def test_calculate_roundness(self) -> None:
        """Test roundness coefficient calculation."""
        # Circular polygon (most round)
        geom = {
            "type": "Polygon",
            "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
        }

        roundness = LandAssessmentCalculator.calculate_roundness(geom)

        assert roundness > 0

    def test_calculate_development_coefficient(self) -> None:
        """Test development coefficient calculation."""
        parcel_geom = {
            "type": "Polygon",
            "coordinates": [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
        }

        agricultural_geom = {
            "type": "Polygon",
            "coordinates": [[[0, 0], [5, 0], [5, 5], [0, 5], [0, 0]]],
        }

        dev_coeff = LandAssessmentCalculator.calculate_development_coefficient(
            parcel_geom, agricultural_geom
        )

        # Agricultural area is 25, total is 100, so coefficient should be 25
        assert dev_coeff == pytest.approx(25.0, abs=1.0)


class TestIntegration:
    """Integration tests combining multiple utilities."""

    def test_full_assessment_workflow(self) -> None:
        """Test complete assessment workflow."""
        # Create sample parcel
        parcel = {
            "type": "Polygon",
            "coordinates": [
                [
                    [30.0, 59.9],
                    [30.1, 59.9],
                    [30.1, 60.0],
                    [30.0, 60.0],
                    [30.0, 59.9],
                ]
            ],
        }

        # Calculate metrics
        bounds = SpatialCalculator.calculate_bounds(parcel)
        centroid = SpatialCalculator.calculate_centroid(parcel)
        area = SpatialCalculator.calculate_area(parcel)
        perimeter = SpatialCalculator.calculate_perimeter(parcel)
        compactness = LandAssessmentCalculator.calculate_compactness(parcel)

        # Verify results
        assert bounds is not None
        assert centroid is not None
        assert area > 0
        assert perimeter > 0
        assert compactness > 0

    def test_coordinate_transformation_workflow(self) -> None:
        """Test coordinate transformation workflow."""
        # Original WGS84 coordinates
        coords = [(30.3609, 59.9311), (30.3, 59.9)]

        # Transform to Web Mercator
        transformer = CoordinateTransformer("EPSG:4326", "EPSG:3857")
        transformed = transformer.transform_batch(coords)

        # Transform back to WGS84
        transformer_back = CoordinateTransformer("EPSG:3857", "EPSG:4326")
        restored = transformer_back.transform_batch(transformed)

        # Verify round-trip accuracy
        for orig, rest in zip(coords, restored):
            assert abs(orig[0] - rest[0]) < 0.0001
            assert abs(orig[1] - rest[1]) < 0.0001


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
