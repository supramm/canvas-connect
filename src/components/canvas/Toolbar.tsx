import React from 'react';
import { Pencil, Eraser, Undo2, Redo2, Trash2, Minus, Plus } from 'lucide-react';
import { Tool } from '@/hooks/useDrawingState';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

interface ToolbarProps {
  tool: Tool;
  color: string;
  strokeWidth: number;
  colors: string[];
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (tool: Tool) => void;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}

export function Toolbar({
  tool,
  color,
  strokeWidth,
  colors,
  canUndo,
  canRedo,
  onToolChange,
  onColorChange,
  onStrokeWidthChange,
  onUndo,
  onRedo,
  onClear,
}: ToolbarProps) {
  return (
    <div className="floating-toolbar flex items-center gap-1">
      {/* Drawing Tools */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onToolChange('brush')}
            className={`tool-button ${tool === 'brush' ? 'tool-button-active' : ''}`}
          >
            <Pencil className="w-5 h-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Brush (B)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onToolChange('eraser')}
            className={`tool-button ${tool === 'eraser' ? 'tool-button-active' : ''}`}
          >
            <Eraser className="w-5 h-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Eraser (E)</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Color Picker */}
      <div className="flex items-center gap-1 px-1">
        {colors.map((c) => (
          <Tooltip key={c}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onColorChange(c)}
                className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                  color === c ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            </TooltipTrigger>
            <TooltipContent>Select color</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Stroke Width */}
      <div className="flex items-center gap-2 px-2">
        <Minus className="w-3 h-3 text-muted-foreground" />
        <Slider
          value={[strokeWidth]}
          onValueChange={([value]) => onStrokeWidthChange(value)}
          min={1}
          max={32}
          step={1}
          className="w-24"
        />
        <Plus className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground w-6">{strokeWidth}px</span>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* History Actions */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`tool-button ${!canUndo ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <Undo2 className="w-5 h-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`tool-button ${!canRedo ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <Redo2 className="w-5 h-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={onClear} className="tool-button text-destructive hover:text-destructive">
            <Trash2 className="w-5 h-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Clear Canvas</TooltipContent>
      </Tooltip>
    </div>
  );
}
