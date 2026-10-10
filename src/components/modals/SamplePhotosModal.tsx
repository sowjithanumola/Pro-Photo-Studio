/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Sparkles, Mountain, User, Building2 } from 'lucide-react';

interface SamplePhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (type: 'landscape' | 'portrait' | 'architecture') => void;
}

const SAMPLE_OPTIONS = [
  {
    type: 'landscape' as const,
    title: 'Alpine Sunset Lake',
    description: 'Golden hour reflection, mountain silhouettes, warm atmosphere',
    aspect: '16:9 Landscape',
    icon: Mountain,
    color: '#f59e0b',
  },
  {
    type: 'portrait' as const,
    title: 'Studio Portrait Mood',
    description: 'Dramatic soft rim key-lighting, natural tones, dark backdrop',
    aspect: '3:4 Portrait',
    icon: User,
    color: '#ec4899',
  },
  {
    type: 'architecture' as const,
    title: 'Geometric Concrete Façade',
    description: 'Minimalist brutalist structure, clean diagonal sun shadows',
    aspect: '4:3 Standard',
    icon: Building2,
    color: '#38bdf8',
  },
];

export const SamplePhotosModal: React.FC<SamplePhotosModalProps> = ({
  isOpen,
  onClose,
  onSelectSample,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#12161c] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col text-slate-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Load Demo Photo</h2>
            <p className="text-xs text-slate-400">Instant test photos generated 100% offline</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {SAMPLE_OPTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => {
                  onSelectSample(item.type);
                  onClose();
                }}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 transition-all text-left group"
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: `${item.color}25` }}
                >
                  <Icon className="w-6 h-6" style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.aspect}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{item.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
