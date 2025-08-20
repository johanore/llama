import React, { useState, useEffect } from 'react';
import './App.css';
import ImageUploader from './components/ImageUploader';
import FaceSwapInterface from './components/FaceSwapInterface';
import BatchProcessor from './components/BatchProcessor';
import HistoryGallery from './components/HistoryGallery';
import { 
  Upload, 
  Image as ImageIcon, 
  History, 
  Layers,
  Home,
  Settings
} from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [sourceImage, setSourceImage] = useState(null);
  const [targetImages, setTargetImages] = useState([]);
  const [swapHistory, setSwapHistory] = useState([]);

  // Load history on component mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/history`);
      const data = await response.json();
      if (data.success) {
        setSwapHistory(data.history);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const refreshHistory = () => {
    loadHistory();
  };

  const navigationTabs = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'single', label: 'Face Swap', icon: ImageIcon },
    { id: 'batch', label: 'Batch Process', icon: Layers },
    { id: 'history', label: 'History', icon: History }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  FaceSwap Pro
                </h1>
                <p className="text-sm text-gray-500">Advanced AI Face Swapping</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{swapHistory.length}</span> swaps completed
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white/60 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigationTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Upload Your Images
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Start by uploading a source image (face to copy) and target images (faces to replace). 
                  Our AI will detect faces automatically and provide advanced swapping options.
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Source Image Upload */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                    <Upload className="w-5 h-5 mr-2 text-purple-500" />
                    Source Image
                  </h3>
                  <p className="text-gray-600">Upload the image with the face you want to copy</p>
                  <ImageUploader
                    onImageUpload={setSourceImage}
                    currentImage={sourceImage}
                    label="Drop source image here"
                    accept="image/*"
                    className="border-purple-200 hover:border-purple-300"
                  />
                </div>

                {/* Target Images Upload */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                    <Layers className="w-5 h-5 mr-2 text-blue-500" />
                    Target Images
                  </h3>
                  <p className="text-gray-600">Upload images where you want to replace faces</p>
                  <ImageUploader
                    onImageUpload={(newImage) => {
                      setTargetImages(prev => [...prev, newImage]);
                    }}
                    multiple={true}
                    label="Drop target images here (multiple allowed)"
                    accept="image/*"
                    className="border-blue-200 hover:border-blue-300"
                  />
                  
                  {/* Target Images Preview */}
                  {targetImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      {targetImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image.url}
                            alt={`Target ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <button
                            onClick={() => {
                              setTargetImages(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress to next step */}
              {sourceImage && targetImages.length > 0 && (
                <div className="text-center">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-green-700 font-medium">
                      ✓ Ready to proceed! You have {targetImages.length} target image(s) to process.
                    </p>
                  </div>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setActiveTab('single')}
                      className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center space-x-2"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Single Face Swap</span>
                    </button>
                    {targetImages.length > 1 && (
                      <button
                        onClick={() => setActiveTab('batch')}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <Layers className="w-4 h-4" />
                        <span>Batch Process All</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Single Face Swap Tab */}
          {activeTab === 'single' && (
            <FaceSwapInterface
              sourceImage={sourceImage}
              targetImages={targetImages}
              onSwapComplete={refreshHistory}
            />
          )}

          {/* Batch Processing Tab */}
          {activeTab === 'batch' && (
            <BatchProcessor
              sourceImage={sourceImage}
              targetImages={targetImages}
              onBatchComplete={refreshHistory}
            />
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <HistoryGallery
              history={swapHistory}
              onHistoryUpdate={refreshHistory}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;