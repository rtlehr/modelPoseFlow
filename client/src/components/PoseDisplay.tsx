import { formatTime } from "@/lib/timerService";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTouchDevice } from "@/hooks/useTouchDevice";
import { useState, useEffect } from "react";

interface PoseDisplayProps {
  imageUrl: string;
  remainingTime: number;
  totalTime: number;
}

export default function PoseDisplay({ imageUrl, remainingTime, totalTime }: PoseDisplayProps) {
  const isMobile = useIsMobile();
  const isTouchDevice = useTouchDevice();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  // Calculate the timer progress percentage
  const timerProgress = (remainingTime / totalTime) * 100;
  
  // Reset image loaded state when pose changes
  useEffect(() => {
    setIsImageLoaded(false);
  }, [imageUrl]);
  
  return (
    <div className={`${isMobile ? 'mb-4' : 'mb-6'} mx-auto max-w-md`}>
      <div className="pose-image-container bg-gray-200 rounded-lg overflow-hidden mb-3 relative">
        {!isImageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
        <img 
          src={imageUrl} 
          alt="Figure pose" 
          className={`w-full h-full object-contain pointer-events-none select-none ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
          draggable="false"
          onLoad={() => setIsImageLoaded(true)}
          style={{ transition: 'opacity 0.3s ease-in-out' }}
        />
      </div>
      
      <div className="text-center">
        <div className={`${isMobile ? 'text-7xl' : 'text-6xl'} font-bold text-gray-800 mb-2 font-mono`}>
          {formatTime(remainingTime)}
        </div>
        <div className={`w-full bg-gray-200 rounded-full ${isMobile ? 'h-3' : 'h-2'} mb-2`}>
          <div 
            className={`bg-success ${isMobile ? 'h-3' : 'h-2'} rounded-full`} 
            style={{ 
              width: `${timerProgress}%`,
              transition: 'width 0.2s linear'
            }}
          ></div>
        </div>
        {isTouchDevice && isMobile && (
          <div className="text-xs text-gray-500 mt-1">
            Tap to show/hide controls
          </div>
        )}
      </div>
    </div>
  );
}
