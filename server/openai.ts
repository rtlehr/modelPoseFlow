import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface PoseAnalysisResult {
  keywords: string[];
  description: string;
  difficultyPreference?: number | null; // 1=Easy, 2=Medium, 3=Hard, null=Any
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
            "Extract DETAILED and SPECIFIC keywords that describe the pose, body position, expression, mood, and any distinctive features. " +
            "These keywords will be the PRIMARY METHOD for matching poses to user descriptions, so be thorough and precise. " +
            "Include terms related to: body position, angle, perspective, gesture, expression, mood, pose dynamics, composition, etc. " +
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
            "Extract relevant keywords from the text description provided and detect if there's a difficulty preference for models holding the pose. " +
            "Focus on aspects of the pose like body position, angle, mood, stance, posture, style, etc. " +
            "Also identify if the user has specified a difficulty preference for the pose (how easy/hard it would be for a live model to hold). " +
            "Keywords are the primary method used for matching poses to descriptions. " +
            "You should return a JSON object with three properties: " +
            "1. 'keywords': An array of 12-15 specific relevant keywords from the description " +
            "2. 'description': A brief summary of the pose in 10 words or less " +
            "3. 'difficultyPreference': A number representing the difficulty level (1=Easy, 2=Medium, 3=Hard), or null if no preference specified " +
            "For difficulty, look for phrases like 'easy poses', 'medium difficulty', 'challenging poses', etc."
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
    
    // If the description contained difficulty keywords, add them to the main keywords list
    if (result.difficultyPreference === 1) {
      if (!result.keywords.includes("easy")) {
        result.keywords.push("easy");
      }
    } else if (result.difficultyPreference === 2) {
      if (!result.keywords.includes("medium")) {
        result.keywords.push("medium");
      }
    } else if (result.difficultyPreference === 3) {
      if (!result.keywords.includes("hard")) {
        result.keywords.push("hard");
      }
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
 * Analyzes a pose image to determine its difficulty level for a live model to hold
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
            "You are an AI assistant that helps determine the difficulty level for a live model to hold a pose. " +
            "Analyze the pose image and evaluate its difficulty for a human model to maintain based on several factors:\n\n" +
            "1. Muscle strain and tension required\n" +
            "2. Balance requirements (stable vs unstable positions)\n" +
            "3. Weight distribution and support points\n" +
            "4. Joint pressure and potential discomfort\n" +
            "5. Duration sustainability (how long could one reasonably hold this pose)\n" +
            "6. Unnatural body positions\n" +
            "7. Physical flexibility requirements\n\n" +
            "Rate the pose on a scale of 1 to 3, where:\n" +
            "1 = EASY (comfortable, natural positions, good support, minimal strain, sustainable for long periods)\n" +
            "2 = MEDIUM (moderate muscle engagement, some balance required, mild strain, sustainable for medium durations)\n" +
            "3 = HARD (significant muscle strain, challenging balance, uncomfortable positions, difficult to sustain for more than short periods)\n\n" +
            "Return a JSON object with:\n" +
            "- 'difficultyLevel': A number from 1-3 representing difficulty\n" +
            "- 'difficultyReason': A brief explanation (1-2 sentences) of why this pose has that difficulty rating for a live model to hold"
        },
        {
          role: "user",
          content: [
            {
              type: "text", 
              text: "Analyze this figure pose and determine how difficult it would be for a live human model to hold this pose for an extended period of time (5+ minutes), with a brief explanation of your rating."
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