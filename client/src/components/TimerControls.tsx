import { useIsMobile } from "@/hooks/use-mobile";
import { useTouchDevice } from "@/hooks/useTouchDevice";

interface TimerControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function TimerControls({ 
  isPlaying, 
  onPlayPause, 
  onNext, 
  onPrevious 
}: TimerControlsProps) {
  const isMobile = useIsMobile();
  const isTouchDevice = useTouchDevice();
  
  // Larger controls for mobile/touch devices
  const navButtonSize = isMobile ? 'p-4' : 'p-3';
  const navIconSize = isMobile ? 'h-7 w-7' : 'h-6 w-6';
  const playButtonSize = isMobile ? 'p-5' : 'p-4';
  const playIconSize = isMobile ? 'h-10 w-10' : 'h-8 w-8';
  const buttonSpacing = isMobile ? 'space-x-6' : 'space-x-4';
  
  // Active state for touch feedback
  const activeClass = isTouchDevice ? 'active:scale-95 active:opacity-90' : '';
  
  return (
    <div className={`flex justify-center items-center ${buttonSpacing} mb-4`}>
      <button 
        className={`bg-gray-200 hover:bg-gray-300 rounded-full ${navButtonSize} transition-all touch-manipulation ${activeClass}`}
        onClick={onPrevious}
        aria-label="Previous pose"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={`${navIconSize} text-gray-700`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <button 
        className={`${isPlaying ? 'bg-warning hover:bg-yellow-600' : 'bg-success hover:bg-green-600'} rounded-full ${playButtonSize} transition-all touch-manipulation ${activeClass}`}
        onClick={onPlayPause}
        aria-label={isPlaying ? "Pause timer" : "Start timer"}
      >
        {isPlaying ? (
          <svg xmlns="http://www.w3.org/2000/svg" className={`${playIconSize} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className={`${playIconSize} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>
      
      <button 
        className={`bg-gray-200 hover:bg-gray-300 rounded-full ${navButtonSize} transition-all touch-manipulation ${activeClass}`}
        onClick={onNext}
        aria-label="Next pose"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={`${navIconSize} text-gray-700`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
