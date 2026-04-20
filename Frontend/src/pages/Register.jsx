import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/register.css';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [rawPhone, setRawPhone] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();

        const digits = rawPhone.replace(/\D/g, "");
        let phone = "";
        const passwordRule = /^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

        if (!passwordRule.test(password)) {
            alert("Password must be at least 8 characters and include at least 1 number and 1 special character.");
            return;
        }

        if (digits.length === 10) {
            phone = `+91${digits}`;
        } else if (digits.length === 12 && digits.startsWith("91")) {
            phone = `+${digits}`;
        } else {
            alert("Enter a valid 10-digit phone number");
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:8000/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    role,
                    phone
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert("Registration successful!");
                navigate("/");
            } else {
                alert(data.detail || "Registration failed");
            }

        } catch (error) {
            alert("Server error");
            console.error(error);
        }
    };

    return (
        <>
            <header className="register-nav">
                <Link to="/" className="register-logo">SmartHire</Link>
                <p>Already registered? <Link to="/">Login</Link></p>
            </header>

            <main className="register-shell">
                <section className="benefits-card">
                    <p className="brand-line">SmartHire - AI Powered Hiring Platform</p>
                    <h1>On registering, you can</h1>
                    <ul>
                        <li>Upload your resume and get AI-based screening</li>
                        <li>If shortlisted, receive an automated AI interview call</li>
                        <li>Track your applications in one place</li>
                    </ul>

                    <div className="illustration" aria-hidden="true">
                        <svg viewBox="0 0 620 290" role="presentation">
                            <defs>
                                <linearGradient id="illBg" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#ecf4ff" />
                                    <stop offset="100%" stopColor="#f8fbff" />
                                </linearGradient>
                                <linearGradient id="illBlue" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#4f8ff0" />
                                    <stop offset="100%" stopColor="#0a66c2" />
                                </linearGradient>
                                <filter id="illShadow" x="-30%" y="-30%" width="160%" height="160%">
                                    <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#0f3d78" floodOpacity="0.14" />
                                </filter>
                            </defs>

                            <rect x="8" y="10" width="604" height="270" rx="28" fill="url(#illBg)" />
                            <ellipse cx="128" cy="46" rx="60" ry="30" fill="#dceaff" />
                            <ellipse cx="530" cy="52" rx="52" ry="26" fill="#e7e3ff" />

                            <g filter="url(#illShadow)">
                                <rect x="40" y="62" width="160" height="186" rx="16" fill="#ffffff" stroke="#c8daf4" />
                                <rect x="58" y="80" width="68" height="12" rx="6" fill="#0a66c2" opacity="0.22" />
                                <rect x="58" y="102" width="124" height="7" rx="3.5" fill="#91a9cb" opacity="0.35" />
                                <rect x="58" y="115" width="110" height="7" rx="3.5" fill="#91a9cb" opacity="0.28" />
                                <rect x="58" y="128" width="132" height="7" rx="3.5" fill="#91a9cb" opacity="0.3" />
                                <rect x="58" y="144" width="44" height="18" rx="9" fill="#edf4ff" />
                                <rect x="106" y="144" width="34" height="18" rx="9" fill="#edf4ff" />
                                <rect x="144" y="144" width="38" height="18" rx="9" fill="#edf4ff" />
                                <text x="68" y="157" fontFamily="Manrope, Segoe UI, sans-serif" fontSize="8.5" fill="#2b4f7f" fontWeight="700">Python</text>
                                <text x="114" y="157" fontFamily="Manrope, Segoe UI, sans-serif" fontSize="8.5" fill="#2b4f7f" fontWeight="700">SQL</text>
                                <text x="151" y="157" fontFamily="Manrope, Segoe UI, sans-serif" fontSize="8.5" fill="#2b4f7f" fontWeight="700">React</text>
                                <rect x="58" y="174" width="124" height="10" rx="5" fill="#e8f1fe" />
                                <rect x="58" y="174" width="84" height="10" rx="5" fill="url(#illBlue)" />
                            </g>

                            <g filter="url(#illShadow)">
                                <rect x="238" y="74" width="176" height="156" rx="16" fill="#ffffff" stroke="#c8daf4" />
                                <rect x="256" y="90" width="122" height="12" rx="6" fill="#edf4ff" />
                                <text x="265" y="99" fontFamily="Manrope, Segoe UI, sans-serif" fontSize="8.5" fill="#23589b" fontWeight="800">AI MATCHES SKILLS WITH JD</text>
                                <rect x="256" y="112" width="140" height="8" rx="4" fill="#91a9cb" opacity="0.34" />
                                <rect x="256" y="126" width="124" height="8" rx="4" fill="#91a9cb" opacity="0.26" />
                                <rect x="256" y="140" width="148" height="8" rx="4" fill="#91a9cb" opacity="0.32" />
                                <circle cx="332" cy="182" r="22" fill="#e9f8ef" stroke="#b5ddc5" />
                                <text x="317" y="187" fontFamily="Manrope, Segoe UI, sans-serif" fontSize="14" fill="#2e9d66" fontWeight="800">85</text>
                                <text x="338" y="187" fontFamily="Manrope, Segoe UI, sans-serif" fontSize="10" fill="#2e9d66" fontWeight="800">/100</text>
                            </g>

                            <g filter="url(#illShadow)">
                                <rect x="448" y="52" width="136" height="198" rx="16" fill="#ffffff" stroke="#c8daf4" />
                                <rect x="466" y="72" width="84" height="12" rx="6" fill="#edf4ff" />
                                <rect x="466" y="96" width="100" height="7" rx="3.5" fill="#91a9cb" opacity="0.34" />
                                <rect x="466" y="108" width="92" height="7" rx="3.5" fill="#91a9cb" opacity="0.28" />
                                <rect x="466" y="120" width="104" height="7" rx="3.5" fill="#91a9cb" opacity="0.3" />
                                <rect x="462" y="156" width="104" height="30" rx="15" transform="rotate(-14 462 156)" fill="#e9f8ef" stroke="#b5ddc5" />
                                <text x="486" y="172" transform="rotate(-14 486 172)" fontFamily="Manrope, Segoe UI, sans-serif" fontSize="11" fill="#236943" fontWeight="800">APPROVED</text>
                            </g>

                            <path d="M202 146h24" stroke="#3c86df" strokeWidth="4" strokeLinecap="round" />
                            <path d="M412 146h24" stroke="#3c86df" strokeWidth="4" strokeLinecap="round" />
                            <path d="M224 146l-7-6m7 6l-7 6" stroke="#3c86df" strokeWidth="3" strokeLinecap="round" />
                            <path d="M434 146l-7-6m7 6l-7 6" stroke="#3c86df" strokeWidth="3" strokeLinecap="round" />

                            <circle cx="240" cy="44" r="8" fill="#b39cff" opacity="0.8" />
                            <circle cx="396" cy="44" r="8" fill="#8fb3ff" opacity="0.8" />
                        </svg>
                    </div>
                </section>

                <section className="form-card">
                    <h2>Create your SmartHire profile</h2>
                    <p className="sub">Find opportunities and get evaluated by AI-powered hiring.</p>

                    <form id="registerForm" onSubmit={handleRegister}>
                        <label htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            placeholder="Enter your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />

                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="Minimum 8 characters, 1 number, 1 special char"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <label htmlFor="phone">Mobile Number</label>
                        <input
                            type="tel"
                            id="phone"
                            placeholder="10-digit mobile number"
                            inputMode="numeric"
                            maxLength="10"
                            value={rawPhone}
                            onChange={(e) => setRawPhone(e.target.value)}
                            required
                        />

                        <label htmlFor="role">Role</label>
                        <select id="role" value={role} onChange={(e) => setRole(e.target.value)} required>
                            <option value="">Select role</option>
                            <option value="candidate">Candidate</option>
                            <option value="recruiter">Recruiter</option>
                        </select>

                        <button type="submit">Register Now</button>
                    </form>
                </section>
            </main>
        </>
    );
};

export default Register;
