import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SpatialAnalysis from './SpatialAnalysis';

describe('SpatialAnalysis Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders component with title', () => {
    render(<SpatialAnalysis />);
    expect(screen.getByText('Spatial Analysis Tools')).toBeDefined();
  });

  it('displays buffer zone analysis section', () => {
    render(<SpatialAnalysis />);
    expect(screen.getByText('Buffer Zone Analysis')).toBeDefined();
  });

  it('displays intersection detection section', () => {
    render(<SpatialAnalysis />);
    expect(screen.getByText('Intersection Detection')).toBeDefined();
  });

  it('displays union operation section', () => {
    render(<SpatialAnalysis />);
    expect(screen.getByText('Union Operation')).toBeDefined();
  });

  it('renders distance input field', () => {
    render(<SpatialAnalysis />);
    const distanceInput = screen.getByDisplayValue('100');
    expect(distanceInput).toBeDefined();
  });

  it('renders unit selector', () => {
    render(<SpatialAnalysis />);
    expect(screen.getByText('Unit')).toBeDefined();
  });

  it('renders threshold input field', () => {
    render(<SpatialAnalysis />);
    const thresholdInput = screen.getByDisplayValue('50');
    expect(thresholdInput).toBeDefined();
  });

  it('calls onBufferCreate callback when Create Buffer button is clicked', () => {
    const onBufferCreate = vi.fn();
    render(<SpatialAnalysis onBufferCreate={onBufferCreate} />);

    const createButton = screen.getByText('Create Buffer');
    fireEvent.click(createButton);

    expect(onBufferCreate).toHaveBeenCalledWith(100, 'meters');
  });

  it('calls onIntersectionAnalyze callback when Analyze Intersections button is clicked', () => {
    const onIntersectionAnalyze = vi.fn();
    render(<SpatialAnalysis onIntersectionAnalyze={onIntersectionAnalyze} />);

    const analyzeButton = screen.getByText('Analyze Intersections');
    fireEvent.click(analyzeButton);

    expect(onIntersectionAnalyze).toHaveBeenCalledWith(50);
  });

  it('calls onUnionCreate callback when Create Union Geometry button is clicked', () => {
    const onUnionCreate = vi.fn();
    render(<SpatialAnalysis onUnionCreate={onUnionCreate} />);

    const unionButton = screen.getByText('Create Union Geometry');
    fireEvent.click(unionButton);

    expect(onUnionCreate).toHaveBeenCalled();
  });

  it('displays error message for invalid buffer distance', () => {
    render(<SpatialAnalysis />);

    // Change distance to invalid value
    const distanceInput = screen.getByDisplayValue('100') as HTMLInputElement;
    fireEvent.change(distanceInput, { target: { value: '-10' } });

    const createButton = screen.getByText('Create Buffer');
    fireEvent.click(createButton);

    expect(screen.getByText(/Error: Invalid buffer distance/)).toBeDefined();
  });

  it('displays error message for invalid threshold', () => {
    render(<SpatialAnalysis />);

    // Change threshold to invalid value
    const thresholdInput = screen.getByDisplayValue('50') as HTMLInputElement;
    fireEvent.change(thresholdInput, { target: { value: '-5' } });

    const analyzeButton = screen.getByText('Analyze Intersections');
    fireEvent.click(analyzeButton);

    expect(screen.getByText(/Error: Invalid threshold value/)).toBeDefined();
  });

  it('displays analysis result message', () => {
    render(<SpatialAnalysis />);

    const createButton = screen.getByText('Create Buffer');
    fireEvent.click(createButton);

    expect(screen.getByText(/Buffer created: 100 meters/)).toBeDefined();
  });

  it('displays spatial operations guide', () => {
    render(<SpatialAnalysis />);
    expect(screen.getByText('Spatial Operations Guide:')).toBeDefined();
    expect(screen.getByText(/Creates zones at specified distance/)).toBeDefined();
  });

  it('updates buffer distance when input changes', () => {
    render(<SpatialAnalysis />);

    const distanceInput = screen.getByDisplayValue('100') as HTMLInputElement;
    fireEvent.change(distanceInput, { target: { value: '200' } });

    expect(distanceInput.value).toBe('200');
  });

  it('updates threshold when input changes', () => {
    render(<SpatialAnalysis />);

    const thresholdInput = screen.getByDisplayValue('50') as HTMLInputElement;
    fireEvent.change(thresholdInput, { target: { value: '75' } });

    expect(thresholdInput.value).toBe('75');
  });
});
