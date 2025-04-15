import { PoseCategory } from "@/types";

interface PoseProgressProps {
  currentPoseIndex: number;
  totalPoses: number;
  poseCategory: PoseCategory;
  progress: number;
}

export default function PoseProgress({ 
  currentPoseIndex,
  totalPoses,
  poseCategory,
  progress 
}: PoseProgressProps) {
  // Format the category name for display (capitalize first letter)
  const formattedCategory = poseCategory.charAt(0).toUpperCase() + poseCategory.slice(1);
  
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">
          Pose {currentPoseIndex} of {totalPoses}
        </span>
        <span className="text-sm font-medium text-gray-700">
          {formattedCategory}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-secondary h-2.5 rounded-full" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}
