import React, { useRef, useEffect, useState } from 'react';
import { MaskConfig, ScratchAreaPoint, ScratchAreaShape, ShortsPlacement } from '../types';

interface ScratchCanvasProps {
  key?: React.Key;
  imageUrl?: string;
  underlayType: 'image' | 'secret-text';
  secretText?: string;
  brushSize: number;
  pictureZoom: number;
  scratchAreaShape: ScratchAreaShape;
  customScratchPath: ScratchAreaPoint[];
  onCustomScratchPathChange: (path: ScratchAreaPoint[]) => void;
  shortsPlacement: ShortsPlacement;
  onShortsPlacementChange: (placement: ShortsPlacement) => void;
  isDrawingScratchArea: boolean;
  onDrawingScratchAreaChange: (isDrawing: boolean) => void;
  isPlacingShorts: boolean;
  maskConfig: MaskConfig;
  onPercentageChange: (percent: number) => void;
  isFullyRevealed: boolean;
  onRevealComplete?: () => void;
  soundEnabled: boolean;
}

export default function ScratchCanvas({
  imageUrl,
  underlayType,
  secretText = '',
  brushSize,
  pictureZoom,
  scratchAreaShape,
  customScratchPath,
  onCustomScratchPathChange,
  shortsPlacement,
  onShortsPlacementChange,
  isDrawingScratchArea,
  onDrawingScratchAreaChange,
  isPlacingShorts,
  maskConfig,
  onPercentageChange,
  isFullyRevealed,
  onRevealComplete,
  soundEnabled
}: ScratchCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioNodesRef = useRef<{
    noiseNode: AudioWorkletNode | AudioBufferSourceNode | null;
    filterNode: BiquadFilterNode | null;
    gainNode: GainNode | null;
  }>({ noiseNode: null, filterNode: null, gainNode: null });

  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [draftScratchPath, setDraftScratchPath] = useState<ScratchAreaPoint[]>([]);
  const draftScratchPathRef = useRef<ScratchAreaPoint[]>([]);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const dragPlacementRef = useRef<{
    mode: 'move' | 'point' | 'rotate';
    pointIndex?: number;
    pointerId: number;
    startX: number;
    startY: number;
    startPlacement: ShortsPlacement;
    startPoints: ScratchAreaPoint[];
    center: ScratchAreaPoint;
    startPointerAngle: number;
  } | null>(null);

  const getDefaultShortsPath = (width: number, height: number) => {
    const path = new Path2D();
    const left = width * 0.15;
    const right = width * 0.85;
    const top = height * 0.14;
    const bottom = height * 0.88;
    const waistBottom = height * 0.29;
    const crotchY = height * 0.57;
    const innerLeft = width * 0.43;
    const innerRight = width * 0.57;

    path.moveTo(left, top);
    path.quadraticCurveTo(width * 0.5, height * 0.08, right, top);
    path.lineTo(width * 0.79, bottom);
    path.quadraticCurveTo(width * 0.68, height * 0.91, width * 0.6, bottom);
    path.lineTo(innerRight, crotchY);
    path.quadraticCurveTo(width * 0.5, height * 0.5, innerLeft, crotchY);
    path.lineTo(width * 0.4, bottom);
    path.quadraticCurveTo(width * 0.32, height * 0.91, width * 0.21, bottom);
    path.lineTo(left, top);
    path.closePath();

    path.moveTo(left + width * 0.02, waistBottom);
    path.lineTo(right - width * 0.02, waistBottom);

    return path;
  };

  const getShortsPathInBox = (placement: ShortsPlacement, width: number, height: number) => {
    const path = new Path2D();
    const boxX = placement.x * width;
    const boxY = placement.y * height;
    const boxW = placement.width * width;
    const boxH = placement.height * height;
    const left = boxX + boxW * 0.04;
    const right = boxX + boxW * 0.96;
    const top = boxY + boxH * 0.04;
    const bottom = boxY + boxH * 0.96;
    const waistBottom = boxY + boxH * 0.22;
    const crotchY = boxY + boxH * 0.62;
    const innerLeft = boxX + boxW * 0.42;
    const innerRight = boxX + boxW * 0.58;

    path.moveTo(left, top);
    path.quadraticCurveTo(boxX + boxW * 0.5, boxY, right, top);
    path.lineTo(boxX + boxW * 0.82, bottom);
    path.quadraticCurveTo(boxX + boxW * 0.68, boxY + boxH, boxX + boxW * 0.6, bottom);
    path.lineTo(innerRight, crotchY);
    path.quadraticCurveTo(boxX + boxW * 0.5, boxY + boxH * 0.54, innerLeft, crotchY);
    path.lineTo(boxX + boxW * 0.4, bottom);
    path.quadraticCurveTo(boxX + boxW * 0.32, boxY + boxH, boxX + boxW * 0.18, bottom);
    path.lineTo(left, top);
    path.closePath();

    path.moveTo(left + boxW * 0.03, waistBottom);
    path.lineTo(right - boxW * 0.03, waistBottom);

    return path;
  };

  const getPathFromPoints = (points: ScratchAreaPoint[], width: number, height: number) => {
    const path = new Path2D();
    if (points.length === 0) return path;

    path.moveTo(points[0].x * width, points[0].y * height);
    points.slice(1).forEach((point) => {
      path.lineTo(point.x * width, point.y * height);
    });
    path.closePath();

    return path;
  };

  const getEditableShortsPath = (points: ScratchAreaPoint[], width: number, height: number) => {
    if (points.length < 11) {
      return getPathFromPoints(points, width, height);
    }

    const scaled = points.slice(0, 11).map((point) => ({
      x: point.x * width,
      y: point.y * height
    }));
    const [
      waistLeft,
      waistRight,
      rightHip,
      rightOuterHem,
      rightInnerHem,
      rightInseam,
      crotch,
      leftInseam,
      leftInnerHem,
      leftOuterHem,
      leftHip
    ] = scaled;

    const path = new Path2D();
    path.moveTo(waistLeft.x, waistLeft.y);
    path.lineTo(waistRight.x, waistRight.y);
    path.quadraticCurveTo(rightHip.x, rightHip.y, rightOuterHem.x, rightOuterHem.y);
    path.quadraticCurveTo(
      (rightOuterHem.x + rightInnerHem.x) / 2,
      Math.max(rightOuterHem.y, rightInnerHem.y) + height * 0.03,
      rightInnerHem.x,
      rightInnerHem.y
    );
    path.quadraticCurveTo(rightInseam.x, rightInseam.y, crotch.x, crotch.y);
    path.quadraticCurveTo(leftInseam.x, leftInseam.y, leftInnerHem.x, leftInnerHem.y);
    path.quadraticCurveTo(
      (leftInnerHem.x + leftOuterHem.x) / 2,
      Math.max(leftInnerHem.y, leftOuterHem.y) + height * 0.03,
      leftOuterHem.x,
      leftOuterHem.y
    );
    path.quadraticCurveTo(leftHip.x, leftHip.y, waistLeft.x, waistLeft.y);
    path.closePath();

    return path;
  };

  const getEditableShortsSvgPath = (points: ScratchAreaPoint[]) => {
    if (points.length < 11) {
      return `M ${points.map((point) => `${point.x * 100} ${point.y * 100}`).join(' L ')} Z`;
    }

    const p = points.slice(0, 11).map((point) => ({
      x: point.x * 100,
      y: point.y * 100
    }));
    const [
      waistLeft,
      waistRight,
      rightHip,
      rightOuterHem,
      rightInnerHem,
      rightInseam,
      crotch,
      leftInseam,
      leftInnerHem,
      leftOuterHem,
      leftHip
    ] = p;

    return [
      `M ${waistLeft.x} ${waistLeft.y}`,
      `L ${waistRight.x} ${waistRight.y}`,
      `Q ${rightHip.x} ${rightHip.y} ${rightOuterHem.x} ${rightOuterHem.y}`,
      `Q ${(rightOuterHem.x + rightInnerHem.x) / 2} ${Math.max(rightOuterHem.y, rightInnerHem.y) + 3} ${rightInnerHem.x} ${rightInnerHem.y}`,
      `Q ${rightInseam.x} ${rightInseam.y} ${crotch.x} ${crotch.y}`,
      `Q ${leftInseam.x} ${leftInseam.y} ${leftInnerHem.x} ${leftInnerHem.y}`,
      `Q ${(leftInnerHem.x + leftOuterHem.x) / 2} ${Math.max(leftInnerHem.y, leftOuterHem.y) + 3} ${leftOuterHem.x} ${leftOuterHem.y}`,
      `Q ${leftHip.x} ${leftHip.y} ${waistLeft.x} ${waistLeft.y}`,
      'Z'
    ].join(' ');
  };

  const getScratchAreaPath = (width: number, height: number) => {
    const path = new Path2D();

    if (scratchAreaShape === 'shorts') {
      return getDefaultShortsPath(width, height);
    } else if (scratchAreaShape === 'placed-shorts') {
      return customScratchPath.length >= 3
        ? getEditableShortsPath(customScratchPath, width, height)
        : getShortsPathInBox(shortsPlacement, width, height);
    } else if (scratchAreaShape === 'drawn-shorts') {
      return customScratchPath.length >= 3
        ? getPathFromPoints(customScratchPath, width, height)
        : getDefaultShortsPath(width, height);
    } else {
      path.rect(0, 0, width, height);
    }

    return path;
  };

  // Initialize Web Audio API for scratch sound synthesis
  const initAudio = () => {
    if (audioContextRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      // Create white noise buffer
      const bufferSize = ctx.sampleRate * 2; // 2 seconds of noise
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      // Create AudioNodes
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1000; // mid-range scratchy pitch
      filter.Q.value = 3.0; // tight filter focus

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, ctx.currentTime);

      // Connect
      noiseSource.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Start looping noise
      noiseSource.start();

      audioNodesRef.current = {
        noiseNode: noiseSource,
        filterNode: filter,
        gainNode: gainNode
      };
    } catch (e) {
      console.error('Failed to initialize Web Audio:', e);
    }
  };

  const startScratchSound = () => {
    if (!soundEnabled) return;
    if (!audioContextRef.current) {
      initAudio();
    }
    const nodes = audioNodesRef.current;
    if (nodes.gainNode && audioContextRef.current) {
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      // Ramping up gain quickly for a smooth scratching start sound
      nodes.gainNode.gain.setTargetAtTime(0.18, audioContextRef.current.currentTime, 0.05);
      
      // Add slight frequency modulation for pitch variety during scratching
      if (nodes.filterNode) {
        nodes.filterNode.frequency.setValueAtTime(800 + Math.random() * 400, audioContextRef.current.currentTime);
      }
    }
  };

  const stopScratchSound = () => {
    const nodes = audioNodesRef.current;
    if (nodes.gainNode && audioContextRef.current) {
      // Fade out gain
      nodes.gainNode.gain.setTargetAtTime(0, audioContextRef.current.currentTime, 0.08);
    }
  };

  // Adjust frequencies of audio filter as scratch speed changes
  const modulateScratchSound = (speed: number) => {
    if (!soundEnabled) return;
    const nodes = audioNodesRef.current;
    if (nodes.filterNode && nodes.gainNode && audioContextRef.current) {
      const centerFreq = Math.min(2200, Math.max(600, 600 + speed * 15));
      const volume = Math.min(0.3, Math.max(0.05, 0.05 + speed * 0.02));
      nodes.filterNode.frequency.setTargetAtTime(centerFreq, audioContextRef.current.currentTime, 0.05);
      nodes.gainNode.gain.setTargetAtTime(volume, audioContextRef.current.currentTime, 0.05);
    }
  };

  // Redraw the mask on the canvas when sizes or settings change
  const drawMask = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = canvas;

    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, width, height);
    const scratchAreaPath = getScratchAreaPath(width, height);
    ctx.save();
    ctx.clip(scratchAreaPath);

    // 1. Draw base textures
    if (maskConfig.type === 'silver') {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#f1f5f9');
      grad.addColorStop(0.3, '#cbd5e1');
      grad.addColorStop(0.7, '#94a3b8');
      grad.addColorStop(1, '#475569');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Brushed aluminum strokes
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 40; i++) {
        ctx.beginPath();
        const offset = Math.random() * width;
        ctx.moveTo(offset, 0);
        ctx.lineTo(offset - 120, height);
        ctx.stroke();
      }
      // Micro latex noise speckles
      for (let i = 0; i < 1200; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 1.5;
        ctx.fillStyle = Math.random() > 0.55 ? 'rgba(255,255,255,0.45)' : 'rgba(30,41,59,0.18)';
        ctx.fillRect(x, y, size, size);
      }
    } else if (maskConfig.type === 'gold') {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.2, '#fde047');
      grad.addColorStop(0.5, '#eab308');
      grad.addColorStop(0.8, '#ca8a04');
      grad.addColorStop(1, '#713f12');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Golden foil pattern lines
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.45)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 30; i++) {
        ctx.beginPath();
        const offset = Math.random() * width;
        ctx.moveTo(offset, 0);
        ctx.lineTo(offset + 180, height);
        ctx.stroke();
      }
      // Gold glitter speckles
      for (let i = 0; i < 1800; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 2;
        ctx.fillStyle = Math.random() > 0.65 ? 'rgba(255,255,255,0.7)' : 'rgba(113,63,18,0.25)';
        ctx.fillRect(x, y, size, size);
      }
    } else if (maskConfig.type === 'charcoal') {
      const grad = ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, Math.max(width, height));
      grad.addColorStop(0, '#475569');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Matte dark grains
      for (let i = 0; i < 1400; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 1.2;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.35)';
        ctx.fillRect(x, y, size, size);
      }
    } else if (maskConfig.type === 'cardboard') {
      ctx.fillStyle = '#bcaaa4';
      ctx.fillRect(0, 0, width, height);

      // Craft paper fiber strands
      ctx.strokeStyle = 'rgba(93, 64, 55, 0.12)';
      for (let i = 0; i < 90; i++) {
        ctx.beginPath();
        const x = Math.random() * width;
        const y = Math.random() * height;
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.random() * 18 - 9, y + Math.random() * 18 - 9);
        ctx.stroke();
      }
      // Craft pulp details
      for (let i = 0; i < 900; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 1.5;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(141,110,99,0.22)' : 'rgba(62,39,35,0.16)';
        ctx.fillRect(x, y, size, size);
      }
    } else {
      // Solid flat color
      ctx.fillStyle = maskConfig.color || '#94a3b8';
      ctx.fillRect(0, 0, width, height);

      // Elegant diagonal stripes pattern overlay
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 2.5;
      for (let i = -height; i < width; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + height, height);
        ctx.stroke();
      }
    }

    // Border Frame for the scratchable card area
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 4;
    ctx.stroke(scratchAreaPath);

    // 2. Draw text overlays on top of the mask
    if (maskConfig.text) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const baseSize = Math.max(14, Math.min(width / 13, 30));
      ctx.font = `700 ${baseSize}px "Inter", system-ui, -apple-system, sans-serif`;

      // Draw subtle shadow for premium look
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = maskConfig.textColor || '#ffffff';
      const labelY = scratchAreaShape === 'placed-shorts'
        ? (customScratchPath.length >= 3
            ? Math.min(...customScratchPath.map((point) => point.y)) * height + 44
            : (shortsPlacement.y + shortsPlacement.height * 0.35) * height)
        : scratchAreaShape === 'shorts'
          ? height * 0.38
          : height / 2;
      ctx.fillText(maskConfig.text, width / 2, labelY);

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    ctx.restore();
  };

  const drawScratchAreaPreview = (canvas: HTMLCanvasElement, points: ScratchAreaPoint[]) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = canvas;
    const previewPath = points.length >= 3
      ? getPathFromPoints(points, width, height)
      : getDefaultShortsPath(width, height);

    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
    ctx.fill(previewPath);
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.stroke(previewPath);
    ctx.setLineDash([]);

    if (points.length > 0) {
      ctx.beginPath();
      points.forEach((point, index) => {
        const x = point.x * width;
        const y = point.y * height;
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  };

  // Re-size canvas whenever dimensions change or image gets loaded
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      if (isPlacingShorts) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      } else if (isDrawingScratchArea) {
        drawScratchAreaPreview(canvas, draftScratchPath.length > 0 ? draftScratchPath : customScratchPath);
      } else {
        drawMask(canvas);
      }
      // Reset reveal progress
      onPercentageChange(0);
    }
  }, [dimensions, maskConfig, scratchAreaShape, customScratchPath, isDrawingScratchArea, isPlacingShorts, shortsPlacement]);

  // Clean up Web Audio node when unmounting
  useEffect(() => {
    return () => {
      const nodes = audioNodesRef.current;
      if (nodes.noiseNode) {
        try {
          (nodes.noiseNode as AudioBufferSourceNode).stop();
        } catch (_) {}
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Update dimensions based on parent container size
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.clientWidth;
      // Force standard 4:3 or golden aspect ratio bounds
      let targetHeight = Math.round(containerWidth * 0.7);
      
      // Ensure height fits comfortably on the screen
      const maxAvailableHeight = window.innerHeight * 0.55;
      if (targetHeight > maxAvailableHeight) {
        targetHeight = maxAvailableHeight;
      }

      setDimensions({
        width: containerWidth,
        height: targetHeight
      });
    };

    updateSize();

    // Use ResizeObserver for ultra-precise canvas container resizing
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [imageUrl, underlayType, imgLoaded]);

  // Handle Full Reveal trigger
  useEffect(() => {
    if (isFullyRevealed) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.fillStyle = 'rgba(0, 0, 0, 1)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          onPercentageChange(100);
          if (onRevealComplete) {
            onRevealComplete();
          }
        }
      }
    }
  }, [isFullyRevealed]);

  // Fast pixel-sampling check to calculate reveal percentage
  const updateRevealPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    try {
      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels = imageData.data;
      
      const step = 8; // high-perf sampling
      let transparentCount = 0;
      let sampleCount = 0;

      const scratchAreaPath = getScratchAreaPath(width, height);

      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          if (!ctx.isPointInPath(scratchAreaPath, x, y)) {
            continue;
          }
          const index = (y * width + x) * 4;
          // pixels[index + 3] is the alpha channel
          if (pixels[index + 3] < 80) {
            transparentCount++;
          }
          sampleCount++;
        }
      }

      const percent = sampleCount > 0 ? (transparentCount / sampleCount) * 100 : 0;
      onPercentageChange(Math.round(percent));
    } catch (e) {
      console.error('Error calculating percentage:', e);
    }
  };

  // Maps viewport pointer coordinates accurately to canvas coordinates
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Scale viewport coordinates to match internal canvas coordinate resolution
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const isInsideScratchArea = (x: number, y: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return false;

    return ctx.isPointInPath(getScratchAreaPath(canvas.width, canvas.height), x, y);
  };

  const toNormalizedPoint = (coords: { x: number; y: number }): ScratchAreaPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    return {
      x: Math.min(1, Math.max(0, coords.x / canvas.width)),
      y: Math.min(1, Math.max(0, coords.y / canvas.height))
    };
  };

  const drawDraftPath = (points: ScratchAreaPoint[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawScratchAreaPreview(canvas, points);
  };

  const clampPlacement = (placement: ShortsPlacement): ShortsPlacement => {
    const minWidth = 0.12;
    const minHeight = 0.18;
    const width = Math.min(0.95, Math.max(minWidth, placement.width));
    const height = Math.min(0.95, Math.max(minHeight, placement.height));

    return {
      x: Math.min(1 - width, Math.max(0, placement.x)),
      y: Math.min(1 - height, Math.max(0, placement.y)),
      width,
      height
    };
  };

  const clampPoint = (point: ScratchAreaPoint): ScratchAreaPoint => ({
    x: Math.min(1, Math.max(0, point.x)),
    y: Math.min(1, Math.max(0, point.y))
  });

  const movePoints = (points: ScratchAreaPoint[], deltaX: number, deltaY: number) => {
    if (points.length === 0) return points;
    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxY = Math.max(...points.map((point) => point.y));
    const safeDeltaX = Math.min(1 - maxX, Math.max(-minX, deltaX));
    const safeDeltaY = Math.min(1 - maxY, Math.max(-minY, deltaY));

    return points.map((point) => ({
      x: point.x + safeDeltaX,
      y: point.y + safeDeltaY
    }));
  };

  const getPointsCenter = (points: ScratchAreaPoint[]) => {
    if (points.length === 0) return { x: 0.5, y: 0.5 };
    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxY = Math.max(...points.map((point) => point.y));

    return {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2
    };
  };

  const getPointerAngle = (clientX: number, clientY: number, center: ScratchAreaPoint) => {
    const container = containerRef.current;
    if (!container) return 0;
    const rect = container.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    return Math.atan2(y - center.y, x - center.x);
  };

  const rotatePoints = (points: ScratchAreaPoint[], center: ScratchAreaPoint, angle: number) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return points.map((point) => {
      const dx = point.x - center.x;
      const dy = point.y - center.y;
      return clampPoint({
        x: center.x + dx * cos - dy * sin,
        y: center.y + dx * sin + dy * cos
      });
    });
  };

  const handlePlacementPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    mode: 'move' | 'point' | 'rotate',
    pointIndex?: number
  ) => {
    if (!isPlacingShorts) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const center = getPointsCenter(customScratchPath);
    dragPlacementRef.current = {
      mode,
      pointIndex,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startPlacement: shortsPlacement,
      startPoints: customScratchPath,
      center,
      startPointerAngle: getPointerAngle(e.clientX, e.clientY, center)
    };
  };

  const handlePlacementPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragPlacementRef.current;
    const container = containerRef.current;
    if (!dragState || !container || e.pointerId !== dragState.pointerId) return;

    e.preventDefault();
    e.stopPropagation();
    const rect = container.getBoundingClientRect();
    const deltaX = (e.clientX - dragState.startX) / rect.width;
    const deltaY = (e.clientY - dragState.startY) / rect.height;

    if (dragState.mode === 'point' && typeof dragState.pointIndex === 'number') {
      const nextPoints = dragState.startPoints.map((point, index) => (
        index === dragState.pointIndex
          ? clampPoint({ x: point.x + deltaX, y: point.y + deltaY })
          : point
      ));
      onCustomScratchPathChange(nextPoints);
      return;
    }

    if (dragState.mode === 'rotate') {
      const nextAngle = getPointerAngle(e.clientX, e.clientY, dragState.center);
      onCustomScratchPathChange(rotatePoints(
        dragState.startPoints,
        dragState.center,
        nextAngle - dragState.startPointerAngle
      ));
      return;
    }

    if (dragState.startPoints.length >= 3) {
      onCustomScratchPathChange(movePoints(dragState.startPoints, deltaX, deltaY));
      return;
    }

    onShortsPlacementChange(clampPlacement({
      ...dragState.startPlacement,
      x: dragState.startPlacement.x + deltaX,
      y: dragState.startPlacement.y + deltaY
    }));
  };

  const handlePlacementPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragPlacementRef.current?.pointerId === e.pointerId) {
      e.preventDefault();
      e.stopPropagation();
      dragPlacementRef.current = null;
    }
  };

  const drawPoint = (x: number, y: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';

    const scratchAreaPath = getScratchAreaPath(canvas.width, canvas.height);
    if (!ctx.isPointInPath(scratchAreaPath, x, y)) return;

    ctx.save();
    ctx.clip(scratchAreaPath);
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = 'rgba(0,0,0,1)';

    const scratchAreaPath = getScratchAreaPath(canvas.width, canvas.height);
    if (!ctx.isPointInPath(scratchAreaPath, x1, y1) && !ctx.isPointInPath(scratchAreaPath, x2, y2)) return;

    ctx.save();
    ctx.clip(scratchAreaPath);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  };

  // Handle Pointer interactions
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isFullyRevealed) return;
    
    const coords = getCanvasCoords(e);
    if (isDrawingScratchArea) {
      const firstPoint = toNormalizedPoint(coords);
      draftScratchPathRef.current = [firstPoint];
      setDraftScratchPath([firstPoint]);
      drawDraftPath([firstPoint]);
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDrawing(true);
      return;
    }

    if (!isInsideScratchArea(coords.x, coords.y)) return;

    // Capture pointer to track touch accurately even off-canvas
    e.currentTarget.setPointerCapture(e.pointerId);
    
    setIsDrawing(true);
    setLastPos(coords);
    drawPoint(coords.x, coords.y);
    
    startScratchSound();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isFullyRevealed) return;

    const coords = getCanvasCoords(e);
    if (isDrawingScratchArea) {
      const nextPoint = toNormalizedPoint(coords);
      const lastPoint = draftScratchPathRef.current[draftScratchPathRef.current.length - 1];
      if (lastPoint && Math.hypot(nextPoint.x - lastPoint.x, nextPoint.y - lastPoint.y) < 0.006) {
        return;
      }

      const nextPath = [...draftScratchPathRef.current, nextPoint];
      draftScratchPathRef.current = nextPath;
      setDraftScratchPath(nextPath);
      drawDraftPath(nextPath);
      return;
    }

    drawLine(lastPos.x, lastPos.y, coords.x, coords.y);

    // Calculate movement distance to adjust audio pitch/volume
    const dist = Math.hypot(coords.x - lastPos.x, coords.y - lastPos.y);
    modulateScratchSound(dist);

    setLastPos(coords);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDrawing) {
      setIsDrawing(false);
      if (isDrawingScratchArea) {
        const completedPath = draftScratchPathRef.current;
        if (completedPath.length >= 3) {
          onCustomScratchPathChange(completedPath);
          onDrawingScratchAreaChange(false);
        }
        draftScratchPathRef.current = [];
        setDraftScratchPath([]);
        return;
      }

      stopScratchSound();
      updateRevealPercentage();
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDrawing) {
      setIsDrawing(false);
      if (isDrawingScratchArea) {
        draftScratchPathRef.current = [];
        setDraftScratchPath([]);
        drawDraftPath(customScratchPath);
        return;
      }

      stopScratchSound();
      updateRevealPercentage();
    }
  };

  const placedShortsCenter = getPointsCenter(customScratchPath);
  const placedShortsTop = customScratchPath.length > 0
    ? Math.min(...customScratchPath.map((point) => point.y))
    : 0.2;
  const rotateHandleY = Math.max(0.04, placedShortsTop - 0.08);

  return (
    <div 
      ref={containerRef} 
      id="scratch-card-stage"
      className="relative select-none overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-inner"
      style={{ 
        width: '100%', 
        height: `${dimensions.height}px`,
        touchAction: 'none' // Crucial to prevent standard touch-scrolling while scratching
      }}
    >
      {/* 1. Underlying Revealed Layer */}
      <div 
        id="revealed-underlay"
        className="absolute inset-0 flex items-center justify-center bg-white"
        style={{ width: '100%', height: '100%' }}
      >
        {underlayType === 'image' ? (
          imageUrl ? (
            <img 
              src={imageUrl} 
              alt="Secret Reveal Underlay" 
              className="h-full w-full transition-all duration-300"
              style={{
                pointerEvents: 'none',
                objectFit: pictureZoom < 100 ? 'contain' : 'cover',
                transform: `scale(${pictureZoom / 100})`
              }}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgLoaded(true)}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-neutral-400">
              <span className="text-sm">No image loaded</span>
            </div>
          )
        ) : (
          /* Custom Secret Text Voucher Design */
          <div 
            id="secret-voucher-card"
            className="flex h-full w-full flex-col items-center justify-center bg-radial from-amber-50 to-orange-100 p-8 text-center border-8 border-amber-200/50"
          >
            {/* Elegant Gift Voucher Decorative elements */}
            <div className="relative flex flex-col items-center justify-center max-w-sm rounded-xl border border-dashed border-orange-300 bg-white/85 px-8 py-6 shadow-md md:px-12">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold tracking-wider text-white uppercase shadow-sm">
                Surprise Coupon
              </div>
              
              <div className="text-xs font-medium tracking-widest text-neutral-400 uppercase mt-2">
                A Special Gift For You
              </div>
              
              <p className="mt-4 text-xl font-bold text-orange-950 font-sans tracking-tight break-words max-w-full">
                {secretText || 'No message entered!'}
              </p>
              
              <div className="mt-4 border-t border-dashed border-neutral-200 pt-2 w-full flex items-center justify-between text-[10px] font-mono text-neutral-400">
                <span>VOUCHER CODE: SCRT-X9</span>
                <span className="text-orange-500 font-semibold">100% VALID</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {scratchAreaShape === 'placed-shorts' && isPlacingShorts && (
        <div
          id="placed-shorts-stencil"
          className="absolute inset-0 z-20 cursor-move touch-none select-none"
          onPointerDown={(e) => handlePlacementPointerDown(e, 'move')}
          onPointerMove={handlePlacementPointerMove}
          onPointerUp={handlePlacementPointerUp}
          onPointerCancel={handlePlacementPointerUp}
        >
          {customScratchPath.length >= 3 && (
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path
                d={getEditableShortsSvgPath(customScratchPath)}
                vectorEffect="non-scaling-stroke"
                fill="rgba(245, 158, 11, 0.24)"
                stroke="rgba(245, 158, 11, 0.9)"
                strokeDasharray="7 5"
                strokeWidth="2"
              />
            </svg>
          )}
        </div>
      )}

      {scratchAreaShape === 'placed-shorts' && isPlacingShorts && customScratchPath.length >= 3 && (
        <div className="pointer-events-none absolute inset-0 z-30 touch-none select-none">
          <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line
              x1={placedShortsCenter.x * 100}
              y1={placedShortsTop * 100}
              x2={placedShortsCenter.x * 100}
              y2={rotateHandleY * 100}
              vectorEffect="non-scaling-stroke"
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeWidth="2"
            />
            <path
              d={getEditableShortsSvgPath(customScratchPath)}
              vectorEffect="non-scaling-stroke"
              fill="transparent"
              stroke="#f59e0b"
              strokeDasharray="6 5"
              strokeWidth="2"
            />
          </svg>
          <div
            className="pointer-events-auto absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border-2 border-white bg-amber-500 text-[10px] font-bold text-white shadow-md active:cursor-grabbing"
            style={{
              left: `${placedShortsCenter.x * 100}%`,
              top: `${rotateHandleY * 100}%`
            }}
            onPointerDown={(e) => handlePlacementPointerDown(e, 'rotate')}
            onPointerMove={handlePlacementPointerMove}
            onPointerUp={handlePlacementPointerUp}
            onPointerCancel={handlePlacementPointerUp}
            title="Rotate shorts"
          >
            R
          </div>
          {customScratchPath.map((point, index) => (
            <div
              key={`${index}-${point.x}-${point.y}`}
              className="pointer-events-auto absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-white bg-neutral-950 shadow-md active:cursor-grabbing"
              style={{
                left: `${point.x * 100}%`,
                top: `${point.y * 100}%`
              }}
              onPointerDown={(e) => handlePlacementPointerDown(e, 'point', index)}
              onPointerMove={handlePlacementPointerMove}
              onPointerUp={handlePlacementPointerUp}
              onPointerCancel={handlePlacementPointerUp}
              title={`Move shorts point ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* 2. Top Cover Scratching Canvas */}
      <canvas
        ref={canvasRef}
        id="scratch-cover-canvas"
        className="absolute inset-0 z-10 block cursor-crosshair touch-none select-none transition-opacity duration-500"
        style={{
          width: '100%',
          height: '100%',
          opacity: isFullyRevealed ? 0 : 1,
          pointerEvents: isFullyRevealed || isPlacingShorts ? 'none' : 'auto'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      />
    </div>
  );
}
