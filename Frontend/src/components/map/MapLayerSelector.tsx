import React, { useState } from 'react';
import { Info } from 'lucide-react';
import type { RangeMeta } from '@/types/farm';

export type MapLayerType = 'ndvi' | 'ndre' | 'ndwi' | 'anomaly';
export type LayerViewMode = 'masks' | 'range';

interface MaskOpacity {
  red?: number;
  yellow?: number;
  green?: number;
  brown?: number;
  light_blue?: number;
  purple?: number;
  pink?: number;
  light_green?: number;
  dark_green?: number;
  anomaly?: number;
}

interface MapLayerSelectorProps {
  activeLayer: MapLayerType;
  onLayerChange: (layer: MapLayerType) => void;
  maskOpacity: MaskOpacity;
  onOpacityChange: (maskId: string, opacity: number) => void;
  viewMode?: LayerViewMode;
  onViewModeChange?: (mode: LayerViewMode) => void;
  rangeOpacity?: number;
  onRangeOpacityChange?: (opacity: number) => void;
  rangeMeta?: RangeMeta | null; // gradient meta for the active layer
}

const LAYER_CONFIG: Record<MapLayerType, { label: string; shortLabel: string; description: string; masks: string[] }> = {
  ndvi: {
    label: 'Health Map (NDVI)',
    shortLabel: 'NDVI',
    description: 'Crop health status',
    masks: ['red', 'yellow', 'green'],
  },
  ndre: {
    label: 'Nutrient Map (NDRE)',
    shortLabel: 'NDRE',
    description: 'Nutrient status',
    masks: ['purple', 'pink', 'light_green', 'dark_green'],
  },
  ndwi: {
    label: 'Hydration Map (NDWI)',
    shortLabel: 'NDWI',
    description: 'Water stress levels',
    masks: ['brown', 'yellow', 'light_blue'],
  },
  anomaly: {
    label: 'Trend Map',
    shortLabel: 'Anomaly',
    description: 'Deviation from normal patterns',
    masks: [],
  },
};

const MASK_LABELS: Record<string, string> = {
  red: 'Stressed Areas',
  yellow: 'Moderate',
  green: 'Healthy Areas',
  brown: 'Very Low Water',
  light_blue: 'Moderate Water',
  purple: 'Stressed Vegetation',
  pink: 'Moderate Stress',
  light_green: 'Healthy',
  dark_green: 'Very Healthy',
};

const MASK_TOOLTIPS: Record<string, string> = {
  red: 'Areas with poor vegetation health — may indicate disease, drought, or nutrient deficiency',
  yellow: 'Areas with moderate vegetation — needs monitoring for potential decline',
  green: 'Areas with strong, healthy vegetation growth',
  brown: 'Severely water-stressed areas — irrigation may be needed urgently',
  light_blue: 'Moderate water content — adequate but not optimal hydration levels',
  purple: 'Vegetation under nutrient stress — may need fertilizer application',
  pink: 'Mild nutrient deficiency — early signs of stress',
  light_green: 'Good nutrient uptake and healthy chlorophyll levels',
  dark_green: 'Excellent nutrient status — optimal chlorophyll content',
};

const MASK_COLORS: Record<string, string> = {
  red: '#ef4444',
  yellow: '#eab308',
  green: '#22c55e',
  brown: '#8B4513',
  light_blue: '#87ceeb',
  purple: '#800080',
  pink: '#FF69B4',
  light_green: '#90EE90',
  dark_green: '#006400',
};

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-52 px-3 py-2 text-xs text-white bg-neutral-900 rounded-lg shadow-lg pointer-events-none">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-900" />
        </div>
      )}
    </div>
  );
};

