/**
 * TrainLog Personal Records screen
 *
 * Renders Records, Body, and Performance. All calculations read the existing
 * workouts, exercisePresets, bodyLogs, and profile data structures.
 */

import { WORKOUT_CATEGORIES } from '../core/constants.js';

import {
  photoCache,
  state,
  ui,
} from '../core/state.js';

import {
  esc,
  fmtDateShort,
  fmtPace,
  keyToDate,
  num,
  todayKey,
} from '../core/helpers.js';

import {
  rangeDays,
  rangeToggle,
  renderLineChart,
} from '../ui/chart.js';

import { emptyState } from '../ui/components.js';
import { icon } from '../ui/icons.js';

/**
 * Return each strength exercise found in saved workout history.
 */
export function getAllExerciseNames() {
  const names = new Set();

  Object.values(state.workouts).forEach((entries) => {
    if (!Array.isArray(entries)) {
      return;
    }

    entries.forEach((entry) => {
      if (entry.type !== 'strength') {
        return;
      }

      const exercises = Array.isArray(entry.exercises)
        ? entry.exercises
        : [];

      exercises.forEach((exercise) => {
        const name = String(exercise.name || '').trim();

        if (name) {
          names.add(name);
        }
      });
    });
  });

  return [...names].sort();
}

/**
 * Calculate all current personal records from saved workouts.
 */
export function computePRs() {
  const strength = {};

  const running = {
    farthest: null,
    fastestPace: null,
  };

  const hiking = {
    farthest: null,
    mostElevation: null,
  };

  let hiitLongest = null;
  const other = {};

  Object.keys(state.workouts).forEach((date) => {
    const entries = Array.isArray(state.workouts[date])
      ? state.workouts[date]
      : [];

    entries.forEach((entry) => {
      if (entry.type === 'strength') {
        const exercises = Array.isArray(entry.exercises)
          ? entry.exercises
          : [];

        exercises.forEach((exercise) => {
          const name = String(exercise.name || '').trim();

          if (!name) {
            return;
          }

          const sets = Array.isArray(exercise.sets)
            ? exercise.sets
            : [];

          sets.forEach((set) => {
            const weight = num(set.weight);
            const reps = num(set.reps);

            if (weight <= 0) {
              return;
            }

            const current = strength[name];

            if (
              !current ||
              weight > current.weight ||
              (weight === current.weight && reps > current.reps)
            ) {
              strength[name] = {
                weight,
                reps,
                date,
              };
            }
          });
        });

        return;
      }

      if (entry.type === 'running') {
        const distance = num(entry.distance);
        const duration = num(entry.duration);

        if (
          distance > 0 &&
          (
            !running.farthest ||
            distance > running.farthest.distance
          )
        ) {
          running.farthest = {
            distance,
            date,
          };
        }

        if (distance > 0 && duration > 0) {
          const pace = duration / distance;

          if (
            !running.fastestPace ||
            pace < running.fastestPace.pace
          ) {
            running.fastestPace = {
              pace,
              date,
              distance,
            };
          }
        }

        return;
      }

      if (entry.type === 'hiking') {
        const distance = num(entry.distance);
        const elevation = num(entry.elevation);

        if (
          distance > 0 &&
          (
            !hiking.farthest ||
            distance > hiking.farthest.distance
          )
        ) {
          hiking.farthest = {
            distance,
            date,
          };
        }

        if (
          elevation > 0 &&
          (
            !hiking.mostElevation ||
            elevation > hiking.mostElevation.elevation
          )
        ) {
          hiking.mostElevation = {
            elevation,
            date,
          };
        }

        return;
      }

      if (entry.type === 'hiit') {
        const duration = num(entry.duration);

        if (
          duration > 0 &&
          (
            !hiitLongest ||
            duration > hiitLongest.duration
          )
        ) {
          hiitLongest = {
            duration,
            date,
            name: entry.name,
          };
        }

        return;
      }

      if (entry.type === 'other') {
        const duration = num(entry.duration);
        const sport = entry.sport || 'Activity';

        if (
          duration > 0 &&
          (
            !other[sport] ||
            duration > other[sport].duration
          )
        ) {
          other[sport] = {
            duration,
            date,
          };
        }
      }
    });
  });

  return {
    strength,
    running,
    hiking,
    hiitLongest,
    other,
  };
}

