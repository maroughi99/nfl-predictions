// Test DraftKings Scraper
const { fetchDKNBAGames, fetchDKNFLGames } = require('./draftkings-scraper');

async function testDraftKings() {
  console.log('🧪 Testing DraftKings Scraper\n');
  
  const today = new Date().toISOString().split('T')[0];
  
  // Test NBA
  console.log('═══════════════════════════════════════');
  console.log('🏀 Testing NBA Games');
  console.log('═══════════════════════════════════════\n');
  
  try {
    const nbaGames = await fetchDKNBAGames(today);
    
    if (nbaGames.length === 0) {
      console.log('⚠️  No NBA games found for today');
    } else {
      console.log(`\n✅ Found ${nbaGames.length} NBA games:\n`);
      
      for (const game of nbaGames) {
        console.log(`\n📊 ${game.awayTeam.name} @ ${game.homeTeam.name}`);
        console.log(`   Date: ${game.gameDate} | Time: ${new Date(game.gameTime).toLocaleTimeString()}`);
        
        // Lines
        if (game.lines.spread.home) {
          console.log(`   Spread: ${game.homeTeam.name} ${game.lines.spread.home > 0 ? '+' : ''}${game.lines.spread.home}`);
        }
        if (game.lines.total.line) {
          console.log(`   Total: ${game.lines.total.line} (O/U: ${game.lines.total.over}/${game.lines.total.under})`);
        }
        
        // Home Roster
        console.log(`\n   🏠 ${game.homeTeam.name} Roster (${game.homeTeam.roster.length} players):`);
        game.homeTeam.roster.slice(0, 5).forEach(player => {
          console.log(`      • ${player.name} (${player.position})`);
          if (player.props && player.props.length > 0) {
            player.props.forEach(prop => {
              console.log(`        - ${prop.type}: ${prop.line} (O: ${prop.overOdds}, U: ${prop.underOdds})`);
            });
          }
        });
        
        // Away Roster
        console.log(`\n   ✈️  ${game.awayTeam.name} Roster (${game.awayTeam.roster.length} players):`);
        game.awayTeam.roster.slice(0, 5).forEach(player => {
          console.log(`      • ${player.name} (${player.position})`);
          if (player.props && player.props.length > 0) {
            player.props.forEach(prop => {
              console.log(`        - ${prop.type}: ${prop.line} (O: ${prop.overOdds}, U: ${prop.underOdds})`);
            });
          }
        });
        
        // Injuries
        if (game.homeTeam.injuries.length > 0) {
          console.log(`\n   🚑 ${game.homeTeam.name} Injuries:`);
          game.homeTeam.injuries.forEach(inj => {
            console.log(`      • ${inj.name} - ${inj.status}`);
          });
        }
        if (game.awayTeam.injuries.length > 0) {
          console.log(`\n   🚑 ${game.awayTeam.name} Injuries:`);
          game.awayTeam.injuries.forEach(inj => {
            console.log(`      • ${inj.name} - ${inj.status}`);
          });
        }
        
        console.log('\n   ---');
      }
    }
  } catch (error) {
    console.error('❌ NBA test failed:', error.message);
  }
  
  // Test NFL
  console.log('\n\n═══════════════════════════════════════');
  console.log('🏈 Testing NFL Games');
  console.log('═══════════════════════════════════════\n');
  
  try {
    const nflGames = await fetchDKNFLGames(today);
    
    if (nflGames.length === 0) {
      console.log('⚠️  No NFL games found for today');
    } else {
      console.log(`\n✅ Found ${nflGames.length} NFL games:\n`);
      
      for (const game of nflGames) {
        console.log(`\n📊 ${game.awayTeam.name} @ ${game.homeTeam.name}`);
        console.log(`   Date: ${game.gameDate} | Time: ${new Date(game.gameTime).toLocaleTimeString()}`);
        
        // Lines
        if (game.lines.spread.home) {
          console.log(`   Spread: ${game.homeTeam.name} ${game.lines.spread.home > 0 ? '+' : ''}${game.lines.spread.home}`);
        }
        if (game.lines.total.line) {
          console.log(`   Total: ${game.lines.total.line} (O/U: ${game.lines.total.over}/${game.lines.total.under})`);
        }
        
        // Home Roster
        console.log(`\n   🏠 ${game.homeTeam.name} Roster (${game.homeTeam.roster.length} players):`);
        game.homeTeam.roster.slice(0, 5).forEach(player => {
          console.log(`      • ${player.name} (${player.position})`);
          if (player.props && player.props.length > 0) {
            player.props.slice(0, 3).forEach(prop => {
              console.log(`        - ${prop.type}: ${prop.line} (O: ${prop.overOdds}, U: ${prop.underOdds})`);
            });
          }
        });
        
        // Away Roster
        console.log(`\n   ✈️  ${game.awayTeam.name} Roster (${game.awayTeam.roster.length} players):`);
        game.awayTeam.roster.slice(0, 5).forEach(player => {
          console.log(`      • ${player.name} (${player.position})`);
          if (player.props && player.props.length > 0) {
            player.props.slice(0, 3).forEach(prop => {
              console.log(`        - ${prop.type}: ${prop.line} (O: ${prop.overOdds}, U: ${prop.underOdds})`);
            });
          }
        });
        
        // Injuries
        if (game.homeTeam.injuries.length > 0) {
          console.log(`\n   🚑 ${game.homeTeam.name} Injuries:`);
          game.homeTeam.injuries.forEach(inj => {
            console.log(`      • ${inj.name} - ${inj.status}`);
          });
        }
        if (game.awayTeam.injuries.length > 0) {
          console.log(`\n   🚑 ${game.awayTeam.name} Injuries:`);
          game.awayTeam.injuries.forEach(inj => {
            console.log(`      • ${inj.name} - ${inj.status}`);
          });
        }
        
        console.log('\n   ---');
      }
    }
  } catch (error) {
    console.error('❌ NFL test failed:', error.message);
  }
  
  console.log('\n\n═══════════════════════════════════════');
  console.log('✅ Test Complete');
  console.log('═══════════════════════════════════════\n');
}

// Run the test
testDraftKings().catch(console.error);
