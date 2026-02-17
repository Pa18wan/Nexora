# ⚖️ Nexora AI Legal Intelligence Platform

**Empowering Legal Justice through Artificial Intelligence**

Nexora is a cutting-edge, AI-powered legal services platform designed to modernize the legal landscape. By bridging the gap between clients seeking legal aid and professional advocates, Nexora leverages advanced AI (DeepSeek) to provide instant case analysis, intelligent matching, and streamlined case management.

Built with a focus on user experience, security, and efficiency, Nexora offers a premium "Liquid Glassmorphism" interface that feels both futuristic and professional.

---

## 🌐 Live Demo

🚀 **Experience the platform live here:** [https://nexora-rust-one.vercel.app/](https://nexora-rust-one.vercel.app/)

---

## � Screenshots

| Landing Page | Dashboard |
|:---:|:---:|
| ![Landing Page](screenshots/Screenshot%202026-02-17%20235112.png) | ![Dashboard](screenshots/Screenshot%202026-02-17%20235709.png) |

| Advocate Analytics | Admin Panel |
|:---:|:---:|
| ![Advocate Analytics](screenshots/Screenshot%202026-02-18%20002828.png) | ![Admin Panel](screenshots/Screenshot%202026-02-17%20235231.png) |

*More screenshots available in the `screenshots/` directory.*

---

## �🚀 Key Features

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
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Admin SDK & Custom JWT
- **Storage**: Firebase Storage (for documents)
- **Security**: Helmet, Express-Rate-Limit, CORS
- **AI Integration**: DeepSeek AI (Custom Rule-Based Engine)

---

## 📦 Installation & Setup

Follow these steps to set up the project locally.

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Firebase Project**: Created in Firebase Console

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

Create a `.env` file in the `server` directory with your Firebase service account details:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_super_secret_jwt_key

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
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
| Variable | Description |
| :--- | :--- |
| `PORT` | Port for the backend server (Default: 5000) |
| `FIREBASE_PROJECT_ID` | Firebase Project ID |
| `FIREBASE_PRIVATE_KEY` | Firebase Service Account Private Key |
| `FIREBASE_CLIENT_EMAIL` | Firebase Service Account Email |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `CLIENT_URL` | Frontend URL for CORS |

---

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### Advocates (Admin & Client)
- `GET /api/admin/advocates` - Get all advocates (Admin)
- `GET /api/advocates` - Search public advocates
- `GET /api/advocates/:id` - Get profile

### Cases
- `POST /api/client/cases` - Submit a new case
- `GET /api/client/cases` - Get client cases
- `POST /api/documents/cases/:id/upload` - Upload documents

### AI Services
- `POST /api/ai/chat` - Chat with legal assistant
- `GET /api/ai/logs` - View AI interaction history

---

## 📁 Project Structure

```
AIBasedLegalServicesPlatform/
├── client/                 # Frontend Application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application views (Admin, Advocate, Client)
│   │   ├── services/       # API integration
│   │   └── ...
│
├── server/                 # Backend Application
│   ├── config/             # Firebase configuration
│   ├── controllers/        # Request handlers (Firestore logic)
│   ├── routes/             # API routes
│   ├── services/           # Helper services (DeepSeek, etc.)
│   ├── firebase-seeder.js  # Database seeder
│   └── server.js           # Server entry point
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
