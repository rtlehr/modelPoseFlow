import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PlaceholderScreenProps {
  title: string;
  description: string;
  onBack: () => void;
}

export default function PlaceholderScreen({ 
  title, 
  description, 
  onBack 
}: PlaceholderScreenProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {title}
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="flex flex-col items-center justify-center p-10 text-center">
        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mb-4">
          <span className="text-2xl text-gray-400">🔨</span>
        </div>
        <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
        <p className="text-gray-600 mb-4 max-w-md">
          {description}
        </p>
        <Button onClick={onBack}>
          Return to Main Menu
        </Button>
      </div>
    </div>
  );
}