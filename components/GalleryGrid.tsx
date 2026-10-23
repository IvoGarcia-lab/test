'use client';

import React, { useState, useMemo } from 'react';
import { BuildingItem } from '@/types/architecture';
import { Search, MapPin, Sparkles, SlidersHorizontal, ArrowUpRight, Compass } from 'lucide-react';

interface GalleryGridProps {
  buildings: BuildingItem[];
  selectedBuildingId: string | null;
  onSelectBuilding: (building: BuildingItem) => void;
  onLocateOnMap: (building: BuildingItem) => void;
  onOpenUploadModal: () => void;
}

export default function GalleryGrid({
  buildings,
  selectedBuildingId,
  onSelectBuilding,
  onLocateOnMap,
  onOpenUploadModal,
}: GalleryGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string>('todos');

  // Extract unique styles
  const availableStyles = useMemo(() => {
    const styles = new Set<string>();
    buildings.forEach((b) => {
      if (b.style) styles.add(b.style);
    });
    return Array.from(styles);
  }, [buildings]);

  // Filter buildings
  const filteredBuildings = useMemo(() => {
    return buildings.filter((item) => {
      const matchSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.architect.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.country.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStyle =
        selectedStyle === 'todos' ||
        (selectedStyle === 'user' ? item.isUserUpload : item.style === selectedStyle);

      return matchSearch && matchStyle;
    });
  }, [buildings, searchTerm, selectedStyle]);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Search & Filter Header */}
      <div className="sticky top-0 z-10 bg-[#fbf9f5]/95 backdrop-blur-md pb-4 pt-1 border-b border-[#e5dfd3]/80 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#8c6239] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar por obra, arquiteto, cidade ou país..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#f4efe6] border border-[#e5dfd3] rounded-lg text-[#1c1917] placeholder:text-[#6b6357] focus:outline-none focus:border-[#8c6239] focus:ring-1 focus:ring-[#8c6239] transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6b6357] hover:text-[#1c1917]"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Filter Badges Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedStyle('todos')}
            className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${
              selectedStyle === 'todos'
                ? 'bg-[#1c1917] text-[#fbf9f5]'
                : 'bg-[#f4efe6] text-[#6b6357] hover:bg-[#e7e3da] hover:text-[#1c1917]'
            }`}
          >
            Todas as Obras ({buildings.length})
          </button>

          <button
            onClick={() => setSelectedStyle('user')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${
              selectedStyle === 'user'
                ? 'bg-[#8c6239] text-[#fbf9f5]'
                : 'bg-[#8c6239]/10 text-[#8c6239] hover:bg-[#8c6239]/20'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Uploads & Reconhecidas</span>
          </button>

          {availableStyles.map((style) => (
            <button
              key={style}
              onClick={() => setSelectedStyle(style)}
              className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${
                selectedStyle === style
                  ? 'bg-[#1c1917] text-[#fbf9f5]'
                  : 'bg-[#f4efe6] text-[#6b6357] hover:bg-[#e7e3da] hover:text-[#1c1917]'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Cards Grid */}
      <div className="flex-1 overflow-y-auto pt-4 pr-1">
        {filteredBuildings.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#f4efe6] border border-[#e5dfd3] flex items-center justify-center text-[#8c6239] mb-3">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-editorial text-lg font-bold text-[#1c1917]">Nenhuma obra encontrada</h3>
            <p className="text-xs text-[#6b6357] max-w-xs mt-1">
              Tente redefinir o termo de pesquisa ou envie uma nova fotografia arquitetónica para ser analisada pela IA.
            </p>
            <button
              onClick={onOpenUploadModal}
              className="mt-4 px-4 py-2 rounded-lg bg-[#1c1917] text-[#fbf9f5] text-xs font-semibold hover:bg-[#8c6239] transition-colors"
            >
              + Enviar Nova Fotografia
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-8">
            {filteredBuildings.map((building) => {
              const isSelected = building.id === selectedBuildingId;
              return (
                <div
                  key={building.id}
                  onClick={() => onSelectBuilding(building)}
                  className={`group cursor-pointer rounded-xl border overflow-hidden bg-[#fbf9f5] transition-all duration-300 flex flex-col ${
                    isSelected
                      ? 'border-[#8c6239] shadow-lg shadow-[#8c6239]/15 ring-2 ring-[#8c6239]/40'
                      : 'border-[#e5dfd3] hover:border-[#8c6239]/60 hover:shadow-md'
                  }`}
                >
                  {/* Image Container */}
                  <div className="relative w-full h-44 bg-[#e7e3da] overflow-hidden">
                    <img
                      src={building.imageUrl}
                      alt={building.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/aistudio/fgghfhg_c0ef2bf2.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                      <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-[#1c1917]/85 backdrop-blur-xs text-[#fbf9f5] font-semibold">
                        {building.year}
                      </span>
                      {building.isUserUpload && (
                        <span className="flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#8c6239] text-[#fbf9f5] shadow">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Obra Analisada</span>
                        </span>
                      )}
                    </div>

                    {/* Bottom overlay info */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 text-[#fbf9f5]">
                      <div className="text-[10px] text-[#e7e3da] uppercase tracking-wider font-medium">
                        {building.architect}
                      </div>
                      <div className="text-sm font-editorial font-bold leading-tight truncate">
                        {building.title}
                      </div>
                    </div>
                  </div>

                  {/* Card Content & Action Bar */}
                  <div className="p-3.5 flex flex-col justify-between flex-1 space-y-3 bg-[#fbf9f5]">
                    <div>
                      <div className="flex items-center justify-between text-xs text-[#6b6357]">
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-[#8c6239] shrink-0" />
                          <span className="truncate">{building.city}, {building.country}</span>
                        </span>
                        <span className="text-[10px] font-mono text-[#8c6239] bg-[#f4efe6] px-1.5 py-0.5 rounded border border-[#e5dfd3] shrink-0">
                          {building.coordinates.lat.toFixed(2)}°, {building.coordinates.lng.toFixed(2)}°
                        </span>
                      </div>
                      <p className="text-xs text-[#44403c] line-clamp-2 mt-2 leading-relaxed">
                        {building.description}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-[#e5dfd3]/80 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLocateOnMap(building);
                        }}
                        className="flex items-center gap-1 text-xs font-semibold text-[#8c6239] hover:text-[#1c1917] transition-colors py-1 px-1.5 rounded hover:bg-[#e7e3da]"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Mapear</span>
                      </button>

                      <div className="flex items-center gap-1 text-[11px] text-[#6b6357] group-hover:text-[#1c1917] transition-colors font-medium">
                        <span>Ver Detalhes</span>
                        <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
