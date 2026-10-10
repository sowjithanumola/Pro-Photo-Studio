/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AdjustmentSettings } from '../../types/editor';
import { RotateCcw, Sun, Contrast, Sliders, Thermometer, Sparkles, Eye } from 'lucide-react';
import { DEFAULT_ADJUSTMENTS } from '../../utils/imageProcessing';

interface AdjustPanelProps {
  adjustments: AdjustmentSettings;
  onChange: (adjustments: AdjustmentSettings) => void;
  onReset: () => void;
}

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  onReset: () => void;
}

const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  onReset,
}) => {
  return (
    <div className="flex flex-col gap-1.5 py-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-300 font-medium">{label}</span>
        <button
          type="button"
          onClick={onReset}
          title="Double-click or click to reset"
          className="font-mono tabular-nums text-slate-400 hover:text-blue-400 px-1 py-0.5 rounded transition-colors text-[11px]"
        >
          {value > 0 && min < 0 ? `+${value}` : value}
          {unit}
        </button>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          onDoubleClick={onReset}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};

export const AdjustPanel: React.FC<AdjustPanelProps> = ({
  adjustments,
  onChange,
  onReset,
}) => {
  const updateProp = (prop: keyof AdjustmentSettings, val: number) => {
    onChange({
      ...adjustments,
      [prop]: val,
    });
  };

  const resetProp = (prop: keyof AdjustmentSettings) => {
    updateProp(prop, DEFAULT_ADJUSTMENTS[prop]);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-6 text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Tone & Color</h3>
          <p className="text-[11px] text-slate-400">Non-destructive pixel adjustments</p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-md transition-colors border border-slate-700/50"
          title="Reset all adjustments to zero"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Light & Tone Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>Light</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 space-y-1">
          <SliderControl
            label="Exposure"
            value={adjustments.exposure}
            min={-100}
            max={100}
            onChange={(v) => updateProp('exposure', v)}
            onReset={() => resetProp('exposure')}
          />
          <SliderControl
            label="Brightness"
            value={adjustments.brightness}
            min={-100}
            max={100}
            onChange={(v) => updateProp('brightness', v)}
            onReset={() => resetProp('brightness')}
          />
          <SliderControl
            label="Contrast"
            value={adjustments.contrast}
            min={-100}
            max={100}
            onChange={(v) => updateProp('contrast', v)}
            onReset={() => resetProp('contrast')}
          />
          <SliderControl
            label="Highlights"
            value={adjustments.highlights}
            min={-100}
            max={100}
            onChange={(v) => updateProp('highlights', v)}
            onReset={() => resetProp('highlights')}
          />
          <SliderControl
            label="Shadows"
            value={adjustments.shadows}
            min={-100}
            max={100}
            onChange={(v) => updateProp('shadows', v)}
            onReset={() => resetProp('shadows')}
          />
        </div>
      </div>

      {/* Color Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Thermometer className="w-3.5 h-3.5 text-blue-400" />
          <span>Color & White Balance</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 space-y-1">
          <SliderControl
            label="Temperature"
            value={adjustments.temperature}
            min={-100}
            max={100}
            onChange={(v) => updateProp('temperature', v)}
            onReset={() => resetProp('temperature')}
          />
          <SliderControl
            label="Tint"
            value={adjustments.tint}
            min={-100}
            max={100}
            onChange={(v) => updateProp('tint', v)}
            onReset={() => resetProp('tint')}
          />
          <SliderControl
            label="Saturation"
            value={adjustments.saturation}
            min={-100}
            max={100}
            onChange={(v) => updateProp('saturation', v)}
            onReset={() => resetProp('saturation')}
          />
          <SliderControl
            label="Vibrance"
            value={adjustments.vibrance}
            min={-100}
            max={100}
            onChange={(v) => updateProp('vibrance', v)}
            onReset={() => resetProp('vibrance')}
          />
        </div>
      </div>

      {/* Detail & Atmosphere Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Detail & Effects</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 space-y-1">
          <SliderControl
            label="Clarity & Sharpness"
            value={adjustments.sharpness}
            min={0}
            max={100}
            onChange={(v) => updateProp('sharpness', v)}
            onReset={() => resetProp('sharpness')}
          />
          <SliderControl
            label="Blur / Soft Focus"
            value={adjustments.blur}
            min={0}
            max={25}
            step={0.5}
            onChange={(v) => updateProp('blur', v)}
            onReset={() => resetProp('blur')}
          />
          <SliderControl
            label="Vignette"
            value={adjustments.vignette}
            min={0}
            max={100}
            onChange={(v) => updateProp('vignette', v)}
            onReset={() => resetProp('vignette')}
          />
          <SliderControl
            label="Film Grain"
            value={adjustments.grain}
            min={0}
            max={100}
            onChange={(v) => updateProp('grain', v)}
            onReset={() => resetProp('grain')}
          />
        </div>
      </div>
    </div>
  );
};
