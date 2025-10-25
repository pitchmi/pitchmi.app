// lib/telemetry.ts — Shim seguro (no rompe local dev si no hay Sentry)
let Sentry: any = null;

try {
  // Si instalas Sentry, descomenta esta línea y configura tu DSN:
  // import * as _Sentry from "@sentry/react-native";
  // Sentry = _Sentry;
} catch {
  // noop
}

type Level = "info" | "warning" | "error";

export function captureMessage(message: string, level: Level = "info", extra?: Record<string, unknown>) {
  if (Sentry?.captureMessage) {
    Sentry.captureMessage(message, { level, extra });
  }
}

export function captureException(error: unknown, extra?: Record<string, unknown>) {
  if (Sentry?.captureException) {
    Sentry.captureException(error, { extra });
  }
}

export function setUser(user: { id?: string; email?: string | null } | null) {
  if (Sentry?.setUser) {
    Sentry.setUser(user ? { id: user.id, email: user.email ?? undefined } : null);
  }
}
