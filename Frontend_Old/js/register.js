document.getElementById("registerForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;
    const rawPhone = document.getElementById("phone").value;
    const digits = rawPhone.replace(/\D/g, "");
    let phone = "";
    const passwordRule = /^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

    if (!passwordRule.test(password)) {
        alert("Password must be at least 8 characters and include at least 1 number and 1 special character.");
        return;
    }

    if (digits.length === 10) {
        phone = `+91${digits}`;
    } else if (digits.length === 12 && digits.startsWith("91")) {
        phone = `+${digits}`;
    } else {
        alert("Enter a valid 10-digit phone number");
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:8000/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                email: email,
                password: password,
                role: role,
                phone: phone
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Registration successful!");
            window.location.href = "index.html";
        } else {
            alert(data.detail || "Registration failed");
        }

    } catch (error) {
        alert("Server error");
        console.error(error);
    }
});
