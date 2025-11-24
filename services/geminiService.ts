import { GoogleGenAI, Modality } from "@google/genai";
import type { StoryScene } from '../types';

const getBase64Parts = (base64String: string) => {
  const match = base64String.match(/^data:(image\/.+);base64,(.+)$/);
  if (!match) {
    throw new Error("Định dạng chuỗi base64 không hợp lệ");
  }
  return {
    mimeType: match[1],
    data: match[2],
  };
};

export const removeBackground = async (apiKey: string, imageBase64: string, prompt: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const imagePart = {
      inlineData: getBase64Parts(imageBase64),
    };
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [textPart, imagePart],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const candidate = response?.candidates?.[0];

    if (candidate?.content?.parts?.length > 0) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          const base64ImageBytes: string = part.inlineData.data;
          return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
      }
    }

    if (response?.promptFeedback?.blockReason) {
        throw new Error(`Bị chặn vì lý do an toàn: ${response.promptFeedback.blockReason}`);
    }
    if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
        if (candidate.finishReason === 'NO_IMAGE') {
            throw new Error("AI không thể tạo hình ảnh từ yêu cầu này. Vui lòng thử thay đổi ảnh hoặc câu lệnh.");
        }
        throw new Error(`Quá trình tạo ảnh kết thúc với lý do: ${candidate.finishReason}`);
    }

    throw new Error("Quá trình tách nền không trả về hình ảnh.");
  } catch (error) {
    console.error("Error removing background with Gemini:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('429') || /rate limit/i.test(errorMessage) || /resource has been exhausted/i.test(errorMessage) || /API key is invalid/i.test(errorMessage)) {
        const rateLimitError = new Error(`API Key bị giới hạn hoặc không hợp lệ: ${errorMessage}`);
        rateLimitError.name = 'RateLimitError';
        return Promise.reject(rateLimitError);
    }
    
    if (error instanceof Error) {
        return Promise.reject(`Tách nền thất bại: ${errorMessage}`);
    }
    return Promise.reject("Đã xảy ra lỗi không xác định trong quá trình tách nền.");
  }
};

export const generateScene = async (
  apiKey: string,
  productImageBase64: string,
  characterImageBase64: string,
  prompt: string,
  backgroundReferenceImageBase64?: string | null,
  seed?: number
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const productPart = {
      inlineData: getBase64Parts(productImageBase64),
    };
    const characterPart = {
      inlineData: getBase64Parts(characterImageBase64),
    };
    const textPart = { text: prompt };

    const parts = [textPart, productPart, characterPart];

    if (backgroundReferenceImageBase64) {
        const backgroundPart = { inlineData: getBase64Parts(backgroundReferenceImageBase64) };
        parts.push(backgroundPart);
    }

    const config: { responseModalities: Modality[], seed?: number } = {
        responseModalities: [Modality.IMAGE],
    };

    if (seed !== undefined) {
        config.seed = seed;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts,
      },
      config: config,
    });

    const candidate = response?.candidates?.[0];

    if (candidate?.content?.parts?.length > 0) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          const base64ImageBytes: string = part.inlineData.data;
          return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
      }
    }

    if (response?.promptFeedback?.blockReason) {
        throw new Error(`Bị chặn vì lý do an toàn: ${response.promptFeedback.blockReason}`);
    }
    if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
        if (candidate.finishReason === 'NO_IMAGE') {
            throw new Error("AI không thể tạo hình ảnh từ yêu cầu này. Vui lòng thử thay đổi ảnh hoặc câu lệnh.");
        }
        throw new Error(`Quá trình tạo ảnh kết thúc với lý do: ${candidate.finishReason}`);
    }

    throw new Error("API không tạo ra hình ảnh nào.");
  } catch (error) {
    console.error("Error generating scene with Gemini:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('429') || /rate limit/i.test(errorMessage) || /resource has been exhausted/i.test(errorMessage) || /API key is invalid/i.test(errorMessage)) {
        const rateLimitError = new Error(`API Key bị giới hạn hoặc không hợp lệ: ${errorMessage}`);
        rateLimitError.name = 'RateLimitError';
        return Promise.reject(rateLimitError);
    }

    if (error instanceof Error) {
        return Promise.reject(`Tạo ảnh thất bại: ${errorMessage}`);
    }
    return Promise.reject("Đã xảy ra lỗi không xác định trong quá trình tạo ảnh.");
  }
};

