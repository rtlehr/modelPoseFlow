import { useState } from "react";
import PoseLengthSelector from "./PoseLengthSelector";
import SessionConfigSelector from "./SessionConfigSelector";
import MusicPlaylistSelector from "./MusicPlaylistSelector";
import { Button } from "@/components/ui/button";
import { PoseCategory, PoseSessionConfig } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface SessionSetupScreenProps {
  selectedCategories: PoseCategory[];
  poseDescription: string;
  onStartSession: (config: PoseSessionConfig) => void;
  onBack?: () => void;
  isInitialSetup?: boolean; // If true, we're showing this screen first (before pose selection)
  onContinueToPoseSelection?: (config: Partial<PoseSessionConfig>) => void; // Used when isInitialSetup is true
}

export default function SessionSetupScreen({ 
  selectedCategories, 
  poseDescription,
  onStartSession, 
  onBack,
  isInitialSetup = false,
  onContinueToPoseSelection
}: SessionSetupScreenProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [poseLength, setPoseLength] = useState(30);
  const [sessionType, setSessionType] = useState<"count" | "time">("count");
  const [poseCount, setPoseCount] = useState(10);
  const [sessionTime, setSessionTime] = useState(20);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate total poses if session type is time
    let calculatedPoseCount = poseCount;
    if (sessionType === "time") {
      calculatedPoseCount = Math.floor((sessionTime * 60) / poseLength);
      if (calculatedPoseCount < 1) {
        calculatedPoseCount = 1;
      }
    }

    const config = {
      categories: selectedCategories,
      poseLength,
      sessionType,
      poseCount: calculatedPoseCount,
      sessionTime,
      playlistId: selectedPlaylistId,
    };

    if (isInitialSetup && onContinueToPoseSelection) {
      // If we're in the initial setup flow, continue to pose selection
      onContinueToPoseSelection(config);
    } else {
      // Otherwise, start the session with the complete config
      onStartSession(config as PoseSessionConfig);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg ${isMobile ? 'p-4' : 'p-6'} max-w-xl mx-auto`}>
      <div className="flex justify-between items-center mb-4">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 touch-manipulation -ml-2"
            aria-label="Back to description"
          >
            <ArrowLeft className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
          </Button>
        )}
        
        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-800 flex-1 text-center`}>
          Session Setup
        </h1>
        
        {/* Empty div to balance the layout */}
        <div className="w-6"></div>
      </div>
      
      {!isInitialSetup && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Pose Type</h3>
          <p className="text-sm text-gray-600 italic">"{poseDescription}"</p>
          <div className="mt-2">
            <span className="text-xs text-gray-500">Categories: </span>
            <span className="text-xs font-medium text-primary">{selectedCategories.join(", ")}</span>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <PoseLengthSelector 
          poseLength={poseLength} 
          onChange={setPoseLength} 
        />
        
        <SessionConfigSelector 
          sessionType={sessionType}
          poseCount={poseCount}
          sessionTime={sessionTime}
          onSessionTypeChange={setSessionType}
          onPoseCountChange={setPoseCount}
          onSessionTimeChange={setSessionTime}
        />
        
        <Separator className="my-2" />
        
        <MusicPlaylistSelector
          selectedPlaylistId={selectedPlaylistId}
          onChange={setSelectedPlaylistId}
        />
        
        <div className="flex space-x-4">
          {onBack && (
            <Button 
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1 touch-manipulation"
            >
              Back
            </Button>
          )}
          <Button 
            type="submit" 
            className={`flex-1 bg-primary hover:bg-indigo-700 text-white font-bold 
              ${isMobile ? 'text-lg py-4' : 'py-3'} px-4 rounded-lg transition duration-200
              active:scale-[0.98] touch-manipulation`}
          >
            {isInitialSetup ? 'Continue to Pose Selection' : 'Start Session'}
          </Button>
        </div>
      </form>
    </div>
  );
}