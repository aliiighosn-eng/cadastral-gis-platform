"""
Geometry rendering utilities for creating raster images from GeoJSON.
Renders points, lines, and polygons to PNG/TIFF format.
"""

import json
from typing import Dict, List, Tuple

import numpy as np
from PIL import Image, ImageDraw
from shapely.geometry import shape


class GeometryRenderer:
    """Renders GIS geometries to raster images."""

    def __init__(
        self,
        width: int = 800,
        height: int = 600,
        background_color: str = "#FFFFFF",
        stroke_color: str = "#000000",
        fill_color: str = "#CCCCCC",
        stroke_width: int = 2,
    ):
        """
        Initialize renderer.

        Args:
            width: Image width in pixels
            height: Image height in pixels
            background_color: Background color (hex)
            stroke_color: Line stroke color (hex)
            fill_color: Fill color (hex)
            stroke_width: Line width in pixels
        """
        self.width = width
        self.height = height
        self.background_color = self.hex_to_rgb(background_color)
        self.stroke_color = self.hex_to_rgb(stroke_color)
        self.fill_color = self.hex_to_rgb(fill_color)
        self.stroke_width = stroke_width
        self.image = None
        self.draw = None
        self.bounds = None
        self.scale = 1.0

    @staticmethod
    def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
        """Convert hex color to RGB tuple."""
        hex_color = hex_color.lstrip("#")
        return tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))

    def create_image(self) -> Image.Image:
        """Create blank image."""
        return Image.new("RGB", (self.width, self.height), self.background_color)

    def calculate_bounds(self, geometries: List[Dict]) -> Dict:
        """Calculate bounding box for all geometries."""
        min_x, min_y = float("inf"), float("inf")
        max_x, max_y = float("-inf"), float("-inf")

        for geom_dict in geometries:
            try:
                geom = shape(geom_dict)
                bounds = geom.bounds
                min_x = min(min_x, bounds[0])
                min_y = min(min_y, bounds[1])
                max_x = max(max_x, bounds[2])
                max_y = max(max_y, bounds[3])
            except Exception:
                continue

        if min_x == float("inf"):
            return {"min_x": 0, "min_y": 0, "max_x": 1, "max_y": 1}

        # Add padding
        padding = 0.1
        width = max_x - min_x
        height = max_y - min_y
        min_x -= width * padding
        min_y -= height * padding
        max_x += width * padding
        max_y += height * padding

        return {
            "min_x": min_x,
            "min_y": min_y,
            "max_x": max_x,
            "max_y": max_y,
            "width": max_x - min_x,
            "height": max_y - min_y,
        }

    def project_coordinate(self, x: float, y: float) -> Tuple[int, int]:
        """Project geographic coordinate to image pixel."""
        if not self.bounds:
            return (0, 0)

        # Normalize to 0-1
        norm_x = (x - self.bounds["min_x"]) / self.bounds["width"]
        norm_y = (y - self.bounds["min_y"]) / self.bounds["height"]

        # Convert to pixel coordinates (flip Y for image coordinates)
        pixel_x = int(norm_x * self.width)
        pixel_y = int((1 - norm_y) * self.height)

        return (pixel_x, pixel_y)

    def render_point(self, geometry: Dict, radius: int = 5) -> None:
        """Render point geometry."""
        try:
            coords = geometry.get("coordinates", [])
            if len(coords) >= 2:
                pixel = self.project_coordinate(coords[0], coords[1])
                self.draw.ellipse(
                    [
                        (pixel[0] - radius, pixel[1] - radius),
                        (pixel[0] + radius, pixel[1] + radius),
                    ],
                    fill=self.fill_color,
                    outline=self.stroke_color,
                    width=self.stroke_width,
                )
        except Exception as e:
            print(f"Error rendering point: {str(e)}")

    def render_linestring(self, geometry: Dict) -> None:
        """Render linestring geometry."""
        try:
            coords = geometry.get("coordinates", [])
            if len(coords) < 2:
                return

            pixels = [self.project_coordinate(c[0], c[1]) for c in coords]
            self.draw.line(pixels, fill=self.stroke_color, width=self.stroke_width)
        except Exception as e:
            print(f"Error rendering linestring: {str(e)}")

    def render_polygon(self, geometry: Dict) -> None:
        """Render polygon geometry."""
        try:
            coords_list = geometry.get("coordinates", [])
            if not coords_list:
                return

            # Exterior ring
            exterior = coords_list[0]
            if len(exterior) < 3:
                return

            pixels = [self.project_coordinate(c[0], c[1]) for c in exterior]
            self.draw.polygon(pixels, fill=self.fill_color, outline=self.stroke_color)

            # Interior rings (holes)
            for interior in coords_list[1:]:
                if len(interior) >= 3:
                    hole_pixels = [
                        self.project_coordinate(c[0], c[1]) for c in interior
                    ]
                    self.draw.polygon(hole_pixels, fill=self.background_color)
        except Exception as e:
            print(f"Error rendering polygon: {str(e)}")

    def render_geometry(self, geometry: Dict) -> None:
        """Render any geometry type."""
        geom_type = geometry.get("type", "")

        if geom_type == "Point":
            self.render_point(geometry)
        elif geom_type == "LineString":
            self.render_linestring(geometry)
        elif geom_type == "Polygon":
            self.render_polygon(geometry)
        elif geom_type == "MultiPoint":
            for coords in geometry.get("coordinates", []):
                self.render_point({"type": "Point", "coordinates": coords})
        elif geom_type == "MultiLineString":
            for coords in geometry.get("coordinates", []):
                self.render_linestring({"type": "LineString", "coordinates": coords})
        elif geom_type == "MultiPolygon":
            for coords in geometry.get("coordinates", []):
                self.render_polygon({"type": "Polygon", "coordinates": coords})

    def render_geojson(self, geojson_data: Dict, output_path: str) -> str:
        """
        Render GeoJSON to image file.

        Args:
            geojson_data: GeoJSON FeatureCollection or Feature
            output_path: Path to save image

        Returns:
            Path to saved image
        """
        try:
            # Extract geometries
            geometries = []

            if geojson_data.get("type") == "FeatureCollection":
                for feature in geojson_data.get("features", []):
                    if "geometry" in feature:
                        geometries.append(feature["geometry"])
            elif geojson_data.get("type") == "Feature":
                if "geometry" in geojson_data:
                    geometries.append(geojson_data["geometry"])
            elif "type" in geojson_data and "coordinates" in geojson_data:
                geometries.append(geojson_data)

            if not geometries:
                raise ValueError("No geometries found in GeoJSON")

            # Calculate bounds
            self.bounds = self.calculate_bounds(geometries)

            # Create image
            self.image = self.create_image()
            self.draw = ImageDraw.Draw(self.image)

            # Render all geometries
            for geometry in geometries:
                self.render_geometry(geometry)

            # Save image
            self.image.save(output_path)
            return output_path

        except Exception as e:
            raise ValueError(f"Failed to render GeoJSON: {str(e)}")

    def render_file(self, input_path: str, output_path: str) -> str:
        """
        Render GeoJSON file to image.

        Args:
            input_path: Path to GeoJSON file
            output_path: Path to save image

        Returns:
            Path to saved image
        """
        try:
            with open(input_path, "r", encoding="utf-8") as f:
                geojson_data = json.load(f)

            return self.render_geojson(geojson_data, output_path)
        except Exception as e:
            raise ValueError(f"Failed to render file: {str(e)}")


