interface PoseLengthSelectorProps {
  poseLength: number;
  onChange: (length: number) => void;
}

export default function PoseLengthSelector({ poseLength, onChange }: PoseLengthSelectorProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 5 && value <= 1800) {
      onChange(value);
    }
  };

  const handleQuickSelectClick = (value: number) => {
    onChange(value);
  };

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-gray-700">Pose Length</h2>
      <div className="flex items-center">
        <input 
          type="number" 
          id="pose-length" 
          value={poseLength} 
          min="5" 
          max="1800" 
          className="w-24 rounded-md border-gray-300 shadow-sm p-2 mr-2 text-center border"
          onChange={handleInputChange}
        />
        <span className="text-gray-700">seconds per pose</span>
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        <button 
          type="button" 
          className="bg-gray-200 hover:bg-gray-300 rounded py-1 text-sm transition-colors"
          onClick={() => handleQuickSelectClick(30)}
        >
          30s
        </button>
        <button 
          type="button" 
          className="bg-gray-200 hover:bg-gray-300 rounded py-1 text-sm transition-colors"
          onClick={() => handleQuickSelectClick(60)}
        >
          1m
        </button>
        <button 
          type="button" 
          className="bg-gray-200 hover:bg-gray-300 rounded py-1 text-sm transition-colors"
          onClick={() => handleQuickSelectClick(300)}
        >
          5m
        </button>
        <button 
          type="button" 
          className="bg-gray-200 hover:bg-gray-300 rounded py-1 text-sm transition-colors"
          onClick={() => handleQuickSelectClick(600)}
        >
          10m
        </button>
      </div>
    </div>
  );
}
