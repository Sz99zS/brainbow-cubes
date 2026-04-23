'use client';

import { useCallback, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import Card from './Card';
import styles from './Hand.module.css';

export default function Hand() {
  const players = useGameStore((s) => s.players);
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex);
  const selectedCardIndex = useGameStore((s) => s.selectedCardIndex);
  const selectCard = useGameStore((s) => s.selectCard);
  const deselectCard = useGameStore((s) => s.deselectCard);
  const flipCardInHand = useGameStore((s) => s.flipCardInHand);

  // Индексы карт, для которых сейчас проигрывается CSS-анимация переворота.
  // Данные в store обновляются ТОЛЬКО когда карта «ложится» (onAnimationEnd) —
  // до этого момента store хранит исходные цвета, а на экране идёт движение.
  const [flippingIndices, setFlippingIndices] = useState(() => new Set());

  // Сброс "висящих" индексов при смене игрока — защита от случая, если ход
  // переключится, пока анимация ещё идёт. Делаем это через сравнение с
  // предыдущим значением (рекомендованный React-паттерн «storing info from
  // previous renders»), чтобы не плодить setState в useEffect.
  const [prevPlayerIndex, setPrevPlayerIndex] = useState(currentPlayerIndex);
  if (prevPlayerIndex !== currentPlayerIndex) {
    setPrevPlayerIndex(currentPlayerIndex);
    setFlippingIndices(new Set());
  }

  // Стабильный колбэк завершения анимации. Объявляем ДО early-return,
  // чтобы порядок хуков был одинаков при каждом рендере.
  // Здесь — и только здесь — мы свапаем цвета карты в store.
  // React 19 батчит оба setState в один коммит: убираем .flipping и меняем
  // данные одновременно, так что визуально нет кадра с «откатом» поворота.
  const handleFlipEnd = useCallback(
    (index) => {
      flipCardInHand(index);
      setFlippingIndices((prev) => {
        if (!prev.has(index)) return prev;
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    },
    [flipCardInHand]
  );

  const player = players[currentPlayerIndex];
  if (!player) return null;

  const anyFlipping = flippingIndices.size > 0;

  const handleClick = (index) => {
    // Во время анимации игнорируем клики по переворачивающейся карте
    if (flippingIndices.has(index)) return;
    if (selectedCardIndex === index) {
      deselectCard();
    } else {
      selectCard(index);
    }
  };

  // Запустить анимацию для одной выбранной карты
  const handleFlipSelected = () => {
    if (selectedCardIndex === null || anyFlipping) return;
    setFlippingIndices((prev) => {
      const next = new Set(prev);
      next.add(selectedCardIndex);
      return next;
    });
  };

  // Запустить анимацию синхронно для всех карт в руке.
  // Карты анимируются параллельно с одной и той же длительностью, поэтому
  // визуально переворот выглядит единым жестом.
  const handleFlipAll = () => {
    if (anyFlipping || player.hand.length === 0) return;
    setFlippingIndices(new Set(player.hand.map((_, i) => i)));
  };

  return (
    <div className={styles.handContainer}>
      <span className={styles.handLabel}>Рука</span>

      {/* Кнопка слева: перевернуть выбранную карту */}
      <button
        className={styles.flipBtn}
        onClick={handleFlipSelected}
        disabled={selectedCardIndex === null || anyFlipping}
        title="Перевернуть выбранную карту на 180°"
        type="button"
      >
        <span className={styles.flipIcon}>↻</span>
        <span className={styles.flipLabel}>Перевернуть</span>
      </button>

      <div className={styles.cards}>
        {player.hand.length === 0 ? (
          <span className={styles.emptyHand}>Нет карт</span>
        ) : (
          player.hand.map((card, i) => (
            <Card
              key={card.id}
              card={card}
              cellWidth={56}
              cellHeight={40}
              selected={selectedCardIndex === i}
              flipping={flippingIndices.has(i)}
              onClick={() => handleClick(i)}
              onFlipEnd={() => handleFlipEnd(i)}
            />
          ))
        )}
      </div>

      {/* Кнопка справа: перевернуть ВСЮ руку разом */}
      <button
        className={`${styles.flipBtn} ${styles.flipAllBtn}`}
        onClick={handleFlipAll}
        disabled={anyFlipping || player.hand.length === 0}
        title="Перевернуть все карты в руке на 180°"
        type="button"
      >
        <span className={styles.flipIcon}>↻</span>
        <span className={styles.flipLabel}>Все</span>
      </button>
    </div>
  );
}
