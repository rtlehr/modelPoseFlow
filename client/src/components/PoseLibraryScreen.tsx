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
import { Pose } from "@shared/schema";
import PoseKeywordManager from "./PoseKeywordManager";

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
          return pose.category.toLowerCase().includes(query);
        }
      );
    }
    
    // Use JSON.stringify to do a deep comparison to avoid infinite updates
    if (JSON.stringify(filtered) !== JSON.stringify(filteredPoses)) {
      setFilteredPoses(filtered);
    }
  }, [poses, activeTab, searchQuery]);
  
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
      
      const newPose = await response.json();
      
      toast({
        title: "Pose uploaded",
        description: "Pose has been added to your library"
      });
      
      // Reset form and close dialog
      resetUploadForm();
      setUploadDialogOpen(false);
      
      // Refresh poses
      refetch();
      
      // Select the new pose to edit keywords
      setSelectedPose(newPose);
      
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
                <p className="text-sm font-medium text-gray-600">Category: 
                  <span className="ml-1 capitalize">{selectedPose.category}</span>
                </p>
              </div>
              <Button 
                variant="outline" 
                className="mt-4 w-full"
                onClick={handleClosePoseDetail}
              >
                Back to Pose List
              </Button>
            </div>
            
            <div className="flex-1">
              <PoseKeywordManager 
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
          
          {/* Category tabs */}
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="standing">Standing</TabsTrigger>
              <TabsTrigger value="sitting">Sitting</TabsTrigger>
              <TabsTrigger value="reclining">Reclining</TabsTrigger>
              <TabsTrigger value="action">Action</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-4">
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
                          <span className="text-xs font-medium capitalize">{pose.category}</span>
                          <span className="text-xs text-gray-500">ID: {pose.id}</span>
                        </div>
                        {pose.keywords && pose.keywords.length > 0 && (
                          <div className="mt-1 overflow-hidden line-clamp-1">
                            <span className="text-xs text-gray-500">
                              {pose.keywords.length} keywords
                            </span>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
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
              <label htmlFor="category" className="text-sm font-medium">
                Pose Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="standing">Standing</option>
                <option value="sitting">Sitting</option>
                <option value="reclining">Reclining</option>
                <option value="action">Action</option>
              </select>
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
                <p className="text-sm text-gray-500 capitalize">Category: {poseToDelete.category}</p>
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