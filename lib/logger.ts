// lib/logger.ts — logger mínimo + puente a telemetry (Sentry opcional)
import { captureMessage, captureException } from "@/lib/telemetry";

export type LogLevel = "info" | "warn" | "error";

function base(level: LogLevel, message: string, extra?: Record<string, unknown>) {
  const payload = extra ? { ...extra } : undefined;
  const stamp = new Date().toISOString();

  // Consola (útil en Metro/Device)
  // eslint-disable-next-line no-console
  (console[level] || console.log)(`[${stamp}] [${level}] ${message}`, payload ?? "");

  // Telemetría (no-op si no hay Sentry)
  if (level === "error") {
    captureException(new Error(message), payload);
  } else {
    captureMessage(message, level === "warn" ? "warning" : "info", payload);
  }
}

export const logger = {
  info: (m: string, e?: Record<string, unknown>) => base("info", m, e),
  warn: (m: string, e?: Record<string, unknown>) => base("warn", m, e),
  error: (m: string, e?: Record<string, unknown>) => base("error", m, e),
};
