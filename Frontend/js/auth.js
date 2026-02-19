document.getElementById("loginForm").addEventListener("submit", async function(e) {
e.preventDefault();


const email = document.getElementById("email").value;
const password = document.getElementById("password").value;

try {
    const response = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    });

    const data = await response.json();

    if (response.ok) {

        // ✅ Store JWT Token
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("role", data.role);
        console.log(data);
        // alert("Role from backend: " + data.role);



        // ✅ Redirect based on role
        if (data.role === "candidate") {
            window.location.href = "dashboard.html";
        } else if (data.role === "recruiter") {
            window.location.href = "recruiter.html";
        } else if (data.role === "admin") {
            window.location.href = "admin-dashboard.html";
        } else {
            window.location.href = "index.html";
        }

    } else {
        alert(data.detail || "Login failed");
    }

} catch (error) {
    alert("Server error");
    console.error(error);
}


});
