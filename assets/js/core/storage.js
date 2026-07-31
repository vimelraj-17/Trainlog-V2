/**
 * TrainLog storage
 *
 * Saves the main TrainLog state under the existing trainlog-data-v1 key.
 * Body photos remain separate so large images are not copied into the main
 * state object every time a workout is saved.
 */

import {
  PHOTO_STORAGE_PREFIX,
  STORAGE_KEY,
} from './constants.js';

import {
  photoCache,
  replaceState,
  resetState,
  state,
} from './state.js';

/**
 * Keep compatibility with the original Claude artifact while using browser
 * localStorage when TrainLog runs from GitHub Pages.
 */
export const STORAGE_MODE =
  typeof window !== 'undefined' &&
  window.storage &&
  typeof window.storage.get === 'function'
    ? 'cloud'
    : 'local';

/**
 * Read one value from the active storage system.
 */
export async function storageGet(key) {
  if (STORAGE_MODE === 'cloud') {
    try {
      return await window.storage.get(key, false);
    } catch (error) {
      console.error('Cloud storage read failed.', error);
      return null;
    }
  }

  try {
    const value = localStorage.getItem(key);

    return value === null
      ? null
      : {
          key,
          value,
          shared: false,
        };
  } catch (error) {
    console.error('Local storage read failed.', error);
    return null;
  }
}

/**
 * Save one string value to the active storage system.
 */
export async function storageSet(key, value) {
  if (STORAGE_MODE === 'cloud') {
    try {
      return await window.storage.set(key, value, false);
    } catch (error) {
      console.error('Cloud storage write failed.', error);
      return null;
    }
  }

  try {
    localStorage.setItem(key, value);

    return {
      key,
      value,
      shared: false,
    };
  } catch (error) {
    console.error('Local storage write failed.', error);
    return null;
  }
}

/**
 * Delete one value from the active storage system.
 */
export async function storageDelete(key) {
  if (STORAGE_MODE === 'cloud') {
    try {
      return await window.storage.delete(key, false);
    } catch (error) {
      console.error('Cloud storage delete failed.', error);
      return null;
    }
  }

  try {
    localStorage.removeItem(key);

    return {
      key,
      deleted: true,
      shared: false,
    };
  } catch (error) {
    console.error('Local storage delete failed.', error);
    return null;
  }
}

/**
 * Save the current permanent TrainLog state.
 */
export async function saveState() {
  try {
    const result = await storageSet(
      STORAGE_KEY,
      JSON.stringify(state)
    );

    return result !== null;
  } catch (error) {
    console.error('TrainLog save failed.', error);
    return false;
  }
}

/**
 * Rebuild exercise presets for older saved data that did not contain them.
 * This matches the migration performed by the original single-file app.
 */
function migrateExercisePresets() {
  if (Object.keys(state.exercisePresets).length > 0) {
    return;
  }

  const latestByExercise = {};

  Object.keys(state.workouts)
    .sort()
    .forEach((date) => {
      const entries = Array.isArray(state.workouts[date])
        ? state.workouts[date]
        : [];

      entries.forEach((entry) => {
        if (entry.type !== 'strength') {
          return;
        }

        const exercises = Array.isArray(entry.exercises)
          ? entry.exercises
          : [];

        exercises.forEach((exercise) => {
          const name = String(exercise.name || '').trim();
          const sets = Array.isArray(exercise.sets)
            ? exercise.sets
            : [];

          if (!name || sets.length === 0) {
            return;
          }

          latestByExercise[name] = {
            date,
            preset: {
              sets: sets.length,
              reps: sets[0].reps,
              weight: sets[0].weight,
            },
          };
        });
      });
    });

  Object.entries(latestByExercise).forEach(
    ([name, record]) => {
      state.exercisePresets[name] = record.preset;
    }
  );
}

/**
 * Load TrainLog data and safely merge it with the current default structure.
 */
export async function loadState() {
  const result = await storageGet(STORAGE_KEY);

  if (result && result.value) {
    try {
      replaceState(JSON.parse(result.value));
    } catch (error) {
      console.error('Saved TrainLog data could not be read.', error);
      resetState();
    }
  }

  migrateExercisePresets();

  return state;
}

/**
 * Save a compressed body-photo data URL for one body-log entry.
 */
export async function savePhoto(entryId, dataUrl) {
  if (!entryId || !dataUrl) {
    return false;
  }

  const result = await storageSet(
    `${PHOTO_STORAGE_PREFIX}${entryId}`,
    dataUrl
  );

  if (result !== null) {
    photoCache[entryId] = dataUrl;
    return true;
  }

  return false;
}

/**
 * Load a body photo. Previously loaded photos are returned from memory.
 */
export async function loadPhoto(entryId) {
  if (!entryId) {
    return null;
  }

  if (photoCache[entryId]) {
    return photoCache[entryId];
  }

  const result = await storageGet(
    `${PHOTO_STORAGE_PREFIX}${entryId}`
  );

  if (!result || !result.value) {
    return null;
  }

  photoCache[entryId] = result.value;

  return result.value;
}

/**
 * Delete one body photo from permanent storage and the memory cache.
 */
export async function deletePhoto(entryId) {
  if (!entryId) {
    return false;
  }

  delete photoCache[entryId];

  const result = await storageDelete(
    `${PHOTO_STORAGE_PREFIX}${entryId}`
  );

  return result !== null;
}

/**
 * Create backup text in the same plain-state JSON shape used by TrainLog.
 */
export function createBackupJson() {
  return JSON.stringify(state, null, 2);
}

/**
 * Restore a plain TrainLog state object from backup JSON and save it.
 */
export async function restoreBackupJson(backupText) {
  const parsed = JSON.parse(backupText);

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('This is not a valid TrainLog backup.');
  }

  replaceState(parsed);
  migrateExercisePresets();

  const saved = await saveState();

  if (!saved) {
    throw new Error('The restored data could not be saved.');
  }

  return state;
}

/**
 * Delete all body photos referenced by the current state, then reset the app.
 */
export async function clearAllData() {
  const photoIds = state.bodyLogs
    .filter((entry) => entry && entry.hasPhoto && entry.id)
    .map((entry) => entry.id);

  await Promise.all(
    photoIds.map((entryId) => deletePhoto(entryId))
  );

  resetState();

  return saveState();
}
