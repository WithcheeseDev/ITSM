/**
 * C11 Logger — one object per event, no PII (NFR-021, design/operations.md "Sensitive Data Rules").
 * Keys whose lower-cased name ends with a deny-listed word are masked, recursively.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogContext = Record<string, unknown>;

export interface LogEntry {
  level: LogLevel;
  at: string;
  event: string;
  context?: LogContext;
}

export const REDACTED = '[redacted]';
const DENY_KEYS = ['name', 'email', 'phone', 'summary', 'notes', 'text', 'comment', 'key'] as const;
const MAX_DEPTH = 5;

const isDenied = (key: string): boolean => {
  const k = key.toLowerCase();
  return DENY_KEYS.some((d) => k.endsWith(d));
};

function scrub(value: unknown, depth: number, includeStack: boolean): unknown {
  if (value instanceof Error) {
    return includeStack
      ? { name: value.name, message: value.message, stack: value.stack }
      : { name: value.name, message: value.message };
  }
  if (value === null || typeof value !== 'object') return value;
  if (depth >= MAX_DEPTH) return '[truncated]';
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1, includeStack));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = isDenied(k) ? REDACTED : scrub(v, depth + 1, includeStack);
  }
  return out;
}

export function redact(context: LogContext, includeStack = false): LogContext {
  return scrub(context, 0, includeStack) as LogContext;
}

export function buildEntry(level: LogLevel, event: string, context?: LogContext, includeStack = false): LogEntry {
  const entry: LogEntry = { level, at: new Date().toISOString(), event };
  if (context) entry.context = redact(context, includeStack);
  return entry;
}

const IS_PROD = import.meta.env.PROD;
const PROD_LEVELS: ReadonlySet<LogLevel> = new Set(['warn', 'error']);

function write(level: LogLevel, event: string, context?: LogContext): void {
  if (IS_PROD && !PROD_LEVELS.has(level)) return;
  console[level](buildEntry(level, event, context, !IS_PROD));
}

export const logger = {
  debug: (event: string, context?: LogContext) => write('debug', event, context),
  info: (event: string, context?: LogContext) => write('info', event, context),
  warn: (event: string, context?: LogContext) => write('warn', event, context),
  error: (event: string, context?: LogContext) => write('error', event, context),
};
