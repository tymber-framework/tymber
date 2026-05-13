export type Brand<K, T> = K & { __brand: T };

export type Result<T = void, R = string> =
  | (T extends void ? { ok: true } : { ok: true; value: T })
  | { ok: false; reason: R };
