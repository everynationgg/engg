import { usePreferences } from "@/hooks/usePreferences";
import { RoleTeam } from "@/data/roles";

interface TeamIconProps {
  team: RoleTeam | string;
  className?: string;
  style?: React.CSSProperties;
}

export function TeamIcon({ team, className = "", style = {} }: TeamIconProps) {
  const { preferences } = usePreferences();

  if (!preferences?.colorblindMode) return null;

  const t = team.toLowerCase();
  
  if (t === "crew") {
    return <span className={`inline-flex ${className}`} style={{ ...style, fontSize: "1.1em", verticalAlign: "baseline" }} title="Crew">🛡️</span>;
  }
  
  if (t === "alien") {
    return <span className={`inline-flex ${className}`} style={{ ...style, fontSize: "1.1em", verticalAlign: "baseline" }} title="Alien">⚠️</span>;
  }
  
  if (t === "chaotic") {
    return <span className={`inline-flex ${className}`} style={{ ...style, fontSize: "1.1em", verticalAlign: "baseline" }} title="Chaotic">🌀</span>;
  }

  return null;
}
