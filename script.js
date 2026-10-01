/* =============================================================
   STACK THE GUESS — starter kit
   =============================================================
   Everything to do with rendering the card pile (positioning,
   click-to-select, swipe-to-cycle) is already wired up for you
   in the CardStack class below. You don't need to touch it.

   Your two jobs are marked "TODO (Student Task N)". Search for
   that text to find them. Everything else in this file just
   calls into the two functions you'll write.
   ============================================================= */

/* -------------------------------------------------------------
   Config
------------------------------------------------------------- */

// A style is picked at random each time a card is added, so the
// pile ends up visually mixed. Full style list: dicebear.com/styles
const DICEBEAR_STYLES = [
  "bottts",
  "adventurer",
  "big-ears",
  "croodles",
  "fun-emoji",
  "icons",
  "identicon",
  "pixel-art",
  "shapes",
  "rings",
  "thumbs",
];

// Programming-flavoured word bank. Add your own if you like —
// just keep everything lowercase, letters only.
const WORD_BANK = [
  "kernel", "cipher", "socket", "buffer", "daemon",
  "thread", "vector", "syntax", "router", "compiler",
  "runtime", "pointer", "closure", "variable", "iterator",
];

/* -------------------------------------------------------------
   DOM references
------------------------------------------------------------- */

const canvasEl = document.getElementById("canvas");
const emptyStateEl = document.getElementById("emptyState");
const tableEl = document.querySelector(".table");
const hintDisplayEl = document.getElementById("hintDisplay");
const guessForm = document.getElementById("guessForm");
const guessInput = document.getElementById("guessInput");
const feedbackEl = document.getElementById("feedback");
const statWrongEl = document.getElementById("statWrong");
const statCardsEl = document.getElementById("statCards");
const btnNewWord = document.getElementById("btnNewWord");
const btnHelp = document.getElementById("btnHelp");
const btnCloseHelp = document.getElementById("btnCloseHelp");
const helpBackdrop = document.getElementById("helpBackdrop");

/* -------------------------------------------------------------
   CardStack — provided for you. Renders one card per wrong
   guess, stacked with a random tilt/offset. Click a card to
   bring it to the front with a little flourish. Swipe (or
   click-drag) the pile left/right to cycle which card is on
   top, the way you'd flick through a hand of cards.
------------------------------------------------------------- */

class CardStack {
  constructor(canvas) {
    this.canvas = canvas;
    this.cards = []; // { id, el }
    this._nextId = 0;
    this._bindSwipe();
  }

  push(svgMarkup) {
    const id = this._nextId++;
    const el = document.createElement("div");
    el.className = "card";
    el.dataset.id = String(id);
    el.innerHTML = svgMarkup;

    // Random tilt/offset baked in as CSS custom properties so the
    // "selected" state can invert just the rotation, not replace it.
    el.style.setProperty("--rot", `${(Math.random() * 18 - 9).toFixed(2)}deg`);
    el.style.setProperty("--dx", `${(Math.random() * 22 - 11).toFixed(1)}px`);
    el.style.setProperty("--dy", `${(Math.random() * 16 - 8).toFixed(1)}px`);

    el.addEventListener("click", () => this.select(id));

    this.canvas.appendChild(el);
    this.cards.push({ id, el });
    this._restack();
    this._toggleEmptyState();
    return id;
  }

  select(id) {
    this.cards.forEach((c) => c.el.classList.remove("is-selected"));
    const card = this.cards.find((c) => c.id === id);
    if (!card) return;
    card.el.classList.add("is-selected");

    // Move to the end of the array = top of the visual stack.
    this.cards = this.cards.filter((c) => c.id !== id);
    this.cards.push(card);
    this._restack();
  }

  cycle(direction) {
    // direction: "forward" sends the top card to the back,
    // "backward" brings the back card to the front.
    if (this.cards.length < 2) return;
    if (direction === "forward") {
      const top = this.cards.pop();
      this.cards.unshift(top);
    } else {
      const back = this.cards.shift();
      this.cards.push(back);
    }
    this._restack();
  }

  clear() {
    this.cards.forEach((c) => c.el.remove());
    this.cards = [];
    this._toggleEmptyState();
  }

  get size() {
    return this.cards.length;
  }

  _restack() {
    this.cards.forEach((c, i) => {
      c.el.style.zIndex = String(i);
    });
  }

