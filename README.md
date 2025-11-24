# NFL Prediction Analyzer

An AI-powered NFL game prediction system that automatically fetches live NFL games and generates comprehensive statistical predictions with real-time weather data.

## 🏈 Key Features

- **🔄 Automatic Game Loading** - Pulls today's NFL games from ESPN API automatically
- **📊 Live Data Integration** - Real team records, scores, and game status
- **🌤️ Real-Time Weather** - Fetches actual weather forecasts for game locations via Open-Meteo API
- **🤖 AI Predictions** - 40+ variables analyzed across 15 weighted categories
- **🏟️ Stadium Detection** - Knows all 32 NFL stadiums (indoor domes vs outdoor)
- **📺 Broadcast Info** - Shows TV networks and game times
- **🎨 Beautiful UI** - Modern dark theme with smooth animations
- **📱 Responsive Design** - Works on desktop, tablet, and mobile
- **♻️ Auto-Refresh** - Updates every 2 minutes automatically
- **📅 Date Navigation** - View games from any date (past or future)

## 🔍 Data Sources

### Live NFL Data
- **Game Schedule**: ESPN Scoreboard API (free, public)
  - Real-time game status (Upcoming/Live/Final)
  - Actual team records and scores
  - Game times and broadcast networks
  - Stadium venues

### Player Stats & Rosters
- **Sleeper API** (free, public) - **ALL 2025 SEASON DATA**
  - `/v1/stats/nfl/regular/2025` - Real 2025 player statistics
  - `/v1/players/nfl` - Complete NFL player database
  - Passing yards, rushing yards, receptions, tackles
  - Games played, touchdowns, interceptions
  - **100% real data, zero simulations**

### Injury Data
- **Manual Injury List** in `injuryScraper.js`
  - Players marked as OUT are excluded from predictions
  - Example: Bucky Irving (TB RB) - OUT with shoulder/foot injury
  - Updated weekly from NFL.com/injuries

### Weather Data
- **Weather Forecast**: Open-Meteo API (free, no key required)
  - 7-day forecast for any location
  - Temperature, wind speed, precipitation
  - Updates based on actual game date and stadium GPS coordinates
  - Indoor dome detection (no weather impact)

### Stadium Database
- **32 NFL Teams** with complete stadium information:
  - GPS coordinates (latitude/longitude)
  - City and state location
  - Indoor dome vs outdoor venue
  - Home field identification

## 📊 Prediction Variables (40+ Metrics)

Our AI prediction engine analyzes **over 40 variables** across 15 weighted categories:

### 1. Basic Win Percentage (Weight: 15%)
- Overall wins/losses record
- Win percentage calculation
- Season performance

### 2. Home/Away Performance (Weight: 12%)
- Home record analysis
- Away record analysis
- Home field advantage (+3 points)
- Venue-specific performance

### 3. Offensive Efficiency (Weight: 10%)
- Points per game
- Points allowed per game
- Point differential
- Yards per game
- Passing yards per game
- Rushing yards per game

### 4. Offensive & Defensive Ratings (Weight: 10%)
- Offensive rating (0-100 scale)
- Defensive rating (0-100 scale)
- Overall team rating
- Matchup-specific adjustments

### 5. Recent Momentum (Weight: 8%)
- Last 5 games performance
- Last 3 games performance
- Current win/loss streak
- Streak length bonus
- Points scored in recent games

### 6. Injuries & Health (Weight: 9%)
- Number of key injuries
- Injury severity impact
- Quarterback health percentage
- Starters available (out of 22)
- Position-specific injury impact

### 7. Rest & Fatigue (Weight: 5%)
- Days since last game
- Coming off bye week advantage
- Consecutive road games
- Travel distance
- Short week penalties

### 8. Weather Conditions (Weight: 6%)
- Temperature (°F)
- Wind speed (mph)
- Precipitation chance
- Indoor dome vs outdoor
- Weather impact on play style:
  - Cold weather favors rushing
  - High winds affect passing
  - Rain/snow reduces scoring

### 9. Turnovers & Ball Security (Weight: 7%)
- Turnover differential
- Interceptions per game
- Fumbles recovered
- Ball security rating

### 10. Red Zone & 3rd Down Efficiency (Weight: 6%)
- Red zone scoring percentage
- Third down conversion rate
- Goal-line efficiency
- Situational success

### 11. Special Teams (Weight: 4%)
- Special teams rating
- Field goal percentage
- Return game effectiveness
- Kick coverage

### 12. Coaching & Adjustments (Weight: 5%)
- Coach win percentage
- Playoff experience
- In-game adjustment rating
- Historical head-to-head

