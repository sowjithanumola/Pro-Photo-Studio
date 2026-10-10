/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LayerType = 'image' | 'text' | 'shape' | 'adjustment';

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'soft-light'
  | 'difference';

export interface AdjustmentSettings {
  brightness: number;    // -100 to 100
  contrast: number;      // -100 to 100
  exposure: number;      // -100 to 100
  saturation: number;    // -100 to 100
  temperature: number;   // -100 to 100 (Cool blue to Warm orange)
  tint: number;          // -100 to 100 (Green to Magenta)
  highlights: number;    // -100 to 100
  shadows: number;       // -100 to 100
  vibrance: number;      // -100 to 100
  sharpness: number;     // 0 to 100
  blur: number;          // 0 to 40
  vignette: number;      // 0 to 100
  grain: number;         // 0 to 100
}

export interface CurvePoint {
  x: number; // 0 to 255
  y: number; // 0 to 255
}

export interface CurveSettings {
  master: CurvePoint[];
  red: CurvePoint[];
  green: CurvePoint[];
  blue: CurvePoint[];
}

export interface CutoutSettings {
  enabled: boolean;
  targetColor: string; // hex
  tolerance: number;   // 1 to 100
  feather: number;     // 0 to 30
  invert: boolean;
}

export interface BorderSettings {
  type: 'none' | 'solid' | 'polaroid' | 'film' | 'rounded';
  color: string;
  width: number;
  radius: number;
  polaroidCaption: string;
}

export interface CropState {
  isActive: boolean;
  aspectRatio: number | null; // null is free, 1, 16/9, 4/3, 9/16, etc.
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  rotation: number; // -180 to 180 degrees
  flipHorizontal: boolean;
  flipVertical: boolean;
}

export interface BaseLayer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0 to 1
  blendMode: BlendMode;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // 0 to 360
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  src: string;
  imgElement: HTMLImageElement;
  naturalWidth: number;
  naturalHeight: number;
  adjustments: AdjustmentSettings;
  curves: CurveSettings;
  filterId: string;
  filterIntensity: number;
  cutout: CutoutSettings;
}

export interface AdjustmentLayer extends BaseLayer {
  type: 'adjustment';
  adjustments: AdjustmentSettings;
  curves: CurveSettings;
  filterId: string;
  filterIntensity: number;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  strokeColor?: string;
  strokeWidth?: number;
  backgroundColor?: string;
  backgroundPadding?: number;
  textAlign: 'left' | 'center' | 'right';
  letterSpacing: number;
}

export interface ShapeLayer extends BaseLayer {
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'star' | 'arrow' | 'badge' | 'heart';
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  cornerRadius?: number;
}

export type Layer = ImageLayer | AdjustmentLayer | TextLayer | ShapeLayer;

export type ActiveTool =
  | 'select'
  | 'crop'
  | 'adjust'
  | 'curves'
  | 'filters'
  | 'cutout'
  | 'text'
  | 'shapes'
  | 'borders'
  | 'layers';

export interface FilterPreset {
  id: string;
  name: string;
  category: 'Cinematic' | 'Vintage' | 'B&W' | 'Modern' | 'Artistic';
  description: string;
  thumbnailColor: string;
  apply: (adjustments: AdjustmentSettings) => Partial<AdjustmentSettings>;
  lutTint?: { r: number; g: number; b: number; strength: number };
}

export interface ExportOptions {
  format: 'image/png' | 'image/jpeg' | 'image/webp';
  quality: number; // 0.1 to 1.0
  scale: number;   // 0.5, 1, 2, 3
  customWidth?: number;
  customHeight?: number;
  fileName: string;
}

export interface EditorHistorySnapshot {
  timestamp: number;
  description: string;
  layers: Layer[];
  canvasWidth: number;
  canvasHeight: number;
  borders: BorderSettings;
  selectedLayerId: string | null;
}
