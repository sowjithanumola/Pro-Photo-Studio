/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TextLayer } from '../../types/editor';
import { Type, AlignLeft, AlignCenter, AlignRight, Plus, Trash2 } from 'lucide-react';

interface TextPanelProps {
  selectedTextLayer: TextLayer | null;
  onAddText: () => void;
  onUpdateText: (updates: Partial<TextLayer>) => void;
  onDeleteText: () => void;
}

const FONT_FAMILIES = [
  { label: 'Sans Serif (Clean)', value: 'Plus Jakarta Sans, sans-serif' },
  { label: 'Serif (Editorial)', value: 'Georgia, serif' },
  { label: 'Monospace (Technical)', value: 'JetBrains Mono, monospace' },
  { label: 'Impact / Display', value: 'Impact, sans-serif' },
  { label: 'Cursive / Script', value: 'Brush Script MT, cursive' },
];

export const TextPanel: React.FC<TextPanelProps> = ({
  selectedTextLayer,
  onAddText,
  onUpdateText,
  onDeleteText,
}) => {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-5 text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Typography & Text</h3>
          <p className="text-[11px] text-slate-400">Add titles, captions, watermarks</p>
        </div>
        <button
          type="button"
          onClick={onAddText}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Text</span>
        </button>
      </div>

      {!selectedTextLayer ? (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-3">
          <Type className="w-8 h-8 text-slate-500" />
          <div>
            <p className="text-xs font-medium text-slate-300">No Text Layer Selected</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Click &quot;New Text&quot; or select an existing text layer on canvas.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddText}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors border border-slate-700"
          >
            Create Text Layer
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Text Input */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-300">Text Content</span>
            <textarea
              rows={3}
              value={selectedTextLayer.text}
              onChange={(e) => onUpdateText({ text: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter text..."
            />
          </div>

          {/* Font Family */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-300">Typeface</span>
            <select
              value={selectedTextLayer.fontFamily}
              onChange={(e) => onUpdateText({ fontFamily: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size & Weight */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-300">Size (px)</span>
              <input
                type="number"
                min={8}
                max={300}
                value={selectedTextLayer.fontSize}
                onChange={(e) => onUpdateText({ fontSize: parseInt(e.target.value, 10) || 12 })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-300">Weight</span>
              <select
                value={selectedTextLayer.fontWeight}
                onChange={(e) => onUpdateText({ fontWeight: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="400">Regular (400)</option>
                <option value="600">SemiBold (600)</option>
                <option value="700">Bold (700)</option>
                <option value="900">Black (900)</option>
              </select>
            </div>
          </div>

          {/* Alignment */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-300">Alignment</span>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => onUpdateText({ textAlign: 'left' })}
                className={`flex items-center justify-center py-1.5 rounded transition-colors ${
                  selectedTextLayer.textAlign === 'left' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onUpdateText({ textAlign: 'center' })}
                className={`flex items-center justify-center py-1.5 rounded transition-colors ${
                  selectedTextLayer.textAlign === 'center' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onUpdateText({ textAlign: 'right' })}
                className={`flex items-center justify-center py-1.5 rounded transition-colors ${
                  selectedTextLayer.textAlign === 'right' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <AlignRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-3 bg-slate-900/60 border border-slate-800 rounded-lg p-3">
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-slate-300">Text Color</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedTextLayer.color}
                  onChange={(e) => onUpdateText({ color: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border border-slate-700"
                />
                <span className="text-[11px] font-mono uppercase text-slate-300">{selectedTextLayer.color}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-slate-300">Stroke Outline</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedTextLayer.strokeColor || '#000000'}
                  onChange={(e) => onUpdateText({ strokeColor: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border border-slate-700"
                />
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={selectedTextLayer.strokeWidth || 0}
                  onChange={(e) => onUpdateText({ strokeWidth: parseInt(e.target.value, 10) || 0 })}
                  className="w-12 bg-slate-800 border border-slate-700 rounded p-1 text-[11px] font-mono text-center"
                />
              </div>
            </div>
          </div>

          {/* Badge Background */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">Background Badge</span>
              <input
                type="checkbox"
                checked={!!selectedTextLayer.backgroundColor}
                onChange={(e) =>
                  onUpdateText({
                    backgroundColor: e.target.checked ? 'rgba(0,0,0,0.7)' : undefined,
                  })
                }
                className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
              />
            </div>
            {selectedTextLayer.backgroundColor && (
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="color"
                  value={selectedTextLayer.backgroundColor.startsWith('#') ? selectedTextLayer.backgroundColor : '#000000'}
                  onChange={(e) => onUpdateText({ backgroundColor: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border border-slate-700"
                />
                <span className="text-[11px] text-slate-400">Semi-transparent badge backdrop</span>
              </div>
            )}
          </div>

          {/* Delete Layer */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onDeleteText}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 text-xs rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Text Layer</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
