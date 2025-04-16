import { useState, useEffect, useCallback, useRef } from "react";
import { Pose, PoseSessionConfig } from "@/types";
import usePoseSession from "@/hooks/usePoseSession";
import { formatTime } from "@/lib/timerService";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTouchDevice } from "@/hooks/useTouchDevice";
import HelpModal from "./HelpModal";

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
  const isMobile = useIsMobile();
  const isTouchDevice = useTouchDevice();
  
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
  // Track touch events for swipe detection
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchStartTime = useRef<number | null>(null);
  
  // Auto-start timer when component mounts
  useEffect(() => {
    const timerId = setTimeout(() => {
      startTimer();
    }, 500);
    
    return () => clearTimeout(timerId);
  }, [startTimer]);

  // Show controls when user interacts
  const showControls = useCallback(() => {
    // Show controls
    setControlsVisible(true);
    
    // Reset the hide timer
    if (hideTimer) {
      clearTimeout(hideTimer);
    }
    
    // Set a new timer to hide controls after inactivity (longer for touch devices)
    const timer = setTimeout(() => {
      setControlsVisible(false);
    }, isTouchDevice ? 4000 : 3000);
    
    setHideTimer(timer);
    
    // Return the timer to allow cleanup
    return timer;
  }, [isTouchDevice]); // Remove hideTimer from dependencies to avoid infinite loop

  // Handle user interaction (mouse or touch)
  const handleUserInteraction = useCallback(() => {
    showControls();
  }, [showControls]);

  // Handle touch events for swipe gestures
  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartTime.current = Date.now();
    showControls();
  }, [showControls]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (touchStartX.current === null) return;
    
    touchEndX.current = e.changedTouches[0].clientX;
    const touchTime = Date.now() - (touchStartTime.current || 0);
    
    // Calculate swipe distance and direction
    const swipeDistance = touchEndX.current - touchStartX.current;
    const swipeThreshold = window.innerWidth * 0.15; // 15% of screen width
    
    // Check if swipe is fast enough and long enough to be intentional
    if (Math.abs(swipeDistance) > swipeThreshold && touchTime < 300) {
      if (swipeDistance > 0) {
        // Swipe right - go to previous pose
        previousPose();
      } else {
        // Swipe left - go to next pose
        nextPose();
      }
    } else if (Math.abs(swipeDistance) < 20) {
      // Tap (not a swipe) - toggle play/pause
      isPlaying ? pauseTimer() : startTimer();
    }
    
    // Reset touch tracking
    touchStartX.current = null;
    touchEndX.current = null;
    touchStartTime.current = null;
  }, [nextPose, previousPose, isPlaying, pauseTimer, startTimer, showControls]);

  // Set up event listeners
  useEffect(() => {
    // For mouse devices
    document.addEventListener("mousemove", handleUserInteraction);
    
    // For touch devices
    if (isTouchDevice) {
      document.addEventListener("touchstart", handleTouchStart);
      document.addEventListener("touchend", handleTouchEnd);
    }
    
    // Show controls initially and get the initial timer
    const initialTimer = showControls();
    
    return () => {
      document.removeEventListener("mousemove", handleUserInteraction);
      if (isTouchDevice) {
        document.removeEventListener("touchstart", handleTouchStart);
        document.removeEventListener("touchend", handleTouchEnd);
      }
      
      // Clear the initial timer (if it exists) or the current hideTimer
      if (initialTimer) {
        clearTimeout(initialTimer);
      } else if (hideTimer) {
        clearTimeout(hideTimer);
      }
    };
  }, [handleUserInteraction, isTouchDevice, handleTouchStart, handleTouchEnd, showControls]); // Removed hideTimer

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

  const helpInstructions = `
This is the fullscreen mode for distraction-free pose practice.

Controls:
• Tap anywhere on screen: Toggle play/pause (mouse devices)
• Touch and swipe left: Go to next pose (touch devices)
• Touch and swipe right: Go to previous pose (touch devices)

Keyboard shortcuts:
• Space: Play/Pause timer
• Right Arrow: Next pose
• Left Arrow: Previous pose
• Escape: Exit fullscreen mode

Tips:
• Controls will appear when you move your mouse or touch the screen
• Controls will automatically hide after a few seconds of inactivity
• You can see your progress and remaining time at the bottom of the screen
`;

  if (!currentPose) return null;

  return (
    <div 
      className="fullscreen-mode flex items-center justify-center"
      onClick={() => {
        if (!isTouchDevice) {
          isPlaying ? pauseTimer() : startTimer();
        }
      }}
    >
      {/* Pose image (centered and maximized) */}
      <div className="relative w-full h-full">
        <img 
          src={currentPose.url} 
          alt={`Pose ${currentPoseIndex + 1}`}
          className="absolute inset-0 w-full h-full object-contain"
          draggable="false"
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
            className="text-white hover:text-gray-300 transition-colors active:scale-95 active:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
              onExitFullscreen();
            }}
            aria-label="Exit fullscreen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`${isMobile ? 'h-9 w-9' : 'h-8 w-8'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className={`text-white ${isMobile ? 'text-xl font-medium' : 'text-xl'}`}>
            <span className="font-bold">{currentPoseIndex + 1}</span>
            <span className="mx-1">/</span>
            <span>{totalPoses}</span>
            {currentPose.keywords && currentPose.keywords.length > 0 && (
              <span className="ml-2 capitalize">{currentPose.keywords[0]}</span>
            )}
          </div>
          
          <div 
            className="flex justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <div style={{ filter: "invert(1)" }} className="z-50">
                <HelpModal 
                  title="Fullscreen Pose Timer Help" 
                  instructions={helpInstructions}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Timer and pose controls */}
        <div className="fullscreen-gradient-bottom p-4 flex justify-between items-center pointer-events-auto">
          <div className={`text-white font-mono ${isMobile ? 'text-5xl' : 'text-4xl'} font-bold`}>
            {formatTime(remainingTime)}
          </div>
          
          <div className={`flex ${isMobile ? 'space-x-8' : 'space-x-6'}`}>
            <button 
              className="text-white hover:text-gray-300 transition-colors active:scale-95 active:opacity-80 p-2"
              onClick={(e) => {
                e.stopPropagation();
                previousPose();
              }}
              aria-label="Previous pose"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`${isMobile ? 'h-10 w-10' : 'h-8 w-8'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button 
              className="text-white hover:text-gray-300 transition-colors active:scale-95 active:opacity-80 p-2"
              onClick={(e) => {
                e.stopPropagation();
                isPlaying ? pauseTimer() : startTimer();
              }}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" className={`${isMobile ? 'h-12 w-12' : 'h-10 w-10'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className={`${isMobile ? 'h-12 w-12' : 'h-10 w-10'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
            
            <button 
              className="text-white hover:text-gray-300 transition-colors active:scale-95 active:opacity-80 p-2"
              onClick={(e) => {
                e.stopPropagation();
                nextPose();
              }}
              aria-label="Next pose"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`${isMobile ? 'h-10 w-10' : 'h-8 w-8'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Progress bar (bottom of screen) */}
      <div className={`fullscreen-progress-bar ${isMobile ? 'h-2' : 'h-1'}`}>
        <div 
          className={`h-full bg-primary ${isMobile ? 'h-2' : 'h-1'}`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {/* Instruction info based on device type */}
      {controlsVisible && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-black/60 text-white text-sm px-4 py-2 rounded-full pointer-events-none">
          {isTouchDevice ? 
            "Swipe left/right to change poses" : 
            "Space: Play/Pause • Arrow Keys: Previous/Next • Esc: Exit"
          }
        </div>
      )}
    </div>
  );
}