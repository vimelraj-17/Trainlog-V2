/**
 * TrainLog event handling
 *
 * Connects the rendered interface to temporary UI state, permanent TrainLog
 * state, storage, modal forms, calendar transfer, backups, and body photos.
 * app.js supplies the full-screen render function through bindEvents().
 */

import {
  CALENDAR_EXPORT,
  NAVIGATION_TABS,
  WORKOUT_CATEGORIES,
} from './core/constants.js';

import {
  clearPhotoCache,
  state,
  ui,
} from './core/state.js';

import {
  clearAllData,
  createBackupJson,
  deletePhoto,
  loadPhoto,
  restoreBackupJson,
  savePhoto,
  saveState,
} from './core/storage.js';

import {
  esc,
  fmtPace,
  num,
  setPath,
  todayKey,
  toKey,
  uid,
} from './core/helpers.js';

import {
  closeModal,
  openBodyForm,
  openChooser,
  openLogForm,
  renderModal,
} from './features/modals.js';

import { allEntriesFlat } from './features/home.js';

import {
  flash,
  summarizeWorkout,
} from './ui/components.js';

let renderApplication = () => {};
let eventsBound = false;

/**
 * Render the full application after a state or screen change.
 */
function renderAll() {
  renderApplication();

  // Body-photo thumbnails are stored separately and load asynchronously.
  window.requestAnimationFrame(() => {
    loadPendingPhotos();
  });
}

/**
 * Download browser-generated content as a file.
 */
function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 4000);
}

/**
 * Read a selected browser File as text.
 */
export function readFileText(file) {
  if (!file) {
    return Promise.reject(new Error('No file was selected.'));
  }

  if (typeof file.text === 'function') {
    return file.text();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('The file could not be read.'));
    reader.readAsText(file);
  });
}

/**
 * Resize a body photo to the same maximum width and JPEG quality used by the
 * original single-file TrainLog app.
 */
export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const maximumWidth = 640;
        const scale = Math.min(1, maximumWidth / image.width);
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          reject(new Error('Photo processing is unavailable.'));
          return;
        }

        canvas.width = width;
        canvas.height = height;

        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };

      image.onerror = () => reject(new Error('The photo could not be read.'));
      image.src = String(reader.result || '');
    };

    reader.onerror = () => reject(new Error('The photo could not be read.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Show one stored body photo over the app.
 */
export function showLightbox(dataUrl) {
  if (!dataUrl) {
    return;
  }

  const backdrop = document.createElement('div');
  const image = document.createElement('img');

  backdrop.className = 'backdrop';
  backdrop.style.zIndex = '300';
  backdrop.setAttribute('role', 'button');
  backdrop.setAttribute('aria-label', 'Close body photo');
  backdrop.tabIndex = 0;

  image.src = dataUrl;
  image.alt = 'Body progress';
  image.style.cssText = [
    'max-width:92%',
    'max-height:80vh',
    'border-radius:14px',
    'border:1px solid var(--line-strong)',
  ].join(';');

  const close = () => backdrop.remove();

  backdrop.appendChild(image);
  backdrop.addEventListener('click', close);
  backdrop.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  });

  document.body.appendChild(backdrop);
  backdrop.focus();
}

/**
 * Fill body-log thumbnail placeholders from separately stored photo data.
 */
export async function loadPendingPhotos() {
  if (typeof document === 'undefined') {
    return;
  }

  const thumbnails = [
    ...document.querySelectorAll('[data-photo-thumb]'),
  ];

  await Promise.all(
    thumbnails.map(async (thumbnail) => {
      const entryId = thumbnail.getAttribute('data-photo-thumb');
      const entry = state.bodyLogs.find(
        (bodyLog) => bodyLog && bodyLog.id === entryId
      );

      if (!entry || !entry.hasPhoto) {
        return;
      }

      const dataUrl = await loadPhoto(entryId);

      if (!dataUrl) {
        return;
      }

      if (
        !thumbnail.isConnected ||
        thumbnail.getAttribute('data-photo-thumb') !== entryId
      ) {
        return;
      }

      const image = document.createElement('img');

      image.src = dataUrl;
      image.alt = '';
      thumbnail.replaceChildren(image);
    })
  );
}

