import { create } from 'zustand';
import { generateDeck } from '@/data/deck';

// =============================================
// ЧИСТЫЕ ФУНКЦИИ ИГРОВОГО ДВИЖКА
// =============================================

// Перемешивание массива (алгоритм Фишера-Йетса)
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Координаты 4 ячеек карты по её якорной точке (левый верхний угол)
// TL = (x, y), TR = (x+1, y), BL = (x, y-1), BR = (x+1, y-1)
function getCardCells(x, y) {
  return [
    { cx: x, cy: y, pos: 'tl' },
    { cx: x + 1, cy: y, pos: 'tr' },
    { cx: x, cy: y - 1, pos: 'bl' },
    { cx: x + 1, cy: y - 1, pos: 'br' },
  ];
}

// Получить цвет ячейки из сетки (или undefined)
function getCell(cells, x, y) {
  return cells[x]?.[y];
}

// === BFS: обход связной группы одного цвета ===
// Возвращает Set строк "x,y" — все ячейки в группе
function bfs(cells, startX, startY, color) {
  const visited = new Set();
  const queue = [[startX, startY]];
  const key = (x, y) => `${x},${y}`;
  visited.add(key(startX, startY));

  while (queue.length > 0) {
    const [x, y] = queue.shift();
    // Проверяем 4 ортогональных соседа
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      const k = key(nx, ny);
      if (!visited.has(k) && getCell(cells, nx, ny) === color) {
        visited.add(k);
        queue.push([nx, ny]);
      }
    }
  }

  return visited;
}

// === ПОДСЧЁТ ОЧКОВ за размещение карты ===
// cells — сетка УЖЕ с новыми ячейками
// newCellPositions — массив [x, y] новых 4 ячеек
function calculateScore(cells, newCellPositions) {
  const newKeys = new Set(newCellPositions.map(([x, y]) => `${x},${y}`));
  const scoredCells = new Set(); // чтобы не считать одну группу дважды
  let totalScore = 0;

  for (const [x, y] of newCellPositions) {
    const cellKey = `${x},${y}`;
    if (scoredCells.has(cellKey)) continue;

    const color = getCell(cells, x, y);

    // Проверяем: есть ли у этой новой ячейки СТАРЫЙ сосед того же цвета?
    let connectsToExisting = false;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      const nk = `${nx},${ny}`;
      // Сосед НЕ из текущей карты И того же цвета
      if (!newKeys.has(nk) && getCell(cells, nx, ny) === color) {
        connectsToExisting = true;
        break;
      }
    }

    if (!connectsToExisting) continue;

    // BFS — находим всю связную группу этого цвета
    const group = bfs(cells, x, y, color);

    // Помечаем все ячейки группы как подсчитанные
    for (const k of group) {
      scoredCells.add(k);
    }

    totalScore += group.size;
  }

  return totalScore;
}

// === ПРОВЕРКА ВАЛИДНОСТИ ХОДА ===
// Можно ли разместить карту 2×2 с якорем в (x, y)?
function isValidMove(cells, x, y) {
  const cardCells = getCardCells(x, y);

  // 1. Все 4 ячейки должны быть свободны
  for (const { cx, cy } of cardCells) {
    if (getCell(cells, cx, cy) !== undefined) return false;
  }

  // 2. Хотя бы одна ячейка карты должна граничить с уже занятой ячейкой
  const cardKeys = new Set(cardCells.map(({ cx, cy }) => `${cx},${cy}`));

  for (const { cx, cy } of cardCells) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx;
      const ny = cy + dy;
      // Сосед не из этой же карты и занят
      if (!cardKeys.has(`${nx},${ny}`) && getCell(cells, nx, ny) !== undefined) {
        return true;
      }
    }
  }

  return false;
}

// === ПОИСК ВСЕХ ВАЛИДНЫХ ПОЗИЦИЙ для размещения ===
function findValidPlacements(cells) {
  const validPositions = [];
  const checked = new Set();

  // Обходим все занятые ячейки, ищем пустых соседей
  for (const xStr in cells) {
    const x = parseInt(xStr);
    for (const yStr in cells[x]) {
      const y = parseInt(yStr);

      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (getCell(cells, nx, ny) !== undefined) continue; // занята

        // Пустая соседняя ячейка (nx, ny) может быть частью карты в 4 вариантах:
        // TL → якорь (nx, ny)
        // TR → якорь (nx-1, ny)
        // BL → якорь (nx, ny+1)
        // BR → якорь (nx-1, ny+1)
        const anchors = [
          [nx, ny],
          [nx - 1, ny],
          [nx, ny + 1],
          [nx - 1, ny + 1],
        ];

        for (const [ax, ay] of anchors) {
          const key = `${ax},${ay}`;
          if (checked.has(key)) continue;
          checked.add(key);

          if (isValidMove(cells, ax, ay)) {
            validPositions.push({ x: ax, y: ay });
          }
        }
      }
    }
  }

  return validPositions;
}

// Записать 4 ячейки карты в копию сетки (иммутабельно)
function writeCellsToGrid(cells, card, x, y) {
  const newCells = { ...cells };
  for (const { cx, cy, pos } of getCardCells(x, y)) {
    if (!newCells[cx]) newCells[cx] = {};
    else newCells[cx] = { ...newCells[cx] };
    newCells[cx][cy] = card.colors[pos];
  }
  return newCells;
}

