import { useState, useEffect, useRef } from 'react';
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
  const [mapType, setMapType] = useState<string>('map');
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({
    geojson: true,
  });

  // Initialize Yandex Map
  useEffect(() => {
    if (!mapContainer.current) return;

    // Load Yandex Maps API with demo key
    const script = document.createElement('script');
    // Using demo API key - users should replace with their own key
    script.src = 'https://api-maps.yandex.ru/2.1/?apikey=demo&lang=en_US';
    script.async = true;
    script.onerror = () => {
      console.error('Failed to load Yandex Maps API. Please check your API key.');
      if (mapContainer.current) {
        mapContainer.current.innerHTML = '<div style="padding: 20px; color: #d32f2f;">Failed to load Yandex Maps. Please add your API key.</div>';
      }
    };
    script.onload = () => {
      try {
        if (window.ymaps) {
          window.ymaps.ready(() => {
            try {
              if (!mapContainer.current) return;
              // Yandex Maps type format: 'yandex#map', 'yandex#satellite', 'yandex#hybrid'
              const typeMap: Record<string, string> = {
                map: 'yandex#map',
                satellite: 'yandex#satellite',
                hybrid: 'yandex#hybrid',
              };
              map.current = new window.ymaps.Map(mapContainer.current, {
                center: [59.9311, 30.3609], // Saint Petersburg [lat, lng]
                zoom: 12,
                type: typeMap[mapType] || 'yandex#map',
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
            } catch (err) {
              console.error('Error initializing map:', err);
            }
          });
        }
      } catch (err) {
        console.error('Error loading Yandex Maps:', err);
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
      try {
        // Yandex Maps type format: 'yandex#map', 'yandex#satellite', 'yandex#hybrid'
        const typeMap: Record<string, string> = {
          map: 'yandex#map',
          satellite: 'yandex#satellite',
          hybrid: 'yandex#hybrid',
        };
        map.current.setType(typeMap[mapType] || 'yandex#map');
      } catch (err) {
        console.error('Error changing map type:', err);
      }
    }
  }, [mapType]);

  const addFeatureToMap = (feature: GeoJSONFeature) => {
    if (!map.current) return;

    try {
      const geometry = feature.geometry;
      let placemark;

      if (geometry.type === 'Point') {
        placemark = new window.ymaps.Placemark(
          geometry.coordinates.reverse(),
          { ...feature.properties },
          { preset: 'islands#blueDotIcon' }
        );
      } else if (geometry.type === 'Polygon') {
        placemark = new window.ymaps.Polygon(
          geometry.coordinates.map((ring: any) =>
            ring.map((coord: any) => [coord[1], coord[0]])
          ),
          { ...feature.properties },
          { fill: true, stroke: true, fillColor: '#0000ff33', strokeColor: '#0000ff' }
        );
      } else if (geometry.type === 'LineString') {
        placemark = new window.ymaps.Polyline(
          geometry.coordinates.map((coord: any) => [coord[1], coord[0]]),
          { ...feature.properties },
          { strokeColor: '#ff0000', strokeWidth: 2 }
        );
      }

      if (placemark) {
        placemark.events.add('click', () => {
          setSelectedFeature(feature);
          onFeatureSelect?.(feature);
        });
        map.current.geoObjects.add(placemark);
      }
    } catch (err) {
      console.error('Error adding feature to map:', err);
    }
  };

  const calculateDistance = () => {
    if (!selectedFeature || selectedFeature.geometry.type !== 'Point') return;

    const point = selectedFeature.geometry.coordinates;
    const centerCoords = map.current?.getCenter();

    if (centerCoords && point) {
      const lat1 = (centerCoords[0] * Math.PI) / 180;
      const lat2 = (point[1] * Math.PI) / 180;
      const deltaLat = ((point[1] - centerCoords[0]) * Math.PI) / 180;
      const deltaLng = ((point[0] - centerCoords[1]) * Math.PI) / 180;

      const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) *
          Math.cos(lat2) *
          Math.sin(deltaLng / 2) *
          Math.sin(deltaLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = 6371 * c; // Earth radius in km

      setMeasurement(`Distance: ${distance.toFixed(2)} km`);
    }
  };

  const clearMap = () => {
    if (map.current) {
      map.current.geoObjects.removeAll();
    }
    setSelectedFeature(null);
    setMeasurement('');
    setCoordinates('');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Interactive Map Viewer</CardTitle>
          <CardDescription>Visualize and analyze GeoJSON geometries on Yandex Maps</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            ref={mapContainer}
            className="w-full h-96 rounded-lg border border-border bg-muted"
            style={{ minHeight: '400px' }}
          />

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Map Type</label>
              <Select value={mapType} onValueChange={(v: string) => setMapType(v)}>
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
              <Input value={coordinates} readOnly placeholder="Click on map to get coordinates" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Measurement</label>
              <Input value={measurement} readOnly placeholder="Distance or area" />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={calculateDistance} variant="outline" size="sm">
              <MapPin className="w-4 h-4 mr-2" />
              Measure Distance
            </Button>
            <Button onClick={clearMap} variant="destructive" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Map
            </Button>
          </div>

          {selectedFeature && (
            <Card className="bg-muted">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Selected Feature</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <pre className="overflow-auto max-h-40 bg-background p-2 rounded text-xs">
                  {JSON.stringify(selectedFeature.properties, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
