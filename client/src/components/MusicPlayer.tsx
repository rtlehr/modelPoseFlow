import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX, Play, Pause, Music } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTouchDevice } from "@/hooks/useTouchDevice";

interface MusicPlayerProps {
  isSessionPlaying: boolean;
}

export default function MusicPlayer({ isSessionPlaying }: MusicPlayerProps) {
  const isMobile = useIsMobile();
  const isTouchDevice = useTouchDevice();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Clean up the object URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, [selectedFile]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      
      // Revoke previous URL if exists
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      
      // Create a new URL for the audio file
      const url = URL.createObjectURL(file);
      audioUrlRef.current = url;
      
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
      }
    }
  };

  // Play/pause toggle
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Volume control
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  // Mute toggle
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Update duration when metadata is loaded
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Update current time during playback
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Handle session play/pause to sync with audio
  useEffect(() => {
    if (audioRef.current && isPlaying) {
      if (isSessionPlaying) {
        audioRef.current.play().catch(error => {
          console.error("Error playing audio:", error);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isSessionPlaying, isPlaying]);

  // Format time display (mm:ss)
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className={`mt-4 ${isMobile ? 'p-3' : 'p-4'} bg-gray-50 rounded-lg border border-gray-200`}>
      <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium mb-3 flex items-center`}>
        <Music className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
        Music Player
      </h3>

      <div className="mb-3">
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className={`block w-full ${isMobile ? 'text-sm' : 'text-sm'} text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-primary file:text-white
            hover:file:bg-primary/90
            ${isTouchDevice ? 'file:py-3 file:active:scale-95' : ''}`}
        />
      </div>

      {selectedFile && (
        <>
          <div className={`flex items-center ${isMobile ? 'flex-col space-y-2' : 'justify-between'} mb-2`}>
            <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-600`}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size={isMobile ? "sm" : "icon"}
                onClick={toggleMute}
                className={`mr-2 ${isTouchDevice ? 'active:scale-95' : ''}`}
              >
                {isMuted ? 
                  <VolumeX className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} /> : 
                  <Volume2 className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
                }
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                className={`${isMobile ? 'w-36' : 'w-24'}`}
              />
            </div>
          </div>

          <div className="flex justify-center mt-3">
            <Button
              variant="outline"
              size={isMobile ? "default" : "sm"}
              onClick={togglePlay}
              className={`rounded-full ${isMobile ? 'w-12 h-12' : 'w-10 h-10'} p-0 flex items-center justify-center ${isTouchDevice ? 'active:scale-95 touch-manipulation' : ''}`}
            >
              {isPlaying ? 
                <Pause className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} /> : 
                <Play className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
              }
            </Button>
          </div>

          <audio
            ref={audioRef}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        </>
      )}
    </div>
  );
}