/**
 * Build the PR page's three subtab buttons.
 */
function renderPrSubtabs(activeSubtab) {
  const subtabs = [
    ['records', 'Records'],
    ['body', 'Body'],
    ['performance', 'Performance'],
  ];

  return (
    '<div class="subtabs">' +
      subtabs
        .map(
          ([id, label]) =>
            `<button class="${activeSubtab === id ? 'active' : ''}" ` +
            'type="button" data-action="nav-sub" ' +
            `data-subtab="${id}">${label}</button>`
        )
        .join('') +
    '</div>'
  );
}

/**
 * Build one section heading for the Records screen.
 */
function recordHeading(type, label) {
  return (
    '<div class="section-title">' +
      '<div class="bar" style="background:' +
      `${WORKOUT_CATEGORIES[type].color}"></div>` +
      `<h2>${esc(label)}</h2>` +
    '</div>'
  );
}

/**
 * Build one personal-record card.
 */
function recordCard({
  title,
  date,
  value,
  unit,
  type,
}) {
  return (
    '<div class="prcard">' +
      '<div class="left">' +
        `<b>${esc(title)}</b>` +
        `<span>${esc(fmtDateShort(date))}</span>` +
      '</div>' +
      '<div class="statchip">' +
        '<div class="v" style="color:' +
        `${WORKOUT_CATEGORIES[type].color}">` +
          esc(value) +
        '</div>' +
        `<div class="u">${esc(unit)}</div>` +
      '</div>' +
    '</div>'
  );
}

/**
 * Render the Records subtab.
 */
export function renderPRRecords() {
  const records = computePRs();
  const profileUnit = state.profile.unit;

  const strengthNames = Object.keys(records.strength).sort();

  const strengthRecords = strengthNames.length > 0
    ? strengthNames
        .map((name) => {
          const record = records.strength[name];

          return recordCard({
            title: name,
            date: record.date,
            value: `${record.weight} × ${record.reps}`,
            unit: `${profileUnit} / reps`,
            type: 'strength',
          });
        })
        .join('')
    : emptyState(
        'No strength PRs yet',
        'Log a lift to set your first record.'
      );

  let runningRecords = '';

  if (records.running.farthest) {
    runningRecords += recordCard({
      title: 'Farthest distance',
      date: records.running.farthest.date,
      value: records.running.farthest.distance,
      unit: 'km',
      type: 'running',
    });
  }

  if (records.running.fastestPace) {
    runningRecords += recordCard({
      title: 'Fastest pace',
      date: records.running.fastestPace.date,
      value: fmtPace(records.running.fastestPace.pace),
      unit: 'min/km',
      type: 'running',
    });
  }

  if (!runningRecords) {
    runningRecords = emptyState(
      'No running PRs yet',
      'Log a run to set your first record.'
    );
  }

  let hikingRecords = '';

  if (records.hiking.farthest) {
    hikingRecords += recordCard({
      title: 'Farthest hike',
      date: records.hiking.farthest.date,
      value: records.hiking.farthest.distance,
      unit: 'km',
      type: 'hiking',
    });
  }

  if (records.hiking.mostElevation) {
    hikingRecords += recordCard({
      title: 'Most elevation gained',
      date: records.hiking.mostElevation.date,
      value: records.hiking.mostElevation.elevation,
      unit: 'm',
      type: 'hiking',
    });
  }

  if (!hikingRecords) {
    hikingRecords = emptyState(
      'No hiking PRs yet',
      'Log a hike to set your first record.'
    );
  }

  const hiitRecord = records.hiitLongest
    ? recordCard({
        title:
          records.hiitLongest.name ||
          'Longest session',
        date: records.hiitLongest.date,
        value: records.hiitLongest.duration,
        unit: 'min',
        type: 'hiit',
      })
    : emptyState(
        'No HIIT record yet',
        'Log a session to set your first record.'
      );

  const otherNames = Object.keys(records.other).sort();

  const otherRecords = otherNames.length > 0
    ? otherNames
        .map((sport) => {
          const record = records.other[sport];

          return recordCard({
            title: sport,
            date: record.date,
            value: record.duration,
            unit: 'min',
            type: 'other',
          });
        })
        .join('')
    : emptyState(
        'No records yet',
        'Log another sport to set your first record.'
      );

  return (
    recordHeading('strength', 'Strength PRs') +
    strengthRecords +
    recordHeading('running', 'Running PRs') +
    runningRecords +
    recordHeading('hiking', 'Hiking PRs') +
    hikingRecords +
    recordHeading('hiit', 'HIIT record') +
    hiitRecord +
    recordHeading('other', 'Other records') +
    otherRecords
  );
}

