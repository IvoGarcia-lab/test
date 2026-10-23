'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BuildingItem } from '@/types/architecture';
import { X, Compass, ExternalLink, Loader2, AlertCircle, Eye } from 'lucide-react';

interface StreetViewPanoramaViewProps {
  building: BuildingItem;
  onClose: () => void;
}

// Compute compass heading from panorama viewpoint toward the target building
function computeHeading(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  let heading = (Math.atan2(y, x) * 180) / Math.PI;
  return (heading + 360) % 360;
}

export default function StreetViewPanoramaView({
  building,
  onClose,
}: StreetViewPanoramaViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panoramaInstanceRef = useRef<google.maps.StreetViewPanorama | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPov, setCurrentPov] = useState<{ heading: number; pitch: number }>({
    heading: 0,
    pitch: 5,
  });

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined' || !window.google?.maps) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const targetPos = {
      lat: building.coordinates.lat,
      lng: building.coordinates.lng,
    };

    const streetViewService = new google.maps.StreetViewService();

    // Search for closest outdoor panorama within 250 meters
    streetViewService.getPanorama(
      {
        location: targetPos,
        radius: 250,
        source: google.maps.StreetViewSource.OUTDOOR,
        preference: google.maps.StreetViewPreference.NEAREST,
      },
      (data, status) => {
        if (status === google.maps.StreetViewStatus.OK && data?.location?.latLng) {
          const panoPos = {
            lat: data.location.latLng.lat(),
            lng: data.location.latLng.lng(),
          };

          // Calculate heading to face the building
          const heading = computeHeading(panoPos, targetPos);

          if (!containerRef.current) return;

          const panorama = new google.maps.StreetViewPanorama(containerRef.current, {
            position: panoPos,
            pov: {
              heading,
              pitch: 10,
            },
            zoom: 1,
            addressControl: true,
            showRoadLabels: true,
            fullscreenControl: false,
            motionTracking: false,
            linksControl: true,
            panControl: true,
            enableCloseButton: false,
          });

          panorama.addListener('pov_changed', () => {
            const pov = panorama.getPov();
            setCurrentPov({
              heading: Math.round(pov.heading),
              pitch: Math.round(pov.pitch),
            });
          });

          panoramaInstanceRef.current = panorama;
          setIsLoading(false);
        } else {
          // If no outdoor street view found, try without source restriction
          streetViewService.getPanorama(
            {
              location: targetPos,
              radius: 500,
            },
            (fallbackData, fallbackStatus) => {
              if (
                fallbackStatus === google.maps.StreetViewStatus.OK &&
                fallbackData?.location?.latLng
              ) {
                const panoPos = {
                  lat: fallbackData.location.latLng.lat(),
                  lng: fallbackData.location.latLng.lng(),
                };
                const heading = computeHeading(panoPos, targetPos);

                if (!containerRef.current) return;

                const panorama = new google.maps.StreetViewPanorama(containerRef.current, {
                  position: panoPos,
                  pov: { heading, pitch: 10 },
                  zoom: 1,
                  enableCloseButton: false,
                });

                panoramaInstanceRef.current = panorama;
                setIsLoading(false);
              } else {
                setIsLoading(false);
                setError(
                  'Não foi possível carregar a vista 360° para este local exato. A cobertura do Street View pode estar limitada nesta coordenada.'
                );
              }
            }
          );
        }
      }
    );

    return () => {
      panoramaInstanceRef.current = null;
    };
  }, [building.id, building.coordinates.lat, building.coordinates.lng]);

  const externalStreetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${building.coordinates.lat},${building.coordinates.lng}`;

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-[#1c1917] overflow-hidden rounded-xl animate-in fade-in duration-200">
      {/* Top Street View HUD Header */}
      <div className="relative z-10 flex items-center justify-between p-3 sm:p-4 bg-[#1c1917]/90 backdrop-blur-md border-b border-[#e5dfd3]/20 text-[#fbf9f5]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#8c6239] flex items-center justify-center text-white">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-editorial text-sm sm:text-base font-bold text-[#fbf9f5]">
                Street View 360° — {building.title}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#8c6239]/20 text-[#d4ccbd] border border-[#8c6239]/30">
                Imersivo
              </span>
            </div>
            <p className="text-[11px] text-[#d4ccbd]">
              {building.architect} • {building.city}, {building.country}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Compass readout */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/40 text-[11px] font-mono text-[#d4ccbd] border border-white/10">
            <Compass className="w-3.5 h-3.5 text-[#8c6239]" />
            <span>Azimute: {currentPov.heading}°</span>
          </div>

          {/* Close Street View Button */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fbf9f5] text-[#1c1917] text-xs font-semibold hover:bg-[#8c6239] hover:text-white transition-colors"
            title="Voltar ao mapa"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Fechar 360°</span>
          </button>
        </div>
      </div>

      {/* Street View Panorama Container */}
      <div className="relative flex-1 w-full h-full bg-[#1c1917]">
        <div ref={containerRef} className="w-full h-full" />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1c1917]/80 text-[#fbf9f5] gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#8c6239]" />
            <p className="text-xs font-mono text-[#d4ccbd]">
              A carregar Street View panorâmico 360°...
            </p>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1c1917]/90 text-[#fbf9f5] p-6 text-center">
            <AlertCircle className="w-10 h-10 text-[#8c6239] mb-3" />
            <h4 className="font-editorial text-lg font-bold mb-1">
              Street View Indisponível para esta Coordenada
            </h4>
            <p className="text-xs text-[#d4ccbd] max-w-md mb-4 leading-relaxed">
              {error}
            </p>
            <div className="flex items-center gap-3">
              <a
                href={externalStreetViewUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#8c6239] text-white text-xs font-semibold hover:bg-[#a44826] transition-colors"
              >
                <span>Ver no Google Maps Externo</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-white/20 text-xs font-semibold text-[#fbf9f5] hover:bg-white/10 transition-colors"
              >
                Voltar ao Mapa
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
