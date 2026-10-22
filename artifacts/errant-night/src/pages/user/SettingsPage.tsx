import { useLocation } from "wouter";
import SettingsModal from "@/components/system/SettingsModal";

export default function SettingsPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[100dvh] text-white" style={{ background: "hsl(220 28% 4%)" }}>
      <SettingsModal isOpen={true} onClose={() => setLocation("/")} />
    </div>
  );
}