/**
 * Validate and save one workout form.
 */
export async function validateAndSaveWorkout(type) {
  const modal = ui.modal;

  if (
    !modal ||
    !modal.data ||
    !WORKOUT_CATEGORIES[type] ||
    modal.step !== type
  ) {
    return false;
  }

  const date = modal.date || todayKey();
  const entry = {
    id: uid(),
    type,
  };

  if (type === 'strength') {
    const exercises = (modal.data.exercises || [])
      .filter(
        (exercise) =>
          exercise && String(exercise.name || '').trim()
      )
      .map((exercise) => ({
        name: String(exercise.name).trim(),
        sets: (exercise.sets || [])
          .filter(
            (set) =>
              set && (set.reps !== '' || set.weight !== '')
          )
          .map((set) => ({
            reps: num(set.reps),
            weight: num(set.weight),
          })),
      }))
      .filter((exercise) => exercise.sets.length > 0);

    if (exercises.length === 0) {
      flash('Add at least one exercise with a set.');
      return false;
    }

    entry.exercises = exercises;

    exercises.forEach((exercise) => {
      const firstSet = exercise.sets[0];

      state.exercisePresets[exercise.name] = {
        sets: exercise.sets.length,
        reps: firstSet.reps,
        weight: firstSet.weight,
      };
    });
  }

  if (type === 'hiit') {
    if (!modal.data.duration && !modal.data.name) {
      flash('Add a name or duration.');
      return false;
    }

    entry.name = String(modal.data.name || '').trim();
    entry.duration = num(modal.data.duration);
    entry.notes = String(modal.data.notes || '').trim();
  }

  if (type === 'running') {
    if (num(modal.data.distance) <= 0) {
      flash('Add a distance.');
      return false;
    }

    entry.distance = num(modal.data.distance);
    entry.duration = num(modal.data.duration);
    entry.notes = String(modal.data.notes || '').trim();
  }

  if (type === 'hiking') {
    if (num(modal.data.distance) <= 0) {
      flash('Add a distance.');
      return false;
    }

    entry.place = String(modal.data.place || '').trim();
    entry.distance = num(modal.data.distance);
    entry.duration = num(modal.data.duration);
    entry.elevation = num(modal.data.elevation);
    entry.notes = String(modal.data.notes || '').trim();
  }

  if (type === 'other') {
    const sport = String(modal.data.sport || '').trim();

    if (!sport) {
      flash('Add a sport or activity.');
      return false;
    }

    entry.sport = sport;
    entry.duration = num(modal.data.duration);
    entry.notes = String(modal.data.notes || '').trim();
  }

  if (!Array.isArray(state.workouts[date])) {
    state.workouts[date] = [];
  }

  state.workouts[date].push(entry);

  const saved = await saveState();

  if (!saved) {
    state.workouts[date] = state.workouts[date].filter(
      (workout) => workout.id !== entry.id
    );

    if (state.workouts[date].length === 0) {
      delete state.workouts[date];
    }

    flash('Workout could not be saved.');
    return false;
  }

  ui.selectedDay = date;
  ui.workoutDate = date;
  ui.modal = null;
  renderAll();

  return true;
}

/**
 * Save the current body-log form and its optional separately stored photo.
 */
