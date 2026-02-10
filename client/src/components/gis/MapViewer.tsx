import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Download, Trash2, Plus, Minus, Eye, EyeOff } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

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

export default function MapViewer({ geojsonData, onFeatureSelect, onGeometryChange }: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const geoJsonLayer = useRef<L.GeoJSON | null>(null);
  const featureGroup = useRef<L.FeatureGroup | null>(null);

  const [zoom, setZoom] = useState(13);
  const [center, setCenter] = useState<[number, number]>([59.9311, 30.3609]); // Saint Petersburg
  const [selectedFeature, setSelectedFeature] = useState<GeoJSONFeature | null>(null);
  const [showMeasurement, setShowMeasurement] = useState(false);
  const [measurement, setMeasurement] = useState<string>('');
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({
    geojson: true,
    drawing: true,
    grid: false,
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    // Create map
    map.current = L.map(mapContainer.current).setView(center, zoom);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.current);

    // Create feature group for drawing
    featureGroup.current = L.featureGroup().addTo(map.current);

    // Update zoom and center on map interaction
    map.current.on('zoomend', () => {
      setZoom(map.current?.getZoom() || 13);
    });

    map.current.on('moveend', () => {
      const center = map.current?.getCenter();
      if (center) {
        setCenter([center.lat, center.lng]);
      }
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Load GeoJSON data
  useEffect(() => {
    if (!map.current || !geojsonData) return;

    // Remove existing GeoJSON layer
    if (geoJsonLayer.current) {
      map.current.removeLayer(geoJsonLayer.current);
    }

    // Convert single feature to FeatureCollection
    const featureCollection = Array.isArray(geojsonData)
      ? {
          type: 'FeatureCollection' as const,
          features: geojsonData,
        }
      : {
          type: 'FeatureCollection' as const,
          features: [geojsonData],
        };

    // Create GeoJSON layer
    geoJsonLayer.current = L.geoJSON(featureCollection, {
      style: {
        color: '#3b82f6',
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.3,
      },
      onEachFeature: (feature: any, layer: any) => {
        // Add click handler
        layer.on('click', () => {
          setSelectedFeature(feature as GeoJSONFeature);
          onFeatureSelect?.(feature as GeoJSONFeature);
        });

        // Add popup
        const props = feature.properties || {};
        const popupContent = `
          <div style="font-size: 12px;">
            ${Object.entries(props)
              .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
              .join('')}
          </div>
        `;
        layer.bindPopup(popupContent);
      },
    }).addTo(map.current);

    // Fit bounds to GeoJSON
    const bounds = geoJsonLayer.current.getBounds();
    if (bounds.isValid()) {
      map.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [geojsonData, onFeatureSelect]);

  // Handle drawing
  const handleDrawCreated = (e: any) => {
    const layer = e.layer;
    try {
      const geojson = layer.toGeoJSON();
      onGeometryChange?.(geojson.geometry);
    } catch (error) {
      console.error('Error converting layer to GeoJSON:', error);
    }
  };

  const handleDrawEdited = (e: any) => {
    try {
      e.layers.eachLayer((layer: any) => {
        const geojson = layer.toGeoJSON();
        onGeometryChange?.(geojson.geometry);
      });
    } catch (error) {
      console.error('Error converting layers to GeoJSON:', error);
    }
  };

  // Measurement tool
  const handleMeasure = () => {
    if (!map.current || !selectedFeature) return;

    const geometry = selectedFeature.geometry as any;

    if (geometry.type === 'Polygon') {
      // Calculate area
      const coords = geometry.coordinates[0];
      const area = calculatePolygonArea(coords);
      const perimeter = calculatePolygonPerimeter(coords);
      setMeasurement(`Area: ${area.toFixed(2)} m² | Perimeter: ${perimeter.toFixed(2)} m`);
    } else if (geometry.type === 'LineString') {
      // Calculate distance
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

    // Convert to approximate square meters (rough conversion)
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
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Export map as PNG
  const handleExportMap = async () => {
    // This would require a library like leaflet-image
    alert('Map export feature requires additional library installation');
  };

  // Clear all drawings
  const handleClearDrawings = () => {
    if (featureGroup.current) {
      featureGroup.current.clearLayers();
      setMeasurement('');
    }
  };

  // Toggle layer visibility
  const toggleLayerVisibility = (layer: string) => {
    setLayerVisibility(prev => {
      const newVisibility = {
        ...prev,
        [layer]: !prev[layer],
      };

      if (layer === 'geojson' && geoJsonLayer.current) {
        if (prev.geojson) {
          map.current?.removeLayer(geoJsonLayer.current);
        } else {
          geoJsonLayer.current.addTo(map.current!);
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
                map.current.setZoom(map.current.getZoom() + 1);
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
                map.current.setZoom(map.current.getZoom() - 1);
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
            onClick={handleExportMap}
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
            <li>• Draw custom geometries for spatial analysis</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
