/* main.js — vanilla JS for the memory game */
/* Configuration - change here if your images are different */
const CONFIG = {
  TOTAL_IMAGES: 50,         // how many images you have in images/
  IMAGE_PATH: 'img',        // folder where images live
  IMAGE_EXT: 'png',         // extension like 'png' or 'svg'
  PAIRS: 8,                 // how many unique images to pick (8 -> 16 cards)
  CARD_FLIP_DELAY: 700      // ms delay when two cards don't match
};

/* ---- game state ---- */
let deck = [];           // array of {id, src, cardId}
let flipped = [];        // currently flipped card elements
let matchedCount = 0;
let moves = 0;
let timerInterval = null;
let startTime = null;
let locked = false;

/* DOM refs */
const board = document.getElementById('board');
const movesEl = document.getElementById('moves');
const timerEl = document.getElementById('timer');
const bestEl = document.getElementById('best');
const restartBtn = document.getElementById('restartBtn');
const hintBtn = document.getElementById('hintBtn');

/* Helpers */
function fmtTime(seconds){
  const m = Math.floor(seconds / 60).toString().padStart(2,'0');
  const s = (seconds % 60).toString().padStart(2,'0');
  return `${m}:${s}`;
}
function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* Build a deck: pick PAIRS unique ids from 1..TOTAL_IMAGES, duplicate and shuffle */
function buildDeck(){
  const ids = Array.from({length: CONFIG.TOTAL_IMAGES}, (_,i) => i+1);
  shuffle(ids);
  const chosen = ids.slice(0, CONFIG.PAIRS);
  const pairItems = chosen.flatMap(id => {
    const src = `${CONFIG.IMAGE_PATH}/Icon${id}.${CONFIG.IMAGE_EXT}`;
    return [{id, src, uid: `${id}-a`}, {id, src, uid: `${id}-b`}];
  });
  deck = shuffle(pairItems);
}

/* Render board */
function renderBoard(){
  board.innerHTML = '';
  deck.forEach((cardData, idx) => {
    const card = document.createElement('button');
    card.className = 'card focus:outline-none';
    card.setAttribute('data-uid', cardData.uid);
    card.setAttribute('data-id', cardData.id);
    card.setAttribute('aria-label', 'Memory card');
    card.setAttribute('tabindex', '0');

    card.innerHTML = `
      <div class="card-inner">
        <div class="card-face card-front dark:bg-[#111827]">
          <!-- front: ornamental back of card -->
          <div class="flex flex-col items-center justify-center text-center p-4">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 2 L15 8 L22 9 L17 14 L18 21 L12 18 L6 21 L7 14 L2 9 L9 8 Z" fill="currentColor" opacity="0.06"/>
              <path d="M12 2 L15 8 L22 9 L17 14 L18 21 L12 18 L6 21 L7 14 L2 9 L9 8 Z" stroke="rgba(202,163,74,0.9)" stroke-width="0.6" stroke-linejoin="round" fill="none" />
            </svg>
          </div>
        </div>
        <div class="card-face card-back">
          <img src="${cardData.src}" alt="sigil ${cardData.id}" loading="lazy" />
        </div>
      </div>
    `;
    // click and keyboard
    card.addEventListener('click', () => onCardClick(card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onCardClick(card);
      }
    });

    board.appendChild(card);
  });
}

/* Timer */
function startTimer(){
  if (timerInterval) return;
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const secs = Math.floor((Date.now() - startTime) / 1000);
    timerEl.textContent = fmtTime(secs);
  }, 500);
}
function stopTimer(){
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

/* Move and best score */
function setMoves(n){
  moves = n;
  movesEl.textContent = moves;
}
function updateBest(){
  const prev = JSON.parse(localStorage.getItem('df_memory_best') || 'null');
  const timeSecs = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
  const candidate = {moves, time: timeSecs, date: new Date().toISOString().slice(0,10)};
  // better if fewer moves, tie-breaker faster time
  let better = false;
  if (!prev) better = true;
  else if (candidate.moves < prev.moves) better = true;
  else if (candidate.moves === prev.moves && candidate.time < prev.time) better = true;

  if (better) {
    localStorage.setItem('df_memory_best', JSON.stringify(candidate));
    showBest(candidate);
  }
}
function showBest(obj){
  if (!obj){
    const prev = JSON.parse(localStorage.getItem('df_memory_best') || 'null');
    if (!prev) { bestEl.textContent = '—'; return; }
    obj = prev;
  }
  bestEl.textContent = `${obj.moves} / ${fmtTime(obj.time)}`;
}

/* Card interaction */
function onCardClick(card){
  if (locked) return;
  if (card.classList.contains('is-flipped') || card.classList.contains('matched')) return;

  // start timer on first flip
  if (!startTime) startTimer();

  // flip
  card.classList.add('is-flipped');
  flipped.push(card);

  if (flipped.length === 2){
    locked = true;
    setMoves(moves + 1);

    const [a, b] = flipped;
    const ida = a.getAttribute('data-id');
    const idb = b.getAttribute('data-id');

    if (ida === idb){
      // match
      a.classList.add('matched');
      b.classList.add('matched');
      matchedCount += 2;
      flipped = [];
      locked = false;

      // check win
      if (matchedCount === CONFIG.PAIRS * 2){
        stopTimer();
        updateBest();
        setTimeout(() => {
          // small celebration
          alert(`You won! Moves: ${moves} • Time: ${timerEl.textContent}`);
        }, 300);
      }
    } else {
      // not match - flip back after delay
      setTimeout(() => {
        a.classList.remove('is-flipped');
        b.classList.remove('is-flipped');
        flipped = [];
        locked = false;
      }, CONFIG.CARD_FLIP_DELAY);
    }
  }
}

/* Restart / Reset */
function resetGame(){
  stopTimer();
  startTime = null;
  timerEl.textContent = '00:00';
  setMoves(0);
  matchedCount = 0;
  flipped = [];
  locked = false;
  buildDeck();
  renderBoard();
  showBest();
}

/* Hint: briefly reveal all unmatched cards */
function showHint(){
  const cards = Array.from(board.querySelectorAll('.card')).filter(c => !c.classList.contains('matched') && !c.classList.contains('is-flipped'));
  if (cards.length === 0) return;
  locked = true;
  cards.forEach(c => c.classList.add('is-flipped'));
  setTimeout(() => {
    cards.forEach(c => c.classList.remove('is-flipped'));
    locked = false;
  }, 900);
}

/* Init */
document.addEventListener('DOMContentLoaded', () => {
  // wire buttons
  restartBtn.addEventListener('click', resetGame);
  hintBtn.addEventListener('click', showHint);

  // small UX: allow pressing R to restart
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'r') resetGame();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') { e.preventDefault(); showHint(); }
  });

  // start
  buildDeck();
  renderBoard();
  showBest();
});