export const suggestPrompts = async (
  apiKey: string,
  productImageBase64: string,
  characterImageBase64: string,
  referencesText: string
): Promise<Array<{ en: string; vi: string }>> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const productPart = { inlineData: getBase64Parts(productImageBase64) };
    const characterPart = { inlineData: getBase64Parts(characterImageBase64) };

    let metaPrompt = `You are a creative director. Your task is to generate 4 distinct, creative **scene descriptions**. These descriptions will be appended to a technical prompt base later.

**Instructions:**
1.  Analyze the provided model and clothing product.
2.  For each of the 4 suggestions, describe ONLY the creative elements of a scene. This includes:
    *   A specific, trendy, and visually appealing background/setting.
    *   A natural and engaging full-body pose for the model.
    *   A description of professional lighting (e.g., golden hour, soft studio light).
    *   A mood or feeling to convey (e.g., energetic, dreamy, chic).
3.  **DO NOT** include technical specifications like "9:16 aspect ratio", "photorealistic", "full-body shot", "feet on the ground", or instructions about matching the face. These will be added automatically. Focus ONLY on the creative scene.
4.  Write the descriptions in English first.
5.  Provide a professional, natural-sounding Vietnamese translation for each English scene description.
6.  Return the output ONLY as a valid JSON array of 4 objects. Each object must have two keys: "en" for the English scene description, and "vi" for the Vietnamese translation.
    Example: [
      {
        "en": "The model poses confidently on a sun-drenched street in Seoul, with golden hour lighting creating a warm, dreamy atmosphere.",
        "vi": "Người mẫu tạo dáng tự tin trên con phố ngập nắng ở Seoul, với ánh sáng giờ vàng tạo nên không khí ấm áp, mơ màng."
      }
    ]
`;

    if (referencesText.trim()) {
        metaPrompt += `\n**Mandatory Themes:**
Incorporate the following user-provided themes and styles into your suggestions: "${referencesText}".\n`;
    } else {
        metaPrompt += `\n**Creative Freedom:**
Since no specific themes are provided, invent creative and suitable themes that match the product and model.\n`;
    }

    const textPart = { text: metaPrompt };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: {
        parts: [textPart, productPart, characterPart],
      },
      config: {
        responseMimeType: "application/json",
      },
    });
    
    const jsonString = response.text;
    if (!jsonString) {
      throw new Error("API returned an empty response for prompt suggestions.");
    }
    
    const creativeSuggestions = JSON.parse(jsonString);

    if (
        !Array.isArray(creativeSuggestions) ||
        creativeSuggestions.length === 0 ||
        !creativeSuggestions.every(s => typeof s === 'object' && s !== null && 'en' in s && 'vi' in s)
    ) {
      throw new Error("API did not return a valid array of {en, vi} suggestion objects.");
    }
    
    const coreInstructionsEN = `Create a tall, vertical photorealistic image with a 9:16 aspect ratio.
The person must be standing with their feet firmly on a plausible surface (like a floor, street, or ground), not floating.
The final image must feature the person in a full-body standing pose, modeling the provided clothing product.
CRITICAL: The person's face in the final image MUST be an exact, photorealistic match to the face in the provided character image. Do not alter the facial features, structure, or expression in any way. Apply this exact face to a body with a completely new standing pose.
Use the hair from the character image.
The person must be centered and not cropped.
Output a single, high-quality image.
The scene is as follows:`;

    const coreInstructionsVI = `Tạo một hình ảnh chân thực, cao, dọc với tỷ lệ 9:16.
Người phải đứng vững chân trên một bề mặt hợp lý (như sàn nhà, đường phố, hoặc mặt đất), không lơ lửng.
Hình ảnh cuối cùng phải có một người trong tư thế đứng toàn thân, làm mẫu cho sản phẩm quần áo được cung cấp.
CỰC KỲ QUAN TRỌNG: Khuôn mặt của người trong ảnh cuối cùng PHẢI khớp chính xác, chân thực với khuôn mặt trong ảnh nhân vật được cung cấp. Không thay đổi các đặc điểm, cấu trúc hoặc biểu cảm của khuôn mặt theo bất kỳ cách nào. Áp dụng khuôn mặt chính xác này vào một cơ thể với một tư thế đứng hoàn toàn mới.
Sử dụng mái tóc từ hình ảnh nhân vật.
Người phải ở trung tâm và không bị cắt xén.
Xuất ra một hình ảnh duy nhất, chất lượng cao.
Bối cảnh như sau:`;

    const finalSuggestions = creativeSuggestions.map((s: { en: string; vi: string }) => ({
        en: `${coreInstructionsEN} ${s.en}`,
        vi: `${coreInstructionsVI} ${s.vi}`,
    }));

    return finalSuggestions;

  } catch (error) {
    console.error("Error suggesting prompts with Gemini:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('429') || /rate limit/i.test(errorMessage) || /resource has been exhausted/i.test(errorMessage) || /API key is invalid/i.test(errorMessage)) {
        const rateLimitError = new Error(`API Key bị giới hạn hoặc không hợp lệ: ${errorMessage}`);
        rateLimitError.name = 'RateLimitError';
        return Promise.reject(rateLimitError);
    }
    
    if (error instanceof Error) {
        return Promise.reject(`Gợi ý prompt thất bại: ${errorMessage}`);
    }
    return Promise.reject("Đã xảy ra lỗi không xác định trong quá trình gợi ý prompt.");
  }
};

