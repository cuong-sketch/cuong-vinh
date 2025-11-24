
import React from 'react';
import { DownloadIcon } from './icons';

interface TransparentImage {
  id: string;
  src: string;
}

interface TransparentGalleryProps {
  images: TransparentImage[];
  onDownloadImage: (src: string) => void;
  onDownloadAll: () => void;
  onUseAllAsProducts: () => void;
  isProcessing: boolean;
  bgColor: string;
  onViewImage: (src: string) => void;
}

const TransparentGallery: React.FC<TransparentGalleryProps> = ({ images, onDownloadImage, onDownloadAll, onUseAllAsProducts, isProcessing, bgColor, onViewImage }) => {
  if (images.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-12">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
         <h2 className="text-2xl font-bold">Ảnh Đã Tách Nền</h2>
         <div className="flex items-center gap-3">
            <button
              onClick={onUseAllAsProducts}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
              disabled={images.length === 0 || isProcessing}
            >
              Thay Thế Toàn Bộ Ảnh Sản Phẩm
            </button>
            <button
              onClick={onDownloadAll}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
              disabled={images.length === 0 || isProcessing}
            >
              Tải Về Tất Cả ({images.length})
            </button>
         </div>
      </div>
     
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {images.map((image) => (
          <div 
            key={image.id} 
            className="relative group aspect-square cursor-pointer"
            onClick={() => onViewImage(image.src)}
          >
            <div className={`w-full h-full p-2 ${bgColor} rounded-lg flex items-center justify-center`}>
                 <img
                    src={image.src}
                    alt="Transparent product"
                    className="w-full h-full object-contain"
                />
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg"></div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownloadImage(image.src);
              }}
              className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-75"
              aria-label="Tải ảnh xuống"
            >
              <DownloadIcon className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransparentGallery;
