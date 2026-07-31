/**
 * TrainLog constants
 *
 * This file stores fixed values that are reused across the app. Keeping them
 * here prevents different features from accidentally using different names.
 */

// Do not change this key: existing TrainLog workout data is saved under it.
export const STORAGE_KEY = 'trainlog-data-v1';

// Body photos are saved separately because image data can be much larger than
// the main workout data. The body-log entry ID is added after this prefix.
// Example: trainlog-photo:abc123
export const PHOTO_STORAGE_PREFIX = 'trainlog-photo:';

export const APP_NAME = 'TrainLog';
export const DATE_LOCALE = 'en-US';

// Workout types used when saving entries and displaying category colours.
// The color values refer to CSS variables defined in trainlog.css.
export const WORKOUT_CATEGORIES = Object.freeze({
  strength: Object.freeze({
    label: 'Strength',
    color: 'var(--plate)',
    icon: 'dumbbell',
  }),
  hiit: Object.freeze({
    label: 'HIIT',
    color: 'var(--ember)',
    icon: 'bolt',
  }),
  running: Object.freeze({
    label: 'Running',
    color: 'var(--track)',
    icon: 'run',
  }),
  hiking: Object.freeze({
    label: 'Hiking',
    color: 'var(--trail)',
    icon: 'mountain',
  }),
  other: Object.freeze({
    label: 'Other',
    color: 'var(--other)',
    icon: 'star',
  }),
});

// Bottom navigation order. Workout is tab 3 and PRs is tab 4.
export const NAVIGATION_TABS = Object.freeze([
  Object.freeze({ id: 'home', label: 'Home', icon: 'home' }),
  Object.freeze({ id: 'calendar', label: 'Calendar', icon: 'calendar' }),
  Object.freeze({ id: 'workout', label: 'Workout', icon: 'dumbbell' }),
  Object.freeze({ id: 'prs', label: 'PRs', icon: 'trophy' }),
  Object.freeze({ id: 'profile', label: 'Profile', icon: 'user' }),
]);

// Options shared by the body-weight and performance charts.
export const CHART_RANGES = Object.freeze([
  Object.freeze({ id: 'week', label: 'Weekly', days: 7 }),
  Object.freeze({ id: 'month', label: 'Monthly', days: 30 }),
  Object.freeze({ id: '3month', label: '3 Months', days: 90 }),
]);

// Starting suggestions for the custom sport field. Users can still add their
// own sport names, just as they could in the original app.
export const DEFAULT_SPORTS = Object.freeze([
  'Basketball',
  'Swimming',
  'Cycling',
  'Yoga',
  'Boxing',
  'Soccer',
  'Tennis',
  'Climbing',
  'Pilates',
  'Dance',
]);

// Fixed values used when exporting workouts to an .ics calendar file.
export const CALENDAR_EXPORT = Object.freeze({
  fileName: 'trainlog-workouts.ics',
  productId: '-//Trainlog//EN',
  uidDomain: 'trainlog',
});
