/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ActiveTool } from '../types/editor';
import {
  MousePointer,
  Crop,
  Sliders,
  TrendingUp,
  Sparkles,
  Wand2,
  Type,
  Square,
  Frame,
  Layers,
} from 'lucide-react';

interface ToolBarProps {
  activeTool: ActiveTool;
  onSelectTool: (tool: ActiveTool) => void;
  layersCount: number;
}

const TOOLS: { id: ActiveTool; label: string; icon: React.FC<{ className?: string }>; shortcut: string }[] = [
  { id: 'select', label: 'Select & Move', icon: MousePointer, shortcut: 'V' },
  { id: 'crop', label: 'Crop & Straighten', icon: Crop, shortcut: 'C' },
  { id: 'adjust', label: 'Adjustments', icon: Sliders, shortcut: 'A' },
  { id: 'curves', label: 'Tone Curves', icon: TrendingUp, shortcut: 'U' },
  { id: 'filters', label: 'Presets & Filters', icon: Sparkles, shortcut: 'P' },
  { id: 'cutout', label: 'Smart Cutout', icon: Wand2, shortcut: 'W' },
  { id: 'text', label: 'Typography', icon: Type, shortcut: 'T' },
  { id: 'shapes', label: 'Shapes', icon: Square, shortcut: 'S' },
  { id: 'borders', label: 'Borders & Frames', icon: Frame, shortcut: 'B' },
  { id: 'layers', label: 'Layers Stack', icon: Layers, shortcut: 'L' },
];

export const ToolBar: React.FC<ToolBarProps> = ({
  activeTool,
  onSelectTool,
  layersCount,
}) => {
  return (
    <aside className="w-16 bg-[#111418] border-r border-slate-800 flex flex-col items-center py-3 select-none shrink-0 z-20">
      <div className="flex flex-col items-center gap-1.5 w-full px-2">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelectTool(tool.id)}
              className={`w-12 h-12 flex flex-col items-center justify-center rounded-xl transition-all relative group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
              }`}
              title={`${tool.label} (${tool.shortcut})`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] mt-0.5 tracking-tight font-medium scale-90 truncate max-w-[44px]">
                {tool.id === 'layers' ? 'Layers' : tool.label.split(' ')[0]}
              </span>

              {/* Layers count indicator badge */}
              {tool.id === 'layers' && layersCount > 1 && !isActive && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-[#111418]" />
              )}

              {/* Tooltip on hover */}
              <div className="absolute left-16 bg-slate-900 text-slate-100 text-xs px-2.5 py-1.5 rounded-md shadow-xl border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap hidden sm:block">
                <span>{tool.label}</span>
                <span className="ml-2 text-slate-400 font-mono text-[10px]">[{tool.shortcut}]</span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
