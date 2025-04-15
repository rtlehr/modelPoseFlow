import { useState, useEffect } from "react";

export function useTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  useEffect(() => {
    // Detect if device supports touch events
    const detectTouch = () => {
      if (('ontouchstart' in window) ||
          (navigator.maxTouchPoints > 0) ||
          ((navigator as any).msMaxTouchPoints > 0)) {
        setIsTouchDevice(true);
      }
    };
    
    detectTouch();
    
    // Listen for changes in device capabilities (e.g., desktop browser resizing to mobile emulation)
    window.addEventListener('touchstart', () => setIsTouchDevice(true), { once: true });
    
    return () => {
      window.removeEventListener('touchstart', () => setIsTouchDevice(true));
    };
  }, []);
  
  return isTouchDevice;
}