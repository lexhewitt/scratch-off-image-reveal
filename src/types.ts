export interface PresetImage {
  id: string;
  name: string;
  url: string;
  category: 'nature' | 'mystery' | 'cute' | 'abstract';
  description: string;
}

export type MaskStyleType = 'silver' | 'gold' | 'charcoal' | 'cardboard' | 'color';
export type ScratchAreaShape = 'rectangle' | 'shorts' | 'drawn-shorts' | 'placed-shorts';

export interface ScratchAreaPoint {
  x: number;
  y: number;
}

export interface ShortsPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MaskConfig {
  type: MaskStyleType;
  color?: string; // Hex color for custom color mode
  text?: string; // e.g. "SCRATCH TO REVEAL"
  textColor?: string;
  textureNoise?: boolean; // add noise or metallic flecks
}

export interface ScratchState {
  isDrawing: boolean;
  percentageRevealed: number;
  brushSize: number;
  scratchAreaShape: ScratchAreaShape;
  customScratchPath: ScratchAreaPoint[];
  shortsPlacement: ShortsPlacement;
  isFullyRevealed: boolean;
  maskConfig: MaskConfig;
  underlayType: 'image' | 'secret-text';
  secretText: string;
}

export const PRESETS: PresetImage[] = [
  {
    id: 'cute-kitten',
    name: 'Playful Kitten',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80',
    category: 'cute',
    description: 'A charming fluffy kitten staring up curiously.'
  },
  {
    id: 'mystery-beach',
    name: 'Secret Paradise',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    category: 'nature',
    description: 'A serene golden hour sunset on a tropical beach.'
  },
  {
    id: 'deep-space',
    name: 'Cosmic Nebula',
    url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=800&q=80',
    category: 'mystery',
    description: 'A vivid violet and orange stellar nursery in deep space.'
  },
  {
    id: 'golden-glitter',
    name: 'Golden Fortune',
    url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=800&q=80',
    category: 'abstract',
    description: 'Shimmering streams of liquid gold dust and sparkles.'
  }
];
