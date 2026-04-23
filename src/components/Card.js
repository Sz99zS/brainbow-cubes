'use client';

import { COLOR_HEX } from '@/data/deck';
import styles from './Card.module.css';

// Компонент карты 2×2 с прямоугольными ячейками
// Используется в руке игрока (Hand) — размеры передаются через пропсы
export default function Card({
  card,
  cellWidth = 70,    // ширина одной ячейки в px
  cellHeight = 50,   // высота одной ячейки в px
  selected = false,
  onClick,
}) {
  const totalW = cellWidth * 2;
  const totalH = cellHeight * 2;

  return (
    <div
      className={`${styles.card} ${selected ? styles.selected : ''}`}
      style={{ width: totalW, height: totalH }}
      onClick={onClick}
    >
      {/* TL — левый верхний */}
      <div
        className={styles.cell}
        style={{
          width: cellWidth,
          height: cellHeight,
          backgroundColor: COLOR_HEX[card.colors.tl],
          top: 0,
          left: 0,
        }}
      />
      {/* TR — правый верхний */}
      <div
        className={styles.cell}
        style={{
          width: cellWidth,
          height: cellHeight,
          backgroundColor: COLOR_HEX[card.colors.tr],
          top: 0,
          left: cellWidth,
        }}
      />
      {/* BL — левый нижний */}
      <div
        className={styles.cell}
        style={{
          width: cellWidth,
          height: cellHeight,
          backgroundColor: COLOR_HEX[card.colors.bl],
          top: cellHeight,
          left: 0,
        }}
      />
      {/* BR — правый нижний */}
      <div
        className={styles.cell}
        style={{
          width: cellWidth,
          height: cellHeight,
          backgroundColor: COLOR_HEX[card.colors.br],
          top: cellHeight,
          left: cellWidth,
        }}
      />
    </div>
  );
}
