import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, ScaleControl, ImageOverlay } from 'react-leaflet';
import L from 'leaflet';
import { Layers, ZoomIn, ZoomOut, RotateCcw, LocateFixed, Settings, Eye, EyeOff } from 'lucide-react';
import type { HeatmapData } from '@/types/farm';
import 'leaflet/dist/leaflet.css';
import './HeatmapOverlay.css';

// Fix for default markers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export type LayerType = 'ndvi' | 'ndwi' | 'ndre';

const LAYER_LABELS: Record<LayerType, string> = {
  ndvi: 'Health Map',
  ndwi: 'Hydration Map',
  ndre: 'Nutrient Map',
};

interface HeatmapOverlayProps {
  coordinates: number[][]; // Array of [lng, lat] pairs
  heatmapData?: HeatmapData | null;
  height?: string;
  className?: string;
  activeLayer?: LayerType;
  onLayerChange?: (layer: LayerType) => void;
}

interface MaskOverlay {
  id: string;
  name: string;
  color: string;
  base64Data: string;
  opacity: number;
  visible: boolean;
}

// NDVI mask set (red -> yellow -> green)
const createNdviMaskSet = (): MaskOverlay[] => [
  { id: 'red', name: 'Stressed Areas', color: '#ef4444', base64Data: '', opacity: 0.7, visible: true },
  { id: 'yellow', name: 'Moderate Health', color: '#eab308', base64Data: '', opacity: 0.7, visible: true },
  { id: 'green', name: 'Healthy Areas', color: '#22c55e', base64Data: '', opacity: 0.7, visible: true },
];

// NDWI mask set (brown -> yellow -> light blue -> dark blue)
const createNdwiMaskSet = (): MaskOverlay[] => [
  { id: 'brown', name: 'Very Low Water', color: '#8B4513', base64Data: '', opacity: 0.7, visible: true },
  { id: 'yellow', name: 'Low Water', color: '#eab308', base64Data: '', opacity: 0.7, visible: true },
  { id: 'light_blue', name: 'Moderate Water', color: '#87CEFA', base64Data: '', opacity: 0.7, visible: true },
  { id: 'dark_blue', name: 'High Water', color: '#00008B', base64Data: '', opacity: 0.7, visible: true },
];

// NDRE mask set (purple -> pink -> light green -> dark green)
const createNdreMaskSet = (): MaskOverlay[] => [
  { id: 'purple', name: 'Stressed Vegetation', color: '#800080', base64Data: '', opacity: 0.7, visible: true },
  { id: 'pink', name: 'Moderate Stress', color: '#FF69B4', base64Data: '', opacity: 0.7, visible: true },
  { id: 'light_green', name: 'Healthy', color: '#90EE90', base64Data: '', opacity: 0.7, visible: true },
  { id: 'dark_green', name: 'Very Healthy', color: '#006400', base64Data: '', opacity: 0.7, visible: true },
];

// Component to handle image overlay bounds calculation
const HeatmapImageOverlays: React.FC<{
  coordinates: number[][];
  masks: MaskOverlay[];
}> = ({ coordinates, masks }) => {
  // Calculate bounds from coordinates
  const getBounds = (): L.LatLngBounds | null => {
    if (coordinates.length === 0) return null;
    
    const leafletCoords: [number, number][] = coordinates
      .filter((coord): coord is [number, number] => Array.isArray(coord) && coord.length >= 2)
      .map((coord) => [coord[1], coord[0]]); // Convert [lng, lat] to [lat, lng]

    if (leafletCoords.length === 0) return null;

    const lats = leafletCoords.map(coord => coord[0]);
    const lngs = leafletCoords.map(coord => coord[1]);

    const southWest = L.latLng(Math.min(...lats), Math.min(...lngs));
    const northEast = L.latLng(Math.max(...lats), Math.max(...lngs));

    return L.latLngBounds(southWest, northEast);
  };

  const bounds = getBounds();

  if (!bounds) return null;

  return (
    <>
      {masks.map((mask) => (
        mask.visible && mask.base64Data && (
          <ImageOverlay
            key={mask.id}
            url={`data:image/png;base64,${mask.base64Data}`}
            bounds={bounds}
            opacity={mask.opacity}
          />
        )
      ))}
    </>
  );
};

