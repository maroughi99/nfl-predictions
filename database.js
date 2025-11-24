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

  // Player props predictions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS prop_predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT NOT NULL,
      game_date TEXT NOT NULL,
      player_name TEXT NOT NULL,
      team TEXT NOT NULL,
      position TEXT NOT NULL,
      prop_type TEXT NOT NULL,
      line REAL NOT NULL,
      prediction TEXT NOT NULL,
      confidence TEXT NOT NULL,
      prediction_time TEXT NOT NULL,
      UNIQUE(game_id, player_name, prop_type)
    )
  `);

  // Player props actual results table
  db.exec(`
    CREATE TABLE IF NOT EXISTS prop_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT NOT NULL,
      player_name TEXT NOT NULL,
      prop_type TEXT NOT NULL,
      actual_value REAL NOT NULL,
      updated_time TEXT NOT NULL,
      UNIQUE(game_id, player_name, prop_type)
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

// Save player prop prediction
function savePropPrediction(gameId, gameDate, prop) {
  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO prop_predictions (
        game_id, game_date, player_name, team, position,
        prop_type, line, prediction, confidence, prediction_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      gameId,
      gameDate,
      prop.player,
      prop.team,
      prop.position,
      prop.prop,
      prop.line,
      prop.recommendation,
      prop.confidence,
      new Date().toISOString()
    );

    return true;
  } catch (error) {
    console.error('Error saving prop prediction:', error.message);
    return false;
  }
}

// Save actual prop result
function savePropResult(gameId, playerName, propType, actualValue) {
  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO prop_results (
        game_id, player_name, prop_type, actual_value, updated_time
      ) VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(gameId, playerName, propType, actualValue, new Date().toISOString());
    return true;
  } catch (error) {
    console.error('Error saving prop result:', error.message);
    return false;
  }
}

// Calculate prop accuracy
function calculatePropAccuracy() {
  const stmt = db.prepare(`
    SELECT 
      p.*,
      r.actual_value
    FROM prop_predictions p
    INNER JOIN prop_results r ON p.game_id = r.game_id 
      AND p.player_name = r.player_name 
      AND p.prop_type = r.prop_type
  `);

  const completed = stmt.all();

  if (completed.length === 0) {
    return {
      totalProps: 0,
      totalCompleted: 0,
      correctPredictions: 0,
      accuracy: 0,
      byConfidence: {}
    };
  }

  let correct = 0;
  const byConfidence = { High: { correct: 0, total: 0 }, Medium: { correct: 0, total: 0 }, Low: { correct: 0, total: 0 } };

  completed.forEach(prop => {
    let isCorrect = false;
    
    if (prop.prediction === 'OVER') {
      isCorrect = prop.actual_value > prop.line;
    } else if (prop.prediction === 'UNDER') {
      isCorrect = prop.actual_value < prop.line;
    }

    if (isCorrect) {
      correct++;
      byConfidence[prop.confidence].correct++;
    }
    byConfidence[prop.confidence].total++;
  });

  const totalProps = db.prepare('SELECT COUNT(*) as count FROM prop_predictions').get().count;

  return {
    totalProps,
    totalCompleted: completed.length,
    correctPredictions: correct,
    accuracy: ((correct / completed.length) * 100).toFixed(1),
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

// Get prop predictions that don't have results yet
function getPendingPropPredictions() {
  const stmt = db.prepare(`
    SELECT pp.*
    FROM prop_predictions pp
    LEFT JOIN prop_results pr ON pp.game_id = pr.game_id 
      AND pp.player_name = pr.player_name 
      AND pp.prop_type = pr.prop_type
    WHERE pr.actual_value IS NULL
  `);

  return stmt.all();
}

// Get predictions that don't have results yet
function getPendingPredictions() {
  const stmt = db.prepare(`
    SELECT p.*
    FROM predictions p
    LEFT JOIN actual_results r ON p.game_id = r.game_id
    WHERE r.home_score IS NULL
    ORDER BY p.game_date DESC
  `);

  return stmt.all();
}

// Get all predictions for accuracy analysis with date range
function getHistoricalAccuracy(startDate = null, endDate = null) {
  let query = `
    SELECT 
      p.*,
      r.home_score as actual_home_score,
      r.away_score as actual_away_score,
      r.winner as actual_winner,
      CASE 
        WHEN r.winner IS NOT NULL THEN 
          CASE WHEN 
            (p.predicted_home_score > p.predicted_away_score AND r.winner = 'home') OR
            (p.predicted_away_score > p.predicted_home_score AND r.winner = 'away')
          THEN 1 ELSE 0 END
        ELSE NULL
      END as prediction_correct
    FROM predictions p
    LEFT JOIN actual_results r ON p.game_id = r.game_id
    WHERE r.home_score IS NOT NULL
  `;

  const params = [];
  if (startDate) {
    query += ` AND p.game_date >= ?`;
    params.push(startDate);
  }
  if (endDate) {
    query += ` AND p.game_date <= ?`;
    params.push(endDate);
  }

  query += ` ORDER BY p.game_date DESC`;

  const stmt = db.prepare(query);
  return stmt.all(...params);
}

// Initialize on load
initDatabase();

module.exports = {
  initDatabase,
  savePrediction,
  saveActualResult,
  getPredictionsWithResults,
  calculateAccuracy,
  getRecentPredictions,
  getPredictionsByDate,
  savePropPrediction,
  savePropResult,
  calculatePropAccuracy,
  getPendingPropPredictions,
  getPendingPredictions,
  getHistoricalAccuracy
};
