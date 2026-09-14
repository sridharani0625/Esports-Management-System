import { useState } from "react";
import axios from "axios";

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

  const [name, setName] = useState("");
  const [game, setGame] = useState("");
  const [description, setDescription] = useState("");
  const [teamName, setTeamName] = useState("");

  const [message, setMessage] = useState("");

  // =========================
  // SIGNUP
  // =========================

  const signup = async () => {
    if (!username || !email || !password) {
      setMessage("Please fill all fields");
      return;
    }

    try {
      await axios.post(`${API_URL}/signup`, {
        username,
        email,
        password,
        role,
      });

      setMessage("Signup successful! Please login.");

      setUsername("");
      setEmail("");
      setPassword("");
      setRole("PLAYER");

      setPage("login");
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Signup failed"
      );
    }
  };

  // =========================
  // LOGIN
  // =========================

  const login = async () => {
    if (!email || !password) {
      setMessage("Please enter email and password");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/login`,
        {
          email,
          password,
        }
      );

      setUser(response.data);

      setMessage("");

      setPage("dashboard");
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Invalid email or password"
      );
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const logout = () => {
    setUser(null);
    setPage("login");

    setEmail("");
    setPassword("");
    setMessage("");
  };

  // =========================
  // VIEW TOURNAMENTS
  // =========================

  const openTournaments = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/tournaments/`
      );

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

  // =========================
  // CREATE TOURNAMENT
  // =========================

  const createTournament = async () => {
    if (!name || !game) {
      setMessage("Please enter tournament name and game");
      return;
    }

    try {
      await axios.post(
        `${API_URL}/tournaments/`,
        {
          name,
          game,
          description,
          organizer_id: user.user_id,
        }
      );

      setMessage(
        "Tournament created successfully!"
      );

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
  // VIEW TEAMS
  // =========================

  const openTeams = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/teams/`
      );

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

  // =========================
  // CREATE TEAM
  // =========================

  const createTeam = async () => {
    if (!teamName) {
      setMessage("Please enter team name");
      return;
    }

    try {
      await axios.post(
        `${API_URL}/teams/`,
        {
          name: teamName,
          manager_id: user.user_id,
        }
      );

      setMessage(
        "Team created successfully!"
      );

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
  // OPEN REGISTER TEAM PAGE
  // =========================

  const openRegisterPage = async () => {
    try {
      const tournamentResponse =
        await axios.get(
          `${API_URL}/tournaments/`
        );

      setTournaments(
        tournamentResponse.data
      );

      const teamResponse =
        await axios.get(
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

  // =========================
  // REGISTER TEAM
  // =========================

  const registerTeam = async () => {
    if (
      !selectedTournament ||
      !selectedTeam
    ) {
      setMessage(
        "Please select tournament and team"
      );
      return;
    }

    try {
      await axios.post(
        `${API_URL}/registrations/`,
        {
          tournament_id: Number(
            selectedTournament
          ),
          team_id: Number(selectedTeam),
        }
      );

      setMessage(
        "Team registered successfully!"
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

  const openManageRegistrations =
    async () => {
      try {
        const response =
          await axios.get(
            `${API_URL}/registrations/`
          );

        setRegistrations(
          response.data
        );

        setPage("manageRegistrations");
        setMessage("");
      } catch (error) {
        setMessage(
          error.response?.data?.detail ||
            "Could not load registrations"
        );
      }
    };

  // =========================
  // APPROVE REGISTRATION
  // =========================

  const approveRegistration =
    async (registrationId) => {
      try {
        await axios.put(
          `${API_URL}/registrations/${registrationId}/approve`
        );

        setMessage(
          "Registration approved successfully!"
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
  // VIEW MATCHES
  // =========================

  const openMatches = async () => {
    try {
      const response =
        await axios.get(
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
  // VIEW LEADERBOARD
  // =========================

  const openLeaderboard =
    async () => {
      try {
        const response =
          await axios.get(
            `${API_URL}/leaderboard/`
          );

        setLeaderboard(
          response.data
        );

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
  // OPEN SCHEDULE MATCH PAGE
  // =========================

  const openSchedulePage =
    async () => {
      try {
        const tournamentResponse =
          await axios.get(
            `${API_URL}/tournaments/`
          );

        setTournaments(
          tournamentResponse.data
        );

        const teamResponse =
          await axios.get(
            `${API_URL}/teams/`
          );

        setTeams(teamResponse.data);

        const registrationResponse =
          await axios.get(
            `${API_URL}/registrations/`
          );

        setRegistrations(
          registrationResponse.data
        );

        setPage("scheduleMatch");
        setMessage("");
      } catch (error) {
        setMessage(
          error.response?.data?.detail ||
            "Could not load scheduling data"
        );
      }
    };

  // =========================
  // SCHEDULE MATCH
  // =========================

  const scheduleMatch =
    async () => {
      if (
        !selectedTournament ||
        !selectedTeam ||
        !selectedTeam2 ||
        !matchDate
      ) {
        setMessage(
          "Please fill all match details"
        );
        return;
      }

      if (
        selectedTeam === selectedTeam2
      ) {
        setMessage(
          "A team cannot play against itself"
        );
        return;
      }

      try {
        await axios.post(
          `${API_URL}/matches/`,
          {
            tournament_id: Number(
              selectedTournament
            ),
            team1_id: Number(
              selectedTeam
            ),
            team2_id: Number(
              selectedTeam2
            ),
            match_date: matchDate,
          }
        );

        setMessage(
          "Match scheduled successfully!"
        );

        setSelectedTournament("");
        setSelectedTeam("");
        setSelectedTeam2("");
        setMatchDate("");
      } catch (error) {
        setMessage(
          error.response?.data?.detail ||
            "Could not schedule match"
        );
      }
    };

  // =========================
  // LOGIN PAGE
  // =========================

  if (page === "login") {
    return (
      <div className="container mt-5">
        <div className="card p-4 mx-auto"
          style={{ maxWidth: "500px" }}
        >
          <h1 className="text-center">
            Esports Management System
          </h1>

          <h3 className="text-center mt-3">
            Login
          </h3>

          {message && (
            <p className="text-danger">
              {message}
            </p>
          )}

          <input
            className="form-control mb-3"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <input
            className="form-control mb-3"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          <button
            className="btn btn-primary mb-3"
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
        <div className="card p-4 mx-auto"
          style={{ maxWidth: "500px" }}
        >
          <h1 className="text-center">
            Create Account
          </h1>

          {message && (
            <p className="text-danger">
              {message}
            </p>
          )}

          <input
            className="form-control mb-3"
            placeholder="Username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
          />

          <input
            className="form-control mb-3"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <input
            className="form-control mb-3"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          <select
            className="form-control mb-3"
            value={role}
            onChange={(e) =>
              setRole(e.target.value)
            }
          >
            <option value="PLAYER">
              Player
            </option>

            <option value="ORGANIZER">
              Organizer
            </option>

            <option value="ADMIN">
              Admin
            </option>
          </select>

          <button
            className="btn btn-success mb-3"
            onClick={signup}
          >
            Signup
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
        </div>
      </div>
    );
  }

  // =========================
  // DASHBOARD
  // =========================

  if (
    user &&
    page === "dashboard"
  ) {
    return (
      <div className="container mt-5">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1>
              Esports Dashboard
            </h1>

            <p>
              Welcome,{" "}
              <strong>
                {user.username}
              </strong>
            </p>

            <p>
              Role:{" "}
              <strong>
                {user.role}
              </strong>
            </p>
          </div>

          <button
            className="btn btn-danger"
            onClick={logout}
          >
            Logout
          </button>
        </div>

        {message && (
          <p className="text-success">
            {message}
          </p>
        )}

        <hr />

        <div className="row g-3">

          <div className="col-md-4">
            <button
              className="btn btn-primary w-100 p-3"
              onClick={openTournaments}
            >
              View Tournaments
            </button>
          </div>

          <div className="col-md-4">
            <button
              className="btn btn-primary w-100 p-3"
              onClick={openTeams}
            >
              View Teams
            </button>
          </div>

          <div className="col-md-4">
            <button
              className="btn btn-primary w-100 p-3"
              onClick={openMatches}
            >
              View Matches
            </button>
          </div>

          <div className="col-md-4">
            <button
              className="btn btn-primary w-100 p-3"
              onClick={openLeaderboard}
            >
              View Leaderboard
            </button>
          </div>

          {user.role === "PLAYER" && (
            <>
              <div className="col-md-4">
                <button
                  className="btn btn-success w-100 p-3"
                  onClick={openRegisterPage}
                >
                  Register Team
                </button>
              </div>

              <div className="col-md-4">
                <button
                  className="btn btn-success w-100 p-3"
                  onClick={() => {
                    setPage("createTeam");
                    setMessage("");
                  }}
                >
                  Create Team
                </button>
              </div>
            </>
          )}

          {user.role === "ORGANIZER" && (
            <>
              <div className="col-md-4">
                <button
                  className="btn btn-warning w-100 p-3"
                  onClick={() => {
                    setPage(
                      "createTournament"
                    );
                    setMessage("");
                  }}
                >
                  Create Tournament
                </button>
              </div>

              <div className="col-md-4">
                <button
                  className="btn btn-warning w-100 p-3"
                  onClick={
                    openManageRegistrations
                  }
                >
                  Manage Registrations
                </button>
              </div>

              <div className="col-md-4">
                <button
                  className="btn btn-warning w-100 p-3"
                  onClick={
                    openSchedulePage
                  }
                >
                  Schedule Matches
                </button>
              </div>
            </>
          )}

          {user.role === "ADMIN" && (
            <div className="col-md-4">
              <button
                className="btn btn-dark w-100 p-3"
                onClick={() => {
                  setMessage(
                    "Admin features will be added next."
                  );
                }}
              >
                Admin Panel
              </button>
            </div>
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
        <h1>
          Tournaments
        </h1>

        {message && (
          <p className="text-success">
            {message}
          </p>
        )}

        {tournaments.length === 0 ? (
          <p>
            No tournaments found.
          </p>
        ) : (
          <div className="row">
            {tournaments.map(
              (tournament) => (
                <div
                  className="col-md-6 mb-3"
                  key={tournament.id}
                >
                  <div className="card p-3">
                    <h3>
                      {tournament.name}
                    </h3>

                    <p>
                      Game:{" "}
                      {tournament.game}
                    </p>

                    <p>
                      {tournament.description}
                    </p>

                    <p>
                      Status:{" "}
                      {tournament.status}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        <button
          className="btn btn-secondary"
          onClick={() =>
            setPage("dashboard")
          }
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // =========================
  // CREATE TOURNAMENT PAGE
  // =========================

  if (
    page === "createTournament"
  ) {
    return (
      <div className="container mt-5">
        <h1>
          Create Tournament
        </h1>

        {message && (
          <p className="text-success">
            {message}
          </p>
        )}

        <input
          className="form-control mb-3"
          placeholder="Tournament Name"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
        />

        <input
          className="form-control mb-3"
          placeholder="Game"
          value={game}
          onChange={(e) =>
            setGame(e.target.value)
          }
        />

        <textarea
          className="form-control mb-3"
          placeholder="Description"
          value={description}
          onChange={(e) =>
            setDescription(
              e.target.value
            )
          }
        />

        <button
          className="btn btn-success me-2"
          onClick={
            createTournament
          }
        >
          Create Tournament
        </button>

        <button
          className="btn btn-secondary"
          onClick={() =>
            setPage("dashboard")
          }
        >
          Back
        </button>
      </div>
    );
  }

  // =========================
  // TEAMS PAGE
  // =========================

  if (page === "teams") {
    return (
      <div className="container mt-5">
        <h1>
          Teams
        </h1>

        {message && (
          <p className="text-success">
            {message}
          </p>
        )}

        {teams.length === 0 ? (
          <p>
            No teams found.
          </p>
        ) : (
          <div className="row">
            {teams.map(
              (team) => (
                <div
                  className="col-md-4 mb-3"
                  key={team.id}
                >
                  <div className="card p-3">
                    <h3>
                      {team.name}
                    </h3>

                    <p>
                      Team ID:{" "}
                      {team.id}
                    </p>

                    <p>
                      Manager ID:{" "}
                      {team.manager_id}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        <button
          className="btn btn-secondary"
          onClick={() =>
            setPage("dashboard")
          }
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // =========================
  // CREATE TEAM PAGE
  // =========================

  if (
    page === "createTeam"
  ) {
    return (
      <div className="container mt-5">
        <h1>
          Create Team
        </h1>

        {message && (
          <p className="text-success">
            {message}
          </p>
        )}

        <input
          className="form-control mb-3"
          placeholder="Team Name"
          value={teamName}
          onChange={(e) =>
            setTeamName(
              e.target.value
            )
          }
        />

        <button
          className="btn btn-success me-2"
          onClick={
            createTeam
          }
        >
          Create Team
        </button>

        <button
          className="btn btn-secondary"
          onClick={() =>
            setPage("dashboard")
          }
        >
          Back
        </button>
      </div>
    );
  }

  // =========================
  // REGISTER TEAM PAGE
  // =========================

  if (
    page === "registerTeam"
  ) {
    return (
      <div className="container mt-5">
        <h1>
          Register Team
        </h1>

        {message && (
          <p className="text-success">
            {message}
          </p>
        )}

        <h4>
          Select Tournament
        </h4>

        <select
          className="form-control mb-4"
          value={selectedTournament}
          onChange={(e) =>
            setSelectedTournament(
              e.target.value
            )
          }
        >
          <option value="">
            Select Tournament
          </option>

          {tournaments.map(
            (tournament) => (
              <option
                key={tournament.id}
                value={tournament.id}
              >
                {tournament.name}
              </option>
            )
          )}
        </select>

        <h4>
          Select Team
        </h4>

        <select
          className="form-control mb-4"
          value={selectedTeam}
          onChange={(e) =>
            setSelectedTeam(
              e.target.value
            )
          }
        >
          <option value="">
            Select Team
          </option>

          {teams.map(
            (team) => (
              <option
                key={team.id}
                value={team.id}
              >
                {team.name}
              </option>
            )
          )}
        </select>

        <button
          className="btn btn-success me-2"
          onClick={
            registerTeam
          }
        >
          Register Team
        </button>

        <button
          className="btn btn-secondary"
          onClick={() =>
            setPage("dashboard")
          }
        >
          Back
        </button>
      </div>
    );
  }

  // =========================
  // MANAGE REGISTRATIONS
  // =========================

  if (
    page === "manageRegistrations"
  ) {
    return (
      <div className="container mt-5">
        <h1>
          Manage Registrations
        </h1>

        {message && (
          <p className="text-success">
            {message}
          </p>
        )}

        {registrations.length === 0 ? (
          <p>
            No registrations found.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tournament</th>
                  <th>Team</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {registrations.map(
                  (registration) => (
                    <tr
                      key={
                        registration.id
                      }
                    >
                      <td>
                        {
                          registration.id
                        }
                      </td>

                      <td>
                        {
                          registration.tournament_name
                        }
                      </td>

                      <td>
                        {
                          registration.team_name
                        }
                      </td>

                      <td>
                        {
                          registration.status
                        }
                      </td>

                      <td>
                        {registration.status ===
                        "pending" ? (
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
                        ) : (
                          <span>
                            Approved ✓
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        <button
          className="btn btn-secondary"
          onClick={() =>
            setPage("dashboard")
          }
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // =========================
  // SCHEDULE MATCH PAGE
  // =========================

  if (
    user &&
    page === "scheduleMatch"
  ) {
    const approvedRegistrations =
      registrations.filter(
        (registration) =>
          registration.status ===
          "approved"
      );

    const approvedTeams =
      approvedRegistrations
        .map((registration) => {
          return teams.find(
            (team) =>
              team.id ===
              registration.team_id
          );
        })
        .filter(Boolean);

    return (
      <div className="container mt-5">
        <h1>
          Schedule Match
        </h1>

        {message && (
          <p className="text-success">
            {message}
          </p>
        )}

        <h4>
          Select Tournament
        </h4>

        <select
          className="form-control mb-4"
          value={selectedTournament}
          onChange={(e) =>
            setSelectedTournament(
              e.target.value
            )
          }
        >
          <option value="">
            Select Tournament
          </option>

          {tournaments.map(
            (tournament) => (
              <option
                key={tournament.id}
                value={tournament.id}
              >
                {tournament.name}
              </option>
            )
          )}
        </select>

        <h4>
          Team 1
        </h4>

        <select
          className="form-control mb-4"
          value={selectedTeam}
          onChange={(e) =>
            setSelectedTeam(
              e.target.value
            )
          }
        >
          <option value="">
            Select Team 1
          </option>

          {approvedTeams.map(
            (team) => (
              <option
                key={team.id}
                value={team.id}
              >
                {team.name}
              </option>
            )
          )}
        </select>

        <h4>
          Team 2
        </h4>

        <select
          className="form-control mb-4"
          value={selectedTeam2}
          onChange={(e) =>
            setSelectedTeam2(
              e.target.value
            )
          }
        >
          <option value="">
            Select Team 2
          </option>

          {approvedTeams.map(
            (team) => (
              <option
                key={team.id}
                value={team.id}
              >
                {team.name}
              </option>
            )
          )}
        </select>

        <h4>
          Match Date & Time
        </h4>

        <input
          className="form-control mb-4"
          type="datetime-local"
          value={matchDate}
          onChange={(e) =>
            setMatchDate(
              e.target.value
            )
          }
        />

        <button
          className="btn btn-success me-2"
          onClick={
            scheduleMatch
          }
        >
          Schedule Match
        </button>

        <button
          className="btn btn-secondary"
          onClick={() =>
            setPage("dashboard")
          }
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // =========================
  // MATCHES PAGE
  // =========================

  if (page === "matches") {
    return (
      <div className="container mt-5">
        <h1>
          Matches
        </h1>

        {message && (
          <p className="text-success">
            {message}
          </p>
        )}

        {matches.length === 0 ? (
          <p>
            No matches found.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Tournament</th>
                  <th>Game</th>
                  <th>Team 1</th>
                  <th>Team 2</th>
                  <th>Date</th>
                  <th>Result</th>
                  <th>Winner</th>
                </tr>
              </thead>

              <tbody>
                {matches.map(
                  (match) => (
                    <tr
                      key={match.id}
                    >
                      <td>
                        {
                          match.tournament_name
                        }
                      </td>

                      <td>
                        {match.game}
                      </td>

                      <td>
                        {
                          match.team1_name
                        }
                      </td>

                      <td>
                        {
                          match.team2_name
                        }
                      </td>

                      <td>
                        {match.match_date
                          ? new Date(
                              match.match_date
                            ).toLocaleString()
                          : "-"}
                      </td>

                      <td>
                        {match.result ||
                          "Scheduled"}
                      </td>

                      <td>
                        {match.winner_name ||
                          "-"}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        <button
          className="btn btn-secondary"
          onClick={() =>
            setPage("dashboard")
          }
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // =========================
  // LEADERBOARD PAGE
  // =========================

  if (
    page === "leaderboard"
  ) {
    return (
      <div className="container mt-5">
        <h1>
          Leaderboard
        </h1>

        {message && (
          <p className="text-success">
            {message}
          </p>
        )}

        {leaderboard.length === 0 ? (
          <p>
            No leaderboard data found.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-bordered">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Team</th>
                  <th>Points</th>
                  <th>Wins</th>
                  <th>Losses</th>
                </tr>
              </thead>

              <tbody>
                {leaderboard.map(
                  (item, index) => (
                    <tr
                      key={index}
                    >
                      <td>
                        {item.rank}
                      </td>

                      <td>
                        {
                          item.team_name
                        }
                      </td>

                      <td>
                        {item.points}
                      </td>

                      <td>
                        {item.wins}
                      </td>

                      <td>
                        {item.losses}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        <button
          className="btn btn-secondary"
          onClick={() =>
            setPage("dashboard")
          }
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return null;
}

export default App;