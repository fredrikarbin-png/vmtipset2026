let appData = {};

loadData();

async function loadData() {
  const players = await fetch(`data/players.json?v=${cacheBuster}`).then(response => response.json());
  const matchesData = await fetch(`data/matches.json?v=${cacheBuster}`).then(response => response.json());

  const predictions = [];

  for (const player of players) {
    const playerPredictions = await fetch(`data/predictions/${player.id}.json?v=${cacheBuster}`)
      .then(response => response.json())
      .catch(() => []);

    playerPredictions.forEach(prediction => {
      predictions.push({
        playerId: player.id,
        matchId: prediction.matchId,
        home: prediction.home,
        away: prediction.away
      });
    });
  }

  appData = {
    updatedAt: matchesData.updatedAt,
    players,
    matches: matchesData.matches,
    predictions
  };

  if (window.location.pathname.includes("player.html")) {
    renderPlayerPageFromData();
  } else if (window.location.pathname.includes("match.html")) {
    renderMatchPageFromData();
  } else {
    renderAll();
  }
}

function showView(viewId) {
  document.querySelectorAll(".view").forEach(view => {
    view.classList.add("hidden");
  });

  document.getElementById(viewId).classList.remove("hidden");
}

window.showView = showView;

function calculatePoints(prediction, match) {
  if (!prediction || match.status !== "finished") return 0;

  const predDiff = Math.sign(prediction.home - prediction.away);
  const realDiff = Math.sign(match.resultHome - match.resultAway);

  let points = 0;

  if (predDiff === realDiff) points += 2;

  if (prediction.home === match.resultHome && prediction.away === match.resultAway) {
    points += 1;
  }

  if (prediction.home === match.resultHome || prediction.away === match.resultAway) {
    points += 1;
  }

  return points;
}

function getPlayerStats(playerId) {
  let total = 0;
  let fourPointers = 0;

  appData.matches.forEach(match => {
    const prediction = (appData.predictions || []).find(
      p => p.playerId === playerId && p.matchId === match.id
    );

    const points = calculatePoints(prediction, match);

    total += points;
    if (points === 4) fourPointers++;
  });

  return { total, fourPointers };
}

function getRankedPlayers() {
  return appData.players
    .map(player => {
      const stats = getPlayerStats(player.id);

      return {
        ...player,
        points: stats.total,
        fourPointers: stats.fourPointers
      };
    })
    .sort((a, b) => b.points - a.points || b.fourPointers - a.fourPointers);
}

function renderAll() {
  renderPodium();
  renderLastUpdated();
  renderLeaderboard("homeLeaderboard", false);
  renderLeaderboard("leaderboardList", false);
  renderMatches("matchesList", appData.matches);
  renderLatestMatches();
  renderPlayers();
  renderStats();
  renderHomeFourPointers();
}

function renderLastUpdated() {
  const element = document.getElementById("lastUpdated");
  if (!element) return;

  element.innerHTML = appData.updatedAt
    ? `<div class="last-updated">🟢 Senast uppdaterad: ${appData.updatedAt}</div>`
    : "";
}

function renderLeaderboard(elementId, limit) {
  const players = getRankedPlayers();
  const shownPlayers = limit ? players.slice(0, 3) : players;

  let html = "";

  shownPlayers.forEach((player, index) => {
    const medal =
      index === 0 ? "🥇" :
      index === 1 ? "🥈" :
      index === 2 ? "🥉" :
      index + 1;

    html += `
      <a class="player-link" href="player.html?player=${player.id}">
        <div class="row">
          <div>
            ${medal} ${player.name}<br>
            <span class="badge">${player.fourPointers} st 4-poängare</span>
          </div>
          <div class="points">${player.points} p</div>
        </div>
      </a>
    `;
  });

  document.getElementById(elementId).innerHTML = html;
}

function renderPodium() {
  const players = getRankedPlayers().slice(0, 3);

  let html = `<div class="podium">`;

  players.forEach((player, index) => {
    const medal =
      index === 0 ? "🥇" :
      index === 1 ? "🥈" :
      "🥉";

    const cssClass =
      index === 0 ? "first" :
      index === 1 ? "second" :
      "third";

    html += `
      <a class="player-link" href="player.html?player=${player.id}">
        <div class="podium-card ${cssClass}">
          <div>
            <span class="podium-rank">${medal}</span>
            <span class="podium-name">${player.name}</span><br>
            <span class="small-stat">${player.fourPointers} st 4-poängare</span>
          </div>
          <div class="points">${player.points} p</div>
        </div>
      </a>
    `;
  });

  html += `</div>`;

  document.getElementById("podium").innerHTML = html;
}

function renderHomeFourPointers() {
  const players = getRankedPlayers()
    .sort((a, b) => b.fourPointers - a.fourPointers || b.points - a.points);

  let html = "";

  players.forEach((player, index) => {
    html += `
      <a class="player-link" href="player.html?player=${player.id}">
        <div class="row">
          <div>${index + 1}. ${player.name}</div>
          <div class="points">${player.fourPointers}</div>
        </div>
      </a>
    `;
  });

  document.getElementById("homeFourPointers").innerHTML = html;
}

function renderLatestMatches() {
  let latest = appData.matches
    .filter(match =>
      match.status === "finished" &&
      match.kickoff
    )
    .sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff))
    .slice(0, 5);

  if (latest.length === 0) {
    latest = appData.matches
      .filter(match => match.status === "finished")
      .slice(-5)
      .reverse();
  }

  renderMatches("latestMatches", latest);
}

