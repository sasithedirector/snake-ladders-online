import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

function HomePage() {
  const token = useAuthStore((s) => s.token);

  const features = [
    { icon: '🎲', title: 'Roll the Dice', desc: 'Classic 1-6 dice with smooth animations and sound effects' },
    { icon: '🐍', title: 'Watch Out for Snakes', desc: 'Land on a snake head and slide all the way down' },
    { icon: '🪜', title: 'Climb Ladders', desc: 'Find ladders to climb your way to the top faster' },
    { icon: '👥', title: '2-4 Players', desc: 'Play with friends in real-time multiplayer rooms' },
    { icon: '🏆', title: 'Leaderboards', desc: 'Climb the ranks and track your win streaks' },
    { icon: '📱', title: 'Responsive Design', desc: 'Play on desktop, tablet, or mobile seamlessly' }
  ];

  const steps = [
    { num: 1, title: 'Create Account', desc: 'Sign up to track your stats and rankings' },
    { num: 2, title: 'Create or Join Room', desc: 'Start a new game or use an invite code' },
    { num: 3, title: 'Wait for Players', desc: 'Need 2-4 players to begin the fun' },
    { num: 4, title: 'Play & Win!', desc: 'Roll dice, reach 100 first to claim victory' }
  ];

  return (
    <div>
      {/* Hero */}
      <motion.section
        className="hero"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1>🐍 Snake & Ladders Online</h1>
        <p>
          The classic board game reimagined for the web. Play with friends
          in real-time, climb ladders, avoid snakes, and race to 100!
        </p>
        <div className="hero-buttons">
          {token ? (
            <Link to="/lobby" className="btn btn-primary btn-large">
              🎮 Play Now
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary btn-large">
                🎮 Get Started
              </Link>
              <Link to="/login" className="btn btn-secondary btn-large">
                Login
              </Link>
            </>
          )}
          <Link to="/leaderboard" className="btn btn-secondary btn-large">
            🏆 Leaderboard
          </Link>
        </div>
      </motion.section>

      {/* How to Play */}
      <section style={{ marginTop: '3rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '2rem' }}>
          How to Play
        </h2>
        <div className="howto-grid">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              className="card howto-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.3 }}
            >
              <div className="howto-step-number">{step.num}</div>
              <h3>{step.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ marginTop: '3rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '2rem' }}>
          Features
        </h2>
        <div className="features-grid">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              className="card feature-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 + 0.5 }}
            >
              <div className="feature-icon">{feat.icon}</div>
              <h3>{feat.title}</h3>
              <p>{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
