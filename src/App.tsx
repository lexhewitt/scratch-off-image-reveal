import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, Image as ImageIcon, Move, RotateCcw, Share2, Sparkles, Upload } from 'lucide-react';
import ScratchCanvas from './components/ScratchCanvas';
import { MaskConfig, ScratchAreaPoint, ScratchAreaShape, ShortsPlacement } from './types';

type WizardStep = 'upload' | 'place' | 'share' | 'scratch';

const DEFAULT_SHORTS_PLACEMENT: ShortsPlacement = {
  x: 0.32,
  y: 0.28,
  width: 0.36,
  height: 0.46
};

const DEFAULT_MASK: MaskConfig = {
  type: 'silver',
  text: 'SCRATCH TO REVEAL',
  textColor: '#334155'
};

export default function App() {
  const [step, setStep] = useState<WizardStep>('upload');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [brushSize] = useState<number>(34);
  const [pictureZoom] = useState<number>(100);
  const [scratchAreaShape, setScratchAreaShape] = useState<ScratchAreaShape>('placed-shorts');
  const [customScratchPath, setCustomScratchPath] = useState<ScratchAreaPoint[]>([]);
  const [shortsPlacement, setShortsPlacement] = useState<ShortsPlacement>(DEFAULT_SHORTS_PLACEMENT);
  const [isPlacingShorts, setIsPlacingShorts] = useState<boolean>(false);
  const [percentageRevealed, setPercentageRevealed] = useState<number>(0);
  const [isFullyRevealed, setIsFullyRevealed] = useState<boolean>(false);
  const [resetKey, setResetKey] = useState<number>(0);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [isUploadDragging, setIsUploadDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maskConfig = DEFAULT_MASK;

  const resetScratch = () => {
    setPercentageRevealed(0);
    setIsFullyRevealed(false);
    setResetKey((value) => value + 1);
  };

  const encodeSharePayload = (payload: unknown) => {
    return btoa(encodeURIComponent(JSON.stringify(payload)));
  };

  const decodeSharePayload = (value: string) => {
    return JSON.parse(decodeURIComponent(atob(value)));
  };

  const createShareUrl = (nextImageUrl = imageUrl) => {
    if (!nextImageUrl) return '';

    const payload = {
      version: 2,
      imageUrl: nextImageUrl,
      brushSize,
      pictureZoom,
      scratchAreaShape: 'placed-shorts',
      shortsPlacement,
      maskConfig
    };
    return `${window.location.origin}${window.location.pathname}#share=${encodeSharePayload(payload)}`;
  };

  const compressImageFile = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Upload an image file.'));
        return;
      }

      if (file.size > 12 * 1024 * 1024) {
        reject(new Error('Use an image smaller than 12MB.'));
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read this image.'));
      reader.onload = (event) => {
        const source = event.target?.result;
        if (typeof source !== 'string') {
          reject(new Error('Could not load this image.'));
          return;
        }

        const image = new Image();
        image.onload = () => {
          const maxSide = 900;
          const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(source);
            return;
          }

          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.72));
        };
        image.onerror = () => reject(new Error('Could not process this image.'));
        image.src = source;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFile = async (file: File) => {
    try {
      setStatus('Preparing image...');
      const compressed = await compressImageFile(file);
      setImageUrl(compressed);
      setShortsPlacement(DEFAULT_SHORTS_PLACEMENT);
      setScratchAreaShape('placed-shorts');
      setIsPlacingShorts(true);
      setShareUrl('');
      setStatus('');
      resetScratch();
      setStep('place');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not upload this image.');
    }
  };

  const handleApplyShorts = () => {
    setIsPlacingShorts(false);
    setScratchAreaShape('placed-shorts');
    resetScratch();
    setShareUrl('');
    setStatus('Shorts area applied. Scratch the foil to preview it, then share.');
    setStep('share');
  };

  const handleCreateShareLink = async () => {
    const url = createShareUrl();
    if (!url) {
      setStatus('Upload an image first.');
      return;
    }

    if (url.length > 180000) {
      setStatus('This image is too large for a share URL. Try a smaller crop or lower-resolution photo.');
      return;
    }

    setShareUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      setStatus('Share link copied.');
    } catch (_) {
      setStatus('Share link ready.');
    }
  };

  const handleNativeShare = async () => {
    const url = shareUrl || createShareUrl();
    if (!url) return;

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Scratch reveal', url });
        setStatus('Share sheet opened.');
      } else {
        await navigator.clipboard.writeText(url);
        setStatus('Share link copied.');
      }
    } catch (_) {
      setStatus('Share cancelled.');
    }
  };

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith('#share=')) return;

    try {
      const payload = decodeSharePayload(hash.replace('#share=', ''));
      if (!payload.imageUrl && !payload.customImageUrl) {
        throw new Error('Missing image');
      }

      setImageUrl(payload.imageUrl || payload.customImageUrl);
      setShortsPlacement(payload.shortsPlacement || DEFAULT_SHORTS_PLACEMENT);
      setScratchAreaShape('placed-shorts');
      setIsPlacingShorts(false);
      setStep('scratch');
      setStatus('');
      resetScratch();
    } catch (_) {
      setStatus('Could not load this shared scratch reveal.');
      setStep('upload');
    }
  }, []);

  useEffect(() => {
    if (percentageRevealed >= 88 && !isFullyRevealed) {
      setIsFullyRevealed(true);
    }
  }, [percentageRevealed, isFullyRevealed]);

  const currentStepIndex = step === 'upload' ? 0 : step === 'place' ? 1 : 2;
  const isCustomerScratchView = step === 'scratch';

  return (
    <div className="min-h-screen bg-neutral-100 font-sans text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-950 text-white">
              <Sparkles className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold tracking-tight">Scratch Shorts Reveal</h1>
              <p className="text-[11px] font-medium text-neutral-500">
                {isCustomerScratchView ? 'Scratch to reveal the image' : 'Create a shareable scratch reveal'}
              </p>
            </div>
          </div>
          {!isCustomerScratchView && (
            <button
              type="button"
              onClick={() => {
                setStep('upload');
                setImageUrl(null);
                setShareUrl('');
                setStatus('');
                resetScratch();
              }}
              className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 shadow-xs hover:border-neutral-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              New
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs sm:p-5">
          <div className="mb-4 flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <span className="rounded-md bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                {isPlacingShorts ? 'Position shorts' : isCustomerScratchView ? 'Scratch reveal' : 'Preview'}
              </span>
              <p className="mt-2 text-xs text-neutral-500">
                {isPlacingShorts
                  ? 'Drag the shorts over the legs and stretch from the corners.'
                  : 'The foil only covers the placed shorts area.'}
              </p>
            </div>
            {percentageRevealed > 0 && (
              <span className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-mono font-bold">
                {percentageRevealed}%
              </span>
            )}
          </div>

          {imageUrl ? (
            <ScratchCanvas
              key={resetKey}
              underlayType="image"
              imageUrl={imageUrl}
              brushSize={brushSize}
              pictureZoom={pictureZoom}
              scratchAreaShape={scratchAreaShape}
              customScratchPath={customScratchPath}
              onCustomScratchPathChange={setCustomScratchPath}
              shortsPlacement={shortsPlacement}
              onShortsPlacementChange={setShortsPlacement}
              isDrawingScratchArea={false}
              onDrawingScratchAreaChange={() => {}}
              isPlacingShorts={isPlacingShorts}
              maskConfig={maskConfig}
              onPercentageChange={setPercentageRevealed}
              isFullyRevealed={isFullyRevealed}
              soundEnabled={!isPlacingShorts}
            />
          ) : (
            <div className="flex aspect-[10/7] items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50">
              <div className="text-center">
                <ImageIcon className="mx-auto h-10 w-10 text-neutral-300" />
                <p className="mt-2 text-sm font-semibold text-neutral-500">Upload an image to start</p>
              </div>
            </div>
          )}
        </section>

        {!isCustomerScratchView ? (
          <aside className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
            <div className="mb-5 grid grid-cols-3 gap-2">
              {['Upload', 'Position', 'Share'].map((label, index) => (
                <div
                  key={label}
                  className={`rounded-lg border px-2 py-2 text-center text-[11px] font-bold ${
                    index <= currentStepIndex
                      ? 'border-neutral-900 bg-neutral-950 text-white'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-400'
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>

            {step === 'upload' && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide">Upload Picture</h2>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                  Use the picture the customer will scratch to reveal. It is compressed into the share link.
                </p>
                <div
                  className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center transition-all ${
                    isUploadDragging ? 'border-neutral-950 bg-neutral-50' : 'border-neutral-300 bg-white hover:border-neutral-400'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsUploadDragging(true);
                  }}
                  onDragLeave={() => setIsUploadDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsUploadDragging(false);
                    const file = event.dataTransfer.files[0];
                    if (file) handleFile(file);
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                  <Upload className="h-8 w-8 text-neutral-500" />
                  <p className="mt-3 text-sm font-semibold">Drop image here</p>
                  <p className="mt-1 text-xs text-neutral-400">or click to browse</p>
                </div>
              </div>
            )}

            {step === 'place' && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide">Drag & Stretch Shorts</h2>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                  Move the stencil over the legs. Use the corner handles to stretch it until it covers the shorts area.
                </p>
                <button
                  type="button"
                  onClick={handleApplyShorts}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-neutral-800"
                >
                  <Check className="h-4 w-4" />
                  Apply Shorts Area
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShortsPlacement(DEFAULT_SHORTS_PLACEMENT);
                    setIsPlacingShorts(true);
                  }}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 hover:border-neutral-300"
                >
                  <Move className="h-3.5 w-3.5" />
                  Reset Stencil
                </button>
              </div>
            )}

            {step === 'share' && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide">Share Scratch URL</h2>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                  Send this link to the customer. It opens straight into scratch mode on phone or iPad.
                </p>
                <button
                  type="button"
                  onClick={handleCreateShareLink}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-neutral-800"
                >
                  <Copy className="h-4 w-4" />
                  Copy Share URL
                </button>
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 hover:border-neutral-300"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Open Share Sheet
                </button>
                {shareUrl && (
                  <textarea
                    readOnly
                    value={shareUrl}
                    className="mt-3 h-24 w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-[11px] text-neutral-600 outline-hidden"
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsPlacingShorts(true);
                    setStep('place');
                    resetScratch();
                  }}
                  className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 hover:border-neutral-300"
                >
                  Adjust Shorts
                </button>
              </div>
            )}

            {status && (
              <p className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-600">
                {status}
              </p>
            )}
          </aside>
        ) : (
          <aside className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
            <h2 className="text-sm font-bold uppercase tracking-wide">Scratch to Reveal</h2>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">
              Drag your finger or cursor over the foil-covered shorts area to reveal the picture.
            </p>
            <button
              type="button"
              onClick={resetScratch}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 hover:border-neutral-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Scratch
            </button>
          </aside>
        )}
      </main>
    </div>
  );
}
