import { useState } from "react";
import SetupScreen from "@/components/SetupScreen";
import TimerScreen from "@/components/TimerScreen";
import { PoseSessionConfig } from "@/types";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const [showSetupScreen, setShowSetupScreen] = useState(true);
  const [sessionConfig, setSessionConfig] = useState<PoseSessionConfig | null>(null);

  const { data: poses = [] } = useQuery({
    queryKey: ['/api/poses'],
  });

  const handleStartSession = (config: PoseSessionConfig) => {
    setSessionConfig(config);
    setShowSetupScreen(false);
  };

  const handleBackToSetup = () => {
    setShowSetupScreen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      {showSetupScreen ? (
        <SetupScreen onStartSession={handleStartSession} poses={poses} />
      ) : (
        <TimerScreen onBackToSetup={handleBackToSetup} sessionConfig={sessionConfig!} poses={poses} />
      )}
    </div>
  );
}
