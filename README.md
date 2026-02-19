# AI Event Registration Portal 🚀

> **A chatbot response collecting form powered by Groq.**
> Built with Next.js 14, Supabase, and Tailwind CSS.

---

## ✨ Features

### 🤖 **Smart Chatbot**
- Powered by **Groq (Llama 3 70B)** for natural conversation.
- Intelligently collects user information (Name, Contact, Email, Reason) without rigid forms.
- Validates inputs like phone numbers and email addresses on the fly.

### 🛡️ **Admin Dashboard**
- **Secure Access**: Password-protected login.
- **View All Entries**: Real-time table with search/sort.
- **Manage Data**:
  - 🗑️ **Delete**: Remove spam or duplicate entries.
  - 📥 **Export CSV**: Download full attendee list.
  - 📋 **Copy Contacts**: One-click copy all phone numbers.
- **Pause/Resume**: Instantly close registrations. When paused, the chatbot is hidden.

### 🎨 **Modern UI**
- **Responsive Design**: Works perfectly on Mobile & Desktop.
- **Glassmorphism**: Sleek, translucent cards and components.
- **Dark Mode**: Supports Light/Dark themes.

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
Run the SQL script located in `supabase/setup.sql` inside your **Supabase SQL Editor** to create the necessary tables.

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

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for details.
