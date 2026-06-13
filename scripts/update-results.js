const fs = require("fs");

const data = JSON.parse(fs.readFileSync("data/matches.json", "utf8"));

data.updatedAt = new Date().toLocaleString("sv-SE", {
  timeZone: "Europe/Stockholm"
});

fs.writeFileSync(
  "data/matches.json",
  JSON.stringify(data, null, 2)
);

console.log("matches.json uppdaterad");