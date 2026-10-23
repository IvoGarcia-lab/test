'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef, Component, ErrorInfo, ReactNode } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
  useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps';
import { BuildingItem } from '@/types/architecture';
import StreetViewPanoramaView from './StreetViewPanoramaView';
import {
  Compass,
  MapPin,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  Box,
  Map as MapIcon,
  Play,
  Pause,
  RotateCw,
  AlertCircle,
  ExternalLink,
  Layers,
  KeyRound,
  Check,
} from 'lucide-react';

export type MapPerspective = '2d' | '3d' | 'streetview';

interface GoogleArchitecturalMapProps {
  buildings: BuildingItem[];
  selectedBuildingId: string | null;
  onSelectBuilding: (building: BuildingItem) => void;
  perspective?: MapPerspective;
  onPerspectiveChange?: (p: MapPerspective) => void;
  onFallbackToLeaflet?: () => void;
  className?: string;
}

// Error boundary to catch any runtime exceptions from Google Maps SDK or unbilled projects
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: (error: Error) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class GoogleMapErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Google Maps ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error);
    }
    return this.props.children;
  }
}

// Controller component to smoothly pan/zoom Google Map and apply 3D tilt/heading
function MapCameraController({
  selectedBuilding,
  tilt,
  heading,
}: {
  selectedBuilding: BuildingItem | null;
  tilt: number;
  heading: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !selectedBuilding) return;

    map.panTo({
      lat: selectedBuilding.coordinates.lat,
      lng: selectedBuilding.coordinates.lng,
    });

    // If in 3D perspective mode, zoom close to visualize building volumetrics
    if (tilt > 0) {
      map.setZoom(17.5);
    } else {
      map.setZoom(14);
    }
  }, [map, selectedBuilding, tilt]);

  // Apply tilt and heading to the underlying map
  useEffect(() => {
    if (!map) return;
    map.setTilt(tilt);
    map.setHeading(heading);
  }, [map, tilt, heading]);

  return null;
}

