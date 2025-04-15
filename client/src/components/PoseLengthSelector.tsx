import { useIsMobile } from "@/hooks/use-mobile";

interface PoseLengthSelectorProps {
  poseLength: number;
  onChange: (length: number) => void;
}

export default function PoseLengthSelector({ poseLength, onChange }: PoseLengthSelectorProps) {
  const isMobile = useIsMobile();
  
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
      <h2 className={`${isMobile ? 'text-xl' : 'text-lg'} font-semibold text-gray-700`}>Pose Length</h2>
      <div className="flex items-center">
        <input 
          type="number" 
          id="pose-length" 
          value={poseLength} 
          min="5" 
          max="1800" 
          className={`${isMobile ? 'w-28 p-3 text-lg' : 'w-24 p-2'} rounded-md border-gray-300 shadow-sm mr-2 text-center border`}
          onChange={handleInputChange}
          style={{ 
            // Remove spinner buttons on number input for cleaner mobile look
            WebkitAppearance: 'none',
            MozAppearance: 'textfield'
          }}
        />
        <span className={`text-gray-700 ${isMobile ? 'text-base' : ''}`}>seconds per pose</span>
      </div>
      
      <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-4 gap-2'}`}>
        <button 
          type="button" 
          className={`bg-gray-200 hover:bg-gray-300 rounded transition-colors
            ${isMobile ? 'py-3 text-base active:scale-[0.98] touch-manipulation' : 'py-1 text-sm'}`}
          onClick={() => handleQuickSelectClick(30)}
        >
          30s
        </button>
        <button 
          type="button" 
          className={`bg-gray-200 hover:bg-gray-300 rounded transition-colors
            ${isMobile ? 'py-3 text-base active:scale-[0.98] touch-manipulation' : 'py-1 text-sm'}`}
          onClick={() => handleQuickSelectClick(60)}
        >
          1m
        </button>
        <button 
          type="button" 
          className={`bg-gray-200 hover:bg-gray-300 rounded transition-colors
            ${isMobile ? 'py-3 text-base active:scale-[0.98] touch-manipulation' : 'py-1 text-sm'}`}
          onClick={() => handleQuickSelectClick(300)}
        >
          5m
        </button>
        <button 
          type="button" 
          className={`bg-gray-200 hover:bg-gray-300 rounded transition-colors
            ${isMobile ? 'py-3 text-base active:scale-[0.98] touch-manipulation' : 'py-1 text-sm'}`}
          onClick={() => handleQuickSelectClick(600)}
        >
          10m
        </button>
      </div>
    </div>
  );
}
