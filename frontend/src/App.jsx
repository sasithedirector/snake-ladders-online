import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import StatsPage from './pages/StatsPage';
import LeaderboardPage from './pages/LeaderboardPage';

function App() {
  const token = useAuthStore((s) => s.token);

  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/lobby" element={token ? <LobbyPage /> : <LoginPage />} />
          <Route path="/game/:roomId" element={token ? <GamePage /> : <LoginPage />} />
          <Route path="/stats" element={token ? <StatsPage /> : <LoginPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
