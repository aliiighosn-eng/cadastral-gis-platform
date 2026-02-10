import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layers, Zap, Plus } from 'lucide-react';

interface SpatialAnalysisProps {
  onBufferCreate?: (bufferDistance: number, unit: string) => void;
  onIntersectionAnalyze?: (threshold: number) => void;
  onUnionCreate?: () => void;
}

export default function SpatialAnalysis({
  onBufferCreate,
  onIntersectionAnalyze,
  onUnionCreate,
}: SpatialAnalysisProps) {
  const [bufferDistance, setBufferDistance] = useState('100');
  const [bufferUnit, setBufferUnit] = useState('meters');
  const [intersectionThreshold, setIntersectionThreshold] = useState('50');
  const [analysisResults, setAnalysisResults] = useState<string>('');

  const handleCreateBuffer = () => {
    const distance = parseFloat(bufferDistance);
    if (isNaN(distance) || distance <= 0) {
      setAnalysisResults('Error: Invalid buffer distance');
      return;
    }
    onBufferCreate?.(distance, bufferUnit);
    setAnalysisResults(`Buffer created: ${distance} ${bufferUnit}`);
  };

  const handleAnalyzeIntersection = () => {
    const threshold = parseFloat(intersectionThreshold);
    if (isNaN(threshold) || threshold < 0) {
      setAnalysisResults('Error: Invalid threshold value');
      return;
    }
    onIntersectionAnalyze?.(threshold);
    setAnalysisResults(`Intersection analysis with ${threshold}% threshold completed`);
  };

  const handleCreateUnion = () => {
    onUnionCreate?.();
    setAnalysisResults('Union geometry created from selected features');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Spatial Analysis Tools
        </CardTitle>
        <CardDescription>
          Perform buffer analysis, intersection detection, and geometry operations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Buffer Analysis */}
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-900">Buffer Zone Analysis</h4>
          <p className="text-sm text-slate-600">
            Create buffer zones around selected geometries for proximity analysis
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Distance</label>
              <Input
                type="number"
                value={bufferDistance}
                onChange={(e) => setBufferDistance(e.target.value)}
                placeholder="100"
                min="0"
                step="10"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Unit</label>
              <Select value={bufferUnit} onValueChange={setBufferUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meters">Meters</SelectItem>
                  <SelectItem value="kilometers">Kilometers</SelectItem>
                  <SelectItem value="feet">Feet</SelectItem>
                  <SelectItem value="miles">Miles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleCreateBuffer} className="w-full" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Create Buffer
          </Button>
        </div>

        {/* Intersection Analysis */}
        <div className="space-y-3 border-t pt-4">
          <h4 className="font-semibold text-slate-900">Intersection Detection</h4>
          <p className="text-sm text-slate-600">
            Find overlapping areas between geometries and calculate intersection percentages
          </p>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Overlap Threshold (%)
            </label>
            <Input
              type="number"
              value={intersectionThreshold}
              onChange={(e) => setIntersectionThreshold(e.target.value)}
              placeholder="50"
              min="0"
              max="100"
              step="5"
            />
          </div>
          <Button onClick={handleAnalyzeIntersection} className="w-full" variant="outline">
            <Zap className="w-4 h-4 mr-2" />
            Analyze Intersections
          </Button>
        </div>

        {/* Union Operation */}
        <div className="space-y-3 border-t pt-4">
          <h4 className="font-semibold text-slate-900">Union Operation</h4>
          <p className="text-sm text-slate-600">
            Combine multiple geometries into a single unified geometry
          </p>
          <Button onClick={handleCreateUnion} className="w-full" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Create Union Geometry
          </Button>
        </div>

        {/* Results */}
        {analysisResults && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900">Analysis Result:</p>
            <p className="text-sm text-blue-800 mt-1">{analysisResults}</p>
          </div>
        )}

        {/* Information */}
        <div className="bg-slate-50 p-4 rounded-lg space-y-2 border-t pt-4">
          <p className="text-sm font-medium text-slate-900">Spatial Operations Guide:</p>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>
              <strong>Buffer:</strong> Creates zones at specified distance from geometry edges
            </li>
            <li>
              <strong>Intersection:</strong> Identifies overlapping areas and calculates percentages
            </li>
            <li>
              <strong>Union:</strong> Merges multiple geometries into a single combined shape
            </li>
            <li>
              <strong>Use Cases:</strong> Water proximity analysis, accessibility zones, land use planning
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
