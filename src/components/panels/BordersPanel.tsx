/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BorderSettings } from '../../types/editor';
import { Frame, Image as ImageIcon } from 'lucide-react';

interface BordersPanelProps {
  borders: BorderSettings;
  onChange: (borders: BorderSettings) => void;
}

const BORDER_TYPES: { type: BorderSettings['type']; label: string; description: string }[] = [
  { type: 'none', label: 'No Border', description: 'Raw image canvas with no outer frame' },
  { type: 'solid', label: 'Solid Inset Border', description: 'Clean uniform gallery border with custom width' },
  { type: 'polaroid', label: 'Vintage Polaroid', description: 'Authentic instant film white frame with bottom margin' },
  { type: 'film', label: 'Film Sprocket Frame', description: 'Dark 35mm cinema negative frame border' },
  { type: 'rounded', label: 'Rounded Edge', description: 'Smooth rounded modern corner mask' },
];

export const BordersPanel: React.FC<BordersPanelProps> = ({
  borders,
  onChange,
}) => {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-5 text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Borders & Frames</h3>
          <p className="text-[11px] text-slate-400">Gallery mats, Polaroid cards, film frames</p>
        </div>
      </div>

      {/* Frame Style Select */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Frame Style</span>
        <div className="space-y-2">
          {BORDER_TYPES.map((item) => {
            const isSelected = borders.type === item.type;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => onChange({ ...borders, type: item.type })}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-blue-950/40 border-blue-500 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <Frame className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                <div>
                  <span className={`text-xs font-semibold block ${isSelected ? 'text-blue-200' : 'text-slate-200'}`}>
                    {item.label}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">{item.description}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Frame Parameters */}
      {borders.type !== 'none' && (
        <div className="space-y-4 pt-2">
          {/* Color & Width */}
          {borders.type !== 'film' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">Border Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={borders.color}
                    onChange={(e) => onChange({ ...borders, color: e.target.value })}
                    className="w-7 h-7 rounded cursor-pointer bg-transparent border border-slate-700"
                  />
                  <span className="text-[11px] font-mono uppercase text-slate-300">{borders.color}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Border Width</span>
                  <span className="font-mono tabular-nums text-slate-400 text-[11px]">{borders.width}px</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={80}
                  value={borders.width}
                  onChange={(e) => onChange({ ...borders, width: parseInt(e.target.value, 10) || 4 })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {borders.type === 'rounded' && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Corner Radius</span>
                    <span className="font-mono tabular-nums text-slate-400 text-[11px]">{borders.radius}px</span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={120}
                    value={borders.radius}
                    onChange={(e) => onChange({ ...borders, radius: parseInt(e.target.value, 10) || 4 })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}
            </div>
          )}

          {/* Polaroid Caption */}
          {borders.type === 'polaroid' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2">
              <span className="text-xs font-medium text-slate-300">Polaroid Bottom Caption</span>
              <input
                type="text"
                value={borders.polaroidCaption}
                onChange={(e) => onChange({ ...borders, polaroidCaption: e.target.value })}
                placeholder="e.g. Summer Memories, 2026"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
