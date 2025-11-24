import React, { useMemo } from 'react';
import { GeneratedImage } from '../types';
import { DownloadIcon, TrashIcon, VideoCameraIcon } from './icons';

// Define a type for a grouped scene
type GroupedScene = {
  sceneIndex: number;
  startImage?: GeneratedImage;
  endImage?: GeneratedImage;
};

interface StoryResultsGalleryProps {
  images: GeneratedImage[];
  onSelectImage: (image: GeneratedImage) => void;
  onDownloadImage: (src: string, filename?: string) => void;
  onDeleteImage: (imageId: string) => void;
  isLoading: boolean;
  selectedImageIds: Set<string>;
  onSelectionChange: (imageId: string) => void;
  onSelectAll: () => void;
  onDeleteSelected: () => void;
  onDownloadSelected: () => void;
  onSceneSelectionChange: (sceneIndex: number, startImageId: string | undefined, endImageId: string | undefined) => void;
  onSuggestVideoPrompts: () => void;
}

const StoryResultsGallery: React.FC<StoryResultsGalleryProps> = ({
  images,
  onSelectImage,
  onDownloadImage,
  onDeleteImage,
  isLoading,
  selectedImageIds,
  onSelectionChange,
  onSelectAll,
  onDeleteSelected,
  onDownloadSelected,
  onSceneSelectionChange,
  onSuggestVideoPrompts,
}) => {
  const groupedScenes = useMemo(() => {
    const scenesMap = new Map<number, { startImage?: GeneratedImage; endImage?: GeneratedImage }>();

    images.forEach(image => {
      if (image.sceneIndex === undefined) return;

      if (!scenesMap.has(image.sceneIndex)) {
        scenesMap.set(image.sceneIndex, {});
      }

      const scene = scenesMap.get(image.sceneIndex)!;
      if (image.frameType === 'start') {
        scene.startImage = image;
      } else if (image.frameType === 'end') {
        scene.endImage = image;
      }
    });

    const sortedScenes: GroupedScene[] = Array.from(scenesMap.entries())
      .map(([sceneIndex, { startImage, endImage }]) => ({ sceneIndex, startImage, endImage }))
      .sort((a, b) => a.sceneIndex - b.sceneIndex);
      
    return sortedScenes;
  }, [images]);

  const allSelected = images.length > 0 && selectedImageIds.size === images.length;

  const ImageThumbnail: React.FC<{ image: GeneratedImage; frameType: 'Bắt đầu' | 'Kết thúc' }> = ({ image, frameType }) => {
    return (
        <div className="flex flex-col">
            <p className="text-xs font-semibold text-center mb-2 text-gray-400">{frameType}</p>
            <div
                className="relative group aspect-[9/16] w-full cursor-pointer"
                onClick={() => onSelectImage(image)}
            >
                <img
                    src={image.src}
                    alt={`Scene ${image.sceneIndex} - ${frameType}`}
                    className="w-full h-full object-cover rounded-lg border-2 border-gray-700 group-hover:border-cyan-500/50 transition-all"
                />

                <div 
                    className={`absolute inset-0 rounded-lg transition-all ${selectedImageIds.has(image.id) ? 'border-2 border-cyan-500' : 'border-2 border-transparent'} group-hover:bg-black group-hover:bg-opacity-40 pointer-events-none`}
                ></div>

                <input
                    type="checkbox"
                    id={`checkbox-story-${image.id}`}
                    checked={selectedImageIds.has(image.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation();
                      onSelectionChange(image.id);
                    }}
                    className="absolute top-2 left-2 z-20 h-5 w-5 rounded border-gray-400 bg-gray-900 bg-opacity-75 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                />
                
                <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const frameLabel = frameType === 'Bắt đầu' ? 'A' : 'B';
                        const filename = `Cảnh ${image.sceneIndex} ${frameLabel}.png`;
                        onDownloadImage(image.src, filename);
                      }}
                      className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75"
                      aria-label="Tải ảnh xuống"
                    >
                      <DownloadIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteImage(image.id);
                      }}
                      className="absolute bottom-2 right-2 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75"
                      aria-label="Xóa ảnh"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
      </div>
    );
  };

  return (
    <div className="w-full mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
      <h2 className="text-xl font-bold mb-4 text-gray-200">Kết quả Câu chuyện</h2>
      
       <div className="border-y border-gray-700/50 py-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 px-1">Thao tác Hàng loạt</h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
            <button
                onClick={onSelectAll}
                disabled={images.length === 0 || isLoading}
                className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-gray-600 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                {allSelected ? 'Bỏ chọn' : 'Chọn tất cả'}
            </button>
            <button
                onClick={onDownloadSelected}
                disabled={selectedImageIds.size === 0 || isLoading}
                className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                Tải về ({selectedImageIds.size})
            </button>
            <button
                onClick={onDeleteSelected}
                disabled={selectedImageIds.size === 0 || isLoading}
                className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                Xóa ({selectedImageIds.size})
            </button>
        </div>
        <button
            onClick={onSuggestVideoPrompts}
            disabled={selectedImageIds.size === 0 || isLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
            <VideoCameraIcon className="w-4 h-4" />
            AI Gợi ý Prompts Video
        </button>
      </div>

      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
        {groupedScenes.length > 0 ? (
            groupedScenes.map(({ sceneIndex, startImage, endImage }) => {
                const isSceneSelected = startImage && selectedImageIds.has(startImage.id) && endImage && selectedImageIds.has(endImage.id);

                return (
                    <div key={sceneIndex} className="p-4 bg-gray-900/40 border border-gray-600 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id={`checkbox-scene-${sceneIndex}`}
                                    checked={!!isSceneSelected}
                                    onChange={() => onSceneSelectionChange(sceneIndex, startImage?.id, endImage?.id)}
                                    disabled={!startImage || !endImage || isLoading}
                                    className="h-5 w-5 rounded border-gray-400 bg-gray-900 bg-opacity-75 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                                />
                                <label htmlFor={`checkbox-scene-${sceneIndex}`} className="text-base font-semibold text-cyan-400 cursor-pointer">Cảnh {sceneIndex}</label>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {startImage ? <ImageThumbnail image={startImage} frameType="Bắt đầu" /> : <div className="aspect-[9/16] bg-gray-800 rounded-lg flex items-center justify-center text-xs text-gray-500">Thiếu ảnh bắt đầu</div>}
                            {endImage ? <ImageThumbnail image={endImage} frameType="Kết thúc" /> : <div className="aspect-[9/16] bg-gray-800 rounded-lg flex items-center justify-center text-xs text-gray-500">Thiếu ảnh kết thúc</div>}
                        </div>
                    </div>
                );
            })
        ) : (
            <div className="flex-1 flex items-center justify-center text-center text-gray-500 p-4 border-2 border-dashed border-gray-700 rounded-lg h-full">
                <p>Kết quả từ việc tạo câu chuyện sẽ xuất hiện ở đây.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default StoryResultsGallery;
