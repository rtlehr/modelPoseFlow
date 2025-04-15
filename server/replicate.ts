import Replicate from 'replicate';
import { PoseCategory } from '@shared/schema';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Directory to save generated images
const POSES_DIR = path.join(process.cwd(), 'data', 'generated_poses');

// Ensure directory exists
if (!fs.existsSync(POSES_DIR)) {
  fs.mkdirSync(POSES_DIR, { recursive: true });
}

// Create Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Helper for writing files
const writeFileAsync = promisify(fs.writeFile);

/**
 * Map pose category to appropriate OpenPose parameters and prompts
 */
function getCategoryParams(category: PoseCategory): { 
  pose_type: string,
  basePrompt: string 
} {
  switch (category) {
    case 'standing':
      return {
        pose_type: 'standing',
        basePrompt: 'person standing, figure drawing, art model, clear pose'
      };
    case 'sitting':
      return {
        pose_type: 'sitting',
        basePrompt: 'person sitting, figure drawing, art model, clear pose'
      };
    case 'reclining':
      return {
        pose_type: 'lying down',
        basePrompt: 'person reclining, figure drawing, art model, clear pose'
      };
    case 'action':
      return {
        pose_type: 'dynamic',
        basePrompt: 'person in dynamic action, figure drawing, art model, clear pose'
      };
    case 'random':
    default:
      return {
        pose_type: 'natural',
        basePrompt: 'person in natural pose, figure drawing, art model, clear pose'
      };
  }
}

/**
 * Generate OpenPose image for a given description and category
 */
export async function generateOpenPoseImage(
  description: string,
  category: PoseCategory
): Promise<string | null> {
  try {
    const { pose_type, basePrompt } = getCategoryParams(category);
    
    // First, generate an OpenPose skeleton using the llava-13b model
    // This model helps to create a basic pose structure
    const openPoseOutput = await replicate.run(
      "fofr/llava-13b:2facb4a474a0462c15041b78b1ad70952ea46b5ec6ad29583c0b29dbd4249591",
      {
        input: {
          prompt: `Create an OpenPose skeleton for a ${pose_type} human figure. ${description}`,
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 1024
        }
      }
    );
    
    console.log('Generated OpenPose skeleton');
    
    // Then use the OpenPose skeleton to generate a realistic image using ControlNet
    const output = await replicate.run(
      "jagilley/controlnet-pose:854e8727697a057c525cdb45ab037f64ecca770a1769cc52287c2e56472a247b",
      {
        input: {
          image: openPoseOutput.image_url || "",
          prompt: `${basePrompt}, ${description}, professional lighting, detailed, high resolution`,
          num_samples: "1",
          image_resolution: "768",
          ddim_steps: 30,
          scale: 9,
          a_prompt: "best quality, extremely detailed, realistic, high resolution",
          n_prompt: "longbody, lowres, bad anatomy, bad hands, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, deformed body, bloated, ugly, unrealistic"
        }
      }
    );
    
    // Create a unique filename for the image
    const filename = `${crypto.randomUUID()}.png`;
    const filePath = path.join(POSES_DIR, filename);
    
    // Download the image from URL and save it
    if (output && Array.isArray(output) && output.length > 0 && output[0]) {
      // Fetch the image data
      const imageUrl = output[0];
      const response = await fetch(imageUrl);
      const imageBuffer = await response.arrayBuffer();
      
      // Save the image to disk
      await writeFileAsync(filePath, Buffer.from(imageBuffer));
      
      // Return the relative path to the image (for serving via static files)
      return `/data/generated_poses/${filename}`;
    }
    
    return null;
  } catch (error) {
    console.error('Error generating pose image:', error);
    return null;
  }
}

/**
 * Generate multiple pose images based on description and categories
 */
export async function generatePoseSet(
  description: string,
  categories: PoseCategory[],
  count: number = 5
): Promise<Array<{url: string, category: PoseCategory}>> {
  const results = [];
  
  // Ensure we have enough categories (repeat if necessary)
  const extendedCategories = [...categories];
  while (extendedCategories.length < count) {
    extendedCategories.push(...categories);
  }
  
  // Generate the requested number of poses
  const categoriesToUse = extendedCategories.slice(0, count);
  
  // Process in parallel for faster generation (but with limit)
  const promises = categoriesToUse.map(async (category, index) => {
    // Add variations to prevent identical descriptions
    const variationText = index > 0 ? `, variation ${index + 1}` : '';
    const imageUrl = await generateOpenPoseImage(`${description}${variationText}`, category);
    
    if (imageUrl) {
      return {
        url: imageUrl,
        category: category
      };
    }
    return null;
  });
  
  // Wait for all image generations to complete
  const poseResults = await Promise.all(promises);
  
  // Filter out any failed generations
  return poseResults.filter(result => result !== null);
}