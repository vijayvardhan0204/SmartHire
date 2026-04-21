import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/dashboard.css';

const API_BASE = import.meta.env.VITE_API_URL;

const numOrNull = (value) => {
    if (value === "" || value === null || typeof value === "undefined") {
        return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};

const JobListing = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [error, setError] = useState(null);

    const [createForm, setCreateForm] = useState({
        title: "",
        role: "",
        location: "",
        mode: "",
        package: "",
        experience_required: "",
        resume_min_score: "",
        interview_min_score: "",
        description: ""
    });

    const checkAuth = useCallback(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (!token || (role || "").toLowerCase() !== "recruiter") {
            navigate("/");
            return false;
        }
        return token;
    }, [navigate]);

    const loadMyJobs = useCallback(async () => {
        const token = checkAuth();
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE}/jobs/my`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || "Failed to load jobs");
            }
            setJobs(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    }, [checkAuth]);

    useEffect(() => {
        loadMyJobs();
    }, [loadMyJobs]);

    const handleCreateJob = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");

        const payload = {
            title: createForm.title.trim(),
            role: createForm.role.trim() || null,
            description: createForm.description.trim() || null,
            package: createForm.package.trim() || null,
            location: createForm.location.trim() || null,
            mode: createForm.mode.trim() || null,
            experience_required: numOrNull(createForm.experience_required),
            resume_min_score: numOrNull(createForm.resume_min_score),
            interview_min_score: numOrNull(createForm.interview_min_score)
        };

        try {
            const response = await fetch(`${API_BASE}/jobs/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || "Failed to create job");
            }

            alert("Job created successfully.");
            setCreateForm({
                title: "", role: "", location: "", mode: "", package: "",
                experience_required: "", resume_min_score: "", interview_min_score: "", description: ""
            });
            loadMyJobs();
        } catch (err) {
            alert(err.message || "Unable to create job.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/");
    };

    return (
        <>
            <header className="navbar">
                <h2>Job Listing</h2>
                <div className="navbar-actions">
                    <Link className="nav-link-btn" to="/recruiter">Dashboard</Link>
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <main className="dashboard-shell">
                <section className="panel">
                    <div className="panel-head">
                        <h3>Create Job</h3>
                    </div>
                    <form className="grid-form" onSubmit={handleCreateJob}>
                        <input 
                            type="text" placeholder="Job Title" required 
                            value={createForm.title} onChange={(e) => setCreateForm({...createForm, title: e.target.value})}
                        />
                        <input 
                            type="text" placeholder="Role" 
                            value={createForm.role} onChange={(e) => setCreateForm({...createForm, role: e.target.value})}
                        />
                        <input 
                            type="text" placeholder="Location" 
                            value={createForm.location} onChange={(e) => setCreateForm({...createForm, location: e.target.value})}
                        />
                        <input 
                            type="text" placeholder="Mode (Remote/Hybrid/Onsite)" 
                            value={createForm.mode} onChange={(e) => setCreateForm({...createForm, mode: e.target.value})}
                        />
                        <input 
                            type="text" placeholder="Package" 
                            value={createForm.package} onChange={(e) => setCreateForm({...createForm, package: e.target.value})}
                        />
                        <input 
                            type="number" placeholder="Experience Required (Years)" 
                            value={createForm.experience_required} onChange={(e) => setCreateForm({...createForm, experience_required: e.target.value})}
                        />
                        <input 
                            type="number" placeholder="Min Resume Score" 
                            value={createForm.resume_min_score} onChange={(e) => setCreateForm({...createForm, resume_min_score: e.target.value})}
                        />
                        <input 
                            type="number" placeholder="Min Interview Score" 
                            value={createForm.interview_min_score} onChange={(e) => setCreateForm({...createForm, interview_min_score: e.target.value})}
                        />
                        <textarea 
                            placeholder="Job Description" 
                            value={createForm.description} onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                        ></textarea>
                        <button type="submit">Create Job</button>
                    </form>
                </section>

                <section className="panel">
                    <div className="panel-head">
                        <h3>My Jobs</h3>
                    </div>
                    <div className="stack-list">
                        {error ? (
                            <p className="empty-state">{error}</p>
                        ) : jobs.length > 0 ? (
                            jobs.map(job => (
                                <article className="list-card" key={job.id || Math.random()}>
                                    <h4>{job.title}</h4>
                                    <p>{job.role || "NA"} | {job.location || "NA"} | {job.mode || "NA"}</p>
                                    <p>Status: {job.status}</p>
                                </article>
                            ))
                        ) : (
                            <p className="empty-state">No jobs created yet.</p>
                        )}
                    </div>
                </section>
            </main>
        </>
    );
};

export default JobListing;
