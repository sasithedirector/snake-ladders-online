import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

function Navbar() {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        🐍 Snake & Ladders
      </Link>

      <button
        className="navbar-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
        <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
        <Link to="/leaderboard" onClick={() => setMenuOpen(false)}>Leaderboard</Link>
        {token && (
          <>
            <Link to="/lobby" onClick={() => setMenuOpen(false)}>Play</Link>
            <Link to="/stats" onClick={() => setMenuOpen(false)}>Stats</Link>
            <span className="navbar-user">👤 {user?.username}</span>
            <button onClick={handleLogout}>Logout</button>
          </>
        )}
        {!token && (
          <>
            <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
            <Link to="/register" onClick={() => setMenuOpen(false)}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
