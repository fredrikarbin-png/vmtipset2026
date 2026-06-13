fetch("data.json")
.then(response => response.json())
.then(data => {
    renderLeaderboard(data.players);
    renderMatches(data.matches);
});

function renderLeaderboard(players) {
    const sorted = players.map(p => ({...p, points: 0}))
        .sort((a,b) => b.points - a.points);

    let html = "";

    sorted.forEach((p,i) => {
        let medal = "";
        if(i === 0) medal = "🥇";
        else if(i === 1) medal = "🥈";
        else if(i === 2) medal = "🥉";

        html += `
            <div class="row">
                <div>${medal} ${p.name}</div>
                <div class="points">${p.points}</div>
            </div>
        `;
    });

    document.getElementById("leaderboard").innerHTML = html;
}

function renderMatches(matches) {
    let html = "";

    matches.forEach(match => {
        const result = match.status === "finished"
            ? `${match.resultHome}-${match.resultAway}`
            : "Ej spelad";

        html += `
            <div class="row">
                <div>
                    <strong>Grupp ${match.group}</strong><br>
                    ${match.home} - ${match.away}
                </div>
                <div class="points">${result}</div>
            </div>
        `;
    });

    document.getElementById("matches").innerHTML = html;
}
