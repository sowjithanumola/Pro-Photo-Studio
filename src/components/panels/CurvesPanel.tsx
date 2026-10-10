/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CurvePoint, CurveSettings } from '../../types/editor';
import { buildSplineLUT, DEFAULT_CURVE_POINTS, DEFAULT_CURVES } from '../../utils/imageProcessing';
import { RotateCcw } from 'lucide-react';

interface CurvesPanelProps {
  curves: CurveSettings;
  onChange: (curves: CurveSettings) => void;
  onReset: () => void;
}

type Channel = 'master' | 'red' | 'green' | 'blue';

export const CurvesPanel: React.FC<CurvesPanelProps> = ({
  curves,
  onChange,
  onReset,
}) => {
  const [activeChannel, setActiveChannel] = useState<Channel>('master');
  const [draggedPointIndex, setDraggedPointIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const currentPoints = curves[activeChannel] || DEFAULT_CURVE_POINTS;

  // Build interpolated path string (0..255) mapped to SVG (0..256, inverted Y)
  const lut = buildSplineLUT(currentPoints);
  let pathD = 'M 0 ' + (256 - lut[0]);
  for (let x = 1; x < 256; x++) {
    pathD += ` L ${x} ${256 - lut[x]}`;
  }

  const handleChannelReset = () => {
    onChange({
      ...curves,
      [activeChannel]: [...DEFAULT_CURVE_POINTS],
    });
  };

  const getCoordinatesFromEvent = (e: React.MouseEvent | MouseEvent): { x: number; y: number } | null => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;
    const x = Math.max(0, Math.min(255, Math.round(((clientX - rect.left) / rect.width) * 255)));
    const y = Math.max(0, Math.min(255, Math.round((1 - (clientY - rect.top) / rect.height) * 255)));
    return { x, y };
  };

  const handleMouseDownPoint = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggedPointIndex(index);
  };

  const handleSvgClick = (e: React.MouseEvent) => {
    if (draggedPointIndex !== null) return;
    const coords = getCoordinatesFromEvent(e);
    if (!coords) return;

    // Check if clicked close to existing point
    const existingIndex = currentPoints.findIndex(
      (p) => Math.abs(p.x - coords.x) < 12 && Math.abs(p.y - coords.y) < 12
    );

    if (existingIndex >= 0) return;

    // Add new point (max 10 points per channel)
    if (currentPoints.length < 10) {
      const newPoints = [...currentPoints, coords].sort((a, b) => a.x - b.x);
      onChange({
        ...curves,
        [activeChannel]: newPoints,
      });
    }
  };

  const handlePointDoubleClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    // Do not delete endpoints 0 and 255
    if (index === 0 || index === currentPoints.length - 1) return;
    const newPoints = currentPoints.filter((_, i) => i !== index);
    onChange({
      ...curves,
      [activeChannel]: newPoints,
    });
  };

  // Global mousemove and mouseup listeners for smooth dragging
  useEffect(() => {
    if (draggedPointIndex === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      const coords = getCoordinatesFromEvent(e);
      if (!coords) return;

      const newPoints = [...currentPoints];
      const isFirst = draggedPointIndex === 0;
      const isLast = draggedPointIndex === currentPoints.length - 1;

      if (isFirst) {
        newPoints[0] = { x: 0, y: coords.y };
      } else if (isLast) {
        newPoints[currentPoints.length - 1] = { x: 255, y: coords.y };
      } else {
        // Bound X between adjacent points to keep array ordered
        const prevX = currentPoints[draggedPointIndex - 1].x + 4;
        const nextX = currentPoints[draggedPointIndex + 1].x - 4;
        const boundedX = Math.max(prevX, Math.min(nextX, coords.x));
        newPoints[draggedPointIndex] = { x: boundedX, y: coords.y };
      }

      onChange({
        ...curves,
        [activeChannel]: newPoints,
      });
    };

    const handleMouseUp = () => {
      setDraggedPointIndex(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedPointIndex, currentPoints, activeChannel, curves, onChange]);

  const channelColor =
    activeChannel === 'red'
      ? '#ef4444'
      : activeChannel === 'green'
      ? '#22c55e'
      : activeChannel === 'blue'
      ? '#3b82f6'
      : '#e2e8f0';

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-5 text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">RGB Tone Curves</h3>
          <p className="text-[11px] text-slate-400">Master & individual channel splines</p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-md transition-colors border border-slate-700/50"
          title="Reset all tone curves"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All</span>
        </button>
      </div>

      {/* Channel Switcher */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
        <button
          type="button"
          onClick={() => setActiveChannel('master')}
          className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeChannel === 'master'
              ? 'bg-slate-700 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          RGB
        </button>
        <button
          type="button"
          onClick={() => setActiveChannel('red')}
          className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeChannel === 'red'
              ? 'bg-red-950/80 text-red-300 border border-red-800/60 shadow-sm'
              : 'text-slate-400 hover:text-red-400'
          }`}
        >
          Red
        </button>
        <button
          type="button"
          onClick={() => setActiveChannel('green')}
          className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeChannel === 'green'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 shadow-sm'
              : 'text-slate-400 hover:text-emerald-400'
          }`}
        >
          Green
        </button>
        <button
          type="button"
          onClick={() => setActiveChannel('blue')}
          className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeChannel === 'blue'
              ? 'bg-blue-950/80 text-blue-300 border border-blue-800/60 shadow-sm'
              : 'text-slate-400 hover:text-blue-400'
          }`}
        >
          Blue
        </button>
      </div>

      {/* Interactive Curve Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 shadow-inner">
        <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-slate-800/60 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950">
          <svg
            ref={svgRef}
            viewBox="0 0 256 256"
            className="w-full h-full cursor-crosshair select-none"
            onClick={handleSvgClick}
          >
            {/* Grid division lines */}
            <line x1="64" y1="0" x2="64" y2="256" stroke="#334155" strokeWidth="0.75" strokeDasharray="3 3" />
            <line x1="128" y1="0" x2="128" y2="256" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="192" y1="0" x2="192" y2="256" stroke="#334155" strokeWidth="0.75" strokeDasharray="3 3" />

            <line x1="0" y1="64" x2="256" y2="64" stroke="#334155" strokeWidth="0.75" strokeDasharray="3 3" />
            <line x1="0" y1="128" x2="256" y2="128" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="0" y1="192" x2="256" y2="192" stroke="#334155" strokeWidth="0.75" strokeDasharray="3 3" />

            {/* Diagonal reference guideline */}
            <line x1="0" y1="256" x2="256" y2="0" stroke="#334155" strokeWidth="1" opacity="0.4" />

            {/* Spline curve */}
            <path
              d={pathD}
              fill="none"
              stroke={channelColor}
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Control points */}
            {currentPoints.map((pt, i) => {
              const cx = pt.x;
              const cy = 256 - pt.y;
              const isSelected = draggedPointIndex === i;

              return (
                <g key={i}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? "7" : "5"}
                    fill={isSelected ? '#38bdf8' : channelColor}
                    stroke="#0f172a"
                    strokeWidth="2"
                    className="cursor-pointer transition-transform hover:scale-125"
                    onMouseDown={(e) => handleMouseDownPoint(i, e)}
                    onDoubleClick={(e) => handlePointDoubleClick(i, e)}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400 px-1">
          <span>Click line to add point · Dbl-click point to delete</span>
          <button
            type="button"
            onClick={handleChannelReset}
            className="hover:text-blue-400 transition-colors"
          >
            Reset {activeChannel}
          </button>
        </div>
      </div>
    </div>
  );
};
