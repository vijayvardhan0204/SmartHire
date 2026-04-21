import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import '../styles/dashboard.css';

const API_BASE = import.meta.env.VITE_API_URL;

const STATUS_LABELS = {
    applied: "Applied",
    interview_scheduled: "Interview Scheduled",
    interview_pending: "Interview Scheduled",
    interview_in_progress: "Interview In Progress",
    no_answer: "No Answer",
    busy: "Busy",
    failed: "Failed",
    shortlisted: "Shortlisted",
    rejected: "Rejected",
    selected: "Selected",
    hired: "Hired"
};

const normalizeExperienceLevel = (value) => {
    if (!value) return "";
    const text = String(value).trim().toLowerCase();
    if (["fresher", "1 to 3 years", "4 to 8 years", "9 and above"].includes(text)) return text;
    const numeric = Number(text);
    if (Number.isNaN(numeric)) return "";
    if (numeric <= 0) return "fresher";
    if (numeric <= 3) return "1 to 3 years";
    if (numeric <= 8) return "4 to 8 years";
    return "9 and above";
};

const displayExperience = (value) => {
    const normalized = normalizeExperienceLevel(value);
    if (!normalized) return "-";
    if (normalized === "fresher") return "Fresher";
    return normalized;
};

const formatStatus = (status) => {
    const key = (status || "").toLowerCase();
    return STATUS_LABELS[key] || (status || "-");
};

