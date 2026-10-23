export interface Coordinates {
  lat: number;
  lng: number;
}

export interface WikipediaData {
  title: string;
  description: string;
  extract: string;
  pageUrl: string;
  thumbnail?: string | null;
  lang: string;
}

export interface BuildingItem {
  id: string;
  title: string;
  architect: string;
  year: string;
  style: string;
  locationName: string;
  city: string;
  country: string;
  coordinates: Coordinates;
  imageUrl: string;
  description: string;
  materials: string[];
  highlights: string[];
  isUserUpload?: boolean;
  confidenceScore?: number;
  aiIdentified?: boolean;
  photographerCredit?: string;
  wikipedia?: WikipediaData;
}

export interface AnalysisResponse {
  success: boolean;
  building?: BuildingItem;
  error?: string;
}

export type ViewMode = 'split' | 'gallery' | 'map';
