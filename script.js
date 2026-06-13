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

function renderAll() {
  renderLeaderboard("homeLeaderboard", true);
  renderLeaderboard("leaderboardList", false);
  renderMatches("matchesList", appData.matches);
  renderMatches("latestMatches", appData.matches.slice(0, 5));
  renderPlayers();
}

function renderLeaderboard(elementId, limit) {
  const players = appData.players
    .map(p => ({ ...p, points: 0 }))
    .sort((a, b) => b.points - a.points);

  const shownPlayers = limit ? players.slice(0, 3) : players;

  let html = "";

  shownPlayers.forEach((p, i) => {
    let medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1;

    html += `
      <div class="row">
        <div>${medal} ${p.name}</div>
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
    html += `
      <div class="row">
        <div>${player.name}</div>
        <div class="points">›</div>
      </div>
    `;
  });

  document.getElementById("playersList").innerHTML = html;
}

window.showView = showView;
