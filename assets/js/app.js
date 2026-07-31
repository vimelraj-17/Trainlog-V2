/**
 * TrainLog application entry point
 *
 * Loads saved data, renders the selected screen, connects delegated events,
 * reveals the application shell, and registers the offline service worker.
 */

import { ui } from './core/state.js';
import { loadState } from './core/storage.js';

import { bindEvents } from './events.js';

import { renderCalendar } from './features/calendar.js';
import { renderHome } from './features/home.js';
import { renderModal } from './features/modals.js';
import { renderProfile } from './features/profile.js';
import { renderPRs } from './features/prs.js';
import { renderWorkout } from './features/workout.js';

import {
  renderNavigation,
  renderTopbarDate,
} from './ui/components.js';

/**
 * Match each bottom-navigation tab to its feature renderer.
 */
const SCREEN_RENDERERS = Object.freeze({
  home: renderHome,
  calendar: renderCalendar,
  workout: renderWorkout,
  prs: renderPRs,
  profile: renderProfile,
});

let appStarted = false;

/**
 * Render the active screen and every shared interface element.
 *
 * events.js receives this function so state changes can refresh the app
 * without reloading the page.
 */
export function renderApp() {
  if (typeof document === 'undefined') {
    return '';
  }

  const screenRoot = document.getElementById('screen-root');
  const renderScreen =
    SCREEN_RENDERERS[ui.tab] || SCREEN_RENDERERS.home;

  const screenHtml = renderScreen();

  if (screenRoot) {
    screenRoot.innerHTML = screenHtml;
  }

  renderTopbarDate();
  renderNavigation(ui.tab);
  renderModal();

  return screenHtml;
}

/**
 * Hide the loading screen and reveal TrainLog after startup succeeds.
 */
function revealApp() {
  const splash = document.getElementById('splash');
  const app = document.getElementById('app');
  const navigation = document.getElementById('bottomnav');

  if (splash) {
    splash.style.display = 'none';
  }

  if (app) {
    app.style.display = 'block';
  }

  if (navigation) {
    navigation.style.display = 'block';
  }
}

/**
 * Keep a useful message visible if an unexpected startup error occurs.
 */
function showStartupError(error) {
  console.error('TrainLog could not start.', error);

  const splash = document.getElementById('splash');

  if (!splash) {
    return;
  }

  splash.innerHTML =
    '<div class="disp">TRAIN<span class="brandmark">LOG</span></div>' +
    '<div class="sub" style="max-width:280px; text-align:center; ' +
    'line-height:1.5;">TrainLog could not start. Refresh the page and ' +
    'try again.</div>' +
    '<button type="button" data-reload-app ' +
    'style="margin-top:8px; padding:10px 16px; border-radius:10px; ' +
    'background:var(--ember); color:var(--ink); font-weight:700;">' +
    'Refresh</button>';

  const reloadButton = splash.querySelector('[data-reload-app]');

  reloadButton?.addEventListener('click', () => {
    window.location.reload();
  });
}

/**
 * Register the root service worker without breaking normal app startup.
 *
 * Resolving from app.js keeps the correct /trainlog/ path on GitHub Pages.
 */
export async function registerServiceWorker() {
  if (
    typeof navigator === 'undefined' ||
    !('serviceWorker' in navigator)
  ) {
    return null;
  }

  try {
    const serviceWorkerUrl = new URL(
      '../../sw.js',
      import.meta.url
    );

    return await navigator.serviceWorker.register(
      serviceWorkerUrl.href
    );
  } catch (error) {
    // Offline support is optional during local development and before sw.js
    // is added, so a registration failure must not stop TrainLog.
    console.warn('TrainLog service worker was not registered.', error);
    return null;
  }
}

/**
 * Start TrainLog once the document shell is available.
 */
export async function initApp() {
  if (appStarted || typeof document === 'undefined') {
    return;
  }

  appStarted = true;

  try {
    await loadState();
    bindEvents(renderApp);
    renderApp();
    revealApp();

    // Registration runs after the interface is usable and never blocks it.
    registerServiceWorker();
  } catch (error) {
    appStarted = false;
    showStartupError(error);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp, {
      once: true,
    });
  } else {
    initApp();
  }
}
