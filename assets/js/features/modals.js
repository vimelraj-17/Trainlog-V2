/**
 * TrainLog modal forms
 *
 * Renders the existing workout chooser, workout forms, body-log form, and
 * calendar-import preview. Form actions are connected later by events.js.
 */

import {
  DEFAULT_SPORTS,
  WORKOUT_CATEGORIES,
} from '../core/constants.js';

import { state, ui } from '../core/state.js';

import {
  esc,
  fmtDateShort,
  fmtPace,
  num,
  todayKey,
} from '../core/helpers.js';

import {
  dateField,
  modalSheet,
  quickWorkoutButton,
  saveBar,
  textField,
  textareaField,
} from '../ui/components.js';

import { icon } from '../ui/icons.js';

/**
 * Return fresh empty form data for one modal type.
 */
export function blankModalData(type) {
  const blanks = {
    strength: {
      exercises: [
        {
          name: '',
          sets: [{ reps: '', weight: '' }],
        },
      ],
    },
    hiit: {
      name: '',
      duration: '',
      notes: '',
    },
    running: {
      distance: '',
      duration: '',
      notes: '',
    },
    hiking: {
      place: '',
      distance: '',
      duration: '',
      elevation: '',
      notes: '',
    },
    other: {
      sport: '',
      duration: '',
      notes: '',
    },
    body: {
      weight: '',
      remarks: '',
      photoDataUrl: null,
    },
  };

  return blanks[type] || null;
}

/**
 * Open the workout-type chooser.
 */
export function openChooser(date = todayKey()) {
  ui.modal = {
    step: 'chooser',
    date,
  };

  return renderModal();
}

/**
 * Open a workout form with fresh temporary data.
 */
export function openLogForm(type, date = todayKey()) {
  const data = blankModalData(type);

  if (!data) {
    return '';
  }

  ui.modal = {
    step: type,
    date,
    data,
  };

  return renderModal();
}

/**
 * Open the body-log form.
 */
export function openBodyForm(date = todayKey()) {
  ui.modal = {
    step: 'body',
    date,
    data: blankModalData('body'),
  };

  return renderModal();
}

/**
 * Close the currently open modal.
 */
export function closeModal() {
  ui.modal = null;
  return renderModal();
}

/**
 * Return the default sport suggestions plus sports already logged by the user.
 */
export function getAllSportNames() {
  const names = new Set(DEFAULT_SPORTS);

  Object.values(state.workouts).forEach((entries) => {
    if (!Array.isArray(entries)) {
      return;
    }

    entries.forEach((entry) => {
      if (entry && entry.type === 'other' && entry.sport) {
        names.add(entry.sport);
      }
    });
  });

  return [...names].sort();
}

/**
 * Render the existing workout chooser.
 */
function renderChooser(modal) {
  const choices =
    '<div class="typegrid">' +
      quickWorkoutButton('strength', 'Strength', 'Sets & reps') +
      quickWorkoutButton('hiit', 'HIIT', 'Time & details') +
      quickWorkoutButton('running', 'Running', 'Distance & pace') +
      quickWorkoutButton('hiking', 'Hiking', 'Trail & elevation') +
      quickWorkoutButton('other', 'Other', 'Any sport') +
    '</div>';

  return modalSheet(
    'Log a workout',
    dateField(modal.date) + choices
  );
}

/**
 * Render the Strength form.
 */
