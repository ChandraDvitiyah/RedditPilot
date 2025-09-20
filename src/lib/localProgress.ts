// Local storage helper for persisting per-project task completion with TTL (1 year)

const PREFIX = 'rp_timeline_progress_v1';
const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

type Stored = {
  timestamp: number;
  data: Record<string, boolean>; // taskId -> completed
};

export function makeKey(projectId: string) {
  return `${PREFIX}:${projectId}`;
}

export function loadProgress(projectId: string): Record<string, boolean> | null {
  try {
    const raw = localStorage.getItem(makeKey(projectId));
    if (!raw) return null;
    const parsed: Stored = JSON.parse(raw);
    if (!parsed || !parsed.timestamp) return null;
    if (Date.now() - parsed.timestamp > ONE_YEAR_MS) {
      // expired
      localStorage.removeItem(makeKey(projectId));
      return null;
    }
    return parsed.data || null;
  } catch (e) {
    console.error('Failed to load local progress', e);
    return null;
  }
}

export function saveProgress(projectId: string, data: Record<string, boolean>) {
  try {
    const stored: Stored = {
      timestamp: Date.now(),
      data
    };
    localStorage.setItem(makeKey(projectId), JSON.stringify(stored));
  } catch (e) {
    console.error('Failed to save local progress', e);
  }
}

export function clearProgress(projectId: string) {
  try {
    localStorage.removeItem(makeKey(projectId));
  } catch (e) {
    console.error('Failed to clear local progress', e);
  }
}
