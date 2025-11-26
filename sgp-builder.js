// 🎯 SAME-GAME PARLAY (SGP) BUILDER FOR NBA
// Learns from real bets - avoids role player traps like Zubac 15+ points

// Player Usage Tiers - Critical for identifying safe vs risky picks
const USAGE_TIERS = {
  PRIMARY: { rank: 1, description: 'Primary scorer/handler (20+ PPG)', safetyRating: 90 },
  SECONDARY: { rank: 2, description: 'Secondary option (15-20 PPG)', safetyRating: 75 },
  TERTIARY: { rank: 3, description: 'Third option (10-15 PPG)', safetyRating: 55 },
  ROLE_PLAYER: { rank: 4, description: 'Role player (<10 PPG or limited usage)', safetyRating: 30 }
};

// Identify player's usage tier based on stats
function getPlayerUsageTier(player, teamPlayers) {
  // Sort team by points to find scoring hierarchy
  const scoringOrder = teamPlayers
    .sort((a, b) => b.points - a.points)
    .map(p => p.name);
  
  const playerRank = scoringOrder.indexOf(player.name) + 1;
  
  // PRIMARY: Top 2 scorers with 20+ PPG
  if (playerRank <= 2 && player.points >= 20) {
    return { tier: 'PRIMARY', ...USAGE_TIERS.PRIMARY };
  }
  
  // SECONDARY: 3rd-4th scorers or 15+ PPG
  if ((playerRank <= 4 && player.points >= 15) || player.points >= 18) {
    return { tier: 'SECONDARY', ...USAGE_TIERS.SECONDARY };
  }
  
  // TERTIARY: 10-15 PPG range
  if (player.points >= 10 && player.points < 15) {
    return { tier: 'TERTIARY', ...USAGE_TIERS.TERTIARY };
  }
  
  // ROLE PLAYER: Everyone else
  return { tier: 'ROLE_PLAYER', ...USAGE_TIERS.ROLE_PLAYER };
}

// Calculate confidence for a prop based on player tier and line
function calculatePropConfidence(player, propType, line, projection, usageTier) {
  const diff = projection - line;
  const diffPercent = (diff / line) * 100;
  
  let baseConfidence = 50;
  
  // POINTS PROPS - Most sensitive to usage tier
  if (propType === 'Points') {
    // Going UNDER on role players is safer than OVER
    if (diff < 0) {
      // UNDER bet
      baseConfidence = 55 + Math.abs(diffPercent) * 2;
      
      // Role players going UNDER their inflated lines is usually safe
      if (usageTier.tier === 'ROLE_PLAYER' && line > projection * 1.2) {
        baseConfidence += 15; // Boost confidence for role player UNDERS
      }
    } else {
      // OVER bet
      baseConfidence = 50 + diffPercent * 1.5;
      
      // CRITICAL: Penalize role players with OVER bets
      if (usageTier.tier === 'ROLE_PLAYER') {
        baseConfidence -= 25; // Heavy penalty for role player OVERS
      } else if (usageTier.tier === 'TERTIARY') {
        baseConfidence -= 10; // Moderate penalty
      } else if (usageTier.tier === 'PRIMARY') {
        baseConfidence += 10; // Bonus for primary scorers
      }
    }
  }
  
  // ASSISTS PROPS - Guards/playmakers are safer
  else if (propType === 'Assists') {
    baseConfidence = 55 + diffPercent * 1.8;
    
    // Boost confidence for high assist players
    if (player.assists >= 7) {
      baseConfidence += 10;
    }
    
    // Primary/secondary playmakers are safe
    if (usageTier.tier === 'PRIMARY' || usageTier.tier === 'SECONDARY') {
      baseConfidence += 5;
    }
  }
  
  // REBOUNDS PROPS - Safer for role players (Zubac 10+ REB > Zubac 15+ PTS)
  else if (propType === 'Rebounds') {
    baseConfidence = 55 + diffPercent * 2;
    
    // Big men / high rebounders are safer
    if (player.rebounds >= 8) {
      baseConfidence += 15;
    }
    
    // Role player bigs can be good for rebounds
    if (usageTier.tier === 'ROLE_PLAYER' && player.rebounds >= 8) {
      baseConfidence += 5; // Role player bigs are safe for rebounds
    }
  }
  
  // THREE POINTERS - Specialists are safe
  else if (propType === '3-Pointers') {
    baseConfidence = 50 + diffPercent * 2;
    
    // High volume shooters
    if (player.fg3Made >= 2.5) {
      baseConfidence += 10;
    }
  }
  
  // Cap confidence between 30-85%
  return Math.max(30, Math.min(85, baseConfidence));
}

