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

            localStorage.setItem("access_token", data.access_token);

            document.getElementById("loginMessage").innerText =
                "Login successful! JWT token received.";

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
// VIEW TOURNAMENTS
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