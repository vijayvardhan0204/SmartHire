import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import '../styles/dashboard.css';

const API_BASE = import.meta.env.VITE_API_URL;

const validRoles = ["admin", "recruiter", "candidate"];

const safeText = (value, fallback = "NA") => {
    if (value === null || typeof value === "undefined" || value === "") {
        return fallback;
    }
    return value;
};

const formatRole = (role) => {
    return role ? role.charAt(0).toUpperCase() + role.slice(1) : "";
};

const AdminUsers = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const roleParam = (searchParams.get("role") || "").toLowerCase();
    const currentRole = validRoles.includes(roleParam) ? roleParam : null;

    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);
    const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
    
    // Create Admin State
    const [createForm, setCreateForm] = useState({
        name: '', email: '', phone: '', password: ''
    });
    const [createMessage, setCreateMessage] = useState({ text: '', isError: false });

    const checkAuth = useCallback(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");
        if (!token || (role || "").toLowerCase() !== "admin") {
            navigate("/");
            return false;
        }
        return token;
    }, [navigate]);

    const loadUsers = useCallback(async () => {
        const token = checkAuth();
        if (!token || !currentRole) return;

        try {
            const response = await fetch(`${API_BASE}/admin/overview`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || "Failed to load users");

            const filteredUsers = (data.users || []).filter(
                (user) => (user.role || "").toLowerCase() === currentRole
            );
            setUsers(filteredUsers);
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    }, [checkAuth, currentRole]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/");
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        setCreateMessage({ text: '', isError: false });

        const payload = {
            name: createForm.name.trim(),
            email: createForm.email.trim(),
            phone: createForm.phone.trim(),
            password: createForm.password,
            role: "admin"
        };
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(`${API_BASE}/users/admin/create`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.detail || "Failed to create admin");
            }

            setCreateForm({ name: '', email: '', phone: '', password: '' });
            setCreateMessage({ text: "Admin created successfully.", isError: false });

            if (currentRole === "admin") {
                loadUsers();
            }
        } catch (err) {
            setCreateMessage({ text: err.message, isError: true });
        }
    };

    return (
        <>
            <header className="navbar">
                <h2>{currentRole ? `${formatRole(currentRole)} Users` : "Users"}</h2>
                <div className="navbar-actions">
                    <Link className="nav-link-btn" to="/admin-dashboard">Back to Dashboard</Link>
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <main className="dashboard-shell">
                <section className="panel">
                    <div className="panel-head">
                        <h3>{currentRole ? `${formatRole(currentRole)} Users` : "Role Users"}</h3>
                        {currentRole === "admin" && (
                            <button 
                                className="btn-inline" 
                                type="button" 
                                onClick={() => setIsCreatePanelOpen(!isCreatePanelOpen)}
                            >
                                {isCreatePanelOpen ? "Close" : "Create Admin"}
                            </button>
                        )}
                    </div>

                    <div className="stack-list">
                        {!currentRole ? (
                            <p className='empty-state'>Invalid role selected.</p>
                        ) : error ? (
                            <p className='empty-state'>{error}</p>
                        ) : users.length > 0 ? (
                            users.map((user, idx) => (
                                <article className="list-card" key={idx}>
                                    <h4>{safeText(user.name, "Unnamed User")}</h4>
                                    <p>Email: {safeText(user.email)}</p>
                                    <p>Role: {safeText(user.role)}</p>
                                    <p>Phone: {safeText(user.phone)}</p>
                                </article>
                            ))
                        ) : (
                            <p className='empty-state'>No {currentRole} users found.</p>
                        )}
                    </div>
                </section>

                {currentRole === "admin" && isCreatePanelOpen && (
                    <section className="panel">
                        <div className="panel-head">
                            <h3>New Admin</h3>
                        </div>
                        <form className="grid-form" onSubmit={handleCreateAdmin}>
                            <input 
                                type="text"
                                placeholder="Name" 
                                required 
                                value={createForm.name}
                                onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                            />
                            <input 
                                type="email" 
                                placeholder="Email" 
                                required 
                                value={createForm.email}
                                onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                            />
                            <input 
                                type="text" 
                                placeholder="Phone Number" 
                                required 
                                value={createForm.phone}
                                onChange={(e) => setCreateForm({...createForm, phone: e.target.value})}
                            />
                            <input 
                                type="password" 
                                placeholder="Password" 
                                required 
                                value={createForm.password}
                                onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                            />
                            <button className="btn-inline create-submit-btn" type="submit">Create</button>
                            {createMessage.text && (
                                <p className="empty-state" style={{color: createMessage.isError ? "#8b1e1e" : "#1d6b35"}}>
                                    {createMessage.text}
                                </p>
                            )}
                        </form>
                    </section>
                )}
            </main>
        </>
    );
};

export default AdminUsers;
