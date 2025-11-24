import React, { useState, useEffect, useRef, useMemo } from 'react';
import ImageUploader from './components/ImageUploader';
import GeneratedImageViewer from './components/GeneratedImageViewer';
import CreationsGallery from './components/CreationsGallery';
import TransparentGallery from './components/TransparentGallery';
import BackgroundSuggestions from './components/BackgroundSuggestions';
import ApiSettings from './components/ApiSettings';
import ReferenceOptionsModal from './components/ReferenceOptionsModal';
import Tooltip from './components/Tooltip';
import StoryResultsGallery from './components/StoryResultsGallery';
import VideoPromptModal, { DisplayScene } from './components/VideoPromptModal';
import GallerySelectionModal from './components/GallerySelectionModal';
import { SparklesIcon, TrashIcon, SpinnerIcon, ErrorIcon, RegenerateIcon, ResetIcon, VideoCameraIcon } from './components/icons';
import { generateScene, removeBackground, suggestPrompts, generateImageFromText, editImage, analyzeStoryAndSuggestScenes, suggestVideoPrompts, suggestEditPrompts } from './services/geminiService';
import type { GeneratedImage, RegenerationQueueItem, StoryScene, ProductImageFile } from './types';
import type { BackgroundSuggestionCategory } from './components/BackgroundSuggestions';
import ProductPromptSuggestions from './components/ProductPromptSuggestions';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const getFashionPromptEn = (aspectRatio: '9:16' | '16:9'): string => {
  const ratioText = aspectRatio === '9:16' ? 'tall, vertical' : 'wide, horizontal';
  return `Create a ${ratioText} photorealistic image with a ${aspectRatio} aspect ratio.
The final image must feature a person in a full-body standing pose, modeling the provided clothing product.
IMPORTANT: Generate a new, natural standing pose. Do NOT copy the pose from the original character image provided.
CRITICAL: The person's face in the final image MUST be an exact, photorealistic match to the face in the provided character image. Do not alter the facial features, structure, or expression in any way. Apply this exact face to a body with a completely new standing pose.
Use the hair from the character image.
Place this person in a newly generated, suitable real-world background (like a city street, studio, or park) that complements the outfit.
Ensure the clothing product is clearly visible, well-lit with professional, soft lighting, and unobstructed.
The overall scene must be realistic and cinematic, with accurate proportions, detailed textures, and natural skin tones.
The person must be centered and not cropped.
The person's feet must be standing firmly on a plausible surface (like a floor, street, or ground), not floating.
Output a single, high-quality image.`;
};

const getFashionPromptVi = (aspectRatio: '9:16' | '16:9'): string => {
    const ratioText = aspectRatio === '9:16' ? 'cao, dọc' : 'rộng, ngang';
    return `Tạo một hình ảnh chân thực, ${ratioText} với tỷ lệ ${aspectRatio}.
Hình ảnh cuối cùng phải có một người trong tư thế đứng toàn thân, làm mẫu cho sản phẩm quần áo được cung cấp.
QUAN TRỌNG: Tạo một tư thế đứng mới, tự nhiên. KHÔNG sao chép tư thế từ hình ảnh nhân vật gốc được cung cấp.
CỰC KỲ QUAN TRỌNG: Khuôn mặt của người trong ảnh cuối cùng PHẢI khớp chính xác, chân thực với khuôn mặt trong ảnh nhân vật được cung cấp. Không thay đổi các đặc điểm, cấu trúc hoặc biểu cảm của khuôn mặt theo bất kỳ cách nào. Áp dụng khuôn mặt chính xác này vào một cơ thể với một tư thế đứng hoàn toàn mới.
Sử dụng mái tóc từ hình ảnh nhân vật.
Đặt người này vào một bối cảnh thế giới thực mới được tạo ra, phù hợp (như đường phố, studio, hoặc công viên) để bổ sung cho bộ trang phục.
Đảm bảo sản phẩm quần áo được nhìn thấy rõ ràng, được chiếu sáng tốt bằng ánh sáng chuyên nghiệp, dịu nhẹ và không bị che khuất.
Toàn bộ cảnh phải chân thực và mang tính điện ảnh, với tỷ lệ chính xác, kết cấu chi tiết và tông màu da tự nhiên.
Người phải ở trung tâm và không bị cắt xén.
Chân của người phải đứng vững trên một bề mặt hợp lý (như sàn nhà, đường phố hoặc mặt đất), không lơ lửng.
Xuất ra một hình ảnh duy nhất, chất lượng cao.`;
};

const getCustomPromptEn = (aspectRatio: '9:16' | '16:9'): string => {
  const ratioText = aspectRatio === '9:16' ? 'tall, vertical' : 'wide, horizontal';
  return `Create a ${ratioText} photorealistic image with a ${aspectRatio} aspect ratio.
The final image must feature a person.
IMPORTANT: Generate a new, natural standing pose. Do NOT copy the pose from the original character image provided.
CRITICAL: The person's face in the final image MUST be an exact, photorealistic match to the face in the provided character image. Do not alter the facial features, structure, or expression in any way. Apply this exact face to a body with a completely new standing pose.
Use the hair from the character image.
Place this person in a newly generated, suitable real-world background (like a city street, studio, or park) that complements the product.
The person and product must be clearly visible, well-lit with professional, soft lighting, and unobstructed.
The overall scene must be realistic and cinematic, with accurate proportions, detailed textures, and natural skin tones.
The person must be centered and not cropped.
The person's feet must be standing firmly on a plausible surface (like a floor, street, or ground), not floating.
Output a single, high-quality image.`;
};

const getCustomPromptVi = (aspectRatio: '9:16' | '16:9'): string => {
    const ratioText = aspectRatio === '9:16' ? 'cao, dọc' : 'rộng, ngang';
    return `Tạo một hình ảnh chân thực, ${ratioText} với tỷ lệ ${aspectRatio}.
Hình ảnh cuối cùng phải có một người.
QUAN TRỌNG: Tạo một tư thế đứng mới, tự nhiên. KHÔNG sao chép tư thế từ hình ảnh nhân vật gốc được cung cấp.
CỰC KỲ QUAN TRỌNG: Khuôn mặt của người trong ảnh cuối cùng PHẢI khớp chính xác, chân thực với khuôn mặt trong ảnh nhân vật được cung cấp. Không thay đổi các đặc điểm, cấu trúc hoặc biểu cảm của khuôn mặt theo bất kỳ cách nào. Áp dụng khuôn mặt chính xác này vào một cơ thể với một tư thế đứng hoàn toàn mới.
Sử dụng mái tóc từ hình ảnh nhân vật.
Đặt người này vào một bối cảnh thế giới thực mới được tạo ra, phù hợp (như đường phố, studio, hoặc công viên) để bổ sung cho sản phẩm.
Người và sản phẩm phải được nhìn thấy rõ ràng, được chiếu sáng tốt bằng ánh sáng chuyên nghiệp, dịu nhẹ và không bị che khuất.
Toàn bộ cảnh phải chân thực và mang tính điện ảnh, với tỷ lệ chính xác, kết cấu chi tiết và tông màu da tự nhiên.
Người phải ở trung tâm và không bị cắt xén.
Chân của người phải đứng vững trên một bề mặt hợp lý (như sàn nhà, đường phố hoặc mặt đất), không lơ lửng.
Xuất ra một hình ảnh duy nhất, chất lượng cao.`;
};


const DEFAULT_BG_REMOVAL_PROMPT = "Remove the background and the human model from this image. Only keep the clothes (t-shirt and shorts/skirt).";

const DEFAULT_VIDEO_PROMPT_STRUCTURE = `You are an expert film director and a master prompt engineer for text-to-video AI models.
Your task is to generate a professional video prompt (in English) for each scene provided. Each prompt MUST follow a strict 7-part structure to ensure the highest quality video output.

The overall story context is:
"""
{{STORY_CONTEXT}}
"""

For each scene, I will provide a scene description, a starting image, and an ending image. Analyze all this information to create a video prompt that describes the transformation between the two images, keeping the story context in mind.

**CRITICAL 7-PART PROMPT STRUCTURE (YOU MUST FOLLOW THIS FOR EACH SCENE):**

1.  **Main Subject:** Start by identifying the main subject from the reference image. Crucially, you must state to use the *same* subject without re-describing them.
    *   *Example:* "The same woman from the reference image, maintaining identical face, hair, and clothing."

2.  **Action / Movement:** Describe the primary action that occurs between the start and end frames. Use clear, gentle verbs. The movement should be logical and subtle if the images are similar.
    *   *Example:* "She slowly turns her head to the left and smiles softly."

3.  **Camera Movement:** Define the virtual camera's motion. This adds a cinematic feel.
    *   *Example:* "Camera slowly moves forward (dolly-in) to follow her face." or "The camera orbits around the subject in a smooth cinematic motion."

4.  **Camera Angle / Shot Type:** Specify the shot type to guide the AI's framing.
    *   *Example:* "Medium shot at eye level." or "Close-up of her face with shallow depth of field."

5.  **Lighting & Color Mood:** Describe the lighting to match the source images and the story's tone.
    *   *Example:* "Soft warm sunset lighting with golden tones." or "Cool bluish tone with soft ambient light."

6.  **Emotion & Atmosphere:** Convey the feeling of the scene. This should align with the character's actions and the overall story.
    *   *Example:* "A peaceful and nostalgic atmosphere." or "Joyful expression with gentle motion."

7.  **Composition & Consistency:** End with a command to preserve the original image's integrity. This is a crucial final instruction.
    *   *Example:* "Keep the same composition, framing, and background as in the input image. Do not alter the person’s appearance or outfit beyond the described movement."

**OUTPUT FORMAT:**
Return the output ONLY as a valid JSON array of strings. The array must have the same number of elements as the number of scenes provided, and in the same order. Each string in the array is a complete, structured video prompt for one scene.

Example Input: 2 scenes provided.
Example Output: ["(Scene 1 Prompt following all 7 rules)", "(Scene 2 Prompt following all 7 rules)"]

Here are the scenes:
`;


const USER_PREFERENCES_KEY = 'thaiMediaAiUserPreferences';

// Data for background suggestions
const backgroundSuggestions: BackgroundSuggestionCategory[] = [
  {
    category: '1. Bối cảnh Trong nhà (Indoor Settings)',
    subCategories: [
      {
        name: 'Quán cà phê & Nhà hàng',
        items: [
          { label: 'Quán cafe tối giản', prompt: 'a minimalist style cafe' },
          { label: 'Quán cafe ngập nắng', prompt: 'a sun-drenched cafe with large glass windows' },
          { label: 'Góc đọc sách cafe', prompt: 'a reading corner in a cafe' },
          { label: 'Quán cafe sân vườn', prompt: 'a garden cafe' },
          { label: 'Quầy bar của quán cà phê', prompt: 'at the counter of a modern coffee shop' },
          { label: 'Nhà hàng sang trọng', prompt: 'inside a luxurious restaurant' },
          { label: 'Quán ăn ven đường', prompt: 'a cozy roadside diner' },
        ],
      },
      {
        name: 'Không gian gia đình & Căn hộ',
        items: [
          { label: 'Phòng khách hiện đại', prompt: 'a modern, bright living room' },
          { label: 'Bên cửa sổ lớn', prompt: 'standing next to a large window in an apartment' },
          { label: 'Phòng ngủ ấm cúng', prompt: 'in a cozy bedroom' },
          { label: 'Góc bếp sạch sẽ', prompt: 'a clean, tidy kitchen corner' },
          { label: 'Ban công view thành phố', prompt: 'on the balcony of an apartment with a city view' },
          { label: 'Hành lang khách sạn', prompt: 'in a hotel hallway' },
          { label: 'Gác xép nghệ thuật', prompt: 'in an industrial-style loft apartment' },
        ],
      },
      {
        name: 'Không gian công cộng & Thương mại',
        items: [
          { label: 'Trung tâm thương mại', prompt: 'inside a shopping mall' },
          { label: 'Thư viện hiện đại', prompt: 'a modern library with tall bookshelves' },
          { label: 'Bảo tàng nghệ thuật', prompt: 'a contemporary art museum' },
          { label: 'Sảnh khách sạn sang trọng', prompt: 'the lobby of a luxurious hotel' },
          { label: 'Cửa hàng thời trang', prompt: 'in a boutique fashion store' },
          { label: 'Ga tàu điện ngầm', prompt: 'in a clean, modern subway station' },
          { label: 'Nhà kính thực vật', prompt: 'inside a botanical conservatory' },
        ],
      },
    ],
  },
  {
    category: '2. Bối cảnh Ngoài trời (Outdoor Settings)',
    subCategories: [
        {
            name: 'Đường phố/Thành thị',
            items: [
                { label: 'Phố đi bộ nhộn nhịp', prompt: 'a bustling pedestrian street' },
                { label: 'Vỉa hè Paris/Hàn Quốc', prompt: 'the sidewalk of a street in Paris/Korea' },
                { label: 'Tường graffiti nghệ thuật', prompt: 'in front of an artistic graffiti wall' },
                { label: 'Ngõ nhỏ yên tĩnh', prompt: 'a quiet and charming little alley' },
                { label: 'Vạch kẻ đường', prompt: 'crossing the street at a crosswalk' },
                { label: 'Bậc thềm tòa nhà cổ', prompt: 'sitting on the steps of an old building' },
                { label: 'Sân thượng hoàng hôn', prompt: 'on a rooftop with a city sunset view' },
            ],
        },
        {
            name: 'Thiên nhiên & Phong cảnh',
            items: [
                { label: 'Công viên cỏ xanh nắng nhẹ', prompt: 'a park with a lush green lawn and gentle sunlight' },
                { label: 'Vườn hoa rực rỡ', prompt: 'a vibrant, colorful flower garden' },
                { label: 'Bãi biển cát trắng', prompt: 'a white sand beach with blue sea' },
                { label: 'Đường mòn rừng thông', prompt: 'a trail in a pine forest' },
                { label: 'Bên hồ nước trong', prompt: 'standing by a clear, calm blue lake' },
                { label: 'Cánh đồng hoa', prompt: 'in the middle of a lavender or sunflower field' },
                { label: 'Trên cầu gỗ', prompt: 'standing on a small wooden bridge over a stream' },
            ],
        },
        {
            name: 'Địa điểm đặc biệt',
            items: [
                { label: 'Sân chơi trẻ em', prompt: 'a children\'s playground with slides and swings' },
                { label: 'Sân trường học', prompt: 'a deserted schoolyard' },
                { label: 'Sân bóng rổ', prompt: 'an outdoor basketball court' },
                { label: 'Khu cắm trại', prompt: 'a campsite by a lake' },
                { label: 'Chợ đêm lung linh', prompt: 'a night market shimmering with lights' },
                { label: 'Bến du thuyền', prompt: 'at a marina' },
            ],
        },
    ]
  },
  {
    category: '3. Bối cảnh Studio/Tối giản (Studio/Minimalist)',
    subCategories: [
        {
            name: 'Màu trơn',
            items: [
                { label: 'Nền trắng trơn', prompt: 'a plain white studio background' },
                { label: 'Nền xám bê tông', prompt: 'a concrete gray background' },
                { label: 'Nền màu pastel', prompt: 'a pastel-colored background (light pink, light blue, butter yellow)' },
                { label: 'Nền màu đậm', prompt: 'a dark-colored background (teal, burgundy)' },
            ],
        },
        {
            name: 'Kiến trúc',
            items: [
                { label: 'Tường gạch', prompt: 'a brick wall' },
                { label: 'Kiến trúc tối giản', prompt: 'a minimalist architectural setting' },
                { label: 'Cầu thang hiện đại', prompt: 'a modern staircase' },
                { label: 'Cửa vòm', prompt: 'standing in an archway' },
            ],
        },
        {
            name: 'Ánh sáng/Trừu tượng',
            items: [
                { label: 'Nền mờ ảo (bokeh)', prompt: 'a blurry bokeh background' },
                { label: 'Vệt nắng cửa sổ', prompt: 'a background with sun streaks coming through a window' },
                { label: 'Bóng của lá cây', prompt: 'a background with the shadow of palm or tree leaves' },
            ],
        },
    ]
  },
];

const poseSuggestions: BackgroundSuggestionCategory[] = [
  {
    category: '1. Dáng Đứng (Standing Poses)',
    subCategories: [
      {
        name: 'Cơ bản & Tự nhiên',
        items: [
            { label: 'Đứng thẳng, tay buông tự nhiên', prompt: 'standing straight, arms hanging naturally at sides, calm expression' },
            { label: 'Một chân bước nhẹ ra trước', prompt: 'one foot slightly forward, looking directly at the camera' },
            { label: 'Hai tay đút túi quần', prompt: 'both hands in pockets, relaxed style' },
            { label: 'Hai chân mở rộng nhẹ', prompt: 'legs slightly apart, leaning slightly forward' },
            { label: 'Dồn trọng tâm lên một chân', prompt: 'weight on one leg, hip slightly tilted' },
            { label: 'Lưng hơi uốn cong', prompt: 'back slightly arched, natural posture' },
            { label: 'Nghiêng người, một tay trong túi', prompt: 'leaning to one side, one hand in pocket' },
            { label: 'Một đầu gối hơi cong', prompt: 'standing straight, one knee slightly bent' },
            { label: 'Hai tay để sau lưng', prompt: 'both hands behind back, relaxed posture' },
            { label: 'Một tay đút túi, tay kia buông', prompt: 'one hand in pocket, the other arm hanging naturally' },
            { label: 'Hai tay cùng đút túi quần', prompt: 'both hands in pants pockets' },
            { label: 'Một tay đút túi sau', prompt: 'one hand in back pocket, the other hand stroking hair' },
            { label: 'Tay trong túi áo khoác', prompt: 'hand in jacket pocket, cool expression' },
            { label: 'Hai tay đút túi áo', prompt: 'both hands in jacket pockets, looking down' },
            { label: 'Vươn vai nhẹ', prompt: 'stretching gently, relaxed pose' },
            { label: 'Thần thái mạnh mẽ', prompt: 'arms down, looking straight ahead, strong presence' },
        ],
      },
      {
        name: 'Thanh lịch & Studio',
        items: [
            { label: 'Hai tay đan nhẹ trước bụng', prompt: 'hands lightly clasped in front of the stomach, elegant pose' },
            { label: 'Bắt chéo hai chân', prompt: 'legs crossed, hand lightly touching chin' },
            { label: 'Chân bắt chéo, cười nhẹ', prompt: 'legs crossed, a slight smile' },
            { label: 'Một chân co nhẹ', prompt: 'one leg slightly bent, toes pointing inward' },
            { label: 'Một tay vòng trước ngực', prompt: 'one arm across the chest, elegant pose' },
            { label: 'Nắm nhẹ cẳng tay', prompt: 'lightly holding the opposite forearm' },
            { label: 'Hai tay hơi gập trước ngực', prompt: 'arms slightly folded in front of the chest, comfortable' },
            { label: 'Hai tay nhẹ trước bụng', prompt: 'hands gently in front of the stomach, graceful posture' },
            { label: 'Đứng nghiêng, điềm đạm', prompt: 'standing sideways, looking into the distance, calm pose' },
            { label: 'Hai tay chạm nhau phía trước', prompt: 'hands touching in front, standard studio pose' },
            { label: 'Một chân đặt sau', prompt: 'one leg back, straight posture' },
            { label: 'Nắm cổ tay còn lại', prompt: 'one hand holding the other wrist' },
            { label: 'Dáng nghiêng nhẹ, ánh sáng chiếu ngang', prompt: 'slight lean, side lighting' },
            { label: 'Hai tay thả lỏng, bình tĩnh', prompt: 'arms relaxed, calm gaze' },
            { label: 'Đứng yên, khí chất tự tin', prompt: 'standing still, head slightly tilted, confident aura' },
        ],
      },
      {
        name: 'Tương tác & Cử chỉ',
        items: [
            { label: 'Một tay chạm cổ', prompt: 'one hand touching the neck, gaze directed upwards' },
            { label: 'Hai tay chỉnh tay áo', prompt: 'adjusting the sleeves with both hands' },
            { label: 'Một tay vuốt tóc nhẹ', prompt: 'one hand gently stroking hair' },
            { label: 'Cầm nhẹ mép áo', prompt: 'lightly holding the hem of a shirt or jacket' },
            { label: 'Một tay nắm cổ áo', prompt: 'one hand holding the collar' },
            { label: 'Một tay đặt lên ngực', prompt: 'one hand on chest, gentle gaze' },
            { label: 'Ngón tay chạm cằm', prompt: 'fingers lightly touching the chin, thoughtful expression' },
            { label: 'Cử chỉ như đang cầm vật nhỏ', prompt: 'both hands in front as if holding a small object' },
            { label: 'Một tay chạm nhẹ má', prompt: 'one hand lightly touching the cheek' },
            { label: 'Tay đặt lên vai đối diện', prompt: 'hand on the opposite shoulder' },
            { label: 'Hai tay đặt sau đầu', prompt: 'both hands behind the head, free-spirited pose' },
            { label: 'Một tay vươn ra trước', prompt: 'one arm extended forward' },
            { label: 'Một tay chạm cằm (đút túi)', prompt: 'one hand in pocket, the other touching the chin' },
            { label: 'Chạm vào ánh sáng', prompt: 'one arm raised as if touching the light' },
            { label: 'Nhìn xuống bàn tay', prompt: 'standing diagonally, looking down at the hand' },
            { label: 'Đưa tay ra sau đầu', prompt: 'hand behind the head, natural pose' },
            { label: 'Một tay nâng nhẹ tà áo', prompt: 'one hand lightly lifting the hem of the clothing' },
            { label: 'Tay đặt lên ngực, bình an', prompt: 'hand on chest, peaceful expression' },
        ],
      },
      {
        name: 'Năng động & Chuyển động',
        items: [
            { label: 'Xoay nửa người', prompt: 'turning halfway to the side, looking back' },
            { label: 'Dáng bước đi tự nhiên', prompt: 'captured mid-stride, natural walking pose' },
            { label: 'Xoay nhẹ thân trên', prompt: 'slight upper body twist, one arm raised high' },
            { label: 'Quay người, áo lay động', prompt: 'slight turn, clothes moving naturally' },
            { label: 'Một tay vẫy', prompt: 'one arm raised as if waving' },
            { label: 'Quay đầu nhanh', prompt: 'turning head quickly towards the camera' },
            { label: 'Bước tới, tập trung', prompt: 'stepping forward, focused gaze' },
            { label: 'Quay nhẹ, váy bay', prompt: 'slight turn, shirt or skirt gently flowing' },
            { label: 'Bước mạnh về phía trước', prompt: 'striding forward, wind gently blowing the clothes' },
            { label: 'Đứng xoay chéo người', prompt: 'standing with a diagonal twist, motion pose' },
            { label: 'Một tay vung nhẹ', prompt: 'one arm swinging slightly, hair in motion' },
            { label: 'Nhún nhẹ một bên hông', prompt: 'a slight hip pop pose' },
            { label: 'Bước ngang', prompt: 'stepping sideways, gaze following the direction of the step' },
            { label: 'Quay người ¾', prompt: 'three-quarter turn, arm slightly raised' },
            { label: 'Dáng như đang chuyển bước', prompt: 'a pose as if in transition between steps' },
            { label: 'Xoay đầu và hông ngược hướng', prompt: 'slight turn of head and hips in opposite directions' },
            { label: 'Đón gió', prompt: 'arms slightly spread as if embracing the wind' },
            { label: 'Dừng giữa bước đi', prompt: 'a pose as if paused mid-walk' },
        ],
      },
      {
        name: 'Tự tin & Quyền lực',
        items: [
            { label: 'Khoanh tay trước ngực', prompt: 'arms crossed in front of the chest, confident expression' },
            { label: 'Hơi ngả người ra sau', prompt: 'leaning back slightly, arms crossed' },
            { label: 'Hai tay chống eo', prompt: 'both hands on hips, powerful stance' },
            { label: 'Một tay giơ cao qua đầu', prompt: 'one arm raised high above the head' },
            { label: 'Hai tay mở nhẹ hai bên', prompt: 'arms slightly open to the sides' },
            { label: 'Một tay duỗi ngang vai', prompt: 'one arm extended horizontally at shoulder level' },
            { label: 'Một tay chống hông', prompt: 'one hand on hip' },
            { label: 'Nghiêng người, tay đặt lên đùi', prompt: 'leaning to one side, hand on thigh' },
            { label: 'Xoay hông, hai tay chống hông', prompt: 'hip twist, both hands on hips' },
            { label: 'Bước lùi nhẹ', prompt: 'stepping back slightly, confident expression' },
            { label: 'Một chân co, giữ thăng bằng', prompt: 'one leg bent, arms balancing' },
            { label: 'Đứng xoay lưng, nhìn qua vai', prompt: 'standing with back turned, looking over the shoulder' },
        ],
      },
       {
        name: 'Hướng nhìn & Biểu cảm',
        items: [
            { label: 'Nhìn qua vai, tay đút túi', prompt: 'looking over the shoulder, one hand in pocket' },
            { label: 'Đầu hơi cúi xuống', prompt: 'standing straight, head slightly bowed' },
            { label: 'Nhìn nghiêng sang bên', prompt: 'looking to the side' },
            { label: 'Một chân kiễng nhẹ', prompt: 'one foot on tiptoe, head turned to the side' },
            { label: 'Cằm nâng nhẹ', prompt: 'chin slightly raised, confident gaze' },
            { label: 'Nghiêng đầu, cười nhẹ', prompt: 'head tilted to the side, slight smile' },
            { label: 'Nhìn xuống sàn', prompt: 'looking down at the floor, natural look' },
            { label: 'Nhìn xa sang trái', prompt: 'looking far to the left' },
            { label: 'Quay đầu ra sau, tinh nghịch', prompt: 'looking back, playful expression' },
            { label: 'Nhìn qua vai về phía máy ảnh', prompt: 'looking over the shoulder towards the camera' },
            { label: 'Cúi nhẹ đầu, nghiêm túc', prompt: 'slight bow of the head, serious gaze' },
            { label: 'Nhìn lên trời, mơ màng', prompt: 'looking up at the sky, dreamy expression' },
            { label: 'Đầu nghiêng nhẹ, thư giãn', prompt: 'head slightly tilted, relaxed face' },
            { label: 'Dáng thẳng, ánh nhìn trung tính', prompt: 'straight posture, neutral gaze' },
            { label: 'Mắt nhắm, gió lùa tóc', prompt: 'standing sideways, eyes closed, wind in hair' },
        ],
      },
    ],
  },
];

