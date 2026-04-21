import React from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Brain,
  ShieldAlert,
  Clock3,
  Target,
} from 'lucide-react';
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
  const ai = heatmapData.ai_analysis;
  const validPixels = heatmapData.pixel_counts.valid || 1;
  const suggestions = heatmapData.suggestions;
  const hasLegacySuggestions = !!suggestions;

  const chipClasses: Record<'Low' | 'Medium' | 'High', string> = {
    Low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Medium: 'bg-amber-100 text-amber-800 border-amber-200',
    High: 'bg-rose-100 text-rose-800 border-rose-200',
  };

  return (
    <div className='space-y-4'>
      {/* Header with Refresh Button */}
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h3 className='font-semibold text-neutral-900'>AI Field Analysis</h3>
          <p className='text-xs text-neutral-600 mt-1'>
            Satellite-based crop health assessment
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className='btn-secondary text-xs p-2'
          title='Refresh analysis'
        >
          <Activity className='h-4 w-4' />
        </button>
      </div>

      {!ai && (
        <div className='bg-red-50 rounded-lg p-3 border border-red-200'>
          <h4 className='font-semibold text-red-900 text-sm mb-2 flex items-center'>
            <ShieldAlert className='h-4 w-4 mr-2' />
            AI Analysis Unavailable
          </h4>
          <p className='text-xs text-red-800 leading-relaxed'>
            AI analysis did not return a valid response. Refresh after verifying
            NVIDIA_API_KEY and backend logs.
          </p>
        </div>
      )}

      {ai && (
        <>
          <div className='bg-gradient-to-r from-violet-50 to-indigo-50 rounded-lg p-3 border border-violet-200'>
            <div className='flex items-start justify-between gap-3 mb-2'>
              <h4 className='font-semibold text-violet-900 text-sm flex items-center'>
                <Brain className='h-4 w-4 mr-2' />
                AI Insight
              </h4>
              <span
                className={`text-[11px] font-semibold px-2 py-1 rounded-full border ${chipClasses[ai.priority]}`}
              >
                {ai.priority} Priority
              </span>
            </div>
            <p className='text-sm text-violet-900 leading-relaxed'>
              {ai.summary}
            </p>
            <div className='mt-3 grid grid-cols-3 gap-2 text-center'>
              <div className='rounded-md bg-white/70 p-2 border border-violet-100'>
                <p className='text-[10px] text-neutral-600'>Health</p>
                <p className='text-xs font-semibold text-violet-900'>
                  {ai.overall_health}
                </p>
              </div>
              <div className='rounded-md bg-white/70 p-2 border border-violet-100'>
                <p className='text-[10px] text-neutral-600'>Confidence</p>
                <p className='text-xs font-semibold text-violet-900'>
                  {ai.confidence}
                </p>
              </div>
              <div className='rounded-md bg-white/70 p-2 border border-violet-100'>
                <p className='text-[10px] text-neutral-600'>Risk Score</p>
                <p className='text-xs font-semibold text-violet-900'>
                  {ai.risk_score.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {ai.issues?.length > 0 && (
            <div className='bg-white rounded-lg p-3 border border-neutral-200'>
              <h4 className='font-semibold text-neutral-900 text-sm mb-3 flex items-center'>
                <AlertTriangle className='h-4 w-4 mr-2 text-amber-600' />
                Key Problems
              </h4>
              <div className='space-y-2'>
                {ai.issues.map(issue => (
                  <div
                    key={issue.id}
                    className='rounded-md border border-neutral-200 p-2'
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <p className='text-xs font-semibold text-neutral-900'>
                        {issue.name}
                      </p>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${chipClasses[issue.priority]}`}
                      >
                        {issue.priority}
                      </span>
                    </div>
                    <p className='text-xs text-neutral-600 mt-1'>
                      Affected area: {issue.affected_area_pct.toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ai.why_happening?.length > 0 && (
            <div className='bg-amber-50 rounded-lg p-3 border border-amber-200'>
              <h4 className='font-semibold text-amber-900 text-sm mb-2 flex items-center'>
                <Target className='h-4 w-4 mr-2' />
                Why This Is Happening
              </h4>
              <ul className='text-xs text-amber-800 space-y-1'>
                {ai.why_happening.map((item, index) => (
                  <li key={index} className='list-disc list-inside'>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {ai.immediate_actions?.length > 0 && (
            <div className='bg-blue-50 rounded-lg p-3 border border-blue-200'>
              <h4 className='font-semibold text-blue-900 text-sm mb-2 flex items-center'>
                <Clock3 className='h-4 w-4 mr-2' />
                Immediate Actions
              </h4>
              <ul className='text-xs text-blue-800 space-y-1'>
                {ai.immediate_actions.map((item, index) => (
                  <li key={index} className='list-disc list-inside'>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className='bg-rose-50 rounded-lg p-3 border border-rose-200'>
            <h4 className='font-semibold text-rose-900 text-sm mb-1 flex items-center'>
              <ShieldAlert className='h-4 w-4 mr-2' />
              Risk If Ignored
            </h4>
            <p className='text-xs text-rose-800'>{ai.risk_if_ignored}</p>
          </div>

          <div className='bg-emerald-50 rounded-lg p-3 border border-emerald-200'>
            <h4 className='font-semibold text-emerald-900 text-sm mb-1'>
              Simple Advice
            </h4>
            <p className='text-xs text-emerald-900 leading-relaxed'>
              {ai.simple_advice?.hi || ai.simple_advice?.en}
            </p>
          </div>
        </>
      )}

      {/* Overall Assessment */}
      <div className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200'>
        <h4 className='font-semibold text-blue-900 text-sm mb-2'>
          Overall Assessment
        </h4>
        <p className='text-sm text-blue-800 leading-relaxed'>
          {ai?.summary ||
            suggestions?.overall_assessment ||
            'Analysis summary is not available yet.'}
        </p>
      </div>

      {/* Yield Prediction Card */}
      <div className='bg-white rounded-lg p-3 border border-neutral-200'>
        <h4 className='font-semibold text-neutral-900 text-sm mb-3 flex items-center'>
          <TrendingUp className='h-4 w-4 mr-2 text-green-600' />
          Yield Prediction
        </h4>
        <div className='space-y-2'>
          <div className='flex justify-between'>
            <span className='text-xs text-neutral-600'>Predicted:</span>
            <span className='text-sm font-semibold text-green-700'>
              {heatmapData.predicted_yield.toFixed(2)} tons
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-xs text-neutral-600'>Previous:</span>
            <span className='text-sm font-semibold text-neutral-700'>
              {heatmapData.old_yield.toFixed(2)} tons
            </span>
          </div>
          <div className='flex justify-between items-center pt-2 border-t border-neutral-200'>
            <span className='text-xs text-neutral-600'>Change:</span>
            <span
              className={`text-sm font-semibold flex items-center ${heatmapData.growth.percentage >= 0 ? 'text-green-700' : 'text-red-700'}`}
            >
              {heatmapData.growth.percentage >= 0 ? (
                <TrendingUp className='h-3 w-3 mr-1' />
              ) : (
                <TrendingDown className='h-3 w-3 mr-1' />
              )}
              {heatmapData.growth.percentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Field Health Distribution */}
      <div className='bg-white rounded-lg p-3 border border-neutral-200'>
        <h4 className='font-semibold text-neutral-900 text-sm mb-3'>
          Field Health
        </h4>
        <div className='space-y-2'>
          <div className='flex justify-between items-center'>
            <span className='text-xs flex items-center'>
              <div className='w-2.5 h-2.5 bg-green-500 rounded-full mr-2'></div>
              Healthy
            </span>
            <span className='text-sm font-semibold text-green-700'>
              {((heatmapData.pixel_counts.green / validPixels) * 100).toFixed(
                1
              )}
              %
            </span>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-xs flex items-center'>
              <div className='w-2.5 h-2.5 bg-yellow-500 rounded-full mr-2'></div>
              Moderate
            </span>
            <span className='text-sm font-semibold text-yellow-700'>
              {((heatmapData.pixel_counts.yellow / validPixels) * 100).toFixed(
                1
              )}
              %
            </span>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-xs flex items-center'>
              <div className='w-2.5 h-2.5 bg-red-500 rounded-full mr-2'></div>
              Stressed
            </span>
            <span className='text-sm font-semibold text-red-700'>
              {((heatmapData.pixel_counts.red / validPixels) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {hasLegacySuggestions && (
        <div className='space-y-3'>
          {suggestions.field_management.length > 0 && (
            <div className='bg-green-50 rounded-lg p-3 border border-green-200'>
              <h4 className='font-semibold text-green-900 text-sm mb-2 flex items-center'>
                <CheckCircle className='h-4 w-4 mr-2' />
                Field Management
              </h4>
              <ul className='text-xs text-green-800 space-y-1'>
                {suggestions.field_management.map((item, index) => (
                  <li key={index} className='list-disc list-inside'>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {suggestions.soil_recommendations.length > 0 && (
            <div className='bg-amber-50 rounded-lg p-3 border border-amber-200'>
              <h4 className='font-semibold text-amber-900 text-sm mb-2 flex items-center'>
                <AlertTriangle className='h-4 w-4 mr-2' />
                Soil Recommendations
              </h4>
              <ul className='text-xs text-amber-800 space-y-1'>
                {suggestions.soil_recommendations.map((item, index) => (
                  <li key={index} className='list-disc list-inside'>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {suggestions.immediate_actions.length > 0 && (
            <div className='bg-blue-50 rounded-lg p-3 border border-blue-200'>
              <h4 className='font-semibold text-blue-900 text-sm mb-2 flex items-center'>
                <Activity className='h-4 w-4 mr-2' />
                Immediate Actions
              </h4>
              <ul className='text-xs text-blue-800 space-y-1'>
                {suggestions.immediate_actions.map((item, index) => (
                  <li key={index} className='list-disc list-inside'>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {suggestions.seasonal_planning.length > 0 && (
            <div className='bg-purple-50 rounded-lg p-3 border border-purple-200'>
              <h4 className='font-semibold text-purple-900 text-sm mb-2'>
                Seasonal Planning
              </h4>
              <ul className='text-xs text-purple-800 space-y-1'>
                {suggestions.seasonal_planning.map((item, index) => (
                  <li key={index} className='list-disc list-inside'>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
