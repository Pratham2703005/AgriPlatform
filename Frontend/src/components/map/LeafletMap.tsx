import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMapEvents, Polygon, ScaleControl, ZoomControl } from 'react-leaflet';
import L, {type LeafletMouseEvent } from 'leaflet';
import { Square, Pentagon, Check, Trash2, ZoomIn, ZoomOut, Layers, RotateCcw } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './map.css';

// Fix for default markers
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

interface DrawingControlsProps {
  onPolygonComplete: ((coordinates: number[][], area: number) => void) | undefined;
  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;
  currentPolygon: [number, number][];
  setCurrentPolygon: (polygon: [number, number][]) => void;
  drawingMode: 'polygon' | 'rectangle' | null;
  setDrawingMode: (mode: 'polygon' | 'rectangle' | null) => void;
}

const DrawingControls: React.FC<DrawingControlsProps> = ({
  onPolygonComplete,
  isDrawing,
  setIsDrawing,
  currentPolygon,
  setCurrentPolygon,
  drawingMode,
  setDrawingMode
}) => {
  const [rectangleStart, setRectangleStart] = useState<[number, number] | null>(null);

  useMapEvents({
    click: (e: LeafletMouseEvent) => {
      if (!isDrawing) return;

      const newPoint: [number, number] = [e.latlng.lat, e.latlng.lng];

      if (drawingMode === 'rectangle') {
        if (!rectangleStart) {
          setRectangleStart(newPoint);
          setCurrentPolygon([newPoint]);
        } else {
          // Complete rectangle
          const [lat1, lng1] = rectangleStart;
          const [lat2, lng2] = newPoint;
          const rectanglePolygon: [number, number][] = [
            [lat1, lng1],
            [lat1, lng2],
            [lat2, lng2],
            [lat2, lng1],
            [lat1, lng1] // Close the rectangle
          ];
          setCurrentPolygon(rectanglePolygon);
          setIsDrawing(false);
          setDrawingMode(null);
          setRectangleStart(null);

          const area = calculatePolygonArea(rectanglePolygon);
          const coordinates = rectanglePolygon.map(point => [point[1], point[0]]);
          if (onPolygonComplete) {
            onPolygonComplete(coordinates, area);
          }
        }
      } else if (drawingMode === 'polygon') {
        const newPolygon = [...currentPolygon, newPoint];
        setCurrentPolygon(newPolygon);
      }
    },
    dblclick: (e: LeafletMouseEvent) => {
      if (!isDrawing || drawingMode !== 'polygon' || currentPolygon.length < 3) return;

      e.originalEvent.preventDefault();
      setIsDrawing(false);
      setDrawingMode(null);

      // Calculate area and notify parent
      const area = calculatePolygonArea(currentPolygon);
      const coordinates = currentPolygon.map(point => [point[1], point[0]]); // Convert to [lng, lat]
      if (onPolygonComplete) {
        onPolygonComplete(coordinates, area);
      }
    },
    mousemove: (e: LeafletMouseEvent) => {
      if (!isDrawing || drawingMode !== 'rectangle' || !rectangleStart) return;

      const currentPoint: [number, number] = [e.latlng.lat, e.latlng.lng];
      const [lat1, lng1] = rectangleStart;
      const [lat2, lng2] = currentPoint;

      const rectanglePolygon: [number, number][] = [
        [lat1, lng1],
        [lat1, lng2],
        [lat2, lng2],
        [lat2, lng1],
        [lat1, lng1]
      ];
      setCurrentPolygon(rectanglePolygon);
    }
  });

  return null;
};

const calculatePolygonArea = (coordinates: [number, number][]): number => {
  if (coordinates.length < 3) return 0;

  let area = 0;
  const n = coordinates.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const currentPoint = coordinates[i];
    const nextPoint = coordinates[j];

    if (currentPoint && nextPoint) {
      area += currentPoint[1] * nextPoint[0]; // lng * lat
      area -= nextPoint[1] * currentPoint[0]; // lng * lat
    }
  }

  area = Math.abs(area) / 2;

  // Convert from square degrees to hectares (approximate)
  const hectares = area * 111320 * 111320 / 10000;
  return Math.round(hectares * 100) / 100;
};

