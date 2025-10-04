import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMapEvents, ScaleControl, Rectangle } from 'react-leaflet';
import L, { type LeafletMouseEvent } from 'leaflet';
import { Square, ZoomIn, ZoomOut, Layers, RotateCcw, LocateFixed } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './map.css';


// Fix for default markers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LeafletMapProps {
  onPolygonComplete?: (coordinates: number[][], area: number) => void;
  initialCoordinates?: number[][];
  height?: string;
  className?: string;
}

// Maximum allowed area in hectares (100 km² = 10,000 hectares) - currently unused
// const MAX_AREA_HECTARES = parseInt(import.meta.env.VITE_MAX_AREA_HECTARES  || "10000");
interface DrawingControlsProps {
  onPolygonComplete: ((coordinates: number[][], area: number) => void) | undefined;
  // Square control props
  isSquareMode: boolean;
  setIsSquareMode: (mode: boolean) => void;
  squareBounds: [[number, number], [number, number]] | null;
  setSquareBounds: (bounds: [[number, number], [number, number]] | null) => void;
  onSquareComplete: (coordinates: number[][], area: number) => void;
}

const DrawingControls: React.FC<DrawingControlsProps> = ({
  // onPolygonComplete - keeping for future functionality
  // Square control props
  isSquareMode,
  setIsSquareMode,
  // squareBounds - keeping for future functionality
  setSquareBounds,
  onSquareComplete
}) => {
  useMapEvents({
    click: (e: LeafletMouseEvent) => {
      if (isSquareMode) {
        // Create a 10km² square centered at the clicked location
        const centerLat = e.latlng.lat;
        const centerLng = e.latlng.lng;
        const sideLengthKm = Math.sqrt(10); // ~3.162 km per side for 10 km²
        
        // Latitude: 1 degree ≈ 111.32 km (constant everywhere)
        const latDegreesPerKm = 1 / 111.32;
        
        // Longitude: varies by latitude
        // At latitude φ, 1 degree longitude = 111.32 * cos(φ) km
        const lngDegreesPerKm = 1 / (111.32 * Math.cos(centerLat * Math.PI / 180));
        
        // Calculate offsets for each dimension
        const latOffset = (sideLengthKm / 2) * latDegreesPerKm;
        const lngOffset = (sideLengthKm / 2) * lngDegreesPerKm;
        
        // Create bounds [southWest, northEast]
        const bounds: [[number, number], [number, number]] = [
          [centerLat - latOffset, centerLng - lngOffset], // South-West
          [centerLat + latOffset, centerLng + lngOffset]  // North-East
        ];
        
        setSquareBounds(bounds);
        setIsSquareMode(false);
        
        // Notify parent of square completion
        // Convert bounds to polygon coordinates format [lng, lat]
        const squareCoords = [
          [bounds[0][1], bounds[0][0]], // SW
          [bounds[1][1], bounds[0][0]], // SE
          [bounds[1][1], bounds[1][0]], // NE
          [bounds[0][1], bounds[1][0]], // NW
          [bounds[0][1], bounds[0][0]]  // Close polygon
        ];
        onSquareComplete(squareCoords, 1000); // 10km² = 1000 hectares
      }
    }
  });

  return null;
};



