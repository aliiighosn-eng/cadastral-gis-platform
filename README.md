# Gazprom Proekt Cadastral Service

A comprehensive GIS and real estate data processing platform for automating cadastral data workflows, performing spatial analysis, and delivering market insights for land valuation.

## Overview

The Gazprom Proekt Cadastral Service is an integrated ecosystem combining a FastAPI backend with advanced geospatial processing capabilities and a modern React frontend. It automates various cadastral and GIS workflows including coordinate transformations, land assessments, data parsing, pricing factor calculations, and cadastral value predictions.

## Key Features

### Geospatial Processing

- **Coordinate Exporter**: Read .dxf, .geojson, and .tab files and export transformed coordinates (MSK-64, EPSG:3857, EPSG:4328) to Excel with ID, kadNum, GeometryType, x, y, System columns.

- **Land Use Assessment**: Calculate compactness, elongation, and roundness coefficients for land plots using provided geometric formulas.

- **GIS Layer Merger**: Aggregate multiple .geojson polygon layers into a single file while handling inconsistent attributes by assigning None to missing values.

- **Geometry Renderer**: Render geometric objects from .geojson files to raster PNG images with customizable colors and line thickness.

### Data Integration

- **RGIS Parser**: Automate data retrieval from the Regional Geographic Information System using cadastral numbers to extract property information with geometry.

- **CIAN Scraper**: Collect market data for one-room apartments in Saint Petersburg from the CIAN real estate portal.

- **Geocoding Services**: Implement direct and reverse geocoding to convert addresses to coordinates and vice versa.

### Analysis & Valuation

- **Automated Pricing Factors**: Assign proximity factors (water bodies, local centers, population density) to land parcels using buffer zone analysis and weighted area calculations.

- **Cadastral Value Regression Model**: Build linear regression models to calculate cadastral value of IZHS lands with formula output and R² quality metrics.

### User Interface

- **Telegram Bot**: Create a bot interface with /start_parse command that allows users to enter a cadastral number and receive a .geojson file with property data.

- **React Dashboard**: Modern web interface for all GIS workflows with file upload, parameter configuration, and results visualization.

## Technology Stack

### Backend

- **FastAPI**: High-performance Python web framework for building APIs
- **SQLAlchemy**: Object-relational mapping for database management
- **GeoPandas**: Geospatial data manipulation and analysis
- **Shapely**: Geometric operations and spatial analysis
- **Scikit-learn**: Machine learning for regression modeling
- **Rasterio**: Raster data processing
- **PyProj**: Coordinate system transformations
- **Beautiful Soup**: Web scraping for CIAN data
- **Python Telegram Bot**: Telegram bot integration

### Frontend

- **React 19**: Modern UI framework
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS 4**: Utility-first CSS framework
- **shadcn/ui**: High-quality React components
- **Vite**: Fast build tool and dev server

### Database

- **PostgreSQL**: Primary database (production)
- **SQLite**: Development database (default)

## Installation

### Prerequisites

- Python 3.11+
- Node.js 22+
- PostgreSQL 12+ (for production)
- Git

### Backend Setup

