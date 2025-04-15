import { useState, useEffect } from "react";
import PoseProgress from "./PoseProgress";
import PoseDisplay from "./PoseDisplay";
import TimerControls from "./TimerControls";
import FullscreenModeToggle from "./FullscreenModeToggle";
import FullscreenTimerScreen from "./FullscreenTimerScreen";
import { Pose, PoseSessionConfig } from "@/types";
import usePoseSession from "@/hooks/usePoseSession";
import { useIsMobile } from "@/hooks/use-mobile";

interface TimerScreenProps {
  onBackToSetup: () => void;
  sessionConfig: PoseSessionConfig;
  poses: Pose[];
}

export default function TimerScreen({ onBackToSetup, sessionConfig, poses }: TimerScreenProps) {
  // Always declare all hooks at the top level, unconditionally
  const isMobile = useIsMobile();
  const [isFullscreen, setIsFullscreen] = useState(false);
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
    previousPose,
    resetSession
  } = usePoseSession(sessionConfig, poses);

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      // Request full screen for the document or body
      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        (element as any).mozRequestFullScreen();
      } else if ((element as any).webkitRequestFullscreen) {
        (element as any).webkitRequestFullscreen();
      } else if ((element as any).msRequestFullscreen) {
        (element as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Auto-start timer when component mounts
  useEffect(() => {
    // Start timer with a slight delay to ensure everything is ready
    const timerId = setTimeout(() => {
      startTimer();
    }, 500);
    
    return () => clearTimeout(timerId);
  }, [startTimer]);

  // Handle session completion
  useEffect(() => {
    if (currentPoseIndex >= totalPoses) {
      resetSession();
    }
  }, [currentPoseIndex, totalPoses, resetSession]);

  // Listen for fullscreen change events (e.g., when user presses ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      
      setIsFullscreen(isCurrentlyFullscreen);
    };
    
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  // Conditionally render different UI based on fullscreen state
  if (isFullscreen) {
    return (
      <FullscreenTimerScreen
        sessionConfig={sessionConfig}
        poses={poses}
        onExitFullscreen={toggleFullscreen}
      />
    );
  }

  // Render the regular UI if not in fullscreen mode
  return (
    <div className={`bg-white rounded-xl shadow-lg ${isMobile ? 'p-4' : 'p-6'} max-w-4xl mx-auto`}>
      <div className={`flex justify-between items-center ${isMobile ? 'mb-3' : 'mb-4'}`}>
        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-800`}>
          {isMobile ? 'Pose Timer' : 'Figure Model Pose Timer'}
        </h1>
        <div className="flex items-center space-x-2">
          <FullscreenModeToggle 
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
          />
          <button 
            className="text-gray-600 hover:text-gray-800 touch-manipulation"
            onClick={onBackToSetup}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`${isMobile ? 'h-7 w-7' : 'h-6 w-6'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      {currentPose && (
        <>
          <PoseProgress 
            currentPoseIndex={currentPoseIndex + 1} 
            totalPoses={totalPoses} 
            keywords={currentPose.keywords}
            progress={progress}
          />
          
          <PoseDisplay 
            imageUrl={currentPose.url} 
            remainingTime={remainingTime} 
            totalTime={sessionConfig.poseLength}
          />
          
          <TimerControls 
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onNext={nextPose}
            onPrevious={previousPose}
          />
        </>
      )}
    </div>
  );
}
