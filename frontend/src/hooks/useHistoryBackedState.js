import { useCallback, useEffect, useSyncExternalStore } from 'react';

const DASHBOARD_HISTORY_KEY = '__dashboardState';
const HISTORY_CHANGE_EVENT = 'dashboardhistorychange';

const getCurrentUrl = () => `${window.location.pathname}${window.location.search}${window.location.hash}`;

const getWindowHistoryState = () => {
  if (typeof window === 'undefined') {
    return {};
  }

  return window.history.state && typeof window.history.state === 'object'
    ? window.history.state
    : {};
};

const readDashboardState = (historyKey) => {
  const currentState = getWindowHistoryState();
  return currentState?.[DASHBOARD_HISTORY_KEY]?.[historyKey] ?? null;
};

const buildNextWindowState = (historyKey, value) => {
  const currentState = getWindowHistoryState();
  const dashboardState = currentState[DASHBOARD_HISTORY_KEY] && typeof currentState[DASHBOARD_HISTORY_KEY] === 'object'
    ? currentState[DASHBOARD_HISTORY_KEY]
    : {};

  return {
    ...currentState,
    [DASHBOARD_HISTORY_KEY]: {
      ...dashboardState,
      [historyKey]: value
    }
  };
};

export const useHistoryBackedState = (historyKey, initialState) => {
  const subscribe = useCallback((callback) => {
    window.addEventListener('popstate', callback);
    window.addEventListener(HISTORY_CHANGE_EVENT, callback);

    return () => {
      window.removeEventListener('popstate', callback);
      window.removeEventListener(HISTORY_CHANGE_EVENT, callback);
    };
  }, []);

  const getSnapshot = useCallback(
    () => readDashboardState(historyKey) ?? initialState,
    [historyKey, initialState]
  );

  const state = useSyncExternalStore(subscribe, getSnapshot, () => initialState);

  useEffect(() => {
    if (readDashboardState(historyKey) !== null) {
      return;
    }

    window.history.replaceState(buildNextWindowState(historyKey, initialState), '', getCurrentUrl());
    window.dispatchEvent(new Event(HISTORY_CHANGE_EVENT));
  }, [historyKey, initialState]);

  const pushState = useCallback((nextStateOrUpdater) => {
    const currentState = readDashboardState(historyKey) ?? initialState;
    const nextState = typeof nextStateOrUpdater === 'function'
      ? nextStateOrUpdater(currentState)
      : nextStateOrUpdater;

    window.history.pushState(buildNextWindowState(historyKey, nextState), '', getCurrentUrl());
    window.dispatchEvent(new Event(HISTORY_CHANGE_EVENT));
  }, [historyKey, initialState]);

  const replaceState = useCallback((nextStateOrUpdater) => {
    const currentState = readDashboardState(historyKey) ?? initialState;
    const nextState = typeof nextStateOrUpdater === 'function'
      ? nextStateOrUpdater(currentState)
      : nextStateOrUpdater;

    window.history.replaceState(buildNextWindowState(historyKey, nextState), '', getCurrentUrl());
    window.dispatchEvent(new Event(HISTORY_CHANGE_EVENT));
  }, [historyKey, initialState]);

  const goBack = useCallback(() => {
    window.history.back();
  }, []);

  return {
    state,
    pushState,
    replaceState,
    goBack
  };
};
