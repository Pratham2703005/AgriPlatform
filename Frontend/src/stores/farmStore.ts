import { create } from 'zustand';
import { FarmAPI } from '../services/farmApi';
import type { Farm, FarmState, FarmFormData } from '../types/farm';

interface FarmStore extends FarmState {
  allFarms: Farm[];
  // API-based actions
  fetchFarms: (page?: number, limit?: number) => Promise<void>;
  fetchAllFarms: (page?: number, limit?: number) => Promise<void>;
  addFarm: (
    farmData: FarmFormData,
    coordinates: number[][],
    area: number
  ) => Promise<void>;
  updateFarm: (id: string, farmData: Partial<Farm>) => Promise<void>;
  deleteFarm: (id: string) => Promise<void>;
  
  // Local state management
  getFarmById: (id: string) => Farm | undefined;
  setCurrentFarm: (farm: Farm | null) => void;
  clearError: () => void;
  clearUserData: () => void;
  
  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  setPagination: (pagination: Partial<FarmStore['pagination']>) => void;
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

export const useFarmStore = create<FarmStore>((set, get) => ({
  // Fetch all farms in the system (admin)
  fetchAllFarms: async (page = 1, limit = 10) => {
    try {
      set({ loading: true, error: null });
      const response = await FarmAPI.getAllFarms(page, limit);
      if (response.code === 1) {
        const { farms, pagination } = response.result;
        const transformedFarms = farms.map(FarmAPI.transformFromApiFormat);
        set({
          allFarms: transformedFarms,
          pagination,
          loading: false,
        });
      } else {
        set({
          error: response.message || 'Failed to fetch all farms',
          loading: false,
        });
      }
    } catch (error: any) {
      console.error('Error fetching all farms:', error);
      set({
        error: error.message || 'Failed to fetch all farms',
        loading: false,
      });
    }
  },
  // State
  farms: [], // My farms
  allFarms: [], // All system farms
  currentFarm: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },

  // API Actions
  fetchFarms: async (page = 1, limit = 10) => {
    try {
      set({ loading: true, error: null });
      
      const response = await FarmAPI.getFarms(page, limit);
      
      if (response.code === 1) {
        const { farms, pagination } = response.result;
        
        // Transform API data to frontend format
          const transformedFarms = farms.map(FarmAPI.transformFromApiFormat);
          
          set({
            farms: transformedFarms,
            pagination,
            loading: false,
          });
      } else {
        set({
          error: response.message || 'Failed to fetch farms',
          loading: false,
        });
      }
    } catch (error: any) {
      console.error('Error fetching farms:', error);
      set({
        error: error.message || 'Failed to fetch farms',
        loading: false,
      });
    }
  },

  addFarm: async (
    farmData: FarmFormData,
    coordinates: number[][],
    area: number
  ) => {
    try {
      set({ loading: true, error: null });
      
      const createRequest = FarmAPI.transformToApiFormat({
        ...farmData,
        coordinates,
        area: area || calculatePolygonArea(coordinates),
      });
      console.log("createRequest:", createRequest);

      const response = await FarmAPI.createFarm(createRequest);
      
      if (response.code === 1) {
        const newFarm = FarmAPI.transformFromApiFormat(response.result);
        
        set(state => ({
          farms: [...state.farms, newFarm],
          loading: false,
        }));
      } else {
        set({
          error: response.message || 'Failed to create farm',
          loading: false,
        });
      }
    } catch (error: any) {
      console.error('Error creating farm:', error);
      set({
        error: error.message || 'Failed to create farm',
        loading: false,
      });
    }
  },

  updateFarm: async (id: string, farmData: Partial<Farm>) => {
    try {
      set({ loading: true, error: null });

      const response = await FarmAPI.updateFarm(id, farmData);

      if (response.code === 1) {
        const updatedFarm = FarmAPI.transformFromApiFormat(response.result);
        
        set(state => ({
          farms: state.farms.map(farm =>
            farm.id === id ? updatedFarm : farm
          ),
          currentFarm: state.currentFarm?.id === id ? updatedFarm : state.currentFarm,
          loading: false,
        }));
      } else {
        set({
          error: response.message || 'Failed to update farm',
          loading: false,
        });
      }
    } catch (error: any) {
      console.error('Error updating farm:', error);
      set({
        error: error.message || 'Failed to update farm',
        loading: false,
      });
    }
  },

  deleteFarm: async (id: string) => {
    try {
      set({ loading: true, error: null });

      const response = await FarmAPI.deleteFarm(id);

      if (response.code === 1) {
        set(state => ({
          farms: state.farms.filter(farm => farm.id !== id),
          currentFarm: state.currentFarm?.id === id ? null : state.currentFarm,
          loading: false,
        }));
      } else {
        set({
          error: response.message || 'Failed to delete farm',
          loading: false,
        });
      }
    } catch (error: any) {
      console.error('Error deleting farm:', error);
      set({
        error: error.message || 'Failed to delete farm',
        loading: false,
      });
    }
  },

  // Local state management
  getFarmById: (id: string) => {
    // First check in user's farms
    const userFarm = get().farms.find(farm => farm.id === id);
    if (userFarm) return userFarm;
    
    // If not found, check in all farms (for admin)
    return get().allFarms.find(farm => farm.id === id);
  },

  setCurrentFarm: (farm: Farm | null) => {
    set({ currentFarm: farm });
  },

  clearError: () => {
    set({ error: null });
  },

  clearUserData: () => {
    set({
      farms: [],
      currentFarm: null,
      loading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    });
  },

  setPagination: (pagination: Partial<FarmStore['pagination']>) => {
    set(state => ({
      pagination: { ...state.pagination, ...pagination },
    }));
  },
}));
