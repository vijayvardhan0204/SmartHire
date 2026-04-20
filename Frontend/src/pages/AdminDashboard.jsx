import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/dashboard.css';

const API_BASE = "http://127.0.0.1:8000";

const safeText = (value, fallback = "NA") => {
    if (value === null || typeof value === "undefined" || value === "") {
        return fallback;
    }
    return value;
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);

    const checkAuth = useCallback(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (!token || (role || "").toLowerCase() !== "admin") {
            navigate("/");
            return false;
        }
        return token;
    }, [navigate]);

    useEffect(() => {
        const token = checkAuth();
        if (!token) return;

        const loadAdminOverview = async () => {
            try {
                const response = await fetch(`${API_BASE}/admin/overview`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.detail || "Failed to load admin overview");
                }
                setStats(data);
            } catch (err) {
                setError(err.message);
            }
        };

        loadAdminOverview();
    }, [checkAuth]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/");
    };

    return (
        <>
            <header className="navbar">
                <h2>Admin Dashboard</h2>
                <div className="navbar-actions">
                    <Link className="nav-link-btn" to="/jobs">Browse Jobs</Link>
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <main className="dashboard-shell">
                <section className="stats-grid" id="adminStats">
                    {error ? (
                        <p className="empty-state">{error}</p>
                    ) : stats ? (
                        <>
                            <article className="stat-card"><p>Total Users</p><h3>{stats.totals?.users || 0}</h3></article>
                            <article className="stat-card"><p>Total Jobs</p><h3>{stats.totals?.jobs || 0}</h3></article>
                            <article className="stat-card"><p>Total Applications</p><h3>{stats.totals?.applications || 0}</h3></article>
                        </>
                    ) : (
                        <p className="empty-state">Loading...</p>
                    )}
                </section>

                <section className="panel">
                    <div className="panel-head">
                        <h3>Users by Role</h3>
                    </div>
                    <div id="usersByRole" className="stack-list">
                        {["admin", "recruiter", "candidate"].map(role => (
                            <Link className="role-link" to={`/admin-users?role=${role}`} key={role}>
                                <article className="list-card role-card">
                                    <h4>{role.charAt(0).toUpperCase() + role.slice(1)}</h4>
                                    <p>{safeText(stats?.users_by_role?.[role], "0")}</p>
                                </article>
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="panel">
                    <div className="panel-head">
                        <h3>Recent Jobs</h3>
                    </div>
                    <div id="recentJobs" className="stack-list">
                        {stats?.recent_jobs?.length > 0 ? (
                            stats.recent_jobs.map((job, idx) => (
                                <article className="list-card" key={idx}>
                                    <h4>{job.title}</h4>
                                    <p>{job.location || "NA"} | {job.mode || "NA"} | {job.status}</p>
                                </article>
                            ))
                        ) : (
                            <p className="empty-state">No recent jobs.</p>
                        )}
                    </div>
                </section>

                <section className="panel">
                    <div className="panel-head">
                        <h3>Applications by Status</h3>
                    </div>
                    <div id="applicationsByStatus" className="stack-list">
                        {stats?.applications_by_status && Object.keys(stats.applications_by_status).length > 0 ? (
                            Object.entries(stats.applications_by_status).map(([key, value]) => (
                                <article className="list-card" key={key}>
                                    <h4>{key}</h4>
                                    <p>{value}</p>
                                </article>
                            ))
                        ) : (
                            <p className="empty-state">No data available.</p>
                        )}
                    </div>
                </section>
            </main>
        </>
    );
};

export default AdminDashboard;
