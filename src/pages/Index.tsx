import React, { useState, useMemo } from 'react';
import { CollaborativeCanvas } from '@/components/canvas/CollaborativeCanvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Users, Zap, ArrowRight } from 'lucide-react';

// Generate unique user ID
function generateUserId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Generate room ID
function generateRoomId(): string {
  const words = ['canvas', 'draw', 'art', 'create', 'paint', 'sketch'];
  const word = words[Math.floor(Math.random() * words.length)];
  const number = Math.floor(Math.random() * 1000);
  return `${word}-${number}`;
}

export default function Index() {
  const [roomId, setRoomId] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [inputRoomId, setInputRoomId] = useState('');

  const userId = useMemo(() => generateUserId(), []);

  const handleCreateRoom = () => {
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    setIsJoined(true);
  };

  const handleJoinRoom = () => {
    if (inputRoomId.trim()) {
      setRoomId(inputRoomId.trim());
      setIsJoined(true);
    }
  };

  if (isJoined) {
    return <CollaborativeCanvas roomId={roomId} userId={userId} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
          <Zap className="w-4 h-4" />
          <span className="text-sm font-medium">Real-time Collaboration</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 tracking-tight">
          Draw Together,
          <br />
          <span className="text-primary">In Real-Time</span>
        </h1>
        
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          A collaborative canvas where multiple users can draw simultaneously. 
          See changes as they happen.
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-2xl w-full">
        {/* Create Room Card */}
        <div className="glass-panel rounded-2xl p-6 hover:border-primary/50 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
            <Pencil className="w-6 h-6 text-primary" />
          </div>
          
          <h2 className="text-xl font-semibold text-foreground mb-2">Create New Canvas</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Start a fresh canvas and invite others to join.
          </p>
          
          <Button onClick={handleCreateRoom} className="w-full" size="lg">
            Create Canvas
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Join Room Card */}
        <div className="glass-panel rounded-2xl p-6 hover:border-primary/50 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-accent" />
          </div>
          
          <h2 className="text-xl font-semibold text-foreground mb-2">Join Existing Canvas</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Enter a room ID to join an existing session.
          </p>
          
          <div className="flex gap-2">
            <Input
              placeholder="Enter room ID..."
              value={inputRoomId}
              onChange={(e) => setInputRoomId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              className="flex-1"
            />
            <Button onClick={handleJoinRoom} disabled={!inputRoomId.trim()}>
              Join
            </Button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl w-full text-center">
        {[
          { label: 'Real-time Sync', icon: '⚡' },
          { label: 'Multiple Users', icon: '👥' },
          { label: 'Undo/Redo', icon: '↩️' },
          { label: 'Live Cursors', icon: '🎯' },
        ].map((feature) => (
          <div key={feature.label} className="p-4 rounded-xl bg-secondary/50">
            <div className="text-2xl mb-2">{feature.icon}</div>
            <div className="text-sm text-muted-foreground">{feature.label}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-sm text-muted-foreground">
        <p>Built with React, Canvas API & Lovable Cloud Realtime</p>
      </footer>
    </div>
  );
}
