import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Music } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Playlist } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";

interface MusicPlaylistSelectorProps {
  selectedPlaylistId: number | null;
  onChange: (playlistId: number | null) => void;
}

export default function MusicPlaylistSelector({ selectedPlaylistId, onChange }: MusicPlaylistSelectorProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadPlaylists = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest("GET", "/api/playlists");
        const data = await response.json();
        setPlaylists(data || []);
      } catch (error) {
        console.error("Error loading playlists:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlaylists();
  }, []);

  const handlePlaylistChange = (value: string) => {
    const playlistId = value === "none" ? null : parseInt(value, 10);
    onChange(playlistId);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="playlist-select" className="flex items-center">
        <Music className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} mr-2 text-indigo-600`} />
        <span>Background Music</span>
      </Label>

      <Select 
        value={selectedPlaylistId === null ? "none" : selectedPlaylistId.toString()} 
        onValueChange={handlePlaylistChange}
        disabled={isLoading}
      >
        <SelectTrigger id="playlist-select" className="w-full">
          <SelectValue placeholder="Select a playlist" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Music</SelectItem>
          {playlists.map(playlist => (
            <SelectItem key={playlist.id} value={playlist.id.toString()}>
              {playlist.name} {Array.isArray(playlist.trackIds) && playlist.trackIds.length > 0 && 
                `(${playlist.trackIds.length} tracks)`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {playlists.length === 0 && !isLoading && (
        <p className="text-xs text-gray-500 mt-1">
          No playlists available. Create playlists in the Music Playlist screen.
        </p>
      )}
    </div>
  );
}