# Prediction Accuracy Tracking System

## Overview
Automatically stores predictions and tracks accuracy over time for both NFL and NBA games.

## Features
- ✅ **Batch Prediction Storage**: Save all game predictions for a specific date
- 📈 **Automatic Results Updates**: Fetch actual scores from ESPN after games complete
- 🎯 **Accuracy Dashboard**: Visual interface showing prediction performance
- 📊 **Historical Analysis**: Track accuracy by date, confidence level, and team

## How to Use

### 1. Predictions Are Stored Automatically ✨

**No action needed!** Predictions are automatically saved to the database whenever you:
- View the main predictions page (`http://localhost:3000`)
- Switch between NFL and NBA
- Load games for any date

The system silently stores predictions in the background without any button clicks.

### 2. Update Results (After Games Complete)

**NFL:**
```bash
# Update results for completed games
curl -X POST "http://localhost:3000/api/update-results?date=2025-11-24"
```

**NBA:**
```bash
# Update NBA results
curl -X POST "http://localhost:3000/api/nba/update-results?date=2025-11-24"
```

### 3. View Accuracy Report

**Web Interface:**
Go to: `http://localhost:3000/accuracy.html`

**API Endpoint:**
```bash
curl "http://localhost:3000/api/accuracy"
```

**Optional date range filters:**
```bash
curl "http://localhost:3000/api/accuracy?startDate=2025-11-01&endDate=2025-11-30"
```

## Workflow Example

1. **During the day (view predictions):**
   - Visit `http://localhost:3000` 
   - Browse NFL or NBA games
   - **Predictions are automatically saved** as you view them
   - No buttons to click!

2. **Evening (after games finish):**
   - Visit `http://localhost:3000/accuracy.html`
   - Click "🔄 Update All Results" 
   - Actual scores are fetched from ESPN
   - Accuracy is calculated automatically

3. **View Results:**
   - The dashboard shows:
     - Overall accuracy percentage
     - Total predictions made
     - Pending games (not yet completed)
     - Game-by-game breakdown with predicted vs actual scores
     - Accuracy by confidence level (High/Medium/Low)

## Database Tables

### predictions
Stores all predictions with:
- Game details (teams, date, game_id)
- Predicted scores
- Win probabilities
- Confidence level
- Weather conditions

### actual_results
Stores game outcomes with:
- Final scores
- Winner
- Update timestamp

### accuracy_summary
Aggregated accuracy metrics:
- Overall win percentage
- Accuracy by confidence level
- Average score differential

## Automation

The system can be automated using:
- **Cron jobs** (Linux/Mac)
- **Task Scheduler** (Windows)
- **Cloud functions** (Vercel, AWS Lambda, etc.)

Example cron schedule:
```cron
# Update NFL results at 11 PM daily (predictions stored automatically)
0 23 * * * curl -X POST "http://localhost:3000/api/update-results?date=$(date +%Y-%m-%d)"

# Update NBA results at 2 AM daily (after late West Coast games)
0 2 * * * curl -X POST "http://localhost:3000/api/nba/update-results?date=$(date -d 'yesterday' +%Y-%m-%d)"
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/batch-predict` | POST | Store all NFL predictions for a date |
| `/api/nba/batch-predict` | POST | Store all NBA predictions for a date |
| `/api/update-results` | POST | Fetch and store NFL game results |
| `/api/nba/update-results` | POST | Fetch and store NBA game results |
| `/api/accuracy` | GET | Get comprehensive accuracy report |

## Access the Dashboard

Main app: `http://localhost:3000`
Accuracy tracker: `http://localhost:3000/accuracy.html`

Or click the "🎯 Accuracy Tracker" link in the main app header.
