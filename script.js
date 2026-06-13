fetch("data.json")
.then(response => response.json())
.then(data => {

    let players = data.players;

    players.forEach(player => {

        player.points = 0;

    });

    players.sort((a,b)=>b.points-a.points);

    let html="";

    players.forEach((p,i)=>{

        let medal="";

        if(i===0) medal="🥇";
        else if(i===1) medal="🥈";
        else if(i===2) medal="🥉";

        html += `

        <div class="row">

            <div>${medal} ${p.name}</div>

            <div class="points">${p.points}</div>

        </div>

        `;

    });

    document.getElementById("leaderboard").innerHTML = html;

});
