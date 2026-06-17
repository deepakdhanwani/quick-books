import AsyncStorage from '@react-native-async-storage/async-storage';

export type DebugLogLevel = 'debug' | 'info' | 'warn' | 'error';

export type DebugLogEntry = {
  id: number;
  at: string;
  level: DebugLogLevel;
  tag: string;
  message: string;
  detail?: string;
};

const STORAGE_KEY = 'quickbooks.debugLog.enabled';
const MAX_ENTRIES = 300;

let enabled = true;
let nextId = 1;
const entries: DebugLogEntry[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function toDetail(data: unknown): string | undefined {
  if (data == null) {
    return undefined;
  }
  if (typeof data === 'string') {
    return data;
  }
  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
}

export async function initDebugLog() {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored != null) {
      enabled = stored === 'true';
    }
  } catch {
    // Keep default.
  }
}

export function isDebugLogEnabled() {
  return enabled;
}

export async function setDebugLogEnabled(value: boolean) {
  enabled = value;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
  } catch {
    // Ignore persistence errors.
  }
  debugLog.info('debug', value ? 'Debug logging enabled' : 'Debug logging disabled');
}

export function subscribeDebugLog(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDebugLogEntries(): DebugLogEntry[] {
  return [...entries];
}

export function clearDebugLog() {
  entries.length = 0;
  emit();
}

function push(level: DebugLogLevel, tag: string, message: string, data?: unknown) {
  const entry: DebugLogEntry = {
    id: nextId++,
    at: new Date().toISOString(),
    level,
    tag,
    message,
    detail: toDetail(data),
  };

  entries.push(entry);
  if (entries.length > MAX_ENTRIES) {
    entries.splice(0, entries.length - MAX_ENTRIES);
  }

  if (enabled) {
    const prefix = `[QB:${tag}]`;
    const line = data == null ? `${prefix} ${message}` : `${prefix} ${message} ${entry.detail ?? ''}`;
    if (level === 'error') {
      console.error(line);
    } else if (level === 'warn') {
      console.warn(line);
    } else {
      console.log(line);
    }
  }

  emit();
}

export const debugLog = {
  debug: (tag: string, message: string, data?: unknown) => push('debug', tag, message, data),
  info: (tag: string, message: string, data?: unknown) => push('info', tag, message, data),
  warn: (tag: string, message: string, data?: unknown) => push('warn', tag, message, data),
  error: (tag: string, message: string, data?: unknown) => push('error', tag, message, data),
};
