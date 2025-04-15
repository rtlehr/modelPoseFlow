import { useState, useEffect, useCallback } from "react";
import { Pose, PoseSessionConfig } from "@/types";
import usePoseSession from "@/hooks/usePoseSession";
import { formatTime } from "@/lib/timerService";

interface FullscreenTimerScreenProps {
  sessionConfig: PoseSessionConfig;
  poses: Pose[];
  onExitFullscreen: () => void;
}

export default function FullscreenTimerScreen({ 
  sessionConfig, 
  poses, 
  onExitFullscreen 
}: FullscreenTimerScreenProps) {
  const {
    currentPose,
    currentPoseIndex,
    totalPoses,
    remainingTime,
    progress,
    isPlaying,
    startTimer,
    pauseTimer,
    nextPose,
    previousPose
  } = usePoseSession(sessionConfig, poses);

  // State to track if controls are visible (they auto-hide when inactive)
  const [controlsVisible, setControlsVisible] = useState(true);
  // Timer for auto-hiding controls
  const [hideTimer, setHideTimer] = useState<NodeJS.Timeout | null>(null);

  // Auto-start timer when component mounts
  useEffect(() => {
    const timerId = setTimeout(() => {
      startTimer();
    }, 500);
    
    return () => clearTimeout(timerId);
  }, [startTimer]);

  // Function to handle mouse movement
  const handleMouseMove = useCallback(() => {
    // Show controls
    setControlsVisible(true);
    
    // Reset the hide timer
    if (hideTimer) {
      clearTimeout(hideTimer);
    }
    
    // Set a new timer to hide controls after 3 seconds of inactivity
    const timer = setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
    
    setHideTimer(timer);
  }, [hideTimer]);

  // Set up event listeners for mouse movement
  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    
    // Show controls initially and set hide timer
    handleMouseMove();
    
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
    };
  }, [handleMouseMove, hideTimer]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case " ": // Space bar
          if (isPlaying) {
            pauseTimer();
          } else {
            startTimer();
          }
          break;
        case "ArrowRight":
          nextPose();
          break;
        case "ArrowLeft":
          previousPose();
          break;
        case "Escape":
          onExitFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPlaying, startTimer, pauseTimer, nextPose, previousPose, onExitFullscreen]);

  if (!currentPose) return null;

  return (
    <div 
      className="fullscreen-mode flex items-center justify-center"
      onClick={() => isPlaying ? pauseTimer() : startTimer()}
    >
      {/* Pose image (centered and maximized) */}
      <div className="relative w-full h-full">
        <img 
          src={currentPose.url} 
          alt={`Pose ${currentPoseIndex + 1}`}
          className="absolute inset-0 w-full h-full object-contain"
        />
      </div>
      
      {/* Controls overlay (only visible when controlsVisible is true) */}
      <div 
        className={`absolute inset-0 fullscreen-controls-fade pointer-events-none ${
          controlsVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Top bar with exit and progress info */}
        <div className="fullscreen-gradient-top p-4 flex justify-between items-center pointer-events-auto">
          <button 
            className="text-white hover:text-gray-300 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onExitFullscreen();
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="text-white text-xl">
            <span className="font-bold">{currentPoseIndex + 1}</span>
            <span className="mx-1">/</span>
            <span>{totalPoses}</span>
            <span className="ml-2 capitalize">{currentPose.category}</span>
          </div>
        </div>
        
        {/* Timer and pose controls */}
        <div className="fullscreen-gradient-bottom p-4 flex justify-between items-center pointer-events-auto">
          <div className="text-white text-4xl font-bold">
            {formatTime(remainingTime)}
          </div>
          
          <div className="flex space-x-6">
            <button 
              className="text-white hover:text-gray-300 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                previousPose();
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button 
              className="text-white hover:text-gray-300 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                isPlaying ? pauseTimer() : startTimer();
              }}
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
            
            <button 
              className="text-white hover:text-gray-300 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                nextPose();
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Progress bar (bottom of screen) */}
      <div className="fullscreen-progress-bar">
        <div 
          className="h-full bg-primary"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {/* Keyboard shortcuts info (visible briefly on initial load) */}
      {controlsVisible && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-black/60 text-white text-sm px-4 py-2 rounded-full pointer-events-none">
          Space: Play/Pause • Arrow Keys: Previous/Next • Esc: Exit
        </div>
      )}
    </div>
  );
}