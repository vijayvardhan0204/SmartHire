const API_BASE = "http://127.0.0.1:8000";
const authToken = localStorage.getItem("token");

function safeText(value, fallback = "NA") {
    if (value === null || typeof value === "undefined" || value === "") {
        return fallback;
    }
    return value;
}

function objectToCards(containerId, obj) {
    const container = document.getElementById(containerId);
    const entries = Object.entries(obj || {});
    if (!entries.length) {
        container.innerHTML = "<p class='empty-state'>No data available.</p>";
        return;
    }

    container.innerHTML = entries
        .map(([key, value]) => `
            <article class="list-card">
                <h4>${key}</h4>
                <p>${value}</p>
            </article>
        `)
        .join("");
}

async function loadAdminOverview() {
    try {
        const response = await fetch(`${API_BASE}/admin/overview`, {
            headers: {
                "Authorization": `Bearer ${authToken}`
            }
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || "Failed to load admin overview");
        }

        document.getElementById("adminStats").innerHTML = `
            <article class="stat-card"><p>Total Users</p><h3>${data.totals.users}</h3></article>
            <article class="stat-card"><p>Total Jobs</p><h3>${data.totals.jobs}</h3></article>
            <article class="stat-card"><p>Total Applications</p><h3>${data.totals.applications}</h3></article>
        `;

        objectToCards("usersByRole", data.users_by_role);
        objectToCards("applicationsByStatus", data.applications_by_status);

        const recentJobs = data.recent_jobs || [];
        document.getElementById("recentJobs").innerHTML = recentJobs.length
            ? recentJobs
                .map((job) => `
                    <article class="list-card">
                        <h4>${job.title}</h4>
                        <p>${job.location || "NA"} | ${job.mode || "NA"} | ${job.status}</p>
                    </article>
                `)
                .join("")
            : "<p class='empty-state'>No recent jobs.</p>";

        const users = data.users || [];
        document.getElementById("allUsers").innerHTML = users.length
            ? users
                .map((user) => `
                    <article class="list-card">
                        <h4>${safeText(user.name, "Unnamed User")}</h4>
                        <p>Email: ${safeText(user.email)}</p>
                        <p>Role: ${safeText(user.role)}</p>
                        <p>Phone: ${safeText(user.phone)}</p>
                    </article>
                `)
                .join("")
            : "<p class='empty-state'>No users found.</p>";

        const recruiters = data.recruiters || [];
        document.getElementById("recruiterDetails").innerHTML = recruiters.length
            ? recruiters
                .map((recruiter) => `
                    <article class="list-card">
                        <h4>${safeText(recruiter.name, "Unnamed Recruiter")}</h4>
                        <p>Email: ${safeText(recruiter.email)}</p>
                        <p>Phone: ${safeText(recruiter.phone)}</p>
                        <p>Jobs Posted: ${safeText(recruiter.jobs_posted, "0")}</p>
                        <p>Applications Received: ${safeText(recruiter.applications_received, "0")}</p>
                    </article>
                `)
                .join("")
            : "<p class='empty-state'>No recruiters found.</p>";
    } catch (error) {
        document.getElementById("adminStats").innerHTML = `<p class="empty-state">${error.message}</p>`;
    }
}

loadAdminOverview();
