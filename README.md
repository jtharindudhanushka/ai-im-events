# AI@IM Events — Field Visit Portal 🚀

> **Modern, AI-powered registration system for the Codegen Greenhouse Field Visit.**
> Built for the **AI@IM Special Interest Group** (SIG).

---

## ✨ Features

### 🤖 **Smart Chatbot**
- Powered by **Groq (Llama 3 70B)** for natural, human-like conversations.
- Collects **Name, WhatsApp, Email, Academic Level, and Reason**.
- Validates **phone numbers (7-15 digits)** and ensures meaningful reasons.
- Provide **context awareness** about the "Codegen Greenhouse" visit.

### 🛡️ **Admin Dashboard**
- **Secure Access**: Password-protected login.
- **View All Entries**: Real-time table with search/sort.
- **Manage Data**:
  - 🗑️ **Delete**: Remove spam or duplicate entries.
  - 📥 **Export CSV**: Download full attendee list for event management.
  - 📋 **Copy Contacts**: One-click copy all WhatsApp numbers (for group creation).
- **Pause/Resume**: Instantly close registrations. When paused, the chatbot is hidden and a "Registrations Closed" screen is shown.

### 🎨 **Modern UI**
- **Responsive Design**: Works perfectly on Mobile & Desktop.
- **Glassmorphism**: Sleek, translucent cards and components.
- **Dark Mode**: Toggle between Light/Dark themes.
- **Animations**: Smooth transitions with Framer Motion.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **AI Engine**: [Groq API](https://groq.com/) (Llama 3 70B)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🚀 Setup Guide

### 1. **Clone the Repo**
```bash
git clone https://github.com/your-username/ai-im-events.git
cd ai-im-events
npm install
```

### 2. **Environment Variables**
Create a `.env.local` file in the root directory:

```env
# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# AI (Groq)
GROQ_API_KEY="gsk_..."

# Admin Security
ADMIN_SECRET="your-admin-password"
```

### 3. **Database Setup**
Run the SQL script located in `supabase/setup.sql` inside your **Supabase SQL Editor** to create the necessary tables and policies.

### 4. **Run Locally**
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 📦 Deployment

Deploy easily on **Vercel**:

1.  Push your code to GitHub.
2.  Import the project in Vercel.
3.  Add the **Environment Variables** (from step 2) in Vercel settings.
4.  Hit **Deploy**! 🚀

---

## 📞 Support

For any issues or questions, contact the **Chief Coordinator**:
- **WhatsApp**: [+94 76 219 5995](https://wa.me/94762195995)

---

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for details.
