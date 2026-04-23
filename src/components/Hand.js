'use client';

import { useGameStore } from '@/store/useGameStore';
import Card from './Card';
import styles from './Hand.module.css';

export default function Hand() {
  const players = useGameStore((s) => s.players);
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex);
  const selectedCardIndex = useGameStore((s) => s.selectedCardIndex);
  const selectCard = useGameStore((s) => s.selectCard);
  const deselectCard = useGameStore((s) => s.deselectCard);

  const player = players[currentPlayerIndex];
  if (!player) return null;

  const handleClick = (index) => {
    if (selectedCardIndex === index) {
      deselectCard();
    } else {
      selectCard(index);
    }
  };

  return (
    <div className={styles.handContainer}>
      <span className={styles.handLabel}>Рука</span>
      <div className={styles.cards}>
        {player.hand.length === 0 ? (
          <span className={styles.emptyHand}>Нет карт</span>
        ) : (
          player.hand.map((card, i) => (
            <Card
              key={card.id}
              card={card}
              size={48}
              selected={selectedCardIndex === i}
              onClick={() => handleClick(i)}
            />
          ))
        )}
      </div>
    </div>
  );
}
