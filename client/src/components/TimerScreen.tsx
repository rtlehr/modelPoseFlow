import { useState, useEffect } from "react";
import PoseProgress from "./PoseProgress";
import PoseDisplay from "./PoseDisplay";
import TimerControls from "./TimerControls";
import MusicPlayer from "./MusicPlayer";
import { Pose, PoseSessionConfig } from "@/types";
import usePoseSession from "@/hooks/usePoseSession";

interface TimerScreenProps {
  onBackToSetup: () => void;
  sessionConfig: PoseSessionConfig;
  poses: Pose[];
}

export default function TimerScreen({ onBackToSetup, sessionConfig, poses }: TimerScreenProps) {
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

  // Handle session completion
  useEffect(() => {
    if (currentPoseIndex >= totalPoses) {
      resetSession();
    }
  }, [currentPoseIndex, totalPoses, resetSession]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Figure Model Pose Timer</h1>
        <button 
          className="text-gray-600 hover:text-gray-800"
          onClick={onBackToSetup}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {currentPose && (
        <>
          <PoseProgress 
            currentPoseIndex={currentPoseIndex + 1} 
            totalPoses={totalPoses} 
            poseCategory={currentPose.category}
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
          
          <MusicPlayer isSessionPlaying={isPlaying} />
        </>
      )}
    </div>
  );
}
