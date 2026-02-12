import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Trash2, Eye, EyeOff } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface GeoJSONFeature {
  type: 'Feature';
  properties: Record<string, any>;
  geometry: any;
}

interface MapViewerProps {
  geojsonData?: GeoJSONFeature | GeoJSONFeature[];
  onFeatureSelect?: (feature: GeoJSONFeature) => void;
}

function MapController({ onCoordinatesChange }: { onCoordinatesChange: (coords: string) => void }) {
  const map = useMap();

  useEffect(() => {
    const handleClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      onCoordinatesChange(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onCoordinatesChange]);

  return null;
}

export default function MapViewer({ geojsonData, onFeatureSelect }: MapViewerProps) {
  const mapRef = useRef<any>(null);
  const [selectedFeature, setSelectedFeature] = useState<GeoJSONFeature | null>(null);
  const [measurement, setMeasurement] = useState<string>('');
  const [coordinates, setCoordinates] = useState('');
  const [mapStyle, setMapStyle] = useState<'osm' | 'satellite' | 'terrain'>('osm');
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({
    geojson: true,
  });

  const getTileLayerUrl = () => {
    switch (mapStyle) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'terrain':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
      case 'osm':
      default:
        return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  const getTileLayerAttribution = () => {
    switch (mapStyle) {
      case 'satellite':
      case 'terrain':
        return '&copy; Esri, DigitalGlobe, Earthstar Geographics';
      case 'osm':
      default:
        return '&copy; OpenStreetMap contributors';
    }
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

  // Add GeoJSON features to map
  useEffect(() => {
    if (!mapRef.current || !geojsonData || !layerVisibility.geojson) return;

    const map = mapRef.current;
    const features = Array.isArray(geojsonData) ? geojsonData : [geojsonData];

    features.forEach((feature: GeoJSONFeature) => {
      const geometry = feature.geometry as any;

      if (geometry.type === 'Point') {
        const marker = L.marker([geometry.coordinates[1], geometry.coordinates[0]]);
        let popupContent = '<div class="text-sm">';
        if (feature.properties) {
          Object.entries(feature.properties).forEach(([key, value]) => {
            popupContent += `<p><strong>${key}:</strong> ${value}</p>`;
          });
        }
        popupContent += '</div>';
        marker.bindPopup(popupContent);
        marker.on('click', () => {
          setSelectedFeature(feature);
          onFeatureSelect?.(feature);
        });
        marker.addTo(map);
      } else if (geometry.type === 'Polygon') {
        const coords = geometry.coordinates[0].map((c: number[]) => [c[1], c[0]]);
        const polygon = L.polygon(coords, {
          fillColor: '#10b981',
          weight: 2,
          opacity: 1,
          color: '#059669',
          fillOpacity: 0.5,
        });
        let popupContent = '<div class="text-sm">';
        if (feature.properties) {
          Object.entries(feature.properties).forEach(([key, value]) => {
            popupContent += `<p><strong>${key}:</strong> ${value}</p>`;
          });
        }
        popupContent += '</div>';
        polygon.bindPopup(popupContent);
        polygon.on('click', () => {
          setSelectedFeature(feature);
          onFeatureSelect?.(feature);
        });
        polygon.addTo(map);
      } else if (geometry.type === 'LineString') {
        const coords = geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
        const polyline = L.polyline(coords, {
          color: '#3b82f6',
          weight: 2,
        });
        let popupContent = '<div class="text-sm">';
        if (feature.properties) {
          Object.entries(feature.properties).forEach(([key, value]) => {
            popupContent += `<p><strong>${key}:</strong> ${value}</p>`;
          });
        }
        popupContent += '</div>';
        polyline.bindPopup(popupContent);
        polyline.on('click', () => {
          setSelectedFeature(feature);
          onFeatureSelect?.(feature);
        });
        polyline.addTo(map);
      }
    });
  }, [geojsonData, layerVisibility.geojson, onFeatureSelect]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Interactive Map Viewer
        </CardTitle>
        <CardDescription>
          Visualize geometries with OpenMapTiles and Leaflet
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
          <MapContainer
            center={[59.9311, 30.3609] as any}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef as any}
          >
            <TileLayer
              url={getTileLayerUrl()}
              attribution={getTileLayerAttribution() as any}
              maxZoom={19}
            />
            <MapController onCoordinatesChange={setCoordinates} />
          </MapContainer>
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
          <p>• Powered by OpenMapTiles and Leaflet</p>
        </div>
      </CardContent>
    </Card>
  );
}
