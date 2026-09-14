import { useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [page, setPage] = useState("login");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("PLAYER");

  const [user, setUser] = useState(null);

  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [registrations, setRegistrations] = useState([]);

  const [selectedTournament, setSelectedTournament] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedTeam2, setSelectedTeam2] = useState("");
  const [matchDate, setMatchDate] = useState("");

  const [selectedMatch, setSelectedMatch] = useState("");
  const [winnerId, setWinnerId] = useState("");
  const [result, setResult] = useState("");

  const [name, setName] = useState("");
  const [game, setGame] = useState("");
  const [description, setDescription] = useState("");

  const [teamName, setTeamName] = useState("");

  const [message, setMessage] = useState("");

  // =========================
  // SIGNUP
  // =========================

  const signup = async () => {
    try {
      const response = await axios.post(`${API_URL}/users/signup`, {
        username,
        email,
        password,
        role,
      });

      setMessage(response.data.message);

      setUsername("");
      setEmail("");
      setPassword("");

      setTimeout(() => {
        setPage("login");
        setMessage("");
      }, 1000);
    } catch (error) {
      setMessage(
        error.response?.data?.detail || "Signup failed"
      );
    }
  };

  // =========================
  // LOGIN
  // =========================

  const login = async () => {
    try {
      const response = await axios.post(`${API_URL}/users/login`, {
        email,
        password,
      });

      setUser(response.data);

      setMessage("Login successful");

      setEmail("");
      setPassword("");

      setPage("dashboard");
    } catch (error) {
      setMessage(
        error.response?.data?.detail || "Login failed"
      );
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const logout = () => {
    setUser(null);
    setPage("login");
    setMessage("");
  };

  // =========================
  // TOURNAMENTS
  // =========================

  const openTournaments = async () => {
    try {
      const response = await axios.get(`${API_URL}/tournaments/`);

      setTournaments(response.data);
      setPage("tournaments");
      setMessage("");
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Could not load tournaments"
      );
    }
  };

  const createTournament = async () => {
    if (!name || !game) {
      setMessage("Please enter tournament name and game");
      return;
    }

    try {
      await axios.post(`${API_URL}/tournaments/`, {
        name,
        game,
        description,
        organizer_id: user.user_id,
      });

      setMessage("Tournament created successfully");

      setName("");
      setGame("");
      setDescription("");

      openTournaments();
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Could not create tournament"
      );
    }
  };

  // =========================
  // TEAMS
  // =========================

  const openTeams = async () => {
    try {
      const response = await axios.get(`${API_URL}/teams/`);

      setTeams(response.data);
      setPage("teams");
      setMessage("");
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Could not load teams"
      );
    }
  };

  const createTeam = async () => {
    if (!teamName) {
      setMessage("Please enter team name");
      return;
    }

    try {
      await axios.post(`${API_URL}/teams/`, {
        name: teamName,
        manager_id: user.user_id,
      });

      setMessage("Team created successfully");

      setTeamName("");

      openTeams();
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Could not create team"
      );
    }
  };

  // =========================
  // REGISTER TEAM
  // =========================

  const openRegisterPage = async () => {
    try {
      const tournamentResponse = await axios.get(
        `${API_URL}/tournaments/`
      );

      setTournaments(tournamentResponse.data);

      const teamResponse = await axios.get(
        `${API_URL}/teams/`
      );

      setTeams(teamResponse.data);

      setPage("registerTeam");
      setMessage("");
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Could not load registration data"
      );
    }
  };

  const registerTeam = async () => {
    if (!selectedTournament || !selectedTeam) {
      setMessage(
        "Please select tournament and team"
      );
      return;
    }

    try {
      await axios.post(`${API_URL}/registrations/`, {
        tournament_id: Number(selectedTournament),
        team_id: Number(selectedTeam),
      });

      setMessage(
        "Team registration submitted successfully"
      );

      setSelectedTournament("");
      setSelectedTeam("");
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Could not register team"
      );
    }
  };

  // =========================
  // MANAGE REGISTRATIONS
  // =========================

  const openManageRegistrations = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/registrations/`
      );

      setRegistrations(response.data);
      setPage("registrations");
      setMessage("");
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Could not load registrations"
      );
    }
  };

  const approveRegistration = async (registrationId) => {
    try {
      await axios.put(
        `${API_URL}/registrations/${registrationId}/approve`
      );

      setMessage(
        "Registration approved successfully"
      );

      openManageRegistrations();
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Could not approve registration"
      );
    }
  };

  // =========================
  // MATCHES
  // =========================

  const openMatches = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/matches/`
      );

      setMatches(response.data);
      setPage("matches");
      setMessage("");
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Could not load matches"
      );
    }
  };

  // =========================
  // LEADERBOARD
  // =========================

  const openLeaderboard = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/leaderboard/`
      );

      setLeaderboard(response.data);
      setPage("leaderboard");
      setMessage("");
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Could not load leaderboard"
      );
    }
  };

  // =========================
  // SCHEDULE MATCH
  // =========================

  const openSchedulePage = async () => {
    try {
      const tournamentResponse = await axios.get(
        `${API_URL}/tournaments/`
      );

      setTournaments(tournamentResponse.data);

      const teamResponse = await axios.get(
        `${API_URL}/teams/`
      );

      setTeams(teamResponse.data);

      const registrationResponse = await axios.get(
        `${API_URL}/registrations/`
      );

      setRegistrations(registrationResponse.data);

      setPage("scheduleMatch");
      setMessage("");
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Could not load scheduling data"
      );
    }
  };

  const scheduleMatch = async () => {
    if (
      !selectedTournament ||
      !selectedTeam ||
      !selectedTeam2 ||
      !matchDate
    ) {
      setMessage(
        "Please select tournament, both teams and match date"
      );
      return;
    }

    if (selectedTeam === selectedTeam2) {
      setMessage(
        "A team cannot play against itself"
      );
      return;
    }

    try {
      await axios.post(`${API_URL}/matches/`, {
        tournament_id: Number(selectedTournament),
        team1_id: Number(selectedTeam),
        team2_id: Number(selectedTeam2),
        match_date: matchDate,
      });

      setMessage(
        "Match scheduled successfully"
      );

      setSelectedTournament("");
      setSelectedTeam("");
      setSelectedTeam2("");
      setMatchDate("");

      openMatches();
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Could not schedule match"
      );
    }
  };

  // =========================
  // ENTER MATCH RESULT
  // =========================

 const openResultPage = async () => {
  try {
    const matchResponse = await axios.get(
      `${API_URL}/matches/`
    );

    const teamResponse = await axios.get(
      `${API_URL}/teams/`
    );

    setMatches(matchResponse.data);
    setTeams(teamResponse.data);

    setPage("matchResult");
    setMessage("");
  } catch (error) {
    setMessage(
      error.response?.data?.detail ||
        "Could not load match result data"
    );
  }
};

  const enterMatchResult = async () => {
    if (!selectedMatch || !winnerId || !result) {
      setMessage(
        "Please select a match, winner and enter the result"
      );
      return;
    }

    try {
      await axios.put(
        `${API_URL}/matches/${selectedMatch}/result`,
        {
          winner_id: Number(winnerId),
          result: result,
        }
      );

      setMessage(
        "Match result entered successfully"
      );

      setSelectedMatch("");
      setWinnerId("");
      setResult("");

      const response = await axios.get(
        `${API_URL}/matches/`
      );

      setMatches(response.data);
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Could not enter match result"
      );
    }
  };

  // =========================
  // LOGIN PAGE
  // =========================

  if (page === "login") {
    return (
      <div className="container mt-5">
        <div className="card p-4 mx-auto" style={{ maxWidth: "500px" }}>
          <h2 className="text-center mb-4">
            Esports Management System
          </h2>

          <h4>Login</h4>

          <input
            className="form-control mb-3"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="form-control mb-3"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            className="btn btn-primary mb-2"
            onClick={login}
          >
            Login
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => {
              setPage("signup");
              setMessage("");
            }}
          >
            Create Account
          </button>

          {message && (
            <div className="alert alert-info mt-3">
              {message}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================
  // SIGNUP PAGE
  // =========================

  if (page === "signup") {
    return (
      <div className="container mt-5">
        <div className="card p-4 mx-auto" style={{ maxWidth: "500px" }}>
          <h2 className="text-center mb-4">
            Create Account
          </h2>

          <input
            className="form-control mb-3"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className="form-control mb-3"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="form-control mb-3"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <select
            className="form-select mb-3"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="PLAYER">PLAYER</option>
            <option value="ORGANIZER">ORGANIZER</option>
            <option value="ADMIN">ADMIN</option>
          </select>

          <button
            className="btn btn-success mb-2"
            onClick={signup}
          >
            Sign Up
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => {
              setPage("login");
              setMessage("");
            }}
          >
            Back to Login
          </button>

          {message && (
            <div className="alert alert-info mt-3">
              {message}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================
  // DASHBOARD
  // =========================

  if (page === "dashboard") {
    return (
      <div className="container mt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>Esports Dashboard</h2>
            <p>
              Welcome, <strong>{user.username}</strong>
            </p>
            <span className="badge bg-primary">
              {user.role}
            </span>
          </div>

          <button
            className="btn btn-danger"
            onClick={logout}
          >
            Logout
          </button>
        </div>

        {message && (
          <div className="alert alert-info">
            {message}
          </div>
        )}

        <div className="card p-4">
          <h4>General</h4>

          <button
            className="btn btn-primary m-2"
            onClick={openTournaments}
          >
            View Tournaments
          </button>

          <button
            className="btn btn-primary m-2"
            onClick={openTeams}
          >
            View Teams
          </button>

          <button
            className="btn btn-primary m-2"
            onClick={openMatches}
          >
            View Matches
          </button>

          <button
            className="btn btn-primary m-2"
            onClick={openLeaderboard}
          >
            View Leaderboard
          </button>

          {user.role === "PLAYER" && (
            <>
              <hr />

              <h4>Player</h4>

              <button
                className="btn btn-success m-2"
                onClick={openRegisterPage}
              >
                Register Team
              </button>

              <button
                className="btn btn-success m-2"
                onClick={() => setPage("createTeam")}
              >
                Create Team
              </button>
            </>
          )}

          {user.role === "ORGANIZER" && (
            <>
              <hr />

              <h4>Organizer</h4>

              <button
                className="btn btn-success m-2"
                onClick={() => setPage("createTournament")}
              >
                Create Tournament
              </button>

              <button
                className="btn btn-warning m-2"
                onClick={openManageRegistrations}
              >
                Manage Registrations
              </button>

              <button
                className="btn btn-info m-2"
                onClick={openSchedulePage}
              >
                Schedule Matches
              </button>

              <button
                className="btn btn-warning m-2"
                onClick={openResultPage}
              >
                Enter Match Result
              </button>
            </>
          )}

          {user.role === "ADMIN" && (
            <>
              <hr />

              <h4>Admin</h4>

              <button
                className="btn btn-dark m-2"
                onClick={() =>
                  setMessage(
                    "Admin panel will be added soon"
                  )
                }
              >
                Admin Panel
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // =========================
  // TOURNAMENT PAGE
  // =========================

  if (page === "tournaments") {
    return (
      <div className="container mt-5">
        <h2>Tournaments</h2>

        {tournaments.length === 0 ? (
          <p>No tournaments found.</p>
        ) : (
          tournaments.map((tournament) => (
            <div
              className="card p-3 mb-3"
              key={tournament.id}
            >
              <h4>{tournament.name}</h4>
              <p>
                <strong>Game:</strong>{" "}
                {tournament.game}
              </p>
              <p>
                <strong>Description:</strong>{" "}
                {tournament.description}
              </p>
              <span className="badge bg-info">
                {tournament.status}
              </span>
            </div>
          ))
        )}

        <button
          className="btn btn-secondary"
          onClick={() => setPage("dashboard")}
        >
          Back
        </button>
      </div>
    );
  }

  // =========================
  // CREATE TOURNAMENT
  // =========================

  if (page === "createTournament") {
    return (
      <div className="container mt-5">
        <div className="card p-4">
          <h2>Create Tournament</h2>

          <input
            className="form-control mb-3"
            placeholder="Tournament Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="form-control mb-3"
            placeholder="Game"
            value={game}
            onChange={(e) => setGame(e.target.value)}
          />

          <textarea
            className="form-control mb-3"
            placeholder="Description"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
          />

          <button
            className="btn btn-success"
            onClick={createTournament}
          >
            Create Tournament
          </button>

          <button
            className="btn btn-secondary mt-2"
            onClick={() => setPage("dashboard")}
          >
            Back
          </button>

          {message && (
            <div className="alert alert-info mt-3">
              {message}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================
  // TEAMS PAGE
  // =========================

  if (page === "teams") {
    return (
      <div className="container mt-5">
        <h2>Teams</h2>

        {teams.length === 0 ? (
          <p>No teams found.</p>
        ) : (
          teams.map((team) => (
            <div
              className="card p-3 mb-3"
              key={team.id}
            >
              <h4>{team.name}</h4>
              <p>
                Team ID: {team.id}
              </p>
              <p>
                Manager ID: {team.manager_id}
              </p>
            </div>
          ))
        )}

        <button
          className="btn btn-secondary"
          onClick={() => setPage("dashboard")}
        >
          Back
        </button>
      </div>
    );
  }

  // =========================
  // CREATE TEAM
  // =========================

  if (page === "createTeam") {
    return (
      <div className="container mt-5">
        <div className="card p-4">
          <h2>Create Team</h2>

          <input
            className="form-control mb-3"
            placeholder="Team Name"
            value={teamName}
            onChange={(e) =>
              setTeamName(e.target.value)
            }
          />

          <button
            className="btn btn-success"
            onClick={createTeam}
          >
            Create Team
          </button>

          <button
            className="btn btn-secondary mt-2"
            onClick={() => setPage("dashboard")}
          >
            Back
          </button>

          {message && (
            <div className="alert alert-info mt-3">
              {message}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================
  // REGISTER TEAM PAGE
  // =========================

  if (page === "registerTeam") {
    return (
      <div className="container mt-5">
        <div className="card p-4">
          <h2>Register Team</h2>

          <select
            className="form-select mb-3"
            value={selectedTournament}
            onChange={(e) =>
              setSelectedTournament(e.target.value)
            }
          >
            <option value="">
              Select Tournament
            </option>

            {tournaments.map((tournament) => (
              <option
                key={tournament.id}
                value={tournament.id}
              >
                {tournament.name}
              </option>
            ))}
          </select>

          <select
            className="form-select mb-3"
            value={selectedTeam}
            onChange={(e) =>
              setSelectedTeam(e.target.value)
            }
          >
            <option value="">
              Select Team
            </option>

            {teams.map((team) => (
              <option
                key={team.id}
                value={team.id}
              >
                {team.name}
              </option>
            ))}
          </select>

          <button
            className="btn btn-success"
            onClick={registerTeam}
          >
            Register Team
          </button>

          <button
            className="btn btn-secondary mt-2"
            onClick={() => setPage("dashboard")}
          >
            Back
          </button>

          {message && (
            <div className="alert alert-info mt-3">
              {message}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================
  // REGISTRATIONS PAGE
  // =========================

  if (page === "registrations") {
    return (
      <div className="container mt-5">
        <h2>Team Registrations</h2>

        {registrations.length === 0 ? (
          <p>No registrations found.</p>
        ) : (
          registrations.map((registration) => (
            <div
              className="card p-3 mb-3"
              key={registration.id}
            >
              <p>
                <strong>Registration ID:</strong>{" "}
                {registration.id}
              </p>

              <p>
                <strong>Tournament:</strong>{" "}
                {registration.tournament_name}
              </p>

              <p>
                <strong>Team:</strong>{" "}
                {registration.team_name}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {registration.status}
              </p>

              {registration.status === "pending" && (
                <button
                  className="btn btn-success"
                  onClick={() =>
                    approveRegistration(
                      registration.id
                    )
                  }
                >
                  Approve
                </button>
              )}
            </div>
          ))
        )}

        <button
          className="btn btn-secondary"
          onClick={() => setPage("dashboard")}
        >
          Back
        </button>

        {message && (
          <div className="alert alert-info mt-3">
            {message}
          </div>
        )}
      </div>
    );
  }

  // =========================
  // MATCHES PAGE
  // =========================

  if (page === "matches") {
    return (
      <div className="container mt-5">
        <h2>Matches</h2>

        {matches.length === 0 ? (
          <p>No matches found.</p>
        ) : (
          matches.map((match) => (
            <div
              className="card p-3 mb-3"
              key={match.id}
            >
              <h4>
                {match.team1_name} vs{" "}
                {match.team2_name}
              </h4>

              <p>
                <strong>Tournament:</strong>{" "}
                {match.tournament_name}
              </p>

              <p>
                <strong>Game:</strong>{" "}
                {match.game}
              </p>

              <p>
                <strong>Date:</strong>{" "}
                {match.match_date}
              </p>

              <p>
                <strong>Result:</strong>{" "}
                {match.result || "Not completed"}
              </p>

              <p>
                <strong>Winner:</strong>{" "}
                {match.winner_name || "Not decided"}
              </p>
            </div>
          ))
        )}

        <button
          className="btn btn-secondary"
          onClick={() => setPage("dashboard")}
        >
          Back
        </button>
      </div>
    );
  }

  // =========================
  // SCHEDULE MATCH PAGE
  // =========================

  if (page === "scheduleMatch") {
    const approvedRegistrations =
      registrations.filter(
        (registration) =>
          registration.status === "approved"
      );

    const approvedTeams =
      approvedRegistrations
        .map((registration) =>
          teams.find(
            (team) =>
              team.id === registration.team_id
          )
        )
        .filter(Boolean);

    return (
      <div className="container mt-5">
        <div className="card p-4">
          <h2>Schedule Match</h2>

          <select
            className="form-select mb-3"
            value={selectedTournament}
            onChange={(e) =>
              setSelectedTournament(e.target.value)
            }
          >
            <option value="">
              Select Tournament
            </option>

            {tournaments.map((tournament) => (
              <option
                key={tournament.id}
                value={tournament.id}
              >
                {tournament.name}
              </option>
            ))}
          </select>

          <select
            className="form-select mb-3"
            value={selectedTeam}
            onChange={(e) =>
              setSelectedTeam(e.target.value)
            }
          >
            <option value="">
              Select Team 1
            </option>

            {approvedTeams.map((team) => (
              <option
                key={team.id}
                value={team.id}
              >
                {team.name}
              </option>
            ))}
          </select>

          <select
            className="form-select mb-3"
            value={selectedTeam2}
            onChange={(e) =>
              setSelectedTeam2(e.target.value)
            }
          >
            <option value="">
              Select Team 2
            </option>

            {approvedTeams.map((team) => (
              <option
                key={team.id}
                value={team.id}
              >
                {team.name}
              </option>
            ))}
          </select>

          <input
            type="datetime-local"
            className="form-control mb-3"
            value={matchDate}
            onChange={(e) =>
              setMatchDate(e.target.value)
            }
          />

          <button
            className="btn btn-success"
            onClick={scheduleMatch}
          >
            Schedule Match
          </button>

          <button
            className="btn btn-secondary mt-2"
            onClick={() => setPage("dashboard")}
          >
            Back
          </button>

          {message && (
            <div className="alert alert-info mt-3">
              {message}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================
  // ENTER MATCH RESULT PAGE
  // =========================

  if (page === "matchResult") {
    return (
      <div className="container mt-5">
        <div className="card p-4">
          <h2>Enter Match Result</h2>

          <select
            className="form-select mb-3"
            value={selectedMatch}
            onChange={(e) => {
              setSelectedMatch(e.target.value);
              setWinnerId("");
            }}
          >
            <option value="">
              Select Match
            </option>

            {matches
              .filter((match) => !match.winner_name)
              .map((match) => (
                <option
                  key={match.id}
                  value={match.id}
                >
                  {match.team1_name} vs{" "}
                  {match.team2_name}
                </option>
              ))}
          </select>

          {selectedMatch && (
            <>
              {(() => {
                const match = matches.find(
                  (m) =>
                    m.id === Number(selectedMatch)
                );

                if (!match) return null;

                return (
                  <select
                    className="form-select mb-3"
                    value={winnerId}
                    onChange={(e) =>
                      setWinnerId(e.target.value)
                    }
                  >
                    <option value="">
                      Select Winner
                    </option>

                    {teams
                      .filter(
                        (team) =>
                          team.name ===
                            match.team1_name ||
                          team.name ===
                            match.team2_name
                      )
                      .map((team) => (
                        <option
                          key={team.id}
                          value={team.id}
                        >
                          {team.name}
                        </option>
                      ))}
                  </select>
                );
              })()}
            </>
          )}

          <input
            className="form-control mb-3"
            placeholder="Result e.g. 2-1"
            value={result}
            onChange={(e) =>
              setResult(e.target.value)
            }
          />

          <button
            className="btn btn-success"
            onClick={enterMatchResult}
          >
            Submit Result
          </button>

          <button
            className="btn btn-secondary mt-2"
            onClick={() => setPage("dashboard")}
          >
            Back
          </button>

          {message && (
            <div className="alert alert-info mt-3">
              {message}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================
  // LEADERBOARD PAGE
  // =========================

  if (page === "leaderboard") {
    return (
      <div className="container mt-5">
        <h2>Leaderboard</h2>

        {leaderboard.length === 0 ? (
          <p>No leaderboard data found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-striped">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Tournament</th>
                  <th>Team</th>
                  <th>Points</th>
                  <th>Wins</th>
                  <th>Losses</th>
                </tr>
              </thead>

              <tbody>
                {leaderboard.map((row) => (
                  <tr key={row.id}>
                    <td>{row.rank}</td>
                    <td>
                      {row.tournament_name}
                    </td>
                    <td>{row.team_name}</td>
                    <td>{row.points}</td>
                    <td>{row.wins}</td>
                    <td>{row.losses}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          className="btn btn-secondary"
          onClick={() => setPage("dashboard")}
        >
          Back
        </button>
      </div>
    );
  }

  return null;
}

export default App;