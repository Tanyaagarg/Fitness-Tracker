<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:F97316,50:EF4444,100:DC2626&height=220&section=header&text=CoreTrack&fontSize=75&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Personal%20Fitness%20Tracker%20%F0%9F%8F%8B%EF%B8%8F&descAlignY=58&descAlign=50" width="100%"/>

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)

<br/>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=18&pause=1000&color=F97316&center=true&vCenter=true&width=650&lines=Log+workouts+%26+track+progress+%F0%9F%8F%8B%EF%B8%8F;Secure+JWT+authentication+%F0%9F%94%90;RESTful+API+with+Express+%E2%9A%A1;MongoDB+%2B+Mongoose+data+models+%F0%9F%97%84%EF%B8%8F;Vanilla+JS+frontend%2C+zero+dependencies+%E2%9C%A8" alt="Typing SVG" />
</p>

<br/>

<blockquote>
<strong>CoreTrack</strong> is a full-stack personal fitness tracker — log workouts, monitor progress, and stay consistent. Built with a RESTful Express + MongoDB backend and a clean vanilla JS frontend with secure JWT authentication.
</blockquote>

<br/>

</div>

---

## 🌟 Features

<table>
  <tr>
    <td align="center" width="220">🏋️<br/><strong>Workout Logging</strong><br/><sub>Log exercises, sets, reps, and duration for every session</sub></td>
    <td align="center" width="220">📈<br/><strong>Progress Tracking</strong><br/><sub>View your fitness history and monitor improvements over time</sub></td>
    <td align="center" width="220">🔐<br/><strong>Secure Auth</strong><br/><sub>JWT-based login with bcrypt password hashing</sub></td>
  </tr>
  <tr>
    <td align="center" width="220">👤<br/><strong>User Profiles</strong><br/><sub>Personal dashboard scoped to each authenticated user</sub></td>
    <td align="center" width="220">⚡<br/><strong>RESTful API</strong><br/><sub>Clean Express routes for users, workouts & exercises</sub></td>
    <td align="center" width="220">🎨<br/><strong>Vanilla Frontend</strong><br/><sub>Zero-dependency HTML/CSS/JS UI — fast & lightweight</sub></td>
  </tr>
</table>

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5 · CSS3 · Vanilla JavaScript |
| **Backend** | Node.js · Express.js |
| **Database** | MongoDB · Mongoose |
| **Auth** | JWT (JSON Web Tokens) · bcryptjs |
| **Dev Tools** | Nodemon · dotenv · cors |

</div>

---

## 📁 Project Structure

```
Fitness-Tracker/
├── public/                 # Frontend (HTML, CSS, JS)
│   ├── index.html          # Landing / login page
│   └── ...                 # Dashboard, workout pages
├── controllers/            # Route handler logic
├── models/                 # Mongoose schemas (User, Workout)
├── routes/                 # Express API routes
├── middleware/             # JWT auth middleware
├── config/                 # DB connection config
├── server.js               # App entry point
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB running locally on port `27017` (or a MongoDB Atlas URI)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Tanyaagarg/Fitness-Tracker.git
cd Fitness-Tracker

# 2. Install dependencies
npm install

# 3. Set up environment variables
```

Create a `.env` file in the root:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/coretrack
JWT_SECRET=your_jwt_secret_here
```

### Run

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

Open [http://localhost:5000](http://localhost:5000) in your browser.

---

## 🔌 API Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive JWT |

### Workouts 🔒 *(Requires JWT)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/workouts` | Get all workouts for current user |
| `POST` | `/api/workouts` | Log a new workout |
| `PUT` | `/api/workouts/:id` | Update a workout |
| `DELETE` | `/api/workouts/:id` | Delete a workout |

> All protected routes require `Authorization: Bearer <token>` header.

---

## 🔒 Security

- Passwords hashed with **bcryptjs** (10 salt rounds)
- JWT tokens for stateless session management
- Auth middleware protects all private routes
- User data is fully isolated — users only access their own workouts

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:F97316,50:EF4444,100:DC2626&height=120&section=footer" width="100%"/>

<sub>Built with 💪 Node.js + MongoDB + Vanilla JS</sub>

</div>
