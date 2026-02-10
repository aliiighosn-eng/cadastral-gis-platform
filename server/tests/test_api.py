"""
Integration tests for FastAPI endpoints.
Tests API functionality and data processing workflows.
"""

import pytest
import json
import tempfile
import os
from fastapi.testclient import TestClient
from server.main import app

client = TestClient(app)


class TestHealthEndpoint:
    """Test health check endpoint."""

    def test_health_check(self):
        """Test health check returns OK status."""
        response = client.get("/api/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "timestamp" in data


class TestRootEndpoint:
    """Test root endpoint."""

    def test_root_endpoint(self):
        """Test root endpoint returns API info."""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Gazprom Proekt Cadastral Service"
        assert "version" in data
        assert "documentation" in data


class TestCoordinateExportEndpoint:
    """Test coordinate export endpoint."""

    def test_export_without_file(self):
        """Test export endpoint without file returns error."""
        response = client.post("/api/export/coordinates")
        
        assert response.status_code == 422  # Validation error

    def test_export_with_geojson(self):
        """Test export endpoint with GeoJSON file."""
        # Create sample GeoJSON
        geojson = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {"id": 1, "kadNum": "78:06:0002108"},
                    "geometry": {
                        "type": "Point",
                        "coordinates": [30.3609, 59.9311]
                    }
                }
            ]
        }
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.geojson', delete=False) as f:
            json.dump(geojson, f)
            temp_path = f.name
        
        try:
            with open(temp_path, 'rb') as f:
                response = client.post(
                    "/api/export/coordinates",
                    files={"file": ("test.geojson", f, "application/json")},
                    data={"target_system": "EPSG:4326"}
                )
            
            assert response.status_code == 200
            assert response.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        finally:
            os.unlink(temp_path)


class TestLandAssessmentEndpoint:
    """Test land assessment endpoint."""

    def test_assessment_without_files(self):
        """Test assessment endpoint without files returns error."""
        response = client.post("/api/assessment/land-use")
        
        assert response.status_code == 422

    def test_assessment_with_files(self):
        """Test assessment endpoint with valid files."""
        # Create sample GeoJSON files
        parcels = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {"id": 1},
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
                    }
                }
            ]
        }
        
        centers = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {"id": 1},
                    "geometry": {
                        "type": "Point",
                        "coordinates": [0.5, 0.5]
                    }
                }
            ]
        }
        
        # Create temporary files
        with tempfile.NamedTemporaryFile(mode='w', suffix='.geojson', delete=False) as f:
            json.dump(parcels, f)
            parcels_path = f.name
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.geojson', delete=False) as f:
            json.dump(centers, f)
            centers_path = f.name
        
        try:
            with open(parcels_path, 'rb') as pf, open(centers_path, 'rb') as cf:
                response = client.post(
                    "/api/assessment/land-use",
                    files={
                        "parcels_file": ("parcels.geojson", pf, "application/json"),
                        "centers_file": ("centers.geojson", cf, "application/json")
                    }
                )
            
            assert response.status_code == 200
            data = response.json()
            assert "results" in data
            assert "count" in data
        finally:
            os.unlink(parcels_path)
            os.unlink(centers_path)


class TestGISMergerEndpoint:
    """Test GIS layer merger endpoint."""

    def test_merge_without_files(self):
        """Test merge endpoint without files returns error."""
        response = client.post("/api/gis/merge-layers")
        
        assert response.status_code == 422

    def test_merge_single_file(self):
        """Test merge endpoint with single file returns error."""
        geojson = {
            "type": "FeatureCollection",
            "features": []
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.geojson', delete=False) as f:
            json.dump(geojson, f)
            temp_path = f.name
        
        try:
            with open(temp_path, 'rb') as f:
                response = client.post(
                    "/api/gis/merge-layers",
                    files={"files": ("test.geojson", f, "application/json")}
                )
            
            # Should fail with less than 2 files
            assert response.status_code in [400, 422]
        finally:
            os.unlink(temp_path)


class TestGeocodingEndpoint:
    """Test geocoding endpoints."""

    def test_forward_geocoding(self):
        """Test forward geocoding endpoint."""
        response = client.post(
            "/api/geocoding/forward",
            json={
                "address": "Невский проспект, 1, Санкт-Петербург",
                "region": "Russia"
            }
        )
        
        # May return 404 if address not found in mock data
        assert response.status_code in [200, 404]

    def test_reverse_geocoding(self):
        """Test reverse geocoding endpoint."""
        response = client.post(
            "/api/geocoding/reverse",
            json={
                "latitude": 59.9311,
                "longitude": 30.3609
            }
        )
        
        # May return 404 if address not found in mock data
        assert response.status_code in [200, 404]


class TestRegressionEndpoint:
    """Test regression model endpoints."""

    def test_train_model_without_data(self):
        """Test training endpoint without data returns error."""
        response = client.post(
            "/api/regression/train",
            json={
                "features": [],
                "targets": [],
                "feature_names": [],
                "region": "Saint Petersburg"
            }
        )
        
        assert response.status_code == 400

    def test_train_model_with_data(self):
        """Test training endpoint with valid data."""
        response = client.post(
            "/api/regression/train",
            json={
                "features": [[100, 500, 1000], [150, 600, 1200]],
                "targets": [100000, 150000],
                "feature_names": ["area", "distance", "density"],
                "region": "Saint Petersburg"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "formula" in data
        assert "metrics" in data
        assert "model_id" in data


class TestRenderingEndpoint:
    """Test geometry rendering endpoint."""

    def test_render_without_file(self):
        """Test rendering endpoint without file returns error."""
        response = client.post("/api/render/geometry")
        
        assert response.status_code == 422

    def test_render_with_geojson(self):
        """Test rendering endpoint with GeoJSON file."""
        geojson = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
                    }
                }
            ]
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.geojson', delete=False) as f:
            json.dump(geojson, f)
            temp_path = f.name
        
        try:
            with open(temp_path, 'rb') as f:
                response = client.post(
                    "/api/render/geometry",
                    files={"file": ("test.geojson", f, "application/json")},
                    data={
                        "stroke_color": "#000000",
                        "fill_color": "#CCCCCC",
                        "stroke_width": "2"
                    }
                )
            
            assert response.status_code == 200
            assert response.headers["content-type"] == "image/png"
        finally:
            os.unlink(temp_path)


class TestCIANScraperEndpoint:
    """Test CIAN scraper endpoint."""

    def test_scrape_apartments(self):
        """Test CIAN scraper endpoint."""
        response = client.post(
            "/api/cian/scrape-apartments",
            json={"max_pages": 1}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "task_id" in data
        assert data["status"] == "pending"


class TestErrorHandling:
    """Test error handling."""

    def test_invalid_endpoint(self):
        """Test invalid endpoint returns 404."""
        response = client.get("/api/nonexistent")
        
        assert response.status_code == 404

    def test_invalid_method(self):
        """Test invalid HTTP method returns 405."""
        response = client.get("/api/export/coordinates")
        
        assert response.status_code == 405


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