```bash
# Navigate to project directory
cd /home/ubuntu/gazprom_proekt_service

# Install Python dependencies
sudo pip3 install fastapi uvicorn sqlalchemy psycopg2-binary geopandas shapely fiona rasterio pyproj openpyxl pandas numpy scikit-learn requests beautifulsoup4 lxml python-telegram-bot aiohttp python-multipart

# Set up environment variables
export DATABASE_URL="sqlite:///./gazprom_proekt.db"
export TELEGRAM_BOT_TOKEN="your_bot_token_here"

# Initialize database
python3 -c "from server.database import init_db; init_db()"

# Start FastAPI server
python3 -m uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
# Install Node dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## API Endpoints

### Coordinate Export

**POST** `/api/export/coordinates`

Export coordinates from GIS files to Excel format.

**Parameters:**
- `file`: GIS file (.dxf, .geojson, .tab)
- `target_system`: Target coordinate system (MSK-64, EPSG:3857, EPSG:4328)

**Response:** Excel file with transformed coordinates

### Land Assessment

**POST** `/api/assessment/land-use`

Calculate land use assessment metrics.

**Parameters:**
- `parcels_file`: GeoJSON file with land parcels
- `centers_file`: GeoJSON file with land centers

**Response:**
```json
{
  "results": [
    {
      "id": 0,
      "compactness": 1.234,
      "elongation": 0.567,
      "roundness": 0.890,
      "avg_distance": 1500.5
    }
  ],
  "count": 1
}
```

### GIS Layer Merger

**POST** `/api/gis/merge-layers`

Merge multiple GeoJSON layers.

**Parameters:**
- `files`: List of GeoJSON files
- `target_system`: Target coordinate system

**Response:** Merged GeoJSON FeatureCollection

### Pricing Factors

**POST** `/api/pricing/calculate-factors`

Calculate pricing factors for land parcels.

**Parameters:**
- `parcel_file`: GeoJSON file with land parcel
- `water_file`: GeoJSON file with water features
- `centers_file`: GeoJSON file with local centers
- `density_file`: GeoJSON file with population density

**Response:**
```json
{
  "water_proximity": 50.0,
  "center_distance": 1200.5,
  "population_density": 450.0,
  "composite_factor": 0.75
}
```

### Regression Model Training

**POST** `/api/regression/train`

Train cadastral value regression model.

**Parameters:**
```json
{
  "features": [[1, 2, 3], [4, 5, 6]],
  "targets": [100000, 150000],
  "feature_names": ["area", "distance", "density"],
  "region": "Saint Petersburg"
}
```

**Response:**
```json
{
  "formula": "y = 50000.0 + 1000.0*area + 50.0*distance - 100.0*density",
  "metrics": {
    "r_squared": 0.85,
    "rmse": 5000.0,
    "mae": 3500.0,
    "samples": 100,
    "features": 3
  },
  "model_id": 1
}
```

### Prediction

**POST** `/api/regression/predict`

Predict cadastral value using trained model.

**Parameters:**
```json
{
  "model_id": 1,
  "features": {
    "area": 1500,
    "distance": 800,
    "density": 500
  }
}
```

**Response:**
```json
{
  "predicted_value": 2150000.0,
  "model_id": 1,
  "region": "Saint Petersburg",
  "r_squared": 0.85
}
```

### Geometry Rendering

**POST** `/api/render/geometry`

Render GeoJSON to PNG image.

**Parameters:**
- `file`: GeoJSON file
- `stroke_color`: Line stroke color (hex, e.g., #000000)
- `fill_color`: Fill color (hex, e.g., #CCCCCC)
- `stroke_width`: Line width in pixels

**Response:** PNG image file

### Geocoding

**POST** `/api/geocoding/forward`

Convert address to coordinates.

**Parameters:**
- `address`: Street address
- `region`: Region/country (default: Russia)

**Response:**
```json
{
  "address": "24-я линия В.О., 21, Санкт-Петербург",
  "latitude": 59.9361224,
  "longitude": 30.2578708,
  "raw": {}
}
```

**POST** `/api/geocoding/reverse`

Convert coordinates to address.

**Parameters:**
- `latitude`: Latitude
- `longitude`: Longitude

**Response:**
```json
{
  "address": "24-я линия В.О., 21, Санкт-Петербург",
  "latitude": 59.9361224,
  "longitude": 30.2578708,
  "raw": {}
}
```

### CIAN Scraper

**POST** `/api/cian/scrape-apartments`

Scrape one-room apartment data from CIAN.

**Parameters:**
- `max_pages`: Maximum pages to scrape (default: 5)

**Response:**
```json
{
  "task_id": 1,
  "status": "pending"
}
```

### Health Check

**GET** `/api/health`

Check API health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-10T10:48:56.202Z"
}
```

## Database Schema

### Core Tables

- **cadastral_parcels**: Stores cadastral land parcel information
- **land_assessments**: Stores calculated assessment metrics
- **pricing_factors**: Stores pricing factor values
- **cadastral_valuations**: Stores valuation results
- **gis_files**: Metadata for uploaded GIS files
- **processing_tasks**: Tracks long-running tasks
- **regression_models**: Stores trained regression models
- **market_data**: Stores market data from CIAN and RGIS
- **telegram_users**: Stores Telegram bot user information
- **rendered_images**: Metadata for rendered images

## Telegram Bot Usage

### Commands

- `/start` - Start bot and show welcome message
- `/start_parse` - Begin cadastral number search
- `/help` - Show available commands
- `/cancel` - Cancel current operation

### Workflow

1. User sends `/start_parse`
2. Bot presents property type options (Land Plot, Building, Room)
3. User selects property type
4. Bot requests cadastral number input
5. User enters cadastral number (e.g., 78:06:0002108)
6. Bot fetches property data from RGIS
7. Bot sends GeoJSON file with property information

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost/gazprom_proekt

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Server
PORT=8000
DEBUG=False

# RGIS API (if using external service)
RGIS_API_URL=https://rgis.spb.ru/api
RGIS_API_KEY=your_api_key

