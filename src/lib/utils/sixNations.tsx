// Six Nations teams configuration with flags and colors

export const SIX_NATIONS_TEAMS = {
  England: {
    name: "England",
    flagClass: "fi fi-gb-eng",
    color: "#FFFFFF",
    secondaryColor: "#CE1124",
  },
  France: {
    name: "France",
    flagClass: "fi fi-fr",
    color: "#002395",
    secondaryColor: "#ED2939",
  },
  Ireland: {
    name: "Ireland",
    flagClass: "fi fi-ie",
    color: "#169B62",
    secondaryColor: "#FF883E",
  },
  Italy: {
    name: "Italy",
    flagClass: "fi fi-it",
    color: "#009246",
    secondaryColor: "#CE2B37",
  },
  Scotland: {
    name: "Scotland",
    flagClass: "fi fi-gb-sct",
    color: "#0065BF",
    secondaryColor: "#FFFFFF",
  },
  Wales: {
    name: "Wales",
    flagClass: "fi fi-gb-wls",
    color: "#C8102E",
    secondaryColor: "#FFFFFF",
  },
} as const;

export type SixNationsTeam = keyof typeof SIX_NATIONS_TEAMS;

export const TEAM_NAMES = Object.keys(SIX_NATIONS_TEAMS) as SixNationsTeam[];

export const getTeamFlagClass = (teamName: string): string => {
  return SIX_NATIONS_TEAMS[teamName as SixNationsTeam]?.flagClass || "fi fi-xx";
};

export const getTeamColor = (teamName: string): string => {
  return SIX_NATIONS_TEAMS[teamName as SixNationsTeam]?.color || "#000000";
};

// Helper component for rendering team flag
export const TeamFlag = ({ teamName, className = "" }: { teamName: string; className?: string }) => {
  const flagClass = getTeamFlagClass(teamName);
  return <span className={`${flagClass} ${className}`}></span>;
};
