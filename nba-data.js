// NBA Teams data with arena locations
const nbaTeams = {
  'ATL': { name: 'Atlanta Hawks', conference: 'East', division: 'Southeast', city: 'Atlanta', state: 'GA', lat: 33.7573, lon: -84.3963, arena: 'State Farm Arena' },
  'BOS': { name: 'Boston Celtics', conference: 'East', division: 'Atlantic', city: 'Boston', state: 'MA', lat: 42.3662, lon: -71.0621, arena: 'TD Garden' },
  'BKN': { name: 'Brooklyn Nets', conference: 'East', division: 'Atlantic', city: 'Brooklyn', state: 'NY', lat: 40.6826, lon: -73.9754, arena: 'Barclays Center' },
  'CHA': { name: 'Charlotte Hornets', conference: 'East', division: 'Southeast', city: 'Charlotte', state: 'NC', lat: 35.2251, lon: -80.8392, arena: 'Spectrum Center' },
  'CHI': { name: 'Chicago Bulls', conference: 'East', division: 'Central', city: 'Chicago', state: 'IL', lat: 41.8807, lon: -87.6742, arena: 'United Center' },
  'CLE': { name: 'Cleveland Cavaliers', conference: 'East', division: 'Central', city: 'Cleveland', state: 'OH', lat: 41.4965, lon: -81.6882, arena: 'Rocket Mortgage FieldHouse' },
  'DAL': { name: 'Dallas Mavericks', conference: 'West', division: 'Southwest', city: 'Dallas', state: 'TX', lat: 32.7905, lon: -96.8103, arena: 'American Airlines Center' },
  'DEN': { name: 'Denver Nuggets', conference: 'West', division: 'Northwest', city: 'Denver', state: 'CO', lat: 39.7487, lon: -105.0077, arena: 'Ball Arena' },
  'DET': { name: 'Detroit Pistons', conference: 'East', division: 'Central', city: 'Detroit', state: 'MI', lat: 42.6970, lon: -83.2456, arena: 'Little Caesars Arena' },
  'GSW': { name: 'Golden State Warriors', conference: 'West', division: 'Pacific', city: 'San Francisco', state: 'CA', lat: 37.7680, lon: -122.3878, arena: 'Chase Center' },
  'HOU': { name: 'Houston Rockets', conference: 'West', division: 'Southwest', city: 'Houston', state: 'TX', lat: 29.7508, lon: -95.3621, arena: 'Toyota Center' },
  'IND': { name: 'Indiana Pacers', conference: 'East', division: 'Central', city: 'Indianapolis', state: 'IN', lat: 39.7640, lon: -86.1555, arena: 'Gainbridge Fieldhouse' },
  'LAC': { name: 'LA Clippers', conference: 'West', division: 'Pacific', city: 'Los Angeles', state: 'CA', lat: 34.0430, lon: -118.2673, arena: 'Crypto.com Arena' },
  'LAL': { name: 'Los Angeles Lakers', conference: 'West', division: 'Pacific', city: 'Los Angeles', state: 'CA', lat: 34.0430, lon: -118.2673, arena: 'Crypto.com Arena' },
  'MEM': { name: 'Memphis Grizzlies', conference: 'West', division: 'Southwest', city: 'Memphis', state: 'TN', lat: 35.1382, lon: -90.0505, arena: 'FedExForum' },
  'MIA': { name: 'Miami Heat', conference: 'East', division: 'Southeast', city: 'Miami', state: 'FL', lat: 25.7814, lon: -80.1870, arena: 'Kaseya Center' },
  'MIL': { name: 'Milwaukee Bucks', conference: 'East', division: 'Central', city: 'Milwaukee', state: 'WI', lat: 43.0435, lon: -87.9170, arena: 'Fiserv Forum' },
  'MIN': { name: 'Minnesota Timberwolves', conference: 'West', division: 'Northwest', city: 'Minneapolis', state: 'MN', lat: 44.9795, lon: -93.2760, arena: 'Target Center' },
  'NOP': { name: 'New Orleans Pelicans', conference: 'West', division: 'Southwest', city: 'New Orleans', state: 'LA', lat: 29.9490, lon: -90.0821, arena: 'Smoothie King Center' },
  'NYK': { name: 'New York Knicks', conference: 'East', division: 'Atlantic', city: 'New York', state: 'NY', lat: 40.7505, lon: -73.9934, arena: 'Madison Square Garden' },
  'OKC': { name: 'Oklahoma City Thunder', conference: 'West', division: 'Northwest', city: 'Oklahoma City', state: 'OK', lat: 35.4634, lon: -97.5151, arena: 'Paycom Center' },
  'ORL': { name: 'Orlando Magic', conference: 'East', division: 'Southeast', city: 'Orlando', state: 'FL', lat: 28.5392, lon: -81.3839, arena: 'Kia Center' },
  'PHI': { name: 'Philadelphia 76ers', conference: 'East', division: 'Atlantic', city: 'Philadelphia', state: 'PA', lat: 39.9012, lon: -75.1720, arena: 'Wells Fargo Center' },
  'PHX': { name: 'Phoenix Suns', conference: 'West', division: 'Pacific', city: 'Phoenix', state: 'AZ', lat: 33.4457, lon: -112.0712, arena: 'Footprint Center' },
  'POR': { name: 'Portland Trail Blazers', conference: 'West', division: 'Northwest', city: 'Portland', state: 'OR', lat: 45.5317, lon: -122.6668, arena: 'Moda Center' },
  'SAC': { name: 'Sacramento Kings', conference: 'West', division: 'Pacific', city: 'Sacramento', state: 'CA', lat: 38.5802, lon: -121.4997, arena: 'Golden 1 Center' },
  'SAS': { name: 'San Antonio Spurs', conference: 'West', division: 'Southwest', city: 'San Antonio', state: 'TX', lat: 29.4270, lon: -98.4375, arena: 'Frost Bank Center' },
  'TOR': { name: 'Toronto Raptors', conference: 'East', division: 'Atlantic', city: 'Toronto', state: 'ON', lat: 43.6435, lon: -79.3791, arena: 'Scotiabank Arena' },
  'UTA': { name: 'Utah Jazz', conference: 'West', division: 'Northwest', city: 'Salt Lake City', state: 'UT', lat: 40.7683, lon: -111.9011, arena: 'Delta Center' },
  'WAS': { name: 'Washington Wizards', conference: 'East', division: 'Southeast', city: 'Washington', state: 'DC', lat: 38.8981, lon: -77.0209, arena: 'Capital One Arena' }
};

// ESPN NBA Team IDs mapping
const espnNBATeamIds = {
  'ATL': '1', 'BOS': '2', 'BKN': '17', 'CHA': '30', 'CHI': '4',
  'CLE': '5', 'DAL': '6', 'DEN': '7', 'DET': '8', 'GSW': '9',
  'HOU': '10', 'IND': '11', 'LAC': '12', 'LAL': '13', 'MEM': '29',
  'MIA': '14', 'MIL': '15', 'MIN': '16', 'NOP': '3', 'NYK': '18',
  'OKC': '25', 'ORL': '19', 'PHI': '20', 'PHX': '21', 'POR': '22',
  'SAC': '23', 'SAS': '24', 'TOR': '28', 'UTA': '26', 'WAS': '27'
};

module.exports = {
  nbaTeams,
  espnNBATeamIds
};
