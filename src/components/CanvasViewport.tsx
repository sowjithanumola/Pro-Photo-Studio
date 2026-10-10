/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Layer,
  ImageLayer,
  TextLayer,
  ShapeLayer,
  AdjustmentSettings,
  CurveSettings,
  CutoutSettings,
  BorderSettings,
  CropState,
  ActiveTool,
} from '../types/editor';
import { processImageData } from '../utils/imageProcessing';

interface CanvasViewportProps {
  layers: Layer[];
  selectedLayerId: string | null;
  activeTool: ActiveTool;
  canvasWidth: number;
  canvasHeight: number;
  borders: BorderSettings;
  cropState: CropState;
  zoom: number;
  panOffset: { x: number; y: number };
  isComparing: boolean;
  isSamplingColor: boolean;
  onUpdateCrop: (crop: Partial<CropState>) => void;
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
  onSelectLayer: (id: string | null) => void;
  onPanChange: (offset: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onColorSampled: (hex: string) => void;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  layers,
  selectedLayerId,
  activeTool,
  canvasWidth,
  canvasHeight,
  borders,
  cropState,
  zoom,
  panOffset,
  isComparing,
  isSamplingColor,
  onUpdateCrop,
  onUpdateLayer,
  onSelectLayer,
  onPanChange,
  onZoomChange,
  onColorSampled,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beforeCanvasRef = useRef<HTMLCanvasElement>(null);

  // Split-screen comparison slider position (0.0 to 1.0)
  const [splitPosition, setSplitPosition] = useState<number>(0.5);
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);

  // Pan interaction state
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Crop interaction state
  const [activeCropHandle, setActiveCropHandle] = useState<string | null>(null);
  const cropStartRef = useRef<{ mouseX: number; mouseY: number; rect: CropState['rect'] }>({
    mouseX: 0,
    mouseY: 0,
    rect: { x: 0, y: 0, width: 0, height: 0 },
  });

  // Layer drag / transform state
  const [isDraggingLayer, setIsDraggingLayer] = useState<boolean>(false);
  const layerDragStartRef = useRef<{ mouseX: number; mouseY: number; layerX: number; layerY: number }>({
    mouseX: 0,
    mouseY: 0,
    layerX: 0,
    layerY: 0,
  });

