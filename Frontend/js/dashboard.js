let currentProfile = null;
let pollingInterval = null;
let isLoading = false;

const API_BASE = `${window.location.protocol === "file:" ? "http:" : window.location.protocol}//${window.location.hostname || "127.0.0.1"}:8000`;

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

/* ================= STATUS HELPERS ================= */

function formatStatus(status) {
    const key = (status || "").toLowerCase();
    return STATUS_LABELS[key] || (status || "-");
}

function statusClass(status) {
    const key = (status || "").toLowerCase();
    return `status-chip status-${key.replace(/[^a-z0-9_-]/g, "")}`;
}

function renderApplicationInsights(applications) {
    const totals = {
        all: applications.length,
        shortlisted: 0,
        rejected: 0,
        interviewScheduled: 0
    };

    applications.forEach((app) => {
        const status = (app.status || "").toLowerCase();

        if (status === "shortlisted") totals.shortlisted += 1;
        if (status === "rejected") totals.rejected += 1;
        if (status === "interview_scheduled" || status === "interview_pending") {
            totals.interviewScheduled += 1;
        }
    });

    const totalEl = document.getElementById("insightTotalApplications");
    const shortlistedEl = document.getElementById("insightShortlisted");
    const rejectedEl = document.getElementById("insightRejected");
    const interviewScheduledEl = document.getElementById("insightInterviewScheduled");

    if (totalEl) totalEl.innerText = String(totals.all);
    if (shortlistedEl) shortlistedEl.innerText = String(totals.shortlisted);
    if (rejectedEl) rejectedEl.innerText = String(totals.rejected);
    if (interviewScheduledEl) interviewScheduledEl.innerText = String(totals.interviewScheduled);
}

/* ================= EXPERIENCE HELPERS ================= */

function normalizeExperienceLevel(value) {
    if (!value) return "";

    const text = String(value).trim().toLowerCase();

    if (["fresher", "1 to 3 years", "4 to 8 years", "9 and above"].includes(text)) {
        return text;
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
    if (!normalized) return "-";
    if (normalized === "fresher") return "Fresher";
    return normalized;
}

/* ================= SMART POLLING ================= */

function startPolling() {
    if (pollingInterval !== null) return;

    pollingInterval = setInterval(() => {
        if (!document.hidden) {
            loadDashboard();
        }
    }, 15000);

    console.log("🔄 Smart polling started");
}

function stopPolling() {
    if (pollingInterval !== null) {
        clearInterval(pollingInterval);
        pollingInterval = null;
        console.log("⛔ Polling stopped");
    }
}

/* ================= VIEW SWITCHING ================= */

function showProfile() {
    document.getElementById("applicationsView").style.display = "none";
    document.getElementById("profileView").style.display = "block";

    if (currentProfile) {
        document.getElementById("viewFullName").innerText = currentProfile.full_name || "-";
        document.getElementById("viewCompany").innerText = currentProfile.company_name || "-";
        document.getElementById("viewEmail").innerText = currentProfile.email || "-";
        document.getElementById("viewPhone").innerText = currentProfile.phone || currentProfile.phone_number || "-";
        document.getElementById("viewExperience").innerText = displayExperience(currentProfile.experience_years);
        document.getElementById("viewSkills").innerText = currentProfile.skills || "-";
    }
}

function showApplications() {
    document.getElementById("profileView").style.display = "none";
    document.getElementById("applicationsView").style.display = "block";
}

function applyInitialViewFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const view = (params.get("view") || "").toLowerCase();

    if (view === "profile") {
        showProfile();
    } else {
        showApplications();
    }
}

/* ================= LOAD DASHBOARD ================= */

async function loadDashboard() {

    if (isLoading) return;
    isLoading = true;

    const token = localStorage.getItem("token");
    if (!token) {
        isLoading = false;
        return;
    }

    try {

        /* -------- LOAD PROFILE -------- */

        const profileRes = await fetch(`${API_BASE}/profile/me`, {
            headers: { "Authorization": "Bearer " + token }
        });

        if (profileRes.ok) {
            const profile = await profileRes.json();
            currentProfile = profile;

            document.getElementById("profileName").innerText =
                profile.full_name || "Complete Profile";

            const emailElement = document.getElementById("profileEmail");
            if (emailElement) {
                emailElement.innerText = profile.email || "";
            }
        }

        /* -------- LOAD APPLICATIONS -------- */

        const appRes = await fetch(`${API_BASE}/applications/my`, {
            headers: { "Authorization": "Bearer " + token }
        });

        if (!appRes.ok) return;

        const applications = await appRes.json();
        renderApplicationInsights(applications);
        const container = document.getElementById("applicationsContainer");
        container.innerHTML = "";

        let needsRefresh = false;

        applications.forEach(app => {

            const status = (app.status || "").toLowerCase();

            if (
                status === "interview_scheduled" ||
                status === "interview_pending" ||
                status === "interview_in_progress"
            ) {
                needsRefresh = true;
            }

            container.innerHTML += `
                <div class="application-card">
                    <h4>${app.job.title}</h4>
                    <p><b>Resume Score:</b> ${app.resume_score ?? "-"}</p>
                    <p><b>Interview Score:</b> ${app.voice_score ?? "-"}</p>
                    <p><b>Status:</b> 
                        <span class="${statusClass(status)}">
                            ${formatStatus(status)}
                        </span>
                    </p>
                </div>
            `;
        });

        if (needsRefresh) {
            startPolling();
        } else {
            stopPolling();
        }

    } catch (error) {
        console.error("Dashboard load failed:", error);
    } finally {
        isLoading = false;
    }
}

/* ================= PROFILE MODAL ================= */

function openProfile() {
    document.getElementById("profileModal").style.display = "flex";

    if (currentProfile) {
        document.getElementById("updateFullName").value = currentProfile.full_name || "";
        document.getElementById("updateCompany").value = currentProfile.company_name || "";
        document.getElementById("updateExperience").value =
            normalizeExperienceLevel(currentProfile.experience_years);
        document.getElementById("updateSkills").value = currentProfile.skills || "";
    }
}

function closeProfile() {
    document.getElementById("profileModal").style.display = "none";
}

/* ================= PROFILE SUBMIT ================= */

document.addEventListener("DOMContentLoaded", () => {

    applyInitialViewFromQuery();
    loadDashboard();

    const profileForm = document.getElementById("profileForm");
    if (!profileForm) return;

    profileForm.addEventListener("submit", async function(e) {

        e.preventDefault();

        const saveButton = profileForm.querySelector('button[type="submit"]');
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent = "Saving...";
        }

        try {

            const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE}/profile/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({
                    full_name: document.getElementById("updateFullName").value.trim() || null,
                    company_name: document.getElementById("updateCompany").value.trim() || null,
                    experience_years: normalizeExperienceLevel(
                        document.getElementById("updateExperience").value
                    ) || null,
                    skills: document.getElementById("updateSkills").value.trim() || null
                })
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.detail || "Profile update failed");
            }

            alert("Profile updated successfully");
            closeProfile();
            await loadDashboard();

        } catch (error) {
            alert(error.message || "Profile update failed");
        } finally {
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent = "Save";
            }
        }
    });
});

/* ================= TAB VISIBILITY CONTROL ================= */

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        stopPolling();
    } else {
        loadDashboard();
    }
});
