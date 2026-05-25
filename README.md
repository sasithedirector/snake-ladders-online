# 🐍 Snake & Ladders Online

A real-time multiplayer Snake and Ladders board game built with React, Node.js, Express, Socket.IO, and MongoDB.

## Features

- **2-4 Player Multiplayer** — Create rooms, share invite codes, play with friends
- **Real-time Gameplay** — Socket.IO powered live dice rolls, token movement, and turn management
- **JWT Authentication** — Secure login/signup with stats tracking
- **100-Cell Board** — Classic Snake and Ladders with boustrophedon layout
- **Snake & Ladder Logic** — Automatic movement with visual indicators
- **Match History** — Games saved to MongoDB with full game logs
- **Leaderboards** — Global rankings by wins and win streaks
- **Sound Effects** — Web Audio API generated sounds for dice, snakes, ladders, and wins
- **Responsive UI** — Works on desktop, tablet, and mobile
- **Token Animations** — Framer Motion powered smooth token movement
- **Disconnect/Reconnect** — Graceful handling of player disconnections
- **In-game Chat** — Real-time messaging between players

## Tech Stack

| Layer       | Technology                    |
|-------------|-------------------------------|
| Frontend    | React 18, Vite, Framer Motion |
| State       | Zustand                       |
| Backend     | Node.js, Express              |
| Real-time   | Socket.IO                     |
| Auth        | JWT (jsonwebtoken)            |
| Database    | MongoDB (Mongoose)            |
| Styling     | CSS3 Custom Properties        |

## Project Structure

```
snake-ladders-online/
├── backend/
│   ├── src/
│   │   ├── server.js           # Express + Socket.IO server entry
│   │   ├── config/
│   │   │   └── db.js           # MongoDB connection
│   │   ├── models/
│   │   │   ├── User.js         # User schema with stats
│   │   │   └── MatchHistory.js # Match history schema
│   │   ├── routes/
│   │   │   ├── auth.js         # /api/auth (register, login, me)
│   │   │   └── stats.js        # /api/stats (leaderboard, matches, profile)
│   │   ├── middleware/
│   │   │   └── auth.js         # JWT verification middleware
│   │   ├── socket/
│   │   │   └── index.js        # Socket.IO event handlers
│   │   └── game/
│   │       ├── engine.js       # Game logic (dice, snakes, ladders)
│   │       └── roomManager.js  # Room class and manager functions
│   ├── .env                    # Environment variables
│   ├── .env.example            # Example environment file
│   └── package.json
├── client/
│   ├── src/
│   │   ├── main.jsx            # React entry point
│   │   ├── App.jsx             # Root component with routing
│   │   ├── index.css           # Global styles
│   │   ├── store/
│   │   │   ├── authStore.js    # Auth state (Zustand)
│   │   │   └── gameStore.js    # Game state (Zustand)
│   │   ├── hooks/
│   │   │   └── useSocket.js    # Socket.IO client hook
│   │   ├── utils/
│   │   │   ├── api.js          # REST API functions
│   │   │   ├── sounds.js       # Web Audio API sound effects
│   │   │   └── boardUtils.js   # Board position calculations
│   │   ├── components/
│   │   │   ├── Navbar.jsx      # Navigation bar
│   │   │   ├── GameBoard.jsx   # 10x10 game board with tokens
│   │   │   ├── DiceRoller.jsx  # Dice display and roll button
│   │   │   ├── PlayerList.jsx  # Player list sidebar
│   │   │   ├── ChatBox.jsx     # In-game chat
│   │   │   ├── TurnIndicator.jsx # Current turn display
│   │   │   ├── WinnerModal.jsx # Winner announcement modal
│   │   │   └── WaitingRoom.jsx # Pre-game waiting room
│   │   └── pages/
│   │       ├── HomePage.jsx        # Landing page
│   │       ├── LoginPage.jsx       # Login form
│   │       ├── RegisterPage.jsx    # Registration form
│   │       ├── LobbyPage.jsx       # Room creation/joining
│   │       ├── GamePage.jsx        # Main game page
│   │       ├── StatsPage.jsx       # User stats & history
│   │       └── LeaderboardPage.jsx # Global leaderboard
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── package.json                # Root package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone and Install

```bash
# Install all dependencies (root, frontend, backend)
cd snake-ladders-online
npm run install:all
```

Or install manually:

```bash
cd snake-ladders-online/backend && npm install
cd ../frontend && npm install
```

### 2. Environment Configuration

The backend `.env` file is already configured for local development:

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/snake-ladders
JWT_SECRET=dev-jwt-secret-not-for-production
CLIENT_URL=http://localhost:5173
```

