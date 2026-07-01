import React from 'react';
import { MaskConfig, MaskStyleType, ScratchAreaPoint, ScratchAreaShape } from '../types';
import { Palette, Type, Gift, FileText, Smile, Square, Scissors, Pencil, Trash2, Move } from 'lucide-react';

interface MaskCustomizerProps {
  maskConfig: MaskConfig;
  onMaskConfigChange: (config: MaskConfig) => void;
  underlayType: 'image' | 'secret-text';
  onUnderlayTypeChange: (type: 'image' | 'secret-text') => void;
  secretText: string;
  onSecretTextChange: (text: string) => void;
  scratchAreaShape: ScratchAreaShape;
  onScratchAreaShapeChange: (shape: ScratchAreaShape) => void;
  customScratchPath: ScratchAreaPoint[];
  onCustomScratchPathChange: (path: ScratchAreaPoint[]) => void;
  isDrawingScratchArea: boolean;
  onDrawingScratchAreaChange: (isDrawing: boolean) => void;
  isPlacingShorts: boolean;
  onPlacingShortsChange: (isPlacing: boolean) => void;
}

export default function MaskCustomizer({
  maskConfig,
  onMaskConfigChange,
  underlayType,
  onUnderlayTypeChange,
  secretText,
  onSecretTextChange,
  scratchAreaShape,
  onScratchAreaShapeChange,
  customScratchPath,
  onCustomScratchPathChange,
  isDrawingScratchArea,
  onDrawingScratchAreaChange,
  isPlacingShorts,
  onPlacingShortsChange
}: MaskCustomizerProps) {
  
  const handleTypeSelect = (type: MaskStyleType) => {
    const updated: MaskConfig = { ...maskConfig, type };
    if (type === 'silver') {
      updated.textColor = '#334155'; // Charcoal text for high contrast on silver
    } else if (type === 'gold') {
      updated.textColor = '#78350f'; // Dark amber text on gold
    } else if (type === 'charcoal') {
      updated.textColor = '#ffffff'; // White text on charcoal
    } else if (type === 'cardboard') {
      updated.textColor = '#5d4037'; // Deep brown on cardboard
    } else {
      updated.textColor = '#ffffff'; // Default
    }
    onMaskConfigChange(updated);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onMaskConfigChange({ ...maskConfig, text: e.target.value });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onMaskConfigChange({ 
      ...maskConfig, 
      type: 'color', 
      color: e.target.value 
    });
  };

  return (
    <div id="mask-customizer-section" className="flex flex-col gap-6">
      
      {/* Tab: Underlay Mode */}
      <div>
        <h3 className="text-sm font-semibold tracking-wide text-neutral-800 uppercase flex items-center gap-2">
          <Gift className="w-4 h-4 text-neutral-600" />
          2. Scratch Card Content
        </h3>
        <p className="text-xs text-neutral-500 mt-1">
          Select what is hidden underneath the scratch-off layer.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2 bg-neutral-100 p-1 rounded-xl">
          <button
            type="button"
            id="underlay-type-image"
            onClick={() => onUnderlayTypeChange('image')}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
              underlayType === 'image'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            Hidden Picture
          </button>
          <button
            type="button"
            id="underlay-type-text"
            onClick={() => onUnderlayTypeChange('secret-text')}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
              underlayType === 'secret-text'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Secret Message Card
          </button>
        </div>

        {underlayType === 'secret-text' && (
          <div className="mt-3">
            <label htmlFor="secret-message-input" className="block text-xs font-medium text-neutral-600">
              Your Secret Voucher Message
            </label>
            <input
              id="secret-message-input"
              type="text"
              value={secretText}
              onChange={(e) => onSecretTextChange(e.target.value)}
              placeholder="e.g. You Won a Free Coffee! ☕️"
              maxLength={64}
              className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-800 shadow-xs placeholder-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 focus:outline-hidden"
            />
          </div>
        )}
      </div>

      {/* Choose Scratch Latex Texture */}
      <div>
        <h3 className="text-sm font-semibold tracking-wide text-neutral-800 uppercase flex items-center gap-2">
          <Palette className="w-4 h-4 text-neutral-600" />
          3. Latex Latex Texture
        </h3>
        <p className="text-xs text-neutral-500 mt-1">Select the coating texture covering your secret.</p>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {/* Silver foil */}
          <button
            type="button"
            id="mask-type-silver"
            onClick={() => handleTypeSelect('silver')}
            className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center transition-all ${
              maskConfig.type === 'silver'
                ? 'border-neutral-900 bg-neutral-50 ring-2 ring-neutral-950/10'
                : 'border-neutral-200 bg-white hover:border-neutral-300'
            }`}
          >
            <div className="h-6 w-full rounded-md bg-linear-to-br from-slate-100 to-slate-400 border border-neutral-300 shadow-xs" />
            <span className="text-[10px] font-medium text-neutral-700">Silver Foil</span>
          </button>

          {/* Gold foil */}
          <button
            type="button"
            id="mask-type-gold"
            onClick={() => handleTypeSelect('gold')}
            className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center transition-all ${
              maskConfig.type === 'gold'
                ? 'border-neutral-900 bg-neutral-50 ring-2 ring-neutral-950/10'
                : 'border-neutral-200 bg-white hover:border-neutral-300'
            }`}
          >
            <div className="h-6 w-full rounded-md bg-linear-to-br from-amber-200 to-amber-500 border border-amber-300 shadow-xs" />
            <span className="text-[10px] font-medium text-neutral-700">Gold Foil</span>
          </button>

          {/* Charcoal */}
          <button
            type="button"
            id="mask-type-charcoal"
            onClick={() => handleTypeSelect('charcoal')}
            className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center transition-all ${
              maskConfig.type === 'charcoal'
                ? 'border-neutral-900 bg-neutral-50 ring-2 ring-neutral-950/10'
                : 'border-neutral-200 bg-white hover:border-neutral-300'
            }`}
          >
            <div className="h-6 w-full rounded-md bg-slate-800 border border-neutral-900 shadow-xs" />
            <span className="text-[10px] font-medium text-neutral-700">Slate Charcoal</span>
          </button>

          {/* Cardboard */}
          <button
            type="button"
            id="mask-type-cardboard"
            onClick={() => handleTypeSelect('cardboard')}
            className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center transition-all ${
              maskConfig.type === 'cardboard'
                ? 'border-neutral-900 bg-neutral-50 ring-2 ring-neutral-950/10'
                : 'border-neutral-200 bg-white hover:border-neutral-300'
            }`}
          >
            <div className="h-6 w-full rounded-md bg-[#bcaaa4] border border-neutral-400 shadow-xs" />
            <span className="text-[10px] font-medium text-neutral-700">Kraft Paper</span>
          </button>

          {/* Color picker */}
          <div className="relative flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center border-neutral-200 bg-white hover:border-neutral-300">
            <div className="relative h-6 w-full rounded-md border border-neutral-300 shadow-xs overflow-hidden">
              <input
                id="mask-custom-color-picker"
                type="color"
                value={maskConfig.type === 'color' ? maskConfig.color || '#3b82f6' : '#3b82f6'}
                onChange={handleColorChange}
                className="absolute inset-0 h-full w-full cursor-pointer scale-150 border-0 p-0"
                title="Custom color"
              />
            </div>
            <span className="text-[10px] font-medium text-neutral-700">Custom Solid</span>
          </div>
        </div>
      </div>

      {/* Scratch Area Shape */}
      <div>
        <h3 className="text-sm font-semibold tracking-wide text-neutral-800 uppercase flex items-center gap-2">
          <Scissors className="w-4 h-4 text-neutral-600" />
          4. Scratch Area Shape
        </h3>
        <p className="text-xs text-neutral-500 mt-1">Choose or draw the silhouette where foil can be scratched away.</p>

        <div className="mt-3 grid grid-cols-2 gap-2 bg-neutral-100 p-1 rounded-xl sm:grid-cols-4">
          <button
            type="button"
            id="scratch-area-rectangle"
            onClick={() => {
              onScratchAreaShapeChange('rectangle');
              onDrawingScratchAreaChange(false);
            }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
              scratchAreaShape === 'rectangle'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            Full Card
          </button>
          <button
            type="button"
            id="scratch-area-shorts"
            onClick={() => {
              onScratchAreaShapeChange('shorts');
              onDrawingScratchAreaChange(false);
            }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
              scratchAreaShape === 'shorts'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            Shorts
          </button>
          <button
            type="button"
            id="scratch-area-drawn-shorts"
            onClick={() => {
              onScratchAreaShapeChange('drawn-shorts');
              onDrawingScratchAreaChange(true);
            }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
              scratchAreaShape === 'drawn-shorts'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
            Draw
          </button>
          <button
            type="button"
            id="scratch-area-placed-shorts"
            onClick={() => {
              onScratchAreaShapeChange('placed-shorts');
              onDrawingScratchAreaChange(false);
              onPlacingShortsChange(true);
            }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
              scratchAreaShape === 'placed-shorts'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            Place
          </button>
        </div>

        {scratchAreaShape === 'placed-shorts' && (
          <div className="mt-3 flex flex-col gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                id="place-shorts-toggle"
                onClick={() => onPlacingShortsChange(!isPlacingShorts)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                  isPlacingShorts
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <Move className="w-3.5 h-3.5" />
                {isPlacingShorts ? 'Apply Shorts Area' : 'Move or Stretch'}
              </button>
            </div>
            <p className="text-[11px] leading-relaxed text-neutral-500">
              Drag the shorts stencil over the legs, stretch it with the corner handles, then apply it before sharing.
            </p>
          </div>
        )}

        {scratchAreaShape === 'drawn-shorts' && (
          <div className="mt-3 flex flex-col gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                id="start-draw-scratch-area"
                onClick={() => onDrawingScratchAreaChange(true)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                  isDrawingScratchArea
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <Pencil className="w-3.5 h-3.5" />
                {isDrawingScratchArea ? 'Drawing Active' : customScratchPath.length >= 3 ? 'Redraw Area' : 'Draw on Picture'}
              </button>
              <button
                type="button"
                id="clear-drawn-scratch-area"
                onClick={() => {
                  onCustomScratchPathChange([]);
                  onDrawingScratchAreaChange(true);
                }}
                className="flex items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 transition-all hover:border-neutral-300 hover:text-neutral-950"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>
            <p className="text-[11px] leading-relaxed text-neutral-500">
              Trace the shorts outline directly on the reveal picture, then release to apply the scratch foil to that area.
            </p>
          </div>
        )}
      </div>

      {/* Overlay Text Settings */}
      <div>
        <h3 className="text-sm font-semibold tracking-wide text-neutral-800 uppercase flex items-center gap-2">
          <Type className="w-4 h-4 text-neutral-600" />
          5. Cover Message Text
        </h3>
        <p className="text-xs text-neutral-500 mt-1">Add text drawn directly on top of the scratch coat.</p>

        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div>
            <label htmlFor="latex-text-input" className="block text-xs font-medium text-neutral-600">
              Latex Overlay Message
            </label>
            <input
              id="latex-text-input"
              type="text"
              value={maskConfig.text || ''}
              onChange={handleTextChange}
              placeholder="e.g. SCRATCH TO WIN! 🍀"
              maxLength={30}
              className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-800 shadow-xs focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 focus:outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="latex-text-color-picker" className="block text-xs font-medium text-neutral-600">
              Overlay Text Color
            </label>
            <div className="mt-1 flex items-center gap-2">
              <div className="relative h-9 w-9 shrink-0 rounded-lg border border-neutral-300 shadow-xs overflow-hidden">
                <input
                  id="latex-text-color-picker"
                  type="color"
                  value={maskConfig.textColor || '#ffffff'}
                  onChange={(e) => onMaskConfigChange({ ...maskConfig, textColor: e.target.value })}
                  className="absolute inset-0 h-full w-full cursor-pointer scale-150 border-0 p-0"
                  title="Text color"
                />
              </div>
              <input
                id="latex-text-color-hex-input"
                type="text"
                value={maskConfig.textColor || '#ffffff'}
                onChange={(e) => onMaskConfigChange({ ...maskConfig, textColor: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-mono text-neutral-800 shadow-xs focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 focus:outline-hidden"
                maxLength={7}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