// SGP LESSON #1: Avoid "Stretch Lines" for Role Players
function isStretchLine(player, propType, line, usageTier) {
  if (propType === 'Points') {
    const seasonAvg = player.points;
    const stretchPercent = ((line - seasonAvg) / seasonAvg) * 100;
    
    // Role players asked to exceed average by 25%+ = TRAP
    if (usageTier.tier === 'ROLE_PLAYER' && stretchPercent > 25) {
      return {
        isStretch: true,
        reason: `⚠️ ROLE PLAYER TRAP: ${player.name} averages ${seasonAvg.toFixed(1)} PPG but line is ${line}+ (${stretchPercent.toFixed(0)}% increase)`,
        alternative: `Consider ${player.name} REBOUNDS or a PRIMARY scorer instead`
      };
    }
    
    // Tertiary players asked to exceed by 35%+ = risky
    if (usageTier.tier === 'TERTIARY' && stretchPercent > 35) {
      return {
        isStretch: true,
        reason: `⚠️ TERTIARY PLAYER RISK: ${player.name} averaging ${seasonAvg.toFixed(1)} PPG, asking for ${stretchPercent.toFixed(0)}% increase`,
        alternative: `Look for a SECONDARY or PRIMARY scorer instead`
      };
    }
  }
  
  return { isStretch: false };
}

// SGP LESSON #2: Correlation for Same-Game Parlays
function analyzeSGPCorrelation(props, gameContext) {
  const correlations = [];
  
  // HIGH SCORING GAME CORRELATION
  // When total is high (225+), primary scorers tend to hit OVER
  if (gameContext.projectedTotal >= 225) {
    const primaryScorers = props.filter(p => 
      p.propType === 'Points' && 
      p.pick === 'OVER' &&
      (p.usageTier.tier === 'PRIMARY' || p.usageTier.tier === 'SECONDARY')
    );
    
    if (primaryScorers.length >= 2) {
      correlations.push({
        type: 'HIGH_SCORING_GAME',
        props: primaryScorers,
        confidence: 70,
        reasoning: `High total (${gameContext.projectedTotal}) → Multiple PRIMARY/SECONDARY scorers likely hit OVER`,
        warning: '⚠️ Avoid adding role players - they may not benefit from pace'
      });
    }
  }
  
  // STAR PLAYER DOMINATION CORRELATION
  // When one star has huge projection, other teammates may struggle
  const starPlayers = props.filter(p => 
    p.propType === 'Points' && 
    p.projection >= 30 &&
    p.usageTier.tier === 'PRIMARY'
  );
  
  if (starPlayers.length >= 1) {
    // Find teammates of the star
    const starTeam = starPlayers[0].team;
    const teammates = props.filter(p => 
      p.team === starTeam && 
      p.player !== starPlayers[0].player &&
      p.propType === 'Points'
    );
    
    if (teammates.length > 0) {
      correlations.push({
        type: 'STAR_DOMINANCE',
        props: [starPlayers[0]],
        confidence: 65,
        reasoning: `${starPlayers[0].player} projected for ${starPlayers[0].projection}+ pts → May limit teammate scoring`,
        warning: `⚠️ Be cautious pairing with ${teammates.map(t => t.player).join(', ')} OVER points`
      });
    }
  }
  
  // ASSISTS + TEAM PACE CORRELATION
  // High pace games → more possessions → more assists
  const assistProps = props.filter(p => 
    p.propType === 'Assists' &&
    p.pick === 'OVER' &&
    p.player.assists >= 6
  );
  
  if (gameContext.pace >= 100 && assistProps.length >= 2) {
    correlations.push({
      type: 'FAST_PACE_ASSISTS',
      props: assistProps,
      confidence: 68,
      reasoning: `Fast pace (${gameContext.pace}) → More possessions = more assist opportunities`,
      warning: null
    });
  }
  
  return correlations;
}

