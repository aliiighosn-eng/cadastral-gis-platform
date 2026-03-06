"""
Regression model for cadastral value prediction.
Implements linear regression for land valuation with quality metrics.
"""

from typing import Dict, List, Tuple

import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


class CadastralRegressionModel:
    """Linear regression model for cadastral value prediction."""

    def __init__(self, region: str = "Saint Petersburg"):
        """
        Initialize regression model.

        Args:
            region: Geographic region for model
        """
        self.region = region
        self.model = None
        self.feature_names = []
        self.coefficients = {}
        self.intercept = 0.0
        self.r_squared = 0.0
        self.rmse = 0.0
        self.mae = 0.0

    def train(self, X: np.ndarray, y: np.ndarray, feature_names: List[str]) -> Dict:
        """
        Train regression model.

        Args:
            X: Feature matrix (n_samples, n_features)
            y: Target values (cadastral values)
            feature_names: Names of features

        Returns:
            Dictionary with model metrics
        """
        try:
            self.model = LinearRegression()
            self.model.fit(X, y)

            # Store feature names
            self.feature_names = feature_names

            # Store coefficients
            self.coefficients = {
                name: float(coef) for name, coef in zip(feature_names, self.model.coef_)
            }
            self.intercept = float(self.model.intercept_)

            # Calculate metrics
            y_pred = self.model.predict(X)
            self.r_squared = float(r2_score(y, y_pred))
            self.rmse = float(np.sqrt(mean_squared_error(y, y_pred)))
            self.mae = float(mean_absolute_error(y, y_pred))

            return {
                "r_squared": self.r_squared,
                "rmse": self.rmse,
                "mae": self.mae,
                "samples": len(X),
                "features": len(feature_names),
            }
        except Exception as e:
            raise ValueError(f"Model training failed: {str(e)}")

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Predict cadastral values.

        Args:
            X: Feature matrix

        Returns:
            Predicted values
        """
        if self.model is None:
            raise ValueError("Model not trained")
        return self.model.predict(X)

    def predict_single(self, features: Dict) -> float:
        """
        Predict value for single sample.

        Args:
            features: Dictionary of feature values

        Returns:
            Predicted cadastral value
        """
        if self.model is None:
            raise ValueError("Model not trained")

        # Create feature vector in correct order
        X = np.array([[features.get(name, 0) for name in self.feature_names]])
        return float(self.model.predict(X)[0])

    def get_formula(self) -> str:
        """
        Get model formula as string.

        Returns:
            Formula string (e.g., "y = 1000 + 50*x1 + 30*x2 - 20*x3")
        """
        if self.model is None:
            return ""

        formula_parts = [f"{self.intercept:.2f}"]

        for name, coef in self.coefficients.items():
            sign = "+" if coef >= 0 else "-"
            formula_parts.append(f"{sign} {abs(coef):.4f}*{name}")

        return f"y = {formula_parts[0]} {' '.join(formula_parts[1:])}"

    def get_model_data(self) -> Dict:
        """Get model data for storage."""
        return {
            "region": self.region,
            "intercept": self.intercept,
            "coefficients": self.coefficients,
            "feature_names": self.feature_names,
            "r_squared": self.r_squared,
            "rmse": self.rmse,
            "mae": self.mae,
            "formula": self.get_formula(),
        }

    def load_model_data(self, data: Dict) -> None:
        """Load model from stored data."""
        self.region = data.get("region", "")
        self.intercept = data.get("intercept", 0.0)
        self.coefficients = data.get("coefficients", {})
        self.feature_names = data.get("feature_names", [])
        self.r_squared = data.get("r_squared", 0.0)
        self.rmse = data.get("rmse", 0.0)
        self.mae = data.get("mae", 0.0)

        # Reconstruct sklearn model
        self.model = LinearRegression()
        self.model.coef_ = np.array([self.coefficients.get(name, 0) for name in self.feature_names])
        self.model.intercept_ = self.intercept


class ModelValidator:
    """Validates regression model quality."""

    @staticmethod
    def validate_r_squared(r_squared: float, min_threshold: float = 0.6) -> Tuple[bool, str]:
        """
        Validate R² metric.

        Args:
            r_squared: R² value
            min_threshold: Minimum acceptable R² (default: 0.6)

        Returns:
            Tuple of (is_valid, message)
        """
        if r_squared >= min_threshold:
            return True, f"R² = {r_squared:.4f} (Good fit)"
        else:
            return False, f"R² = {r_squared:.4f} (Below threshold {min_threshold})"

    @staticmethod
    def validate_residuals(y_true: np.ndarray, y_pred: np.ndarray) -> Dict:
        """
        Validate residuals for model quality.

        Args:
            y_true: True values
            y_pred: Predicted values

        Returns:
            Dictionary with residual statistics
        """
        residuals = y_true - y_pred

        return {
            "mean_residual": float(np.mean(residuals)),
            "std_residual": float(np.std(residuals)),
            "min_residual": float(np.min(residuals)),
            "max_residual": float(np.max(residuals)),
            "median_residual": float(np.median(residuals)),
        }

    @staticmethod
    def cross_validate(
        X: np.ndarray, y: np.ndarray, feature_names: List[str], n_splits: int = 5
    ) -> Dict:
        """
        Perform k-fold cross-validation.

        Args:
            X: Feature matrix
            y: Target values
            feature_names: Feature names
            n_splits: Number of folds

        Returns:
            Dictionary with cross-validation results
        """
        from sklearn.model_selection import cross_val_score

        model = LinearRegression()
        scores = cross_val_score(model, X, y, cv=n_splits, scoring="r2")

        return {
            "mean_r2": float(np.mean(scores)),
            "std_r2": float(np.std(scores)),
            "fold_scores": [float(s) for s in scores],
        }


class FeatureEngineer:
    """Prepares features for regression model."""

    @staticmethod
    def normalize_features(X: np.ndarray) -> Tuple[np.ndarray, Dict]:
        """
        Normalize features to 0-1 scale.

        Args:
            X: Feature matrix

        Returns:
            Tuple of (normalized_X, normalization_params)
        """
        min_vals = np.min(X, axis=0)
        max_vals = np.max(X, axis=0)

        # Avoid division by zero
        ranges = np.where(max_vals - min_vals != 0, max_vals - min_vals, 1)

        X_normalized = (X - min_vals) / ranges

        return X_normalized, {
            "min": min_vals.tolist(),
            "max": max_vals.tolist(),
            "ranges": ranges.tolist(),
        }

    @staticmethod
    def create_polynomial_features(X: np.ndarray, degree: int = 2) -> Tuple[np.ndarray, List[str]]:
        """
        Create polynomial features.

        Args:
            X: Feature matrix
            degree: Polynomial degree

        Returns:
            Tuple of (new_X, new_feature_names)
        """
        from sklearn.preprocessing import PolynomialFeatures

        poly = PolynomialFeatures(degree=degree, include_bias=False)
        X_poly = poly.fit_transform(X)

        # Generate feature names
        feature_names = poly.get_feature_names_out()

        return X_poly, list(feature_names)

    @staticmethod
    def remove_outliers(
        X: np.ndarray, y: np.ndarray, threshold: float = 3.0
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Remove outliers using z-score method.

        Args:
            X: Feature matrix
            y: Target values
            threshold: Z-score threshold (default: 3.0)

        Returns:
            Tuple of (filtered_X, filtered_y)
        """
        from scipy import stats

        z_scores = np.abs(stats.zscore(y))
        mask = z_scores < threshold

        return X[mask], y[mask]
