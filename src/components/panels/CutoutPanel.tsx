/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CutoutSettings } from '../../types/editor';
import { Wand2, Pipette, Eye, RefreshCw } from 'lucide-react';

interface CutoutPanelProps {
  cutout: CutoutSettings;
  onChange: (cutout: CutoutSettings) => void;
  onSampleColorMode: () => void;
  isSamplingColor: boolean;
}

const COMMON_KEYS = [
  { label: 'Green Screen', color: '#00ff00' },
  { label: 'Blue Screen', color: '#0000ff' },
  { label: 'Pure White', color: '#ffffff' },
  { label: 'Dark Charcoal', color: '#111827' },
  { label: 'Studio Grey', color: '#808080' },
];

export const CutoutPanel: React.FC<CutoutPanelProps> = ({
  cutout,
  onChange,
  onSampleColorMode,
  isSamplingColor,
}) => {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-6 text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Smart Color Cutout</h3>
          <p className="text-[11px] text-slate-400">100% browser-local chroma & range keying</p>
        </div>
      </div>

      {/* Enable Toggle */}
      <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg">
        <div className="flex items-center gap-2.5">
          <Wand2 className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-medium text-slate-200">Enable Background Cutout</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={cutout.enabled}
            onChange={(e) => onChange({ ...cutout, enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {cutout.enabled && (
        <>
          {/* Target Color Picker */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Key Color</span>
            <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-lg p-3">
              <input
                type="color"
                value={cutout.targetColor}
                onChange={(e) => onChange({ ...cutout, targetColor: e.target.value })}
                className="w-9 h-9 rounded cursor-pointer border border-slate-700 bg-transparent p-0.5"
              />
              <div className="flex-1">
                <span className="text-xs font-mono uppercase text-slate-300">{cutout.targetColor}</span>
                <p className="text-[10px] text-slate-400">Color to eliminate</p>
              </div>
              <button
                type="button"
                onClick={onSampleColorMode}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border transition-all ${
                  isSamplingColor
                    ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-500/50'
                    : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                }`}
                title="Click anywhere on canvas to pick background color"
              >
                <Pipette className="w-3.5 h-3.5" />
                <span>{isSamplingColor ? 'Click Canvas...' : 'Eyedropper'}</span>
              </button>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {COMMON_KEYS.map((key) => (
                <button
                  key={key.label}
                  type="button"
                  onClick={() => onChange({ ...cutout, targetColor: key.color })}
                  className="flex items-center gap-2 p-2 rounded-md bg-slate-900/40 hover:bg-slate-800 border border-slate-800/80 text-xs text-slate-300 transition-colors"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: key.color }}
                  />
                  <span className="truncate text-[11px]">{key.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tolerance & Feather Sliders */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Color Tolerance</span>
                <span className="font-mono tabular-nums text-slate-400 text-[11px]">{cutout.tolerance}%</span>
              </div>
              <input
                type="range"
                min={1}
                max={90}
                value={cutout.tolerance}
                onChange={(e) => onChange({ ...cutout, tolerance: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">Higher values match broader color shades</p>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Edge Softness / Feather</span>
                <span className="font-mono tabular-nums text-slate-400 text-[11px]">{cutout.feather}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={25}
                value={cutout.feather}
                onChange={(e) => onChange({ ...cutout, feather: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">Smooths alpha boundary to eliminate jagged halos</p>
            </div>
          </div>

          {/* Invert Selection */}
          <div className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-800 rounded-lg">
            <span className="text-xs text-slate-300">Invert Mask (Keep Color, Cut Rest)</span>
            <input
              type="checkbox"
              checked={cutout.invert}
              onChange={(e) => onChange({ ...cutout, invert: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
            />
          </div>
        </>
      )}
    </div>
  );
};
