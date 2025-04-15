import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { PoseCategory } from "@/types";

interface PoseDescriptionInputProps {
  onDescriptionProcessed: (categories: PoseCategory[], description: string) => void;
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
      
      // Pass the categories back to the parent component
      onDescriptionProcessed(data.analysis.categories, description);
    } catch (err: any) {
      setError(err.message || "Failed to analyze pose description. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className={`${isMobile ? 'text-xl' : 'text-lg'} font-semibold text-gray-700`}>
        Pose Description
      </h2>
      
      <div className="space-y-2">
        <p className={`${isMobile ? 'text-base' : 'text-sm'} text-gray-500`}>
          Describe the types of poses you want (e.g., "dynamic running poses with foreshortening" or "sitting poses with dramatic lighting"):
        </p>
        
        <Textarea
          value={description}
          onChange={handleDescriptionChange}
          placeholder="Enter your pose description here..."
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
          <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-400 italic`}>
            Examples: "dramatic standing poses with arms raised", "relaxed sitting poses with natural lighting", "dynamic action poses with exaggerated perspective"
          </p>
        </div>
      </div>
    </div>
  );
}