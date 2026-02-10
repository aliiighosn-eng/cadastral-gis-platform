import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';

export default function PricingFactors() {
  const [files, setFiles] = useState({
    parcel: null as File | null,
    water: null as File | null,
    centers: null as File | null,
    density: null as File | null,
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [results, setResults] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: keyof typeof files) => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles({ ...files, [type]: file });
      setStatus('idle');
    }
  };

  const handleCalculate = async () => {
    if (!files.parcel || !files.water || !files.centers || !files.density) {
      setStatus('error');
      setMessage('Please select all files');
      return;
    }

    setLoading(true);
    setStatus('idle');

    try {
      const formData = new FormData();
      formData.append('parcel_file', files.parcel);
      formData.append('water_file', files.water);
      formData.append('centers_file', files.centers);
      formData.append('density_file', files.density);

      const response = await fetch('/api/pricing/calculate-factors', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
        setStatus('success');
        setMessage('Pricing factors calculated successfully!');
      } else {
        const error = await response.json();
        setStatus('error');
        setMessage(error.detail || 'Calculation failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automated Pricing Factors</CardTitle>
        <CardDescription>
          Calculate proximity factors for land parcels using buffer zone analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900">
              Parcel File (GeoJSON)
            </label>
            <input
              type="file"
              accept=".geojson"
              onChange={(e) => handleFileChange(e, 'parcel')}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {files.parcel && (
              <p className="text-sm text-slate-600">Selected: {files.parcel.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900">
              Water Features (GeoJSON)
            </label>
            <input
              type="file"
              accept=".geojson"
              onChange={(e) => handleFileChange(e, 'water')}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {files.water && (
              <p className="text-sm text-slate-600">Selected: {files.water.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900">
              Local Centers (GeoJSON)
            </label>
            <input
              type="file"
              accept=".geojson"
              onChange={(e) => handleFileChange(e, 'centers')}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {files.centers && (
              <p className="text-sm text-slate-600">Selected: {files.centers.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900">
              Population Density (GeoJSON)
            </label>
            <input
              type="file"
              accept=".geojson"
              onChange={(e) => handleFileChange(e, 'density')}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {files.density && (
              <p className="text-sm text-slate-600">Selected: {files.density.name}</p>
            )}
          </div>
        </div>

        {/* Status Message */}
        {status !== 'idle' && (
          <div className={`flex items-start gap-3 p-4 rounded-lg ${
            status === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}>
            {status === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm">{message}</p>
          </div>
        )}

        {/* Calculate Button */}
        <Button
          onClick={handleCalculate}
          disabled={!files.parcel || !files.water || !files.centers || !files.density || loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Calculating...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Calculate Pricing Factors
            </>
          )}
        </Button>

        {/* Results */}
        {results && (
          <div className="space-y-4 bg-slate-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-slate-900">Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600">Water Proximity</p>
                <p className="text-2xl font-bold text-slate-900">
                  {results.water_proximity !== null ? `${results.water_proximity.toFixed(2)}m` : 'N/A'}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600">Center Distance</p>
                <p className="text-2xl font-bold text-slate-900">
                  {results.center_distance !== null ? `${results.center_distance.toFixed(2)}m` : 'N/A'}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600">Population Density</p>
                <p className="text-2xl font-bold text-slate-900">
                  {results.population_density !== null ? `${results.population_density.toFixed(2)}` : 'N/A'}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600">Composite Factor</p>
                <p className="text-2xl font-bold text-blue-600">
                  {results.composite_factor?.toFixed(4)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Information */}
        <div className="bg-blue-50 p-4 rounded-lg space-y-2">
          <p className="text-sm font-medium text-blue-900">Calculation Methods:</p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Water Proximity:</strong> Buffer zones (10m, 50m, 150m) - returns smallest distance with intersection</li>
            <li>• <strong>Center Distance:</strong> Minimum distance from parcel to nearest local center</li>
            <li>• <strong>Population Density:</strong> Weighted average by intersection area</li>
            <li>• <strong>Composite Factor:</strong> Weighted combination of all factors (0-1 scale)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
