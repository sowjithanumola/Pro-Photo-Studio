/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShapeLayer } from '../../types/editor';
import { Square, Circle, Star, ArrowRight, Shield, Heart, Plus, Trash2 } from 'lucide-react';

interface ShapesPanelProps {
  selectedShapeLayer: ShapeLayer | null;
  onAddShape: (type: ShapeLayer['shapeType']) => void;
  onUpdateShape: (updates: Partial<ShapeLayer>) => void;
  onDeleteShape: () => void;
}

const SHAPE_BUTTONS: { type: ShapeLayer['shapeType']; label: string; icon: React.FC<{ className?: string }> }[] = [
  { type: 'rectangle', label: 'Rectangle', icon: Square },
  { type: 'circle', label: 'Circle', icon: Circle },
  { type: 'star', label: 'Star', icon: Star },
  { type: 'arrow', label: 'Arrow', icon: ArrowRight },
  { type: 'badge', label: 'Badge', icon: Shield },
  { type: 'heart', label: 'Heart', icon: Heart },
];

export const ShapesPanel: React.FC<ShapesPanelProps> = ({
  selectedShapeLayer,
  onAddShape,
  onUpdateShape,
  onDeleteShape,
}) => {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-5 text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Vector Shapes</h3>
          <p className="text-[11px] text-slate-400">Add callouts, badges, geometric masks</p>
        </div>
      </div>

      {/* Add New Shape Grid */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Add Shape</span>
        <div className="grid grid-cols-3 gap-2">
          {SHAPE_BUTTONS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => onAddShape(item.type)}
                className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                <Icon className="w-5 h-5 mb-1 text-blue-400" />
                <span className="text-[10px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Shape Properties */}
      {selectedShapeLayer && (
        <div className="space-y-4 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {selectedShapeLayer.shapeType} Properties
            </span>
            <button
              type="button"
              onClick={onDeleteShape}
              className="text-red-400 hover:text-red-300 p-1"
              title="Delete shape"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Fill & Stroke */}
          <div className="grid grid-cols-2 gap-3 bg-slate-900/60 border border-slate-800 rounded-lg p-3">
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-slate-300">Fill Color</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedShapeLayer.fillColor === 'transparent' ? '#000000' : selectedShapeLayer.fillColor}
                  onChange={(e) => onUpdateShape({ fillColor: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border border-slate-700"
                />
                <button
                  type="button"
                  onClick={() =>
                    onUpdateShape({
                      fillColor: selectedShapeLayer.fillColor === 'transparent' ? '#3b82f6' : 'transparent',
                    })
                  }
                  className="text-[10px] text-slate-400 hover:text-white"
                >
                  {selectedShapeLayer.fillColor === 'transparent' ? 'No Fill' : 'Solid'}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-slate-300">Stroke Color</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedShapeLayer.strokeColor}
                  onChange={(e) => onUpdateShape({ strokeColor: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border border-slate-700"
                />
                <span className="text-[11px] font-mono uppercase text-slate-300">{selectedShapeLayer.strokeColor}</span>
              </div>
            </div>
          </div>

          {/* Stroke Width & Corner Radius */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Border Width</span>
                <span className="font-mono tabular-nums text-slate-400 text-[11px]">{selectedShapeLayer.strokeWidth}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                value={selectedShapeLayer.strokeWidth}
                onChange={(e) => onUpdateShape({ strokeWidth: parseInt(e.target.value, 10) || 0 })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {selectedShapeLayer.shapeType === 'rectangle' && (
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Corner Radius</span>
                  <span className="font-mono tabular-nums text-slate-400 text-[11px]">{selectedShapeLayer.cornerRadius || 0}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={80}
                  value={selectedShapeLayer.cornerRadius || 0}
                  onChange={(e) => onUpdateShape({ cornerRadius: parseInt(e.target.value, 10) || 0 })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
