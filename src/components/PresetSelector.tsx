import React, { useState, useRef } from 'react';
import { PRESETS, PresetImage } from '../types';
import { Image as ImageIcon, Upload, Sparkles, AlertCircle } from 'lucide-react';

interface PresetSelectorProps {
  selectedPresetId: string | null;
  onSelectPreset: (preset: PresetImage) => void;
  onCustomImageUpload: (url: string) => void;
}

export default function PresetSelector({
  selectedPresetId,
  onSelectPreset,
  onCustomImageUpload
}: PresetSelectorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Drag & Drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please drop an image file (PNG, JPG, WEBP, etc.)');
      return;
    }
    
    // File size limit (e.g. 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image is too large. Please use an image smaller than 10MB.');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onCustomImageUpload(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div id="preset-selector-section" className="flex flex-col gap-5">
      <div>
        <h3 className="text-sm font-semibold tracking-wide text-neutral-800 uppercase flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-neutral-600" />
          1. Choose Hidden Underlay
        </h3>
        <p className="text-xs text-neutral-500 mt-1">Pick a preloaded high-quality secret image or drop your own image below.</p>
      </div>

      {/* Grid of presets */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            id={`preset-btn-${preset.id}`}
            type="button"
            onClick={() => {
              setUploadError(null);
              onSelectPreset(preset);
            }}
            className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all duration-200 focus:outline-hidden ${
              selectedPresetId === preset.id
                ? 'border-neutral-900 bg-neutral-50 ring-2 ring-neutral-950/20'
                : 'border-neutral-200 hover:border-neutral-400 bg-white'
            }`}
          >
            <div className="aspect-video w-full overflow-hidden bg-neutral-100">
              <img
                src={preset.url}
                alt={preset.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-2.5">
              <div className="text-xs font-semibold text-neutral-800 tracking-tight leading-tight">
                {preset.name}
              </div>
              <div className="mt-0.5 text-[10px] text-neutral-400 capitalize">
                {preset.category}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Combined Drag & Drop + Manual Click Zone */}
      <div
        id="drag-and-drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition-all duration-200 cursor-pointer ${
          isDragging
            ? 'border-neutral-900 bg-neutral-50 scale-[0.99]'
            : 'border-neutral-300 bg-white hover:border-neutral-400'
        }`}
      >
        <input
          id="hidden-file-input"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          title="Upload image"
        />
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors group-hover:bg-neutral-200">
          <Upload className="w-5 h-5" />
        </div>
        
        <p className="mt-2.5 text-xs font-medium text-neutral-700">
          Drag and drop your own photo here
        </p>
        <p className="mt-1 text-[10px] text-neutral-400">
          or click to browse local files (PNG, JPG, WEBP, GIF)
        </p>

        {uploadError && (
          <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-[11px] font-medium text-red-600 border border-red-100">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