function renderMatches(elementId, matches) {
  let html = "";

  matches.forEach(match => {
    const result = match.status === "finished"
      ? `${match.resultHome}-${match.resultAway}`
      : "Ej spelad";

    html += `
      <a class="player-link" href="match.html?match=${match.id}">
        <div class="row">
          <div>
            <strong>${match.home} - ${match.away}</strong><br>
            <span class="badge">Grupp ${match.group}</span>
          </div>
          <div class="points">${result}</div>
        </div>
      </a>
    `;
  });

  document.getElementById(elementId).innerHTML = html;
}

function renderPlayers() {
  let html = "";

  appData.players.forEach(player => {
    const stats = getPlayerStats(player.id);

    html += `
      <a class="player-link" href="player.html?player=${player.id}">
        <div class="row">
          <div>
            ${player.name}<br>
            <span class="badge">${stats.fourPointers} st 4-poängare</span>
          </div>
          <div class="points">${stats.total} p ›</div>
        </div>
      </a>
    `;
  });

  document.getElementById("playersList").innerHTML = html;
}

function renderStats() {
  const finishedMatches = appData.matches.filter(
    match => match.status === "finished"
  ).length;

  const maxPoints = finishedMatches * 4;

  const players = appData.players.map(player => {
    const stats = getPlayerStats(player.id);
    const hitRate = maxPoints > 0
      ? Math.round((stats.total / maxPoints) * 100)
      : 0;

    return { ...player, ...stats, hitRate };
  });

  const fourPointerList = [...players].sort(
    (a, b) => b.fourPointers - a.fourPointers || b.total - a.total
  );

  const hitRateList = [...players].sort(
    (a, b) => b.hitRate - a.hitRate || b.total - a.total
  );

  let html = `<h3>🔥 Flest 4-poängare</h3>`;

  fourPointerList.forEach((player, index) => {
    html += `
      <div class="row">
        <div>${index + 1}. ${player.name}</div>
        <div class="points">${player.fourPointers}</div>
      </div>
    `;
  });

  html += `<br><h3>🎯 Bäst träffprocent</h3>`;

  hitRateList.forEach((player, index) => {
    html += `
      <div class="row">
        <div>${index + 1}. ${player.name}</div>
        <div class="points">${player.hitRate}%</div>
      </div>
    `;
  });

  document.getElementById("statsList").innerHTML = html;
}

function renderPlayerPageFromData() {
  const params = new URLSearchParams(window.location.search);
  const playerId = params.get("player");

  const player = appData.players.find(p => p.id === playerId);
  if (!player) return;

  const stats = getPlayerStats(player.id);

  const finishedMatches = appData.matches.filter(
    match => match.status === "finished"
  ).length;

  const maxPoints = finishedMatches * 4;

  const hitRate = maxPoints > 0
    ? Math.round((stats.total / maxPoints) * 100)
    : 0;

  document.getElementById("playerTitle").innerHTML = `👤 ${player.name}`;

  document.getElementById("playerSummary").innerHTML = `
    <div class="summary-grid">
      <div class="summary-box">
        <div>Totalpoäng</div>
        <div class="summary-value">${stats.total} p</div>
      </div>
      <div class="summary-box">
        <div>4-poängare</div>
        <div class="summary-value">${stats.fourPointers}</div>
      </div>
      <div class="summary-box">
        <div>Träffprocent</div>
        <div class="summary-value">${hitRate}%</div>
      </div>
    </div>
  `;

  let html = "";

  appData.matches.forEach(match => {
    const prediction = (appData.predictions || []).find(
      p => p.playerId === player.id && p.matchId === match.id
    );

    const points = calculatePoints(prediction, match);

    const tip = prediction ? `${prediction.home}-${prediction.away}` : "-";

    const result = match.status === "finished"
      ? `${match.resultHome}-${match.resultAway}`
      : "Ej spelad";

    html += `
      <div class="match-card score-${points}">
        <div class="match-top">
          <div>
            <strong>${match.home} - ${match.away}</strong>
            <div class="match-meta">Grupp ${match.group}</div>
            <div class="match-meta">Tips: ${tip} | Resultat: ${result}</div>
          </div>
          <div class="points">+${points}</div>
        </div>
      </div>
    `;
  });

  document.getElementById("playerMatches").innerHTML = html;
}

function renderMatchPageFromData() {
  const params = new URLSearchParams(window.location.search);
  const matchId = params.get("match");

  const match = appData.matches.find(m => m.id === matchId);
  if (!match) return;

  const result = match.status === "finished"
    ? `${match.resultHome}-${match.resultAway}`
    : "Ej spelad";

  document.getElementById("matchTitle").innerHTML = `⚽ ${match.home} - ${match.away}`;

  document.getElementById("matchSummary").innerHTML = `
    <div class="row">
      <div>Grupp</div>
      <div class="points">${match.group}</div>
    </div>
    <div class="row">
      <div>Status</div>
      <div class="points">${match.status}</div>
    </div>
    <div class="row">
      <div>Resultat</div>
      <div class="points">${result}</div>
    </div>
  `;

  const rankedPlayers = appData.players.map(player => {
    const prediction = (appData.predictions || []).find(
      p => p.playerId === player.id && p.matchId === match.id
    );

    const points = calculatePoints(prediction, match);

    return {
      ...player,
      prediction,
      points
    };
  }).sort((a, b) => b.points - a.points);

  let html = "";

  rankedPlayers.forEach(player => {
    const tip = player.prediction
      ? `${player.prediction.home}-${player.prediction.away}`
      : "-";

    html += `
      <a class="player-link" href="player.html?player=${player.id}">
        <div class="match-card score-${player.points}">
          <div class="match-top">
            <div>
              <strong>${player.name}</strong>
              <div class="match-meta">Tips: ${tip}</div>
            </div>
            <div class="points">+${player.points}</div>
          </div>
        </div>
      </a>
    `;
  });

  document.getElementById("matchPredictions").innerHTML = html;
}