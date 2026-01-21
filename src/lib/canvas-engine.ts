// Canvas Drawing Engine - Pure Canvas API implementation
// No external drawing libraries

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface DrawingStroke {
  id: string;
  userId: string;
  tool: 'brush' | 'eraser';
  color: string;
  strokeWidth: number;
  points: Point[];
  timestamp: number;
}

export interface DrawOperation {
  type: 'add' | 'undo' | 'redo' | 'clear';
  stroke?: DrawingStroke;
  userId: string;
  timestamp: number;
}

export interface CanvasState {
  strokes: DrawingStroke[];
  undoStack: DrawOperation[];
  redoStack: DrawOperation[];
}

// Generate unique stroke ID
export function generateStrokeId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Smooth point collection with path optimization
export function smoothPoints(points: Point[], tension = 0.5): Point[] {
  if (points.length < 3) return points;
  
  const smoothed: Point[] = [points[0]];
  
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    
    // Catmull-Rom spline interpolation
    smoothed.push({
      x: curr.x + (next.x - prev.x) * tension * 0.1,
      y: curr.y + (next.y - prev.y) * tension * 0.1,
      pressure: curr.pressure,
    });
  }
  
  smoothed.push(points[points.length - 1]);
  return smoothed;
}

// Draw a single stroke on canvas
export function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  scale = 1
): void {
  if (stroke.points.length < 2) return;

  const smoothedPoints = smoothPoints(stroke.points);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = stroke.strokeWidth * scale;
  
  if (stroke.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = stroke.color;
  }

  ctx.beginPath();
  ctx.moveTo(smoothedPoints[0].x * scale, smoothedPoints[0].y * scale);

  // Use quadratic curves for smooth lines
  for (let i = 1; i < smoothedPoints.length - 1; i++) {
    const midX = (smoothedPoints[i].x + smoothedPoints[i + 1].x) / 2;
    const midY = (smoothedPoints[i].y + smoothedPoints[i + 1].y) / 2;
    ctx.quadraticCurveTo(
      smoothedPoints[i].x * scale,
      smoothedPoints[i].y * scale,
      midX * scale,
      midY * scale
    );
  }

  // Draw to the last point
  const last = smoothedPoints[smoothedPoints.length - 1];
  ctx.lineTo(last.x * scale, last.y * scale);
  ctx.stroke();
  ctx.restore();
}

// Render entire canvas state
export function renderCanvas(
  ctx: CanvasRenderingContext2D,
  state: CanvasState,
  width: number,
  height: number,
  scale = 1
): void {
  // Clear canvas with white background
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width * scale, height * scale);
  ctx.restore();

  // Draw all strokes
  for (const stroke of state.strokes) {
    drawStroke(ctx, stroke, scale);
  }
}

// Add stroke to state and return updated state
export function addStroke(
  state: CanvasState,
  stroke: DrawingStroke,
  userId: string
): CanvasState {
  const operation: DrawOperation = {
    type: 'add',
    stroke,
    userId,
    timestamp: Date.now(),
  };

  return {
    strokes: [...state.strokes, stroke],
    undoStack: [...state.undoStack, operation],
    redoStack: [], // Clear redo stack on new action
  };
}

// Undo last operation (globally)
export function undoOperation(
  state: CanvasState,
  userId: string
): CanvasState {
  if (state.undoStack.length === 0) return state;

  const lastOperation = state.undoStack[state.undoStack.length - 1];
  const newUndoStack = state.undoStack.slice(0, -1);

  let newStrokes = state.strokes;
  if (lastOperation.type === 'add' && lastOperation.stroke) {
    newStrokes = state.strokes.filter(s => s.id !== lastOperation.stroke!.id);
  }

  const undoOp: DrawOperation = {
    type: 'undo',
    stroke: lastOperation.stroke,
    userId,
    timestamp: Date.now(),
  };

  return {
    strokes: newStrokes,
    undoStack: newUndoStack,
    redoStack: [...state.redoStack, undoOp],
  };
}

// Redo last undone operation
export function redoOperation(
  state: CanvasState,
  userId: string
): CanvasState {
  if (state.redoStack.length === 0) return state;

  const lastRedo = state.redoStack[state.redoStack.length - 1];
  const newRedoStack = state.redoStack.slice(0, -1);

  let newStrokes = state.strokes;
  let newUndoStack = state.undoStack;

  if (lastRedo.stroke) {
    newStrokes = [...state.strokes, lastRedo.stroke];
    newUndoStack = [...state.undoStack, {
      type: 'add' as const,
      stroke: lastRedo.stroke,
      userId,
      timestamp: Date.now(),
    }];
  }

  return {
    strokes: newStrokes,
    undoStack: newUndoStack,
    redoStack: newRedoStack,
  };
}

// Clear canvas
export function clearCanvas(userId: string): CanvasState {
  return {
    strokes: [],
    undoStack: [],
    redoStack: [],
  };
}

// Create initial state
export function createInitialState(): CanvasState {
  return {
    strokes: [],
    undoStack: [],
    redoStack: [],
  };
}

// Serialize drawing event for network transmission
export function serializeDrawEvent(
  eventType: 'stroke_start' | 'stroke_update' | 'stroke_end' | 'undo' | 'redo' | 'clear',
  data: Partial<DrawingStroke & { userId: string }>
): string {
  return JSON.stringify({
    type: eventType,
    data,
    timestamp: Date.now(),
  });
}

// Batch points for efficient network transmission
export function batchPoints(points: Point[], batchSize = 5): Point[][] {
  const batches: Point[][] = [];
  for (let i = 0; i < points.length; i += batchSize) {
    batches.push(points.slice(i, i + batchSize));
  }
  return batches;
}
