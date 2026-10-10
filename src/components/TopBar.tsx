/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Columns,
  RotateCcw,
  Download,
  Image as ImageIcon,
  Sparkles,
  Command,
  Scaling,
} from 'lucide-react';

interface TopBarProps {
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  isComparing: boolean;
  canvasWidth: number;
  canvasHeight: number;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onToggleCompare: () => void;
  onResetAll: () => void;
  onOpenExport: () => void;
  onOpenSampleModal: () => void;
  onOpenShortcutsModal: () => void;
  onOpenResizeModal: () => void;
  onTriggerFileUpload: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  canUndo,
  canRedo,
  zoom,
  isComparing,
  canvasWidth,
  canvasHeight,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onToggleCompare,
  onResetAll,
  onOpenExport,
  onOpenSampleModal,
  onOpenShortcutsModal,
  onOpenResizeModal,
  onTriggerFileUpload,
}) => {
  return (
    <div className="flex flex-col shrink-0 select-none border-b border-slate-800 bg-[#111418] z-30">
      {/* Universal 3-Zone Navigation Header */}
      <header className="flex items-center justify-between gap-8 px-6 py-2.5 border-b border-slate-800/80">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold tracking-tight text-white whitespace-nowrap">
            ProPhoto Studio
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
          <button
            type="button"
            onClick={onTriggerFileUpload}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
            <span>Open Photo</span>
          </button>

          <button
            type="button"
            onClick={onOpenSampleModal}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Demo Samples</span>
          </button>

          <button
            type="button"
            onClick={onOpenResizeModal}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Scaling className="w-3.5 h-3.5 text-emerald-400" />
            <span>Canvas Size</span>
          </button>

          <button
            type="button"
            onClick={onOpenShortcutsModal}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Command className="w-3.5 h-3.5 text-purple-400" />
            <span>Shortcuts</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenExport}
            className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-blue-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Artwork</span>
          </button>
        </div>
      </header>

      {/* Studio Action Toolbar Strip */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#0d0f12] text-xs">
        {/* Left: History & Reset */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <button
            type="button"
            onClick={onResetAll}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-[11px]"
            title="Reset all edits"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Edits</span>
          </button>
        </div>

        {/* Center: Viewport Zoom & Pan */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onZoomOut}
            className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="font-mono tabular-nums text-slate-300 text-xs px-2 min-w-[50px] text-center">
            {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            onClick={onZoomIn}
            className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onZoomFit}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-[11px] ml-1"
            title="Fit to Screen (0)"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Fit</span>
          </button>
        </div>

        {/* Right: Compare & Dimensions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleCompare}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors text-xs font-medium ${
              isComparing
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title="Before / After Split Screen Comparison"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>{isComparing ? 'Comparing' : 'Compare'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
