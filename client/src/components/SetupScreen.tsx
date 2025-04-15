import { useState } from "react";
import PoseDescriptionInput from "./PoseDescriptionInput";
import SessionSetupScreen from "./SessionSetupScreen";
import { Button } from "@/components/ui/button";
import { PoseCategory, PoseSessionConfig, Pose } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowLeft } from "lucide-react";

interface SetupScreenProps {
  onStartSession: (config: PoseSessionConfig) => void;
  poses: Pose[];
  onBack?: () => void; // Optional back button handler
}

export default function SetupScreen({ onStartSession, poses, onBack }: SetupScreenProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [selectedCategories, setSelectedCategories] = useState<PoseCategory[]>([]);
  const [poseDescription, setPoseDescription] = useState<string>("");
  const [showPoseSelection, setShowPoseSelection] = useState(false);
  const [sessionConfig, setSessionConfig] = useState<Partial<PoseSessionConfig>>({
    poseLength: 30,
    sessionType: "count",
    poseCount: 10,
    sessionTime: 20,
    playlistId: null
  });
  const [useAiGeneration, setUseAiGeneration] = useState(false);
  
  // Handler for session setup configuration
  const handleConfigureSession = (config: Partial<PoseSessionConfig>) => {
    setSessionConfig({
      ...sessionConfig,
      ...config
    });
    setShowPoseSelection(true);
  };
  
  // Handler for when pose description is analyzed and categories are extracted
  const handleDescriptionProcessed = (categories: PoseCategory[], description: string, useAI?: boolean) => {
    setSelectedCategories(categories);
    setPoseDescription(description);
    setUseAiGeneration(!!useAI);
    
    if (useAI) {
      toast({
        title: "AI Poses Generating!",
        description: `Generating ${sessionConfig.poseCount} custom poses based on your description.`,
      });
    } else {
      toast({
        title: "Poses Found!",
        description: `Found matching poses in categories: ${categories.join(", ")}`,
      });
    }
    
    // Create the final session config
    const finalConfig: PoseSessionConfig = {
      ...sessionConfig as PoseSessionConfig,
      categories,
      useAiGenerated: !!useAI,
      poseDescription: description
    };
    
    // Start the session with the complete configuration
    onStartSession(finalConfig);
  };

  // Handler to go back from pose selection to session setup
  const handleBackToSessionSetup = () => {
    setShowPoseSelection(false);
  };

  // If we're showing the pose selection screen
  if (showPoseSelection) {
    return (
      <div className={`bg-white rounded-xl shadow-lg ${isMobile ? 'p-4' : 'p-6'} max-w-xl mx-auto`}>
        <div className="flex justify-between items-center mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackToSessionSetup}
            className="text-gray-600 hover:text-gray-800 touch-manipulation -ml-2"
            aria-label="Back to session setup"
          >
            <ArrowLeft className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
          </Button>
          
          <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-800 flex-1 text-center`}>
            Pose Selection
          </h1>
          
          {/* Empty div to balance the layout */}
          <div className="w-6"></div>
        </div>
        
        <div className="space-y-6">
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Session Configuration</h3>
            <p className="text-sm text-gray-600">
              {sessionConfig.sessionType === "count" 
                ? `${sessionConfig.poseCount} poses, ${sessionConfig.poseLength} seconds each` 
                : `${sessionConfig.sessionTime} minute session, ${sessionConfig.poseLength} seconds per pose`}
            </p>
          </div>
          
          <PoseDescriptionInput
            onDescriptionProcessed={handleDescriptionProcessed}
            poseCount={sessionConfig.poseCount || 10}
          />
        </div>
      </div>
    );
  }

  // Otherwise, show the session setup screen first
  return (
    <SessionSetupScreen
      selectedCategories={[]}
      poseDescription=""
      onStartSession={handleConfigureSession}
      onBack={onBack}
      isInitialSetup={true}
    />
  );
}
