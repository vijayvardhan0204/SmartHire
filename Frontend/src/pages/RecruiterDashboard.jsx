import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/dashboard.css';

const API_BASE = import.meta.env.VITE_API_URL;

const safeValue = (value) => {
    return value === null || typeof value === "undefined" || value === "" ? "NA" : value;
};

const normalizeExperienceLevel = (value) => {
    if (value === null || typeof value === "undefined" || value === "") return "";
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
    if (!normalized) return "NA";
    if (normalized === "fresher") return "Fresher";
    return normalized;
};

const RecruiterDashboard = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [applicationsByJob, setApplicationsByJob] = useState({});
    const [allApplications, setAllApplications] = useState([]);
    const [error, setError] = useState(null);

    // Accordion state
    const [openProfiles, setOpenProfiles] = useState({});
    const [openTranscripts, setOpenTranscripts] = useState({});
    
    // Loaded data cache
    const [profilesData, setProfilesData] = useState({});
    const [transcriptsData, setTranscriptsData] = useState({});

    const checkAuth = useCallback(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");
        if (!token || (role || "").toLowerCase() !== "recruiter") {
            navigate("/");
            return false;
        }
        return token;
    }, [navigate]);

    const getJson = async (url) => {
        const token = localStorage.getItem("token");
        const response = await fetch(url, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Request failed");
        return data;
    };

    const patchJson = async (url, payload) => {
        const token = localStorage.getItem("token");
        const hasPayload = typeof payload !== "undefined";
        const headers = { "Authorization": `Bearer ${token}` };
        if (hasPayload) headers["Content-Type"] = "application/json";

        const response = await fetch(url, {
            method: "PATCH",
            headers,
            ...(hasPayload ? { body: JSON.stringify(payload) } : {})
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Request failed");
        return data;
    };

    const loadDashboard = useCallback(async () => {
        const token = checkAuth();
        if (!token) return;

        try {
            const fetchedJobs = await getJson(`${API_BASE}/jobs/my`);
            const appResults = await Promise.all(
                fetchedJobs.map((job) =>
                    getJson(`${API_BASE}/applications/job/${job.id}`)
                        .then((apps) => ({ jobId: job.id, applications: apps }))
                        .catch(() => ({ jobId: job.id, applications: [] }))
                )
            );

            const appsByJobMap = {};
            let allApps = [];

            appResults.forEach((result) => {
                appsByJobMap[result.jobId] = result.applications;
                allApps = allApps.concat(result.applications);
            });

            setJobs(fetchedJobs);
            setApplicationsByJob(appsByJobMap);
            setAllApplications(allApps);
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    }, [checkAuth]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/");
    };

    const updateApplicationStatus = async (applicationId, status) => {
        if (!applicationId || !status) return;
        try {
            await patchJson(`${API_BASE}/applications/${applicationId}/status`, { status });
            await loadDashboard();
        } catch (error) {
            alert(error.message || "Failed to update status");
        }
    };

    const updateJobStatus = async (jobId, status) => {
        if (!jobId || !status) return;
        try {
            const encodedStatus = encodeURIComponent(status);
            await patchJson(`${API_BASE}/jobs/${jobId}/status?status=${encodedStatus}`);
            await loadDashboard();
        } catch (error) {
            alert(error.message || "Failed to update job status");
        }
    };

    const toggleProfile = async (applicationId, userId) => {
        if (!userId) {
            alert("User profile reference is missing for this application.");
            return;
        }

        const isOpen = openProfiles[applicationId];
        
        if (isOpen) {
            setOpenProfiles({ ...openProfiles, [applicationId]: false });
            return;
        }

        setOpenProfiles({ ...openProfiles, [applicationId]: true });
        
        if (!profilesData[applicationId]) {
            try {
                const profile = await getJson(`${API_BASE}/profile/candidate/${userId}`);
                setProfilesData({ ...profilesData, [applicationId]: profile });
            } catch (err) {
                setProfilesData({ ...profilesData, [applicationId]: { error: err.message || "Unable to load profile." } });
            }
        }
    };

    const toggleTranscript = async (applicationId) => {
        const isOpen = openTranscripts[applicationId];
        
        if (isOpen) {
            setOpenTranscripts({ ...openTranscripts, [applicationId]: false });
            return;
        }

        setOpenTranscripts({ ...openTranscripts, [applicationId]: true });
        
        if (!transcriptsData[applicationId]) {
            try {
                const data = await getJson(`${API_BASE}/applications/${applicationId}/transcript`);
                setTranscriptsData({ 
                    ...transcriptsData, 
                    [applicationId]: data.transcript ? { text: data.transcript } : { error: "Transcript not available yet." } 
                });
            } catch (err) {
                setTranscriptsData({ ...transcriptsData, [applicationId]: { error: err.message || "Unable to load transcript." } });
            }
        }
    };

    const renderStats = () => {
        const openJobs = jobs.filter((job) => (job.status || "").toLowerCase() === "open").length;
        const selected = allApplications.filter((app) => {
            const status = (app.status || "").toLowerCase();
            return status === "selected" || status === "shortlisted";
        }).length;

        return (
            <>
                <article className="stat-card">
                    <p>Total Jobs</p>
                    <h3>{jobs.length}</h3>
                </article>
                <article className="stat-card">
                    <p>Total Applicants</p>
                    <h3>{allApplications.length}</h3>
                </article>
                <article className="stat-card">
                    <p>Open Jobs</p>
                    <h3>{openJobs}</h3>
                </article>
                <article className="stat-card">
                    <p>Selected</p>
                    <h3>{selected}</h3>
                </article>
            </>
        );
    };

    return (
        <>
            <header className="navbar">
                <h2>Recruiter Dashboard</h2>
                <div className="navbar-actions">
                    <Link className="nav-link-btn" to="/job-listing">Manage Jobs</Link>
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <main className="dashboard-shell">
                <section className="stats-grid" id="recruiterStats">
                    {renderStats()}
                </section>

                <section className="panel">
                    <div className="panel-head">
                        <h3>My Job Openings</h3>
                    </div>
                    <div className="stack-list">
                        {error ? (
                            <p className="empty-state">{error}</p>
                        ) : jobs.length > 0 ? (
                            jobs.map(job => (
                                <article className="list-card" key={job.id}>
                                    <h4>{job.title}</h4>
                                    <p>{job.location || "NA"} | {job.mode || "NA"}</p>
                                    <div className="status-controls">
                                        <select 
                                            defaultValue={(job.status || "").toLowerCase() === "open" ? "open" : "closed"}
                                            onChange={(e) => updateJobStatus(job.id, e.target.value)}
                                        >
                                            <option value="open">Open</option>
                                            <option value="closed">Closed</option>
                                        </select>
                                    </div>
                                </article>
                            ))
                        ) : (
                            <p className="empty-state">No jobs posted yet.</p>
                        )}
                    </div>
                </section>

                <section className="panel">
                    <div className="panel-head">
                        <h3>Applicants by Job</h3>
                    </div>
                    <div className="stack-list">
                        {jobs.length > 0 ? (
                            jobs.map(job => {
                                const apps = applicationsByJob[job.id] || [];
                                return (
                                    <article className="list-card" key={job.id}>
                                        <h4>{job.title}</h4>
                                        <p>{apps.length} applicant(s)</p>
                                        
                                        {apps.length > 0 ? (
                                            apps.map(app => (
                                                <div className="score-row" key={app.application_id}>
                                                    <p><b>{app.candidate_name || "Candidate"}</b> | Status: {safeValue(app.status)}</p>
                                                    <p>Resume: {safeValue(app.resume_score)} | Voice: {safeValue(app.voice_score)} | Performance: {safeValue(app.performance_score)}</p>
                                                    <p>Communication: {safeValue(app.communication_score)} | Technical: {safeValue(app.technical_score)} | Confidence: {safeValue(app.confidence_score)}</p>
                                                    <p>Interview Feedback: {safeValue(app.interview_feedback)}</p>
                                                    
                                                    <div className="status-controls">
                                                        <button type="button" onClick={() => toggleProfile(app.application_id, app.user_id)}>
                                                            {openProfiles[app.application_id] ? "Close Profile" : "View Profile"}
                                                        </button>
                                                        {(app.status || "").toLowerCase() === "shortlisted" && (
                                                            <button type="button" onClick={() => toggleTranscript(app.application_id)}>
                                                                {openTranscripts[app.application_id] ? "Close Transcript" : "View Transcript"}
                                                            </button>
                                                        )}
                                                    </div>

                                                    {openProfiles[app.application_id] && (
                                                        <div className="profile-details-box" style={{marginTop: '10px', padding: '10px', background: '#f8fafc', borderRadius: '4px'}}>
                                                            {!profilesData[app.application_id] ? (
                                                                <p>Loading profile...</p>
                                                            ) : profilesData[app.application_id].error ? (
                                                                <p className="empty-state">{profilesData[app.application_id].error}</p>
                                                            ) : (
                                                                <div>
                                                                    <p><b>Name:</b> {safeValue(profilesData[app.application_id].full_name || profilesData[app.application_id].name)}</p>
                                                                    <p><b>Email:</b> {safeValue(profilesData[app.application_id].email)}</p>
                                                                    <p><b>Phone:</b> {safeValue(profilesData[app.application_id].phone)}</p>
                                                                    <p><b>Company:</b> {safeValue(profilesData[app.application_id].company_name)}</p>
                                                                    <p><b>Experience:</b> {displayExperience(profilesData[app.application_id].experience_years)}</p>
                                                                    <p><b>Skills:</b> {safeValue(profilesData[app.application_id].skills)}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {openTranscripts[app.application_id] && (
                                                        <div className="transcript-details-box" style={{marginTop: '10px', padding: '10px', background: '#f8fafc', borderRadius: '4px'}}>
                                                            {!transcriptsData[app.application_id] ? (
                                                                <p>Loading transcript...</p>
                                                            ) : transcriptsData[app.application_id].error ? (
                                                                <p className="empty-state">{transcriptsData[app.application_id].error}</p>
                                                            ) : (
                                                                <div>
                                                                    <p><b>Bland AI Transcript:</b></p>
                                                                    <pre style={{whiteSpace: 'pre-wrap', margin: 0}}>{transcriptsData[app.application_id].text}</pre>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="status-controls" style={{marginTop: '10px'}}>
                                                        <select 
                                                            defaultValue={["selected", "shortlisted", "hired"].includes((app.status || "").toLowerCase()) ? "selected" : ((app.status || "").toLowerCase() === "rejected" ? "rejected" : "none")}
                                                            onChange={(e) => updateApplicationStatus(app.application_id, e.target.value)}
                                                        >
                                                            <option value="none" disabled>Update Status</option>
                                                            <option value="selected">Selected</option>
                                                            <option value="rejected">Rejected</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="empty-state">No applicants yet.</p>
                                        )}
                                    </article>
                                );
                            })
                        ) : (
                            <p className="empty-state">No applications to show.</p>
                        )}
                    </div>
                </section>
            </main>
        </>
    );
};

export default RecruiterDashboard;
