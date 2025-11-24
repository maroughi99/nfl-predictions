const { sql } = require('@vercel/postgres');

// Initialize PostgreSQL database with tables
async function initDatabase() {
  try {
    // Predictions table
    await sql`
      CREATE TABLE IF NOT EXISTS predictions (
        id SERIAL PRIMARY KEY,
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
    `;

    // Actual results table
    await sql`
      CREATE TABLE IF NOT EXISTS actual_results (
        id SERIAL PRIMARY KEY,
        game_id TEXT NOT NULL UNIQUE,
        game_date TEXT NOT NULL,
        home_team TEXT NOT NULL,
        away_team TEXT NOT NULL,
        home_score INTEGER NOT NULL,
        away_score INTEGER NOT NULL,
        winner TEXT NOT NULL,
        updated_time TEXT NOT NULL
      )
    `;

    // Accuracy metrics table
    await sql`
      CREATE TABLE IF NOT EXISTS accuracy_summary (
        id SERIAL PRIMARY KEY,
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
    `;

    // Player props predictions table
    await sql`
      CREATE TABLE IF NOT EXISTS prop_predictions (
        id SERIAL PRIMARY KEY,
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
    `;

    // Player props actual results table
    await sql`
      CREATE TABLE IF NOT EXISTS prop_results (
        id SERIAL PRIMARY KEY,
        game_id TEXT NOT NULL,
        player_name TEXT NOT NULL,
        prop_type TEXT NOT NULL,
        actual_value REAL NOT NULL,
        updated_time TEXT NOT NULL,
        UNIQUE(game_id, player_name, prop_type)
      )
    `;

    console.log('✅ PostgreSQL Database initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Save a prediction
async function savePrediction(prediction, gameId, gameDate) {
  try {
    await sql`
      INSERT INTO predictions (
        game_id, game_date, home_team, away_team,
        home_win_prob, away_win_prob,
        predicted_home_score, predicted_away_score,
        confidence, weather_condition, weather_temp, prediction_time
      ) VALUES (
        ${gameId}, ${gameDate}, ${prediction.team1.name}, ${prediction.team2.name},
        ${prediction.team1.winProbability}, ${prediction.team2.winProbability},
        ${prediction.team1.predictedScore}, ${prediction.team2.predictedScore},
        ${prediction.confidence}, ${prediction.weather.condition}, ${prediction.weather.temperature},
        ${new Date().toISOString()}
      )
      ON CONFLICT (game_id, game_date) DO UPDATE SET
        home_win_prob = EXCLUDED.home_win_prob,
        away_win_prob = EXCLUDED.away_win_prob,
        predicted_home_score = EXCLUDED.predicted_home_score,
        predicted_away_score = EXCLUDED.predicted_away_score,
        confidence = EXCLUDED.confidence,
        weather_condition = EXCLUDED.weather_condition,
        weather_temp = EXCLUDED.weather_temp,
        prediction_time = EXCLUDED.prediction_time
    `;
    return true;
  } catch (error) {
    console.error('Error saving prediction:', error);
    return false;
  }
}

// Save actual game result
async function saveActualResult(gameId, gameDate, homeTeam, awayTeam, homeScore, awayScore) {
  try {
    const winner = homeScore > awayScore ? homeTeam : awayTeam;
    
    await sql`
      INSERT INTO actual_results (
        game_id, game_date, home_team, away_team,
        home_score, away_score, winner, updated_time
      ) VALUES (
        ${gameId}, ${gameDate}, ${homeTeam}, ${awayTeam},
        ${homeScore}, ${awayScore}, ${winner}, ${new Date().toISOString()}
      )
      ON CONFLICT (game_id) DO UPDATE SET
        home_score = EXCLUDED.home_score,
        away_score = EXCLUDED.away_score,
        winner = EXCLUDED.winner,
        updated_time = EXCLUDED.updated_time
    `;
    
    return true;
  } catch (error) {
    console.error('Error saving actual result:', error);
    return false;
  }
}

// Get all predictions with their actual results
async function getPredictionsWithResults() {
  try {
    const result = await sql`
      SELECT 
        p.*,
        ar.home_score as actual_home_score,
        ar.away_score as actual_away_score,
        ar.winner as actual_winner
      FROM predictions p
      LEFT JOIN actual_results ar ON p.game_id = ar.game_id
      ORDER BY p.game_date DESC, p.prediction_time DESC
    `;
    return result.rows;
  } catch (error) {
    console.error('Error getting predictions with results:', error);
    return [];
  }
}

// Calculate and update accuracy metrics
async function updateAccuracyMetrics() {
  try {
    const predictions = await sql`
      SELECT 
        p.*,
        ar.home_score as actual_home_score,
        ar.away_score as actual_away_score,
        ar.winner as actual_winner
      FROM predictions p
      INNER JOIN actual_results ar ON p.game_id = ar.game_id
    `;
    
    if (predictions.rows.length === 0) {
      return;
    }

    let winnerCorrect = 0;
    let totalHomeScoreDiff = 0;
    let totalAwayScoreDiff = 0;
    let highConfCorrect = 0, highConfTotal = 0;
    let medConfCorrect = 0, medConfTotal = 0;
    let lowConfCorrect = 0, lowConfTotal = 0;

    predictions.rows.forEach(pred => {
      const predictedWinner = pred.home_win_prob > pred.away_win_prob ? pred.home_team : pred.away_team;
      if (predictedWinner === pred.actual_winner) {
        winnerCorrect++;
        
        if (pred.confidence === 'High') highConfCorrect++;
        else if (pred.confidence === 'Medium') medConfCorrect++;
        else if (pred.confidence === 'Low') lowConfCorrect++;
      }
      
      if (pred.confidence === 'High') highConfTotal++;
      else if (pred.confidence === 'Medium') medConfTotal++;
      else if (pred.confidence === 'Low') lowConfTotal++;
      
      totalHomeScoreDiff += Math.abs(pred.predicted_home_score - pred.actual_home_score);
      totalAwayScoreDiff += Math.abs(pred.predicted_away_score - pred.actual_away_score);
    });

    const totalCompleted = predictions.rows.length;
    const winnerAccuracy = (winnerCorrect / totalCompleted) * 100;
    const avgHomeScoreDiff = totalHomeScoreDiff / totalCompleted;
    const avgAwayScoreDiff = totalAwayScoreDiff / totalCompleted;

    await sql`DELETE FROM accuracy_summary`;
    
    await sql`
      INSERT INTO accuracy_summary (
        total_predictions, total_completed, winner_correct, winner_accuracy,
        avg_home_score_diff, avg_away_score_diff,
        high_confidence_correct, high_confidence_total,
        medium_confidence_correct, medium_confidence_total,
        low_confidence_correct, low_confidence_total,
        last_updated
      ) VALUES (
        ${totalCompleted}, ${totalCompleted}, ${winnerCorrect}, ${winnerAccuracy},
        ${avgHomeScoreDiff}, ${avgAwayScoreDiff},
        ${highConfCorrect}, ${highConfTotal},
        ${medConfCorrect}, ${medConfTotal},
        ${lowConfCorrect}, ${lowConfTotal},
        ${new Date().toISOString()}
      )
    `;

    return true;
  } catch (error) {
    console.error('Error updating accuracy metrics:', error);
    return false;
  }
}

// Get accuracy summary
async function getAccuracySummary() {
  try {
    const result = await sql`SELECT * FROM accuracy_summary ORDER BY id DESC LIMIT 1`;
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting accuracy summary:', error);
    return null;
  }
}

// Save prop prediction
async function savePropPrediction(gameId, gameDate, playerName, team, position, propType, line, prediction, confidence) {
  try {
    await sql`
      INSERT INTO prop_predictions (
        game_id, game_date, player_name, team, position,
        prop_type, line, prediction, confidence, prediction_time
      ) VALUES (
        ${gameId}, ${gameDate}, ${playerName}, ${team}, ${position},
        ${propType}, ${line}, ${prediction}, ${confidence}, ${new Date().toISOString()}
      )
      ON CONFLICT (game_id, player_name, prop_type) DO UPDATE SET
        line = EXCLUDED.line,
        prediction = EXCLUDED.prediction,
        confidence = EXCLUDED.confidence,
        prediction_time = EXCLUDED.prediction_time
    `;
    return true;
  } catch (error) {
    console.error('Error saving prop prediction:', error);
    return false;
  }
}

// Save prop result
async function savePropResult(gameId, playerName, propType, actualValue) {
  try {
    await sql`
      INSERT INTO prop_results (
        game_id, player_name, prop_type, actual_value, updated_time
      ) VALUES (
        ${gameId}, ${playerName}, ${propType}, ${actualValue}, ${new Date().toISOString()}
      )
      ON CONFLICT (game_id, player_name, prop_type) DO UPDATE SET
        actual_value = EXCLUDED.actual_value,
        updated_time = EXCLUDED.updated_time
    `;
    return true;
  } catch (error) {
    console.error('Error saving prop result:', error);
    return false;
  }
}

// Get prop predictions with results
async function getPropPredictionsWithResults() {
  try {
    const result = await sql`
      SELECT 
        pp.*,
        pr.actual_value,
        pr.updated_time as result_time
      FROM prop_predictions pp
      LEFT JOIN prop_results pr ON pp.game_id = pr.game_id 
        AND pp.player_name = pr.player_name 
        AND pp.prop_type = pr.prop_type
      ORDER BY pp.game_date DESC, pp.prediction_time DESC
    `;
    return result.rows;
  } catch (error) {
    console.error('Error getting prop predictions with results:', error);
    return [];
  }
}

// Get pending prop predictions (no results yet)
async function getPendingPropPredictions() {
  try {
    const result = await sql`
      SELECT pp.*
      FROM prop_predictions pp
      LEFT JOIN prop_results pr ON pp.game_id = pr.game_id 
        AND pp.player_name = pr.player_name 
        AND pp.prop_type = pr.prop_type
      WHERE pr.actual_value IS NULL
      ORDER BY pp.game_date DESC
    `;
    return result.rows;
  } catch (error) {
    console.error('Error getting pending prop predictions:', error);
    return [];
  }
}

module.exports = {
  initDatabase,
  savePrediction,
  saveActualResult,
  getPredictionsWithResults,
  updateAccuracyMetrics,
  getAccuracySummary,
  savePropPrediction,
  savePropResult,
  getPropPredictionsWithResults,
  getPendingPropPredictions
};
