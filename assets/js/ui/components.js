/**
 * TrainLog shared UI components
 *
 * These functions return or update small interface pieces used by several
 * screens. Complete pages belong in assets/js/features/.
 */

import {
  DATE_LOCALE,
  NAVIGATION_TABS,
  WORKOUT_CATEGORIES,
} from '../core/constants.js';

import {
  esc,
  fmtDateShort,
  fmtPace,
  num,
} from '../core/helpers.js';

import { icon, iconFor } from './icons.js';

/**
 * Insert today's date into the fixed TrainLog header.
 */
export function renderTopbarDate() {
  const dateElement = document.getElementById('topbarDate');

  if (!dateElement) {
    return;
  }

  dateElement.textContent = new Date().toLocaleDateString(
    DATE_LOCALE,
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }
  );
}

/**
 * Fill the five existing navigation buttons and highlight the selected tab.
 * The button order comes from constants.js:
 * Home, Calendar, Workout, PRs, Profile.
 */
export function renderNavigation(activeTab = 'home') {
  NAVIGATION_TABS.forEach((tab) => {
    const button = document.getElementById(`nav-${tab.id}`);

    if (!button) {
      return;
    }

    const isActive = activeTab === tab.id;

    button.classList.toggle('active', isActive);
    button.setAttribute(
      'aria-current',
      isActive ? 'page' : 'false'
    );

    const iconClass = tab.id === 'workout'
      ? 'nav-icon nav-icon-workout'
      : 'nav-icon';

    button.innerHTML =
      `<span class="${iconClass}">` +
        icon(tab.icon, 20) +
      '</span>' +
      `<span class="nav-label">${esc(tab.label)}</span>`;
  });
}

/**
 * Build one workout-type button for the Home screen or workout chooser.
 */
export function quickWorkoutButton(
  type,
  label,
  subtitle
) {
  const category = WORKOUT_CATEGORIES[type];

  if (!category) {
    return '';
  }

  return (
    `<button class="qbtn" type="button" ` +
    `data-action="open-log" data-type="${esc(type)}">` +
      `<div class="ic" style="background:${category.color}22; ` +
      `color:${category.color}">` +
        icon(category.icon, 18) +
      '</div>' +
      `<div class="lbl">${esc(label || category.label)}</div>` +
      `<div class="sub">${esc(subtitle)}</div>` +
    '</button>'
  );
}

/**
 * Convert one saved workout into the short description shown in activity rows.
 */
export function summarizeWorkout(entry) {
  if (!entry || typeof entry !== 'object') {
    return '';
  }

  if (entry.type === 'strength') {
    const exercises = Array.isArray(entry.exercises)
      ? entry.exercises
      : [];

    const names = exercises
      .map((exercise) => exercise.name)
      .filter(Boolean);

    const setCount = exercises.reduce(
      (total, exercise) =>
        total +
        (Array.isArray(exercise.sets)
          ? exercise.sets.length
          : 0),
      0
    );

    return (
      `${names.join(', ') || 'Strength'} — ` +
      `${setCount} set${setCount === 1 ? '' : 's'}`
    );
  }

  if (entry.type === 'hiit') {
    return (
      (entry.name || 'HIIT session') +
      (entry.duration ? ` — ${entry.duration} min` : '')
    );
  }

  if (entry.type === 'running') {
    const distance = num(entry.distance);
    const duration = num(entry.duration);
    const pace =
      distance > 0 && duration > 0
        ? fmtPace(duration / distance)
        : null;

    return (
      `${distance} km — ${duration} min` +
      (pace ? ` (${pace})` : '')
    );
  }

  if (entry.type === 'hiking') {
    const details = [`${num(entry.distance)} km`];

    if (num(entry.elevation) > 0) {
      details.push(`+${entry.elevation}m gain`);
    }

    return (
      (entry.place ? `${entry.place} — ` : '') +
      details.join(', ')
    );
  }

  if (entry.type === 'other') {
    return (
      (entry.sport || 'Activity') +
      (entry.duration ? ` — ${entry.duration} min` : '')
    );
  }

  return '';
}

/**
 * Build one reusable workout row with its delete button.
 */
