import { useIsMobile } from "@/hooks/use-mobile";

interface PoseProgressProps {
  currentPoseIndex: number;
  totalPoses: number;
  keywords?: string[] | null;
  progress: number;
}

export default function PoseProgress({ 
  currentPoseIndex,
  totalPoses,
  keywords,
  progress 
}: PoseProgressProps) {
  const isMobile = useIsMobile();
  
  // Get the first keyword if available, or use a default label
  const primaryKeyword = keywords && keywords.length > 0 
    ? keywords[0].charAt(0).toUpperCase() + keywords[0].slice(1) 
    : "Pose";
  
  return (
    <div className={`${isMobile ? 'mb-3' : 'mb-4'}`}>
      <div className="flex justify-between items-center mb-1">
        <span className={`${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700`}>
          Pose {currentPoseIndex} of {totalPoses}
        </span>
        <span className={`${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700`}>
          {primaryKeyword}
        </span>
      </div>
      <div className={`w-full bg-gray-200 rounded-full ${isMobile ? 'h-3' : 'h-2.5'}`}>
        <div 
          className={`bg-secondary ${isMobile ? 'h-3' : 'h-2.5'} rounded-full`} 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}
