/**
 * Leaderboards module data transfer objects.
 */
export interface LeaderboardQueryDto {
  scope?: 'squad' | 'global';
  week?: number;
}
