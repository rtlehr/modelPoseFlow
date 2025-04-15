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
 * Generates keywords for a pose based on its visual characteristics
 * This can be used to assist with tagging poses for better searchability
 */
export async function generatePoseKeywords(imageUrl: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "You are an AI assistant that helps analyze figure drawing poses from images. " +
            "Extract relevant keywords that describe the pose, body position, expression, mood, and any distinctive features. " +
            "Focus on aspects that would be relevant for an artist looking for specific poses to draw. " +
            "You should return a JSON array of 10-15 specific keywords that accurately describe the pose."
        },
        {
          role: "user",
          content: [
            {
              type: "text", 
              text: "Generate descriptive keywords for this figure pose that would help artists find it when searching."
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
    });

    const messageContent = response.choices[0].message.content;
    if (!messageContent) {
      throw new Error("Empty response from OpenAI");
    }
    
    const result = JSON.parse(messageContent);
    if (Array.isArray(result.keywords)) {
      return result.keywords;
    } else if (Array.isArray(result)) {
      return result;
    }
    
    return [];
  } catch (error) {
    console.error("Error generating pose keywords:", error);
    return [];
  }
}

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