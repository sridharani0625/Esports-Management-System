import { useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [mode, setMode] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [username, setUsername] = useState("");
  const [role, setRole] = useState("PLAYER");

  const [message, setMessage] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);

  async function handleLogin(event) {
    event.preventDefault();
    setMessage("");

    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

      localStorage.setItem("access_token", response.data.access_token);

      setLoggedInUser(response.data);

      setMessage("Login successful!");
    } catch (error) {
      setMessage(
        error.response?.data?.detail || "Login failed"
      );
    }
  }

  async function handleSignup(event) {
    event.preventDefault();
    setMessage("");

    try {
      const response = await axios.post(`${API_URL}/signup`, {
        username,
        email,
        password,
        role,
      });

      setMessage(response.data.message);

      setMode("login");
      setPassword("");
    } catch (error) {
      setMessage(
        error.response?.data?.detail || "Signup failed"
      );
    }
  }

  function logout() {
    localStorage.removeItem("access_token");
    setLoggedInUser(null);
    setEmail("");
    setPassword("");
    setMessage("");
  }

  if (loggedInUser) {
    return (
      <div className="app">
        <div className="dashboard">
          <h1>Secure Esports Management System</h1>

          <div className="user-card">
            <h2>Welcome, {loggedInUser.username}</h2>

            <p>
              <strong>Email:</strong> {loggedInUser.email}
            </p>

            <p>
              <strong>Role:</strong>{" "}
              <span className="role">
                {loggedInUser.role}
              </span>
            </p>
          </div>

          {loggedInUser.role === "ADMIN" && (
            <div className="module">
              <h2>Admin Dashboard</h2>
              <p>Manage users</p>
              <p>View tournaments</p>
              <p>View audit logs</p>
              <p>Manage organizers</p>
              <p>Control system settings</p>
            </div>
          )}

          {loggedInUser.role === "ORGANIZER" && (
            <div className="module">
              <h2>Organizer Dashboard</h2>
              <p>Create tournaments</p>
              <p>Manage registered teams</p>
              <p>Schedule matches</p>
              <p>Publish match results</p>
            </div>
          )}

          {loggedInUser.role === "PLAYER" && (
            <div className="module">
              <h2>Player Dashboard</h2>
              <p>Register a team</p>
              <p>View tournaments</p>
              <p>View schedules</p>
              <p>View match results</p>
              <p>View leaderboard</p>
            </div>
          )}

          <button onClick={logout}>Logout</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="auth-container">

        <h1>Secure Esports Management System</h1>

        <div className="tabs">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
          >
            Login
          </button>

          <button
            className={mode === "signup" ? "active" : ""}
            onClick={() => {
              setMode("signup");
              setMessage("");
            }}
          >
            Signup
          </button>
        </div>

        {mode === "login" ? (
          <form onSubmit={handleLogin}>

            <h2>Login</h2>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
            />

            <button type="submit">
              Login
            </button>

          </form>
        ) : (
          <form onSubmit={handleSignup}>

            <h2>Create Account</h2>

            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              required
            />

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
            />

            <select
              value={role}
              onChange={(event) =>
                setRole(event.target.value)
              }
            >
              <option value="PLAYER">
                Player
              </option>

              <option value="ORGANIZER">
                Tournament Organizer
              </option>

              <option value="ADMIN">
                Admin
              </option>
            </select>

            <button type="submit">
              Signup
            </button>

          </form>
        )}

        {message && (
          <div className="message">
            {message}
          </div>
        )}

      </div>
    </div>
  );
}

export default App;