'use client';

import { COLOR_HEX } from '@/data/deck';
import styles from './Card.module.css';

// Компонент карты 2×2
// Используется в руке игрока и на игровом поле
export default function Card({
  card,
  size = 60,        // размер одной ячейки в px
  selected = false,
  ghost = false,     // полупрозрачный призрак для превью
  onClick,
}) {
  const total = size * 2;

  return (
    <div
      className={`${styles.card} ${selected ? styles.selected : ''} ${ghost ? styles.ghost : ''}`}
      style={{ width: total, height: total }}
      onClick={onClick}
    >
      {/* TL — левый верхний */}
      <div
        className={styles.cell}
        style={{
          width: size,
          height: size,
          backgroundColor: COLOR_HEX[card.colors.tl],
          top: 0,
          left: 0,
        }}
      />
      {/* TR — правый верхний */}
      <div
        className={styles.cell}
        style={{
          width: size,
          height: size,
          backgroundColor: COLOR_HEX[card.colors.tr],
          top: 0,
          left: size,
        }}
      />
      {/* BL — левый нижний */}
      <div
        className={styles.cell}
        style={{
          width: size,
          height: size,
          backgroundColor: COLOR_HEX[card.colors.bl],
          top: size,
          left: 0,
        }}
      />
      {/* BR — правый нижний */}
      <div
        className={styles.cell}
        style={{
          width: size,
          height: size,
          backgroundColor: COLOR_HEX[card.colors.br],
          top: size,
          left: size,
        }}
      />
    </div>
  );
}