const styleSuggestions: BackgroundSuggestionCategory[] = [
  {
    category: '1. Phong cách Ảnh (Photography Style)',
    subCategories: [
      {
        name: 'Hiện đại & Tạp chí',
        items: [
          { label: 'Lookbook Tạp chí', prompt: 'style of a high-fashion magazine lookbook, clean, sharp focus' },
          { label: 'Chân dung biên tập', prompt: 'editorial portrait style, professional lighting' },
          { label: 'Phong cách đường phố', prompt: 'street style photography, dynamic, urban feel' },
          { label: 'Tối giản sạch sẽ', prompt: 'clean minimalist aesthetic, lots of negative space' },
        ],
      },
      {
        name: 'Cổ điển & Nghệ thuật',
        items: [
          { label: 'Màu phim cổ điển', prompt: 'shot on Kodak Portra 400 film, vintage aesthetic, grainy texture' },
          { label: 'Cảm giác điện ảnh', prompt: 'cinematic style, dramatic lighting, wide-angle shot' },
          { label: 'Mơ màng & Mềm mại', prompt: 'dreamy and soft-focus effect, ethereal mood' },
          { label: 'Ảnh đen trắng', prompt: 'a classic black and white photograph' },
        ],
      },
    ],
  },
  {
    category: '2. Ánh sáng (Lighting)',
    subCategories: [
      {
        name: 'Tự nhiên',
        items: [
          { label: 'Giờ vàng', prompt: 'lit by warm, golden hour sunlight' },
          { label: 'Ánh sáng cửa sổ', prompt: 'soft, natural window light' },
          { label: 'Ngày u ám', prompt: 'overcast day lighting, soft shadows' },
          { label: 'Nắng gắt', prompt: 'harsh, direct sunlight creating strong shadows' },
        ],
      },
      {
        name: 'Nhân tạo',
        items: [
          { label: 'Ánh sáng Studio', prompt: 'professional studio lighting, softbox' },
          { label: 'Đèn Neon', prompt: 'illuminated by neon city lights, vibrant colors' },
          { label: 'Đèn sân khấu', prompt: 'dramatic spotlight effect' },
          { label: 'Ánh sáng từ đèn đường', prompt: 'lit by a single streetlight at night' },
        ],
      },
    ],
  },
   {
    category: '3. Cử chỉ Tay (Hand Gestures)',
    subCategories: [
      {
        name: 'Tự nhiên & Thư giãn',
        items: [
          { label: 'Tay trong túi quần', prompt: 'one or both hands in pockets' },
          { label: 'Tay buông lỏng tự nhiên', prompt: 'hands relaxed and hanging naturally at the sides' },
          { label: 'Chạm nhẹ vào tóc', prompt: 'hand gently touching the hair' },
          { label: 'Khoanh tay hờ', prompt: 'arms loosely crossed' },
          { label: 'Nắm nhẹ cổ tay', prompt: 'one hand gently holding the other wrist' },
          { label: 'Tay để sau lưng', prompt: 'hands behind the back' },
          { label: 'Cầm nhẹ gấu áo', prompt: 'lightly holding the hem of the shirt/jacket' },
          { label: 'Dựa tay vào tường', prompt: 'hand casually leaning against a wall' },
        ],
      },
      {
        name: 'Thanh lịch & Tinh tế',
        items: [
          { label: 'Tay chạm nhẹ cằm', prompt: 'fingers lightly touching the chin' },
          { label: 'Tay đặt lên xương quai xanh', prompt: 'hand resting on the collarbone' },
          { label: 'Chỉnh sửa khuy măng sét', prompt: 'adjusting a cufflink or sleeve' },
          { label: 'Tay đặt hờ lên vai', prompt: 'hand gently placed on the opposite shoulder' },
          { label: 'Các ngón tay đan nhẹ', prompt: 'fingers lightly interlaced' },
          { label: 'Cầm một bông hoa', prompt: 'holding a single flower' },
          { label: 'Chạm nhẹ vào môi', prompt: 'finger lightly touching the lips' },
        ],
      },
    ]
  },
  {
    category: '4. Chi tiết & Hành động (Details & Action)',
    subCategories: [
      {
        name: 'Tương tác & Đạo cụ',
        items: [
          { label: 'Cầm ly cà phê', prompt: 'person is holding a cup of coffee' },
          { label: 'Đọc sách', prompt: 'person is reading a book' },
          { label: 'Nghe nhạc', prompt: 'person is wearing headphones, listening to music' },
          { label: 'Ăn kem', prompt: 'person is eating an ice cream cone' },
          { label: 'Đi xe đạp', prompt: 'person is standing next to a bicycle' },
          { label: 'Tương tác với thú cưng', prompt: 'person is petting a dog' },
          { label: 'Cầm máy ảnh phim', prompt: 'person is holding a vintage film camera' },
          { label: 'Thổi bong bóng', prompt: 'person is blowing soap bubbles' },
          { label: 'Ngồi trên xích đu', prompt: 'person is sitting on a swing' },
          { label: 'Mỉm cười rạng rỡ', prompt: 'a big, genuine smile on the person\'s face' },
        ],
      },
      {
        name: 'Yếu tố môi trường & Cảm xúc',
        items: [
          { label: 'Cánh hoa bay', prompt: 'with flower petals gently falling in the air' },
          { label: 'Hiệu ứng gió', prompt: 'a gentle breeze blowing through the hair and clothes' },
          { label: 'Phản chiếu vũng nước', prompt: 'reflection in a puddle on the ground' },
          { label: 'Tia nắng xuyên lá', prompt: 'sunbeams filtering through tree leaves' },
          { label: 'Đèn neon thành phố', prompt: 'blurry neon city lights in the background' },
          { label: 'Mưa nhẹ', prompt: 'in a light rain, holding a clear umbrella' },
          { label: 'Nhìn xa xăm', prompt: 'a thoughtful expression, looking into the distance' },
          { label: 'Sương mù buổi sáng', prompt: 'a misty morning atmosphere' },
          { label: 'Bong bóng bay', prompt: 'colorful balloons floating around' },
          { label: 'Bồ câu bay', prompt: 'a flock of pigeons taking flight in the background' },
        ],
      },
    ]
  }
];

// Data for Product Usage suggestions (Custom tab)
const productUsageSuggestions: BackgroundSuggestionCategory[] = [
    {
        category: 'Cách sử dụng sản phẩm',
        subCategories: [
            {
                name: 'Tương tác trực tiếp',
                items: [
                    { label: 'Mặc lên người', prompt: 'wearing the clothing item' },
                    { label: 'Đeo/mang trên người', prompt: 'wearing the accessory (like a watch, bag, or glasses)' },
                    { label: 'Cầm sản phẩm trên tay', prompt: 'holding the product naturally in their hand' },
                    { label: 'Giơ sản phẩm lên ngang tầm mắt', prompt: 'holding the product up near their face, looking at it or the camera' },
                    { label: 'Thoa sản phẩm lên mặt', prompt: 'applying the product gently to their face' },
                    { label: 'Thoa sản phẩm lên tay/cơ thể', prompt: 'applying the product to their arm or body' },
                    { label: 'Sử dụng trên tóc', prompt: 'using the product on their hair' },
                    { label: 'Xịt sản phẩm', prompt: 'spraying the product into the air or onto themselves' },
                    { label: 'Ăn hoặc uống sản phẩm', prompt: 'eating or drinking the product in a pleasant manner' },
                    { label: 'Mở nắp sản phẩm', prompt: 'in the middle of opening the product container' },
                ]
            },
            {
                name: 'Tương tác gián tiếp',
                items: [
                    { label: 'Sản phẩm đặt cạnh người mẫu', prompt: 'with the product placed neatly on a surface beside them' },
                    { label: 'Chỉ tay vào sản phẩm', prompt: 'pointing towards the product which is placed nearby' },
                    { label: 'Nhìn vào sản phẩm', prompt: 'looking down at the product with interest' },
                    { label: 'Sản phẩm là một phần của bối cảnh', prompt: 'with the product integrated as part of the background scene' },
                    { label: 'Sản phẩm trong giỏ hàng', prompt: 'placing the product into a shopping basket or bag' },
                    { label: 'Tương tác với kết quả của sản phẩm', prompt: 'showcasing the result of using the product (e.g., smooth skin, shiny hair)' },
                ]
            },
            {
                name: 'Sáng tạo & Trừu tượng',
                items: [
                    { label: 'Sản phẩm bay lơ lửng', prompt: 'with the product floating magically in the air near them' },
                    { label: 'Tương tác với phiên bản lớn', prompt: 'interacting with a giant, oversized version of the product' },
                    { label: 'Nền là họa tiết sản phẩm', prompt: 'with the background being a pattern derived from the product\'s packaging or texture' },
                    { label: 'Vui đùa với sản phẩm', prompt: 'playfully interacting with the product' },
                ]
            }
        ]
    }
];

// Data for Edit Mode suggestions
const editSuggestionCategories = [
  {
    category: '🧩 1️⃣ Mở rộng bối cảnh (Background Expansion)',
    items: [
      { label: 'Mở rộng hai bên', prompt: 'Mở rộng bối cảnh sang trái và phải, thêm không gian tự nhiên phù hợp với tông màu gốc.' },
      { label: 'Mở rộng trên dưới', prompt: 'Extend the scene upward and outward, keeping the lighting and style consistent.' },
      { label: 'Tạo không gian rộng', prompt: 'Mở rộng khung cảnh phía sau người mẫu để tạo cảm giác rộng hơn, giữ nguyên ánh sáng studio.' }
    ]
  },
  {
    category: '👒 2️⃣ Thêm phụ kiện hoặc chi tiết nhỏ',
    items: [
      { label: 'Thêm túi xách', prompt: 'Add a stylish handbag hanging from her arm.' },
      { label: 'Thêm mũ rơm', prompt: 'Thêm chiếc mũ rơm nhỏ trên đầu cô gái, ánh sáng khớp với hướng chiếu gốc.' },
      { label: 'Thêm vòng cổ', prompt: 'Add a delicate necklace to the model, same color tone as outfit.' },
      { label: 'Thêm tách cà phê', prompt: 'Đặt thêm tách cà phê nhỏ trên bàn cạnh nhân vật.' }
    ]
  },
  {
    category: '🪞 3️⃣ Thay đổi ánh sáng hoặc tông màu',
    items: [
      { label: 'Ánh sáng hoàng hôn', prompt: 'Change lighting to warm golden sunset tone.' },
      { label: 'Ánh sáng buổi sáng', prompt: 'Thay ánh sáng studio bằng ánh sáng tự nhiên buổi sáng.' },
      { label: 'Tông màu điện ảnh', prompt: 'Convert image tone to cinematic moody style with soft shadows.' }
    ]
  },
  {
    category: '🌿 4️⃣ Thay đổi hoặc mở rộng nền',
    items: [
      { label: 'Thay bằng phòng khách', prompt: 'Replace background with a cozy living room, keeping lighting direction consistent.' },
      { label: 'Thay bằng bãi biển', prompt: 'Thay nền thành bãi biển buổi sáng, ánh sáng tự nhiên.' },
      { label: 'Mở rộng kiểu đường phố', prompt: 'Expand background with urban street style, same depth of field.' }
    ]
  },
  {
    category: '🎨 5️⃣ Điều chỉnh tư thế hoặc biểu cảm nhẹ',
    items: [
      { label: 'Cười nhẹ', prompt: 'Make the model smile slightly, keeping same face shape.' },
      { label: 'Nghiêng đầu', prompt: 'Nghiêng đầu nhân vật nhẹ sang trái, giữ nguyên ánh nhìn.' },
      { label: 'Tay chống hông', prompt: 'Slightly adjust the hand position to rest on the hip.' }
    ]
  },
  {
    category: '🌸 6️⃣ Biến thể thời trang / phong cách',
    items: [
      { label: 'Đổi thành váy lụa trắng', prompt: 'Change outfit to a white silk dress, same pose and background.' },
      { label: 'Đổi thành áo cardigan', prompt: 'Thay áo khoác bằng cardigan màu be, giữ nguyên ánh sáng và dáng đứng.' }
    ]
  },
  {
    category: '🕊️ 7️⃣ Làm sạch ảnh, tinh chỉnh chất lượng',
    items: [
      { label: 'Tăng độ trong & làm mịn', prompt: 'Enhance image clarity and smooth out shadows.' },
      { label: 'Xóa nhiễu', prompt: 'Xóa các vết nhiễu, giữ nguyên chi tiết da và chất vải.' },
      { label: 'Làm sạch & tăng nét', prompt: 'Clean background imperfections and improve sharpness.' }
    ]
  },
  {
    category: '✨ 8️⃣ Thêm hiệu ứng nghệ thuật hoặc môi trường',
    items: [
      { label: 'Thêm tia nắng', prompt: 'Add gentle sunlight rays filtering through trees.' },
      { label: 'Thêm khói mờ', prompt: 'Thêm làn khói mờ nhẹ phía sau nhân vật.' },
      { label: 'Thêm hạt vàng', prompt: 'Add golden particles floating in the air for cinematic effect.' }
    ]
  }
];

const bgRemovalSuggestions = [
    { label: 'Chỉ giữ lại áo', prompt: 'Remove the background and the human model from this image. Only keep the shirt.' },
    { label: 'Chỉ giữ lại quần', prompt: 'Remove the background and the human model from this image. Only keep the pants.' },
    { label: 'Chỉ giữ lại váy', prompt: 'Remove the background and the human model from this image. Only keep the dress.' },
    { label: 'Giữ lại bộ quần áo', prompt: 'Remove the background and the human model from this image. Only keep the clothes (the full outfit).' },
    { label: 'Giữ lại giày', prompt: 'Remove the background and the human model from this image. Only keep the shoes.' },
    { label: 'Giữ lại túi xách', prompt: 'Remove the background and the human model from this image. Only keep the handbag.' },
];

const DEFAULT_API_KEYS = [
    'AIzaSyBJvGraEh97T9mUcBMtLOlLHOYdXs28_uA',
    'AIzaSyAeNUn9DCqW8rs8zQ9NZRZtAdGhgn3MZN8',
    'AIzaSyBhXmhZTlostcx69Q2TXwBR4zvW_JnkW-w',
    'AIzaSyDkMPmL29aVVTIAPkgv8aArcRnDDtTQ5Zk'
];

// --- Translation and Reference Helpers ---
const allSuggestions = [...backgroundSuggestions, ...poseSuggestions, ...styleSuggestions, ...productUsageSuggestions];
const promptToLabelMap = new Map<string, string>();
const labelToPromptMap = new Map<string, string>();

allSuggestions.forEach(category => 
    category.subCategories.forEach(subCategory => 
        subCategory.items.forEach(item => {
            promptToLabelMap.set(item.prompt, item.label);
            labelToPromptMap.set(item.label, item.prompt);
        })
    )
);

const getLabelFromPrompt = (prompt: string): string => promptToLabelMap.get(prompt) || prompt;
const getPromptFromLabel = (label: string): string => labelToPromptMap.get(label) || label;

const combineReferencesForDisplay = (bg: string, pose: string, style: string, usage?: string): string => {
    return [getLabelFromPrompt(bg), getLabelFromPrompt(pose), getLabelFromPrompt(style), usage ? getLabelFromPrompt(usage) : '']
        .filter(Boolean)
        .join(', ');
};

const parseCombinedReferenceForApi = (combinedString: string): string => {
    return combinedString
        .split(',')
        .map(label => label.trim())
        .filter(Boolean)
        .map(label => getPromptFromLabel(label))
        .join(', ');
};
// --- End of Helpers ---


const allBackgroundPrompts = backgroundSuggestions.flatMap(category => 
    category.subCategories.flatMap(subCategory => 
        subCategory.items.map(item => item.prompt)
    )
);

const allPosePrompts = poseSuggestions.flatMap(category => 
    category.subCategories.flatMap(subCategory => 
        subCategory.items.map(item => item.prompt)
    )
);

const getRandomBackgroundPrompt = (): string => {
    if (allBackgroundPrompts.length === 0) {
        return 'a random real-world background'; // Fallback
    }
    const randomIndex = Math.floor(Math.random() * allBackgroundPrompts.length);
    return allBackgroundPrompts[randomIndex];
};

const POSE_VARIATION_PROMPTS = [
  "change the camera angle slightly, for example a lower or higher angle",
  "use a slightly different, more dynamic full-body standing pose",
  "show a different facial expression, like a subtle smile or a more thoughtful look",
  "shift the body weight to the other leg for a new, natural pose",
  "turn the body slightly away from or towards the camera",
  "change the model's head tilt slightly",
  "try a pose with one hand on the hip or in a pocket",
  "capture the model as if they are in the middle of a natural movement",
];

const getRandomPoseVariationPrompt = (): string => {
    const randomIndex = Math.floor(Math.random() * POSE_VARIATION_PROMPTS.length);
    return POSE_VARIATION_PROMPTS[randomIndex];
};

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}


// Function to get initial state from localStorage
const getInitialState = () => {
  try {
    const item = window.localStorage.getItem(USER_PREFERENCES_KEY);
    if (item) {
      const parsed = JSON.parse(item);
      const fashionBg = parsed.fashionBackgroundReference ?? '';
      const fashionPose = parsed.fashionPoseReference ?? '';
      const fashionStyle = parsed.fashionStyleReference ?? '';
      const customBg = parsed.customBackgroundReference ?? '';
      const customPose = parsed.customPoseReference ?? '';
      const customStyle = parsed.customStyleReference ?? '';
      const customUsage = parsed.customProductUsageReference ?? '';
      const aspectRatio = parsed.fashionAspectRatio ?? '9:16';
      
      return {
        fashionPromptVi: parsed.fashionPromptVi ?? getFashionPromptVi(aspectRatio),
        fashionPromptEn: parsed.fashionPromptEn ?? getFashionPromptEn(aspectRatio),
        fashionNegativePrompt: parsed.fashionNegativePrompt ?? '',
        fashionBgRemovalPrompt: parsed.fashionBgRemovalPrompt ?? DEFAULT_BG_REMOVAL_PROMPT,
        fashionBackgroundReference: fashionBg,
        fashionPoseReference: fashionPose,
        fashionStyleReference: fashionStyle,
        fashionCombinedReference: combineReferencesForDisplay(fashionBg, fashionPose, fashionStyle),
        fashionAspectRatio: aspectRatio,

        customPromptVi: parsed.customPromptVi ?? getCustomPromptVi(aspectRatio),
        customPromptEn: parsed.customPromptEn ?? getCustomPromptEn(aspectRatio),
        customNegativePrompt: parsed.customNegativePrompt ?? '',
        customBgRemovalPrompt: parsed.customBgRemovalPrompt ?? DEFAULT_BG_REMOVAL_PROMPT,
        customBackgroundReference: customBg,
        customPoseReference: customPose,
        customStyleReference: customStyle,
        customProductUsageReference: customUsage,
        customCombinedReference: combineReferencesForDisplay(customBg, customPose, customStyle, customUsage),

        autoSaveToGallery: parsed.autoSaveToGallery ?? true,
        autoDownloadAll: parsed.autoDownloadAll ?? false,
        skipBgRemoval: parsed.skipBgRemoval ?? false,
        apiKeys: parsed.apiKeys ?? DEFAULT_API_KEYS,
        maxConcurrency: parsed.maxConcurrency ?? 2,
        useDefaultApiKey: parsed.useDefaultApiKey ?? true,
        videoPromptStructure: parsed.videoPromptStructure ?? DEFAULT_VIDEO_PROMPT_STRUCTURE,
      };
    }
  } catch (error) {
    console.warn('Error reading user preferences from localStorage', error);
  }
  const defaultAspectRatio = '9:16';
  return {
    fashionPromptVi: getFashionPromptVi(defaultAspectRatio),
    fashionPromptEn: getFashionPromptEn(defaultAspectRatio),
    fashionNegativePrompt: '',
    fashionBgRemovalPrompt: DEFAULT_BG_REMOVAL_PROMPT,
    fashionBackgroundReference: '',
    fashionPoseReference: '',
    fashionStyleReference: '',
    fashionCombinedReference: '',
    fashionAspectRatio: defaultAspectRatio,

    customPromptVi: getCustomPromptVi(defaultAspectRatio),
    customPromptEn: getCustomPromptEn(defaultAspectRatio),
    customNegativePrompt: '',
    customBgRemovalPrompt: DEFAULT_BG_REMOVAL_PROMPT,
    customBackgroundReference: '',
    customPoseReference: '',
    customStyleReference: '',
    customProductUsageReference: '',
    customCombinedReference: '',
    
    autoSaveToGallery: true,
    autoDownloadAll: false,
    skipBgRemoval: false,
    apiKeys: DEFAULT_API_KEYS,
    maxConcurrency: 2,
    useDefaultApiKey: true,
    videoPromptStructure: DEFAULT_VIDEO_PROMPT_STRUCTURE,
  };
};

interface ProgressState {
  total: number;
  completed: number;
  errors: number;
}

const ColumnHeader: React.FC<{ step: number, title: string, subtitle: string, color: string, icon: React.ReactNode }> = ({ step, title, subtitle, color, icon }) => (
    <div className={`relative flex items-center p-4 mb-2 bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden`}>
        <div className={`absolute -right-1/4 top-0 bottom-0 w-1/2 bg-gradient-to-l from-transparent to-${color}-900/40 opacity-50 blur-3xl`}></div>
        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${color}-500`}></div>
        
        <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-gray-900/50 border border-${color}-500/50 text-${color}-400 mr-4`}>
            {icon}
        </div>
        <div className="z-10">
            <h2 className={`text-xs font-bold uppercase tracking-wider text-${color}-400`}>BƯỚC {step}</h2>
            <p className="text-lg font-semibold text-gray-200">{title}</p>
        </div>
    </div>
);


