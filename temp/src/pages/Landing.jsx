import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/landing.css';

const Landing = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("token", data.access_token);
                localStorage.setItem("role", data.role);

                if (data.role === "candidate") {
                    navigate("/dashboard");
                } else if (data.role === "recruiter") {
                    navigate("/recruiter");
                } else if (data.role === "admin") {
                    navigate("/admin-dashboard");
                } else {
                    navigate("/");
                }
            } else {
                alert(data.detail || "Login failed");
            }
        } catch (error) {
            alert("Server error");
            console.error(error);
        }
    };

    return (
        <>
            <header className="nav">
                <Link to="/" className="logo">SmartHire</Link>
                <Link to="/register" className="nav-link">Create account</Link>
            </header>

            <main className="hero">
                <section className="hero-copy">
                    <h1>Smarter Hiring Starts Here</h1>
                    <p className="description">
                        SmartHire uses AI to analyze resumes, shortlist the best candidates, and conduct automated interview calls - helping companies hire faster and smarter.
                    </p>

                    <form id="loginForm" className="login-card" onSubmit={handleLogin}>
                        <input
                            type="email"
                            id="email"
                            placeholder="Work email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            id="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button type="submit">Sign in with Email</button>
                    </form>

                    <p className="foot-note">If your resume is shortlisted, you may receive an automated AI interview call.</p>
                </section>

                <section className="hero-visual" aria-hidden="true">
                    <div className="visual-wrap">
                        <svg viewBox="0 0 680 520" role="presentation">
                            <defs>
                                <linearGradient id="canvasBg" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#edf4ff" />
                                    <stop offset="100%" stopColor="#fbfdff" />
                                </linearGradient>
                                <linearGradient id="primaryGrad" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#4e8ef0" />
                                    <stop offset="100%" stopColor="#0a66c2" />
                                </linearGradient>
                                <linearGradient id="softViolet" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#b8a9ff" />
                                    <stop offset="100%" stopColor="#98adff" />
                                </linearGradient>
                                <linearGradient id="deskGrad" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#dce9ff" />
                                    <stop offset="100%" stopColor="#c5dcfb" />
                                </linearGradient>
                                <filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%">
                                    <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#123a73" floodOpacity="0.14" />
                                </filter>
                                <filter id="cardShadow" x="-40%" y="-40%" width="180%" height="180%">
                                    <feDropShadow dx="0" dy="14" stdDeviation="12" floodColor="#0f3a76" floodOpacity="0.16" />
                                </filter>
                            </defs>
                            <rect x="8" y="16" width="664" height="488" rx="40" fill="url(#canvasBg)" />
                            <ellipse cx="108" cy="86" rx="84" ry="52" fill="#deebff" />
                            <ellipse cx="596" cy="96" rx="68" ry="40" fill="#ece8ff" />
                            <ellipse cx="340" cy="446" rx="284" ry="34" fill="#d4e3fb" opacity="0.76" />
                            <g opacity="0.82">
                                <path d="M298 178c24-20 64-20 86 0" fill="none" stroke="#75a6ea" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 8" />
                                <path d="M286 204c30-8 70-2 96 16" fill="none" stroke="#988fe8" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 8" />
                                <circle cx="295" cy="179" r="4" fill="#5b92e0" />
                                <circle cx="381" cy="220" r="4" fill="#8b80dd" />
                            </g>
                            <g filter="url(#softShadow)">
                                <rect x="74" y="308" width="268" height="108" rx="24" fill="url(#deskGrad)" />
                            </g>
                            <g filter="url(#cardShadow)">
                                <rect x="120" y="214" width="212" height="134" rx="16" fill="#1f385f" />
                                <rect x="128" y="221" width="196" height="112" rx="12" fill="#f9fbff" />
                                <rect x="140" y="247" width="56" height="16" rx="8" fill="#edf4ff" />
                                <rect x="200" y="247" width="38" height="16" rx="8" fill="#edf4ff" />
                                <rect x="242" y="247" width="46" height="16" rx="8" fill="#edf4ff" />
                                <text x="147" y="258" fontFamily="Manrope, Segoe UI, sans-serif" fontSize="8.5" fill="#2b4f7f" fontWeight="700">Python</text>
                                <text x="209" y="258" fontFamily="Manrope, Segoe UI, sans-serif" fontSize="8.5" fill="#2b4f7f" fontWeight="700">SQL</text>
                                <text x="250" y="258" fontFamily="Manrope, Segoe UI, sans-serif" fontSize="8.5" fill="#2b4f7f" fontWeight="700">React</text>
                                <rect x="140" y="272" width="162" height="6" rx="3" fill="#9cb0cd" opacity="0.4" />
                                <rect x="140" y="282" width="174" height="6" rx="3" fill="#9cb0cd" opacity="0.3" />
                                <rect x="140" y="292" width="152" height="6" rx="3" fill="#9cb0cd" opacity="0.25" />
                                <text x="140" y="310" fontFamily="Manrope, Segoe UI, sans-serif" fontSize="8.5" fill="#325885" fontWeight="700">Screening</text>
                                <rect x="183" y="304" width="108" height="8" rx="4" fill="#e7f0fe" />
                                <rect x="183" y="304" width="74" height="8" rx="4" fill="url(#primaryGrad)" />
                                <rect x="238" y="318" width="78" height="16" rx="8" fill="#e9f8ef" stroke="#b5ddc5" />
                                <circle cx="252" cy="326" r="6" fill="#2e9d66" />
                                <path d="M249 326l2 2 4-5" fill="none" stroke="#ffffff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                                <text x="263" y="329" fontFamily="Manrope, Segoe UI, sans-serif" fontSize="8" fill="#216943" fontWeight="800">Shortlisted</text>
                            </g>
                            <g>
                                <rect x="104" y="348" width="244" height="14" rx="7" fill="#21456e" />
                                <rect x="146" y="360" width="160" height="10" rx="5" fill="#1e3f66" opacity="0.75" />
                            </g>
                            <g filter="url(#cardShadow)">
                                <rect x="358" y="92" width="266" height="302" rx="20" fill="#ffffff" stroke="#c6d8f6" />
                                <rect x="378" y="112" width="132" height="24" rx="12" fill="#eef4ff" />
                                <text x="391" y="128" fontFamily="Manrope, Segoe UI, sans-serif" fontSize="11" fill="#23589b" fontWeight="800">AI Recruiting Assistant</text>
                                <text x="378" y="160" fontFamily="Manrope, Segoe UI, sans-serif" fontSize="15" fill="#1b365d" fontWeight="700">Skills detected</text>
                                <rect x="378" y="170" width="68" height="25" rx="12.5" fill="#edf4ff" />
                                <rect x="450" y="170" width="56" height="25" rx="12.5" fill="#edf4ff" />
                                <rect x="510" y="170" width="66" height="25" rx="12.5" fill="#edf4ff" />
                                <text x="394" y="187" fontFamily="Manrope, Segoe UI, sans-serif" fontSize="11" fill="#2b4f7f" fontWeight="700">Python</text>
                                <text x="467" y="187" fontFamily="Manrope, Segoe UI, sans-serif" fontSize="11" fill="#2b4f7f" fontWeight="700">SQL</text>
                                <text x="529" y="187" fontFamily="Manrope, Segoe UI, sans-serif" fontSize="11" fill="#2b4f7f" fontWeight="700">React</text>
                                <text x="378" y="224" fontFamily="Manrope, Segoe UI, sans-serif" fontSize="15" fill="#1b365d" fontWeight="700">Resume summary</text>
                                <rect x="378" y="234" width="224" height="8" rx="4" fill="#97adca" opacity="0.36" />
                                <rect x="378" y="248" width="236" height="8" rx="4" fill="#97adca" opacity="0.3" />
                                <rect x="378" y="262" width="208" height="8" rx="4" fill="#97adca" opacity="0.25" />
                                <rect x="378" y="276" width="192" height="8" rx="4" fill="#97adca" opacity="0.2" />
                                <text x="378" y="312" fontFamily="Manrope, Segoe UI, sans-serif" fontSize="15" fill="#1b365d" fontWeight="700">Screening progress</text>
                                <rect x="378" y="322" width="224" height="15" rx="7.5" fill="#e8f1fe" />
                                <rect x="378" y="322" width="166" height="15" rx="7.5" fill="url(#primaryGrad)" />
                                <circle cx="551" cy="329.5" r="6" fill="#ffffff" />
                                <text x="378" y="354" fontFamily="Manrope, Segoe UI, sans-serif" fontSize="11" fill="#5d769a" fontWeight="700">Real-time AI scoring and shortlisting</text>
                            </g>
                            <g filter="url(#softShadow)">
                                <rect x="308" y="134" width="44" height="44" rx="12" fill="url(#softViolet)" />
                                <path d="M330 145v22M319 156h22" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                            </g>
                        </svg>
                    </div>
                </section>
            </main>
        </>
    );
};

export default Landing;
