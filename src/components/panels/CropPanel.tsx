/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CropState } from '../../types/editor';
import {
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Check,
  X,
  Maximize2,
  Crop as CropIcon,
} from 'lucide-react';

interface CropPanelProps {
  cropState: CropState;
  imageWidth: number;
  imageHeight: number;
  onChangeCrop: (crop: Partial<CropState>) => void;
  onApplyCrop: () => void;
  onCancelCrop: () => void;
  onRotate90: (direction: 'cw' | 'ccw') => void;
}

const ASPECT_RATIOS = [
  { label: 'Free', value: null },
  { label: '1:1 Square', value: 1 },
  { label: '16:9 Cinema', value: 16 / 9 },
  { label: '4:3 Standard', value: 4 / 3 },
  { label: '9:16 Story', value: 9 / 16 },
  { label: '3:2 Photo', value: 3 / 2 },
  { label: '2:3 Portrait', value: 2 / 3 },
];

export const CropPanel: React.FC<CropPanelProps> = ({
  cropState,
  imageWidth,
  imageHeight,
  onChangeCrop,
  onApplyCrop,
  onCancelCrop,
  onRotate90,
}) => {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-6 text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Crop & Transform</h3>
          <p className="text-[11px] text-slate-400">Aspect ratios, straighten, rotate & flip</p>
        </div>
      </div>

      {/* Aspect Ratio Presets */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Aspect Ratio</span>
        <div className="grid grid-cols-2 gap-2">
          {ASPECT_RATIOS.map((aspect) => {
            const isSelected = cropState.aspectRatio === aspect.value;
            return (
              <button
                key={aspect.label}
                type="button"
                onClick={() => {
                  onChangeCrop({ aspectRatio: aspect.value });
                }}
                className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all text-left ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-semibold shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                {aspect.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rotation & Flip Controls */}
      <div className="space-y-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Orientation & Flip</span>
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => onRotate90('ccw')}
            className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Rotate 90° Counter-Clockwise"
          >
            <RotateCcw className="w-4 h-4 mb-1" />
            <span className="text-[10px]">-90°</span>
          </button>
          <button
            type="button"
            onClick={() => onRotate90('cw')}
            className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Rotate 90° Clockwise"
          >
            <RotateCw className="w-4 h-4 mb-1" />
            <span className="text-[10px]">+90°</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeCrop({ flipHorizontal: !cropState.flipHorizontal })}
            className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-colors ${
              cropState.flipHorizontal
                ? 'bg-blue-900/30 border-blue-500 text-blue-300'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300'
            }`}
            title="Flip Horizontal"
          >
            <FlipHorizontal className="w-4 h-4 mb-1" />
            <span className="text-[10px]">Flip H</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeCrop({ flipVertical: !cropState.flipVertical })}
            className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-colors ${
              cropState.flipVertical
                ? 'bg-blue-900/30 border-blue-500 text-blue-300'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300'
            }`}
            title="Flip Vertical"
          >
            <FlipVertical className="w-4 h-4 mb-1" />
            <span className="text-[10px]">Flip V</span>
          </button>
        </div>
      </div>

      {/* Straighten / Arbitrary Rotation Slider */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium">Straighten Angle</span>
          <button
            type="button"
            onClick={() => onChangeCrop({ rotation: 0 })}
            className="font-mono tabular-nums text-slate-400 hover:text-blue-400 text-[11px]"
          >
            {cropState.rotation > 0 ? `+${cropState.rotation}°` : `${cropState.rotation}°`}
          </button>
        </div>
        <input
          type="range"
          min={-45}
          max={45}
          step={0.5}
          value={cropState.rotation}
          onChange={(e) => onChangeCrop({ rotation: parseFloat(e.target.value) })}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 px-1">
          <span>-45°</span>
          <span>0°</span>
          <span>+45°</span>
        </div>
      </div>

      {/* Commit Actions */}
      <div className="pt-2 flex flex-col gap-2">
        <button
          type="button"
          onClick={onApplyCrop}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg transition-colors shadow-sm"
        >
          <Check className="w-4 h-4" />
          <span>Apply Crop & Transform</span>
        </button>
        <button
          type="button"
          onClick={onCancelCrop}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors border border-slate-700/60"
        >
          <X className="w-3.5 h-3.5" />
          <span>Cancel Crop</span>
        </button>
      </div>
    </div>
  );
};
