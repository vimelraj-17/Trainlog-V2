/**
 * TrainLog Calendar screen
 *
 * Renders the monthly workout calendar and the activity list for the selected
 * day. Navigation and click handling are connected later by app.js/events.js.
 */

import {
  DATE_LOCALE,
  WORKOUT_CATEGORIES,
} from '../core/constants.js';

import { state, ui } from '../core/state.js';

import {
  esc,
  fmtDateLong,
  keyToDate,
  todayKey,
} from '../core/helpers.js';

import {
  emptyState,
  workoutEntryRow,
} from '../ui/components.js';

import { icon } from '../ui/icons.js';

const WEEKDAY_LABELS = Object.freeze([
  'S',
  'M',
  'T',
  'W',
  'T',
  'F',
  'S',
]);

/**
 * Build one TrainLog date key without timezone conversion.
 */
export function calendarDateKey(year, month, day) {
  return (
    `${year}-` +
    `${String(month + 1).padStart(2, '0')}-` +
    String(day).padStart(2, '0')
  );
}

/**
 * Return each workout category used on a date, once only.
 */
export function workoutTypesForDate(dateKey) {
  const entries = Array.isArray(state.workouts[dateKey])
    ? state.workouts[dateKey]
    : [];

  return [...new Set(
    entries
      .map((entry) => entry && entry.type)
      .filter((type) => WORKOUT_CATEGORIES[type])
  )];
}

/**
 * Build the complete Calendar screen.
 */
export function renderCalendar() {
  const year = ui.calYear;
  const month = ui.calMonth;
  const today = todayKey();

  const monthLabel = new Date(
    year,
    month,
    1
  ).toLocaleDateString(DATE_LOCALE, {
    month: 'long',
    year: 'numeric',
  });

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarHeader =
    '<div class="cal-head">' +
      '<button class="navbtn" type="button" ' +
      'data-action="cal-prev" aria-label="Previous month">' +
        icon('chevL', 18) +
      '</button>' +
      `<div class="disp">${esc(monthLabel)}</div>` +
      '<button class="navbtn" type="button" ' +
      'data-action="cal-next" aria-label="Next month">' +
        icon('chevR', 18) +
      '</button>' +
    '</div>';

  const weekdayHeader =
    '<div class="weekdays">' +
      WEEKDAY_LABELS
        .map((day) => `<div>${day}</div>`)
        .join('') +
    '</div>';

  const blankCells = Array.from(
    { length: firstWeekday },
    () => '<div class="daycell empty2"></div>'
  ).join('');

  const dayCells = Array.from(
    { length: daysInMonth },
    (_, index) => {
      const day = index + 1;
      const dateKey = calendarDateKey(year, month, day);

      const classes = ['daycell'];

      if (dateKey === today) {
        classes.push('today');
      }

      if (dateKey === ui.selectedDay) {
        classes.push('selected');
      }

      if (keyToDate(dateKey) > new Date()) {
        classes.push('future');
      }

      const dots = workoutTypesForDate(dateKey)
        .slice(0, 4)
        .map(
          (type) =>
            '<div class="dot" style="background:' +
            `${WORKOUT_CATEGORIES[type].color}"></div>`
        )
        .join('');

      return (
        `<button class="${classes.join(' ')}" type="button" ` +
        `data-action="select-day" data-day="${dateKey}" ` +
        `aria-label="Select ${esc(dateKey)}">` +
          `<div>${day}</div>` +
          `<div class="dots">${dots}</div>` +
        '</button>'
      );
    }
  ).join('');

  const calendarGrid =
    `<div class="calgrid">${blankCells}${dayCells}</div>`;

  const legend =
    '<div class="legend">' +
      Object.entries(WORKOUT_CATEGORIES)
        .map(
          ([type, category]) =>
            '<div class="item">' +
              '<div class="sw" style="background:' +
              `${category.color}"></div>` +
              esc(category.label) +
            '</div>'
        )
        .join('') +
    '</div>';

  const selectedDate = ui.selectedDay || today;

  const selectedEntries = Array.isArray(
    state.workouts[selectedDate]
  )
    ? state.workouts[selectedDate]
    : [];

  const selectedActivity = selectedEntries.length > 0
    ? '<div class="ledger">' +
        selectedEntries
          .map((entry) =>
            workoutEntryRow({
              ...entry,
              date: selectedDate,
            })
          )
          .join('') +
      '</div>'
    : emptyState('No workouts logged this day.');

  const selectedDayPanel =
    '<div class="daysel-panel">' +
      '<div class="daysel-title">' +
        `<div class="disp">${esc(
          fmtDateLong(selectedDate)
        )}</div>` +
        '<button class="addforday" type="button" ' +
        'data-action="open-log-chooser" ' +
        `data-date="${selectedDate}">` +
          icon('plus', 14) +
          ' Add' +
        '</button>' +
      '</div>' +
      selectedActivity +
    '</div>';

  return (
    calendarHeader +
    weekdayHeader +
    calendarGrid +
    legend +
    selectedDayPanel
  );
}
