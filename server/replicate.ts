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
 * Generates a pose image using Replicate's ControlNet + OpenPose API
 */
export async function generatePoseImage(prompt: string): Promise<string> {
  try {
    // Use a publicly available ControlNet + OpenPose model
    // This model generates images from text prompts using pose guidance
    const modelVersion = "fofr/controlnet-pose:595428899eab15fb4fa43d0ffee78662a216ccb3bf7fcc1ffa7f7b3331b699e1";
    
    // Initial API call to start the prediction
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: modelVersion,
        input: {
          prompt,
          width: 512,
          height: 768, // Portrait orientation for figure poses
          num_inference_steps: 25, // Balance between quality and speed
          negative_prompt: "disfigured, deformed, low quality, bad anatomy", // Avoid common issues
          guidance_scale: 7.5, // Standard guidance scale
          controlnet_scale: 1.0,
          pose_type: "openpose",  // Use OpenPose model
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Replicate API request failed: ${errorText}`);
    }

    const prediction = await response.json() as ReplicateResponseData;
    
    // Poll for the result
    const maxAttempts = 30; // About 5 minutes at 10-second intervals
    const pollingInterval = 10000; // 10 seconds
    
    let attempts = 0;
    let result: ReplicateResponseData | null = null;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      // Wait before polling
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
      
      // Poll for the result
      const pollResponse = await fetch(prediction.urls.get, {
        headers: {
          "Authorization": `Token ${process.env.REPLICATE_API_KEY}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!pollResponse.ok) {
        continue; // Try again if the polling request fails
      }
      
      result = await pollResponse.json() as ReplicateResponseData;
      
      // Check if the prediction is complete
      if (result.status === "succeeded") {
        break;
      }
      
      // Check if the prediction failed
      if (result.status === "failed") {
        throw new Error(`Prediction failed: ${result.error}`);
      }
    }
    
    if (!result || result.status !== "succeeded") {
      throw new Error("Prediction timed out or failed");
    }
    
    // Get the first output URL
    const outputUrl = Array.isArray(result.output) && result.output.length > 0 
      ? result.output[0] 
      : null;
    
    if (!outputUrl) {
      throw new Error("No output URL in the prediction result");
    }
    
    // Download the image and convert to base64
    const imageResponse = await fetch(outputUrl);
    const imageBuffer = await imageResponse.buffer();
    const base64Image = imageBuffer.toString('base64');
    
    // Return as a data URL that can be directly used in <img> tags
    return `data:image/jpeg;base64,${base64Image}`;
    
  } catch (error) {
    console.error("Error generating pose image with Replicate:", error);
    throw error;
  }
}