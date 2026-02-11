import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Download, Trash2, Plus, Minus, Eye, EyeOff } from 'lucide-react';

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

declare global {
  interface Window {
    ymaps: any;
  }
}

export default function MapViewer({ geojsonData, onFeatureSelect, onGeometryChange }: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [selectedFeature, setSelectedFeature] = useState<GeoJSONFeature | null>(null);
  const [measurement, setMeasurement] = useState<string>('');
  const [zoom, setZoom] = useState(13);
  const [center, setCenter] = useState<[number, number]>([30.3609, 59.9311]); // Saint Petersburg
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({
    geojson: true,
    drawing: true,
  });
  const [mapReady, setMapReady] = useState(false);

  // Initialize Yandex Map
  useEffect(() => {
    if (!mapContainer.current || mapReady) return;

    // Load Yandex Maps API
    const script = document.createElement('script');
    script.src = 'https://api-maps.yandex.ru/2.1/?apikey=YOUR_YANDEX_MAPS_API_KEY&lang=en_US';
    script.async = true;
    script.onload = () => {
      window.ymaps.ready(initMap);
    };
    document.head.appendChild(script);

    function initMap() {
      if (!mapContainer.current || !window.ymaps) return;

      const map = new window.ymaps.Map(mapContainer.current, {
        center: center,
        zoom: zoom,
        controls: ['zoomControl', 'fullscreenControl'],
      });

      mapRef.current = map;
      setMapReady(true);

      // Update zoom and center on map interaction
      map.events.add('boundschange', () => {
        setZoom(map.getZoom());
        const mapCenter = map.getCenter();
        setCenter([mapCenter[1], mapCenter[0]]);
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
      }
    };
  }, []);

  // Load GeoJSON data
  useEffect(() => {
    if (!mapReady || !mapRef.current || !geojsonData) return;

    const map = mapRef.current;

    // Convert GeoJSON to Yandex format
    const features = Array.isArray(geojsonData) ? geojsonData : [geojsonData];

    features.forEach((feature: GeoJSONFeature, index: number) => {
      const geometry = feature.geometry as any;

      if (geometry.type === 'Point') {
        const placemark = new window.ymaps.Placemark(
          [geometry.coordinates[1], geometry.coordinates[0]],
          {
            balloonContent: formatBalloonContent(feature.properties),
          },
          {
            preset: 'islands#blueDotIcon',
          }
        );

        placemark.events.add('click', () => {
          setSelectedFeature(feature);
          onFeatureSelect?.(feature);
        });

        map.geoObjects.add(placemark);
      } else if (geometry.type === 'Polygon') {
        const coords = geometry.coordinates[0].map((coord: number[]) => [coord[1], coord[0]]);

        const polygon = new window.ymaps.Polygon([coords], {
          balloonContent: formatBalloonContent(feature.properties),
        });

        polygon.events.add('click', () => {
          setSelectedFeature(feature);
          onFeatureSelect?.(feature);
        });

        map.geoObjects.add(polygon);
      } else if (geometry.type === 'LineString') {
        const coords = geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);

        const polyline = new window.ymaps.Polyline(coords, {
          balloonContent: formatBalloonContent(feature.properties),
        });

        polyline.events.add('click', () => {
          setSelectedFeature(feature);
          onFeatureSelect?.(feature);
        });

        map.geoObjects.add(polyline);
      }
    });

    // Fit bounds to all features
    if (map.geoObjects.getLength() > 0) {
      map.setBounds(map.geoObjects.getBounds(), {
        checkZoomRange: true,
        zoomMargin: 50,
      });
    }
  }, [geojsonData, mapReady, onFeatureSelect]);

  // Format balloon content for Yandex popups
  const formatBalloonContent = (properties: Record<string, any>): string => {
    return Object.entries(properties)
      .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
      .join('');
  };

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
    if (mapRef.current) {
      mapRef.current.geoObjects.removeAll();
    }
  };

  // Toggle layer visibility
  const toggleLayerVisibility = (layer: string) => {
    setLayerVisibility(prev => {
      const newVisibility = {
        ...prev,
        [layer]: !prev[layer],
      };

      if (layer === 'geojson' && mapRef.current) {
        if (newVisibility.geojson) {
          mapRef.current.geoObjects.each((geoObject: any) => {
            geoObject.options.set('visible', true);
          });
        } else {
          mapRef.current.geoObjects.each((geoObject: any) => {
            geoObject.options.set('visible', false);
          });
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
          Visualize geometries, measure distances, and perform spatial analysis with Yandex Maps
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map Container */}
        <div className="space-y-2">
          <div
            ref={mapContainer}
            className="w-full h-96 rounded-lg border border-slate-200 bg-slate-50"
          />
          {!mapReady && (
            <div className="text-center text-slate-600 py-4">
              <p>Loading Yandex Maps...</p>
            </div>
          )}
        </div>

        {/* Map Controls */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.setZoom(mapRef.current.getZoom() + 1);
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
              if (mapRef.current) {
                mapRef.current.setZoom(mapRef.current.getZoom() - 1);
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
            <li>• Powered by Yandex Maps (Russian mapping service)</li>
          </ul>
        </div>

        {/* API Key Notice */}
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-900">
            <strong>⚠️ Note:</strong> To use Yandex Maps, you need to add your Yandex Maps API key. 
            Get one from <a href="https://developer.tech.yandex.com/services/api/maps" target="_blank" rel="noopener noreferrer" className="underline">Yandex Developer Console</a> and update the API key in the component.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
