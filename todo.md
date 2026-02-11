# Gazprom Proekt Cadastral Service - TODO

## Core Infrastructure
- [x] Database schema design and migration setup
- [x] FastAPI backend initialization with geospatial libraries
- [x] PostgreSQL connection and ORM setup
- [ ] File storage (S3) integration for GIS files and reports
- [ ] Authentication and authorization system

## Geospatial Modules
- [x] Coordinate Exporter (.dxf, .geojson, .tab reader with coordinate transformation)
- [x] Land Use Assessment (compactness, elongation, roundness calculations)
- [x] GIS Layer Merger (multi-layer aggregation with attribute handling)
- [x] Geometry Renderer (raster image generation from GeoJSON)

## Data Parsing & Integration
- [x] RGIS Parser (cadastral number lookup and data retrieval)
- [x] CIAN Scraper (one-room apartment market data collection)
- [x] Geocoding Services (direct and reverse geocoding)

## Analysis & Modeling
- [x] Automated Pricing Factors (water proximity, local centers, population density)
- [x] Cadastral Value Regression Model (linear regression with R² metrics)

## Telegram Bot
- [x] Telegram bot setup and command handlers
- [x] /start_parse command implementation
- [x] Cadastral number input and validation
- [x] GeoJSON file delivery to users

## Frontend & API
- [x] FastAPI endpoint design and implementation
- [x] React dashboard for GIS workflows
- [x] File upload interface for .dxf, .geojson, .tab files
- [x] Results visualization and export functionality
- [x] Telegram bot integration UI

## Testing & Documentation
- [x] Unit tests for geospatial modules
- [x] Integration tests for data pipelines
- [x] API endpoint tests
- [ ] Telegram bot tests
- [x] Comprehensive README with setup instructions
- [x] Code quality and linting setup

## Deployment
- [ ] Docker containerization
- [ ] Environment configuration
- [ ] Final testing and validation
- [ ] Deployment to production

## Interactive Map Visualization
- [x] Install Leaflet and mapping libraries
- [x] Create MapViewer component for geometry display
- [x] Implement GeoJSON layer rendering
- [x] Add map controls (zoom, pan, layer toggle)
- [x] Create spatial analysis overlay (buffers, intersections)
- [x] Add coordinate display and measurement tools
- [x] Integrate map with dashboard tabs
- [ ] Create map export functionality (PNG, SVG)

## Map Library Replacement
- [x] Replace Leaflet with OpenLayers or Mapbox GL JS
- [x] Update MapViewer component with new library
- [x] Update SpatialAnalysis component integration
- [x] Update unit tests for new library
- [x] Verify all map functionality works correctly

## Bug Fixes
- [x] Fix Mapbox access token error - replace with Yandex Maps
- [x] Implement Yandex Maps integration
- [x] Update MapViewer component with Yandex API
- [x] Test Yandex map functionality
