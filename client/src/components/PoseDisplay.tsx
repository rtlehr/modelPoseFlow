import { formatTime } from "@/lib/timerService";
import { useIsMobile } from "@/hooks/use-mobile";

interface PoseDisplayProps {
  imageUrl: string;
  remainingTime: number;
  totalTime: number;
}

export default function PoseDisplay({ imageUrl, remainingTime, totalTime }: PoseDisplayProps) {
  const isMobile = useIsMobile();
  
  // Calculate the timer progress percentage
  const timerProgress = (remainingTime / totalTime) * 100;
  
  return (
    <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
      <div className="pose-image-container bg-gray-200 rounded-lg overflow-hidden mb-3">
        <img 
          src={imageUrl} 
          alt="Figure pose" 
          className="w-full h-full object-contain pointer-events-none select-none"
          draggable="false"
        />
      </div>
      
      <div className="text-center">
        <div className={`${isMobile ? 'text-6xl' : 'text-5xl'} font-bold text-gray-800 mb-2`}>
          {formatTime(remainingTime)}
        </div>
        <div className={`w-full bg-gray-200 rounded-full ${isMobile ? 'h-2' : 'h-1.5'} mb-1`}>
          <div 
            className={`bg-success ${isMobile ? 'h-2' : 'h-1.5'} rounded-full animate-progress`} 
            style={{ width: `${timerProgress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
