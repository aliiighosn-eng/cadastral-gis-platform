import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';

export default function CoordinateExporter() {
  const [file, setFile] = useState<File | null>(null);
  const [targetSystem, setTargetSystem] = useState('EPSG:4328');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus('idle');
    }
  };

  const handleExport = async () => {
    if (!file) {
      setStatus('error');
      setMessage('Please select a file');
      return;
    }

    setLoading(true);
    setStatus('idle');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('target_system', targetSystem);

      const response = await fetch('/api/export/coordinates', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'exported.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setStatus('success');
        setMessage('Coordinates exported successfully!');
        setFile(null);
      } else {
        const error = await response.json();
        setStatus('error');
        setMessage(error.detail || 'Export failed');
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
        <CardTitle>Coordinate Exporter</CardTitle>
        <CardDescription>
          Transform and export coordinates from GIS files to Excel format
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-900">
            Select GIS File
          </label>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="file"
                accept=".dxf,.geojson,.tab,.shp"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>
          </div>
          {file && (
            <p className="text-sm text-slate-600">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        {/* Coordinate System Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-900">
            Target Coordinate System
          </label>
          <Select value={targetSystem} onValueChange={setTargetSystem}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MSK-64">MSK-64 (Moscow)</SelectItem>
              <SelectItem value="EPSG:3857">EPSG:3857 (Web Mercator)</SelectItem>
              <SelectItem value="EPSG:4328">EPSG:4328 (WGS84)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">
            Coordinates will be transformed to the selected system
          </p>
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

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={!file || loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export to Excel
            </>
          )}
        </Button>

        {/* Information */}
        <div className="bg-blue-50 p-4 rounded-lg space-y-2">
          <p className="text-sm font-medium text-blue-900">Supported Formats:</p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• .dxf - AutoCAD Drawing Format</li>
            <li>• .geojson - GeoJSON Format</li>
            <li>• .tab - MapInfo TAB Format</li>
            <li>• .shp - Shapefile Format</li>
          </ul>
        </div>

        {/* Output Format Info */}
        <div className="bg-slate-50 p-4 rounded-lg space-y-2">
          <p className="text-sm font-medium text-slate-900">Output Format:</p>
          <p className="text-sm text-slate-600">
            Excel file with columns: ID, kadNum, GeometryType, x, y, System
          </p>
          <p className="text-xs text-slate-500">
            Each coordinate of multi-vertex geometries is exported as a separate row
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
