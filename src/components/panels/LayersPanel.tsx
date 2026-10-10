/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layer, BlendMode } from '../../types/editor';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  Trash2,
  Copy,
  Plus,
  Image as ImageIcon,
  Type,
  Square,
  Sliders,
} from 'lucide-react';

interface LayersPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onReorderLayer: (id: string, direction: 'up' | 'down') => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onChangeOpacity: (id: string, opacity: number) => void;
  onChangeBlendMode: (id: string, blendMode: BlendMode) => void;
  onAddTextLayer: () => void;
  onAddShapeLayer: () => void;
  onUploadImageLayer: () => void;
}

const BLEND_MODES: { value: BlendMode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'darken', label: 'Darken' },
  { value: 'lighten', label: 'Lighten' },
  { value: 'color-dodge', label: 'Color Dodge' },
  { value: 'soft-light', label: 'Soft Light' },
  { value: 'difference', label: 'Difference' },
];

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  selectedLayerId,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onReorderLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onChangeOpacity,
  onChangeBlendMode,
  onAddTextLayer,
  onAddShapeLayer,
  onUploadImageLayer,
}) => {
  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  const getLayerIcon = (layer: Layer) => {
    switch (layer.type) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-emerald-400" />;
      case 'text':
        return <Type className="w-4 h-4 text-blue-400" />;
      case 'shape':
        return <Square className="w-4 h-4 text-purple-400" />;
      case 'adjustment':
        return <Sliders className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-5 text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Layers Stack</h3>
          <p className="text-[11px] text-slate-400">{layers.length} layers in project</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onUploadImageLayer}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition-colors"
            title="Add Image Layer"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onAddTextLayer}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition-colors"
            title="Add Text Layer"
          >
            <Type className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onAddShapeLayer}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition-colors"
            title="Add Shape Layer"
          >
            <Square className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Layer Controls when a layer is selected */}
      {selectedLayer && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium truncate max-w-[140px]">{selectedLayer.name}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onDuplicateLayer(selectedLayer.id)}
                className="p-1 text-slate-400 hover:text-white"
                title="Duplicate layer"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              {layers.length > 1 && (
                <button
                  type="button"
                  onClick={() => onDeleteLayer(selectedLayer.id)}
                  className="p-1 text-red-400 hover:text-red-300"
                  title="Delete layer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Opacity */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Opacity</span>
              <span className="font-mono tabular-nums text-slate-300">
                {Math.round(selectedLayer.opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(selectedLayer.opacity * 100)}
              onChange={(e) => onChangeOpacity(selectedLayer.id, parseInt(e.target.value, 10) / 100)}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Blend Mode */}
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400">Blend Mode</span>
            <select
              value={selectedLayer.blendMode}
              onChange={(e) => onChangeBlendMode(selectedLayer.id, e.target.value as BlendMode)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {BLEND_MODES.map((bm) => (
                <option key={bm.value} value={bm.value}>
                  {bm.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Layers List (Top of stack = highest visual layer) */}
      <div className="space-y-1.5">
        {[...layers].reverse().map((layer, reverseIndex) => {
          const index = layers.length - 1 - reverseIndex;
          const isSelected = layer.id === selectedLayerId;
          const isTop = index === layers.length - 1;
          const isBottom = index === 0;

          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-blue-950/40 border-blue-500 shadow-sm ring-1 ring-blue-500/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(layer.id);
                  }}
                  className="text-slate-400 hover:text-white shrink-0"
                  title={layer.visible ? 'Hide layer' : 'Show layer'}
                >
                  {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                </button>

                <div className="shrink-0">{getLayerIcon(layer)}</div>

                <div className="min-w-0">
                  <span className={`text-xs block truncate ${isSelected ? 'font-semibold text-white' : 'text-slate-300'}`}>
                    {layer.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {layer.blendMode} · {Math.round(layer.opacity * 100)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLock(layer.id);
                  }}
                  className={`p-1 rounded text-slate-400 hover:text-white ${layer.locked ? 'text-amber-400' : ''}`}
                  title={layer.locked ? 'Unlock layer' : 'Lock layer'}
                >
                  {layer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5 text-slate-600" />}
                </button>

                <button
                  type="button"
                  disabled={isTop}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReorderLayer(layer.id, 'up');
                  }}
                  className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
                  title="Move layer up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  disabled={isBottom}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReorderLayer(layer.id, 'down');
                  }}
                  className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
                  title="Move layer down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
