/**
 * TrainLog Workout screen
 *
 * Provides a dedicated tab for the app's existing workout logger. This module
 * does not add plans, timers, goals, or any new permanent data structure.
 */

import { state, ui } from '../core/state.js';

import {
  esc,
  fmtDateLong,
  todayKey,
} from '../core/helpers.js';

import {
  emptyState,
  quickWorkoutButton,
  workoutEntryRow,
} from '../ui/components.js';

/**
 * Return the date currently selected in the Workout tab.
 */
export function selectedWorkoutDate() {
  return ui.workoutDate || todayKey();
}

/**
 * Build the existing five workout-type choices.
 */
export function renderWorkoutChoices() {
  return (
    '<div class="typegrid">' +
      quickWorkoutButton(
        'strength',
        'Strength',
        'Sets & reps'
      ) +
      quickWorkoutButton(
        'hiit',
        'HIIT',
        'Time & details'
      ) +
      quickWorkoutButton(
        'running',
        'Running',
        'Distance & pace'
      ) +
      quickWorkoutButton(
        'hiking',
        'Hiking',
        'Trail & elevation'
      ) +
      quickWorkoutButton(
        'other',
        'Other',
        'Any sport'
      ) +
    '</div>'
  );
}

/**
 * Build the complete Workout tab.
 */
export function renderWorkout() {
  const date = selectedWorkoutDate();

  const entries = Array.isArray(state.workouts[date])
    ? state.workouts[date]
    : [];

  const datePicker =
    '<div class="card">' +
      '<div class="field" style="margin-bottom:0;">' +
        '<label>Workout date</label>' +
        `<input type="date" value="${esc(date)}" ` +
        'data-action-input="workout-date">' +
      '</div>' +
    '</div>';

  const chooser =
    '<div class="section-title">' +
      '<div class="bar"></div>' +
      '<h2>Choose workout</h2>' +
    '</div>' +
    renderWorkoutChoices();

  const activityHeading =
    '<div class="section-title">' +
      '<div class="bar"></div>' +
      '<h2>Activity</h2>' +
      `<div class="count">${esc(fmtDateLong(date))}</div>` +
    '</div>';

  const activity = entries.length > 0
    ? '<div class="ledger">' +
        entries
          .map((entry) =>
            workoutEntryRow({
              ...entry,
              date,
            })
          )
          .join('') +
      '</div>'
    : emptyState(
        'No workouts logged this day',
        'Choose a workout type above to add one.'
      );

  return (
    datePicker +
    chooser +
    activityHeading +
    activity
  );
}
