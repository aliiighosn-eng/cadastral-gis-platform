import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Trash2, Eye, EyeOff } from 'lucide-react';

interface GeoJSONFeature {
  type: 'Feature';
  properties: Record<string, any>;
  geometry: any;
}

interface MapViewerProps {
  geojsonData?: GeoJSONFeature | GeoJSONFeature[];
  onFeatureSelect?: (feature: GeoJSONFeature) => void;
}

declare global {
  interface Window {
    ymaps: any;
  }
}

export default function MapViewer({ geojsonData, onFeatureSelect }: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [selectedFeature, setSelectedFeature] = useState<GeoJSONFeature | null>(null);
  const [measurement, setMeasurement] = useState<string>('');
  const [coordinates, setCoordinates] = useState('');
  const [mapType, setMapType] = useState<'map' | 'satellite' | 'hybrid'>('map');
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({
    geojson: true,
  });

  // Initialize Yandex Map
  useEffect(() => {
    if (!mapContainer.current) return;

    // Load Yandex Maps API
    const script = document.createElement('script');
    script.src = 'https://api-maps.yandex.ru/2.1/?apikey=YOUR_API_KEY&lang=en_US';
    script.async = true;
    script.onload = () => {
      if (window.ymaps) {
        window.ymaps.ready(() => {
          map.current = new window.ymaps.Map(mapContainer.current, {
            center: [59.9311, 30.3609], // Saint Petersburg [lat, lng]
            zoom: 12,
            type: mapType,
          });

          // Handle map click for coordinates
          map.current.events.add('click', (e: any) => {
            const coords = e.get('coords');
            setCoordinates(`${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`);
          });

          // Add GeoJSON features to map
          if (geojsonData) {
            const features = Array.isArray(geojsonData) ? geojsonData : [geojsonData];
            features.forEach((feature) => {
              addFeatureToMap(feature);
            });
          }
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [geojsonData]);

  // Change map type
  useEffect(() => {
    if (map.current) {
      map.current.setType(`yandex#${mapType}`);
    }
  }, [mapType]);

  const addFeatureToMap = (feature: GeoJSONFeature) => {
    if (!map.current || !window.ymaps) return;

    const geometry = feature.geometry;
    let placemark: any = null;

    if (geometry.type === 'Point') {
      const [lng, lat] = geometry.coordinates;
      placemark = new window.ymaps.Placemark(
        [lat, lng],
        {
          balloonContent: `<strong>${feature.properties?.name || 'Point'}</strong>`,
        },
        {
          preset: 'islands#blueDotIcon',
        }
      );
    } else if (geometry.type === 'LineString') {
      const coordinates = geometry.coordinates.map((coord: any) => [coord[1], coord[0]]);
      placemark = new window.ymaps.Polyline(coordinates, {
        balloonContent: `<strong>${feature.properties?.name || 'Line'}</strong>`,
      });
    } else if (geometry.type === 'Polygon') {
      const coordinates = geometry.coordinates[0].map((coord: any) => [coord[1], coord[0]]);
      placemark = new window.ymaps.Polygon([coordinates], {
        balloonContent: `<strong>${feature.properties?.name || 'Polygon'}</strong>`,
      });
    }

    if (placemark) {
      placemark.events.add('click', () => {
        setSelectedFeature(feature);
        onFeatureSelect?.(feature);
      });
      map.current.geoObjects.add(placemark);
    }
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
    if (map.current) {
      map.current.geoObjects.removeAll();
    }
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
          Visualize geometries with Yandex Maps
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Map Type</label>
            <Select value={mapType} onValueChange={(v: any) => setMapType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="map">Standard</SelectItem>
                <SelectItem value="satellite">Satellite</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
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
          <p>• Powered by Yandex Maps</p>
          <p className="text-yellow-600 font-medium">• Note: Add your Yandex Maps API key to enable the map</p>
        </div>
      </CardContent>
    </Card>
  );
}
