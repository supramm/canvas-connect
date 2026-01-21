import React, { useMemo, useCallback, useEffect } from 'react';
import { DrawingCanvas } from './DrawingCanvas';
import { Toolbar } from './Toolbar';
import { UsersPanel } from './UsersPanel';
import { useDrawingState } from '@/hooks/useDrawingState';
import { useCanvasSync } from '@/hooks/useCanvasSync';
import { Point } from '@/lib/canvas-engine';

interface CollaborativeCanvasProps {
  roomId: string;
  userId: string;
}

export function CollaborativeCanvas({ roomId, userId }: CollaborativeCanvasProps) {
  const {
    canvasState,
    currentStroke,
    settings,
    users,
    startStroke,
    continueStroke,
    endStroke,
    addRemoteStroke,
    undo,
    redo,
    clear,
    setTool,
    setColor,
    setStrokeWidth,
    updateUserCursor,
    addUser,
    removeUser,
    syncState,
    availableColors,
    canUndo,
    canRedo,
  } = useDrawingState(userId);

  // Memoize sync callbacks
  const syncCallbacks = useMemo(() => ({
    onRemoteStroke: addRemoteStroke,
    onRemoteUndo: undo,
    onRemoteRedo: redo,
    onRemoteClear: clear,
    onRemoteCursor: updateUserCursor,
    onUserJoin: addUser,
    onUserLeave: removeUser,
    onSyncState: syncState,
  }), [addRemoteStroke, undo, redo, clear, updateUserCursor, addUser, removeUser, syncState]);

  const {
    isConnected,
    sendStrokeStart,
    sendStrokeEnd,
    sendCursorPosition,
    sendUndo,
    sendRedo,
    sendClear,
  } = useCanvasSync(roomId, userId, syncCallbacks);

  // Handle drawing events
  const handleDrawStart = useCallback((point: Point) => {
    const stroke = startStroke(point);
    if (stroke) {
      sendStrokeStart(stroke);
    }
  }, [startStroke, sendStrokeStart]);

  const handleDrawMove = useCallback((point: Point) => {
    continueStroke(point);
  }, [continueStroke]);

  const handleDrawEnd = useCallback(() => {
    const stroke = endStroke();
    if (stroke) {
      sendStrokeEnd(stroke);
    }
  }, [endStroke, sendStrokeEnd]);

  const handleCursorMove = useCallback((point: Point, isDrawing: boolean) => {
    sendCursorPosition(point, isDrawing);
  }, [sendCursorPosition]);

  // Handle undo/redo with sync
  const handleUndo = useCallback(() => {
    undo();
    sendUndo();
  }, [undo, sendUndo]);

  const handleRedo = useCallback(() => {
    redo();
    sendRedo();
  }, [redo, sendRedo]);

  const handleClear = useCallback(() => {
    clear();
    sendClear();
  }, [clear, sendClear]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
      if (e.key === 'b') {
        setTool('brush');
      }
      if (e.key === 'e') {
        setTool('eraser');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, setTool]);

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <Toolbar
          tool={settings.tool}
          color={settings.color}
          strokeWidth={settings.strokeWidth}
          colors={availableColors}
          canUndo={canUndo}
          canRedo={canRedo}
          onToolChange={setTool}
          onColorChange={setColor}
          onStrokeWidthChange={setStrokeWidth}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
        />
      </div>

      {/* Users panel */}
      <div className="absolute top-4 right-4 z-10">
        <UsersPanel
          users={users}
          currentUserId={userId}
          isConnected={isConnected}
        />
      </div>

      {/* Room ID badge */}
      <div className="absolute top-4 left-4 z-10">
        <div className="floating-toolbar px-3 py-1.5">
          <span className="text-xs text-muted-foreground">Room: </span>
          <span className="text-sm font-medium text-foreground">{roomId}</span>
        </div>
      </div>

      {/* Canvas */}
      <DrawingCanvas
        canvasState={canvasState}
        currentStroke={currentStroke}
        users={users}
        currentUserId={userId}
        onDrawStart={handleDrawStart}
        onDrawMove={handleDrawMove}
        onDrawEnd={handleDrawEnd}
        onCursorMove={handleCursorMove}
      />

      {/* Keyboard shortcuts hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <div className="floating-toolbar px-4 py-2 text-xs text-muted-foreground">
          <span className="mr-4"><kbd className="px-1.5 py-0.5 bg-secondary rounded text-foreground">B</kbd> Brush</span>
          <span className="mr-4"><kbd className="px-1.5 py-0.5 bg-secondary rounded text-foreground">E</kbd> Eraser</span>
          <span className="mr-4"><kbd className="px-1.5 py-0.5 bg-secondary rounded text-foreground">Ctrl+Z</kbd> Undo</span>
          <span><kbd className="px-1.5 py-0.5 bg-secondary rounded text-foreground">Ctrl+Y</kbd> Redo</span>
        </div>
      </div>
    </div>
  );
}
