'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import styles from './GameSetup.module.css';

export default function GameSetup() {
  const initGame = useGameStore((s) => s.initGame);
  const [playerCount, setPlayerCount] = useState(2);
  const [names, setNames] = useState(['', '', '', '']);

  const handleNameChange = (i, value) => {
    const next = [...names];
    next[i] = value;
    setNames(next);
  };

  const handleStart = () => {
    // Берём имена по количеству игроков, заполняем пустые
    const playerNames = names.slice(0, playerCount).map(
      (n, i) => n.trim() || `Игрок ${i + 1}`
    );
    initGame(playerNames);
  };

  const allReady = true; // имена необязательны, заполнятся автоматически

  return (
    <div className={styles.setupContainer}>
      <h1 className={styles.logo}>Brainbow Cubes</h1>
      <p className={styles.subtitle}>Цифровая настольная игра</p>

      <div className={styles.setupCard}>
        <label className={styles.label}>Количество игроков</label>
        <div className={styles.playerCountRow}>
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              className={`${styles.countButton} ${playerCount === n ? styles.countButtonActive : ''}`}
              onClick={() => setPlayerCount(n)}
            >
              {n}
            </button>
          ))}
        </div>

        <label className={styles.label}>Имена</label>
        <div className={styles.nameInputs}>
          {Array.from({ length: playerCount }).map((_, i) => (
            <input
              key={i}
              className={styles.nameInput}
              type="text"
              placeholder={`Игрок ${i + 1}`}
              value={names[i]}
              onChange={(e) => handleNameChange(i, e.target.value)}
              maxLength={20}
            />
          ))}
        </div>

        <button
          className={styles.startButton}
          onClick={handleStart}
          disabled={!allReady}
        >
          Начать игру
        </button>
      </div>
    </div>
  );
}
