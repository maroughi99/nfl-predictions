const axios = require('axios');
const cheerio = require('cheerio');

// Manual injury list (update weekly) - NFL.com uses JavaScript so scraping doesn't work perfectly
// Update this list each week based on https://www.nfl.com/injuries/
const MANUAL_INJURIES = {
  'Bucky Irving': { team: 'TB', position: 'RB', injury: 'Shoulder, Foot', gameStatus: 'OUT', isOut: true },
  // Add more injured players here as needed
  // Example: 'Player Name': { team: 'TEAM', position: 'POS', injury: 'Injury', gameStatus: 'OUT', isOut: true },
};

// Scrape NFL.com injury report (fallback to manual list)
async function scrapeNFLInjuries() {
  try {
    console.log('🏥 Loading NFL injury data...');
    
    // Try to scrape, but NFL.com uses JavaScript rendering so this likely won't work
    const response = await axios.get('https://www.nfl.com/injuries/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const injuries = {};

    // Try to parse injury data from HTML (but it's mostly empty due to JavaScript rendering)
    $('.nfl-o-injury-report__team, .d3-o-table').each((i, section) => {
      $(section).find('tr').each((j, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 4) {
          const playerName = $(cells[0]).text().trim();
          const position = $(cells[1]).text().trim();
          const injury = $(cells[2]).text().trim();
          const gameStatus = $(cells[3]).text().trim() || $(cells[4]).text().trim();

          if (playerName && gameStatus) {
            const normalizedName = playerName.replace(/\s+(Jr\.|Sr\.|III|II|IV)\.?$/i, '').trim();
            
            // Don't overwrite manual entries
            if (!MANUAL_INJURIES[normalizedName]) {
              injuries[normalizedName] = {
                team: '',
                position: position,
                injury: injury,
                gameStatus: gameStatus,
                isOut: gameStatus.toLowerCase().includes('out') || 
                       gameStatus.toLowerCase().includes('ir') ||
                       gameStatus.toLowerCase().includes('pup')
              };
            }
          }
        }
      });
    });

    // Merge with manual list (manual list takes priority)
    const finalInjuries = { ...injuries, ...MANUAL_INJURIES };
    const totalInjuries = Object.keys(finalInjuries).length;
    const outPlayers = Object.values(finalInjuries).filter(p => p.isOut).length;
    console.log(`✅ Loaded ${totalInjuries} injured players (${outPlayers} OUT/IR/PUP)`);
    
    return finalInjuries;
  } catch (error) {
    console.error('❌ Error loading NFL injuries:', error.message);
    console.log(`📋 Using manual injury list (${Object.keys(MANUAL_INJURIES).length} players)`);
    return MANUAL_INJURIES;
  }
}

// Check if a player is OUT
function isPlayerOut(playerName, injuryData) {
  if (!playerName || !injuryData || Object.keys(injuryData).length === 0) {
    return false;
  }

  // Normalize the name for matching
  const normalizedName = playerName
    .replace(/\s+(Jr\.|Sr\.|III|II|IV)\.?$/i, '')
    .trim();

  // Check exact match
  if (injuryData[normalizedName]) {
    return injuryData[normalizedName].isOut;
  }

  // Check partial match (last name)
  const lastName = normalizedName.split(' ').pop();
  for (const [injuredPlayer, data] of Object.entries(injuryData)) {
    if (injuredPlayer.endsWith(lastName) && data.isOut) {
      return true;
    }
  }

  return false;
}

module.exports = { scrapeNFLInjuries, isPlayerOut };
