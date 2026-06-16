# FinSplit — Frontend

React frontend for the FinSplit expense management app.

## Tech Stack
- React 18 + Vite
- React Router v6
- Axios + React Hook Form + Zod
- React Toastify

## Getting Started

### Prerequisites
- Node 18+
- FinSplit backend running on port 8080

### Setup

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`

## Pages

| Route | Description |
|-------|-------------|
| /login | Sign in |
| /register | Create account |
| /dashboard | Home with feature cards |
| /expenses | Personal expense tracker |
| /budgets | Budget limits and analytics |
| /groups | Group list |
| /groups/:id | Group detail — expenses, balances, members |