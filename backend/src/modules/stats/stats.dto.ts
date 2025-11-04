/**
 * Data transfer objects for statistics module
 */

export interface PersonalStatsQueryDto {
  userId: string;
  squadId?: string;
}

export interface SquadStatsQueryDto {
  squadId: string;
}

export interface MemberComparisonQueryDto {
  member1Id: string;
  member2Id: string;
  squadId: string;
}
