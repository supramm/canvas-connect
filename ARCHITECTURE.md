
# Architecture Overview

This document explains how Canvas Connect handles real-time drawing, state synchronization, and multi-user interactions. The design prioritizes responsiveness and simplicity over heavy consistency models.

---

## Data Flow Diagram

User drawing actions are streamed as incremental point updates rather than complete canvas snapshots.

Flow:

User Input (Mouse / Pointer Events)  
→ Local Canvas Rendering  
→ Serialize Stroke Points  
→ WebSocket Emit  
→ Server Broadcast  
→ Other Clients Render Points  

Each client renders its own input immediately (optimistic rendering) and applies remote updates as they arrive.

---

## WebSocket Protocol

The application uses WebSockets to stream drawing data between connected clients.

### Outgoing Events (Client → Server)

- `stroke:start`
```json
{
  "userId": "abc123",
  "color": "#ff0000",
  "width": 4,
  "point": { "x": 120, "y": 340 }
}
````

* `stroke:move`

```json
{
  "userId": "abc123",
  "point": { "x": 125, "y": 345 }
}
```

* `stroke:end`

```json
{
  "userId": "abc123"
}
```

* `cursor:move`

```json
{
  "userId": "abc123",
  "x": 410,
  "y": 220
}
```

### Incoming Events (Server → Client)

* `stroke:update`
* `cursor:update`
* `user:joined`
* `user:left`

The server does not modify drawing data; it only broadcasts events to keep latency low.

---

## Undo / Redo Strategy

Undo and redo operations are implemented at the stroke level.

* Each completed stroke is stored as an immutable object:

  ```
  { userId, color, width, points[] }
  ```
* All clients maintain the same ordered stroke history.
* Undo removes the most recent stroke globally.
* Redo reapplies the last undone stroke by replaying stored points.

This approach was chosen instead of bitmap snapshots to reduce memory usage and allow deterministic replays.

---

## Performance Decisions

Several optimizations were made to keep drawing smooth under real-time conditions:

* **Optimistic Rendering**: Local strokes are drawn immediately without waiting for server acknowledgment.
* **Point Batching**: Mouse move events are throttled and batched to reduce network traffic.
* **Incremental Rendering**: Only new points are drawn instead of re-rendering the entire canvas.
* **Stroke-Level History**: Undo/redo operates on stroke objects instead of full canvas states.

These choices trade strict consistency for responsiveness, which is critical for drawing applications.

---

## Conflict Resolution

Simultaneous drawing conflicts are handled by allowing overlapping strokes.

* No locking or region ownership is enforced.
* Stroke order is determined by arrival order at each client.
* Visual overlap is treated as a valid outcome.

This avoids blocking users and keeps the interaction fluid. In cases of minor ordering differences, the visual result remains acceptable for collaborative drawing.

---

## Design Trade-offs

* CRDTs and operational transforms were intentionally avoided due to complexity.
* The system favors low latency and simplicity over perfect ordering guarantees.
* Persistence is not implemented to keep the real-time pipeline lightweight.

These decisions align with the goal of building a responsive, understandable real-time canvas system.

```
