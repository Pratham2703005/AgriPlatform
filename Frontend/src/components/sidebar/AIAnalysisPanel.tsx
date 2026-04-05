import React from 'react';
import { Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import type { HeatmapData } from '@/types/farm';

interface AIAnalysisPanelProps {
  heatmapData: HeatmapData;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({
  heatmapData,
  onRefresh,
  isLoading = false,
}) => {
  return (
    <div className="space-y-4">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-neutral-900">AI Field Analysis</h3>
          <p className="text-xs text-neutral-600 mt-1">Satellite-based crop health assessment</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="btn-secondary text-xs p-2"
          title="Refresh analysis"
        >
          <Activity className="h-4 w-4" />
        </button>
      </div>

      {/* Overall Assessment */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
        <h4 className="font-semibold text-blue-900 text-sm mb-2">Overall Assessment</h4>
        <p className="text-sm text-blue-800 leading-relaxed">{heatmapData.suggestions.overall_assessment}</p>
      </div>

      {/* Yield Prediction Card */}
      <div className="bg-white rounded-lg p-3 border border-neutral-200">
        <h4 className="font-semibold text-neutral-900 text-sm mb-3 flex items-center">
          <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
          Yield Prediction
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-neutral-600">Predicted:</span>
            <span className="text-sm font-semibold text-green-700">{heatmapData.predicted_yield.toFixed(2)} tons</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-neutral-600">Previous:</span>
            <span className="text-sm font-semibold text-neutral-700">{heatmapData.old_yield.toFixed(2)} tons</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-neutral-200">
            <span className="text-xs text-neutral-600">Change:</span>
            <span className={`text-sm font-semibold flex items-center ${heatmapData.growth.percentage >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {heatmapData.growth.percentage >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {heatmapData.growth.percentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Field Health Distribution */}
      <div className="bg-white rounded-lg p-3 border border-neutral-200">
        <h4 className="font-semibold text-neutral-900 text-sm mb-3">Field Health</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs flex items-center">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2"></div>
              Healthy
            </span>
            <span className="text-sm font-semibold text-green-700">
              {((heatmapData.pixel_counts.green / heatmapData.pixel_counts.valid) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs flex items-center">
              <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full mr-2"></div>
              Moderate
            </span>
            <span className="text-sm font-semibold text-yellow-700">
              {((heatmapData.pixel_counts.yellow / heatmapData.pixel_counts.valid) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs flex items-center">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full mr-2"></div>
              Stressed
            </span>
            <span className="text-sm font-semibold text-red-700">
              {((heatmapData.pixel_counts.red / heatmapData.pixel_counts.valid) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-3">
        {heatmapData.suggestions.field_management.length > 0 && (
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <h4 className="font-semibold text-green-900 text-sm mb-2 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Field Management
            </h4>
            <ul className="text-xs text-green-800 space-y-1">
              {heatmapData.suggestions.field_management.map((item, index) => (
                <li key={index} className="list-disc list-inside">{item}</li>
              ))}
            </ul>
          </div>
        )}

        {heatmapData.suggestions.soil_recommendations.length > 0 && (
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <h4 className="font-semibold text-amber-900 text-sm mb-2 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Soil Recommendations
            </h4>
            <ul className="text-xs text-amber-800 space-y-1">
              {heatmapData.suggestions.soil_recommendations.map((item, index) => (
                <li key={index} className="list-disc list-inside">{item}</li>
              ))}
            </ul>
          </div>
        )}

        {heatmapData.suggestions.immediate_actions.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <h4 className="font-semibold text-blue-900 text-sm mb-2 flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Immediate Actions
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              {heatmapData.suggestions.immediate_actions.map((item, index) => (
                <li key={index} className="list-disc list-inside">{item}</li>
              ))}
            </ul>
          </div>
        )}

        {heatmapData.suggestions.seasonal_planning.length > 0 && (
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <h4 className="font-semibold text-purple-900 text-sm mb-2">Seasonal Planning</h4>
            <ul className="text-xs text-purple-800 space-y-1">
              {heatmapData.suggestions.seasonal_planning.map((item, index) => (
                <li key={index} className="list-disc list-inside">{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