/**
 * Build one row in the Body log.
 */
export function bodyLogRow(entry) {
  const entryId = esc(entry.id);

  const photoAction = entry.hasPhoto
    ? ` data-action="view-photo" data-id="${entryId}"`
    : '';

  let thumbnail = icon('user', 14);

  if (entry.hasPhoto) {
    thumbnail = photoCache[entry.id]
      ? `<img src="${esc(photoCache[entry.id])}" alt="">`
      : '<span class="loading-dot"></span>';
  }

  const remarks = entry.remarks
    ? ` · ${esc(entry.remarks).slice(0, 36)}`
    : '';

  return (
    '<div class="row">' +
      `<button class="thumb" type="button"${photoAction} ` +
      `data-photo-thumb="${entryId}" ` +
      `aria-label="${entry.hasPhoto ? 'View body photo' : 'No body photo'}">` +
        thumbnail +
      '</button>' +
      '<div class="body">' +
        '<div class="t1">' +
          `${esc(entry.weight)} ${esc(state.profile.unit)}` +
          remarks +
        '</div>' +
        `<div class="t2">${esc(fmtDateShort(entry.date))}</div>` +
      '</div>' +
      '<button class="del" type="button" ' +
      'data-action="delete-body" ' +
      `data-id="${entryId}" aria-label="Delete body entry">` +
        icon('trash', 16) +
      '</button>' +
    '</div>'
  );
}

/**
 * Render the Body subtab.
 */
export function renderPRBody() {
  const range = ui.bodyRange || 'month';
  const cutoff = new Date();

  cutoff.setDate(cutoff.getDate() - rangeDays(range));

  const points = state.bodyLogs
    .filter(
      (entry) =>
        entry &&
        entry.date &&
        keyToDate(entry.date) >= cutoff
    )
    .map((entry) => ({
      date: entry.date,
      value: entry.weight,
    }))
    .sort((first, second) =>
      first.date.localeCompare(second.date)
    );

  const weightTrend =
    '<div class="section-title">' +
      '<div class="bar"></div>' +
      '<h2>Weight trend</h2>' +
    '</div>' +
    '<div class="card">' +
      rangeToggle('bodyRange', range) +
      renderLineChart(points, {
        color: '#FF5A2B',
        unit: state.profile.unit,
        emptyText: 'Log your weight to see a trend.',
      }) +
    '</div>';

  const bodyLogHeading =
    '<div class="section-title">' +
      '<div class="bar"></div>' +
      '<h2>Body log</h2>' +
      '<button class="addforday" type="button" ' +
      'data-action="open-body-form" ' +
      `data-date="${todayKey()}" style="margin-left:auto;">` +
        icon('plus', 14) +
        ' Log entry' +
      '</button>' +
    '</div>';

  const entries = state.bodyLogs
    .slice()
    .sort((first, second) =>
      second.date.localeCompare(first.date)
    );

  const bodyLog = entries.length > 0
    ? '<div class="ledger">' +
        entries.map(bodyLogRow).join('') +
      '</div>'
    : emptyState(
        'No entries yet',
        'Log your weight (and a photo if you like) to start tracking.'
      );

  return weightTrend + bodyLogHeading + bodyLog;
}

