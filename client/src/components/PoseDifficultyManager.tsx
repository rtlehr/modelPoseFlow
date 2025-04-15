import { useState } from 'react';
import { Pose } from '@/types';
import { 
  analyzePoseDifficulty, 
  updatePoseDifficulty, 
  getDifficultyLabel,
  getDifficultyClass
} from '@/lib/difficultyService';
import { useToast } from '@/hooks/use-toast';

interface PoseDifficultyManagerProps {
  pose: Pose;
  onUpdate?: (updatedPose: Pose) => void;
}

export default function PoseDifficultyManager({ pose, onUpdate }: PoseDifficultyManagerProps) {
  const [loading, setLoading] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(pose.difficultyLevel || 2);
  const [reason, setReason] = useState<string>(pose.difficultyReason || '');
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const handleAnalyzeDifficulty = async () => {
    try {
      setLoading(true);
      
      // Call the OpenAI API to analyze the pose difficulty
      const updatedPose = await analyzePoseDifficulty(pose.id);
      
      // Update the UI state
      setSelectedDifficulty(updatedPose.difficultyLevel || 2);
      setReason(updatedPose.difficultyReason || '');
      
      // Notify the parent component
      if (onUpdate) {
        onUpdate(updatedPose);
      }
      
      toast({
        title: "Difficulty Analysis Complete",
        description: `This pose is rated as ${getDifficultyLabel(updatedPose.difficultyLevel)}.`,
      });
    } catch (error) {
      console.error('Error analyzing pose difficulty:', error);
      toast({
        title: "Analysis Failed",
        description: "There was an error analyzing the pose difficulty.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveManualDifficulty = async () => {
    try {
      setLoading(true);
      
      // Call the API to save the manual difficulty rating
      const updatedPose = await updatePoseDifficulty(pose.id, selectedDifficulty, reason);
      
      // Update the UI state
      setIsEditing(false);
      
      // Notify the parent component
      if (onUpdate) {
        onUpdate(updatedPose);
      }
      
      toast({
        title: "Difficulty Updated",
        description: `Pose difficulty set to ${getDifficultyLabel(selectedDifficulty)}.`,
      });
    } catch (error) {
      console.error('Error updating pose difficulty:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating the pose difficulty.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 mb-4">
      <h3 className="text-lg font-medium mb-2">Pose Difficulty</h3>
      
      {pose.difficultyLevel ? (
        <div className="mb-3">
          <div className="flex items-center mb-2">
            <div 
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getDifficultyClass(pose.difficultyLevel)}`}
            >
              {getDifficultyLabel(pose.difficultyLevel)}
            </div>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="ml-2 text-sm text-blue-500 hover:text-blue-700"
              type="button"
            >
              {isEditing ? "Cancel" : "Edit"}
            </button>
          </div>
          
          {pose.difficultyReason && (
            <p className="text-sm text-gray-600">{pose.difficultyReason}</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-600 mb-3">
          This pose hasn't been analyzed for difficulty yet.
        </p>
      )}
      
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty Level
            </label>
            <div className="flex space-x-3">
              {[1, 2, 3].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSelectedDifficulty(level)}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    selectedDifficulty === level
                      ? getDifficultyClass(level) + ' bg-gray-100'
                      : 'text-gray-500 border border-gray-300'
                  }`}
                >
                  {getDifficultyLabel(level)}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="Explain why this pose has this difficulty level"
            />
          </div>
          
          <button
            onClick={handleSaveManualDifficulty}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Difficulty"}
          </button>
        </div>
      ) : (
        <button
          onClick={handleAnalyzeDifficulty}
          disabled={loading}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze Difficulty with AI"}
        </button>
      )}
    </div>
  );
}