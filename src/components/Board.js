'use client';

import { useRef, useState, useCallback, useLayoutEffect } from 'react';
import { useGameStore, checkValidMove } from '@/store/useGameStore';
import { COLOR_HEX } from '@/data/deck';
import styles from './Board.module.css';

// Размеры одной ячейки в пикселях (прямоугольная, вытянута по горизонтали)
// Карта 2×2 = 130×100 px
const CW = 70; // ширина ячейки
const CH = 50; // высота ячейки

// Порог в пикселях: если мышь сдвинулась меньше — это клик, иначе — перетаскивание
const DRAG_THRESHOLD = 5;

export default function Board() {
  const placedCards = useGameStore((s) => s.placedCards);
  const cells = useGameStore((s) => s.cells);
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
  // Суммарное расстояние drag'а — для отличия клика от перетаскивания
  const dragDistance = useRef(0);

  // === GHOST: позиция призрака в игровых координатах ===
  const [ghostPos, setGhostPos] = useState(null); // { gx, gy, valid }

  // Центрирование при первом рендере — сдвигаем так, чтобы карта (0,0) была в центре экрана
  const initialized = useRef(false);
  useLayoutEffect(() => {
    if (!initialized.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPan({
        x: rect.width / 2 - CW,  // половина ширины карты
        y: rect.height / 2 - CH,  // половина высоты карты
      });
      initialized.current = true;
    }
  }, []);

  // Popup очков — уникальный ключ для перезапуска CSS-анимации
  const popupKey = placedCards.length;

  // --- Конвертация пикселей мыши → игровых координат ---
  // Привязка к сетке с шагом в 1 ячейку, курсор в центре карты 2×2
  // Ось X привязывается по CW, ось Y — по CH (разные шаги!)
  const mouseToGrid = useCallback(
    (clientX, clientY) => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();

      // Позиция на экране → позиция внутри трансформ-слоя
      const layerX = (clientX - rect.left - pan.x) / zoom;
      const layerY = (clientY - rect.top - pan.y) / zoom;

      // Привязываем к сетке; смещаем на -1, чтобы курсор был в центре карты 2×2
      // toScreen: left = gx * CW, top = -gy * CH
      const gx = Math.round(layerX / CW) - 1;
      const gy = -(Math.round(layerY / CH) - 1);

      return { gx, gy };
    },
    [pan, zoom]
  );

  // --- ОБРАБОТЧИКИ МЫШИ ---
  const handleMouseDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      isPanning.current = true;
      dragDistance.current = 0;
      panStart.current = { x: e.clientX, y: e.clientY };
      panOrigin.current = { ...pan };
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e) => {
      // --- Перетаскивание поля ---
      if (isPanning.current) {
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        dragDistance.current = Math.max(dragDistance.current, Math.abs(dx) + Math.abs(dy));
        setPan({
          x: panOrigin.current.x + dx,
          y: panOrigin.current.y + dy,
        });
      }

      // --- Ghost-превью: обновляем позицию при каждом движении мыши ---
      if (selectedCard) {
        const grid = mouseToGrid(e.clientX, e.clientY);
        if (grid) {
          // Проверяем валидность позиции через экспортированную чистую функцию
          const valid = checkValidMove(cells, grid.gx, grid.gy);
          setGhostPos({ gx: grid.gx, gy: grid.gy, valid });
        }
      }
    },
    [selectedCard, cells, mouseToGrid]
  );

  const handleMouseUp = useCallback(
    (e) => {
      const wasDragging = dragDistance.current > DRAG_THRESHOLD;
      isPanning.current = false;

      // Если это был клик (не перетаскивание) и есть выбранная карта — ставим!
      if (!wasDragging && selectedCard && ghostPos?.valid) {
        placeCard(ghostPos.gx, ghostPos.gy);
        setGhostPos(null);
      }
    },
    [selectedCard, ghostPos, placeCard]
  );

  // При уходе мыши с поля — скрываем ghost
  const handleMouseLeave = useCallback(() => {
    isPanning.current = false;
    setGhostPos(null);
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setZoom((z) => {
      const next = z * (e.deltaY < 0 ? 1.1 : 0.9);
      return Math.max(0.3, Math.min(3, next));
    });
  }, []);

  // Конвертация игровых координат → экранные пиксели
  // X масштабируется по CW, Y по CH (и инвертируется: в игре y вверх, на экране y вниз)
  const toScreen = (gx, gy) => ({
    left: gx * CW,
    top: -gy * CH,
  });

  return (
    <div
      ref={containerRef}
      className={`${styles.boardContainer} ${selectedCard ? styles.placingMode : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
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
              style={{ left, top, width: CW * 2, height: CH * 2 }}
            >
              {/* Ячейки: ширина = CW, высота = CH, смещения соответственно */}
              <div className={styles.placedCell} style={{ width: CW, height: CH, top: 0, left: 0, backgroundColor: COLOR_HEX[card.colors.tl] }} />
              <div className={styles.placedCell} style={{ width: CW, height: CH, top: 0, left: CW, backgroundColor: COLOR_HEX[card.colors.tr] }} />
              <div className={styles.placedCell} style={{ width: CW, height: CH, top: CH, left: 0, backgroundColor: COLOR_HEX[card.colors.bl] }} />
              <div className={styles.placedCell} style={{ width: CW, height: CH, top: CH, left: CW, backgroundColor: COLOR_HEX[card.colors.br] }} />
            </div>
          );
        })}

        {/* Ghost-превью: следует за мышью, привязан к сетке с шагом 1 ячейка */}
        {selectedCard && ghostPos && (
          <div
            className={`${styles.ghostPreview} ${ghostPos.valid ? styles.ghostValid : styles.ghostInvalid}`}
            style={{
              left: toScreen(ghostPos.gx, ghostPos.gy).left,
              top: toScreen(ghostPos.gx, ghostPos.gy).top,
              width: CW * 2,
              height: CH * 2,
            }}
          >
            <div className={styles.ghostCell} style={{ width: CW, height: CH, top: 0, left: 0, backgroundColor: COLOR_HEX[selectedCard.colors.tl] }} />
            <div className={styles.ghostCell} style={{ width: CW, height: CH, top: 0, left: CW, backgroundColor: COLOR_HEX[selectedCard.colors.tr] }} />
            <div className={styles.ghostCell} style={{ width: CW, height: CH, top: CH, left: 0, backgroundColor: COLOR_HEX[selectedCard.colors.bl] }} />
            <div className={styles.ghostCell} style={{ width: CW, height: CH, top: CH, left: CW, backgroundColor: COLOR_HEX[selectedCard.colors.br] }} />
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
        {selectedCard
          ? 'Наведи и кликни, чтобы поставить карту'
          : 'Колёсико — масштаб, перетаскивание — перемещение'}
      </div>
    </div>
  );
}
