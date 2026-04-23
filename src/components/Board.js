'use client';

import { useRef, useState, useCallback, useLayoutEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { COLOR_HEX } from '@/data/deck';
import styles from './Board.module.css';

const CELL = 60; // размер одной ячейки в px

export default function Board() {
  const placedCards = useGameStore((s) => s.placedCards);
  const validPlacements = useGameStore((s) => s.validPlacements);
  const selectedCardIndex = useGameStore((s) => s.selectedCardIndex);
  const players = useGameStore((s) => s.players);
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex);
  const lastMoveScore = useGameStore((s) => s.lastMoveScore);
  const placeCard = useGameStore((s) => s.placeCard);

  // Выбранная карта для ghost-превью
  const selectedCard =
    selectedCardIndex !== null
      ? players[currentPlayerIndex]?.hand[selectedCardIndex]
      : null;

  // === PAN & ZOOM ===
  const containerRef = useRef(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOrigin = useRef({ x: 0, y: 0 });

  // Hover-позиция для ghost-превью
  const [hoverSlot, setHoverSlot] = useState(null);

  // Центрирование при первом рендере
  const initialized = useRef(false);
  useLayoutEffect(() => {
    if (!initialized.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // Центрируем так, чтобы (0,0) карта была примерно в центре экрана
      setPan({
        x: rect.width / 2 - CELL,
        y: rect.height / 2 - CELL,
      });
      initialized.current = true;
    }
  }, []);

  // Popup очков — уникальный ключ для перезапуска CSS-анимации
  const popupKey = placedCards.length;

  // --- ОБРАБОТЧИКИ МЫШИ ---
  const handleMouseDown = useCallback((e) => {
    // Только ЛКМ
    if (e.button !== 0) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY };
    panOrigin.current = { ...pan };
  }, [pan]);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setPan({
      x: panOrigin.current.x + dx,
      y: panOrigin.current.y + dy,
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setZoom((z) => {
      const next = z * (e.deltaY < 0 ? 1.1 : 0.9);
      return Math.max(0.3, Math.min(3, next));
    });
  }, []);

  // Клик по валидной позиции — размещаем карту
  const handleSlotClick = useCallback(
    (x, y, e) => {
      e.stopPropagation();
      if (selectedCard) {
        placeCard(x, y);
      }
    },
    [selectedCard, placeCard]
  );

  // Конвертация игровых координат в экранные пиксели
  // y инвертируется: в игре y вверх, на экране y вниз
  const toScreen = (gx, gy) => ({
    left: gx * CELL,
    top: -gy * CELL,
  });

  return (
    <div
      ref={containerRef}
      className={styles.boardContainer}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Трансформируемый слой */}
      <div
        className={styles.transformLayer}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {/* Размещённые карты */}
        {placedCards.map((card) => {
          const { left, top } = toScreen(card.x, card.y);
          return (
            <div
              key={card.id}
              className={styles.placedCard}
              style={{
                left,
                top,
                width: CELL * 2,
                height: CELL * 2,
              }}
            >
              <div className={styles.placedCell} style={{ width: CELL, height: CELL, top: 0, left: 0, backgroundColor: COLOR_HEX[card.colors.tl] }} />
              <div className={styles.placedCell} style={{ width: CELL, height: CELL, top: 0, left: CELL, backgroundColor: COLOR_HEX[card.colors.tr] }} />
              <div className={styles.placedCell} style={{ width: CELL, height: CELL, top: CELL, left: 0, backgroundColor: COLOR_HEX[card.colors.bl] }} />
              <div className={styles.placedCell} style={{ width: CELL, height: CELL, top: CELL, left: CELL, backgroundColor: COLOR_HEX[card.colors.br] }} />
            </div>
          );
        })}

        {/* Валидные позиции (показываем, только если выбрана карта) */}
        {selectedCard &&
          validPlacements.map(({ x, y }) => {
            const { left, top } = toScreen(x, y);
            return (
              <div
                key={`slot-${x}-${y}`}
                className={styles.validSlot}
                style={{
                  left,
                  top,
                  width: CELL * 2,
                  height: CELL * 2,
                }}
                onClick={(e) => handleSlotClick(x, y, e)}
                onMouseEnter={() => setHoverSlot({ x, y })}
                onMouseLeave={() => setHoverSlot(null)}
              />
            );
          })}

        {/* Ghost-превью карты при наведении */}
        {selectedCard && hoverSlot && (
          <div
            className={styles.ghostPreview}
            style={{
              left: toScreen(hoverSlot.x, hoverSlot.y).left,
              top: toScreen(hoverSlot.x, hoverSlot.y).top,
              width: CELL * 2,
              height: CELL * 2,
            }}
          >
            <div className={styles.ghostCell} style={{ width: CELL, height: CELL, top: 0, left: 0, backgroundColor: COLOR_HEX[selectedCard.colors.tl] }} />
            <div className={styles.ghostCell} style={{ width: CELL, height: CELL, top: 0, left: CELL, backgroundColor: COLOR_HEX[selectedCard.colors.tr] }} />
            <div className={styles.ghostCell} style={{ width: CELL, height: CELL, top: CELL, left: 0, backgroundColor: COLOR_HEX[selectedCard.colors.bl] }} />
            <div className={styles.ghostCell} style={{ width: CELL, height: CELL, top: CELL, left: CELL, backgroundColor: COLOR_HEX[selectedCard.colors.br] }} />
          </div>
        )}
      </div>

      {/* Popup очков */}
      {lastMoveScore && (
        <div key={popupKey} className={styles.scorePopup}>
          +{lastMoveScore.score}
        </div>
      )}

      <div className={styles.hint}>
        Колёсико — масштаб, перетаскивание — перемещение
      </div>
    </div>
  );
}
