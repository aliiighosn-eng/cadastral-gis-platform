import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MapViewer from './MapViewer';
import SpatialAnalysis from './SpatialAnalysis';
import { Map, Layers } from 'lucide-react';

interface MapTabProps {
  geojsonData?: any;
  onFeatureSelect?: (feature: any) => void;
}

export default function MapTab({ geojsonData, onFeatureSelect }: MapTabProps) {
  const [selectedFeature, setSelectedFeature] = useState<any>(null);

  const handleBufferCreate = (distance: number, unit: string) => {
    console.log(`Creating buffer: ${distance} ${unit}`);
    // Implementation would call backend API
  };

  const handleIntersectionAnalyze = (threshold: number) => {
    console.log(`Analyzing intersections with threshold: ${threshold}%`);
    // Implementation would call backend API
  };

  const handleUnionCreate = () => {
    console.log('Creating union geometry');
    // Implementation would call backend API
  };

  return (
    <Tabs defaultValue="map" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="map" className="flex items-center gap-2">
          <Map className="w-4 h-4" />
          Map Viewer
        </TabsTrigger>
        <TabsTrigger value="analysis" className="flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Spatial Analysis
        </TabsTrigger>
      </TabsList>

      <TabsContent value="map" className="space-y-4">
        <MapViewer
          geojsonData={geojsonData}
          onFeatureSelect={(feature) => {
            setSelectedFeature(feature);
            onFeatureSelect?.(feature);
          }}
        />
      </TabsContent>

      <TabsContent value="analysis" className="space-y-4">
        <SpatialAnalysis
          onBufferCreate={handleBufferCreate}
          onIntersectionAnalyze={handleIntersectionAnalyze}
          onUnionCreate={handleUnionCreate}
        />
      </TabsContent>
    </Tabs>
  );
}
