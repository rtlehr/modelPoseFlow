import { useState, useEffect } from "react";
import SetupScreen from "@/components/SetupScreen";
import TimerScreen from "@/components/TimerScreen";
import LoadingScreen from "@/components/LoadingScreen";
import MainMenu from "@/components/MainMenu";
import PlaceholderScreen from "@/components/PlaceholderScreen";
import PoseLibraryScreen from "@/components/PoseLibraryScreen";
import BlogListScreen from "@/components/BlogListScreen";
import BlogArticleScreen from "@/components/BlogArticleScreen";
import ModelingSessionScreen from "@/components/ModelingSessionScreen";
import HostListScreen from "@/components/HostListScreen";
import HostDetailScreen from "@/components/HostDetailScreen";
import HostFormScreen from "@/components/HostFormScreen";
import ModelingSessionFormScreen from "@/components/ModelingSessionFormScreen";
import ModelingSessionDetailScreen from "@/components/ModelingSessionDetailScreen";
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
  | 'blogArticle'
  | 'poseKeywords'
  | 'modelingSessions'
  | 'hostList'
  | 'hostDetail'
  | 'hostForm'
  | 'sessionForm'
  | 'sessionDetail';

export default function Home() {
  // Track which screen is currently displayed
  const [currentScreen, setCurrentScreen] = useState<Screen>('loading');
  const [sessionConfig, setSessionConfig] = useState<PoseSessionConfig | null>(null);
  const [currentArticleSlug, setCurrentArticleSlug] = useState<string>('');
  
  // State for modeling sessions feature
  const [currentHostId, setCurrentHostId] = useState<number | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [isEditingHost, setIsEditingHost] = useState<boolean>(false);
  const [isEditingSession, setIsEditingSession] = useState<boolean>(false);

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

  const handleSelectArticle = (slug: string) => {
    setCurrentArticleSlug(slug);
    setCurrentScreen('blogArticle');
  };

  const handleBackToBlogList = () => {
    setCurrentScreen('modelBlog');
  };
  
  // Modeling Sessions handlers
  const handleGoToModelingSessions = () => {
    setCurrentScreen('modelingSessions');
  };
  
  const handleGoToHostList = () => {
    setCurrentScreen('hostList');
  };
  
  const handleSelectHost = (hostId: number) => {
    setCurrentHostId(hostId);
    setCurrentScreen('hostDetail');
  };
  
  const handleAddHost = () => {
    setIsEditingHost(false);
    setCurrentHostId(null);
    setCurrentScreen('hostForm');
  };
  
  const handleEditHost = (hostId: number) => {
    setCurrentHostId(hostId);
    setIsEditingHost(true);
    setCurrentScreen('hostForm');
  };
  
  const handleHostSaved = (hostId: number) => {
    setCurrentHostId(hostId);
    setCurrentScreen('hostDetail');
  };
  
  const handleBackToHostList = () => {
    setCurrentScreen('hostList');
  };
  
  const handleBackToHostDetail = () => {
    setCurrentScreen('hostDetail');
  };
  
  const handleBackToModelingSessions = () => {
    setCurrentScreen('modelingSessions');
  };
  
  const handleSelectSession = (sessionId: number) => {
    setCurrentSessionId(sessionId);
    setCurrentScreen('sessionDetail');
  };
  
  const handleAddSession = (hostId?: number) => {
    setIsEditingSession(false);
    setCurrentHostId(hostId || null);
    setCurrentSessionId(null);
    setCurrentScreen('sessionForm');
  };
  
  const handleEditSession = (sessionId: number) => {
    setCurrentSessionId(sessionId);
    setIsEditingSession(true);
    setCurrentScreen('sessionForm');
  };
  
  const handleSessionSaved = (sessionId: number) => {
    setCurrentSessionId(sessionId);
    setCurrentScreen('sessionDetail');
  };
  
  const handleSessionDeleted = () => {
    if (currentHostId) {
      setCurrentScreen('hostDetail');
    } else {
      setCurrentScreen('modelingSessions');
    }
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
          <BlogListScreen
            onBack={handleBackToMainMenu}
            onSelectArticle={handleSelectArticle}
          />
        );
        
      case 'blogArticle':
        return (
          <BlogArticleScreen
            slug={currentArticleSlug}
            onBack={handleBackToBlogList}
          />
        );
        
      case 'poseKeywords':
        return (
          <PoseLibraryScreen 
            onBack={handleBackToMainMenu}
          />
        );
        
      case 'modelingSessions':
        return (
          <ModelingSessionScreen
            onBack={handleBackToMainMenu}
            onSelectSession={handleSelectSession}
            onGoToHostList={handleGoToHostList}
            onAddSession={handleAddSession}
          />
        );
        
      case 'hostList':
        return (
          <HostListScreen
            onBack={handleBackToModelingSessions}
            onSelectHost={handleSelectHost}
            onAddNewHost={handleAddHost}
            onEditHost={handleEditHost}
          />
        );
        
      case 'hostDetail':
        return (
          <HostDetailScreen
            hostId={currentHostId!}
            onBack={handleBackToHostList}
            onEditHost={handleEditHost}
            onSelectSession={handleSelectSession}
            onAddSession={(hostId) => handleAddSession(hostId)}
          />
        );
        
      case 'hostForm':
        return (
          <HostFormScreen
            hostId={isEditingHost ? currentHostId! : undefined}
            onBack={isEditingHost ? handleBackToHostDetail : handleBackToHostList}
            onSaved={handleHostSaved}
          />
        );
        
      case 'sessionForm':
        return (
          <ModelingSessionFormScreen
            sessionId={isEditingSession ? currentSessionId! : undefined}
            preselectedHostId={currentHostId || undefined}
            onBack={isEditingSession ? handleBackToHostDetail : (currentHostId ? handleBackToHostDetail : handleBackToModelingSessions)}
            onSaved={handleSessionSaved}
          />
        );
        
      case 'sessionDetail':
        return (
          <ModelingSessionDetailScreen
            sessionId={currentSessionId!}
            onBack={() => currentHostId ? handleBackToHostDetail() : handleBackToModelingSessions()}
            onEdit={handleEditSession}
            onDeleted={handleSessionDeleted}
            onSelectHost={handleViewHost}
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
