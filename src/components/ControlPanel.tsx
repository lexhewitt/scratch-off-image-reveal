import React from 'react';
import { RefreshCw, Eye, Volume2, VolumeX, Brush, ZoomOut } from 'lucide-react';

interface ControlPanelProps {
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  pictureZoom: number;
  onPictureZoomChange: (zoom: number) => void;
  soundEnabled: boolean;
  onSoundToggle: (enabled: boolean) => void;
  percentageRevealed: number;
  onRevealAll: () => void;
  onReset: () => void;
}

export default function ControlPanel({
  brushSize,
  onBrushSizeChange,
  pictureZoom,
  onPictureZoomChange,
  soundEnabled,
  onSoundToggle,
  percentageRevealed,
  onRevealAll,
  onReset
}: ControlPanelProps) {
  // Brush preset options
  const BRUSH_PRESETS = [
    { label: 'Fine', value: 15 },
    { label: 'Medium', value: 30 },
    { label: 'Thick', value: 50 },
    { label: 'Mega', value: 75 }
  ];

  // Helper to determine text state based on scratch progress
  const getProgressMessage = () => {
    if (percentageRevealed === 0) return 'Swipe or drag to start scratching! ✨';
    if (percentageRevealed < 30) return 'Scratching away... Keep going! 🪓';
    if (percentageRevealed < 60) return 'Almost halfway! What is hidden under there? 🤔';
    if (percentageRevealed < 90) return 'Nearly revealed! Almost there... 🌟';
    return 'Fully revealed! Beautifully done! 🎉';
  };

  return (
    <div id="scratch-control-panel" className="flex flex-col gap-6">
      
      {/* Percentage stats and completion meter */}
      <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 shadow-inner">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
            Scratch Progress
          </span>
          <span className="text-lg font-mono font-bold text-neutral-900 bg-white border border-neutral-200 px-2.5 py-0.5 rounded-lg shadow-xs">
            {percentageRevealed}%
          </span>
        </div>

        {/* Custom Clean Progress Bar */}
        <div className="mt-2.5 h-3.5 w-full overflow-hidden rounded-full bg-neutral-200 p-0.5 shadow-inner">
          <div
            id="completion-progress-bar"
            className="h-full rounded-full bg-neutral-900 transition-all duration-300 ease-out"
            style={{
              width: `${percentageRevealed}%`,
              background: 
                percentageRevealed < 40 
                  ? 'linear-gradient(90deg, #64748b, #475569)'
                  : percentageRevealed < 85
                    ? 'linear-gradient(90deg, #ea580c, #ca8a04)'
                    : 'linear-gradient(90deg, #16a34a, #10b981)'
            }}
          />
        </div>

        <p className="mt-3 text-center text-xs font-medium text-neutral-600 transition-all">
          {getProgressMessage()}
        </p>
      </div>

      {/* Brush Size Adjustment */}
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="brush-size-slider" className="text-xs font-semibold tracking-wide text-neutral-800 uppercase flex items-center gap-1.5">
            <Brush className="w-3.5 h-3.5" />
            Scratching Brush Size ({brushSize}px)
          </label>
        </div>

        <div className="mt-3 flex flex-col gap-3">
          <input
            id="brush-size-slider"
            type="range"
            min="8"
            max="100"
            value={brushSize}
            onChange={(e) => onBrushSizeChange(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-neutral-200 accent-neutral-900 outline-hidden"
          />

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {BRUSH_PRESETS.map((p) => (
              <button
                key={p.value}
                id={`brush-size-preset-${p.value}`}
                type="button"
                onClick={() => onBrushSizeChange(p.value)}
                className={`rounded-lg border py-1.5 text-xs font-semibold transition-all ${
                  brushSize === p.value
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-950'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Picture Zoom Adjustment */}
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="picture-zoom-slider" className="text-xs font-semibold tracking-wide text-neutral-800 uppercase flex items-center gap-1.5">
            <ZoomOut className="w-3.5 h-3.5" />
            Picture Scale ({pictureZoom}%)
          </label>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <input
            id="picture-zoom-slider"
            type="range"
            min="50"
            max="160"
            value={pictureZoom}
            onChange={(e) => onPictureZoomChange(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-neutral-200 accent-neutral-900 outline-hidden"
          />
          <button
            type="button"
            id="reset-picture-zoom-btn"
            onClick={() => onPictureZoomChange(100)}
            className="shrink-0 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-600 shadow-xs transition-all hover:border-neutral-300 hover:text-neutral-950"
          >
            100%
          </button>
        </div>
      </div>

      {/* Custom Audio feedback and Quick actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-neutral-100 pt-5">
        
        {/* Audio Toggle */}
        <button
          type="button"
          id="toggle-sound-btn"
          onClick={() => onSoundToggle(!soundEnabled)}
          className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold shadow-xs transition-all ${
            soundEnabled
              ? 'border-neutral-900 bg-neutral-50 text-neutral-900 hover:bg-neutral-100'
              : 'border-neutral-200 bg-white text-neutral-500 hover:text-neutral-700'
          }`}
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-4 h-4 text-emerald-600" />
              Scratch sound: ON
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 text-neutral-400" />
              Scratch sound: OFF
            </>
          )}
        </button>

        {/* Action triggers */}
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            id="reset-scratch-card-btn"
            onClick={onReset}
            className="flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 px-4 py-2.5 text-xs font-semibold text-neutral-700 shadow-xs transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5 text-neutral-500" />
            Reset Mask
          </button>

          <button
            type="button"
            id="reveal-all-scratch-card-btn"
            onClick={onRevealAll}
            className="flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl border border-transparent bg-neutral-950 hover:bg-neutral-800 px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-all active:scale-95"
          >
            <Eye className="w-3.5 h-3.5 text-neutral-300" />
            Reveal All
          </button>
        </div>

      </div>

    </div>
  );
}
