import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import HelpModal from "./HelpModal";

interface PoseDescriptionInputProps {
  onDescriptionProcessed: (keywords: string[], description: string) => void;
}

export default function PoseDescriptionInput({ onDescriptionProcessed }: PoseDescriptionInputProps) {
  const isMobile = useIsMobile();
  const [description, setDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    setError(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
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
      
      if (!data.analysis?.keywords?.length) {
        throw new Error("No keywords found. Please try a different description.");
      }
      
      // Pass the keywords back to the parent component
      onDescriptionProcessed(data.analysis.keywords, description);
    } catch (err: any) {
      setError(err.message || "Failed to analyze pose description. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const helpInstructions = `
This screen allows you to find poses that match your description.

How to use this feature:
1. Enter a detailed description of the poses you're looking for in the text box
2. You can specify body positions, angles, expressions, or difficulty levels
3. Click "Find Matching Poses" to search for poses matching your description
4. The system will analyze your description and find the most relevant poses

Tips:
• Be specific and detailed in your descriptions for better results
• You can specify difficulty levels (easy, medium, hard) in your description
• Examples: "standing pose with one arm raised", "seated pose with easy difficulty"
`;

  return (
    <div className="space-y-4">
      <h2 className={`${isMobile ? 'text-xl' : 'text-lg'} font-semibold text-gray-700`}>
        Pose Description
      </h2>
      
      <div className="space-y-2">
        <p className={`${isMobile ? 'text-base' : 'text-sm'} text-gray-500`}>
          Describe the types of poses you want, using specific keywords that match your desired poses:
        </p>
        
        <Textarea
          value={description}
          onChange={handleDescriptionChange}
          placeholder="Enter your pose description here... (e.g., 'standing pose with easy difficulty to hold' or 'seated pose with medium difficulty')"
          className={`w-full min-h-[100px] ${isMobile ? 'text-base' : 'text-sm'} border-gray-300 focus:border-primary focus:ring-primary rounded-md p-3`}
          disabled={isAnalyzing}
        />
        
        {error && (
          <p className="text-red-500 text-sm mt-1">{error}</p>
        )}
        
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
            'Find Matching Poses'
          )}
        </Button>
        
        {/* Show examples */}
        <div className="mt-3">
          <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-500 font-medium`}>
            The system will match your description with pose keywords, prioritizing poses with the most matching keywords.
          </p>
          <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-400 italic mt-1`}>
            Examples: "standing pose with weight on one leg", "twisted torso with arms extended", "three-quarter view with contemplative expression"
          </p>
          <div className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded-md">
            <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-blue-800 font-medium`}>
              <span className="font-bold">New!</span> You can now specify difficulty levels for models to hold the pose:
            </p>
            <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-blue-600 mt-1`}>
              Examples: "Give me easy poses to hold", "I need medium difficulty standing poses", "Show hard poses with extended arms"
            </p>
          </div>
          <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-blue-600 mt-2 flex items-center`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Specific, detailed descriptions yield better matching results.</span>
          </p>
        </div>
      </div>
    </div>
  );
}