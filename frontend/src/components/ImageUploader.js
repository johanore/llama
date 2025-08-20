import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

const ImageUploader = ({ 
  onImageUpload, 
  currentImage, 
  multiple = false, 
  label = "Drop images here", 
  accept = "image/*",
  className = ""
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const uploadImage = async (file) => {
    setUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        const imageData = {
          file: file,
          url: `${process.env.REACT_APP_BACKEND_URL}${data.url}`,
          filename: data.filename,
          name: file.name,
          size: file.size
        };
        
        onImageUpload(imageData);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      if (multiple) {
        for (const file of acceptedFiles) {
          await uploadImage(file);
        }
      } else {
        await uploadImage(acceptedFiles[0]);
      }
    }
  }, [multiple, onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeImage = () => {
    onImageUpload(null);
  };

  return (
    <div className="w-full">
      {!currentImage ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 upload-zone ${
            isDragActive ? 'dragover border-purple-400 bg-purple-50' : 'border-gray-300 hover:border-gray-400'
          } ${className}`}
        >
          <input {...getInputProps()} />
          
          {uploading ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="spinner"></div>
              <p className="text-gray-600">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-700 mb-1">
                  {label}
                </p>
                <p className="text-sm text-gray-500">
                  Click to browse or drag and drop
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Supports: PNG, JPG, JPEG, GIF, WebP (max 10MB)
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="relative overflow-hidden rounded-xl border-2 border-gray-200">
            <img
              src={currentImage.url}
              alt="Uploaded"
              className="w-full h-64 object-cover image-preview"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
              <button
                onClick={removeImage}
                className="opacity-0 hover:opacity-100 bg-red-500 text-white p-2 rounded-full transition-all duration-300 hover:bg-red-600"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="mt-3 bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 truncate">
                  {currentImage.name}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {(currentImage.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;