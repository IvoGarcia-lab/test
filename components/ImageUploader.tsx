'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Sparkles, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, X, MapPin } from 'lucide-react';
import { BuildingItem } from '@/types/architecture';

interface ImageUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onBuildingDetected: (building: BuildingItem) => void;
}

export default function ImageUploader({ isOpen, onClose, onBuildingDetected }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusStep, setStatusStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setErrorMessage(null);
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, selecione um ficheiro de imagem válido (JPEG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSelectedPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const runAnalysis = async (base64Override?: string, localPath?: string) => {
    const imagePayload = base64Override || selectedPreview;
    if (!imagePayload && !localPath) {
      setErrorMessage('Por favor carregue uma imagem primeiro.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setStatusStep('A iniciar motor de visão Gemini 3.8 Flash...');

    try {
      setTimeout(() => setStatusStep('A analisar volumetria e elementos arquitetónicos...'), 800);
      setTimeout(() => setStatusStep('A determinar coordenadas geográficas e contexto cartográfico...'), 2000);

      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Data: imagePayload,
          localImagePath: localPath,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.building) {
        throw new Error(data.error || 'Não foi possível reconhecer o monumento.');
      }

      setStatusStep('Identificação concluída! A assinalar no mapa...');
      setTimeout(() => {
        onBuildingDetected(data.building);
        setIsAnalyzing(false);
        onClose();
      }, 700);
    } catch (err: unknown) {
      console.error(err);
      setIsAnalyzing(false);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Erro ao analisar a imagem. Verifique a chave de API ou tente outra fotografia.'
      );
    }
  };

  // Quick preset helper
  const handleAnalyzePreset = (presetPath: string) => {
    setSelectedPreview(presetPath);
    runAnalysis(undefined, presetPath);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c1917]/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-[#fbf9f5] border border-[#e5dfd3] rounded-2xl shadow-2xl p-6 sm:p-8 overflow-hidden text-[#1c1917]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#6b6357] hover:text-[#1c1917] hover:bg-[#e7e3da] transition-colors"
          disabled={isAnalyzing}
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8c6239]/10 text-[#8c6239] text-xs font-semibold tracking-wider uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Reconhecimento Geográfico & Visão IA</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-editorial font-bold text-[#1c1917]">
            Identificar Edifício na Fotografia
          </h2>
          <p className="text-sm text-[#6b6357] mt-1">
            Carregue uma imagem arquitetónica. A IA identifica a estrutura, o arquiteto, os materiais e localiza as coordenadas exatas no mapa mundial.
          </p>
        </div>

        {/* Dropzone Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isAnalyzing && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? 'border-[#8c6239] bg-[#8c6239]/5'
              : selectedPreview
              ? 'border-[#e5dfd3] bg-[#f4efe6]/50'
              : 'border-[#d4ccbd] hover:border-[#8c6239] bg-[#f4efe6]/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isAnalyzing}
          />

          {selectedPreview ? (
            <div className="relative w-full flex flex-col items-center">
              <div className="relative w-full max-h-56 h-48 rounded-lg overflow-hidden border border-[#e5dfd3] shadow-inner bg-black/5">
                <img
                  src={selectedPreview}
                  alt="Pré-visualização"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-xs text-[#6b6357] mt-3 font-medium">
                Clique para selecionar outro ficheiro ou arraste outra imagem
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-[#f4efe6] border border-[#e5dfd3] flex items-center justify-center text-[#8c6239] mb-3 shadow-sm">
                <UploadCloud className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-[#1c1917]">
                Arraste a fotografia para aqui ou <span className="text-[#8c6239] underline">procure no dispositivo</span>
              </p>
              <p className="text-xs text-[#6b6357] mt-1">
                Formatos suportados: JPEG, PNG, WebP (até 15MB)
              </p>
            </div>
          )}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Quick Presets / User Attached Photo */}
        <div className="mt-4 pt-4 border-t border-[#e5dfd3]/80">
          <div className="text-xs font-semibold text-[#6b6357] uppercase tracking-wider mb-2">
            Ou teste a imagem fornecida pelo utilizador:
          </div>
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={() => handleAnalyzePreset('/assets/aistudio/fgghfhg_c0ef2bf2.jpg')}
            className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-[#e5dfd3] bg-[#f4efe6] hover:bg-[#e7e3da] text-left transition-colors group"
          >
            <div className="w-12 h-12 rounded overflow-hidden shrink-0 border border-[#d4ccbd] bg-stone-200">
              <img
                src="/assets/aistudio/fgghfhg_c0ef2bf2.jpg"
                alt="Guggenheim User Asset"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-[#1c1917] truncate">
                Fotografia Original: Museu Guggenheim de Nova Iorque
              </div>
              <div className="text-[11px] text-[#6b6357] flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-[#8c6239]" />
                <span>Reconhecer e assinalar imediatamente no mapa</span>
              </div>
            </div>
            <div className="text-xs font-medium text-[#8c6239] shrink-0 px-2.5 py-1 rounded bg-[#8c6239]/10">
              Analisar
            </div>
          </button>
        </div>

        {/* Action Button & Status Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="text-xs text-[#6b6357] flex items-center gap-1.5 min-h-[20px]">
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8c6239]" />
                <span className="font-mono text-[#8c6239] animate-pulse">{statusStep}</span>
              </>
            ) : selectedPreview ? (
              <span className="text-[#5b6955] flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Fotografia pronta para análise
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isAnalyzing}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg border border-[#e5dfd3] text-xs font-semibold text-[#6b6357] hover:text-[#1c1917] hover:bg-[#e7e3da] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!selectedPreview || isAnalyzing}
              onClick={() => runAnalysis()}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition-all shadow-md ${
                !selectedPreview || isAnalyzing
                  ? 'bg-[#d4ccbd] text-white cursor-not-allowed opacity-60'
                  : 'bg-[#1c1917] text-[#fbf9f5] hover:bg-[#8c6239] shadow-[#1c1917]/10'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>A Reconhecer...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#8c6239]" />
                  <span>Reconhecer & Mapear</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