export async function saveBodyEntry() {
  const modal = ui.modal;

  if (!modal || modal.step !== 'body' || !modal.data) {
    return false;
  }

  if (!modal.data.weight) {
    flash('Add a weight.');
    return false;
  }

  const entry = {
    id: uid(),
    date: modal.date || todayKey(),
    weight: num(modal.data.weight),
    remarks: String(modal.data.remarks || '').trim(),
    hasPhoto: Boolean(modal.data.photoDataUrl),
  };

  if (modal.data.photoDataUrl) {
    const photoSaved = await savePhoto(
      entry.id,
      modal.data.photoDataUrl
    );

    if (!photoSaved) {
      entry.hasPhoto = false;
      flash('The entry was saved without its photo.');
    }
  }

  state.bodyLogs.push(entry);

  const saved = await saveState();

  if (!saved) {
    state.bodyLogs = state.bodyLogs.filter(
      (bodyLog) => bodyLog.id !== entry.id
    );

    if (entry.hasPhoto) {
      await deletePhoto(entry.id);
    }

    flash('Body entry could not be saved.');
    return false;
  }

  ui.modal = null;
  renderAll();

  return true;
}

/**
 * Escape text for an iCalendar property value.
 */
export function escapeICS(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/([,;])/g, '\\$1');
}

/**
 * Return the calendar title for one saved workout.
 */
export function workoutICSTitle(entry) {
  const titles = {
    strength: 'Strength Workout',
    hiit: entry.name || 'HIIT Workout',
    running: 'Run',
    hiking: `Hike${entry.place ? ` — ${entry.place}` : ''}`,
    other: entry.sport || 'Workout',
  };

  return titles[entry.type] || 'Workout';
}

/**
 * Format a local Date for the existing floating-time calendar export.
 */
export function formatICSDate(date) {
  return (
    String(date.getFullYear()) +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0') +
    'T' +
    String(date.getHours()).padStart(2, '0') +
    String(date.getMinutes()).padStart(2, '0') +
    '00'
  );
}

/**
 * Build a complete .ics calendar string from saved TrainLog workouts.
 */
export function buildICS(entries = allEntriesFlat()) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${CALENDAR_EXPORT.productId}`,
  ];

  entries.forEach((entry) => {
    const duration =
      num(entry.duration) || (entry.type === 'strength' ? 45 : 30);

    const start = new Date(`${entry.date}T07:00:00`);
    const end = new Date(start.getTime() + duration * 60000);

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${entry.id}@${CALENDAR_EXPORT.uidDomain}`);
    lines.push(`DTSTART:${formatICSDate(start)}`);
    lines.push(`DTEND:${formatICSDate(end)}`);
    lines.push(`SUMMARY:${escapeICS(workoutICSTitle(entry))}`);
    lines.push(`DESCRIPTION:${escapeICS(summarizeWorkout(entry))}`);

    if (entry.type === 'hiking' && entry.place) {
      lines.push(`LOCATION:${escapeICS(entry.place)}`);
    }

    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * Download all saved workouts as an iCalendar file.
 */
export function exportICS() {
  const entries = allEntriesFlat();

  if (entries.length === 0) {
    flash('No workouts to export yet.');
    return false;
  }

  downloadBlob(
    new Blob([buildICS(entries)], { type: 'text/calendar' }),
    CALENDAR_EXPORT.fileName
  );

  return true;
}

/**
 * Read one property from an iCalendar VEVENT block.
 */
function matchICSProperty(block, key) {
  const expression = new RegExp(
    `(?:^|\\n)${key}(?:;[^:\\n]*)?:([^\\r\\n]*)`,
    'i'
  );

  const match = block.match(expression);
  return match ? match[1].trim() : null;
}

/**
 * Unescape an iCalendar text value.
 */
export function unescapeICS(value) {
  return String(value || '')
    .replace(/\\n/gi, ' ')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

/**
 * Parse the local/date-only format used by TrainLog's calendar transfer.
 */
export function icsDateToDate(value) {
  if (!value) {
    return null;
  }

  const match = String(value)
    .replace('Z', '')
    .match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?/);

  if (!match) {
    return null;
  }

  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    match[4] ? Number(match[4]) : 0,
    match[5] ? Number(match[5]) : 0,
    match[6] ? Number(match[6]) : 0
  );
}

/**
 * Guess a TrainLog category from a calendar event title.
 */
export function guessWorkoutType(title) {
  const value = String(title || '').toLowerCase();

  if (/hik|trail|trek/.test(value)) {
    return 'hiking';
  }

  if (/run|jog/.test(value)) {
    return 'running';
  }

  if (/hiit|tabata|circuit|interval/.test(value)) {
    return 'hiit';
  }

  return 'other';
}

