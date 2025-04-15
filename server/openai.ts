import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface PoseAnalysisResult {
  keywords: string[];
  description: string;
}

interface PoseDifficultyResult {
  difficultyLevel: number; // 1-Easy, 2-Medium, 3-Hard
  difficultyReason: string;
}

/**
 * Generates keywords for a pose based on its visual characteristics
 * These keywords are now the primary method for matching poses to user descriptions
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
            "Extract DETAILED and SPECIFIC keywords that describe the pose, body position, expression, mood, lighting, and any distinctive features. " +
            "These keywords will be the PRIMARY METHOD for matching poses to user descriptions, so be thorough and precise. " +
            "Include terms related to: body position, angle, perspective, gesture, expression, mood, lighting, dynamism, composition, etc. " +
            "You should return a JSON array of 15-20 specific keywords that accurately describe the pose."
        },
        {
          role: "user",
          content: [
            {
              type: "text", 
              text: "Generate comprehensive descriptive keywords for this figure pose. These keywords will be used to match this pose with user descriptions, so be specific and detailed."
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
            "Extract relevant keywords from the text description provided. " +
            "Focus on aspects of the pose like body position, angle, mood, lighting, style, etc. " +
            "Keywords are the only method used for matching poses to descriptions. " +
            "You should return a JSON object with two properties: " +
            "1. 'keywords': An array of 12-15 specific relevant keywords from the description " +
            "2. 'description': A brief summary of the pose in 10 words or less"
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
    
    // Ensure we have keywords
    if (!result.keywords || result.keywords.length === 0) {
      // Generate some basic keywords
      result.keywords = ["figure", "pose", "drawing"];
    }
    
    return result;
  } catch (error) {
    console.error("Error analyzing pose description:", error);
    // Fallback to a default response if OpenAI fails
    return {
      keywords: ["figure", "pose", "drawing"],
      description: "Default pose selection"
    };
  }
}

/**
 * Analyzes a pose image to determine its difficulty level for figure drawing
 * Returns a difficulty level (1-Easy, 2-Medium, 3-Hard) and explanation
 */
export async function analyzePoseDifficulty(imageUrl: string): Promise<PoseDifficultyResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "You are an AI assistant that helps determine the difficulty level of figure drawing poses for artists. " +
            "Analyze the pose image and evaluate its difficulty for drawing based on several factors:\n\n" +
            "1. Complexity of the pose (simple vs complex positioning)\n" +
            "2. Foreshortening (minimal vs significant)\n" +
            "3. Balance and weight distribution\n" +
            "4. Visibility of anatomical landmarks\n" +
            "5. Unusual angles or perspectives\n" +
            "6. Dynamic vs static nature of the pose\n" +
            "7. Complexity of lighting and shadows\n\n" +
            "Rate the pose on a scale of 1 to 3, where:\n" +
            "1 = EASY (simple poses, clear silhouette, minimal foreshortening, good visibility of features)\n" +
            "2 = MEDIUM (moderate complexity, some foreshortening, slightly challenging angles)\n" +
            "3 = HARD (complex positioning, significant foreshortening, difficult angles, challenging balance)\n\n" +
            "Return a JSON object with:\n" +
            "- 'difficultyLevel': A number from 1-3 representing difficulty\n" +
            "- 'difficultyReason': A brief explanation (1-2 sentences) of why this pose has that difficulty rating"
        },
        {
          role: "user",
          content: [
            {
              type: "text", 
              text: "Analyze this figure pose and determine its difficulty level for artists to draw, with a brief explanation of your rating."
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
    
    const result = JSON.parse(messageContent) as PoseDifficultyResult;
    
    // Validate difficulty level
    if (result.difficultyLevel < 1 || result.difficultyLevel > 3) {
      // Default to medium if out of range
      result.difficultyLevel = 2;
    }
    
    return result;
  } catch (error) {
    console.error("Error analyzing pose difficulty:", error);
    // Fallback to a default medium difficulty
    return {
      difficultyLevel: 2,
      difficultyReason: "Default medium difficulty due to analysis error."
    };
  }
}