import { useState, useEffect, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Music } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { MusicTrack, Playlist } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTouchDevice } from "@/hooks/useTouchDevice";

interface SessionMusicPlayerProps {
  playlistId: number | null;
  isSessionPlaying: boolean;
}

export default function SessionMusicPlayer({ playlistId, isSessionPlaying }: SessionMusicPlayerProps) {
  const isMobile = useIsMobile();
  const isTouchDevice = useTouchDevice();
  
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Fetch playlist data when playlistId changes
  useEffect(() => {
    const loadPlaylistData = async () => {
      if (!playlistId) {
        setPlaylist(null);
        setTracks([]);
        return;
      }
      
      try {
        setIsLoading(true);
        // Load playlist details
        const playlistResponse = await apiRequest("GET", `/api/playlists/${playlistId}`);
        const playlistData = await playlistResponse.json();
        setPlaylist(playlistData);
        
        // Load playlist tracks
        if (playlistData && Array.isArray(playlistData.trackIds) && playlistData.trackIds.length > 0) {
          const allTracksResponse = await apiRequest("GET", "/api/music-tracks");
          const allTracksData = await allTracksResponse.json();
          
          // Filter tracks by the ones in the playlist
          const playlistTracks = allTracksData.filter(
            (track: MusicTrack) => playlistData.trackIds.includes(track.id)
          );
          
          setTracks(playlistTracks);
          
          // Shuffle the tracks for variety
          const shuffledTracks = [...playlistTracks].sort(() => Math.random() - 0.5);
          setTracks(shuffledTracks);
        }
      } catch (error) {
        console.error("Error loading playlist data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPlaylistData();
  }, [playlistId]);
  
  // Sync with session playing state
  useEffect(() => {
    if (!playlistId || tracks.length === 0) return;
    
    if (isSessionPlaying) {
      setIsPlaying(true);
      audioRef.current?.play().catch(error => {
        console.error("Error playing audio:", error);
      });
    } else {
      setIsPlaying(false);
      audioRef.current?.pause();
    }
  }, [isSessionPlaying, playlistId, tracks]);
  
  // Set up event listeners when current track index changes
  useEffect(() => {
    if (!audioRef.current || tracks.length === 0) return;
    
    const currentTrack = tracks[currentTrackIndex];
    if (currentTrack && currentTrack.fileData) {
      audioRef.current.src = currentTrack.fileData;
      
      if (isPlaying) {
        audioRef.current.play().catch(error => {
          console.error("Error playing audio:", error);
        });
      }
    }
    
    // Set up event listener for when the track ends
    const handleEnded = () => {
      // Go to next track, or loop back to the first track
      setCurrentTrackIndex((prevIndex) => 
        prevIndex < tracks.length - 1 ? prevIndex + 1 : 0
      );
    };
    
    audioRef.current.addEventListener("ended", handleEnded);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("ended", handleEnded);
      }
    };
  }, [currentTrackIndex, tracks, isPlaying]);
  
  // Volume control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);
  
  // Mute control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);
  
  // Volume control
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };
  
  // Mute toggle
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  if (!playlistId || tracks.length === 0) {
    return null; // Don't render anything if no playlist or tracks
  }
  
  const currentTrack = tracks[currentTrackIndex];
  
  return (
    <div className={`${isMobile ? 'px-2 py-1' : 'p-2'} bg-gray-800 bg-opacity-20 backdrop-blur-sm rounded-lg text-white flex items-center fixed bottom-3 left-1/2 transform -translate-x-1/2 z-10 shadow-lg min-w-60 max-w-72`}>
      <audio ref={audioRef} className="hidden" />
      
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center flex-1 min-w-0">
          <Music className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mx-2 flex-shrink-0`} />
          
          <div className="truncate text-xs flex-1 min-w-0">
            {currentTrack?.name || "Unknown Track"}
          </div>
        </div>
        
        <div className="flex items-center ml-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className={`p-1 h-8 w-8 ${isTouchDevice ? 'active:scale-95' : ''} text-white hover:bg-white/20`}
          >
            {isMuted ? 
              <VolumeX className="h-3 w-3" /> : 
              <Volume2 className="h-3 w-3" />
            }
          </Button>
          
          <Slider
            value={[isMuted ? 0 : volume]}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            className="w-16 md:w-20"
          />
        </div>
      </div>
    </div>
  );
}