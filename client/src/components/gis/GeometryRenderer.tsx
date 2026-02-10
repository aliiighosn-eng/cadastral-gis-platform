import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, AlertCircle, CheckCircle } from 'lucide-react';

export default function GeometryRenderer() {
  const [file, setFile] = useState<File | null>(null);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('#CCCCCC');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus('idle');
    }
  };

  const handleRender = async () => {
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
      formData.append('stroke_color', strokeColor);
      formData.append('fill_color', fillColor);
      formData.append('stroke_width', strokeWidth.toString());

      const response = await fetch('/api/render/geometry', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setPreviewUrl(url);

        // Also download the file
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rendered.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setStatus('success');
        setMessage('Geometry rendered successfully!');
      } else {
        const error = await response.json();
        setStatus('error');
        setMessage(error.detail || 'Rendering failed');
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
        <CardTitle>Geometry Renderer</CardTitle>
        <CardDescription>
          Render GeoJSON geometries to raster PNG images with customizable styling
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-900">
            Select GeoJSON File
          </label>
          <input
            type="file"
            accept=".geojson"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          {file && (
            <p className="text-sm text-slate-600">Selected: {file.name}</p>
          )}
        </div>

        {/* Color and Style Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900">
              Stroke Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <Input
                type="text"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900">
              Fill Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <Input
                type="text"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                placeholder="#CCCCCC"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900">
              Stroke Width (px)
            </label>
            <Input
              type="number"
              min="1"
              max="10"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
            />
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

        {/* Render Button */}
        <Button
          onClick={handleRender}
          disabled={!file || loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Rendering...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Render to PNG
            </>
          )}
        </Button>

        {/* Preview */}
        {previewUrl && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-900">Preview:</p>
            <div className="border border-slate-200 rounded-lg overflow-auto bg-slate-50 p-4">
              <img
                src={previewUrl}
                alt="Rendered geometry"
                className="max-w-full h-auto"
              />
            </div>
          </div>
        )}

        {/* Information */}
        <div className="bg-blue-50 p-4 rounded-lg space-y-2">
          <p className="text-sm font-medium text-blue-900">Supported Geometry Types:</p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Point - rendered as filled circles</li>
            <li>• LineString - rendered as lines</li>
            <li>• Polygon - rendered with fill and stroke</li>
            <li>• Multi* types - all parts rendered</li>
          </ul>
        </div>

        {/* Output Info */}
        <div className="bg-slate-50 p-4 rounded-lg space-y-2">
          <p className="text-sm font-medium text-slate-900">Output Format:</p>
          <p className="text-sm text-slate-600">
            PNG image (800x600 pixels) with automatic bounds calculation and padding
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