export const generateImageFromText = async (
  apiKey: string,
  prompt: string,
  aspectRatio: '9:16' | '16:9' | '1:1' | '3:4' | '4:3'
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: aspectRatio,
        },
    });

    const generatedImage = response.generatedImages?.[0];

    if (generatedImage?.image?.imageBytes) {
      const base64ImageBytes: string = generatedImage.image.imageBytes;
      return `data:image/png;base64,${base64ImageBytes}`;
    }
    
    throw new Error("API không tạo ra hình ảnh nào.");
  } catch (error) {
    console.error("Error generating image from text with Gemini:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('429') || /rate limit/i.test(errorMessage) || /resource has been exhausted/i.test(errorMessage) || /API key is invalid/i.test(errorMessage)) {
        const rateLimitError = new Error(`API Key bị giới hạn hoặc không hợp lệ: ${errorMessage}`);
        rateLimitError.name = 'RateLimitError';
        return Promise.reject(rateLimitError);
    }

    if (error instanceof Error) {
        return Promise.reject(`Tạo ảnh thất bại: ${errorMessage}`);
    }
    return Promise.reject("Đã xảy ra lỗi không xác định trong quá trình tạo ảnh.");
  }
};

export const editImage = async (
  apiKey: string,
  imageBase64: string,
  prompt: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const imagePart = {
      inlineData: getBase64Parts(imageBase64),
    };
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [textPart, imagePart],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const candidate = response?.candidates?.[0];

    if (candidate?.content?.parts?.length > 0) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          const base64ImageBytes: string = part.inlineData.data;
          return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
      }
    }

    if (response?.promptFeedback?.blockReason) {
        throw new Error(`Bị chặn vì lý do an toàn: ${response.promptFeedback.blockReason}`);
    }
    if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
        if (candidate.finishReason === 'NO_IMAGE') {
            throw new Error("AI không thể tạo hình ảnh từ yêu cầu này. Vui lòng thử thay đổi ảnh hoặc câu lệnh.");
        }
        throw new Error(`Quá trình tạo ảnh kết thúc với lý do: ${candidate.finishReason}`);
    }

    throw new Error("API không tạo ra hình ảnh nào.");
  } catch (error) {
    console.error("Error editing image with Gemini:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('429') || /rate limit/i.test(errorMessage) || /resource has been exhausted/i.test(errorMessage) || /API key is invalid/i.test(errorMessage)) {
        const rateLimitError = new Error(`API Key bị giới hạn hoặc không hợp lệ: ${errorMessage}`);
        rateLimitError.name = 'RateLimitError';
        return Promise.reject(rateLimitError);
    }

    if (error instanceof Error) {
        return Promise.reject(`Chỉnh sửa ảnh thất bại: ${errorMessage}`);
    }
    return Promise.reject("Đã xảy ra lỗi không xác định trong quá trình chỉnh sửa ảnh.");
  }
};

