/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Layer,
  ImageLayer,
  TextLayer,
  ShapeLayer,
  BorderSettings,
  ExportOptions,
} from '../../types/editor';
import { processImageData } from '../../utils/imageProcessing';
import { Download, X, Check, Image as ImageIcon, Sparkles } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  layers: Layer[];
  canvasWidth: number;
  canvasHeight: number;
  borders: BorderSettings;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  layers,
  canvasWidth,
  canvasHeight,
  borders,
}) => {
  const [format, setFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');
  const [quality, setQuality] = useState<number>(0.92);
  const [scale, setScale] = useState<number>(1);
  const [customWidth, setCustomWidth] = useState<number>(canvasWidth);
  const [customHeight, setCustomHeight] = useState<number>(canvasHeight);
  const [lockAspect, setLockAspect] = useState<boolean>(true);
  const [fileName, setFileName] = useState<string>('edited-photo');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [estimatedSize, setEstimatedSize] = useState<string>('Calculating...');

  // Update dimensions when scale changes
  useEffect(() => {
    setCustomWidth(Math.round(canvasWidth * scale));
    setCustomHeight(Math.round(canvasHeight * scale));
  }, [scale, canvasWidth, canvasHeight]);

  // Rough estimation of output file size
  useEffect(() => {
    const totalPixels = customWidth * customHeight;
    let bytes = totalPixels * 4;
    if (format === 'image/jpeg') {
      bytes = totalPixels * 0.25 * quality;
    } else if (format === 'image/webp') {
      bytes = totalPixels * 0.18 * quality;
    } else {
      bytes = totalPixels * 0.6; // PNG compression
    }
    const kb = Math.round(bytes / 1024);
    if (kb > 1024) {
      setEstimatedSize(`~${(kb / 1024).toFixed(1)} MB`);
    } else {
      setEstimatedSize(`~${kb} KB`);
    }
  }, [customWidth, customHeight, format, quality]);

  if (!isOpen) return null;

  const handleWidthChange = (w: number) => {
    setCustomWidth(w);
    if (lockAspect && canvasWidth > 0) {
      setCustomHeight(Math.round(w * (canvasHeight / canvasWidth)));
    }
  };

  const handleHeightChange = (h: number) => {
    setCustomHeight(h);
    if (lockAspect && canvasHeight > 0) {
      setCustomWidth(Math.round(h * (canvasWidth / canvasHeight)));
    }
  };

  const handleExecuteExport = async () => {
    setIsExporting(true);

    try {
      // Offscreen high-resolution rendering canvas
      const offscreen = document.createElement('canvas');
      offscreen.width = customWidth;
      offscreen.height = customHeight;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return;

      const scaleX = customWidth / canvasWidth;
      const scaleY = customHeight / canvasHeight;

      ctx.scale(scaleX, scaleY);

      // Render layers
      for (const layer of layers) {
        if (!layer.visible) continue;

        ctx.save();
        ctx.globalAlpha = layer.opacity;
        ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;

        ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
        if (layer.rotation) {
          ctx.rotate((layer.rotation * Math.PI) / 180);
        }
        ctx.translate(-layer.width / 2, -layer.height / 2);

        if (layer.type === 'image') {
          const imgLayer = layer as ImageLayer;
          if (imgLayer.imgElement && imgLayer.imgElement.complete) {
            // Full resolution image processing pass
            const layerCanvas = document.createElement('canvas');
            layerCanvas.width = imgLayer.naturalWidth;
            layerCanvas.height = imgLayer.naturalHeight;
            const layerCtx = layerCanvas.getContext('2d');
            if (layerCtx) {
              layerCtx.drawImage(imgLayer.imgElement, 0, 0);
              const imgData = layerCtx.getImageData(0, 0, layerCanvas.width, layerCanvas.height);
              const processed = processImageData(
                imgData,
                imgLayer.adjustments,
                imgLayer.curves,
                imgLayer.filterId,
                imgLayer.filterIntensity,
                imgLayer.cutout
              );
              layerCtx.putImageData(processed, 0, 0);
              ctx.drawImage(layerCanvas, 0, 0, layer.width, layer.height);
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

            if (textLayer.backgroundColor) {
              ctx.fillStyle = textLayer.backgroundColor;
              ctx.fillRect(textX - 8, lineY - 4, textMetrics.width + 16, lineHeight + 8);
            }

            if (textLayer.strokeColor && textLayer.strokeWidth) {
              ctx.strokeStyle = textLayer.strokeColor;
              ctx.lineWidth = textLayer.strokeWidth;
              ctx.strokeText(line, textX, lineY);
            }

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
            if (r > 0) ctx.roundRect(0, 0, w, h, r);
            else ctx.rect(0, 0, w, h);
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

      // Outer Borders
      if (borders.type === 'solid') {
        ctx.strokeStyle = borders.color;
        ctx.lineWidth = borders.width * 2;
        ctx.strokeRect(0, 0, canvasWidth, canvasHeight);
      } else if (borders.type === 'polaroid') {
        const pad = borders.width;
        const bottomPad = borders.width * 3.5;
        ctx.fillStyle = borders.color || '#ffffff';
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

        ctx.fillStyle = '#ffffff';
        const holeW = 14;
        const holeH = 10;
        for (let x = pad + 10; x < canvasWidth - pad - 10; x += 32) {
          ctx.fillRect(x, (pad - holeH) / 2, holeW, holeH);
          ctx.fillRect(x, canvasHeight - pad + (pad - holeH) / 2, holeW, holeH);
        }
      }

      // Convert to Blob and trigger direct browser download
      offscreen.toBlob(
        (blob) => {
          if (!blob) {
            setIsExporting(false);
            return;
          }
          const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${fileName || 'photo'}.${ext}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setIsExporting(false);
          onClose();
        },
        format,
        quality
      );
    } catch (err) {
      console.error('Export failed:', err);
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#12161c] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Export Image</h2>
            <p className="text-xs text-slate-400">Save full resolution artwork directly to your device</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* File Name */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-300">File Name</span>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Filename"
            />
          </div>

          {/* Format Selector */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-300">Image Format</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormat('image/png')}
                className={`p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                  format === 'image/png'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                PNG
                <span className="block text-[10px] font-normal text-slate-400">Lossless & Alpha</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('image/jpeg')}
                className={`p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                  format === 'image/jpeg'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                JPEG
                <span className="block text-[10px] font-normal text-slate-400">Standard Photo</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('image/webp')}
                className={`p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                  format === 'image/webp'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                WebP
                <span className="block text-[10px] font-normal text-slate-400">Compact & Modern</span>
              </button>
            </div>
          </div>

          {/* Quality Slider (for JPEG / WebP) */}
          {format !== 'image/png' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Export Quality</span>
                <span className="font-mono tabular-nums text-slate-400 text-[11px]">{Math.round(quality * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={1.0}
                step={0.02}
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}

          {/* Scale Multiplier */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-300">Resolution Scale</span>
            <div className="grid grid-cols-4 gap-2">
              {[0.5, 1, 2, 3].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScale(s)}
                  className={`py-2 rounded-lg border text-xs font-mono transition-all ${
                    scale === s
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-semibold'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {s}x {s === 1 ? '(100%)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Width & Height */}
          <div className="grid grid-cols-2 gap-3 bg-slate-900/60 border border-slate-800 rounded-lg p-3">
            <div className="space-y-1">
              <span className="text-xs text-slate-400">Width (px)</span>
              <input
                type="number"
                min={100}
                max={10000}
                value={customWidth}
                onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 100)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs font-mono text-white"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400">Height (px)</span>
              <input
                type="number"
                min={100}
                max={10000}
                value={customHeight}
                onChange={(e) => handleHeightChange(parseInt(e.target.value, 10) || 100)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs font-mono text-white"
              />
            </div>
          </div>

          {/* Estimated File Size badge */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>Estimated File Size:</span>
            <span className="font-mono text-slate-200 font-medium">{estimatedSize}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExecuteExport}
            className="flex items-center gap-2 px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exporting...' : 'Download Image'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
