import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';

export default function LandAssessment() {
  const [parcelFile, setParcelFile] = useState<File | null>(null);
  const [centersFile, setCentersFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [results, setResults] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'parcel' | 'centers') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'parcel') setParcelFile(file);
      else setCentersFile(file);
      setStatus('idle');
    }
  };

  const handleAssess = async () => {
    if (!parcelFile || !centersFile) {
      setStatus('error');
      setMessage('Please select both files');
      return;
    }

    setLoading(true);
    setStatus('idle');

    try {
      const formData = new FormData();
      formData.append('parcels_file', parcelFile);
      formData.append('centers_file', centersFile);

      const response = await fetch('/api/assessment/land-use', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
        setStatus('success');
        setMessage('Assessment completed successfully!');
      } else {
        const error = await response.json();
        setStatus('error');
        setMessage(error.detail || 'Assessment failed');
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
        <CardTitle>Land Use Assessment</CardTitle>
        <CardDescription>
          Calculate compactness, elongation, and roundness coefficients for land plots
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900">
              Parcels File (GeoJSON)
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
            {parcelFile && (
              <p className="text-sm text-slate-600">Selected: {parcelFile.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900">
              Centers File (GeoJSON)
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
            {centersFile && (
              <p className="text-sm text-slate-600">Selected: {centersFile.name}</p>
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

        {/* Assess Button */}
        <Button
          onClick={handleAssess}
          disabled={!parcelFile || !centersFile || loading}
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
              Calculate Assessment
            </>
          )}
        </Button>

        {/* Results */}
        {results && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Results</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-slate-900">ID</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-900">Compactness</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-900">Elongation</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-900">Roundness</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-900">Avg Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {results.results?.map((row: any, idx: number) => (
                    <tr key={idx} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-600">{row.id}</td>
                      <td className="px-4 py-2 text-slate-600">{row.compactness?.toFixed(4)}</td>
                      <td className="px-4 py-2 text-slate-600">{row.elongation?.toFixed(4)}</td>
                      <td className="px-4 py-2 text-slate-600">{row.roundness?.toFixed(4)}</td>
                      <td className="px-4 py-2 text-slate-600">{row.avg_distance?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Information */}
        <div className="bg-blue-50 p-4 rounded-lg space-y-2">
          <p className="text-sm font-medium text-blue-900">Calculated Metrics:</p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Compactness:</strong> k = П / (4√P) - measures shape regularity</li>
            <li>• <strong>Elongation:</strong> k = s / (1.7√P) - measures length vs width</li>
            <li>• <strong>Roundness:</strong> k = (2d) / √(2P) - measures deviation from circle</li>
            <li>• <strong>Avg Distance:</strong> Weighted average distance to land centers</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
