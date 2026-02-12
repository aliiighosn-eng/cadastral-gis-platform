import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Calculator } from 'lucide-react';

interface TaxCalculationResult {
  cadastralValue: number;
  taxRate: number;
  annualTax: number;
  taxPerMonth: number;
  region: string;
  objectType: string;
  lastCalculated: string;
}

export default function TaxCalculator() {
  const [cadastralValue, setCadastralValue] = useState('');
  const [region, setRegion] = useState('');
  const [objectType, setObjectType] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TaxCalculationResult | null>(null);
  const [error, setError] = useState('');

  const regions = [
    { id: '78', name: 'Saint Petersburg' },
    { id: '47', name: 'Leningrad Oblast' },
    { id: '54', name: 'Novgorod Oblast' },
  ];

  const objectTypes = [
    { id: 'land_plot', name: 'Land Plot' },
    { id: 'residential', name: 'Residential Building' },
    { id: 'commercial', name: 'Commercial Building' },
    { id: 'apartment', name: 'Apartment' },
  ];

  const handleCalculate = async () => {
    if (!cadastralValue || !region || !objectType) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/cadastral/calculate-tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cadastralValue: parseFloat(cadastralValue),
          region,
          objectType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate tax');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax Assessment Calculator</CardTitle>
        <CardDescription>
          Calculate property taxes based on cadastral value and regional rates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2">
            <label className="text-sm font-medium">Cadastral Value (₽)</label>
            <Input
              type="number"
              placeholder="1000000"
              value={cadastralValue}
              onChange={(e) => setCadastralValue(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Region</label>
            <Select value={region} onValueChange={setRegion} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select region..." />
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Object Type</label>
            <Select value={objectType} onValueChange={setObjectType} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {objectTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleCalculate} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Calculator className="mr-2 h-4 w-4" />
              Calculate Tax
            </>
          )}
        </Button>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Tax Rate</p>
                <p className="text-lg font-bold">{(result.taxRate * 100).toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Region</p>
                <p className="font-medium">{result.region}</p>
              </div>
            </div>

            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-xs text-slate-600">Annual Property Tax</p>
              <p className="text-3xl font-bold text-green-600">
                ₽{result.annualTax.toLocaleString()}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                ₽{result.taxPerMonth.toLocaleString()}/month
              </p>
            </div>

            <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Cadastral Value</span>
                <span className="font-medium">₽{parseFloat(cadastralValue).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-slate-600">Annual Tax</span>
                <span className="font-medium">₽{result.annualTax.toLocaleString()}</span>
              </div>
            </div>

            <Button variant="outline" className="w-full">
              Download Tax Calculation
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
