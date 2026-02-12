import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface CadastralObject {
  cadastralNumber: string;
  objectType: string;
  address: string;
  area: number;
  owner: string;
  registrationDate: string;
}

export default function CadastralNumberLookup() {
  const [cadastralNumber, setCadastralNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CadastralObject | null>(null);
  const [error, setError] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

  const validateCadastralNumber = (number: string): boolean => {
    const pattern = /^\d{2}:\d{2}:\d{6}:\d{4}$/;
    return pattern.test(number);
  };

  const handleSearch = async () => {
    setError('');
    setValidationMessage('');
    setResult(null);

    if (!cadastralNumber.trim()) {
      setError('Please enter a cadastral number');
      return;
    }

    if (!validateCadastralNumber(cadastralNumber)) {
      setValidationMessage('Invalid format. Use: XX:XX:XXXXXX:XXXX');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call to RGIS
      const response = await fetch(`/api/cadastral/lookup?number=${cadastralNumber}`);
      
      if (!response.ok) {
        throw new Error('Cadastral object not found');
      }

      const data = await response.json();
      setResult(data);
      setValidationMessage('Cadastral object found successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lookup cadastral number');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCadastralNumber('');
    setResult(null);
    setError('');
    setValidationMessage('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastral Number Lookup</CardTitle>
        <CardDescription>
          Search and validate cadastral numbers with format verification
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
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              disabled={loading}
            />
            <Button onClick={handleSearch} disabled={loading} className="w-24">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
            <Button onClick={handleClear} variant="outline" disabled={loading}>
              Clear
            </Button>
          </div>
          <p className="text-xs text-slate-500">Format: XX:XX:XXXXXX:XXXX (e.g., 78:01:123456:0001)</p>
        </div>

        {validationMessage && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{validationMessage}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-3 border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Cadastral Number</p>
                <p className="font-medium">{result.cadastralNumber}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Object Type</p>
                <p className="font-medium">{result.objectType}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-500">Address</p>
                <p className="font-medium">{result.address}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Area (m²)</p>
                <p className="font-medium">{result.area.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Owner</p>
                <p className="font-medium">{result.owner}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-500">Registration Date</p>
                <p className="font-medium">{result.registrationDate}</p>
              </div>
            </div>
            <Button className="w-full">Download Details</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
