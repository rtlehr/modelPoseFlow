import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Search, Filter, Upload, Trash2, 
  AlertTriangle, PlusCircle, X
} from "lucide-react";
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogHeader, DialogTitle, DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Pose } from "@/types";
import PoseKeywordManager from "./PoseKeywordManager";
import PoseDifficultyManager from "./PoseDifficultyManager";

interface PoseLibraryScreenProps {
  onBack: () => void;
}

export default function PoseLibraryScreen({ onBack }: PoseLibraryScreenProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPose, setSelectedPose] = useState<Pose | null>(null);
  const [filteredPoses, setFilteredPoses] = useState<Pose[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [poseToDelete, setPoseToDelete] = useState<Pose | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("standing");
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null);
  
  // Fetch all poses
  const { data: poses = [], isLoading, refetch } = useQuery({
    queryKey: ["poses"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/poses");
      if (!response.ok) {
        throw new Error("Failed to fetch poses");
      }
      return response.json();
    }
  });
  
  // Update filtered poses when poses data changes or filters change
  useEffect(() => {
    if (!poses || poses.length === 0) return;
    
    let filtered = [...poses];
    
    // Apply category filter
    if (activeTab !== "all") {
      filtered = filtered.filter(pose => pose.category === activeTab);
    }
    
    // Apply difficulty filter
    if (difficultyFilter !== null) {
      filtered = filtered.filter(pose => pose.difficultyLevel === difficultyFilter);
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        pose => {
          // Search in keywords if available
          if (pose.keywords && Array.isArray(pose.keywords)) {
            if (pose.keywords.some((keyword: string) => 
              keyword.toLowerCase().includes(query)
            )) {
              return true;
            }
          }
          
          // Search in category
          return pose.category?.toLowerCase().includes(query);
        }
      );
    }
    
    // Use JSON.stringify to do a deep comparison to avoid infinite updates
    if (JSON.stringify(filtered) !== JSON.stringify(filteredPoses)) {
      setFilteredPoses(filtered);
    }
  }, [poses, activeTab, difficultyFilter, searchQuery, filteredPoses]);
  
  // Handle pose selection
  const handleSelectPose = (pose: Pose) => {
    setSelectedPose(pose);
  };
  
  // Handle pose update (after keywords change)
  const handlePoseUpdate = (updatedPose: Pose) => {
    setSelectedPose(updatedPose);
    refetch(); // Refresh the poses list
  };
  
  // Close pose detail view
  const handleClosePoseDetail = () => {
    setSelectedPose(null);
  };

  // Helper function to generate keywords for a pose
  const generateKeywordsForPose = async (pose: Pose): Promise<Pose> => {
    try {
      console.log(`Attempting to generate keywords for pose ID: ${pose.id}`);
      const keywordsResponse = await apiRequest("POST", `/api/poses/${pose.id}/generate-keywords`);
      
      if (keywordsResponse.ok) {
        const keywordsResult = await keywordsResponse.json();
        console.log("Keywords generated successfully:", keywordsResult);
        return keywordsResult.pose;
      } else {
        console.error("Failed to generate keywords:", await keywordsResponse.text());
        return pose;
      }
    } catch (error) {
      console.error("Error generating keywords:", error);
      return pose;
    }
  };
  
  // Handle file selection for upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }
    
    // Create preview of the uploaded image
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === 'string') {
        setUploadedImagePreview(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };
  
  // Reset upload form
  const resetUploadForm = () => {
    setUploadedImagePreview(null);
    setSelectedCategory("standing");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  // Handle pose upload
  const handleUploadPose = async () => {
    if (!uploadedImagePreview) {
      toast({
        title: "No image selected",
        description: "Please select an image to upload",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setUploading(true);
      
      // Check if the image data is larger than 2MB (approximate conversion from base64)
      // Base64 encoding increases size by ~33%, so check for ~1.5MB in base64 chars
      if (uploadedImagePreview.length > 2000000) {
        toast({
          title: "Image too large",
          description: "Please select an image smaller than 2MB",
          variant: "destructive"
        });
        setUploading(false);
        return;
      }
      
      const response = await apiRequest("POST", "/api/poses", {
        category: selectedCategory,
        url: uploadedImagePreview
      });
      
      if (!response.ok) {
        // Check if the error is due to payload size
        if (response.status === 413) {
          throw new Error("Image too large (max 2MB)");
        } else {
          throw new Error("Failed to upload pose");
        }
      }
      
      let newPose;
      try {
        // Add more detailed logging
        console.log("Response status:", response.status);
        const responseText = await response.text();
        console.log("Response text:", responseText);
        
        // Try to parse the JSON response
        if (responseText.trim()) {
          newPose = JSON.parse(responseText);
        } else {
          throw new Error("Empty response from server");
        }
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        throw new Error("Invalid response from server");
      }
      
      toast({
        title: "Pose uploaded",
        description: "Pose has been added to your library"
      });
      
      // Reset form and close dialog
      resetUploadForm();
      setUploadDialogOpen(false);
      
      // Refresh poses
      refetch();
      
      // After uploading the pose, generate keywords using our helper function
      const poseWithKeywords = await generateKeywordsForPose(newPose);
      
      // Force a refresh of the poses list to ensure we see the updated keywords
      await refetch();
      
      // Now select the pose with keywords to show the details view
      setSelectedPose(poseWithKeywords);
      
      // Show a toast to confirm keywords were generated
      toast({
        title: "Keywords generated",
        description: `Generated ${poseWithKeywords.keywords?.length || 0} keywords for this pose`
      });
      
    } catch (error: any) {
      console.error("Error uploading pose:", error);
      
      // Safely determine if there's a message property
      let errorMessage = "Failed to upload pose. Please try again.";
      
      if (error && typeof error === 'object' && 'message' in error) {
        if (String(error.message).includes("too large")) {
          errorMessage = "Image is too large. Please select an image smaller than 2MB.";
        }
      }
      
      // Log more details for debugging
      console.log("Error details:", JSON.stringify(error, null, 2));
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  
  // Handle pose deletion
  const handleDeletePose = async () => {
    if (!poseToDelete) return;
    
    try {
      const response = await apiRequest("DELETE", `/api/poses/${poseToDelete.id}`);
      
      if (!response.ok) {
        throw new Error("Failed to delete pose");
      }
      
      toast({
        title: "Pose deleted",
        description: "Pose has been removed from your library"
      });
      
      // Close dialog
      setDeleteDialogOpen(false);
      setPoseToDelete(null);
      
      // Refresh poses
      refetch();
      
    } catch (error: any) {
      console.error("Error deleting pose:", error);
      console.log("Error details:", JSON.stringify(error, null, 2));
      toast({
        title: "Deletion failed",
        description: "Failed to delete pose. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Open delete confirmation dialog
  const confirmDeletePose = (pose: Pose, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent pose selection
    setPoseToDelete(pose);
    setDeleteDialogOpen(true);
  };
  
  return (
    <div className={`bg-white rounded-xl shadow-lg ${isMobile ? 'p-4' : 'p-6'} max-w-4xl mx-auto`}>
      {/* Header with back button */}
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800 touch-manipulation -ml-2"
          aria-label="Back"
        >
          <ArrowLeft className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
        </Button>
        
        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-800 flex-1 text-center`}>
          Pose Library
        </h1>
        
        {/* Empty div to balance the layout */}
        <div className="w-6"></div>
      </div>
      
      {/* Main content - conditional rendering based on whether a pose is selected */}
      {selectedPose ? (
        // Pose detail view with keyword editor
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="w-1/3">
              <img 
                src={selectedPose.url} 
                alt={`Pose ${selectedPose.id}`}
                className="w-full h-auto rounded-lg shadow-md object-cover aspect-[3/4]"
              />
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-600">Keywords:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedPose.keywords && selectedPose.keywords.length > 0 ? (
                    selectedPose.keywords.map((keyword, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                        {keyword}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500">No keywords available</span>
                  )}
                </div>
              </div>
              <Button 
                variant="outline" 
                className="mt-4 w-full"
                onClick={handleClosePoseDetail}
              >
                Back to Pose List
              </Button>
            </div>
            
            <div className="flex-1 space-y-6">
              <PoseKeywordManager 
                pose={selectedPose}
                onUpdate={handlePoseUpdate}
              />
              
              <PoseDifficultyManager
                pose={selectedPose}
                onUpdate={handlePoseUpdate}
              />
            </div>
          </div>
        </div>
      ) : (
        // Pose list view
        <div className="space-y-4">
          {/* Search and filters with Add button */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search poses..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            
            <Button 
              onClick={() => setUploadDialogOpen(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              {isMobile ? 'Add' : 'Add Pose'}
            </Button>
          </div>
          
          {/* Category and Difficulty tabs */}
          <div className="flex flex-col space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Categories</h3>
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full justify-start overflow-x-auto">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="standing">Standing</TabsTrigger>
                  <TabsTrigger value="sitting">Sitting</TabsTrigger>
                  <TabsTrigger value="reclining">Reclining</TabsTrigger>
                  <TabsTrigger value="action">Action</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Model Holding Difficulty</h3>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setDifficultyFilter(null)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    difficultyFilter === null 
                      ? 'bg-gray-100 border-gray-400 text-gray-800' 
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  All
                </button>
                <button 
                  onClick={() => setDifficultyFilter(1)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    difficultyFilter === 1 
                      ? 'bg-green-50 border-green-500 text-green-700' 
                      : 'border-green-200 text-green-600 hover:border-green-400'
                  }`}
                >
                  Easy to Hold
                </button>
                <button 
                  onClick={() => setDifficultyFilter(2)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    difficultyFilter === 2 
                      ? 'bg-orange-50 border-orange-500 text-orange-700' 
                      : 'border-orange-200 text-orange-600 hover:border-orange-400'
                  }`}
                >
                  Medium to Hold
                </button>
                <button 
                  onClick={() => setDifficultyFilter(3)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    difficultyFilter === 3 
                      ? 'bg-red-50 border-red-500 text-red-700' 
                      : 'border-red-200 text-red-600 hover:border-red-400'
                  }`}
                >
                  Hard to Hold
                </button>
              </div>
            </div>
          </div>
          
          {/* Pose grid */}
          <div className="mt-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-60">
                <p>Loading poses...</p>
              </div>
            ) : filteredPoses.length === 0 ? (
              <div className="flex justify-center items-center h-60">
                <p>No poses found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredPoses.map((pose) => (
                  <Card 
                    key={pose.id}
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
                    onClick={() => handleSelectPose(pose)}
                  >
                    <div className="aspect-[3/4] relative">
                      <img 
                        src={pose.url} 
                        alt={`Pose ${pose.id}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button 
                          variant="destructive"
                          size="sm" 
                          className="opacity-90"
                          onClick={(e) => confirmDeletePose(pose, e)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div className="p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">
                          {pose.keywords && pose.keywords.length > 0 
                            ? pose.keywords[0].charAt(0).toUpperCase() + pose.keywords[0].slice(1)
                            : "No keyword"}
                        </span>
                        <span className="text-xs text-gray-500">ID: {pose.id}</span>
                      </div>
                      
                      <div className="flex justify-between items-center mt-1">
                        <div className="overflow-hidden line-clamp-1">
                          {pose.keywords && pose.keywords.length > 0 ? (
                            <span className="text-xs text-green-600 font-medium flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              {pose.keywords.length} keywords
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              No keywords
                            </span>
                          )}
                        </div>
                        
                        {pose.difficultyLevel && (
                          <div className={`text-xs px-1.5 py-0.5 rounded-full border ${
                            pose.difficultyLevel === 1 ? 'text-green-500 border-green-500' :
                            pose.difficultyLevel === 2 ? 'text-orange-500 border-orange-500' :
                            'text-red-500 border-red-500'
                          }`}>
                            {pose.difficultyLevel === 1 ? 'Easy Hold' : 
                             pose.difficultyLevel === 2 ? 'Med Hold' : 'Hard Hold'}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload New Pose</DialogTitle>
            <DialogDescription>
              Upload an image of a figure pose to add to your library.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex flex-col space-y-2">
              <div className="text-sm font-medium flex items-center">
                <span>Automatic Keyword Generation</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-md border border-blue-100">
                <div className="text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-xs text-blue-700">
                  After upload, AI will analyze the image and automatically generate keywords for enhanced pose matching.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <label htmlFor="poseImage" className="text-sm font-medium">
                Pose Image
              </label>
              
              {uploadedImagePreview ? (
                <div className="relative aspect-[3/4] w-full max-w-[200px] mx-auto border rounded-md overflow-hidden">
                  <img 
                    src={uploadedImagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => setUploadedImagePreview(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    Click to select an image, or drag and drop
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, PNG, or GIF files (max 2MB)
                  </p>
                </div>
              )}
              
              <input 
                ref={fileInputRef}
                id="poseImage"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
          
          <DialogFooter className="flex space-x-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => {
                resetUploadForm();
                setUploadDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUploadPose}
              disabled={!uploadedImagePreview || uploading}
              className="bg-gradient-to-r from-indigo-500 to-purple-600"
            >
              {uploading ? 
                <div className="flex items-center">
                  <span className="animate-spin mr-1">
                    <svg className="h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                  Uploading...
                </div> : 
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Pose
                </>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this pose? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {poseToDelete && (
            <div className="py-4 flex items-center space-x-4">
              <div className="w-20 h-20 relative rounded-md overflow-hidden">
                <img 
                  src={poseToDelete.url} 
                  alt={`Pose ${poseToDelete.id}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-medium">Pose ID: {poseToDelete.id}</p>
                <p className="text-sm text-gray-500">
                  {poseToDelete.keywords && poseToDelete.keywords.length > 0 ? (
                    <>Primary keyword: <span className="capitalize">{poseToDelete.keywords[0]}</span></>
                  ) : (
                    "No keywords available"
                  )}
                </p>
                {poseToDelete.keywords && (
                  <p className="text-sm text-gray-500">
                    Has {poseToDelete.keywords.length} keywords
                  </p>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeletePose}
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}