function renderStrengthForm(modal) {
  const exerciseNames = Object.keys(
    state.exercisePresets
  ).sort();

  const exerciseOptions = exerciseNames
    .map((name) => `<option value="${esc(name)}"></option>`)
    .join('');

  const exercises = Array.isArray(modal.data.exercises)
    ? modal.data.exercises
    : [];

  const exerciseBlocks = exercises
    .map((exercise, exerciseIndex) => {
      const sets = Array.isArray(exercise.sets)
        ? exercise.sets
        : [];

      const removeExercise = exercises.length > 1
        ? '<button class="rm" type="button" ' +
          'data-action="remove-exercise" ' +
          `data-idx="${exerciseIndex}" ` +
          'aria-label="Remove exercise">' +
            icon('trash', 15) +
          '</button>'
        : '';

      const setRows = sets
        .map((set, setIndex) => {
          const removeSet = sets.length > 1
            ? '<button class="rm" type="button" ' +
              'data-action="remove-set" ' +
              `data-exidx="${exerciseIndex}" ` +
              `data-setidx="${setIndex}" ` +
              'aria-label="Remove set">' +
                icon('x', 14) +
              '</button>'
            : '<div></div>';

          return (
            '<div class="setrow">' +
              `<div class="idx">${setIndex + 1}</div>` +
              '<input type="number" inputmode="decimal" ' +
              'placeholder="Reps" ' +
              `value="${esc(set.reps)}" ` +
              'data-model="modal.data.exercises.' +
              `${exerciseIndex}.sets.${setIndex}.reps" ` +
              `aria-label="Set ${setIndex + 1} reps">` +
              '<input type="number" inputmode="decimal" ' +
              `placeholder="Weight (${esc(state.profile.unit)})" ` +
              `value="${esc(set.weight)}" ` +
              'data-model="modal.data.exercises.' +
              `${exerciseIndex}.sets.${setIndex}.weight" ` +
              `aria-label="Set ${setIndex + 1} weight">` +
              removeSet +
            '</div>'
          );
        })
        .join('');

      return (
        '<div class="exblock">' +
          '<div class="exhead">' +
            '<input list="exList" type="text" ' +
            'placeholder="Exercise name (e.g. Bench Press)" ' +
            `value="${esc(exercise.name)}" ` +
            `data-model="modal.data.exercises.${exerciseIndex}.name" ` +
            `data-exname-idx="${exerciseIndex}">` +
            removeExercise +
          '</div>' +
          setRows +
          '<button class="addset-btn" type="button" ' +
          'data-action="add-set" ' +
          `data-exidx="${exerciseIndex}">+ Add set</button>` +
        '</div>'
      );
    })
    .join('');

  const content =
    dateField(modal.date) +
    `<datalist id="exList">${exerciseOptions}</datalist>` +
    exerciseBlocks +
    '<button class="addex-btn" type="button" ' +
    'data-action="add-exercise">+ Add exercise</button>' +
    '<div class="muted" style="margin:8px 2px 0;">' +
      'Pick a saved exercise to auto-fill your usual sets, reps & weight.' +
    '</div>' +
    saveBar('strength');

  return modalSheet('Strength', content, {
    color: WORKOUT_CATEGORIES.strength.color,
  });
}

/**
 * Render the HIIT form.
 */
function renderHiitForm(modal) {
  const content =
    dateField(modal.date) +
    textField({
      label: 'Workout name',
      placeholder: 'e.g. Tabata Circuit',
      model: 'modal.data.name',
      value: modal.data.name,
    }) +
    textField({
      label: 'Duration (min)',
      placeholder: 'e.g. 25',
      model: 'modal.data.duration',
      value: modal.data.duration,
      type: 'number',
    }) +
    textareaField({
      label: 'Details',
      placeholder: 'Rounds, exercises, intensity…',
      model: 'modal.data.notes',
      value: modal.data.notes,
    }) +
    saveBar('hiit');

  return modalSheet('HIIT', content, {
    color: WORKOUT_CATEGORIES.hiit.color,
  });
}

/**
 * Build the live pace preview shared by Running and Hiking.
 */
function pacePreview(distance, duration) {
  const distanceNumber = num(distance);
  const durationNumber = num(duration);

  const pace = distanceNumber > 0 && durationNumber > 0
    ? fmtPace(durationNumber / distanceNumber)
    : '—';

  return (
    '<div class="pace-preview" id="pacePreview">' +
      `Pace: ${esc(pace)}` +
    '</div>'
  );
}

/**
 * Render the Running form.
 */
