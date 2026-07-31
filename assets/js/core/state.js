/**
 * TrainLog application state
 *
 * This file stores the app's current data in memory. Permanent saving and
 * loading will be handled separately by core/storage.js.
 */

import { todayKey } from './helpers.js';

/**
 * Create a fresh copy of TrainLog's permanent data structure.
 *
 * Keep these original property names unchanged so existing data saved under
 * trainlog-data-v1 and existing backup files remain compatible.
 */
export function createDefaultState() {
  return {
    profile: {
      age: null,
      weight: null,
      unit: 'kg',
      favourites: [],
    },
    workouts: {},
    exercisePresets: {},
    bodyLogs: [],
  };
}

/**
 * Create the temporary interface state.
 *
 * These values control what the user is currently viewing. They are not part
 * of workout backups and do not need to be stored in localStorage.
 */
export function createDefaultUiState() {
  const now = new Date();

  return {
    tab: 'home',
    calYear: now.getFullYear(),
    calMonth: now.getMonth(),
    selectedDay: null,
    prSubTab: 'records',
    bodyRange: 'month',
    perfRange: 'month',
    perfExercise: null,
    importPreview: null,
    modal: null,

    // The date currently selected in the Workout tab.
    workoutDate: todayKey(),
  };
}

// The current permanent app data.
export let state = createDefaultState();

// The current temporary interface data.
export const ui = createDefaultUiState();

// Body-photo values loaded for the current browser session.
export const photoCache = {};

/**
 * Replace the current permanent state with validated data.
 *
 * core/storage.js will call this after reading localStorage or importing a
 * backup. Missing properties receive safe defaults.
 */
export function replaceState(data = {}) {
  const defaults = createDefaultState();
  const profile =
    data.profile && typeof data.profile === 'object'
      ? data.profile
      : {};

  state = {
    profile: {
      ...defaults.profile,
      ...profile,
      favourites: Array.isArray(profile.favourites)
        ? [...profile.favourites]
        : [],
    },
    workouts:
      data.workouts && typeof data.workouts === 'object'
        ? data.workouts
        : {},
    exercisePresets:
      data.exercisePresets &&
      typeof data.exercisePresets === 'object'
        ? data.exercisePresets
        : {},
    bodyLogs: Array.isArray(data.bodyLogs)
      ? data.bodyLogs
      : [],
  };

  return state;
}

/**
 * Reset all permanent app data to its original empty structure.
 */
export function resetState() {
  state = createDefaultState();
  clearPhotoCache();

  return state;
}

/**
 * Return the temporary interface to its starting screen.
 */
export function resetUiState() {
  const defaults = createDefaultUiState();

  Object.keys(ui).forEach((key) => {
    delete ui[key];
  });

  Object.assign(ui, defaults);

  return ui;
}

/**
 * Remove all photos currently held in the in-memory photo cache.
 * This does not delete photos from browser storage.
 */
export function clearPhotoCache() {
  Object.keys(photoCache).forEach((key) => {
    delete photoCache[key];
  });
}