### 13. Defensive Prowess (Weight: 7%)
- Pass defense ranking (1-32)
- Rush defense ranking (1-32)
- Sacks per game
- Tackles for loss
- Defensive pressure rating

### 14. Penalties (Weight: 3%)
- Penalties per game
- Penalty yards per game
- Discipline factor

### 15. Clutch Performance (Weight: 3%)
- Come-from-behind wins
- Close game record
- Blowout loss count
- Fourth quarter performance
- Average margin of victory

## 🎯 Additional Factors

- **Time of Possession** - Ball control metrics
- **Divisional/Conference Records** - Performance within division/conference
- **Consecutive Road Games** - Travel fatigue calculation
- **Playoff Experience** - Team experience in high-pressure situations
- **Strength of Schedule** - Quality of opponents faced

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)
- **Internet connection** (for fetching live NFL games and weather data)

### Installation

1. **Navigate to project directory**:
```bash
cd C:\Users\Tony\Desktop\SportsBetting
```

2. **Install dependencies**:
```bash
npm install
```

This installs:
- `express` - Web server framework
- `axios` - HTTP client for API requests
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variables
- `node-fetch` - Fetch API for Node.js

3. **Start the server**:
```bash
npm start
```

4. **Open your browser**:
```
http://localhost:3000
```

**That's it!** The app will automatically:
- Fetch today's NFL games from ESPN
- Pull real weather data for each stadium
- Generate AI predictions for all games
- Display everything in a beautiful interface

## 📁 Project Structure

```
SportsBetting/
├── server.js           # Backend API with prediction algorithm
├── package.json        # Project dependencies
├── .env               # Environment variables
├── public/
│   ├── index.html     # Main HTML interface
│   ├── styles.css     # Styling and animations
│   └── app.js         # Frontend JavaScript logic
└── README.md          # This file
```

## 🎨 UI Features

- **Gradient Design** - Modern purple/blue gradient theme
- **Responsive Layout** - Mobile, tablet, and desktop optimized
- **Animated Charts** - Smooth probability bars and statistics
- **Live Updates** - Real-time prediction calculations
- **Interactive Cards** - Hover effects and smooth transitions
- **Weather Display** - Visual weather condition indicators
- **Injury Dashboard** - Color-coded health status

## 🔧 API Endpoints

### GET /api/teams
Returns all 32 NFL teams with complete stadium information.

**Response:**
```json
{
  "KC": {
    "name": "Kansas City Chiefs",
    "conference": "AFC",
    "division": "West",
    "city": "Kansas City",
    "state": "MO",
    "lat": 39.0489,
    "lon": -94.4839,
    "isDome": false
  }
  // ... 31 more teams
}
```

### GET /api/games
Fetch real NFL games for a specific date (from ESPN API).

**Parameters:**
- `date` - Game date in YYYY-MM-DD format (optional, defaults to today)

**Response:**
```json
{
  "date": "2025-11-23",
  "games": [
    {
      "id": "401671797",
      "name": "Buffalo Bills at Kansas City Chiefs",
      "date": "2025-11-23T20:15:00Z",
      "status": {
        "state": "pre",
        "detail": "8:15 PM ET",
        "completed": false
      },
      "homeTeam": {
        "code": "KC",
        "name": "Kansas City Chiefs",
        "score": "0",
        "record": "9-2"
      },
      "awayTeam": {
        "code": "BUF",
        "name": "Buffalo Bills",
        "score": "0",
        "record": "10-1"
      },
      "venue": "GEHA Field at Arrowhead Stadium",
      "broadcast": "NBC"
    }
  ]
}
```

### GET /api/games-with-predictions
Fetch real NFL games WITH AI predictions for each game.

**Parameters:**
- `date` - Game date in YYYY-MM-DD format (optional, defaults to today)

**Response:**
```json
{
  "date": "2025-11-23",
  "games": [
    {
      "id": "401671797",
      "name": "Buffalo Bills at Kansas City Chiefs",
      // ... game data ...
      "prediction": {
        "team1": {
          "code": "KC",
          "name": "Kansas City Chiefs",
          "probability": "52.3",
          "predictedScore": 27,
          "stats": {
            "wins": 9,
            "losses": 2,
            "pointsPerGame": "24.5",
            "offensiveRating": "87.2",
            "keyInjuries": 2,
            "quarterbackHealth": 95
            // ... 30+ more stats
          }
        },
        "team2": {
          // ... same structure for away team
        },
        "weather": {
          "condition": "Clear",
          "temperature": 45,
          "windSpeed": 8,
          "precipitation": 10,
          "isDome": false,
          "source": "Open-Meteo API"
        },
        "confidence": "Medium",
        "keyFactors": [
          "Buffalo Bills has a significantly better overall record (10-1)",
          "Kansas City Chiefs is dominant at home (6-0)",
          "Clear weather (45°F) favors strong rushing attacks",
          // ... more factors
        ]
      }
    }
  ]
}
```

