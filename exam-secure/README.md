# Versel link :
https://neet-security.vercel.app/

# ExamSecure

A beginner-friendly demonstration of the secure examination question-paper flow:

Question Paper Creation → Encryption → Secure Storage → Authorized Access (MFA + Roles) → Timed Release → Decrypt & Access → Monitoring & Audit Logs

## Features

- Admin and Exam Center demo roles
- Login + simulated MFA
- Question paper creation
- AES-GCM browser-side encryption using the Web Crypto API
- Encrypted local storage for the demo
- Scheduled/timed release
- Server-independent access check in the client demo
- Decryption only after release
- Audit logs
- Access-denied alerts
- Responsive dashboard

## Demo accounts

Admin:
- username: `admin`
- password: `admin123`
- OTP: `123456`

Exam Center:
- username: `center`
- password: `center123`
- OTP: `123456`

## Run locally

Install Node.js 20+.

```bash
npm install
npm run dev
```

Open http://localhost:3000

## GitHub

```bash
git init
git add .
git commit -m "Initial ExamSecure implementation"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/exam-secure.git
git push -u origin main
```

## Vercel

1. Push the project to GitHub.
2. Sign in to Vercel with GitHub.
3. Import the `exam-secure` repository.
4. Keep the detected Next.js settings.
5. Click Deploy.

## Important security note

This package is a college-project/demo implementation, not a production examination security system.

The demo intentionally stores encrypted data and its demonstration key in browser localStorage so the complete flow can run without paid services or database credentials. This is NOT appropriate for real confidential examination papers.

For production, move encryption/key management, authentication, authorization, storage, and release enforcement to trusted server-side infrastructure. Use a managed database/storage service, real MFA, server-side authorization, secure secret management, immutable audit logging, and independent security testing.

Use dummy/sample examination papers for demonstrations.
