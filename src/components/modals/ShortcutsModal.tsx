/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Ctrl / ⌘ + Z', action: 'Undo last change' },
  { key: 'Ctrl / ⌘ + Y', action: 'Redo previously undone change' },
  { key: 'V', action: 'Select & Move Tool' },
  { key: 'C', action: 'Crop & Transform Tool' },
  { key: 'A', action: 'Adjustments (Light & Color)' },
  { key: 'U', action: 'Tone Curves Tool' },
  { key: 'P', action: 'Filter Presets Panel' },
  { key: 'W', action: 'Smart Cutout Tool' },
  { key: 'T', action: 'Typography / Text Tool' },
  { key: 'S', action: 'Shapes & Badges Tool' },
  { key: 'B', action: 'Borders & Frames' },
  { key: 'L', action: 'Layers Stack' },
  { key: 'Space + Drag', action: 'Pan canvas freely' },
  { key: 'Mouse Wheel', action: 'Zoom into cursor' },
  { key: 'Delete / Backspace', action: 'Delete selected layer' },
  { key: '0', action: 'Fit canvas to screen' },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#12161c] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col text-slate-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Command className="w-4 h-4 text-blue-400" />
            <h2 className="text-base font-bold text-white">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
          {SHORTCUTS.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-900/50 border border-slate-800/60 text-xs"
            >
              <span className="text-slate-300">{item.action}</span>
              <kbd className="px-2 py-1 bg-slate-800 text-slate-200 font-mono text-[11px] rounded border border-slate-700/80 shadow-sm">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
