# ⚖️ Nexora AI Legal Intelligence Platform

**Empowering Legal Justice through Artificial Intelligence**

Nexora is a cutting-edge, AI-powered legal services platform designed to modernize the legal landscape. By bridging the gap between clients seeking legal aid and professional advocates, Nexora leverages advanced AI (DeepSeek) to provide instant case analysis, intelligent matching, and streamlined case management.

Built with a focus on user experience, security, and efficiency, Nexora offers a premium "Liquid Glassmorphism" interface that feels both futuristic and professional.

---

## 🌐 Live Demo

🚀 **Experience the platform live here:** [https://nexora-rust-one.vercel.app/](https://nexora-rust-one.vercel.app/)

---

## 🚀 Key Features

### 👥 For Clients
- **AI Case Analysis**: Submit case details and receive an instant AI-generated summary, urgency classification, and recommended legal steps.
- **Find Advocates**: Search and filter advocates based on specialization, experience, location, and user ratings.
- **Case Management**: Track the status of your cases in real-time.
- **Secure Document Vault**: Upload and manage legal documents securely.
- **Direct Communication**: Chat and schedule appointments with advocates.

### ⚖️ For Advocates
- **Smart Dashboard**: a unified view of all active cases, pending requests, and upcoming hearings.
- **Profile Management**: customizable professional profiles to showcase expertise and attract clients.
- **Case Requests**: Accept or decline case requests based on your availability and specialization.
- **Performance Analytics**: Track earnings, case resolution rates, and client feedback.

### 🛡️ For Administrators
- **User Management**: Verify advocate credentials and manage user roles.
- **System Monitoring**: View platform-wide statistics, active users, and system health.
- **Complaint Handling**: Review and resolve disputes between clients and advocates.
- **AI Usage Logs**: Monitor AI token usage and system performance metrics.

---

## 🛠 Tech Stack

### Frontend (Client)
- **Framework**: React 18 (Vite)
- **Language**: TypeScript
- **Styling**: Pure CSS (Liquid Glassmorphism Design System)
- **State Management**: React Context API
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Charts**: Chart.js & React-Chartjs-2

### Backend (Server)
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs
- **File Uploads**: Multer
- **Security**: Helmet, Express-Rate-Limit, CORS
- **AI Integration**: DeepSeek AI (via OpenAI-compatible API)

---

## 📦 Installation & Setup

Follow these steps to set up the project locally.

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Installed locally or a MongoDB Atlas connection string

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/nexora-legal-platform.git
cd AIBasedLegalServicesPlatform
```

### 2. Backend Setup
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory with the following variables:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/legal_services
JWT_SECRET=your_super_secret_jwt_key_change_this
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# AI Configuration (DeepSeek or OpenAI Compatible)
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
```

(Optional) Seed the database with demo data:
```bash
npm run seed
```

Start the backend server:
```bash
npm run dev
```
*The server will start on port 5000.*

### 3. Frontend Setup
Open a new terminal, navigate to the client directory, and install dependencies:
```bash
cd client
npm install
```

Start the development server:
```bash
npm run dev
```
*The client will start on http://localhost:5173*

---

## 🔐 Environment Variables

### Server (`server/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Port for the backend server | `5000` |
| `MONGODB_URI` | Connection string for MongoDB | `mongodb://localhost:27017/legal_services` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `secret` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `CLIENT_URL` | URL of the frontend application | `http://localhost:5173` |
| `DEEPSEEK_API_KEY` | API Key for AI services | - |

---

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register a new user (client/advocate)
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### Advocates
- `GET /api/advocates` - Search for advocates with filters
- `GET /api/advocates/:id` - Get public profile of an advocate
- `GET /api/advocates/top-rated` - Get top-rated advocates

### Cases
- `POST /api/cases` - Create a new case
- `GET /api/cases` - Get all cases for the logged-in user
- `GET /api/cases/:id` - Get case details
- `PUT /api/cases/:id/status` - Update case status (Advocate only)

### AI Services
- `POST /api/ai/analyze-case` - Analyze case details using AI
- `POST /api/ai/chat` - Chat with the AI legal assistant

### Admin
- `GET /api/admin/dashboard` - Get admin dashboard stats
- `GET /api/admin/users` - Manage all users
- `PUT /api/admin/verify-advocate/:id` - Verify advocate credentials

---

## 📁 Project Structure

```
AIBasedLegalServicesPlatform/
├── client/                 # Frontend Application
│   ├── public/             
│   ├── src/
│   │   ├── assets/         # Images, fonts, static assets
│   │   ├── components/     # Reusable UI components (Buttons, Cards, Modals)
│   │   ├── context/        # React Context (Auth, Theme)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── layouts/        # Page layouts (Dashboard, Landing)
│   │   ├── pages/          # Application views
│   │   │   ├── admin/      # Admin-specific pages
│   │   │   ├── advocate/   # Advocate-specific pages
│   │   │   ├── client/     # Client-specific pages
│   │   │   └── auth/       # Login/Register pages
│   │   ├── services/       # API service functions
│   │   ├── types/          # TypeScript interfaces
│   │   ├── utils/          # Helper functions
│   │   ├── App.tsx         # Main App component
│   │   └── main.tsx        # Entry point
│   ├── index.html
│   └── vite.config.ts
│
├── server/                 # Backend Application
│   ├── config/             # Database & app configuration
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Auth, Error handling, Validation
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API route definitions
│   ├── services/           # External services (AI integration)
│   ├── utils/              # Utility functions
│   ├── uploads/            # Directory for uploaded documents
│   ├── server.js           # Server entry point
│   └── seeder.js           # Database seeding script
│
└── README.md               # Project documentation
```

---

## 👥 Demo Accounts

For testing purposes, you can use the following pre-seeded accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@nexora.com` | `password123` |
| **Client** | `client@nexora.com` | `password123` |
| **Advocate** | `advocate@nexora.com` | `password123` |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
