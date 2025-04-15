import { useState, useEffect, useCallback } from "react";
import useTimer from "./useTimer";
import { getPosesForSession } from "@/lib/posesService";
import { Pose, PoseSessionConfig } from "@/types";

interface PoseSessionHook {
  currentPose: Pose | null;
  currentPoseIndex: number;
  totalPoses: number;
  remainingTime: number;
  progress: number;
  isPlaying: boolean;
  startTimer: () => void;
  pauseTimer: () => void;
  nextPose: () => void;
  previousPose: () => void;
  resetSession: () => void;
}

export default function usePoseSession(
  config: PoseSessionConfig,
  allPoses: Pose[]
): PoseSessionHook {
  // Get poses for this session
  const [sessionPoses, setSessionPoses] = useState<Pose[]>([]);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  
  // Set up timer
  const { time, isRunning, start, pause, reset, progress } = useTimer(config.poseLength);

  // Initialize session poses
  useEffect(() => {
    const poses = getPosesForSession(
      allPoses,
      config.categories,
      config.poseCount,
      true // Randomize poses
    );
    setSessionPoses(poses);
    setCurrentPoseIndex(0);
    reset(config.poseLength);
    start(); // Auto-start the first pose
  }, [config, allPoses, reset, start]);

  // Auto-advance to next pose when timer reaches 0
  useEffect(() => {
    if (time === 0 && sessionPoses.length > 0) {
      nextPose();
    }
  }, [time, sessionPoses.length]);

  const nextPose = useCallback(() => {
    if (currentPoseIndex < sessionPoses.length - 1) {
      setCurrentPoseIndex(prev => prev + 1);
      reset(config.poseLength);
      start();
    } else if (currentPoseIndex === sessionPoses.length - 1) {
      // End of session reached
      setCurrentPoseIndex(prev => prev + 1);
      pause();
    }
  }, [currentPoseIndex, sessionPoses.length, reset, start, pause, config.poseLength]);

  const previousPose = useCallback(() => {
    if (currentPoseIndex > 0) {
      setCurrentPoseIndex(prev => prev - 1);
      reset(config.poseLength);
      start();
    }
  }, [currentPoseIndex, reset, start, config.poseLength]);

  const resetSession = useCallback(() => {
    setCurrentPoseIndex(0);
    reset(config.poseLength);
    start();
  }, [reset, start, config.poseLength]);

  return {
    currentPose: currentPoseIndex < sessionPoses.length ? sessionPoses[currentPoseIndex] : null,
    currentPoseIndex,
    totalPoses: sessionPoses.length,
    remainingTime: time,
    progress: progress,
    isPlaying: isRunning,
    startTimer: start,
    pauseTimer: pause,
    nextPose,
    previousPose,
    resetSession
  };
}