export const suggestEditPrompts = async (
  apiKey: string,
  imageBase64: string,
  userRequest: string,
  count: number = 4
): Promise<string[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const imagePart = { inlineData: getBase64Parts(imageBase64) };

    const metaPrompt = `You are a creative and professional photo editor AI assistant.
Your task is to analyze the provided image and the user's initial editing request.
Based on this, generate ${count} creative, specific, and actionable prompts (in Vietnamese) that expand upon or offer alternative ideas to the user's request.
The prompts should be concise and ready to be used directly in an image editing AI.

**User's initial request:** "${userRequest || 'chỉnh sửa chung'}"

**Instructions:**
1.  Analyze the image content (subject, background, lighting, style).
2.  Understand the user's intent from their request. If the request is empty, suggest general improvements.
3.  Generate ${count} distinct and creative suggestions.
4.  The suggestions must be in Vietnamese.
5.  Return the output ONLY as a valid JSON array of ${count} strings. Do not add any other text.
    Example for count=4: [
      "thêm một vệt nắng nhẹ chiếu từ góc trên bên phải",
      "chuyển tông màu của ảnh sang màu phim cổ điển (vintage film look)",
      "làm mờ hậu cảnh một chút để làm nổi bật chủ thể",
      "thêm một vài cánh hoa anh đào đang bay nhẹ trong không khí"
    ]
`;
    const textPart = { text: metaPrompt };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: { parts: [textPart, imagePart] },
      config: { responseMimeType: "application/json" }
    });
    
    const jsonString = response.text;
    if (!jsonString) {
      throw new Error("API returned an empty response for edit prompt suggestions.");
    }
    
    const suggestions = JSON.parse(jsonString);
    if (!Array.isArray(suggestions) || !suggestions.every(s => typeof s === 'string')) {
      throw new Error("API did not return a valid array of strings.");
    }

    return suggestions;
  } catch (error) {
    console.error("Error suggesting edit prompts with Gemini:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('429') || /rate limit/i.test(errorMessage) || /resource has been exhausted/i.test(errorMessage) || /API key is invalid/i.test(errorMessage)) {
        const rateLimitError = new Error(`API Key bị giới hạn hoặc không hợp lệ: ${errorMessage}`);
        rateLimitError.name = 'RateLimitError';
        return Promise.reject(rateLimitError);
    }
    if (error instanceof Error) {
        return Promise.reject(`Gợi ý prompt chỉnh sửa thất bại: ${errorMessage}`);
    }
    return Promise.reject("Đã xảy ra lỗi không xác định trong quá trình gợi ý prompt chỉnh sửa.");
  }
};

