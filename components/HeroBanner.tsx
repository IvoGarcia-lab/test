'use client';

import React from 'react';
import { Sparkles, MapPin, Compass, ArrowRight, ShieldCheck } from 'lucide-react';
import { BuildingItem } from '@/types/architecture';

interface HeroBannerProps {
  onOpenUpload: () => void;
  featuredBuilding: BuildingItem | null;
  onSelectFeatured: (building: BuildingItem) => void;
}

export default function HeroBanner({
  onOpenUpload,
  featuredBuilding,
  onSelectFeatured,
}: HeroBannerProps) {
  return (
    <section className="relative w-full py-8 sm:py-12 px-4 sm:px-8 border-b border-[#e5dfd3] bg-gradient-to-b from-[#fbf9f5] via-[#f4efe6]/60 to-[#fbf9f5]">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
        {/* Left Editorial Copy */}
        <div className="flex-1 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8c6239]/10 text-[#8c6239] text-xs font-semibold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            <span>Curadoria Mineral & Georreferenciação Visual</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-editorial font-bold text-[#1c1917] tracking-tight leading-[1.15]">
            Reconhecimento de Imagem & Localização Cartográfica
          </h1>

          <p className="text-sm sm:text-base text-[#6b6357] leading-relaxed">
            Carregue qualquer imagem de arquitetura ou monumento. A inteligência visual multimodal Gemini analisa os traços volumétricos, materiais e contexto geográfico para identificar o edifício e assinalar as suas coordenadas exatas no mapa interativo.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1c1917] text-[#fbf9f5] text-xs sm:text-sm font-semibold hover:bg-[#8c6239] transition-all shadow-md hover:shadow-lg active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-[#8c6239]" />
              <span>Enviar Imagem para Reconhecer</span>
            </button>

            {featuredBuilding && (
              <button
                onClick={() => onSelectFeatured(featuredBuilding)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#e5dfd3] bg-[#fbf9f5] hover:bg-[#e7e3da] text-xs sm:text-sm font-medium text-[#1c1917] transition-all"
              >
                <MapPin className="w-4 h-4 text-[#8c6239]" />
                <span>Ver Obra do Utilizador (Guggenheim NYC)</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Featured Card Showcase */}
        {featuredBuilding && (
          <div className="w-full lg:w-[420px] shrink-0">
            <div
              onClick={() => onSelectFeatured(featuredBuilding)}
              className="cursor-pointer group relative rounded-2xl border border-[#e5dfd3] bg-[#fbf9f5] p-3 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="relative w-full h-52 rounded-xl overflow-hidden bg-stone-200">
                <img
                  src={featuredBuilding.imageUrl}
                  alt={featuredBuilding.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/aistudio/fgghfhg_c0ef2bf2.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                <div className="absolute top-3 left-3 bg-[#1c1917]/85 backdrop-blur-xs text-[#fbf9f5] text-[10px] px-2.5 py-1 rounded-md font-mono font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#8c6239]" />
                  <span>Obra em Destaque</span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-[#fbf9f5]">
                  <div className="text-[11px] text-[#e7e3da] font-medium tracking-wide">
                    {featuredBuilding.architect} • {featuredBuilding.year}
                  </div>
                  <div className="text-lg font-editorial font-bold leading-snug">
                    {featuredBuilding.title}
                  </div>
                </div>
              </div>

              <div className="mt-3 px-2 py-1 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-[#6b6357]">
                  <MapPin className="w-3.5 h-3.5 text-[#8c6239]" />
                  <span>{featuredBuilding.city}, {featuredBuilding.country}</span>
                </div>
                <div className="flex items-center gap-1 text-[#8c6239] font-medium group-hover:underline">
                  <span>Assinalar no Mapa</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