/**
 * Parse supported VEVENT records from an .ics file.
 */
export function parseICS(text) {
  const events = [];
  const unfoldedText = String(text || '').replace(/\r?\n[ \t]/g, '');
  const blocks = unfoldedText.split(/BEGIN:VEVENT/i).slice(1);

  blocks.forEach((sourceBlock) => {
    try {
      const block = sourceBlock.split(/END:VEVENT/i)[0];
      const summary = matchICSProperty(block, 'SUMMARY');
      const startValue = matchICSProperty(block, 'DTSTART');
      const endValue = matchICSProperty(block, 'DTEND');
      const location = matchICSProperty(block, 'LOCATION');

      if (!summary || !startValue) {
        return;
      }

      const start = icsDateToDate(startValue);

      if (!start) {
        return;
      }

      let duration = null;

      if (endValue) {
        const end = icsDateToDate(endValue);

        if (end) {
          duration = Math.max(
            0,
            Math.round((end.getTime() - start.getTime()) / 60000)
          );
        }
      }

      const title = unescapeICS(summary);

      events.push({
        title,
        date: toKey(start),
        duration,
        location: location ? unescapeICS(location) : '',
        type: guessWorkoutType(title),
        selected: true,
      });
    } catch (error) {
      // Skip malformed calendar events and continue reading the file.
    }
  });

  return events;
}

/**
 * Open the calendar-import review modal for one chosen .ics file.
 */
export async function handleICSFile(file) {
  try {
    const events = parseICS(await readFileText(file));

    if (events.length === 0) {
      flash('No events found in that file.');
    }

    ui.importPreview = events;
    ui.modal = {
      step: 'import',
      date: todayKey(),
    };

    renderModal();
    return events;
  } catch (error) {
    flash('Could not read that calendar file.');
    return [];
  }
}

/**
 * Convert one reviewed calendar event into a TrainLog workout entry.
 */
export function buildImportedEntry(event) {
  const duration = event.duration || 30;
  const base = {
    id: uid(),
    type: event.type,
    notes: `Imported from calendar: ${event.title}`,
  };

  if (event.type === 'hiking') {
    return {
      ...base,
      place: event.location || event.title,
      distance: num(event.distance),
      duration,
      elevation: 0,
    };
  }

  if (event.type === 'running') {
    return {
      ...base,
      distance: num(event.distance),
      duration,
    };
  }

  if (event.type === 'hiit') {
    return {
      ...base,
      name: event.title,
      duration,
    };
  }

  return {
    ...base,
    type: 'other',
    sport: event.title,
    duration,
  };
}

/**
 * Save the calendar events selected in the import review modal.
 */
export async function importSelectedEvents() {
  let count = 0;

  (ui.importPreview || []).forEach((event) => {
    if (event.selected === false) {
      return;
    }

    const entry = buildImportedEntry(event);

    if (!Array.isArray(state.workouts[event.date])) {
      state.workouts[event.date] = [];
    }

    state.workouts[event.date].push(entry);
    count += 1;
  });

  const saved = await saveState();

  if (!saved) {
    flash('Imported events could not be saved.');
    return false;
  }

  ui.importPreview = null;
  ui.modal = null;
  renderAll();
  flash(`${count} event${count === 1 ? '' : 's'} imported.`);

  return true;
}

/**
 * Download the current permanent state in TrainLog's existing JSON shape.
 */
export function exportBackup() {
  const fileName = `trainlog-backup-${todayKey()}.json`;

  downloadBlob(
    new Blob([createBackupJson()], { type: 'application/json' }),
    fileName
  );
}

/**
 * Restore a selected JSON backup after user confirmation.
 */
