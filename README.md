# Labyrinth: The Algorithmic Escape

Welcome to **Labyrinth: The Algorithmic Escape**, a full-stack educational roguelite game designed to teach real-time pathfinding algorithms in an interactive and visually engaging environment. 

Navigate complex, procedurally generated mazes, evade AI-driven ghosts, and learn how various classic pathfinding algorithms operate under the hood with a post-run algorithm inspector and automated autoplay modes!

## 🌟 Features

* **Procedural Maze Generation**: Every level is generated dynamically using Depth-First Search (DFS) or other maze-generation techniques.
* **AI Ghost Logic**: Evade ghosts that hunt you down using real-time pathfinding via WebSockets.
* **Algorithm Inspector**: Post-run analysis allowing players to visually inspect how different algorithms resolved paths.
* **Interactive Mechanics**: Unique environmental features like "slow zones" that dynamically interact with pathfinding costs and attract ghosts.
* **Seed-Based Progression**: Play through specific generated seeds for consistent, run-based progression.
* **AI Autoplay Mode**: Watch an AI automatically traverse the maze and find the optimal path to showcase theoretical efficiency.

## 🧠 Featured Algorithms
* **Breadth-First Search (BFS)**
* **Dijkstra's Algorithm**
* **A* Search Algorithm**
* **Greedy Best-First Search**
* **Bellman-Ford Algorithm**

## 🛠️ Technology Stack

### Backend
* **Node.js & Express**: High-performance API and static file serving.
* **Socket.io**: Real-time bidirectional communication for live ghost AI and multiplayer features.
* **SQLite (better-sqlite3)**: Lightweight, fast database to store leaderboards and run statistics.
* **TypeScript**: For robust, type-safe robust server development.

### Frontend
* **React 18 & Vite**: Lightning-fast, modern component-based UI.
* **TailwindCSS**: Utility-first CSS framework for beautiful and responsive styling.
* **Shadcn UI & Radix UI**: High-quality, accessible interactive UI components.
* **Socket.io-client**: Synchronizes game state and AI logic with the Node backend.
* **TypeScript**: Strong typing extending from the backend to the client.

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/en/) (v18+ recommended)
* `npm` or `bun`

### Installation
1. Clone the repository or extract the project.
2. Install dependencies for both the frontend and backend:
   ```bash
   cd backend
   npm install

   cd ../frontend
   npm install
   ```

### Running the Application

You can launch both the frontend and backend simultaneously using the provided batch file:

**Windows**:
```cmd
start.bat
```
*(This will automatically start both the Express backend and the Vite frontend dev server in separate command prompts).*

Alternatively, you can start them manually:

**Backend**:
```bash
cd backend
npm run dev
```

**Frontend**:
```bash
cd frontend
npm run dev
```

The frontend should now be running at `http://localhost:5173/` (by default Vite port), and the backend API should be running on its configured port.

## 📖 How to Play
1. Start the game via your browser.
2. Move through the maze using your keyboard (Arrow Keys or WASD).
3. Reach the exit before the pathfinding ghosts catch you!
4. Analyze your run and learn how the underlying pathfinding algorithms calculated the routes.

## 📝 License
This project is licensed under the ISC License.