class RasterInterpolator:
    """Interpolates point data to raster surface."""

    @staticmethod
    def inverse_distance_weighting(
        points: List[Tuple[float, float, float]],
        grid_size: int = 100,
        power: float = 2.0,
    ) -> np.ndarray:
        """
        Interpolate using Inverse Distance Weighting (IDW).

        Args:
            points: List of (x, y, value) tuples
            grid_size: Size of output grid
            power: Power parameter for IDW

        Returns:
            Interpolated grid as numpy array
        """
        try:
            if not points:
                return np.zeros((grid_size, grid_size))

            # Extract coordinates and values
            coords = np.array([(p[0], p[1]) for p in points])
            values = np.array([p[2] for p in points])

            # Create grid
            min_x, min_y = coords.min(axis=0)
            max_x, max_y = coords.max(axis=0)

            x = np.linspace(min_x, max_x, grid_size)
            y = np.linspace(min_y, max_y, grid_size)
            xx, yy = np.meshgrid(x, y)

            # Interpolate
            grid = np.zeros((grid_size, grid_size))

            for i in range(grid_size):
                for j in range(grid_size):
                    grid_point = np.array([xx[i, j], yy[i, j]])

                    # Calculate distances
                    distances = np.linalg.norm(coords - grid_point, axis=1)

                    # Handle zero distance
                    if np.any(distances == 0):
                        grid[i, j] = values[distances == 0].mean()
                    else:
                        # IDW formula
                        weights = 1 / (distances**power)
                        grid[i, j] = np.sum(weights * values) / np.sum(weights)

            return grid
        except Exception as e:
            print(f"IDW interpolation error: {str(e)}")
            return np.zeros((grid_size, grid_size))

    @staticmethod
    def save_grid_as_image(grid: np.ndarray, output_path: str) -> str:
        """
        Save interpolated grid as image.

        Args:
            grid: Numpy array grid
            output_path: Path to save image

        Returns:
            Path to saved image
        """
        try:
            # Normalize to 0-255
            normalized = ((grid - grid.min()) / (grid.max() - grid.min()) * 255).astype(
                np.uint8
            )

            # Create image
            image = Image.fromarray(normalized, mode="L")
            image = image.convert("RGB")

            # Apply colormap
            image.save(output_path)
            return output_path
        except Exception as e:
            raise ValueError(f"Failed to save grid: {str(e)}")
