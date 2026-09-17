# Vercel link :
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

## output

# Admin

<img width="1838" height="861" alt="image" src="https://github.com/user-attachments/assets/747c73cb-5963-4640-b57e-728d525d9435" />

<img width="1762" height="836" alt="image" src="https://github.com/user-attachments/assets/cee59794-7806-43b9-a79c-a3626e3c98d3" />

<img width="1900" height="812" alt="image" src="https://github.com/user-attachments/assets/d05a9606-465d-4f4f-b19d-8684d294adc8" />

<img width="1857" height="826" alt="image" src="https://github.com/user-attachments/assets/958a176d-2bc3-41f7-8ec4-3c32e20cc80f" />

<img width="1885" height="837" alt="image" src="https://github.com/user-attachments/assets/4e361734-6e62-4448-887e-8e2052967f59" />

<img width="1895" height="807" alt="image" src="https://github.com/user-attachments/assets/cc047e2f-20aa-4c4b-9e9f-428cb3c7e237" />

<img width="1886" height="827" alt="image" src="https://github.com/user-attachments/assets/43af087a-cc34-44a4-972a-950667c1bdd7" />

<img width="1867" height="823" alt="image" src="https://github.com/user-attachments/assets/b24b2181-a7c9-487c-a99f-88ad42eb2cfc" />

# Center

<img width="1830" height="782" alt="image" src="https://github.com/user-attachments/assets/cf40ed94-baba-46db-b530-fd388c678f16" />

<img width="1786" height="812" alt="image" src="https://github.com/user-attachments/assets/9b55ee1e-d249-4cb3-8890-e537b1ce3fee" />

<img width="1868" height="806" alt="image" src="https://github.com/user-attachments/assets/08bf7be8-d98c-403d-97f0-97740630170d" />

<img width="1867" height="812" alt="image" src="https://github.com/user-attachments/assets/c7dae1da-af9d-41cb-be21-7225861ff6c5" />

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
