import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, BarChart3, Map, Zap, Database } from 'lucide-react';
import CoordinateExporter from '@/components/gis/CoordinateExporter';
import LandAssessment from '@/components/gis/LandAssessment';
import GISMerger from '@/components/gis/GISMerger';
import PricingFactors from '@/components/gis/PricingFactors';
import RegressionModel from '@/components/gis/RegressionModel';
import GeometryRenderer from '@/components/gis/GeometryRenderer';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Gazprom Proekt Cadastral Service
          </h1>
          <p className="text-lg text-slate-600">
            Comprehensive GIS and real estate data processing platform
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                Active Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                Processed Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                Cadastral Parcels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                Market Data Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">0</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="assessment">Assessment</TabsTrigger>
            <TabsTrigger value="merger">Merger</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="regression">Regression</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Features Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Core Features
                  </CardTitle>
                  <CardDescription>
                    Available GIS processing tools
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                    <div>
                      <p className="font-medium text-slate-900">Coordinate Exporter</p>
                      <p className="text-sm text-slate-600">Transform and export coordinates to Excel</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                    <div>
                      <p className="font-medium text-slate-900">Land Assessment</p>
                      <p className="text-sm text-slate-600">Calculate spatial metrics and coefficients</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                    <div>
                      <p className="font-medium text-slate-900">GIS Layer Merger</p>
                      <p className="text-sm text-slate-600">Aggregate multiple GeoJSON layers</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                    <div>
                      <p className="font-medium text-slate-900">Pricing Factors</p>
                      <p className="text-sm text-slate-600">Calculate proximity and density factors</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Sources */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Data Integration
                  </CardTitle>
                  <CardDescription>
                    Connected data sources
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                    <div>
                      <p className="font-medium text-slate-900">RGIS Parser</p>
                      <p className="text-sm text-slate-600">Regional Geographic Information System</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 mt-2"></div>
                    <div>
                      <p className="font-medium text-slate-900">CIAN Scraper</p>
                      <p className="text-sm text-slate-600">Real estate market data collection</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2"></div>
                    <div>
                      <p className="font-medium text-slate-900">Geocoding</p>
                      <p className="text-sm text-slate-600">Address to coordinate conversion</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-pink-500 mt-2"></div>
                    <div>
                      <p className="font-medium text-slate-900">Regression Model</p>
                      <p className="text-sm text-slate-600">Cadastral value prediction</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Start Guide */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Start Guide</CardTitle>
                <CardDescription>
                  Get started with the Gazprom Proekt service
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-700">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Upload GIS Files</p>
                      <p className="text-sm text-slate-600">
                        Use the Export tab to upload .dxf, .geojson, or .tab files
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center font-semibold text-green-700">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Select Processing Tool</p>
                      <p className="text-sm text-slate-600">
                        Choose the appropriate analysis tool for your workflow
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center font-semibold text-purple-700">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Configure Parameters</p>
                      <p className="text-sm text-slate-600">
                        Set coordinate systems, colors, and other options
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-semibold text-orange-700">
                      4
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Download Results</p>
                      <p className="text-sm text-slate-600">
                        Export processed data in your preferred format
                      </p>
                    </div>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export">
            <CoordinateExporter />
          </TabsContent>

          {/* Assessment Tab */}
          <TabsContent value="assessment">
            <LandAssessment />
          </TabsContent>

          {/* Merger Tab */}
          <TabsContent value="merger">
            <GISMerger />
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing">
            <PricingFactors />
          </TabsContent>

          {/* Regression Tab */}
          <TabsContent value="regression">
            <RegressionModel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
