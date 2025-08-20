import React, { useState } from 'react';
import { 
  Download, 
  Trash2, 
  Calendar, 
  Clock, 
  Image as ImageIcon,
  Eye,
  Search,
  Filter,
  Grid3X3,
  List
} from 'lucide-react';

const HistoryGallery = ({ history, onHistoryUpdate }) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'fastest'
  const [selectedImage, setSelectedImage] = useState(null);

  // Filter and sort history
  const filteredAndSortedHistory = history
    .filter(item => {
      if (!searchTerm) return true;
      return item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
             new Date(item.created_at).toLocaleDateString().includes(searchTerm);
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'fastest':
          return (a.processing_time || 0) - (b.processing_time || 0);
        case 'newest':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

  const downloadImage = (imageUrl, historyId) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `faceswap_${historyId}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteHistoryItem = async (historyId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/history/${historyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onHistoryUpdate && onHistoryUpdate();
      } else {
        throw new Error('Failed to delete item');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const ImageModal = ({ image, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="max-w-4xl max-h-full bg-white rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Face Swap Result</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>
          </div>
        </div>
        <div className="p-4">
          <img
            src={image.result_image}
            alt="Face swap result"
            className="max-w-full max-h-96 mx-auto rounded-lg"
          />
          <div className="mt-4 flex justify-center space-x-4">
            <button
              onClick={() => downloadImage(image.result_image, image.id)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-600 mb-2">No Face Swaps Yet</h3>
        <p className="text-gray-500">
          Your face swap history will appear here. Start by uploading images and creating your first swap!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Face Swap History</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Browse, download, and manage all your face swap creations. Keep track of your 
          best results and easily access them anytime.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-4">
            {/* Sort */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="fastest">Fastest Processing</option>
              </select>
            </div>

            {/* View Mode */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>{filteredAndSortedHistory.length} results</span>
          <span>Total: {history.length} face swaps</span>
        </div>
      </div>

      {/* History Items */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedHistory.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden history-item">
              {/* Image */}
              <div className="relative">
                <img
                  src={item.result_image}
                  alt="Face swap result"
                  className="w-full h-48 object-cover cursor-pointer"
                  onClick={() => setSelectedImage(item)}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                  <Eye className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity cursor-pointer" />
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-mono text-gray-500">
                    {item.id.substring(0, 8)}...
                  </span>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{item.processing_time?.toFixed(2)}s</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(item.created_at)}</span>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => downloadImage(item.result_image, item.id)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => deleteHistoryItem(item.id)}
                    className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredAndSortedHistory.map((item) => (
              <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  {/* Thumbnail */}
                  <img
                    src={item.result_image}
                    alt="Face swap result"
                    className="w-16 h-16 object-cover rounded-lg cursor-pointer"
                    onClick={() => setSelectedImage(item)}
                  />

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-sm text-gray-600">
                        ID: {item.id.substring(0, 12)}...
                      </span>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{item.processing_time?.toFixed(2)}s</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(item.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedImage(item)}
                      className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => downloadImage(item.result_image, item.id)}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => deleteHistoryItem(item.id)}
                      className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

      {/* No Results */}
      {filteredAndSortedHistory.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-600 mb-2">No results found</h3>
          <p className="text-gray-500">
            No face swaps match your search criteria. Try adjusting your search terms or filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default HistoryGallery;