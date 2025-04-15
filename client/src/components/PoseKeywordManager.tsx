import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, X, Wand2, Save } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Pose } from "@shared/schema";

interface PoseKeywordManagerProps {
  pose: Pose;
  onUpdate?: (updatedPose: Pose) => void;
}

export default function PoseKeywordManager({ pose, onUpdate }: PoseKeywordManagerProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [keywords, setKeywords] = useState<string[]>(pose.keywords || []);
  const [newKeyword, setNewKeyword] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update keywords when pose changes
  useEffect(() => {
    setKeywords(pose.keywords || []);
  }, [pose]);

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    
    // Don't add duplicates (case insensitive check)
    if (keywords.some(k => k.toLowerCase() === newKeyword.toLowerCase())) {
      toast({
        title: "Duplicate keyword",
        description: "This keyword already exists",
        variant: "destructive"
      });
      return;
    }
    
    setKeywords([...keywords, newKeyword.trim()]);
    setNewKeyword("");
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const generateKeywords = async () => {
    try {
      setIsGenerating(true);
      
      const response = await apiRequest("POST", `/api/poses/${pose.id}/generate-keywords`);
      
      if (!response.ok) {
        throw new Error("Failed to generate keywords");
      }
      
      const data = await response.json();
      setKeywords(data.keywords);
      
      toast({
        title: "Keywords generated",
        description: `Generated ${data.keywords.length} keywords for this pose`,
      });
      
      if (onUpdate) {
        onUpdate(data.pose);
      }
    } catch (error) {
      console.error("Error generating keywords:", error);
      toast({
        title: "Error",
        description: "Failed to generate keywords",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveKeywords = async () => {
    try {
      setIsSaving(true);
      
      const response = await apiRequest("PUT", `/api/poses/${pose.id}/keywords`, {
        keywords
      });
      
      if (!response.ok) {
        throw new Error("Failed to save keywords");
      }
      
      const data = await response.json();
      
      toast({
        title: "Keywords saved",
        description: "Pose keywords updated successfully",
      });
      
      if (onUpdate) {
        onUpdate(data.pose);
      }
    } catch (error) {
      console.error("Error saving keywords:", error);
      toast({
        title: "Error",
        description: "Failed to save keywords",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>Pose Keywords</h2>
        <p className="text-sm text-gray-500">
          Keywords help improve pose matching with user descriptions
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Add keyword..."
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button 
          onClick={handleAddKeyword}
          variant="outline"
          size="icon"
          disabled={!newKeyword.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2 min-h-[100px] p-2 border rounded-md bg-gray-50">
        {keywords.length === 0 ? (
          <p className="text-sm text-gray-400 w-full text-center mt-6">
            No keywords added yet
          </p>
        ) : (
          keywords.map((keyword, index) => (
            <Badge 
              key={index} 
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1"
            >
              {keyword}
              <button
                onClick={() => handleRemoveKeyword(keyword)}
                className="ml-1 rounded-full hover:bg-gray-200 p-0.5 focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label={`Remove ${keyword}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>
      
      <div className="flex space-x-2 justify-end">
        <Button
          onClick={generateKeywords}
          variant="outline"
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          Auto-Generate
        </Button>
        <Button
          onClick={saveKeywords}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Keywords
        </Button>
      </div>
    </div>
  );
}