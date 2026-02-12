import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, BarChart3 } from 'lucide-react';

interface ClassificationResult {
  objectType: string;
  count: number;
  percentage: number;
  subTypes: Array<{ name: string; count: number }>;
}

export default function ObjectClassification() {
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ClassificationResult[]>([]);
  const [error, setError] = useState('');

  const regions = [
    { id: '78', name: 'Saint Petersburg' },
    { id: '47', name: 'Leningrad Oblast' },
    { id: '54', name: 'Novgorod Oblast' },
    { id: '60', name: 'Pskov Oblast' },
  ];

  const handleClassify = async () => {
    if (!region) {
      setError('Please select a region');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/cadastral/classify?region=${region}`);
      
      if (!response.ok) {
        throw new Error('Failed to classify cadastral objects');
      }

      const data = await response.json();
      setResults(data.classifications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const totalObjects = results.reduce((sum, r) => sum + r.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastral Object Classification</CardTitle>
        <CardDescription>
          Classify cadastral objects by type (land plot, building, room)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Region</label>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a region..." />
            </SelectTrigger>
            <SelectContent>
              {regions.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleClassify} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Classifying...
            </>
          ) : (
            <>
              <BarChart3 className="mr-2 h-4 w-4" />
              Classify Objects
            </>
          )}
        </Button>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {results.length > 0 && (
          <div className="space-y-4 border-t pt-4">
            <div className="text-sm text-slate-600">
              Total Objects: <span className="font-bold text-lg">{totalObjects.toLocaleString()}</span>
            </div>

            {results.map((result, idx) => (
              <div key={idx} className="space-y-2 rounded-lg bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{result.objectType}</span>
                  <span className="text-sm text-slate-600">{result.count.toLocaleString()} objects</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${result.percentage}%` }}
                  />
                </div>
                <div className="text-xs text-slate-500">{result.percentage.toFixed(1)}% of total</div>

                {result.subTypes.length > 0 && (
                  <div className="mt-2 space-y-1 pl-2 text-xs">
                    {result.subTypes.map((subType, subIdx) => (
                      <div key={subIdx} className="text-slate-600">
                        • {subType.name}: {subType.count.toLocaleString()}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <Button variant="outline" className="w-full">
              Export Classification Report
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
