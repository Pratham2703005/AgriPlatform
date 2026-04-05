import React from 'react';
import { TrendingUp } from 'lucide-react';
import type { HeatmapData } from '@/types/farm';

interface NDVITrendsPanelProps {
  heatmapData: HeatmapData;
}

export const NDVITrendsPanel: React.FC<NDVITrendsPanelProps> = ({ heatmapData }) => {
  const healthyPercent = ((heatmapData.pixel_counts.green / heatmapData.pixel_counts.valid) * 100);
  const moderatePercent = ((heatmapData.pixel_counts.yellow / heatmapData.pixel_counts.valid) * 100);
  const stressedPercent = ((heatmapData.pixel_counts.red / heatmapData.pixel_counts.valid) * 100);

  const yieldChange = heatmapData.growth.percentage;
  const yieldRatio = heatmapData.growth.ratio;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="font-semibold text-neutral-900 flex items-center">
          <TrendingUp className="h-4 w-4 mr-2" />
          NDVI Trends
        </h3>
        <p className="text-xs text-neutral-600 mt-1">Crop health index progression</p>
      </div>

      {/* Health Distribution Visualization */}
      <div className="bg-white rounded-lg p-4 border border-neutral-200">
        <h4 className="text-sm font-semibold text-neutral-900 mb-3">Health Distribution</h4>
        
        {/* Stacked Bar Chart */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-neutral-600">Healthy Areas</span>
              <span className="text-xs font-semibold text-green-700">{healthyPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-green-500 h-full transition-all duration-300"
                style={{ width: `${healthyPercent}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-neutral-600">Moderate Health</span>
              <span className="text-xs font-semibold text-yellow-700">{moderatePercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-yellow-500 h-full transition-all duration-300"
                style={{ width: `${moderatePercent}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-neutral-600">Stressed Areas</span>
              <span className="text-xs font-semibold text-red-700">{stressedPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-red-500 h-full transition-all duration-300"
                style={{ width: `${stressedPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Yield Change Analysis */}
      <div className="bg-white rounded-lg p-4 border border-neutral-200">
        <h4 className="text-sm font-semibold text-neutral-900 mb-3">Yield Comparison</h4>
        
        <div className="space-y-3">
          <div>
            <p className="text-xs text-neutral-600 mb-1">Previous Yield</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-lg font-bold text-neutral-900">{heatmapData.old_yield.toFixed(2)}</span>
              <span className="text-xs text-neutral-600">tons</span>
            </div>
          </div>

          <div>
            <p className="text-xs text-neutral-600 mb-1">Predicted Yield</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-lg font-bold text-green-700">{heatmapData.predicted_yield.toFixed(2)}</span>
              <span className="text-xs text-neutral-600">tons</span>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-200">
            <p className="text-xs text-neutral-600 mb-1">Projected Change</p>
            <div className="flex items-baseline space-x-2">
              <span className={`text-lg font-bold ${yieldChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {yieldChange >= 0 ? '+' : ''}{yieldChange.toFixed(1)}%
              </span>
              <span className={`text-xs ${yieldChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ({yieldRatio.toFixed(2)}x multiplier)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="bg-white rounded-lg p-4 border border-neutral-200">
        <h4 className="text-sm font-semibold text-neutral-900 mb-3">Field Status</h4>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-600">Overall Health</span>
            <div className="flex items-center space-x-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{
                  backgroundColor:
                    healthyPercent > 60
                      ? '#22c55e'
                      : healthyPercent > 40
                        ? '#eab308'
                        : '#ef4444',
                }}
              />
              <span className="text-xs font-semibold text-neutral-700">
                {healthyPercent > 60 ? 'Excellent' : healthyPercent > 40 ? 'Good' : 'Monitor'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-600">Yield Trend</span>
            <div className="flex items-center space-x-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{
                  backgroundColor: yieldChange > 0 ? '#22c55e' : yieldChange === 0 ? '#eab308' : '#ef4444',
                }}
              />
              <span className="text-xs font-semibold text-neutral-700">
                {yieldChange > 0 ? 'Increasing' : yieldChange === 0 ? 'Stable' : 'Declining'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <p className="text-xs text-blue-800">
          💡 NDVI trends are calculated from satellite imagery. Regular monitoring helps detect changes early.
        </p>
      </div>
    </div>
  );
};
