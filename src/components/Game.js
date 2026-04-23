'use client';

import { useGameStore } from '@/store/useGameStore';
import GameSetup from './GameSetup';
import Board from './Board';
import Hand from './Hand';
import ScoreBoard from './ScoreBoard';
import GameOver from './GameOver';
import styles from './Game.module.css';

export default function Game() {
  const phase = useGameStore((s) => s.phase);

  if (phase === 'setup') {
    return <GameSetup />;
  }

  return (
    <div className={styles.gameLayout}>
      <div className={styles.mainArea}>
        <ScoreBoard />
        <Board />
      </div>
      <Hand />
      {phase === 'finished' && <GameOver />}
    </div>
  );
}
