const players=[

{name:"Oliver",points:0},
{name:"Loui",points:0},
{name:"Lova",points:0},
{name:"Kattis",points:0},
{name:"Emelie",points:0},
{name:"Jens",points:0},
{name:"Per",points:0},
{name:"Fredrik",points:0}

]

players.sort((a,b)=>b.points-a.points)

let html=""

players.forEach((p,i)=>{

let medal=""

if(i==0) medal="🥇"
if(i==1) medal="🥈"
if(i==2) medal="🥉"

html+=`

<div class="row">

<div>${medal} ${p.name}</div>

<div class="points">${p.points}</div>

</div>

`

})

document.getElementById("leaderboard").innerHTML=html
