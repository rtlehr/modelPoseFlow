import { useState, useEffect } from "react";
import SetupScreen from "@/components/SetupScreen";
import TimerScreen from "@/components/TimerScreen";
import LoadingScreen from "@/components/LoadingScreen";
import MainMenu from "@/components/MainMenu";
import PlaceholderScreen from "@/components/PlaceholderScreen";
import PoseLibraryScreen from "@/components/PoseLibraryScreen";
import { PoseSessionConfig, Pose } from "@/types";
import { useQuery } from "@tanstack/react-query";

// Define the screens we can show
type Screen = 
  | 'loading'
  | 'mainMenu'
  | 'setup'
  | 'timer'
  | 'poseCatalog'
  | 'userPreferences'
  | 'modelBlog'
  | 'poseKeywords';

export default function Home() {
  // Track which screen is currently displayed
  const [currentScreen, setCurrentScreen] = useState<Screen>('loading');
  const [sessionConfig, setSessionConfig] = useState<PoseSessionConfig | null>(null);

  // Fetch poses from the API
  const { data: poses = [] as Pose[] } = useQuery<Pose[]>({
    queryKey: ['/api/poses'],
  });

  // Simulating initial app loading
  useEffect(() => {
    // Data is already loading through React Query
    // This is just to ensure the loading screen is shown for a minimum time
    const timer = setTimeout(() => {
      if (currentScreen === 'loading') {
        setCurrentScreen('mainMenu');
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [currentScreen]);

  // Handler functions for navigation
  const handleBeginApp = () => {
    setCurrentScreen('mainMenu');
  };
  
  const handleGoToSetupScreen = () => {
    setCurrentScreen('setup');
  };
  
  const handleGoToMainMenu = () => {
    setCurrentScreen('mainMenu');
  };
  
  const handleStartSession = (config: PoseSessionConfig) => {
    setSessionConfig(config);
    setCurrentScreen('timer');
  };
  
  const handleBackToMainMenu = () => {
    setCurrentScreen('mainMenu');
  };

  const handleGoToPoseCatalog = () => {
    setCurrentScreen('poseCatalog');
  };
  
  const handleGoToUserPreferences = () => {
    setCurrentScreen('userPreferences');
  };
  
  const handleGoToModelBlog = () => {
    setCurrentScreen('modelBlog');
  };
  

  
  const handleGoToPoseKeywords = () => {
    setCurrentScreen('poseKeywords');
  };

  // Render different components based on the current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'loading':
        return <LoadingScreen onBegin={handleBeginApp} />;
        
      case 'mainMenu':
        return (
          <MainMenu 
            onStartSession={handleGoToSetupScreen}
            onPoseCatalog={handleGoToPoseCatalog}
            onUserPreferences={handleGoToUserPreferences}
            onModelBlog={handleGoToModelBlog}
            onPoseKeywords={handleGoToPoseKeywords}
          />
        );
        
      case 'setup':
        return (
          <div className="container mx-auto px-4 py-8 max-w-md">
            <SetupScreen 
              onStartSession={handleStartSession} 
              poses={poses} 
              onBack={handleBackToMainMenu}
            />
          </div>
        );
        
      case 'timer':
        return (
          <div className="container mx-auto px-4 py-8 max-w-md">
            <TimerScreen 
              onBackToSetup={handleGoToSetupScreen} 
              sessionConfig={sessionConfig!} 
              poses={poses} 
            />
          </div>
        );
        
      case 'poseCatalog':
        return (
          <div className="container mx-auto px-4 py-8">
            <PlaceholderScreen
              title="Pose Catalog"
              description="This feature will allow you to browse and download additional poses for your drawing sessions."
              onBack={handleBackToMainMenu}
            />
          </div>
        );
        
      case 'userPreferences':
        return (
          <div className="container mx-auto px-4 py-8">
            <PlaceholderScreen
              title="User Preferences"
              description="This feature will allow you to customize your app settings and session defaults."
              onBack={handleBackToMainMenu}
            />
          </div>
        );
        
      case 'modelBlog':
        return (
          <div className="container mx-auto px-4 py-8">
            <PlaceholderScreen
              title="Model Blog"
              description="This feature will provide articles and resources about modeling and figure drawing techniques."
              onBack={handleBackToMainMenu}
            />
          </div>
        );
        
      case 'musicPlaylist':
        return (
          <MusicPlaylistScreen 
            onBack={handleBackToMainMenu}
          />
        );
        
      case 'poseKeywords':
        return (
          <PoseLibraryScreen 
            onBack={handleBackToMainMenu}
          />
        );
        
      default:
        return <LoadingScreen onBegin={handleBeginApp} />;
    }
  };

  return (
    <>
      {renderScreen()}
    </>
  );
}
