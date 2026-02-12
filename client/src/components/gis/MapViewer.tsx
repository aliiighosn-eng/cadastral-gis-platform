import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Trash2, Eye, EyeOff } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';

interface GeoJSONFeature {
  type: 'Feature';
  properties: Record<string, any>;
  geometry: any;
}

interface MapViewerProps {
  geojsonData?: GeoJSONFeature | GeoJSONFeature[];
  onFeatureSelect?: (feature: GeoJSONFeature) => void;
}

export default function MapViewer({ geojsonData, onFeatureSelect }: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<GeoJSONFeature | null>(null);
  const [measurement, setMeasurement] = useState<string>('');
  const [coordinates, setCoordinates] = useState('');
  const [mapStyle, setMapStyle] = useState<'osm' | 'satellite' | 'terrain'>('osm');
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({
    geojson: true,
  });

  // Get OpenMapTiles style URL based on selected style
  const getStyleUrl = () => {
    switch (mapStyle) {
      case 'satellite':
        return 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';
      case 'terrain':
        return 'https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json';
      case 'osm':
      default:
        return 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: getStyleUrl(),
      center: [30.3609, 59.9311], // Saint Petersburg
      zoom: 12,
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Handle map click for coordinates
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      setCoordinates(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    });

    // Add GeoJSON source
    if (geojsonData) {
      const features = Array.isArray(geojsonData) ? geojsonData : [geojsonData];
      map.current.on('load', () => {
        if (!map.current) return;

        map.current.addSource('geojson-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: features,
          },
        });

        // Add layers for different geometry types
        map.current.addLayer({
          id: 'geojson-points',
          type: 'circle',
          source: 'geojson-source',
          filter: ['==', '$type', 'Point'],
          paint: {
            'circle-radius': 6,
            'circle-color': '#3b82f6',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#1e40af',
          },
        });

        map.current.addLayer({
          id: 'geojson-lines',
          type: 'line',
          source: 'geojson-source',
          filter: ['==', '$type', 'LineString'],
          paint: {
            'line-color': '#3b82f6',
            'line-width': 2,
          },
        });

        map.current.addLayer({
          id: 'geojson-polygons',
          type: 'fill',
          source: 'geojson-source',
          filter: ['==', '$type', 'Polygon'],
          paint: {
            'fill-color': '#10b981',
            'fill-opacity': 0.5,
          },
        });

        map.current.addLayer({
          id: 'geojson-polygons-outline',
          type: 'line',
          source: 'geojson-source',
          filter: ['==', '$type', 'Polygon'],
          paint: {
            'line-color': '#059669',
            'line-width': 2,
          },
        });

        // Add click handlers for features
        ['geojson-points', 'geojson-lines', 'geojson-polygons'].forEach((layerId) => {
          map.current?.on('click', layerId, (e) => {
            if (e.features && e.features[0]) {
              const feature = e.features[0];
              const geoJsonFeature: GeoJSONFeature = {
                type: 'Feature',
                properties: feature.properties || {},
                geometry: feature.geometry,
              };
              setSelectedFeature(geoJsonFeature);
              onFeatureSelect?.(geoJsonFeature);

              // Show popup
              new maplibregl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(
                  `<div class="text-sm"><strong>${feature.properties?.name || 'Feature'}</strong></div>`
                )
                .addTo(map.current!);
            }
          });
        });
      });
    }

    return () => {
      // Cleanup is handled by MapLibre
    };
  }, [geojsonData, onFeatureSelect]);

  // Update map style
  useEffect(() => {
    if (!map.current) return;
    map.current.setStyle(getStyleUrl());
  }, [mapStyle]);

  // Toggle layer visibility
  useEffect(() => {
    if (!map.current) return;
    const visibility = layerVisibility.geojson ? 'visible' : 'none';
    ['geojson-points', 'geojson-lines', 'geojson-polygons', 'geojson-polygons-outline'].forEach(
      (layerId) => {
        try {
          map.current?.setLayoutProperty(layerId, 'visibility', visibility);
        } catch (e) {
          // Layer might not exist yet
        }
      }
    );
  }, [layerVisibility]);

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

  const handleMeasure = () => {
    if (!selectedFeature) return;

    const geometry = selectedFeature.geometry as any;

    if (geometry.type === 'Polygon') {
      const area = calculatePolygonArea(geometry.coordinates[0]);
      let perimeter = 0;
      const coords = geometry.coordinates[0];
      for (let i = 0; i < coords.length - 1; i++) {
        const [lon1, lat1] = coords[i];
        const [lon2, lat2] = coords[i + 1];
        perimeter += calculateHaversineDistance(lat1, lon1, lat2, lon2);
      }
      setMeasurement(`Area: ${area.toFixed(2)} m² | Perimeter: ${perimeter.toFixed(2)} m`);
    } else if (geometry.type === 'LineString') {
      let distance = 0;
      const coords = geometry.coordinates;
      for (let i = 0; i < coords.length - 1; i++) {
        const [lon1, lat1] = coords[i];
        const [lon2, lat2] = coords[i + 1];
        distance += calculateHaversineDistance(lat1, lon1, lat2, lon2);
      }
      setMeasurement(`Distance: ${distance.toFixed(2)} m`);
    } else if (geometry.type === 'Point') {
      setMeasurement(`Point: [${geometry.coordinates[1]}, ${geometry.coordinates[0]}]`);
    }
  };

  const handleClearDrawings = () => {
    setMeasurement('');
    setSelectedFeature(null);
    setCoordinates('');
  };

  const toggleLayerVisibility = (layer: string) => {
    setLayerVisibility(prev => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Interactive Map Viewer
        </CardTitle>
        <CardDescription>
          Visualize geometries with OpenMapTiles and MapLibre GL JS
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Map Style</label>
            <Select value={mapStyle} onValueChange={(v: any) => setMapStyle(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="osm">OpenStreetMap</SelectItem>
                <SelectItem value="satellite">Satellite</SelectItem>
                <SelectItem value="terrain">Terrain</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Coordinates</label>
            <Input
              readOnly
              value={coordinates}
              placeholder="Click on map"
              className="text-xs"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Actions</label>
            <Button onClick={handleClearDrawings} size="sm" variant="outline" className="w-full">
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden" style={{ height: '500px' }}>
          <div ref={mapContainer} style={{ height: '100%', width: '100%' }} />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleLayerVisibility('geojson')}
            className="flex items-center gap-2"
          >
            {layerVisibility.geojson ? (
              <>
                <Eye className="w-4 h-4" />
                Hide
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                Show
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleMeasure}
            disabled={!selectedFeature}
          >
            Measure
          </Button>

          <Button variant="outline" size="sm" onClick={handleClearDrawings}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {selectedFeature && (
          <div className="bg-slate-50 p-4 rounded-lg space-y-2">
            <p className="font-medium text-slate-900">Selected Feature</p>
            <p className="text-sm text-slate-600">Type: {(selectedFeature.geometry as any).type}</p>
            {selectedFeature.properties && (
              <div className="space-y-1">
                {Object.entries(selectedFeature.properties).map(([key, value]) => (
                  <p key={key} className="text-xs text-slate-600">
                    <strong>{key}:</strong> {String(value)}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {measurement && (
          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <p className="text-sm font-medium text-blue-900">{measurement}</p>
          </div>
        )}

        <div className="text-xs text-slate-500 space-y-1">
          <p>• Click on map to get coordinates</p>
          <p>• Click on features to view properties</p>
          <p>• Use Measure button for area/distance</p>
          <p>• Powered by OpenMapTiles and MapLibre GL JS</p>
        </div>
      </CardContent>
    </Card>
  );
}