// =============================================
// ZUSTAND STORE
// =============================================
export const useGameStore = create((set, get) => ({
  // --- Фаза игры ---
  phase: 'setup', // 'setup' | 'playing' | 'finished'

  // --- Игроки ---
  players: [],           // [{ id, name, score, hand: [card] }]
  currentPlayerIndex: 0,

  // --- Колода ---
  deck: [],

  // --- Поле ---
  placedCards: [],  // [{ ...card, x, y }] — для отрисовки
  cells: {},        // { [x]: { [y]: color } } — для логики и проверок

  // --- UI состояние ---
  selectedCardIndex: null,  // индекс карты в руке текущего игрока
  validPlacements: [],      // [{ x, y }] — куда можно положить карту
  lastMoveScore: null,      // { score, playerName } — для показа набранных очков
  consecutivePasses: 0,     // счётчик пропусков подряд (для определения конца игры)

  // ========================
  // ДЕЙСТВИЯ
  // ========================

  // Начать новую игру с заданными именами игроков
  initGame: (playerNames) => {
    let deck = shuffle(generateDeck());

    // Первая карта — в центр поля (0 очков, просто стартовая)
    const firstCard = deck[0];
    deck = deck.slice(1);

    const cells = writeCellsToGrid({}, firstCard, 0, 0);
    const placedCards = [{ ...firstCard, x: 0, y: 0 }];

    // Раздаём по 5 карт каждому игроку
    const players = playerNames.map((name, i) => ({
      id: i,
      name,
      score: 0,
      hand: deck.slice(i * 5, i * 5 + 5),
    }));
    deck = deck.slice(playerNames.length * 5);

    set({
      phase: 'playing',
      players,
      currentPlayerIndex: 0,
      deck,
      placedCards,
      cells,
      selectedCardIndex: null,
      validPlacements: findValidPlacements(cells),
      lastMoveScore: null,
      consecutivePasses: 0,
    });
  },

  // Выбрать карту из руки текущего игрока
  selectCard: (index) => {
    const { players, currentPlayerIndex } = get();
    const hand = players[currentPlayerIndex].hand;
    if (index < 0 || index >= hand.length) return;
    set({ selectedCardIndex: index });
  },

  // Снять выделение
  deselectCard: () => {
    set({ selectedCardIndex: null });
  },

  // Положить выбранную карту на поле в позицию (x, y)
  placeCard: (x, y) => {
    const state = get();
    const { cells, players, currentPlayerIndex, selectedCardIndex, deck } = state;

    if (selectedCardIndex === null) return;

    const player = players[currentPlayerIndex];
    const card = player.hand[selectedCardIndex];

    // Финальная проверка валидности
    if (!isValidMove(cells, x, y)) return;

    // 1. Записываем ячейки в сетку
    const newCells = writeCellsToGrid(cells, card, x, y);

    // 2. Считаем очки за этот ход
    const newCellPositions = getCardCells(x, y).map(({ cx, cy }) => [cx, cy]);
    const moveScore = calculateScore(newCells, newCellPositions);

    // 3. Обновляем руку: убираем сыгранную карту, добираем из колоды
    const newHand = player.hand.filter((_, i) => i !== selectedCardIndex);
    let newDeck = [...deck];
    if (newDeck.length > 0) {
      newHand.push(newDeck[0]);
      newDeck = newDeck.slice(1);
    }

    // 4. Обновляем данные игрока
    const newPlayers = players.map((p, i) =>
      i === currentPlayerIndex
        ? { ...p, score: p.score + moveScore, hand: newHand }
        : p
    );

    // 5. Добавляем карту на поле
    const newPlacedCards = [...state.placedCards, { ...card, x, y }];

    // 6. Следующий игрок
    const nextPlayerIndex = (currentPlayerIndex + 1) % newPlayers.length;
    const newValidPlacements = findValidPlacements(newCells);

    // 7. Проверка окончания игры
    const allHandsEmpty = newPlayers.every((p) => p.hand.length === 0);
    const noMoves = newValidPlacements.length === 0;
    const gameOver = (newDeck.length === 0 && allHandsEmpty) || noMoves;

    set({
      cells: newCells,
      placedCards: newPlacedCards,
      players: newPlayers,
      deck: newDeck,
      currentPlayerIndex: nextPlayerIndex,
      selectedCardIndex: null,
      validPlacements: newValidPlacements,
      lastMoveScore: moveScore > 0
        ? { score: moveScore, playerName: player.name }
        : null,
      consecutivePasses: 0,
      phase: gameOver ? 'finished' : 'playing',
    });
  },

  // Пропустить ход
  skipTurn: () => {
    const { players, currentPlayerIndex, consecutivePasses } = get();
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    const newPasses = consecutivePasses + 1;

    // Все игроки подряд пропустили → конец игры
    if (newPasses >= players.length) {
      set({ phase: 'finished', consecutivePasses: newPasses });
      return;
    }

    set({
      currentPlayerIndex: nextPlayerIndex,
      selectedCardIndex: null,
      lastMoveScore: null,
      consecutivePasses: newPasses,
    });
  },

  // Получить победителя
  getWinner: () => {
    const { players, phase } = get();
    if (phase !== 'finished' || players.length === 0) return null;
    return players.reduce((best, p) => (p.score > best.score ? p : best), players[0]);
  },

  // Вернуться к экрану настройки
  resetGame: () => {
    set({
      phase: 'setup',
      players: [],
      currentPlayerIndex: 0,
      deck: [],
      placedCards: [],
      cells: {},
      selectedCardIndex: null,
      validPlacements: [],
      lastMoveScore: null,
      consecutivePasses: 0,
    });
  },
}));
