export interface Farm {
  id: string;
  name: string;
  crop: string;
  plantingDate: string;
  harvestDate: string;
  description?: string;
  coordinates: number[][]; // Array of [lng, lat] pairs for polygon
  area: number; // in hectares
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface FarmFormData {
  name: string;
  crop: string;
  plantingDate: string;
  harvestDate: string;
  description?: string;
}

export interface AgmarknetData {
  success: boolean;
  message: string;
  title: string;
  data: Array<{
    key: string;
    columns: Array<{ key: string; title: string }>;
  }>;
  rows: Array<Record<string, string | number | null>>;
  average?: Record<string, string | number | null>;
}

export interface FarmState {
  farms: Farm[];
  allFarms: Farm[];
  currentFarm: Farm | null;
  loading: boolean;
  error: string | null;
  guestMode: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  fetchFarms: (page?: number, limit?: number) => Promise<void>;
  fetchAllFarms: (page?: number, limit?: number) => Promise<void>;
  addFarm: (
    farmData: FarmFormData,
    coordinates: number[][],
    area: number
  ) => Promise<void>;
  updateFarm: (id: string, farmData: Partial<Farm>) => Promise<void>;
  deleteFarm: (id: string) => Promise<void>;
  getFarmById: (id: string) => Farm | undefined;
  setCurrentFarm: (farm: Farm | null) => void;
  clearError: () => void;
  clearUserData: () => void;
  setPagination: (pagination: Partial<FarmState['pagination']>) => void;
  setGuestMode: (isGuest: boolean) => void;
  clearAllData: () => void;
}

export interface FarmStore extends FarmState {
  fetchAllFarms: (page?: number, limit?: number) => Promise<void>;
  fetchFarms: (page?: number, limit?: number) => Promise<void>;
  addFarm: (
    farmData: FarmFormData,
    coordinates: number[][],
    area: number
  ) => Promise<void>;
  updateFarm: (id: string, farmData: Partial<Farm>) => Promise<void>;
  deleteFarm: (id: string) => Promise<void>;
  getFarmById: (id: string) => Farm | undefined;
  setCurrentFarm: (farm: Farm | null) => void;
  clearError: () => void;
  clearUserData: () => void;
  setPagination: (pagination: Partial<FarmState['pagination']>) => void;
  setGuestMode: (isGuest: boolean) => void;
  clearAllData: () => void;
}

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
  'ndwi-masks'?: Partial<{
    brown_mask_base64: string;
    yellow_mask_base64: string;
    light_blue_mask_base64: string;
  }>;
  'ndre-masks'?: Partial<{
    purple_mask_base64: string;
    pink_mask_base64: string;
    light_green_mask_base64: string;
    dark_green_mask_base64: string;
  }>;
  anomaly?: {
    tile_urls?: {
      anomaly_heatmap?: string;
    };
    ndvi_trend?: {
      date: string;
      mean_ndvi: number;
    }[];
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
  news?: NewsItem[];
  news_ai_analysis?: string;
  rate?: {
    govdata?: MandiDayData[] | null;
    agmarknet?: AgmarknetData;
  };
  mandi_ai_analysis?: string;
  ai_analysis?: {
    summary: string;
    overall_health: 'Excellent' | 'Good' | 'Moderate' | 'Poor' | 'Critical';
    confidence: 'Low' | 'Medium' | 'High';
    risk_score: number;
    priority: 'Low' | 'Medium' | 'High';
    issues: Array<{
      id: string;
      name: string;
      affected_area_pct: number;
      priority: 'Low' | 'Medium' | 'High';
    }>;
    why_happening: string[];
    immediate_actions: string[];
    monitor_next: string[];
    risk_if_ignored: string;
    simple_advice: {
      en: string;
      hi: string;
    };
  };
}

export interface MandiRecord {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  grade: string;
  arrival_date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
}

export interface MandiDayData {
  date: string;
  records: MandiRecord[];
}

export interface NewsItem {
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: string;
}

export interface WeatherData {
  date: string;
  agmarknet?: AgmarknetData;
  precipitation?: number;
  weather_description?: string;
}

export const CROP_OPTIONS = [
  'Wheat',
  'Rice',
  'Corn',
  'Soybeans',
  'Cotton',
  'Sugarcane',
  'Potato',
  'Tomato',
  'Onion',
  'Cabbage',
  'Carrot',
  'Beans',
  'Peas',
  'Sunflower',
  'Barley',
  'Oats',
] as const;

export type CropType = (typeof CROP_OPTIONS)[number];