// Marker component with InfoWindow anchor support
function BuildingMarker({
  building,
  isSelected,
  onSelect,
}: {
  building: BuildingItem;
  isSelected: boolean;
  onSelect: (b: BuildingItem) => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [closedManually, setClosedManually] = useState(false);

  // Declarative open state: open when selected unless user clicked close
  const isInfoOpen = isSelected && !closedManually;

  const handleClick = useCallback(() => {
    setClosedManually(false);
    onSelect(building);
  }, [building, onSelect]);

  const handleClose = useCallback(() => {
    setClosedManually(true);
  }, []);

  const position = useMemo(
    () => ({ lat: building.coordinates.lat, lng: building.coordinates.lng }),
    [building.coordinates.lat, building.coordinates.lng]
  );

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={position}
        onClick={handleClick}
        title={building.title}
        zIndex={isSelected ? 100 : 1}
      >
        <div className={`relative transition-transform duration-300 ${isSelected ? 'scale-125' : 'hover:scale-110'}`}>
          {isSelected && (
            <div className="absolute -inset-2 rounded-full bg-[#8c6239]/30 animate-ping pointer-events-none" />
          )}
          <Pin
            background={isSelected ? '#1c1917' : building.isUserUpload ? '#8c6239' : '#fbf9f5'}
            borderColor={isSelected ? '#8c6239' : '#1c1917'}
            glyphColor={isSelected ? '#fbf9f5' : building.isUserUpload ? '#ffffff' : '#8c6239'}
            scale={isSelected ? 1.25 : 1.0}
          />
        </div>
      </AdvancedMarker>

      {isInfoOpen && marker && (
        <InfoWindow
          anchor={marker}
          onCloseClick={handleClose}
          maxWidth={280}
        >
          <div className="p-1 max-w-[240px] text-[#1c1917] font-sans">
            <div className="h-24 w-full rounded overflow-hidden bg-stone-200 mb-2 relative">
              <img
                src={building.imageUrl}
                alt={building.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/aistudio/fgghfhg_c0ef2bf2.jpg';
                }}
              />
              <span className="absolute top-1.5 left-1.5 bg-[#1c1917]/85 text-[#fbf9f5] text-[9px] font-mono px-1.5 py-0.5 rounded">
                {building.year}
              </span>
            </div>
            <div className="font-editorial text-sm font-bold leading-tight mb-0.5">
              {building.title}
            </div>
            <div className="text-[11px] font-semibold text-[#8c6239] mb-1">
              {building.architect}
            </div>
            <div className="text-[10px] text-[#6b6357] flex items-center gap-1 mb-2">
              <MapPin className="w-3 h-3 text-[#8c6239] shrink-0" />
              <span className="truncate">{building.city}, {building.country}</span>
            </div>
            <div className="text-[9px] font-mono bg-[#f4efe6] p-1 rounded border border-[#e5dfd3] text-[#8c6239]">
              {building.coordinates.lat.toFixed(4)}°, {building.coordinates.lng.toFixed(4)}°
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

// Inner Google Map Implementation
function GoogleMapInner({
  buildings,
  selectedBuildingId,
  onSelectBuilding,
  mapType,
  onMapTypeChange,
  perspective,
  onPerspectiveChange,
}: {
  buildings: BuildingItem[];
  selectedBuildingId: string | null;
  onSelectBuilding: (building: BuildingItem) => void;
  mapType: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  onMapTypeChange: (type: 'roadmap' | 'satellite' | 'hybrid' | 'terrain') => void;
  perspective: MapPerspective;
  onPerspectiveChange: (p: MapPerspective) => void;
}) {
  const map = useMap();
  const selectedBuilding = useMemo(
    () => buildings.find((b) => b.id === selectedBuildingId) || buildings[0] || null,
    [buildings, selectedBuildingId]
  );

  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | null>(null);

  // 3D camera controls
  const [customTilt, setCustomTilt] = useState<number>(65);
  const [heading, setHeading] = useState<number>(0);
  const [isOrbiting, setIsOrbiting] = useState<boolean>(false);
  const orbitIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Effective tilt derived from current perspective
  const effectiveTilt = perspective === '3d' ? customTilt : 0;

  // Camera zoom when in 3D mode
  useEffect(() => {
    if (perspective === '3d' && map && selectedBuilding) {
      map.setZoom(17.5);
    }
  }, [perspective, map, selectedBuilding]);

  // Orbit rotation loop for 3D exploration
  useEffect(() => {
    if (isOrbiting && perspective === '3d') {
      orbitIntervalRef.current = setInterval(() => {
        setHeading((prev) => (prev + 1) % 360);
      }, 50);
    } else {
      if (orbitIntervalRef.current) {
        clearInterval(orbitIntervalRef.current);
        orbitIntervalRef.current = null;
      }
    }

    return () => {
      if (orbitIntervalRef.current) {
        clearInterval(orbitIntervalRef.current);
        orbitIntervalRef.current = null;
      }
    };
  }, [isOrbiting, perspective]);

  const handleResetBounds = useCallback(() => {
    if (!map || buildings.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    buildings.forEach((b) => {
      bounds.extend({ lat: b.coordinates.lat, lng: b.coordinates.lng });
    });
    map.fitBounds(bounds, 50);
    setHeading(0);
    setIsOrbiting(false);
    onPerspectiveChange('2d');
  }, [map, buildings, onPerspectiveChange]);

  const handleZoomIn = () => map?.setZoom((map.getZoom() ?? 3) + 1);
  const handleZoomOut = () => map?.setZoom((map.getZoom() ?? 3) - 1);

  const rotateHeading = (delta: number) => {
    setHeading((prev) => (prev + delta + 360) % 360);
  };

  return (
    <div className="relative w-full h-full">
      {/* Google Street View Panorama Viewport Overlay */}
      {perspective === 'streetview' && selectedBuilding && (
        <StreetViewPanoramaView
          building={selectedBuilding}
          onClose={() => onPerspectiveChange('2d')}
        />
      )}

      {/* Main Google Maps Viewport */}
      <Map
        mapId="DEMO_MAP_ID"
        defaultCenter={{ lat: 35.0, lng: -20.0 }}
        defaultZoom={3}
        mapTypeId={mapType}
        gestureHandling="greedy"
        disableDefaultUI={true}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        className="w-full h-full"
        onMousemove={(e) => {
          if (e.detail?.latLng) {
            setMouseCoords({
              lat: e.detail.latLng.lat,
              lng: e.detail.latLng.lng,
            });
          }
        }}
      >
        <MapCameraController
          selectedBuilding={selectedBuilding}
          tilt={effectiveTilt}
          heading={heading}
        />

        {buildings.map((b) => (
          <BuildingMarker
            key={b.id}
            building={b}
            isSelected={b.id === selectedBuildingId}
            onSelect={onSelectBuilding}
          />
        ))}
      </Map>

      {/* Floating Mode Switcher (2D / 3D / Street View) - Top Left */}
      <div className="absolute top-4 left-4 z-10 flex items-center bg-[#fbf9f5]/90 backdrop-blur-md rounded-lg p-1 border border-[#e5dfd3] shadow-md text-xs font-semibold">
        <button
          onClick={() => {
            setIsOrbiting(false);
            onPerspectiveChange('2d');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
            perspective === '2d'
              ? 'bg-[#1c1917] text-[#fbf9f5] shadow-xs'
              : 'text-[#6b6357] hover:text-[#1c1917]'
          }`}
          title="Vista Ortográfica 2D (Planta)"
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Planta 2D</span>
        </button>

        <button
          onClick={() => {
            onPerspectiveChange('3d');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
            perspective === '3d'
              ? 'bg-[#1c1917] text-[#fbf9f5] shadow-xs'
              : 'text-[#6b6357] hover:text-[#1c1917]'
          }`}
          title="Vista Isométrica 3D (Tectónica)"
        >
          <Box className="w-3.5 h-3.5 text-[#8c6239]" />
          <span>Perspetiva 3D</span>
        </button>

        <button
          onClick={() => {
            setIsOrbiting(false);
            onPerspectiveChange('streetview');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
            perspective === 'streetview'
              ? 'bg-[#8c6239] text-[#fbf9f5] shadow-xs'
              : 'text-[#8c6239] hover:bg-[#8c6239]/10'
          }`}
          title="Vista 360° com Google Street View"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Street View 360°</span>
        </button>
      </div>

      {/* 3D Orbit & Angle Controls Floating Pill (Shown when 3D mode is active) */}
      {perspective === '3d' && (
        <div className="absolute top-16 left-4 z-10 flex flex-wrap items-center gap-1.5 bg-[#fbf9f5]/95 backdrop-blur-md p-1.5 rounded-lg border border-[#e5dfd3] shadow-lg text-xs animate-in slide-in-from-top duration-200">
          <span className="font-mono text-[10px] px-1.5 text-[#8c6239] font-bold uppercase">
            3D: {heading}°
          </span>

          {/* Orbit Toggle */}
          <button
            onClick={() => setIsOrbiting((prev) => !prev)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
              isOrbiting
                ? 'bg-[#8c6239] text-white shadow-xs'
                : 'bg-[#f4efe6] text-[#1c1917] hover:bg-[#e7e3da]'
            }`}
            title={isOrbiting ? 'Pausar rotação 3D' : 'Iniciar órbita 3D 360°'}
          >
            {isOrbiting ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isOrbiting ? 'Órbita Ativa' : 'Orbitar 360°'}</span>
          </button>

          {/* Rotate Left / Right */}
          <button
            onClick={() => rotateHeading(-45)}
            className="p-1 rounded bg-[#f4efe6] hover:bg-[#e7e3da] text-[#1c1917] text-[10px] font-mono px-1.5"
            title="Rodar -45°"
          >
            -45°
          </button>
          <button
            onClick={() => rotateHeading(45)}
            className="p-1 rounded bg-[#f4efe6] hover:bg-[#e7e3da] text-[#1c1917] text-[10px] font-mono px-1.5"
            title="Rodar +45°"
          >
            +45°
          </button>

          {/* Tilt adjustment */}
          <button
            onClick={() => setCustomTilt((t) => (t === 65 ? 45 : 65))}
            className="p-1 rounded bg-[#f4efe6] hover:bg-[#e7e3da] text-[#1c1917] text-[10px] font-mono px-1.5"
            title="Alternar Inclinação"
          >
            {customTilt}° Inclinação
          </button>

          {/* Reset North */}
          <button
            onClick={() => setHeading(0)}
            className="p-1 rounded bg-[#f4efe6] hover:bg-[#e7e3da] text-[#8c6239] transition-colors"
            title="Redefinir Norte (0°)"
            aria-label="Redefinir Norte"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Controls - Top Right */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {/* Map Type Switcher */}
        <div className="flex bg-[#fbf9f5]/90 backdrop-blur-md rounded-lg p-1 border border-[#e5dfd3] shadow-md text-xs font-medium">
          <button
            onClick={() => onMapTypeChange('roadmap')}
            className={`px-2.5 py-1 rounded transition-colors ${
              mapType === 'roadmap' ? 'bg-[#1c1917] text-[#fbf9f5]' : 'text-[#6b6357] hover:text-[#1c1917]'
            }`}
          >
            Padrão
          </button>
          <button
            onClick={() => onMapTypeChange('satellite')}
            className={`px-2.5 py-1 rounded transition-colors ${
              mapType === 'satellite' ? 'bg-[#1c1917] text-[#fbf9f5]' : 'text-[#6b6357] hover:text-[#1c1917]'
            }`}
          >
            Satélite
          </button>
          <button
            onClick={() => onMapTypeChange('terrain')}
            className={`px-2.5 py-1 rounded transition-colors ${
              mapType === 'terrain' ? 'bg-[#1c1917] text-[#fbf9f5]' : 'text-[#6b6357] hover:text-[#1c1917]'
            }`}
          >
            Relevo
          </button>
        </div>

        {/* Zoom & Fit Bounds Controls */}
        <div className="flex flex-col bg-[#fbf9f5]/90 backdrop-blur-md rounded-lg border border-[#e5dfd3] shadow-md overflow-hidden self-end">
          <button
            onClick={handleZoomIn}
            className="p-2 text-[#1c1917] hover:bg-[#e7e3da] transition-colors border-b border-[#e5dfd3]"
            title="Aumentar Zoom"
            aria-label="Aumentar Zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 text-[#1c1917] hover:bg-[#e7e3da] transition-colors border-b border-[#e5dfd3]"
            title="Diminuir Zoom"
            aria-label="Diminuir Zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetBounds}
            className="p-2 text-[#8c6239] hover:bg-[#e7e3da] transition-colors"
            title="Ajustar e Ver Todos os Monumentos"
            aria-label="Ver Todos os Monumentos"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating HUD - Bottom Left */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3">
        <div className="flex items-center gap-2 bg-[#fbf9f5]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#e5dfd3] shadow-sm text-xs font-mono text-[#6b6357]">
          <Compass className="w-3.5 h-3.5 text-[#8c6239]" />
          <span>
            {mouseCoords
              ? `${mouseCoords.lat.toFixed(4)}° N, ${mouseCoords.lng.toFixed(4)}° E`
              : perspective === '3d'
              ? `Vista 3D (${effectiveTilt}° inclinação, ${heading}° azimute)`
              : 'Google Maps Ativo'}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 bg-[#fbf9f5]/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-[#e5dfd3] text-xs text-[#1c1917] font-medium">
          <MapPin className="w-3.5 h-3.5 text-[#8c6239]" />
          <span>{buildings.length} monumentos georreferenciados</span>
        </div>
      </div>
    </div>
  );
}

// Fallback presentation when Google Cloud project needs billing enabled
function GoogleBillingFallbackUI({
  onFallbackToLeaflet,
  currentKey,
  onUpdateKey,
}: {
  onFallbackToLeaflet?: () => void;
  currentKey: string;
  onUpdateKey: (newKey: string) => void;
}) {
  const [inputKey, setInputKey] = useState('');
  const [applied, setApplied] = useState(false);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim()) {
      onUpdateKey(inputKey.trim());
      setApplied(true);
      setTimeout(() => setApplied(false), 2000);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[380px] bg-[#fbf9f5] border border-[#e5dfd3] rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-[#8c6239]" />
      </div>

      <h3 className="font-editorial text-xl font-bold text-[#1c1917] mb-2">
        Ativação de Faturação Necessária no Google Maps
      </h3>

      <p className="text-xs sm:text-sm text-[#6b6357] max-w-lg leading-relaxed mb-6">
        A chave de API Google Maps informada pertence a um projeto do Google Cloud onde a faturação ainda não foi ativada.
        O Google Maps Platform oferece <strong>$200 de crédito gratuito mensal</strong> para cada projeto, mas exige a ativação de uma conta de faturação para renderizar os mapas dinâmicos e Street View.
      </p>

      {/* Action CTA Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        <a
          href="https://console.cloud.google.com/project/_/billing/enable"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#8c6239] text-white text-xs sm:text-sm font-semibold hover:bg-[#a44826] transition-colors shadow-sm"
        >
          <span>Ativar Faturação no Google Cloud</span>
          <ExternalLink className="w-4 h-4" />
        </a>

        {onFallbackToLeaflet && (
          <button
            type="button"
            onClick={onFallbackToLeaflet}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1c1917] text-[#fbf9f5] text-xs sm:text-sm font-semibold hover:bg-[#44403c] transition-colors"
          >
            <Layers className="w-4 h-4 text-[#8c6239]" />
            <span>Usar Cartografia Mineral (100% Gratuita & Ativa)</span>
          </button>
        )}
      </div>

      {/* Alternative Key Input */}
      <div className="w-full max-w-md pt-5 border-t border-[#e5dfd3]">
        <div className="text-[11px] text-[#6b6357] mb-2 flex items-center justify-center gap-1.5 font-medium">
          <KeyRound className="w-3.5 h-3.5 text-[#8c6239]" />
          <span>Ou insira outra chave Google Maps com faturação ativa:</span>
        </div>

        <form onSubmit={handleApply} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="AIzaSy..."
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-[#e5dfd3] rounded-lg focus:outline-none focus:border-[#8c6239]"
          />
          <button
            type="submit"
            className="px-3.5 py-2 text-xs font-semibold bg-[#f4efe6] hover:bg-[#e7e3da] text-[#1c1917] rounded-lg border border-[#e5dfd3] transition-colors"
          >
            {applied ? <Check className="w-4 h-4 text-green-600" /> : 'Aplicar'}
          </button>
        </form>

        <p className="text-[10px] text-[#8c6239] mt-2 font-mono truncate">
          Chave atual: {currentKey ? `${currentKey.slice(0, 10)}...${currentKey.slice(-4)}` : 'Não definida'}
        </p>
      </div>
    </div>
  );
}

export default function GoogleArchitecturalMap({
  buildings,
  selectedBuildingId,
  onSelectBuilding,
  perspective = '2d',
  onPerspectiveChange,
  onFallbackToLeaflet,
  className = '',
}: GoogleArchitecturalMapProps) {
  const [apiKey, setApiKey] = useState<string>(() => {
    return (
      (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string) ||
      (process.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
      'AIzaSyBha53j3sjwVTc9ftiYOUPyxbIIDCBwkIY'
    );
  });

  const [hasBillingOrAuthError, setHasBillingOrAuthError] = useState(false);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');

  // Intercept Google Maps gm_authFailure and billing errors
  useEffect(() => {
    const handleAuthFailure = () => {
      setHasBillingOrAuthError(true);
    };

    // Attach to window.gm_authFailure
    const prevAuthFailure = (window as unknown as { gm_authFailure?: () => void }).gm_authFailure;
    (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
      handleAuthFailure();
      if (prevAuthFailure) prevAuthFailure();
    };

    // Intercept console.error for Google Maps billing messages
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      const msg = args.map((a) => String(a)).join(' ');
      if (
        msg.includes('Billing') ||
        msg.includes('billing/enable') ||
        msg.includes('ApiProjectMapError') ||
        msg.includes('OverQuotaMapError')
      ) {
        setHasBillingOrAuthError(true);
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  const handlePerspectiveChange = useCallback(
    (newP: MapPerspective) => {
      onPerspectiveChange?.(newP);
    },
    [onPerspectiveChange]
  );

  if (hasBillingOrAuthError) {
    return (
      <div className={`relative w-full h-full min-h-[380px] ${className}`}>
        <GoogleBillingFallbackUI
          onFallbackToLeaflet={onFallbackToLeaflet}
          currentKey={apiKey}
          onUpdateKey={(newKey) => {
            setApiKey(newKey);
            setHasBillingOrAuthError(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full min-h-[380px] overflow-hidden rounded-xl border border-[#e5dfd3] bg-[#f4efe6] shadow-inner ${className}`}>
      <GoogleMapErrorBoundary
        fallback={() => (
          <GoogleBillingFallbackUI
            onFallbackToLeaflet={onFallbackToLeaflet}
            currentKey={apiKey}
            onUpdateKey={(newKey) => {
              setApiKey(newKey);
              setHasBillingOrAuthError(false);
            }}
          />
        )}
      >
        <APIProvider
          apiKey={apiKey}
          libraries={['marker', 'streetView']}
          onError={() => {
            setHasBillingOrAuthError(true);
          }}
        >
          <GoogleMapInner
            buildings={buildings}
            selectedBuildingId={selectedBuildingId}
            onSelectBuilding={onSelectBuilding}
            mapType={mapType}
            onMapTypeChange={setMapType}
            perspective={perspective}
            onPerspectiveChange={handlePerspectiveChange}
          />
        </APIProvider>
      </GoogleMapErrorBoundary>
    </div>
  );
}
