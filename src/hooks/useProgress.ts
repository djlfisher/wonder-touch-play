import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "le_progress";

export interface WorldProgress {
  color: number;     // total taps
  shape: number;
  pattern: number;
  motion: number;
  music: number;
  number: number;    // highest count reached
  alphabet: number;  // unique letters discovered (0-26)
  colormix: number;  // unique mixes discovered
  animals: number;   // unique animals tapped (0-12)
}

const defaultProgress: WorldProgress = {
  color: 0, shape: 0, pattern: 0, motion: 0, music: 0,
  number: 0, alphabet: 0, colormix: 0, animals: 0,
};

const loadProgress = (): WorldProgress => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultProgress, ...JSON.parse(raw) };
  } catch {}
  return defaultProgress;
};

// Star thresholds per world
const STAR_THRESHOLDS: Record<keyof WorldProgress, number[]> = {
  color:    [10, 50, 200],
  shape:    [10, 50, 200],
  pattern:  [10, 50, 200],
  motion:   [10, 50, 200],
  music:    [10, 50, 200],
  number:   [5, 10, 20],
  alphabet: [8, 16, 26],
  colormix: [5, 10, 20],
  animals:  [4, 8, 12],
};

export const getStars = (world: keyof WorldProgress, value: number): number => {
  const thresholds = STAR_THRESHOLDS[world];
  if (value >= thresholds[2]) return 3;
  if (value >= thresholds[1]) return 2;
  if (value >= thresholds[0]) return 1;
  return 0;
};

export const useProgress = () => {
  const [progress, setProgress] = useState<WorldProgress>(loadProgress);

  const save = useCallback((updated: WorldProgress) => {
    setProgress(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const increment = useCallback((world: keyof WorldProgress, amount = 1) => {
    setProgress((prev) => {
      const updated = { ...prev, [world]: prev[world] + amount };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const setMax = useCallback((world: keyof WorldProgress, value: number) => {
    setProgress((prev) => {
      if (value <= prev[world]) return prev;
      const updated = { ...prev, [world]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addUnique = useCallback((world: keyof WorldProgress, _item: string, currentSet: Set<string>) => {
    setProgress((prev) => {
      const newCount = currentSet.size;
      if (newCount <= prev[world]) return prev;
      const updated = { ...prev, [world]: newCount };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { progress, increment, setMax, addUnique, getStars };
};
