/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Scaling, Lock, Unlock } from 'lucide-react';

interface ResizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWidth: number;
  currentHeight: number;
  onApplyResize: (newWidth: number, newHeight: number) => void;
}

export const ResizeModal: React.FC<ResizeModalProps> = ({
  isOpen,
  onClose,
  currentWidth,
  currentHeight,
  onApplyResize,
}) => {
  const [width, setWidth] = useState<number>(currentWidth);
  const [height, setHeight] = useState<number>(currentHeight);
  const [lockAspect, setLockAspect] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (lockAspect && currentWidth > 0) {
      setHeight(Math.round(val * (currentHeight / currentWidth)));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (lockAspect && currentHeight > 0) {
      setWidth(Math.round(val * (currentWidth / currentHeight)));
    }
  };

  const handlePreset = (w: number, h: number) => {
    setWidth(w);
    setHeight(h);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#12161c] border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col text-slate-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Scaling className="w-4 h-4 text-blue-400" />
            <h2 className="text-base font-bold text-white">Resize Canvas</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="space-y-1">
              <span className="text-xs text-slate-400">Width (px)</span>
              <input
                type="number"
                min={64}
                max={12000}
                value={width}
                onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 64)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400">Height (px)</span>
              <input
                type="number"
                min={64}
                max={12000}
                value={height}
                onChange={(e) => handleHeightChange(parseInt(e.target.value, 10) || 64)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-900/50 border border-slate-800 rounded-lg text-xs">
            <span className="text-slate-300">Lock Aspect Ratio</span>
            <button
              type="button"
              onClick={() => setLockAspect(!lockAspect)}
              className="p-1 text-slate-400 hover:text-white"
            >
              {lockAspect ? <Lock className="w-4 h-4 text-blue-400" /> : <Unlock className="w-4 h-4" />}
            </button>
          </div>

          {/* Quick presets */}
          <div className="space-y-1.5">
            <span className="text-xs text-slate-400">Standard Sizes</span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handlePreset(1920, 1080)}
                className="py-1.5 px-2 bg-slate-900 border border-slate-800 rounded text-[11px] text-slate-300 hover:bg-slate-800"
              >
                1080p FHD
              </button>
              <button
                type="button"
                onClick={() => handlePreset(1080, 1080)}
                className="py-1.5 px-2 bg-slate-900 border border-slate-800 rounded text-[11px] text-slate-300 hover:bg-slate-800"
              >
                1:1 Square
              </button>
              <button
                type="button"
                onClick={() => handlePreset(1080, 1920)}
                className="py-1.5 px-2 bg-slate-900 border border-slate-800 rounded text-[11px] text-slate-300 hover:bg-slate-800"
              >
                9:16 Story
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onApplyResize(width, height);
              onClose();
            }}
            className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            Apply Resize
          </button>
        </div>
      </div>
    </div>
  );
};
