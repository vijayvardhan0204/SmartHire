const API_BASE = "http://127.0.0.1:8000";
const authToken = localStorage.getItem("token");
const validRoles = ["admin", "recruiter", "candidate"];
let currentRole = null;

function safeText(value, fallback = "NA") {
    if (value === null || typeof value === "undefined" || value === "") {
        return fallback;
    }
    return value;
}

function formatRole(role) {
    return role.charAt(0).toUpperCase() + role.slice(1);
}

function getRoleFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const role = (params.get("role") || "").toLowerCase();
    return validRoles.includes(role) ? role : null;
}

async function loadRoleUsers() {
    const role = getRoleFromQuery();
    currentRole = role;
    const listContainer = document.getElementById("roleUsersList");

    if (!role) {
        listContainer.innerHTML = "<p class='empty-state'>Invalid role selected.</p>";
        return;
    }

    document.getElementById("rolePageTitle").textContent = `${formatRole(role)} Users`;
    document.getElementById("roleListHeading").textContent = `${formatRole(role)} Users`;

    try {
        const response = await fetch(`${API_BASE}/admin/overview`, {
            headers: {
                "Authorization": `Bearer ${authToken}`
            }
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || "Failed to load users");
        }

        const users = (data.users || []).filter(
            (user) => (user.role || "").toLowerCase() === role
        );

        listContainer.innerHTML = users.length
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
            : `<p class='empty-state'>No ${role} users found.</p>`;
    } catch (error) {
        listContainer.innerHTML = `<p class='empty-state'>${error.message}</p>`;
    }
}

loadRoleUsers();

function setCreateAdminUIVisible(isVisible) {
    const createButton = document.getElementById("createAdminBtn");
    const createPanel = document.getElementById("createAdminPanel");
    createButton.style.display = isVisible ? "inline-flex" : "none";
    createPanel.style.display = "none";
}

function showCreateAdminMessage(message, isError = false) {
    const messageBox = document.getElementById("createAdminMessage");
    messageBox.style.display = "block";
    messageBox.textContent = message;
    messageBox.style.color = isError ? "#8b1e1e" : "#1d6b35";
}

function setupCreateAdminActions() {
    const createButton = document.getElementById("createAdminBtn");
    const createPanel = document.getElementById("createAdminPanel");
    const createForm = document.getElementById("createAdminForm");

    createButton.addEventListener("click", () => {
        const isHidden = createPanel.style.display === "none";
        createPanel.style.display = isHidden ? "block" : "none";
    });

    createForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const messageBox = document.getElementById("createAdminMessage");
        messageBox.style.display = "none";

        const payload = {
            name: document.getElementById("adminName").value.trim(),
            email: document.getElementById("adminEmail").value.trim(),
            phone: document.getElementById("adminPhone").value.trim(),
            password: document.getElementById("adminPassword").value,
            role: "admin"
        };

        try {
            const response = await fetch(`${API_BASE}/users/admin/create`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${authToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || "Failed to create admin");
            }

            createForm.reset();
            showCreateAdminMessage("Admin created successfully.");

            if (currentRole === "admin") {
                loadRoleUsers();
            }
        } catch (error) {
            showCreateAdminMessage(error.message, true);
        }
    });
}

setupCreateAdminActions();
setCreateAdminUIVisible(getRoleFromQuery() === "admin");
