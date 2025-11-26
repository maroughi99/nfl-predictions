// 🔥 ADVANCED PARLAY BUILDER WITH CORRELATION LOGIC
// Generates smart parlays that actually hit

// Calculate confidence score (0-100) based on projection vs line difference
function calculateConfidenceScore(projection, line, stdDev = 2.5) {
  const diff = Math.abs(projection - line);
  // 3+ point edge = 75%+, 2-3 = 65-75%, 1-2 = 55-65%, <1 = <55%
  if (diff >= 3) return 75 + Math.min(diff * 2, 25);
  if (diff >= 2) return 65 + (diff - 2) * 10;
  if (diff >= 1) return 55 + (diff - 1) * 10;
  return 50 + diff * 5;
}

// Smart correlation logic - props that move together
function getCorrelatedProps(props, gameContext) {
  const correlations = [];
  
  // CORRELATION 1: High-scoring game → OVER on multiple players
  if (gameContext.projectedTotal >= 225) {
    const overPointsProps = props.filter(p => 
      p.prop === 'Points' && 
      p.recommendation === 'OVER' &&
      p.confidenceScore >= 65
    );
    if (overPointsProps.length >= 3) {
      correlations.push({
        type: 'high_scoring_game',
        props: overPointsProps.slice(0, 4),
        reasoning: `High total (${gameContext.projectedTotal} pts) → Multiple players go OVER`,
        expectedHitRate: 0.35
      });
    }
  }
  
  // CORRELATION 2: Big spread + home team → Home star OVER + spread
  if (Math.abs(gameContext.spread) >= 7) {
    const favoriteTeam = gameContext.spread > 0 ? gameContext.homeTeam : gameContext.awayTeam;
    const favoriteProps = props.filter(p => 
      p.team === favoriteTeam && 
      p.recommendation === 'OVER' &&
      p.confidenceScore >= 65
    );
    if (favoriteProps.length >= 2) {
      correlations.push({
        type: 'blowout',
        props: favoriteProps.slice(0, 3),
        reasoning: `${favoriteTeam} favored by ${Math.abs(gameContext.spread)} → Stars hit OVER`,
        expectedHitRate: 0.38
      });
    }
  }
  
  // CORRELATION 3: High pace → OVER on assists for both teams
  if (gameContext.pace >= 100) {
    const assistProps = props.filter(p => 
      p.prop === 'Assists' && 
      p.recommendation === 'OVER' &&
      p.confidenceScore >= 60
    );
    if (assistProps.length >= 2) {
      correlations.push({
        type: 'fast_pace',
        props: assistProps.slice(0, 3),
        reasoning: `Fast pace (${gameContext.pace}) → More possessions = more assists`,
        expectedHitRate: 0.33
      });
    }
  }
  
  // CORRELATION 4: Star player OVER points + team total OVER
  const starProps = props.filter(p => 
    p.prop === 'Points' && 
    p.recommendation === 'OVER' &&
    p.confidenceScore >= 70 &&
    p.projection >= 25
  );
  if (starProps.length >= 1 && gameContext.projectedTotal >= 220) {
    correlations.push({
      type: 'star_player_team_total',
      props: [...starProps.slice(0, 2)],
      reasoning: 'Star goes off → Team scores more',
      expectedHitRate: 0.32
    });
  }
  
  // CORRELATION 5: Mixed stat types (lower correlation = safer)
  const mixedProps = [];
  const pointsProp = props.find(p => p.prop === 'Points' && p.confidenceScore >= 70);
  const reboundsProp = props.find(p => p.prop === 'Rebounds' && p.confidenceScore >= 65);
  const assistsProp = props.find(p => p.prop === 'Assists' && p.confidenceScore >= 65);
  
  if (pointsProp) mixedProps.push(pointsProp);
  if (reboundsProp && reboundsProp.player !== pointsProp?.player) mixedProps.push(reboundsProp);
  if (assistsProp && assistsProp.player !== pointsProp?.player && assistsProp.player !== reboundsProp?.player) {
    mixedProps.push(assistsProp);
  }
  
  if (mixedProps.length >= 3) {
    correlations.push({
      type: 'mixed_stats',
      props: mixedProps,
      reasoning: 'Different stat types reduce correlation risk',
      expectedHitRate: 0.40
    });
  }
  
  return correlations;
}

