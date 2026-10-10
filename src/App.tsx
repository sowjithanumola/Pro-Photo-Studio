/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Layer,
  ImageLayer,
  TextLayer,
  ShapeLayer,
  AdjustmentSettings,
  CurveSettings,
  CutoutSettings,
  BorderSettings,
  CropState,
  ActiveTool,
  BlendMode,
  EditorHistorySnapshot,
} from './types/editor';
import {
  DEFAULT_ADJUSTMENTS,
  DEFAULT_CURVES,
  DEFAULT_CUTOUT,
  DEFAULT_BORDERS,
  generateProceduralSamplePhoto,
  FILTER_PRESETS,
} from './utils/imageProcessing';
import { TopBar } from './components/TopBar';
import { ToolBar } from './components/ToolBar';
import { CanvasViewport } from './components/CanvasViewport';
import { AdjustPanel } from './components/panels/AdjustPanel';
import { CurvesPanel } from './components/panels/CurvesPanel';
import { FiltersPanel } from './components/panels/FiltersPanel';
import { CropPanel } from './components/panels/CropPanel';
import { CutoutPanel } from './components/panels/CutoutPanel';
import { TextPanel } from './components/panels/TextPanel';
import { ShapesPanel } from './components/panels/ShapesPanel';
import { BordersPanel } from './components/panels/BordersPanel';
import { LayersPanel } from './components/panels/LayersPanel';
import { ExportModal } from './components/modals/ExportModal';
import { SamplePhotosModal } from './components/modals/SamplePhotosModal';
import { ShortcutsModal } from './components/modals/ShortcutsModal';
import { ResizeModal } from './components/modals/ResizeModal';
import { UploadCloud } from 'lucide-react';

