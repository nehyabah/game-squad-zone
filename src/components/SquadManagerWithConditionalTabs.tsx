import { useState } from "react";
import SquadManager from "@/components/SquadManager";
import Leaderboard from "@/components/Leaderboard";

interface SquadManagerWithConditionalTabsProps {
  squadSubTab: string;
  setSquadSubTab: (tab: string) => void;
}

// This is a wrapper component that will receive selected squad info
// and conditionally show tabs only for squads with both features
const SquadManagerWithConditionalTabs = ({ squadSubTab, setSquadSubTab }: SquadManagerWithConditionalTabsProps) => {
  // For now, we'll show the regular SquadManager
  // When a specific squad is selected that has both chat and leaderboard,
  // the SquadDashboard component will handle the tabs internally
  return <SquadManager />;
};

export default SquadManagerWithConditionalTabs;