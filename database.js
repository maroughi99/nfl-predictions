const Database = require('better-sqlite3');
const path = require('path');

// Initialize SQLite database
const db = new Database(path.join(__dirname, 'predictions.db'));

// Create tables if they don't exist
function initDatabase() {
  // Predictions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT NOT NULL,
      game_date TEXT NOT NULL,
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      home_win_prob REAL NOT NULL,
      away_win_prob REAL NOT NULL,
      predicted_home_score INTEGER NOT NULL,
      predicted_away_score INTEGER NOT NULL,
      confidence TEXT NOT NULL,
      weather_condition TEXT,
      weather_temp INTEGER,
      prediction_time TEXT NOT NULL,
      UNIQUE(game_id, game_date)
    )
  `);

  // Actual results table
  db.exec(`
    CREATE TABLE IF NOT EXISTS actual_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT NOT NULL UNIQUE,
      game_date TEXT NOT NULL,
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      home_score INTEGER NOT NULL,
      away_score INTEGER NOT NULL,
      winner TEXT NOT NULL,
      updated_time TEXT NOT NULL
    )
  `);

  // Accuracy metrics table (summary stats)
  db.exec(`
    CREATE TABLE IF NOT EXISTS accuracy_summary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total_predictions INTEGER DEFAULT 0,
      total_completed INTEGER DEFAULT 0,
      winner_correct INTEGER DEFAULT 0,
      winner_accuracy REAL DEFAULT 0,
      avg_home_score_diff REAL DEFAULT 0,
      avg_away_score_diff REAL DEFAULT 0,
      high_confidence_correct INTEGER DEFAULT 0,
      high_confidence_total INTEGER DEFAULT 0,
      medium_confidence_correct INTEGER DEFAULT 0,
      medium_confidence_total INTEGER DEFAULT 0,
      low_confidence_correct INTEGER DEFAULT 0,
      low_confidence_total INTEGER DEFAULT 0,
      last_updated TEXT NOT NULL
    )
  `);

  console.log('✅ Database initialized');
}

// Save a prediction
function savePrediction(prediction, gameId, gameDate) {
  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO predictions (
        game_id, game_date, home_team, away_team,
        home_win_prob, away_win_prob,
        predicted_home_score, predicted_away_score,
        confidence, weather_condition, weather_temp,
        prediction_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      gameId,
      gameDate,
      prediction.team1.code,
      prediction.team2.code,
      parseFloat(prediction.team1.probability),
      parseFloat(prediction.team2.probability),
      prediction.team1.predictedScore,
      prediction.team2.predictedScore,
      prediction.confidence,
      prediction.weather?.condition || 'Unknown',
      prediction.weather?.temperature || null,
      new Date().toISOString()
    );

    return true;
  } catch (error) {
    console.error('Error saving prediction:', error.message);
    return false;
  }
}

// Save actual game result
function saveActualResult(gameId, gameDate, homeTeam, awayTeam, homeScore, awayScore) {
  try {
    const winner = homeScore > awayScore ? homeTeam : awayScore > homeScore ? awayTeam : 'TIE';
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO actual_results (
        game_id, game_date, home_team, away_team,
        home_score, away_score, winner, updated_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      gameId,
      gameDate,
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      winner,
      new Date().toISOString()
    );

    return true;
  } catch (error) {
    console.error('Error saving actual result:', error.message);
    return false;
  }
}

// Get all predictions with their actual results
function getPredictionsWithResults() {
  const stmt = db.prepare(`
    SELECT 
      p.*,
      r.home_score as actual_home_score,
      r.away_score as actual_away_score,
      r.winner as actual_winner
    FROM predictions p
    LEFT JOIN actual_results r ON p.game_id = r.game_id
    ORDER BY p.game_date DESC, p.prediction_time DESC
  `);

  return stmt.all();
}

// Calculate accuracy metrics
function calculateAccuracy() {
  // Get all predictions with results
  const stmt = db.prepare(`
    SELECT 
      p.*,
      r.home_score as actual_home_score,
      r.away_score as actual_away_score,
      r.winner as actual_winner
    FROM predictions p
    INNER JOIN actual_results r ON p.game_id = r.game_id
  `);

  const completed = stmt.all();

  if (completed.length === 0) {
    return {
      totalPredictions: 0,
      totalCompleted: 0,
      winnerAccuracy: 0,
      avgScoreDiff: 0,
      byConfidence: {}
    };
  }

  let winnerCorrect = 0;
  let totalHomeDiff = 0;
  let totalAwayDiff = 0;
  const byConfidence = { High: { correct: 0, total: 0 }, Medium: { correct: 0, total: 0 }, Low: { correct: 0, total: 0 } };

  completed.forEach(pred => {
    // Check if winner prediction was correct
    const predictedWinner = pred.home_win_prob > pred.away_win_prob ? pred.home_team : pred.away_team;
    if (predictedWinner === pred.actual_winner) {
      winnerCorrect++;
      byConfidence[pred.confidence].correct++;
    }
    byConfidence[pred.confidence].total++;

    // Calculate score differences
    totalHomeDiff += Math.abs(pred.predicted_home_score - pred.actual_home_score);
    totalAwayDiff += Math.abs(pred.predicted_away_score - pred.actual_away_score);
  });

  const totalPredictions = db.prepare('SELECT COUNT(*) as count FROM predictions').get().count;

  return {
    totalPredictions,
    totalCompleted: completed.length,
    winnerCorrect,
    winnerAccuracy: ((winnerCorrect / completed.length) * 100).toFixed(1),
    avgHomeScoreDiff: (totalHomeDiff / completed.length).toFixed(1),
    avgAwayScoreDiff: (totalAwayDiff / completed.length).toFixed(1),
    avgTotalScoreDiff: ((totalHomeDiff + totalAwayDiff) / (completed.length * 2)).toFixed(1),
    byConfidence: {
      High: {
        correct: byConfidence.High.correct,
        total: byConfidence.High.total,
        accuracy: byConfidence.High.total > 0 ? ((byConfidence.High.correct / byConfidence.High.total) * 100).toFixed(1) : 0
      },
      Medium: {
        correct: byConfidence.Medium.correct,
        total: byConfidence.Medium.total,
        accuracy: byConfidence.Medium.total > 0 ? ((byConfidence.Medium.correct / byConfidence.Medium.total) * 100).toFixed(1) : 0
      },
      Low: {
        correct: byConfidence.Low.correct,
        total: byConfidence.Low.total,
        accuracy: byConfidence.Low.total > 0 ? ((byConfidence.Low.correct / byConfidence.Low.total) * 100).toFixed(1) : 0
      }
    }
  };
}

// Get recent predictions (last N)
function getRecentPredictions(limit = 20) {
  const stmt = db.prepare(`
    SELECT 
      p.*,
      r.home_score as actual_home_score,
      r.away_score as actual_away_score,
      r.winner as actual_winner
    FROM predictions p
    LEFT JOIN actual_results r ON p.game_id = r.game_id
    ORDER BY p.game_date DESC, p.prediction_time DESC
    LIMIT ?
  `);

  return stmt.all(limit);
}

// Get predictions for a specific date
function getPredictionsByDate(date) {
  const stmt = db.prepare(`
    SELECT 
      p.*,
      r.home_score as actual_home_score,
      r.away_score as actual_away_score,
      r.winner as actual_winner
    FROM predictions p
    LEFT JOIN actual_results r ON p.game_id = r.game_id
    WHERE p.game_date = ?
    ORDER BY p.prediction_time DESC
  `);

  return stmt.all(date);
}

// Initialize on load
initDatabase();

module.exports = {
  savePrediction,
  saveActualResult,
  getPredictionsWithResults,
  calculateAccuracy,
  getRecentPredictions,
  getPredictionsByDate
};
