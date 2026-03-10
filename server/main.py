"""
Main FastAPI application for Gazprom Proekt Cadastral Service.
Defines API endpoints for geospatial data processing and cadastral workflows.
"""

import os
import shutil
import tempfile
from datetime import datetime
from typing import List

from fastapi import BackgroundTasks, Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session

from server.data_parsers import CIANScraper, GeocodingService
from server.database import get_db, init_db
from server.file_processor import FileProcessor, GeoJSONMerger
from server.geometry_renderer import GeometryRenderer
from server.gis_utils import LandAssessmentCalculator, SpatialCalculator
from server.models import (
    GISFile,
    LandAssessment,
    MarketData,
    ProcessingStatus,
    ProcessingTask,
    RegressionModel,
)
from server.pricing_calculator import PricingFactorCalculator
from server.regression_model import CadastralRegressionModel
from server.middleware.rate_limiter import rate_limiter
from server.logging_config import setup_logging, get_logger

# Initialize logging
setup_logging()
logger = get_logger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Gazprom Proekt Cadastral Service",
    description="Comprehensive GIS and real estate data processing platform",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def rate_limit_middleware(request, call_next):
    """Apply rate limiting to all API requests."""
    client_ip = request.client.host if request.client else "unknown"

    if not rate_limiter.is_allowed(client_ip):
        return JSONResponse(
            status_code=429,
            content={
                "error": "Too many requests",
                "message": "Rate limit exceeded. Please try again later.",
                "stats": rate_limiter.get_client_stats(client_ip),
            },
        )

    response = await call_next(request)
    return response


@app.on_event("startup")
async def startup_event() -> None:
    """Initialize database on startup."""
    logger.info("Starting Gazprom Proekt Cadastral Service...")
    init_db()
    logger.info("Database initialized successfully")
    logger.info("Gazprom Proekt Cadastral Service started on " "http://localhost:8000")


# ==================== Coordinate Export Endpoints ====================


@app.post("/api/export/coordinates")
async def export_coordinates(
    file: UploadFile = File(...),
    target_system: str = "EPSG:4328",
    db: Session = Depends(get_db),
):
    """
    Export coordinates from GIS file to Excel.

    Args:
        file: GIS file (.dxf, .geojson, .tab)
        target_system: Target coordinate system
        db: Database session

    Returns:
        Excel file with transformed coordinates
    """
    try:
        # Save uploaded file
        temp_dir = tempfile.mkdtemp()
        temp_file = os.path.join(temp_dir, file.filename)

        with open(temp_file, "wb") as f:
            content = await file.read()
            f.write(content)

        # Read file
        gdf = FileProcessor.read_file(temp_file)
        if gdf is None:
            raise ValueError("Failed to read file")

        # Extract features
        features = FileProcessor.extract_features(gdf)

        # Export to Excel
        output_file = os.path.join(temp_dir, "exported.xlsx")
        FileProcessor.export_to_excel(features, output_file, target_system)

        # Store file metadata
        gis_file = GISFile(
            filename=file.filename,
            file_type=os.path.splitext(file.filename)[1].lower().lstrip("."),
            file_path=output_file,
            coordinate_system=target_system,
            feature_count=len(features),
            processed=True,
            processing_status=ProcessingStatus.COMPLETED,
        )
        db.add(gis_file)
        db.commit()

        return FileResponse(output_file, filename="exported.xlsx")

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        # Cleanup
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)


# ==================== Land Assessment Endpoints ====================


