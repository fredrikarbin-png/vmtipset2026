const fs = require("fs");

const TOKEN = process.env.FOOTBALL_DATA_TOKEN;
const FILE = "data/matches.json";
const API_URL = "https://api.football-data.org/v4/competitions/WC/matches?season=2026";

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
      same(m.homeTeam?.name, match.home) &&
      same(m.awayTeam?.name, match.away)
    );

    if (!apiMatch) continue;

    match.apiId = apiMatch.id;
    match.kickoff = apiMatch.utcDate;

    if (apiMatch.status === "FINISHED") {
      match.status = "finished";
      match.resultHome = apiMatch.score.fullTime.home;
      match.resultAway = apiMatch.score.fullTime.away;
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

  const x = clean(a);
  const y = clean(b);

  return x === y || x.includes(y) || y.includes(x);
}

function clean(name) {
  return name
    .toLowerCase()
    .replaceAll(".", "")
    .replaceAll("'", "")
    .replaceAll("’", "")
    .replaceAll("å", "a")
    .replaceAll("ä", "a")
    .replaceAll("ö", "o")
    .replaceAll("côte divoire", "ivory coast")
    .replaceAll("cote divoire", "ivory coast")
    .replaceAll("cote d ivoire", "ivory coast")
    .replaceAll("cotedivoire", "ivory coast")
    .replaceAll("south korea", "rep of korea")
    .replaceAll("korea republic", "rep of korea")
    .replaceAll("czechia", "czech rep")
    .replaceAll("czech republic", "czech rep")
    .replaceAll("bosnia and herzegovina", "bosnia/herzeg")
    .replaceAll("bosnia herzegovina", "bosnia/herzeg")
    .replaceAll("congo dr", "dr congo")
    .replaceAll("democratic republic of congo", "dr congo")
    .replaceAll("schweiz", "switzerland")
    .replaceAll("suisse", "switzerland")
    .replaceAll("usa", "united states")
    .replaceAll("united states of america", "united states")
    .trim();
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});