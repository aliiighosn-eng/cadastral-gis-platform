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

## Existing Geospatial Services (10 Total - Already Implemented)
- [x] Service 1: Coordinate Exporter - Transform and export coordinates (MSK-64, EPSG:3857, EPSG:4326)
- [x] Service 2: Land Use Assessment - Calculate compactness, elongation, roundness coefficients
- [x] Service 3: GIS Layer Merger - Merge multiple GeoJSON layers with attribute harmonization
- [x] Service 4: Geometry Renderer - Render GeoJSON to PNG/SVG images
- [x] Service 5: RGIS Parser - Retrieve cadastral data from Regional GIS
- [x] Service 6: CIAN Scraper - Collect real estate market data
- [x] Service 7: Geocoding Service - Forward and reverse geocoding
- [x] Service 8: Pricing Factor Calculator - Water proximity, center distance, population density
- [x] Service 9: Cadastral Regression Model - Linear regression for property valuation
- [x] Service 10: Telegram Bot Interface - Interactive bot for cadastral queries

## New Cadastral-Specific Services (15 Total - Partially Implemented)
- [x] Service 11: Cadastral Number Lookup - Search and validate cadastral numbers with format verification
- [x] Service 12: Cadastral Object Classification - Classify cadastral objects by type (land plot, building, room)
- [x] Service 13: Cadastral Value Assessment - Calculate cadastral value for IZHS properties
- [ ] Service 14: Land Rights Verification - Verify land rights, ownership status, and encumbrances
- [ ] Service 15: Cadastral Plan Generation - Generate cadastral plans with measurements in PDF/DWG format
- [ ] Service 16: Boundary Dispute Analysis - Analyze boundary conflicts and overlapping cadastral objects
- [ ] Service 17: Cadastral Extract Generation - Create official cadastral extracts for properties
- [ ] Service 18: Land Use Compliance Check - Verify land use compliance with zoning regulations
- [ ] Service 19: Cadastral History Tracking - Track historical changes in cadastral data and ownership
- [x] Service 20: Tax Assessment Calculator - Calculate property taxes based on cadastral value
- [ ] Service 21: Cadastral Data Export - Export cadastral data to DXF, SHP, GeoJSON, Excel formats
- [ ] Service 22: RGIS Integration & Data Sync - Real-time synchronization with Regional GIS
- [ ] Service 23: Cadastral Disputes Resolution - Manage and track cadastral disputes with documentation
- [x] Service 24: Cadastral Statistics & Analytics - Generate statistical reports on cadastral data
- [ ] Service 25: Cadastral API & Webhook Integration - REST API and webhooks for third-party integration

## Dashboard Components Implementation
- [x] Create CadastralNumberLookup component
- [x] Create ObjectClassification component
- [x] Create ValueAssessment component
- [ ] Create RightsVerification component
- [ ] Create PlanGeneration component
- [ ] Create BoundaryAnalysis component
- [ ] Create ExtractGeneration component
- [ ] Create ComplianceCheck component
- [ ] Create HistoryTracking component
- [x] Create TaxCalculator component
- [ ] Create DataExport component
- [ ] Create RGISSync component
- [ ] Create DisputesResolution component
- [x] Create StatisticsAnalytics component
- [ ] Create APIWebhooks component
- [x] Update Dashboard.tsx to include all 25 services
- [x] Create service navigation menu
- [x] Add service descriptions and documentation