**For production**, create a proper `.env` with:
- A strong `JWT_SECRET`
- Your MongoDB Atlas URI
- Your production `CLIENT_URL`

### 3. Start MongoDB

Make sure MongoDB is running locally:

```bash
mongod --dbpath /path/to/data
```

Or use MongoDB Atlas and update the `MONGODB_URI`.

### 4. Run Development

```bash
# From the root directory — runs both frontend and backend
npm run dev
```

Or run separately:

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/api/health

### 5. Build for Production

```bash
# Build frontend
cd frontend && npm run build

# Start backend (serves frontend from dist/)
cd backend && NODE_ENV=production npm start
```

## Socket.IO Event Architecture

### Client → Server Events

| Event            | Data                    | Description              |
|------------------|-------------------------|--------------------------|
| `create-room`    | `{ isPrivate }`         | Create a new game room   |
| `join-room`      | `{ inviteCode }`        | Join by invite code      |
| `join-room-by-id`| `{ roomId }`            | Join by room ID          |
| `leave-room`     | `{}`                    | Leave current room       |
| `start-game`     | `{}`                    | Start game (host only)   |
| `roll-dice`      | `{}`                    | Roll dice (your turn)    |
| `get-game-state` | `{ roomId? }`           | Get current room state   |
| `get-board-data` | `{}`                    | Get board configuration  |
| `send-message`   | `{ text }`              | Send chat message        |
| `get-public-rooms` | `{}`                  | List public rooms        |

### Server → Client Events

| Event                    | Description                    |
|--------------------------|--------------------------------|
| `player-joined`          | New player joined the room     |
| `player-left`            | Player left the room           |
| `player-disconnected`    | Player disconnected            |
| `game-started`           | Game has started               |
| `dice-rolled`            | Dice was rolled, move made     |
| `game-over`              | Game ended, winner declared    |
| `turn-changed`           | Turn advanced to next player   |
| `new-message`            | New chat message received      |
| `public-rooms-updated`   | Public rooms list changed      |

## API Routes

### Auth (`/api/auth`)
- `POST /api/auth/register` — Create account `{ username, email, password }`
- `POST /api/auth/login` — Login `{ email, password }`
- `GET /api/auth/me` — Get current user (requires auth)

### Stats (`/api/stats`)
- `GET /api/stats/leaderboard?limit=20` — Global leaderboard
- `GET /api/stats/matches?page=1` — Match history (requires auth)
- `GET /api/stats/profile` — User profile + stats (requires auth)

### Health
- `GET /api/health` — Server status check

## Board Configuration

### Ladders
| Start | End |
|-------|-----|
| 2     | 38  |
| 7     | 14  |
| 8     | 31  |
| 15    | 26  |
| 21    | 42  |
| 28    | 84  |
| 36    | 44  |
| 51    | 67  |
| 71    | 91  |
| 78    | 98  |
| 87    | 94  |

### Snakes
| Head | Tail |
|------|------|
| 16   | 6    |
| 46   | 25   |
| 49   | 11   |
| 62   | 19   |
| 64   | 60   |
| 74   | 53   |
| 89   | 68   |
| 92   | 88   |
| 95   | 75   |
| 99   | 80   |

## Game Rules

1. Players take turns rolling a 6-sided dice
2. Tokens move forward by the dice value
3. Landing on a ladder bottom — climb to the top
4. Landing on a snake head — slide to the tail
5. Must land **exactly** on cell 100 to win
6. Rolling over 100 means you stay in place
7. Player with the highest position wins if others disconnect

## License

MIT
