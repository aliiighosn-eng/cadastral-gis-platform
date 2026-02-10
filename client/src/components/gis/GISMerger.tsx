import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, AlertCircle, CheckCircle, X } from 'lucide-react';

export default function GISMerger() {
  const [files, setFiles] = useState<File[]>([]);
  const [targetSystem, setTargetSystem] = useState('EPSG:4328');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      setFiles(Array.from(selectedFiles));
      setStatus('idle');
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setStatus('error');
      setMessage('Please select at least 2 files');
      return;
    }

    setLoading(true);
    setStatus('idle');

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('target_system', targetSystem);

      const response = await fetch('/api/gis/merge-layers', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'merged.geojson';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setStatus('success');
        setMessage('Layers merged successfully!');
        setFiles([]);
      } else {
        const error = await response.json();
        setStatus('error');
        setMessage(error.detail || 'Merge failed');
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
        <CardTitle>GIS Layer Merger</CardTitle>
        <CardDescription>
          Merge multiple GeoJSON layers into a single file with consistent attributes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-900">
            Select GeoJSON Files (minimum 2)
          </label>
          <input
            type="file"
            multiple
            accept=".geojson"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        {/* Selected Files List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-900">Selected Files ({files.length}):</p>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <span className="text-sm text-slate-600">{file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Merge Button */}
        <Button
          onClick={handleMerge}
          disabled={files.length < 2 || loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Merging...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Merge Layers
            </>
          )}
        </Button>

        {/* Information */}
        <div className="bg-blue-50 p-4 rounded-lg space-y-2">
          <p className="text-sm font-medium text-blue-900">Merge Process:</p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Aggregates all features from selected layers</li>
            <li>• Standardizes attributes: ID, kadNum, name, landUse</li>
            <li>• Assigns None to missing attribute values</li>
            <li>• Preserves all geometry types (Point, Line, Polygon)</li>
            <li>• Maintains coordinate system consistency</li>
          </ul>
        </div>

        {/* Output Format Info */}
        <div className="bg-slate-50 p-4 rounded-lg space-y-2">
          <p className="text-sm font-medium text-slate-900">Output Format:</p>
          <p className="text-sm text-slate-600">
            Single GeoJSON FeatureCollection with all merged features
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
