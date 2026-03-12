import { useState, useCallback } from 'react';

export interface HeatmapData {
  predicted_yield: number;
  old_yield: number;
  growth: {
    ratio: number;
    percentage: number;
  };
  location: {
    district: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    complete_address: string;
  };
  ndvi_shape: number[];
  sensor_shape: number[];
  masks: {
    red_mask_base64: string;
    yellow_mask_base64: string;
    green_mask_base64: string;
  };
  "ndwi-masks": {
    brown_mask_base64: string;
    yellow_mask_base64: string;
    light_blue_mask_base64: string;
    dark_blue_mask_base64: string;
  };
  "ndre-masks": {
    purple_mask_base64: string;
    pink_mask_base64: string;
    light_green_mask_base64: string;
    dark_green_mask_base64: string;
  };
  pixel_counts: {
    valid: number;
    red: number;
    yellow: number;
    green: number;
  };
  thresholds: {
    t1: number;
    t2: number;
  };
  suggestions: {
    overall_assessment: string;
    yield_analysis: {
      predicted_yield: number;
      previous_yield: number;
      yield_change: number;
      yield_change_percent: number;
      status: string;
    };
    field_management: string[];
    soil_recommendations: string[];
    immediate_actions: string[];
    seasonal_planning: string[];
    risk_alerts: string[];
  };
}

export const useHeatmap = () => {
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHeatmapData = useCallback(async (coordinates: number[][], t1: number = 0.5, t2: number = 0.75) => {
    setLoading(true);
    setError(null);
    
    try {
      // Call the FastAPI endpoint directly
      const response = await fetch('http://127.0.0.1:8000/generate_heatmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates: coordinates,
          t1: t1,
          t2: t2
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch heatmap analysis');
      }

      const data = await response.json();
      setHeatmapData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching heatmap data');
      console.error('Heatmap fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    heatmapData,
    loading,
    error,
    fetchHeatmapData,
  };
};
    