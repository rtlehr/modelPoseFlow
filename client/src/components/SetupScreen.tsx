import { useState } from "react";
import PoseCategorySelector from "./PoseCategorySelector";
import PoseLengthSelector from "./PoseLengthSelector";
import SessionConfigSelector from "./SessionConfigSelector";
import { Button } from "@/components/ui/button";
import { PoseCategory, PoseSessionConfig, Pose } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface SetupScreenProps {
  onStartSession: (config: PoseSessionConfig) => void;
  poses: Pose[];
}

export default function SetupScreen({ onStartSession, poses }: SetupScreenProps) {
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
      <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-center text-gray-800 mb-6`}>
        Figure Model Pose Timer
      </h1>
      
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
        
        <Button 
          type="submit" 
          className={`w-full bg-primary hover:bg-indigo-700 text-white font-bold 
            ${isMobile ? 'text-lg py-4' : 'py-3'} px-4 rounded-lg transition duration-200
            active:scale-[0.98] touch-manipulation`}
        >
          Start Session
        </Button>
      </form>
    </div>
  );
}
