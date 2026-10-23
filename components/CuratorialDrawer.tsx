'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BuildingItem, WikipediaData } from '@/types/architecture';
import {
  X,
  MapPin,
  Compass,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Layers,
  Award,
  BookOpen,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface CuratorialDrawerProps {
  building: BuildingItem | null;
  onClose: () => void;
  onFocusOnMap: (building: BuildingItem) => void;
  onOpenStreetView?: (building: BuildingItem) => void;
  onOpen3D?: (building: BuildingItem) => void;
}

export default function CuratorialDrawer({
  building,
  onClose,
  onFocusOnMap,
  onOpenStreetView,
  onOpen3D,
}: CuratorialDrawerProps) {
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [asyncWiki, setAsyncWiki] = useState<WikipediaData | null>(null);
  const [isWikiLoading, setIsWikiLoading] = useState(false);
  const [wikiError, setWikiError] = useState<string | null>(null);

  // Derived: prioritize building's embedded Wikipedia data, fallback to asynchronously fetched
  const wikiData = building?.wikipedia || asyncWiki;

  // Asynchronous Wikipedia fetch when opened
  const buildingId = building?.id;
  const buildingTitle = building?.title;
  const buildingLocation = building?.locationName;
  const hasWiki = Boolean(building?.wikipedia);

  useEffect(() => {
    if (!buildingTitle || hasWiki) {
      return;
    }

    let isSubscribed = true;
    const searchTerm = buildingTitle || buildingLocation || '';

    // Use setTimeout so no synchronous render cascading occurs
    const timer = setTimeout(() => {
      if (!isSubscribed) return;
      setIsWikiLoading(true);

      fetch(`/api/wikipedia?query=${encodeURIComponent(searchTerm)}`)
        .then((res) => res.json())
        .then((res) => {
          if (!isSubscribed) return;
          if (res.success && res.data) {
            setAsyncWiki(res.data);
            setWikiError(null);
          } else {
            setWikiError(res.error || 'Nenhum artigo encontrado na Wikipédia.');
          }
        })
        .catch(() => {
          if (isSubscribed) setWikiError('Erro de conexão ao portal da Wikipédia.');
        })
        .finally(() => {
          if (isSubscribed) setIsWikiLoading(false);
        });
    }, 10);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, [buildingId, buildingTitle, buildingLocation, hasWiki]);

  const handleCopyCoordinates = useCallback(() => {
    if (!building) return;
    const text = `${building.coordinates.lat.toFixed(5)}, ${building.coordinates.lng.toFixed(5)}`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  }, [building]);

  const handleManualWikiRefresh = useCallback(() => {
    if (!building) return;
    setIsWikiLoading(true);
    setWikiError(null);
    const searchTerm = building.title || building.locationName;
    fetch(`/api/wikipedia?query=${encodeURIComponent(searchTerm)}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setAsyncWiki(res.data);
        } else {
          setWikiError(res.error || 'Nenhum artigo encontrado na Wikipédia.');
        }
      })
      .catch(() => {
        setWikiError('Erro ao comunicar com a Wikipédia.');
      })
      .finally(() => {
        setIsWikiLoading(false);
      });
  }, [building]);

  if (!building) return null;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${building.coordinates.lat},${building.coordinates.lng}`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#1c1917]/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl h-full bg-[#fbf9f5] border-l border-[#e5dfd3] shadow-2xl flex flex-col overflow-y-auto text-[#1c1917] animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-4 sm:p-5 bg-[#fbf9f5]/90 backdrop-blur-md border-b border-[#e5dfd3]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-widest uppercase px-2.5 py-1 rounded bg-[#8c6239]/10 text-[#8c6239] font-bold">
              Ficha Curatorial
            </span>
            {building.aiIdentified && (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-[#5b6955]/10 text-[#5b6955] font-medium">
                <Sparkles className="w-3 h-3" />
                <span>Georreferenciado por IA</span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#6b6357] hover:text-[#1c1917] hover:bg-[#e7e3da] transition-colors"
            aria-label="Fechar ficha"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Image */}
        <div className="relative w-full h-72 sm:h-80 bg-[#e7e3da] overflow-hidden shrink-0">
          <img
            src={building.imageUrl}
            alt={building.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/aistudio/fgghfhg_c0ef2bf2.jpg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c1917]/80 via-transparent to-black/20" />

          {/* Overlay info */}
          <div className="absolute bottom-4 left-4 right-4 text-[#fbf9f5]">
            <div className="text-xs uppercase tracking-widest text-[#d4ccbd] font-semibold mb-1">
              {building.style}
            </div>
            <h1 className="text-2xl sm:text-3xl font-editorial font-bold leading-tight drop-shadow-sm">
              {building.title}
            </h1>
            <div className="flex items-center gap-2 text-sm text-[#f4efe6] mt-1 font-medium">
              <span>{building.architect}</span>
              <span>•</span>
              <span>{building.year}</span>
            </div>
          </div>
        </div>

        {/* Body content */}
        <div className="p-6 sm:p-8 space-y-6 flex-1">
          {/* Geolocation Card */}
          <div className="p-4 rounded-xl border border-[#e5dfd3] bg-[#f4efe6]/60 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-[#6b6357] uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#8c6239]" />
                Posicionamento Cartográfico
              </span>
              <span className="font-mono text-[#8c6239]">
                {building.coordinates.lat.toFixed(4)}°, {building.coordinates.lng.toFixed(4)}°
              </span>
            </div>

            <div className="text-sm font-medium text-[#1c1917]">
              {building.locationName || `${building.city}, ${building.country}`}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onFocusOnMap(building);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c1917] text-[#fbf9f5] text-xs font-semibold hover:bg-[#8c6239] transition-colors"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Assinalar no Mapa</span>
              </button>

              {onOpen3D && (
                <button
                  type="button"
                  onClick={() => {
                    onOpen3D(building);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f4efe6] border border-[#e5dfd3] text-[#1c1917] hover:bg-[#e7e3da] text-xs font-semibold transition-colors"
                >
                  <span className="text-[#8c6239]">📐</span>
                  <span>Ver em 3D</span>
                </button>
              )}

              {onOpenStreetView && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenStreetView(building);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8c6239] text-[#fbf9f5] text-xs font-semibold hover:bg-[#a44826] transition-colors"
                >
                  <span className="text-white">👁️</span>
                  <span>Street View 360°</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopyCoordinates}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#e5dfd3] bg-[#fbf9f5] text-xs font-medium text-[#6b6357] hover:text-[#1c1917] hover:bg-[#e7e3da] transition-colors"
              >
                {copiedCoords ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCoords ? 'Copiado!' : 'Copiar GPS'}</span>
              </button>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#e5dfd3] bg-[#fbf9f5] text-xs font-medium text-[#6b6357] hover:text-[#1c1917] hover:bg-[#e7e3da] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Google Earth</span>
              </a>
            </div>
          </div>

          {/* Wikipedia Integration Section */}
          <div className="p-4 sm:p-5 rounded-xl border border-[#e5dfd3] bg-gradient-to-br from-[#fbf9f5] to-[#f4efe6] space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#1c1917] text-[#fbf9f5] flex items-center justify-center">
                  <BookOpen className="w-3.5 h-3.5 text-[#8c6239]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#1c1917]">Wikipédia Enciclopédia</span>
                  <span className="text-[10px] text-[#6b6357] ml-1.5 font-mono">
                    ({wikiData?.lang ? `${wikiData.lang.toUpperCase()}.wikipedia.org` : 'pt.wikipedia.org'})
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleManualWikiRefresh}
                disabled={isWikiLoading}
                className="p-1 rounded text-[#6b6357] hover:text-[#1c1917] hover:bg-[#e7e3da] transition-colors"
                title="Atualizar dados da Wikipédia"
                aria-label="Atualizar dados da Wikipédia"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isWikiLoading ? 'animate-spin text-[#8c6239]' : ''}`} />
              </button>
            </div>

            {isWikiLoading ? (
              <div className="py-4 flex items-center justify-center gap-2 text-xs text-[#6b6357] font-mono">
                <Loader2 className="w-4 h-4 animate-spin text-[#8c6239]" />
                <span>A consultar portal de dados da Wikipédia...</span>
              </div>
            ) : wikiData ? (
              <div className="space-y-2.5">
                {wikiData.description && (
                  <div className="text-[11px] font-semibold text-[#8c6239] uppercase tracking-wider">
                    {wikiData.description}
                  </div>
                )}
                <p className="text-xs sm:text-sm text-[#44403c] leading-relaxed line-clamp-5">
                  {wikiData.extract}
                </p>

                <div className="pt-2 flex items-center justify-between">
                  <a
                    href={wikiData.pageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1c1917] hover:text-[#8c6239] transition-colors underline decoration-[#8c6239]/50 underline-offset-4"
                  >
                    <span>Ler Artigo Integral na Wikipédia</span>
                    <ExternalLink className="w-3 h-3 text-[#8c6239]" />
                  </a>

                  <span className="text-[10px] text-[#6b6357] font-mono">
                    Fonte: pt.wikipedia.org
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#6b6357] italic">
                {wikiError || 'A informação enciclopédica está a ser consultada na Wikipédia.'}
              </div>
            )}
          </div>

          {/* Curatorial Text */}
          <div>
            <h3 className="text-xs font-semibold text-[#8c6239] uppercase tracking-wider mb-2">
              Apreciação Crítica & Tectónica
            </h3>
            <p className="text-sm sm:text-base leading-relaxed text-[#27272a] font-serif font-normal">
              {building.description}
            </p>
          </div>

          {/* Highlights */}
          {building.highlights && building.highlights.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[#8c6239] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>Particularidades Notáveis</span>
              </h3>
              <ul className="space-y-2">
                {building.highlights.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#44403c]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8c6239] mt-2 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Material Palette */}
          {building.materials && building.materials.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[#8c6239] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Paleta Material & Texturas</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {building.materials.map((mat, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-md text-xs font-medium bg-[#f4efe6] border border-[#e5dfd3] text-[#1c1917]"
                  >
                    {mat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Architectural Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#e5dfd3]">
            <div className="p-3 rounded-lg bg-[#f4efe6]/40 border border-[#e5dfd3]">
              <div className="text-[10px] text-[#6b6357] uppercase font-bold tracking-wider">Arquiteto / Estúdio</div>
              <div className="text-xs font-semibold text-[#1c1917] mt-0.5">{building.architect}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#f4efe6]/40 border border-[#e5dfd3]">
              <div className="text-[10px] text-[#6b6357] uppercase font-bold tracking-wider">Período / Ano</div>
              <div className="text-xs font-semibold text-[#1c1917] mt-0.5">{building.year}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#f4efe6]/40 border border-[#e5dfd3]">
              <div className="text-[10px] text-[#6b6357] uppercase font-bold tracking-wider">Estilo Tectónico</div>
              <div className="text-xs font-semibold text-[#1c1917] mt-0.5">{building.style}</div>
            </div>
            <div className="p-3 rounded-lg bg-[#f4efe6]/40 border border-[#e5dfd3]">
              <div className="text-[10px] text-[#6b6357] uppercase font-bold tracking-wider">Território</div>
              <div className="text-xs font-semibold text-[#1c1917] mt-0.5">{building.city}, {building.country}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f4efe6] border-t border-[#e5dfd3] flex items-center justify-between text-xs text-[#6b6357]">
          <span>ATELIER CALM — Curadoria Mineral</span>
          <span className="font-mono">ID: {building.id}</span>
        </div>
      </div>
    </div>
  );
}
