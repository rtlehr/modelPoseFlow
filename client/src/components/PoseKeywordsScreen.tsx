import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Search, Filter } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Pose } from "@shared/schema";
import PoseKeywordManager from "./PoseKeywordManager";

interface PoseKeywordsScreenProps {
  onBack: () => void;
}

export default function PoseKeywordsScreen({ onBack }: PoseKeywordsScreenProps) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPose, setSelectedPose] = useState<Pose | null>(null);
  const [filteredPoses, setFilteredPoses] = useState<Pose[]>([]);
  
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
    if (!poses) return;
    
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
    
    setFilteredPoses(filtered);
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
          Pose Keywords
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
          {/* Search and filters */}
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
                      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleSelectPose(pose)}
                    >
                      <div className="aspect-[3/4] relative">
                        <img 
                          src={pose.url} 
                          alt={`Pose ${pose.id}`}
                          className="w-full h-full object-cover"
                        />
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
    </div>
  );
}