const axios = require('axios');

// NBA Stats API (official stats.nba.com endpoints)
const NBA_STATS_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.nba.com/',
  'Origin': 'https://www.nba.com'
};

// Cache for NBA stats
let nbaPlayerStatsCache = null;
let nbaPlayerStatsCacheTime = 0;
const NBA_CACHE_DURATION = 3600000; // 1 hour

// Fetch all NBA player stats for 2024-25 season
async function getNBAPlayerStats() {
  const now = Date.now();
  
  // Return cache if still valid
  if (nbaPlayerStatsCache && (now - nbaPlayerStatsCacheTime) < NBA_CACHE_DURATION) {
    return nbaPlayerStatsCache;
  }
  
  try {
    // NBA Stats API - Player stats for 2024-25 season
    const url = 'https://stats.nba.com/stats/leaguedashplayerstats?College=&Conference=&Country=&DateFrom=&DateTo=&Division=&DraftPick=&DraftYear=&GameScope=&GameSegment=&Height=&ISTRound=&LastNGames=0&LeagueID=00&Location=&MeasureType=Base&Month=0&OpponentTeamID=0&Outcome=&PORound=0&PaceAdjust=N&PerMode=PerGame&Period=0&PlayerExperience=&PlayerPosition=&PlusMinus=N&Rank=N&Season=2024-25&SeasonSegment=&SeasonType=Regular%20Season&ShotClockRange=&StarterBench=&TeamID=0&VsConference=&VsDivision=&Weight=';
    
    const response = await axios.get(url, {
      headers: NBA_STATS_HEADERS,
      timeout: 10000
    });
    
    const data = response.data;
    
    if (!data.resultSets || !data.resultSets[0]) {
      console.warn('⚠️  No NBA stats data returned');
      return {};
    }
    
    const headers = data.resultSets[0].headers;
    const rows = data.resultSets[0].rowSet;
    
    // Parse into player objects
    const playerStats = {};
    
    for (const row of rows) {
      const playerData = {};
      headers.forEach((header, index) => {
        playerData[header] = row[index];
      });
      
      const playerId = playerData.PLAYER_ID;
      const playerName = playerData.PLAYER_NAME;
      const teamAbbr = playerData.TEAM_ABBREVIATION;
      
      // Store stats by player name and team
      const key = `${playerName}|${teamAbbr}`;
      
      playerStats[key] = {
        playerId: playerId,
        name: playerName,
        team: teamAbbr,
        gamesPlayed: playerData.GP || 0,
        // Per game averages
        points: parseFloat(playerData.PTS) || 0,
        rebounds: parseFloat(playerData.REB) || 0,
        assists: parseFloat(playerData.AST) || 0,
        steals: parseFloat(playerData.STL) || 0,
        blocks: parseFloat(playerData.BLK) || 0,
        turnovers: parseFloat(playerData.TOV) || 0,
        // Shooting
        fgPct: parseFloat(playerData.FG_PCT) || 0,
        fg3Pct: parseFloat(playerData.FG3_PCT) || 0,
        ftPct: parseFloat(playerData.FT_PCT) || 0,
        fgMade: parseFloat(playerData.FGM) || 0,
        fgAttempts: parseFloat(playerData.FGA) || 0,
        fg3Made: parseFloat(playerData.FG3M) || 0,
        fg3Attempts: parseFloat(playerData.FG3A) || 0,
        ftMade: parseFloat(playerData.FTM) || 0,
        ftAttempts: parseFloat(playerData.FTA) || 0,
        // Advanced
        plusMinus: parseFloat(playerData.PLUS_MINUS) || 0,
        minutes: parseFloat(playerData.MIN) || 0
      };
    }
    
    nbaPlayerStatsCache = playerStats;
    nbaPlayerStatsCacheTime = now;
    
    console.log(`✓ Loaded ${Object.keys(playerStats).length} NBA players from stats.nba.com (2024-25 season)`);
    return playerStats;
    
  } catch (error) {
    console.error('⚠️  Failed to fetch NBA stats:', error.message);
    return nbaPlayerStatsCache || {}; // Return cache if available
  }
}

// Get team stats from aggregated player data
async function getNBATeamStats(teamCode) {
  const allPlayerStats = await getNBAPlayerStats();
  
  // Filter players by team
  const teamPlayers = Object.values(allPlayerStats).filter(p => p.team === teamCode);
  
  if (teamPlayers.length === 0) {
    return getDefaultNBATeamStats();
  }
  
  // Aggregate team stats
  const totalGames = Math.max(...teamPlayers.map(p => p.gamesPlayed));
  const totalPoints = teamPlayers.reduce((sum, p) => sum + (p.points * p.gamesPlayed), 0) / totalGames;
  const totalRebounds = teamPlayers.reduce((sum, p) => sum + (p.rebounds * p.gamesPlayed), 0) / totalGames;
  const totalAssists = teamPlayers.reduce((sum, p) => sum + (p.assists * p.gamesPlayed), 0) / totalGames;
  const totalSteals = teamPlayers.reduce((sum, p) => sum + (p.steals * p.gamesPlayed), 0) / totalGames;
  const totalBlocks = teamPlayers.reduce((sum, p) => sum + (p.blocks * p.gamesPlayed), 0) / totalGames;
  const totalTurnovers = teamPlayers.reduce((sum, p) => sum + (p.turnovers * p.gamesPlayed), 0) / totalGames;
  
  // Average shooting percentages
  const avgFgPct = teamPlayers.reduce((sum, p) => sum + p.fgPct, 0) / teamPlayers.length;
  const avgFg3Pct = teamPlayers.reduce((sum, p) => sum + p.fg3Pct, 0) / teamPlayers.length;
  const avgFtPct = teamPlayers.reduce((sum, p) => sum + p.ftPct, 0) / teamPlayers.length;
  
  return {
    teamCode,
    gamesPlayed: totalGames,
    pointsPerGame: totalPoints.toFixed(1),
    reboundsPerGame: totalRebounds.toFixed(1),
    assistsPerGame: totalAssists.toFixed(1),
    stealsPerGame: totalSteals.toFixed(1),
    blocksPerGame: totalBlocks.toFixed(1),
    turnoversPerGame: totalTurnovers.toFixed(1),
    fgPct: (avgFgPct * 100).toFixed(1),
    fg3Pct: (avgFg3Pct * 100).toFixed(1),
    ftPct: (avgFtPct * 100).toFixed(1),
    offensiveRating: (totalPoints * 1.1).toFixed(1),
    defensiveRating: (110 - (totalPoints / 10)).toFixed(1),
    pace: (95 + (totalAssists / 2)).toFixed(1)
  };
}

function getDefaultNBATeamStats() {
  return {
    gamesPlayed: 20,
    pointsPerGame: 110,
    reboundsPerGame: 45,
    assistsPerGame: 25,
    stealsPerGame: 8,
    blocksPerGame: 5,
    turnoversPerGame: 14,
    fgPct: 46,
    fg3Pct: 36,
    ftPct: 78,
    offensiveRating: 112,
    defensiveRating: 112,
    pace: 98
  };
}

module.exports = {
  getNBAPlayerStats,
  getNBATeamStats
};
