const Database = require('better-sqlite3');
const db = new Database('./predictions.db');

const results = db.prepare(`
  SELECT away_team, home_team, away_win_prob, home_win_prob 
  FROM predictions 
  WHERE confidence = 'High'
`).all();

console.log('\nHIGH CONFIDENCE PREDICTIONS:\n');
results.forEach(r => {
  const fav = r.home_win_prob > r.away_win_prob ? r.home_team : r.away_team;
  const prob = Math.max(r.home_win_prob, r.away_win_prob);
  console.log(`${r.away_team} @ ${r.home_team} - Favorite: ${fav} (${prob.toFixed(1)}%)`);
});

db.close();
