import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DrawingStroke, Point, CanvasState } from '@/lib/canvas-engine';

interface SyncMessage {
  type: 'stroke_start' | 'stroke_update' | 'stroke_end' | 'undo' | 'redo' | 'clear' | 'cursor_move' | 'user_join' | 'user_leave' | 'sync_state';
  userId: string;
  data?: unknown;
  timestamp: number;
}

interface SyncCallbacks {
  onRemoteStroke: (stroke: DrawingStroke) => void;
  onRemoteUndo: () => void;
  onRemoteRedo: () => void;
  onRemoteClear: () => void;
  onRemoteCursor: (userId: string, position: Point, isDrawing: boolean) => void;
  onUserJoin: (user: { id: string; name: string; color: string }) => void;
  onUserLeave: (userId: string) => void;
  onSyncState: (state: CanvasState) => void;
}

export function useCanvasSync(
  roomId: string,
  userId: string,
  callbacks: SyncCallbacks
) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const pendingStrokeRef = useRef<DrawingStroke | null>(null);

  // Broadcast a message to the room
  const broadcast = useCallback((message: Omit<SyncMessage, 'timestamp'>) => {
    if (!channelRef.current) return;
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'drawing',
      payload: { ...message, timestamp: Date.now() },
    });
  }, []);

  // Send stroke start
  const sendStrokeStart = useCallback((stroke: DrawingStroke) => {
    pendingStrokeRef.current = stroke;
    broadcast({
      type: 'stroke_start',
      userId,
      data: {
        id: stroke.id,
        tool: stroke.tool,
        color: stroke.color,
        strokeWidth: stroke.strokeWidth,
        points: stroke.points,
      },
    });
  }, [broadcast, userId]);

  // Send stroke update (batched points)
  const sendStrokeUpdate = useCallback((points: Point[]) => {
    if (!pendingStrokeRef.current) return;
    broadcast({
      type: 'stroke_update',
      userId,
      data: {
        id: pendingStrokeRef.current.id,
        points,
      },
    });
  }, [broadcast, userId]);

  // Send stroke end
  const sendStrokeEnd = useCallback((stroke: DrawingStroke) => {
    broadcast({
      type: 'stroke_end',
      userId,
      data: stroke,
    });
    pendingStrokeRef.current = null;
  }, [broadcast, userId]);

  // Send cursor position
  const sendCursorPosition = useCallback((position: Point, isDrawing: boolean) => {
    broadcast({
      type: 'cursor_move',
      userId,
      data: { position, isDrawing },
    });
  }, [broadcast, userId]);

  // Send undo
  const sendUndo = useCallback(() => {
    broadcast({ type: 'undo', userId });
  }, [broadcast, userId]);

  // Send redo
  const sendRedo = useCallback(() => {
    broadcast({ type: 'redo', userId });
  }, [broadcast, userId]);

  // Send clear
  const sendClear = useCallback(() => {
    broadcast({ type: 'clear', userId });
  }, [broadcast, userId]);

  // Connect to room
  useEffect(() => {
    const channel = supabase.channel(`canvas:${roomId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: userId },
      },
    });

    channel
      .on('broadcast', { event: 'drawing' }, ({ payload }) => {
        const message = payload as SyncMessage;
        if (message.userId === userId) return; // Ignore own messages

        switch (message.type) {
          case 'stroke_end':
            callbacks.onRemoteStroke(message.data as DrawingStroke);
            break;
          case 'undo':
            callbacks.onRemoteUndo();
            break;
          case 'redo':
            callbacks.onRemoteRedo();
            break;
          case 'clear':
            callbacks.onRemoteClear();
            break;
          case 'cursor_move': {
            const { position, isDrawing } = message.data as { position: Point; isDrawing: boolean };
            callbacks.onRemoteCursor(message.userId, position, isDrawing);
            break;
          }
          case 'user_join':
            callbacks.onUserJoin(message.data as { id: string; name: string; color: string });
            break;
          case 'user_leave':
            callbacks.onUserLeave(message.userId);
            break;
          case 'sync_state':
            callbacks.onSyncState(message.data as CanvasState);
            break;
        }
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        (newPresences as Array<{ user_id?: string }>).forEach((presence) => {
          if (presence.user_id && presence.user_id !== userId) {
            callbacks.onUserJoin({
              id: presence.user_id,
              name: `User ${presence.user_id.slice(0, 4)}`,
              color: 'hsl(200, 90%, 50%)',
            });
          }
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        (leftPresences as Array<{ user_id?: string }>).forEach((presence) => {
          if (presence.user_id) {
            callbacks.onUserLeave(presence.user_id);
          }
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setConnectionError(null);
          
          // Track presence
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          });
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setConnectionError('Connection lost. Trying to reconnect...');
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [roomId, userId, callbacks]);

  return {
    isConnected,
    connectionError,
    sendStrokeStart,
    sendStrokeUpdate,
    sendStrokeEnd,
    sendCursorPosition,
    sendUndo,
    sendRedo,
    sendClear,
  };
}
