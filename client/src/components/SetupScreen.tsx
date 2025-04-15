import { useState } from "react";
import PoseLengthSelector from "./PoseLengthSelector";
import SessionConfigSelector from "./SessionConfigSelector";
import PoseDescriptionInput from "./PoseDescriptionInput";
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
  const [poseLength, setPoseLength] = useState(30);
  const [sessionType, setSessionType] = useState<"count" | "time">("count");
  const [poseCount, setPoseCount] = useState(10);
  const [sessionTime, setSessionTime] = useState(20);
  
  // Handler for when pose description is analyzed and categories are extracted
  const handleDescriptionProcessed = (categories: PoseCategory[], description: string) => {
    setSelectedCategories(categories);
    setPoseDescription(description);
    
    toast({
      title: "Poses found!",
      description: `Found matching poses in categories: ${categories.join(", ")}`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (selectedCategories.length === 0) {
      toast({
        title: "Error",
        description: "Please describe the types of poses you want",
        variant: "destructive",
      });
      return;
    }

    // Filter poses based on selected categories
    const filteredPoses = poses.filter(pose => selectedCategories.includes(pose.category));
    
    if (filteredPoses.length === 0) {
      toast({
        title: "Error",
        description: "No poses available for your description. Please try a different description.",
        variant: "destructive",
      });
      return;
    }

    // Calculate total poses if session type is time
    let calculatedPoseCount = poseCount;
    if (sessionType === "time") {
      calculatedPoseCount = Math.floor((sessionTime * 60) / poseLength);
      if (calculatedPoseCount < 1) {
        calculatedPoseCount = 1;
      }
    }

    onStartSession({
      categories: selectedCategories,
      poseLength,
      sessionType,
      poseCount: calculatedPoseCount,
      sessionTime,
    });
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
            aria-label="Back to main menu"
          >
            <ArrowLeft className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
          </Button>
        )}
        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-800 ${onBack ? 'flex-1 text-center' : ''}`}>
          Session Setup
        </h1>
        {/* Empty div to balance the layout when back button exists */}
        {onBack && <div className="w-6"></div>}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <PoseDescriptionInput
          onDescriptionProcessed={handleDescriptionProcessed}
        />
        
        {selectedCategories.length > 0 && (
          <>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Selected categories:</span> {selectedCategories.join(", ")}
              </p>
            </div>
            
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
            className={`${onBack ? 'flex-1' : 'w-full'} bg-primary hover:bg-indigo-700 text-white font-bold 
              ${isMobile ? 'text-lg py-4' : 'py-3'} px-4 rounded-lg transition duration-200
              active:scale-[0.98] touch-manipulation`}
          >
            Start Session
          </Button>
        </div>
      </form>
    </div>
  );
}
