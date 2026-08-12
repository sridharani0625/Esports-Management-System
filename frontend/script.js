const API_URL = "http://127.0.0.1:8000";

// =========================
// MODULE 1 - LOGIN
// =========================

async function login() {

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {

        const response = await fetch(`${API_URL}/login`, {
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

            // Save JWT token
            if (data.access_token) {
                localStorage.setItem("access_token", data.access_token);
            }

            // Save user role
            localStorage.setItem("role", data.role);

            // Save username and email
            localStorage.setItem("username", data.username);
            localStorage.setItem("email", data.email);

            document.getElementById("loginMessage").innerText =
                "Login successful!";

            // Redirect based on user role
            setTimeout(() => {

                if (data.role === "ADMIN") {

                    window.location.href = "admin.html";

                } else if (data.role === "ORGANIZER") {

                    window.location.href = "tournament.html";

                } else {

                    window.location.href = "player.html";
                }

            }, 500);

        } else {

            document.getElementById("loginMessage").innerText =
                data.detail || "Login failed.";
        }

    } catch (error) {

        document.getElementById("loginMessage").innerText =
            "Cannot connect to backend.";

        console.error(error);
    }
}


// =========================
// MODULE 1 - SIGNUP
// =========================

async function signup() {

    const username = document.getElementById("signupUsername").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    try {

        const response = await fetch(`${API_URL}/signup`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username: username,
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok) {

            document.getElementById("signupMessage").innerText =
                "Signup successful! You can now login.";

        } else {

            document.getElementById("signupMessage").innerText =
                data.detail || "Signup failed.";
        }

    } catch (error) {

        document.getElementById("signupMessage").innerText =
            "Cannot connect to backend.";

        console.error(error);
    }
}


// =========================
// MODULE 2 - CREATE TOURNAMENT
// =========================

async function createTournament() {

    const name = document.getElementById("tournamentName").value;
    const game = document.getElementById("game").value;
    const description = document.getElementById("description").value;
    const organizerId = document.getElementById("organizerId").value;

    try {

        const response = await fetch(`${API_URL}/tournaments/`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name: name,
                game: game,
                description: description,
                organizer_id: Number(organizerId)
            })
        });

        const data = await response.json();

        if (response.ok) {

            document.getElementById("tournamentMessage").innerText =
                "Tournament created successfully!";

        } else {

            document.getElementById("tournamentMessage").innerText =
                data.detail || "Tournament creation failed.";
        }

    } catch (error) {

        document.getElementById("tournamentMessage").innerText =
            "Cannot connect to backend.";

        console.error(error);
    }
}


// =========================
// MODULE 2 - VIEW TOURNAMENTS
// =========================

async function getTournaments() {

    try {

        const response = await fetch(`${API_URL}/tournaments/`);

        const data = await response.json();

        const list = document.getElementById("tournamentList");

        list.innerHTML = "";

        if (data.length === 0) {

            list.innerHTML = "<p>No tournaments found.</p>";

            return;
        }

        data.forEach(tournament => {

            const div = document.createElement("div");

            div.className = "tournament";

            div.innerHTML = `
                <strong>${tournament.name}</strong><br>
                Game: ${tournament.game}<br>
                Description: ${tournament.description}<br>
                Organizer ID: ${tournament.organizer_id}<br>
                Status: ${tournament.status}
            `;

            list.appendChild(div);
        });

    } catch (error) {

        document.getElementById("tournamentMessage").innerText =
            "Cannot connect to backend.";

        console.error(error);
    }
}