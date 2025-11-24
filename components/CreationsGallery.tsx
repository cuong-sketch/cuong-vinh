import React, { useMemo } from 'react';
import { GeneratedImage, ProductImageFile } from '../types';
import { DownloadIcon, RegenerateIcon, TrashIcon } from './icons';

interface ProgressState {
  total: number;
  completed: number;
  errors: number;
}

type ImageGroup = {
  groupId: string;
  title: string;
  sourceImageSrc?: string;
  images: GeneratedImage[];
};

interface CreationsGalleryProps {
  images: GeneratedImage[];
  products: ProductImageFile[];
  onSelectImage: (image: GeneratedImage) => void;
  onDownloadImage: (src: string) => void;
  onDownloadAll: () => void;
  autoDownloadAll: boolean;
  onAutoDownloadAllChange: (checked: boolean) => void;
  progressState: ProgressState;
  onRegenerateImage: (image: GeneratedImage) => void;
  onDeleteImage: (imageId: string) => void;
  isQueueProcessing: boolean;
  selectedImageIds: Set<string>;
  onSelectionChange: (imageId: string) => void;
  onSelectAll: () => void;
  onDeleteSelected: () => void;
  onDownloadSelected: () => void;
  onGroupSelectionChange: (imageIds: string[]) => void;
}

