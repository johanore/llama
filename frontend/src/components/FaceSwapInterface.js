import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Download, 
  Loader, 
  AlertCircle, 
  CheckCircle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

const FaceSwapInterface = ({ sourceImage, targetImages, onSwapComplete }) => {
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [processingTime, setProcessingTime] = useState(0);
  const [facesDetected, setFacesDetected] = useState({ source: 0, target: 0 });
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    if (targetImages && targetImages.length > 0) {
      setSelectedTarget(targetImages[0]);
    }
  }, [targetImages]);

  useEffect(() => {
    // Detect faces when images are loaded
    if (sourceImage) {
      detectFaces(sourceImage, 'source');
    }
    if (selectedTarget) {
      detectFaces(selectedTarget, 'target');
    }
  }, [sourceImage, selectedTarget]);

  const detectFaces = async (image, type) => {
    try {
      const formData = new FormData();
      
      // Convert image URL to blob for face detection
      const response = await fetch(image.url);
      const blob = await response.blob();
      formData.append('file', blob, image.filename);
      
      const detectResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/detect-faces`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await detectResponse.json();
      
      if (data.success) {
        setFacesDetected(prev => ({
          ...prev,
          [type]: data.faces_detected || 1
        }));
      }
    } catch (error) {
      console.error(`Face detection failed for ${type}:`, error);
      // Set default to 1 face if detection fails
      setFacesDetected(prev => ({
        ...prev,
        [type]: 1
      }));
    }
  };

  const handleFaceSwap = async () => {
    if (!sourceImage || !selectedTarget) {
      setError('Please select both source and target images');
      return;
    }

    setProcessing(true);
    setError(null);
    setResult(null);
    
    const startTime = Date.now();

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/face-swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_image_url: sourceImage.url,
          target_image_url: selectedTarget.url,
          face_index_source: 0,
          face_index_target: 0
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          image_url: data.result_image,
          processing_time: data.processing_time,
          history_id: data.history_id
        });
        setProcessingTime(data.processing_time);
        onSwapComplete && onSwapComplete();
      } else {
        throw new Error('Face swap failed');
      }
    } catch (error) {
      setError(`Face swap failed: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const downloadResult = () => {
    if (result) {
      const link = document.createElement('a');
      link.href = result.image_url;
      link.download = `faceswap_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetSwap = () => {
    setResult(null);
    setError(null);
    setProcessingTime(0);
  };

  if (!sourceImage) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-600 mb-2">No Source Image</h3>
        <p className="text-gray-500">Please upload a source image first in the Upload tab.</p>
      </div>
    );
  }

  if (!targetImages || targetImages.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-600 mb-2">No Target Images</h3>
        <p className="text-gray-500">Please upload target images first in the Upload tab.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Single Face Swap</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select a target image and swap faces with AI precision. Our advanced face detection
          ensures accurate results with natural-looking blending.
        </p>
      </div>

      {/* Image Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Source Image Display */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-800">Source Image</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Eye className="w-4 h-4" />
              <span>{facesDetected.source} face{facesDetected.source !== 1 ? 's' : ''} detected</span>
            </div>
          </div>
          <div className="relative">
            <img
              src={sourceImage.url}
              alt="Source"
              className="w-full h-64 object-cover rounded-xl border-2 border-purple-200"
            />
          </div>
        </div>

        {/* Target Image Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-800">Target Image</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Eye className="w-4 h-4" />
              <span>{facesDetected.target} face{facesDetected.target !== 1 ? 's' : ''} detected</span>
            </div>
          </div>
          
          {/* Target Image Display */}
          {selectedTarget && (
            <div className="relative">
              <img
                src={selectedTarget.url}
                alt="Target"
                className="w-full h-64 object-cover rounded-xl border-2 border-blue-200"
              />
            </div>
          )}
          
          {/* Target Image Selector */}
          {targetImages.length > 1 && (
            <div className="grid grid-cols-3 gap-2">
              {targetImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedTarget(image)}
                  className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                    selectedTarget === image 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={image.url}
                    alt={`Target ${index + 1}`}
                    className="w-full h-16 object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={handleFaceSwap}
          disabled={processing || !sourceImage || !selectedTarget}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {processing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>Swap Faces</span>
            </>
          )}
        </button>

        {result && (
          <>
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              {showComparison ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              <span>{showComparison ? 'Hide' : 'Show'} Comparison</span>
            </button>
            
            <button
              onClick={resetSwap}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Reset</span>
            </button>
          </>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 font-medium">Error</p>
          </div>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-green-700 font-medium">Face Swap Complete!</p>
            </div>
            <p className="text-green-600 mt-1">
              Processing completed in {processingTime.toFixed(2)} seconds
            </p>
          </div>

          {/* Result Images */}
          <div className="space-y-4">
            {showComparison ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <h4 className="text-lg font-medium text-gray-800 mb-2">Original Target</h4>
                  <img
                    src={selectedTarget.url}
                    alt="Original"
                    className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                  />
                </div>
                <div className="text-center">
                  <h4 className="text-lg font-medium text-gray-800 mb-2">Source Face</h4>
                  <img
                    src={sourceImage.url}
                    alt="Source"
                    className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                  />
                </div>
                <div className="text-center">
                  <h4 className="text-lg font-medium text-gray-800 mb-2">Face Swapped Result</h4>
                  <img
                    src={result.image_url}
                    alt="Result"
                    className="w-full h-64 object-cover rounded-lg border-2 border-green-200"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center">
                <h4 className="text-xl font-medium text-gray-800 mb-4">Face Swapped Result</h4>
                <div className="inline-block">
                  <img
                    src={result.image_url}
                    alt="Face Swap Result"
                    className="max-w-md w-full h-auto rounded-xl border-2 border-green-200 shadow-lg"
                  />
                </div>
              </div>
            )}

            {/* Download Button */}
            <div className="text-center">
              <button
                onClick={downloadResult}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2 mx-auto"
              >
                <Download className="w-5 h-5" />
                <span>Download Result</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceSwapInterface;