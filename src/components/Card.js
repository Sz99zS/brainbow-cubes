'use client';

import { COLOR_HEX } from '@/data/deck';
import styles from './Card.module.css';

// Компонент карты 2×2 с прямоугольными ячейками.
// Поддерживает анимацию переворота: пока flipping=true, на корне проигрывается
// CSS-keyframe cardFlip. По завершении вызывается onFlipEnd — именно в этот
// момент родитель должен свапнуть цвета в store (TL↔BR, TR↔BL).
export default function Card({
  card,
  cellWidth = 70,
  cellHeight = 50,
  selected = false,
  flipping = false,
  onClick,
  onFlipEnd,
}) {
  const totalW = cellWidth * 2;
  const totalH = cellHeight * 2;

  // onAnimationEnd всплывает и от дочерних элементов, поэтому проверяем,
  // что событие именно от корня карты. И что мы действительно в состоянии flipping —
  // это защищает от случайных повторных срабатываний.
  const handleAnimationEnd = (e) => {
    if (e.target !== e.currentTarget) return;
    if (!flipping) return;
    if (onFlipEnd) onFlipEnd();
  };

  const className = [
    styles.card,
    selected ? styles.selected : '',
    flipping ? styles.flipping : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={className}
      style={{ width: totalW, height: totalH }}
      onClick={onClick}
      onAnimationEnd={handleAnimationEnd}
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
