import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Download, 
  Loader, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Image as ImageIcon,
  Package,
  DownloadCloud
} from 'lucide-react';

const BatchProcessor = ({ sourceImage, targetImages, onBatchComplete }) => {
  const [batchId, setBatchId] = useState(null);
  const [batchStatus, setBatchStatus] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startBatchProcessing = async () => {
    if (!sourceImage || !targetImages || targetImages.length === 0) {
      setError('Please select source and target images');
      return;
    }

    setProcessing(true);
    setError(null);
    setBatchStatus(null);
    setProgress(0);

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/batch-face-swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_image_url: sourceImage.url,
          target_image_urls: targetImages.map(img => img.url),
          face_index_source: 0
        }),
      });

      const data = await response.json();

      if (data.success) {
        setBatchId(data.batch_id);
        startPolling(data.batch_id);
      } else {
        throw new Error('Failed to start batch processing');
      }
    } catch (error) {
      setError(`Batch processing failed: ${error.message}`);
      setProcessing(false);
    }
  };

  const startPolling = (id) => {
    intervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/batch-status/${id}`);
        const data = await response.json();

        setBatchStatus(data);
        const progressPercentage = (data.completed_images / data.total_images) * 100;
        setProgress(progressPercentage);

        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(intervalRef.current);
          setProcessing(false);
          
          if (data.status === 'completed') {
            onBatchComplete && onBatchComplete();
          }
          
          if (data.status === 'failed') {
            setError('Batch processing failed');
          }
        }
      } catch (error) {
        console.error('Failed to fetch batch status:', error);
      }
    }, 2000); // Poll every 2 seconds
  };

  const downloadAllResults = () => {
    if (batchStatus && batchStatus.results) {
      batchStatus.results.forEach((result, index) => {
        if (result.success) {
          const link = document.createElement('a');
          link.href = result.result_image;
          link.download = `batch_faceswap_${index + 1}_${Date.now()}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      });
    }
  };

  const downloadSingleResult = (resultUrl, index) => {
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `faceswap_${index + 1}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetBatch = () => {
    setBatchId(null);
    setBatchStatus(null);
    setProcessing(false);
    setError(null);
    setProgress(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
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
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Batch Face Swap Processing</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Process multiple target images simultaneously with your source face. 
          Perfect for creating multiple variations or processing large image sets efficiently.
        </p>
      </div>

      {/* Batch Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Source Image */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 mr-2 text-purple-500" />
              Source Image
            </h3>
            <div className="relative inline-block">
              <img
                src={sourceImage.url}
                alt="Source"
                className="w-32 h-32 object-cover rounded-lg border-2 border-purple-200"
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">{sourceImage.name}</p>
          </div>

          {/* Batch Info */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center justify-center">
              <Package className="w-5 h-5 mr-2 text-blue-500" />
              Batch Details
            </h3>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">
                {targetImages.length}
              </div>
              <p className="text-sm text-gray-600">Images to process</p>
              {batchStatus && (
                <div className="text-sm text-gray-500">
                  {batchStatus.completed_images} / {batchStatus.total_images} completed
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center justify-center">
              <Clock className="w-5 h-5 mr-2 text-green-500" />
              Status
            </h3>
            <div className="space-y-2">
              {processing && (
                <div className="status-badge status-processing">
                  Processing
                </div>
              )}
              {batchStatus?.status === 'completed' && (
                <div className="status-badge status-completed">
                  Completed
                </div>
              )}
              {batchStatus?.status === 'failed' && (
                <div className="status-badge status-failed">
                  Failed
                </div>
              )}
              {!processing && !batchStatus && (
                <div className="text-gray-500">Ready to start</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {processing && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800">Processing Progress</h3>
            <span className="text-sm text-gray-600">{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="progress-bar h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          {batchStatus && (
            <p className="text-sm text-gray-600 mt-2">
              Processing image {batchStatus.completed_images + 1} of {batchStatus.total_images}
            </p>
          )}
        </div>
      )}

      {/* Target Images Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Target Images</h3>
        <div className="batch-grid">
          {targetImages.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image.url}
                alt={`Target ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  Image {index + 1}
                </span>
              </div>
              
              {/* Processing indicator */}
              {processing && batchStatus && index < batchStatus.completed_images && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="w-6 h-6 text-green-500 bg-white rounded-full" />
                </div>
              )}
              
              {processing && batchStatus && index === batchStatus.completed_images && (
                <div className="absolute top-2 right-2">
                  <Loader className="w-6 h-6 text-blue-500 animate-spin bg-white rounded-full" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        {!processing && !batchStatus && (
          <button
            onClick={startBatchProcessing}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all flex items-center space-x-2"
          >
            <Play className="w-5 h-5" />
            <span>Start Batch Processing</span>
          </button>
        )}

        {batchStatus?.status === 'completed' && (
          <>
            <button
              onClick={downloadAllResults}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <DownloadCloud className="w-5 h-5" />
              <span>Download All Results</span>
            </button>
            <button
              onClick={resetBatch}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              New Batch
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

      {/* Results Display */}
      {batchStatus?.status === 'completed' && batchStatus.results && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Batch Results</h3>
            <div className="text-sm text-gray-600">
              {batchStatus.results.filter(r => r.success).length} successful, {' '}
              {batchStatus.results.filter(r => !r.success).length} failed
            </div>
          </div>
          
          <div className="batch-grid">
            {batchStatus.results.map((result, index) => (
              <div key={index} className="relative group card-hover">
                {result.success ? (
                  <div className="space-y-2">
                    <img
                      src={result.result_image}
                      alt={`Result ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border-2 border-green-200"
                    />
                    <button
                      onClick={() => downloadSingleResult(result.result_image, index)}
                      className="w-full bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center justify-center space-x-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-32 bg-red-50 border-2 border-red-200 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
                      <p className="text-xs text-red-600">Failed</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchProcessor;