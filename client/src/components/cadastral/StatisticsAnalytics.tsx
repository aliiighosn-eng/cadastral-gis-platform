import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StatisticsData {
  region: string;
  totalObjects: number;
  averageValue: number;
  totalValue: number;
  byType: Array<{ type: string; count: number; value: number }>;
  trends: Array<{ month: string; count: number; value: number }>;
}

export default function StatisticsAnalytics() {
  const [region, setRegion] = useState('78');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StatisticsData | null>(null);
  const [error, setError] = useState('');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  const regions = [
    { id: '78', name: 'Saint Petersburg' },
    { id: '47', name: 'Leningrad Oblast' },
    { id: '54', name: 'Novgorod Oblast' },
  ];

  useEffect(() => {
    loadStatistics();
  }, [region]);

  const loadStatistics = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/cadastral/statistics?region=${region}`);
      
      if (!response.ok) {
        throw new Error('Failed to load statistics');
      }

      const statsData = await response.json();
      setData(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/cadastral/statistics/export?region=${region}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cadastral_statistics_${region}.xlsx`;
      a.click();
    } catch (err) {
      setError('Failed to export statistics');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Cadastral Statistics & Analytics</CardTitle>
          <CardDescription>
            Generate statistical reports on cadastral data by region
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Region</label>
              <Select value={region} onValueChange={setRegion} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
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
              <label className="text-sm font-medium">Chart Type</label>
              <Select value={chartType} onValueChange={(v) => setChartType(v as 'bar' | 'line')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={loadStatistics} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <BarChart3 className="mr-2 h-4 w-4" />
                Refresh Statistics
              </>
            )}
          </Button>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {data && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-slate-500">Total Objects</p>
                <p className="text-2xl font-bold">{data.totalObjects.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-slate-500">Average Value</p>
                <p className="text-2xl font-bold">₽{(data.averageValue / 1000000).toFixed(1)}M</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-slate-500">Total Value</p>
                <p className="text-2xl font-bold">₽{(data.totalValue / 1000000000).toFixed(1)}B</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-slate-500">Region</p>
                <p className="text-2xl font-bold">{data.region}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Objects by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.byType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3b82f6" name="Count" />
                  <Bar dataKey="value" fill="#10b981" name="Total Value (₽)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trends (Last 12 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                {chartType === 'bar' ? (
                  <BarChart data={data.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#3b82f6" name="New Objects" />
                  </BarChart>
                ) : (
                  <LineChart data={data.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" name="New Objects" />
                    <Line type="monotone" dataKey="value" stroke="#10b981" name="Total Value" />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Button onClick={handleExport} className="w-full">
            Export Statistics Report
          </Button>
        </>
      )}
    </div>
  );
}