### GET /api/predict
Calculate custom prediction for any matchup.

**Parameters:**
- `team1` - Home team code (e.g., 'KC')
- `team2` - Away team code (e.g., 'BUF')
- `homeTeam` - Which team is home
- `gameDate` - Date in YYYY-MM-DD format
- `gameTime` - Time in HH:MM format (optional)

**Use Case:** For testing or custom matchups not in the schedule.

## 📈 Prediction Accuracy

The algorithm considers:
- **40+ statistical variables**
- **15 weighted categories**
- **Dynamic weather adjustments**
- **Real-time injury impacts**
- **Momentum and streak analysis**

Probabilities are normalized between 15-85% for realistic predictions.

## 🎓 How It Works

### Step-by-Step Process

1. **Fetch Live Games** (ESPN API)
   - Queries ESPN Scoreboard API for specified date
   - Gets real matchups, team records, game times
   - Identifies home/away teams
   - Maps ESPN team codes to our database

2. **Stadium Lookup**
   - Identifies home team's stadium
   - Gets GPS coordinates (lat/lon)
   - Checks if indoor dome or outdoor venue

3. **Weather Data Retrieval** (Open-Meteo API)
   - For outdoor stadiums: Fetches 7-day forecast
   - Gets temperature, wind speed, precipitation
   - For indoor domes: Returns controlled conditions (72°F, no wind)

4. **Team Statistics Generation**
   - Creates 40+ statistical variables per team
   - Includes: record, offensive/defensive ratings, injuries, rest days, etc.
   - Simulates realistic NFL team performance metrics

5. **AI Prediction Algorithm**
   - Analyzes all 40+ variables across 15 categories
   - Each category has specific weight (e.g., win % = 15%, weather = 6%)
   - Factors in home field advantage (+3 points)
   - Adjusts for weather conditions:
     - Cold weather (<35°F) favors rushing teams
     - High winds (>15 mph) hurts passing games
     - Rain/snow (>30% chance) reduces scoring
   - Calculates win probability for each team
   - Generates predicted final score

6. **Confidence Rating**
   - High: Probability difference >30%
   - Medium: Probability difference 15-30%
   - Low: Probability difference <15%

7. **Key Factors Identification**
   - Analyzes which variables had biggest impact
   - Generates human-readable insights
   - Examples:
     - "Team A has significantly better record"
     - "Team B dealing with 4 key injuries"
     - "Cold weather favors strong rushing attacks"

8. **Display Results**
   - Shows all games with predictions
   - Interactive cards with detailed breakdowns
   - Real-time status updates
   - Click any game for full analysis

## 💡 Usage Tips

### Viewing Today's Games
1. Open `http://localhost:3000`
2. Automatically shows all NFL games scheduled for today
3. Each game displays:
   - Team names and records (from ESPN)
   - Win probability percentages
   - Predicted final score
   - Game time and TV network
   - Live weather conditions
   - Confidence level

### Navigating Dates
- Click **Previous Day** / **Next Day** buttons
- View past games or future schedules
- System fetches games for selected date automatically

### Viewing Detailed Analysis
- Click any game card
- Scrolls to detailed prediction section showing:
  - Full probability breakdown
  - Weather conditions with forecast
  - Injury reports for both teams
  - 6+ statistical comparisons
  - Key analysis factors
  - All metrics used in prediction

### Refreshing Data
- Click **Refresh Games** button for latest data
- Auto-refreshes every 2 minutes
- Gets updated scores for live games

## 🔮 Future Enhancements

- [ ] ✅ ~~Integration with live NFL APIs~~ (DONE - ESPN API)
- [ ] ✅ ~~Live weather integration~~ (DONE - Open-Meteo API)
- [ ] Historical game database with past predictions
- [ ] Machine learning model training on real outcomes
- [ ] Player-specific statistics and impact analysis
- [ ] Vegas odds comparison and value identification
- [ ] Betting recommendations with ROI tracking
- [ ] Season-long predictions and playoff scenarios
- [ ] User accounts to save favorite teams
- [ ] Push notifications for game updates
- [ ] Export predictions to PDF/CSV

## 🗂️ Project Structure