const GenerationSettings: React.FC<{
  seed: number;
  onSeedChange: (seed: number) => void;
  onRandomizeSeed: () => void;
  variants: number;
  onVariantsChange: (variants: number) => void;
  disabled?: boolean;
}> = ({ seed, onSeedChange, onRandomizeSeed, variants, onVariantsChange, disabled }) => {
  const handleSeedInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      onSeedChange(value);
    } else if (e.target.value === '') {
      onSeedChange(0);
    }
  };

  const incrementVariants = () => onVariantsChange(variants + 1);
  const decrementVariants = () => onVariantsChange(Math.max(1, variants - 1));

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
            <label htmlFor="seed-input" className="block text-sm font-medium text-gray-300">Seed</label>
            <Tooltip content="'Seed' là một mã số định danh cho một bức ảnh. Cùng một câu lệnh và cùng một seed sẽ luôn tạo ra cùng một kết quả. Thay đổi seed để tạo ra một ảnh hoàn toàn khác." />
        </div>
        <div className="flex items-center">
          <input
            id="seed-input"
            type="number"
            value={seed}
            onChange={handleSeedInputChange}
            className="block w-full rounded-l-md bg-gray-800 border-gray-600 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm p-2"
            disabled={disabled}
          />
          <button
            onClick={onRandomizeSeed}
            disabled={disabled}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-r-md border border-l-0 border-gray-600 disabled:opacity-50"
            aria-label="Randomize Seed"
          >
            <RegenerateIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-2">
            <label htmlFor="variants-input" className="block text-sm font-medium text-gray-300">Số lượng biến thể</label>
            <Tooltip content="Số lượng phiên bản ảnh sẽ được tạo cho mỗi sản phẩm. Các biến thể sẽ có cùng bối cảnh nhưng khác nhau về tư thế và biểu cảm." />
        </div>
        <div className="flex items-center">
          <button
            onClick={decrementVariants}
            disabled={disabled || variants <= 1}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-l-md border border-r-0 border-gray-600 disabled:opacity-50"
            aria-label="Decrease variants"
          >
            -
          </button>
          <input
            id="variants-input"
            type="number"
            readOnly
            value={variants}
            className="block w-full bg-gray-800 border-y border-gray-600 text-center focus:outline-none sm:text-sm p-2"
            disabled={disabled}
          />
          <button
            onClick={incrementVariants}
            disabled={disabled}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-r-md border border-l-0 border-gray-600 disabled:opacity-50"
            aria-label="Increase variants"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

interface AdvancedPromptPanelProps {
    promptVi: string;
    onPromptViChange: (value: string) => void;
    onPromptEnChange: (value: string) => void;
    negativePrompt: string;
    onNegativePromptChange: (value: string) => void;
    bgRemovalPrompt: string;
    onBgRemovalPromptChange: (value: string) => void;
    onSuggestPrompts: () => void;
    isSuggestingPrompts: boolean;
    isLoading: boolean;
    backgroundReferenceImage: string | null;
    suggestedPrompts: Array<{ en: string; vi: string }>;
    onSuggestedPromptClick: (prompt: { en: string; vi: string }) => void;
    canSuggest: boolean;
    onResetPrompt: () => void;
    onResetBgRemovalPrompt: () => void;
}

const AdvancedPromptPanel: React.FC<AdvancedPromptPanelProps> = ({
    promptVi, onPromptViChange, onPromptEnChange,
    negativePrompt, onNegativePromptChange,
    bgRemovalPrompt, onBgRemovalPromptChange,
    onSuggestPrompts, isSuggestingPrompts, isLoading, backgroundReferenceImage,
    suggestedPrompts, onSuggestedPromptClick, canSuggest, onResetPrompt,
    onResetBgRemovalPrompt
}) => (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>
            <h3 className="text-md font-semibold text-gray-200">Tùy chỉnh nâng cao</h3>
        </div>
        
        <div className="space-y-4">
            <div>
                 <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <label htmlFor="prompt-input" className="block text-sm font-medium text-gray-300">Mô tả (Prompt)</label>
                        <Tooltip content="Đây là câu lệnh chính chỉ dẫn cho AI. Bạn có thể chỉnh sửa trực tiếp hoặc sử dụng các gợi ý để thay đổi nó. Câu lệnh càng chi tiết, kết quả càng chính xác." />
                    </div>
                    <button
                        onClick={onResetPrompt}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-cyan-400 transition-colors"
                        title="Khôi phục prompt mặc định"
                    >
                        <ResetIcon className="w-4 h-4" />
                        Khôi phục
                    </button>
                </div>
                <textarea 
                    id="prompt-input" 
                    rows={8} 
                    className="block w-full rounded-md bg-gray-800 border-gray-600 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-gray-100 p-2" 
                    value={promptVi} 
                    onChange={(e) => {
                        onPromptViChange(e.target.value);
                        onPromptEnChange(e.target.value);
                    }} 
                    placeholder="VD: một người mẫu mặc trang phục mùa hè đi dạo trên bãi biển lúc hoàng hôn..."
                    disabled={isLoading || !!backgroundReferenceImage} 
                />
                {backgroundReferenceImage && <p className="mt-2 text-xs text-yellow-400">Câu lệnh chính bị vô hiệu hóa khi sử dụng ảnh nền tham chiếu.</p>}
            </div>

            <div className="relative">
                <button
                    onClick={onSuggestPrompts}
                    disabled={isLoading || isSuggestingPrompts || !canSuggest}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                    {isSuggestingPrompts ? (
                        <SpinnerIcon className="w-5 h-5 animate-spin" />
                    ) : (
                        <SparklesIcon className="w-5 h-5" />
                    )}
                    Gợi ý Prompt
                </button>
                <div className="absolute top-1/2 right-4 -translate-y-1/2">
                    <Tooltip content="Yêu cầu AI phân tích ảnh sản phẩm, người mẫu và các tham chiếu bạn đã chọn để tự động tạo ra 4 câu lệnh chuyên nghiệp và sáng tạo." />
                </div>
            </div>

             {suggestedPrompts.length > 0 && !isSuggestingPrompts && (
                <div className="mt-4 space-y-2 pt-4 border-t border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-300">Chọn một gợi ý:</h4>
                    {suggestedPrompts.map((p, index) => (
                        <button
                            key={index}
                            onClick={() => onSuggestedPromptClick(p)}
                            className="w-full text-left p-3 bg-gray-700 hover:bg-cyan-600/50 rounded-lg text-sm text-gray-300 transition-colors"
                        >
                            {p.vi}
                        </button>
                    ))}
                </div>
            )}

            <details className="bg-gray-900/30 border border-gray-700 rounded-lg transition-colors p-1">
               <summary className="px-4 py-3 text-sm font-semibold cursor-pointer text-gray-300 hover:text-white list-none flex justify-between items-center">Prompt phụ (Loại bỏ, Tách nền)</summary>
               <div className="p-4 border-t border-gray-600 space-y-4">
                  <div>
                    <label htmlFor="negative-prompt-input" className="block text-sm font-medium text-gray-300 mb-2">Yếu tố cần loại bỏ (Tùy chọn)</label>
                    <input id="negative-prompt-input" type="text" className="block w-full rounded-md bg-gray-800 border-gray-600 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm p-2" value={negativePrompt} onChange={(e) => onNegativePromptChange(e.target.value)} placeholder="Ví dụ: chữ, logo, người khác..." disabled={isLoading}/>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                        <label htmlFor="bg-prompt-display" className="block text-sm font-medium text-gray-300">Câu lệnh tách nền</label>
                        <button
                            onClick={onResetBgRemovalPrompt}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-cyan-400 transition-colors"
                            title="Khôi phục prompt tách nền mặc định"
                        >
                            <ResetIcon className="w-4 h-4" />
                            Khôi phục
                        </button>
                    </div>
                    <textarea id="bg-prompt-display" rows={4} className="block w-full rounded-md bg-gray-800 border-gray-600 sm:text-sm p-2 focus:border-cyan-500 focus:ring-cyan-500" value={bgRemovalPrompt} onChange={(e) => onBgRemovalPromptChange(e.target.value)} disabled={isLoading}/>
                    <ProductPromptSuggestions suggestions={bgRemovalSuggestions} onSelect={onBgRemovalPromptChange} />
                  </div>
              </div>
            </details>
        </div>
    </div>
);


