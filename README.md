# MeowGuard 🐱🛡️

**MeowGuard** is a modern, bilingual (English/Bulgarian) landing page for an AI-powered cat health assistant. It helps cat owners identify symptoms early, manage vaccinations, and maintain a digital health profile for their feline friends.

## ✨ Features

- **Bilingual Support**: Instant toggle between English and Bulgarian.
- **AI Symptom Checker Demo**: Interactive triage simulation to assess health risks.
- **Coming Soon Section**: Teasers for "Emergency Clinic Finder" and "AI Vet Chat".
- **Early Access Form**: Fully integrated with **Supabase** for real-time waitlist collection.
- **Modern UI**: Built with a "soft medical" aesthetic, responsive design, and smooth animations.
- **Performance Optimized**: Uses native SVGs and emojis to minimize external dependencies.

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla CSS3, Vanilla JavaScript (ES6+).
- **Backend/Database**: [Supabase](https://supabase.com/) (Real-time storage).
- **Typography**: [Outfit](https://fonts.google.com/specimen/Outfit) via Google Fonts.
- **Icons**: Inline SVGs and Emojis.

## 🚀 Getting Started

### Prerequisites
To run the waitlist collection, you need a Supabase project.

### Configuration
1. Open `script.js`.
2. Ensure the `SUPABASE_URL` and `SUPABASE_KEY` (anon public key) are correctly set.
3. Configure your Supabase Table:
   - Create a table named `early_access_emails`.
   - Add a column `email` (text/varchar).
   - Enable **Row Level Security (RLS)** and add a policy to allow `INSERT` for anonymous users.

### Running Locally
Simply open `index.html` in any modern web browser or use a local development server like VS Code's "Live Server".

## 📁 Project Structure

```text
MeowGuard/
├── index.html    # Core structure & dual-language content
├── style.css     # Design system, layouts & responsiveness
├── script.js    # Language logic & Supabase integration
└── README.md     # Documentation
```

## 📜 License
© 2026 MeowGuard. Built with care for cat lovers everywhere.
