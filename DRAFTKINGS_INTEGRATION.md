# DraftKings Roster & Player Props Integration

## Overview
This system integrates with DraftKings to fetch **real rosters**, **injury updates**, and **player prop betting lines** for NBA and NFL games.

## Features

### 🏀 NBA Data
- **Live Rosters**: Get the actual playing roster for each game
- **Player Props**: Points, Rebounds, Assists, 3-Pointers, etc.
- **Betting Lines**: Spread, Moneyline, Total (Over/Under)
- **Injury Reports**: Real-time injury designations

### 🏈 NFL Data
- **Live Rosters**: Get the actual playing roster for each game  
- **Player Props**: Passing yards, Rushing yards, Receiving yards, TDs, etc.
- **Betting Lines**: Spread, Moneyline, Total (Over/Under)
- **Injury Reports**: Real-time injury designations

## API Endpoints

### Get NBA Games with DraftKings Rosters
```
GET /api/nba/games-with-rosters?date=2025-11-26
```

**Response Example:**
```json
{
  "date": "2025-11-26",
  "games": [
    {
      "id": "401584890",
      "homeTeam": {
        "name": "Boston Celtics",
        "code": "BOS",
        "roster": [
          {
            "name": "Jayson Tatum",
            "position": "F",
            "props": [
              { "type": "Points", "line": 27.5, "overOdds": -110, "underOdds": -110 },
              { "type": "Rebounds", "line": 8.5, "overOdds": -115, "underOdds": -105 },
              { "type": "Assists", "line": 4.5, "overOdds": -120, "underOdds": +100 }
            ]
          },
          {
            "name": "Jaylen Brown",
            "position": "G",
            "props": [
              { "type": "Points", "line": 23.5, "overOdds": -110, "underOdds": -110 }
            ]
          }
        ],
        "injuries": [
          { "name": "Kristaps Porzingis", "status": "OUT", "designation": "Knee" }
        ]
      },
      "awayTeam": {
        "name": "Milwaukee Bucks",
        "code": "MIL",
        "roster": [...],
        "injuries": []
      },
      "lines": {
        "spread": { "home": -5.5, "away": +5.5 },
        "moneyline": { "home": -220, "away": +180 },
        "total": { "line": 225.5, "over": -110, "under": -110 }
      }
    }
  ]
}
```

### Get NFL Games with DraftKings Rosters
```
GET /api/nfl/games-with-rosters?date=2025-11-28
```

**Response Example:**
```json
{
  "date": "2025-11-28",
  "games": [
    {
      "id": "401671827",
      "homeTeam": {
        "name": "Dallas Cowboys",
        "code": "DAL",
        "roster": [
          {
            "name": "Dak Prescott",
            "position": "QB",
            "props": [
              { "type": "Passing Yards", "line": 275.5, "overOdds": -110, "underOdds": -110 },
              { "type": "Passing TDs", "line": 1.5, "overOdds": -120, "underOdds": +100 }
            ]
          },
          {
            "name": "CeeDee Lamb",
            "position": "WR",
            "props": [
              { "type": "Receiving Yards", "line": 75.5, "overOdds": -115, "underOdds": -105 },
              { "type": "Receptions", "line": 6.5, "overOdds": -110, "underOdds": -110 }
            ]
          }
        ],
        "injuries": []
      },
      "awayTeam": {...},
      "lines": {
        "spread": { "home": -3.5, "away": +3.5 },
        "moneyline": { "home": -165, "away": +140 },
        "total": { "line": 47.5, "over": -110, "under": -110 }
      }
    }
  ]
}
```

### Get Just DraftKings Data (No ESPN)
```
GET /api/draftkings/nba?date=2025-11-26
GET /api/draftkings/nfl?date=2025-11-28
```

## Using the Data for Parlays

The roster data is automatically used when generating Same-Game Parlays (SGP):

```javascript
// Example: Generate SGP with real DraftKings rosters
GET /api/same-game-parlay?homeTeam=BOS&awayTeam=MIL&gameId=401584890&gameDate=2025-11-26

// The response will include:
// - Only players who are ACTIVE (not injured)
// - Real DraftKings betting lines for each prop
// - Smart parlay combinations based on actual game rosters
```

## How It Works

### 1. Data Sources
The scraper fetches data from multiple sources:
- **DraftKings Sportsbook API**: Primary source for player props and lines
- **The Odds API**: Fallback for betting lines
- **ESPN API**: Game schedules and team info

### 2. Roster Verification
Before generating parlays, the system:
1. Fetches the latest injury report
2. Excludes players marked as OUT or DOUBTFUL
3. Only includes players with active betting props on DraftKings

### 3. Parlay Generation
The parlay builder uses the real roster to:
- Generate prop predictions for active players only
- Compare DraftKings lines vs. our projections
- Create smart correlated parlays with real betting odds

## Testing

Run the test script to see DraftKings data:
```bash
node test-draftkings.js
```

## Notes

### API Rate Limits
- DraftKings has no official public API, so we use web scraping
- The Odds API has a free tier limit (500 requests/month)
- Data is cached for 10 minutes to reduce requests

### Data Freshness
- Lines update every ~60 seconds on DraftKings
- Rosters update when props are added/removed
- Injury reports update multiple times per day

### Reliability
- **Primary**: DraftKings direct API (most reliable)
- **Fallback 1**: The Odds API (if DK fails)
- **Fallback 2**: Mock data with warning (if both fail)

## Future Enhancements

1. **Real-time Updates**: WebSocket connection for live line movements
2. **Sharp Money Tracking**: Monitor when lines move significantly
3. **Prop Correlations**: Historical data on which props hit together
4. **Bankroll Management**: Auto-calculate optimal bet sizing

## Troubleshooting

### "No events found"
- DraftKings may have changed their API structure
- Check the console for detailed error messages
- Try a different date (games may not be posted yet)

### "API timeout"
- DraftKings may be rate-limiting requests
- Wait a few minutes and try again
- The system will use cached data if available

### "Roster is empty"
- Game may be too far in the future (props not posted yet)
- Game may have already started (props closed)
- Check if the game date is correct

## Support

For issues or questions:
1. Check the console logs for detailed error messages
2. Verify your internet connection
3. Try running `node test-draftkings.js` to test the scraper directly
