import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Farm, FarmState, FarmFormData } from '../types/farm';

interface FarmStore extends FarmState {
  addFarm: (
    farmData: FarmFormData,
    coordinates: number[][],
    area: number,
    userId?: string
  ) => void;
  updateFarm: (id: string, farmData: Partial<Farm>) => void;
  deleteFarm: (id: string) => void;
  getFarmById: (id: string) => Farm | undefined;
  getFarmsByUserId: (userId: string) => Farm[];
  getAllFarms: () => Farm[]; // For admin use
  setCurrentFarm: (farm: Farm | null) => void;
  clearError: () => void;
  clearUserData: () => void; // Clear UI state only
  resetAllData: () => void; // Complete reset for testing/admin
}

// Utility function to calculate polygon area in hectares
const calculatePolygonArea = (coordinates: number[][]): number => {
  if (coordinates.length < 3) return 0;

  let area = 0;
  const n = coordinates.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const currentPoint = coordinates[i];
    const nextPoint = coordinates[j];

    // Ensure both points exist and have valid coordinates
    if (
      currentPoint &&
      nextPoint &&
      currentPoint.length >= 2 &&
      nextPoint.length >= 2 &&
      typeof currentPoint[0] === 'number' &&
      typeof currentPoint[1] === 'number' &&
      typeof nextPoint[0] === 'number' &&
      typeof nextPoint[1] === 'number'
    ) {
      area += currentPoint[0] * nextPoint[1];
      area -= nextPoint[0] * currentPoint[1];
    }
  }

  area = Math.abs(area) / 2;

  // Convert from square degrees to hectares using proper geodesic calculation
  // Using the Shoelace formula result and converting to hectares
  // For lat/lng coordinates, we need to account for Earth's curvature
  const earthRadius = 6371000; // Earth's radius in meters
  const avgLat =
    coordinates.reduce((sum, coord) => sum + (coord[1] || 0), 0) /
    coordinates.length;
  const latRadians = (avgLat * Math.PI) / 180;

  // Convert square degrees to square meters, then to hectares
  const metersPerDegreeLat = (earthRadius * Math.PI) / 180;
  const metersPerDegreeLng = metersPerDegreeLat * Math.cos(latRadians);

  const areaInSquareMeters = area * metersPerDegreeLat * metersPerDegreeLng;
  const hectares = areaInSquareMeters / 10000; // Convert to hectares

  return Math.round(hectares * 100) / 100; // round to 2 decimal places
};

export const useFarmStore = create<FarmStore>()(
  persist(
    (set, get) => ({
      farms: [],
      currentFarm: null,
      loading: false,
      error: null,

      addFarm: (
        farmData: FarmFormData,
        coordinates: number[][],
        area: number,
        userId?: string
      ) => {
        try {
          set({ loading: true, error: null });

          // Get current user ID from localStorage auth_user or use provided userId
          let currentUserId = userId;
          if (!currentUserId) {
            try {
              const authUser = localStorage.getItem('auth_user');
              if (authUser) {
                const user = JSON.parse(authUser);
                currentUserId = user.id;
              }
            } catch (e) {
              console.error('Error parsing auth user:', e);
            }
          }

          // Fallback to anonymous if no user found
          currentUserId = currentUserId || 'anonymous';

          const newFarm: Farm = {
            id: crypto.randomUUID(),
            ...farmData,
            coordinates,
            area: area || calculatePolygonArea(coordinates),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: currentUserId,
          };

          console.log('Adding new farm:', newFarm);
          console.log('Current user ID:', currentUserId);

          set(state => {
            const updatedFarms = [...state.farms, newFarm];
            console.log('Updated farms array:', updatedFarms);
            return {
              farms: updatedFarms,
              loading: false,
            };
          });
        } catch (error) {
          console.error('Error adding farm:', error);
          set({
            error:
              error instanceof Error ? error.message : 'Failed to add farm',
            loading: false,
          });
        }
      },

      updateFarm: (id: string, farmData: Partial<Farm>) => {
        try {
          set({ loading: true, error: null });

          set(state => ({
            farms: state.farms.map(farm =>
              farm.id === id
                ? { ...farm, ...farmData, updatedAt: new Date().toISOString() }
                : farm
            ),
            loading: false,
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to update farm',
            loading: false,
          });
        }
      },

      deleteFarm: (id: string) => {
        try {
          set({ loading: true, error: null });

          set(state => ({
            farms: state.farms.filter(farm => farm.id !== id),
            currentFarm:
              state.currentFarm?.id === id ? null : state.currentFarm,
            loading: false,
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to delete farm',
            loading: false,
          });
        }
      },

      getFarmById: (id: string) => {
        return get().farms.find(farm => farm.id === id);
      },

      getFarmsByUserId: (userId: string) => {
        return get().farms.filter(farm => farm.userId === userId);
      },

      getAllFarms: () => {
        return get().farms;
      },

      setCurrentFarm: (farm: Farm | null) => {
        set({ currentFarm: farm });
      },

      clearError: () => {
        set({ error: null });
      },

      clearUserData: () => {
        // This should only be used for complete app reset, not logout
        // Only clear UI state, farms persist across sessions
        set({
          currentFarm: null,
          loading: false,
          error: null,
        });
      },

      // Add a method to completely reset all data (for testing or admin purposes)
      resetAllData: () => {
        set({
          farms: [],
          currentFarm: null,
          loading: false,
          error: null,
        });
      },
    }),
    {
      name: 'agri-farms-v1',
      partialize: state => ({
        farms: state.farms,
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Handle migration from old storage format
        if (version === 0) {
          return {
            farms: persistedState?.farms || [],
            currentFarm: null,
            loading: false,
            error: null,
          };
        }
        return persistedState;
      },
    }
  )
);
