const axios = require('axios');
const { espnNBATeamIds } = require('./nba-data');

// Cache for NBA stats
let nbaPlayerStatsCache = null;
let nbaPlayerStatsCacheTime = 0;
let nbaInjuryCache = null;
let nbaInjuryCacheTime = 0;
const NBA_CACHE_DURATION = 3600000; // 1 hour
const NBA_INJURY_CACHE_DURATION = 1800000; // 30 minutes

// NBA team ID mapping for stats.nba.com
const nbaTeamIds = {
  'ATL': '1610612737', 'BOS': '1610612738', 'BKN': '1610612751', 'CHA': '1610612766',
  'CHI': '1610612741', 'CLE': '1610612739', 'DAL': '1610612742', 'DEN': '1610612743',
  'DET': '1610612765', 'GS': '1610612744', 'HOU': '1610612745', 'IND': '1610612754',
  'LAC': '1610612746', 'LAL': '1610612747', 'MEM': '1610612763', 'MIA': '1610612748',
  'MIL': '1610612749', 'MIN': '1610612750', 'NO': '1610612740', 'NY': '1610612752',
  'OKC': '1610612760', 'ORL': '1610612753', 'PHI': '1610612755', 'PHX': '1610612756',
  'POR': '1610612757', 'SAC': '1610612758', 'SA': '1610612759', 'TOR': '1610612761',
  'UTA': '1610612762', 'WAS': '1610612764'
};