export default function App() {
  const [canvasWidth, setCanvasWidth] = useState<number>(1600);
  const [canvasHeight, setCanvasHeight] = useState<number>(900);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ActiveTool>('adjust');
  const [borders, setBorders] = useState<BorderSettings>(DEFAULT_BORDERS);

  // Viewport navigation
  const [zoom, setZoom] = useState<number>(0.65);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [isSamplingColor, setIsSamplingColor] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  // Crop & Transform state
  const [cropState, setCropState] = useState<CropState>({
    isActive: false,
    aspectRatio: null,
    rect: { x: 0, y: 0, width: 1600, height: 900 },
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
  });

  // Modals state
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isSampleOpen, setIsSampleOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isResizeOpen, setIsResizeOpen] = useState<boolean>(false);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<EditorHistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isHistoryActionRef = useRef<boolean>(false);

  // Hidden file input for opening user images
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load an image onto the canvas (as base or new layer)
  const loadImageDataUrl = useCallback(
    (dataUrl: string, name: string = 'Photo Layer', asNewLayer: boolean = false) => {
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth || 1200;
        const h = img.naturalHeight || 800;

        const newImageLayer: ImageLayer = {
          id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: name,
          type: 'image',
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: 'normal',
          x: 0,
          y: 0,
          width: w,
          height: h,
          rotation: 0,
          src: dataUrl,
          imgElement: img,
          naturalWidth: w,
          naturalHeight: h,
          adjustments: { ...DEFAULT_ADJUSTMENTS },
          curves: {
            master: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
            red: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
            green: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
            blue: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
          },
          filterId: 'none',
          filterIntensity: 100,
          cutout: { ...DEFAULT_CUTOUT },
        };

        if (asNewLayer) {
          setLayers((prev) => [...prev, newImageLayer]);
          setSelectedLayerId(newImageLayer.id);
        } else {
          setCanvasWidth(w);
          setCanvasHeight(h);
          setLayers([newImageLayer]);
          setSelectedLayerId(newImageLayer.id);
          setCropState((prev) => ({
            ...prev,
            rect: { x: 0, y: 0, width: w, height: h },
          }));
          // Fit zoom to screen
          const fitZ = Math.min(
            (window.innerWidth - 420) / w,
            (window.innerHeight - 180) / h,
            1.0
          );
          setZoom(Math.max(0.15, fitZ));
          setPanOffset({ x: 0, y: 0 });
        }
      };
      img.src = dataUrl;
    },
    []
  );

  // Initialize with built-in Alpine Sunset landscape on first launch
  useEffect(() => {
    const defaultDataUrl = generateProceduralSamplePhoto('landscape');
    if (defaultDataUrl) {
      loadImageDataUrl(defaultDataUrl, 'Alpine Lake Landscape', false);
    }
  }, [loadImageDataUrl]);

  // Push history snapshot
  const pushHistory = useCallback(
    (description: string) => {
      if (isHistoryActionRef.current) return;

      const snapshot: EditorHistorySnapshot = {
        timestamp: Date.now(),
        description,
        layers: JSON.parse(
          JSON.stringify(
            layers.map((l) => {
              if (l.type === 'image') {
                const { imgElement, ...rest } = l as ImageLayer;
                return rest;
              }
              return l;
            })
          )
        ),
        canvasWidth,
        canvasHeight,
        borders: { ...borders },
        selectedLayerId,
      };

      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        next.push(snapshot);
        // Limit to 30 steps
        if (next.length > 30) next.shift();
        return next;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 29));
    },
    [layers, canvasWidth, canvasHeight, borders, selectedLayerId, historyIndex]
  );

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    isHistoryActionRef.current = true;
    const prevIndex = historyIndex - 1;
    const snapshot = history[prevIndex];

    if (snapshot) {
      // Reconstitute layers
      const restored = snapshot.layers.map((l) => {
        if (l.type === 'image') {
          const originalLayer = layers.find((orig) => orig.id === l.id) as ImageLayer | undefined;
          return {
            ...l,
            imgElement: originalLayer?.imgElement,
          } as Layer;
        }
        return l;
      });
      setLayers(restored);
      setCanvasWidth(snapshot.canvasWidth);
      setCanvasHeight(snapshot.canvasHeight);
      setBorders(snapshot.borders);
      setSelectedLayerId(snapshot.selectedLayerId);
      setHistoryIndex(prevIndex);
    }
    setTimeout(() => {
      isHistoryActionRef.current = false;
    }, 50);
  }, [history, historyIndex, layers]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    isHistoryActionRef.current = true;
    const nextIndex = historyIndex + 1;
    const snapshot = history[nextIndex];

    if (snapshot) {
      const restored = snapshot.layers.map((l) => {
        if (l.type === 'image') {
          const originalLayer = layers.find((orig) => orig.id === l.id) as ImageLayer | undefined;
          return {
            ...l,
            imgElement: originalLayer?.imgElement,
          } as Layer;
        }
        return l;
      });
      setLayers(restored);
      setCanvasWidth(snapshot.canvasWidth);
      setCanvasHeight(snapshot.canvasHeight);
      setBorders(snapshot.borders);
      setSelectedLayerId(snapshot.selectedLayerId);
      setHistoryIndex(nextIndex);
    }
    setTimeout(() => {
      isHistoryActionRef.current = false;
    }, 50);
  }, [history, historyIndex, layers]);

  // Active layer helper
  const activeImageLayer = (layers.find(
    (l) => l.id === selectedLayerId && l.type === 'image'
  ) || layers.find((l) => l.type === 'image')) as ImageLayer | undefined;

  const activeTextLayer = layers.find(
    (l) => l.id === selectedLayerId && l.type === 'text'
  ) as TextLayer | undefined;

  const activeShapeLayer = layers.find(
    (l) => l.id === selectedLayerId && l.type === 'shape'
  ) as ShapeLayer | undefined;

  // Update a specific layer
  const handleUpdateLayer = (id: string, updates: Partial<Layer>) => {
    setLayers((prev) =>
      prev.map((layer) => {
        if (layer.id === id) {
          return { ...layer, ...updates } as Layer;
        }
        return layer;
      })
    );
  };

  // Update adjustments on active image layer
  const handleUpdateAdjustments = (adj: AdjustmentSettings) => {
    if (!activeImageLayer) return;
    handleUpdateLayer(activeImageLayer.id, { adjustments: adj });
  };

  // Update curves on active image layer
  const handleUpdateCurves = (curves: CurveSettings) => {
    if (!activeImageLayer) return;
    handleUpdateLayer(activeImageLayer.id, { curves });
  };

  // Select filter preset on active image layer
  const handleSelectFilter = (id: string) => {
    if (!activeImageLayer) return;
    handleUpdateLayer(activeImageLayer.id, { filterId: id });
  };

  // Filter intensity
  const handleChangeFilterIntensity = (val: number) => {
    if (!activeImageLayer) return;
    handleUpdateLayer(activeImageLayer.id, { filterIntensity: val });
  };

  // Update cutout on active image layer
  const handleUpdateCutout = (cutout: CutoutSettings) => {
    if (!activeImageLayer) return;
    handleUpdateLayer(activeImageLayer.id, { cutout });
  };

  // Add new Text layer
  const handleAddTextLayer = () => {
    const newText: TextLayer = {
      id: `text_${Date.now()}`,
      name: 'Text Layer',
      type: 'text',
      text: 'Title Text',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: 48,
      fontWeight: '700',
      color: '#ffffff',
      textAlign: 'center',
      letterSpacing: 0,
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'normal',
      x: Math.round(canvasWidth / 2 - 150),
      y: Math.round(canvasHeight / 2 - 40),
      width: 300,
      height: 80,
      rotation: 0,
    };
    setLayers((prev) => [...prev, newText]);
    setSelectedLayerId(newText.id);
    setActiveTool('text');
  };

  // Add new Shape layer
  const handleAddShapeLayer = (shapeType: ShapeLayer['shapeType'] = 'rectangle') => {
    const size = Math.min(canvasWidth, canvasHeight) * 0.3;
    const newShape: ShapeLayer = {
      id: `shape_${Date.now()}`,
      name: `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)}`,
      type: 'shape',
      shapeType,
      fillColor: '#3b82f6',
      strokeColor: '#ffffff',
      strokeWidth: 0,
      cornerRadius: 12,
      visible: true,
      locked: false,
      opacity: 0.9,
      blendMode: 'normal',
      x: Math.round(canvasWidth / 2 - size / 2),
      y: Math.round(canvasHeight / 2 - size / 2),
      width: Math.round(size),
      height: Math.round(size),
      rotation: 0,
    };
    setLayers((prev) => [...prev, newShape]);
    setSelectedLayerId(newShape.id);
    setActiveTool('shapes');
  };

  // Delete layer
  const handleDeleteLayer = (id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    if (selectedLayerId === id) {
      setSelectedLayerId(null);
    }
  };

  // Duplicate layer
  const handleDuplicateLayer = (id: string) => {
    const layer = layers.find((l) => l.id === id);
    if (!layer) return;
    const copy: Layer = {
      ...layer,
      id: `${layer.type}_${Date.now()}`,
      name: `${layer.name} Copy`,
      x: layer.x + 20,
      y: layer.y + 20,
    };
    setLayers((prev) => [...prev, copy]);
    setSelectedLayerId(copy.id);
  };

  // Layer reordering
  const handleReorderLayer = (id: string, direction: 'up' | 'down') => {
    const idx = layers.findIndex((l) => l.id === id);
    if (idx === -1) return;
    const newLayers = [...layers];
    if (direction === 'up' && idx < newLayers.length - 1) {
      const temp = newLayers[idx];
      newLayers[idx] = newLayers[idx + 1];
      newLayers[idx + 1] = temp;
    } else if (direction === 'down' && idx > 0) {
      const temp = newLayers[idx];
      newLayers[idx] = newLayers[idx - 1];
      newLayers[idx - 1] = temp;
    }
    setLayers(newLayers);
  };

  // Apply Crop & Straighten
  const handleApplyCrop = () => {
    const { rect } = cropState;
    if (rect.width <= 10 || rect.height <= 10) return;

    // Offscreen crop canvas
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = rect.width;
    cropCanvas.height = rect.height;
    const ctx = cropCanvas.getContext('2d');
    if (!ctx) return;

    // Draw active image layer offset
    if (activeImageLayer && activeImageLayer.imgElement) {
      ctx.drawImage(
        activeImageLayer.imgElement,
        rect.x,
        rect.y,
        rect.width,
        rect.height,
        0,
        0,
        rect.width,
        rect.height
      );
      const dataUrl = cropCanvas.toDataURL('image/png');
      loadImageDataUrl(dataUrl, activeImageLayer.name, false);
    }

    setCropState((prev) => ({
      ...prev,
      isActive: false,
    }));
    setActiveTool('select');
  };

  const handleCancelCrop = () => {
    setCropState((prev) => ({
      ...prev,
      isActive: false,
      rect: { x: 0, y: 0, width: canvasWidth, height: canvasHeight },
    }));
    setActiveTool('select');
  };

  // 90 deg rotation
  const handleRotate90 = (direction: 'cw' | 'ccw') => {
    // Swap canvas dimensions
    const newW = canvasHeight;
    const newH = canvasWidth;
    const rotCanvas = document.createElement('canvas');
    rotCanvas.width = newW;
    rotCanvas.height = newH;
    const ctx = rotCanvas.getContext('2d');
    if (!ctx || !activeImageLayer?.imgElement) return;

    ctx.translate(newW / 2, newH / 2);
    ctx.rotate(direction === 'cw' ? Math.PI / 2 : -Math.PI / 2);
    ctx.drawImage(
      activeImageLayer.imgElement,
      -canvasWidth / 2,
      -canvasHeight / 2,
      canvasWidth,
      canvasHeight
    );
    const dataUrl = rotCanvas.toDataURL('image/png');
    loadImageDataUrl(dataUrl, activeImageLayer.name, false);
  };

  // Reset all edits on current image
  const handleResetAll = () => {
    if (activeImageLayer) {
      handleUpdateLayer(activeImageLayer.id, {
        adjustments: { ...DEFAULT_ADJUSTMENTS },
        curves: {
          master: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
          red: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
          green: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
          blue: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
        },
        filterId: 'none',
        filterIntensity: 100,
        cutout: { ...DEFAULT_CUTOUT },
      });
    }
    setBorders(DEFAULT_BORDERS);
  };

  // Fit zoom to viewport
  const handleZoomFit = () => {
    const fitZ = Math.min(
      (window.innerWidth - 420) / canvasWidth,
      (window.innerHeight - 180) / canvasHeight,
      1.0
    );
    setZoom(Math.max(0.15, fitZ));
    setPanOffset({ x: 0, y: 0 });
  };

  // File drop handling
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            loadImageDataUrl(event.target.result as string, file.name, false);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          loadImageDataUrl(event.target.result as string, file.name, false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
      } else if (e.key === 'c' || e.key === 'C') {
        setActiveTool('crop');
        setCropState((prev) => ({ ...prev, isActive: true }));
      } else if (e.key === 'a' || e.key === 'A') {
        setActiveTool('adjust');
      } else if (e.key === 'u' || e.key === 'U') {
        setActiveTool('curves');
      } else if (e.key === 'p' || e.key === 'P') {
        setActiveTool('filters');
      } else if (e.key === 'w' || e.key === 'W') {
        setActiveTool('cutout');
      } else if (e.key === 't' || e.key === 'T') {
        setActiveTool('text');
      } else if (e.key === 's' || e.key === 'S') {
        setActiveTool('shapes');
      } else if (e.key === 'b' || e.key === 'B') {
        setActiveTool('borders');
      } else if (e.key === 'l' || e.key === 'L') {
        setActiveTool('layers');
      } else if (e.key === '0') {
        handleZoomFit();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedLayerId && selectedLayerId !== activeImageLayer?.id) {
          handleDeleteLayer(selectedLayerId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, selectedLayerId, activeImageLayer]);

  // When switching tool to crop, activate crop box
  const handleSelectTool = (tool: ActiveTool) => {
    setActiveTool(tool);
    if (tool === 'crop') {
      setCropState((prev) => ({
        ...prev,
        isActive: true,
        rect: { x: 0, y: 0, width: canvasWidth, height: canvasHeight },
      }));
    } else {
      setCropState((prev) => ({ ...prev, isActive: false }));
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
      className="flex flex-col h-screen w-screen bg-[#0a0c10] text-slate-100 overflow-hidden font-sans select-none"
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Drag & Drop Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-blue-950/80 backdrop-blur-md border-4 border-dashed border-blue-500 flex flex-col items-center justify-center pointer-events-none">
          <UploadCloud className="w-16 h-16 text-blue-300 animate-bounce mb-3" />
          <h2 className="text-xl font-bold text-white">Drop Photo Here</h2>
          <p className="text-sm text-blue-200 mt-1">Loads instantly with zero network dependencies</p>
        </div>
      )}

      {/* Top Bar (Header + Studio Controls) */}
      <TopBar
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        zoom={zoom}
        isComparing={isComparing}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onZoomIn={() => setZoom((z) => Math.min(8.0, z * 1.25))}
        onZoomOut={() => setZoom((z) => Math.max(0.1, z * 0.8))}
        onZoomFit={handleZoomFit}
        onToggleCompare={() => setIsComparing((c) => !c)}
        onResetAll={handleResetAll}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenSampleModal={() => setIsSampleOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsOpen(true)}
        onOpenResizeModal={() => setIsResizeOpen(true)}
        onTriggerFileUpload={() => fileInputRef.current?.click()}
      />

      {/* Main Studio Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Vertical Tool Dock */}
        <ToolBar
          activeTool={activeTool}
          onSelectTool={handleSelectTool}
          layersCount={layers.length}
        />

        {/* Central Editing Canvas Viewport */}
        <CanvasViewport
          layers={layers}
          selectedLayerId={selectedLayerId}
          activeTool={activeTool}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          borders={borders}
          cropState={cropState}
          zoom={zoom}
          panOffset={panOffset}
          isComparing={isComparing}
          isSamplingColor={isSamplingColor}
          onUpdateCrop={(updates) => setCropState((prev) => ({ ...prev, ...updates }))}
          onUpdateLayer={handleUpdateLayer}
          onSelectLayer={setSelectedLayerId}
          onPanChange={setPanOffset}
          onZoomChange={setZoom}
          onColorSampled={(hex) => {
            if (activeImageLayer) {
              handleUpdateCutout({ ...activeImageLayer.cutout, targetColor: hex, enabled: true });
            }
            setIsSamplingColor(false);
          }}
        />

        {/* Right Adjustment & Context Panel */}
        <aside className="w-80 bg-[#111418] border-l border-slate-800 flex flex-col shrink-0 overflow-hidden z-20 shadow-xl">
          {activeTool === 'adjust' && (
            <AdjustPanel
              adjustments={activeImageLayer?.adjustments || DEFAULT_ADJUSTMENTS}
              onChange={handleUpdateAdjustments}
              onReset={() => handleUpdateAdjustments(DEFAULT_ADJUSTMENTS)}
            />
          )}

          {activeTool === 'curves' && (
            <CurvesPanel
              curves={activeImageLayer?.curves || DEFAULT_CURVES}
              onChange={handleUpdateCurves}
              onReset={() => handleUpdateCurves(DEFAULT_CURVES)}
            />
          )}

          {activeTool === 'filters' && (
            <FiltersPanel
              selectedFilterId={activeImageLayer?.filterId || 'none'}
              filterIntensity={activeImageLayer?.filterIntensity ?? 100}
              onSelectFilter={handleSelectFilter}
              onChangeIntensity={handleChangeFilterIntensity}
            />
          )}

          {activeTool === 'crop' && (
            <CropPanel
              cropState={cropState}
              imageWidth={canvasWidth}
              imageHeight={canvasHeight}
              onChangeCrop={(updates) => setCropState((prev) => ({ ...prev, ...updates }))}
              onApplyCrop={handleApplyCrop}
              onCancelCrop={handleCancelCrop}
              onRotate90={handleRotate90}
            />
          )}

          {activeTool === 'cutout' && (
            <CutoutPanel
              cutout={activeImageLayer?.cutout || DEFAULT_CUTOUT}
              onChange={handleUpdateCutout}
              onSampleColorMode={() => setIsSamplingColor(true)}
              isSamplingColor={isSamplingColor}
            />
          )}

          {activeTool === 'text' && (
            <TextPanel
              selectedTextLayer={activeTextLayer || null}
              onAddText={handleAddTextLayer}
              onUpdateText={(updates) => {
                if (activeTextLayer) handleUpdateLayer(activeTextLayer.id, updates);
              }}
              onDeleteText={() => {
                if (activeTextLayer) handleDeleteLayer(activeTextLayer.id);
              }}
            />
          )}

          {activeTool === 'shapes' && (
            <ShapesPanel
              selectedShapeLayer={activeShapeLayer || null}
              onAddShape={handleAddShapeLayer}
              onUpdateShape={(updates) => {
                if (activeShapeLayer) handleUpdateLayer(activeShapeLayer.id, updates);
              }}
              onDeleteShape={() => {
                if (activeShapeLayer) handleDeleteLayer(activeShapeLayer.id);
              }}
            />
          )}

          {activeTool === 'borders' && (
            <BordersPanel
              borders={borders}
              onChange={setBorders}
            />
          )}

          {activeTool === 'layers' && (
            <LayersPanel
              layers={layers}
              selectedLayerId={selectedLayerId}
              onSelectLayer={setSelectedLayerId}
              onToggleVisibility={(id) => {
                const l = layers.find((item) => item.id === id);
                if (l) handleUpdateLayer(id, { visible: !l.visible });
              }}
              onToggleLock={(id) => {
                const l = layers.find((item) => item.id === id);
                if (l) handleUpdateLayer(id, { locked: !l.locked });
              }}
              onReorderLayer={handleReorderLayer}
              onDeleteLayer={handleDeleteLayer}
              onDuplicateLayer={handleDuplicateLayer}
              onChangeOpacity={(id, opacity) => handleUpdateLayer(id, { opacity })}
              onChangeBlendMode={(id, blendMode) => handleUpdateLayer(id, { blendMode })}
              onAddTextLayer={handleAddTextLayer}
              onAddShapeLayer={() => handleAddShapeLayer('rectangle')}
              onUploadImageLayer={() => fileInputRef.current?.click()}
            />
          )}

          {activeTool === 'select' && (
            <div className="flex flex-col h-full overflow-y-auto p-5 text-slate-300 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-white">Select & Transform</h3>
                <p className="text-[11px] text-slate-400">Click elements on canvas to position & transform</p>
              </div>

              {selectedLayerId ? (
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-2 text-xs">
                  <span className="text-slate-400">Selected Layer:</span>
                  <p className="font-semibold text-white">
                    {layers.find((l) => l.id === selectedLayerId)?.name}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Drag on canvas to position. Press Delete to remove.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-lg text-xs text-slate-400">
                  Select a layer or tool from the left toolbar to begin editing.
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* Modals */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        layers={layers}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        borders={borders}
      />

      <SamplePhotosModal
        isOpen={isSampleOpen}
        onClose={() => setIsSampleOpen(false)}
        onSelectSample={(type) => {
          const sampleData = generateProceduralSamplePhoto(type);
          if (sampleData) {
            loadImageDataUrl(
              sampleData,
              type === 'landscape'
                ? 'Alpine Lake'
                : type === 'portrait'
                ? 'Studio Portrait'
                : 'Architecture',
              false
            );
          }
        }}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <ResizeModal
        isOpen={isResizeOpen}
        onClose={() => setIsResizeOpen(false)}
        currentWidth={canvasWidth}
        currentHeight={canvasHeight}
        onApplyResize={(w, h) => {
          setCanvasWidth(w);
          setCanvasHeight(h);
        }}
      />
    </div>
  );
}
