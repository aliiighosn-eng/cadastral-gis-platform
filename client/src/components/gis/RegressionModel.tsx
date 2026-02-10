import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle, BarChart3 } from 'lucide-react';

export default function RegressionModel() {
  const [mode, setMode] = useState<'train' | 'predict'>('train');
  const [region, setRegion] = useState('Saint Petersburg');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [results, setResults] = useState<any>(null);
  const [modelId, setModelId] = useState<number | null>(null);

  // Training data
  const [trainingData, setTrainingData] = useState({
    features: [] as number[][],
    targets: [] as number[],
    featureNames: [] as string[],
  });

  // Prediction data
  const [predictionFeatures, setPredictionFeatures] = useState<Record<string, number>>({});

  const handleTrainModel = async () => {
    if (trainingData.features.length === 0) {
      setStatus('error');
      setMessage('Please provide training data');
      return;
    }

    setLoading(true);
    setStatus('idle');

    try {
      const response = await fetch('/api/regression/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          features: trainingData.features,
          targets: trainingData.targets,
          feature_names: trainingData.featureNames,
          region: region,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
        setModelId(data.model_id);
        setStatus('success');
        setMessage('Model trained successfully!');
      } else {
        const error = await response.json();
        setStatus('error');
        setMessage(error.detail || 'Training failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async () => {
    if (!modelId || Object.keys(predictionFeatures).length === 0) {
      setStatus('error');
      setMessage('Please train a model first and provide features');
      return;
    }

    setLoading(true);
    setStatus('idle');

    try {
      const response = await fetch('/api/regression/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_id: modelId,
          features: predictionFeatures,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
        setStatus('success');
        setMessage('Prediction completed successfully!');
      } else {
        const error = await response.json();
        setStatus('error');
        setMessage(error.detail || 'Prediction failed');
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
        <CardTitle>Cadastral Value Regression Model</CardTitle>
        <CardDescription>
          Build and use linear regression models for IZHS land valuation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mode Selection */}
        <div className="flex gap-4">
          <button
            onClick={() => setMode('train')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'train'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Train Model
          </button>
          <button
            onClick={() => setMode('predict')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'predict'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Make Prediction
          </button>
        </div>

        {/* Training Mode */}
        {mode === 'train' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-900">
                Region
              </label>
              <Input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g., Saint Petersburg"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium text-blue-900">Training Data Format:</p>
              <p className="text-sm text-blue-800">
                Provide training data as JSON with features (array of arrays), targets (array), and featureNames (array)
              </p>
              <pre className="text-xs bg-white p-2 rounded border border-blue-200 overflow-auto">
{`{
  "features": [[1, 2, 3], [4, 5, 6]],
  "targets": [100000, 150000],
  "featureNames": ["area", "distance", "density"]
}`}
              </pre>
            </div>

            <Button
              onClick={handleTrainModel}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Training...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Train Model
                </>
              )}
            </Button>
          </div>
        )}

        {/* Prediction Mode */}
        {mode === 'predict' && (
          <div className="space-y-4">
            {!modelId && (
              <div className="bg-yellow-50 p-4 rounded-lg text-sm text-yellow-800">
                Please train a model first using the Train Model tab
              </div>
            )}

            {modelId && (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-900">
                    Feature Values
                  </label>
                  <p className="text-sm text-slate-600">
                    Enter values for each feature used in the trained model
                  </p>
                </div>

                <Button
                  onClick={handlePredict}
                  disabled={!modelId || loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Predicting...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Make Prediction
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        )}

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

        {/* Results */}
        {results && (
          <div className="space-y-4 bg-slate-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-slate-900">Results</h3>

            {results.formula && (
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600 mb-2">Model Formula:</p>
                <p className="font-mono text-sm text-slate-900 break-all">
                  {results.formula}
                </p>
              </div>
            )}

            {results.metrics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600">R² Score</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {results.metrics.r_squared?.toFixed(4)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600">RMSE</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {results.metrics.rmse?.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600">Samples</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {results.metrics.samples}
                  </p>
                </div>
              </div>
            )}

            {results.predicted_value !== undefined && (
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-slate-600">Predicted Cadastral Value</p>
                <p className="text-3xl font-bold text-blue-600">
                  ₽{results.predicted_value?.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Model R²: {results.r_squared?.toFixed(4)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Information */}
        <div className="bg-blue-50 p-4 rounded-lg space-y-2">
          <p className="text-sm font-medium text-blue-900">Model Quality Metrics:</p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>R² Score:</strong> Coefficient of determination (target: {'>'} 0.6)</li>
            <li>• <strong>RMSE:</strong> Root Mean Squared Error - prediction accuracy</li>
            <li>• <strong>MAE:</strong> Mean Absolute Error - average prediction deviation</li>
            <li>• <strong>Formula:</strong> y = a0 + a1*x1 + a2*x2 + ... + an*xn</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