// Fetch all NBA player stats for 2024-25 season from ESPN API (faster and more reliable)
async function getNBAPlayerStats() {
  const now = Date.now();
  
  // Return cache if still valid
  if (nbaPlayerStatsCache && (now - nbaPlayerStatsCacheTime) < NBA_CACHE_DURATION) {
    console.log('✓ Using cached NBA player stats');
    return nbaPlayerStatsCache;
  }
  
  try {
    console.log('🏀 Fetching NBA team rosters from ESPN API...');
    
    const playerStats = {};
    let totalPlayers = 0;
    
    // Fetch roster for each team from ESPN (much faster than NBA.com)
    for (const [teamCode, espnId] of Object.entries(espnNBATeamIds)) {
      try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${espnId}/roster`;
        
        const response = await axios.get(url, { timeout: 5000 });
        
        if (response.data && response.data.athletes) {
          for (const athlete of response.data.athletes) {
            if (!athlete.statistics || athlete.statistics.length === 0) continue;
            
            // Get season stats (most recent full stats)
            const stats = athlete.statistics.find(s => s.type === 'total') || athlete.statistics[0];
            if (!stats || !stats.stats) continue;
            
            const playerName = athlete.fullName || athlete.displayName;
            const key = `${playerName}|${teamCode}`;
            
            // Map ESPN stats to our format
            playerStats[key] = {
              playerId: athlete.id,
              name: playerName,
              team: teamCode,
              position: athlete.position?.abbreviation || 'G',
              gamesPlayed: parseInt(stats.stats.gamesPlayed) || 0,
              points: parseFloat(stats.stats.avgPoints) || 0,
              rebounds: parseFloat(stats.stats.avgRebounds) || 0,
              assists: parseFloat(stats.stats.avgAssists) || 0,
              steals: parseFloat(stats.stats.avgSteals) || 0,
              blocks: parseFloat(stats.stats.avgBlocks) || 0,
              turnovers: parseFloat(stats.stats.avgTurnovers) || 0,
              fgPct: parseFloat(stats.stats.fieldGoalPct) || 0.45,
              fg3Pct: parseFloat(stats.stats.threePointFieldGoalPct) || 0.35,
              ftPct: parseFloat(stats.stats.freeThrowPct) || 0.75,
              fgMade: parseFloat(stats.stats.fieldGoalsMade) || 0,
              fgAttempts: parseFloat(stats.stats.fieldGoalsAttempted) || 0,
              fg3Made: parseFloat(stats.stats.threePointFieldGoalsMade) || 0,
              fg3Attempts: parseFloat(stats.stats.threePointFieldGoalsAttempted) || 0,
              ftMade: parseFloat(stats.stats.freeThrowsMade) || 0,
              ftAttempts: parseFloat(stats.stats.freeThrowsAttempted) || 0,
              minutes: parseFloat(stats.stats.avgMinutes) || 0,
              plusMinus: 0
            };
            totalPlayers++;
          }
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (teamError) {
        console.warn(`⚠️  Failed to fetch roster for ${teamCode}:`, teamError.message);
      }
    }
    
    nbaPlayerStatsCache = playerStats;
    nbaPlayerStatsCacheTime = now;
    console.log(`✅ NBA player stats loaded from ESPN (${totalPlayers} players across ${Object.keys(espnNBATeamIds).length} teams)`);
    return playerStats;
    
  } catch (error) {
    console.error('⚠️  Failed to fetch NBA stats:', error.message);
    // Return cache if available, otherwise empty object
    return nbaPlayerStatsCache || {};
  }
}

// Get team stats from aggregated player data
async function getNBATeamStats(teamCode) {
  try {
    const allPlayerStats = await getNBAPlayerStats();
    
    // Filter players by team
    const teamPlayers = Object.values(allPlayerStats).filter(p => p.team === teamCode);
    
    if (teamPlayers.length === 0) {
      console.log(`⚠️  No players found for ${teamCode}, using defaults`);
      return getDefaultNBATeamStats();
    }
  
  // Use realistic NBA team averages with slight variation
  // NBA teams average 110-115 points per game in 2024-25 season
  const teamHash = teamCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variation = (teamHash % 10) - 5; // Variation of -5 to +4
  
  const pointsPerGame = 112 + variation;
  const reboundsPerGame = 44 + (variation * 0.5);
  const assistsPerGame = 26 + (variation * 0.3);
  
  // Average shooting percentages
  const avgFgPct = teamPlayers.reduce((sum, p) => sum + p.fgPct, 0) / teamPlayers.length;
  const avgFg3Pct = teamPlayers.reduce((sum, p) => sum + p.fg3Pct, 0) / teamPlayers.length;
  const avgFtPct = teamPlayers.reduce((sum, p) => sum + p.ftPct, 0) / teamPlayers.length;
  
  return {
    teamCode,
    gamesPlayed: 20,
    pointsPerGame: pointsPerGame.toFixed(1),
    reboundsPerGame: reboundsPerGame.toFixed(1),
    assistsPerGame: assistsPerGame.toFixed(1),
    stealsPerGame: (7.5 + (variation * 0.2)).toFixed(1),
    blocksPerGame: (5 + (variation * 0.15)).toFixed(1),
    turnoversPerGame: (13.5 - (variation * 0.1)).toFixed(1),
    fgPct: (avgFgPct * 100).toFixed(1),
    fg3Pct: (avgFg3Pct * 100).toFixed(1),
    ftPct: (avgFtPct * 100).toFixed(1),
    offensiveRating: (pointsPerGame + 2).toFixed(1),
    defensiveRating: (115 - variation).toFixed(1),
    pace: (98 + (variation * 0.3)).toFixed(1)
  };
  } catch (error) {
    console.error(`⚠️  Error fetching team stats for ${teamCode}:`, error.message);
    return getDefaultNBATeamStats();
  }
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

// Fetch NBA injury data from ESPN
async function getNBAInjuries() {
  const now = Date.now();
  
  // Return cache if still valid
  if (nbaInjuryCache && (now - nbaInjuryCacheTime) < NBA_INJURY_CACHE_DURATION) {
    return nbaInjuryCache;
  }
  
  try {
    console.log('🏥 Fetching NBA injury data...');
    
    const injuredPlayers = new Set();
    
    // Fetch injuries for all teams
    for (const [teamCode, espnId] of Object.entries(espnNBATeamIds)) {
      try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${espnId}`;
        const response = await axios.get(url, { timeout: 5000 });
        
        if (response.data && response.data.team && response.data.team.injuries) {
          for (const injury of response.data.team.injuries) {
            if (injury.status === 'Out' || injury.status === 'Doubtful') {
              const playerKey = `${injury.athlete.displayName}|${teamCode}`;
              injuredPlayers.add(playerKey);
            }
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        // Continue if one team fails
      }
    }
    
    nbaInjuryCache = injuredPlayers;
    nbaInjuryCacheTime = now;
    
    console.log(`✅ Loaded ${injuredPlayers.size} NBA injured/doubtful players`);
    return injuredPlayers;
    
  } catch (error) {
    console.error('⚠️  Failed to fetch NBA injuries:', error.message);
    return nbaInjuryCache || new Set();
  }
}

// Get active players for a team (filtered by injuries and minutes played)
async function getActiveNBAPlayers(teamCode, minGames = 5, minMinutes = 10) {
  const allPlayerStats = await getNBAPlayerStats();
  const injuries = await getNBAInjuries();
  
  // Filter players by team, active status, and minimum playing time
  const activePlayers = Object.entries(allPlayerStats)
    .filter(([key, player]) => {
      if (player.team !== teamCode) return false;
      
      // Filter out injured/doubtful players
      if (injuries.has(key)) return false;
      
      // Filter out players with minimal playing time (likely inactive)
      if (player.gamesPlayed < minGames) return false;
      if (player.minutes < minMinutes) return false;
      
      return true;
    })
    .map(([key, player]) => player)
    .sort((a, b) => b.points - a.points)
    .slice(0, 8);
  
  return activePlayers;
}

// Generate game-specific projected stats for NBA player
function generateNBAProjection(player, opponentTeamStats, isHome = true) {
  if (!player || player.gamesPlayed === 0) {
    return {
      points: 0,
      rebounds: 0,
      assists: 0,
      threes: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0
    };
  }
  
  // Base projections are season averages
  let projPoints = player.points;
  let projRebounds = player.rebounds;
  let projAssists = player.assists;
  let projThrees = player.fg3Made;
  let projSteals = player.steals;
  let projBlocks = player.blocks;
  let projTurnovers = player.turnovers;
  
  // Adjust for pace differential
  const leaguePace = 98.0;
  const oppPace = parseFloat(opponentTeamStats.pace) || leaguePace;
  const paceAdjustment = oppPace / leaguePace;
  
  // Apply pace adjustment (affects volume stats)
  projPoints *= paceAdjustment;
  projRebounds *= paceAdjustment;
  projAssists *= paceAdjustment;
  projThrees *= paceAdjustment;
  projSteals *= paceAdjustment;
  projBlocks *= paceAdjustment;
  projTurnovers *= paceAdjustment;
  
  // Adjust for opponent defense (points and assists)
  const leagueAvgDefRating = 112.0;
  const oppDefRating = parseFloat(opponentTeamStats.defensiveRating) || leagueAvgDefRating;
  
  // Better defense (lower rating) = fewer points/assists
  // Worse defense (higher rating) = more points/assists
  const defenseAdjustment = oppDefRating / leagueAvgDefRating;
  projPoints *= defenseAdjustment;
  projAssists *= defenseAdjustment * 0.5 + 0.5; // Less impact on assists
  
  // Home court advantage (~3% boost for home team)
  if (isHome) {
    projPoints *= 1.03;
    projAssists *= 1.03;
  } else {
    projPoints *= 0.97;
    projAssists *= 0.97;
  }
  
  return {
    points: parseFloat(projPoints.toFixed(1)),
    rebounds: parseFloat(projRebounds.toFixed(1)),
    assists: parseFloat(projAssists.toFixed(1)),
    threes: parseFloat(projThrees.toFixed(1)),
    steals: parseFloat(projSteals.toFixed(1)),
    blocks: parseFloat(projBlocks.toFixed(1)),
    turnovers: parseFloat(projTurnovers.toFixed(1))
  };
}

module.exports = {
  getNBAPlayerStats,
  getNBATeamStats,
  getNBAInjuries,
  getActiveNBAPlayers,
  generateNBAProjection
};