function renderRunningForm(modal) {
  const content =
    dateField(modal.date) +
    textField({
      label: 'Distance (km)',
      placeholder: 'e.g. 5.2',
      model: 'modal.data.distance',
      value: modal.data.distance,
      type: 'number',
    }) +
    textField({
      label: 'Duration (min)',
      placeholder: 'e.g. 27',
      model: 'modal.data.duration',
      value: modal.data.duration,
      type: 'number',
    }) +
    pacePreview(modal.data.distance, modal.data.duration) +
    textareaField({
      label: 'Notes',
      placeholder: 'Route, feel, weather…',
      model: 'modal.data.notes',
      value: modal.data.notes,
    }) +
    saveBar('running');

  return modalSheet('Running', content, {
    color: WORKOUT_CATEGORIES.running.color,
  });
}

/**
 * Render the Hiking form.
 */
function renderHikingForm(modal) {
  const content =
    dateField(modal.date) +
    textField({
      label: 'Place / trail',
      placeholder: 'e.g. Bukit Kutu',
      model: 'modal.data.place',
      value: modal.data.place,
    }) +
    textField({
      label: 'Distance (km)',
      placeholder: 'e.g. 8.4',
      model: 'modal.data.distance',
      value: modal.data.distance,
      type: 'number',
    }) +
    textField({
      label: 'Duration (min)',
      placeholder: 'e.g. 180',
      model: 'modal.data.duration',
      value: modal.data.duration,
      type: 'number',
    }) +
    textField({
      label: 'Elevation gain (m)',
      placeholder: 'e.g. 620',
      model: 'modal.data.elevation',
      value: modal.data.elevation,
      type: 'number',
    }) +
    pacePreview(modal.data.distance, modal.data.duration) +
    textareaField({
      label: 'Notes',
      placeholder: 'Trail conditions, views, gear…',
      model: 'modal.data.notes',
      value: modal.data.notes,
    }) +
    saveBar('hiking');

  return modalSheet('Hiking', content, {
    color: WORKOUT_CATEGORIES.hiking.color,
  });
}

/**
 * Render the Other sport form.
 */
function renderOtherForm(modal) {
  const sportOptions = getAllSportNames()
    .map((name) => `<option value="${esc(name)}"></option>`)
    .join('');

  const content =
    dateField(modal.date) +
    `<datalist id="sportList">${sportOptions}</datalist>` +
    '<div class="field">' +
      '<label>Sport / activity</label>' +
      '<input list="sportList" type="text" ' +
      'placeholder="e.g. Basketball" ' +
      `value="${esc(modal.data.sport)}" ` +
      'data-model="modal.data.sport">' +
    '</div>' +
    textField({
      label: 'Duration (min)',
      placeholder: 'e.g. 45',
      model: 'modal.data.duration',
      value: modal.data.duration,
      type: 'number',
    }) +
    textareaField({
      label: 'Notes',
      placeholder: 'Details, opponents, score…',
      model: 'modal.data.notes',
      value: modal.data.notes,
    }) +
    saveBar('other');

  return modalSheet('Other sport', content, {
    color: WORKOUT_CATEGORIES.other.color,
  });
}

/**
 * Render the Body log form.
 */
function renderBodyForm(modal) {
  const photoControl = modal.data.photoDataUrl
    ? '<div class="photo-preview">' +
        `<img src="${esc(modal.data.photoDataUrl)}" ` +
        'alt="Selected body progress">' +
        '<button class="rmphoto" type="button" ' +
        'data-action="remove-photo" aria-label="Remove photo">' +
          icon('x', 13) +
        '</button>' +
      '</div>'
    : '<label class="photo-input-btn">' +
        icon('plus', 16) +
        ' Add photo' +
        '<input type="file" accept="image/*" capture="environment" ' +
        'data-action-input="body-photo" style="display:none">' +
      '</label>';

  const content =
    dateField(modal.date) +
    textField({
      label: `Weight (${state.profile.unit})`,
      placeholder: 'e.g. 72.4',
      model: 'modal.data.weight',
      value: modal.data.weight,
      type: 'number',
    }) +
    '<div class="field">' +
      '<label>Photo</label>' +
      photoControl +
    '</div>' +
    textareaField({
      label: 'Remarks',
      placeholder: 'How you’re feeling, measurements…',
      model: 'modal.data.remarks',
      value: modal.data.remarks,
    }) +
    '<div class="savebar">' +
      '<button class="save-btn" type="button" ' +
      'data-action="save-body">Save entry</button>' +
    '</div>';

  return modalSheet('Body log', content);
}

