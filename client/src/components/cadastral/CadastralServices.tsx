import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Import existing geospatial components
import CoordinateExporter from '@/components/gis/CoordinateExporter';
import LandAssessment from '@/components/gis/LandAssessment';
import GISMerger from '@/components/gis/GISMerger';
import PricingFactors from '@/components/gis/PricingFactors';
import RegressionModel from '@/components/gis/RegressionModel';
import GeometryRenderer from '@/components/gis/GeometryRenderer';
import MapTab from '@/components/gis/MapTab';

// Import new cadastral components
import CadastralNumberLookup from './CadastralNumberLookup';
import ObjectClassification from './ObjectClassification';
import ValueAssessment from './ValueAssessment';
import TaxCalculator from './TaxCalculator';
import StatisticsAnalytics from './StatisticsAnalytics';

interface Service {
  id: string;
  name: string;
  description: string;
  category: 'geospatial' | 'cadastral';
  component: React.ComponentType;
  status: 'implemented' | 'planned';
}

const services: Service[] = [
  // Existing Geospatial Services
  {
    id: 'coordinate-exporter',
    name: 'Coordinate Exporter',
    description: 'Transform and export coordinates (MSK-64, EPSG:3857, EPSG:4326)',
    category: 'geospatial',
    component: CoordinateExporter,
    status: 'implemented',
  },
  {
    id: 'land-assessment',
    name: 'Land Use Assessment',
    description: 'Calculate compactness, elongation, roundness coefficients',
    category: 'geospatial',
    component: LandAssessment,
    status: 'implemented',
  },
  {
    id: 'gis-merger',
    name: 'GIS Layer Merger',
    description: 'Merge multiple GeoJSON layers with attribute harmonization',
    category: 'geospatial',
    component: GISMerger,
    status: 'implemented',
  },
  {
    id: 'geometry-renderer',
    name: 'Geometry Renderer',
    description: 'Render GeoJSON to PNG/SVG images',
    category: 'geospatial',
    component: GeometryRenderer,
    status: 'implemented',
  },
  {
    id: 'pricing-factors',
    name: 'Pricing Factor Calculator',
    description: 'Water proximity, center distance, population density analysis',
    category: 'geospatial',
    component: PricingFactors,
    status: 'implemented',
  },
  {
    id: 'regression-model',
    name: 'Cadastral Regression Model',
    description: 'Linear regression for property valuation',
    category: 'geospatial',
    component: RegressionModel,
    status: 'implemented',
  },
  {
    id: 'map-viewer',
    name: 'Interactive Map Viewer',
    description: 'Real-time visualization with Yandex Maps',
    category: 'geospatial',
    component: MapTab,
    status: 'implemented',
  },

  // New Cadastral Services
  {
    id: 'cadastral-lookup',
    name: 'Cadastral Number Lookup',
    description: 'Search and validate cadastral numbers with format verification',
    category: 'cadastral',
    component: CadastralNumberLookup,
    status: 'implemented',
  },
  {
    id: 'object-classification',
    name: 'Object Classification',
    description: 'Classify cadastral objects by type (land plot, building, room)',
    category: 'cadastral',
    component: ObjectClassification,
    status: 'implemented',
  },
  {
    id: 'value-assessment',
    name: 'Cadastral Value Assessment',
    description: 'Calculate cadastral value for IZHS properties',
    category: 'cadastral',
    component: ValueAssessment,
    status: 'implemented',
  },
  {
    id: 'tax-calculator',
    name: 'Tax Assessment Calculator',
    description: 'Calculate property taxes based on cadastral value',
    category: 'cadastral',
    component: TaxCalculator,
    status: 'implemented',
  },
  {
    id: 'statistics',
    name: 'Statistics & Analytics',
    description: 'Generate statistical reports on cadastral data',
    category: 'cadastral',
    component: StatisticsAnalytics,
    status: 'implemented',
  },
];

export default function CadastralServices() {
  const [activeTab, setActiveTab] = useState('overview');

  const geospatialServices = services.filter((s) => s.category === 'geospatial');
  const cadastralServices = services.filter((s) => s.category === 'cadastral');

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Gazprom Proekt Services</h1>
        <p className="text-slate-600">
          Comprehensive platform with {services.length} integrated geospatial and cadastral services
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="geospatial">
            Geospatial ({geospatialServices.length})
          </TabsTrigger>
          <TabsTrigger value="cadastral">
            Cadastral ({cadastralServices.length})
          </TabsTrigger>
          <TabsTrigger value="all">All Services</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Overview</CardTitle>
              <CardDescription>
                Gazprom Proekt provides {services.length} integrated services for GIS and cadastral workflows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-sm text-slate-600">Geospatial Services</p>
                  <p className="text-3xl font-bold text-blue-600">{geospatialServices.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Coordinate, mapping, analysis</p>
                </div>
                <div className="rounded-lg bg-green-50 p-4">
                  <p className="text-sm text-slate-600">Cadastral Services</p>
                  <p className="text-3xl font-bold text-green-600">{cadastralServices.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Valuation, compliance, reporting</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Service Categories</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                    <span className="text-sm">Geospatial & Mapping</span>
                    <Badge variant="outline">7 services</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                    <span className="text-sm">Cadastral Data & Verification</span>
                    <Badge variant="outline">3 services</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                    <span className="text-sm">Valuation & Assessment</span>
                    <Badge variant="outline">2 services</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geospatial" className="space-y-4">
          {geospatialServices.map((service) => (
            <div key={service.id}>
              <service.component />
            </div>
          ))}
        </TabsContent>

        <TabsContent value="cadastral" className="space-y-4">
          {cadastralServices.map((service) => (
            <div key={service.id}>
              <service.component />
            </div>
          ))}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Available Services</CardTitle>
              <CardDescription>
                Complete list of {services.length} services available in Gazprom Proekt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-start justify-between rounded-lg border p-3 hover:bg-slate-50"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-slate-600">{service.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={service.category === 'geospatial' ? 'default' : 'secondary'}
                      >
                        {service.category}
                      </Badge>
                      <Badge variant={service.status === 'implemented' ? 'outline' : 'secondary'}>
                        {service.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
