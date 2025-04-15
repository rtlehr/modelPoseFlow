import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  
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

  const inputSize = isMobile ? 'w-20 p-2 text-base' : 'w-16 p-1';
  const radioSize = isMobile ? 'h-5 w-5' : 'h-4 w-4';
  const labelSpacing = isMobile ? 'ml-3' : 'ml-2';
  const marginBottom = isMobile ? 'mb-4' : 'mb-3';

  return (
    <div className="space-y-3">
      <h2 className={`${isMobile ? 'text-xl' : 'text-lg'} font-semibold text-gray-700`}>Session Configuration</h2>
      
      <div>
        <label className={`flex ${isMobile ? 'flex-wrap' : 'items-center'} ${marginBottom}`}>
          <div className={`flex items-center ${isMobile ? 'w-full mb-2' : ''}`}>
            <input 
              type="radio" 
              name="sessionType" 
              value="count" 
              checked={sessionType === "count"}
              onChange={handleSessionTypeChange}
              className={`${radioSize} text-primary focus:ring-primary border-gray-300`}
            />
            <span className={`${labelSpacing} text-gray-700 ${isMobile ? 'text-base' : ''}`}>
              Number of poses:
            </span>
          </div>
          <div className={`flex items-center ${isMobile ? 'ml-8' : ''}`}>
            <input 
              type="number" 
              id="pose-count" 
              value={poseCount} 
              min="1" 
              max="100" 
              disabled={sessionType !== "count"}
              onChange={handlePoseCountChange}
              className={`${isMobile ? 'ml-0' : 'ml-2'} ${inputSize} rounded-md border-gray-300 shadow-sm text-center border`}
              style={{ 
                WebkitAppearance: 'none',
                MozAppearance: 'textfield'
              }}
            />
          </div>
        </label>
        
        <label className={`flex ${isMobile ? 'flex-wrap' : 'items-center'}`}>
          <div className={`flex items-center ${isMobile ? 'w-full mb-2' : ''}`}>
            <input 
              type="radio" 
              name="sessionType" 
              value="time" 
              checked={sessionType === "time"}
              onChange={handleSessionTypeChange}
              className={`${radioSize} text-primary focus:ring-primary border-gray-300`}
            />
            <span className={`${labelSpacing} text-gray-700 ${isMobile ? 'text-base' : ''}`}>
              Total session time:
            </span>
          </div>
          <div className={`flex items-center ${isMobile ? 'ml-8' : ''}`}>
            <input 
              type="number" 
              id="session-time" 
              value={sessionTime} 
              min="1" 
              max="360" 
              disabled={sessionType !== "time"}
              onChange={handleSessionTimeChange}
              className={`${isMobile ? 'ml-0' : 'ml-2'} ${inputSize} rounded-md border-gray-300 shadow-sm text-center border`}
              style={{ 
                WebkitAppearance: 'none',
                MozAppearance: 'textfield'
              }}
            />
            <span className={`ml-1 text-gray-700 ${isMobile ? 'text-base' : ''}`}>minutes</span>
          </div>
        </label>
      </div>
    </div>
  );
}