/**
 * Render the calendar-import review form.
 */
function renderImportForm() {
  const preview = Array.isArray(ui.importPreview)
    ? ui.importPreview
    : [];

  if (preview.length === 0) {
    return modalSheet(
      'Import events',
      '<div class="empty">No events found in that file.</div>'
    );
  }

  const eventBlocks = preview
    .map((event, index) => {
      const typeOptions = [
        'hiking',
        'running',
        'hiit',
        'other',
      ]
        .map(
          (type) =>
            `<option value="${type}" ` +
            `${event.type === type ? 'selected' : ''}>` +
              esc(WORKOUT_CATEGORIES[type].label) +
            '</option>'
        )
        .join('');

      const distanceField =
        event.type === 'hiking' || event.type === 'running'
          ? '<input type="number" inputmode="decimal" ' +
            'placeholder="Distance (km)" ' +
            `value="${esc(event.distance || '')}" ` +
            'data-action-input="import-distance" ' +
            `data-idx="${index}">`
          : '';

      const duration = event.duration
        ? ` — ${esc(event.duration)} min`
        : '';

      return (
        '<div class="exblock">' +
          '<div style="display:flex; align-items:center; gap:8px; ' +
          'margin-bottom:8px;">' +
            '<input type="checkbox" data-action="toggle-import" ' +
            `data-idx="${index}" ` +
            `${event.selected !== false ? 'checked' : ''} ` +
            'style="width:auto;">' +
            '<div style="flex:1; min-width:0;">' +
              `<div class="importrow-title">${esc(event.title)}</div>` +
              '<div class="importrow-meta">' +
                esc(fmtDateShort(event.date)) +
                duration +
              '</div>' +
            '</div>' +
          '</div>' +
          '<select data-action-input="import-type" ' +
          `data-idx="${index}" style="margin-bottom:8px;">` +
            typeOptions +
          '</select>' +
          distanceField +
        '</div>'
      );
    })
    .join('');

  const intro =
    '<div class="muted" style="margin-bottom:10px;">' +
      `Found ${preview.length} event${preview.length === 1 ? '' : 's'}. ` +
      'Review the type and add distance where useful, then import.' +
    '</div>';

  const save =
    '<div class="savebar">' +
      '<button class="save-btn" type="button" ' +
      'data-action="do-import">Import selected</button>' +
    '</div>';

  return modalSheet(
    'Import events',
    intro + eventBlocks + save
  );
}

/**
 * Return the current modal as HTML.
 */
export function renderModalHtml() {
  const modal = ui.modal;

  if (!modal) {
    return '';
  }

  if (modal.step === 'chooser') {
    return renderChooser(modal);
  }

  if (modal.step === 'import') {
    return renderImportForm();
  }

  if (!modal.data) {
    modal.data = blankModalData(modal.step);
  }

  if (modal.step === 'strength') {
    return renderStrengthForm(modal);
  }

  if (modal.step === 'hiit') {
    return renderHiitForm(modal);
  }

  if (modal.step === 'running') {
    return renderRunningForm(modal);
  }

  if (modal.step === 'hiking') {
    return renderHikingForm(modal);
  }

  if (modal.step === 'other') {
    return renderOtherForm(modal);
  }

  if (modal.step === 'body') {
    return renderBodyForm(modal);
  }

  return '';
}

/**
 * Render the current modal into #modal-root.
 */
export function renderModal() {
  const html = renderModalHtml();

  if (typeof document === 'undefined') {
    return html;
  }

  const root = document.getElementById('modal-root');

  if (root) {
    root.innerHTML = html;
  }

  return html;
}
