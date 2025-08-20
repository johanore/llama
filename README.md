# FaceSwap Pro - Advanced AI Face Swapping Application

A sophisticated face swapping application built with React, FastAPI, and fal.ai integration featuring multiple face detection, batch processing, and comprehensive history management.

## 🚀 Features

### Core Functionality
- **Advanced Face Swapping**: High-quality AI-powered face swapping using fal.ai
- **Multiple Face Detection**: Automatically detect and select faces in images
- **Batch Processing**: Process multiple target images simultaneously
- **Real-time Progress**: Track processing status with live updates

### User Experience
- **Drag & Drop Interface**: Intuitive image upload with preview
- **Comparison View**: Side-by-side before/after comparisons  
- **History Gallery**: Comprehensive gallery with search and filtering
- **Download Management**: Individual and batch download options

### Technical Features
- **RESTful API**: Complete FastAPI backend with MongoDB integration
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Real-time Updates**: WebSocket-like polling for batch status
- **Error Handling**: Comprehensive error management and user feedback

## 🛠️ Tech Stack

- **Frontend**: React 18, Tailwind CSS, Lucide Icons
- **Backend**: FastAPI, Python 3.9+
- **Database**: MongoDB
- **AI Service**: fal.ai Face Swap API
- **File Upload**: React Dropzone
- **State Management**: React Hooks

## 🏗️ Architecture

```
/app/
├── backend/
│   ├── server.py          # Main FastAPI application
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Environment variables
└── frontend/
    ├── src/
    │   ├── components/    # React components
    │   ├── App.js        # Main application
    │   └── App.css       # Styles
    ├── package.json      # Node dependencies
    └── public/           # Static files
```

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- MongoDB
- fal.ai API key

### Installation

1. Install backend dependencies:
```bash
cd /app/backend
pip install -r requirements.txt
```

2. Install frontend dependencies:
```bash
cd /app/frontend
yarn install
```

3. Configure environment variables:
   - Backend: `/app/backend/.env`
   - Frontend: `/app/frontend/.env`

4. Start services:
```bash
sudo supervisorctl restart all
```

## 📡 API Endpoints

### Image Management
- `POST /api/upload` - Upload image files
- `POST /api/detect-faces` - Detect faces in images

### Face Swapping
- `POST /api/face-swap` - Single face swap
- `POST /api/batch-face-swap` - Batch processing
- `GET /api/batch-status/{batch_id}` - Get batch status

### History Management
- `GET /api/history` - Get swap history
- `DELETE /api/history/{history_id}` - Delete history item

## 🎨 UI Components

### Main Interface
- **ImageUploader**: Drag-and-drop file upload with preview
- **FaceSwapInterface**: Single image face swapping
- **BatchProcessor**: Multiple image processing with progress
- **HistoryGallery**: Gallery view with search and filtering

### Features
- Real-time processing indicators
- Responsive grid/list layouts
- Image comparison sliders
- Batch download functionality

## 🔧 Configuration

### Environment Variables
```bash
# Backend (.env)
MONGO_URL=mongodb://localhost:27017/
FAL_KEY=your-fal-api-key

# Frontend (.env)
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Service Ports
- Backend: 8001
- Frontend: 3000
- MongoDB: 27017

## 📊 Database Schema

### Collections
- `swap_history`: Individual face swap records
- `batch_jobs`: Batch processing status and results

### Document Structure
```javascript
// swap_history
{
  id: "uuid",
  source_image: "url",
  target_image: "url", 
  result_image: "url",
  created_at: "datetime",
  processing_time: "float"
}

// batch_jobs
{
  id: "uuid",
  source_image: "url",
  target_images: ["urls"],
  status: "processing|completed|failed",
  results: [{"target_image": "url", "result_image": "url"}]
}
```

## 🎯 Usage Workflow

1. **Upload**: Drag source and target images
2. **Process**: Choose single or batch processing
3. **Monitor**: Track real-time progress
4. **Review**: Compare before/after results
5. **Download**: Save individual or batch results
6. **History**: Browse and manage past swaps

## 🔍 Advanced Features

### Face Detection
- Automatic face detection and counting
- Visual face location indicators
- Multi-face support with selection

### Batch Processing
- Queue management system
- Progress tracking with visual indicators
- Partial success handling

### History Management
- Search and filter capabilities
- Grid/list view modes
- Bulk operations support

## 🚀 Performance

- Async processing for non-blocking operations
- Efficient image handling and optimization
- Real-time status updates without page refresh
- Optimized MongoDB queries with indexing

## 📱 Responsive Design

- Mobile-first approach
- Touch-friendly interfaces
- Adaptive layouts for all screen sizes
- Progressive enhancement

Built with ❤️ using modern web technologies and AI services.