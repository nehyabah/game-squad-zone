/**
 * Request/response validation helpers.
 */
export function validate<T>(_schema: unknown, _data: unknown): T {
  // TODO: implement Zod based validation
  return _data as T;
}
