import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Download, Trash2, Plus, Minus, Eye, EyeOff } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface GeoJSONFeature {
  type: 'Feature';
  properties: Record<string, any>;
  geometry: any;
}

interface MapViewerProps {
  geojsonData?: GeoJSONFeature | GeoJSONFeature[];
  onFeatureSelect?: (feature: GeoJSONFeature) => void;
  onGeometryChange?: (geometry: any) => void;
}

// Set Mapbox token (using a public token for demo - replace with your own)
mapboxgl.accessToken = 'MAPBOX_TOKEN_REMOVED';

export default function MapViewer({ geojsonData, onFeatureSelect, onGeometryChange }: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<GeoJSONFeature | null>(null);
  const [measurement, setMeasurement] = useState<string>('');
  const [zoom, setZoom] = useState(13);
  const [center, setCenter] = useState<[number, number]>([30.3609, 59.9311]); // Saint Petersburg
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({
    geojson: true,
    drawing: true,
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom: zoom,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl());

    // Update zoom and center on map interaction
    map.current.on('zoomend', () => {
      setZoom(map.current?.getZoom() || 13);
    });

    map.current.on('moveend', () => {
      const center = map.current?.getCenter();
      if (center) {
        setCenter([center.lng, center.lat]);
      }
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Load GeoJSON data
  useEffect(() => {
    if (!map.current || !geojsonData) return;

    // Wait for map to load
    if (!map.current.isStyleLoaded()) {
      map.current.on('load', () => loadGeoJSON());
      return;
    }

    loadGeoJSON();

    function loadGeoJSON() {
      if (!map.current) return;

      // Remove existing source and layer if they exist
      if (map.current.getSource('geojson-source')) {
        map.current.removeLayer('geojson-layer');
        map.current.removeSource('geojson-source');
      }

      // Convert single feature to FeatureCollection
      const features = Array.isArray(geojsonData) ? geojsonData : [geojsonData];
      const featureCollection: any = {
        type: 'FeatureCollection',
        features: features,
      };

      // Add source
      map.current.addSource('geojson-source', {
        type: 'geojson',
        data: featureCollection as any,
      });

      // Add layer
      map.current.addLayer({
        id: 'geojson-layer',
        type: 'fill',
        source: 'geojson-source',
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.3,
          'fill-outline-color': '#3b82f6',
        },
      });

      // Add line layer for better visibility
      map.current.addLayer({
        id: 'geojson-line',
        type: 'line',
        source: 'geojson-source',
        paint: {
          'line-color': '#3b82f6',
          'line-width': 2,
        },
      });

      // Add click handler
      map.current.on('click', 'geojson-layer', (e: any) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          setSelectedFeature(feature as GeoJSONFeature);
          onFeatureSelect?.(feature as GeoJSONFeature);

          // Show popup
          const coordinates = e.lngLat;
          const properties = feature.properties || {};
          const popupContent = `
            <div style="font-size: 12px;">
              ${Object.entries(properties)
                .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
                .join('')}
            </div>
          `;

          new mapboxgl.Popup().setLngLat(coordinates).setHTML(popupContent).addTo(map.current!);
        }
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'geojson-layer', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer';
        }
      });

      map.current.on('mouseleave', 'geojson-layer', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = '';
        }
      });

      // Fit bounds to GeoJSON
      const bounds = new mapboxgl.LngLatBounds();
      featureCollection.features.forEach((feature: any) => {
        if (feature.geometry.type === 'Point') {
          const coords = feature.geometry.coordinates as [number, number];
          bounds.extend(coords);
        } else if (feature.geometry.type === 'Polygon') {
          feature.geometry.coordinates[0].forEach((coord: number[]) => {
            bounds.extend(coord as [number, number]);
          });
        }
      });

      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, { padding: 50 });
      }
    }
  }, [geojsonData, onFeatureSelect]);

  // Measurement tool
  const handleMeasure = () => {
    if (!selectedFeature) return;

    const geometry = selectedFeature.geometry as any;

    if (geometry.type === 'Polygon') {
      const area = calculatePolygonArea(geometry.coordinates[0]);
      const perimeter = calculatePolygonPerimeter(geometry.coordinates[0]);
      setMeasurement(`Area: ${area.toFixed(2)} m² | Perimeter: ${perimeter.toFixed(2)} m`);
    } else if (geometry.type === 'LineString') {
      const distance = calculateLineDistance(geometry.coordinates);
      setMeasurement(`Distance: ${distance.toFixed(2)} m`);
    } else if (geometry.type === 'Point') {
      setMeasurement(`Point: [${geometry.coordinates[1]}, ${geometry.coordinates[0]}]`);
    }
  };

  // Calculate polygon area using Shoelace formula
  const calculatePolygonArea = (coords: any[]): number => {
    let area = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      const [lon1, lat1] = coords[i];
      const [lon2, lat2] = coords[i + 1];
      area += (lon2 - lon1) * (lat2 + lat1);
    }
    area = Math.abs(area) / 2;

    const latRad = (coords[0][1] * Math.PI) / 180;
    const metersPerDegree = 111320 * Math.cos(latRad);
    return area * metersPerDegree * metersPerDegree;
  };

  // Calculate polygon perimeter
  const calculatePolygonPerimeter = (coords: any[]): number => {
    let perimeter = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      const [lon1, lat1] = coords[i];
      const [lon2, lat2] = coords[i + 1];
      const distance = calculateHaversineDistance(lat1, lon1, lat2, lon2);
      perimeter += distance;
    }
    return perimeter;
  };

  // Calculate line distance
  const calculateLineDistance = (coords: any[]): number => {
    let distance = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      const [lon1, lat1] = coords[i];
      const [lon2, lat2] = coords[i + 1];
      distance += calculateHaversineDistance(lat1, lon1, lat2, lon2);
    }
    return distance;
  };

  // Haversine formula for distance calculation
  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Clear all drawings
  const handleClearDrawings = () => {
    setMeasurement('');
    setSelectedFeature(null);
  };

  // Toggle layer visibility
  const toggleLayerVisibility = (layer: string) => {
    setLayerVisibility(prev => {
      const newVisibility = {
        ...prev,
        [layer]: !prev[layer],
      };

      if (layer === 'geojson' && map.current) {
        const visibility = newVisibility.geojson ? 'visible' : 'none';
        if (map.current.getLayer('geojson-layer')) {
          map.current.setLayoutProperty('geojson-layer', 'visibility', visibility);
        }
        if (map.current.getLayer('geojson-line')) {
          map.current.setLayoutProperty('geojson-line', 'visibility', visibility);
        }
      }

      return newVisibility;
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Interactive Map Viewer
        </CardTitle>
        <CardDescription>
          Visualize geometries, measure distances, and perform spatial analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map Container */}
        <div className="space-y-2">
          <div
            ref={mapContainer}
            className="w-full h-96 rounded-lg border border-slate-200 bg-slate-50"
          />
        </div>

        {/* Map Controls */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (map.current) {
                map.current.zoomIn();
              }
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Zoom In
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (map.current) {
                map.current.zoomOut();
              }
            }}
            className="flex items-center gap-2"
          >
            <Minus className="w-4 h-4" />
            Zoom Out
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleLayerVisibility('geojson')}
            className="flex items-center gap-2"
          >
            {layerVisibility.geojson ? (
              <>
                <Eye className="w-4 h-4" />
                Hide GeoJSON
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                Show GeoJSON
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleClearDrawings}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </Button>
        </div>

        {/* Measurement Section */}
        <div className="bg-slate-50 p-4 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-900">Spatial Analysis</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMeasure}
              disabled={!selectedFeature}
            >
              Measure
            </Button>
          </div>

          {selectedFeature && (
            <div className="space-y-2">
              <div className="text-sm text-slate-600">
                <p className="font-medium">Selected Feature:</p>
                <p className="text-xs">Type: {(selectedFeature.geometry as any).type}</p>
                {selectedFeature.properties && (
                  <div className="mt-2 space-y-1">
                    {Object.entries(selectedFeature.properties).map(([key, value]) => (
                      <p key={key} className="text-xs">
                        <strong>{key}:</strong> {String(value)}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {measurement && (
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <p className="text-sm font-medium text-blue-900">{measurement}</p>
            </div>
          )}
        </div>

        {/* Coordinate Display */}
        <div className="bg-slate-50 p-4 rounded-lg">
          <p className="text-sm text-slate-600">
            <strong>Map Center:</strong> {center[0].toFixed(4)}, {center[1].toFixed(4)}
          </p>
          <p className="text-sm text-slate-600">
            <strong>Zoom Level:</strong> {zoom}
          </p>
        </div>

        {/* Export Options */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert('Map export feature requires additional library installation')}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export as PNG
          </Button>
        </div>

        {/* Information */}
        <div className="bg-blue-50 p-4 rounded-lg space-y-2">
          <p className="text-sm font-medium text-blue-900">Map Features:</p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click on features to select and view properties</li>
            <li>• Use Measure button to calculate area/distance</li>
            <li>• Zoom and pan to explore geometries</li>
            <li>• Toggle layer visibility for better visualization</li>
            <li>• Powered by Mapbox GL JS (US-based technology)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
