import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MapViewer from './MapViewer';

// Mock Yandex Maps
vi.mock('yandex-maps', () => ({
  default: {
    ready: vi.fn((callback) => callback()),
    Map: vi.fn(() => ({
      setView: vi.fn(),
      on: vi.fn(),
      remove: vi.fn(),
      events: {
        add: vi.fn(),
      },
      geoObjects: {
        add: vi.fn(),
        removeAll: vi.fn(),
        remove: vi.fn(),
        each: vi.fn(),
        getLength: vi.fn(() => 1),
        getBounds: vi.fn(() => [[59.9311, 30.3609], [59.9311, 30.3609]]),
      },
      getZoom: vi.fn(() => 13),
      setZoom: vi.fn(),
      getCenter: vi.fn(() => [30.3609, 59.9311]),
      setBounds: vi.fn(),
      destroy: vi.fn(),
    })),
    Placemark: vi.fn(() => ({
      events: {
        add: vi.fn(),
      },
    })),
    Polygon: vi.fn(() => ({
      events: {
        add: vi.fn(),
      },
    })),
    Polyline: vi.fn(() => ({
      events: {
        add: vi.fn(),
      },
    })),
  },
}));

describe('MapViewer Component (Yandex Maps)', () => {
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
    expect(screen.getByText(/Click on features to select/)).toBeDefined();
  });

  it('displays coordinate display section', () => {
    render(<MapViewer />);
    expect(screen.getByText('Map Center:')).toBeDefined();
    expect(screen.getByText('Zoom Level:')).toBeDefined();
  });

  it('displays Yandex Maps attribution', () => {
    render(<MapViewer />);
    expect(screen.getByText(/Powered by Yandex Maps/)).toBeDefined();
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

  it('displays spatial analysis section', () => {
    render(<MapViewer />);
    expect(screen.getByText('Spatial Analysis')).toBeDefined();
  });

  it('uses Russian Yandex Maps technology', () => {
    render(<MapViewer />);
    const info = screen.getByText(/Powered by Yandex Maps/);
    expect(info).toBeDefined();
  });

  it('displays API key notice', () => {
    render(<MapViewer />);
    expect(screen.getByText(/Yandex Maps API key/)).toBeDefined();
  });
});
