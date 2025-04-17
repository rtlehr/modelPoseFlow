import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchPosePackDetail, downloadPosePack } from '@/lib/posePacksService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Download, 
  Tag, 
  Check,
  Image as ImageIcon, 
  AlertCircle 
} from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import HelpModal from './HelpModal';
import type { Pose } from '@shared/schema';

interface PosePackDetailScreenProps {
  packId: number;
  onBack: () => void;
}

export default function PosePackDetailScreen({ packId, onBack }: PosePackDetailScreenProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [downloadInProgress, setDownloadInProgress] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const { toast } = useToast();
  
  // Fetch pose pack details
  const { data: packDetails, isLoading, isError } = useQuery({
    queryKey: ['posePack', packId],
    queryFn: () => fetchPosePackDetail(packId),
  });
  
  // Download mutation
  const downloadMutation = useMutation({
    mutationFn: (id: number) => downloadPosePack(id),
    onMutate: () => {
      setDownloadInProgress(true);
      setDownloadComplete(false);
    },
    onSuccess: (data) => {
      setDownloadInProgress(false);
      setDownloadComplete(true);
      
      // Invalidate poses cache to include newly downloaded poses
      queryClient.invalidateQueries({ queryKey: ['poses'] });
      
      toast({
        title: "Success!",
        description: data.message,
      });
    },
    onError: (error) => {
      setDownloadInProgress(false);
      
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "An error occurred during download",
        variant: "destructive",
      });
    }
  });
  
  // Download handler
  const handleDownload = () => {
    if (!downloadComplete && !downloadInProgress) {
      downloadMutation.mutate(packId);
    }
  };
  
  // Help content for the pose pack detail
  const helpInstructions = (
    <div className="space-y-4">
      <p>This screen displays the details of a pose pack and allows you to download the poses it contains.</p>
      
      <h3 className="text-lg font-semibold">How to use:</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>Browse the pack information and sample images</li>
        <li>View the pose difficulty distribution to understand what types of poses are included</li>
        <li>Click "Download Pack" to add these poses to your pose library</li>
        <li>Once downloaded, these poses will be available when creating new practice sessions</li>
      </ul>
      
      <p>Currently, all pose packs are free to download in this development version.</p>
    </div>
  );

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack} 
            className="mr-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Catalog
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHelp(true)}
          className="rounded-full w-8 h-8 p-0"
        >
          ?
        </Button>
      </div>

      {isLoading ? (
        // Loading skeleton
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square" />
            ))}
          </div>
          
          <Skeleton className="h-10 w-full max-w-md mx-auto" />
        </div>
      ) : isError ? (
        // Error state
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load pose pack details. Please try again.
          </AlertDescription>
        </Alert>
      ) : packDetails ? (
        // Pack details
        <div className="space-y-8">
          {/* Pack header */}
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold">{packDetails.pack.name}</h1>
                <p className="text-lg text-muted-foreground">
                  {packDetails.pack.poseCount} poses
                </p>
              </div>
              {packDetails.pack.price > 0 ? (
                <Badge className="bg-primary text-white text-lg px-4 py-1">
                  ${packDetails.pack.price.toFixed(2)}
                </Badge>
              ) : (
                <Badge variant="outline" className="border-green-500 text-green-500 text-lg px-4 py-1">
                  Free
                </Badge>
              )}
            </div>
            
            <p className="text-lg">
              {packDetails.pack.description}
            </p>
            
            <div className="flex flex-wrap gap-2">
              {packDetails.pack.categories?.map((category, idx) => (
                <Badge key={idx} variant="secondary" className="flex items-center text-sm">
                  <Tag className="mr-1 h-3 w-3" />
                  {category}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Sample images */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Sample Poses</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {packDetails.pack.sampleImageUrls?.length ? (
                packDetails.pack.sampleImageUrls.map((imageUrl, idx) => (
                  <div 
                    key={idx}
                    className="aspect-square bg-cover bg-center rounded-md overflow-hidden border"
                    style={{ backgroundImage: `url(${imageUrl})` }}
                  />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center p-8 border rounded-md border-dashed">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No sample images available</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Pose breakdown */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Pose Breakdown</h2>
            
            {/* Calculate difficulty distribution */}
            {(() => {
              const poses = packDetails.poses || [];
              const easyPoses = poses.filter(p => p.difficultyLevel === 1).length;
              const mediumPoses = poses.filter(p => p.difficultyLevel === 2).length;
              const hardPoses = poses.filter(p => p.difficultyLevel === 3).length;
              const unclassifiedPoses = poses.filter(p => !p.difficultyLevel).length;
              
              const totalPoses = poses.length;
              
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-5xl font-bold text-green-500">
                        {easyPoses}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">Easy Poses</p>
                      {totalPoses > 0 && (
                        <p className="text-xs text-muted-foreground">
                          ({Math.round((easyPoses / totalPoses) * 100)}%)
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-5xl font-bold text-amber-500">
                        {mediumPoses}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">Medium Poses</p>
                      {totalPoses > 0 && (
                        <p className="text-xs text-muted-foreground">
                          ({Math.round((mediumPoses / totalPoses) * 100)}%)
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-5xl font-bold text-red-500">
                        {hardPoses}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">Hard Poses</p>
                      {totalPoses > 0 && (
                        <p className="text-xs text-muted-foreground">
                          ({Math.round((hardPoses / totalPoses) * 100)}%)
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  
                  {unclassifiedPoses > 0 && (
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <p className="text-5xl font-bold text-gray-400">
                          {unclassifiedPoses}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">Unclassified</p>
                        {totalPoses > 0 && (
                          <p className="text-xs text-muted-foreground">
                            ({Math.round((unclassifiedPoses / totalPoses) * 100)}%)
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })()}
          </div>
          
          {/* Download button */}
          <div className="flex justify-center py-6">
            <Button 
              size="lg"
              className="w-full max-w-md"
              onClick={handleDownload}
              disabled={downloadInProgress || downloadComplete}
            >
              {downloadComplete ? (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Pack Downloaded
                </>
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  {downloadInProgress ? "Downloading..." : "Download Pack"}
                </>
              )}
            </Button>
          </div>
        </div>
      ) : null}

      {/* Help modal */}
      {showHelp && (
        <HelpModal
          title="Pose Pack Detail Help"
          instructions={helpInstructions}
          onClose={() => setShowHelp(false)}
        />
      )}
    </div>
  );
}