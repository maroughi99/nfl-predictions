// DraftKings Scraper - Get Real Rosters, Lines, and Player Props using Puppeteer
const puppeteer = require('puppeteer');

/**
 * Scrape NBA games from DraftKings using Puppeteer (headless browser)
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of games with rosters and props
 */
async function fetchDKNBAGames(dateStr) {
  let browser;
  try {
    console.log(`🏀 Scraping DraftKings NBA page with Puppeteer...`);
    
    // Launch headless browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigate to DraftKings NBA page
    const url = 'https://sportsbook.draftkings.com/leagues/basketball/nba';
    console.log(`  📄 Loading ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Wait for content to load (DraftKings loads dynamically)
    console.log(`  ⏳ Waiting for content to load...`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Extract game data using page.evaluate()
    const games = await page.evaluate(() => {
      const gamesList = [];
      const seenGames = new Set();
      
      // Find all game cards/containers
      const gameElements = document.querySelectorAll('[class*="event-cell"], [class*="parlay"]');
      
      gameElements.forEach((gameEl, index) => {
        try {
          const text = gameEl.innerText || gameEl.textContent;
          
          // Look for team matchup patterns (DraftKings uses "AT" not "@")
          // Pattern: "XXX TeamName AT YYY TeamName" (e.g., "DET Pistons AT BOS Celtics")
          let teamMatch = text.match(/([A-Z]{2,3}\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+AT\s+([A-Z]{2,3}\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
          
          if (!teamMatch) return;
          
          const [_, awayTeam, homeTeam] = teamMatch;
          
          // Extract player props
          const playerProps = [];
          const propElements = gameEl.querySelectorAll('[class*="player"], [class*="outcome"], tbody tr');
          
          propElements.forEach(propEl => {
            const propText = propEl.innerText || propEl.textContent;
            
            // Look for player name (First Last format)
            const playerMatch = propText.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/);
            if (!playerMatch) return;
            
            const playerName = playerMatch[1];
            
            // Extract line value (e.g., "25.5", "Over 25.5")
            const lineMatch = propText.match(/(\d+\.5)/);
            const line = lineMatch ? parseFloat(lineMatch[1]) : null;
            
            // Extract odds (e.g., "-110", "+150")
            const oddsMatch = propText.match(/([+-]\d{3,})/);
            const odds = oddsMatch ? parseInt(oddsMatch[1]) : null;
            
            // Determine prop type from context
            let propType = 'Other';
            if (propText.toLowerCase().includes('point')) propType = 'Points';
            else if (propText.toLowerCase().includes('rebound')) propType = 'Rebounds';
            else if (propText.toLowerCase().includes('assist')) propType = 'Assists';
            else if (propText.toLowerCase().includes('three') || propText.toLowerCase().includes('3-pt')) propType = '3-Pointers';
            
            if (playerName && line) {
              playerProps.push({ playerName, line, odds, propType });
            }
          });
          
          // Extract betting lines (spread, total, moneyline)
          const spreadMatch = text.match(/([+-]?\d+\.5)/);
          const totalMatch = text.match(/[OU]\s*(\d+\.5)/i);
          
          // Get all odds in order (usually: spread away, spread home, total over, total under, ML away, ML home)
          const allOdds = text.match(/([+-]\d{3,})/g) || [];
          
          // DEBUG: Log what we're extracting
          if (awayTeam && homeTeam) {
            console.log(`  📊 ${awayTeam} @ ${homeTeam}: Found ${allOdds.length} odds:`, allOdds);
          }
          
          // Calculate away spread (inverse of home spread)
          const homeSpread = spreadMatch ? parseFloat(spreadMatch[1]) : null;
          const awaySpread = homeSpread !== null ? -homeSpread : null;
          
          // Parse odds based on typical DraftKings layout
          let awaySpreadOdds = -110;
          let homeSpreadOdds = -110;
          let overOdds = -110;
          let underOdds = -110;
          let awayML = null;
          let homeML = null;
          
          if (allOdds.length >= 6) {
            // Full layout: [away spread, home spread, over, under, away ML, home ML]
            awaySpreadOdds = parseInt(allOdds[0]);
            homeSpreadOdds = parseInt(allOdds[1]);
            overOdds = parseInt(allOdds[2]);
            underOdds = parseInt(allOdds[3]);
            awayML = parseInt(allOdds[4]);
            homeML = parseInt(allOdds[5]);
          } else if (allOdds.length >= 2) {
            // Partial data - assume first two are spread odds
            awaySpreadOdds = parseInt(allOdds[0]);
            homeSpreadOdds = parseInt(allOdds[1]);
            if (allOdds.length >= 4) {
              overOdds = parseInt(allOdds[2]);
              underOdds = parseInt(allOdds[3]);
            }
          }
          
          const lines = {
            spread: { 
              home: homeSpread,
              homeOdds: homeSpreadOdds,
              away: awaySpread,
              awayOdds: awaySpreadOdds
            },
            moneyline: { 
              home: homeML, 
              away: awayML
            },
            total: { 
              line: totalMatch ? parseFloat(totalMatch[1]) : null, 
              over: overOdds, 
              under: underOdds 
            }
          };
          
          // Organize props into rosters
          const homeRoster = [];
          const awayRoster = [];
          const seenPlayers = new Set();
          
          playerProps.forEach(prop => {
            if (!seenPlayers.has(prop.playerName)) {
              seenPlayers.add(prop.playerName);
              const player = {
                name: prop.playerName,
                position: 'Unknown',
                props: [{ type: prop.propType, line: prop.line, overOdds: prop.odds, underOdds: prop.odds }]
              };
              // Alternate between home and away
              if (homeRoster.length <= awayRoster.length) {
                homeRoster.push(player);
              } else {
                awayRoster.push(player);
              }
            }
          });
          
          if (awayTeam && homeTeam) {
            // Deduplicate: create unique key for this game
            const gameKey = `${awayTeam.trim()}-${homeTeam.trim()}`;
            
            if (!seenGames.has(gameKey)) {
              seenGames.add(gameKey);
              gamesList.push({
                eventId: `nba-${gamesList.length}`,
                homeTeam: { name: homeTeam.trim(), roster: homeRoster, injuries: [] },
                awayTeam: { name: awayTeam.trim(), roster: awayRoster, injuries: [] },
                lines: lines,
                playerProps: playerProps
              });
            }
          }
        } catch (err) {
          // Skip problematic elements
        }
      });
      
      return gamesList;
    });
    
    await browser.close();
    
    // Add dates to games
    const gamesWithDates = games.map(game => ({
      ...game,
      gameDate: dateStr || new Date().toISOString().split('T')[0],
      gameTime: new Date().toISOString()
    }));
    
    console.log(`✅ Successfully scraped ${gamesWithDates.length} NBA games from DraftKings`);
    return gamesWithDates;
    
  } catch (error) {
    console.error('❌ DraftKings NBA scraping error:', error.message);
    if (browser) {
      await browser.close();
    }
    return [];
  }
}

/**
 * Extract prop type from text
 */
function extractPropTypeFromText(text) {
  const lower = text.toLowerCase();
  if (lower.includes('point')) return 'Points';
  if (lower.includes('rebound')) return 'Rebounds';
  if (lower.includes('assist')) return 'Assists';
  if (lower.includes('three') || lower.includes('3-pt') || lower.includes('3pt')) return '3-Pointers';
  if (lower.includes('pts+reb+ast') || lower.includes('pra')) return 'Pts+Reb+Ast';
  if (lower.includes('steal')) return 'Steals';
  if (lower.includes('block')) return 'Blocks';
  if (lower.includes('turnover')) return 'Turnovers';
  if (lower.includes('pass')) return 'Passing Yards';
  if (lower.includes('rush')) return 'Rushing Yards';
  if (lower.includes('rec')) return 'Receiving Yards';
  if (lower.includes('td')) return 'Touchdowns';
  return 'Other';
}

/**
 * Extract betting lines from HTML element
 */
function extractLinesFromHTML($element) {
  const lines = {
    spread: { home: null, away: null },
    moneyline: { home: null, away: null },
    total: { over: null, under: null, line: null }
  };
  
  try {
    const text = $element.text();
    
    // Look for spread (e.g., "-5.5", "+3.5")
    const spreadMatch = text.match(/([+-]?\d+\.5)/g);
    if (spreadMatch && spreadMatch.length >= 2) {
      lines.spread.away = parseFloat(spreadMatch[0]);
      lines.spread.home = parseFloat(spreadMatch[1]);
    }
    
    // Look for moneyline odds (e.g., "-220", "+180")
    const oddsMatch = text.match(/([+-]\d{3,})/g);
    if (oddsMatch && oddsMatch.length >= 2) {
      lines.moneyline.away = parseInt(oddsMatch[0]);
      lines.moneyline.home = parseInt(oddsMatch[1]);
    }
    
    // Look for total (O/U)
    const totalMatch = text.match(/[OU]\s*(\d+\.5)/i);
    if (totalMatch) {
      lines.total.line = parseFloat(totalMatch[1]);
      lines.total.over = -110;
      lines.total.under = -110;
    }
  } catch (err) {
    console.warn('Error extracting lines from HTML:', err.message);
  }
  
  return lines;
}

/**
 * Fallback: Try to fetch directly from DraftKings
 */
async function fetchDKDirectNBA(dateStr) {
  try {
    // DraftKings Sportsbook API endpoint (may change)
    const url = 'https://sportsbook-nash-usva.draftkings.com/sites/US-VA-SB/api/v5/eventgroups/42648?format=json';
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });
    
    if (!response.data || !response.data.eventGroup || !response.data.eventGroup.events) {
      console.log('⚠️  No events in DraftKings direct response');
      return [];
    }
    
    const events = response.data.eventGroup.events;
    console.log(`✓ Found ${events.length} events from DraftKings direct API`);
    
    const games = [];
    
    for (const event of events) {
      const gameDate = new Date(event.startDate);
      const gameDateStr = gameDate.toISOString().split('T')[0];
      
      if (dateStr && gameDateStr !== dateStr) continue;
      
      const teamNames = event.name.split(' @ ');
      if (teamNames.length !== 2) continue;
      
      const [awayTeam, homeTeam] = teamNames;
      
      // Extract player props
      const playerProps = extractPlayerPropsFromEvent(event);
      
      // Organize into rosters
      const homeRoster = [];
      const awayRoster = [];
      
      for (const prop of playerProps) {
        const player = {
          name: prop.playerName,
          position: 'Unknown',
          props: prop.props
        };
        
        // Simple heuristic: if mentioned in home team context, add to home roster
        // This is not perfect but works for basic scraping
        if (event.teamName1?.includes(prop.playerName.split(' ')[1])) {
          homeRoster.push(player);
        } else {
          awayRoster.push(player);
        }
      }
      
      games.push({
        eventId: event.eventId,
        gameDate: gameDateStr,
        gameTime: event.startDate,
        homeTeam: {
          name: homeTeam,
          roster: deduplicateRoster(homeRoster),
          injuries: []
        },
        awayTeam: {
          name: awayTeam,
          roster: deduplicateRoster(awayRoster),
          injuries: []
        },
        lines: extractLinesFromDKEvent(event),
        playerProps: playerProps
      });
    }
    
    return games;
    
  } catch (error) {
    console.error('⚠️  DraftKings direct API also failed:', error.message);
    return [];
  }
}

/**
 * Extract lines from Odds API response
 */
function extractLinesFromOddsAPI(bookmaker) {
  const lines = {
    spread: { home: null, away: null },
    moneyline: { home: null, away: null },
    total: { over: null, under: null, line: null }
  };
  
  if (!bookmaker || !bookmaker.markets) return lines;
  
  try {
    for (const market of bookmaker.markets) {
      if (!market || !market.outcomes) continue;
      
      if (market.key === 'h2h') {
        // Moneyline
        const homeOutcome = market.outcomes.find(o => o && o.name === bookmaker.home_team);
        const awayOutcome = market.outcomes.find(o => o && o.name === bookmaker.away_team);
        if (homeOutcome) lines.moneyline.home = homeOutcome.price;
        if (awayOutcome) lines.moneyline.away = awayOutcome.price;
      } else if (market.key === 'spreads') {
        // Spread
        const homeOutcome = market.outcomes.find(o => o && o.name === bookmaker.home_team);
        const awayOutcome = market.outcomes.find(o => o && o.name === bookmaker.away_team);
        if (homeOutcome) lines.spread.home = homeOutcome.point;
        if (awayOutcome) lines.spread.away = awayOutcome.point;
      } else if (market.key === 'totals') {
        // Total
        const overOutcome = market.outcomes.find(o => o && o.name === 'Over');
        const underOutcome = market.outcomes.find(o => o && o.name === 'Under');
        if (overOutcome) {
          lines.total.line = overOutcome.point;
          lines.total.over = overOutcome.price;
        }
        if (underOutcome) {
          lines.total.under = underOutcome.price;
        }
      }
    }
  } catch (error) {
    console.warn('Error extracting lines from Odds API:', error.message);
  }
  
  return lines;
}

/**
 * Extract lines from DraftKings event
 */
function extractLinesFromDKEvent(event) {
  const lines = {
    spread: { home: null, away: null },
    moneyline: { home: null, away: null },
    total: { over: null, under: null, line: null }
  };
  
  try {
    if (!event.displayGroups) return lines;
    
    for (const group of event.displayGroups) {
      if (!group.markets) continue;
      
      for (const market of group.markets) {
        const marketName = market.name?.toLowerCase() || '';
        
        if (marketName.includes('spread') && market.outcomes && market.outcomes.length >= 2) {
          lines.spread.home = parseFloat(market.outcomes[0].line) || null;
          lines.spread.away = parseFloat(market.outcomes[1].line) || null;
        }
        
        if (marketName.includes('moneyline') && market.outcomes && market.outcomes.length >= 2) {
          lines.moneyline.home = parseInt(market.outcomes[0].oddsAmerican) || null;
          lines.moneyline.away = parseInt(market.outcomes[1].oddsAmerican) || null;
        }
        
        if (marketName.includes('total') && market.outcomes && market.outcomes.length >= 2) {
          lines.total.line = parseFloat(market.outcomes[0].line) || null;
          lines.total.over = parseInt(market.outcomes[0].oddsAmerican) || null;
          lines.total.under = parseInt(market.outcomes[1].oddsAmerican) || null;
        }
      }
    }
  } catch (error) {
    console.warn('Error extracting lines:', error.message);
  }
  
  return lines;
}

/**
 * Extract player props from DraftKings event
 */
function extractPlayerPropsFromEvent(event) {
  const playerProps = [];
  
  try {
    if (!event.displayGroups) return playerProps;
    
    for (const group of event.displayGroups) {
      if (!group.markets) continue;
      
      for (const market of group.markets) {
        const marketName = market.name || '';
        
        if (marketName.includes('Points') || 
            marketName.includes('Rebounds') || 
            marketName.includes('Assists') ||
            marketName.includes('Pts+Reb+Ast')) {
          
          if (!market.outcomes || market.outcomes.length === 0) continue;
          
          for (const outcome of market.outcomes) {
            const playerName = outcome.participant || outcome.label || '';
            if (!playerName) continue;
            
            let playerEntry = playerProps.find(p => p.playerName === playerName);
            if (!playerEntry) {
              playerEntry = {
                playerName: playerName,
                props: []
              };
              playerProps.push(playerEntry);
            }
            
            const propType = extractPropType(marketName);
            playerEntry.props.push({
              type: propType,
              line: parseFloat(outcome.line) || null,
              odds: parseInt(outcome.oddsAmerican) || null
            });
          }
        }
      }
    }
  } catch (error) {
    console.warn('Error extracting player props:', error.message);
  }
  
  return playerProps;
}

/**
 * Extract betting lines from event data
 */
function extractBettingLines(event) {
  const lines = {
    spread: { home: null, away: null },
    moneyline: { home: null, away: null },
    total: { over: null, under: null, line: null }
  };
  
  try {
    if (!event.displayGroups) return lines;
    
    for (const group of event.displayGroups) {
      if (!group.markets) continue;
      
      for (const market of group.markets) {
        const marketName = market.name?.toLowerCase() || '';
        
        // Spread
        if (marketName.includes('spread') || marketName.includes('point spread')) {
          if (market.outcomes && market.outcomes.length >= 2) {
            lines.spread.home = parseFloat(market.outcomes[0].line) || null;
            lines.spread.away = parseFloat(market.outcomes[1].line) || null;
          }
        }
        
        // Moneyline
        if (marketName.includes('moneyline') || marketName === 'game lines') {
          if (market.outcomes && market.outcomes.length >= 2) {
            lines.moneyline.home = parseInt(market.outcomes[0].oddsAmerican) || null;
            lines.moneyline.away = parseInt(market.outcomes[1].oddsAmerican) || null;
          }
        }
        
        // Total (Over/Under)
        if (marketName.includes('total') || marketName.includes('over/under')) {
          if (market.outcomes && market.outcomes.length >= 2) {
            lines.total.line = parseFloat(market.outcomes[0].line) || null;
            lines.total.over = parseInt(market.outcomes[0].oddsAmerican) || null;
            lines.total.under = parseInt(market.outcomes[1].oddsAmerican) || null;
          }
        }
      }
    }
  } catch (error) {
    console.warn('Error extracting betting lines:', error.message);
  }
  
  return lines;
}

/**
 * Extract player props from event data
 */
function extractPlayerProps(event) {
  const playerProps = [];
  
  try {
    if (!event.displayGroups) return playerProps;
    
    for (const group of event.displayGroups) {
      if (!group.markets) continue;
      
      for (const market of group.markets) {
        const marketName = market.name || '';
        
        // Look for player prop markets (Points, Rebounds, Assists, etc.)
        if (marketName.includes('Points') || 
            marketName.includes('Rebounds') || 
            marketName.includes('Assists') ||
            marketName.includes('Pts+Reb+Ast') ||
            marketName.includes('Steals') ||
            marketName.includes('Blocks') ||
            marketName.includes('3-Pointers Made')) {
          
          if (!market.outcomes || market.outcomes.length === 0) continue;
          
          for (const outcome of market.outcomes) {
            const participantName = outcome.participant || outcome.label || '';
            
            // Extract player name (usually format: "Player Name Over/Under X.5")
            const playerName = participantName.replace(/\s+(Over|Under|O|U)\s+[\d.]+/gi, '').trim();
            
            if (!playerName) continue;
            
            // Find or create player entry
            let playerEntry = playerProps.find(p => p.playerName === playerName);
            if (!playerEntry) {
              playerEntry = {
                playerName: playerName,
                teamPosition: outcome.teamAbbr === event.homeTeamAbbr ? 'home' : 'away',
                props: []
              };
              playerProps.push(playerEntry);
            }
            
            // Add prop
            const propType = extractPropType(marketName);
            const existingProp = playerEntry.props.find(p => p.type === propType);
            
            if (!existingProp) {
              playerEntry.props.push({
                type: propType,
                line: parseFloat(outcome.line) || null,
                overOdds: outcome.criterion === 'Over' ? parseInt(outcome.oddsAmerican) : null,
                underOdds: outcome.criterion === 'Under' ? parseInt(outcome.oddsAmerican) : null
              });
            } else {
              // Update existing prop with over/under odds
              if (outcome.criterion === 'Over') {
                existingProp.overOdds = parseInt(outcome.oddsAmerican) || null;
              } else if (outcome.criterion === 'Under') {
                existingProp.underOdds = parseInt(outcome.oddsAmerican) || null;
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn('Error extracting player props:', error.message);
  }
  
  return playerProps;
}

/**
 * Extract prop type from market name
 */
function extractPropType(marketName) {
  const name = marketName.toLowerCase();
  
  if (name.includes('points')) return 'Points';
  if (name.includes('rebounds')) return 'Rebounds';
  if (name.includes('assists')) return 'Assists';
  if (name.includes('pts+reb+ast') || name.includes('points + rebounds + assists')) return 'Pts+Reb+Ast';
  if (name.includes('steals')) return 'Steals';
  if (name.includes('blocks')) return 'Blocks';
  if (name.includes('3-pointers') || name.includes('threes')) return '3-Pointers';
  if (name.includes('turnovers')) return 'Turnovers';
  
  return 'Other';
}

/**
 * Remove duplicate players from roster
 */
function deduplicateRoster(roster) {
  const seen = new Set();
  const deduplicated = [];
  
  for (const player of roster) {
    if (!seen.has(player.name)) {
      seen.add(player.name);
      deduplicated.push(player);
    } else {
      // Merge props if player already exists
      const existing = deduplicated.find(p => p.name === player.name);
      if (existing && player.props) {
        for (const prop of player.props) {
          if (!existing.props.find(p => p.type === prop.type)) {
            existing.props.push(prop);
          }
        }
      }
    }
  }
  
  return deduplicated;
}

/**
 * Scrape NFL games from DraftKings using Puppeteer (headless browser)
 */
async function fetchDKNFLGames(dateStr) {
  let browser;
  try {
    console.log(`🏈 Scraping DraftKings NFL page with Puppeteer...`);
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const url = 'https://sportsbook.draftkings.com/leagues/football/nfl';
    console.log(`  📄 Loading ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    console.log(`  ⏳ Waiting for content to load...`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const games = await page.evaluate(() => {
      const gamesList = [];
      const seenGames = new Set();
      
      const gameElements = document.querySelectorAll('[class*="event-cell"], [class*="parlay"]');
      
      gameElements.forEach((gameEl, index) => {
        try {
          const text = gameEl.innerText || gameEl.textContent;
          
          // Look for team matchup patterns (DraftKings uses "AT" not "@")
          let teamMatch = text.match(/([A-Z]{2,3}\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+AT\s+([A-Z]{2,3}\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
          
          if (!teamMatch) return;
          
          const [_, awayTeam, homeTeam] = teamMatch;
          
          const playerProps = [];
          const propElements = gameEl.querySelectorAll('[class*="player"], [class*="outcome"], tbody tr');
          
          propElements.forEach(propEl => {
            const propText = propEl.innerText || propEl.textContent;
            
            const playerMatch = propText.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/);
            if (!playerMatch) return;
            
            const playerName = playerMatch[1];
            
            const lineMatch = propText.match(/(\d+\.5)/);
            const line = lineMatch ? parseFloat(lineMatch[1]) : null;
            
            const oddsMatch = propText.match(/([+-]\d{3,})/);
            const odds = oddsMatch ? parseInt(oddsMatch[1]) : null;
            
            // NFL-specific prop types
            let propType = 'Other';
            if (propText.toLowerCase().includes('pass')) propType = 'Passing Yards';
            else if (propText.toLowerCase().includes('rush')) propType = 'Rushing Yards';
            else if (propText.toLowerCase().includes('rec')) propType = 'Receiving Yards';
            else if (propText.toLowerCase().includes('td') || propText.toLowerCase().includes('touchdown')) propType = 'Touchdowns';
            else if (propText.toLowerCase().includes('yds') || propText.toLowerCase().includes('yards')) propType = 'Total Yards';
            
            if (playerName && line) {
              playerProps.push({ playerName, line, odds, propType });
            }
          });
          
          const spreadMatch = text.match(/([+-]?\d+\.5)/);
          const totalMatch = text.match(/[OU]\s*(\d+\.5)/i);
          const moneylineMatch = text.match(/([+-]\d{3,})/g);
          
          const lines = {
            spread: { home: spreadMatch ? parseFloat(spreadMatch[1]) : null, away: null },
            moneyline: { 
              home: moneylineMatch && moneylineMatch[0] ? parseInt(moneylineMatch[0]) : null, 
              away: moneylineMatch && moneylineMatch[1] ? parseInt(moneylineMatch[1]) : null
            },
            total: { line: totalMatch ? parseFloat(totalMatch[1]) : null, over: -110, under: -110 }
          };
          
          const homeRoster = [];
          const awayRoster = [];
          const seenPlayers = new Set();
          
          playerProps.forEach(prop => {
            if (!seenPlayers.has(prop.playerName)) {
              seenPlayers.add(prop.playerName);
              const player = {
                name: prop.playerName,
                position: 'Unknown',
                props: [{ type: prop.propType, line: prop.line, overOdds: prop.odds, underOdds: prop.odds }]
              };
              if (homeRoster.length <= awayRoster.length) {
                homeRoster.push(player);
              } else {
                awayRoster.push(player);
              }
            }
          });
          
          if (awayTeam && homeTeam) {
            const gameKey = `${awayTeam.trim()}-${homeTeam.trim()}`;
            
            if (!seenGames.has(gameKey)) {
              seenGames.add(gameKey);
              gamesList.push({
                eventId: `nfl-${gamesList.length}`,
                homeTeam: { name: homeTeam.trim(), roster: homeRoster, injuries: [] },
                awayTeam: { name: awayTeam.trim(), roster: awayRoster, injuries: [] },
                lines: lines,
                playerProps: playerProps
              });
            }
          }
        } catch (err) {
          // Skip problematic elements
        }
      });
      
      return gamesList;
    });
    
    await browser.close();
    
    const gamesWithDates = games.map(game => ({
      ...game,
      gameDate: dateStr || new Date().toISOString().split('T')[0],
      gameTime: new Date().toISOString()
    }));
    
    console.log(`✅ Successfully scraped ${gamesWithDates.length} NFL games from DraftKings`);
    return gamesWithDates;
    
  } catch (error) {
    console.error('❌ DraftKings NFL scraping error:', error.message);
    if (browser) {
      await browser.close();
    }
    return [];
  }
}

/**
 * Fallback: Fetch NFL directly from DraftKings
 */
async function fetchDKDirectNFL(dateStr) {
  try {
    const url = 'https://sportsbook-nash-usva.draftkings.com/sites/US-VA-SB/api/v5/eventgroups/88808?format=json';
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });
    
    if (!response.data || !response.data.eventGroup || !response.data.eventGroup.events) {
      console.log('⚠️  No events in DraftKings NFL direct response');
      return [];
    }
    
    const events = response.data.eventGroup.events;
    console.log(`✓ Found ${events.length} NFL events from DraftKings direct API`);
    
    const games = [];
    
    for (const event of events) {
      const gameDate = new Date(event.startDate);
      const gameDateStr = gameDate.toISOString().split('T')[0];
      
      if (dateStr && gameDateStr !== dateStr) continue;
      
      const teamNames = event.name.split(' @ ');
      if (teamNames.length !== 2) continue;
      
      const [awayTeam, homeTeam] = teamNames;
      
      const playerProps = extractPlayerPropsFromEvent(event);
      const homeRoster = [];
      const awayRoster = [];
      
      for (const prop of playerProps) {
        const player = {
          name: prop.playerName,
          position: 'Unknown',
          props: prop.props
        };
        
        if (event.teamName1?.includes(prop.playerName.split(' ')[1])) {
          homeRoster.push(player);
        } else {
          awayRoster.push(player);
        }
      }
      
      games.push({
        eventId: event.eventId,
        gameDate: gameDateStr,
        gameTime: event.startDate,
        homeTeam: {
          name: homeTeam,
          roster: deduplicateRoster(homeRoster),
          injuries: []
        },
        awayTeam: {
          name: awayTeam,
          roster: deduplicateRoster(awayRoster),
          injuries: []
        },
        lines: extractLinesFromDKEvent(event),
        playerProps: playerProps
      });
    }
    
    return games;
    
  } catch (error) {
    console.error('⚠️  DraftKings NFL direct API also failed:', error.message);
    return [];
  }
}

/**
 * Map DraftKings team names to our team codes
 */
function mapDKTeamToCode(teamName) {
  // Extract code if in "XXX TeamName" format (e.g., "BOS Celtics" -> "BOS")
  const codeMatch = teamName.match(/^([A-Z]{2,3})\s+/);
  if (codeMatch) {
    const code = codeMatch[1];
    // Map DK abbreviations to ESPN abbreviations
    const dkToEspnMap = {
      'NO': 'NOP',   // New Orleans
      'GS': 'GSW',   // Golden State
      'SA': 'SAS',   // San Antonio
      'PHO': 'PHX',  // Phoenix
      'NY': 'NYK'    // New York (Knicks)
    };
    return dkToEspnMap[code] || code;
  }
  
  const mapping = {
    // NBA
    'Atlanta Hawks': 'ATL',
    'Boston Celtics': 'BOS',
    'Brooklyn Nets': 'BKN',
    'Charlotte Hornets': 'CHA',
    'Chicago Bulls': 'CHI',
    'Cleveland Cavaliers': 'CLE',
    'Dallas Mavericks': 'DAL',
    'Denver Nuggets': 'DEN',
    'Detroit Pistons': 'DET',
    'Golden State Warriors': 'GSW',
    'Houston Rockets': 'HOU',
    'Indiana Pacers': 'IND',
    'LA Clippers': 'LAC',
    'Los Angeles Clippers': 'LAC',
    'Los Angeles Lakers': 'LAL',
    'LA Lakers': 'LAL',
    'Memphis Grizzlies': 'MEM',
    'Miami Heat': 'MIA',
    'Milwaukee Bucks': 'MIL',
    'Minnesota Timberwolves': 'MIN',
    'New Orleans Pelicans': 'NOP',
    'New York Knicks': 'NYK',
    'Oklahoma City Thunder': 'OKC',
    'Orlando Magic': 'ORL',
    'Philadelphia 76ers': 'PHI',
    'Phoenix Suns': 'PHX',
    'Portland Trail Blazers': 'POR',
    'Sacramento Kings': 'SAC',
    'San Antonio Spurs': 'SAS',
    'Toronto Raptors': 'TOR',
    'Utah Jazz': 'UTA',
    'Washington Wizards': 'WAS',
    
    // NFL
    'Arizona Cardinals': 'ARI',
    'Atlanta Falcons': 'ATL',
    'Baltimore Ravens': 'BAL',
    'Buffalo Bills': 'BUF',
    'Carolina Panthers': 'CAR',
    'Chicago Bears': 'CHI',
    'Cincinnati Bengals': 'CIN',
    'Cleveland Browns': 'CLE',
    'Dallas Cowboys': 'DAL',
    'Denver Broncos': 'DEN',
    'Detroit Lions': 'DET',
    'Green Bay Packers': 'GB',
    'Houston Texans': 'HOU',
    'Indianapolis Colts': 'IND',
    'Jacksonville Jaguars': 'JAX',
    'Kansas City Chiefs': 'KC',
    'Las Vegas Raiders': 'LV',
    'Los Angeles Chargers': 'LAC',
    'Los Angeles Rams': 'LAR',
    'Miami Dolphins': 'MIA',
    'Minnesota Vikings': 'MIN',
    'New England Patriots': 'NE',
    'New Orleans Saints': 'NO',
    'New York Giants': 'NYG',
    'New York Jets': 'NYJ',
    'Philadelphia Eagles': 'PHI',
    'Pittsburgh Steelers': 'PIT',
    'San Francisco 49ers': 'SF',
    'Seattle Seahawks': 'SEA',
    'Tampa Bay Buccaneers': 'TB',
    'Tennessee Titans': 'TEN',
    'Washington Commanders': 'WAS'
  };
  
  return mapping[teamName] || teamName;
}

module.exports = {
  fetchDKNBAGames,
  fetchDKNFLGames,
  mapDKTeamToCode
};
