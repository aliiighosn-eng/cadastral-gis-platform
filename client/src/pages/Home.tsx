import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Database, BarChart3, Zap } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gazprom Proekt</h1>
            <p className="text-sm text-slate-600">Cadastral Service Platform</p>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-slate-600">Welcome, {user?.name}</span>
                <Button variant="outline" onClick={() => logout()}>
                  Logout
                </Button>
              </>
            ) : (
              <Button onClick={() => window.location.href = getLoginUrl()}>
                Login
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <h2 className="text-5xl font-bold text-slate-900 mb-4">
            Comprehensive GIS and Cadastral Data Processing
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Automate geospatial workflows, analyze land parcels, and predict property values with advanced GIS tools.
          </p>
          {isAuthenticated && (
            <Button
              size="lg"
              onClick={() => setLocation("/dashboard")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Go to Dashboard
            </Button>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader>
              <MapPin className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle>Coordinate Export</CardTitle>
              <CardDescription>Transform and export coordinates</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Read .dxf, .geojson, .tab files and export to Excel with coordinate transformations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Database className="w-8 h-8 text-green-600 mb-2" />
              <CardTitle>Land Assessment</CardTitle>
              <CardDescription>Calculate spatial metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Compute compactness, elongation, and roundness coefficients for land plots
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="w-8 h-8 text-purple-600 mb-2" />
              <CardTitle>Regression Model</CardTitle>
              <CardDescription>Predict cadastral values</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Build linear regression models for IZHS land valuation with R² metrics
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="w-8 h-8 text-orange-600 mb-2" />
              <CardTitle>Pricing Factors</CardTitle>
              <CardDescription>Analyze proximity factors</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Calculate water proximity, center distance, and population density factors
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features List */}
        <div className="bg-white rounded-lg border border-slate-200 p-8 mb-12">
          <h3 className="text-2xl font-bold text-slate-900 mb-6">Key Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Geospatial Processing</h4>
              <ul className="space-y-2 text-slate-600">
                <li>✓ Coordinate transformations (MSK-64, EPSG:3857, EPSG:4326)</li>
                <li>✓ GIS layer merging with attribute handling</li>
                <li>✓ Geometry rendering to PNG images</li>
                <li>✓ Spatial analysis and calculations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Data Integration</h4>
              <ul className="space-y-2 text-slate-600">
                <li>✓ RGIS parser for cadastral data</li>
                <li>✓ CIAN scraper for market data</li>
                <li>✓ Forward and reverse geocoding</li>
                <li>✓ Telegram bot interface</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-12 text-white text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-lg mb-8 opacity-90">
            Access all GIS processing tools and cadastral data workflows
          </p>
          {isAuthenticated ? (
            <Button
              size="lg"
              onClick={() => setLocation("/dashboard")}
              className="bg-white text-blue-600 hover:bg-slate-100"
            >
              Open Dashboard
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-white text-blue-600 hover:bg-slate-100"
            >
              Sign In to Continue
            </Button>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p>&copy; 2026 Gazprom Proekt. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
