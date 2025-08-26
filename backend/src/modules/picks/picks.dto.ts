/**
 * Picks module data transfer objects.
 */
export interface CreatePickDto {
  gameId: string;
  selection: 'home' | 'away';
}
