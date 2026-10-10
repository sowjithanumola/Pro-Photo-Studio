/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FILTER_PRESETS } from '../../utils/imageProcessing';
import { Sliders, Sparkles } from 'lucide-react';

interface FiltersPanelProps {
  selectedFilterId: string;
  filterIntensity: number;
  onSelectFilter: (id: string) => void;
  onChangeIntensity: (val: number) => void;
}

export const FiltersPanel: React.FC<FiltersPanelProps> = ({
  selectedFilterId,
  filterIntensity,
  onSelectFilter,
  onChangeIntensity,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Cinematic', 'Vintage', 'B&W', 'Modern', 'Artistic'];

  const filteredPresets = FILTER_PRESETS.filter((p) => {
    if (selectedCategory === 'All') return true;
    return p.category === selectedCategory || p.id === 'none';
  });

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-5 text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Presets & Filters</h3>
          <p className="text-[11px] text-slate-400">Curated photographic color grades</p>
        </div>
      </div>

      {/* Filter Intensity Slider */}
      {selectedFilterId !== 'none' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Filter Intensity</span>
            <span className="font-mono tabular-nums text-slate-400 text-[11px]">{filterIntensity}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={filterIntensity}
            onChange={(e) => onChangeIntensity(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-lg">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              selectedCategory === cat
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {filteredPresets.map((preset) => {
          const isSelected = selectedFilterId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectFilter(preset.id)}
              className={`flex flex-col text-left p-2.5 rounded-lg border transition-all ${
                isSelected
                  ? 'bg-slate-800/90 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div
                className="w-full h-14 rounded-md mb-2 shadow-inner border border-white/10 flex items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: preset.thumbnailColor }}
              >
                {preset.id === 'none' ? (
                  <span className="text-[11px] font-medium text-slate-300">Natural</span>
                ) : (
                  <Sparkles className="w-4 h-4 text-white/50" />
                )}
                {isSelected && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-400" />
                )}
              </div>
              <span className="text-xs font-semibold text-slate-200 truncate">{preset.name}</span>
              <span className="text-[10px] text-slate-400 line-clamp-1">{preset.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
