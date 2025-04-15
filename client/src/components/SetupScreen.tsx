import { useState } from "react";
import PoseCategorySelector from "./PoseCategorySelector";
import PoseLengthSelector from "./PoseLengthSelector";
import SessionConfigSelector from "./SessionConfigSelector";
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
  const [selectedCategories, setSelectedCategories] = useState<PoseCategory[]>(["standing", "sitting"]);
  const [poseLength, setPoseLength] = useState(30);
  const [sessionType, setSessionType] = useState<"count" | "time">("count");
  const [poseCount, setPoseCount] = useState(10);
  const [sessionTime, setSessionTime] = useState(20);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (selectedCategories.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one pose category",
        variant: "destructive",
      });
      return;
    }

    // Check for random selection or filter poses based on selected categories
    const isRandom = selectedCategories.includes("random");
    const filteredPoses = isRandom 
      ? poses // Use all poses if random is selected
      : poses.filter(pose => selectedCategories.includes(pose.category));
    
    if (filteredPoses.length === 0) {
      toast({
        title: "Error",
        description: "No poses available for selected categories",
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
        <PoseCategorySelector 
          selectedCategories={selectedCategories} 
          onChange={setSelectedCategories} 
        />
        
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