export const MapLayerSelector: React.FC<MapLayerSelectorProps> = ({
  activeLayer,
  onLayerChange,
  maskOpacity,
  onOpacityChange,
  viewMode = 'masks',
  onViewModeChange,
  rangeOpacity = 0.7,
  onRangeOpacityChange,
  rangeMeta,
}) => {
  const getOpacity = (maskId: string): number => {
    return (maskOpacity[maskId as keyof MaskOpacity] ?? 0.7) * 100;
  };

  const handleOpacityChange = (maskId: string, value: number) => {
    onOpacityChange(maskId, value / 100);
  };

  const currentConfig = LAYER_CONFIG[activeLayer];
  const isAnomalyMode = activeLayer === 'anomaly';
  const showViewToggle =
    !isAnomalyMode && Boolean(onViewModeChange) && Boolean(rangeMeta);

  const buildGradientCss = (meta: RangeMeta): string => {
    if (!meta.stops.length) return 'linear-gradient(to right, #ddd, #888)';
    const span = Math.max(meta.max - meta.min, 1e-6);
    const parts = meta.stops.map(stop => {
      const pct = Math.max(0, Math.min(100, ((stop.value - meta.min) / span) * 100));
      return `${stop.color} ${pct.toFixed(2)}%`;
    });
    return `linear-gradient(to right, ${parts.join(', ')})`;
  };

  return (
    <div className="fixed bottom-6 left-6 z-[1000] w-auto max-w-[520px]">
      <div className="bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden">
        {/* Panel Content */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3 gap-3">
            <h4 className="text-sm font-semibold text-neutral-900">
              {currentConfig.label}
            </h4>
            {showViewToggle ? (
              <div className="inline-flex rounded-md border border-neutral-200 bg-neutral-50 p-0.5">
                <button
                  type="button"
                  onClick={() => onViewModeChange?.('masks')}
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-colors ${
                    viewMode === 'masks'
                      ? 'bg-primary-600 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  Masks
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange?.('range')}
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-colors ${
                    viewMode === 'range'
                      ? 'bg-primary-600 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  Range
                </button>
              </div>
            ) : (
              <span className="text-[10px] text-neutral-400 uppercase tracking-wide">
                {currentConfig.description}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {isAnomalyMode ? (
              <>
                {/* Anomaly opacity slider */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-neutral-700">
                      Anomaly Overlay
                    </label>
                    <span className="text-xs font-semibold text-neutral-600">
                      {getOpacity('anomaly').toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={getOpacity('anomaly')}
                    onChange={(e) => handleOpacityChange('anomaly', Number(e.target.value))}
                    className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                </div>

                {/* Anomaly color legend */}
                <div className="mt-3 pt-3 border-t border-neutral-100">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Info className="h-3.5 w-3.5 text-neutral-400" />
                    <span className="text-[11px] font-medium text-neutral-500">Color Legend</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#ef4444' }} />
                      <span className="text-[11px] text-neutral-600">Worse than average</span>
                    </div>
                    <div className="h-3 w-px bg-neutral-200" />
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#3b82f6' }} />
                      <span className="text-[11px] text-neutral-600">Better than average</span>
                    </div>
                  </div>
                </div>
              </>
            ) : viewMode === 'range' && rangeMeta ? (
              <>
                {/* Single opacity slider for the gradient overlay */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-neutral-700">
                      {rangeMeta.unit ?? 'Range'} Overlay
                    </label>
                    <span className="text-xs font-semibold text-neutral-600">
                      {Math.round(rangeOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(rangeOpacity * 100)}
                    onChange={(e) =>
                      onRangeOpacityChange?.(Number(e.target.value) / 100)
                    }
                    className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                </div>

                {/* Color bar legend */}
                <div className="pt-2 border-t border-neutral-100">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Info className="h-3.5 w-3.5 text-neutral-400" />
                    <span className="text-[11px] font-medium text-neutral-500">
                      {rangeMeta.unit ?? 'Index'} Scale
                    </span>
                  </div>
                  <div
                    className="h-3 w-full rounded border border-neutral-200"
                    style={{ background: buildGradientCss(rangeMeta) }}
                  />
                  <div className="mt-1 flex items-center justify-between text-[10px] text-neutral-600">
                    <span>
                      <span className="font-semibold text-neutral-800">
                        {rangeMeta.min.toFixed(2)}
                      </span>
                      {rangeMeta.min_label ? ` · ${rangeMeta.min_label}` : ''}
                    </span>
                    <span className="text-right">
                      {rangeMeta.max_label ? `${rangeMeta.max_label} · ` : ''}
                      <span className="font-semibold text-neutral-800">
                        {rangeMeta.max.toFixed(2)}
                      </span>
                    </span>
                  </div>
                </div>
              </>
            ) : (
              currentConfig.masks.map((maskId) => (
                <div key={maskId}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <Tooltip text={MASK_TOOLTIPS[maskId] ?? ''}>
                        <div
                          className="w-3 h-3 rounded-full border border-neutral-300 cursor-help"
                          style={{ backgroundColor: MASK_COLORS[maskId] }}
                        />
                      </Tooltip>
                      <Tooltip text={MASK_TOOLTIPS[maskId] ?? ''}>
                        <label className="text-xs font-medium text-neutral-700 cursor-help">
                          {MASK_LABELS[maskId]}
                        </label>
                      </Tooltip>
                    </div>
                    <span className="text-xs font-semibold text-neutral-600">
                      {getOpacity(maskId).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={getOpacity(maskId)}
                    onChange={(e) => handleOpacityChange(maskId, Number(e.target.value))}
                    className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex border-t border-neutral-200">
          {Object.entries(LAYER_CONFIG).map(([layerId, config]) => {
            const isActive = activeLayer === layerId;
            return (
              <button
                key={layerId}
                onClick={() => onLayerChange(layerId as MapLayerType)}
                className={`flex-1 px-3 py-2.5 text-xs font-medium transition-all relative whitespace-nowrap ${
                  isActive
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {config.shortLabel}
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