export function workoutEntryRow(entry) {
  if (!entry || !WORKOUT_CATEGORIES[entry.type]) {
    return '';
  }

  const category = WORKOUT_CATEGORIES[entry.type];

  return (
    '<div class="row">' +
      `<div class="tag" style="background:${category.color}22; ` +
      `color:${category.color}">` +
        icon(iconFor(entry.type), 16) +
      '</div>' +
      '<div class="body">' +
        `<div class="t1">${esc(summarizeWorkout(entry))}</div>` +
        `<div class="t2">${fmtDateShort(entry.date)}</div>` +
      '</div>' +
      `<button class="del" type="button" ` +
      `data-action="delete-entry" data-date="${esc(entry.date)}" ` +
      `data-id="${esc(entry.id)}" aria-label="Delete workout">` +
        icon('trash', 16) +
      '</button>' +
    '</div>'
  );
}

/**
 * Build the empty message used when a list or chart has no saved data.
 */
export function emptyState(message, detail = '') {
  return (
    '<div class="empty">' +
      (message ? `<b>${esc(message)}</b>` : '') +
      esc(detail) +
    '</div>'
  );
}

/**
 * Build the shared date field used inside workout and body-log sheets.
 */
export function dateField(value) {
  return (
    '<div class="day-input">' +
      '<label style="display:block; font-size:11px; ' +
      'text-transform:uppercase; letter-spacing:0.08em; ' +
      'color:var(--cinder-dim); margin-bottom:6px;">Date</label>' +
      `<input type="date" value="${esc(value)}" ` +
      'data-action-input="modal-date">' +
    '</div>'
  );
}

/**
 * Build a labelled text or number input.
 */
export function textField({
  label,
  placeholder = '',
  model,
  value = '',
  type = 'text',
}) {
  const inputMode = type === 'number' ? 'decimal' : 'text';

  return (
    '<div class="field">' +
      `<label>${esc(label)}</label>` +
      `<input type="${esc(type)}" inputmode="${inputMode}" ` +
      `placeholder="${esc(placeholder)}" value="${esc(value)}" ` +
      `data-model="${esc(model)}">` +
    '</div>'
  );
}

/**
 * Build a labelled multi-line text field.
 */
export function textareaField({
  label,
  placeholder = '',
  model,
  value = '',
}) {
  return (
    '<div class="field">' +
      `<label>${esc(label)}</label>` +
      `<textarea rows="3" placeholder="${esc(placeholder)}" ` +
      `data-model="${esc(model)}">${esc(value)}</textarea>` +
    '</div>'
  );
}

/**
 * Build the fixed save button at the bottom of a form sheet.
 */
export function saveBar(type, label = 'Save workout') {
  return (
    '<div class="savebar">' +
      `<button class="save-btn" type="button" ` +
      `data-action="save-workout" data-type="${esc(type)}">` +
        esc(label) +
      '</button>' +
    '</div>'
  );
}

/**
 * Wrap feature-provided form content in the original bottom-sheet structure.
 */
export function modalSheet(title, content, options = {}) {
  const titleColor = options.color
    ? ` style="color:${options.color}"`
    : '';

  return (
    '<div class="backdrop" data-action="modal-backdrop">' +
      '<div class="sheet" data-stop="1" role="dialog" aria-modal="true">' +
        '<div class="sheet-handle"></div>' +
        '<div class="sheet-head">' +
          `<div class="disp"${titleColor}>${esc(title)}</div>` +
          '<button type="button" data-action="close-modal" ' +
          'aria-label="Close">' +
            icon('x', 16) +
          '</button>' +
        '</div>' +
        content +
      '</div>' +
    '</div>'
  );
}

/**
 * Show a short TrainLog notification near the bottom of the screen.
 */
export function flash(message) {
  const notice = document.createElement('div');

  notice.textContent = message;
  notice.setAttribute('role', 'status');
  notice.style.cssText = [
    'position:fixed',
    'left:50%',
    'bottom:110px',
    'transform:translateX(-50%)',
    'background:var(--danger)',
    'color:#2b0a0a',
    'padding:10px 16px',
    'border-radius:10px',
    'font-size:13px',
    'font-weight:600',
    'z-index:400',
  ].join(';');

  document.body.appendChild(notice);

  window.setTimeout(() => {
    notice.remove();
  }, 1800);
}