  _toggleEmptyState() {
    emptyStateEl.classList.toggle("is-hidden", this.cards.length > 0);
  }

  _bindSwipe() {
    let startX = null;
    let dragging = false;

    const start = (x) => {
      startX = x;
      dragging = true;
    };
    const end = (x) => {
      if (!dragging || startX === null) return;
      const delta = x - startX;
      const THRESHOLD = 40;
      if (delta <= -THRESHOLD) this.cycle("forward");
      else if (delta >= THRESHOLD) this.cycle("backward");
      dragging = false;
      startX = null;
    };

    this.canvas.addEventListener("pointerdown", (e) => start(e.clientX));
    window.addEventListener("pointerup", (e) => end(e.clientX));
    this.canvas.addEventListener("touchstart", (e) => start(e.touches[0].clientX), { passive: true });
    window.addEventListener("touchend", (e) => end(e.changedTouches[0].clientX), { passive: true });
  }
}

const stack = new CardStack(canvasEl);

async function fetchAvatarSVG(seed, style) {
  const svgUrl = `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`
  const response = await fetch(encodeURI(svgUrl), {
    method: "GET",
    headers: {
      "Content-Type": "image/svg+xml"
    }
  })
  
  if (!response.ok) {
    throw new Error("You are not okay!")
  }

  return response.text()
}

function computeHintLength(guess, target, currentHintLength) {
  if (currentHintLength === 0) return 1
  for (let i = 0; i < target.length; i++) {
    if (guess[i] != target[i]) return i + 1
  }
  return currentHintLength + 1
}

/* -------------------------------------------------------------
   Game state + flow — provided for you
------------------------------------------------------------- */

const state = {
  target: "",
  hintLength: 0,
  wrongGuesses: 0,
};

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function newRound() {
  state.target = pickRandom(WORD_BANK);
  state.hintLength = 0;
  state.wrongGuesses = 0;
  stack.clear();
  tableEl.classList.remove("is-won");
  updateHud();
  renderHint();
  setFeedback("", null);
  guessInput.disabled = false;
  guessInput.value = "";
  guessInput.focus();
}

function updateHud() {
  statWrongEl.textContent = String(state.wrongGuesses);
  statCardsEl.textContent = String(stack.size);
}

function renderHint() {
  const revealed = state.target.slice(0, state.hintLength);
  const blanks = state.target.length - state.hintLength;
  const revealedSpan = revealed
    ? `<span class="revealed">${revealed.toUpperCase()}</span>`
    : "";
  const blankSpan = blanks > 0
    ? `<span class="blank">${" _".repeat(blanks).trim()}</span>`
    : "";
  hintDisplayEl.innerHTML = [revealedSpan, blankSpan].filter(Boolean).join(" ");
}

function setFeedback(message, kind) {
  feedbackEl.textContent = message;
  feedbackEl.className = "feedback" + (kind ? ` is-${kind}` : "");
}

async function handleWrongGuess(guess) {
  state.wrongGuesses += 1;
  state.hintLength = computeHintLength(guess, state.target, state.hintLength);
  updateHud();
  renderHint();

  const style = pickRandom(DICEBEAR_STYLES);
  try {
    const svgMarkup = await fetchAvatarSVG(guess, style);
    stack.push(svgMarkup);
    updateHud();
    setFeedback("Not quite — a new card joins the pile.", "wrong");
  } catch (err) {
    console.error(err);
    setFeedback("Couldn't fetch that card — check your connection and try again.", "error");
  }
}

function handleWin() {
  tableEl.classList.add("is-won");
  setFeedback(`Solved it! "${state.target}" — took ${state.wrongGuesses} wrong guess(es).`, "win");
  guessInput.disabled = true;
}

guessForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const raw = guessInput.value.trim().toLowerCase();
  if (!raw) return;
  guessInput.value = "";

  if (raw === state.target) {
    handleWin();
    return;
  }
  handleWrongGuess(raw);
});

btnNewWord.addEventListener("click", newRound);

btnHelp.addEventListener("click", () => { helpBackdrop.hidden = false; });
btnCloseHelp.addEventListener("click", () => { helpBackdrop.hidden = true; });
helpBackdrop.addEventListener("click", (e) => {
  if (e.target === helpBackdrop) helpBackdrop.hidden = true;
});

newRound();