export const analyzeStoryAndSuggestScenes = async (
  apiKey: string,
  storyText: string
): Promise<StoryScene[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey });

    const metaPrompt = `You are a creative assistant and a film director. Your task is to read the following story and break it down into key visual scenes, imagining each scene as a short video clip (e.g., 5-8 seconds).

For each scene, you will provide:
1.  A brief, one-sentence description of the scene in Vietnamese ("scene").
2.  A prompt for the STARTING FRAME of the video clip ("startPrompt"). This should describe the beginning of the action.
3.  A prompt for the ENDING FRAME of the video clip ("endPrompt"). This should describe the end of the action, showing a clear progression from the starting frame.

For both "startPrompt" and "endPrompt", you must create two versions:
- An English prompt ("en"): concise, descriptive, visual, detailed, and optimized for an image generation AI like Imagen.
- A Vietnamese prompt ("vi"): A natural-sounding translation of the English prompt for a Vietnamese user to read.

Return the output ONLY as a valid JSON array of objects. Each object must have three keys: "scene", "startPrompt", and "endPrompt".
Do not add any explanations or text outside of the JSON array.

Example:
[
  {
    "scene": "Một chú mèo phi hành gia chuẩn bị trượt ván và sau đó lướt điệu nghệ.",
    "startPrompt": {
      "en": "A cute astronaut cat standing next to a skateboard in space, looking determined, preparing to ride. High detail, cinematic.",
      "vi": "Một chú mèo phi hành gia dễ thương đứng cạnh ván trượt trong vũ trụ, vẻ mặt quyết tâm, chuẩn bị lướt. Chi tiết cao, điện ảnh."
    },
    "endPrompt": {
      "en": "The same astronaut cat is now skillfully riding the skateboard through a field of asteroids, motion blur, dynamic angle, digital art.",
      "vi": "Cùng chú mèo phi hành gia đó giờ đang điệu nghệ lướt ván trượt qua một trường tiểu hành tinh, có hiệu ứng mờ chuyển động, góc quay động, nghệ thuật kỹ thuật số."
    }
  }
]

Story:
"""
${storyText}
"""
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: { parts: [{ text: metaPrompt }] },
      config: {
        responseMimeType: "application/json",
      },
    });
    
    const jsonString = response.text;
    if (!jsonString) {
      throw new Error("API returned an empty response for scene suggestions.");
    }
    
    const scenes = JSON.parse(jsonString);

    const isValidScene = (s: any): s is StoryScene => {
      return typeof s === 'object' && s !== null &&
             typeof s.scene === 'string' &&
             typeof s.startPrompt === 'object' && s.startPrompt !== null &&
             typeof s.startPrompt.en === 'string' &&
             typeof s.startPrompt.vi === 'string' &&
             typeof s.endPrompt === 'object' && s.endPrompt !== null &&
             typeof s.endPrompt.en === 'string' &&
             typeof s.endPrompt.vi === 'string';
    };

    if (
        !Array.isArray(scenes) ||
        scenes.length === 0 ||
        !scenes.every(isValidScene)
    ) {
      throw new Error("API did not return a valid array of scene objects.");
    }

    return scenes;

  } catch (error) {
    console.error("Error analyzing story with Gemini:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('429') || /rate limit/i.test(errorMessage) || /resource has been exhausted/i.test(errorMessage) || /API key is invalid/i.test(errorMessage)) {
        const rateLimitError = new Error(`API Key bị giới hạn hoặc không hợp lệ: ${errorMessage}`);
        rateLimitError.name = 'RateLimitError';
        return Promise.reject(rateLimitError);
    }
    
    if (error instanceof Error) {
        return Promise.reject(`Phân tích câu chuyện thất bại: ${errorMessage}`);
    }
    return Promise.reject("Đã xảy ra lỗi không xác định trong quá trình phân tích câu chuyện.");
  }
};

export const suggestVideoPrompts = async (
  apiKey: string,
  scenes: Array<{
    sceneDescription: string;
    startImageBase64: string;
    endImageBase64: string;
  }>,
  storyText: string,
  metaPromptTemplate: string
): Promise<string[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey });

    const parts: any[] = [];
    
    const finalMetaPrompt = metaPromptTemplate.replace('{{STORY_CONTEXT}}', storyText);
    
    let promptText = finalMetaPrompt;
    scenes.forEach((scene, index) => {
      promptText += `\n--- Scene ${index + 1} ---\n`;
      promptText += `Description: ${scene.sceneDescription}\n`;
      promptText += `[START IMAGE ${index + 1}]\n`;
      promptText += `[END IMAGE ${index + 1}]\n`;
      
      parts.push({ inlineData: getBase64Parts(scene.startImageBase64) });
      parts.push({ inlineData: getBase64Parts(scene.endImageBase64) });
    });

    parts.unshift({ text: promptText }); // Add the text prompt at the beginning

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
      },
    });

    const jsonString = response.text;
    if (!jsonString) {
      throw new Error("API returned an empty response for video prompt suggestions.");
    }
    
    const videoPrompts = JSON.parse(jsonString);

    if (!Array.isArray(videoPrompts) || videoPrompts.length !== scenes.length || !videoPrompts.every(p => typeof p === 'string')) {
      console.error("Invalid response from API:", videoPrompts);
      throw new Error("API did not return a valid array of strings for video prompts.");
    }

    return videoPrompts;

  } catch (error) {
    console.error("Error suggesting video prompts with Gemini:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('429') || /rate limit/i.test(errorMessage) || /resource has been exhausted/i.test(errorMessage) || /API key is invalid/i.test(errorMessage)) {
        const rateLimitError = new Error(`API Key bị giới hạn hoặc không hợp lệ: ${errorMessage}`);
        rateLimitError.name = 'RateLimitError';
        return Promise.reject(rateLimitError);
    }
    
    if (error instanceof Error) {
        return Promise.reject(`Gợi ý prompt video thất bại: ${errorMessage}`);
    }
    return Promise.reject("Đã xảy ra lỗi không xác định trong quá trình gợi ý prompt video.");
  }
};