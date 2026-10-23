'use client';

import React from 'react';
import { ViewMode } from '@/types/architecture';
import { Sparkles, Map, LayoutGrid, Columns2, Compass, Building, Globe } from 'lucide-react';

interface NavbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenUpload: () => void;
  totalBuildings: number;
  totalCountries: number;
}

export default function Navbar({
  viewMode,
  onViewModeChange,
  onOpenUpload,
  totalBuildings,
  totalCountries,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#fbf9f5]/90 backdrop-blur-md border-b border-[#e5dfd3] px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand / Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#1c1917] flex items-center justify-center text-[#fbf9f5] shadow-sm">
            <Compass className="w-5 h-5 text-[#8c6239]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-editorial text-xl sm:text-2xl font-bold tracking-tight text-[#1c1917]">
                ATELIER CALM
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#8c6239]/10 text-[#8c6239] font-semibold border border-[#8c6239]/20">
                Cartografia IA
              </span>
            </div>
            <p className="text-[11px] text-[#6b6357] hidden md:block">
              Galeria de Arquitetura & Reconhecimento Geográfico Multimodal
            </p>
          </div>
        </div>

        {/* View mode toggle & Statistics */}
        <div className="flex items-center gap-3">
          {/* Quick Metrics */}
          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[#f4efe6] border border-[#e5dfd3] text-xs text-[#6b6357]">
            <div className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-[#8c6239]" />
              <span className="font-semibold text-[#1c1917]">{totalBuildings}</span>
              <span>obras</span>
            </div>
            <span className="text-[#d4ccbd]">•</span>
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#8c6239]" />
              <span className="font-semibold text-[#1c1917]">{totalCountries}</span>
              <span>países</span>
            </div>
          </div>

          {/* View Mode Buttons */}
          <div className="hidden sm:flex items-center bg-[#f4efe6] p-1 rounded-lg border border-[#e5dfd3]">
            <button
              onClick={() => onViewModeChange('split')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                viewMode === 'split'
                  ? 'bg-[#1c1917] text-[#fbf9f5] shadow-xs'
                  : 'text-[#6b6357] hover:text-[#1c1917]'
              }`}
              title="Visão Dividida (Galeria + Mapa)"
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>Divisão</span>
            </button>
            <button
              onClick={() => onViewModeChange('gallery')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                viewMode === 'gallery'
                  ? 'bg-[#1c1917] text-[#fbf9f5] shadow-xs'
                  : 'text-[#6b6357] hover:text-[#1c1917]'
              }`}
              title="Foco na Galeria"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Galeria</span>
            </button>
            <button
              onClick={() => onViewModeChange('map')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                viewMode === 'map'
                  ? 'bg-[#1c1917] text-[#fbf9f5] shadow-xs'
                  : 'text-[#6b6357] hover:text-[#1c1917]'
              }`}
              title="Foco no Mapa Cartográfico"
            >
              <Map className="w-3.5 h-3.5" />
              <span>Mapa</span>
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg bg-[#1c1917] text-[#fbf9f5] text-xs sm:text-sm font-semibold hover:bg-[#8c6239] transition-all shadow-sm hover:shadow-md active:scale-98"
          >
            <Sparkles className="w-4 h-4 text-[#8c6239] sm:animate-pulse" />
            <span>Reconhecer Imagem</span>
          </button>
        </div>
      </div>
    </header>
  );
}