const App: React.FC = () => {
  const initialState = useRef(getInitialState());

  // Common state
  const [backgroundReferenceImage, setBackgroundReferenceImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [activeGeneratedImage, setActiveGeneratedImage] = useState<GeneratedImage | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSaveToGallery, setAutoSaveToGallery] = useState<boolean>(initialState.current.autoSaveToGallery);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [lastUsedProductImage, setLastUsedProductImage] = useState<string | null>(null);
  const [activeTransparentProductImage, setActiveTransparentProductImage] = useState<string | null>(null);
  const [activeOriginalProductImage, setActiveOriginalProductImage] = useState<string | null>(null);
  const [autoDownloadAll, setAutoDownloadAll] = useState<boolean>(initialState.current.autoDownloadAll);
  const [progressState, setProgressState] = useState<ProgressState>({ total: 0, completed: 0, errors: 0 });
  const [skipBgRemoval, setSkipBgRemoval] = useState<boolean>(initialState.current.skipBgRemoval);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [transparentImageBgColor, setTransparentImageBgColor] = useState<string>('bg-gray-800');
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 100000));
  const [numberOfVariants, setNumberOfVariants] = useState<number>(1);
  const [isSuggestingPrompts, setIsSuggestingPrompts] = useState<boolean>(false);

  // API and Settings state
  const [apiKeys, setApiKeys] = useState<string[]>(initialState.current.apiKeys);
  const [maxConcurrency, setMaxConcurrency] = useState<number>(initialState.current.maxConcurrency);
  const [useDefaultApiKey, setUseDefaultApiKey] = useState<boolean>(initialState.current.useDefaultApiKey);
  const [activeTab, setActiveTab] = useState<'creator' | 'settings'>('creator');
  
  // Tab-specific state
  const [column1Tab, setColumn1Tab] = useState<'fashion' | 'custom' | 'text-to-image'>('fashion');
  const [isReferenceModalOpen, setIsReferenceModalOpen] = useState<boolean>(false);
  
  // Fashion tab state
  const [fashionCharacterImage, setFashionCharacterImage] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<ProductImageFile[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [fashionPromptEn, setFashionPromptEn] = useState<string>(initialState.current.fashionPromptEn);
  const [fashionPromptVi, setFashionPromptVi] = useState<string>(initialState.current.fashionPromptVi);
  const [fashionNegativePrompt, setFashionNegativePrompt] = useState<string>(initialState.current.fashionNegativePrompt);
  const [fashionBgRemovalPrompt, setFashionBgRemovalPrompt] = useState<string>(initialState.current.fashionBgRemovalPrompt);
  const [fashionSuggestedPrompts, setFashionSuggestedPrompts] = useState<Array<{ en: string; vi: string }>>([]);
  const [fashionBackgroundReference, setFashionBackgroundReference] = useState<string>(initialState.current.fashionBackgroundReference);
  const [fashionPoseReference, setFashionPoseReference] = useState<string>(initialState.current.fashionPoseReference);
  const [fashionStyleReference, setFashionStyleReference] = useState<string>(initialState.current.fashionStyleReference);
  const [fashionCombinedReference, setFashionCombinedReference] = useState<string>(initialState.current.fashionCombinedReference);
  const [fashionAspectRatio, setFashionAspectRatio] = useState<'9:16' | '16:9'>(initialState.current.fashionAspectRatio);


  // Custom tab state
  const [customCharacterImage, setCustomCharacterImage] = useState<string | null>(null);
  const [customProductImages, setCustomProductImages] = useState<ProductImageFile[]>([]);
  const [selectedCustomProductIds, setSelectedCustomProductIds] = useState<Set<string>>(new Set());
  const [productFrameImage, setProductFrameImage] = useState<string | null>(null);
  const [accessoryFrameImage, setAccessoryFrameImage] = useState<string | null>(null);
  const [customPromptEn, setCustomPromptEn] = useState<string>(initialState.current.customPromptEn);
  const [customPromptVi, setCustomPromptVi] = useState<string>(initialState.current.customPromptVi);
  const [customNegativePrompt, setCustomNegativePrompt] = useState<string>(initialState.current.customNegativePrompt);
  const [customBgRemovalPrompt, setCustomBgRemovalPrompt] = useState<string>(initialState.current.customBgRemovalPrompt);
  const [customSuggestedPrompts, setCustomSuggestedPrompts] = useState<Array<{ en: string; vi: string }>>([]);
  const [customBackgroundReference, setCustomBackgroundReference] = useState<string>(initialState.current.customBackgroundReference);
  const [customPoseReference, setCustomPoseReference] = useState<string>(initialState.current.customPoseReference);
  const [customStyleReference, setCustomStyleReference] = useState<string>(initialState.current.customStyleReference);
  const [customProductUsageReference, setCustomProductUsageReference] = useState<string>(initialState.current.customProductUsageReference);
  const [customCombinedReference, setCustomCombinedReference] = useState<string>(initialState.current.customCombinedReference);
  const [customTabMode, setCustomTabMode] = useState<'batch' | 'edit'>('batch');
  const [editSourceImage, setEditSourceImage] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [isSuggestingEditPrompts, setIsSuggestingEditPrompts] = useState<boolean>(false);
  const [editSuggestedPrompts, setEditSuggestedPrompts] = useState<string[]>([]);
  const [editPromptSuggestionCount, setEditPromptSuggestionCount] = useState<number>(4);
  const [expansionDirection, setExpansionDirection] = useState<'all' | 'horizontal' | 'vertical' | 'up' | 'down' | 'left' | 'right'>('all');
  const [expansionFactor, setExpansionFactor] = useState<number>(1.5);
  const [enhanceQuality, setEnhanceQuality] = useState<boolean>(true);

  // Text to Image tab state
  const [ttiPrompt, setTtiPrompt] = useState<string>('');
  const [ttiAspectRatio, setTtiAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [storyText, setStoryText] = useState<string>('');
  const [suggestedScenes, setSuggestedScenes] = useState<StoryScene[]>([]);
  const [isAnalyzingStory, setIsAnalyzingStory] = useState<boolean>(false);
  const [keepCharacterConsistent, setKeepCharacterConsistent] = useState(true);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [storyGenerationProgress, setStoryGenerationProgress] = useState({ completed: 0, total: 0 });
  const [storyGeneratedImages, setStoryGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedStoryImageIds, setSelectedStoryImageIds] = useState<Set<string>>(new Set());
  const [isVideoPromptModalOpen, setIsVideoPromptModalOpen] = useState<boolean>(false);
  const [isGeneratingVideoPrompts, setIsGeneratingVideoPrompts] = useState<boolean>(false);
  const [videoPromptStructure, setVideoPromptStructure] = useState<string>(initialState.current.videoPromptStructure);

  // Gallery Modal State
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState<boolean>(false);
  const [galleryModalConfig, setGalleryModalConfig] = useState<{
    onSelect: (selectedSrcs: string[]) => void;
    multiple: boolean;
    title: string;
  } | null>(null);

  const [regenerationQueue, setRegenerationQueue] = useState<RegenerationQueueItem[]>([]);
  const stopSignalRef = useRef(false);
  const singleGenKeyIndexRef = useRef(0);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  
  const currentCharacterImage = useMemo(() => {
    return column1Tab === 'fashion' ? fashionCharacterImage : customCharacterImage;
  }, [column1Tab, fashionCharacterImage, customCharacterImage]);
  
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    setLogMessages(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 100));
  };
  
  const savePreferences = () => {
     try {
      const preferences = {
        fashionPromptVi,
        fashionPromptEn,
        fashionNegativePrompt,
        fashionBgRemovalPrompt,
        fashionBackgroundReference,
        fashionPoseReference,
        fashionStyleReference,
        fashionAspectRatio,
        
        customPromptVi,
        customPromptEn,
        customNegativePrompt,
        customBgRemovalPrompt,
        customBackgroundReference,
        customPoseReference,
        customStyleReference,
        customProductUsageReference,

        autoSaveToGallery,
        autoDownloadAll,
        skipBgRemoval,
        apiKeys,
        maxConcurrency,
        useDefaultApiKey,
        videoPromptStructure,
      };
      window.localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.warn('Error saving user preferences to localStorage', error);
    }
  };

  useEffect(() => {
    savePreferences();
  }, [
    fashionPromptVi, fashionPromptEn, fashionNegativePrompt, fashionBgRemovalPrompt, fashionBackgroundReference, fashionPoseReference, fashionStyleReference, fashionAspectRatio,
    customPromptVi, customPromptEn, customNegativePrompt, customBgRemovalPrompt, customBackgroundReference, customPoseReference, customStyleReference, customProductUsageReference,
    autoSaveToGallery, autoDownloadAll, skipBgRemoval, apiKeys, maxConcurrency, useDefaultApiKey, videoPromptStructure
  ]);
  
  useEffect(() => {
    const updatePromptAspectRatio = (prompt: string, newRatio: '9:16' | '16:9'): string => {
      let newPrompt = prompt;
      if (newRatio === '9:16') {
        newPrompt = newPrompt.replace(/16:9/g, '9:16');
        newPrompt = newPrompt.replace(/wide, horizontal/g, 'tall, vertical');
        newPrompt = newPrompt.replace(/rộng, ngang/g, 'cao, dọc');
      } else { // '16:9'
        newPrompt = newPrompt.replace(/9:16/g, '16:9');
        newPrompt = newPrompt.replace(/tall, vertical/g, 'wide, horizontal');
        newPrompt = newPrompt.replace(/cao, dọc/g, 'rộng, ngang');
      }
      return newPrompt;
    };
    
    setFashionPromptEn(p => updatePromptAspectRatio(p, fashionAspectRatio));
    setFashionPromptVi(p => updatePromptAspectRatio(p, fashionAspectRatio));
    setCustomPromptEn(p => updatePromptAspectRatio(p, fashionAspectRatio));
    setCustomPromptVi(p => updatePromptAspectRatio(p, fashionAspectRatio));
  }, [fashionAspectRatio]);

  const getNextApiKey = (): string | null => {
      const keysToUse = useDefaultApiKey ? DEFAULT_API_KEYS : apiKeys;
      if (keysToUse.length === 0) return null;
      const key = keysToUse[singleGenKeyIndexRef.current % keysToUse.length];
      singleGenKeyIndexRef.current += 1;
      return key;
  };

  const handleOpenGalleryModal = (config: { onSelect: (selectedSrcs: string[]) => void; multiple: boolean; title: string; }) => {
    if (generatedImages.length === 0) {
        setError("Thư viện trống. Vui lòng tạo một vài ảnh trước.");
        addLog("Lỗi: Người dùng cố mở thư viện trống.");
        return;
    }
    setGalleryModalConfig(config);
    setIsGalleryModalOpen(true);
  };
  
  const addProductImagesFromGallery = (selectedSrcs: string[], target: 'fashion' | 'custom') => {
      const newImages: ProductImageFile[] = selectedSrcs.map(src => ({
        id: `${Date.now()}-${Math.random()}`,
        originalBase64: src,
        status: 'pending'
      }));
      if (newImages.length > 0) {
        if (target === 'fashion') {
          setProductImages(prev => [...prev, ...newImages]);
        } else {
          setCustomProductImages(prev => [...prev, ...newImages]);
        }
        addLog(`Đã chọn ${newImages.length} ảnh sản phẩm từ thư viện cho tab ${target}.`);
      }
  };

  const processRegenerationQueueItem = async (itemToProcess: RegenerationQueueItem) => {
    const apiKey = getNextApiKey();
    if (!apiKey) {
        const errorMessage = "Không có API Key nào được cấu hình.";
        setError(errorMessage);
        addLog(`Lỗi hàng đợi tạo lại: ${errorMessage}`);
        setRegenerationQueue(prev => prev.map(item => item.id === itemToProcess.id ? { ...item, status: 'error', errorMessage } : item));
        return;
    }
    if (stopSignalRef.current) return;
    
    try {
        const { sourceImage } = itemToProcess;
        addLog(`Hàng đợi tạo lại: Bắt đầu xử lý ảnh (ID gốc: ${sourceImage.id}, Loại: ${sourceImage.generationType || 'fashion'}).`);

        switch (sourceImage.generationType) {
            case 'edit':
                setRegenerationQueue(prev => prev.map(item => item.id === itemToProcess.id ? { ...item, status: 'processing-scene' } : item));
                const editVariationPrompt = `${sourceImage.prompt}, another different variation`;
                addLog(`Hàng đợi tạo lại [Edit]: Đang tạo biến thể mới...`);
                const editedImageSrc = await editImage(apiKey, sourceImage.originalProductSrc, editVariationPrompt);
                const newEditedImage: GeneratedImage = { ...sourceImage, id: `${Date.now()}-regen-edit`, src: editedImageSrc, characterImageSrc: sourceImage.characterImageSrc || '' };
                setViewerImage(newEditedImage.src);
                if (autoSaveToGallery) { setGeneratedImages(prev => [newEditedImage, ...prev]); }
                setRegenerationQueue(prev => prev.map(item => item.id === itemToProcess.id ? { ...item, status: 'done', resultSrc: newEditedImage.src } : item));
                addLog(`✅ Hàng đợi tạo lại [Edit]: Tạo lại ảnh thành công.`);
                break;

            case 'tti':
                setRegenerationQueue(prev => prev.map(item => item.id === itemToProcess.id ? { ...item, status: 'processing-scene' } : item));
                const ttiVariationPrompt = `${sourceImage.prompt}, cinematic, high detail, photorealistic, slightly different composition`;
                addLog(`Hàng đợi tạo lại [TTI]: Đang tạo biến thể mới...`);
                const ttiImageSrc = await generateImageFromText(apiKey, ttiVariationPrompt, '9:16'); // Assuming 9:16 for now, might need to store aspect ratio in GeneratedImage
                const newTtiImage: GeneratedImage = { ...sourceImage, id: `${Date.now()}-regen-tti`, src: ttiImageSrc, characterImageSrc: '' };
                setViewerImage(newTtiImage.src);
                if (autoSaveToGallery) { setGeneratedImages(prev => [newTtiImage, ...prev]); }
                setRegenerationQueue(prev => prev.map(item => item.id === itemToProcess.id ? { ...item, status: 'done', resultSrc: newTtiImage.src } : item));
                addLog(`✅ Hàng đợi tạo lại [TTI]: Tạo lại ảnh thành công.`);
                break;

            case 'fashion':
            default:
                setRegenerationQueue(prev => prev.map(item => item.id === itemToProcess.id ? { ...item, status: 'processing-bg' } : item));
                const bgRefImage = sourceImage.backgroundReferenceImage;
                let finalPrompt: string;
                
                if (bgRefImage) {
                    finalPrompt = `Use the provided background image for the scene...`;
                } else {
                    finalPrompt = sourceImage.prompt;
                }

                const combinedRef = [sourceImage.backgroundReference, sourceImage.poseReference, sourceImage.styleReference].filter(Boolean).join(', ');
                if (combinedRef.trim()) {
                    finalPrompt += ` Apply the following style, pose, and background details: ${combinedRef.trim()}.`;
                }

                if (sourceImage.negativePrompt.trim()) { finalPrompt += ` Loại trừ các yếu tố sau: ${sourceImage.negativePrompt.trim()}.`; }
                
                const charImgForRegen = sourceImage.characterImageSrc;
                if (!charImgForRegen) {
                    throw new Error("Không thể tạo lại: Thiếu ảnh nhân vật nguồn trong dữ liệu ảnh.");
                }

                let transparentImage: string;

                if (skipBgRemoval) {
                    addLog(`Hàng đợi tạo lại [Fashion]: Bỏ qua tách nền cho ảnh (ID gốc: ${sourceImage.id}).`);
                    transparentImage = sourceImage.originalProductSrc;
                } else {
                    addLog(`Hàng đợi tạo lại [Fashion]: Đang tách nền ảnh (ID gốc: ${sourceImage.id})...`);
                    let finalRemovalPrompt = sourceImage.bgRemovalPrompt;
                    if (transparentImageBgColor === 'bg-white') {
                        finalRemovalPrompt = "Remove the background and the human model from this image. Only keep the clothes. Place the product on a white background.";
                    } else if (transparentImageBgColor === 'bg-black') {
                        finalRemovalPrompt = "Remove the background and the human model from this image. Only keep the clothes. Place the product on a black background.";
                    } else if (transparentImageBgColor === 'bg-gray-800') {
                         finalRemovalPrompt = "Remove the background and the human model from this image. Only keep the clothes. Place the product on a gray background.";
                    }
                    transparentImage = await removeBackground(apiKey, sourceImage.originalProductSrc, finalRemovalPrompt);
                }

                setRegenerationQueue(prev => prev.map(item => item.id === itemToProcess.id ? { ...item, status: 'bg-removed', newTransparentSrc: transparentImage } : item));
                setRegenerationQueue(prev => prev.map(item => item.id === itemToProcess.id ? { ...item, status: 'processing-scene' } : item));
                
                const seedForRegen = Math.floor(Math.random() * 100000);
                addLog(`Hàng đợi tạo lại [Fashion]: Đang tạo cảnh cho ảnh (ID gốc: ${sourceImage.id}) với seed ${seedForRegen}...`);
                
                const generatedImageSrc = await generateScene(apiKey, transparentImage, charImgForRegen, finalPrompt, bgRefImage, seedForRegen);
                
                const newImage: GeneratedImage = { ...sourceImage, id: `${Date.now()}-regen`, src: generatedImageSrc, transparentProductSrc: transparentImage, backgroundReferenceImage: bgRefImage, characterImageSrc: charImgForRegen };
                setViewerImage(newImage.src);
                if (autoSaveToGallery) { setGeneratedImages(prev => [newImage, ...prev]); }
                setRegenerationQueue(prev => prev.map(item => item.id === itemToProcess.id ? { ...item, status: 'done', resultSrc: newImage.src } : item));
                addLog(`✅ Hàng đợi tạo lại [Fashion]: Tạo lại ảnh thành công (ID gốc: ${sourceImage.id}).`);
                break;
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(prev => (prev ? `${prev}\nLỗi tạo lại: ${errorMessage}` : `Lỗi tạo lại: ${errorMessage}`));
        addLog(`❌ Hàng đợi tạo lại: Lỗi (ID gốc: ${itemToProcess.sourceImage.id}): ${errorMessage}`);
        setRegenerationQueue(prev => prev.map(item => item.id === itemToProcess.id ? { ...item, status: 'error', errorMessage } : item));
    }
  };

  useEffect(() => {
    const processQueue = async () => {
        const itemToProcess = regenerationQueue.find(item => item.status === 'pending');
        if (itemToProcess && !isLoading) {
            setIsLoading(true);
            await processRegenerationQueueItem(itemToProcess);
            setIsLoading(false);
        }
    };
    processQueue();
  }, [regenerationQueue, isLoading]);

  const handleViewImage = (src: string | null) => {
    if (src) {
      setViewerImage(src);
    }
  };
  
  const handleCharacterImageUploadForTab = (tab: 'fashion' | 'custom') => async (files: FileList) => {
    if (!files[0]) return;
    try {
      setError(null);
      setProgressState({ total: 0, completed: 0, errors: 0 });
      const base64 = await fileToBase64(files[0]);
      if (tab === 'fashion') {
        setFashionCharacterImage(base64);
      } else {
        setCustomCharacterImage(base64);
      }
      addLog(`Đã tải lên ảnh nhân vật mới cho tab ${tab}.`);
    } catch (err) {
      const msg = `Không thể đọc tệp hình ảnh nhân vật cho tab ${tab}.`;
      setError(msg);
      addLog(`Lỗi: ${msg}`);
    }
  };

  const handleBackgroundReferenceImageUpload = async (files: FileList) => {
    if (!files[0]) return;
    try {
      setError(null);
      const base64 = await fileToBase64(files[0]);
      setBackgroundReferenceImage(base64);
      addLog('Đã tải lên ảnh nền tham chiếu.');
    } catch (err)
 {
      const msg = 'Không thể đọc tệp ảnh nền tham chiếu.';
      setError(msg);
      addLog(`Lỗi: ${msg}`);
    }
  };

  const handleProductFrameUpload = async (files: FileList) => {
    if (!files[0]) return;
    try {
      setError(null);
      const base64 = await fileToBase64(files[0]);
      setProductFrameImage(base64);
      addLog('Đã tải lên ảnh trang phục nhân vật.');
    } catch (err) {
      const msg = 'Không thể đọc tệp ảnh trang phục nhân vật.';
      setError(msg);
      addLog(`Lỗi: ${msg}`);
    }
  };

  const handleAccessoryFrameUpload = async (files: FileList) => {
    if (!files[0]) return;
    try {
      setError(null);
      const base64 = await fileToBase64(files[0]);
      setAccessoryFrameImage(base64);
      addLog('Đã tải lên ảnh khung phụ kiện.');
    } catch (err) {
      const msg = 'Không thể đọc tệp ảnh khung phụ kiện.';
      setError(msg);
      addLog(`Lỗi: ${msg}`);
    }
  };

  const handleEditImageUpload = async (files: FileList) => {
    if (!files[0]) return;
    try {
      setError(null);
      const base64 = await fileToBase64(files[0]);
      setEditSourceImage(base64);
      addLog('Đã tải lên ảnh gốc để chỉnh sửa.');
    } catch (err) {
      const msg = 'Không thể đọc tệp hình ảnh gốc.';
      setError(msg);
      addLog(`Lỗi: ${msg}`);
    }
  };

  const handleProductImageUploadForTab = (tab: 'fashion' | 'custom') => async (files: FileList) => {
    setError(null);
    setProgressState({ total: 0, completed: 0, errors: 0 });
    
    const isFashion = tab === 'fashion';
    const stateSetter = isFashion ? setProductImages : setCustomProductImages;
    const selectionSetter = isFashion ? setSelectedProductIds : setSelectedCustomProductIds;
    const logPrefix = isFashion ? '' : '(Tùy Biến) ';

    selectionSetter(new Set());

    const newImages: ProductImageFile[] = [];
    for (const file of Array.from(files)) {
      try {
        const base64 = await fileToBase64(file);
        newImages.push({ id: `${Date.now()}-${Math.random()}`, originalBase64: base64, status: 'pending' });
      } catch (err) {
        setError(prev => (prev ? prev + `\nKhông thể đọc tệp ${file.name}.` : `Không thể đọc tệp ${file.name}.`));
      }
    }

    if (newImages.length > 0) {
        stateSetter(prev => {
            const updatedImages = [...prev, ...newImages];
            addLog(`${logPrefix}Đã thêm ${newImages.length} ảnh. Tổng số: ${updatedImages.length}.`);
            return updatedImages;
        });
    }
  };

  const removeProductImage = (id: string) => {
    setProductImages(prev => prev.filter(img => img.id !== id));
    setSelectedProductIds(prev => {
        const newSelection = new Set(prev);
        newSelection.delete(id);
        return newSelection;
    });
    addLog(`Đã xóa ảnh sản phẩm (ID: ${id.slice(-6)}).`);
  };

  const handleProductSelectionChange = (id: string) => {
    setSelectedProductIds(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        return newSelection;
    });
  };

  const handleDeselectAllProducts = () => {
      setSelectedProductIds(new Set());
  };

  const handleDeleteSelectedProducts = () => {
    if (selectedProductIds.size === 0) return;
    const numToDelete = selectedProductIds.size;
    setProductImages(prev => prev.filter(p => !selectedProductIds.has(p.id)));
    setSelectedProductIds(new Set());
    addLog(`Đã xóa ${numToDelete} sản phẩm đã chọn.`);
  };

  const handleDeleteAllProducts = () => {
      if (productImages.length === 0) return;
      const numToDelete = productImages.length;
      setProductImages([]);
      setSelectedProductIds(new Set());
      addLog(`Đã xóa tất cả ${numToDelete} sản phẩm.`);
  };

  const removeCustomProductImage = (id: string) => {
    setCustomProductImages(prev => prev.filter(img => img.id !== id));
    setSelectedCustomProductIds(prev => {
        const newSelection = new Set(prev);
        newSelection.delete(id);
        return newSelection;
    });
    addLog(`(Tùy Biến) Đã xóa ảnh sản phẩm (ID: ${id.slice(-6)}).`);
  };
  
  const handleCustomProductSelectionChange = (id: string) => {
    setSelectedCustomProductIds(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        return newSelection;
    });
  };

  const handleDeselectAllCustomProducts = () => {
      setSelectedCustomProductIds(new Set());
  };

  const handleDeleteSelectedCustomProducts = () => {
    if (selectedCustomProductIds.size === 0) return;
    const numToDelete = selectedCustomProductIds.size;
    setCustomProductImages(prev => prev.filter(p => !selectedCustomProductIds.has(p.id)));
    setSelectedCustomProductIds(new Set());
    addLog(`(Tùy Biến) Đã xóa ${numToDelete} sản phẩm đã chọn.`);
  };

  const handleDeleteAllCustomProducts = () => {
      if (customProductImages.length === 0) return;
      const numToDelete = customProductImages.length;
      setCustomProductImages([]);
      setSelectedCustomProductIds(new Set());
      addLog(`(Tùy Biến) Đã xóa tất cả ${numToDelete} sản phẩm.`);
  };
  
  const handleStop = () => {
    stopSignalRef.current = true;
    addLog("Người dùng yêu cầu dừng quá trình.");
    setProgressMessage('Đang dừng lại...');
  };
  
  const processBatch = async <T extends { id: string; originalBase64: string; }>(
    items: T[],
    processor: (item: T, apiKey: string) => Promise<void>
  ) => {
    stopSignalRef.current = false;
    setIsLoading(true);
    setError(null);
    setProgressState({ total: items.length * numberOfVariants, completed: 0, errors: 0 });

    const keysToUse = useDefaultApiKey ? DEFAULT_API_KEYS : apiKeys;
    if (keysToUse.length === 0) {
      const msg = "Không có API Key nào được cấu hình. Vui lòng vào Cài đặt API.";
      setError(msg);
      addLog(`Lỗi: ${msg}`);
      setIsLoading(false);
      return;
    }

    const queue = [...items];
    const rateLimitedKeys = new Map<string, number>(); // key -> timestamp to retry after

    const worker = async (key: string, workerId: number) => {
      while (queue.length > 0 && !stopSignalRef.current) {
        const now = Date.now();
        const limitedUntil = rateLimitedKeys.get(key);
        if (limitedUntil && now < now) {
          await new Promise(r => setTimeout(r, Math.min(1000, limitedUntil - now)));
          continue;
        }

        const job = queue.shift();
        if (!job) break;

        try {
          await processor(job, key);
        } catch (err) {
          if (err instanceof Error && err.name === 'RateLimitError') {
            addLog(`⚠️ API Key ...${key.slice(-4)} bị giới hạn. Tạm dừng 60 giây.`);
            rateLimitedKeys.set(key, Date.now() + 61000);
            queue.unshift(job);
          }
        }
      }
    };

    const workers: Promise<void>[] = [];
    let workerCount = 0;
    for (const key of keysToUse) {
      for (let i = 0; i < maxConcurrency; i++) {
        workers.push(worker(key, ++workerCount));
      }
    }
    
    await Promise.all(workers);

    if (stopSignalRef.current && !error) {
        const msg = 'Quá trình đã được người dùng dừng lại.';
        setError(msg);
        addLog(msg);
    } else if (!stopSignalRef.current) {
        addLog("Hoàn tất quá trình hàng loạt.");
    }

    setIsLoading(false);
    setProgressMessage('');
  }


  const handleBackgroundRemovalOnly = async () => {
    const productsToProcess = column1Tab === 'fashion' ? productImages : customProductImages;
    const stateUpdater = column1Tab === 'fashion' ? setProductImages : setCustomProductImages;
    const bgRemovalPrompt = column1Tab === 'fashion' ? fashionBgRemovalPrompt : customBgRemovalPrompt;

    if (productsToProcess.length === 0) {
      setError('Vui lòng tải lên ít nhất một ảnh sản phẩm.');
      return;
    }
    if (skipBgRemoval) {
      setError('Chức năng "Chỉ Tách Nền" không thể chạy khi tùy chọn "Bỏ qua bước tách nền" đang được bật.');
      return;
    }
    addLog(`Bắt đầu quá trình chỉ tách nền cho ${productsToProcess.length} ảnh.`);
    
    await processBatch(productsToProcess, async (job, apiKey) => {
      const jobIndex = productsToProcess.findIndex(p => p.id === job.id) + 1;
      try {
        stateUpdater(prev => prev.map(img => img.id === job.id ? { ...img, status: 'processing-bg' } : img));
        setProgressMessage(`Đang tách nền ảnh ${jobIndex}/${productsToProcess.length}...`);
        
        let finalBgRemovalPrompt = bgRemovalPrompt;
        if (transparentImageBgColor === 'bg-white') {
            finalBgRemovalPrompt = "Remove the background and the human model from this image. Only keep the clothes. Place the product on a white background.";
        } else if (transparentImageBgColor === 'bg-black') {
            finalBgRemovalPrompt = "Remove the background and the human model from this image. Only keep the clothes. Place the product on a black background.";
        } else if (transparentImageBgColor === 'bg-gray-800') {
             finalBgRemovalPrompt = "Remove the background and the human model from this image. Only keep the clothes. Place the product on a gray background.";
        }
        
        const transparentImage = await removeBackground(apiKey, job.originalBase64, finalBgRemovalPrompt);
        if (stopSignalRef.current) return;
        
        stateUpdater(prev => prev.map(img => img.id === job.id ? { ...img, status: 'done', transparentBase64: transparentImage } : img));
        setProgressState(prev => ({ ...prev, completed: prev.completed + 1 }));
        addLog(`✅ Tách nền thành công ảnh ${jobIndex}/${productsToProcess.length}`);

      } catch (err) {
        if (err instanceof Error && err.name === 'RateLimitError') { throw err; }
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (!stopSignalRef.current) {
          addLog(`❌ Lỗi tách nền ảnh ${jobIndex}/${productsToProcess.length}: ${errorMessage.split('\n')[0]}`);
          stateUpdater(prev => prev.map(img => img.id === job.id ? { ...img, status: 'error', errorMessage } : img));
          setProgressState(prev => ({ ...prev, completed: prev.completed + 1, errors: prev.errors + 1 }));
        }
      }
    });
  };

  const handleTtiGenerate = async () => {
    if (!ttiPrompt.trim()) {
      setError('Vui lòng nhập mô tả cho ảnh cần tạo.');
      return;
    }

    addLog(`Bắt đầu tạo ảnh từ văn bản...`);
    setIsLoading(true);
    setError(null);
    setProgressMessage('Đang tạo ảnh của bạn...');
    setProgressState({ total: numberOfVariants, completed: 0, errors: 0 });

    const successfullyGenerated: GeneratedImage[] = [];

    for (let i = 0; i < numberOfVariants; i++) {
        if (stopSignalRef.current) break;

        const apiKey = getNextApiKey();
        if (!apiKey) {
            const msg = "Không có API Key nào được cấu hình.";
            setError(msg);
            addLog(`Lỗi: ${msg}`);
            setProgressState(prev => ({ ...prev, errors: prev.errors + (numberOfVariants - i), completed: prev.completed + (numberOfVariants - i) }));
            break;
        }

        const variantIndex = i + 1;
        const logPrefix = `Ảnh ${variantIndex}/${numberOfVariants}`;
        setProgressMessage(`Đang tạo ${logPrefix}...`);
        
        try {
            const generatedImageSrc = await generateImageFromText(apiKey, ttiPrompt, ttiAspectRatio);
            
            if (stopSignalRef.current) continue;

            const newImage: GeneratedImage = {
                id: `${Date.now()}-tti-v${variantIndex}`,
                src: generatedImageSrc,
                transparentProductSrc: '',
                originalProductSrc: '',
                characterImageSrc: '',
                prompt: ttiPrompt,
                backgroundReference: '',
                negativePrompt: '',
                bgRemovalPrompt: '',
                poseReference: '',
                styleReference: '',
                backgroundReferenceImage: null,
                generationType: 'tti',
            };

            setViewerImage(newImage.src);
            successfullyGenerated.push(newImage);
            if (autoSaveToGallery) {
                setGeneratedImages(prev => [newImage, ...prev]);
            }
            setProgressState(prev => ({ ...prev, completed: prev.completed + 1 }));
            addLog(`✅ ${logPrefix}: Hoàn thành!`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(prev => (prev ? `${prev}\n${logPrefix}: ${errorMessage}` : `${logPrefix}: ${errorMessage}`));
            addLog(`❌ ${logPrefix}: Lỗi - ${errorMessage.split('\n')[0]}`);
            setProgressState(prev => ({ ...prev, completed: prev.completed + 1, errors: prev.errors + 1 }));
        }
    }

    if (autoDownloadAll && successfullyGenerated.length > 0 && !stopSignalRef.current) {
        handleDownloadAll(successfullyGenerated);
    }
    
    setIsLoading(false);
    setProgressMessage('');
  };

  const handleEditGenerate = async () => {
    if (!editSourceImage || !editPrompt.trim()) {
        setError('Vui lòng tải lên ảnh gốc và nhập yêu cầu chỉnh sửa.');
        return;
    }
    const apiKey = getNextApiKey();
    if (!apiKey) {
        setError("Không có API Key nào được cấu hình.");
        return;
    }
    
    stopSignalRef.current = false;
    setIsLoading(true);
    setError(null);
    setProgressMessage('Đang chỉnh sửa ảnh của bạn...');
    addLog(`Bắt đầu chỉnh sửa ảnh...`);

    try {
        const generatedImageSrc = await editImage(apiKey, editSourceImage, editPrompt);

        if (stopSignalRef.current) throw new Error("Bị người dùng dừng lại.");

        const newImage: GeneratedImage = {
            id: `${Date.now()}-edit`,
            src: generatedImageSrc,
            originalProductSrc: editSourceImage,
            characterImageSrc: '',
            prompt: editPrompt,
            transparentProductSrc: '',
            backgroundReference: '',
            negativePrompt: '',
            bgRemovalPrompt: '',
            poseReference: '',
            styleReference: '',
            backgroundReferenceImage: null,
            generationType: 'edit',
        };

        setViewerImage(newImage.src);
        setActiveGeneratedImage(newImage);
        if (autoSaveToGallery) {
            setGeneratedImages(prev => [newImage, ...prev]);
        }
        if (autoDownloadAll) {
            handleDownload(newImage.src);
        }
        addLog(`✅ Chỉnh sửa ảnh thành công.`);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        addLog(`❌ Chỉnh sửa ảnh thất bại: ${errorMessage.split('\n')[0]}`);
    } finally {
        setIsLoading(false);
        setProgressMessage('');
    }
  };

  const handleGenerate = async () => {
    if (column1Tab === 'text-to-image') {
      await handleTtiGenerate();
      return;
    }
    if (column1Tab === 'custom' && customTabMode === 'edit') {
        await handleEditGenerate();
        return;
    }

    const productsToProcess = column1Tab === 'fashion' ? productImages : customProductImages;
    const stateUpdater = column1Tab === 'fashion' ? setProductImages : setCustomProductImages;
    const promptEn = column1Tab === 'fashion' ? fashionPromptEn : customPromptEn;
    const negativePrompt = column1Tab === 'fashion' ? fashionNegativePrompt : customNegativePrompt;
    const bgRemovalPrompt = column1Tab === 'fashion' ? fashionBgRemovalPrompt : customBgRemovalPrompt;
    const backgroundReference = column1Tab === 'fashion' ? fashionBackgroundReference : customBackgroundReference;
    const poseReference = column1Tab === 'fashion' ? fashionPoseReference : customPoseReference;
    const styleReference = column1Tab === 'fashion' ? fashionStyleReference : customStyleReference;
    const productUsageReference = (column1Tab === 'custom') ? customProductUsageReference : '';

    if (productsToProcess.length === 0 || !currentCharacterImage) {
        setError('Vui lòng tải lên cả ảnh nhân vật và ít nhất một ảnh sản phẩm.');
        return;
    }

    const combinedRef = column1Tab === 'fashion' ? fashionCombinedReference : customCombinedReference;
    if (!backgroundReferenceImage && !promptEn.trim() && !combinedRef.trim()) {
        setError('Vui lòng nhập câu lệnh chính hoặc cung cấp ảnh nền tham chiếu / tùy chọn tham chiếu.');
        return;
    }

    const jobs = productsToProcess;
    const totalJobs = jobs.length * numberOfVariants;
    addLog(`Bắt đầu tạo hàng loạt cho ${productsToProcess.length} sản phẩm, với ${numberOfVariants} biến thể mỗi sản phẩm. Tổng số: ${totalJobs} ảnh.`);
    
    const successfullyGenerated: GeneratedImage[] = [];
    const transparentImageCache = new Map<string, string>();

    await processBatch(jobs, async (job, apiKey) => {
        const productIndex = productsToProcess.findIndex(p => p.id === job.id) + 1;
        let backgroundForVariants: string | null = null;
        let transparentImage = transparentImageCache.get(job.id);
        const shuffledPosePrompts = shuffleArray(allPosePrompts);

        try {
            if (!transparentImage) {
                if (skipBgRemoval) {
                    addLog(`Bỏ qua tách nền cho sản phẩm ${productIndex}.`);
                    transparentImage = job.originalBase64;
                } else {
                    stateUpdater(prev => prev.map(img => img.id === job.id ? { ...img, status: 'processing-bg' } : img));
                    setProgressMessage(`Đang tách nền sản phẩm ${productIndex}/${productsToProcess.length}...`);
                    addLog(`Đang tách nền sản phẩm ${productIndex}...`);
                    
                    let finalBgRemovalPrompt = bgRemovalPrompt;
                    if (transparentImageBgColor === 'bg-white') finalBgRemovalPrompt = "Remove the background and the human model from this image. Only keep the clothes. Place the product on a white background.";
                    else if (transparentImageBgColor === 'bg-black') finalBgRemovalPrompt = "Remove the background and the human model from this image. Only keep the clothes. Place the product on a black background.";
                    else if (transparentImageBgColor === 'bg-gray-800') finalBgRemovalPrompt = "Remove the background and the human model from this image. Only keep the clothes. Place the product on a gray background.";
                    
                    transparentImage = await removeBackground(apiKey, job.originalBase64, finalBgRemovalPrompt);
                    transparentImageCache.set(job.id, transparentImage);
                }
                if (stopSignalRef.current) return;
                stateUpdater(prev => prev.map(img => img.id === job.id ? { ...img, status: 'bg-removed', transparentBase64: transparentImage } : img));
            }

            if (!transparentImage) throw new Error("Không thể lấy ảnh đã tách nền.");

            for (let i = 0; i < numberOfVariants; i++) {
                if (stopSignalRef.current) return;
                const variantIndex = i + 1;
                const logPrefix = `Ảnh ${productIndex}/${productsToProcess.length} (Biến thể ${variantIndex}/${numberOfVariants})`;
                
                try {
                    addLog(`${logPrefix}: Bắt đầu xử lý...`);
                    stateUpdater(prev => prev.map(img => img.id === job.id ? { ...img, status: 'processing-scene' } : img));
                    setProgressMessage(`Đang tạo cảnh ${logPrefix}...`);
                    
                    let finalPrompt: string;
                    let backgroundReferenceForThisVariant: string | null | undefined = backgroundReferenceImage;

                    if (i === 0) {
                        let finalApiRef: string;
                        const combinedRefFromTextarea = column1Tab === 'fashion' ? fashionCombinedReference : customCombinedReference;
                        finalApiRef = parseCombinedReferenceForApi(combinedRefFromTextarea);

                        if (!backgroundReferenceImage && !combinedRefFromTextarea.trim()) {
                            const randomBgPrompt = getRandomBackgroundPrompt();
                            addLog(`${logPrefix}: Không có tham chiếu, sử dụng nền ngẫu nhiên: "${getLabelFromPrompt(randomBgPrompt)}"`);
                            finalApiRef = randomBgPrompt;
                        }

                        finalPrompt = promptEn;
                        if (finalApiRef.trim()) {
                            finalPrompt += ` Apply the following style, pose, and background details: ${finalApiRef.trim()}.`;
                        }

                        if (column1Tab === 'custom' && !productUsageReference) {
                            finalPrompt += ` Analyze the provided product image and show the person interacting with it in a natural and appropriate way (e.g., wearing it if it's clothing, holding it if it's a bottle, applying it if it's cream).`;
                        }

                        if (negativePrompt.trim()) { finalPrompt += ` Loại trừ: ${negativePrompt.trim()}.`; }
                    } else {
                        if (!backgroundForVariants) throw new Error("Không thể tạo biến thể vì ảnh biến thể 1 bị lỗi.");
                        backgroundReferenceForThisVariant = backgroundForVariants;
                        
                        const uniquePosePrompt = shuffledPosePrompts.pop();
                         if (!uniquePosePrompt) {
                             addLog(`${logPrefix}: Hết dáng gợi ý, sử dụng biến thể ngẫu nhiên cũ...`);
                        }
                        const variationPrompt = uniquePosePrompt || getRandomPoseVariationPrompt();
                        addLog(`${logPrefix}: Áp dụng dáng mới: "${getLabelFromPrompt(variationPrompt)}"`);

                        const ratioText = fashionAspectRatio === '9:16' ? 'tall, vertical 9:16' : 'wide, horizontal 16:9';
                        finalPrompt = `CRITICAL INSTRUCTION: A complete scene is provided as a background image. Recreate this scene EXACTLY, including the background, lighting, and style. Place the provided clothing product onto the provided character model and insert them into the scene.
IMPORTANT: Generate a completely new, natural, full-body standing pose for the character that incorporates this specific change: "${variationPrompt}". Do NOT copy the pose from the original character image or the pose in the provided background image.
ALSO CRITICAL: Generate a new and unique facial expression for the model, different from the previous images (e.g., a smile, a thoughtful look, a neutral expression).
CRITICAL: The person's face MUST be an exact, photorealistic match to the face in the provided character image. Do not alter it.
The final output must be a ${ratioText} photorealistic image that seamlessly blends the character into the provided background scene.`;

                        if (negativePrompt.trim()) { finalPrompt += ` Loại trừ: ${negativePrompt.trim()}.`; }
                    }

                    const seedForVariant = seed + i;
                    const generatedImageSrc = await generateScene(apiKey, transparentImage!, currentCharacterImage!, finalPrompt, backgroundReferenceForThisVariant, seedForVariant);
                    if (stopSignalRef.current) return;

                    if (i === 0) {
                        backgroundForVariants = generatedImageSrc;
                    }

                    const newImage: GeneratedImage = {
                        id: `${Date.now()}-${job.id.slice(-4)}-v${variantIndex}`, src: generatedImageSrc, transparentProductSrc: transparentImage!, originalProductSrc: job.originalBase64,
                        characterImageSrc: currentCharacterImage!,
                        prompt: promptEn, 
                        backgroundReference: backgroundReference, 
                        negativePrompt, 
                        bgRemovalPrompt, 
                        poseReference: poseReference, 
                        styleReference: styleReference, 
                        backgroundReferenceImage,
                        generationType: 'fashion',
                        sourceProductId: job.id,
                    };

                    setViewerImage(newImage.src);
                    setActiveGeneratedImage(newImage);
                    stateUpdater(prev => prev.map(img => img.id === job.id ? { ...img, generatedBase64: generatedImageSrc } : img));
                    successfullyGenerated.push(newImage);
                    if (autoSaveToGallery) setGeneratedImages(prev => [newImage, ...prev]);
                    setProgressState(prev => ({ ...prev, completed: prev.completed + 1 }));
                    addLog(`✅ ${logPrefix}: Hoàn thành!`);

                } catch (variantError) {
                    const errorMessage = variantError instanceof Error ? variantError.message : String(variantError);
                    addLog(`❌ ${logPrefix}: Lỗi - ${errorMessage.split('\n')[0]}`);
                    setProgressState(prev => ({ ...prev, errors: prev.errors + 1, completed: prev.completed + 1 }));
                    throw new Error(`Lỗi ở biến thể ${variantIndex}: ${errorMessage}`);
                }
            }
            stateUpdater(prev => prev.map(img => img.id === job.id ? { ...img, status: 'done' } : img));
        } catch (productError) {
            if (productError instanceof Error && productError.name === 'RateLimitError') {
                throw productError;
            }
            const errorMessage = productError instanceof Error ? productError.message : String(productError);
            if (!stopSignalRef.current) {
                const completedForThisProduct = progressState.completed - (productIndex - 1) * numberOfVariants;
                const remainingInProduct = numberOfVariants - completedForThisProduct;
                addLog(`❌ Lỗi nghiêm trọng với sản phẩm ${productIndex}, dừng các biến thể còn lại. Lỗi: ${errorMessage.split('\n')[0]}`);
                stateUpdater(prev => prev.map(img => img.id === job.id ? { ...img, status: 'error', errorMessage } : img));
                if (remainingInProduct > 0) {
                    setProgressState(prev => ({
                        ...prev,
                        completed: prev.completed + remainingInProduct,
                        errors: prev.errors + 1,
                    }));
                }
            }
        }
    });

    if (autoDownloadAll && successfullyGenerated.length > 0 && !stopSignalRef.current) {
        handleDownloadAll(successfullyGenerated);
    }
};

  const performSingleGeneration = async (productImg: string, originalProductImg: string, charImg: string, basePrompt: string, negPrompt: string, generationSeed: number) => {
    addLog(`Bắt đầu tạo ảnh đơn lẻ (Seed: ${generationSeed})...`);
    const apiKey = getNextApiKey();
    if (!apiKey) {
        setError("Không có API Key nào được cấu hình.");
        addLog("Lỗi: Không có API Key nào được cấu hình.");
        return;
    }

    stopSignalRef.current = false;
    setIsLoading(true);
    setError(null);
    setProgressMessage('Đang tạo nền mới...');
    setProgressState({ total: 0, completed: 0, errors: 0 });
    
    const combinedRefFromTextarea = column1Tab === 'fashion' ? fashionCombinedReference : customCombinedReference;
    const bgRemovalPrompt = column1Tab === 'fashion' ? fashionBgRemovalPrompt : customBgRemovalPrompt;
    const backgroundReference = column1Tab === 'fashion' ? fashionBackgroundReference : customBackgroundReference;
    const poseReference = column1Tab === 'fashion' ? fashionPoseReference : customPoseReference;
    const styleReference = column1Tab === 'fashion' ? fashionStyleReference : customStyleReference;
    
    let finalApiRef = parseCombinedReferenceForApi(combinedRefFromTextarea);

    if (!finalApiRef.trim()) {
        const randomBgPrompt = getRandomBackgroundPrompt();
        addLog(`Tạo Nền Mới: Sử dụng nền ngẫu nhiên: "${getLabelFromPrompt(randomBgPrompt)}"`);
        finalApiRef = randomBgPrompt;
    }
    
    let finalPrompt = basePrompt;
    if (finalApiRef.trim()) {
      finalPrompt += ` Apply the following style, pose, and background details, but create a different variation: ${finalApiRef.trim()}.`;
    }
    if (negPrompt.trim()) { finalPrompt += ` Loại trừ: ${negPrompt.trim()}.`; }
    
    try {
      const generatedImageSrc = await generateScene(apiKey, productImg, charImg, finalPrompt, null, generationSeed);
      if (stopSignalRef.current) throw new Error("Bị người dùng dừng lại.");

      const newImage: GeneratedImage = {
          id: `${Date.now()}-newbg`, src: generatedImageSrc, transparentProductSrc: productImg, originalProductSrc: originalProductImg,
          characterImageSrc: charImg,
          prompt: basePrompt, 
          backgroundReference: backgroundReference,
          negativePrompt: negPrompt, 
          bgRemovalPrompt: bgRemovalPrompt,
          poseReference: poseReference, 
          styleReference: styleReference, 
          backgroundReferenceImage: null,
          generationType: 'fashion',
          sourceProductId: activeGeneratedImage?.sourceProductId,
      };
      setViewerImage(newImage.src);
      setActiveGeneratedImage(newImage);
      setActiveTransparentProductImage(newImage.transparentProductSrc);
      setActiveOriginalProductImage(newImage.originalProductSrc);

      if (autoSaveToGallery) { setGeneratedImages(prev => [newImage, ...prev]); }
      if (autoDownloadAll) { handleDownload(newImage.src); }
      addLog("Tạo ảnh đơn lẻ thành công.");
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        addLog(`Tạo ảnh đơn lẻ thất bại: ${errorMessage.split('\n')[0]}`);
    }
    
    setIsLoading(false);
    setProgressMessage('');
  };

  const handleNewBackground = () => {
    const productSource = activeTransparentProductImage || lastUsedProductImage;
    const originalSource = activeOriginalProductImage;
    const promptEn = column1Tab === 'fashion' ? fashionPromptEn : customPromptEn;
    const negativePrompt = column1Tab === 'fashion' ? fashionNegativePrompt : customNegativePrompt;


    if (!productSource || !currentCharacterImage || !originalSource) {
      setError("Không có sản phẩm và nhân vật nguồn để tạo nền mới. Vui lòng tạo hoặc chọn một ảnh trước.");
      return;
    }
    const newSeed = Math.floor(Math.random() * 100000);
    setSeed(newSeed);
    performSingleGeneration(productSource, originalSource, currentCharacterImage, promptEn, negativePrompt, newSeed);
  };

  const handleDownload = (imageUrl: string, filename?: string) => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename || `ai-scene-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleDownloadAll = async (imagesToDownload: GeneratedImage[]) => {
    if (imagesToDownload.length === 0) return;
    addLog(`Bắt đầu tải về ${imagesToDownload.length} ảnh.`);
    for (const image of imagesToDownload) {
        handleDownload(image.src);
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    addLog(`Hoàn tất tải về.`);
  };

  const handleDownloadAllTransparent = async () => {
    const productsToUse = column1Tab === 'fashion' ? productImages : customProductImages;
    const transparentImages = productsToUse.filter(p => p.transparentBase64);
    if (transparentImages.length === 0) return;
    addLog(`Bắt đầu tải về ${transparentImages.length} ảnh đã tách nền.`);
    for (const image of transparentImages) {
        handleDownload(image.transparentBase64!, `tach-nen-${image.id.slice(-6)}.png`);
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    addLog(`Hoàn tất tải về ảnh tách nền.`);
  };

  const handleDownloadText = (content: string, filename: string) => {
    if (!content || !filename) return;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSelectImage = (image: GeneratedImage) => {
    setViewerImage(image.src);
    setActiveGeneratedImage(image);
    setActiveTransparentProductImage(image.transparentProductSrc);
    setActiveOriginalProductImage(image.originalProductSrc);
  };

  const handleRegenerateImage = (imageToRegenerate: GeneratedImage) => {
    setGeneratedImages(prev => prev.filter(img => img.id !== imageToRegenerate.id));
    const newItem: RegenerationQueueItem = { id: `${Date.now()}-q-${Math.random()}`, sourceImage: imageToRegenerate, status: 'pending' };
    addLog(`Đã thêm tác phẩm (ID gốc: ${imageToRegenerate.id}) vào hàng đợi tạo lại.`);
    setRegenerationQueue(prev => [...prev, newItem]);
  };

  const handleRegenerateViewerImage = () => {
    if (activeGeneratedImage) {
        addLog(`Yêu cầu tạo lại cho ảnh đang xem (ID gốc: ${activeGeneratedImage.id}).`);
        handleRegenerateImage(activeGeneratedImage);
        // Clear the viewer to show it's being processed and because the old image is removed
        setViewerImage(null);
        setActiveGeneratedImage(null);
        setActiveTransparentProductImage(null);
        setActiveOriginalProductImage(null);
    } else {
        const msg = "Không có ảnh nào đang được chọn để tạo lại.";
        setError(msg);
        addLog(`Lỗi tạo lại: ${msg}`);
    }
  };

  const handleDeleteImage = (imageId: string) => {
    const imageToDelete = generatedImages.find(img => img.id === imageId);
    setGeneratedImages(prev => prev.filter(image => image.id !== imageId));
    setSelectedImageIds(prev => { const newSelection = new Set(prev); newSelection.delete(imageId); return newSelection; });
    if (imageToDelete) {
        addLog(`Đã xóa tác phẩm (ID: ${imageId}).`);
        if (viewerImage === imageToDelete.src) {
            setViewerImage(null);
            setActiveGeneratedImage(null);
            setActiveTransparentProductImage(null);
            setActiveOriginalProductImage(null);
        }
    }
  };

  const handleRemoveFromQueue = (itemId: string) => {
    setRegenerationQueue(prev => prev.filter(item => item.id !== itemId));
  }

  const handleUseTransparentAsProducts = () => {
    const productsToUse = column1Tab === 'fashion' ? productImages : customProductImages;
    const transparentImages = productsToUse.filter(p => p.transparentBase64).map(p => ({ id: p.id, src: p.transparentBase64! }));
    
    if (transparentImages.length === 0) return;

    const newProductImages: ProductImageFile[] = transparentImages.map((img): ProductImageFile => ({
      id: img.id, originalBase64: img.src, status: 'pending', transparentBase64: img.src, generatedBase64: null, errorMessage: undefined,
    })).reverse();

    const stateSetter = column1Tab === 'fashion' ? setProductImages : setCustomProductImages;
    stateSetter(newProductImages);
    setSkipBgRemoval(true);
    addLog(`Đã thay thế danh sách sản phẩm ở tab '${column1Tab}' bằng ${newProductImages.length} ảnh đã tách nền. Tùy chọn 'Bỏ qua bước tách nền' đã được tự động bật.`);
  };
  
  const handleSelectionChange = (imageId: string) => {
    setSelectedImageIds(prev => { const newSelection = new Set(prev); if (newSelection.has(imageId)) { newSelection.delete(imageId); } else { newSelection.add(imageId); } return newSelection; });
  };

  const handleSelectAllImages = () => {
    setSelectedImageIds(prev => prev.size === generatedImages.length ? new Set<string>() : new Set(generatedImages.map(img => img.id)));
  };

  const handleGroupSelectionChange = (imageIds: string[]) => {
    setSelectedImageIds(prev => {
        const newSelection = new Set(prev);
        const areAllSelected = imageIds.every(id => newSelection.has(id));

        if (areAllSelected) {
            imageIds.forEach(id => newSelection.delete(id));
        } else {
            imageIds.forEach(id => newSelection.add(id));
        }
        return newSelection;
    });
};

  const handleDeleteSelected = () => {
    if (selectedImageIds.size === 0) return;
    const isviewerImageSelected = generatedImages.some(img => selectedImageIds.has(img.id) && viewerImage === img.src);
    setGeneratedImages(prev => prev.filter(image => !selectedImageIds.has(image.id)));
    if (isviewerImageSelected) { 
        setViewerImage(null); 
        setActiveGeneratedImage(null);
        setActiveTransparentProductImage(null); 
        setActiveOriginalProductImage(null); 
    }
    addLog(`Đã xóa ${selectedImageIds.size} tác phẩm đã chọn.`);
    setSelectedImageIds(new Set());
  };

  const handleDownloadSelected = async () => {
    const imagesToDownload = generatedImages.filter(img => selectedImageIds.has(img.id));
    if (imagesToDownload.length > 0) { await handleDownloadAll(imagesToDownload); }
  };

  const handleSaveApiSettings = (keys: string[], concurrency: number) => {
    setApiKeys(keys);
    setMaxConcurrency(concurrency);
    addLog(`Đã lưu cài đặt API. Số key: ${keys.length}, Số yêu cầu đồng thời: ${concurrency}.`);
  };

  const handleSaveReferences = (bg: string, pose: string, style: string, usage: string) => {
    if (column1Tab === 'fashion') {
        setFashionBackgroundReference(bg);
        setFashionPoseReference(pose);
        setFashionStyleReference(style);
        setFashionCombinedReference(combineReferencesForDisplay(bg, pose, style));
    } else {
        setCustomBackgroundReference(bg);
        setCustomPoseReference(pose);
        setCustomStyleReference(style);
        setCustomProductUsageReference(usage);
        setCustomCombinedReference(combineReferencesForDisplay(bg, pose, style, usage));
    }
    setIsReferenceModalOpen(false);
  };
  
  const handleRandomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 100000));
  };
  
  const handleResetPrompt = () => {
    if (column1Tab === 'fashion') {
        setFashionPromptVi(getFashionPromptVi(fashionAspectRatio));
        setFashionPromptEn(getFashionPromptEn(fashionAspectRatio));
        addLog('Đã khôi phục prompt mặc định cho tab Thời Trang.');
    } else {
        setCustomPromptVi(getCustomPromptVi(fashionAspectRatio));
        setCustomPromptEn(getCustomPromptEn(fashionAspectRatio));
        addLog('Đã khôi phục prompt mặc định cho tab Tuỳ Biến.');
    }
  };

  const handleResetBgRemovalPrompt = () => {
    if (column1Tab === 'fashion') {
        setFashionBgRemovalPrompt(DEFAULT_BG_REMOVAL_PROMPT);
        addLog('Đã khôi phục prompt tách nền mặc định cho tab Thời Trang.');
    } else {
        setCustomBgRemovalPrompt(DEFAULT_BG_REMOVAL_PROMPT);
        addLog('Đã khôi phục prompt tách nền mặc định cho tab Tuỳ Biến.');
    }
  };

  const handleSuggestPrompts = async () => {
    const productsToUse = column1Tab === 'fashion' ? productImages : customProductImages;
    const selectedIds = column1Tab === 'fashion' ? selectedProductIds : selectedCustomProductIds;
    const setSuggestedPrompts = column1Tab === 'fashion' ? setFashionSuggestedPrompts : setCustomSuggestedPrompts;
    const combinedReference = column1Tab === 'fashion' ? fashionCombinedReference : customCombinedReference;
    
    let productForSuggestion = activeOriginalProductImage;
    if (!productForSuggestion) {
        const firstSelected = productsToUse.find(p => selectedIds.has(p.id));
        productForSuggestion = firstSelected ? firstSelected.originalBase64 : (productsToUse[0] ? productsToUse[0].originalBase64 : null);
    }
    
    if (!productForSuggestion || !currentCharacterImage) {
        setError("Vui lòng tải lên ảnh nhân vật và ít nhất một ảnh sản phẩm để nhận gợi ý.");
        addLog("Lỗi gợi ý: Thiếu ảnh nhân vật hoặc sản phẩm.");
        return;
    }

    const apiKey = getNextApiKey();
    if (!apiKey) {
        setError("Không có API Key nào được cấu hình.");
        return;
    }
    
    setIsSuggestingPrompts(true);
    setSuggestedPrompts([]);
    setError(null);
    addLog("Đang tạo gợi ý prompt...");

    try {
        const references = parseCombinedReferenceForApi(combinedReference);
        const suggestions = await suggestPrompts(apiKey, productForSuggestion, currentCharacterImage, references);
        setSuggestedPrompts(suggestions);
        addLog(`✅ Đã tạo ${suggestions.length} gợi ý prompt thành công.`);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        addLog(`❌ Lỗi khi gợi ý prompt: ${errorMessage}`);
    } finally {
        setIsSuggestingPrompts(false);
    }
  };

  const handleSuggestEditPrompts = async () => {
    if (!editSourceImage) {
        setError("Vui lòng tải ảnh gốc để nhận gợi ý.");
        return;
    }
    const apiKey = getNextApiKey();
    if (!apiKey) {
        setError("Không có API Key nào được cấu hình.");
        return;
    }
    
    setIsSuggestingEditPrompts(true);
    setEditSuggestedPrompts([]);
    setError(null);
    addLog(`Đang tạo ${editPromptSuggestionCount} gợi ý chỉnh sửa ảnh...`);

    try {
        const suggestions = await suggestEditPrompts(apiKey, editSourceImage, editPrompt, editPromptSuggestionCount);
        setEditSuggestedPrompts(suggestions);
        addLog(`✅ Đã tạo ${suggestions.length} gợi ý chỉnh sửa.`);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        addLog(`❌ Lỗi khi gợi ý chỉnh sửa: ${errorMessage}`);
    } finally {
        setIsSuggestingEditPrompts(false);
    }
};

const handleAppendExpansionPrompt = () => {
    let directionText = '';
    switch (expansionDirection) {
        case 'all': directionText = 'về mọi phía'; break;
        case 'horizontal': directionText = 'theo chiều ngang'; break;
        case 'vertical': directionText = 'theo chiều dọc'; break;
        case 'up': directionText = 'lên trên'; break;
        case 'down': directionText = 'xuống dưới'; break;
        case 'left': directionText = 'sang trái'; break;
        case 'right': directionText = 'sang phải'; break;
    }

    let prompt = `Mở rộng ảnh ${directionText} với tỷ lệ khoảng ${expansionFactor}x`;
    if (enhanceQuality) {
        prompt += ', đồng thời tăng cường chất lượng và chi tiết cho ảnh';
    }
    prompt += '.';

    setEditPrompt(prev => prev ? `${prev}. ${prompt}` : prompt);
};


  const handleAnalyzeStory = async () => {
    if (!storyText.trim()) {
      setError("Vui lòng nhập câu chuyện để phân tích.");
      return;
    }
    const apiKey = getNextApiKey();
    if (!apiKey) {
      setError("Không có API Key nào được cấu hình.");
      return;
    }

    setIsAnalyzingStory(true);
    setSuggestedScenes([]);
    setError(null);
    addLog("Đang phân tích câu chuyện...");

    try {
      const scenes = await analyzeStoryAndSuggestScenes(apiKey, storyText);
      setSuggestedScenes(scenes);
      addLog(`✅ Phân tích câu chuyện thành công, tìm thấy ${scenes.length} cảnh.`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      addLog(`❌ Lỗi khi phân tích câu chuyện: ${errorMessage}`);
    } finally {
      setIsAnalyzingStory(false);
    }
  };

  const handleGenerateStory = async () => {
    if (suggestedScenes.length === 0) {
      setError('Vui lòng phân tích câu chuyện để có danh sách cảnh trước.');
      return;
    }
  
    stopSignalRef.current = false;
    setIsLoading(true);
    setIsGeneratingStory(true);
    setError(null);
    setProgressMessage('');
    const totalFrames = suggestedScenes.length * 2;
    setStoryGenerationProgress({ completed: 0, total: totalFrames });
    addLog(`Bắt đầu tạo câu chuyện với ${suggestedScenes.length} cảnh (${totalFrames} khung hình).`);
  
    let previousSceneImage: string | null = null;
    const successfullyGenerated: GeneratedImage[] = [];
  
    for (let i = 0; i < suggestedScenes.length; i++) {
      if (stopSignalRef.current) break;
  
      const scene = suggestedScenes[i];
      const sceneIndex = i + 1;
  
      const generateFrame = async (prompt: string, frameType: 'Bắt đầu' | 'Kết thúc', frameNumber: number) => {
        if (stopSignalRef.current) return;
  
        const logPrefix = `Cảnh ${sceneIndex}/${suggestedScenes.length} (${frameType})`;
        setStoryGenerationProgress({ completed: frameNumber - 1, total: totalFrames });
        setProgressMessage(`Đang tạo ${logPrefix}...`);
  
        const apiKey = getNextApiKey();
        if (!apiKey) {
          throw new Error("Không có API Key nào được cấu hình.");
        }
  
        try {
          let generatedImageSrc: string;
          const isFirstFrameOverall = frameNumber === 1;
  
          if (isFirstFrameOverall || !keepCharacterConsistent) {
            addLog(`${logPrefix}: Đang tạo cảnh với Imagen...`);
            generatedImageSrc = await generateImageFromText(apiKey, prompt, ttiAspectRatio);
          } else {
            if (!previousSceneImage) {
              throw new Error("Không có ảnh cảnh trước để tham chiếu. Khung hình đầu tiên có thể đã bị lỗi.");
            }
            addLog(`${logPrefix}: Đang tạo cảnh tiếp theo, giữ nhân vật nhất quán...`);
  
            const ratioText = ttiAspectRatio === '9:16' ? 'a tall, vertical 9:16' : 'a wide, horizontal 16:9';
            const consistencyPrompt = `**Instruction:** Create ${ratioText} image. Use the person from the provided reference image and place them in a new scene described by the prompt below.
            **CRITICAL:** Maintain the person's exact appearance, face, hair, and clothing from the reference image.
            **New Scene Prompt:** "${prompt}"`;
  
            const emptyPixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
            generatedImageSrc = await generateScene(apiKey, emptyPixel, previousSceneImage, consistencyPrompt);
          }
  
          if (stopSignalRef.current) return;
  
          previousSceneImage = generatedImageSrc;
  
          const newImage: GeneratedImage = {
            id: `${Date.now()}-story-s${sceneIndex}-${frameType}`,
            src: generatedImageSrc,
            transparentProductSrc: previousSceneImage,
            originalProductSrc: previousSceneImage,
            characterImageSrc: '',
            prompt: prompt,
            backgroundReference: '',
            negativePrompt: '',
            bgRemovalPrompt: '',
            poseReference: '',
            styleReference: '',
            backgroundReferenceImage: (!isFirstFrameOverall && keepCharacterConsistent) ? previousSceneImage : null,
            sceneIndex: sceneIndex,
            frameType: frameType === 'Bắt đầu' ? 'start' : 'end',
          };
  
          setViewerImage(newImage.src);
          setActiveGeneratedImage(newImage);
          successfullyGenerated.push(newImage);
          if (autoSaveToGallery) {
            setStoryGeneratedImages(prev => [newImage, ...prev]);
          }
          addLog(`✅ ${logPrefix}: Hoàn thành!`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            const fullErrorMessage = `${logPrefix}: Lỗi - ${errorMessage.split('\n')[0]}`;
            setError(prev => (prev ? `${prev}\n${fullErrorMessage}` : fullErrorMessage));
            addLog(`❌ ${fullErrorMessage}`);
            throw err; // Propagate error to stop the story generation if a frame fails
        }
      };
  
      try {
        // Generate Start Frame
        await generateFrame(scene.startPrompt.en, 'Bắt đầu', (i * 2) + 1);
        // Generate End Frame
        await generateFrame(scene.endPrompt.en, 'Kết thúc', (i * 2) + 2);
      } catch (error) {
          addLog(`Dừng tạo câu chuyện do có lỗi ở cảnh ${sceneIndex}.`);
          setStoryGenerationProgress({ completed: totalFrames, total: totalFrames });
          break; // Stop processing further scenes if one fails
      }
    }
  
    setStoryGenerationProgress({ completed: totalFrames, total: totalFrames });
  
    if (autoDownloadAll && successfullyGenerated.length > 0 && !stopSignalRef.current) {
      handleDownloadAll(successfullyGenerated);
    }
  
    setIsLoading(false);
    setIsGeneratingStory(false);
    setProgressMessage('');
    addLog("Hoàn tất quá trình tạo câu chuyện.");
  };

    const handleSelectStoryImage = (image: GeneratedImage) => {
        setViewerImage(image.src);
        setActiveGeneratedImage(image);
    };

    const handleDeleteStoryImage = (imageId: string) => {
        const imageToDelete = storyGeneratedImages.find(img => img.id === imageId);
        setStoryGeneratedImages(prev => prev.filter(image => image.id !== imageId));
        setSelectedStoryImageIds(prev => { const newSelection = new Set(prev); newSelection.delete(imageId); return newSelection; });
        addLog(`Đã xóa ảnh câu chuyện (ID: ${imageId}).`);
        if (imageToDelete && viewerImage === imageToDelete.src) {
            setViewerImage(null);
            setActiveGeneratedImage(null);
        }
    };

    const handleStoryImageSelectionChange = (imageId: string) => {
        setSelectedStoryImageIds(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(imageId)) {
                newSelection.delete(imageId);
            } else {
                newSelection.add(imageId);
            }
            return newSelection;
        });
    };
    
    const handleSelectAllStoryImages = () => {
        setSelectedStoryImageIds(prev => prev.size === storyGeneratedImages.length ? new Set<string>() : new Set(storyGeneratedImages.map(img => img.id)));
    };

    const handleDeleteSelectedStoryImages = () => {
        if (selectedStoryImageIds.size === 0) return;
        setStoryGeneratedImages(prev => prev.filter(image => !selectedStoryImageIds.has(image.id)));
        addLog(`Đã xóa ${selectedStoryImageIds.size} ảnh câu chuyện đã chọn.`);
        setSelectedStoryImageIds(new Set());
    };

    const handleDownloadSelectedStoryImages = async () => {
        const imagesToDownload = storyGeneratedImages.filter(img => selectedImageIds.has(img.id));
        if (imagesToDownload.length === 0) return;
        addLog(`Bắt đầu tải về ${imagesToDownload.length} ảnh câu chuyện đã chọn.`);
        for (const image of imagesToDownload) {
            let filename: string;
            if (image.sceneIndex !== undefined && image.frameType) {
                const frameLabel = image.frameType === 'start' ? 'A' : 'B';
                filename = `Cảnh ${image.sceneIndex} ${frameLabel}.png`;
            } else {
                filename = `ai-story-image-${image.id.slice(-6)}.png`;
            }
            handleDownload(image.src, filename);
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        addLog(`Hoàn tất tải về ảnh câu chuyện đã chọn.`);
    };
  
    const handleSceneSelectionChange = (sceneIndex: number, startImageId?: string, endImageId?: string) => {
        if (!startImageId || !endImageId) return;

        setSelectedStoryImageIds(prev => {
            const newSelection = new Set(prev);
            // If one is selected, we assume both are (or should be), so we deselect both.
            if (newSelection.has(startImageId)) {
                newSelection.delete(startImageId);
                newSelection.delete(endImageId);
            } else {
                newSelection.add(startImageId);
                newSelection.add(endImageId);
            }
            return newSelection;
        });
    };

    const handleOpenVideoPromptModal = () => {
        const selectedSceneIndices = new Set<number>();
        storyGeneratedImages.forEach(img => {
            if (selectedStoryImageIds.has(img.id) && img.sceneIndex !== undefined) {
                selectedSceneIndices.add(img.sceneIndex);
            }
        });
        
        if (selectedSceneIndices.size === 0) {
            setError("Vui lòng chọn ít nhất một cảnh để gợi ý prompt video.");
            return;
        }
        
        setIsVideoPromptModalOpen(true);
    };

    const handleGenerateVideoPrompts = async () => {
        setIsGeneratingVideoPrompts(true);
        setError(null);
        addLog("Bắt đầu tạo gợi ý prompt video...");

        const apiKey = getNextApiKey();
        if (!apiKey) {
            setError("Không có API Key nào được cấu hình.");
            setIsGeneratingVideoPrompts(false);
            return;
        }
        
        const selectedSceneIndices = new Set<number>();
        storyGeneratedImages.forEach(img => {
            if (selectedStoryImageIds.has(img.id) && img.sceneIndex !== undefined) {
                selectedSceneIndices.add(img.sceneIndex);
            }
        });

        const scenesToProcess = Array.from(selectedSceneIndices).map(sceneIndex => {
            const sceneInfo = suggestedScenes[sceneIndex - 1];
            const startImage = storyGeneratedImages.find(img => img.sceneIndex === sceneIndex && img.frameType === 'start');
            const endImage = storyGeneratedImages.find(img => img.sceneIndex === sceneIndex && img.frameType === 'end');
            
            if (!sceneInfo || !startImage || !endImage) return null;

            return {
                sceneDescription: sceneInfo.scene,
                startImageBase64: startImage.src,
                endImageBase64: endImage.src,
                originalIndex: sceneIndex - 1,
            };
        }).filter(Boolean) as Array<{ sceneDescription: string; startImageBase64: string; endImageBase64: string; originalIndex: number; }>;

        if (scenesToProcess.length === 0) {
            setError("Không tìm thấy đủ dữ liệu ảnh cho các cảnh đã chọn.");
            setIsGeneratingVideoPrompts(false);
            return;
        }

        try {
            const videoPrompts = await suggestVideoPrompts(apiKey, scenesToProcess, storyText, videoPromptStructure);
            
            setSuggestedScenes(prevScenes => {
                const newScenes = [...prevScenes];
                scenesToProcess.forEach((processedScene, i) => {
                    newScenes[processedScene.originalIndex].videoPrompt = videoPrompts[i];
                });
                return newScenes;
            });
            addLog(`✅ Đã tạo ${videoPrompts.length} gợi ý prompt video thành công.`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            addLog(`❌ Lỗi khi gợi ý prompt video: ${errorMessage}`);
        } finally {
            setIsGeneratingVideoPrompts(false);
        }
    };
    
    const handleDownloadAllFromModal = async (scenes: DisplayScene[]) => {
        if (scenes.length === 0) return;
        addLog(`Bắt đầu tải về tất cả tài sản cho ${scenes.length} cảnh...`);
        
        for (let i = 0; i < scenes.length; i++) {
            const scene = scenes[i];
            const sceneData = suggestedScenes.find(s => s.scene === scene.scene);
            const sceneIndex = suggestedScenes.indexOf(sceneData!) + 1;
            
            // Download start image
            if (scene.startImageSrc) {
                handleDownload(scene.startImageSrc, `Cảnh ${sceneIndex} A.png`);
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            // Download end image
            if (scene.endImageSrc) {
                handleDownload(scene.endImageSrc, `Cảnh ${sceneIndex} B.png`);
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            // Download prompt text
            if (scene.videoPrompt) {
                const safeStoryName = storyText.replace(/[<>:"/\\|?*]+/g, '').split(' ').slice(0, 5).join(' ');
                const filename = `${safeStoryName || 'Cau Chuyen'} - Cảnh ${sceneIndex}.txt`;
                handleDownloadText(scene.videoPrompt, filename);
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }
        addLog(`Hoàn tất tải về tài sản.`);
      };
  
  const NavButton: React.FC<{ tabName: 'creator' | 'settings', children: React.ReactNode }> = ({ tabName, children }) => (
    <button onClick={() => setActiveTab(tabName)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tabName ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
        {children}
    </button>
  );

  const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 -mb-px text-sm font-semibold border-b-2 transition-colors ${
            active
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
        }`}
    >
        {children}
    </button>
);

  const SubTabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold transition-colors w-full rounded-t-md ${
            active
                ? 'bg-slate-900 border-x border-t border-gray-700 text-cyan-400'
                : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/80 border-b border-gray-700'
        }`}
    >
        {children}
    </button>
);

  const productsForCurrentTab =
    column1Tab === 'fashion'
        ? productImages
        : column1Tab === 'custom' && customTabMode === 'batch'
        ? customProductImages
        : [];
  const canGenerate =
    (column1Tab === 'fashion' || (column1Tab === 'custom' && customTabMode === 'batch'))
        ? productsForCurrentTab.length > 0 && !!currentCharacterImage
        : column1Tab === 'text-to-image'
        ? ttiPrompt.trim() !== ''
        : (column1Tab === 'custom' && customTabMode === 'edit')
        ? !!editSourceImage && editPrompt.trim() !== ''
        : false;
  const canRemoveBackgroundOnly = (column1Tab === 'fashion' || (column1Tab === 'custom' && customTabMode === 'batch')) ? productsForCurrentTab.length > 0 && !skipBgRemoval : false;
  const canGenerateNewBackground = (column1Tab === 'fashion' || column1Tab === 'custom') ? !!(activeTransparentProductImage || lastUsedProductImage) && !!currentCharacterImage && !backgroundReferenceImage : false;

  const AspectRatioToggle: React.FC<{
    aspectRatio: '9:16' | '16:9';
    onAspectRatioChange: (ratio: '9:16' | '16:9') => void;
    disabled?: boolean;
    }> = ({ aspectRatio, onAspectRatioChange, disabled }) => (
    <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">Tỷ lệ khung hình</label>
        <div className="flex">
            <button
                onClick={() => onAspectRatioChange('9:16')}
                disabled={disabled}
                className={`w-full py-1.5 px-3 text-sm font-semibold rounded-l-md transition-colors duration-200 focus:z-10 focus:outline-none ${
                    aspectRatio === '9:16'
                        ? 'bg-cyan-600 text-white border-2 border-cyan-400'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600 border-2 border-slate-700'
                }`}
            >
                9:16 (Dọc)
            </button>
            <button
                onClick={() => onAspectRatioChange('16:9')}
                disabled={disabled}
                className={`w-full py-1.5 px-3 text-sm font-semibold rounded-r-md -ml-px transition-colors duration-200 focus:z-10 focus:outline-none ${
                    aspectRatio === '16:9'
                        ? 'bg-cyan-600 text-white border-2 border-cyan-400'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600 border-2 border-slate-700'
                }`}
            >
                16:9 (Ngang)
            </button>
        </div>
    </div>
    );

  const ActionPanel = () => (
    <div className="w-full p-4 bg-gray-900/50 rounded-lg border-2 border-cyan-500/30 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-center text-cyan-400">Bảng điều khiển Tác vụ</h3>
        <div className="space-y-4 mb-4">
          <GenerationSettings
            seed={seed}
            onSeedChange={setSeed}
            onRandomizeSeed={handleRandomizeSeed}
            variants={numberOfVariants}
            onVariantsChange={setNumberOfVariants}
            disabled={isLoading}
          />
          {(column1Tab === 'fashion' || column1Tab === 'custom') && (
                <AspectRatioToggle
                    aspectRatio={fashionAspectRatio}
                    onAspectRatioChange={setFashionAspectRatio}
                    disabled={isLoading}
                />
            )}
        </div>
        {isLoading ? (
        <button
            onClick={handleStop}
            className="w-full py-3 px-4 rounded-md font-semibold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 transition-colors"
        >
            Dừng Lại
        </button>
        ) : (
        <div className="grid grid-cols-2 gap-2">
            <div className="relative">
                <button
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className="w-full h-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                    Bắt Đầu Tạo Hàng Loạt
                </button>
                <div className="absolute top-1/2 right-2 -translate-y-1/2">
                   <Tooltip content="Bắt đầu quá trình tạo ảnh cho tất cả sản phẩm trong danh sách. Hệ thống sẽ xử lý tuần tự từng sản phẩm và các biến thể của nó." />
                </div>
            </div>
             <div className="relative">
                <button
                    onClick={handleBackgroundRemovalOnly}
                    disabled={!canRemoveBackgroundOnly}
                    className="w-full h-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                    Chỉ Tách Nền
                </button>
                 <div className="absolute top-1/2 right-2 -translate-y-1/2">
                    <Tooltip content="Chỉ thực hiện bước tách nền cho tất cả sản phẩm. Kết quả sẽ hiển thị ở thư viện 'Ảnh Đã Tách Nền' phía dưới. Hữu ích khi bạn muốn chuẩn bị trước sản phẩm." />
                </div>
            </div>
            <div className="relative col-span-2">
                <button
                    onClick={handleNewBackground}
                    disabled={!canGenerateNewBackground}
                    className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-gray-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                    Nền Mới (cho ảnh đang xem)
                </button>
                <div className="absolute top-1/2 right-2 -translate-y-1/2">
                    <Tooltip content="Tạo một phiên bản mới của ảnh đang xem với một bối cảnh ngẫu nhiên khác. Tính năng này chỉ hoạt động sau khi bạn đã tạo ít nhất một ảnh." />
                </div>
            </div>
        </div>
        )}
  </div>
);

  const advancedPanelProps = column1Tab === 'fashion' ? {
      promptVi: fashionPromptVi,
      onPromptViChange: setFashionPromptVi,
      onPromptEnChange: setFashionPromptEn,
      negativePrompt: fashionNegativePrompt,
      onNegativePromptChange: setFashionNegativePrompt,
      bgRemovalPrompt: fashionBgRemovalPrompt,
      onBgRemovalPromptChange: setFashionBgRemovalPrompt,
      onSuggestPrompts: handleSuggestPrompts,
      suggestedPrompts: fashionSuggestedPrompts,
      onSuggestedPromptClick: (p: {en: string, vi: string}) => {
          setFashionPromptVi(p.vi);
          setFashionPromptEn(p.en);
      },
      canSuggest: !!fashionCharacterImage && productImages.length > 0,
      onResetPrompt: handleResetPrompt,
      onResetBgRemovalPrompt: handleResetBgRemovalPrompt,
  } : {
      promptVi: customPromptVi,
      onPromptViChange: setCustomPromptVi,
      onPromptEnChange: setCustomPromptEn,
      negativePrompt: customNegativePrompt,
      onNegativePromptChange: setCustomNegativePrompt,
      bgRemovalPrompt: customBgRemovalPrompt,
      onBgRemovalPromptChange: setCustomBgRemovalPrompt,
      onSuggestPrompts: handleSuggestPrompts,
      suggestedPrompts: customSuggestedPrompts,
      onSuggestedPromptClick: (p: {en: string, vi: string}) => {
          setCustomPromptVi(p.vi);
          setCustomPromptEn(p.en);
      },
      canSuggest: !!customCharacterImage && customProductImages.length > 0,
      onResetPrompt: handleResetPrompt,
      onResetBgRemovalPrompt: handleResetBgRemovalPrompt,
  };
  
    const scenesForModal: DisplayScene[] = useMemo(() => {
        if (!isVideoPromptModalOpen) return [];
        
        const selectedSceneIndices = new Set<number>();
        storyGeneratedImages.forEach(img => {
            if (selectedStoryImageIds.has(img.id) && img.sceneIndex !== undefined) {
                selectedSceneIndices.add(img.sceneIndex);
            }
        });

        return Array.from(selectedSceneIndices).sort((a, b) => a - b).map(sceneIndex => {
            const sceneInfo = suggestedScenes[sceneIndex - 1];
            const startImage = storyGeneratedImages.find(img => img.sceneIndex === sceneIndex && img.frameType === 'start');
            const endImage = storyGeneratedImages.find(img => img.sceneIndex === sceneIndex && img.frameType === 'end');
            return {
                ...sceneInfo,
                startImageSrc: startImage?.src,
                endImageSrc: endImage?.src,
            };
        });
    }, [isVideoPromptModalOpen, selectedStoryImageIds, storyGeneratedImages, suggestedScenes]);
    
    const productsForGallery = column1Tab === 'fashion' ? productImages : customProductImages;
    
    const productsForTransparentGallery = column1Tab === 'fashion' ? productImages : customProductImages;
    const transparentImagesForGallery = productsForTransparentGallery.filter(p => p.transparentBase64).map(p => ({ id: p.id, src: p.transparentBase64! })).reverse();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
       {isGalleryModalOpen && galleryModalConfig && (
            <GallerySelectionModal
                isOpen={isGalleryModalOpen}
                onClose={() => setIsGalleryModalOpen(false)}
                onConfirm={(selectedSrcs) => {
                    galleryModalConfig.onSelect(selectedSrcs);
                    setIsGalleryModalOpen(false);
                }}
                images={generatedImages}
                multiple={galleryModalConfig.multiple}
                title={galleryModalConfig.title}
            />
        )}
       {isReferenceModalOpen && (
            <ReferenceOptionsModal
                isOpen={isReferenceModalOpen}
                onClose={() => setIsReferenceModalOpen(false)}
                onSave={handleSaveReferences}
                initialBackground={column1Tab === 'fashion' ? fashionBackgroundReference : customBackgroundReference}
                initialPose={column1Tab === 'fashion' ? fashionPoseReference : customPoseReference}
                initialStyle={column1Tab === 'fashion' ? fashionStyleReference : customStyleReference}
                initialProductUsage={column1Tab === 'custom' ? customProductUsageReference : ''}
                backgroundSuggestions={backgroundSuggestions}
                poseSuggestions={poseSuggestions}
                styleSuggestions={styleSuggestions}
                productUsageSuggestions={column1Tab === 'custom' ? productUsageSuggestions : undefined}
                isBackgroundDisabled={!!backgroundReferenceImage}
            />
        )}
        {isVideoPromptModalOpen && (
            <VideoPromptModal 
                isOpen={isVideoPromptModalOpen}
                onClose={() => setIsVideoPromptModalOpen(false)}
                scenes={scenesForModal}
                onGeneratePrompts={handleGenerateVideoPrompts}
                onUpdateScenePrompt={(sceneDesc, newPrompt) => {
                    setSuggestedScenes(prevScenes => prevScenes.map(scene => 
                        scene.scene === sceneDesc ? { ...scene, videoPrompt: newPrompt } : scene
                    ));
                }}
                isGenerating={isGeneratingVideoPrompts}
                onDownloadPrompt={handleDownloadText}
                storyName={storyText}
                onDownloadAll={handleDownloadAllFromModal}
                videoPromptStructure={videoPromptStructure}
                onVideoPromptStructureChange={setVideoPromptStructure}
            />
        )}
      <div className="max-w-screen-3xl mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-600">
            Thái Media - Automation Ai image V2
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-400">
            Tải lên ảnh nhân vật và sản phẩm để tạo ra một bối cảnh hoàn toàn mới.
          </p>
        </header>

        <nav className="flex justify-center mb-8 space-x-4">
            <NavButton tabName="creator">Tạo ảnh</NavButton>
            <NavButton tabName="settings">Cài đặt API</NavButton>
        </nav>

        {activeTab === 'creator' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* --- COLUMN 1: Staging & Wardrobe --- */}
              <div className="relative w-full rounded-xl">
                  <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 opacity-70 blur-md" aria-hidden="true"></div>
                  <div className="relative flex flex-col gap-6 rounded-xl bg-slate-900 p-6 h-full">
                    <ColumnHeader 
                        step={1} 
                        title="Không gian Dàn dựng & Tủ đồ" 
                        subtitle="Tải lên tài sản của bạn" 
                        color="purple"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5-15h16.5a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 20.25 21H3.75A2.25 2.25 0 0 1 1.5 18.75V5.25A2.25 2.25 0 0 1 3.75 3Z" /></svg>}
                    />

                    <div className="flex border-b border-gray-700 mb-0">
                        <TabButton active={column1Tab === 'fashion'} onClick={() => setColumn1Tab('fashion')}>
                            Thời Trang
                        </TabButton>
                        <TabButton active={column1Tab === 'custom'} onClick={() => setColumn1Tab('custom')}>
                            Tuỳ Biến
                        </TabButton>
                        <TabButton active={column1Tab === 'text-to-image'} onClick={() => setColumn1Tab('text-to-image')}>
                            Text to Image
                        </TabButton>
                    </div>

                    {column1Tab === 'fashion' && (
                        <div className="flex flex-col gap-6">
                            <ActionPanel />
                            <div className="flex w-full items-end gap-4">
                                <div className="w-2/3">
                                    <div className="flex justify-center items-center gap-2 mb-3">
                                        <h3 className="text-lg font-semibold text-center text-gray-300">Ảnh Nhân Vật</h3>
                                        <Tooltip content="Tải lên ảnh chân dung hoặc toàn thân của người mẫu. AI sẽ sử dụng khuôn mặt và mái tóc từ ảnh này để áp dụng vào các tư thế mới." />
                                        {fashionCharacterImage && !isLoading && (
                                            <button onClick={() => setFashionCharacterImage(null)} className="p-1 text-gray-500 hover:text-red-400" aria-label="Xóa ảnh nhân vật">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <ImageUploader id="character-upload" label="Ảnh của người/nhân vật" onImageUpload={handleCharacterImageUploadForTab('fashion')} disabled={isLoading} previewSrc={fashionCharacterImage} onPreviewClick={() => handleViewImage(fashionCharacterImage)} 
                                      onSelectFromGallery={() => handleOpenGalleryModal({
                                        title: "Chọn ảnh Nhân Vật từ Thư viện",
                                        multiple: false,
                                        onSelect: (selectedSrcs) => {
                                          if (selectedSrcs.length > 0) {
                                            setFashionCharacterImage(selectedSrcs[0]);
                                            addLog('Đã chọn ảnh nhân vật từ thư viện.');
                                          }
                                        }
                                    })}
                                    />
                                </div>
                                <div className="w-1/3">
                                <div className="flex justify-center items-center gap-2 mb-3">
                                        <h3 className="text-base font-semibold text-center text-gray-300 whitespace-nowrap">Nền Tham Chiếu</h3>
                                        <Tooltip content="Tải lên một ảnh để AI sử dụng làm bối cảnh tham chiếu. Khi sử dụng ảnh này, các tùy chọn tham chiếu bằng văn bản sẽ bị vô hiệu hóa." />
                                        {backgroundReferenceImage && !isLoading && (
                                            <button onClick={() => setBackgroundReferenceImage(null)} className="p-1 text-gray-500 hover:text-red-400" aria-label="Xóa ảnh nền tham chiếu">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                <ImageUploader id="background-ref-upload" label="Ảnh nền" onImageUpload={handleBackgroundReferenceImageUpload} disabled={isLoading} previewSrc={backgroundReferenceImage} containerClassName="h-24" onPreviewClick={() => handleViewImage(backgroundReferenceImage)} 
                                  onSelectFromGallery={() => handleOpenGalleryModal({
                                    title: "Chọn ảnh Nền Tham Chiếu từ Thư viện",
                                    multiple: false,
                                    onSelect: (selectedSrcs) => {
                                      if (selectedSrcs.length > 0) {
                                        setBackgroundReferenceImage(selectedSrcs[0]);
                                        addLog('Đã chọn ảnh nền tham chiếu từ thư viện.');
                                      }
                                    }
                                  })}
                                />
                                </div>
                            </div>

                            <div className="w-full">
                            <div className="flex justify-center items-center gap-2 mb-3">
                                <h3 className="text-lg font-semibold text-center text-gray-300">Ảnh Sản Phẩm (Tủ đồ)</h3>
                                <Tooltip content="Tải lên một hoặc nhiều ảnh sản phẩm (quần áo). AI sẽ tự động tách nền và ghép vào người mẫu." />
                            </div>
                            <ImageUploader id="product-upload" label="Nhấn để chọn một hoặc nhiều ảnh sản phẩm" onImageUpload={handleProductImageUploadForTab('fashion')} multiple={true} disabled={isLoading} 
                              onSelectFromGallery={() => handleOpenGalleryModal({
                                title: "Chọn ảnh Sản phẩm từ Thư viện",
                                multiple: true,
                                onSelect: (selectedSrcs) => addProductImagesFromGallery(selectedSrcs, 'fashion')
                              })}
                            />
                            <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center">
                                    <input id="skip-bg-removal-checkbox" type="checkbox" checked={skipBgRemoval} onChange={(e) => setSkipBgRemoval(e.target.checked)} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-cyan-600 focus:ring-cyan-500 cursor-pointer" disabled={isLoading} />
                                    <label htmlFor="skip-bg-removal-checkbox" className="ml-2 block text-sm font-medium text-gray-300 select-none cursor-pointer">Bỏ qua bước tách nền.</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-400">Màu nền ảnh tách:</span>
                                    <button onClick={() => setTransparentImageBgColor('bg-white')} className={`w-6 h-6 rounded-full bg-white border-2 transition-colors ${transparentImageBgColor === 'bg-white' ? 'border-cyan-400 ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900' : 'border-gray-500 hover:border-white'}`} aria-label="Chọn nền trắng" />
                                    <button onClick={() => setTransparentImageBgColor('bg-black')} className={`w-6 h-6 rounded-full bg-black border-2 transition-colors ${transparentImageBgColor === 'bg-black' ? 'border-cyan-400 ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900' : 'border-gray-500 hover:border-gray-400'}`} aria-label="Chọn nền đen" />
                                    <button onClick={() => setTransparentImageBgColor('bg-gray-800')} className={`w-6 h-6 rounded-full bg-gray-800 border-2 transition-colors ${transparentImageBgColor === 'bg-gray-800' ? 'border-cyan-400 ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900' : 'border-gray-500 hover:border-gray-400'}`} aria-label="Chọn nền xám" />
                                </div>
                            </div>
                            {productImages.length > 0 && (
                                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                                    <button
                                        onClick={handleDeselectAllProducts}
                                        disabled={isLoading || selectedProductIds.size === 0}
                                        className="px-4 py-2 text-sm font-medium rounded-lg shadow-sm text-white bg-slate-700 hover:bg-slate-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Bỏ chọn Tất cả
                                    </button>
                                    <button
                                        onClick={handleDeleteSelectedProducts}
                                        disabled={isLoading || selectedProductIds.size === 0}
                                        className="px-4 py-2 text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Xóa mục đã chọn ({selectedProductIds.size})
                                    </button>
                                    <button
                                        onClick={handleDeleteAllProducts}
                                        disabled={isLoading || productImages.length === 0}
                                        className="px-4 py-2 text-sm font-medium rounded-lg shadow-sm text-white bg-red-700 hover:bg-red-800 disabled:bg-red-900/50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Xóa Tất cả ({productImages.length})
                                    </button>
                                </div>
                            )}
                             <div className="mt-4 flex flex-col gap-4 max-h-[40rem] overflow-y-auto pr-2 -mr-2">
                                {productImages.map((image, index) => (
                                    <div key={image.id} className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                id={`product-checkbox-${image.id}`}
                                                checked={selectedProductIds.has(image.id)}
                                                onChange={() => handleProductSelectionChange(image.id)}
                                                className="h-5 w-5 rounded border-gray-400 bg-gray-900 bg-opacity-75 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                                                disabled={isLoading}
                                            />
                                            <label htmlFor={`product-checkbox-${image.id}`} className="font-semibold text-gray-300 cursor-pointer">Sản phẩm {index + 1}</label>
                                        </div>
                                        <button onClick={() => removeProductImage(image.id)} className="p-1 text-gray-500 hover:text-red-400 transition-colors" aria-label="Xóa ảnh sản phẩm">
                                        <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="flex flex-col items-center">
                                        <p className="text-xs text-gray-400 mb-2 font-medium">1. Trang Phục Gốc</p>
                                        <div className="w-full aspect-[9/16] bg-black rounded-md overflow-hidden flex items-center justify-center cursor-pointer" onClick={() => handleViewImage(image.originalBase64)}><img src={image.originalBase64} alt={`Sản phẩm gốc ${index + 1}`} className="w-full h-full object-contain" /></div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                        <p className="text-xs text-gray-400 mb-2 font-medium">2. Trang phục đã tách</p>
                                        <div className={`w-full aspect-[9/16] ${transparentImageBgColor} rounded-md p-1`}>
                                            <div className="w-full h-full flex items-center justify-center">
                                                {image.status === 'processing-bg' && <SpinnerIcon className="w-8 h-8 text-gray-400 animate-spin" />}
                                                {image.transparentBase64 && <img src={image.transparentBase64} alt="Đã tách nền" className="w-full h-full object-contain cursor-pointer" onClick={() => handleViewImage(image.transparentBase64)} />}
                                                {image.status === 'pending' && !skipBgRemoval && <div className="text-center text-xs text-gray-400 p-1">Chờ tách nền</div>}
                                                {image.status === 'pending' && skipBgRemoval && <div className="text-center text-xs text-gray-400 p-1">Bỏ qua</div>}
                                                {image.status === 'error' && <ErrorIcon title={image.errorMessage} />}
                                            </div>
                                        </div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                        <p className="text-xs text-gray-400 mb-2 font-medium">3. Ảnh đã tạo</p>
                                        <div className="w-full aspect-[9/16] bg-gray-700 rounded-md overflow-hidden">
                                            <div className="w-full h-full flex items-center justify-center">
                                                {image.status === 'processing-scene' && <SpinnerIcon className="w-8 h-8 text-gray-400 animate-spin" />}
                                                {image.generatedBase64 && <img src={image.generatedBase64} alt="Ảnh đã tạo" className="w-full h-full object-cover cursor-pointer" onClick={() => handleViewImage(image.generatedBase64)} />}
                                                {image.status !== 'processing-scene' && !image.generatedBase64 && image.status !== 'error' && <div className="text-center text-xs text-gray-500 p-1">Chờ tạo ảnh</div>}
                                                {image.status === 'error' && <ErrorIcon title={image.errorMessage} />}
                                            </div>
                                        </div>
                                        </div>
                                    </div>
                                    </div>
                                ))}
                                </div>

                            <div className="mt-6 pt-6 border-t border-gray-700/50">
                                <div className="relative">
                                    <button
                                        onClick={() => setIsReferenceModalOpen(true)}
                                        disabled={isLoading}
                                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <SparklesIcon className="w-5 h-5" />
                                        Tùy Chọn Tham Chiếu Nâng Cao
                                    </button>
                                    <div className="absolute top-1/2 right-4 -translate-y-1/2">
                                        <Tooltip content="Mở một bảng điều khiển để chọn các gợi ý chi tiết về bối cảnh, dáng đứng, phong cách và ánh sáng, giúp bạn chỉ đạo AI chính xác hơn." />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label htmlFor="combined-reference-fashion" className="block text-sm font-medium text-gray-300 mb-2">Tóm tắt Tham chiếu (có thể chỉnh sửa)</label>
                                    <textarea
                                        id="combined-reference-fashion"
                                        rows={3}
                                        className="block w-full rounded-md bg-gray-800 border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                                        value={fashionCombinedReference}
                                        onChange={(e) => setFashionCombinedReference(e.target.value)}
                                        placeholder="Các tham chiếu bối cảnh, dáng, phong cách... sẽ xuất hiện ở đây sau khi chọn."
                                        disabled={isLoading || !!backgroundReferenceImage}
                                    />
                                    {backgroundReferenceImage && <p className="mt-2 text-xs text-yellow-400">Tham chiếu bị vô hiệu hóa khi sử dụng ảnh nền tham chiếu.</p>}
                                </div>
                                <div className="mt-6">
                                     <AdvancedPromptPanel 
                                        {...advancedPanelProps}
                                        isSuggestingPrompts={isSuggestingPrompts}
                                        isLoading={isLoading}
                                        backgroundReferenceImage={backgroundReferenceImage}
                                     />
                                </div>
                            </div>
                            </div>
                        </div>
                    )}
                    {column1Tab === 'custom' && (
                        <>
                            <div className="grid grid-cols-2 gap-px -mt-4 mb-4">
                                <SubTabButton active={customTabMode === 'batch'} onClick={() => setCustomTabMode('batch')}>
                                    Chế độ Hàng loạt
                                </SubTabButton>
                                <SubTabButton active={customTabMode === 'edit'} onClick={() => setCustomTabMode('edit')}>
                                    Chế độ Sửa ảnh đơn
                                </SubTabButton>
                            </div>

                            {customTabMode === 'batch' && (
                                <div className="flex flex-col gap-6">
                                    <ActionPanel />
                                <div className="flex w-full items-end gap-4">
                                        <div className="w-2/3">
                                            <div className="flex justify-center items-center gap-2 mb-3">
                                                <h3 className="text-lg font-semibold text-center text-gray-300">Ảnh Nhân Vật</h3>
                                                <Tooltip content="Tải lên ảnh chân dung hoặc toàn thân của người mẫu. AI sẽ sử dụng khuôn mặt và mái tóc từ ảnh này để áp dụng vào các tư thế mới." />
                                                {customCharacterImage && !isLoading && (
                                                    <button onClick={() => setCustomCharacterImage(null)} className="p-1 text-gray-500 hover:text-red-400" aria-label="Xóa ảnh nhân vật">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <ImageUploader id="character-upload-custom" label="Ảnh của người/nhân vật" onImageUpload={handleCharacterImageUploadForTab('custom')} disabled={isLoading} previewSrc={customCharacterImage} onPreviewClick={() => handleViewImage(customCharacterImage)} 
                                              onSelectFromGallery={() => handleOpenGalleryModal({
                                                title: "Chọn ảnh Nhân Vật từ Thư viện",
                                                multiple: false,
                                                onSelect: (selectedSrcs) => {
                                                  if (selectedSrcs.length > 0) {
                                                    setCustomCharacterImage(selectedSrcs[0]);
                                                    addLog('Đã chọn ảnh nhân vật từ thư viện.');
                                                  }
                                                }
                                              })}
                                            />
                                        </div>
                                        <div className="w-1/3">
                                        <div className="flex justify-center items-center gap-2 mb-3">
                                                <h3 className="text-base font-semibold text-center text-gray-300 whitespace-nowrap">Nền Tham Chiếu</h3>
                                                <Tooltip content="Tải lên một ảnh để AI sử dụng làm bối cảnh tham chiếu. Khi sử dụng ảnh này, các tùy chọn tham chiếu bằng văn bản sẽ bị vô hiệu hóa." />
                                                {backgroundReferenceImage && !isLoading && (
                                                    <button onClick={() => setBackgroundReferenceImage(null)} className="p-1 text-gray-500 hover:text-red-400" aria-label="Xóa ảnh nền tham chiếu">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        <ImageUploader id="background-ref-upload-custom" label="Ảnh nền" onImageUpload={handleBackgroundReferenceImageUpload} disabled={isLoading} previewSrc={backgroundReferenceImage} containerClassName="h-24" onPreviewClick={() => handleViewImage(backgroundReferenceImage)} 
                                           onSelectFromGallery={() => handleOpenGalleryModal({
                                                title: "Chọn ảnh Nền Tham Chiếu từ Thư viện",
                                                multiple: false,
                                                onSelect: (selectedSrcs) => {
                                                  if (selectedSrcs.length > 0) {
                                                    setBackgroundReferenceImage(selectedSrcs[0]);
                                                    addLog('Đã chọn ảnh nền tham chiếu từ thư viện.');
                                                  }
                                                }
                                           })}
                                        />
                                        </div>
                                    </div>
                                    
                                    <div className="flex w-full items-start gap-4">
                                        <div className="w-1/2">
                                            <div className="flex justify-center items-center gap-2 mb-3">
                                                <h3 className="text-lg font-semibold text-center text-gray-300">Trang phục nhân vật</h3>
                                                <Tooltip content="Nhân vật sẽ mặc trang phục ở ô này. Nếu không chọn, nhân vật sẽ mặc đồ gốc trong khung 'Ảnh Nhân Vật'." />
                                                {productFrameImage && !isLoading && (
                                                    <button onClick={() => setProductFrameImage(null)} className="p-1 text-gray-500 hover:text-red-400" aria-label="Xóa ảnh trang phục nhân vật">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <ImageUploader id="product-frame-upload" label="Ảnh trang phục nhân vật" onImageUpload={handleProductFrameUpload} disabled={isLoading} previewSrc={productFrameImage} containerClassName="h-32" onPreviewClick={() => handleViewImage(productFrameImage)} 
                                               onSelectFromGallery={() => handleOpenGalleryModal({
                                                    title: "Chọn ảnh Trang phục từ Thư viện",
                                                    multiple: false,
                                                    onSelect: (selectedSrcs) => {
                                                      if (selectedSrcs.length > 0) {
                                                        setProductFrameImage(selectedSrcs[0]);
                                                        addLog('Đã chọn ảnh trang phục nhân vật từ thư viện.');
                                                      }
                                                    }
                                               })}
                                            />
                                        </div>
                                        <div className="w-1/2">
                                            <div className="flex justify-center items-center gap-2 mb-3">
                                                <h3 className="text-lg font-semibold text-center text-gray-300">Khung Phụ kiện</h3>
                                                <Tooltip content="Tải lên một hình ảnh phụ kiện (ví dụ: sticker, logo). AI sẽ cố gắng đặt phụ kiện này lên trên 'Khung Sản Phẩm'." />
                                                {accessoryFrameImage && !isLoading && (
                                                    <button onClick={() => setAccessoryFrameImage(null)} className="p-1 text-gray-500 hover:text-red-400" aria-label="Xóa ảnh khung phụ kiện">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <ImageUploader id="accessory-frame-upload" label="Ảnh khung phụ kiện" onImageUpload={handleAccessoryFrameUpload} disabled={isLoading} previewSrc={accessoryFrameImage} containerClassName="h-32" onPreviewClick={() => handleViewImage(accessoryFrameImage)} 
                                               onSelectFromGallery={() => handleOpenGalleryModal({
                                                    title: "Chọn ảnh Phụ kiện từ Thư viện",
                                                    multiple: false,
                                                    onSelect: (selectedSrcs) => {
                                                      if (selectedSrcs.length > 0) {
                                                        setAccessoryFrameImage(selectedSrcs[0]);
                                                        addLog('Đã chọn ảnh phụ kiện từ thư viện.');
                                                      }
                                                    }
                                               })}
                                            />
                                        </div>
                                    </div>

                                    <div className="w-full">
                                        <div className="flex justify-center items-center gap-2 mb-3">
                                            <h3 className="text-lg font-semibold text-center text-gray-300">Ảnh Sản phẩm Tùy biến</h3>
                                            <Tooltip content="Tải lên một hoặc nhiều ảnh sản phẩm. AI sẽ cố gắng đặt các ảnh này vào 'Khung Sản Phẩm' và bên dưới 'Khung Phụ Kiện'." />
                                        </div>
                                        <ImageUploader id="custom-product-upload" label="Nhấn để chọn một hoặc nhiều ảnh sản phẩm" onImageUpload={handleProductImageUploadForTab('custom')} multiple={true} disabled={isLoading} 
                                            onSelectFromGallery={() => handleOpenGalleryModal({
                                                title: "Chọn ảnh Sản phẩm Tùy biến từ Thư viện",
                                                multiple: true,
                                                onSelect: (selectedSrcs) => addProductImagesFromGallery(selectedSrcs, 'custom')
                                            })}
                                        />
                                        <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
                                            <div className="flex items-center">
                                                <input id="skip-bg-removal-checkbox-custom" type="checkbox" checked={skipBgRemoval} onChange={(e) => setSkipBgRemoval(e.target.checked)} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-cyan-600 focus:ring-cyan-500 cursor-pointer" disabled={isLoading} />
                                                <label htmlFor="skip-bg-removal-checkbox-custom" className="ml-2 block text-sm font-medium text-gray-300 select-none cursor-pointer">Bỏ qua bước tách nền.</label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-400">Màu nền ảnh tách:</span>
                                                <button onClick={() => setTransparentImageBgColor('bg-white')} className={`w-6 h-6 rounded-full bg-white border-2 transition-colors ${transparentImageBgColor === 'bg-white' ? 'border-cyan-400 ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900' : 'border-gray-500 hover:border-white'}`} aria-label="Chọn nền trắng" />
                                                <button onClick={() => setTransparentImageBgColor('bg-black')} className={`w-6 h-6 rounded-full bg-black border-2 transition-colors ${transparentImageBgColor === 'bg-black' ? 'border-cyan-400 ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900' : 'border-gray-500 hover:border-gray-400'}`} aria-label="Chọn nền đen" />
                                                <button onClick={() => setTransparentImageBgColor('bg-gray-800')} className={`w-6 h-6 rounded-full bg-gray-800 border-2 transition-colors ${transparentImageBgColor === 'bg-gray-800' ? 'border-cyan-400 ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900' : 'border-gray-500 hover:border-gray-400'}`} aria-label="Chọn nền xám" />
                                            </div>
                                        </div>
                                        {customProductImages.length > 0 && (
                                            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                                                <button onClick={handleDeselectAllCustomProducts} disabled={isLoading || selectedCustomProductIds.size === 0} className="px-4 py-2 text-sm font-medium rounded-lg shadow-sm text-white bg-slate-700 hover:bg-slate-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">Bỏ chọn Tất cả</button>
                                                <button onClick={handleDeleteSelectedCustomProducts} disabled={isLoading || selectedCustomProductIds.size === 0} className="px-4 py-2 text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors">Xóa mục đã chọn ({selectedCustomProductIds.size})</button>
                                                <button onClick={handleDeleteAllCustomProducts} disabled={isLoading || customProductImages.length === 0} className="px-4 py-2 text-sm font-medium rounded-lg shadow-sm text-white bg-red-700 hover:bg-red-800 disabled:bg-red-900/50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors">Xóa Tất cả ({customProductImages.length})</button>
                                            </div>
                                        )}
                                        <div className="mt-4 flex flex-col gap-4 max-h-[40rem] overflow-y-auto pr-2 -mr-2">
                                            {customProductImages.map((image, index) => (
                                                <div key={image.id} className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <input type="checkbox" id={`custom-product-checkbox-${image.id}`} checked={selectedCustomProductIds.has(image.id)} onChange={() => handleCustomProductSelectionChange(image.id)} className="h-5 w-5 rounded border-gray-400 bg-gray-900 bg-opacity-75 text-cyan-600 focus:ring-cyan-500 cursor-pointer" disabled={isLoading}/>
                                                            <label htmlFor={`custom-product-checkbox-${image.id}`} className="font-semibold text-gray-300 cursor-pointer">Sản phẩm {index + 1}</label>
                                                        </div>
                                                        <button onClick={() => removeCustomProductImage(image.id)} className="p-1 text-gray-500 hover:text-red-400 transition-colors" aria-label="Xóa ảnh sản phẩm"><TrashIcon className="w-5 h-5" /></button>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div className="flex flex-col items-center">
                                                            <p className="text-xs text-gray-400 mb-2 font-medium">1. Sản phẩm Gốc</p>
                                                            <div className="w-full aspect-[9/16] bg-black rounded-md overflow-hidden flex items-center justify-center cursor-pointer" onClick={() => handleViewImage(image.originalBase64)}><img src={image.originalBase64} alt={`Sản phẩm gốc ${index + 1}`} className="w-full h-full object-contain" /></div>
                                                        </div>
                                                        <div className="flex flex-col items-center">
                                                            <p className="text-xs text-gray-400 mb-2 font-medium">2. Sản phẩm đã tách</p>
                                                            <div className={`w-full aspect-[9/16] ${transparentImageBgColor} rounded-md p-1`}>
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    {image.status === 'processing-bg' && <SpinnerIcon className="w-8 h-8 text-gray-400 animate-spin" />}
                                                                    {image.transparentBase64 && <img src={image.transparentBase64} alt="Đã tách nền" className="w-full h-full object-contain cursor-pointer" onClick={() => handleViewImage(image.transparentBase64)} />}
                                                                    {image.status === 'pending' && !skipBgRemoval && <div className="text-center text-xs text-gray-400 p-1">Chờ tách nền</div>}
                                                                    {image.status === 'pending' && skipBgRemoval && <div className="text-center text-xs text-gray-400 p-1">Bỏ qua</div>}
                                                                    {image.status === 'error' && <ErrorIcon title={image.errorMessage} />}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-center">
                                                            <p className="text-xs text-gray-400 mb-2 font-medium">3. Ảnh đã tạo</p>
                                                            <div className="w-full aspect-[9/16] bg-gray-700 rounded-md overflow-hidden">
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    {image.status === 'processing-scene' && <SpinnerIcon className="w-8 h-8 text-gray-400 animate-spin" />}
                                                                    {image.generatedBase64 && <img src={image.generatedBase64} alt="Ảnh đã tạo" className="w-full h-full object-cover cursor-pointer" onClick={() => handleViewImage(image.generatedBase64)} />}
                                                                    {image.status !== 'processing-scene' && !image.generatedBase64 && image.status !== 'error' && <div className="text-center text-xs text-gray-500 p-1">Chờ tạo ảnh</div>}
                                                                    {image.status === 'error' && <ErrorIcon title={image.errorMessage} />}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-6 pt-6 border-t border-gray-700/50">
                                            <div className="relative">
                                                <button
                                                    onClick={() => setIsReferenceModalOpen(true)}
                                                    disabled={isLoading}
                                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <SparklesIcon className="w-5 h-5" />
                                                    Tùy Chọn Tham Chiếu Nâng Cao
                                                </button>
                                                <div className="absolute top-1/2 right-4 -translate-y-1/2">
                                                    <Tooltip content="Mở một bảng điều khiển để chọn các gợi ý chi tiết về bối cảnh, dáng đứng, phong cách và ánh sáng, giúp bạn chỉ đạo AI chính xác hơn." />
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <label htmlFor="combined-reference-custom" className="block text-sm font-medium text-gray-300 mb-2">Tóm tắt Tham chiếu (có thể chỉnh sửa)</label>
                                                <textarea
                                                    id="combined-reference-custom"
                                                    rows={3}
                                                    className="block w-full rounded-md bg-gray-800 border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                                                    value={customCombinedReference}
                                                    onChange={(e) => setCustomCombinedReference(e.target.value)}
                                                    placeholder="Các tham chiếu bối cảnh, dáng, phong cách... sẽ xuất hiện ở đây sau khi chọn."
                                                    disabled={isLoading || !!backgroundReferenceImage}
                                                />
                                                {backgroundReferenceImage && <p className="mt-2 text-xs text-yellow-400">Tham chiếu bị vô hiệu hóa khi sử dụng ảnh nền tham chiếu.</p>}
                                            </div>
                                            <div className="mt-6">
                                                <AdvancedPromptPanel 
                                                    {...advancedPanelProps}
                                                    isSuggestingPrompts={isSuggestingPrompts}
                                                    isLoading={isLoading}
                                                    backgroundReferenceImage={backgroundReferenceImage}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {customTabMode === 'edit' && (
                                <div className="flex flex-col gap-6">
                                    <div className="w-full p-4 bg-gray-900/50 rounded-lg border-2 border-cyan-500/30">
                                        <h3 className="text-lg font-semibold mb-4 text-center text-cyan-400">Bảng điều khiển Sửa ảnh</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-center items-center gap-2 mb-3">
                                                    <h3 className="text-lg font-semibold text-center text-gray-300">Ảnh Gốc</h3>
                                                    <Tooltip content="Tải lên ảnh bạn muốn chỉnh sửa hoặc mở rộng." />
                                                    {editSourceImage && !isLoading && (
                                                        <button onClick={() => setEditSourceImage(null)} className="p-1 text-gray-500 hover:text-red-400" aria-label="Xóa ảnh gốc">
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                <ImageUploader id="edit-source-upload" label="Ảnh gốc cần chỉnh sửa" onImageUpload={handleEditImageUpload} disabled={isLoading} previewSrc={editSourceImage} onPreviewClick={() => handleViewImage(editSourceImage)} 
                                                    onSelectFromGallery={() => handleOpenGalleryModal({
                                                        title: "Chọn ảnh Gốc từ Thư viện",
                                                        multiple: false,
                                                        onSelect: (selectedSrcs) => {
                                                          if (selectedSrcs.length > 0) {
                                                            setEditSourceImage(selectedSrcs[0]);
                                                            addLog('Đã chọn ảnh gốc để chỉnh sửa từ thư viện.');
                                                          }
                                                        }
                                                    })}
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="edit-prompt-input" className="block text-sm font-medium text-gray-300 mb-2">Yêu cầu chỉnh sửa</label>
                                                <textarea
                                                    id="edit-prompt-input"
                                                    rows={4}
                                                    className="block w-full rounded-md bg-gray-800 border-gray-600 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-gray-100 p-2"
                                                    value={editPrompt}
                                                    onChange={(e) => setEditPrompt(e.target.value)}
                                                    placeholder="Ví dụ: mở rộng ảnh này ra góc rộng hơn, thêm một chiếc mũ cho người trong ảnh..."
                                                    disabled={isLoading}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={handleSuggestEditPrompts}
                                                    disabled={isLoading || isSuggestingEditPrompts || !editSourceImage}
                                                    className="w-full flex-grow inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    {isSuggestingEditPrompts ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                                                    AI Gợi ý Prompt
                                                </button>
                                                 <div className="flex-shrink-0">
                                                    <label htmlFor="suggestion-count" className="sr-only">Số lượng gợi ý</label>
                                                    <input 
                                                        type="number" 
                                                        id="suggestion-count"
                                                        min="1" max="8"
                                                        value={editPromptSuggestionCount}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value, 10);
                                                            if (val >= 1 && val <= 8) {
                                                                setEditPromptSuggestionCount(val);
                                                            }
                                                        }}
                                                        className="w-16 p-2 text-center bg-gray-700 rounded-lg border border-gray-600 focus:border-cyan-500 focus:ring-cyan-500"
                                                        title="Số lượng gợi ý"
                                                        disabled={isLoading || isSuggestingEditPrompts}
                                                    />
                                                </div>
                                            </div>

                                             {editSuggestedPrompts.length > 0 && !isSuggestingEditPrompts && (
                                                <div className="space-y-2 pt-2 border-t border-gray-700/50">
                                                    <h4 className="text-sm font-semibold text-gray-300">Chọn một gợi ý từ AI:</h4>
                                                    {editSuggestedPrompts.map((p, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => setEditPrompt(p)}
                                                            className="w-full text-left p-2 bg-gray-700 hover:bg-cyan-600/50 rounded-lg text-xs text-gray-300 transition-colors"
                                                        >
                                                            {p}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="space-y-3 pt-4 border-t border-gray-700/50">
                                                {editSuggestionCategories.map((cat, catIndex) => (
                                                    <details key={catIndex} className="bg-gray-800 border border-gray-700 rounded-lg open:bg-gray-700/50 transition-colors">
                                                    <summary className="px-4 py-2 text-sm font-semibold cursor-pointer text-gray-300 hover:text-white list-none flex justify-between items-center">
                                                        {cat.category}
                                                        <span className="text-gray-400 text-sm transform transition-transform duration-200 details-arrow">-&gt;</span>
                                                    </summary>
                                                    <div className="p-4 border-t border-gray-600">
                                                        <div className="flex flex-wrap gap-2">
                                                        {cat.items.map((item, itemIndex) => (
                                                            <button
                                                            key={itemIndex}
                                                            onClick={() => setEditPrompt(prev => prev ? `${prev}, ${item.prompt}`: item.prompt)}
                                                            className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-600 rounded-full hover:bg-cyan-600 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                            >
                                                            {item.label}
                                                            </button>
                                                        ))}
                                                        </div>
                                                        {cat.category.includes("Mở rộng bối cảnh") && (
                                                            <div className="mt-4 pt-4 border-t border-gray-700/50 space-y-3">
                                                                <h5 className="text-sm font-semibold text-cyan-400 mb-2">Tùy chỉnh Mở rộng</h5>
                                                                <div>
                                                                    <label className="text-xs font-medium text-gray-400 mb-2 block">Hướng</label>
                                                                    <div className="grid grid-cols-4 gap-2">
                                                                        {(['all', 'horizontal', 'vertical', 'up', 'down', 'left', 'right'] as const).map(dir => (
                                                                            <button key={dir} onClick={() => setExpansionDirection(dir)} className={`px-2 py-1 text-xs rounded-md ${expansionDirection === dir ? 'bg-cyan-600 text-white' : 'bg-gray-600 hover:bg-gray-500'}`}>
                                                                                {{'all': 'Toàn bộ', 'horizontal': 'Ngang', 'vertical': 'Dọc', 'up': 'Trên', 'down': 'Dưới', 'left': 'Trái', 'right': 'Phải'}[dir]}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="text-xs font-medium text-gray-400 mb-2 block">Tỷ lệ</label>
                                                                    <div className="flex gap-2">
                                                                        {[1.5, 2].map(factor => (
                                                                            <button key={factor} onClick={() => setExpansionFactor(factor)} className={`px-3 py-1 text-xs rounded-md ${expansionFactor === factor ? 'bg-cyan-600 text-white' : 'bg-gray-600 hover:bg-gray-500'}`}>
                                                                                {factor}x
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                 <div className="flex items-center gap-2">
                                                                    <input type="checkbox" id="enhance-quality" checked={enhanceQuality} onChange={e => setEnhanceQuality(e.target.checked)} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-cyan-600 focus:ring-cyan-500"/>
                                                                    <label htmlFor="enhance-quality" className="text-xs text-gray-300">Tăng chất lượng ảnh</label>
                                                                </div>
                                                                <button onClick={handleAppendExpansionPrompt} className="w-full mt-2 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                                                                    Thêm vào Prompt
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    </details>
                                                ))}
                                                <style>{` details > summary { list-style: none; } details > summary::-webkit-details-marker { display: none; } details[open] > summary .details-arrow { transform: rotate(90deg); } `}</style>
                                            </div>

                                        </div>

                                        {isLoading ? (
                                                <button
                                                    onClick={handleStop}
                                                    className="w-full mt-4 py-3 px-4 rounded-md font-semibold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 transition-colors"
                                                >
                                                    Dừng Lại
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handleGenerate}
                                                    disabled={!canGenerate || isLoading}
                                                    className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <SparklesIcon className="w-5 h-5" />
                                                    Bắt đầu Chỉnh sửa
                                                </button>
                                            )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    {column1Tab === 'text-to-image' && (
                        <div className="flex flex-col gap-6">
                            <ActionPanel />
                             <details className="bg-gray-800/50 border border-gray-700 rounded-lg transition-colors p-1" open>
                               <summary className="px-4 py-3 text-sm font-semibold cursor-pointer text-gray-300 hover:text-white list-none flex justify-between items-center">Chế độ 'Câu Chuyện' (Tùy chọn)</summary>
                               <div className="p-4 border-t border-gray-600 space-y-4">
                                  <div>
                                    <label htmlFor="story-input" className="block text-sm font-medium text-gray-300 mb-2">Nhập câu chuyện của bạn</label>
                                    <textarea
                                        id="story-input"
                                        rows={8}
                                        className="block w-full rounded-md bg-gray-800 border-gray-600 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm p-2"
                                        value={storyText}
                                        onChange={(e) => setStoryText(e.target.value)}
                                        placeholder="Dán hoặc viết một câu chuyện ngắn vào đây..."
                                        disabled={isLoading || isAnalyzingStory}
                                    />
                                  </div>
                                  <button
                                    onClick={handleAnalyzeStory}
                                    disabled={isLoading || isAnalyzingStory || !storyText.trim()}
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
                                  >
                                    {isAnalyzingStory ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                                    Phân tích & Gợi ý Cảnh
                                  </button>
                                   {suggestedScenes.length > 0 && (
                                    <div className="mt-4 space-y-4 pt-4 border-t border-gray-700">
                                        <h4 className="text-sm font-semibold text-gray-300">Các cảnh được đề xuất:</h4>
                                        <div className="space-y-3 max-h-80 overflow-y-auto pr-2 -mr-2">
                                            {suggestedScenes.map((scene, index) => (
                                                <div key={index} className="p-3 bg-gray-700/50 rounded-lg">
                                                    <p className="font-semibold text-gray-200 mb-3">{`Cảnh ${index + 1}: ${scene.scene}`}</p>
                                                    <div className="space-y-2">
                                                        <div className="p-2 bg-gray-900/40 rounded">
                                                            <p className="text-xs text-cyan-400 font-bold">BẮT ĐẦU</p>
                                                            <p className="text-sm text-gray-300 mt-1 mb-2">{scene.startPrompt.vi}</p>
                                                            <button onClick={() => setTtiPrompt(scene.startPrompt.en)} className="text-xs px-2 py-1 bg-gray-600 hover:bg-cyan-700 rounded">Dùng Prompt này</button>
                                                        </div>
                                                        <div className="p-2 bg-gray-900/40 rounded">
                                                            <p className="text-xs text-amber-400 font-bold">KẾT THÚC</p>
                                                            <p className="text-sm text-gray-300 mt-1 mb-2">{scene.endPrompt.vi}</p>
                                                            <button onClick={() => setTtiPrompt(scene.endPrompt.en)} className="text-xs px-2 py-1 bg-gray-600 hover:bg-cyan-700 rounded">Dùng Prompt này</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="pt-4 space-y-4">
                                            <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg">
                                                <input
                                                    id="keep-character-consistent"
                                                    type="checkbox"
                                                    checked={keepCharacterConsistent}
                                                    onChange={(e) => setKeepCharacterConsistent(e.target.checked)}
                                                    className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                                                    disabled={isLoading}
                                                />
                                                <label
                                                    htmlFor="keep-character-consistent"
                                                    className="block text-sm font-medium text-gray-300 select-none cursor-pointer"
                                                >
                                                    Giữ nhân vật nhất quán
                                                </label>
                                                <Tooltip content="Khi được chọn, AI sẽ sử dụng hình ảnh của cảnh đầu tiên làm tham chiếu để giữ cho nhân vật giống nhau trong tất cả các cảnh tiếp theo." />
                                            </div>
                                            <button
                                                onClick={handleGenerateStory}
                                                disabled={isLoading}
                                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
                                            >
                                                <VideoCameraIcon className="w-5 h-5" />
                                                Tạo toàn bộ câu chuyện
                                            </button>
                                        </div>
                                    </div>
                                  )}
                               </div>
                             </details>
                            {isGeneratingStory && (
                                <div className="mt-4">
                                    <div className="flex justify-between text-sm mb-1 text-gray-300 font-medium">
                                        <span>Đang tạo khung hình: {Math.min(storyGenerationProgress.completed + 1, storyGenerationProgress.total)}/{storyGenerationProgress.total}</span>
                                    </div>
                                    <div className="w-full bg-gray-600 rounded-full h-2.5">
                                        <div
                                            className="bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${(storyGenerationProgress.completed / storyGenerationProgress.total) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                            <div>
                                <label htmlFor="tti-prompt-input" className="block text-sm font-medium text-gray-300 mb-2">Mô tả (Prompt)</label>
                                <textarea
                                    id="tti-prompt-input"
                                    rows={5}
                                    className="block w-full rounded-md bg-gray-800 border-gray-600 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-gray-100 p-2"
                                    value={ttiPrompt}
                                    onChange={(e) => setTtiPrompt(e.target.value)}
                                    placeholder="Ví dụ: một chú mèo phi hành gia dễ thương đang cưỡi ván trượt trong vũ trụ, nghệ thuật kỹ thuật số"
                                    disabled={isLoading}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Tỷ lệ khung hình</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setTtiAspectRatio('9:16')}
                                        disabled={isLoading}
                                        className={`py-3 px-4 rounded-md font-medium text-sm transition-colors ${
                                            ttiAspectRatio === '9:16'
                                                ? 'bg-cyan-600 text-white ring-2 ring-offset-2 ring-offset-slate-900 ring-cyan-500'
                                                : 'bg-gray-700 hover:bg-gray-600'
                                        }`}
                                    >
                                        9:16 (Dọc)
                                    </button>
                                    <button
                                        onClick={() => setTtiAspectRatio('16:9')}
                                        disabled={isLoading}
                                        className={`py-3 px-4 rounded-md font-medium text-sm transition-colors ${
                                            ttiAspectRatio === '16:9'
                                                ? 'bg-cyan-600 text-white ring-2 ring-offset-2 ring-offset-slate-900 ring-cyan-500'
                                                : 'bg-gray-700 hover:bg-gray-600'
                                        }`}
                                    >
                                        16:9 (Ngang)
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}


                    {regenerationQueue.length > 0 && (
                        <div className="w-full">
                            <h3 className="text-lg font-semibold mb-3 text-center text-gray-300">Hàng đợi tạo lại</h3>
                            <div className="mt-4 flex flex-col gap-2 max-h-80 overflow-y-auto pr-2">
                                {regenerationQueue.map((item, index) => (
                                    <div key={item.id} className="flex items-center justify-between p-2 bg-gray-800 rounded-lg">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <img src={item.sourceImage.originalProductSrc} alt={`Gốc ${index + 1}`} className="w-16 h-24 object-contain rounded-md bg-black" />
                                            <span className="text-gray-500 text-2xl">→</span>
                                            <div className="w-16 h-24 bg-gray-700 rounded-md flex items-center justify-center overflow-hidden">
                                                {item.status === 'pending' && <div className="text-center text-xs text-gray-400 p-1">Chờ...</div>}
                                                {item.status === 'processing-bg' && <SpinnerIcon className="w-6 h-6 text-gray-400 animate-spin" />}
                                                {(item.status === 'bg-removed' || item.status === 'processing-scene' || item.status === 'done') && item.newTransparentSrc && <img src={item.newTransparentSrc} alt="Tách nền" className="w-full h-full object-contain" />}
                                                {item.status === 'error' && <ErrorIcon title={item.errorMessage} className="w-8 h-8"/>}
                                            </div>
                                             <span className="text-gray-500 text-2xl">→</span>
                                            <div className="w-16 h-24 bg-gray-700 rounded-md flex items-center justify-center overflow-hidden">
                                              {item.status === 'processing-scene' && <SpinnerIcon className="w-6 h-6 text-gray-400 animate-spin" />}
                                              {item.status === 'done' && item.resultSrc && <img src={item.resultSrc} alt="Đã tạo lại" className="w-full h-full object-cover" />}
                                              {item.status !== 'processing-scene' && item.status !== 'done' && <div className="text-center text-xs text-gray-400 p-1">...</div>}
                                              {item.status === 'error' && <ErrorIcon title={item.errorMessage} className="w-8 h-8"/>}
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemoveFromQueue(item.id)} className="p-2 text-gray-500 hover:text-red-400 transition-colors ml-2 self-center" aria-label="Xóa khỏi hàng đợi"><TrashIcon className="w-5 h-5" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
              </div>

              {/* --- COLUMN 2: Creative Control Panel --- */}
              <div className="relative w-full rounded-xl">
                  <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 opacity-70 blur-md" aria-hidden="true"></div>
                  <div className="relative flex flex-col gap-6 rounded-xl bg-slate-900 p-6 h-full">
                    <ColumnHeader 
                        step={2} 
                        title="Bảng điều khiển Sáng tạo" 
                        subtitle="Tinh chỉnh và tạo tác phẩm" 
                        color="cyan"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.475 2.118 2.25 2.25 0 0 1-2.475-2.118c0-.497.16-1.002.44-1.492A3 3 0 0 0 5.03 16.122ZM15.378 11.622a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.475 2.118 2.25 2.25 0 0 1-2.475-2.118c0-.497.16-1.002.44-1.492A3 3 0 0 0 9.53 11.622Zm.47 2.475a3 3 0 0 0 5.78-1.128 2.25 2.25 0 0 1 2.475-2.118 2.25 2.25 0 0 1 2.475 2.118c0 .497-.16 1.002-.44 1.492A3 3 0 0 0 15.85 14.1ZM18.16 19.673a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.475 2.118 2.25 2.25 0 0 1-2.475-2.118c0-.497.16-1.002.44-1.492A3 3 0 0 0 12.38 19.673Z" /></svg>}
                    />

                    <GeneratedImageViewer
                        imageSrc={viewerImage}
                        onDownload={() => handleDownload(viewerImage!)}
                        onRegenerate={handleRegenerateViewerImage}
                        isLoading={isLoading}
                        progressMessage={progressMessage}
                        error={error}
                    />
                    
                    <details className="bg-gray-800/50 border border-gray-700 rounded-lg transition-colors p-1">
                      <summary className="px-4 py-3 text-md font-semibold cursor-pointer text-gray-200 hover:text-white list-none flex justify-between items-center">Logs</summary>
                      <div className="p-4 border-t border-gray-600 space-y-4">
                          <div className="mt-4 p-2 bg-black bg-opacity-30 rounded-lg border border-gray-700 font-mono text-sm max-h-48 overflow-y-auto">
                            <div className="flex justify-between items-center mb-2 sticky top-0 bg-black bg-opacity-30 py-1">
                                <h3 className="text-md font-semibold text-gray-300">Log Hoạt Động</h3>
                                <button onClick={() => setLogMessages([])} className="text-gray-400 hover:text-white text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded">Xóa</button>
                            </div>
                            <div className="pt-1">
                                {logMessages.map((msg, index) => (<p key={index} className={`whitespace-pre-wrap ${msg.includes('✅') ? 'text-green-400' : msg.includes('⚠️') ? 'text-yellow-400' : msg.includes('❌') ? 'text-red-400' : 'text-gray-400'}`}>{msg}</p>))}
                            </div>
                          </div>
                      </div>
                    </details>

                    {column1Tab === 'text-to-image' && storyGeneratedImages.length > 0 && (
                      <StoryResultsGallery
                        images={storyGeneratedImages}
                        onSelectImage={handleSelectStoryImage}
                        onDownloadImage={handleDownload}
                        onDeleteImage={handleDeleteStoryImage}
                        isLoading={isLoading}
                        selectedImageIds={selectedStoryImageIds}
                        onSelectionChange={handleStoryImageSelectionChange}
                        onSelectAll={handleSelectAllStoryImages}
                        onDeleteSelected={handleDeleteSelectedStoryImages}
                        onDownloadSelected={handleDownloadSelectedStoryImages}
                        onSceneSelectionChange={handleSceneSelectionChange}
                        onSuggestVideoPrompts={handleOpenVideoPromptModal}
                      />
                    )}

                    <div className="flex items-center pt-4 border-t border-gray-700">
                        <input id="auto-save-checkbox" name="auto-save" type="checkbox" checked={autoSaveToGallery} onChange={(e) => setAutoSaveToGallery(e.target.checked)} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-cyan-600 focus:ring-cyan-500" disabled={isLoading} />
                        <label htmlFor="auto-save-checkbox" className="ml-2 block text-sm font-medium text-gray-300 select-none cursor-pointer">Tự động lưu vào thư viện</label>
                    </div>

                  </div>
              </div>
              
              {/* --- COLUMN 3: Results Library --- */}
              <div className="relative w-full rounded-xl">
                  <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-red-500 to-pink-500 opacity-70 blur-md" aria-hidden="true"></div>
                  <div className="relative flex flex-col gap-6 rounded-xl bg-slate-900 p-6 h-full">
                    <ColumnHeader 
                        step={3} title="Thư viện Kết quả" subtitle="Xem và quản lý tác phẩm" color="red"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>}
                    />
                     <CreationsGallery
                        images={generatedImages} 
                        products={productsForGallery}
                        onSelectImage={handleSelectImage} 
                        onDownloadImage={handleDownload}
                        onDownloadAll={() => handleDownloadAll(generatedImages)} 
                        autoDownloadAll={autoDownloadAll} 
                        onAutoDownloadAllChange={setAutoDownloadAll}
                        progressState={progressState} 
                        onRegenerateImage={handleRegenerateImage} 
                        onDeleteImage={handleDeleteImage} 
                        isQueueProcessing={isLoading}
                        selectedImageIds={selectedImageIds} 
                        onSelectionChange={handleSelectionChange} 
                        onSelectAll={handleSelectAllImages}
                        onDeleteSelected={handleDeleteSelected} 
                        onDownloadSelected={handleDownloadSelected}
                        onGroupSelectionChange={handleGroupSelectionChange}
                      />
                  </div>
              </div>
              
              <div className="lg:col-span-3 mt-8">
                <TransparentGallery 
                    images={transparentImagesForGallery} bgColor={transparentImageBgColor} onDownloadImage={handleDownload}
                    onDownloadAll={handleDownloadAllTransparent} onUseAllAsProducts={handleUseTransparentAsProducts} isProcessing={isLoading}
                    onViewImage={handleViewImage}
                />
              </div>
            </div>
        )}
        {activeTab === 'settings' && (
            <ApiSettings 
                apiKeys={apiKeys} 
                maxConcurrency={maxConcurrency}
                onSave={handleSaveApiSettings}
                useDefaultApiKey={useDefaultApiKey}
                onUseDefaultApiKeyChange={setUseDefaultApiKey}
            />
        )}
      </div>
    </div>
  );
};

export default App;