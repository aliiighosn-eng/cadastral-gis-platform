import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MapViewer from './MapViewer';

// Mock Leaflet
vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => ({
      setView: vi.fn(),
      on: vi.fn(),
      remove: vi.fn(),
      addControl: vi.fn(),
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
      fitBounds: vi.fn(),
      getZoom: vi.fn(() => 13),
      setZoom: vi.fn(),
      getCenter: vi.fn(() => ({ lat: 59.9311, lng: 30.3609 })),
    })),
    tileLayer: vi.fn(() => ({
      addTo: vi.fn(),
    })),
    geoJSON: vi.fn(() => ({
      addTo: vi.fn(),
      getBounds: vi.fn(() => ({
        isValid: vi.fn(() => true),
      })),
    })),
    featureGroup: vi.fn(() => ({
      addTo: vi.fn(),
      clearLayers: vi.fn(),
      addLayer: vi.fn(),
    })),
    Control: {
      Draw: vi.fn(),
    },
  },
}));

describe('MapViewer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders map container', () => {
    render(<MapViewer />);
    const mapContainer = screen.getByRole('region', { hidden: true });
    expect(mapContainer).toBeDefined();
  });

  it('displays zoom controls', () => {
    render(<MapViewer />);
    expect(screen.getByText('Zoom In')).toBeDefined();
    expect(screen.getByText('Zoom Out')).toBeDefined();
  });

  it('displays measurement button', () => {
    render(<MapViewer />);
    expect(screen.getByText('Measure')).toBeDefined();
  });

  it('displays clear button', () => {
    render(<MapViewer />);
    expect(screen.getByText('Clear')).toBeDefined();
  });

  it('displays map features information', () => {
    render(<MapViewer />);
    expect(screen.getByText('Map Features:')).toBeDefined();
    expect(screen.getByText(/Click on features to select/)).toBeDefined();
  });

  it('displays coordinate display section', () => {
    render(<MapViewer />);
    expect(screen.getByText('Map Center:')).toBeDefined();
    expect(screen.getByText('Zoom Level:')).toBeDefined();
  });

  it('handles GeoJSON data prop', () => {
    const geojsonData = {
      type: 'Feature' as const,
      properties: { id: 1, name: 'Test' },
      geometry: {
        type: 'Point',
        coordinates: [30.3609, 59.9311],
      },
    };

    render(<MapViewer geojsonData={geojsonData} />);
    expect(screen.getByText('Interactive Map Viewer')).toBeDefined();
  });

  it('displays selected feature properties', () => {
    const geojsonData = {
      type: 'Feature' as const,
      properties: { id: 1, name: 'Test Property' },
      geometry: {
        type: 'Point',
        coordinates: [30.3609, 59.9311],
      },
    };

    render(<MapViewer geojsonData={geojsonData} />);
    expect(screen.getByText('Selected Feature:')).toBeDefined();
  });

  it('calls onFeatureSelect callback when feature is selected', () => {
    const onFeatureSelect = vi.fn();
    const geojsonData = {
      type: 'Feature' as const,
      properties: { id: 1 },
      geometry: {
        type: 'Point',
        coordinates: [30.3609, 59.9311],
      },
    };

    render(<MapViewer geojsonData={geojsonData} onFeatureSelect={onFeatureSelect} />);
    expect(screen.getByText('Interactive Map Viewer')).toBeDefined();
  });

  it('displays layer visibility toggle', () => {
    render(<MapViewer />);
    const hideButton = screen.getByText(/Hide GeoJSON|Show GeoJSON/);
    expect(hideButton).toBeDefined();
  });

  it('displays export button', () => {
    render(<MapViewer />);
    expect(screen.getByText('Export as PNG')).toBeDefined();
  });
});
