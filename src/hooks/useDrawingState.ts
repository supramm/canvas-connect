import { useState, useCallback, useRef } from 'react';
import {
  CanvasState,
  DrawingStroke,
  Point,
  createInitialState,
  addStroke,
  undoOperation,
  redoOperation,
  clearCanvas,
  generateStrokeId,
} from '@/lib/canvas-engine';

export type Tool = 'brush' | 'eraser';

export interface DrawingSettings {
  tool: Tool;
  color: string;
  strokeWidth: number;
}

export interface User {
  id: string;
  name: string;
  color: string;
  cursorPosition?: Point;
  isDrawing?: boolean;
}

const DEFAULT_COLORS = [
  '#1a1a2e', // Dark
  '#e74c3c', // Red
  '#e67e22', // Orange
  '#f1c40f', // Yellow
  '#2ecc71', // Green
  '#3498db', // Blue
  '#9b59b6', // Purple
  '#1abc9c', // Teal
];

const USER_COLORS = [
  'hsl(200, 90%, 50%)',
  'hsl(340, 80%, 55%)',
  'hsl(160, 70%, 45%)',
  'hsl(45, 90%, 55%)',
  'hsl(280, 70%, 60%)',
  'hsl(20, 85%, 55%)',
];

export function useDrawingState(userId: string) {
  const [canvasState, setCanvasState] = useState<CanvasState>(createInitialState());
  const [settings, setSettings] = useState<DrawingSettings>({
    tool: 'brush',
    color: DEFAULT_COLORS[0],
    strokeWidth: 4,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const isDrawingRef = useRef(false);

  // Start a new stroke
  const startStroke = useCallback((point: Point) => {
    isDrawingRef.current = true;
    const newStroke: DrawingStroke = {
      id: generateStrokeId(),
      userId,
      tool: settings.tool,
      color: settings.color,
      strokeWidth: settings.strokeWidth,
      points: [point],
      timestamp: Date.now(),
    };
    setCurrentStroke(newStroke);
    return newStroke;
  }, [userId, settings]);

  // Add point to current stroke
  const continueStroke = useCallback((point: Point) => {
    if (!isDrawingRef.current || !currentStroke) return null;
    
    const updatedStroke: DrawingStroke = {
      ...currentStroke,
      points: [...currentStroke.points, point],
    };
    setCurrentStroke(updatedStroke);
    return updatedStroke;
  }, [currentStroke]);

  // Finish current stroke
  const endStroke = useCallback(() => {
    if (!isDrawingRef.current || !currentStroke) return null;
    
    isDrawingRef.current = false;
    const finishedStroke = currentStroke;
    
    if (finishedStroke.points.length >= 2) {
      setCanvasState(prev => addStroke(prev, finishedStroke, userId));
    }
    
    setCurrentStroke(null);
    return finishedStroke;
  }, [currentStroke, userId]);

  // Add remote stroke
  const addRemoteStroke = useCallback((stroke: DrawingStroke) => {
    setCanvasState(prev => addStroke(prev, stroke, stroke.userId));
  }, []);

  // Undo
  const undo = useCallback(() => {
    setCanvasState(prev => undoOperation(prev, userId));
  }, [userId]);

  // Redo
  const redo = useCallback(() => {
    setCanvasState(prev => redoOperation(prev, userId));
  }, [userId]);

  // Clear
  const clear = useCallback(() => {
    setCanvasState(clearCanvas(userId));
  }, [userId]);

  // Update settings
  const setTool = useCallback((tool: Tool) => {
    setSettings(prev => ({ ...prev, tool }));
  }, []);

  const setColor = useCallback((color: string) => {
    setSettings(prev => ({ ...prev, color }));
  }, []);

  const setStrokeWidth = useCallback((strokeWidth: number) => {
    setSettings(prev => ({ ...prev, strokeWidth }));
  }, []);

  // User management
  const updateUserCursor = useCallback((userId: string, position: Point, isDrawing: boolean) => {
    setUsers(prev => {
      const existing = prev.find(u => u.id === userId);
      if (existing) {
        return prev.map(u => 
          u.id === userId 
            ? { ...u, cursorPosition: position, isDrawing } 
            : u
        );
      }
      // Add new user
      const colorIndex = prev.length % USER_COLORS.length;
      return [...prev, {
        id: userId,
        name: `User ${prev.length + 1}`,
        color: USER_COLORS[colorIndex],
        cursorPosition: position,
        isDrawing,
      }];
    });
  }, []);

  const removeUser = useCallback((userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  }, []);

  const addUser = useCallback((user: User) => {
    setUsers(prev => {
      if (prev.find(u => u.id === user.id)) return prev;
      const colorIndex = prev.length % USER_COLORS.length;
      return [...prev, { ...user, color: user.color || USER_COLORS[colorIndex] }];
    });
  }, []);

  // Sync state from server
  const syncState = useCallback((newState: CanvasState) => {
    setCanvasState(newState);
  }, []);

  return {
    canvasState,
    currentStroke,
    settings,
    users,
    isDrawing: isDrawingRef.current,
    // Drawing actions
    startStroke,
    continueStroke,
    endStroke,
    addRemoteStroke,
    // History actions
    undo,
    redo,
    clear,
    // Settings actions
    setTool,
    setColor,
    setStrokeWidth,
    // User actions
    updateUserCursor,
    removeUser,
    addUser,
    syncState,
    // Constants
    availableColors: DEFAULT_COLORS,
    canUndo: canvasState.undoStack.length > 0,
    canRedo: canvasState.redoStack.length > 0,
  };
}