export const LeafletMap: React.FC<LeafletMapProps> = ({
  onPolygonComplete,
  initialCoordinates = [],
  height = '400px',
  className = ''
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentPolygon, setCurrentPolygon] = useState<[number, number][]>([]);
  const [mapStyle, setMapStyle] = useState<'hybrid' | 'satellite' | 'streets'>('hybrid');
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  // Square control state
  const [isSquareMode, setIsSquareMode] = useState(false);
  const [squareBounds, setSquareBounds] = useState<[[number, number], [number, number]] | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const MAP_API_KEY = import.meta.env.VITE_MAP_API_KEY;

  // Convert initial coordinates if provided
  useEffect(() => {
    if (initialCoordinates.length > 0) {
      const leafletCoords: [number, number][] = initialCoordinates
        .filter(coord => coord.length >= 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number')
        .map(coord => [coord[1] as number, coord[0] as number]);
      setCurrentPolygon(leafletCoords); // Set for future polygon display functionality
    }
  }, [initialCoordinates]);



  // Function to handle square mode
  const handleSquareMode = () => {
    setIsSquareMode(!isSquareMode);
    setCurrentPolygon([]);
    setShowStyleSelector(false);
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
      mapRef.current.setView(defaultCenter, Number(import.meta.env.VITE_MAP_DEFAULT_ZOOM) || 10);
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
        duration: 2 // seconds
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

  // Map tile URLs for different styles
  const mapStyles = {
    hybrid: `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${MAP_API_KEY}`,
    satellite: `https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${MAP_API_KEY}`,
    streets: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAP_API_KEY}`,
  };

  const defaultCenter: [number, number] = [
    Number(import.meta.env.VITE_MAP_DEFAULT_CENTER_LAT) || 28.6139,
    Number(import.meta.env.VITE_MAP_DEFAULT_CENTER_LNG) || 77.2090
  ];

  // Function to handle square completion
  const handleSquareComplete = useCallback((coords: number[][], area: number) => {
    if (onPolygonComplete) {
      onPolygonComplete(coords, area);
    }
  }, [onPolygonComplete]);

  return (
    <div className={`relative ${className}`} style={{ zIndex: 1 }}>
      {/* Map Container */}
      <div style={{ height}} className="w-full rounded-lg overflow-hidden border border-neutral-200">
        <MapContainer
          center={defaultCenter}
          zoom={Number(import.meta.env.VITE_MAP_DEFAULT_ZOOM) || 10}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          ref={mapRef}
        >
          {/* Base Layer - Dynamic based on selected style */}
          <TileLayer
            key={mapStyle}
            url={mapStyles[mapStyle]}
            attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          />

          {/* Scale Control - No zoom control */}
          <ScaleControl position="bottomleft" imperial={false} />

          {/* Drawing Controls */}
          <DrawingControls
            onPolygonComplete={onPolygonComplete}
            // Square control props
            isSquareMode={isSquareMode}
            setIsSquareMode={setIsSquareMode}
            squareBounds={squareBounds}
            setSquareBounds={setSquareBounds}
            onSquareComplete={handleSquareComplete}
          />



          {/* Display square */}
          {squareBounds && (
            <Rectangle
              bounds={squareBounds}
              pathOptions={{
                color: '#3b82f6',
                weight: 2,
                fillOpacity: 0.2,
                fillColor: '#3b82f6'
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Left Side Controls Panel */}
      <div className="absolute top-3 left-3 z-[1000] bg-white rounded-md shadow-lg border border-neutral-700">
        <div className="p-2 space-y-1.5">
          {/* Square Control Button */}
          <button
            type="button"
            onClick={handleSquareMode}
            className={`w-8 h-8 bg-white text-black rounded-sm hover:bg-gray-100 flex items-center justify-center transition-all duration-200 group ${isSquareMode ? 'bg-gray-200' : ''}`}
            title="Add 10km² Square"
          >
            <Square className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>

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
        </div>

        {/* Map Style Selector */}
        {showStyleSelector && (
          <div className="absolute left-full top-0 ml-2 bg-white rounded-md shadow-lg border border-neutral-700 py-1 min-w-[100px]">
            <button
              type="button"
              onClick={() => handleStyleChange('hybrid')}
              className={`w-full px-3 py-1.5 text-xs text-left transition-colors ${
                mapStyle === 'hybrid' 
                  ? 'bg-gray-100 text-black' 
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              Hybrid
            </button>
            <button
              type="button"
              onClick={() => handleStyleChange('satellite')}
              className={`w-full px-3 py-1.5 text-xs text-left transition-colors ${
                mapStyle === 'satellite' 
                  ? 'bg-gray-100 text-black' 
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => handleStyleChange('streets')}
              className={`w-full px-3 py-1.5 text-xs text-left transition-colors ${
                mapStyle === 'streets' 
                  ? 'bg-gray-100 text-black' 
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              Streets
            </button>
          </div>
        )}
      </div>

      {/* Status Display */}
      {squareBounds && (
        <div className="absolute bottom-3 right-3 bg-white text-black px-3 py-2 rounded-md shadow-lg border border-neutral-700 text-sm z-[1000]">
          <>
            <div className="font-medium text-black">10km² Square</div>
            <div className="font-medium text-emerald-400">
              Area: 1000.0 ha
            </div>
          </>
        </div>
      )}

      {/* Instructions */}
      {isSquareMode && (
        <div className="absolute top-3 right-3 bg-white text-black px-4 py-3 rounded-md max-w-xs z-[1000] shadow-lg border border-neutral-700">
          <div className="font-medium mb-2 flex items-center text-black">
            <Square className="h-4 w-4 mr-2 text-emerald-400" />
            Square Placement Mode
          </div>
          <div className="text-xs leading-relaxed text-black">
            • Click anywhere on the map<br />
            • A 10km² square will be placed<br />
            • Square can be repositioned by enabling this mode again
          </div>
        </div>
      )}
    </div>
  );
};