export interface GeneratedImage {
  id: string;
  src: string;
  transparentProductSrc: string;
  originalProductSrc: string; // The original product image before background removal OR the source image for editing
  characterImageSrc: string; // The character image used for this generation
  // Properties needed for regeneration
  prompt: string;
  backgroundReference: string;
  negativePrompt: string;
  bgRemovalPrompt: string;
  poseReference: string;
  styleReference: string;
  backgroundReferenceImage?: string | null; // The background reference image used
  // Properties for story generation
  sceneIndex?: number;
  frameType?: 'start' | 'end';
  generationType?: 'fashion' | 'edit' | 'tti'; // To guide regeneration logic
  sourceProductId?: string; // Links the generated image to the source product
}

export interface ProductImageFile {
  id: string;
  originalBase64: string;
  status: 'pending' | 'processing-bg' | 'bg-removed' | 'processing-scene' | 'done' | 'error';
  transparentBase64?: string | null;
  generatedBase64?: string | null;
  errorMessage?: string;
}

export interface RegenerationQueueItem {
  id: string; // Unique ID for this queue item
  sourceImage: GeneratedImage;
  status: 'pending' | 'processing-bg' | 'bg-removed' | 'processing-scene' | 'done' | 'error';
  newTransparentSrc?: string; // To store the result of the new BG removal
  resultSrc?: string; // URL of the new image if successful
  errorMessage?: string; // Error message if failed
}

export interface StoryScene {
  scene: string;
  startPrompt: { en: string; vi: string };
  endPrompt: { en: string; vi: string };
  videoPrompt?: string;
}