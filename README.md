
# Canvas Connect

Canvas Connect is a real-time collaborative drawing application that allows multiple users to draw simultaneously on a shared canvas. The focus of this project is on real-time synchronization, efficient canvas operations, and handling concurrent user interactions.

---

## Setup Instructions

### Prerequisites
- Node.js (v18 or later recommended)
- npm

### Steps to run locally

```bash
npm install
npm start
````

After starting, the app will be available at the local development URL shown in the terminal (usually `http://localhost:5173`).

---

## How to Test with Multiple Users

1. Open the app in one browser window or tab.
2. Open the same URL in:

   * Another tab, or
   * A different browser (Chrome + Firefox), or
   * An incognito/private window.
3. Start drawing in one window and observe:

   * Real-time stroke updates in other windows
   * Cursor movement indicators
   * Simultaneous drawing without blocking

This simulates multiple users connected to the same canvas session.

---

## Known Limitations / Bugs

* Canvas state is not persisted; refreshing the page clears the drawing.
* Global undo/redo is basic and not optimized for very large stroke histories.
* Performance may degrade if a large number of users draw simultaneously.
* No authentication or user identity beyond session-based assignment.
* Mobile touch support is limited and not fully optimized.

---

## Time Spent on the Project

Approximately **8–10 hours**, including:

* Initial canvas drawing implementation
* Real-time synchronization logic
* UI iteration and cleanup
* Testing with multiple concurrent sessions


