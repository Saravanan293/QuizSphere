# QuizSphere 🎯

An AI-powered quiz platform with PDF generation and real-time multiplayer Kahoot mode.

## Features
- 🔑 **Secure Authentication**: User login and signup with animated glassmorphism UI.
- 📄 **PDF Quiz Generator**: Upload any PDF and AI generates custom MCQs.
- ⚙️ **Customizable**: Choose Difficulty (Easy, Medium, Hard) and Question Limits.
- 📈 **History & Review**: Track past performance with detailed answer review and confetti celebrations.
- 🎮 **Kahoot Mode**: Real-time multiplayer rooms with PINs, live leaderboard, and fast-paced scoring.

## Tech Stack
- **Frontend**: React (Vite), Framer Motion, Socket.io-client, Axios.
- **Backend**: Python Flask, Flask-SocketIO, Flask-SQLAlchemy, Flask-Bcrypt.
- **AI**: Google Gemini Pro (via API).
- **PDF Extraction**: PyMuPDF.

## Setup Instructions

### 1. Prerequisites
- Python 3.9+
- Node.js 18+
- [Google Gemini API Key](https://aistudio.google.com/)

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```
Create a `.env` file in the `backend` folder:
```env
SECRET_KEY=your_secret_key
GEMINI_API_KEY=your_gemini_api_key
FLASK_ENV=development
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Running the Project
- **Start Backend**: `cd backend && python app.py` (runs on port 5000)
- **Start Frontend**: `cd frontend && npm run dev` (runs on port 5173)

Open `http://localhost:5173` in your browser.

## 🚀 Deployment Instructions

### 1. Backend Deployment (Render)
1. Sign up at [Render.com](https://render.com).
2. Create a new **Web Service** and connect your GitHub repository.
3. Use the following settings:
   - **Environment**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --worker-class eventlet -w 1 app:app`
4. Set the following **Environment Variables**:
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - `SECRET_KEY`: A random secure string.
   - `ALLOWED_ORIGINS`: Your Vercel frontend URL (e.g., `https://quizsphere.vercel.app`).
   - `FLASK_ENV`: `production`

### 2. Frontend Deployment (Vercel)
1. Sign up at [Vercel.com](https://vercel.com).
2. Import your project and select the `frontend` folder as the **Root Directory**.
3. Set the following **Environment Variables**:
   - `VITE_BACKEND_URL`: Your Render backend URL (e.g., `https://quizsphere-backend.onrender.com`).
4. Deploy!

> [!TIP]
> **Database**: By default, this app uses SQLite. For a production environment with data persistence, connect a PostgreSQL database by setting the `DATABASE_URL` environment variable in Render.
