const axios = require('axios');
const { espnNBATeamIds } = require('./nba-data');

// Cache for NBA stats
let nbaPlayerStatsCache = null;
let nbaPlayerStatsCacheTime = 0;
const NBA_CACHE_DURATION = 3600000; // 1 hour

// Fetch all NBA player stats for 2024-25 season using ESPN API
async function getNBAPlayerStats() {
  const now = Date.now();
  
  // Return cache if still valid
  if (nbaPlayerStatsCache && (now - nbaPlayerStatsCacheTime) < NBA_CACHE_DURATION) {
    console.log('✓ Using cached NBA player stats');
    return nbaPlayerStatsCache;
  }
  
  try {
    console.log('🏀 Fetching NBA player stats from ESPN API...');
    
    // Fetch stats for all NBA teams from ESPN
    const playerStats = {};
    let totalPlayers = 0;
    
    // Get stats for each team
    for (const [teamCode, espnId] of Object.entries(espnNBATeamIds)) {
      try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${espnId}/roster`;
        const response = await axios.get(url, { timeout: 5000 });
        
        if (response.data && response.data.athletes) {
          for (const athlete of response.data.athletes) {
            const player = athlete.athlete;
            if (!player) continue;
            
            // Get player statistics
            const stats = player.statistics?.[0]?.splits?.categories || [];
            const seasonStats = {};
            
            // Parse ESPN stats format
            stats.forEach(category => {
              category.stats.forEach(stat => {
                seasonStats[stat.abbreviation] = parseFloat(stat.value) || 0;
              });
            });
            
            const key = `${player.displayName}|${teamCode}`;
            playerStats[key] = {
              playerId: player.id,
              name: player.displayName,
              team: teamCode,
              position: player.position?.abbreviation || 'N/A',
              gamesPlayed: seasonStats.GP || 0,
              // Per game averages
              points: seasonStats.PPG || seasonStats.PTS || 0,
              rebounds: seasonStats.RPG || seasonStats.REB || 0,
              assists: seasonStats.APG || seasonStats.AST || 0,
              steals: seasonStats.SPG || seasonStats.STL || 0,
              blocks: seasonStats.BPG || seasonStats.BLK || 0,
              turnovers: seasonStats.TOPG || seasonStats.TO || 0,
              // Shooting
              fgPct: seasonStats.FGP || seasonStats['FG%'] || 0,
              fg3Pct: seasonStats['3PP'] || seasonStats['3P%'] || 0,
              ftPct: seasonStats.FTP || seasonStats['FT%'] || 0,
              fgMade: seasonStats.FGM || 0,
              fgAttempts: seasonStats.FGA || 0,
              fg3Made: seasonStats['3PM'] || 0,
              fg3Attempts: seasonStats['3PA'] || 0,
              ftMade: seasonStats.FTM || 0,
              ftAttempts: seasonStats.FTA || 0,
              minutes: seasonStats.MIN || seasonStats.MPG || 0,
              plusMinus: seasonStats['+/-'] || 0
            };
            totalPlayers++;
          }
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (teamError) {
        console.warn(`⚠️  Could not fetch roster for ${teamCode}:`, teamError.message);
      }
    }
    
    if (totalPlayers === 0) {
      console.warn('⚠️  No NBA player data fetched, using defaults');
      return {};
    }
    
    nbaPlayerStatsCache = playerStats;
    nbaPlayerStatsCacheTime = now;
    
    console.log(`✓ Loaded ${totalPlayers} NBA players from ESPN API`);
    return playerStats;
    
  } catch (error) {
    console.error('⚠️  Failed to fetch NBA stats from ESPN:', error.message);
    // Return cache if available, otherwise empty object
    return nbaPlayerStatsCache || {};
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
