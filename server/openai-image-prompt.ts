import OpenAI from "openai";
import { PoseCategory } from "@shared/schema";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

/**
 * Generate enhanced image prompts for pose generation
 */
export async function enhanceImagePrompt(
  userPrompt: string,
  poseCount: number,
  poseLength: number,
  categories: PoseCategory[]
): Promise<string> {
  try {
    const categoriesString = categories.join(", ");
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are an expert assistant for figure drawing artists. Your task is to enhance a user's basic pose description 
          into a detailed, clear image prompt for a figure drawing AI generator. Create a prompt that will generate a high-quality, 
          artistic figure drawing pose that a model could reasonably hold for ${poseLength} seconds.
          
          The images should:
          - Be suitable for figure drawing practice
          - Feature realistic human anatomy and proportions
          - Have clear lighting and composition
          - Be appropriate for the specified pose categories: ${categoriesString}
          - Include a mix of gender and body types appropriate for art studies
          - Be non-sexual and appropriate for all audiences
          - Avoid controversial or political content
          - Focus on clean, clear figure drawing references
          
          Output ONLY the enhanced prompt without commentary.`
        },
        {
          role: "user",
          content: `I need to generate ${poseCount} figure drawing reference poses with the following description: "${userPrompt}". 
          Each pose should be something a model could hold for ${poseLength} seconds. The pose categories are: ${categoriesString}.
          Enhance this description into a detailed prompt for AI image generation.`
        }
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const enhancedPrompt = response.choices[0].message.content?.trim();
    console.log("Enhanced image prompt:", enhancedPrompt);
    
    return enhancedPrompt || userPrompt;
  } catch (error) {
    console.error("Error enhancing image prompt:", error);
    return userPrompt; // Fallback to original prompt if enhancement fails
  }
}