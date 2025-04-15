import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

interface LoadingScreenProps {
  onBegin: () => void;
}

export default function LoadingScreen({ onBegin }: LoadingScreenProps) {
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulate loading process
  useState(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  });
  
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-indigo-900 to-black">
      {/* Background image */}
      <div 
        className="absolute inset-0 z-0 bg-center bg-cover opacity-30"
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1534330207526-8e81f10ec6fc?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1950&q=80')" 
        }}
      ></div>
      
      {/* Content overlay */}
      <div className="z-10 flex flex-col items-center justify-center px-6 text-center">
        <h1 className={`font-bold text-white mb-4 ${isMobile ? 'text-4xl' : 'text-6xl'}`}>
          <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Figure Model
          </span>
          <br />
          <span className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Pose Timer
          </span>
        </h1>
        
        <p className={`text-gray-300 mb-8 max-w-md ${isMobile ? 'text-sm' : 'text-base'}`}>
          The perfect tool for artists to practice figure drawing with customizable pose timers and categories
        </p>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-300 text-sm">Loading resources...</p>
          </div>
        ) : (
          <Button 
            size={isMobile ? "default" : "lg"}
            onClick={onBegin}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Begin
          </Button>
        )}
      </div>
      
      {/* App version */}
      <div className="absolute bottom-4 right-4 text-gray-500 text-xs">
        v1.0.0
      </div>
    </div>
  );
}