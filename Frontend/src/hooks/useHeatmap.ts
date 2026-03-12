import { useState, useCallback, useEffect } from 'react';
import { FarmAPI } from '../services/farmApi';
import { heatmapService } from '../services/fileDatabase'; // kept for guest mode (localStorage)
import type { HeatmapData } from '../types/farm';

export interface UseHeatmapReturn {
  heatmapData: HeatmapData | null;
  loading: boolean;
  error: string | null;
  isCached: boolean;
  cachedAt: string | null;
  fetchHeatmapData: (coordinates: number[][], t1?: number, t2?: number) => Promise<void>;
}

export const useHeatmap = (farmId?: string): UseHeatmapReturn => {
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  // Load cached data on mount if farmId is provided
  useEffect(() => {
    if (farmId) {
      const loadCachedData = async () => {
        try {
          const isAuthenticated = !!(
            typeof window !== 'undefined' &&
            localStorage.getItem('auth_token') &&
            localStorage.getItem('auth_user')
          );

          if (isAuthenticated) {
            // Load from MongoDB via backend
            const cached = await FarmAPI.getHeatmapCache(farmId);
            if (cached) {
              setHeatmapData(cached.data);
              setIsCached(true);
              setCachedAt(cached.cachedAt);
              console.log('📦 Loaded heatmap cache from MongoDB for farm:', farmId);
            }
          } else {
            // Guest mode: fall back to localStorage
            const cached = await heatmapService.getByFarmId(farmId);
            if (cached) {
              setHeatmapData(cached.data);
              setIsCached(true);
              setCachedAt(cached.cachedAt);
              console.log('📦 Loaded heatmap cache from localStorage (guest) for farm:', farmId);
            }
          }
        } catch (err) {
          console.error('Error loading cached heatmap data:', err);
        }
      };
      loadCachedData();
    }
  }, [farmId]);

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

      const data: HeatmapData = await response.json();
      setHeatmapData(data);
      setIsCached(false);
      setCachedAt(null);

      // Cache the data if farmId is provided
      if (farmId) {
        try {
          const isAuthenticated = !!(
            typeof window !== 'undefined' &&
            localStorage.getItem('auth_token') &&
            localStorage.getItem('auth_user')
          );

          if (isAuthenticated) {
            // Save to MongoDB via backend
            const savedAt = await FarmAPI.saveHeatmapCache(farmId, data);
            console.log('💾 Heatmap data saved to MongoDB for farm:', farmId);
            setCachedAt(savedAt);
          } else {
            // Guest mode: save to localStorage
            const cachedEntry = await heatmapService.save(farmId, data);
            console.log('💾 Heatmap data cached in localStorage (guest) for farm:', farmId);
            setCachedAt(cachedEntry.cachedAt);
          }
        } catch (cacheErr) {
          console.error('Error caching heatmap data:', cacheErr);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching heatmap data';
      setError(errorMessage);
      console.error('Heatmap fetch error:', err);

      // If fetch fails and we have cached data, keep it visible
      if (heatmapData) {
        setIsCached(true);
        console.log('⚠️ Fetch failed, using cached heatmap data');
      }
    } finally {
      setLoading(false);
    }
  }, [farmId, heatmapData]);

  return {
    heatmapData,
    loading,
    error,
    isCached,
    cachedAt,
    fetchHeatmapData,
  };
};
    