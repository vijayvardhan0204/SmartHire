const API_BASE = "http://127.0.0.1:8000";
const authToken = localStorage.getItem("token");
const role = (localStorage.getItem("role") || "").toLowerCase();

let allJobs = [];

function ensurePopupModal() {
    let modal = document.getElementById("appMessageModal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "appMessageModal";
    modal.style.position = "fixed";
    modal.style.inset = "0";
    modal.style.background = "rgba(0,0,0,0.45)";
    modal.style.display = "none";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";
    modal.style.zIndex = "9999";

    const card = document.createElement("div");
    card.style.background = "#fff";
    card.style.color = "#1f2937";
    card.style.maxWidth = "560px";
    card.style.width = "90%";
    card.style.padding = "20px";
    card.style.borderRadius = "12px";

    const message = document.createElement("p");
    message.id = "appMessageText";
    message.style.margin = "0 0 16px";
    message.style.lineHeight = "1.5";

    const okBtn = document.createElement("button");
    okBtn.type = "button";
    okBtn.textContent = "OK";
    okBtn.style.padding = "8px 14px";
    okBtn.style.border = "none";
    okBtn.style.borderRadius = "8px";
    okBtn.style.background = "#2563eb";
    okBtn.style.color = "#fff";
    okBtn.style.cursor = "pointer";
    okBtn.onclick = () => {
        modal.style.display = "none";
    };

    card.appendChild(message);
    card.appendChild(okBtn);
    modal.appendChild(card);
    document.body.appendChild(modal);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    return modal;
}

function showPopup(message) {
    const modal = ensurePopupModal();
    const messageEl = document.getElementById("appMessageText");
    if (messageEl) {
        messageEl.textContent = message;
    }
    modal.style.display = "flex";
}

function updateHomeLink() {
    const homeLink = document.getElementById("homeLink");
    if (!homeLink) return;

    if (role === "recruiter") {
        homeLink.href = "recruiter.html";
    } else if (role === "admin") {
        homeLink.href = "admin-dashboard.html";
    } else {
        homeLink.href = "dashboard.html";
    }
}

function applyJob(jobId) {
    createApplicationAndUploadResume(jobId);
}

function pickResumeFile() {
    return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".pdf,application/pdf";
        input.onchange = () => resolve(input.files && input.files[0] ? input.files[0] : null);
        input.click();
    });
}

async function uploadResumeFile(applicationId, file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE}/applications/${applicationId}/upload-resume`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${authToken}`
        },
        body: formData
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.detail || "Failed to upload resume");
    }

    return data;
}

async function createApplicationAndUploadResume(jobId) {
    if (!authToken) {
        showPopup("Please login again.");
        window.location.href = "index.html";
        return;
    }

    if (role !== "candidate") {
        showPopup("Only candidates can apply for jobs.");
        return;
    }

    try {
        const file = await pickResumeFile();
        if (!file) {
            showPopup("Resume upload is required.");
            return;
        }

        const applicationResponse = await fetch(`${API_BASE}/applications/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            },
            body: JSON.stringify({ job_id: jobId })
        });

        const applicationData = await applicationResponse.json().catch(() => ({}));
        if (!applicationResponse.ok) {
            throw new Error(applicationData.detail || "Failed to create application");
        }

        const applicationId = applicationData.id;
        if (!applicationId) {
            throw new Error("Application created, but no application id returned.");
        }

        const uploadData = await uploadResumeFile(applicationId, file);
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
            showPopup("Resume uploaded successfully. An interview call will be placed shortly. Please answer the call to complete your screening.");
        } else {
            showPopup("Resume uploaded successfully, but your score did not meet the minimum requirement for interview shortlisting.");
        }
    } catch (error) {
        showPopup(error.message || "Unable to apply right now.");
    }
}

function renderJobs(jobs) {
    const container = document.getElementById("jobsContainer");
    container.innerHTML = "";

    if (!jobs.length) {
        container.innerHTML = "<p class='empty-state'>No jobs found.</p>";
        return;
    }

    jobs.forEach((job) => {
        const div = document.createElement("div");
        div.className = "job-card";
        div.innerHTML = `
            <h3>${job.title}</h3>
            <p>${job.description || "No description provided."}</p>
            <div class="job-meta">
                <span>${job.role || "Role: NA"}</span>
                <span>${job.location || "Location: NA"}</span>
                <span>${job.mode || "Mode: NA"}</span>
            </div>
            ${role === "candidate" ? `<button onclick="applyJob(${job.id})">Apply</button>` : ""}
        `;
        container.appendChild(div);
    });
}

function filterJobs() {
    const query = (document.getElementById("jobSearch").value || "").trim().toLowerCase();
    if (!query) {
        renderJobs(allJobs);
        return;
    }

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

    renderJobs(filtered);
}

async function loadJobs() {
    try {
        const response = await fetch(`${API_BASE}/jobs`, {
            headers: authToken ? { "Authorization": `Bearer ${authToken}` } : {}
        });

        allJobs = await response.json();
        if (!response.ok) {
            throw new Error(allJobs.detail || "Failed to fetch jobs");
        }

        renderJobs(allJobs);
    } catch (error) {
        const container = document.getElementById("jobsContainer");
        container.innerHTML = `<p class="empty-state">${error.message || "Unable to load jobs."}</p>`;
    }
}

updateHomeLink();
document.getElementById("jobSearch").addEventListener("input", filterJobs);
loadJobs();
