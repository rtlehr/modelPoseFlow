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
 * Represents a keyword with its weight
 * - Primary pose descriptors (standing, sitting, kneeling) have weight 3
 * - Secondary descriptors (arms raised, legs bent) have weight 2
 * - Detail descriptors (finger position, slight angle) have weight 1
 */
export interface WeightedKeyword {
  keyword: string;
  weight: number; // 3=Primary, 2=Secondary, 1=Tertiary
}

/**
 * Generates weighted keywords for a pose based on its visual characteristics
 * These keywords are now the primary method for matching poses to user descriptions
 * Keywords are weighted by importance (primary whole-body pose, secondary limb positions, tertiary details)
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
            "Extract DETAILED and SPECIFIC keywords that ONLY describe the physical pose and body positioning of the model. " +
            "IMPORTANT: Focus EXCLUSIVELY on the model's physical pose - do NOT include keywords about background, lighting, mood, appearance, " +
            "clothing, setting, photographic style, or any other elements not directly related to the physical pose itself. " +
            "These keywords should be organized into three categories with different weights:\n\n" +
            "1. PRIMARY KEYWORDS (weight=3): Fundamental whole-body pose descriptors (e.g., standing, sitting, lying, kneeling, crouching).\n" +
            "2. SECONDARY KEYWORDS (weight=2): Major limb positions and body orientations (e.g., arms raised, legs crossed, torso twisted).\n" +
            "3. TERTIARY KEYWORDS (weight=1): Specific details and minor elements (e.g., head tilted, fingers spread, weight on left foot).\n\n" +
            "These weighted keywords will be the PRIMARY METHOD for matching poses to user descriptions, with primary keywords given the most importance when matching. " +
            "Include ONLY terms related to: body position, limb placement, angle of limbs, weight distribution, orientation, balance, " +
            "head position, torso alignment, physical gesture, anatomical details of the pose. " +
            "You should return a JSON object with a 'weightedKeywords' property containing an array of 15-20 objects, each with 'keyword' and 'weight' properties."
        },
        {
          role: "user",
          content: [
            {
              type: "text", 
              text: "Generate descriptive keywords ONLY for the physical pose in this image, with weights based on importance. Focus exclusively on body position, limb placement, weight distribution, and pose mechanics. Do NOT include keywords about background, setting, lighting, mood, expression, clothing, or the person's appearance."
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
    
    // Handle the weighted keywords format
    if (Array.isArray(result.weightedKeywords)) {
      // Sort by weight (highest first) and convert to regular array of strings
      // We'll store the weights in the database separately
      const sortedKeywords = result.weightedKeywords
        .sort((a: WeightedKeyword, b: WeightedKeyword) => b.weight - a.weight)
        .map((item: WeightedKeyword) => item.keyword);
      
      return sortedKeywords;
    } 
    // Handle fallbacks
    else if (Array.isArray(result.keywords)) {
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
            "Extract relevant keywords from the text description that ONLY relate to the physical pose of the model. " +
            "IMPORTANT: Focus EXCLUSIVELY on keywords related to the physical body positioning and pose mechanics. " +
            "DO NOT include keywords about background, lighting, mood, appearance, clothing, or any other elements " +
            "not directly related to the physical pose itself. " +
            "Also identify if the user has specified a difficulty preference for the pose (how easy/hard it would be for a live model to hold). " +
            "These keywords should be organized into three categories with different weights:\n\n" +
            "1. PRIMARY KEYWORDS (weight=3): Fundamental whole-body pose descriptors (e.g., standing, sitting, lying, kneeling, crouching).\n" +
            "2. SECONDARY KEYWORDS (weight=2): Major limb positions and body orientations (e.g., arms raised, legs crossed, torso twisted).\n" +
            "3. TERTIARY KEYWORDS (weight=1): Specific details and minor elements (e.g., head tilted, fingers spread, weight on left foot).\n\n" +
            "You should return a JSON object with three properties: " +
            "1. 'weightedKeywords': An array of 12-15 objects with 'keyword' and 'weight' properties, where keywords ONLY relate to physical pose. " +
            "   Prioritize PRIMARY keywords that describe the fundamental pose (standing, sitting, etc.) with weight=3. " +
            "2. 'description': A brief summary of the physical pose in 10 words or less (only about the pose itself) " +
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
    
    const parsedResult = JSON.parse(messageContent);
    
    // Create a result object conforming to our PoseAnalysisResult interface
    const result: PoseAnalysisResult = {
      keywords: [],
      description: parsedResult.description || "Default pose",
      difficultyPreference: parsedResult.difficultyPreference || null
    };
    
    // Handle the weighted keywords if available
    if (Array.isArray(parsedResult.weightedKeywords) && parsedResult.weightedKeywords.length > 0) {
      // Sort by weight (highest first) and extract keywords
      const sortedKeywords = parsedResult.weightedKeywords
        .sort((a: WeightedKeyword, b: WeightedKeyword) => b.weight - a.weight)
        .map((item: WeightedKeyword) => item.keyword);
      
      result.keywords = sortedKeywords;
    }
    // Fallback to regular keywords if weightedKeywords is not available
    else if (Array.isArray(parsedResult.keywords) && parsedResult.keywords.length > 0) {
      result.keywords = parsedResult.keywords;
    }
    else {
      // Generate some basic keywords if none were returned
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