// Generate SMART Same-Game Parlay picks
function generateSGPPicks(team1Players, team2Players, gameContext) {
  const allPlayers = [...team1Players, ...team2Players];
  const allProps = [];
  
  // Generate props for each player
  for (const player of allPlayers) {
    const teamPlayers = player.team === gameContext.team1Code ? team1Players : team2Players;
    const usageTier = getPlayerUsageTier(player, teamPlayers);
    const isHome = player.team === gameContext.homeTeam;
    
    // POINTS PROPS
    const pointsLine = Math.round(player.projection.points - 0.5); // Typical O/U line
    const pointsConfidence = calculatePropConfidence(
      player, 'Points', pointsLine, player.projection.points, usageTier
    );
    const pointsPick = player.projection.points > pointsLine ? 'OVER' : 'UNDER';
    const stretchCheck = isStretchLine(player, 'Points', pointsLine, usageTier);
    
    allProps.push({
      player: player.name,
      playerId: player.playerId,
      team: player.team,
      propType: 'Points',
      line: pointsLine,
      pick: pointsPick,
      projection: player.projection.points,
      seasonAvg: player.points,
      confidence: pointsConfidence,
      usageTier: usageTier,
      isStretch: stretchCheck.isStretch,
      warning: stretchCheck.reason || null,
      alternative: stretchCheck.alternative || null,
      edge: Math.abs(player.projection.points - pointsLine)
    });
    
    // ASSISTS PROPS (for playmakers only)
    if (player.assists >= 4) {
      const assistsLine = Math.round(player.projection.assists - 0.5);
      const assistsConfidence = calculatePropConfidence(
        player, 'Assists', assistsLine, player.projection.assists, usageTier
      );
      const assistsPick = player.projection.assists > assistsLine ? 'OVER' : 'UNDER';
      
      allProps.push({
        player: player.name,
        playerId: player.playerId,
        team: player.team,
        propType: 'Assists',
        line: assistsLine,
        pick: assistsPick,
        projection: player.projection.assists,
        seasonAvg: player.assists,
        confidence: assistsConfidence,
        usageTier: usageTier,
        isStretch: false,
        edge: Math.abs(player.projection.assists - assistsLine)
      });
    }
    
    // REBOUNDS PROPS (for big men / high rebounders)
    if (player.rebounds >= 6) {
      const reboundsLine = Math.round(player.projection.rebounds - 0.5);
      const reboundsConfidence = calculatePropConfidence(
        player, 'Rebounds', reboundsLine, player.projection.rebounds, usageTier
      );
      const reboundsPick = player.projection.rebounds > reboundsLine ? 'OVER' : 'UNDER';
      
      allProps.push({
        player: player.name,
        playerId: player.playerId,
        team: player.team,
        propType: 'Rebounds',
        line: reboundsLine,
        pick: reboundsPick,
        projection: player.projection.rebounds,
        seasonAvg: player.rebounds,
        confidence: reboundsConfidence,
        usageTier: usageTier,
        isStretch: false,
        edge: Math.abs(player.projection.rebounds - reboundsLine)
      });
    }
    
    // 3-POINTERS (for shooters)
    if (player.fg3Made >= 1.5) {
      const threesLine = Math.round(player.projection.threes - 0.5);
      const threesConfidence = calculatePropConfidence(
        player, '3-Pointers', threesLine, player.projection.threes, usageTier
      );
      const threesPick = player.projection.threes > threesLine ? 'OVER' : 'UNDER';
      
      allProps.push({
        player: player.name,
        playerId: player.playerId,
        team: player.team,
        propType: '3-Pointers',
        line: threesLine,
        pick: threesPick,
        projection: player.projection.threes,
        seasonAvg: player.fg3Made,
        confidence: threesConfidence,
        usageTier: usageTier,
        isStretch: false,
        edge: Math.abs(player.projection.threes - threesLine)
      });
    }
  }
  
  // Analyze correlations
  const correlations = analyzeSGPCorrelation(allProps, gameContext);
  
  // Filter out stretch lines and low confidence props
  const safeProps = allProps.filter(p => 
    !p.isStretch && p.confidence >= 55
  );
  
  // Build SGP tiers
  return {
    allProps: allProps,
    safeProps: safeProps,
    correlations: correlations,
    recommendations: buildSGPRecommendations(safeProps, correlations)
  };
}