@app.post("/api/assessment/land-use")
async def assess_land_use(
    parcels_file: UploadFile = File(...),
    centers_file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Calculate land use assessment metrics.

    Args:
        parcels_file: GeoJSON file with land parcels
        centers_file: GeoJSON file with land centers
        db: Database session

    Returns:
        Assessment results
    """
    try:
        temp_dir = tempfile.mkdtemp()

        # Save files
        parcels_path = os.path.join(temp_dir, "parcels.geojson")
        centers_path = os.path.join(temp_dir, "centers.geojson")

        for uploaded_file, save_path in [
            (parcels_file, parcels_path),
            (centers_file, centers_path),
        ]:
            with open(save_path, "wb") as f:
                content = await uploaded_file.read()
                f.write(content)

        # Read files
        parcels_gdf = FileProcessor.read_file(parcels_path)
        centers_gdf = FileProcessor.read_file(centers_path)

        if parcels_gdf is None or centers_gdf is None:
            raise ValueError("Failed to read files")

        # Calculate metrics
        results = []

        for idx, parcel_row in parcels_gdf.iterrows():
            geometry = parcel_row.geometry.__geo_interface__
            bounds = SpatialCalculator.calculate_bounds(geometry)

            # Calculate coefficients
            compactness = LandAssessmentCalculator.calculate_compactness(geometry)
            elongation = LandAssessmentCalculator.calculate_elongation(bounds)
            roundness = LandAssessmentCalculator.calculate_roundness(geometry)

            # Calculate average distance to centers
            parcel_centroid = SpatialCalculator.calculate_centroid(geometry)
            distances = []

            for center_idx, center_row in centers_gdf.iterrows():
                center_geom = center_row.geometry
                distance = SpatialCalculator.calculate_distance(
                    parcel_centroid, (center_geom.x, center_geom.y)
                )
                distances.append(distance)

            avg_distance = sum(distances) / len(distances) if distances else 0

            # Store assessment
            assessment = LandAssessment(
                parcel_id=idx,
                compactness_coefficient=compactness,
                elongation_coefficient=elongation,
                roundness_coefficient=roundness,
                average_distance_to_centers=avg_distance,
                perimeter=SpatialCalculator.calculate_perimeter(geometry),
            )
            db.add(assessment)

            results.append(
                {
                    "id": idx,
                    "compactness": compactness,
                    "elongation": elongation,
                    "roundness": roundness,
                    "avg_distance": avg_distance,
                }
            )

        db.commit()

        return {"results": results, "count": len(results)}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)


# ==================== GIS Layer Merger Endpoints ====================


@app.post("/api/gis/merge-layers")
async def merge_layers(
    files: List[UploadFile] = File(...),
    target_system: str = "EPSG:4328",
    db: Session = Depends(get_db),
):
    """
    Merge multiple GeoJSON layers into single file.

    Args:
        files: List of GeoJSON files
        target_system: Target coordinate system
        db: Database session

    Returns:
        Merged GeoJSON file
    """
    try:
        temp_dir = tempfile.mkdtemp()
        file_paths = []

        # Save uploaded files
        for file in files:
            file_path = os.path.join(temp_dir, file.filename)
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            file_paths.append(file_path)

        # Merge layers
        output_file = os.path.join(temp_dir, "merged.geojson")
        GeoJSONMerger.merge_layers(file_paths, output_file, target_system)

        return FileResponse(output_file, filename="merged.geojson")

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)


# ==================== Pricing Factors Endpoints ====================


@app.post("/api/pricing/calculate-factors")
async def calculate_pricing_factors(
    parcel_file: UploadFile = File(...),
    water_file: UploadFile = File(...),
    centers_file: UploadFile = File(...),
    density_file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Calculate pricing factors for land parcels.

    Args:
        parcel_file: GeoJSON file with land parcel
        water_file: GeoJSON file with water features
        centers_file: GeoJSON file with local centers
        density_file: GeoJSON file with population density
        db: Database session

    Returns:
        Pricing factors
    """
    try:
        temp_dir = tempfile.mkdtemp()

        # Save files
        files_map = {
            "parcel": parcel_file,
            "water": water_file,
            "centers": centers_file,
            "density": density_file,
        }

        file_paths = {}
        for name, file in files_map.items():
            file_path = os.path.join(temp_dir, f"{name}.geojson")
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            file_paths[name] = file_path

        # Read files
        parcel_gdf = FileProcessor.read_file(file_paths["parcel"])
        water_gdf = FileProcessor.read_file(file_paths["water"])
        centers_gdf = FileProcessor.read_file(file_paths["centers"])
        density_gdf = FileProcessor.read_file(file_paths["density"])

        if not all([parcel_gdf, water_gdf, centers_gdf, density_gdf]):
            raise ValueError("Failed to read files")

        # Calculate factors
        parcel_geom = parcel_gdf.iloc[0].geometry.__geo_interface__
        water_features = [
            row.geometry.__geo_interface__ for _, row in water_gdf.iterrows()
        ]
        center_features = [
            row.geometry.__geo_interface__ for _, row in centers_gdf.iterrows()
        ]
        density_features = [
            {
                "geometry": row.geometry.__geo_interface__,
                "properties": {"density": row.get("density", 0)},
            }
            for _, row in density_gdf.iterrows()
        ]

        # Calculate each factor
        water_proximity = PricingFactorCalculator.calculate_water_proximity(
            parcel_geom, water_features
        )
        center_distance = PricingFactorCalculator.calculate_local_center_distance(
            parcel_geom, center_features
        )
        population_density = PricingFactorCalculator.calculate_population_density(
            parcel_geom, density_features
        )

        # Calculate composite factor
        composite = PricingFactorCalculator.calculate_composite_factor(
            water_proximity, center_distance, population_density
        )

        return {
            "water_proximity": water_proximity,
            "center_distance": center_distance,
            "population_density": population_density,
            "composite_factor": composite,
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)


# ==================== Regression Model Endpoints ====================


@app.post("/api/regression/train")
async def train_regression_model(features_data: dict, db: Session = Depends(get_db)):
    """
    Train cadastral value regression model.

    Args:
        features_data: Training data with features and target values
        db: Database session

    Returns:
        Model metrics and formula
    """
    try:
        import numpy as np

        # Extract data
        X = np.array(features_data.get("features", []))
        y = np.array(features_data.get("targets", []))
        feature_names = features_data.get("feature_names", [])
        region = features_data.get("region", "Saint Petersburg")

        if X.size == 0 or y.size == 0:
            raise ValueError("Invalid training data")

        # Train model
        model = CadastralRegressionModel(region)
        metrics = model.train(X, y, feature_names)

        # Store model
        regression_model = RegressionModel(
            model_name=f"IZHS_Valuation_{region}",
            region=region,
            coefficients=model.coefficients,
            r_squared=model.r_squared,
            feature_names=feature_names,
            training_samples=len(X),
        )
        db.add(regression_model)
        db.commit()

        return {
            "formula": model.get_formula(),
            "metrics": metrics,
            "model_id": regression_model.id,
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/regression/predict")
async def predict_cadastral_value(
    model_id: int, features: dict, db: Session = Depends(get_db)
):
    """
    Predict cadastral value using trained model.

    Args:
        model_id: ID of trained model
        features: Feature values for prediction
        db: Database session

    Returns:
        Predicted cadastral value
    """
    try:
        # Get model from database
        db_model = (
            db.query(RegressionModel).filter(RegressionModel.id == model_id).first()
        )
        if not db_model:
            raise ValueError("Model not found")

        # Load model
        model = CadastralRegressionModel(db_model.region)
        model.load_model_data(
            {
                "region": db_model.region,
                "intercept": db_model.coefficients.get("intercept", 0),
                "coefficients": db_model.coefficients,
                "feature_names": db_model.feature_names,
                "r_squared": db_model.r_squared,
            }
        )

        # Predict
        prediction = model.predict_single(features)

        return {
            "predicted_value": prediction,
            "model_id": model_id,
            "region": db_model.region,
            "r_squared": db_model.r_squared,
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== Geometry Rendering Endpoints ====================


@app.post("/api/render/geometry")
async def render_geometry(
    file: UploadFile = File(...),
    stroke_color: str = "#000000",
    fill_color: str = "#CCCCCC",
    stroke_width: int = 2,
    db: Session = Depends(get_db),
):
    """
    Render GeoJSON geometry to PNG image.

    Args:
        file: GeoJSON file
        stroke_color: Line stroke color (hex)
        fill_color: Fill color (hex)
        stroke_width: Line width in pixels
        db: Database session

    Returns:
        Rendered PNG image
    """
    try:
        temp_dir = tempfile.mkdtemp()
        input_file = os.path.join(temp_dir, file.filename)
        output_file = os.path.join(temp_dir, "rendered.png")

        # Save uploaded file
        with open(input_file, "wb") as f:
            content = await file.read()
            f.write(content)

        # Render
        renderer = GeometryRenderer(
            stroke_color=stroke_color,
            fill_color=fill_color,
            stroke_width=stroke_width,
        )
        renderer.render_file(input_file, output_file)

        return FileResponse(output_file, filename="rendered.png")

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)


# ==================== Geocoding Endpoints ====================


@app.post("/api/geocoding/forward")
async def forward_geocoding(address: str, region: str = "Russia"):
    """
    Convert address to coordinates.

    Args:
        address: Street address
        region: Region/country

    Returns:
        Coordinates and address information
    """
    try:
        result = GeocodingService.geocode_address(address, region)
        if result:
            return result
        else:
            raise HTTPException(status_code=404, detail="Address not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/geocoding/reverse")
async def reverse_geocoding(latitude: float, longitude: float):
    """
    Convert coordinates to address.

    Args:
        latitude: Latitude
        longitude: Longitude

    Returns:
        Address information
    """
    try:
        result = GeocodingService.reverse_geocode(latitude, longitude)
        if result:
            return result
        else:
            raise HTTPException(status_code=404, detail="Address not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== CIAN Scraper Endpoints ====================


@app.post("/api/cian/scrape-apartments")
async def scrape_cian_apartments(
    max_pages: int = 5,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
):
    """
    Scrape one-room apartment data from CIAN.

    Args:
        max_pages: Maximum pages to scrape
        background_tasks: Background task handler
        db: Database session

    Returns:
        Scraping task ID
    """
    try:
        # Create processing task
        task = ProcessingTask(
            task_type="cian_scrape",
            status=ProcessingStatus.PENDING,
            input_data={"max_pages": max_pages},
        )
        db.add(task)
        db.commit()

        # Start scraping in background
        if background_tasks:
            background_tasks.add_task(scrape_cian_background, task.id, max_pages, db)

        return {"task_id": task.id, "status": "pending"}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


async def scrape_cian_background(task_id: int, max_pages: int, db: Session) -> None:
    """Background task for CIAN scraping."""
    try:
        task = db.query(ProcessingTask).filter(ProcessingTask.id == task_id).first()
        if not task:
            return

        task.status = ProcessingStatus.PROCESSING
        db.commit()

        # Scrape data
        url = CIANScraper.build_search_url(
            region="spb", property_type="apartment", rooms=1, max_area=30
        )
        listings = CIANScraper.scrape_listings(url, max_pages)

        # Store market data
        for listing in listings:
            market_data = MarketData(
                source="cian",
                property_type="apartment",
                region="Saint Petersburg",
                price=listing.get("price"),
                area=listing.get("area"),
                rooms=listing.get("rooms"),
                address=listing.get("address"),
                raw_data=listing,
            )
            db.add(market_data)

        db.commit()

        task.status = ProcessingStatus.COMPLETED
        task.output_data = {"listings_count": len(listings)}
        db.commit()

    except Exception as e:
        task = db.query(ProcessingTask).filter(ProcessingTask.id == task_id).first()
        if task:
            task.status = ProcessingStatus.FAILED
            task.error_message = str(e)
            db.commit()


# ==================== Health Check ====================


@app.get("/api/health")
async def health_check() -> dict:
    """Health check endpoint."""
    logger.debug("Health check requested")
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


# ==================== Root Endpoint ====================


@app.get("/")
async def root() -> dict:
    """Root endpoint with API information."""
    logger.debug("Root endpoint accessed")
    return {
        "name": "Gazprom Proekt Cadastral Service",
        "version": "1.0.0",
        "description": ("Comprehensive GIS and real estate data processing platform"),
        "documentation": "/docs",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