export const LeafletMap: React.FC<LeafletMapProps> = ({
  onPolygonComplete,
  initialCoordinates = [],
  height = '400px',
  className = ''
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPolygon, setCurrentPolygon] = useState<[number, number][]>([]);
  const [drawingMode, setDrawingMode] = useState<'polygon' | 'rectangle' | null>(null);
  const [mapStyle, setMapStyle] = useState<'hybrid' | 'satellite' | 'streets'>('hybrid');
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const MAP_API_KEY = import.meta.env.VITE_MAP_API_KEY;

  // Convert initial coordinates if provided
  useEffect(() => {
    if (initialCoordinates.length > 0) {
      const leafletCoords: [number, number][] = initialCoordinates
        .filter(coord => coord.length >= 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number')
        .map(coord => [coord[1] as number, coord[0] as number]);
      setCurrentPolygon(leafletCoords);
    }
  }, [initialCoordinates]);

  const handleStartDrawing = (mode: 'polygon' | 'rectangle') => {
    setIsDrawing(true);
    setDrawingMode(mode);
    setCurrentPolygon([]);
  };

  const handleClearDrawing = () => {
    setIsDrawing(false);
    setDrawingMode(null);
    setCurrentPolygon([]);
  };

  const handleFinishDrawing = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (currentPolygon.length < 3) {
      alert('Please add at least 3 points to create a polygon');
      return;
    }

    setIsDrawing(false);
    setDrawingMode(null);
    const area = calculatePolygonArea(currentPolygon);
    const coordinates = currentPolygon.map(point => [point[1], point[0]]); // Convert to [lng, lat]
    if (onPolygonComplete) {
      onPolygonComplete(coordinates, area);
    }
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

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div style={{ height }} className="w-full rounded-lg overflow-hidden">
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

          {/* Custom Zoom Control */}
          <ZoomControl position="bottomright" />

          {/* Scale Control */}
          <ScaleControl position="bottomleft" imperial={false} />

          {/* Drawing Controls */}
          <DrawingControls
            onPolygonComplete={onPolygonComplete}
            isDrawing={isDrawing}
            setIsDrawing={setIsDrawing}
            currentPolygon={currentPolygon}
            setCurrentPolygon={setCurrentPolygon}
            drawingMode={drawingMode}
            setDrawingMode={setDrawingMode}
          />

          {/* Display current polygon */}
          {currentPolygon.length > 1 && (
            <Polygon
              positions={currentPolygon}
              pathOptions={{
                color: '#3b82f6',
                weight: 2,
                fillOpacity: 0.3,
                fillColor: '#3b82f6'
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Left Side Controls Panel */}
      <div className="absolute top-4 left-4 space-y-3 z-[1000]">
        {/* Drawing Tools */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-3 py-2 border-b border-gray-200">
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Drawing Tools</div>
          </div>
          <div className="p-2 space-y-1">
            {!isDrawing ? (
              <>
                <button
                  type="button"
                  onClick={() => handleStartDrawing('polygon')}
                  className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center space-x-2 transition-colors"
                  title="Draw Polygon"
                >
                  <Pentagon className="h-4 w-4" />
                  <span className="text-sm">Polygon</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStartDrawing('rectangle')}
                  className="w-full p-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center justify-center space-x-2 transition-colors"
                  title="Draw Rectangle"
                >
                  <Square className="h-4 w-4" />
                  <span className="text-sm">Rectangle</span>
                </button>
              </>
            ) : (
              <>
                <div className="text-xs text-gray-600 text-center py-1">
                  Drawing {drawingMode} ({currentPolygon.length} points)
                </div>
                {drawingMode === 'polygon' && (
                  <button
                    type="button"
                    onClick={handleFinishDrawing}
                    disabled={currentPolygon.length < 3}
                    className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
                    title="Finish Drawing"
                  >
                    <Check className="h-4 w-4" />
                    <span className="text-sm">Finish</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClearDrawing}
                  className="w-full p-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center space-x-2 transition-colors"
                  title="Clear Drawing"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="text-sm">Clear</span>
                </button>
              </>
            )}
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

      {/* Status Display */}
      {currentPolygon.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded-lg shadow-lg text-sm z-[1000]">
          <div className="font-medium">Points: {currentPolygon.length}</div>
          {currentPolygon.length > 2 && (
            <div className="text-green-600">
              Area: {calculatePolygonArea(currentPolygon)} hectares
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {isDrawing && (
        <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg text-sm max-w-xs z-[1000] shadow-lg">
          <div className="font-semibold mb-2 flex items-center">
            {drawingMode === 'polygon' ? (
              <Pentagon className="h-4 w-4 mr-2" />
            ) : (
              <Square className="h-4 w-4 mr-2" />
            )}
            Drawing {drawingMode}
          </div>
          <div className="text-xs leading-relaxed">
            {drawingMode === 'polygon' ? (
              <>
                • Click to add points<br />
                • Need at least 3 points<br />
                • Double-click to finish<br />
                • Or use "Finish" button
              </>
            ) : (
              <>
                • Click first corner<br />
                • Click opposite corner<br />
                • Rectangle will be created automatically
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};