export async function handleBackupFile(file) {
  if (!file) {
    return false;
  }

  const approved = window.confirm(
    'Restore this TrainLog backup? Current workout and profile data will be replaced.'
  );

  if (!approved) {
    return false;
  }

  try {
    const backupText = await readFileText(file);

    await restoreBackupJson(backupText);
    clearPhotoCache();

    ui.importPreview = null;
    ui.modal = null;

    renderAll();
    flash('Backup restored.');
    return true;
  } catch (error) {
    flash(error.message || 'Could not restore that backup.');
    return false;
  }
}

/**
 * Update the visible pace without rebuilding the entire modal form.
 */
function updatePacePreview() {
  if (
    !ui.modal ||
    !ui.modal.data ||
    (ui.modal.step !== 'running' && ui.modal.step !== 'hiking')
  ) {
    return;
  }

  const preview = document.getElementById('pacePreview');

  if (!preview) {
    return;
  }

  const distance = num(ui.modal.data.distance);
  const duration = num(ui.modal.data.duration);
  const pace =
    distance > 0 && duration > 0
      ? fmtPace(duration / distance)
      : '—';

  preview.textContent = `Pace: ${pace}`;
}

/**
 * Determine the correct logging date for a quick-workout button.
 */
function loggingDate() {
  if (ui.modal && ui.modal.step === 'chooser') {
    return ui.modal.date;
  }

  if (ui.tab === 'calendar') {
    return ui.selectedDay || todayKey();
  }

  if (ui.tab === 'workout') {
    return ui.workoutDate || todayKey();
  }

  return todayKey();
}

/**
 * Handle all click actions rendered throughout TrainLog.
 */
