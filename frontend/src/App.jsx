import { useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const API_URL = "https://esports-management-system.onrender.com";

function App() {
  const [page, setPage] = useState("login");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("PLAYER");

  const [user, setUser] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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

  const [selectedMemberTeam, setSelectedMemberTeam] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // =========================
  // PASSWORD VALIDATION
  // =========================

  const passwordRequirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const passwordValid =
    passwordRequirements.length &&
    passwordRequirements.uppercase &&
    passwordRequirements.lowercase &&
    passwordRequirements.number &&
    passwordRequirements.special;

  const emailValid =
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(
      email.trim()
    );

  // =========================
  // SIGNUP
  // =========================

  const signup = async () => {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanUsername.length < 3) {
      setMessage("Username must contain at least 3 characters");
      return;
    }

    if (!emailValid) {
      setMessage("Please enter a valid email address");
      return;
    }

    if (!passwordValid) {
      setMessage("Please meet all password requirements");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/users/signup`, {
        username: cleanUsername,
        email: cleanEmail,
        password,
        role,
      });

      setMessage(response.data.message);
      setUsername("");
      setEmail("");
      setPassword("");
      setPasswordFocused(false);
      setShowPassword(false);

      setTimeout(() => {
        setPage("login");
        setMessage("");
      }, 1000);
    } catch (error) {
      setMessage(error.response?.data?.detail || "Signup failed");
    }
  };

  // =========================
  // LOGIN
  // =========================
const login = async () => {
  if (isLoggingIn) {
    return;
  }

  setIsLoggingIn(true);
  try {
    const response = await axios.post(`${API_URL}/users/login`, {
      email: email,
      password: password,
    });

    console.log("LOGIN RESPONSE:", response.data);

    setUser(response.data);

    localStorage.setItem(
      "access_token",
      response.data.access_token
    );

    try {
      await loadDashboardData(response.data.role);
      if (response.data.role === "ORGANIZER") {
        const applicationsResponse = await axios.get(`${API_URL}/applications/`, {
          headers: { Authorization: "Bearer " + response.data.access_token },
        });
        setRegistrations(applicationsResponse.data);
      }
    } catch (error) {
      console.error("Post-login data loading failed", error);
    }

    setMessage("Login successful");

    setEmail("");
    setPassword("");

    setPage("dashboard");
  } catch (error) {
    console.error(
      "LOGIN ERROR:",
      error.response?.data || error.message
    );

    setMessage(
      error.response?.data?.detail || "Login failed"
    );
  } finally {
    setIsLoggingIn(false);
  }
};
  // =========================
  // LOGOUT
  // =========================

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
    setPage("login");
    setMessage("");
    setShowPassword(false);
  };

  const loadDashboardData = async (role = user?.role) => {
    try {
      const tournamentsResponse = await axios.get(`${API_URL}/tournaments/`);

      setTournaments(tournamentsResponse.data);
      if (role === "ORGANIZER") {
        const [matchesResponse, leaderboardResponse] = await Promise.all([
          axios.get(`${API_URL}/matches/`),
          axios.get(`${API_URL}/leaderboard/`),
        ]);
        setMatches(matchesResponse.data);
        setLeaderboard(leaderboardResponse.data);
      } else {
        const [teamsResponse, matchesResponse, leaderboardResponse] = await Promise.all([
          axios.get(`${API_URL}/teams/`),
          axios.get(`${API_URL}/matches/`),
          axios.get(`${API_URL}/leaderboard/`),
        ]);
        setTeams(teamsResponse.data);
        setMatches(matchesResponse.data);
        setLeaderboard(leaderboardResponse.data);
      }
    } catch (error) {
      console.error("Dashboard data loading failed", error);
    }
  };

  const openScoreEntry = async () => {
    try {
      const response = await axios.get(`${API_URL}/matches/`);
      setMatches(response.data);
      setPage("matchResult");
      setMessage("");
    } catch (error) {
      setMessage(error.response?.data?.detail || "Could not load match results");
    }
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
      const token = localStorage.getItem("access_token");

      const config = {
        headers: {
          Authorization: "Bearer " + token
        },
      };

      await axios.post(
        `${API_URL}/tournaments/`,
        {
          name,
          game,
          description,
          organizer_id: user.user_id,
        },
        config
      );

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

const createTeam = async () => {
  if (!teamName.trim()) {
    setMessage("Please enter team name");
    return;
  }

  try {
    const token = localStorage.getItem("access_token");

    const config = {
        headers: {
          Authorization: "Bearer " + token
        },
      };

    const response = await axios.post(
      `${API_URL}/teams/`,
      {
        name: teamName.trim(),
        manager_id: user.user_id,
      },
      config
    );

    setMessage(
      response.data?.message || "Team created successfully"
    );

    setTeamName("");

    // Refresh the team list
    const teamsResponse = await axios.get(
      `${API_URL}/teams/`
    );

    setTeams(teamsResponse.data);

    // Stay on the Create Team page so the success message is visible
    setPage("createTeam");

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

  const registerTeam = async () => {
    if (!selectedTournament || !selectedTeam) {
      setMessage(
        "Please select tournament and team"
      );
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      await axios.post(
        `${API_URL}/registrations/`,
        {
          tournament_id: Number(selectedTournament),
          team_id: Number(selectedTeam),
        },
        { headers: { Authorization: "Bearer " + token } }
      );

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

  const openPlayerApplications = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const [tournamentResponse, applicationResponse] = await Promise.all([
        axios.get(`${API_URL}/tournaments/`),
        axios.get(`${API_URL}/applications/`, {
          headers: { Authorization: "Bearer " + token },
        }),
      ]);
      setTournaments(tournamentResponse.data);
      setRegistrations(applicationResponse.data);
      setPage("playerApplications");
      setMessage("");
    } catch (error) {
      setMessage(error.response?.data?.detail || "Could not load applications");
    }
  };

  const openApprovedApplications = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const [tournamentResponse, applicationResponse] = await Promise.all([
        axios.get(`${API_URL}/tournaments/`),
        axios.get(`${API_URL}/applications/`, {
          headers: { Authorization: "Bearer " + token },
        }),
      ]);
      setTournaments(tournamentResponse.data);
      setRegistrations(applicationResponse.data.filter((application) => application.status === "approved"));
      setPage("approvedApplications");
      setMessage("");
    } catch (error) {
      setMessage(error.response?.data?.detail || "Could not load approved applications");
    }
  };

  const applyToTournament = async () => {
    if (!selectedTournament) {
      setMessage("Please select a tournament");
      return;
    }
    try {
      const token = localStorage.getItem("access_token");
      await axios.post(
        `${API_URL}/applications/`,
        { tournament_id: Number(selectedTournament) },
        { headers: { Authorization: "Bearer " + token } }
      );
      setMessage("Application submitted successfully");
      setSelectedTournament("");
      await openPlayerApplications();
    } catch (error) {
      setMessage(error.response?.data?.detail || "Could not submit application");
    }
  };

  // =========================
  // MANAGE REGISTRATIONS
  // =========================

  const openManageRegistrations = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(
        `${API_URL}/registrations/`,
        { headers: { Authorization: "Bearer " + token } }
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
      const token = localStorage.getItem("access_token");
      await axios.put(
        `${API_URL}/registrations/${registrationId}/approve`,
        {},
        { headers: { Authorization: "Bearer " + token } }
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

  const rejectRegistration = async (registrationId) => {
    try {
      const token = localStorage.getItem("access_token");
      await axios.put(
        `${API_URL}/registrations/${registrationId}/reject`,
        {},
        { headers: { Authorization: "Bearer " + token } }
      );

      setMessage("Registration rejected successfully");
      openManageRegistrations();
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Could not reject registration"
      );
    }
  };

  const changeApplicationStatus = async (applicationId, status) => {
    try {
      const token = localStorage.getItem("access_token");
      await axios.put(
        `${API_URL}/applications/${applicationId}/${status}`,
        {},
        { headers: { Authorization: "Bearer " + token } }
      );
      setMessage(`Application ${status} successfully`);
      await openManageApplications();
    } catch (error) {
      setMessage(error.response?.data?.detail || `Could not ${status} application`);
    }
  };

  const openManageApplications = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(`${API_URL}/applications/`, {
        headers: { Authorization: "Bearer " + token },
      });
      setRegistrations(response.data);
      setPage("applications");
      setMessage("");
    } catch (error) {
      setMessage(error.response?.data?.detail || "Could not load applications");
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

  const openScheduleMatch = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const [tournamentsResponse, teamsResponse, registrationsResponse] = await Promise.all([
        axios.get(`${API_URL}/tournaments/`),
        axios.get(`${API_URL}/teams/`),
        axios.get(`${API_URL}/registrations/`, {
          headers: { Authorization: "Bearer " + token },
        }),
      ]);
      setTournaments(tournamentsResponse.data);
      setTeams(teamsResponse.data);
      setRegistrations(registrationsResponse.data);
      setPage("scheduleMatch");
      setMessage("");
    } catch (error) {
      setMessage(error.response?.data?.detail || "Could not load teams for scheduling");
    }
  };

  const scheduleMatch = async () => {
    if (
      !selectedTournament ||
      !selectedTeam ||
      !selectedTeam2 ||
      !matchDate
    ) {
      setMessage("Please select tournament, both teams and match date");
      return;
    }

    if (selectedTeam === selectedTeam2) {
      setMessage("A team cannot play against itself");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      await axios.post(`${API_URL}/matches/`, {
        tournament_id: Number(selectedTournament),
        team1_id: Number(selectedTeam),
        team2_id: Number(selectedTeam2),
        match_date: matchDate,
      }, {
        headers: { Authorization: "Bearer " + token },
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

  const enterMatchResult = async () => {
    if (!selectedMatch || !winnerId || !result) {
      setMessage(
        "Please select a match, winner and enter the result"
      );
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      await axios.put(
        `${API_URL}/matches/${selectedMatch}/result`,
        {
          winner_id: Number(winnerId),
          result: result,
        },
        {
          headers: {
            Authorization: "Bearer " + token,
          },
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
      const leaderboardResponse = await axios.get(
        `${API_URL}/leaderboard/`
      );
      setLeaderboard(leaderboardResponse.data);
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          "Could not enter match result"
      );
    }
  };


  const loadTeamMembers = async (teamId) => {
    if (!teamId) {
      setTeamMembers([]);
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/teams/${teamId}/members`);
      setTeamMembers(response.data);
      setMessage("");
    } catch (error) {
      setMessage(error.response?.data?.detail || "Could not load team members");
    }
  };

  const addTeamMember = async () => {
    if (!selectedMemberTeam || !playerId) {
      setMessage("Please select a team and enter player ID");
      return;
    }
    try {
      const token = localStorage.getItem("access_token");

      const config = {
        headers: {
          Authorization: "Bearer " + token
        },
      };

      const response = await axios.post(
        `${API_URL}/teams/${selectedMemberTeam}/members`,
        { player_id: Number(playerId) },
        config
      );
      setMessage(response.data.message || "Player added to team successfully");
      setPlayerId("");
      await loadTeamMembers(selectedMemberTeam);
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Could not add player"
      );
    }
  };

  const openAdminPanel = async () => {
    try {
      const token = localStorage.getItem("access_token");

      const config = {
        headers: {
          Authorization: "Bearer " + token
        },
      };

      const [stats, users, logs] = await Promise.all([
        axios.get(`${API_URL}/admin/stats`, config),
        axios.get(`${API_URL}/admin/users`, config),
        axios.get(`${API_URL}/admin/audit-logs`, config)
      ]);
      setAdminStats(stats.data);
      setAdminUsers(users.data);
      setAuditLogs(logs.data);
      setPage("admin");
      setMessage("");
    } catch (error) {
      setMessage(error.response?.data?.detail || "Could not load admin panel");
    }
  };

  // =========================
  // LOGIN PAGE
  // =========================

  if (page === "login") {
    return (
      <AuthLayout>
        <div className="auth-card" style={{ margin: 0 }}>
          <div className="auth-brand">
            <div className="brand-mark"><Icon.Trophy /></div>
            <div>
              <div className="brand-name">Esports Management</div>
              <div className="brand-subtitle">Compete. Connect. Win.</div>
            </div>
          </div>

          <div className="auth-heading">
            <span className="kicker">Welcome back</span>
            <h1>Sign in</h1>
            <p>Manage tournaments, player approvals, and match outcomes from one professional dashboard.</p>
          </div>

          <label className="field-label">Email address</label>
          <input
            className="pro-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="field-label">Password</label>
          <div className="input-with-action">
            <input
              className="pro-input"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
            />
            <button
              type="button"
              className="input-action-btn"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <Icon.EyeOff /> : <Icon.Eye />}
            </button>
          </div>

          <button
            className="pro-btn pro-btn-primary w-100 mt-2"
            onClick={login}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>

          <div className="auth-divider"><span>New here?</span></div>

          <button
            className="pro-btn pro-btn-outline w-100"
            onClick={() => { setPage("signup"); setMessage(""); }}
          >
            Create an account
          </button>

          {message && <MessageBanner message={message} />}
        </div>
      </AuthLayout>
    );
  }

  // =========================
  // SIGNUP PAGE
  // =========================

  if (page === "signup") {
    return (
      <AuthLayout>
        <div className="auth-card auth-card-wide">
          <div className="auth-brand">
            <div className="brand-mark"><Icon.Trophy /></div>
            <div>
              <div className="brand-name">Arenaboard</div>
              <div className="brand-subtitle">Esports operations</div>
            </div>
          </div>

          <div className="auth-heading">
            <span className="kicker">Join the platform</span>
            <h1>Create your account</h1>
            <p>Choose your role and start managing your esports workflow.</p>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="field-label">Username</label>
              <input
                className="pro-input"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="col-md-6">
              <label className="field-label">Email address</label>
              <input
                className="pro-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <label className="field-label mt-3">Password</label>
          <div className="input-with-action">
            <input
              className="pro-input"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={password}
              onFocus={() => setPasswordFocused(true)}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="input-action-btn"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <Icon.EyeOff /> : <Icon.Eye />}
            </button>
          </div>

          {passwordFocused && (
            <div className="password-panel">
              <div className="password-panel-title">Password strength</div>
              <div className="password-grid">
                <PasswordRule ok={passwordRequirements.length} text="8+ characters" />
                <PasswordRule ok={passwordRequirements.uppercase} text="Uppercase letter" />
                <PasswordRule ok={passwordRequirements.lowercase} text="Lowercase letter" />
                <PasswordRule ok={passwordRequirements.number} text="Number" />
                <PasswordRule ok={passwordRequirements.special} text="Special character" />
              </div>
            </div>
          )}

          <label className="field-label mt-3">Account role</label>
          <select className="pro-input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="PLAYER">Player</option>
            <option value="ORGANIZER">Organizer</option>
          </select>

          <button
            className="pro-btn pro-btn-primary w-100 mt-4"
            onClick={signup}
            disabled={username.trim().length < 3 || !emailValid || !passwordValid}
          >
            Create account
          </button>

          <button
            className="pro-btn pro-btn-outline w-100 mt-2"
            onClick={() => { setPage("login"); setMessage(""); }}
          >
            Back to sign in
          </button>

          {message && <MessageBanner message={message} />}
        </div>
      </AuthLayout>
    );
  }

  // =========================
  // DASHBOARD
  // =========================

  if (page === "dashboard") {
    const upcomingTournaments = tournaments.filter(
      (tournament) => String(tournament.status).toLowerCase() === "upcoming"
    );
    const managedTeamIds = new Set(
      teams
        .filter((team) => String(team.manager_id) === String(user.user_id))
        .map((team) => String(team.id))
    );
    const dashboardMatches =
      user.role === "TEAM_MANAGER"
        ? matches.filter(
            (match) =>
              String(match.status).toLowerCase() === "upcoming" &&
              (managedTeamIds.has(String(match.team1_id)) ||
                managedTeamIds.has(String(match.team2_id)))
          )
        : matches;

    return (
      <AppLayout user={user} page={page} setPage={setPage} logout={logout}>
        <div className="page-intro">
          <div>
            <span className="kicker">Control center</span>
            <h1>Dashboard</h1>
            <p>Welcome back, {user.username}. Here is your current platform overview.</p>
          </div>
          <RoleBadge role={user.role} />
        </div>

        {message && <MessageBanner message={message} />}

        <div className="hero-panel mb-4">
          <div>
            <span className="kicker kicker-on-dark">Live overview</span>
            <h2>Hello, {user.username}</h2>
            <p>Run your esports operations from a single, secure workspace.</p>
          </div>
          <div className="hero-icon"><Icon.Trophy /></div>
        </div>

        {user.role === "ORGANIZER" ? (
          <div className="row g-3 mb-5">
            <StatCard icon={<Icon.Trophy />} label="My tournaments" value={tournaments.filter((tournament) => String(tournament.organizer_id) === String(user.user_id)).length} hint="Created by you" />
            <StatCard icon={<Icon.Clipboard />} label="Player applications" value={registrations.length} hint="For your tournaments" />
          </div>
        ) : (
          <div className="row g-3 mb-5">
            <StatCard icon={<Icon.Trophy />} label="Upcoming tournaments" value={user.role === "TEAM_MANAGER" || user.role === "PLAYER" ? upcomingTournaments.length : tournaments.length} hint="Events going to happen" />
            {user.role !== "PLAYER" && (user.role !== "TEAM_MANAGER" || dashboardMatches.length > 0) && (
              <StatCard icon={<Icon.Target />} label="Matches" value={dashboardMatches.length} hint="Matches involving your team" />
            )}
            {user.role !== "TEAM_MANAGER" && (
              <StatCard icon={<Icon.Chart />} label="Leaderboard" value={leaderboard.length} hint="Ranked players" />
            )}
          </div>
        )}

        <div className="section-heading">
          <div>
            <span className="kicker">Quick access</span>
            <h2>What would you like to do?</h2>
          </div>
        </div>

        <div className="row g-3">
          {user.role === "PLAYER" && (
            <>
              <ActionCard icon={<Icon.Trophy />} title="Upcoming tournaments" text="Browse tournaments that are going to happen and are open for play." onClick={openTournaments} accent />
              <ActionCard icon={<Icon.Clipboard />} title="Apply to match" text="Apply to participate in an upcoming tournament match." onClick={openPlayerApplications} />
              <ActionCard icon={<Icon.Medal />} title="Approved applications" text="View the tournaments where you have been approved." onClick={openApprovedApplications} />
              <ActionCard icon={<Icon.Chart />} title="Scoreboard" text="Check scores, rankings, wins and losses." onClick={openLeaderboard} />
            </>
          )}
          {user.role !== "ORGANIZER" && user.role !== "PLAYER" && <ActionCard icon={<Icon.Trophy />} title="Tournaments" text="Browse available esports tournaments." onClick={openTournaments} />}
          {user.role !== "ORGANIZER" && user.role !== "PLAYER" && <ActionCard icon={<Icon.Target />} title="Matches" text="Track scheduled and completed matches." onClick={openMatches} />}
          {user.role !== "ORGANIZER" && user.role !== "PLAYER" && <ActionCard icon={<Icon.Chart />} title="Leaderboard" text="Check rankings, points, wins and losses." onClick={openLeaderboard} />}
          {user.role === "ORGANIZER" && (
            <>
              <ActionCard icon={<Icon.Plus />} title="Create tournament" text="Post a tournament for players to apply." onClick={() => setPage("createTournament")} accent />
              <ActionCard icon={<Icon.Clipboard />} title="Approve players" text="Review applications for your tournaments only." onClick={openManageApplications} />
              <ActionCard icon={<Icon.Users />} title="Approve teams" text="Approve registered teams before scheduling them into matches." onClick={openManageRegistrations} />
              <ActionCard icon={<Icon.Calendar />} title="Schedule match" text="Schedule a match between two approved teams." onClick={openScheduleMatch} />
              <ActionCard icon={<Icon.Medal />} title="Scoreboard" text="Enter the final score for completed match results and update standings." onClick={openScoreEntry} />
            </>
          )}
          {user.role === "ADMIN" && (
            <ActionCard icon={<Icon.Gear />} title="Administration" text="Manage users, statistics and audit logs." onClick={openAdminPanel} />
          )}
        </div>
      </AppLayout>
    );
  }

  // =========================
  // TOURNAMENTS
  // =========================

  if (page === "tournaments") {
    const visibleTournaments =
      user.role === "TEAM_MANAGER" || user.role === "PLAYER"
        ? tournaments.filter(
            (tournament) =>
              String(tournament.status).toLowerCase() === "upcoming"
          )
        : tournaments;

    return (
      <AppLayout user={user} page={page} setPage={setPage} logout={logout}>
        <PageHeader eyebrow="Competitions" title="Tournaments" subtitle="Discover and monitor esports competitions." />
        {message && <MessageBanner message={message} />}
        {visibleTournaments.length === 0 ? (
          <EmptyState icon={<Icon.Trophy />} title="No tournaments found" text="Create a tournament to get your competition started." />
        ) : (
          <div className="row g-4">
            {visibleTournaments.map((tournament) => (
              <div className="col-xl-4 col-md-6" key={tournament.id}>
                <div className="pro-card tournament-card h-100">
                  <div className="card-topline">
                    <span className="mini-icon"><Icon.Trophy /></span>
                    <StatusBadge status={tournament.status} />
                  </div>
                  <h3>{tournament.name}</h3>
                  <div className="muted-row"><Icon.Game />{tournament.game}</div>
                  <p>{tournament.description || "No description provided."}</p>
                  <div className="card-footer-line">Tournament #{tournament.id}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AppLayout>
    );
  }

  // =========================
  // CREATE TOURNAMENT
  // =========================

  if (page === "createTournament") {
    return (
      <AppLayout user={user} page={page} setPage={setPage} logout={logout}>
        <PageHeader eyebrow="Organizer workspace" title="Create tournament" subtitle="Publish a competition that players can apply to join." />
        <div className="form-panel">
          <div className="form-panel-icon"><Icon.Trophy /></div>
          <div className="row g-4">
            <div className="col-md-6">
              <label className="field-label">Tournament name</label>
              <input className="pro-input" placeholder="e.g. Summer Championship" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="field-label">Game</label>
              <input className="pro-input" placeholder="e.g. Valorant" value={game} onChange={(e) => setGame(e.target.value)} />
            </div>
            <div className="col-12">
              <label className="field-label">Description</label>
              <textarea className="pro-input pro-textarea" placeholder="Describe the tournament format, rules or schedule..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
          <div className="d-flex gap-2 mt-4">
            <button className="pro-btn pro-btn-primary" onClick={createTournament}>Create tournament</button>
            <button className="pro-btn pro-btn-outline" onClick={() => setPage("dashboard")}>Cancel</button>
          </div>
          {message && <MessageBanner message={message} />}
        </div>
      </AppLayout>
    );
  }

  // =========================
  // TEAMS
  // =========================

  if (page === "teams") {
    return (
      <AppLayout user={user} page={page} setPage={setPage} logout={logout}>
        <PageHeader eyebrow="Team directory" title="Teams" subtitle="Explore registered esports teams and their managers." />
        {message && <MessageBanner message={message} />}
        {teams.length === 0 ? (
          <EmptyState icon={<Icon.Users />} title="No teams found" text="Teams will appear here once they are created." />
        ) : (
          <div className="row g-4">
            {teams.map((team) => (
              <div className="col-xl-4 col-md-6" key={team.id}>
                <div className="pro-card team-card h-100">
                  <div className="team-avatar">{team.name?.charAt(0).toUpperCase()}</div>
                  <div className="team-content">
                    <span className="kicker">Team #{team.id}</span>
                    <h3>{team.name}</h3>
                    <p>Managed by user #{team.manager_id}</p>
                  </div>
                  <button className="icon-btn" onClick={() => { setSelectedMemberTeam(String(team.id)); loadTeamMembers(team.id); setPage("teamMembers"); }}><Icon.Chevron /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AppLayout>
    );
  }

  // =========================
  // CREATE TEAM
  // =========================

  if (page === "createTeam") {
    return (
      <AppLayout user={user} page={page} setPage={setPage} logout={logout}>
        <PageHeader eyebrow="Team manager workspace" title="Create my team" subtitle="Set up your esports team and start building your roster." />
        <div className="form-panel narrow-panel">
          <div className="form-panel-icon"><Icon.Users /></div>
          <label className="field-label">Team name</label>
          <input className="pro-input" placeholder="e.g. Phoenix Gaming" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
          <div className="info-callout mt-3">Your account will automatically become the manager of this team.</div>
          <div className="d-flex gap-2 mt-4">
            <button className="pro-btn pro-btn-primary" onClick={createTeam}>Create team</button>
            <button className="pro-btn pro-btn-outline" onClick={() => setPage("dashboard")}>Cancel</button>
          </div>
          {message && <MessageBanner message={message} />}
        </div>
      </AppLayout>
    );
  }

  // =========================
  // REGISTER TEAM
  // =========================

  if (page === "registerTeam") {
    return (
      <AppLayout user={user} page={page} setPage={setPage} logout={logout}>
        <PageHeader eyebrow="Player workspace" title="Register team" subtitle="Submit a team for participation in an available tournament." />
        <div className="form-panel narrow-panel">
          <div className="form-panel-icon"><Icon.Clipboard /></div>
          <label className="field-label">Tournament</label>
          <select className="pro-input" value={selectedTournament} onChange={(e) => setSelectedTournament(e.target.value)}>
            <option value="">Select tournament</option>
            {tournaments.map((tournament) => <option key={tournament.id} value={tournament.id}>{tournament.name}</option>)}
          </select>
          <label className="field-label mt-3">Team</label>
          <select className="pro-input" value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
            <option value="">Select team</option>
            {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select>
          <button className="pro-btn pro-btn-primary w-100 mt-4" onClick={registerTeam}>Submit registration</button>
          {registrations.length > 0 && (
            <div className="mt-4">
              <span className="kicker">Your registration status</span>
              <div className="table-wrap mt-2">
                <table className="pro-table">
                  <thead><tr><th>Tournament</th><th>Team</th><th>Status</th></tr></thead>
                  <tbody>
                    {registrations.map((registration) => (
                      <tr key={registration.id}>
                        <td>{registration.tournament_name}</td>
                        <td>{registration.team_name}</td>
                        <td><StatusBadge status={registration.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {message && <MessageBanner message={message} />}
        </div>
      </AppLayout>
    );
  }

  if (page === "playerApplications") {
    const upcomingTournaments = tournaments.filter(
      (tournament) => String(tournament.status).toLowerCase() === "upcoming"
    );
    return (
      <AppLayout user={user} page={page} setPage={setPage} logout={logout}>
        <PageHeader eyebrow="Player workspace" title="Apply to play" subtitle="Choose an upcoming tournament and send your application to its organizer." />
        <div className="form-panel narrow-panel">
          <div className="form-panel-icon"><Icon.Trophy /></div>
          <label className="field-label">Upcoming tournament</label>
          <select className="pro-input" value={selectedTournament} onChange={(e) => setSelectedTournament(e.target.value)}>
            <option value="">Select tournament</option>
            {upcomingTournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>{tournament.name} · {tournament.game}</option>
            ))}
          </select>
          <button className="pro-btn pro-btn-primary w-100 mt-4" onClick={applyToTournament}>Submit application</button>
          <div className="info-callout mt-3">Your application must be approved by the tournament organizer before you can play.</div>
          {registrations.length > 0 && (
            <div className="mt-4">
              <span className="kicker">My applications</span>
              <div className="table-wrap mt-2">
                <table className="pro-table">
                  <thead><tr><th>Tournament</th><th>Game</th><th>Status</th></tr></thead>
                  <tbody>{registrations.map((application) => (
                    <tr key={application.id}>
                      <td><strong>{application.tournament_name}</strong></td>
                      <td>{application.game}</td>
                      <td><StatusBadge status={application.status} /></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}
          {message && <MessageBanner message={message} />}
        </div>
      </AppLayout>
    );
  }

  if (page === "approvedApplications") {
    return (
      <AppLayout user={user} page={page} setPage={setPage} logout={logout}>
        <PageHeader eyebrow="Player workspace" title="Approved applications" subtitle="These are the tournaments where the organizer has approved you to play." />
        {registrations.length === 0 ? (
          <EmptyState icon={<Icon.Clipboard />} title="No approved applications" text="Approved tournament applications will appear here." />
        ) : (
          <div className="row g-4">
            {registrations.map((application) => (
              <div className="col-xl-4 col-md-6" key={application.id}>
                <div className="pro-card tournament-card h-100">
                  <div className="card-topline">
                    <span className="mini-icon"><Icon.Trophy /></span>
                    <StatusBadge status={application.status} />
                  </div>
                  <h3>{application.tournament_name}</h3>
                  <div className="muted-row"><Icon.Game />{application.game}</div>
                  <p>You are approved to play. The organizer will schedule your match.</p>
                  <div className="card-footer-line">Application #{application.id}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {message && <MessageBanner message={message} />}
      </AppLayout>
    );
  }

  // =========================
  // TEAM MEMBERS
  // =========================

  if (page === "teamMembers") {
    return (
      <AppLayout user={user} page={page} setPage={setPage} logout={logout}>
        <PageHeader eyebrow="Roster management" title="Team members" subtitle="View team rosters and add eligible players." />
        <div className="pro-card mb-4">
          <label className="field-label">Select team</label>
          <select className="pro-input" value={selectedMemberTeam} onChange={(e) => { const teamId = e.target.value; setSelectedMemberTeam(teamId); loadTeamMembers(teamId); }}>
            <option value="">Choose a team</option>
            {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select>
        </div>

        {selectedMemberTeam && (
          <div className="row g-4">
            {user.role === "TEAM_MANAGER" && (
              <div className="col-lg-4">
                <div className="pro-card h-100">
                  <span className="kicker">Add player</span>
                  <h3 className="mt-2">Build the roster</h3>
                  <p className="text-muted-custom">Enter the player ID of an eligible player account.</p>
                  <input type="number" className="pro-input" placeholder="Player ID" value={playerId} onChange={(e) => setPlayerId(e.target.value)} />
                  <button className="pro-btn pro-btn-primary w-100 mt-3" onClick={addTeamMember}>Add player</button>
                </div>
              </div>
            )}
            <div className={user.role === "TEAM_MANAGER" ? "col-lg-8" : "col-lg-12"}>
              <div className="pro-card">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div><span className="kicker">Roster</span><h3 className="mt-1 mb-0">Current members</h3></div>
                  <span className="count-pill">{teamMembers.length} players</span>
                </div>
                {teamMembers.length === 0 ? (
                  <EmptyState icon={<Icon.Person />} title="No players yet" text="Add players to build this team's roster." compact />
                ) : (
                  <div className="table-wrap">
                    <table className="pro-table">
                      <thead><tr><th>Player</th><th>Email</th><th>ID</th></tr></thead>
                      <tbody>{teamMembers.map((member) => <tr key={member.id}><td><strong>{member.username}</strong></td><td>{member.email}</td><td>#{member.player_id}</td></tr>)}</tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {message && <MessageBanner message={message} />}
      </AppLayout>
    );
  }

  // =========================
  // REGISTRATIONS
  // =========================

  if (page === "applications") {
    return (
      <AppLayout user={user} page={page} setPage={setPage} logout={logout}>
        <PageHeader eyebrow="Organizer workspace" title="Player applications" subtitle="Approve or reject players who want to enter your tournaments." />
        {message && <MessageBanner message={message} />}
        {registrations.length === 0 ? (
          <EmptyState icon={<Icon.Clipboard />} title="No applications found" text="Player applications will appear here." />
        ) : (
          <div className="pro-card">
            <div className="table-wrap">
              <table className="pro-table">
                <thead><tr><th>Tournament</th><th>Player</th><th>Email</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>{registrations.map((application) => (
                  <tr key={application.id}>
                    <td><strong>{application.tournament_name}</strong><div className="text-muted-custom">{application.game}</div></td>
                    <td>{application.player_username}</td>
                    <td>{application.player_email}</td>
                    <td><StatusBadge status={application.status} /></td>
                    <td>{application.status === "pending" ? (
                      <div className="d-flex gap-2">
                        <button className="small-action approve" onClick={() => changeApplicationStatus(application.id, "approve")}>Approve</button>
                        <button className="small-action reject" onClick={() => changeApplicationStatus(application.id, "reject")}>Reject</button>
                      </div>
                    ) : <span className="text-muted-custom">Completed</span>}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}
      </AppLayout>
    );
  }

  if (page === "registrations") {
    return (
      <AppLayout user={user} page={page} setPage={setPage} logout={logout}>
        <PageHeader eyebrow="Organizer workspace" title="Approve teams" subtitle="Approve registered teams before scheduling them in a match." />
        {message && <MessageBanner message={message} />}
        {registrations.length === 0 ? (
          <EmptyState icon={<Icon.Users />} title="No team registrations found" text="Registered teams for your tournaments will appear here." />
        ) : (
          <div className="pro-card">
            <div className="table-wrap">
              <table className="pro-table">
                <thead><tr><th>Registration</th><th>Tournament</th><th>Team</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {registrations.map((registration) => (
                    <tr key={registration.id}>
                      <td>#{registration.id}</td>
                      <td><strong>{registration.tournament_name}</strong></td>
                      <td>{registration.team_name}</td>
                      <td><StatusBadge status={registration.status} /></td>
                      <td>
                        {registration.status === "pending" ? (
                          <div className="d-flex gap-2">
                            <button className="small-action approve" onClick={() => approveRegistration(registration.id)}>Approve</button>
                            <button className="small-action reject" onClick={() => rejectRegistration(registration.id)}>Reject</button>
                          </div>
                        ) : (
                          <span className="text-muted-custom">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AppLayout>
    );
  }

  // =========================
  // MATCHES
  // =========================

  if (page === "matches") {
    const visibleMatches =
      user.role === "TEAM_MANAGER"
        ? matches.filter((match) =>
            teams.some(
              (team) =>
                String(team.manager_id) === String(user.user_id) &&
                (String(team.id) === String(match.team1_id) ||
                  String(team.id) === String(match.team2_id))
            )
          )
        : matches;

    return (
      <AppLayout user={user} page={page} setPage={setPage} logout={logout}>
        <PageHeader eyebrow="Match center" title="Matches" subtitle="Track upcoming fixtures and completed results." />
        {message && <MessageBanner message={message} />}
        {visibleMatches.length === 0 ? (
          <EmptyState icon={<Icon.Target />} title="No matches found" text="Scheduled matches will appear here." />
        ) : (
          <div className="row g-4">
            {visibleMatches.map((match) => (
              <div className="col-xl-6" key={match.id}>
                <div className="pro-card match-card h-100">
                  <div className="d-flex justify-content-between align-items-center mb-3"><span className="kicker">Match #{match.id}</span><StatusBadge status={match.status || (match.winner_name ? "completed" : "upcoming")} /></div>
                  <div className="match-teams"><div><div className="team-dot">{(match.player1_name || match.team1_name)?.charAt(0)}</div><strong>{match.player1_name || match.team1_name}</strong></div><span className="vs">vs</span><div><div className="team-dot">{(match.player2_name || match.team2_name)?.charAt(0)}</div><strong>{match.player2_name || match.team2_name}</strong></div></div>
                  <div className="match-meta"><span><Icon.Trophy small /> {match.tournament_name}</span><span><Icon.Calendar small /> {match.match_date}</span></div>
                  <div className="result-strip"><span>Result</span><strong>{match.result || "Not completed"}</strong>{(match.winner_name || match.winner_player_name) && <span>Winner: {match.winner_name || match.winner_player_name}</span>}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AppLayout>
    );
  }

  // =========================
  // SCHEDULE MATCH
  // =========================

  if (page === "scheduleMatch") {
    const approvedRegistrations = registrations.filter(
      (registration) =>
        String(registration.status).toLowerCase() === "approved" &&
        String(registration.tournament_id) === String(selectedTournament) &&
        registration.team_id
    );
    const team2Options = approvedRegistrations.filter(
      (registration) => String(registration.team_id) !== String(selectedTeam)
    );

    return (
      <AppLayout user={user} page={page} setPage={setPage} logout={logout}>
        <PageHeader eyebrow="Organizer workspace" title="Schedule match" subtitle="Create a fixture between two approved tournament teams." />
        <div className="form-panel">
          <div className="form-panel-icon"><Icon.Calendar /></div>
          <div className="row g-4">
            <div className="col-12"><label className="field-label">Tournament</label><select className="pro-input" value={selectedTournament} onChange={(e) => { setSelectedTournament(e.target.value); setSelectedTeam(""); setSelectedTeam2(""); }}><option value="">Select tournament</option>{tournaments.map((tournament) => <option key={tournament.id} value={tournament.id}>{tournament.name}</option>)}</select></div>
            <div className="col-md-6"><label className="field-label">Team 1</label><select className="pro-input" value={selectedTeam} onChange={(e) => { setSelectedTeam(e.target.value); setSelectedTeam2(""); }} disabled={!selectedTournament || approvedRegistrations.length === 0}><option value="">{selectedTournament && approvedRegistrations.length === 0 ? "No approved teams" : "Select team"}</option>{approvedRegistrations.map((registration) => <option key={registration.team_id} value={registration.team_id}>{registration.team_name || `Team #${registration.team_id}`}</option>)}</select></div>
            <div className="col-md-6"><label className="field-label">Team 2</label><select className="pro-input" value={selectedTeam2} onChange={(e) => setSelectedTeam2(e.target.value)} disabled={!selectedTeam}><option value="">Select a different team</option>{team2Options.map((registration) => <option key={registration.team_id} value={registration.team_id}>{registration.team_name || `Team #${registration.team_id}`}</option>)}</select></div>
            <div className="col-md-6"><label className="field-label">Match date and time</label><input type="datetime-local" className="pro-input" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} /></div>
          </div>
          <div className="info-callout mt-4">Only teams with approved registrations for this tournament are available. Approve the team registrations before scheduling.</div>
          <div className="d-flex gap-2 mt-4"><button className="pro-btn pro-btn-primary" onClick={scheduleMatch}>Schedule match</button><button className="pro-btn pro-btn-outline" onClick={() => setPage("dashboard")}>Cancel</button></div>
          {message && <MessageBanner message={message} />}
        </div>
      </AppLayout>
    );
  }

  // =========================
  // MATCH RESULT
  // =========================

  if (page === "matchResult") {
    const unfinishedMatches = matches.filter(
      (match) => !match.winner_name && !match.winner_player_name && !match.result
    );

    return (
      <AppLayout user={user} page={page} setPage={setPage} logout={logout}>
        <PageHeader eyebrow="Organizer scoreboard" title="Enter match result" subtitle="Record the final winner and score for a completed fixture." />
        <div className="form-panel narrow-panel">
          <div className="form-panel-icon"><Icon.Medal /></div>
          {unfinishedMatches.length === 0 ? (
            <EmptyState icon={<Icon.Medal />} title="All match results are up to date" text="There are no unfinished matches waiting for a winner and score." />
          ) : (
            <>
              <label className="field-label">Match</label>
              <select className="pro-input" value={selectedMatch} onChange={(e) => { setSelectedMatch(e.target.value); setWinnerId(""); }}>
                <option value="">Select an unfinished match</option>
                {unfinishedMatches.map((match) => <option key={match.id} value={match.id}>{match.player1_name || match.team1_name} vs {match.player2_name || match.team2_name}</option>)}
              </select>

              {selectedMatch && (() => {
            const match = matches.find((m) => m.id === Number(selectedMatch));
            if (!match) return null;
            return (
              <>
                <label className="field-label mt-3">Winner</label>
                <select className="pro-input" value={winnerId} onChange={(e) => setWinnerId(e.target.value)}>
                  <option value="">Select winner</option>
                  {match.player1_id ? (
                    <>
                      <option value={match.player1_id}>{match.player1_name}</option>
                      <option value={match.player2_id}>{match.player2_name}</option>
                    </>
                  ) : teams.filter((team) => team.id === match.team1_id || team.id === match.team2_id).map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                </select>
              </>
            );
              })()}

              <label className="field-label mt-3">Final result</label>
              <input className="pro-input" placeholder="Example: 2-1" value={result} onChange={(e) => setResult(e.target.value)} />
              <button className="pro-btn pro-btn-primary w-100 mt-4" onClick={enterMatchResult}>Submit result</button>
            </>
          )}
          {message && <MessageBanner message={message} />}
        </div>
      </AppLayout>
    );
  }

  // =========================
  // LEADERBOARD
  // =========================

  if (page === "leaderboard") {
    return (
      <AppLayout user={user} page={page} setPage={setPage} logout={logout}>
        <PageHeader eyebrow="Competitive rankings" title="Leaderboard" subtitle="Follow player performance across tournament matches." />
        {leaderboard.length === 0 ? (
          <EmptyState icon={<Icon.Chart />} title="No leaderboard data" text="Rankings will appear after players complete matches." />
        ) : (
          <div className="pro-card">
            <div className="table-wrap">
              <table className="pro-table leaderboard-table">
                <thead><tr><th>Rank</th><th>Team</th><th>Points</th><th>Wins</th><th>Losses</th></tr></thead>
                <tbody>{leaderboard.map((row, index) => <tr key={`${row.team_name}-${index}`}><td><span className={`rank-badge rank-${row.rank}`}>{row.rank}</span></td><td><strong>{row.team_name}</strong></td><td><span className="points-value">{row.points}</span></td><td>{row.wins}</td><td>{row.losses}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}
      </AppLayout>
    );
  }

  // =========================
  // ADMIN
  // =========================

  if (page === "admin") {
    return (
      <AppLayout user={user} page={page} setPage={setPage} logout={logout}>
        <PageHeader eyebrow="System administration" title="Admin panel" subtitle="Monitor users, platform statistics and audit activity." />
        {message && <MessageBanner message={message} />}
        {adminStats && (
          <div className="row g-3 mb-4">
            {[
              ["Total users", adminStats.total_users, <Icon.Person key="i1" />],
              ["Players", adminStats.players, <Icon.Game key="i2" />],
              ["Organizers", adminStats.organizers, <Icon.Trophy key="i3" />],
              ["Admins", adminStats.admins, <Icon.Gear key="i4" />],
              ["Tournaments", adminStats.tournaments, <Icon.Medal key="i5" />],
              ["Teams", adminStats.teams, <Icon.Users key="i6" />],
              ["Matches", adminStats.matches, <Icon.Target key="i7" />],
            ].map(([title, value, icon]) => <StatCard key={title} icon={icon} label={title} value={value} hint="System total" />)}
          </div>
        )}
        <div className="pro-card mb-4"><div className="section-title-row"><div><span className="kicker">Account directory</span><h2>Users</h2></div><span className="count-pill">{adminUsers.length} accounts</span></div><div className="table-wrap"><table className="pro-table"><thead><tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th></tr></thead><tbody>{adminUsers.map((u) => <tr key={u.id}><td>#{u.id}</td><td><strong>{u.username}</strong></td><td>{u.email}</td><td><RoleBadge role={u.role} /></td></tr>)}</tbody></table></div></div>
        <div className="pro-card"><div className="section-title-row"><div><span className="kicker">Security trail</span><h2>Audit logs</h2></div><span className="count-pill">{auditLogs.length} events</span></div><div className="table-wrap"><table className="pro-table"><thead><tr><th>ID</th><th>User</th><th>Action</th><th>Description</th><th>Created</th></tr></thead><tbody>{auditLogs.map((log) => <tr key={log.id}><td>#{log.id}</td><td>{log.username}</td><td><span className="action-tag">{log.action}</span></td><td>{log.description}</td><td>{log.created_at}</td></tr>)}</tbody></table></div></div>
      </AppLayout>
    );
  }

  return null;
}

// =========================
// ICONS (inline SVG, stroke-based — replaces emoji for a cleaner, professional look)
// =========================

const iconProps = (small) => ({
  width: small ? 13 : 20,
  height: small ? 13 : 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

const Icon = {
  Trophy: ({ small }) => (
    <svg {...iconProps(small)}><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M7 5H4a3 3 0 0 0 3 5M17 5h3a3 3 0 0 1-3 5" /></svg>
  ),
  Users: ({ small }) => (
    <svg {...iconProps(small)}><circle cx="9" cy="8" r="3.2" /><path d="M2.5 19c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5" /><circle cx="17.5" cy="8.5" r="2.4" /><path d="M15.7 13.7c2.7.3 4.8 2.2 4.8 5" /></svg>
  ),
  Target: ({ small }) => (
    <svg {...iconProps(small)}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="0.8" fill="currentColor" /></svg>
  ),
  Chart: ({ small }) => (
    <svg {...iconProps(small)}><path d="M4 19V10M11 19V5M18 19v-7" /><path d="M2.5 19.5h19" /></svg>
  ),
  Person: ({ small }) => (
    <svg {...iconProps(small)}><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5" /></svg>
  ),
  Plus: ({ small }) => (
    <svg {...iconProps(small)}><path d="M12 5v14M5 12h14" /></svg>
  ),
  Clipboard: ({ small }) => (
    <svg {...iconProps(small)}><rect x="5" y="4.5" width="14" height="16" rx="2" /><path d="M9 4.5V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5M8.5 10h7M8.5 14h7M8.5 18h4" /></svg>
  ),
  Calendar: ({ small }) => (
    <svg {...iconProps(small)}><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" /></svg>
  ),
  Medal: ({ small }) => (
    <svg {...iconProps(small)}><circle cx="12" cy="15" r="5.5" /><path d="M9.5 10 7 3.5h3l2 5M14.5 10 17 3.5h-3l-2 5" /><path d="M12 12.3v5.4" /></svg>
  ),
  Gear: ({ small }) => (
    <svg {...iconProps(small)}><circle cx="12" cy="12" r="3.2" /><path d="M12 3.5v2.3M12 18.2v2.3M20.5 12h-2.3M5.8 12H3.5M17.7 6.3l-1.6 1.6M7.9 16.1l-1.6 1.6M17.7 17.7l-1.6-1.6M7.9 7.9 6.3 6.3" /></svg>
  ),
  Game: ({ small }) => (
    <svg {...iconProps(small)}><rect x="2.5" y="7.5" width="19" height="10" rx="4" /><path d="M7.5 12.5h3M9 11v3" /><circle cx="16" cy="11.3" r="0.9" fill="currentColor" /><circle cx="18" cy="13.3" r="0.9" fill="currentColor" /></svg>
  ),
  Chevron: () => (
    <svg {...iconProps()}><path d="M9 6l6 6-6 6" /></svg>
  ),
  Logout: () => (
    <svg {...iconProps()}><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M15 16l4-4-4-4M19 12H9" /></svg>
  ),
  Eye: ({ small }) => (
    <svg {...iconProps(small)}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
  ),
  EyeOff: ({ small }) => (
    <svg {...iconProps(small)}><path d="M3 3l18 18" /><path d="M10.6 5.2A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17.4 17.4 0 0 1-3.6 4.5M6.6 6.6C4 8.3 2 12 2 12s3.6 7 10 7c1.5 0 2.9-.4 4.1-1" /><path d="M9.9 10a3 3 0 0 0 4.1 4.1" /></svg>
  ),
};

// =========================
// DESIGN TOKENS
// Palette: charcoal/ink surfaces with a gold accent (trophies, ranking)
// and a teal accent reserved for "live" / in-progress states.
// Type: Barlow Condensed for headings & data (scoreboard feel),
// Inter for body/UI text.
// =========================

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Barlow+Condensed:wght@500;600;700;800&display=swap');

:root{
  --bg:#f3f7fb;
  --panel:#ffffff;
  --panel-alt:#f8fafc;
  --surface:#edf4ff;
  --line:#e2e8f0;
  --text:#0f172a;
  --muted:#64748b;
  --primary:#2563eb;
  --primary-deep:#1d4ed8;
  --primary-soft:#dfeaff;
  --success:#10b981;
  --success-soft:#d9fce8;
  --warning:#f59e0b;
  --warning-soft:#fff3d6;
  --danger:#ef4444;
  --danger-soft:#fee2e2;
  --shadow:0 16px 40px rgba(15, 23, 42, 0.08);
  --radius:18px;
  --radius-sm:12px;
}

*{box-sizing:border-box}
html,body,#root{margin:0;min-height:100%}
body{background:var(--bg);color:var(--text);font-family:'Inter',ui-sans-serif,system-ui,sans-serif}
button,input,select,textarea{font-family:inherit}
h1,h2,h3,.brand-name,.stat-value,.team-dot,.team-avatar,.rank-badge{font-family:'Barlow Condensed',ui-sans-serif,sans-serif}

.ems-app{min-height:100vh;background:
  radial-gradient(circle at top left, rgba(37,99,235,.08), transparent 28%),
  var(--bg);
  color:var(--text)}

/* ---------- layout shell ---------- */
.ems-sidebar{position:fixed;z-index:20;left:0;top:0;bottom:0;width:250px;background:rgba(255,255,255,.92);backdrop-filter:blur(8px);border-right:1px solid var(--line);padding:22px 18px;display:flex;flex-direction:column}
.ems-main{margin-left:250px;min-height:100vh;padding:24px 28px 48px}
.brand{display:flex;gap:12px;align-items:center;padding:8px 10px 18px;border-bottom:1px solid var(--line);margin-bottom:18px}
.brand-mark{width:42px;height:42px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--primary),#7ea7ff);color:#fff;box-shadow:0 12px 24px rgba(37,99,235,.25)}
.brand-name{font-weight:800;font-size:1.1rem;line-height:1.1}
.brand-subtitle{font-size:11px;color:var(--muted);margin-top:3px;font-weight:600}
.side-label{font-size:10.5px;color:#8090a6;font-weight:700;margin:18px 8px 8px;text-transform:uppercase;letter-spacing:.08em}
.side-nav{display:flex;flex-direction:column;gap:6px}
.side-btn{display:flex;align-items:center;gap:11px;width:100%;border:1px solid transparent;background:transparent;color:var(--muted);padding:11px 12px;border-radius:12px;text-align:left;font-size:14px;font-weight:600;transition:all .18s ease}
.side-btn svg{flex:0 0 auto}
.side-btn:hover{background:var(--panel-alt);color:var(--text);border-color:var(--line)}
.side-btn.active{background:var(--primary-soft);border-color:rgba(37,99,235,.1);color:var(--primary-deep)}
.side-btn.active svg{color:var(--primary-deep)}
.logout-side{margin-top:auto;padding-top:14px}
.side-logout{display:flex;align-items:center;gap:9px;width:100%;border:1px solid rgba(239,68,68,.2);background:transparent;color:var(--danger);border-radius:12px;padding:11px 12px;font-size:14px;font-weight:600}
.side-logout:hover{background:var(--danger-soft)}

.top-userbar{display:flex;justify-content:flex-end;align-items:center;min-height:44px;margin-bottom:20px}
.user-avatar{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#dbeafe,#93c5fd);color:var(--primary-deep);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;border:1px solid rgba(37,99,235,.12)}
.user-role-text{font-size:10px;color:var(--muted);margin-top:1px;font-weight:600}

/* ---------- headings / kickers ---------- */
.page-intro{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:26px}
.page-intro h1,.page-header h1{font-size:2.2rem;font-weight:800;letter-spacing:-.06em;margin:4px 0 6px;line-height:1.05}
.page-intro p,.page-header p{color:var(--muted);margin:0;font-size:14px;line-height:1.6}
.kicker{font-size:11px;font-weight:700;color:var(--muted);letter-spacing:.1em;text-transform:uppercase}
.kicker-on-dark{color:rgba(255,255,255,.72)}
.section-heading{margin:4px 0 16px}
.section-heading h2,.section-title-row h2{font-size:1.3rem;font-weight:700;margin:4px 0 0;letter-spacing:-.04em}

/* ---------- hero ---------- */
.hero-panel{min-height:170px;border:1px solid var(--line);border-radius:22px;padding:26px 28px;display:flex;align-items:center;justify-content:space-between;background:
  linear-gradient(135deg, rgba(37,99,235,.12), rgba(37,99,235,.02)),
  url('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80') center/cover no-repeat;
  box-shadow:var(--shadow)}
.hero-panel h2{font-size:2.1rem;margin:8px 0;font-weight:800;letter-spacing:-.05em;line-height:1.05;color:var(--text)}
.hero-panel p{margin:0;color:var(--muted);font-size:14px}
.hero-icon{font-size:0;color:var(--primary)}
.hero-icon svg{width:56px;height:56px}

/* ---------- stat cards ---------- */
.stat-card{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:18px;min-height:120px;box-shadow:0 8px 20px rgba(15,23,42,.03)}
.stat-icon{color:var(--primary);opacity:.9}
.stat-label{font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.08em}
.stat-value{font-size:2.1rem;font-weight:800;line-height:1;margin:12px 0 8px;letter-spacing:-.05em}
.stat-hint{font-size:11px;color:var(--muted)}

/* ---------- generic cards ---------- */
.pro-card,.form-panel{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:22px;box-shadow:0 8px 18px rgba(15,23,42,.02)}
.action-card{width:100%;height:100%;min-height:150px;text-align:left;background:var(--panel);border:1px solid var(--line);border-radius:18px;color:var(--text);padding:20px;transition:all .18s ease;box-shadow:0 8px 18px rgba(15,23,42,.02)}
.action-card:hover{border-color:rgba(37,99,235,.2);transform:translateY(-2px);box-shadow:0 12px 24px rgba(15,23,42,.05)}
.action-card.accent{background:var(--surface);border-color:rgba(37,99,235,.12)}
.action-card.accent .action-icon{color:var(--primary)}
.action-icon{color:var(--primary);margin-bottom:16px}
.action-icon svg{width:24px;height:24px}
.action-card h3{font-size:1.05rem;font-weight:700;margin-bottom:5px;font-family:'Inter'}
.action-card p{color:var(--muted);font-size:12px;margin:0;line-height:1.5}

.pro-card h3{font-size:1.1rem;font-weight:700;font-family:'Inter'}
.tournament-card p,.team-content p,.text-muted-custom{color:var(--muted);font-size:13px}
.card-topline,.section-title-row{display:flex;align-items:center;justify-content:space-between;gap:12px}
.mini-icon{color:var(--primary)}
.muted-row{display:flex;gap:8px;align-items:center;color:var(--muted);font-size:13px;margin:12px 0}
.muted-row svg{color:var(--muted)}
.card-footer-line{border-top:1px solid var(--line);padding-top:11px;color:var(--muted);font-size:11px;margin-top:18px}
.team-card{display:flex;align-items:center;gap:15px}
.team-avatar,.team-dot{display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#dbeafe,#eff6ff);border:1px solid rgba(37,99,235,.1);color:var(--primary-deep);font-weight:800}
.team-avatar{width:52px;height:52px;border-radius:12px;font-size:21px}
.team-content{flex:1}
.team-content h3{margin:3px 0}
.icon-btn{width:34px;height:34px;border-radius:10px;border:1px solid var(--line);background:transparent;color:var(--muted);display:flex;align-items:center;justify-content:center}
.icon-btn:hover{background:var(--panel-alt);color:var(--text)}

/* ---------- forms ---------- */
.form-panel{max-width:960px}
.narrow-panel{max-width:620px}
.form-panel-icon{color:var(--primary);margin-bottom:16px}
.form-panel-icon svg{width:30px;height:30px}
.field-label{display:block;font-size:11.5px;color:#42516a;font-weight:700;margin-bottom:8px}
.pro-input{width:100%;border:1px solid var(--line);background:var(--panel-alt);color:var(--text);border-radius:12px;padding:11px 13px;outline:none;font-size:14px;transition:border-color .15s,box-shadow .15s}
.pro-input:focus{border-color:rgba(37,99,235,.45);box-shadow:0 0 0 4px rgba(37,99,235,.08)}
.pro-input::placeholder{color:#7c8ba3}
.input-with-action{position:relative}
.input-with-action .pro-input{padding-right:42px}
.input-action-btn{position:absolute;top:50%;right:6px;transform:translateY(-50%);width:30px;height:30px;border:0;background:transparent;color:var(--muted);display:flex;align-items:center;justify-content:center;border-radius:10px}
.input-action-btn:hover{color:var(--text);background:rgba(15,23,42,.03)}
.pro-input option{background:#fff;color:var(--text)}
.pro-textarea{min-height:140px;resize:vertical}
.pro-btn{border-radius:12px;padding:11px 18px;border:1px solid transparent;font-weight:700;font-size:14px;transition:all .15s ease}
.pro-btn-primary{background:var(--primary);color:#fff;box-shadow:0 10px 20px rgba(37,99,235,.18)}
.pro-btn-primary:hover{background:var(--primary-deep)}
.pro-btn-outline{background:var(--panel);border-color:var(--line);color:var(--text)}
.pro-btn-outline:hover{background:var(--panel-alt)}
.pro-btn:disabled{opacity:.5;cursor:not-allowed}
.info-callout{border:1px solid rgba(37,99,235,.12);background:var(--primary-soft);color:var(--primary-deep);border-radius:12px;padding:11px 13px;font-size:12.5px}

/* ---------- banners / badges ---------- */
.message-banner{border:1px solid rgba(16,185,129,.2);background:var(--success-soft);color:#047857;border-radius:12px;padding:10px 14px;font-size:13px;margin:14px 0}
.status-badge,.role-badge{display:inline-flex;align-items:center;border-radius:999px;padding:6px 10px;font-size:10.5px;font-weight:700}
.status-badge.pending{background:var(--warning-soft);color:#b45309}
.status-badge.approved,.status-badge.completed{background:var(--success-soft);color:#047857}
.status-badge.upcoming,.status-badge.scheduled{background:var(--primary-soft);color:var(--primary-deep)}
.status-badge.default{background:#f1f5f9;color:#475569}
.role-badge{background:var(--primary-soft);color:var(--primary-deep)}
.count-pill{border:1px solid var(--line);background:var(--panel-alt);border-radius:999px;padding:5px 10px;color:var(--muted);font-size:11px;font-weight:700}
.small-action{border:0;border-radius:10px;padding:7px 10px;font-size:11px;font-weight:800}
.small-action.approve{background:var(--success-soft);color:#047857}
.small-action.reject{background:var(--danger-soft);color:#b91c1c}
.table-wrap{overflow:auto}
.pro-table{width:100%;border-collapse:separate;border-spacing:0;color:var(--text);font-size:12.5px}
.pro-table th{color:#596a82;font-weight:700;font-size:10.5px;text-align:left;border-bottom:1px solid var(--line);padding:12px}
.pro-table td{padding:14px 12px;border-bottom:1px solid var(--line);vertical-align:middle}
.pro-table tr:last-child td{border-bottom:0}
.pro-table tbody tr:hover td{background:rgba(37,99,235,.015)}
.action-tag{font-size:10px;font-weight:700;color:var(--primary-deep);background:var(--primary-soft);padding:4px 7px;border-radius:999px}
.match-card{padding:22px}
.match-teams{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:16px;text-align:center}
.match-teams>div{display:flex;flex-direction:column;align-items:center;gap:10px}
.team-dot{width:42px;height:42px;border-radius:12px;font-size:1.1rem}
.vs{font-size:11px;font-weight:800;color:var(--muted);font-family:'Barlow Condensed'}
.match-meta{display:flex;justify-content:space-between;gap:12px;color:var(--muted);font-size:11px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:11px 0;margin-top:16px}
.match-meta span{display:flex;align-items:center;gap:5px}
.result-strip{display:flex;justify-content:space-between;gap:10px;align-items:center;padding-top:13px;color:var(--muted);font-size:11px}
.result-strip strong{color:var(--text);font-size:16px;font-weight:800}
.rank-badge{display:inline-flex;width:26px;height:26px;border-radius:10px;align-items:center;justify-content:center;background:var(--panel-alt);font-weight:800}
.rank-1{background:var(--warning-soft);color:#b45309}
.rank-2{background:var(--primary-soft);color:var(--primary-deep)}
.rank-3{background:#edf7ff;color:#1d4ed8}
.points-value{font-weight:800;color:var(--primary-deep);font-size:15px}
.empty-state{text-align:center;padding:44px 20px;border:1px dashed var(--line);border-radius:18px;color:var(--muted);background:rgba(255,255,255,.5)}
.empty-icon{color:var(--primary);margin-bottom:10px}
.empty-icon svg{width:30px;height:30px}
.empty-state h3{font-size:16px;color:var(--text);font-family:'Inter';font-weight:700}
.empty-state p{font-size:12.5px}
.empty-state.compact{padding:24px 15px}

/* ---------- auth ---------- */
.auth-shell{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px 20px;background:var(--bg)}
.auth-card{width:100%;max-width:440px;background:rgba(255,255,255,.95);border:1px solid var(--line);border-radius:24px;padding:30px 28px;box-shadow:var(--shadow);margin:0 auto}
.auth-card-wide{max-width:620px}
.auth-brand{display:flex;align-items:center;gap:12px;margin-bottom:20px}
.auth-heading{margin-bottom:20px}
.auth-heading h1{font-size:2.2rem;font-weight:800;line-height:1.1;margin:7px 0;letter-spacing:-.06em}
.auth-heading p{color:var(--muted);font-size:14px;line-height:1.6}
.password-panel{background:var(--panel-alt);border:1px solid var(--line);padding:12px;border-radius:12px;margin-top:8px}
.password-panel-title{font-size:11.5px;font-weight:700;color:#475569;margin-bottom:8px}
.password-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11.5px}
.rule-ok{color:var(--success)}
.rule-bad{color:#7a8697}
.auth-divider{display:flex;align-items:center;gap:10px;color:#6b7280;font-size:11px;font-weight:700;margin:18px 0}
.auth-divider:before,.auth-divider:after{content:"";height:1px;background:var(--line);flex:1}

@media(max-width:980px){
  .ems-sidebar{width:220px}.ems-main{margin-left:220px;padding:20px}.auth-card{max-width:560px}
}

@media(max-width:760px){
  .ems-sidebar{position:relative;width:100%;height:auto;min-height:0;padding:16px;border-right:none;border-bottom:1px solid var(--line)}
  .ems-main{margin-left:0;padding:18px}.logout-side{margin-top:14px}.side-nav{display:grid;grid-template-columns:1fr 1fr;gap:6px}.page-intro{display:block}.page-intro .role-badge{margin-top:12px}.hero-panel{padding:20px}.match-meta{display:block}.match-meta span{margin:4px 0}.auth-card{padding:22px}
}
`;

const NAV_MAIN = [
  { key: "tournaments", label: "Upcoming Tournaments", icon: <Icon.Trophy /> },
  { key: "playerApplications", label: "Apply to Match", icon: <Icon.Clipboard /> },
  { key: "approvedApplications", label: "Approved Applications", icon: <Icon.Medal /> },
  { key: "leaderboard", label: "Scoreboard", icon: <Icon.Chart /> },
];

const AppLayout = ({ user, page, setPage, logout, children }) => {
  const go = (target) => setPage(target);

  const organizerNav = [
    { key: "dashboard", label: "Dashboard", icon: <Icon.Trophy /> },
    { key: "createTournament", label: "Create Tournament", icon: <Icon.Plus /> },
    { key: "applications", label: "Approve Players", icon: <Icon.Clipboard /> },
    { key: "registrations", label: "Approve Teams", icon: <Icon.Users /> },
    { key: "scheduleMatch", label: "Schedule Match", icon: <Icon.Calendar /> },
    { key: "matchResult", label: "Scoreboard", icon: <Icon.Medal /> },
  ];

  const playerNav = NAV_MAIN;

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="ems-app">
        <aside className="ems-sidebar">
          <div className="brand">
            <div className="brand-mark"><Icon.Trophy /></div>
            <div><div className="brand-name">Esports Management</div><div className="brand-subtitle">Professional operations</div></div>
          </div>

          <div className="side-nav">
            {(user?.role === "ORGANIZER" ? organizerNav : playerNav).map((item) => (
              <button key={item.key} className={`side-btn ${page === item.key ? "active" : ""}`} onClick={() => go(item.key)}>
                {item.icon}{item.label}
              </button>
            ))}
          </div>

          <div className="logout-side"><button className="side-logout" onClick={logout}><Icon.Logout />Logout</button></div>
        </aside>
        <main className="ems-main">
          <div className="top-userbar">
            <div className="d-flex align-items-center gap-2">
              <div className="user-avatar">{user?.username?.charAt(0).toUpperCase()}</div>
              <div><strong>{user?.username}</strong><div className="user-role-text">{user?.role}</div></div>
            </div>
          </div>
          {children}
        </main>
      </div>
    </>
  );
};

const AuthLayout = ({ children }) => (
  <>
    <style>{GLOBAL_CSS}</style>
    <div className="auth-shell">{children}</div>
  </>
);

const PageHeader = ({ eyebrow, title, subtitle }) => (
  <div className="page-header mb-4"><span className="kicker">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>
);

const MessageBanner = ({ message }) => <div className="message-banner">{message}</div>;

const RoleBadge = ({ role }) => <span className="role-badge">{role}</span>;

const StatusBadge = ({ status }) => {
  const value = String(status || "unknown").toLowerCase();
  const cls = ["pending","approved","completed","upcoming","running","scheduled"].includes(value) ? value : "default";
  return <span className={`status-badge ${cls}`}>{value}</span>;
};

const StatCard = ({ icon, label, value, hint }) => (
  <div className="col-xl-3 col-md-6"><div className="stat-card h-100"><div className="d-flex justify-content-between align-items-start"><div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-hint">{hint}</div></div><div className="stat-icon">{icon}</div></div></div></div>
);

const ActionCard = ({ icon, title, text, onClick, accent }) => (
  <div className="col-xl-4 col-md-6"><button className={`action-card ${accent ? "accent" : ""}`} onClick={onClick}><div className="action-icon">{icon}</div><h3>{title}</h3><p>{text}</p></button></div>
);

const EmptyState = ({ icon, title, text, compact }) => (
  <div className={`empty-state ${compact ? "compact" : ""}`}><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{text}</p></div>
);

const PasswordRule = ({ ok, text }) => <div className={ok ? "rule-ok" : "rule-bad"}>{ok ? "✓" : "○"} {text}</div>;

export default App;
