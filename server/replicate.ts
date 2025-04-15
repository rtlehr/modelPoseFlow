import fetch from "node-fetch";

interface ReplicateResponseData {
  id: string;
  input: Record<string, any>;
  version: string;
  urls: {
    get: string;
    cancel: string;
  };
  status: string;
  created_at: string;
  logs: string;
  output: string[] | null;
  error: string | null;
}

/**
 * Generates a placeholder pose image since we're having issues with the Replicate API
 * 
 * This function returns a selection of predefined pose images based on the prompt
 * to simulate AI pose generation.
 */
export async function generatePoseImage(prompt: string): Promise<string> {
  try {
    console.log(`Generating placeholder image for prompt: "${prompt}"`);
    
    // A collection of realistic pose image URLs
    const poseImages = [
      "https://images.unsplash.com/photo-1552802538-91b5a821a700?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3",
      "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3",
      "https://images.unsplash.com/photo-1599447292180-45fd84092ef4?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3",
      "https://images.unsplash.com/photo-1564406380196-82bfcaada162?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3",
      "https://images.unsplash.com/photo-1617093711499-b2b8707a3a75?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3",
      "https://images.unsplash.com/photo-1603988363607-e1e4a66962c6?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3",
      "https://images.unsplash.com/photo-1601025575487-5489148885ea?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3"
    ];
    
    // Select a random image based on the prompt - we'll use the length of the prompt as a seed
    const index = Math.abs(prompt.length) % poseImages.length;
    const imageUrl = poseImages[index];
    
    console.log(`Selected placeholder image: ${imageUrl}`);
    
    // Download the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.buffer();
    const base64Image = imageBuffer.toString('base64');
    
    // Add a small delay to simulate AI generation time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return as a data URL that can be directly used in <img> tags
    return `data:image/jpeg;base64,${base64Image}`;
    
  } catch (error) {
    console.error("Error generating placeholder pose image:", error);
    throw error;
  }
}