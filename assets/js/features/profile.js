/**
 * TrainLog Profile screen
 *
 * Renders profile settings, favourites, exercise presets, PR highlights,
 * calendar transfer, backup/restore controls, and the data-reset action.
 * All changes are handled later by events.js.
 */

import { WORKOUT_CATEGORIES } from '../core/constants.js';
import { state } from '../core/state.js';
import { STORAGE_MODE } from '../core/storage.js';
import { esc } from '../core/helpers.js';

import {
  computeLongestStreak,
  computeStreak,
  totalWorkouts,
} from './home.js';

import { computePRs } from './prs.js';
import { icon } from '../ui/icons.js';

/**
 * Build a standard section heading.
 */
function sectionHeading(title, trailing = '') {
  return (
    '<div class="section-title">' +
      '<div class="bar"></div>' +
      `<h2>${esc(title)}</h2>` +
      trailing +
    '</div>'
  );
}

/**
 * Render age, weight, unit, and summary statistics.
 */
export function renderProfileSummary() {
  const profile = state.profile;

  return (
    '<div class="card">' +
      '<div style="display:flex; gap:10px;">' +
        '<div class="field" style="flex:1">' +
          '<label>Age</label>' +
          '<input type="number" inputmode="numeric" placeholder="—" ' +
          `value="${profile.age !== null ? esc(profile.age) : ''}" ` +
          'data-model="profile.age">' +
        '</div>' +
        '<div class="field" style="flex:1">' +
          '<label>Weight</label>' +
          '<div style="display:flex; gap:8px;">' +
            '<input type="number" inputmode="decimal" placeholder="—" ' +
            `value="${profile.weight !== null ? esc(profile.weight) : ''}" ` +
            'data-model="profile.weight">' +
            '<div class="unit-toggle" role="group" ' +
            'aria-label="Weight unit">' +
              '<button type="button" data-action="set-unit" data-unit="kg" ' +
              `class="${profile.unit === 'kg' ? 'active' : ''}">kg</button>` +
              '<button type="button" data-action="set-unit" data-unit="lb" ' +
              `class="${profile.unit === 'lb' ? 'active' : ''}">lb</button>` +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="summary-strip">' +
        '<div class="box">' +
          `<div class="v mono">${computeStreak()}</div>` +
          '<div class="k">Streak</div>' +
        '</div>' +
        '<div class="box">' +
          `<div class="v mono">${computeLongestStreak()}</div>` +
          '<div class="k">Best streak</div>' +
        '</div>' +
        '<div class="box">' +
          `<div class="v mono">${totalWorkouts()}</div>` +
          '<div class="k">Logged</div>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

/**
 * Render favourite exercises and activities.
 */
export function renderFavourites() {
  const favourites = Array.isArray(state.profile.favourites)
    ? state.profile.favourites
    : [];

  const chips = favourites.length > 0
    ? favourites
        .map(
          (favourite) =>
            '<div class="chip">' +
              esc(favourite) +
              '<button type="button" data-action="remove-fav" ' +
              `data-value="${esc(favourite)}" ` +
              `aria-label="Remove ${esc(favourite)}">` +
                icon('x', 12) +
              '</button>' +
            '</div>'
        )
        .join('')
    : '<span class="muted">' +
        'No favourites yet — add an exercise or activity you love.' +
      '</span>';

  return (
    sectionHeading('Favourites') +
    '<div class="card">' +
      `<div class="chips">${chips}</div>` +
      '<div class="addchip-row">' +
        '<input id="favInput" type="text" ' +
        'placeholder="e.g. Deadlift, Trail running">' +
        '<button type="button" data-action="add-fav" ' +
        'aria-label="Add favourite">' +
          icon('plus', 16) +
        '</button>' +
      '</div>' +
    '</div>'
  );
}

/**
 * Render saved strength-exercise presets.
 */
export function renderExerciseLibrary() {
  const names = Object.keys(state.exercisePresets).sort();

  let rows = '';

  if (names.length > 0) {
    rows +=
      '<div class="preset-hint">' +
        '<span style="flex:1; text-align:left;"></span>' +
        '<span>Sets</span>' +
        '<span>Reps</span>' +
        `<span>${esc(state.profile.unit)}</span>` +
        '<span style="width:24px;"></span>' +
      '</div>';

    rows += names
      .map((name) => {
        const preset = state.exercisePresets[name] || {};

        return (
          '<div class="preset-row">' +
            `<div class="preset-name">${esc(name)}</div>` +
            '<div class="preset-fields">' +
              '<input type="number" inputmode="decimal" ' +
              `value="${esc(preset.sets)}" ` +
              `data-preset-name="${esc(name)}" ` +
              'data-preset-field="sets" aria-label="Usual sets">' +
              '<input type="number" inputmode="decimal" ' +
              `value="${esc(preset.reps)}" ` +
              `data-preset-name="${esc(name)}" ` +
              'data-preset-field="reps" aria-label="Usual reps">' +
              '<input type="number" inputmode="decimal" ' +
              `value="${esc(preset.weight)}" ` +
              `data-preset-name="${esc(name)}" ` +
              'data-preset-field="weight" aria-label="Usual weight">' +
            '</div>' +
            '<button class="rm" type="button" ' +
            'data-action="remove-preset" ' +
            `data-name="${esc(name)}" ` +
            `aria-label="Remove ${esc(name)} preset">` +
              icon('trash', 14) +
            '</button>' +
          '</div>'
        );
      })
      .join('');
  } else {
    rows =
      '<span class="muted">' +
        'Log a strength exercise or add one below to build your library.' +
      '</span>';
  }

  const trailing =
    '<div class="count">for the strength dropdown</div>';

  return (
    sectionHeading('Exercise library', trailing) +
    '<div class="card">' +
      rows +
      '<div class="addchip-row">' +
        '<input id="newPresetName" type="text" ' +
        'placeholder="e.g. Deadlift">' +
        '<button type="button" data-action="add-preset" ' +
        'aria-label="Add exercise preset">' +
          icon('plus', 16) +
        '</button>' +
      '</div>' +
    '</div>'
  );
}

/**
 * Render up to three strength PRs on the Profile screen.
 */
export function renderPrHighlights() {
  const records = computePRs();
  const names = Object.keys(records.strength).sort();

  const content = names.length > 0
    ? names
        .slice(0, 3)
        .map((name) => {
          const record = records.strength[name];

          return (
            '<div style="display:flex; justify-content:space-between; ' +
            'padding:8px 0; border-bottom:1px solid var(--line); ' +
            'font-size:13px; gap:10px;">' +
              `<span>${esc(name)}</span>` +
              '<span class="mono" style="color:' +
              `${WORKOUT_CATEGORIES.strength.color}; white-space:nowrap;">` +
                `${esc(record.weight)} ${esc(state.profile.unit)} × ` +
                esc(record.reps) +
              '</span>' +
            '</div>'
          );
        })
        .join('')
    : '<span class="muted">' +
        'Your personal records will appear here once you start logging.' +
      '</span>';

  const shortcut =
    '<button class="count" type="button" ' +
    'data-action="nav-prs-shortcut" ' +
    'style="cursor:pointer; text-decoration:underline; ' +
    'background:none; border:none; padding:0;">view all</button>';

  return (
    sectionHeading('PR highlights', shortcut) +
    `<div class="card">${content}</div>`
  );
}

/**
 * Render calendar export/import controls.
 */
export function renderCalendarTransfer() {
  return (
    sectionHeading('Calendar') +
    '<div class="card">' +
      '<p class="muted" style="margin:0 0 12px; line-height:1.5;">' +
        'TrainLog cannot directly sync with Google or Apple Calendar. ' +
        'Export your log as a calendar file, or import calendar events ' +
        'such as a planned hike.' +
      '</p>' +
      '<div style="display:flex; flex-direction:column; gap:10px;">' +
        '<button class="photo-input-btn" type="button" ' +
        'data-action="export-ics">' +
          icon('calendar', 16) +
          ' Export workouts to Calendar (.ics)' +
        '</button>' +
        '<label class="photo-input-btn">' +
          icon('calendar', 16) +
          ' Import from Calendar (.ics)' +
          '<input type="file" accept=".ics,text/calendar" ' +
          'data-action-input="ics-import-file" style="display:none">' +
        '</label>' +
      '</div>' +
    '</div>'
  );
}

/**
 * Render JSON backup and restore controls.
 */
export function renderBackupControls() {
  return (
    sectionHeading('Backup & restore') +
    '<div class="card">' +
      '<p class="muted" style="margin:0 0 12px; line-height:1.5;">' +
        'Download a copy of your TrainLog data or restore a previous ' +
        'TrainLog JSON backup.' +
      '</p>' +
      '<div style="display:flex; flex-direction:column; gap:10px;">' +
        '<button class="photo-input-btn" type="button" ' +
        'data-action="export-backup">' +
          icon('user', 16) +
          ' Download backup (.json)' +
        '</button>' +
        '<label class="photo-input-btn">' +
          icon('plus', 16) +
          ' Restore backup (.json)' +
          '<input type="file" accept=".json,application/json" ' +
          'data-action-input="backup-import-file" style="display:none">' +
        '</label>' +
      '</div>' +
    '</div>'
  );
}

/**
 * Build the complete Profile screen.
 */
export function renderProfile() {
  const storageLabel = STORAGE_MODE === 'cloud'
    ? 'synced with your Claude session'
    : 'saved locally on this device';

  return (
    renderProfileSummary() +
    renderFavourites() +
    renderExerciseLibrary() +
    renderPrHighlights() +
    renderCalendarTransfer() +
    renderBackupControls() +
    '<div class="danger-link">' +
      '<button type="button" data-action="reset-data">' +
        'Clear all data' +
      '</button>' +
    '</div>' +
    '<div style="text-align:center; margin-top:8px;">' +
      '<span class="muted" style="font-size:10.5px;">' +
        `Storage: ${esc(storageLabel)}` +
      '</span>' +
    '</div>'
  );
}
