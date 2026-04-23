'use client';

import { useGameStore } from '@/store/useGameStore';
import styles from './GameOver.module.css';

export default function GameOver() {
  const players = useGameStore((s) => s.players);
  const resetGame = useGameStore((s) => s.resetGame);

  // Сортируем по убыванию очков
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.trophy}>&#127942;</div>
        <div className={styles.winnerTitle}>{winner.name}</div>
        <div className={styles.winnerSubtitle}>
          {winner.score} {declensionPoints(winner.score)}
        </div>

        <div className={styles.results}>
          {sorted.map((p, i) => (
            <div
              key={p.id}
              className={`${styles.resultRow} ${i === 0 ? styles.resultWinner : ''}`}
            >
              <span className={styles.resultName}>
                {i + 1}. {p.name}
              </span>
              <span className={styles.resultScore}>{p.score}</span>
            </div>
          ))}
        </div>

        <button className={styles.playAgain} onClick={resetGame}>
          Играть снова
        </button>
      </div>
    </div>
  );
}

// Склонение слова "очко" для русского языка
function declensionPoints(n) {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return 'очков';
  if (last > 1 && last < 5) return 'очка';
  if (last === 1) return 'очко';
  return 'очков';
}
