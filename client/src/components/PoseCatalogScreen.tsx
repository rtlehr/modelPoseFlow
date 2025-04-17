import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPosePacks, searchPosePacks } from '@/lib/posePacksService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Search, Download, Tag } from 'lucide-react';
import HelpModal from './HelpModal';
import type { PosePack } from '@shared/schema';

interface PoseCatalogScreenProps {
  onBack: () => void;
  onSelectPack: (packId: number) => void;
}

export default function PoseCatalogScreen({ onBack, onSelectPack }: PoseCatalogScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  
  // Query to fetch all pose packs or search results
  const { data: posePacks, isLoading, refetch } = useQuery({
    queryKey: ['posePacks', searchQuery],
    queryFn: () => searchQuery ? searchPosePacks(searchQuery) : fetchPosePacks(),
  });

  // Search handler
  const handleSearch = () => {
    refetch();
  };

  // Clear search handler
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Help content for the pose catalog
  const helpInstructions = (
    <div className="space-y-4">
      <p>The Pose Catalog allows you to browse and download curated sets of poses for your practice sessions.</p>
      
      <h3 className="text-lg font-semibold">How to use:</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>Browse available pose packs in the catalog</li>
        <li>Use the search bar to find packs by name, description, or category</li>
        <li>Click on a pack to view its details and sample poses</li>
        <li>Click "Download" to add poses from a pack to your pose library</li>
      </ul>
      
      <p>All pose packs are currently free for development purposes. In a production app, some packs may require purchase.</p>
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
            Back
          </Button>
          <h1 className="text-3xl font-bold">Pose Catalog</h1>
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

      {/* Search bar */}
      <div className="flex items-center gap-2 mb-6">
        <Input
          type="text"
          placeholder="Search pose packs by name, description, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
          }}
        />
        <Button onClick={handleSearch}>
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
        {searchQuery && (
          <Button variant="outline" onClick={handleClearSearch}>
            Clear
          </Button>
        )}
      </div>

      {/* Results - Grid of pose packs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-12 w-full mb-2" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))
        ) : posePacks && posePacks.length > 0 ? (
          // Actual pose packs
          posePacks.map((pack) => (
            <Card 
              key={pack.id} 
              className="overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              {/* Thumbnail image */}
              <div 
                className="h-48 w-full bg-cover bg-center" 
                style={{ 
                  backgroundImage: `url(${pack.thumbnailUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{pack.name}</span>
                  {pack.price > 0 ? (
                    <Badge className="bg-primary text-white">
                      ${pack.price.toFixed(2)}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-green-500 text-green-500">
                      Free
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {pack.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {pack.categories?.map((category, idx) => (
                    <Badge key={idx} variant="secondary" className="flex items-center">
                      <Tag className="mr-1 h-3 w-3" />
                      {category}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm font-medium">
                  {pack.poseCount} poses
                </p>
              </CardContent>
              
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => onSelectPack(pack.id)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  View Pack
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          // No results
          <div className="col-span-full text-center py-8">
            <p className="text-lg text-muted-foreground">
              {searchQuery 
                ? `No pose packs found matching "${searchQuery}"`
                : "No pose packs available"
              }
            </p>
          </div>
        )}
      </div>

      {/* Help modal */}
      {showHelp && (
        <HelpModal
          title="Pose Catalog Help"
          instructions={helpInstructions}
          onClose={() => setShowHelp(false)}
        />
      )}
    </div>
  );
}