const CreationsGallery: React.FC<CreationsGalleryProps> = ({
  images,
  products,
  onSelectImage,
  onDownloadImage,
  onDownloadAll,
  autoDownloadAll,
  onAutoDownloadAllChange,
  progressState,
  onRegenerateImage,
  onDeleteImage,
  isQueueProcessing,
  selectedImageIds,
  onSelectionChange,
  onSelectAll,
  onDeleteSelected,
  onDownloadSelected,
  onGroupSelectionChange,
}) => {
  const percent = progressState.total > 0 ? (progressState.completed / progressState.total) * 100 : 0;
  const allSelected = images.length > 0 && selectedImageIds.size === images.length;

  const groupedImages = useMemo(() => {
    const groups = new Map<string, ImageGroup>();
    const singleImages: GeneratedImage[] = [];
    // Fix: Explicitly type the Map to aid TypeScript's type inference, which was failing to determine the value type correctly.
    const productMap = new Map<string, { product: ProductImageFile; index: number }>(products.map((p, index) => [p.id, { product: p, index }]));

    images.forEach(image => {
        if (image.sourceProductId && productMap.has(image.sourceProductId)) {
            const productId = image.sourceProductId;
            if (!groups.has(productId)) {
                const { product, index } = productMap.get(productId)!;
                groups.set(productId, {
                    groupId: productId,
                    title: `Sản phẩm ${index + 1}`,
                    sourceImageSrc: product.originalBase64,
                    images: [],
                });
            }
            groups.get(productId)!.images.push(image);
        } else {
            singleImages.push(image);
        }
    });

    const sortedGroups: ImageGroup[] = products
        .map(p => groups.get(p.id))
        .filter((g): g is ImageGroup => !!g);

    if (singleImages.length > 0) {
        sortedGroups.push({
            groupId: 'single-images',
            title: 'Ảnh đơn lẻ & Tác vụ khác',
            images: singleImages,
        });
    }

    return sortedGroups;
  }, [images, products]);


  return (
    <div className="w-full flex flex-col gap-4 h-full">
      {progressState.total > 0 && (
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1 text-gray-300 font-medium">
            <span>Hoàn thành: {progressState.completed}/{progressState.total}</span>
            {progressState.errors > 0 && <span className="text-red-400">Lỗi: {progressState.errors}</span>}
          </div>
          <div className="w-full bg-gray-600 rounded-full h-2.5">
            <div
              className="bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${percent}%` }}
            ></div>
          </div>
        </div>
      )}
      
      <div className="flex items-center">
        <input
          id="auto-download-all"
          type="checkbox"
          checked={autoDownloadAll}
          onChange={(e) => onAutoDownloadAllChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
          disabled={isQueueProcessing}
        />
        <label
          htmlFor="auto-download-all"
          className="ml-2 block text-sm font-medium text-gray-300 select-none cursor-pointer"
        >
          Tự động tải về sau khi tạo
        </label>
      </div>

      <div className="border-y border-gray-700/50 py-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 px-1">Thao tác Hàng loạt</h3>
        <div className="grid grid-cols-2 gap-2 mb-3">
            <button
                onClick={onSelectAll}
                disabled={images.length === 0 || isQueueProcessing}
                className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-gray-600 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                {allSelected ? 'Bỏ chọn Tất cả' : 'Chọn tất cả Ảnh'}
            </button>
             <button
                disabled={true}
                className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                Chọn tất cả Video
            </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
            <button
                onClick={onDownloadSelected}
                disabled={selectedImageIds.size === 0 || isQueueProcessing}
                className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                Tải về ({selectedImageIds.size})
            </button>
            <button
                onClick={onDeleteSelected}
                disabled={selectedImageIds.size === 0 || isQueueProcessing}
                className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                Xóa mục đã chọn ({selectedImageIds.size})
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pr-2 -mr-2">
        {groupedImages.length > 0 ? (
          <div className="space-y-6">
            {groupedImages.map((group) => {
              const areAllInGroupSelected = group.images.length > 0 && group.images.every(img => selectedImageIds.has(img.id));
              return (
                <div key={group.groupId} className="p-4 bg-gray-900/40 border border-gray-600 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        id={`checkbox-group-${group.groupId}`}
                        checked={areAllInGroupSelected}
                        onChange={() => {
                          const imageIdsInGroup = group.images.map(i => i.id);
                          onGroupSelectionChange(imageIdsInGroup);
                        }}
                        disabled={group.images.length === 0 || isQueueProcessing}
                        className="h-5 w-5 rounded border-gray-400 bg-gray-900 bg-opacity-75 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                      />
                      <div className="flex items-center gap-3">
                        {group.sourceImageSrc && (
                          <img src={group.sourceImageSrc} alt={group.title} className="w-12 h-16 object-contain rounded-md bg-black" />
                        )}
                        <label htmlFor={`checkbox-group-${group.groupId}`} className="text-base font-semibold text-cyan-400 cursor-pointer">{group.title}</label>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {group.images.map((image) => (
                      <div
                        key={image.id}
                        className="relative group aspect-[9/16] w-full cursor-pointer"
                        onClick={() => onSelectImage(image)}
                      >
                        <img
                          src={image.src}
                          alt="Generated creation"
                          className="w-full h-full object-cover rounded-lg border-2 border-gray-700 group-hover:border-cyan-500/50 transition-all"
                        />
                        <div 
                          className={`absolute inset-0 rounded-lg transition-all ${selectedImageIds.has(image.id) ? 'border-2 border-cyan-500' : 'border-2 border-transparent'} group-hover:bg-black group-hover:bg-opacity-40 pointer-events-none`}
                        ></div>
                        <input
                          type="checkbox"
                          id={`checkbox-${image.id}`}
                          checked={selectedImageIds.has(image.id)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => onSelectionChange(image.id)}
                          className="absolute top-2 left-2 z-20 h-5 w-5 rounded border-gray-400 bg-gray-900 bg-opacity-75 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                        />
                        <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); onRegenerateImage(image); }}
                            className="absolute bottom-2 left-2 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Tạo lại ảnh"
                          ><RegenerateIcon className="w-5 h-5" /></button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDownloadImage(image.src); }}
                            className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75"
                            aria-label="Tải ảnh xuống"
                          ><DownloadIcon className="w-5 h-5" /></button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteImage(image.id); }}
                            className="absolute bottom-2 right-2 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75"
                            aria-label="Xóa ảnh"
                          ><TrashIcon className="w-5 h-5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center text-gray-500 p-4 border-2 border-dashed border-gray-700 rounded-lg h-full">
            <p>Tác phẩm của bạn sẽ xuất hiện ở đây.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreationsGallery;