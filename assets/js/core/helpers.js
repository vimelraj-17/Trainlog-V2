/**
 * TrainLog helper functions
 *
 * These small, reusable functions were extracted from the original
 * single-file TrainLog app. They do not store data or change the page.
 */

import { DATE_LOCALE } from './constants.js';

/**
 * Convert a JavaScript Date into TrainLog's YYYY-MM-DD date key.
 * Using local date parts avoids timezone shifts.
 *
 * @param {Date} date
 * @returns {string}
 */
export function toKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Return today's date using TrainLog's YYYY-MM-DD format.
 *
 * @returns {string}
 */
export function todayKey() {
  return toKey(new Date());
}

/**
 * Convert a TrainLog date key back into a local JavaScript Date.
 * T00:00:00 is included so the browser treats it as local midnight.
 *
 * @param {string} key
 * @returns {Date}
 */
export function keyToDate(key) {
  return new Date(`${key}T00:00:00`);
}

/**
 * Format a date like: Fri, Jul 31
 *
 * @param {string} key
 * @returns {string}
 */
export function fmtDateShort(key) {
  return keyToDate(key).toLocaleDateString(DATE_LOCALE, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date like: Friday, July 31, 2026
 *
 * @param {string} key
 * @returns {string}
 */
export function fmtDateLong(key) {
  return keyToDate(key).toLocaleDateString(DATE_LOCALE, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Create a short ID for workouts, exercises, and body-log entries.
 * This matches the ID format used by the original app.
 *
 * @returns {string}
 */
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * Escape user-entered text before placing it inside generated HTML.
 * This prevents characters such as < and > from becoming HTML tags.
 *
 * @param {*} value
 * @returns {string}
 */
export function esc(value) {
  if (value === undefined || value === null) {
    return '';
  }

  const characters = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return String(value).replace(/[&<>"']/g, (character) => characters[character]);
}

/**
 * Convert an input value to a number. Invalid or empty values become 0.
 *
 * @param {*} value
 * @returns {number}
 */
export function num(value) {
  const number = Number.parseFloat(value);
  return Number.isNaN(number) ? 0 : number;
}

/**
 * Convert decimal minutes per kilometre into a readable running pace.
 * Example: 6.5 becomes 6:30/km.
 *
 * @param {number} minPerKm
 * @returns {string|null}
 */
export function fmtPace(minPerKm) {
  if (!Number.isFinite(minPerKm) || minPerKm <= 0) {
    return null;
  }

  let minutes = Math.floor(minPerKm);
  let seconds = Math.round((minPerKm - minutes) * 60);

  if (seconds === 60) {
    minutes += 1;
    seconds = 0;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}/km`;
}

/**
 * Update a nested object property using a dot-separated path.
 * Example: setPath(profile, 'settings.unit', 'kg').
 *
 * @param {object} object
 * @param {string} path
 * @param {*} value
 */
export function setPath(object, path, value) {
  const parts = path.split('.');
  let current = object;

  for (let index = 0; index < parts.length - 1; index += 1) {
    current = current[parts[index]];
  }

  current[parts[parts.length - 1]] = value;
}
