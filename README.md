# MediTrack 💊

Automated Medication Reminder & Health Record System

MediTrack is a web-based healthcare management platform designed to help patients maintain medication adherence, securely manage medical records, and receive intelligent medication insights. The platform is particularly useful for elderly individuals, chronic disease patients, and caregivers who require reliable medication tracking and health monitoring.

## Features

### Automated Medication Scheduling

* Create and manage medication schedules.
* Server-side reminder processing using cron jobs.
* Support for recurring medication plans.

### Multi-Channel Notifications

* SMS reminders via Twilio.
* Email notifications for medication schedules and alerts.
* Reliable reminder delivery even when users are not actively using the application.

### AI-Powered Medication Insights

* Medication information powered by Gemini API.
* Side effect awareness and precaution recommendations.
* Real-time health guidance.

### Health Dashboard

* Medication adherence tracking.
* Schedule history and monitoring.
* Centralized view of patient activity.

### Caregiver Integration

* Emergency notifications for critical situations.
* Caregiver monitoring and support.
* Symptom reporting and alert escalation.

### Digital Health Records

* Secure storage of prescriptions and medical documents.
* Organized record management.
* Centralized access to health information.

### Secure Authentication

* Firebase Authentication.
* Multi-Factor Authentication (MFA).
* Protected access to sensitive health data.

---

## Tech Stack

| Layer          | Technology                     |
| -------------- | ------------------------------ |
| Frontend       | React.js, Tailwind CSS         |
| Backend        | Node.js, Express.js, Node-cron |
| Database       | MongoDB Atlas                  |
| Authentication | Firebase Authentication        |
| Notifications  | Twilio API                     |
| AI Services    | Gemini API                     |

---

## Architecture

```text
Client (React.js + Tailwind CSS)
                |
                v
      Express.js / Node.js API
                |
    -----------------------------
    |       |       |          |
 MongoDB Firebase Twilio   Gemini
  Atlas     Auth    API      API
```

---

## Getting Started

### Prerequisites

* Node.js
* MongoDB Atlas Account
* Firebase Project
* Twilio Account
* Gemini API Key

### Installation

```bash
git clone https://github.com/nusratjahanchaity/MediTrack.git

cd meditrack
```

### Environment Variables

Create a `.env` file in the directory.

```env
PORT=5000

MONGODB_URI=your_mongodb_uri

FIREBASE_API_KEY=your_firebase_api_key

TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

GEMINI_API_KEY=your_gemini_api_key
```

### Running the Application

Backend:

```bash
cd server
npm install
npm start
```

Frontend:

```bash
cd client
npm install
npm run dev
```

---

## Project Structure

```text
meditrack/
├── client/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── package.json
├── README.md
└── .env
```

---
