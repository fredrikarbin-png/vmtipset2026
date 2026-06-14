const fs = require("fs");

const TOKEN = process.env.FOOTBALL_DATA_TOKEN;
const FILE = "data/matches.json";
const API_URL = "https://api.football-data.org/v4/competitions/WC/matches?season=2026";

const TEAM_ALIASES = {
  "rep of korea": "korea republic",
  "south korea": "korea republic",

  "czech rep": "czechia",
  "czech republic": "czechia",

  "bosnia/herzeg": "bosnia and herzegovina",
  "bosnia herzeg": "bosnia and herzegovina",
  "bosnia herzegovina": "bosnia and herzegovina",
  "bosnia/herzeg": "bosnia and herzegovina",
  "bosnia herzeg": "bosnia and herzegovina",
  "bosnia herzegovina": "bosnia and herzegovina",
  "bosniaherzeg": "bosnia and herzegovina",
  "bosniaherzegovina": "bosnia and herzegovina",

  "cape verde": "cape verde",
  "cape verde islands": "cape verde",
  "cabo verde": "cape verde",

  "ivory coast": "cote divoire",
  "côte divoire": "cote divoire",
  "cote d ivoire": "cote divoire",

  "dr congo": "congo dr",
  "democratic republic of congo": "congo dr",

  "cape verde": "cabo verde",

  "ir iran": "iran",
  "iran": "iran",

  "usa": "united states",
  "united states of america": "united states",

  "curacao": "curacao",
  "curaçao": "curacao"
};

async function main() {
  if (!TOKEN) throw new Error("FOOTBALL_DATA_TOKEN saknas");

  const data = JSON.parse(fs.readFileSync(FILE, "utf8"));

  const response = await fetch(API_URL, {
    headers: {
      "X-Auth-Token": TOKEN
    }
  });

  if (!response.ok) {
    throw new Error(`API-fel ${response.status}: ${await response.text()}`);
  }

  const apiData = await response.json();

  for (const match of data.matches) {
    const apiMatch = apiData.matches.find(m =>
      (
        same(m.homeTeam?.name, match.home) &&
        same(m.awayTeam?.name, match.away)
      ) ||
      (
        same(m.homeTeam?.name, match.away) &&
        same(m.awayTeam?.name, match.home)
      )
    );

    const candidates = apiData.matches.filter(m =>
      same(m.homeTeam?.name, match.home) ||
      same(m.awayTeam?.name, match.away) ||
      same(m.homeTeam?.name, match.away) ||
      same(m.awayTeam?.name, match.home)
    );

    if (match.home.includes("Cape") || match.away.includes("Cape")) {
      console.log("API-kandidater:", candidates.map(c =>
        `${c.homeTeam.name} - ${c.awayTeam.name}`
      ));
    }    

    if (!apiMatch) {
      console.log(`Ingen API-match hittades för: ${match.home} - ${match.away}`);
      continue;
    }

    const reversed =
      same(apiMatch.homeTeam?.name, match.away) &&
      same(apiMatch.awayTeam?.name, match.home);

    match.apiId = apiMatch.id;
    match.kickoff = apiMatch.utcDate;

    if (apiMatch.status === "FINISHED") {
      match.status = "finished";

      if (reversed) {
        match.resultHome = apiMatch.score.fullTime.away;
        match.resultAway = apiMatch.score.fullTime.home;
      } else {
        match.resultHome = apiMatch.score.fullTime.home;
        match.resultAway = apiMatch.score.fullTime.away;
      }
    } else {
      match.status = "scheduled";
      match.resultHome = null;
      match.resultAway = null;
    }
  }

  data.updatedAt = new Date().toLocaleString("sv-SE", {
    timeZone: "Europe/Stockholm"
  });

  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  console.log("Klart! matches.json uppdaterad.");
}

function same(a, b) {
  if (!a || !b) return false;

  return clean(a) === clean(b);
}

function clean(name) {
  let cleaned = name
    .toLowerCase()
    .replaceAll(".", "")
    .replaceAll("'", "")
    .replaceAll("’", "")
    .replaceAll("å", "a")
    .replaceAll("ä", "a")
    .replaceAll("ö", "o")
    .replaceAll("é", "e")
    .replaceAll("è", "e")
    .replaceAll("ê", "e")
    .replaceAll("ç", "c")
    .replaceAll("ô", "o")
    .replaceAll("ü", "u")
    .replaceAll(" & ", " and ")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .trim();

  cleaned = cleaned.replace(/[^a-z0-9 ]/g, "");

  return TEAM_ALIASES[cleaned] || cleaned;
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});