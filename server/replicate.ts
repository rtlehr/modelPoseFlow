import Replicate from 'replicate';
import { type PoseCategory } from '@shared/schema';
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
    
    // There's an issue with the two-step approach, so let's directly use a stable diffusion model
    // that can generate figure poses based on text prompts
    console.log('Generating pose image directly using Stable Diffusion...');
    
    // Use stability-ai/sdxl model which is good at generating human figures
    const output = await replicate.run(
      "stability-ai/sdxl:c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316",
      {
        input: {
          prompt: `${basePrompt}, ${description}, professional figure drawing reference, clear silhouette, plain background, professional lighting, detailed, full body, high resolution`,
          negative_prompt: "deformed, distorted, disfigured, poorly drawn, bad anatomy, wrong anatomy, extra limb, missing limb, floating limbs, disconnected limbs, mutation, mutated, ugly, disgusting, amputation",
          width: 768,
          height: 768,
          num_outputs: 1,
          scheduler: "K_EULER_ANCESTRAL",
          num_inference_steps: 30,
          guidance_scale: 7.5,
          refine: "expert_ensemble_refiner",
          high_noise_frac: 0.8,
          apply_watermark: false
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