const statusClass = (status) => {
    const key = (status || "").toLowerCase();
    return `status-chip status-${key.replace(/[^a-z0-9_-]/g, "")}`;
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const [view, setView] = useState(searchParams.get("view") === "profile" ? "profile" : "applications");
    const [profile, setProfile] = useState(null);
    const [applications, setApplications] = useState([]);
    const [isPolling, setIsPolling] = useState(false);
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [updateForm, setUpdateForm] = useState({
        full_name: '',
        company_name: '',
        experience_years: '',
        skills: ''
    });

    const [isSaving, setIsSaving] = useState(false);

    const checkAuth = () => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
            return false;
        }
        return token;
    };

    const loadData = useCallback(async () => {
        const token = checkAuth();
        if (!token) return;

        try {
            // Load Profile
            const profileRes = await fetch(`${API_BASE}/profile/me`, {
                headers: { "Authorization": "Bearer " + token }
            });
            if (profileRes.ok) {
                const profileData = await profileRes.json();
                setProfile(profileData);
            }

            // Load Applications
            const appRes = await fetch(`${API_BASE}/applications/my`, {
                headers: { "Authorization": "Bearer " + token }
            });
            if (appRes.ok) {
                const appsData = await appRes.json();
                setApplications(appsData);

                const needsRefresh = appsData.some(app => {
                    const status = (app.status || "").toLowerCase();
                    return status === "interview_scheduled" ||
                           status === "interview_pending" ||
                           status === "interview_in_progress";
                });
                setIsPolling(needsRefresh);
            }
        } catch (error) {
            console.error("Dashboard load failed:", error);
        }
    }, [navigate]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        let interval = null;
        if (isPolling) {
            interval = setInterval(() => {
                if (!document.hidden) {
                    loadData();
                }
            }, 15000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isPolling, loadData]);

    // Visibility change handler for polling
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && isPolling) {
                loadData();
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [isPolling, loadData]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/");
    };

    const openProfileModal = () => {
        if (profile) {
            setUpdateForm({
                full_name: profile.full_name || "",
                company_name: profile.company_name || "",
                experience_years: normalizeExperienceLevel(profile.experience_years),
                skills: profile.skills || ""
            });
        }
        setIsModalOpen(true);
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const token = localStorage.getItem("token");

        try {
            const bodyData = {
                full_name: updateForm.full_name.trim() || null,
                company_name: updateForm.company_name.trim() || null,
                experience_years: normalizeExperienceLevel(updateForm.experience_years) || null,
                skills: updateForm.skills.trim() || null
            };

            const response = await fetch(`${API_BASE}/profile/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify(bodyData)
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.detail || "Profile update failed");
            }

            alert("Profile updated successfully");
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            alert(error.message || "Profile update failed");
        } finally {
            setIsSaving(false);
        }
    };

    const getInsights = () => {
        let shortlisted = 0;
        let rejected = 0;
        let interviewScheduled = 0;

        applications.forEach(app => {
            const status = (app.status || "").toLowerCase();
            if (status === "shortlisted") shortlisted += 1;
            if (status === "rejected") rejected += 1;
            if (status === "interview_scheduled" || status === "interview_pending") {
                interviewScheduled += 1;
            }
        });

        return {
            total: applications.length,
            shortlisted,
            rejected,
            interviewScheduled
        };
    };

    const insights = getInsights();

    return (
        <>
            <header className="navbar">
                <h2>SmartHire</h2>
                <div className="navbar-actions">
                    <Link className="nav-link-btn" to="/jobs">Browse Jobs</Link>
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <div className="dashboard-layout">
                {/* LEFT PROFILE */}
                <div className="profile-card">
                    <h3>{profile?.full_name || "Complete Profile"}</h3>
                    <p>{profile?.email || ""}</p>
                    <button onClick={() => setView("applications")}>Applications</button>
                    <button onClick={() => setView("profile")}>View Profile</button>
                    <button onClick={openProfileModal}>Update Profile</button>
                </div>

                {/* MIDDLE MAIN CONTENT */}
                <div className="main-content">
                    {/* APPLICATIONS VIEW */}
                    {view === "applications" && (
                        <div>
                            <h2>My Job Applications</h2>
                            <div>
                                {applications.map(app => (
                                    <div className="application-card" key={app.id || Math.random()}>
                                        <h4>{app.job.title}</h4>
                                        <p><b>Resume Score:</b> {app.resume_score ?? "-"}</p>
                                        <p><b>Interview Score:</b> {app.voice_score ?? "-"}</p>
                                        <p><b>Status:</b> 
                                            <span className={statusClass(app.status)}>
                                                {formatStatus(app.status)}
                                            </span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PROFILE VIEW */}
                    {view === "profile" && profile && (
                        <div>
                            <h2>My Profile</h2>
                            <p><b>Full Name:</b> <span>{profile.full_name || "-"}</span></p>
                            <p><b>Email:</b> <span>{profile.email || "-"}</span></p>
                            <p><b>Phone Number:</b> <span>{profile.phone || profile.phone_number || "-"}</span></p>
                            <p><b>Company:</b> <span>{profile.company_name || "-"}</span></p>
                            <p><b>Experience:</b> <span>{displayExperience(profile.experience_years)}</span></p>
                            <p><b>Skills:</b> <span>{profile.skills || "-"}</span></p>
                        </div>
                    )}
                </div>

                {/* RIGHT SIDE */}
                <div className="right-column">
                    <div className="right-panel">
                        <h3>Application Insights</h3>
                        <p><b>Total Applications:</b> <span>{insights.total}</span></p>
                        <p><b>Shortlisted:</b> <span>{insights.shortlisted}</span></p>
                        <p><b>Rejected:</b> <span>{insights.rejected}</span></p>
                        <p><b>Interview Scheduled:</b> <span>{insights.interviewScheduled}</span></p>
                    </div>

                    <div className="update-panel">
                        <h3>SmartHire Update</h3>
                        <p>Our AI reviews every application.</p>
                        <p>If your resume is shortlisted, you will receive an automated interview call.</p>
                        <p><b>Make sure your phone number is active.</b></p>
                    </div>
                </div>
            </div>

            {/* PROFILE MODAL */}
            {isModalOpen && (
                <div className="modal" style={{ display: "flex" }}>
                    <div className="modal-content">
                        <h3>Update Profile</h3>
                        <form onSubmit={handleProfileSubmit}>
                            <input
                                placeholder="Full Name"
                                value={updateForm.full_name}
                                onChange={(e) => setUpdateForm({ ...updateForm, full_name: e.target.value })}
                            />
                            <input
                                placeholder="Company Name"
                                value={updateForm.company_name}
                                onChange={(e) => setUpdateForm({ ...updateForm, company_name: e.target.value })}
                            />
                            <select
                                value={updateForm.experience_years}
                                onChange={(e) => setUpdateForm({ ...updateForm, experience_years: e.target.value })}
                            >
                                <option value="">Select Experience</option>
                                <option value="fresher">Fresher</option>
                                <option value="1 to 3 years">1 to 3 years</option>
                                <option value="4 to 8 years">4 to 8 years</option>
                                <option value="9 and above">9 and above</option>
                            </select>
                            <input
                                placeholder="Skills"
                                value={updateForm.skills}
                                onChange={(e) => setUpdateForm({ ...updateForm, skills: e.target.value })}
                            />
                            <button type="submit" disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save"}
                            </button>
                            <button type="button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Dashboard;
