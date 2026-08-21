# 🌱 CleanLoop AI

> **Smart Waste Management & Civic Cleanliness Platform**

CleanLoop AI is a smart civic-tech platform designed to make waste management more efficient, transparent, and community-driven.

The platform connects **citizens, sanitation workers, officers, recyclers, and administrators** through a unified digital ecosystem. It helps citizens report cleanliness issues, enables authorities to track and manage complaints, and provides role-based dashboards for better coordination.

---

## 🚀 Live Demo

👉 **[Visit CleanLoop AI](https://cleanloop-ai-0dzf.bolt.host/)**

---

## 📌 GitHub Repository

👉 **[CleanLoop AI — GitHub Repository](https://github.com/ParthAgarwal8619/cleanloop-project-hackathon)**

---

## 🎯 Problem Statement

Urban waste management often faces challenges such as:

* Unreported garbage and sanitation issues
* Slow complaint resolution
* Lack of transparency in complaint tracking
* Poor coordination between citizens and sanitation teams
* Difficulty monitoring waste collection and cleanup activities
* Limited visibility into city-level cleanliness data

CleanLoop AI aims to address these problems through a centralized digital platform.

---

## 💡 Our Solution

CleanLoop AI provides a role-based platform where every stakeholder can participate in the cleanliness ecosystem.

### 👤 Citizens

Citizens can report waste and cleanliness-related issues and track the progress of their complaints.

### 🧑‍💼 Officers

Officers can monitor complaints, manage issues, assign tasks, and track resolution progress.

### 🧹 Sanitation Workers

Workers can view assigned tasks and update the status of cleanup activities.

### ♻️ Recyclers

Recyclers can participate in the waste-recycling ecosystem and help improve responsible waste handling.

### 🛠️ Administrators

Administrators get an overall view of the platform and can manage different users and operational activities.

---

## ✨ Key Features

* 🗑️ **Waste Issue Reporting**
* 📍 **Location-Based Issue Management**
* 🗺️ **City Map & Issue Visualization**
* 📊 **Role-Based Dashboards**
* 👥 **Multi-Role User Management**
* 🔄 **Complaint Status Tracking**
* 🧹 **Worker Task Management**
* ♻️ **Recycler Integration**
* 📈 **Dashboard Statistics & Analytics**
* 🔐 **Authentication & Role-Based Access**
* ☁️ **Supabase Backend Integration**
* 📱 **Responsive User Interface**

---

## 🏗️ How It Works

```text
Citizen
   │
   │ Report Cleanliness Issue
   ▼
CleanLoop Platform
   │
   ├── Location & Issue Data
   │
   ▼
Officer Dashboard
   │
   │ Assign Task
   ▼
Sanitation Worker
   │
   │ Resolve Issue
   ▼
Status Updated
   │
   ▼
Citizen Gets Updated Status
```

This creates a transparent loop between **reporting → assignment → resolution → tracking**.

---

## 🧑‍💻 Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React Router
* Recharts
* Lucide React

### Backend & Database

* Supabase
* Supabase Authentication
* Supabase Database

### Development Tools

* Node.js
* npm
* ESLint
* PostCSS

---

## 📂 Project Structure

```text
cleanloop-project-hackathon/
│
├── src/
│   ├── components/
│   │   ├── ui/
│   │   ├── CityMap.tsx
│   │   ├── DashboardLayout.tsx
│   │   └── StatCard.tsx
│   │
│   ├── context/
│   ├── hooks/
│   ├── lib/
│   │
│   ├── pages/
│   │   ├── admin/
│   │   ├── citizen/
│   │   ├── officer/
│   │   ├── recycler/
│   │   ├── worker/
│   │   ├── LandingPage.tsx
│   │   ├── ProfilePage.tsx
│   │   └── SignInPage.tsx
│   │
│   ├── types/
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
│
├── supabase/
│   └── migrations/
│
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/ParthAgarwal8619/cleanloop-project-hackathon.git
```

### 2. Navigate to the project

```bash
cd cleanloop-project-hackathon
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

The application will be available on the local Vite development server.

---

## 🔐 Environment Variables

If your local setup requires Supabase configuration, create a `.env` file and add the required Supabase environment variables.

Example:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> Never commit private keys or sensitive credentials to GitHub.

---

## 🏆 Hackathon Highlights

CleanLoop AI focuses on creating a practical and scalable solution for urban cleanliness.

### 🌍 Social Impact

The platform encourages citizens to actively participate in maintaining cleaner communities.

### ⚡ Faster Response

Digital complaint tracking helps authorities identify and prioritize sanitation issues.

### 🔎 Transparency

Users can track the progress of reported issues instead of relying on offline complaint systems.

### 🤝 Collaboration

Citizens, officers, workers, recyclers, and administrators work together through a single platform.

### 📊 Data-Driven Management

Dashboards and analytics can help authorities understand cleanliness trends and operational performance.

---

## 🔮 Future Scope

Some potential improvements for future versions include:

* 🤖 AI-based waste image classification
* 📍 Automatic GPS-based issue detection
* 🧠 Smart complaint prioritization
* 🗺️ Real-time sanitation worker tracking
* 🔔 Push notifications
* 📱 Progressive Web App / Mobile Application
* 📊 Advanced city cleanliness analytics
* 🏅 Citizen reward and gamification system
* ♻️ Smart recycling recommendations
* 🚛 Optimized waste collection routes

---

## 🌟 Vision

> **"Making every citizen a part of a cleaner, smarter, and more sustainable city."**

CleanLoop AI aims to transform waste management from a reactive complaint system into a **connected, transparent, and data-driven civic ecosystem**.

---

## 👥 Team

Built with ❤️ for the Hackathon.

**Project:** CleanLoop AI
**Repository:** [GitHub](https://github.com/ParthAgarwal8619/cleanloop-project-hackathon)
**Live Demo:** [cleanloop-ai-0dzf.bolt.host](https://cleanloop-ai-0dzf.bolt.host/)

---

## 📄 License

This project was created for hackathon and educational purposes.