# CIAN Scraper
CIAN_MAX_PAGES=5
CIAN_REQUEST_DELAY=2
```

## File Formats

### Supported Input Formats

- **.dxf** - AutoCAD Drawing Format
- **.geojson** - GeoJSON Format (RFC 7946)
- **.tab** - MapInfo TAB Format
- **.shp** - Shapefile Format

### Output Formats

- **.xlsx** - Excel Spreadsheet (coordinate export)
- **.geojson** - GeoJSON FeatureCollection (merged layers)
- **.png** - Raster Image (rendered geometries)
- **.json** - JSON (API responses)

## Coordinate Systems

### Supported Systems

- **MSK-64** - Moscow Zone 1 (EPSG:28465)
- **EPSG:3857** - Web Mercator Projection
- **EPSG:4326** - WGS84 Geographic Coordinates (note: EPSG:4328 in requirements refers to this)

## Mathematical Formulas

### Land Assessment Metrics

**Compactness Coefficient:**
```
k_comp = П / (4 * sqrt(P))
where П = perimeter, P = area
```

**Elongation Coefficient:**
```
k_dal = s / (1.7 * sqrt(P))
where s = max distance between parcels, P = area
```

**Roundness Coefficient:**
```
k_okr = (2 * d) / sqrt(2 * P)
where d = max distance from center to boundary, P = area
```

**Development Coefficient:**
```
k_o = (P_ag * 100) / P
where P_ag = agricultural area, P = total area
```

### Pricing Factors

**Water Proximity:** Buffer zones (10m, 50m, 150m) - returns smallest distance with intersection

**Local Center Distance:** Minimum distance from parcel centroid to nearest center

**Population Density:** Weighted average by intersection area

**Composite Factor:** Weighted combination of all factors (0-1 scale)

## Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test server/gis_utils.test.ts

# Run with coverage
pnpm test --coverage
```

### Integration Tests

```bash
# Test API endpoints
curl -X POST http://localhost:8000/api/health
```

## Performance Considerations

- Large GIS files (>100MB) may require increased memory allocation
- CIAN scraping is rate-limited to prevent IP blocking
- Regression model training performance depends on sample size
- Coordinate transformations are cached for frequently used systems

## Troubleshooting

### Common Issues

**Database Connection Error**
```
Solution: Ensure DATABASE_URL is set correctly and PostgreSQL is running
```

**Geospatial Library Import Error**
```
Solution: Install GDAL system library: sudo apt-get install gdal-bin libgdal-dev
```

**Telegram Bot Not Responding**
```
Solution: Verify TELEGRAM_BOT_TOKEN is correct and bot is running
```

**Slow File Processing**
```
Solution: Increase memory allocation or process files in smaller batches
```

## Development

### Project Structure

```
gazprom_proekt_service/
├── server/
│   ├── main.py              # FastAPI application
│   ├── models.py            # Database models
│   ├── database.py          # Database connection
│   ├── gis_utils.py         # Geospatial utilities
│   ├── file_processor.py    # File I/O operations
│   ├── pricing_calculator.py # Pricing factor calculations
│   ├── regression_model.py  # Regression modeling
│   ├── data_parsers.py      # RGIS, CIAN, Geocoding
│   ├── geometry_renderer.py # Image rendering
│   └── telegram_bot.py      # Telegram bot interface
├── client/
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable components
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   └── index.html           # HTML template
├── drizzle/                 # Database migrations
├── package.json             # Node dependencies
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── README.md                # This file
```

### Code Quality

- **Linting**: ESLint for TypeScript/React
- **Formatting**: Prettier for code style
- **Type Checking**: TypeScript strict mode
- **Testing**: Vitest for unit tests

```bash
# Format code
pnpm format

# Check types
pnpm check

# Run linter
pnpm lint
```

## Deployment

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY server/ server/
COPY client/dist/ client/dist/

CMD ["uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Production Setup

1. Use PostgreSQL instead of SQLite
2. Set up environment variables for production
3. Use a production ASGI server (Gunicorn with Uvicorn workers)
4. Configure CORS for frontend domain
5. Set up SSL/TLS certificates
6. Configure rate limiting and authentication

## Contributing

When contributing to this project:

1. Follow PEP 8 for Python code
2. Use TypeScript for all React components
3. Write unit tests for new features
4. Update documentation
5. Ensure all tests pass before submitting PR

## License

This project is proprietary software for Gazprom Proekt.

## Support

For issues, questions, or feature requests, please contact the development team.

## Changelog

### Version 1.0.0 (2026-02-10)

- Initial release with all core features
- Coordinate export functionality
- Land assessment calculations
- GIS layer merging
- Pricing factor calculations
- Regression modeling
- Telegram bot interface
- React dashboard
- Comprehensive API documentation

---

**Last Updated:** 2026-02-10
**Status:** Production Ready
