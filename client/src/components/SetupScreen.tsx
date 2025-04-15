import { useState } from "react";
import PoseDescriptionInput from "./PoseDescriptionInput";
import SessionSetupScreen from "./SessionSetupScreen";
import { Button } from "@/components/ui/button";
import { PoseSessionConfig, Pose } from "@/types";
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
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [poseDescription, setPoseDescription] = useState<string>("");
  const [showSessionSetup, setShowSessionSetup] = useState(false);
  
  // Handler for when pose description is analyzed and keywords are extracted
  const handleDescriptionProcessed = (keywords: string[], description: string) => {
    setSelectedKeywords(keywords);
    setPoseDescription(description);
    
    toast({
      title: "Poses found!",
      description: `Found matching poses using ${keywords.length} keywords`,
    });
  };

  const handleProceedToSessionSetup = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (selectedKeywords.length === 0) {
      toast({
        title: "Error",
        description: "Please describe the types of poses you want",
        variant: "destructive",
      });
      return;
    }

    // Get matching poses based on keywords
    const matchingPoses = poses.filter(pose => {
      if (!pose.keywords || pose.keywords.length === 0) return false;
      return pose.keywords.some(keyword => 
        selectedKeywords.some(selectedKw => 
          keyword.toLowerCase().includes(selectedKw.toLowerCase())
        )
      );
    });
    
    if (matchingPoses.length === 0 && poses.length > 0) {
      toast({
        title: "Warning",
        description: "No exact keyword matches found. Using all available poses."
      });
    }

    // Show the session setup screen
    setShowSessionSetup(true);
  };
  
  const handleBackToDescription = () => {
    setShowSessionSetup(false);
  };

  // If showSessionSetup is true, render the SessionSetupScreen
  if (showSessionSetup) {
    return (
      <SessionSetupScreen
        selectedKeywords={selectedKeywords}
        poseDescription={poseDescription}
        onStartSession={onStartSession}
        onBack={handleBackToDescription}
      />
    );
  }

  // Otherwise, render the pose description input screen
  return (
    <div className={`bg-white rounded-xl shadow-lg ${isMobile ? 'p-4' : 'p-6'} max-w-xl mx-auto`}>
      <div className="flex justify-between items-center mb-4">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 touch-manipulation -ml-2"
            aria-label="Back to main menu"
          >
            <ArrowLeft className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
          </Button>
        )}
        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-800 ${onBack ? 'flex-1 text-center' : ''}`}>
          Describe Poses
        </h1>
        {/* Empty div to balance the layout when back button exists */}
        {onBack && <div className="w-6"></div>}
      </div>
      
      <form onSubmit={handleProceedToSessionSetup} className="space-y-6">
        <PoseDescriptionInput
          onDescriptionProcessed={handleDescriptionProcessed}
        />
        
        {selectedKeywords.length > 0 && (
          <>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Selected keywords:</span>
              </p>
              <div className="flex flex-wrap gap-1">
                {selectedKeywords.map((keyword, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
        
        <div className="flex space-x-4">
          {onBack && (
            <Button 
              type="button"
              variant="outline"
              onClick={onBack}
              className={`flex-1 touch-manipulation`}
            >
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={selectedKeywords.length === 0}
            className={`${onBack ? 'flex-1' : 'w-full'} bg-primary hover:bg-indigo-700 text-white font-bold 
              ${isMobile ? 'text-lg py-4' : 'py-3'} px-4 rounded-lg transition duration-200
              active:scale-[0.98] touch-manipulation
              ${selectedKeywords.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Set Up Session
          </Button>
        </div>
      </form>
    </div>
  );
}
