import React, { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Image as ImageIcon, Wand2, RefreshCw, CheckCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { apiRequest } from '@/lib/queryClient';
import { PoseCategory } from '@/types';

interface AIPoseGeneratorProps {
  onSavePose: (poseData: { url: string, category: PoseCategory }) => Promise<void>;
  onCancel: () => void;
  open: boolean;
}

export default function AIPoseGenerator({ onSavePose, onCancel, open }: AIPoseGeneratorProps) {
  const [prompt, setPrompt] = useState('A photo of a person in a dynamic dance pose with arms extended');
  const [category, setCategory] = useState<PoseCategory>('standing');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const toast = useToast();
  const isMobile = useIsMobile();
  
  // Sample prompts for users to try
  const samplePrompts = [
    "A dancer in a graceful arabesque pose",
    "A person in a dynamic yoga warrior pose",
    "A gymnast performing a handstand with perfect form",
    "A martial artist executing a high kick",
    "A ballet dancer in a classic first position",
    "A figure model in a seated contemplative pose",
    "A person doing a back bend showing flexibility",
    "A model standing with contrapposto pose, weight on one leg",
    "A figure in a reclining position with dramatic lighting",
    "A parkour athlete frozen mid-jump between obstacles"
  ];
  
  const selectRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * samplePrompts.length);
    setPrompt(samplePrompts[randomIndex]);
  };
  
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a description of the pose you want to generate",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await apiRequest("POST", "/api/poses/generate-ai", { 
        prompt, 
        category 
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate AI pose");
      }
      
      const data = await response.json();
      setGeneratedImageUrl(data.url);
      
      toast({
        title: "Pose generated",
        description: "Your AI pose has been generated successfully!"
      });
    } catch (err) {
      console.error("Error generating pose:", err);
      setError(err.message || "Failed to generate AI pose. Please try again.");
      
      toast({
        title: "Generation failed",
        description: err.message || "Failed to generate AI pose. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSave = async () => {
    if (!generatedImageUrl) return;
    
    setIsSaving(true);
    
    try {
      await onSavePose({
        url: generatedImageUrl,
        category
      });
      
      toast({
        title: "Pose saved",
        description: "Your AI-generated pose has been saved to your library"
      });
      
      // Reset the form for next use
      setGeneratedImageUrl(null);
      selectRandomPrompt();
      
    } catch (err) {
      console.error("Error saving pose:", err);
      
      toast({
        title: "Save failed",
        description: "Failed to save the pose to your library",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        if (!isGenerating) {
          onCancel();
        } else {
          toast({
            title: "Generation in progress",
            description: "Please wait until the image generation completes",
            variant: "destructive"
          });
        }
      }
    }}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw]' : 'max-w-4xl'} w-full`}>
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl font-bold">AI Pose Generator</DialogTitle>
          <DialogDescription>
            Create unique figure poses for your drawing practice using AI
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Form controls */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Pose Category</Label>
              <Select 
                value={category} 
                onValueChange={(value) => setCategory(value as PoseCategory)}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standing">Standing</SelectItem>
                  <SelectItem value="sitting">Sitting</SelectItem>
                  <SelectItem value="reclining">Reclining</SelectItem>
                  <SelectItem value="action">Action</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="prompt">Pose Description</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={selectRandomPrompt}
                  disabled={isGenerating}
                  className="h-6 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Random
                </Button>
              </div>
              <Textarea
                id="prompt"
                placeholder="Describe the pose you want to generate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px]"
                disabled={isGenerating}
              />
              <p className="text-xs text-muted-foreground">
                Be specific about pose, lighting, and style for best results
              </p>
            </div>
            
            <div className="pt-2">
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Pose
                  </>
                )}
              </Button>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
                {error}
              </div>
            )}
            
            <div className="bg-gray-50 p-3 rounded-md text-sm">
              <h4 className="font-medium mb-1">Tips for good results:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Be specific about the pose position and orientation</li>
                <li>Mention lighting, perspective, and style if desired</li>
                <li>Generation takes 30-60 seconds, please be patient</li>
                <li>If you don't like the result, try again with a refined prompt</li>
              </ul>
            </div>
          </div>
          
          {/* Preview area */}
          <div>
            <Label className="mb-2 block">Preview</Label>
            
            {generatedImageUrl ? (
              <div className="relative aspect-[3/4] border rounded-md overflow-hidden">
                <img 
                  src={generatedImageUrl} 
                  alt="Generated pose" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <Card className="aspect-[3/4] flex items-center justify-center bg-gray-50 border-dashed">
                <CardContent className="text-center p-6">
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="mt-2 text-gray-500">
                    {isGenerating ? "Generating your pose..." : "Your generated pose will appear here"}
                  </p>
                  {isGenerating && (
                    <div className="flex justify-center mt-4">
                      <div className="animate-pulse text-indigo-500 text-sm">
                        This may take 30-60 seconds...
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {generatedImageUrl && (
              <div className="mt-4 flex space-x-2">
                <Button
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={isGenerating || isSaving}
                  className="flex-1"
                >
                  <RefreshCw className="mr-1 h-4 w-4" />
                  Generate New
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isGenerating || isSaving}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Save to Library
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isGenerating || isSaving}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}