/**
 * TrainLog Home screen
 *
 * Renders the streak summary, quick workout buttons, and recent activity.
 * The exported workout calculations can also be reused by later features.
 */

import { state } from '../core/state.js';

import {
  keyToDate,
  toKey,
} from '../core/helpers.js';

import {
  emptyState,
  quickWorkoutButton,
  workoutEntryRow,
} from '../ui/components.js';

import { icon } from '../ui/icons.js';

/**
 * Check whether a date contains at least one saved workout.
 */
export function hasWorkout(dateKey) {
  return Boolean(
    state.workouts[dateKey] &&
    state.workouts[dateKey].length
  );
}

/**
 * Count the current workout streak.
 *
 * A streak may end today or yesterday, matching the original TrainLog app.
 */
export function computeStreak() {
  const cursor = new Date();

  if (!hasWorkout(toKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let count = 0;

  while (hasWorkout(toKey(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return count;
}

/**
 * Find the longest run of consecutive workout days.
 */
export function computeLongestStreak() {
  const workoutDates = Object.keys(state.workouts)
    .filter(
      (dateKey) =>
        Array.isArray(state.workouts[dateKey]) &&
        state.workouts[dateKey].length > 0
    )
    .sort();

  if (workoutDates.length === 0) {
    return 0;
  }

  let longest = 1;
  let current = 1;

  for (let index = 1; index < workoutDates.length; index += 1) {
    const previousDate = keyToDate(workoutDates[index - 1]);
    const currentDate = keyToDate(workoutDates[index]);

    const difference = Math.round(
      (currentDate - previousDate) / 86400000
    );

    current = difference === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
  }

  return longest;
}

/**
 * Count workout entries saved since the start of the current week.
 * Sunday is the first day, matching the original app.
 */
export function countThisWeek() {
  const now = new Date();
  const start = new Date(now);

  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);

  let count = 0;

  Object.keys(state.workouts).forEach((dateKey) => {
    const entries = Array.isArray(state.workouts[dateKey])
      ? state.workouts[dateKey]
      : [];

    if (keyToDate(dateKey) >= start && entries.length > 0) {
      count += entries.length;
    }
  });

  return count;
}

/**
 * Count every saved workout entry.
 */
export function totalWorkouts() {
  return Object.values(state.workouts).reduce(
    (total, entries) =>
      total + (Array.isArray(entries) ? entries.length : 0),
    0
  );
}

/**
 * Return every workout as one newest-first list with its date attached.
 */
export function allEntriesFlat() {
  const entries = [];

  Object.keys(state.workouts).forEach((dateKey) => {
    const dayEntries = Array.isArray(state.workouts[dateKey])
      ? state.workouts[dateKey]
      : [];

    dayEntries.forEach((entry) => {
      entries.push({
        ...entry,
        date: dateKey,
      });
    });
  });

  entries.sort((first, second) => {
    const firstKey = `${first.date}${first.id || ''}`;
    const secondKey = `${second.date}${second.id || ''}`;

    return secondKey.localeCompare(firstKey);
  });

  return entries;
}

/**
 * Build the complete Home screen.
 */
export function renderHome() {
  const streak = computeStreak();
  const longest = computeLongestStreak();
  const thisWeek = countThisWeek();
  const recentEntries = allEntriesFlat().slice(0, 8);

  const hero =
    '<div class="hero">' +
      `<div class="flame">${icon('flame', 40)}</div>` +
      '<div>' +
        `<div class="num disp"><span>${streak}</span></div>` +
        '<div class="lbl">day streak</div>' +
      '</div>' +
      '<div class="divider"></div>' +
      '<div class="side">' +
        '<div class="stat">' +
          `<div class="v mono">${longest}</div>` +
          '<div class="k">Longest</div>' +
        '</div>' +
        '<div class="stat">' +
          `<div class="v mono">${thisWeek}</div>` +
          '<div class="k">This week</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  const quickLog =
    '<div class="section-title">' +
      '<div class="bar"></div>' +
      '<h2>Log a workout</h2>' +
    '</div>' +
    '<div class="quicklog">' +
      quickWorkoutButton('strength', 'Strength', 'Sets & reps') +
      quickWorkoutButton('hiit', 'HIIT', 'Time & details') +
      quickWorkoutButton('running', 'Running', 'Distance & pace') +
      quickWorkoutButton('hiking', 'Hiking', 'Trail & elevation') +
      quickWorkoutButton('other', 'Other', 'Any sport') +
    '</div>';

  const recentHeading =
    '<div class="section-title">' +
      '<div class="bar"></div>' +
      '<h2>Recent activity</h2>' +
      `<div class="count">${totalWorkouts()} total</div>` +
    '</div>';

  const recentActivity = recentEntries.length > 0
    ? '<div class="ledger">' +
        recentEntries.map(workoutEntryRow).join('') +
      '</div>'
    : emptyState(
        'Nothing logged yet',
        'Log your first workout above to start a streak.'
      );

  return hero + quickLog + recentHeading + recentActivity;
}