/**
 * Collect the best weight used for one exercise on each saved date.
 */
export function exercisePerformancePoints(
  exerciseName,
  range = 'month'
) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - rangeDays(range));

  const points = [];

  Object.keys(state.workouts).forEach((date) => {
    if (keyToDate(date) < cutoff) {
      return;
    }

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
        if (exercise.name !== exerciseName) {
          return;
        }

        let bestWeight = 0;
        let bestReps = 0;

        const sets = Array.isArray(exercise.sets)
          ? exercise.sets
          : [];

        sets.forEach((set) => {
          const weight = num(set.weight);

          if (weight >= bestWeight) {
            bestWeight = weight;
            bestReps = num(set.reps);
          }
        });

        points.push({
          date,
          value: bestWeight,
          reps: bestReps,
        });
      });
    });
  });

  points.sort((first, second) =>
    first.date.localeCompare(second.date)
  );

  return points;
}

/**
 * Render the Performance subtab.
 */
export function renderPRPerformance() {
  const exerciseNames = [
    ...new Set([
      ...Object.keys(state.exercisePresets),
      ...getAllExerciseNames(),
    ]),
  ].sort();

  if (exerciseNames.length === 0) {
    return (
      '<div class="section-title">' +
        '<div class="bar"></div>' +
        '<h2>Performance</h2>' +
      '</div>' +
      emptyState(
        'No exercises yet',
        'Log a strength workout to see performance graphs.'
      )
    );
  }

  if (
    !ui.perfExercise ||
    !exerciseNames.includes(ui.perfExercise)
  ) {
    ui.perfExercise = exerciseNames[0];
  }

  const exerciseOptions = exerciseNames
    .map(
      (name) =>
        `<option value="${esc(name)}" ` +
        `${name === ui.perfExercise ? 'selected' : ''}>` +
          esc(name) +
        '</option>'
    )
    .join('');

  const range = ui.perfRange || 'month';

  const points = exercisePerformancePoints(
    ui.perfExercise,
    range
  );

  let summary = '';

  if (points.length > 0) {
    const latest = points[points.length - 1];
    const peak = Math.max(
      ...points.map((point) => point.value)
    );

    summary =
      '<div class="summary-strip" ' +
      'style="grid-template-columns:1fr 1fr;">' +
        '<div class="box">' +
          `<div class="v mono">${esc(latest.value)} ` +
          `${esc(state.profile.unit)}</div>` +
          '<div class="k">Latest</div>' +
        '</div>' +
        '<div class="box">' +
          `<div class="v mono">${esc(peak)} ` +
          `${esc(state.profile.unit)}</div>` +
          '<div class="k">Peak in range</div>' +
        '</div>' +
      '</div>';
  }

  return (
    '<div class="section-title">' +
      '<div class="bar"></div>' +
      '<h2>Performance</h2>' +
    '</div>' +
    '<div class="card">' +
      '<div class="field">' +
        '<label>Exercise</label>' +
        '<select data-action-input="perf-exercise">' +
          exerciseOptions +
        '</select>' +
      '</div>' +
      rangeToggle('perfRange', range) +
      renderLineChart(points, {
        color: '#E0B23F',
        unit: state.profile.unit,
        emptyText:
          'Log this exercise a couple more times to see a trend.',
      }) +
      summary +
    '</div>'
  );
}

/**
 * Build the complete PRs screen.
 */
export function renderPRs() {
  const activeSubtab = ui.prSubTab || 'records';

  let content;

  if (activeSubtab === 'body') {
    content = renderPRBody();
  } else if (activeSubtab === 'performance') {
    content = renderPRPerformance();
  } else {
    content = renderPRRecords();
  }

  return renderPrSubtabs(activeSubtab) + content;
}