export const HeatmapOverlay: React.FC<HeatmapOverlayProps> = ({
  coordinates,
  heatmapData,
  height = '400px',
  className = '',
  activeLayer: activeLayerProp,
  onLayerChange,
}) => {
  const [mapStyle, setMapStyle] = useState<'hybrid' | 'satellite' | 'streets'>('hybrid');
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  const [showOverlayControls, setShowOverlayControls] = useState(true);
  const [activeLayerInternal, setActiveLayerInternal] = useState<LayerType>('ndvi');
  const activeLayer = activeLayerProp ?? activeLayerInternal;
  const setActiveLayer = (layer: LayerType) => {
    setActiveLayerInternal(layer);
    onLayerChange?.(layer);
  };
  const mapRef = useRef<L.Map | null>(null);
  const MAP_API_KEY = import.meta.env.VITE_MAP_API_KEY;

  // Independent mask state for each layer
  const [ndviMasks, setNdviMasks] = useState<MaskOverlay[]>(createNdviMaskSet());
  const [ndwiMasks, setNdwiMasks] = useState<MaskOverlay[]>(createNdwiMaskSet());
  const [ndreMasks, setNdreMasks] = useState<MaskOverlay[]>(createNdreMaskSet());

  // Helpers to get/set the active layer's masks
  const masksMap: Record<LayerType, MaskOverlay[]> = {
    ndvi: ndviMasks,
    ndwi: ndwiMasks,
    ndre: ndreMasks,
  };

  const settersMap: Record<LayerType, React.Dispatch<React.SetStateAction<MaskOverlay[]>>> = {
    ndvi: setNdviMasks,
    ndwi: setNdwiMasks,
    ndre: setNdreMasks,
  };

  const activeMasks = masksMap[activeLayer];
  const setActiveMasks = settersMap[activeLayer];

  // Update all mask sets when heatmap data changes
  useEffect(() => {
    if (!heatmapData) return;

    // NDVI masks (red, yellow, green)
    if (heatmapData.masks) {
      setNdviMasks(prev =>
        prev.map(mask => ({
          ...mask,
          base64Data:
            mask.id === 'red' ? heatmapData.masks.red_mask_base64 :
            mask.id === 'yellow' ? heatmapData.masks.yellow_mask_base64 :
            mask.id === 'green' ? heatmapData.masks.green_mask_base64 :
            mask.base64Data,
        })),
      );
    }

    // NDWI masks (brown, yellow, light_blue, dark_blue)
    if (heatmapData['ndwi-masks']) {
      const ndwiData = heatmapData['ndwi-masks'];
      setNdwiMasks(prev =>
        prev.map(mask => ({
          ...mask,
          base64Data:
            mask.id === 'brown' ? (ndwiData.brown_mask_base64 ?? '') :
            mask.id === 'yellow' ? (ndwiData.yellow_mask_base64 ?? '') :
            mask.id === 'light_blue' ? (ndwiData.light_blue_mask_base64 ?? '') :
            mask.id === 'dark_blue' ? (ndwiData.dark_blue_mask_base64 ?? '') :
            mask.base64Data,
        })),
      );
    }

    // NDRE masks (purple, pink, light_green, dark_green)
    if (heatmapData['ndre-masks']) {
      const ndreData = heatmapData['ndre-masks'];
      setNdreMasks(prev =>
        prev.map(mask => ({
          ...mask,
          base64Data:
            mask.id === 'purple' ? (ndreData.purple_mask_base64 ?? '') :
            mask.id === 'pink' ? (ndreData.pink_mask_base64 ?? '') :
            mask.id === 'light_green' ? (ndreData.light_green_mask_base64 ?? '') :
            mask.id === 'dark_green' ? (ndreData.dark_green_mask_base64 ?? '') :
            mask.base64Data,
        })),
      );
    }
  }, [heatmapData]);

  // Convert coordinates to Leaflet format [lat, lng]
  const leafletCoords: [number, number][] = Array.isArray(coordinates)
    ? coordinates
        .filter((coord): coord is [number, number] => Array.isArray(coord) && coord.length >= 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number')
        .map((coord) => [coord[1], coord[0]])
    : [];

  // Calculate center of the polygon
  const getPolygonCenter = (): [number, number] => {
    if (leafletCoords.length === 0) {
      return [28.6139, 77.2090]; // Default center
    }

    const latSum = leafletCoords.reduce((sum: number, coord: [number, number]) => sum + coord[0], 0);
    const lngSum = leafletCoords.reduce((sum: number, coord: [number, number]) => sum + coord[1], 0);
    return [latSum / leafletCoords.length, lngSum / leafletCoords.length];
  };

  // Calculate appropriate zoom level based on polygon bounds
  const getZoomLevel = (): number => {
    if (leafletCoords.length === 0) return 10;

    const lats = leafletCoords.map((coord: [number, number]) => coord[0]);
    const lngs = leafletCoords.map((coord: [number, number]) => coord[1]);
    const latRange = Math.max(...lats) - Math.min(...lats);
    const lngRange = Math.max(...lngs) - Math.min(...lngs);
    const maxRange = Math.max(latRange, lngRange);

    // Rough zoom calculation
    console.log(maxRange);
    if (maxRange > 1) return 8;
    if (maxRange > 0.1) return 10;
    return 14;
  };

  const mapStyles = {
    hybrid: `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${MAP_API_KEY}`,
    satellite: `https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${MAP_API_KEY}`,
    streets: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAP_API_KEY}`,
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const handleResetView = () => {
    if (mapRef.current) {
      const center = getPolygonCenter();
      const zoom = getZoomLevel();
      mapRef.current.setView(center, zoom);
    }
  };

  const handleLocateMe = () => {
    const map = mapRef.current;
    if (!map) return;

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 16, {
          animate: true,
          duration: 2
        });
      },
      () => {
        // Ignore errors silently
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleStyleChange = (style: 'hybrid' | 'satellite' | 'streets') => {
    setMapStyle(style);
    setShowStyleSelector(false);
  };

  const updateMaskOpacity = (maskId: string, opacity: number) => {
    setActiveMasks(prevMasks => 
      prevMasks.map(mask => 
        mask.id === maskId ? { ...mask, opacity } : mask
      )
    );
  };

  const toggleMaskVisibility = (maskId: string) => {
    setActiveMasks(prevMasks => 
      prevMasks.map(mask => 
        mask.id === maskId ? { ...mask, visible: !mask.visible } : mask
      )
    );
  };

  const center = getPolygonCenter();
  const zoom = getZoomLevel();

  return (
    <div className={`relative ${className}`} style={{zIndex:1}}>
      <div style={{ height }} className="w-full rounded-lg overflow-hidden border">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          scrollWheelZoom={true}
          ref={mapRef}
        >
          {/* Base Layer - Dynamic based on selected style */}
          <TileLayer
            key={mapStyle}
            url={mapStyles[mapStyle]}
            attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          />

          {/* Scale Control */}
          <ScaleControl position="bottomleft" imperial={false} />

          {/* Farm Boundary Polygon */}
          {leafletCoords.length > 2 && (
            <Polygon
              positions={leafletCoords}
              pathOptions={{
                color: '#10b981',
                weight: 3,
                fillOpacity: 0.1,
                fillColor: '#10b981'
              }}
            />
          )}

          {/* Heatmap Image Overlays — only the active layer's masks */}
          {heatmapData && (
            <HeatmapImageOverlays coordinates={coordinates} masks={activeMasks} />
          )}
        </MapContainer>
      </div>

      {/* Left Side Controls Panel */}
      <div className="absolute top-3 left-3 z-[1000] bg-white backdrop-blur-sm rounded-md shadow-lg border border-neutral-700">
        <div className="p-2 space-y-1.5">
          {/* Navigation Tools */}
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-8 h-8 bg-white text-black rounded-sm hover:bg-gray-100 flex items-center justify-center transition-all duration-200 group"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-8 h-8 bg-white text-black rounded-sm hover:bg-gray-100 flex items-center justify-center transition-all duration-200 group"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            className="w-8 h-8 bg-white text-black rounded-sm hover:bg-gray-100 flex items-center justify-center transition-all duration-200 group"
            title="Reset View"
          >
            <RotateCcw className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>
          <button
            type="button"
            onClick={handleLocateMe}
            className="w-8 h-8 bg-white text-black rounded-sm hover:bg-gray-100 flex items-center justify-center transition-all duration-200 group"
            title="My Location"
          >
            <LocateFixed className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>

          {/* Divider */}
          <div className="h-px bg-neutral-600 my-2"></div>

          {/* Map Style Toggle */}
          <button
            type="button"
            onClick={() => setShowStyleSelector(!showStyleSelector)}
            className={`w-8 h-8 rounded-sm flex items-center justify-center transition-all duration-200 group ${
              showStyleSelector 
                ? 'bg-gray-100 text-black' 
                : 'bg-white text-black hover:bg-gray-100'
            }`}
            title="Map Style"
          >
            <Layers className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>

          {/* Heatmap Controls Toggle */}
          {heatmapData && (
            <button
              type="button"
              onClick={() => setShowOverlayControls(!showOverlayControls)}
              className={`w-8 h-8 rounded-sm flex items-center justify-center transition-all duration-200 group ${
                showOverlayControls 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
              title="Heatmap Controls"
            >
              <Settings className="h-4 w-4 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>

        {/* Map Style Selector */}
        {showStyleSelector && (
          <div className="absolute left-full top-0 ml-2 bg-white rounded-md shadow-lg border border-neutral-700 py-1 min-w-[100px]">
            <button
              type="button"
              onClick={() => handleStyleChange('hybrid')}
              className={`w-full px-3 py-1.5 text-xs text-left transition-colors ${
                mapStyle === 'hybrid' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              Hybrid
            </button>
            <button
              type="button"
              onClick={() => handleStyleChange('satellite')}
              className={`w-full px-3 py-1.5 text-xs text-left transition-colors ${
                mapStyle === 'satellite' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => handleStyleChange('streets')}
              className={`w-full px-3 py-1.5 text-xs text-left transition-colors ${
                mapStyle === 'streets' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              Streets
            </button>
          </div>
        )}
      </div>

      {/* Right Side Heatmap Controls Panel */}
      {heatmapData && showOverlayControls && (
        <div className="absolute top-3 right-3 z-[1000] bg-white backdrop-blur-sm rounded-lg shadow-lg border border-neutral-200 p-4 min-w-[280px]">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Overlay Controls
          </h3>

          {/* Layer Selector Tabs */}
          <div className="layer-tabs mb-4">
            {(Object.keys(LAYER_LABELS) as LayerType[]).map((layer) => (
              <button
                key={layer}
                type="button"
                onClick={() => setActiveLayer(layer)}
                className={`layer-tab ${activeLayer === layer ? 'layer-tab--active' : ''}`}
              >
                {LAYER_LABELS[layer]}
              </button>
            ))}
          </div>
          
          <div className="space-y-4">
            {activeMasks.map((mask) => (
              <div key={mask.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: mask.color }}
                    />
                    <span className="text-sm font-medium text-gray-700">{mask.name}</span>
                  </div>
                  <button
                    onClick={() => toggleMaskVisibility(mask.id)}
                    className={`p-1 rounded transition-colors ${
                      mask.visible 
                        ? 'text-gray-600 hover:text-gray-800' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title={mask.visible ? 'Hide overlay' : 'Show overlay'}
                  >
                    {mask.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Opacity</span>
                    <span className="text-xs text-gray-600">{Math.round(mask.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={mask.opacity}
                    onChange={(e) => updateMaskOpacity(mask.id, parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    disabled={!mask.visible}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveMasks(prevMasks => prevMasks.map(mask => ({ ...mask, visible: true })))}
                className="flex-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              >
                Show All
              </button>
              <button
                onClick={() => setActiveMasks(prevMasks => prevMasks.map(mask => ({ ...mask, visible: false })))}
                className="flex-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                Hide All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cache Status Indicator */}
      {/* {isCached && cachedAt && (
        <div className="absolute bottom-3 right-3 z-[999] bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-xs shadow-md">
          <div className="flex items-start space-x-2">
            <div className="text-blue-600 mt-0.5">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-blue-900">Cached Data</p>
              <p className="text-xs text-blue-700 mt-0.5">
                Updated: {new Date(cachedAt).toLocaleDateString()} at {new Date(cachedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div> */}
      {/* )} */}
    </div>
  );
};