  // Cache offscreen processed canvases for speed
  const processedImageCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());

  // Render main canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Save state
    ctx.save();

    // 1. Render all layers bottom to top
    for (const layer of layers) {
      if (!layer.visible) continue;

      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;

      // Apply layer position & rotation
      ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
      if (layer.rotation) {
        ctx.rotate((layer.rotation * Math.PI) / 180);
      }
      ctx.translate(-layer.width / 2, -layer.height / 2);

      if (layer.type === 'image') {
        const imgLayer = layer as ImageLayer;
        if (imgLayer.imgElement && imgLayer.imgElement.complete) {
          // Offscreen processed render
          let offscreen = processedImageCacheRef.current.get(imgLayer.id);
          if (!offscreen) {
            offscreen = document.createElement('canvas');
            offscreen.width = imgLayer.naturalWidth;
            offscreen.height = imgLayer.naturalHeight;
            const offCtx = offscreen.getContext('2d');
            if (offCtx) {
              offCtx.drawImage(imgLayer.imgElement, 0, 0);
              const imgData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
              const processed = processImageData(
                imgData,
                imgLayer.adjustments,
                imgLayer.curves,
                imgLayer.filterId,
                imgLayer.filterIntensity,
                imgLayer.cutout
              );
              offCtx.putImageData(processed, 0, 0);
              processedImageCacheRef.current.set(imgLayer.id, offscreen);
            }
          }

          if (offscreen) {
            ctx.drawImage(offscreen, 0, 0, layer.width, layer.height);
          } else {
            ctx.drawImage(imgLayer.imgElement, 0, 0, layer.width, layer.height);
          }
        }
      } else if (layer.type === 'text') {
        const textLayer = layer as TextLayer;
        ctx.font = `${textLayer.fontWeight} ${textLayer.fontSize}px ${textLayer.fontFamily}`;
        ctx.textBaseline = 'top';

        const lines = textLayer.text.split('\n');
        const lineHeight = textLayer.fontSize * 1.25;

        lines.forEach((line, i) => {
          const lineY = i * lineHeight;
          const textMetrics = ctx.measureText(line);
          let textX = 0;
          if (textLayer.textAlign === 'center') {
            textX = (layer.width - textMetrics.width) / 2;
          } else if (textLayer.textAlign === 'right') {
            textX = layer.width - textMetrics.width;
          }

          // Background badge
          if (textLayer.backgroundColor) {
            ctx.fillStyle = textLayer.backgroundColor;
            ctx.fillRect(textX - 8, lineY - 4, textMetrics.width + 16, lineHeight + 8);
          }

          // Stroke
          if (textLayer.strokeColor && textLayer.strokeWidth) {
            ctx.strokeStyle = textLayer.strokeColor;
            ctx.lineWidth = textLayer.strokeWidth;
            ctx.strokeText(line, textX, lineY);
          }

          // Fill
          ctx.fillStyle = textLayer.color;
          ctx.fillText(line, textX, lineY);
        });
      } else if (layer.type === 'shape') {
        const shapeLayer = layer as ShapeLayer;
        ctx.fillStyle = shapeLayer.fillColor;
        ctx.strokeStyle = shapeLayer.strokeColor;
        ctx.lineWidth = shapeLayer.strokeWidth;

        const w = shapeLayer.width;
        const h = shapeLayer.height;

        ctx.beginPath();
        if (shapeLayer.shapeType === 'rectangle') {
          const r = Math.min(shapeLayer.cornerRadius || 0, w / 2, h / 2);
          if (r > 0) {
            ctx.roundRect(0, 0, w, h, r);
          } else {
            ctx.rect(0, 0, w, h);
          }
        } else if (shapeLayer.shapeType === 'circle') {
          ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        } else if (shapeLayer.shapeType === 'star') {
          const cx = w / 2;
          const cy = h / 2;
          const outerR = Math.min(w, h) / 2;
          const innerR = outerR * 0.45;
          for (let p = 0; p < 10; p++) {
            const rad = (p * Math.PI) / 5 - Math.PI / 2;
            const r = p % 2 === 0 ? outerR : innerR;
            const px = cx + r * Math.cos(rad);
            const py = cy + r * Math.sin(rad);
            if (p === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
        } else if (shapeLayer.shapeType === 'arrow') {
          ctx.moveTo(0, h * 0.35);
          ctx.lineTo(w * 0.6, h * 0.35);
          ctx.lineTo(w * 0.6, 0);
          ctx.lineTo(w, h * 0.5);
          ctx.lineTo(w * 0.6, h);
          ctx.lineTo(w * 0.6, h * 0.65);
          ctx.lineTo(0, h * 0.65);
          ctx.closePath();
        } else if (shapeLayer.shapeType === 'heart') {
          const topCurveHeight = h * 0.3;
          ctx.moveTo(w / 2, h / 5);
          ctx.bezierCurveTo(w / 2, 0, 0, 0, 0, topCurveHeight);
          ctx.bezierCurveTo(0, (h + topCurveHeight) / 2, w / 2, (h + topCurveHeight) / 2, w / 2, h);
          ctx.bezierCurveTo(w / 2, (h + topCurveHeight) / 2, w, (h + topCurveHeight) / 2, w, topCurveHeight);
          ctx.bezierCurveTo(w, 0, w / 2, 0, w / 2, h / 5);
          ctx.closePath();
        } else if (shapeLayer.shapeType === 'badge') {
          ctx.moveTo(w / 2, 0);
          ctx.lineTo(w, h * 0.25);
          ctx.lineTo(w, h * 0.75);
          ctx.lineTo(w / 2, h);
          ctx.lineTo(0, h * 0.75);
          ctx.lineTo(0, h * 0.25);
          ctx.closePath();
        }

        if (shapeLayer.fillColor !== 'transparent') ctx.fill();
        if (shapeLayer.strokeWidth > 0) ctx.stroke();
      }

      ctx.restore();
    }

    // 2. Render Outer Borders / Frames
    if (borders.type === 'solid') {
      ctx.strokeStyle = borders.color;
      ctx.lineWidth = borders.width * 2;
      ctx.strokeRect(0, 0, canvasWidth, canvasHeight);
    } else if (borders.type === 'polaroid') {
      const pad = borders.width;
      const bottomPad = borders.width * 3.5;
      ctx.fillStyle = borders.color || '#ffffff';
      // Draw 4 frame borders
      ctx.fillRect(0, 0, canvasWidth, pad);
      ctx.fillRect(0, canvasHeight - bottomPad, canvasWidth, bottomPad);
      ctx.fillRect(0, 0, pad, canvasHeight);
      ctx.fillRect(canvasWidth - pad, 0, pad, canvasHeight);

      if (borders.polaroidCaption) {
        ctx.fillStyle = '#1e293b';
        ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(borders.polaroidCaption, canvasWidth / 2, canvasHeight - bottomPad / 2 + 8);
      }
    } else if (borders.type === 'film') {
      const pad = borders.width;
      ctx.fillStyle = '#090b0e';
      ctx.fillRect(0, 0, canvasWidth, pad);
      ctx.fillRect(0, canvasHeight - pad, canvasWidth, pad);
      ctx.fillRect(0, 0, pad, canvasHeight);
      ctx.fillRect(canvasWidth - pad, 0, pad, canvasHeight);

      // Sprocket holes along top and bottom
      ctx.fillStyle = '#ffffff';
      const holeW = 14;
      const holeH = 10;
      for (let x = pad + 10; x < canvasWidth - pad - 10; x += 32) {
        ctx.fillRect(x, (pad - holeH) / 2, holeW, holeH);
        ctx.fillRect(x, canvasHeight - pad + (pad - holeH) / 2, holeW, holeH);
      }
    }

    ctx.restore();
  }, [layers, canvasWidth, canvasHeight, borders]);

  // Invalidate cache when layer adjustments or filters change
  useEffect(() => {
    processedImageCacheRef.current.clear();
    renderCanvas();
  }, [layers, renderCanvas]);

  // Render raw "Before" canvas for comparison slider
  useEffect(() => {
    if (!isComparing) return;
    const bCanvas = beforeCanvasRef.current;
    if (!bCanvas) return;
    const bCtx = bCanvas.getContext('2d');
    if (!bCtx) return;

    bCanvas.width = canvasWidth;
    bCanvas.height = canvasHeight;
    bCtx.clearRect(0, 0, canvasWidth, canvasHeight);

    const baseImage = layers.find((l) => l.type === 'image') as ImageLayer | undefined;
    if (baseImage && baseImage.imgElement) {
      bCtx.drawImage(baseImage.imgElement, 0, 0, canvasWidth, canvasHeight);
    }
  }, [isComparing, layers, canvasWidth, canvasHeight]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.1, Math.min(8.0, zoom * zoomFactor));
    onZoomChange(newZoom);
  };

  // Canvas Mouse Down
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.altKey || activeTool === 'select' && e.shiftKey) {
      // Pan mode
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      return;
    }

    // Color eyedropper sample
    if (isSamplingColor) {
      sampleColorAtPoint(e.clientX, e.clientY);
      return;
    }

    // If clicking on active layer to drag/move
    const selectedLayer = layers.find((l) => l.id === selectedLayerId);
    if (selectedLayer && !selectedLayer.locked && activeTool === 'select') {
      const canvasCoord = clientToCanvasCoord(e.clientX, e.clientY);
      if (
        canvasCoord.x >= selectedLayer.x &&
        canvasCoord.x <= selectedLayer.x + selectedLayer.width &&
        canvasCoord.y >= selectedLayer.y &&
        canvasCoord.y <= selectedLayer.y + selectedLayer.height
      ) {
        setIsDraggingLayer(true);
        layerDragStartRef.current = {
          mouseX: canvasCoord.x,
          mouseY: canvasCoord.y,
          layerX: selectedLayer.x,
          layerY: selectedLayer.y,
        };
        return;
      }
    }

    // Start background pan if nothing else
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  // Convert client viewport pixels to Canvas coordinate space
  const clientToCanvasCoord = (clientX: number, clientY: number): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Eyedropper sample color at client position
  const sampleColorAtPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coord = clientToCanvasCoord(clientX, clientY);
    const px = Math.floor(Math.max(0, Math.min(canvasWidth - 1, coord.x)));
    const py = Math.floor(Math.max(0, Math.min(canvasHeight - 1, coord.y)));
    const pixel = ctx.getImageData(px, py, 1, 1).data;
    const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
    onColorSampled(hex);
  };

  // Global mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        onPanChange({
          x: e.clientX - panStartRef.current.x,
          y: e.clientY - panStartRef.current.y,
        });
      } else if (isDraggingSplit && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const pos = Math.max(0.02, Math.min(0.98, (e.clientX - rect.left) / rect.width));
        setSplitPosition(pos);
      } else if (isDraggingLayer && selectedLayerId) {
        const coord = clientToCanvasCoord(e.clientX, e.clientY);
        const dx = coord.x - layerDragStartRef.current.mouseX;
        const dy = coord.y - layerDragStartRef.current.mouseY;
        onUpdateLayer(selectedLayerId, {
          x: Math.round(layerDragStartRef.current.layerX + dx),
          y: Math.round(layerDragStartRef.current.layerY + dy),
        });
      } else if (activeCropHandle && cropState.isActive) {
        handleCropDrag(e);
      }
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      setIsDraggingSplit(false);
      setIsDraggingLayer(false);
      setActiveCropHandle(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isPanning,
    isDraggingSplit,
    isDraggingLayer,
    activeCropHandle,
    cropState,
    selectedLayerId,
    onPanChange,
    onUpdateLayer,
  ]);

  // Interactive crop box drag handles
  const handleCropHandleMouseDown = (handle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCropHandle(handle);
    const coord = clientToCanvasCoord(e.clientX, e.clientY);
    cropStartRef.current = {
      mouseX: coord.x,
      mouseY: coord.y,
      rect: { ...cropState.rect },
    };
  };

  const handleCropDrag = (e: MouseEvent) => {
    const coord = clientToCanvasCoord(e.clientX, e.clientY);
    const dx = coord.x - cropStartRef.current.mouseX;
    const dy = coord.y - cropStartRef.current.mouseY;
    const start = cropStartRef.current.rect;

    let newX = start.x;
    let newY = start.y;
    let newW = start.width;
    let newH = start.height;

    if (activeCropHandle === 'move') {
      newX = Math.max(0, Math.min(canvasWidth - newW, start.x + dx));
      newY = Math.max(0, Math.min(canvasHeight - newH, start.y + dy));
    } else {
      if (activeCropHandle?.includes('e')) newW = Math.max(40, start.width + dx);
      if (activeCropHandle?.includes('s')) newH = Math.max(40, start.height + dy);
      if (activeCropHandle?.includes('w')) {
        const potentialW = start.width - dx;
        if (potentialW >= 40) {
          newX = start.x + dx;
          newW = potentialW;
        }
      }
      if (activeCropHandle?.includes('n')) {
        const potentialH = start.height - dy;
        if (potentialH >= 40) {
          newY = start.y + dy;
          newH = potentialH;
        }
      }

      // Enforce aspect ratio if active
      if (cropState.aspectRatio) {
        if (activeCropHandle?.includes('e') || activeCropHandle?.includes('w')) {
          newH = newW / cropState.aspectRatio;
        } else {
          newW = newH * cropState.aspectRatio;
        }
      }
    }

    onUpdateCrop({
      rect: {
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(Math.min(canvasWidth - newX, newW)),
        height: Math.round(Math.min(canvasHeight - newY, newH)),
      },
    });
  };

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      className={`relative flex-1 w-full h-full overflow-hidden bg-[#0a0c10] flex items-center justify-center select-none ${
        isSamplingColor
          ? 'cursor-crosshair'
          : isPanning
          ? 'cursor-grabbing'
          : activeTool === 'select'
          ? 'cursor-default'
          : 'cursor-grab'
      }`}
    >
      {/* Canvas Wrapper centered with pan/zoom transform */}
      <div
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          width: canvasWidth,
          height: canvasHeight,
        }}
        className="relative transition-transform duration-75 ease-out shadow-2xl"
      >
        {/* Transparent checkerboard background */}
        <div className="absolute inset-0 canvas-checkerboard rounded-sm" />

        {/* Main Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 block w-full h-full"
        />

        {/* Before / After Split Slider */}
        {isComparing && (
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ width: `${splitPosition * 100}%` }}
          >
            <canvas
              ref={beforeCanvasRef}
              className="absolute inset-0 block w-full h-full"
              style={{ width: canvasWidth, height: canvasHeight }}
            />
          </div>
        )}

        {/* Before / After Split Handle */}
        {isComparing && (
          <div
            style={{ left: `${splitPosition * 100}%` }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsDraggingSplit(true);
            }}
            className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize z-30 shadow-[0_0_8px_rgba(0,0,0,0.8)] pointer-events-auto"
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white text-slate-900 flex items-center justify-center text-[10px] font-bold shadow-md">
              ↔
            </div>
            {/* Badges */}
            <span className="absolute top-4 right-3 px-2 py-0.5 bg-black/75 text-white text-[10px] font-mono rounded tracking-wider">
              BEFORE
            </span>
            <span className="absolute top-4 left-3 px-2 py-0.5 bg-blue-600/90 text-white text-[10px] font-mono rounded tracking-wider">
              AFTER
            </span>
          </div>
        )}

        {/* Interactive Transform Bounding Box for Selected Layer */}
        {selectedLayer && selectedLayer.visible && !selectedLayer.locked && activeTool === 'select' && (
          <div
            style={{
              left: selectedLayer.x,
              top: selectedLayer.y,
              width: selectedLayer.width,
              height: selectedLayer.height,
              transform: selectedLayer.rotation ? `rotate(${selectedLayer.rotation}deg)` : undefined,
            }}
            className="absolute border border-blue-500 pointer-events-auto cursor-move z-20 group"
          >
            {/* Corner Resize Handles */}
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-600 rounded-sm cursor-nwse-resize" />
            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-600 rounded-sm cursor-nesw-resize" />
            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-600 rounded-sm cursor-nesw-resize" />
            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-600 rounded-sm cursor-nwse-resize" />
          </div>
        )}

        {/* Interactive Crop Overlay */}
        {activeTool === 'crop' && (
          <div className="absolute inset-0 z-30 pointer-events-auto">
            {/* Dimmed backdrop around crop area */}
            <div
              style={{
                top: 0,
                left: 0,
                right: 0,
                height: cropState.rect.y,
              }}
              className="absolute bg-black/65"
            />
            <div
              style={{
                top: cropState.rect.y + cropState.rect.height,
                left: 0,
                right: 0,
                bottom: 0,
              }}
              className="absolute bg-black/65"
            />
            <div
              style={{
                top: cropState.rect.y,
                left: 0,
                width: cropState.rect.x,
                height: cropState.rect.height,
              }}
              className="absolute bg-black/65"
            />
            <div
              style={{
                top: cropState.rect.y,
                left: cropState.rect.x + cropState.rect.width,
                right: 0,
                height: cropState.rect.height,
              }}
              className="absolute bg-black/65"
            />

            {/* Crop Rectangle Box */}
            <div
              style={{
                left: cropState.rect.x,
                top: cropState.rect.y,
                width: cropState.rect.width,
                height: cropState.rect.height,
              }}
              onMouseDown={(e) => handleCropHandleMouseDown('move', e)}
              className="absolute border border-white cursor-move shadow-2xl"
            >
              {/* Rule of Thirds Grid Lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                <div className="border-r border-b border-white/60" />
                <div className="border-r border-b border-white/60" />
                <div className="border-b border-white/60" />
                <div className="border-r border-b border-white/60" />
                <div className="border-r border-b border-white/60" />
                <div className="border-b border-white/60" />
                <div className="border-r border-white/60" />
                <div className="border-r border-white/60" />
                <div />
              </div>

              {/* 8 Drag Handles */}
              <div
                onMouseDown={(e) => handleCropHandleMouseDown('nw', e)}
                className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-slate-900 rounded-sm cursor-nwse-resize shadow"
              />
              <div
                onMouseDown={(e) => handleCropHandleMouseDown('n', e)}
                className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-slate-900 rounded-sm cursor-ns-resize shadow"
              />
              <div
                onMouseDown={(e) => handleCropHandleMouseDown('ne', e)}
                className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-slate-900 rounded-sm cursor-nesw-resize shadow"
              />
              <div
                onMouseDown={(e) => handleCropHandleMouseDown('e', e)}
                className="absolute top-1/2 -translate-y-1/2 -right-2 w-4 h-4 bg-white border-2 border-slate-900 rounded-sm cursor-ew-resize shadow"
              />
              <div
                onMouseDown={(e) => handleCropHandleMouseDown('se', e)}
                className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-slate-900 rounded-sm cursor-nwse-resize shadow"
              />
              <div
                onMouseDown={(e) => handleCropHandleMouseDown('s', e)}
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-slate-900 rounded-sm cursor-ns-resize shadow"
              />
              <div
                onMouseDown={(e) => handleCropHandleMouseDown('sw', e)}
                className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-slate-900 rounded-sm cursor-nesw-resize shadow"
              />
              <div
                onMouseDown={(e) => handleCropHandleMouseDown('w', e)}
                className="absolute top-1/2 -translate-y-1/2 -left-2 w-4 h-4 bg-white border-2 border-slate-900 rounded-sm cursor-ew-resize shadow"
              />
            </div>
          </div>
        )}
      </div>

      {/* Floating Info Pill at bottom left */}
      <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-md border border-slate-800 text-slate-400 text-xs px-3 py-1.5 rounded-lg flex items-center gap-3 pointer-events-none select-none">
        <span className="font-mono tabular-nums text-slate-300">
          {canvasWidth} × {canvasHeight} px
        </span>
        <span className="text-slate-600">·</span>
        <span className="font-mono tabular-nums text-slate-300">{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
};
