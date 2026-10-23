'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BuildingItem } from '@/types/architecture';
import { Compass, MapPin, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import type * as LType from 'leaflet';

interface ArchitecturalMapProps {
  buildings: BuildingItem[];
  selectedBuildingId: string | null;
  onSelectBuilding: (building: BuildingItem) => void;
  className?: string;
}

type TileTheme = 'positron' | 'osm' | 'satellite';

const TILE_SERVERS: Record<TileTheme, { url: string; attribution: string; maxZoom: number }> = {
  positron: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    maxZoom: 19,
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS, NOAA',
    maxZoom: 18,
  },
};

export default function ArchitecturalMap({
  buildings,
  selectedBuildingId,
  onSelectBuilding,
  className = '',
}: ArchitecturalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LType.Map | null>(null);
  const markersRef = useRef<Map<string, LType.Marker>>(new Map());
  const tileLayerRef = useRef<LType.TileLayer | null>(null);
  const onSelectBuildingRef = useRef(onSelectBuilding);

  useEffect(() => {
    onSelectBuildingRef.current = onSelectBuilding;
  }, [onSelectBuilding]);

  const [activeTheme, setActiveTheme] = useState<TileTheme>('positron');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Initialize Map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const initialCenter: [number, number] = [35.0, -20.0];
      const initialZoom = 3;

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

      const currentConfig = TILE_SERVERS.positron;
      const tiles = L.tileLayer(currentConfig.url, {
        attribution: currentConfig.attribution,
        maxZoom: currentConfig.maxZoom,
      }).addTo(map);

      tileLayerRef.current = tiles;
      mapInstanceRef.current = map;

      map.on('mousemove', (e) => {
        setCurrentCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      setMapLoaded(true);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when activeTheme changes
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === 'undefined') return;

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }

      const config = TILE_SERVERS[activeTheme];
      const newTiles = L.tileLayer(config.url, {
        attribution: config.attribution,
        maxZoom: config.maxZoom,
      }).addTo(map);

      tileLayerRef.current = newTiles;
    });
  }, [activeTheme]);

  // Render / Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded || typeof window === 'undefined') return;

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      markersRef.current.forEach((marker) => {
        marker.remove();
      });
      markersRef.current.clear();

      buildings.forEach((item) => {
        const isSelected = item.id === selectedBuildingId;

        const markerHtml = `
          <div class="group relative flex items-center justify-center cursor-pointer transition-transform duration-300 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110 z-10'}">
            ${
              isSelected
                ? '<div class="absolute -inset-2.5 rounded-full bg-[#8c6239]/25 animate-ping"></div>'
                : ''
            }
            <div class="relative flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              isSelected
                ? 'bg-[#1c1917] border-[#8c6239] text-[#fbf9f5] shadow-lg shadow-[#8c6239]/30'
                : item.isUserUpload
                ? 'bg-[#8c6239] border-[#fbf9f5] text-white shadow-md'
                : 'bg-[#fbf9f5] border-[#1c1917] text-[#1c1917] shadow-md hover:bg-[#1c1917] hover:text-[#fbf9f5]'
            } transition-colors duration-200">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div class="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap bg-[#1c1917] text-[#fbf9f5] text-[10px] px-2 py-0.5 rounded shadow border border-[#8c6239]/40 z-30 font-medium">
              ${item.title}
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html: markerHtml,
          className: 'custom-architectural-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -18],
        });

        const marker = L.marker([item.coordinates.lat, item.coordinates.lng], { icon });

        const popupContent = `
          <div style="width: 240px; font-family: 'Plus Jakarta Sans', sans-serif;">
            <div style="height: 110px; width: 100%; position: relative; overflow: hidden; background: #e7e3da;">
              <img src="${item.imageUrl}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='/assets/aistudio/fgghfhg_c0ef2bf2.jpg'" />
              <div style="position: absolute; top: 8px; left: 8px; background: rgba(28,25,23,0.85); color: #fbf9f5; font-size: 9px; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">
                ${item.year}
              </div>
            </div>
            <div style="padding: 12px;">
              <div style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 15px; font-weight: 700; color: #1c1917; margin-bottom: 2px; line-height: 1.2;">
                ${item.title}
              </div>
              <div style="font-size: 11px; color: #8c6239; font-weight: 600; margin-bottom: 6px;">
                ${item.architect}
              </div>
              <div style="display: flex; align-items: center; gap: 4px; font-size: 10px; color: #6b6357; margin-bottom: 8px;">
                <span>📍 ${item.city}, ${item.country}</span>
              </div>
              <div style="font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #8c6239; background: #f4efe6; padding: 4px 6px; border-radius: 4px; border: 1px solid #e5dfd3;">
                ${item.coordinates.lat.toFixed(4)}°, ${item.coordinates.lng.toFixed(4)}°
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 280 });

        marker.on('click', () => {
          onSelectBuildingRef.current(item);
        });

        marker.addTo(map);
        markersRef.current.set(item.id, marker);
      });
    });
  }, [buildings, selectedBuildingId, mapLoaded]);

  // Center on Selected Building
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedBuildingId) return;

    const selected = buildings.find((b) => b.id === selectedBuildingId);
    if (!selected) return;

    const map = mapInstanceRef.current;
    map.flyTo([selected.coordinates.lat, selected.coordinates.lng], 13, {
      duration: 1.4,
      easeLinearity: 0.25,
    });

    const marker = markersRef.current.get(selectedBuildingId);
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 700);
    }
  }, [selectedBuildingId, buildings]);

  const handleResetBounds = () => {
    if (!mapInstanceRef.current || buildings.length === 0 || typeof window === 'undefined') return;

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      const bounds = L.latLngBounds(buildings.map((b) => [b.coordinates.lat, b.coordinates.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    });
  };

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  return (
    <div className={`relative w-full h-full min-h-[380px] overflow-hidden rounded-xl border border-[#e5dfd3] bg-[#f4efe6] shadow-inner ${className}`}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Map Controls - Top Right */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {/* Layer Switcher */}
        <div className="flex bg-[#fbf9f5]/90 backdrop-blur-md rounded-lg p-1 border border-[#e5dfd3] shadow-md">
          <button
            onClick={() => setActiveTheme('positron')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
              activeTheme === 'positron'
                ? 'bg-[#1c1917] text-[#fbf9f5]'
                : 'text-[#6b6357] hover:text-[#1c1917]'
            }`}
            title="Cartografia Mineral Minimalista"
          >
            Mineral
          </button>
          <button
            onClick={() => setActiveTheme('satellite')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
              activeTheme === 'satellite'
                ? 'bg-[#1c1917] text-[#fbf9f5]'
                : 'text-[#6b6357] hover:text-[#1c1917]'
            }`}
            title="Satélite Alta Resolução"
          >
            Satélite
          </button>
          <button
            onClick={() => setActiveTheme('osm')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
              activeTheme === 'osm'
                ? 'bg-[#1c1917] text-[#fbf9f5]'
                : 'text-[#6b6357] hover:text-[#1c1917]'
            }`}
            title="OpenStreetMap Urbano"
          >
            Urbano
          </button>
        </div>

        {/* Navigation / Zoom Controls */}
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
          <Compass className="w-3.5 h-3.5 text-[#8c6239] animate-spin" style={{ animationDuration: '18s' }} />
          <span>
            {currentCoords
              ? `${currentCoords.lat.toFixed(4)}° N, ${currentCoords.lng.toFixed(4)}° E`
              : 'Posicione o cursor sobre o mapa'}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 bg-[#fbf9f5]/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-[#e5dfd3] text-xs text-[#1c1917] font-medium">
          <MapPin className="w-3.5 h-3.5 text-[#8c6239]" />
          <span>{buildings.length} sítios assinalados</span>
        </div>
      </div>
    </div>
  );
}
