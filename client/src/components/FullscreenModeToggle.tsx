import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface FullscreenModeToggleProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export default function FullscreenModeToggle({ 
  isFullscreen, 
  onToggleFullscreen 
}: FullscreenModeToggleProps) {
  // Track if fullscreen is actually supported
  const [isFullscreenSupported, setIsFullscreenSupported] = useState(false);

  useEffect(() => {
    // Check if fullscreen API is supported in this browser
    const fullscreenEnabled = 
      document.fullscreenEnabled || 
      (document as any).webkitFullscreenEnabled || 
      (document as any).mozFullScreenEnabled || 
      (document as any).msFullscreenEnabled;
    
    setIsFullscreenSupported(!!fullscreenEnabled);
  }, []);

  if (!isFullscreenSupported) {
    return null; // Don't render anything if fullscreen isn't supported
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="flex items-center justify-center"
      onClick={onToggleFullscreen}
      title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
    >
      {isFullscreen ? (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" 
          />
        </svg>
      ) : (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" 
          />
        </svg>
      )}
    </Button>
  );
}