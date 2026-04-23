'use client';

import { useGameStore } from '@/store/useGameStore';
import styles from './ScoreBoard.module.css';

export default function ScoreBoard() {
  const players = useGameStore((s) => s.players);
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex);
  const deck = useGameStore((s) => s.deck);
  const placedCards = useGameStore((s) => s.placedCards);
  const skipTurn = useGameStore((s) => s.skipTurn);
  const phase = useGameStore((s) => s.phase);

  return (
    <div className={styles.scoreBoard}>
      <div className={styles.title}>Игроки</div>

      {players.map((player, i) => (
        <div
          key={player.id}
          className={`${styles.playerRow} ${i === currentPlayerIndex && phase === 'playing' ? styles.active : ''}`}
        >
          <span className={styles.playerName}>
            {i === currentPlayerIndex && phase === 'playing' && (
              <span className={styles.turnDot} />
            )}
            {player.name}
          </span>
          <span className={styles.playerScore}>{player.score}</span>
        </div>
      ))}

      <div className={styles.gameInfo}>
        <div className={styles.infoRow}>
          <span>Колода</span>
          <span className={styles.infoValue}>{deck.length}</span>
        </div>
        <div className={styles.infoRow}>
          <span>На поле</span>
          <span className={styles.infoValue}>{placedCards.length}</span>
        </div>
      </div>

      {phase === 'playing' && (
        <button className={styles.skipButton} onClick={skipTurn}>
          Пропустить ход
        </button>
      )}
    </div>
  );
}
