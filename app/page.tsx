'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import HeroBanner from '@/components/HeroBanner';
import GalleryGrid from '@/components/GalleryGrid';
import CuratorialDrawer from '@/components/CuratorialDrawer';
import ImageUploader from '@/components/ImageUploader';
import { INITIAL_BUILDINGS } from '@/lib/initial-buildings';
import { BuildingItem, ViewMode } from '@/types/architecture';
import { Sparkles, MapPin, CheckCircle, Globe2 } from 'lucide-react';

// Dynamic import for Google Maps component
const GoogleArchitecturalMap = dynamic(() => import('@/components/GoogleArchitecturalMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[380px] rounded-xl border border-[#e5dfd3] bg-[#f4efe6] flex flex-col items-center justify-center text-[#6b6357] p-8">
      <div className="w-8 h-8 border-2 border-[#8c6239] border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-xs font-mono">A carregar Google Maps Platform...</p>
    </div>
  ),
});

// Dynamic import for Leaflet fallback
const ArchitecturalMap = dynamic(() => import('@/components/ArchitecturalMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[380px] rounded-xl border border-[#e5dfd3] bg-[#f4efe6] flex flex-col items-center justify-center text-[#6b6357] p-8">
      <div className="w-8 h-8 border-2 border-[#8c6239] border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-xs font-mono">A carregar cartografia arquitetónica...</p>
    </div>
  ),
});

const emptySubscribe = () => () => {};

function useIsMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function HomePage() {
  const mounted = useIsMounted();
  const [buildings, setBuildings] = useState<BuildingItem[]>(INITIAL_BUILDINGS);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(
    INITIAL_BUILDINGS[0]?.id || null
  );
  const [inspectingBuilding, setInspectingBuilding] = useState<BuildingItem | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [mapEngine, setMapEngine] = useState<'google' | 'leaflet'>('leaflet');
  const [mapPerspective, setMapPerspective] = useState<'2d' | '3d' | 'streetview'>('2d');
  const [notification, setNotification] = useState<string | null>(null);

  // Compute metrics
  const totalCountries = useMemo(() => {
    const countries = new Set(buildings.map((b) => b.country));
    return countries.size;
  }, [buildings]);

  const featuredBuilding = useMemo(() => {
    return buildings.find((b) => b.id === 'guggenheim-nyc') || buildings[0] || null;
  }, [buildings]);

  // Handler when user selects building in gallery
  const handleSelectBuilding = (building: BuildingItem) => {
    setSelectedBuildingId(building.id);
    setInspectingBuilding(building);
  };

  // Handler to quickly center/locate on map without necessarily opening drawer
  const handleLocateOnMap = (building: BuildingItem) => {
    setSelectedBuildingId(building.id);
    if (viewMode === 'gallery') {
      setViewMode('split');
    }
    const mapElement = document.getElementById('map-view-section');
    if (mapElement && window.innerWidth < 1024) {
      mapElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handler when Gemini detects a new building from uploaded image
  const handleBuildingDetected = (newBuilding: BuildingItem) => {
    setBuildings((prev) => [newBuilding, ...prev]);
    setSelectedBuildingId(newBuilding.id);
    setInspectingBuilding(newBuilding);

    // Show toast feedback
    setNotification(
      `"${newBuilding.title}" identificado com sucesso em ${newBuilding.city}, ${newBuilding.country}!`
    );
    setTimeout(() => {
      setNotification(null);
    }, 5000);

    if (viewMode === 'gallery') {
      setViewMode('split');
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf9f5] flex flex-col font-sans text-[#1c1917]">
      {/* Top Navigation */}
      <Navbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenUpload={() => setIsUploadOpen(true)}
        totalBuildings={buildings.length}
        totalCountries={totalCountries}
      />

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#1c1917] text-[#fbf9f5] shadow-2xl border border-[#8c6239] animate-in slide-in-from-bottom duration-300">
          <CheckCircle className="w-4 h-4 text-[#8c6239] shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Hero Section */}
      <HeroBanner
        onOpenUpload={() => setIsUploadOpen(true)}
        featuredBuilding={featuredBuilding}
        onSelectFeatured={(b) => {
          setSelectedBuildingId(b.id);
          setInspectingBuilding(b);
        }}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        {/* Dynamic Layout Based on ViewMode */}
        {viewMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Gallery Column (7 cols) */}
            <div className="lg:col-span-7 flex flex-col">
              <GalleryGrid
                buildings={buildings}
                selectedBuildingId={selectedBuildingId}
                onSelectBuilding={handleSelectBuilding}
                onLocateOnMap={handleLocateOnMap}
                onOpenUploadModal={() => setIsUploadOpen(true)}
              />
            </div>

            {/* Map Column (5 cols) Sticky on Desktop */}
            <div
              id="map-view-section"
              className="lg:col-span-5 lg:sticky lg:top-24 h-[500px] lg:h-[calc(100vh-140px)] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-editorial text-lg font-bold text-[#1c1917]">
                    {mapEngine === 'google' ? 'Google Maps' : 'Cartografia Mineral'}
                  </span>
                  <span className="text-xs text-[#6b6357]">
                    ({buildings.length} sítios)
                  </span>
                </div>

                {/* Map Engine Selector */}
                <div className="flex items-center gap-1 bg-[#f4efe6] p-1 rounded-lg border border-[#e5dfd3] text-xs">
                  <button
                    onClick={() => setMapEngine('google')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
                      mapEngine === 'google'
                        ? 'bg-[#1c1917] text-[#fbf9f5] shadow-xs'
                        : 'text-[#6b6357] hover:text-[#1c1917]'
                    }`}
                  >
                    <Globe2 className="w-3 h-3 text-[#8c6239]" />
                    <span>Google Maps</span>
                  </button>
                  <button
                    onClick={() => setMapEngine('leaflet')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                      mapEngine === 'leaflet'
                        ? 'bg-[#1c1917] text-[#fbf9f5] shadow-xs'
                        : 'text-[#6b6357] hover:text-[#1c1917]'
                    }`}
                  >
                    Mineral
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0">
                {mounted ? (
                  mapEngine === 'google' ? (
                    <GoogleArchitecturalMap
                      buildings={buildings}
                      selectedBuildingId={selectedBuildingId}
                      onSelectBuilding={(b) => {
                        setSelectedBuildingId(b.id);
                        setInspectingBuilding(b);
                      }}
                      perspective={mapPerspective}
                      onPerspectiveChange={setMapPerspective}
                      onFallbackToLeaflet={() => setMapEngine('leaflet')}
                      className="h-full"
                    />
                  ) : (
                    <ArchitecturalMap
                      buildings={buildings}
                      selectedBuildingId={selectedBuildingId}
                      onSelectBuilding={(b) => {
                        setSelectedBuildingId(b.id);
                        setInspectingBuilding(b);
                      }}
                      className="h-full"
                    />
                  )
                ) : (
                  <div className="w-full h-full min-h-[380px] rounded-xl border border-[#e5dfd3] bg-[#f4efe6] flex flex-col items-center justify-center text-[#6b6357] p-8">
                    <div className="w-8 h-8 border-2 border-[#8c6239] border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-xs font-mono">A carregar mapa...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'gallery' && (
          <div className="w-full">
            <GalleryGrid
              buildings={buildings}
              selectedBuildingId={selectedBuildingId}
              onSelectBuilding={handleSelectBuilding}
              onLocateOnMap={handleLocateOnMap}
              onOpenUploadModal={() => setIsUploadOpen(true)}
            />
          </div>
        )}

        {viewMode === 'map' && (
          <div className="w-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-editorial text-xl font-bold text-[#1c1917]">
                  {mapEngine === 'google' ? 'Google Maps Platform' : 'Cartografia Mineral'}
                </span>
                <span className="text-xs text-[#6b6357]">
                  • {buildings.length} monumentos identificados
                </span>
              </div>

              <div className="flex items-center gap-1 bg-[#f4efe6] p-1 rounded-lg border border-[#e5dfd3] text-xs">
                <button
                  onClick={() => setMapEngine('google')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 ${
                    mapEngine === 'google'
                      ? 'bg-[#1c1917] text-[#fbf9f5] shadow-xs'
                      : 'text-[#6b6357] hover:text-[#1c1917]'
                  }`}
                >
                  <Globe2 className="w-3.5 h-3.5 text-[#8c6239]" />
                  <span>Google Maps</span>
                </button>
                <button
                  onClick={() => setMapEngine('leaflet')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                    mapEngine === 'leaflet'
                      ? 'bg-[#1c1917] text-[#fbf9f5] shadow-xs'
                      : 'text-[#6b6357] hover:text-[#1c1917]'
                  }`}
                >
                  Mineral
                </button>
              </div>
            </div>

            <div className="h-[680px] w-full">
              {mounted ? (
                mapEngine === 'google' ? (
                  <GoogleArchitecturalMap
                    buildings={buildings}
                    selectedBuildingId={selectedBuildingId}
                    onSelectBuilding={(b) => {
                      setSelectedBuildingId(b.id);
                      setInspectingBuilding(b);
                    }}
                    perspective={mapPerspective}
                    onPerspectiveChange={setMapPerspective}
                    onFallbackToLeaflet={() => setMapEngine('leaflet')}
                    className="h-full"
                  />
                ) : (
                  <ArchitecturalMap
                    buildings={buildings}
                    selectedBuildingId={selectedBuildingId}
                    onSelectBuilding={(b) => {
                      setSelectedBuildingId(b.id);
                      setInspectingBuilding(b);
                    }}
                    className="h-full"
                  />
                )
              ) : (
                <div className="w-full h-full min-h-[500px] rounded-xl border border-[#e5dfd3] bg-[#f4efe6] flex flex-col items-center justify-center text-[#6b6357] p-8">
                  <div className="w-8 h-8 border-2 border-[#8c6239] border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-xs font-mono">A carregar mapa...</p>
                </div>
              )}
            </div>

            {/* Quick horizontal cards tray below full map */}
            <div className="pt-2">
              <div className="text-xs font-semibold text-[#6b6357] uppercase tracking-wider mb-2">
                Navegação Rápida entre Sítios Mapeados
              </div>
              <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-none">
                {buildings.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedBuildingId(item.id);
                      setInspectingBuilding(item);
                    }}
                    className={`flex items-center gap-3 p-2 rounded-xl border shrink-0 bg-[#fbf9f5] transition-all text-left ${
                      selectedBuildingId === item.id
                        ? 'border-[#8c6239] shadow-md ring-1 ring-[#8c6239]'
                        : 'border-[#e5dfd3] hover:border-[#8c6239]/50'
                    }`}
                    style={{ width: '260px' }}
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-stone-200">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/aistudio/fgghfhg_c0ef2bf2.jpg';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#1c1917] truncate font-editorial">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-[#8c6239] truncate">{item.architect}</div>
                      <div className="text-[10px] text-[#6b6357] truncate flex items-center gap-0.5 mt-0.5">
                        <MapPin className="w-2.5 h-2.5" />
                        <span>{item.city}, {item.country}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#e5dfd3] bg-[#f4efe6] py-8 px-4 sm:px-8 text-xs text-[#6b6357]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-editorial text-base font-bold text-[#1c1917]">ATELIER CALM</span>
            <span>•</span>
            <span>Curadoria Arquitetónica, Google Maps Platform & Gemini AI</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="hover:text-[#1c1917] underline transition-colors"
            >
              Reconhecer Fotografia
            </button>
            <span>•</span>
            <span>WCAG 2.2 AA Conforme</span>
          </div>
        </div>
      </footer>

      {/* Curatorial Inspector Drawer */}
      <CuratorialDrawer
        building={inspectingBuilding}
        onClose={() => setInspectingBuilding(null)}
        onFocusOnMap={(b) => handleLocateOnMap(b)}
        onOpenStreetView={(b) => {
          setSelectedBuildingId(b.id);
          setMapEngine('google');
          setMapPerspective('streetview');
          handleLocateOnMap(b);
        }}
        onOpen3D={(b) => {
          setSelectedBuildingId(b.id);
          setMapEngine('google');
          setMapPerspective('3d');
          handleLocateOnMap(b);
        }}
      />

      {/* Image Uploader & Gemini Recognition Modal */}
      <ImageUploader
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onBuildingDetected={handleBuildingDetected}
      />
    </div>
  );
}
