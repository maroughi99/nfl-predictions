const axios = require('axios');

async function testESPNInjuries() {
  try {
    console.log('Testing ESPN Injuries API...\n');
    
    const url = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/injuries';
    console.log(`Fetching: ${url}\n`);
    
    const response = await axios.get(url, { 
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', JSON.stringify(response.headers, null, 2));
    console.log('\n--- Response Data Structure ---');
    console.log('Keys:', Object.keys(response.data));
    
    if (response.data.injuries) {
      console.log(`\n✅ Found ${response.data.injuries.length} total injury records\n`);
      
      // Dump first 3 raw injury objects
      console.log('--- First 3 Raw Injury Objects ---');
      response.data.injuries.slice(0, 3).forEach((injury, idx) => {
        console.log(`\n${idx + 1}. ${JSON.stringify(injury, null, 2)}`);
      });
      
      // Count by status
      const statusCounts = {};
      response.data.injuries.forEach(injury => {
        const status = injury.status || 'Unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      console.log('\n--- Status Breakdown ---');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`${status}: ${count}`);
      });
      
      // Filter Out/Doubtful
      const outOrDoubtful = response.data.injuries.filter(injury => 
        injury.status === 'Out' || injury.status === 'Doubtful'
      );
      
      console.log(`\n--- Out/Doubtful Players (${outOrDoubtful.length}) ---`);
      outOrDoubtful.forEach(injury => {
        console.log(`${injury.athlete?.displayName || 'Unknown'} (${injury.team?.abbreviation}) - ${injury.status}`);
      });
      
    } else {
      console.log('\n❌ No "injuries" key found in response');
      console.log('Full response data:', JSON.stringify(response.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testESPNInjuries();
