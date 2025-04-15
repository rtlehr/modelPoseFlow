import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles } from "lucide-react";
import { PoseCategory } from "@/types";
import PoseGenerator from "./PoseGenerator";

interface PoseDescriptionInputProps {
  onDescriptionProcessed: (categories: PoseCategory[], description: string, useAiGeneration?: boolean) => void;
}

export default function PoseDescriptionInput({ onDescriptionProcessed }: PoseDescriptionInputProps) {
  const isMobile = useIsMobile();
  const [description, setDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useAiGeneration, setUseAiGeneration] = useState(false);
  const [categories, setCategories] = useState<PoseCategory[]>([]);
  const [showGenerator, setShowGenerator] = useState(false);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      setError("Please enter a pose description.");
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch("/api/poses/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description: description.trim() }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to analyze pose description");
      }
      
      const data = await response.json();
      
      if (!data.analysis?.categories?.length) {
        throw new Error("No pose categories found. Please try a different description.");
      }
      
      setCategories(data.analysis.categories);
      
      if (useAiGeneration) {
        // If AI generation is enabled, show the generator component
        setShowGenerator(true);
      } else {
        // Otherwise, proceed with existing poses
        onDescriptionProcessed(data.analysis.categories, description, false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to analyze pose description. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleAiGenerationComplete = () => {
    // When AI generation is complete, proceed to the next step
    onDescriptionProcessed(categories, description, true);
  };

  return (
    <div className="space-y-4">
      <h2 className={`${isMobile ? 'text-xl' : 'text-lg'} font-semibold text-gray-700`}>
        Pose Description
      </h2>
      
      <div className="space-y-4">
        <p className={`${isMobile ? 'text-base' : 'text-sm'} text-gray-500`}>
          Describe the types of poses you want (e.g., "dynamic running poses with foreshortening" or "sitting poses with dramatic lighting"):
        </p>
        
        <Textarea
          value={description}
          onChange={handleDescriptionChange}
          placeholder="Enter your pose description here..."
          className={`w-full min-h-[100px] ${isMobile ? 'text-base' : 'text-sm'} border-gray-300 focus:border-primary focus:ring-primary rounded-md p-3`}
          disabled={isAnalyzing || showGenerator}
        />
        
        {error && (
          <p className="text-red-500 text-sm mt-1">{error}</p>
        )}
        
        {/* AI Generation Toggle */}
        <div className="flex items-center space-x-2 mt-2">
          <Switch
            id="ai-generation"
            checked={useAiGeneration}
            onCheckedChange={setUseAiGeneration}
            disabled={isAnalyzing || showGenerator}
          />
          <div className="flex items-center">
            <label
              htmlFor="ai-generation"
              className={`${isMobile ? 'text-sm' : 'text-xs'} font-medium text-gray-700 cursor-pointer`}
            >
              Generate AI Poses
            </label>
            <Sparkles className="ml-1 h-3 w-3 text-yellow-500" />
          </div>
        </div>
        
        {/* Description of the feature */}
        {useAiGeneration && (
          <div className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-md">
            <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-blue-700`}>
              AI will generate custom poses based on your description using ControlNet + OpenPose. This may take 30-60 seconds.
            </p>
          </div>
        )}
        
        {showGenerator ? (
          <PoseGenerator
            description={description}
            categories={categories}
            onGenerationComplete={handleAiGenerationComplete}
          />
        ) : (
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={isAnalyzing}
            className={`mt-2 ${isMobile ? 'py-2 text-base' : 'py-1 text-sm'} px-4 bg-primary hover:bg-indigo-700 text-white font-medium rounded-md transition duration-200 touch-manipulation`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              useAiGeneration ? 'Analyze & Generate AI Poses' : 'Find Matching Poses'
            )}
          </Button>
        )}
        
        {/* Show examples */}
        {!showGenerator && (
          <div className="mt-3">
            <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-400 italic`}>
              Examples: "dramatic standing poses with arms raised", "relaxed sitting poses with natural lighting", "dynamic action poses with exaggerated perspective"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}