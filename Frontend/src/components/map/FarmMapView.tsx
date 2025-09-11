import { useState, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, ScaleControl, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { Layers, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface FarmMapViewProps {
  coordinates: number[][]; // Array of [lng, lat] pairs
  farmName: string;
  height?: string;
  className?: string;
}

export const FarmMapView: React.FC<FarmMapViewProps> = ({
  coordinates,
  farmName,
  height = '400px',
  className = ''
}) => {
  const [mapStyle, setMapStyle] = useState<'hybrid' | 'satellite' | 'streets'>('hybrid');
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const MAP_API_KEY = import.meta.env.VITE_MAP_API_KEY;

  // Convert coordinates to Leaflet format [lat, lng]
  // coordinates: number[][] is expected as [lng, lat] pairs
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
    if (maxRange > 1) return 8;
    if (maxRange > 0.1) return 10;
    if (maxRange > 0.01) return 12;
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

  const handleStyleChange = (style: 'hybrid' | 'satellite' | 'streets') => {
    setMapStyle(style);
    setShowStyleSelector(false);
  };

  const center = getPolygonCenter();
  const zoom = getZoomLevel();

  return (
    <div className={`relative ${className}`}>
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

          {/* Custom Zoom Control */}
          <ZoomControl position="bottomright" />

          {/* Scale Control */}
          <ScaleControl position="bottomleft" imperial={false} />

          {/* Farm Boundary Polygon */}
          {leafletCoords.length > 2 && (
            <Polygon
              positions={leafletCoords}
              pathOptions={{
                color: '#10b981',
                weight: 3,
                fillOpacity: 0.2,
                fillColor: '#10b981'
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Left Side Controls Panel */}
      <div className="absolute top-4 left-4 space-y-3 z-[1000]">
        {/* Farm Info */}
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-lg">
          <div className="px-3 py-2 border-b border-gray-200">
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Farm Info</div>
          </div>
          <div className="p-3">
            <div className="text-sm font-medium text-gray-900">{farmName}</div>
            <div className="text-xs text-gray-600 mt-1">{coordinates.length} boundary points</div>
          </div>
        </div>

        {/* Map Controls */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-3 py-2 border-b border-gray-200">
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Map Controls</div>
          </div>
          <div className="p-2 space-y-1">
            <button
              type="button"
              onClick={handleZoomIn}
              className="w-full p-2 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center space-x-2 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
              <span className="text-sm">Zoom In</span>
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="w-full p-2 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center space-x-2 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
              <span className="text-sm">Zoom Out</span>
            </button>
            <button
              type="button"
              onClick={handleResetView}
              className="w-full p-2 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center space-x-2 transition-colors"
              title="Reset View"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="text-sm">Reset</span>
            </button>
          </div>
        </div>

        {/* Map Style Selector */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-3 py-2 border-b border-gray-200">
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Map Style</div>
          </div>
          <div className="p-2">
            <button
              type="button"
              onClick={() => setShowStyleSelector(!showStyleSelector)}
              className="w-full p-2 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center space-x-2 transition-colors"
              title="Change Map Style"
            >
              <Layers className="h-4 w-4" />
              <span className="text-sm capitalize">{mapStyle}</span>
            </button>
            {showStyleSelector && (
              <div className="mt-2 space-y-1">
                <button
                  type="button"
                  onClick={() => handleStyleChange('hybrid')}
                  className={`w-full p-2 text-sm rounded transition-colors ${
                    mapStyle === 'hybrid' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  Hybrid
                </button>
                <button
                  type="button"
                  onClick={() => handleStyleChange('satellite')}
                  className={`w-full p-2 text-sm rounded transition-colors ${
                    mapStyle === 'satellite' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  Satellite
                </button>
                <button
                  type="button"
                  onClick={() => handleStyleChange('streets')}
                  className={`w-full p-2 text-sm rounded transition-colors ${
                    mapStyle === 'streets' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  Streets
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};