async function handleClick(event) {
  const target = event.target.closest('[data-action]');

  if (!target) {
    return;
  }

  const action = target.dataset.action;

  if (action === 'nav') {
    const tabExists = NAVIGATION_TABS.some(
      (tab) => tab.id === target.dataset.tab
    );

    if (tabExists) {
      ui.tab = target.dataset.tab;
      ui.modal = null;
      renderAll();
    }

    return;
  }

  if (action === 'nav-prs-shortcut') {
    ui.tab = 'prs';
    ui.prSubTab = 'records';
    ui.modal = null;
    renderAll();
    return;
  }

  if (action === 'nav-sub') {
    ui.prSubTab = target.dataset.subtab;
    renderAll();
    return;
  }

  if (action === 'set-range') {
    const rangeKey = target.dataset.rangeKey;

    if (rangeKey === 'bodyRange' || rangeKey === 'perfRange') {
      ui[rangeKey] = target.dataset.rangeVal;
      renderAll();
    }

    return;
  }

  if (action === 'open-log') {
    openLogForm(target.dataset.type, loggingDate());
    return;
  }

  if (action === 'open-log-chooser') {
    openChooser(target.dataset.date || todayKey());
    return;
  }

  if (action === 'open-body-form') {
    openBodyForm(target.dataset.date || todayKey());
    return;
  }

  if (action === 'close-modal') {
    closeModal();
    return;
  }

  if (action === 'modal-backdrop') {
    if (!event.target.closest('[data-stop]')) {
      closeModal();
    }

    return;
  }

  if (action === 'cal-prev' || action === 'cal-next') {
    ui.calMonth += action === 'cal-prev' ? -1 : 1;

    if (ui.calMonth < 0) {
      ui.calMonth = 11;
      ui.calYear -= 1;
    }

    if (ui.calMonth > 11) {
      ui.calMonth = 0;
      ui.calYear += 1;
    }

    renderAll();
    return;
  }

  if (action === 'select-day') {
    ui.selectedDay = target.dataset.day;
    renderAll();
    return;
  }

  if (action === 'add-exercise' && ui.modal?.data?.exercises) {
    ui.modal.data.exercises.push({
      name: '',
      sets: [{ reps: '', weight: '' }],
    });

    renderModal();
    return;
  }

  if (action === 'remove-exercise' && ui.modal?.data?.exercises) {
    ui.modal.data.exercises.splice(Number(target.dataset.idx), 1);
    renderModal();
    return;
  }

  if (action === 'add-set' && ui.modal?.data?.exercises) {
    const exercise = ui.modal.data.exercises[Number(target.dataset.exidx)];

    if (exercise) {
      exercise.sets.push({ reps: '', weight: '' });
      renderModal();
    }

    return;
  }

  if (action === 'remove-set' && ui.modal?.data?.exercises) {
    const exercise = ui.modal.data.exercises[Number(target.dataset.exidx)];

    if (exercise) {
      exercise.sets.splice(Number(target.dataset.setidx), 1);
      renderModal();
    }

    return;
  }

  if (action === 'save-workout') {
    await validateAndSaveWorkout(target.dataset.type);
    return;
  }

  if (action === 'save-body') {
    await saveBodyEntry();
    return;
  }

  if (action === 'remove-photo' && ui.modal?.data) {
    ui.modal.data.photoDataUrl = null;
    renderModal();
    return;
  }

  if (action === 'view-photo') {
    const dataUrl = await loadPhoto(target.dataset.id);

    if (dataUrl) {
      showLightbox(dataUrl);
    } else {
      flash('That photo is not available on this device.');
    }

    return;
  }

  if (action === 'delete-body') {
    const entryId = target.dataset.id;

    state.bodyLogs = state.bodyLogs.filter(
      (entry) => entry.id !== entryId
    );

    await deletePhoto(entryId);
    await saveState();
    renderAll();
    return;
  }

  if (action === 'delete-entry') {
    const date = target.dataset.date;
    const entryId = target.dataset.id;

    if (Array.isArray(state.workouts[date])) {
      state.workouts[date] = state.workouts[date].filter(
        (entry) => entry.id !== entryId
      );

      if (state.workouts[date].length === 0) {
        delete state.workouts[date];
      }

      await saveState();
      renderAll();
    }

    return;
  }

  if (action === 'set-unit') {
    if (target.dataset.unit === 'kg' || target.dataset.unit === 'lb') {
      state.profile.unit = target.dataset.unit;
      await saveState();
      renderAll();
    }

    return;
  }

  if (action === 'add-fav') {
    const input = document.getElementById('favInput');
    const favourite = input ? input.value.trim() : '';

    if (
      favourite &&
      !state.profile.favourites.includes(favourite)
    ) {
      state.profile.favourites.push(favourite);
      await saveState();
    }

    renderAll();
    return;
  }

  if (action === 'remove-fav') {
    state.profile.favourites = state.profile.favourites.filter(
      (favourite) => favourite !== target.dataset.value
    );

    await saveState();
    renderAll();
    return;
  }

  if (action === 'add-preset') {
    const input = document.getElementById('newPresetName');
    const presetName = input ? input.value.trim() : '';

    if (presetName && !state.exercisePresets[presetName]) {
      state.exercisePresets[presetName] = {
        sets: 3,
        reps: 8,
        weight: 0,
      };

      await saveState();
    }

    renderAll();
    return;
  }

  if (action === 'remove-preset') {
    delete state.exercisePresets[target.dataset.name];
    await saveState();
    renderAll();
    return;
  }

  if (action === 'export-ics') {
    exportICS();
    return;
  }

  if (action === 'toggle-import' && ui.importPreview) {
    const importedEvent = ui.importPreview[Number(target.dataset.idx)];

    if (importedEvent) {
      importedEvent.selected = target.checked;
    }

    return;
  }

  if (action === 'do-import') {
    await importSelectedEvents();
    return;
  }

  if (action === 'export-backup') {
    exportBackup();
    return;
  }

  if (action === 'reset-data') {
    const approved = window.confirm(
      'Clear all workout data and profile info? This cannot be undone.'
    );

    if (approved) {
      await clearAllData();
      ui.importPreview = null;
      ui.modal = null;
      renderAll();
    }
  }
}

/**
 * Keep temporary form state in sync while the user types.
 */
