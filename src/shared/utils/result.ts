import type { AppError } from './AppError.js';

//   Result / Either type                  ─
// Single source of truth for recoverable errors in service utilities.
// Usage:
//   const result = await someService(...)
//   if (!result.ok) return next(result.error)
//   const data = result.value   // fully typed
//

export type Result<T, E extends Error = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });

export const fail = <E extends Error = AppError>(error: E): Result<never, E> => ({
  ok: false,
  error,
});
