import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type PoseCategory = "standing" | "sitting" | "reclining" | "action";

interface PoseAnalysisResult {
  categories: PoseCategory[];
  keywords: string[];
  description: string;
}

/**
 * Analyzes a natural language pose description and extracts relevant pose categories
 * and keywords to use for searching and filtering poses.
 */
export async function analyzePoseDescription(description: string): Promise<PoseAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "You are an AI assistant that helps analyze figure drawing pose descriptions. " +
            "Extract relevant pose categories and keywords from the text description provided. " +
            "The available pose categories are: standing, sitting, reclining, and action. " +
            "You should return a JSON object with three properties: " +
            "1. 'categories': An array of categories that match the description (at least one) " +
            "2. 'keywords': An array of 3-5 relevant keywords from the description " +
            "3. 'description': A brief summary of the pose in 10 words or less"
        },
        {
          role: "user",
          content: description
        }
      ],
      response_format: { type: "json_object" },
    });

    const messageContent = response.choices[0].message.content;
    if (!messageContent) {
      throw new Error("Empty response from OpenAI");
    }
    const result = JSON.parse(messageContent) as PoseAnalysisResult;
    
    // Ensure we have at least one category
    if (!result.categories || result.categories.length === 0) {
      result.categories = ["standing"]; // Default to standing if no categories detected
    }
    
    // Validate the categories to ensure they match our expected types
    result.categories = result.categories.filter(cat => 
      ["standing", "sitting", "reclining", "action"].includes(cat)
    ) as PoseCategory[];
    
    // If filtering removed all categories, add a default
    if (result.categories.length === 0) {
      result.categories = ["standing"];
    }
    
    return result;
  } catch (error) {
    console.error("Error analyzing pose description:", error);
    // Fallback to a default response if OpenAI fails
    return {
      categories: ["standing"],
      keywords: [],
      description: "Default pose selection"
    };
  }
}