/** Unique ID for new records. */
export function newId(): string {
  return crypto.randomUUID();
}
