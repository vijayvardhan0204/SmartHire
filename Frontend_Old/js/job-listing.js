const API_BASE = "http://127.0.0.1:8000";
const authToken = localStorage.getItem("token");

function numOrNull(value) {
    if (value === "" || value === null || typeof value === "undefined") {
        return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
}

async function fetchMyJobs() {
    const response = await fetch(`${API_BASE}/jobs/my`, {
        headers: {
            "Authorization": `Bearer ${authToken}`
        }
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Failed to load jobs");
    }
    return data;
}

function renderMyJobs(jobs) {
    const container = document.getElementById("myJobsList");

    if (!jobs.length) {
        container.innerHTML = "<p class='empty-state'>No jobs created yet.</p>";
        return;
    }

    container.innerHTML = jobs
        .map((job) => `
            <article class="list-card">
                <h4>${job.title}</h4>
                <p>${job.role || "NA"} | ${job.location || "NA"} | ${job.mode || "NA"}</p>
                <p>Status: ${job.status}</p>
            </article>
        `)
        .join("");
}

async function loadMyJobs() {
    try {
        const jobs = await fetchMyJobs();
        renderMyJobs(jobs);
    } catch (error) {
        document.getElementById("myJobsList").innerHTML = `<p class="empty-state">${error.message}</p>`;
    }
}

document.getElementById("createJobForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
        title: document.getElementById("jobTitle").value.trim(),
        role: document.getElementById("jobRole").value.trim() || null,
        description: document.getElementById("jobDescription").value.trim() || null,
        package: document.getElementById("jobPackage").value.trim() || null,
        location: document.getElementById("jobLocation").value.trim() || null,
        mode: document.getElementById("jobMode").value.trim() || null,
        experience_required: numOrNull(document.getElementById("jobExperience").value),
        resume_min_score: numOrNull(document.getElementById("resumeMin").value),
        interview_min_score: numOrNull(document.getElementById("interviewMin").value)
    };

    try {
        const response = await fetch(`${API_BASE}/jobs/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || "Failed to create job");
        }

        alert("Job created successfully.");
        e.target.reset();
        await loadMyJobs();
    } catch (error) {
        alert(error.message || "Unable to create job.");
    }
});

loadMyJobs();
