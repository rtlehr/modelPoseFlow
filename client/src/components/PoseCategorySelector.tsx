import { PoseCategory } from "@/types";

interface PoseCategorySelectorProps {
  selectedCategories: PoseCategory[];
  onChange: (categories: PoseCategory[]) => void;
}

export default function PoseCategorySelector({ selectedCategories, onChange }: PoseCategorySelectorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    const category = value as PoseCategory;
    
    if (checked) {
      onChange([...selectedCategories, category]);
    } else {
      onChange(selectedCategories.filter(c => c !== category));
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-gray-700">Pose Categories</h2>
      <p className="text-sm text-gray-500">Select at least one category of poses:</p>
      
      <div className="grid grid-cols-2 gap-3">
        <label className="checkbox-container flex items-center space-x-3 cursor-pointer">
          <div className="relative">
            <input 
              type="checkbox" 
              name="category" 
              value="standing" 
              className="sr-only" 
              checked={selectedCategories.includes("standing")}
              onChange={handleChange}
              disabled={selectedCategories.includes("random")}
            />
            <div className={`custom-checkbox w-5 h-5 border-2 ${selectedCategories.includes("random") ? 'border-gray-200 bg-gray-100' : 'border-gray-300'} rounded relative`}></div>
          </div>
          <span className={`${selectedCategories.includes("random") ? 'text-gray-400' : 'text-gray-700'}`}>Standing</span>
        </label>
        
        <label className="checkbox-container flex items-center space-x-3 cursor-pointer">
          <div className="relative">
            <input 
              type="checkbox" 
              name="category" 
              value="sitting" 
              className="sr-only" 
              checked={selectedCategories.includes("sitting")}
              onChange={handleChange}
              disabled={selectedCategories.includes("random")}
            />
            <div className={`custom-checkbox w-5 h-5 border-2 ${selectedCategories.includes("random") ? 'border-gray-200 bg-gray-100' : 'border-gray-300'} rounded relative`}></div>
          </div>
          <span className={`${selectedCategories.includes("random") ? 'text-gray-400' : 'text-gray-700'}`}>Sitting</span>
        </label>
        
        <label className="checkbox-container flex items-center space-x-3 cursor-pointer">
          <div className="relative">
            <input 
              type="checkbox" 
              name="category" 
              value="reclining" 
              className="sr-only" 
              checked={selectedCategories.includes("reclining")}
              onChange={handleChange}
              disabled={selectedCategories.includes("random")}
            />
            <div className={`custom-checkbox w-5 h-5 border-2 ${selectedCategories.includes("random") ? 'border-gray-200 bg-gray-100' : 'border-gray-300'} rounded relative`}></div>
          </div>
          <span className={`${selectedCategories.includes("random") ? 'text-gray-400' : 'text-gray-700'}`}>Reclining</span>
        </label>
        
        <label className="checkbox-container flex items-center space-x-3 cursor-pointer">
          <div className="relative">
            <input 
              type="checkbox" 
              name="category" 
              value="action" 
              className="sr-only" 
              checked={selectedCategories.includes("action")}
              onChange={handleChange}
              disabled={selectedCategories.includes("random")}
            />
            <div className={`custom-checkbox w-5 h-5 border-2 ${selectedCategories.includes("random") ? 'border-gray-200 bg-gray-100' : 'border-gray-300'} rounded relative`}></div>
          </div>
          <span className={`${selectedCategories.includes("random") ? 'text-gray-400' : 'text-gray-700'}`}>Action</span>
        </label>
      </div>
      
      <div className="mt-3 border-t pt-3">
        <label className="checkbox-container flex items-center space-x-3 cursor-pointer">
          <div className="relative">
            <input 
              type="checkbox" 
              name="category" 
              value="random" 
              className="sr-only" 
              checked={selectedCategories.includes("random")}
              onChange={(e) => {
                const { checked } = e.target;
                if (checked) {
                  // If random is selected, clear all other selections and just set random
                  onChange(["random"]);
                } else {
                  // If random is unselected, default to all categories
                  onChange(["standing", "sitting", "reclining", "action"]);
                }
              }}
            />
            <div className="custom-checkbox w-5 h-5 border-2 border-primary rounded relative"></div>
          </div>
          <span className="text-primary font-medium">Random (all categories)</span>
        </label>
      </div>
    </div>
  );
}
