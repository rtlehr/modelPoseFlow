import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowRight, Palette, Book, Settings, Music, Tag } from "lucide-react";

interface MainMenuProps {
  onStartSession: () => void;
  onPoseCatalog: () => void;
  onUserPreferences: () => void;
  onModelBlog: () => void;
  onMusicPlaylist: () => void;
  onPoseKeywords?: () => void;
}

export default function MainMenu({ 
  onStartSession, 
  onPoseCatalog, 
  onUserPreferences, 
  onModelBlog,
  onMusicPlaylist,
  onPoseKeywords
}: MainMenuProps) {
  const isMobile = useIsMobile();
  
  const menuItems = [
    {
      title: "Begin Session",
      description: "Start a new figure drawing session with customizable settings",
      icon: <ArrowRight className="w-5 h-5" />,
      onClick: onStartSession,
      primary: true
    },
    {
      title: "Music Playlists",
      description: "Create and manage music playlists for your drawing sessions",
      icon: <Music className="w-5 h-5" />,
      onClick: onMusicPlaylist,
      primary: false
    },
    {
      title: "Pose Keywords",
      description: "Manage keywords for poses to improve pose matching",
      icon: <Tag className="w-5 h-5" />,
      onClick: onPoseKeywords,
      primary: false
    },
    {
      title: "Pose Catalog",
      description: "Browse and download new poses for your sessions",
      icon: <Palette className="w-5 h-5" />,
      onClick: onPoseCatalog,
      primary: false
    },
    {
      title: "User Preferences",
      description: "Customize your app settings and session defaults",
      icon: <Settings className="w-5 h-5" />,
      onClick: onUserPreferences,
      primary: false
    },
    {
      title: "Model Blog",
      description: "Read articles about modeling and figure drawing techniques",
      icon: <Book className="w-5 h-5" />,
      onClick: onModelBlog,
      primary: false
    }
  ];
  
  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-indigo-900 to-black overflow-auto">
      {/* Background image */}
      <div 
        className="absolute inset-0 z-0 bg-center bg-cover opacity-20"
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')" 
        }}
      ></div>
      
      {/* Content overlay */}
      <div className="z-10 flex flex-col items-center justify-center min-h-screen px-6 py-16">
        <div className="w-full max-w-md">
          <h1 className={`font-bold text-white text-center mb-8 ${isMobile ? 'text-3xl' : 'text-4xl'}`}>
            <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Figure Model Pose Timer
            </span>
          </h1>
          
          <div className="space-y-4">
            {menuItems.map((item, index) => (
              <Button
                key={index}
                onClick={item.onClick}
                variant={item.primary ? "default" : "outline"}
                size={isMobile ? "default" : "lg"}
                className={`w-full justify-start text-left transition-all duration-300 ${
                  item.primary 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white'
                    : 'border-white/20 hover:border-white/40 text-white bg-black/40 hover:bg-black/50'
                }`}
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-full mr-3 ${item.primary ? 'bg-white/20' : 'bg-white/10'}`}>
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-semibold">{item.title}</div>
                    <div className={`text-xs ${item.primary ? 'text-white/80' : 'text-white/60'}`}>
                      {item.description}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-4 w-full text-center text-gray-500 text-xs">
        &copy; {new Date().getFullYear()} Figure Model Pose Timer | v1.0.0
      </div>
    </div>
  );
}