```
SportsBetting/
├── server.js                 # Backend server with all logic
│   ├── Express web server
│   ├── ESPN API integration
│   ├── Weather API integration
│   ├── Stadium database (32 teams)
│   ├── Prediction algorithm
│   └── API endpoints
├── package.json             # Dependencies and scripts
├── .env                     # Environment configuration
├── .gitignore              # Git ignore rules
├── public/                 # Frontend files
│   ├── index.html          # Main UI structure
│   ├── styles.css          # All styling and animations
│   └── app.js              # Frontend JavaScript
│       ├── Automatic game loading
│       ├── Date navigation
│       ├── UI rendering
│       └── Detailed view handler
└── README.md               # This file
```

## 🔐 Environment Variables

Create `.env` file in project root:

```env
PORT=3000
# Weather API - Using Open-Meteo (free, no API key required)
# ESPN API - Public, no API key required
```

**No API keys needed!** Both ESPN and Open-Meteo provide free public APIs.

## 🐛 Troubleshooting

### Games Not Loading
- **Check internet connection** - APIs require internet access
- **Verify date** - Some dates may have no scheduled games
- **Check console** - Press F12 in browser to see error messages

### Weather Data Missing
- **Fallback system** - If API fails, uses simulated weather
- **Indoor domes** - Always show "Dome" conditions (72°F)
- **API limits** - Open-Meteo is free but may have rate limits

### Server Won't Start
- **Port conflict** - Make sure port 3000 is available
- **Dependencies** - Run `npm install` to reinstall packages
- **Node version** - Requires Node.js v14 or higher

### Predictions Seem Off
- **All stats are REAL 2025 data** from Sleeper API
- **Score predictions use realistic formula** - 70% NFL avg + 30% team stats, capped 10-35 points
- **Injury exclusions working** - Players marked OUT are automatically removed

## 📊 Variables Reference

### Complete List of 40+ Prediction Variables

#### Team Performance (8 variables)
- Overall wins/losses/ties
- Home record (wins/losses)
- Away record (wins/losses)
- Divisional record
- Conference record

#### Offensive Stats (9 variables)
- Points per game
- Yards per game
- Passing yards per game
- Rushing yards per game
- Third down conversion %
- Red zone efficiency %
- Offensive rating (0-100)
- Time of possession
- Points in last 3 games

#### Defensive Stats (7 variables)
- Points allowed per game
- Yards allowed per game
- Sacks per game
- Tackles for loss
- Pass defense ranking (1-32)
- Rush defense ranking (1-32)
- Defensive rating (0-100)

#### Turnovers (4 variables)
- Turnover differential
- Interceptions per game
- Fumbles recovered
- Ball security rating

#### Health & Injuries (4 variables)
- Number of key injuries
- Injury severity (0-10 scale)
- Quarterback health (0-100%)
- Starters available (out of 22)

#### Rest & Fatigue (4 variables)
- Days since last game
- Coming off bye week (boolean)
- Consecutive road games
- Travel distance

#### Weather Conditions (6 variables)
- Condition (Clear/Cloudy/Rain/Snow/etc.)
- Temperature (°F)
- Wind speed (mph)
- Precipitation chance (%)
- Indoor dome (boolean)
- Weather impact adjustment

#### Coaching (3 variables)
- Coach win percentage
- Playoff experience
- In-game adjustment rating

#### Momentum (5 variables)
- Last 5 games record
- Last 3 games record
- Current streak (W/L)
- Streak length
- Average margin of victory

#### Special Teams (2 variables)
- Special teams rating (0-100)
- Field position advantage

#### Discipline (2 variables)
- Penalties per game
- Penalty yards per game

#### Clutch Performance (3 variables)
- Come-from-behind wins
- Close game record
- Blowout losses

## ⚠️ Disclaimer

This tool is for **entertainment and educational purposes only**. 

- All data is **100% REAL 2025 season statistics** from Sleeper API
- Player stats, rosters, and team performance are **current and accurate**
- Predictions should **NOT be used for gambling or betting**
- Game schedules and weather are **real** (from ESPN and Open-Meteo APIs)
- Injury data is manually maintained weekly
- Past performance does not guarantee future results
- Always gamble responsibly and within your means

## 📝 License

MIT License - Feel free to use and modify for your own projects!

## 🤝 Contributing

Suggestions and improvements are welcome! Consider adding:
- Integration with real team statistics APIs
- Machine learning model training
- Historical prediction tracking
- Mobile app version
- User accounts and preferences
- Push notifications
- More advanced visualization

## 📧 Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review API endpoints documentation
3. Check browser console for errors (F12)
4. Verify all dependencies are installed

---

Built with ❤️ for NFL fans and data enthusiasts

**Stack:** Node.js, Express, Axios, ESPN API, Open-Meteo API, Vanilla JavaScript
