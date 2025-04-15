import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowLeft, Plus, X, Save, Play, Pause, Music, Edit, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { MusicTrack, Playlist } from "@shared/schema";

interface MusicPlaylistScreenProps {
  onBack: () => void;
}

export default function MusicPlaylistScreen({ onBack }: MusicPlaylistScreenProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [editingPlaylist, setEditingPlaylist] = useState<boolean>(false);
  
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");
  
  const [currentAudioSrc, setCurrentAudioSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Load tracks and playlists on mount
  useEffect(() => {
    loadTracks();
    loadPlaylists();
  }, []);
  
  // Handle audio playback control
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(error => {
          toast({
            title: "Playback Error",
            description: "Could not play the audio file. Please try again.",
            variant: "destructive"
          });
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentAudioSrc]);
  
  const loadTracks = async () => {
    try {
      const response = await apiRequest("/api/music-tracks");
      setTracks(response || []);
    } catch (error) {
      console.error("Error loading tracks:", error);
      toast({
        title: "Error",
        description: "Failed to load music tracks. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const loadPlaylists = async () => {
    try {
      const response = await apiRequest("/api/playlists");
      setPlaylists(response || []);
    } catch (error) {
      console.error("Error loading playlists:", error);
      toast({
        title: "Error",
        description: "Failed to load playlists. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith("audio/")) {
      toast({
        title: "Invalid File",
        description: "Please select an audio file.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Create a FileReader to read the file
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        if (!event.target || typeof event.target.result !== "string") return;
        
        // Get file metadata from the browser
        const audio = new Audio();
        audio.src = event.target.result;
        
        // Wait for metadata to load to get duration
        audio.onloadedmetadata = async () => {
          const duration = Math.round(audio.duration);
          
          try {
            // Save only file metadata, not the actual file
            const newTrack = {
              name: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
              artist: "Unknown", // Could be extracted from ID3 tags with a library
              duration,
              // Store the file path or file reference - for demo we'll use dataURL
              filePath: null,
              fileData: event.target.result
            };
            
            const response = await apiRequest<MusicTrack>({
              url: "/api/music-tracks",
              method: "POST",
              data: newTrack
            });
            
            if (response) {
              toast({
                title: "Success",
                description: `Added track: ${response.name}`,
              });
              
              // Reload tracks
              loadTracks();
            }
          } catch (error) {
            console.error("Error adding track:", error);
            toast({
              title: "Error",
              description: "Failed to add music track. Please try again.",
              variant: "destructive"
            });
          }
        };
      };
      
      // Read the file as data URL (base64)
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Error",
        description: "Failed to process audio file. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a playlist name",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const newPlaylist = {
        name: newPlaylistName.trim(),
        description: newPlaylistDescription.trim(),
        trackIds: []
      };
      
      const response = await apiRequest<Playlist>({
        url: "/api/playlists",
        method: "POST",
        data: newPlaylist
      });
      
      if (response) {
        toast({
          title: "Success",
          description: `Created playlist: ${response.name}`,
        });
        
        // Reset form and reload playlists
        setNewPlaylistName("");
        setNewPlaylistDescription("");
        loadPlaylists();
        
        // Select the new playlist
        setSelectedPlaylist(response);
      }
    } catch (error) {
      console.error("Error creating playlist:", error);
      toast({
        title: "Error",
        description: "Failed to create playlist. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const addTrackToPlaylist = async (trackId: number) => {
    if (!selectedPlaylist) return;
    
    try {
      // Create a new trackIds array with the added track
      const trackIds = Array.isArray(selectedPlaylist.trackIds) 
        ? [...selectedPlaylist.trackIds, trackId] 
        : [trackId];
      
      const updatedPlaylist = await apiRequest<Playlist>({
        url: `/api/playlists/${selectedPlaylist.id}`,
        method: "PUT",
        data: {
          ...selectedPlaylist,
          trackIds
        }
      });
      
      if (updatedPlaylist) {
        toast({
          title: "Success",
          description: "Track added to playlist",
        });
        
        // Update the selected playlist and reload playlists
        setSelectedPlaylist(updatedPlaylist);
        loadPlaylists();
      }
    } catch (error) {
      console.error("Error adding track to playlist:", error);
      toast({
        title: "Error",
        description: "Failed to add track to playlist. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const removeTrackFromPlaylist = async (trackId: number) => {
    if (!selectedPlaylist || !Array.isArray(selectedPlaylist.trackIds)) return;
    
    try {
      // Filter out the track to remove
      const trackIds = selectedPlaylist.trackIds.filter(id => id !== trackId);
      
      const updatedPlaylist = await apiRequest<Playlist>({
        url: `/api/playlists/${selectedPlaylist.id}`,
        method: "PUT",
        data: {
          ...selectedPlaylist,
          trackIds
        }
      });
      
      if (updatedPlaylist) {
        toast({
          title: "Success",
          description: "Track removed from playlist",
        });
        
        // Update the selected playlist and reload playlists
        setSelectedPlaylist(updatedPlaylist);
        loadPlaylists();
      }
    } catch (error) {
      console.error("Error removing track from playlist:", error);
      toast({
        title: "Error",
        description: "Failed to remove track from playlist. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const deleteTrack = async (trackId: number) => {
    try {
      await apiRequest({
        url: `/api/music-tracks/${trackId}`,
        method: "DELETE"
      });
      
      toast({
        title: "Success",
        description: "Track deleted successfully",
      });
      
      // Reload tracks and playlists
      loadTracks();
      loadPlaylists();
      
      // If the deleted track is being played, stop playback
      if (currentAudioSrc && tracks.find(t => t.id === trackId)?.fileData === currentAudioSrc) {
        setCurrentAudioSrc(null);
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("Error deleting track:", error);
      toast({
        title: "Error",
        description: "Failed to delete track. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const deletePlaylist = async (playlistId: number) => {
    try {
      await apiRequest({
        url: `/api/playlists/${playlistId}`,
        method: "DELETE"
      });
      
      toast({
        title: "Success",
        description: "Playlist deleted successfully",
      });
      
      // Reload playlists and reset selected playlist if it was deleted
      loadPlaylists();
      if (selectedPlaylist?.id === playlistId) {
        setSelectedPlaylist(null);
      }
    } catch (error) {
      console.error("Error deleting playlist:", error);
      toast({
        title: "Error",
        description: "Failed to delete playlist. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const playTrack = (track: MusicTrack) => {
    if (track.fileData) {
      setCurrentAudioSrc(track.fileData);
      setIsPlaying(true);
    } else {
      toast({
        title: "Playback Error",
        description: "No audio data available for this track",
        variant: "destructive"
      });
    }
  };
  
  // Format time in seconds to MM:SS format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Get the list of tracks for the selected playlist
  const getPlaylistTracks = () => {
    if (!selectedPlaylist || !Array.isArray(selectedPlaylist.trackIds)) return [];
    
    return tracks.filter(track => selectedPlaylist.trackIds.includes(track.id));
  };
  
  return (
    <div className="fixed inset-0 flex flex-col bg-white overflow-auto pb-16">
      {/* Hidden audio element for playback */}
      <audio ref={audioRef} src={currentAudioSrc || undefined} />
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b p-3 shadow-sm">
        <div className="flex items-center justify-between w-full">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="mr-1"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <h1 className="text-lg md:text-xl font-bold text-gray-800 flex-1 truncate px-2">Music Playlists</h1>
          
          <input
            type="file"
            ref={fileInputRef}
            accept="audio/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm p-2 md:p-3"
            size={isMobile ? "sm" : "default"}
          >
            <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="whitespace-nowrap">Add Music</span>
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row max-w-4xl mx-auto w-full p-2 md:p-4 gap-4 md:gap-6">
        {/* Left side - Playlists */}
        <div className="w-full lg:w-1/3 space-y-4 md:space-y-6">
          <div className="bg-white rounded-lg border p-4 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Music className="h-5 w-5 mr-2 text-indigo-600" />
              Your Playlists
            </h2>
            
            {playlists.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No playlists created yet. Create your first playlist below.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {playlists.map(playlist => (
                  <div 
                    key={playlist.id}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedPlaylist?.id === playlist.id 
                        ? 'bg-indigo-100 border border-indigo-200' 
                        : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                    }`}
                    onClick={() => setSelectedPlaylist(playlist)}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-sm">{playlist.name}</h3>
                      
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-7 w-7 text-gray-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePlaylist(playlist.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {playlist.description && (
                      <p className="text-xs text-gray-500 mt-1">{playlist.description}</p>
                    )}
                    
                    <p className="text-xs text-gray-400 mt-1">
                      {Array.isArray(playlist.trackIds) ? playlist.trackIds.length : 0} tracks
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            <Separator className="my-4" />
            
            {/* Create new playlist form */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Create New Playlist</h3>
              
              <div className="space-y-2">
                <Label htmlFor="playlist-name" className="text-xs">Playlist Name</Label>
                <Input
                  id="playlist-name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="My Drawing Playlist"
                  className="text-sm h-8"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="playlist-description" className="text-xs">Description (Optional)</Label>
                <Textarea
                  id="playlist-description"
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  placeholder="Music for figure drawing sessions"
                  className="text-sm min-h-[60px] resize-none"
                />
              </div>
              
              <Button
                onClick={createPlaylist}
                className="w-full h-8 text-sm"
                variant="outline"
              >
                <Plus className="h-3 w-3 mr-1" />
                Create Playlist
              </Button>
            </div>
          </div>
        </div>
        
        {/* Right side - Tracks and Selected Playlist */}
        <div className="w-full lg:w-2/3 space-y-4 md:space-y-6">
          {/* Selected Playlist */}
          {selectedPlaylist && (
            <div className="bg-white rounded-lg border p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{selectedPlaylist.name}</h2>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setEditingPlaylist(!editingPlaylist)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    {editingPlaylist ? "Done" : "Edit"}
                  </Button>
                </div>
              </div>
              
              {selectedPlaylist.description && (
                <p className="text-sm text-gray-600 mb-4">{selectedPlaylist.description}</p>
              )}
              
              <div className="max-h-64 overflow-y-auto">
                {getPlaylistTracks().length === 0 ? (
                  <p className="text-gray-500 text-sm italic py-4">
                    This playlist is empty. Add tracks from the library below.
                  </p>
                ) : (
                  <div className="divide-y">
                    {getPlaylistTracks().map(track => (
                      <div key={track.id} className="py-2 flex items-center justify-between">
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 mr-2"
                            onClick={() => {
                              if (isPlaying && currentAudioSrc === track.fileData) {
                                setIsPlaying(false);
                              } else {
                                playTrack(track);
                              }
                            }}
                          >
                            {isPlaying && currentAudioSrc === track.fileData ? (
                              <Pause className="h-4 w-4 text-indigo-600" />
                            ) : (
                              <Play className="h-4 w-4 text-indigo-600" />
                            )}
                          </Button>
                          
                          <div>
                            <p className="text-sm font-medium">{track.name}</p>
                            <p className="text-xs text-gray-500">
                              {track.artist} • {formatTime(track.duration || 0)}
                            </p>
                          </div>
                        </div>
                        
                        {editingPlaylist && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-red-500"
                            onClick={() => removeTrackFromPlaylist(track.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Music Library */}
          <div className="bg-white rounded-lg border p-4 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Music Library</h2>
            
            {tracks.length === 0 ? (
              <p className="text-gray-500 text-sm italic py-4">
                No music tracks available. Click "Add Music" to upload tracks from your device.
              </p>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y">
                {tracks.map(track => (
                  <div key={track.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 mr-2 flex-shrink-0"
                        onClick={() => {
                          if (isPlaying && currentAudioSrc === track.fileData) {
                            setIsPlaying(false);
                          } else {
                            playTrack(track);
                          }
                        }}
                      >
                        {isPlaying && currentAudioSrc === track.fileData ? (
                          <Pause className="h-4 w-4 text-indigo-600" />
                        ) : (
                          <Play className="h-4 w-4 text-indigo-600" />
                        )}
                      </Button>
                      
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{track.name}</p>
                        <p className="text-xs text-gray-500">
                          {track.artist} • {formatTime(track.duration || 0)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1 md:space-x-2 ml-1 md:ml-2">
                      {selectedPlaylist && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 text-xs ${
                            Array.isArray(selectedPlaylist.trackIds) && 
                            selectedPlaylist.trackIds.includes(track.id)
                              ? 'text-gray-400'
                              : 'text-indigo-600'
                          } ${isMobile ? 'px-2' : ''}`}
                          onClick={() => addTrackToPlaylist(track.id)}
                          disabled={
                            Array.isArray(selectedPlaylist.trackIds) && 
                            selectedPlaylist.trackIds.includes(track.id)
                          }
                        >
                          {Array.isArray(selectedPlaylist.trackIds) && 
                           selectedPlaylist.trackIds.includes(track.id)
                            ? 'Added'
                            : isMobile ? '+' : 'Add to Playlist'}
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-red-500"
                        onClick={() => deleteTrack(track.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}