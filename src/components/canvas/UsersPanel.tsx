import React from 'react';
import { Users, Wifi, WifiOff } from 'lucide-react';
import { User } from '@/hooks/useDrawingState';
import { Badge } from '@/components/ui/badge';

interface UsersPanelProps {
  users: User[];
  currentUserId: string;
  isConnected: boolean;
}

export function UsersPanel({ users, currentUserId, isConnected }: UsersPanelProps) {
  return (
    <div className="floating-toolbar flex items-center gap-2">
      {/* Connection status */}
      <div className="flex items-center gap-1.5 px-2">
        {isConnected ? (
          <Wifi className="w-4 h-4 text-green-500" />
        ) : (
          <WifiOff className="w-4 h-4 text-destructive" />
        )}
        <span className="text-xs text-muted-foreground">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Separator */}
      <div className="w-px h-4 bg-border" />

      {/* Users list */}
      <div className="flex items-center gap-1.5 px-2">
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{users.length + 1}</span>
      </div>

      {/* User avatars */}
      <div className="flex items-center -space-x-2">
        {/* Current user */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 border-card"
          style={{ backgroundColor: 'hsl(200, 90%, 50%)' }}
          title="You"
        >
          You
        </div>

        {/* Other users */}
        {users.map((user) => (
          <div
            key={user.id}
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 border-card relative"
            style={{ backgroundColor: user.color }}
            title={user.name}
          >
            {user.name.slice(0, 1)}
            {user.isDrawing && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-card" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