function handleInput(event) {
  const target = event.target;

  if (target.dataset?.model) {
    const path = target.dataset.model;

    if (path.startsWith('modal.') && ui.modal) {
      setPath(ui, path, target.value);
    }

    if (path === 'profile.age' || path === 'profile.weight') {
      setPath(
        state,
        path,
        target.value === '' ? null : num(target.value)
      );
    }
  }

  if (target.dataset?.presetField) {
    const presetName = target.dataset.presetName;

    if (!state.exercisePresets[presetName]) {
      state.exercisePresets[presetName] = {
        sets: 3,
        reps: 8,
        weight: 0,
      };
    }

    state.exercisePresets[presetName][target.dataset.presetField] = num(
      target.value
    );
  }

  if (target.dataset?.actionInput === 'modal-date' && ui.modal) {
    ui.modal.date = target.value;
  }

  if (
    target.dataset?.actionInput === 'import-distance' &&
    ui.importPreview
  ) {
    const importedEvent = ui.importPreview[Number(target.dataset.idx)];

    if (importedEvent) {
      importedEvent.distance = target.value;
    }
  }

  updatePacePreview();
}

/**
 * Handle committed fields, dropdowns, and selected files.
 */
async function handleChange(event) {
  const target = event.target;

  if (
    target.dataset?.model === 'profile.age' ||
    target.dataset?.model === 'profile.weight'
  ) {
    await saveState();
  }

  if (target.dataset?.presetField) {
    await saveState();
  }

  if (
    target.dataset?.exnameIdx !== undefined &&
    ui.modal?.step === 'strength'
  ) {
    const exerciseIndex = Number(target.dataset.exnameIdx);
    const exerciseName = target.value.trim();
    const preset = state.exercisePresets[exerciseName];
    const exercise = ui.modal.data.exercises[exerciseIndex];

    if (preset && exercise) {
      const sets = [];

      for (let index = 0; index < (preset.sets || 1); index += 1) {
        sets.push({
          reps: preset.reps || '',
          weight: preset.weight || '',
        });
      }

      exercise.name = exerciseName;
      exercise.sets = sets;
      renderModal();
    }
  }

  if (target.dataset?.actionInput === 'workout-date') {
    ui.workoutDate = target.value || todayKey();
    renderAll();
    return;
  }

  if (target.dataset?.actionInput === 'perf-exercise') {
    ui.perfExercise = target.value;
    renderAll();
    return;
  }

  if (
    target.dataset?.actionInput === 'import-type' &&
    ui.importPreview
  ) {
    const importedEvent = ui.importPreview[Number(target.dataset.idx)];

    if (importedEvent) {
      importedEvent.type = target.value;
      renderModal();
    }

    return;
  }

  if (
    target.type === 'file' &&
    target.dataset?.actionInput === 'body-photo'
  ) {
    const file = target.files?.[0];

    if (file) {
      try {
        const dataUrl = await compressImage(file);

        if (ui.modal?.step === 'body') {
          ui.modal.data.photoDataUrl = dataUrl;
          renderModal();
        }
      } catch (error) {
        flash('Could not read that photo.');
      }
    }

    return;
  }

  if (
    target.type === 'file' &&
    target.dataset?.actionInput === 'ics-import-file'
  ) {
    const file = target.files?.[0];

    if (file) {
      await handleICSFile(file);
    }

    target.value = '';
    return;
  }

  if (
    target.type === 'file' &&
    target.dataset?.actionInput === 'backup-import-file'
  ) {
    const file = target.files?.[0];

    if (file) {
      await handleBackupFile(file);
    }

    target.value = '';
  }
}

/**
 * Register TrainLog's delegated event handlers once.
 *
 * app.js calls this with its render function after the initial state load.
 */
export function bindEvents(renderApp) {
  if (typeof renderApp !== 'function') {
    throw new TypeError('bindEvents requires the TrainLog render function.');
  }

  renderApplication = renderApp;

  if (eventsBound || typeof document === 'undefined') {
    return;
  }

  document.addEventListener('click', handleClick);
  document.addEventListener('input', handleInput);
  document.addEventListener('change', handleChange);

  eventsBound = true;

  window.requestAnimationFrame(() => {
    loadPendingPhotos();
  });
}
