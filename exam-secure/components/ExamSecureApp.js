"use client";

import { useEffect, useMemo, useState } from "react";

const DEMO_USERS = {
  admin: { username: "admin", password: "admin123", role: "Admin", name: "System Administrator" },
  center: { username: "center", password: "center123", role: "Exam Center", name: "Exam Center User" }
};

const PAPER_KEY = "examsecure_papers";
const LOG_KEY = "examsecure_logs";
const SESSION_KEY = "examsecure_session";

function uid(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readStore(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

async function deriveKey(secret) {
  const encoded = new TextEncoder().encode(secret);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function encryptText(text, secret) {
  const key = await deriveKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(text);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted))
  };
}

async function decryptText(payload, secret) {
  const key = await deriveKey(secret);
  const iv = new Uint8Array(payload.iv);
  const data = new Uint8Array(payload.data);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(decrypted);
}

function addLog(action, user, details) {
  const logs = readStore(LOG_KEY, []);
  logs.unshift({
    id: uid("log"),
    time: new Date().toISOString(),
    action,
    user,
    details
  });
  writeStore(LOG_KEY, logs.slice(0, 200));
}

function formatDate(value) {
  return new Date(value).toLocaleString();
}

export default function ExamSecureApp() {
  const [session, setSession] = useState(null);
  const [login, setLogin] = useState({ username: "", password: "" });
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [loginError, setLoginError] = useState("");
  const [papers, setPapers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [view, setView] = useState("dashboard");
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [decrypted, setDecrypted] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    subject: "",
    examDate: "",
    releaseTime: "",
    content: ""
  });
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) setSession(JSON.parse(saved));
    setPapers(readStore(PAPER_KEY, []));
    setLogs(readStore(LOG_KEY, []));
  }, []);

  useEffect(() => {
    if (!session) return;
    const timer = setInterval(() => {
      setPapers(readStore(PAPER_KEY, []));
      setLogs(readStore(LOG_KEY, []));
    }, 1000);
    return () => clearInterval(timer);
  }, [session]);

  const stats = useMemo(() => {
    const now = Date.now();
    return {
      total: papers.length,
      scheduled: papers.filter(p => new Date(p.releaseTime).getTime() > now).length,
      released: papers.filter(p => new Date(p.releaseTime).getTime() <= now).length,
      alerts: logs.filter(l => l.action.includes("DENIED")).length
    };
  }, [papers, logs]);

  function startLogin(e) {
    e.preventDefault();
    const user = DEMO_USERS[login.username.toLowerCase()];
    if (!user || user.password !== login.password) {
      setLoginError("Invalid username or password.");
      return;
    }
    setLoginError("");
    setOtpStep(true);
  }

  function verifyOtp(e) {
    e.preventDefault();
    if (otp !== "123456") {
      setLoginError("Invalid OTP. Demo OTP is 123456.");
      return;
    }
    const user = DEMO_USERS[login.username.toLowerCase()];
    const sessionData = { username: login.username.toLowerCase(), role: user.role, name: user.name };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    setSession(sessionData);
    setOtpStep(false);
    setOtp("");
    addLog("LOGIN SUCCESS", sessionData.username, `MFA verified for ${sessionData.role}`);
    setLogs(readStore(LOG_KEY, []));
  }

  function logout() {
    if (session) addLog("LOGOUT", session.username, "User logged out");
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setSelectedPaper(null);
    setDecrypted("");
  }

  async function createPaper(e) {
    e.preventDefault();
    if (!form.title || !form.subject || !form.releaseTime || !form.content) {
      setNotice("Please fill all fields.");
      return;
    }

    const secret = `ExamSecure-Demo-Key-${form.title}`;
    const encrypted = await encryptText(form.content, secret);

    const paper = {
      id: uid("paper"),
      title: form.title,
      subject: form.subject,
      examDate: form.examDate,
      releaseTime: form.releaseTime,
      encrypted,
      keyHint: secret,
      createdBy: session.username,
      createdAt: new Date().toISOString(),
      status: "ENCRYPTED"
    };

    const updated = [paper, ...readStore(PAPER_KEY, [])];
    writeStore(PAPER_KEY, updated);
    setPapers(updated);
    addLog("PAPER CREATED", session.username, `${paper.title} encrypted and scheduled`);
    setLogs(readStore(LOG_KEY, []));
    setForm({ title: "", subject: "", examDate: "", releaseTime: "", content: "" });
    setShowCreate(false);
    setNotice("Question paper encrypted and securely stored.");
  }

  async function accessPaper(paper) {
    const release = new Date(paper.releaseTime).getTime();
    if (Date.now() < release) {
      addLog("ACCESS DENIED", session.username, `${paper.title} attempted before release time`);
      setLogs(readStore(LOG_KEY, []));
      setNotice("ACCESS DENIED — this question paper has not been released yet.");
      return;
    }

    try {
      const content = await decryptText(paper.encrypted, paper.keyHint);
      setSelectedPaper(paper);
      setDecrypted(content);
      addLog("PAPER ACCESSED", session.username, `${paper.title} decrypted after authorized release`);
      setLogs(readStore(LOG_KEY, []));
      setNotice("");
    } catch {
      setNotice("Decryption failed.");
    }
  }

  if (!session) {
    return (
      <main className="login-shell">
        <section className="login-card">
          <div className="brand-mark">ES</div>
          <h1>ExamSecure</h1>
          <p className="muted">Secure Management of Competitive Examination Question Papers</p>

          {!otpStep ? (
            <form onSubmit={startLogin}>
              <label>Username</label>
              <input value={login.username} onChange={e => setLogin({ ...login, username: e.target.value })} placeholder="admin or center" />
              <label>Password</label>
              <input type="password" value={login.password} onChange={e => setLogin({ ...login, password: e.target.value })} placeholder="Enter password" />
              {loginError && <div className="error">{loginError}</div>}
              <button className="primary full">Continue to MFA</button>
              <div className="demo-box">
                <b>Demo accounts</b>
                <span>Admin: admin / admin123</span>
                <span>Exam Center: center / center123</span>
              </div>
            </form>
          ) : (
            <form onSubmit={verifyOtp}>
              <h2>MFA Verification</h2>
              <p className="muted">Enter the 6-digit verification code.</p>
              <label>OTP</label>
              <input inputMode="numeric" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} placeholder="123456" />
              {loginError && <div className="error">{loginError}</div>}
              <button className="primary full">Verify & Login</button>
              <button type="button" className="secondary full" onClick={() => { setOtpStep(false); setLoginError(""); }}>Back</button>
            </form>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand">ExamSecure</div>
          <div className="subtitle">Protected Examination Paper Management</div>
        </div>
        <div className="user-area">
          <span className="role-pill">{session.role}</span>
          <span>{session.name}</span>
          <button className="secondary small" onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <button className={view === "dashboard" ? "nav active" : "nav"} onClick={() => setView("dashboard")}>Dashboard</button>
          <button className={view === "papers" ? "nav active" : "nav"} onClick={() => setView("papers")}>Question Papers</button>
          {session.role === "Admin" && <button className={view === "audit" ? "nav active" : "nav"} onClick={() => setView("audit")}>Monitoring & Audit</button>}
        </aside>

        <section className="content">
          {notice && <div className="notice">{notice}<button onClick={() => setNotice("")}>×</button></div>}

          {view === "dashboard" && (
            <>
              <div className="page-title">
                <div><h1>Security Dashboard</h1><p>Monitor paper lifecycle and access status.</p></div>
                {session.role === "Admin" && <button className="primary" onClick={() => setShowCreate(true)}>+ Create Question Paper</button>}
              </div>

              <div className="stats">
                <Stat title="Total Papers" value={stats.total} />
                <Stat title="Scheduled" value={stats.scheduled} />
                <Stat title="Released" value={stats.released} />
                <Stat title="Access Alerts" value={stats.alerts} />
              </div>

              <div className="grid-two">
                <div className="panel">
                  <h2>System Flow</h2>
                  <Flow />
                </div>
                <div className="panel">
                  <h2>Recent Activity</h2>
                  {logs.slice(0, 6).map(l => <LogRow key={l.id} log={l} />)}
                  {!logs.length && <p className="muted">No activity yet.</p>}
                </div>
              </div>
            </>
          )}

          {view === "papers" && (
            <>
              <div className="page-title">
                <div><h1>Question Papers</h1><p>Encrypted papers and scheduled release status.</p></div>
                {session.role === "Admin" && <button className="primary" onClick={() => setShowCreate(true)}>+ Create Question Paper</button>}
              </div>
              <div className="paper-grid">
                {papers.map(paper => {
                  const released = Date.now() >= new Date(paper.releaseTime).getTime();
                  return (
                    <article className="paper-card" key={paper.id}>
                      <div className="paper-icon">🔐</div>
                      <div className="paper-main">
                        <h3>{paper.title}</h3>
                        <p>{paper.subject} {paper.examDate && `• ${paper.examDate}`}</p>
                        <small>Release: {formatDate(paper.releaseTime)}</small>
                      </div>
                      <span className={released ? "status released" : "status locked"}>{released ? "RELEASED" : "LOCKED"}</span>
                      <button className={released ? "primary" : "secondary"} onClick={() => accessPaper(paper)}>
                        {released ? "Decrypt & Access" : "Try Access"}
                      </button>
                    </article>
                  );
                })}
                {!papers.length && <div className="empty panel">No question papers created yet.</div>}
              </div>
            </>
          )}

          {view === "audit" && session.role === "Admin" && (
            <>
              <div className="page-title">
                <div><h1>Monitoring & Audit Logs</h1><p>Every important action is recorded for review.</p></div>
              </div>
              <div className="panel">
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Time</th><th>Action</th><th>User</th><th>Details</th></tr></thead>
                    <tbody>
                      {logs.map(l => <tr key={l.id}><td>{formatDate(l.time)}</td><td><span className="log-action">{l.action}</span></td><td>{l.user}</td><td>{l.details}</td></tr>)}
                    </tbody>
                  </table>
                  {!logs.length && <p className="muted">No audit records yet.</p>}
                </div>
              </div>
            </>
          )}

          {selectedPaper && (
            <div className="modal-backdrop">
              <div className="modal">
                <button className="close" onClick={() => { setSelectedPaper(null); setDecrypted(""); }}>×</button>
                <div className="secure-title">🔓 Authorized Access</div>
                <h2>{selectedPaper.title}</h2>
                <p className="muted">{selectedPaper.subject} • Released at {formatDate(selectedPaper.releaseTime)}</p>
                <div className="paper-content">{decrypted}</div>
                <div className="security-note">Access recorded in the audit log.</div>
              </div>
            </div>
          )}

          {showCreate && session.role === "Admin" && (
            <div className="modal-backdrop">
              <form className="modal" onSubmit={createPaper}>
                <button type="button" className="close" onClick={() => setShowCreate(false)}>×</button>
                <div className="secure-title">🔐 Create & Encrypt</div>
                <h2>New Question Paper</h2>
                <label>Paper Title</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Computer Networks - Model Exam" />
                <label>Subject</label>
                <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Computer Networks" />
                <label>Exam Date</label>
                <input type="date" value={form.examDate} onChange={e => setForm({ ...form, examDate: e.target.value })} />
                <label>Release Time</label>
                <input type="datetime-local" value={form.releaseTime} onChange={e => setForm({ ...form, releaseTime: e.target.value })} />
                <label>Question Paper Content</label>
                <textarea rows="9" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Enter demo question paper content..." />
                <div className="encryption-badge">AES-GCM encryption is applied in the browser before storage.</div>
                <button className="primary full">Encrypt & Securely Store</button>
              </form>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({ title, value }) {
  return <div className="stat"><span>{title}</span><strong>{value}</strong></div>;
}

function LogRow({ log }) {
  return <div className="log-row"><span className="dot"></span><div><b>{log.action}</b><p>{log.details}</p><small>{formatDate(log.time)}</small></div></div>;
}

function Flow() {
  return (
    <div className="flow">
      <FlowBox text="Question Paper Creation" />
      <span>→</span><FlowBox text="End-to-End Encryption" />
      <span>→</span><FlowBox text="Secure Cloud Storage" />
      <span>→</span><FlowBox text="Authorized Access (MFA + Roles)" />
      <span>→</span><FlowBox text="Timed Release" />
      <span>→</span><FlowBox text="Decrypt & Access" />
    </div>
  );
}

function FlowBox({ text }) {
  return <div className="flow-box">{text}</div>;
}