import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp } from 'lucide-react';

interface ValuationResult {
  cadastralNumber: string;
  address: string;
  area: number;
  predictedValue: number;
  valuePerSqm: number;
  confidence: number;
  factors: {
    location: number;
    size: number;
    condition: number;
    market: number;
  };
}

export default function ValueAssessment() {
  const [cadastralNumber, setCadastralNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [error, setError] = useState('');

  const handleAssess = async () => {
    if (!cadastralNumber.trim()) {
      setError('Please enter a cadastral number');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/cadastral/assess-value?number=${cadastralNumber}`);
      
      if (!response.ok) {
        throw new Error('Failed to assess property value');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastral Value Assessment</CardTitle>
        <CardDescription>
          Calculate cadastral value for IZHS (individual housing construction) properties
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Cadastral Number</label>
          <div className="flex gap-2">
            <Input
              placeholder="XX:XX:XXXXXX:XXXX"
              value={cadastralNumber}
              onChange={(e) => setCadastralNumber(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAssess()}
              disabled={loading}
            />
            <Button onClick={handleAssess} disabled={loading} className="w-24">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Assess'}
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Cadastral Number</p>
                <p className="font-medium">{result.cadastralNumber}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Area (m²)</p>
                <p className="font-medium">{result.area.toLocaleString()}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-500">Address</p>
                <p className="font-medium">{result.address}</p>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">Predicted Cadastral Value</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ₽{result.predictedValue.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-600">
                    ₽{result.valuePerSqm.toLocaleString()}/m²
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Valuation Confidence</p>
              <div className="h-2 w-full rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: `${result.confidence * 100}%` }}
                />
              </div>
              <p className={`text-sm font-medium ${getConfidenceColor(result.confidence)}`}>
                {(result.confidence * 100).toFixed(1)}% Confidence
              </p>
            </div>

            <div className="space-y-2 rounded-lg bg-slate-50 p-3">
              <p className="text-sm font-medium">Valuation Factors</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Location Factor</span>
                  <span className="font-medium">{(result.factors.location * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Size Factor</span>
                  <span className="font-medium">{(result.factors.size * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Condition Factor</span>
                  <span className="font-medium">{(result.factors.condition * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Market Factor</span>
                  <span className="font-medium">{(result.factors.market * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            <Button className="w-full">Generate Valuation Report</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
