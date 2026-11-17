// Best-score storage for Lumenhold. localStorage only, fully guarded:
// private modes and sandboxed frames simply keep no record.

const KEY = 'lumenhold.best.v1';

export function loadBest() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.score !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveBest(record) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(record));
  } catch {
    // No storage available; the game plays on without it.
  }
}

export function recordRun(score, wavesCleared, won) {
  const best = loadBest();
  const record = { score, wavesCleared, won, at: Date.now() };
  if (!best || score > best.score) {
    saveBest(record);
    return { record, isNewBest: true };
  }
  return { record: best, isNewBest: false };
}
