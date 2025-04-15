import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Image as ImageIcon } from "lucide-react";
import { PoseCategory } from "@/types";
import { apiRequest } from "@/lib/queryClient";

interface PoseGeneratorProps {
  description: string;
  categories: PoseCategory[];
  onGenerationComplete: () => void;
}

export default function PoseGenerator({ 
  description, 
  categories,
  onGenerationComplete 
}: PoseGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const generatePoses = async () => {
    if (!description || categories.length === 0) {
      setError("Please provide a description and select at least one category");
      return;
    }
    
    try {
      setIsGenerating(true);
      setError(null);
      setProgress(10); // Start progress
      
      // Start the pose generation process on the server
      const response = await apiRequest("POST", "/api/poses/generate", {
        description,
        categories,
        // Generate more poses for variety
        count: categories.includes("random") ? 10 : categories.length * 2
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate poses");
      }
      
      // Since pose generation is asynchronous on the server, we'll simulate progress here
      // In a real implementation, we might poll a status endpoint to get actual progress
      const statusData = await response.json();
      const estimatedTime = statusData.estimatedTime || 30;
      
      // Simulate progress over the estimated time
      const interval = setInterval(() => {
        setProgress(prev => {
          // Go up to 95% - the last 5% will be set when we confirm completion
          const nextProgress = prev + (95 - prev) / 10;
          return nextProgress > 94 ? 94 : nextProgress;
        });
      }, estimatedTime * 100); // Update progress faster than the actual generation
      
      // Wait for a reasonable time to let the server generate poses
      // In a real implementation, we would poll a status endpoint
      setTimeout(() => {
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => {
          setIsGenerating(false);
          onGenerationComplete();
        }, 1000);
      }, estimatedTime * 1000); // Wait the estimated time
      
    } catch (err) {
      console.error("Error generating poses:", err);
      setError(err instanceof Error ? err.message : "Failed to generate poses");
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center space-y-4 p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-center w-full">
        <div className="relative h-32 w-full bg-gray-100 rounded-lg flex items-center justify-center">
          {isGenerating ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
              <div className="text-sm font-medium">Generating poses...</div>
              <div className="text-xs text-gray-500 mt-1">This may take a minute</div>
              
              {/* Progress bar */}
              <div className="w-64 h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300 ease-in-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {progress < 100 ? 'Processing...' : 'Complete!'}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
              <div className="text-sm text-gray-500">AI will generate poses based on your description</div>
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <div className="px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm w-full">
          {error}
        </div>
      )}
      
      <Button 
        onClick={generatePoses}
        disabled={isGenerating || !description || categories.length === 0}
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          "Generate AI Poses"
        )}
      </Button>
      
      <div className="text-xs text-gray-500 text-center">
        Generating AI poses may take 30-60 seconds. The poses will be saved for your session.
      </div>
    </div>
  );
}