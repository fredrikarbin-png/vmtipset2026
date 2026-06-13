let appData = {};

fetch("data.json")
  .then(response => response.json())
  .then(data => {
    appData = data;
    renderAll();
  });

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
  if (prediction.home === match.resultHome && prediction.away === match.resultAway) points += 1;
  if (prediction.home === match.resultHome || prediction.away === match.resultAway) points += 1;

  return points;
}

function getPlayerStats(playerId) {
  let total = 0;
  let fourPointers = 0;

  appData.matches.forEach(match => {
    const prediction = appData.predictions.find(p => p.playerId === playerId && p.matchId === match.id);
    const points = calculatePoints(prediction, match);

    total += points;
    if (points === 4) fourPointers++;
  });

  return { total, fourPointers };
}

function renderAll() {
  renderLeaderboard("homeLeaderboard", true);
  renderLeaderboard("leaderboardList", false);
  renderMatches("matchesList", appData.matches);
  renderMatches("latestMatches", appData.matches.slice(0, 5));
  renderPlayers();
  renderStats();
}

function renderLeaderboard(elementId, limit) {
  const players = appData.players
    .map(p => {
      const stats = getPlayerStats(p.id);
      return { ...p, points: stats.total, fourPointers: stats.fourPointers };
    })
    .sort((a, b) => b.points - a.points || b.fourPointers - a.fourPointers);

  const shownPlayers = limit ? players.slice(0, 3) : players;

  let html = "";

  shownPlayers.forEach((p, i) => {
    let medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1;

    html += `
      <div class="row">
        <div>${medal} ${p.name}<br><span class="badge">${p.fourPointers} st 4-poängare</span></div>
        <div class="points">${p.points} p</div>
      </div>
    `;
  });

  document.getElementById(elementId).innerHTML = html;
}

function renderMatches(elementId, matches) {
  let html = "";

  matches.forEach(match => {
    const result = match.status === "finished"
      ? `${match.resultHome}-${match.resultAway}`
      : "Ej spelad";

    html += `
      <div class="row">
        <div>
          <strong>${match.home} - ${match.away}</strong><br>
          <span class="badge">Grupp ${match.group}</span>
        </div>
        <div class="points">${result}</div>
      </div>
    `;
  });

  document.getElementById(elementId).innerHTML = html;
}

function renderPlayers() {
  let html = "";

  appData.players.forEach(player => {
    const stats = getPlayerStats(player.id);

    html += `
      <div class="row">
        <div>${player.name}<br><span class="badge">${stats.fourPointers} st 4-poängare</span></div>
        <div class="points">${stats.total} p</div>
      </div>
    `;
  });

  document.getElementById("playersList").innerHTML = html;
}

function renderStats() {
  const players = appData.players
    .map(p => {
      const stats = getPlayerStats(p.id);
      return { ...p, ...stats };
    })
    .sort((a, b) => b.fourPointers - a.fourPointers);

  let html = "";

  players.forEach((p, i) => {
    html += `
      <div class="row">
        <div>${i + 1}. ${p.name}</div>
        <div class="points">${p.fourPointers}</div>
      </div>
    `;
  });

  document.getElementById("statsList").innerHTML = html;
}