// Generate 3 parlay types: Safe, Balanced, Moonshot
function generateSmartParlays(props, gameContext) {
  // Add confidence scores to all props
  const scoredProps = props.map(p => ({
    ...p,
    confidenceScore: calculateConfidenceScore(
      p.projection || p.line, 
      p.over || p.line,
      2.5
    ),
    edge: Math.abs((p.projection || p.line) - (p.over || p.line))
  }));
  
  // Get correlated prop combinations
  const correlations = getCorrelatedProps(scoredProps, gameContext);
  
  // SAFE PARLAY: 3-4 legs, take top confidence props (minimum 3 legs required)
  const safeParlayLegs = scoredProps
    .filter(p => p.recommendation !== 'PASS')
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
    .slice(0, 4);
  
  const safeOdds = calculateParlayOdds(safeParlayLegs.length);
  const safeHitRate = safeParlayLegs.length > 0 
    ? Math.pow(safeParlayLegs.reduce((sum, p) => sum + p.confidenceScore, 0) / (safeParlayLegs.length * 100), safeParlayLegs.length)
    : 0;
  
  // BALANCED PARLAY: 4-5 legs, use best correlation if available
  let balancedParlayLegs = [];
  if (correlations.length > 0 && correlations[0].props.length >= 4) {
    // Use correlated props
    balancedParlayLegs = correlations[0].props.slice(0, 5);
  } else {
    // Fall back to top confidence props (different from safe - middle tier)
    balancedParlayLegs = scoredProps
      .filter(p => p.recommendation !== 'PASS')
      .sort((a, b) => b.confidenceScore - a.confidenceScore)
      .slice(4, 9); // Skip the top 4 (used in safe), take next 5
  }
  
  const balancedOdds = calculateParlayOdds(balancedParlayLegs.length);
  const balancedHitRate = correlations.length > 0 
    ? correlations[0].expectedHitRate 
    : (balancedParlayLegs.length > 0 
      ? Math.pow(balancedParlayLegs.reduce((sum, p) => sum + p.confidenceScore, 0) / (balancedParlayLegs.length * 100), balancedParlayLegs.length)
      : 0);
  
  // MOONSHOT PARLAY: 6-7 legs, 50%+ confidence
  const moonshotParlayLegs = scoredProps
    .filter(p => p.confidenceScore >= 50 && p.recommendation !== 'PASS')
    .sort((a, b) => b.edge - a.edge) // Sort by edge (value)
    .slice(0, 7);
  
  const moonshotOdds = calculateParlayOdds(moonshotParlayLegs.length);
  const moonshotHitRate = Math.pow(0.60, moonshotParlayLegs.length);
  
  return {
    safe: {
      type: 'SAFE',
      legs: safeParlayLegs,
      odds: safeOdds,
      estimatedHitRate: (safeHitRate * 100).toFixed(1) + '%',
      recommendedUnits: 2,
      reasoning: 'Highest confidence picks - smaller payout but best chance to hit',
      avgConfidence: safeParlayLegs.length > 0 
        ? (safeParlayLegs.reduce((sum, p) => sum + p.confidenceScore, 0) / safeParlayLegs.length).toFixed(1)
        : 0
    },
    balanced: {
      type: 'BALANCED',
      legs: balancedParlayLegs,
      odds: balancedOdds,
      estimatedHitRate: (balancedHitRate * 100).toFixed(1) + '%',
      recommendedUnits: 1.5,
      reasoning: correlations.length > 0 
        ? `CORRELATED: ${correlations[0].reasoning}` 
        : 'Mix of high/medium confidence - sweet spot for value',
      avgConfidence: balancedParlayLegs.length > 0
        ? (balancedParlayLegs.reduce((sum, p) => sum + p.confidenceScore, 0) / balancedParlayLegs.length).toFixed(1)
        : 0,
      correlation: correlations.length > 0 ? correlations[0].type : null
    },
    moonshot: {
      type: 'MOONSHOT',
      legs: moonshotParlayLegs,
      odds: moonshotOdds,
      estimatedHitRate: (moonshotHitRate * 100).toFixed(1) + '%',
      recommendedUnits: 0.5,
      reasoning: 'High risk, high reward - lottery ticket play',
      avgConfidence: moonshotParlayLegs.length > 0
        ? (moonshotParlayLegs.reduce((sum, p) => sum + p.confidenceScore, 0) / moonshotParlayLegs.length).toFixed(1)
        : 0
    },
    allCorrelations: correlations
  };
}

