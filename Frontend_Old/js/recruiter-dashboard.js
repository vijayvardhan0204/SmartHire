const API_BASE = "http://127.0.0.1:8000";
const authToken = localStorage.getItem("token");

async function getJson(url) {
    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${authToken}`
        }
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Request failed");
    }
    return data;
}

async function patchJson(url, payload) {
    const hasPayload = typeof payload !== "undefined";
    const headers = {
        "Authorization": `Bearer ${authToken}`
    };
    if (hasPayload) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
        method: "PATCH",
        headers,
        ...(hasPayload ? { body: JSON.stringify(payload) } : {})
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Request failed");
    }
    return data;
}

async function updateApplicationStatus(applicationId, status) {
    if (!applicationId || !status) return;
    try {
        await patchJson(`${API_BASE}/applications/${applicationId}/status`, { status });
        await loadRecruiterDashboard();
    } catch (error) {
        alert(error.message || "Failed to update status");
    }
}

async function updateJobStatus(jobId, status) {
    if (!jobId || !status) return;
    try {
        const encodedStatus = encodeURIComponent(status);
        await patchJson(`${API_BASE}/jobs/${jobId}/status?status=${encodedStatus}`);
        await loadRecruiterDashboard();
    } catch (error) {
        alert(error.message || "Failed to update job status");
    }
}

window.updateApplicationStatus = updateApplicationStatus;
window.updateJobStatus = updateJobStatus;

function safeValue(value) {
    return value === null || typeof value === "undefined" || value === "" ? "NA" : value;
}

function normalizeExperienceLevel(value) {
    if (value === null || typeof value === "undefined" || value === "") {
        return "";
    }

    const text = String(value).trim();
    const lower = text.toLowerCase();
    if (["fresher", "1 to 3 years", "4 to 8 years", "9 and above"].includes(lower)) {
        return lower;
    }

    const numeric = Number(text);
    if (Number.isNaN(numeric)) return "";
    if (numeric <= 0) return "fresher";
    if (numeric <= 3) return "1 to 3 years";
    if (numeric <= 8) return "4 to 8 years";
    return "9 and above";
}

function displayExperience(value) {
    const normalized = normalizeExperienceLevel(value);
    if (!normalized) return "NA";
    if (normalized === "fresher") return "Fresher";
    return normalized;
}

function profileContainerId(applicationId) {
    return `candidate-profile-${applicationId}`;
}

function transcriptContainerId(applicationId) {
    return `candidate-transcript-${applicationId}`;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function renderTranscriptDetails(transcript) {
    return `
        <p><b>Bland AI Transcript:</b></p>
        <pre style="white-space: pre-wrap; margin: 0;">${escapeHtml(transcript)}</pre>
    `;
}

async function toggleTranscript(applicationId) {
    const container = document.getElementById(transcriptContainerId(applicationId));
    if (!container) return;

    if (container.dataset.open === "true") {
        container.style.display = "none";
        container.dataset.open = "false";
        return;
    }

    if (container.dataset.loaded !== "true") {
        try {
            container.innerHTML = "<p>Loading transcript...</p>";
            const data = await getJson(`${API_BASE}/applications/${applicationId}/transcript`);
            if (!data.transcript) {
                container.innerHTML = "<p>Transcript not available yet.</p>";
                container.dataset.loaded = "false";
            } else {
                container.innerHTML = renderTranscriptDetails(data.transcript);
                container.dataset.loaded = "true";
            }
        } catch (error) {
            container.innerHTML = `<p>${error.message || "Unable to load transcript."}</p>`;
            container.dataset.loaded = "false";
        }
    }

    container.style.display = "block";
    container.dataset.open = "true";
}

function renderProfileDetails(profile) {
    return `
        <div class="score-row">
            <p><b>Name:</b> ${safeValue(profile.full_name || profile.name)}</p>
            <p><b>Email:</b> ${safeValue(profile.email)}</p>
            <p><b>Phone:</b> ${safeValue(profile.phone)}</p>
            <p><b>Company:</b> ${safeValue(profile.company_name)}</p>
            <p><b>Experience:</b> ${displayExperience(profile.experience_years)}</p>
            <p><b>Skills:</b> ${safeValue(profile.skills)}</p>
        </div>
    `;
}

async function toggleCandidateProfile(applicationId, userId) {
    if (!userId) {
        alert("User profile reference is missing for this application.");
        return;
    }

    const container = document.getElementById(profileContainerId(applicationId));
    if (!container) return;

    if (container.dataset.open === "true") {
        container.style.display = "none";
        container.dataset.open = "false";
        return;
    }

    if (container.dataset.loaded !== "true") {
        try {
            container.innerHTML = "<p>Loading profile...</p>";
            const profile = await getJson(`${API_BASE}/profile/candidate/${userId}`);
            container.innerHTML = renderProfileDetails(profile);
            container.dataset.loaded = "true";
        } catch (error) {
            container.innerHTML = `<p>${error.message || "Unable to load profile."}</p>`;
            container.dataset.loaded = "false";
        }
    }

    container.style.display = "block";
    container.dataset.open = "true";
}

window.toggleCandidateProfile = toggleCandidateProfile;
window.toggleTranscript = toggleTranscript;

function renderStats(jobs, applications) {
    const stats = document.getElementById("recruiterStats");
    const openJobs = jobs.filter((job) => (job.status || "").toLowerCase() === "open").length;
    const selected = applications.filter((app) => {
        const status = (app.status || "").toLowerCase();
        return status === "selected" || status === "shortlisted";
    }).length;

    stats.innerHTML = `
        <article class="stat-card">
            <p>Total Jobs</p>
            <h3>${jobs.length}</h3>
        </article>
        <article class="stat-card">
            <p>Total Applicants</p>
            <h3>${applications.length}</h3>
        </article>
        <article class="stat-card">
            <p>Open Jobs</p>
            <h3>${openJobs}</h3>
        </article>
        <article class="stat-card">
            <p>Selected</p>
            <h3>${selected}</h3>
        </article>
    `;
}

function renderJobs(jobs) {
    const container = document.getElementById("recruiterJobs");

    if (!jobs.length) {
        container.innerHTML = "<p class='empty-state'>No jobs posted yet.</p>";
        return;
    }

    container.innerHTML = jobs
        .map((job) => `
            <article class="list-card">
                <h4>${job.title}</h4>
                <p>${job.location || "NA"} | ${job.mode || "NA"}</p>
                <div class="status-controls">
                    <select id="job-status-${job.id}">
                        <option value="open" ${(job.status || "").toLowerCase() === "open" ? "selected" : ""}>Open</option>
                        <option value="closed" ${(job.status || "").toLowerCase() === "closed" ? "selected" : ""}>Closed</option>
                    </select>
                    <button type="button" onclick="updateJobStatus(${job.id}, document.getElementById('job-status-${job.id}').value)">Update</button>
                </div>
            </article>
        `)
        .join("");
}

function renderApplicationsByJob(jobs, applicationsByJob) {
    const container = document.getElementById("applicationsByJob");

    if (!jobs.length) {
        container.innerHTML = "<p class='empty-state'>No applications to show.</p>";
        return;
    }

    container.innerHTML = jobs
        .map((job) => {
            const apps = applicationsByJob[job.id] || [];
            const applicantRows = apps.length
                ? apps.map((app) => `
                    <div class="score-row">
                        <p><b>${app.candidate_name || "Candidate"}</b> | Status: ${safeValue(app.status)}</p>
                        <p>Resume: ${safeValue(app.resume_score)} | Voice: ${safeValue(app.voice_score)} | Performance: ${safeValue(app.performance_score)}</p>
                        <p>Communication: ${safeValue(app.communication_score)} | Technical: ${safeValue(app.technical_score)} | Confidence: ${safeValue(app.confidence_score)}</p>
                        <p>Interview Feedback: ${safeValue(app.interview_feedback)}</p>
                        <div class="status-controls">
                            <button type="button" onclick="toggleCandidateProfile(${app.application_id}, ${app.user_id})">View Profile</button>
                            ${(app.status || "").toLowerCase() === "shortlisted" ? `<button type="button" onclick="toggleTranscript(${app.application_id})">View Transcript</button>` : ""}
                        </div>
                        <div id="${profileContainerId(app.application_id)}" class="empty-state" style="display:none;" data-loaded="false" data-open="false"></div>
                        <div id="${transcriptContainerId(app.application_id)}" class="empty-state" style="display:none;" data-loaded="false" data-open="false"></div>
                        <div class="status-controls">
                            <select id="status-${app.application_id}">
                                <option value="selected" ${["selected", "shortlisted", "hired"].includes((app.status || "").toLowerCase()) ? "selected" : ""}>Selected</option>
                                <option value="rejected" ${(app.status || "").toLowerCase() === "rejected" ? "selected" : ""}>Rejected</option>
                            </select>
                            <button type="button" onclick="updateApplicationStatus(${app.application_id}, document.getElementById('status-${app.application_id}').value)">Update</button>
                        </div>
                    </div>
                `).join("")
                : "<p class='empty-state'>No applicants yet.</p>";

            return `
                <article class="list-card">
                    <h4>${job.title}</h4>
                    <p>${apps.length} applicant(s)</p>
                    ${applicantRows}
                </article>
            `;
        })
        .join("");
}

async function loadRecruiterDashboard() {
    try {
        const jobs = await getJson(`${API_BASE}/jobs/my`);
        const appResults = await Promise.all(
            jobs.map((job) =>
                getJson(`${API_BASE}/applications/job/${job.id}`)
                    .then((applications) => ({ jobId: job.id, applications }))
                    .catch(() => ({ jobId: job.id, applications: [] }))
            )
        );

        const applicationsByJob = {};
        let allApplications = [];

        appResults.forEach((result) => {
            applicationsByJob[result.jobId] = result.applications;
            allApplications = allApplications.concat(result.applications);
        });

        renderStats(jobs, allApplications);
        renderJobs(jobs);
        renderApplicationsByJob(jobs, applicationsByJob);
    } catch (error) {
        document.getElementById("recruiterJobs").innerHTML = `<p class="empty-state">${error.message}</p>`;
        document.getElementById("applicationsByJob").innerHTML = "";
    }
}

loadRecruiterDashboard();