// Build 3 SGP recommendations: Conservative, Balanced, Aggressive
function buildSGPRecommendations(safeProps, correlations) {
  // Sort by confidence
  const sortedByConfidence = [...safeProps].sort((a, b) => b.confidence - a.confidence);
  
  // CONSERVATIVE SGP: 4-6 legs, 65%+ confidence, PRIMARY/SECONDARY players only
  const conservativeLegs = sortedByConfidence
    .filter(p => 
      p.confidence >= 65 &&
      (p.usageTier.tier === 'PRIMARY' || p.usageTier.tier === 'SECONDARY')
    )
    .slice(0, 6);
  
  // BALANCED SGP: 6-8 legs, 60%+ confidence, avoid ROLE_PLAYER OVER points
  const balancedLegs = sortedByConfidence
    .filter(p => 
      p.confidence >= 60 &&
      !(p.usageTier.tier === 'ROLE_PLAYER' && p.propType === 'Points' && p.pick === 'OVER')
    )
    .slice(0, 8);
  
  // AGGRESSIVE SGP: 8-12 legs, 55%+ confidence, include some tertiary players
  const aggressiveLegs = sortedByConfidence
    .filter(p => p.confidence >= 55)
    .slice(0, 12);
  
  return {
    conservative: {
      type: 'CONSERVATIVE',
      emoji: '🛡️',
      legs: conservativeLegs,
      estimatedOdds: calculateSGPOdds(conservativeLegs.length),
      hitRate: calculateHitRate(conservativeLegs),
      reasoning: 'PRIMARY/SECONDARY scorers only - Safest SGP for consistent hits',
      warnings: identifyWarnings(conservativeLegs)
    },
    balanced: {
      type: 'BALANCED',
      emoji: '⚖️',
      legs: balancedLegs,
      estimatedOdds: calculateSGPOdds(balancedLegs.length),
      hitRate: calculateHitRate(balancedLegs),
      reasoning: 'Mix of stars and solid role players (avoiding point traps)',
      warnings: identifyWarnings(balancedLegs)
    },
    aggressive: {
      type: 'AGGRESSIVE',
      emoji: '🎰',
      legs: aggressiveLegs,
      estimatedOdds: calculateSGPOdds(aggressiveLegs.length),
      hitRate: calculateHitRate(aggressiveLegs),
      reasoning: 'High risk, high reward - Lottery ticket parlay',
      warnings: identifyWarnings(aggressiveLegs)
    }
  };
}

// Calculate estimated SGP odds
function calculateSGPOdds(numLegs) {
  // SGPs have lower correlation than separate game parlays
  // Use multiplier of ~1.7 per leg instead of 1.9
  const decimalOdds = Math.pow(1.7, numLegs);
  const americanOdds = Math.round((decimalOdds - 1) * 100);
  return `+${americanOdds}`;
}

// Calculate estimated hit rate
function calculateHitRate(legs) {
  if (legs.length === 0) return '0%';
  
  const avgConfidence = legs.reduce((sum, leg) => sum + leg.confidence, 0) / legs.length;
  const hitRate = Math.pow(avgConfidence / 100, legs.length);
  
  return `${Math.round(hitRate * 100)}%`;
}

// Identify warnings for a parlay
function identifyWarnings(legs) {
  const warnings = [];
  
  // Check for role player OVER points
  const rolePlayerOvers = legs.filter(l => 
    l.usageTier.tier === 'ROLE_PLAYER' && 
    l.propType === 'Points' && 
    l.pick === 'OVER'
  );
  
  if (rolePlayerOvers.length > 0) {
    warnings.push({
      type: 'ROLE_PLAYER_TRAP',
      severity: 'HIGH',
      message: `⚠️ Contains ${rolePlayerOvers.length} role player OVER points: ${rolePlayerOvers.map(p => p.player).join(', ')}`,
      suggestion: 'Consider replacing with PRIMARY scorers or rebounds props'
    });
  }
  
  // Check for too many props from same team
  const teamCounts = {};
  legs.forEach(leg => {
    teamCounts[leg.team] = (teamCounts[leg.team] || 0) + 1;
  });
  
  for (const [team, count] of Object.entries(teamCounts)) {
    if (count >= 6) {
      warnings.push({
        type: 'TEAM_CONCENTRATION',
        severity: 'MEDIUM',
        message: `⚠️ ${count} props from ${team} - High correlation risk`,
        suggestion: 'Diversify across both teams for safer parlay'
      });
    }
  }
  
  return warnings;
}

module.exports = {
  generateSGPPicks,
  getPlayerUsageTier,
  calculatePropConfidence,
  isStretchLine,
  analyzeSGPCorrelation
};