// Calculate American odds for parlay (+XXX format)
function calculateParlayOdds(numLegs) {
  if (numLegs === 0) return 'N/A';
  
  // Assuming -110 odds per leg (standard)
  // Parlay multiplier ≈ 1.909 per leg at -110
  const decimalOdds = Math.pow(1.909, numLegs);
  const americanOdds = Math.round((decimalOdds - 1) * 100);
  
  return `+${americanOdds}`;
}

// Calculate expected value (EV) for a parlay
function calculateEV(hitRate, odds, stake = 100) {
  const oddsNum = parseInt(odds.replace('+', ''));
  const payout = (oddsNum / 100) * stake;
  const expectedWin = hitRate * payout;
  const expectedLoss = (1 - hitRate) * stake;
  const ev = expectedWin - expectedLoss;
  
  return {
    ev: ev.toFixed(2),
    evPercent: ((ev / stake) * 100).toFixed(1) + '%',
    isPositiveEV: ev > 0
  };
}

// Format parlay for display with detailed stats
function formatParlayForDisplay(parlay, bankroll = 1000) {
  if (!parlay.legs || parlay.legs.length === 0) {
    return null;
  }
  
  const unitSize = bankroll * (parlay.recommendedUnits / 100);
  const oddsNum = parseInt(parlay.odds.replace('+', ''));
  const potentialWin = (oddsNum / 100) * unitSize;
  const hitRateNum = parseFloat(parlay.estimatedHitRate) / 100;
  const ev = calculateEV(hitRateNum, parlay.odds, unitSize);
  
  return {
    type: parlay.type,
    emoji: parlay.type === 'SAFE' ? '🔥' : parlay.type === 'BALANCED' ? '💎' : '🎰',
    odds: parlay.odds,
    hitRate: parlay.estimatedHitRate,
    avgConfidence: parlay.avgConfidence + '%',
    reasoning: parlay.reasoning,
    correlation: parlay.correlation,
    recommendedBet: `${parlay.recommendedUnits} units ($${unitSize.toFixed(2)})`,
    potentialWin: `$${potentialWin.toFixed(2)}`,
    expectedValue: ev.ev,
    evPercent: ev.evPercent,
    isPositiveEV: ev.isPositiveEV,
    legs: parlay.legs.map((leg, i) => ({
      legNumber: i + 1,
      player: leg.player,
      team: leg.team,
      playerId: leg.playerId,
      prop: leg.prop,
      line: leg.over || leg.line,
      pick: leg.recommendation,
      recommendation: leg.recommendation,
      projection: parseFloat((leg.projection || leg.line).toFixed(1)),
      edge: parseFloat(leg.edge.toFixed(1)),
      confidenceScore: parseFloat(leg.confidenceScore.toFixed(0)),
      confidence: leg.confidenceScore.toFixed(0) + '%',
      seasonAvg: leg.seasonAvg ? leg.seasonAvg.toFixed(1) : 'N/A'
    }))
  };
}

module.exports = {
  generateSmartParlays,
  formatParlayForDisplay,
  calculateEV,
  getCorrelatedProps
};
