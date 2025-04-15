interface SessionConfigSelectorProps {
  sessionType: "count" | "time";
  poseCount: number;
  sessionTime: number;
  onSessionTypeChange: (type: "count" | "time") => void;
  onPoseCountChange: (count: number) => void;
  onSessionTimeChange: (time: number) => void;
}

export default function SessionConfigSelector({
  sessionType,
  poseCount,
  sessionTime,
  onSessionTypeChange,
  onPoseCountChange,
  onSessionTimeChange
}: SessionConfigSelectorProps) {
  const handleSessionTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSessionTypeChange(e.target.value as "count" | "time");
  };

  const handlePoseCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= 100) {
      onPoseCountChange(value);
    }
  };

  const handleSessionTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= 360) {
      onSessionTimeChange(value);
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-gray-700">Session Configuration</h2>
      
      <div>
        <label className="flex items-center mb-3">
          <input 
            type="radio" 
            name="sessionType" 
            value="count" 
            checked={sessionType === "count"}
            onChange={handleSessionTypeChange}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
          />
          <span className="ml-2 text-gray-700">Number of poses:</span>
          <input 
            type="number" 
            id="pose-count" 
            value={poseCount} 
            min="1" 
            max="100" 
            disabled={sessionType !== "count"}
            onChange={handlePoseCountChange}
            className="ml-2 w-16 rounded-md border-gray-300 shadow-sm p-1 text-center border"
          />
        </label>
        
        <label className="flex items-center">
          <input 
            type="radio" 
            name="sessionType" 
            value="time" 
            checked={sessionType === "time"}
            onChange={handleSessionTypeChange}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
          />
          <span className="ml-2 text-gray-700">Total session time:</span>
          <input 
            type="number" 
            id="session-time" 
            value={sessionTime} 
            min="1" 
            max="360" 
            disabled={sessionType !== "time"}
            onChange={handleSessionTimeChange}
            className="ml-2 w-16 rounded-md border-gray-300 shadow-sm p-1 text-center border"
          />
          <span className="ml-1 text-gray-700">minutes</span>
        </label>
      </div>
    </div>
  );
}
