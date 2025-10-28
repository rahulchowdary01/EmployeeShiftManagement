# Employee Shift Management System with AI Integration

A comprehensive workforce management platform built with FastAPI, React, and LangChain AI integration for organizing and monitoring employee work schedules with balanced shift allocation and transparency.

## 🚀 Features Completed

### ✅ UI/UX Improvements
- **Enhanced Employee Photos**: Large 80px images in dedicated photo column with professional styling
- **Compact Delete Buttons**: Shows only 🗑️ symbol for clean interface
- **First Name Display**: Employee table shows only first names for cleaner look
- **Better Table Layout**: Horizontal scrolling with proper column sizing and full data visibility
- **Input Validations**: Email format validation and strict 10-digit phone number validation
- **Improved Spacing**: Better padding, gaps, and responsive design

### ✅ Delete Functionality
- **Cascade Deletion**: Delete employees → removes all their assignments
- **Cascade Deletion**: Delete shifts → removes all assignments to that shift
- **Individual Deletion**: Delete specific assignments
- **No Database Errors**: Proper foreign key handling prevents orphaned records

### ✅ AI Integration (LangChain + OpenAI GPT-3.5-turbo)
- **Schedule Optimization**: AI analyzes workload balance and suggests improvements
- **Employee Assignment Suggestions**: AI recommends optimal shift assignments
- **Business Insights**: Human-readable AI insights from historical data
- **AI Chat Assistant**: Interactive chat for shift management questions
- **Workforce Analysis**: Advanced pattern analysis and predictions

## 🤖 AI Features

### AI Dashboard (`/ai`)
- **Schedule Optimization**: Click "🤖 Optimize Schedule" to get AI recommendations
- **Business Insights**: Click "📊 Get Insights" for data analysis
- **AI Chat**: Ask questions like "How can I improve shift coverage?"

### AI Endpoints
- `POST /ai/optimize-schedule` - Get optimization recommendations
- `POST /ai/suggest-assignment` - Get assignment suggestions for specific employee/shift
- `POST /ai/insights` - Get business insights from historical data
- `POST /ai/chat` - Chat with AI about shift management

## 🔧 Setup Instructions

### Prerequisites
- Docker and Docker Compose installed
- OpenAI API key (for AI features)

### 1. Clone the Repository
```bash
git clone https://github.com/rahulchowdary01/EmployeeShiftManagement.git
cd EmployeeShiftManagement
```

### 2. Environment Variables
Create a `.env` file in the project root:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Run the System
```bash
# Build and start all services
docker compose up --build

# Or run in detached mode
docker compose up --build -d
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs
- **AI Dashboard**: http://localhost:5173/ai

### 5. Stop the System
```bash
# Stop all services
docker compose down

# Stop and remove volumes (clears database)
docker compose down -v
```

## 📱 Application Pages

1. **Employees** (`/`) - Manage employees with large photos, validation, and search
2. **Shifts** (`/shifts`) - Create and manage shifts with time validation
3. **Assignments** (`/assignments`) - Assign employees to shifts with conflict detection
4. **AI Assistant** (`/ai`) - AI-powered insights, optimization, and chat

## 🎨 Design Theme
- **Dark Royal Theme**: Charcoal backgrounds with gold/blue/purple accents
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, professional interface with smooth animations
- **Distinct Page Themes**: Each page has unique color schemes for easy navigation

## 🔒 Security & Validation Features
- **Email Validation**: Proper email format checking
- **Phone Validation**: Strict 10-digit phone number enforcement
- **Input Sanitization**: Prevents malicious input
- **Cascade Deletion**: Prevents database inconsistencies
- **Error Handling**: Graceful error messages throughout the application

## 🛠️ Technical Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: ORM for database operations
- **PostgreSQL**: Relational database
- **LangChain**: AI framework for LLM integration
- **OpenAI GPT-3.5-turbo**: AI model for insights and recommendations

### Frontend
- **React**: Modern JavaScript framework
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool
- **CSS**: Custom styling with CSS variables

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Alembic**: Database migrations

## 🚀 Getting Started

1. **Get OpenAI API Key**: Visit https://platform.openai.com/ to get your API key
2. **Clone Repository**: `git clone https://github.com/rahulchowdary01/EmployeeShiftManagement.git`
3. **Setup Environment**: Create `.env` file with your OpenAI API key
4. **Run Application**: `docker compose up --build`
5. **Access Frontend**: Open http://localhost:5173 in your browser

## 📊 Features Overview

- ✅ **Employee Management**: Add, edit, delete employees with photo uploads
- ✅ **Shift Management**: Create shifts with time validation and conflict detection
- ✅ **Assignment System**: Assign employees to shifts with automatic conflict prevention
- ✅ **AI Integration**: LangChain-powered insights, optimization, and chat
- ✅ **Responsive Design**: Works on all device sizes
- ✅ **Data Validation**: Comprehensive input validation and error handling
- ✅ **Cascade Operations**: Safe deletion with proper relationship handling

The system is fully functional with AI integration, enhanced UI/UX, and comprehensive workforce management capabilities!
