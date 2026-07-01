import React, { useState, useEffect } from 'react';
import { PRESETS, MaskConfig, PresetImage, ScratchAreaPoint, ScratchAreaShape } from './types';
import ScratchCanvas from './components/ScratchCanvas';
import PresetSelector from './components/PresetSelector';
import MaskCustomizer from './components/MaskCustomizer';
import ControlPanel from './components/ControlPanel';
import { Sparkles, Eye, Info, Volume2, Share2, HelpCircle, Gift, Image as ImageIcon, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Core Scratch States
  const [underlayType, setUnderlayType] = useState<'image' | 'secret-text'>('image');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>('cute-kitten');
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [secretText, setSecretText] = useState<string>('YOU HAVE WON A WARM HUG! ❤️');
  const [brushSize, setBrushSize] = useState<number>(30);
  const [pictureZoom, setPictureZoom] = useState<number>(100);
  const [scratchAreaShape, setScratchAreaShape] = useState<ScratchAreaShape>('rectangle');
  const [customScratchPath, setCustomScratchPath] = useState<ScratchAreaPoint[]>([]);
  const [isDrawingScratchArea, setIsDrawingScratchArea] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [percentageRevealed, setPercentageRevealed] = useState<number>(0);
  const [isFullyRevealed, setIsFullyRevealed] = useState<boolean>(false);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [resetKey, setResetKey] = useState<number>(0); // Incremented to force-remount/reset the ScratchCanvas cleanly

  const [maskConfig, setMaskConfig] = useState<MaskConfig>({
    type: 'silver',
    text: 'SCRATCH TO REVEAL 💎',
    textColor: '#334155'
  });

  // Active workspace settings tab for desktop/mobile optimization
  const [activeTab, setActiveTab] = useState<'content' | 'latex' | 'controls'>('content');

  // Custom sparkle particle state for victory celebration
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; color: string; size: number; delay: number }>>([]);

  // Get active underlay image url
  const getActiveImageUrl = () => {
    if (customImageUrl) return customImageUrl;
    const preset = PRESETS.find((p) => p.id === selectedPresetId);
    return preset ? preset.url : '';
  };

  // Select a preset image
  const handleSelectPreset = (preset: PresetImage) => {
    setCustomImageUrl(null);
    setSelectedPresetId(preset.id);
    handleReset();
  };

  // Load a custom image
  const handleCustomImageUpload = (url: string) => {
    setSelectedPresetId(null);
    setCustomImageUrl(url);
    setUnderlayType('image');
    handleReset();
  };

  // Reset the scratch card with a fresh coat of latex
  const handleReset = () => {
    setIsFullyRevealed(false);
    setShowCelebration(false);
    setPercentageRevealed(0);
    setResetKey((prev) => prev + 1);
  };

  // Smoothly trigger the Reveal All action
  const handleRevealAll = () => {
    setIsFullyRevealed(true);
  };

  // Auto-reveal remainder when user scratches off > 88% of the surface
  useEffect(() => {
    if (percentageRevealed >= 88 && !isFullyRevealed) {
      setIsFullyRevealed(true);
    }
  }, [percentageRevealed, isFullyRevealed]);

  // Generate fancy random sparkle items for celebration when fully revealed
  useEffect(() => {
    if (isFullyRevealed) {
      setShowCelebration(true);
      const newSparkles = Array.from({ length: 45 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100, // percentage left
        y: Math.random() * 100, // percentage top
        color: ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#e11d48'][Math.floor(Math.random() * 6)],
        size: Math.random() * 12 + 6,
        delay: Math.random() * 1.5
      }));
      setSparkles(newSparkles);

      // Play soft celebration chime synthesizer if audio enabled
      if (soundEnabled) {
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const now = ctx.currentTime;
            
            const playTone = (freq: number, time: number, duration: number) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq, time);
              
              gain.gain.setValueAtTime(0, time);
              gain.gain.linearRampToValueAtTime(0.12, time + 0.05);
              gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
              
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(time);
              osc.stop(time + duration);
            };

            // Play arpeggio
            playTone(523.25, now, 0.4); // C5
            playTone(659.25, now + 0.12, 0.4); // E5
            playTone(783.99, now + 0.24, 0.4); // G5
            playTone(1046.50, now + 0.36, 0.6); // C6
          }
        } catch (_) {}
      }
    }
  }, [isFullyRevealed]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-neutral-800">
      
      {/* Visual background pattern grids */}
      <div className="absolute inset-x-0 top-0 h-96 bg-radial from-slate-200/50 to-transparent pointer-events-none" />

      <header className="relative border-b border-neutral-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-950 text-white shadow-md">
              <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold tracking-tight text-neutral-900">
                Scratch Reveal
              </h1>
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mt-0.5">
                Dynamic Scratch-Off Simulator
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Active Workspace
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        
        {/* Bento Grid Design Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Interactive Scratching Arena Column */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Main Stage bezel container */}
            <div className="relative rounded-3xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-xs">
              
              {/* Card Title Header info */}
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-5">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700 border border-amber-200">
                    {underlayType === 'image' ? 'PICTURE TICKET' : 'SURPRISE VOUCHER'}
                  </span>
                  <span className="text-xs font-semibold text-neutral-400">
                    ID: #{1259 + resetKey}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {soundEnabled && percentageRevealed > 0 && !isFullyRevealed && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md animate-pulse">
                      <Volume2 className="w-3 h-3 text-emerald-600" />
                      SOUND ACTIVE
                    </span>
                  )}
                  {percentageRevealed > 0 && (
                    <span className="text-xs font-mono font-bold text-neutral-700">
                      {percentageRevealed}% Revealed
                    </span>
                  )}
                </div>
              </div>

              {/* Core Scratch Canvas Wrapper */}
              <div className="relative mx-auto max-w-full">
                <ScratchCanvas
                  key={resetKey}
                  underlayType={underlayType}
                  imageUrl={getActiveImageUrl()}
                  secretText={secretText}
                  brushSize={brushSize}
                  pictureZoom={pictureZoom}
                  scratchAreaShape={scratchAreaShape}
                  customScratchPath={customScratchPath}
                  onCustomScratchPathChange={setCustomScratchPath}
                  isDrawingScratchArea={isDrawingScratchArea}
                  onDrawingScratchAreaChange={setIsDrawingScratchArea}
                  maskConfig={maskConfig}
                  onPercentageChange={setPercentageRevealed}
                  isFullyRevealed={isFullyRevealed}
                  soundEnabled={soundEnabled}
                />

                {/* Celebratory Unlocked Banner overlay */}
                <AnimatePresence>
                  {showCelebration && (
                    <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                      
                      {/* Burst particle system */}
                      {sparkles.map((sparkle) => (
                        <motion.div
                          key={sparkle.id}
                          initial={{ opacity: 0, scale: 0, y: 0 }}
                          animate={{ 
                            opacity: [0, 1, 1, 0], 
                            scale: [0, sparkle.size / 10, sparkle.size / 10, 0],
                            y: [-10, -120 - Math.random() * 80],
                            x: [0, (Math.random() - 0.5) * 150]
                          }}
                          transition={{ 
                            duration: 1.8, 
                            delay: sparkle.delay, 
                            ease: "easeOut"
                          }}
                          className="absolute pointer-events-none"
                          style={{
                            left: `${sparkle.x}%`,
                            top: `${sparkle.y}%`,
                            color: sparkle.color
                          }}
                        >
                          ✦
                        </motion.div>
                      ))}

                      {/* Centered Congratulatory Banner Card */}
                      <motion.div
                        initial={{ scale: 0.3, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ type: "spring", damping: 15 }}
                        className="rounded-2xl border-2 border-amber-300 bg-white/95 px-8 py-5 text-center shadow-2xl backdrop-blur-md max-w-xs pointer-events-auto"
                      >
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-2">
                          <Sparkles className="w-5 h-5 fill-amber-500 text-amber-600" />
                        </div>
                        <h4 className="font-display text-base font-bold text-neutral-900 leading-tight">
                          Secret Unlocked!
                        </h4>
                        <p className="mt-1 text-xs text-neutral-500">
                          {underlayType === 'image' 
                            ? 'The picture is fully revealed.' 
                            : 'Your custom secret voucher is ready!'}
                        </p>
                        <button
                          type="button"
                          id="victory-reset-btn"
                          onClick={handleReset}
                          className="mt-3.5 w-full rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-[11px] py-1.5 transition-all shadow-xs"
                        >
                          Scratch Again
                        </button>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Scratch guide banner */}
              <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-slate-50 border border-slate-100 p-3">
                <Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                <p className="text-[11px] leading-relaxed text-slate-600">
                  <span className="font-semibold text-slate-900">How to scratch:</span> Use your computer cursor or simply drag your finger on a mobile touchscreen to shave off the metallic foil and reveal the secret underneath!
                </p>
              </div>

            </div>

            {/* Fun info stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-neutral-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-800">Dynamic Precision</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Procedural metal rendering matching container dimensions.</p>
                </div>
              </div>
              <div className="bg-white border border-neutral-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-800">Adaptive Acoustics</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Synthesized friction sound adjusting dynamically to velocity.</p>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT: Workspace Customizer Tabbed Bento Panel */}
          <div className="lg:col-span-5">
            
            <div className="rounded-3xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
              
              {/* Design Workspace Tab bar headers */}
              <div className="flex border-b border-neutral-200 bg-neutral-50/50">
                
                <button
                  type="button"
                  id="tab-btn-content"
                  onClick={() => setActiveTab('content')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-4 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === 'content'
                      ? 'border-neutral-900 text-neutral-950 bg-white'
                      : 'border-transparent text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  1. Underlay
                </button>
                
                <button
                  type="button"
                  id="tab-btn-latex"
                  onClick={() => setActiveTab('latex')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-4 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === 'latex'
                      ? 'border-neutral-900 text-neutral-950 bg-white'
                      : 'border-transparent text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  2. Cover Foil
                </button>
                
                <button
                  type="button"
                  id="tab-btn-controls"
                  onClick={() => setActiveTab('controls')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-4 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === 'controls'
                      ? 'border-neutral-900 text-neutral-950 bg-white'
                      : 'border-transparent text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  3. Controls
                </button>
                
              </div>

              {/* Tab Contents space */}
              <div className="p-5 sm:p-6">
                
                {activeTab === 'content' && (
                  <PresetSelector
                    selectedPresetId={selectedPresetId}
                    onSelectPreset={handleSelectPreset}
                    onCustomImageUpload={handleCustomImageUpload}
                  />
                )}

                {activeTab === 'latex' && (
                  <MaskCustomizer
                    maskConfig={maskConfig}
                    onMaskConfigChange={setMaskConfig}
                    underlayType={underlayType}
                    onUnderlayTypeChange={setUnderlayType}
                    secretText={secretText}
                    onSecretTextChange={setSecretText}
                    scratchAreaShape={scratchAreaShape}
                    onScratchAreaShapeChange={setScratchAreaShape}
                    customScratchPath={customScratchPath}
                    onCustomScratchPathChange={setCustomScratchPath}
                    isDrawingScratchArea={isDrawingScratchArea}
                    onDrawingScratchAreaChange={setIsDrawingScratchArea}
                  />
                )}

                {activeTab === 'controls' && (
                  <ControlPanel
                    brushSize={brushSize}
                    onBrushSizeChange={setBrushSize}
                    pictureZoom={pictureZoom}
                    onPictureZoomChange={setPictureZoom}
                    soundEnabled={soundEnabled}
                    onSoundToggle={setSoundEnabled}
                    percentageRevealed={percentageRevealed}
                    onRevealAll={handleRevealAll}
                    onReset={handleReset}
                  />
                )}

              </div>

              {/* Footer of Design Board */}
              <div className="border-t border-neutral-100 bg-neutral-50 px-5 py-4 flex items-center justify-between text-[11px] text-neutral-400">
                <span>Scratch-off Reveal Creator</span>
                <span>Crafted Experience</span>
              </div>

            </div>

          </div>

        </div>

      </main>
      
    </div>
  );
}
