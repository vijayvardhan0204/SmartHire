import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/dashboard.css';

const API_BASE = "http://127.0.0.1:8000";

const Jobs = () => {
    const navigate = useNavigate();
    const [allJobs, setAllJobs] = useState([]);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState(null);
    
    // Popup state
    const [popupMessage, setPopupMessage] = useState("");
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const fileInputRef = useRef(null);
    const [selectedJobId, setSelectedJobId] = useState(null);

    const role = (localStorage.getItem("role") || "").toLowerCase();
    const authToken = localStorage.getItem("token");

    useEffect(() => {
        if (!authToken) {
            navigate("/");
            return;
        }

        const loadJobs = async () => {
            try {
                const response = await fetch(`${API_BASE}/jobs`, {
                    headers: { "Authorization": `Bearer ${authToken}` }
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.detail || "Failed to fetch jobs");
                }

                setAllJobs(data);
                setFilteredJobs(data);
            } catch (err) {
                setError(err.message || "Unable to load jobs.");
            }
        };

        loadJobs();
    }, [authToken, navigate]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredJobs(allJobs);
            return;
        }

        const query = searchQuery.trim().toLowerCase();
        const filtered = allJobs.filter((job) => {
            const haystack = [
                job.title,
                job.role,
                job.location,
                job.mode,
                job.description
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return haystack.includes(query);
        });

        setFilteredJobs(filtered);
    }, [searchQuery, allJobs]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/");
    };

    const getHomeLink = () => {
        if (role === "recruiter") return "/recruiter";
        if (role === "admin") return "/admin-dashboard";
        return "/dashboard";
    };

    // Apply Flow
    const handleApplyClick = (jobId) => {
        if (!authToken) {
            setPopupMessage("Please login again.");
            setIsPopupOpen(true);
            setTimeout(() => navigate("/"), 2000);
            return;
        }

        if (role !== "candidate") {
            setPopupMessage("Only candidates can apply for jobs.");
            setIsPopupOpen(true);
            return;
        }

        setSelectedJobId(jobId);
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files && e.target.files[0];
        // Reset file input so same file can be selected again if needed
        e.target.value = null; 

        if (!file) {
            setPopupMessage("Resume upload is required.");
            setIsPopupOpen(true);
            return;
        }

        if (!selectedJobId) return;

        try {
            // 1. Create application
            const applicationResponse = await fetch(`${API_BASE}/applications/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({ job_id: selectedJobId })
            });

            const applicationData = await applicationResponse.json().catch(() => ({}));
            if (!applicationResponse.ok) {
                throw new Error(applicationData.detail || "Failed to create application");
            }

            const applicationId = applicationData.id;
            if (!applicationId) {
                throw new Error("Application created, but no application id returned.");
            }

            // 2. Upload resume
            const formData = new FormData();
            formData.append("file", file);

            const uploadResponse = await fetch(`${API_BASE}/applications/${applicationId}/upload-resume`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${authToken}`
                },
                body: formData
            });

            const uploadData = await uploadResponse.json().catch(() => ({}));
            if (!uploadResponse.ok) {
                throw new Error(uploadData.detail || "Failed to upload resume");
            }

            // 3. Process status
            const uploadStatus = (uploadData.status || "").toLowerCase();
            const explicitFlag = uploadData.is_above_min_required;
            const resumeScore = Number(uploadData.resume_score);
            const minRequiredScore = uploadData.min_required_score;
            const isAboveMinRequired = typeof explicitFlag === "boolean"
                ? explicitFlag
                : (
                    minRequiredScore === null ||
                    typeof minRequiredScore === "undefined" ||
                    resumeScore > Number(minRequiredScore)
                );

            if (isAboveMinRequired || uploadStatus === "interview_scheduled") {
                setPopupMessage("Resume uploaded successfully. An interview call will be placed shortly. Please answer the call to complete your screening.");
            } else {
                setPopupMessage("Resume uploaded successfully, but your score did not meet the minimum requirement for interview shortlisting.");
            }
            setIsPopupOpen(true);

        } catch (error) {
            setPopupMessage(error.message || "Unable to apply right now.");
            setIsPopupOpen(true);
        } finally {
            setSelectedJobId(null);
        }
    };

    return (
        <>
            <header className="navbar">
                <h2>SmartHire</h2>
                <div className="navbar-actions">
                    <Link className="nav-link-btn" to={getHomeLink()}>Home</Link>
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <div className="jobs-container">
                <h2>Available Jobs</h2>
                <input 
                    type="text" 
                    placeholder="Search by title, role, location, mode" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                
                <div id="jobsContainer">
                    {error ? (
                        <p className="empty-state">{error}</p>
                    ) : filteredJobs.length > 0 ? (
                        filteredJobs.map(job => (
                            <div className="job-card" key={job.id}>
                                <h3>{job.title}</h3>
                                <p>{job.description || "No description provided."}</p>
                                <div className="job-meta">
                                    <span>{job.role || "Role: NA"}</span>
                                    <span>{job.location || "Location: NA"}</span>
                                    <span>{job.mode || "Mode: NA"}</span>
                                </div>
                                {role === "candidate" && (
                                    <button onClick={() => handleApplyClick(job.id)}>Apply</button>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="empty-state">No jobs found.</p>
                    )}
                </div>
            </div>

            {/* Hidden file input for resume upload */}
            <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
            />

            {/* Application Modal */}
            {isPopupOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setIsPopupOpen(false)}>
                    <div style={{ background: '#fff', color: '#1f2937', maxWidth: '560px', width: '90%', padding: '20px', borderRadius: '12px' }} onClick={e => e.stopPropagation()}>
                        <p style={{ margin: '0 0 16px', lineHeight: 1.5 }}>{popupMessage}</p>
                        <button 
                            type="button" 
                            style={{ padding: '8px 14px', border: 'none', borderRadius: '8px', background: '#2563eb', color: '#fff', cursor: 'pointer' }}
                            onClick={() => setIsPopupOpen(false)}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default Jobs;
