import { useState, useEffect, useRef, useCallback } from "react";

interface TimerHook {
  time: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: (newDuration?: number) => void;
  progress: number;
}

export default function useTimer(initialDuration: number): TimerHook {
  const [time, setTime] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  
  const duration = useRef(initialDuration);
  const timerRef = useRef<number | null>(null);
  
  const start = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true);
      
      const now = Date.now();
      
      if (pausedAt) {
        // If we were paused, adjust the start time to account for the pause
        if (startTime) {
          setStartTime(now - (pausedAt - startTime));
        }
        setPausedAt(null);
      } else {
        // Fresh start
        setStartTime(now);
      }
    }
  }, [isRunning, pausedAt, startTime]);
  
  const pause = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      if (startTime) {
        setPausedAt(Date.now());
      }
    }
  }, [isRunning, startTime]);
  
  const reset = useCallback((newDuration?: number) => {
    if (newDuration !== undefined) {
      duration.current = newDuration;
    }
    
    setTime(duration.current);
    setIsRunning(false);
    setStartTime(null);
    setPausedAt(null);
    
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);
  
  // Progress as a percentage from 0 to 100
  const progress = ((duration.current - time) / duration.current) * 100;
  
  useEffect(() => {
    if (isRunning && startTime) {
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const newTime = duration.current - elapsed;
        
        if (newTime <= 0) {
          setTime(0);
          setIsRunning(false);
          if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
          }
        } else {
          setTime(newTime);
        }
      }, 100); // Update more frequently for smoother countdown
    } else if (!isRunning && timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, startTime, duration]);
  
  return {
    time,
    isRunning,
    start,
    pause,
    reset,
    progress
  };
}
