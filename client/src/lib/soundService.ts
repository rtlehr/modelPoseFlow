/**
 * Sound service for the timer
 * - Plays a beep when there are 5 seconds left
 * - Plays a beep for each second after (4, 3, 2, 1)
 * - Plays a double-beep when the pose changes
 */

// Define the beep sound context and oscillator
let audioContext: AudioContext | null = null;

// Create and play a beep sound
export function playBeep(frequency: number = 800, duration: number = 200, volume: number = 0.5): void {
  try {
    // Initialize audio context on first use (must be triggered by user interaction)
    if (!audioContext) {
      audioContext = new AudioContext();
    }
    
    // Create oscillator
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    // Create gain node for volume control
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Start and stop the oscillator
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration / 1000);
  } catch (error) {
    console.error('Error playing beep sound:', error);
  }
}

// Play a double beep (for pose change)
export function playDoubleBeep(): void {
  playBeep(800, 150, 0.5);
  
  // Schedule second beep after a small delay
  setTimeout(() => {
    playBeep(1000, 150, 0.5);
  }, 200);
}

// Play countdown beep (for 5 seconds and less)
export function playCountdownBeep(): void {
  playBeep(700, 150, 0.3);
}