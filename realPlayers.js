// Real NFL player rosters for 2025 season
// Includes starting QBs, top 2 RBs, top 3 WRs, top TE, and top 3 defensive players

const nflRealPlayers = {
  'ARI': {
    QB: [{ name: 'Kyler Murray', number: '1' }],
    RB: [{ name: 'James Conner', number: '6' }, { name: 'Emari Demercado', number: '31' }],
    WR: [{ name: 'Marvin Harrison Jr.', number: '18' }, { name: 'Michael Wilson', number: '14' }, { name: 'Greg Dortch', number: '83' }],
    TE: [{ name: 'Trey McBride', number: '85' }],
    DEF: [{ name: 'Zaven Collins', number: '25' }, { name: 'Budda Baker', number: '3' }, { name: 'Kyzir White', number: '7' }]
  },
  'ATL': {
    QB: [{ name: 'Kirk Cousins', number: '18' }],
    RB: [{ name: 'Bijan Robinson', number: '7' }, { name: 'Tyler Allgeier', number: '25' }],
    WR: [{ name: 'Drake London', number: '5' }, { name: 'Darnell Mooney', number: '1' }, { name: 'Ray-Ray McCloud', number: '3' }],
    TE: [{ name: 'Kyle Pitts', number: '8' }],
    DEF: [{ name: 'Grady Jarrett', number: '97' }, { name: 'Jessie Bates III', number: '21' }, { name: 'Kaden Elliss', number: '55' }]
  },
  'BAL': {
    QB: [{ name: 'Lamar Jackson', number: '8' }],
    RB: [{ name: 'Derrick Henry', number: '22' }, { name: 'Justice Hill', number: '43' }],
    WR: [{ name: 'Zay Flowers', number: '4' }, { name: 'Rashod Bateman', number: '7' }, { name: 'Nelson Agholor', number: '15' }],
    TE: [{ name: 'Mark Andrews', number: '89' }],
    DEF: [{ name: 'Roquan Smith', number: '0' }, { name: 'Kyle Hamilton', number: '14' }, { name: 'Marlon Humphrey', number: '44' }]
  },
  'BUF': {
    QB: [{ name: 'Josh Allen', number: '17' }],
    RB: [{ name: 'James Cook', number: '4' }, { name: 'Ty Johnson', number: '24' }],
    WR: [{ name: 'Khalil Shakir', number: '10' }, { name: 'Keon Coleman', number: '0' }, { name: 'Curtis Samuel', number: '1' }],
    TE: [{ name: 'Dalton Kincaid', number: '86' }],
    DEF: [{ name: 'Matt Milano', number: '58' }, { name: 'Terrel Bernard', number: '43' }, { name: 'Rasul Douglas', number: '29' }]
  },
  'CAR': {
    QB: [{ name: 'Bryce Young', number: '9' }],
    RB: [{ name: 'Chuba Hubbard', number: '30' }, { name: 'Miles Sanders', number: '24' }],
    WR: [{ name: 'Adam Thielen', number: '19' }, { name: 'Diontae Johnson', number: '5' }, { name: 'Jonathan Mingo', number: '15' }],
    TE: [{ name: 'Tommy Tremble', number: '82' }],
    DEF: [{ name: 'Brian Burns', number: '53' }, { name: 'Shaq Thompson', number: '7' }, { name: 'Jaycee Horn', number: '8' }]
  },
  'CHI': {
    QB: [{ name: 'Caleb Williams', number: '18' }],
    RB: [{ name: 'D\'Andre Swift', number: '4' }, { name: 'Roschon Johnson', number: '23' }],
    WR: [{ name: 'DJ Moore', number: '2' }, { name: 'Keenan Allen', number: '13' }, { name: 'Rome Odunze', number: '15' }],
    TE: [{ name: 'Cole Kmet', number: '85' }],
    DEF: [{ name: 'Montez Sweat', number: '98' }, { name: 'T.J. Edwards', number: '53' }, { name: 'Jaylon Johnson', number: '33' }]
  },
  'CIN': {
    QB: [{ name: 'Joe Burrow', number: '9' }],
    RB: [{ name: 'Chase Brown', number: '30' }, { name: 'Zack Moss', number: '2' }],
    WR: [{ name: 'Ja\'Marr Chase', number: '1' }, { name: 'Tee Higgins', number: '5' }, { name: 'Andrei Iosivas', number: '80' }],
    TE: [{ name: 'Mike Gesicki', number: '88' }],
    DEF: [{ name: 'Trey Hendrickson', number: '91' }, { name: 'Logan Wilson', number: '55' }, { name: 'Cam Taylor-Britt', number: '29' }]
  },
  'CLE': {
    QB: [{ name: 'Jameis Winston', number: '5' }],
    RB: [{ name: 'Nick Chubb', number: '24' }, { name: 'Jerome Ford', number: '34' }],
    WR: [{ name: 'Jerry Jeudy', number: '3' }, { name: 'Elijah Moore', number: '8' }, { name: 'Cedric Tillman', number: '16' }],
    TE: [{ name: 'David Njoku', number: '85' }],
    DEF: [{ name: 'Myles Garrett', number: '95' }, { name: 'Jordan Hicks', number: '58' }, { name: 'Denzel Ward', number: '21' }]
  },
  'DAL': {
    QB: [{ name: 'Cooper Rush', number: '10' }],
    RB: [{ name: 'Rico Dowdle', number: '23' }, { name: 'Deuce Vaughn', number: '42' }],
    WR: [{ name: 'CeeDee Lamb', number: '88' }, { name: 'George Pickens', number: '14' }, { name: 'Jake Ferguson', number: '87' }],
    TE: [{ name: 'Luke Schoonmaker', number: '86' }],
    DEF: [{ name: 'Micah Parsons', number: '11' }, { name: 'DeMarcus Lawrence', number: '90' }, { name: 'Trevon Diggs', number: '7' }]
  },
  'DEN': {
    QB: [{ name: 'Bo Nix', number: '10' }],
    RB: [{ name: 'Javonte Williams', number: '33' }, { name: 'Jaleel McLaughlin', number: '38' }],
    WR: [{ name: 'Courtland Sutton', number: '14' }, { name: 'Marvin Mims Jr.', number: '19' }, { name: 'Josh Reynolds', number: '11' }],
    TE: [{ name: 'Adam Trautman', number: '82' }],
    DEF: [{ name: 'Patrick Surtain II', number: '2' }, { name: 'Alex Singleton', number: '49' }, { name: 'Nik Bonitto', number: '0' }]
  },
  'DET': {
    QB: [{ name: 'Jared Goff', number: '16' }],
    RB: [{ name: 'Jahmyr Gibbs', number: '26' }, { name: 'David Montgomery', number: '5' }],
    WR: [{ name: 'Amon-Ra St. Brown', number: '14' }, { name: 'Jameson Williams', number: '9' }, { name: 'Tim Patrick', number: '17' }],
    TE: [{ name: 'Sam LaPorta', number: '87' }],
    DEF: [{ name: 'Aidan Hutchinson', number: '97' }, { name: 'Alex Anzalone', number: '34' }, { name: 'Brian Branch', number: '32' }]
  },
  'GB': {
    QB: [{ name: 'Jordan Love', number: '10' }],
    RB: [{ name: 'Josh Jacobs', number: '8' }, { name: 'Emanuel Wilson', number: '31' }],
    WR: [{ name: 'Jayden Reed', number: '11' }, { name: 'Dontayvion Wicks', number: '13' }, { name: 'Romeo Doubs', number: '87' }],
    TE: [{ name: 'Tucker Kraft', number: '85' }],
    DEF: [{ name: 'Rashan Gary', number: '52' }, { name: 'Quay Walker', number: '7' }, { name: 'Jaire Alexander', number: '23' }]
  },
  'HOU': {
    QB: [{ name: 'C.J. Stroud', number: '7' }],
    RB: [{ name: 'Joe Mixon', number: '28' }, { name: 'Dameon Pierce', number: '31' }],
    WR: [{ name: 'Nico Collins', number: '12' }, { name: 'Tank Dell', number: '3' }, { name: 'Robert Woods', number: '2' }],
    TE: [{ name: 'Dalton Schultz', number: '86' }],
    DEF: [{ name: 'Will Anderson Jr.', number: '51' }, { name: 'Azeez Al-Shaair', number: '0' }, { name: 'Derek Stingley Jr.', number: '24' }]
  },
  'IND': {
    QB: [{ name: 'Anthony Richardson', number: '5' }],
    RB: [{ name: 'Jonathan Taylor', number: '28' }, { name: 'Trey Sermon', number: '33' }],
    WR: [{ name: 'Michael Pittman Jr.', number: '11' }, { name: 'Josh Downs', number: '1' }, { name: 'Alec Pierce', number: '14' }],
    TE: [{ name: 'Kylen Granson', number: '83' }],
    DEF: [{ name: 'DeForest Buckner', number: '99' }, { name: 'Zaire Franklin', number: '44' }, { name: 'Kenny Moore II', number: '23' }]
  },
  'JAX': {
    QB: [{ name: 'Mac Jones', number: '10' }],
    RB: [{ name: 'Travis Etienne Jr.', number: '1' }, { name: 'Tank Bigsby', number: '4' }],
    WR: [{ name: 'Brian Thomas Jr.', number: '7' }, { name: 'Christian Kirk', number: '13' }, { name: 'Parker Washington', number: '15' }],
    TE: [{ name: 'Evan Engram', number: '17' }],
    DEF: [{ name: 'Josh Hines-Allen', number: '41' }, { name: 'Foyesade Oluokun', number: '23' }, { name: 'Tyson Campbell', number: '32' }]
  },
  'KC': {
    QB: [{ name: 'Patrick Mahomes', number: '15' }],
    RB: [{ name: 'Kareem Hunt', number: '29' }, { name: 'Samaje Perine', number: '34' }],
    WR: [{ name: 'DeAndre Hopkins', number: '8' }, { name: 'Xavier Worthy', number: '1' }, { name: 'JuJu Smith-Schuster', number: '9' }],
    TE: [{ name: 'Travis Kelce', number: '87' }],
    DEF: [{ name: 'Chris Jones', number: '95' }, { name: 'Nick Bolton', number: '32' }, { name: 'Trent McDuffie', number: '21' }]
  },
  'LV': {
    QB: [{ name: 'Gardner Minshew', number: '15' }],
    RB: [{ name: 'Alexander Mattison', number: '22' }, { name: 'Ameer Abdullah', number: '8' }],
    WR: [{ name: 'Jakobi Meyers', number: '16' }, { name: 'Tre Tucker', number: '11' }, { name: 'Kristian Wilkerson', number: '19' }],
    TE: [{ name: 'Brock Bowers', number: '89' }],
    DEF: [{ name: 'Maxx Crosby', number: '98' }, { name: 'Robert Spillane', number: '41' }, { name: 'Jack Jones', number: '18' }]
  },
  'LAC': {
    QB: [{ name: 'Justin Herbert', number: '10' }],
    RB: [{ name: 'J.K. Dobbins', number: '27' }, { name: 'Gus Edwards', number: '35' }],
    WR: [{ name: 'Ladd McConkey', number: '15' }, { name: 'Quentin Johnston', number: '1' }, { name: 'Joshua Palmer', number: '5' }],
    TE: [{ name: 'Will Dissly', number: '87' }],
    DEF: [{ name: 'Khalil Mack', number: '52' }, { name: 'Daiyan Henley', number: '43' }, { name: 'Derwin James Jr.', number: '3' }]
  },
  'LAR': {
    QB: [{ name: 'Matthew Stafford', number: '9' }],
    RB: [{ name: 'Kyren Williams', number: '23' }, { name: 'Blake Corum', number: '22' }],
    WR: [{ name: 'Cooper Kupp', number: '10' }, { name: 'Puka Nacua', number: '17' }, { name: 'Demarcus Robinson', number: '15' }],
    TE: [{ name: 'Colby Parkinson', number: '48' }],
    DEF: [{ name: 'Kobie Turner', number: '91' }, { name: 'Byron Young', number: '0' }, { name: 'Kamren Curl', number: '31' }]
  },
  'MIA': {
    QB: [{ name: 'Tua Tagovailoa', number: '1' }],
    RB: [{ name: 'De\'Von Achane', number: '28' }, { name: 'Raheem Mostert', number: '31' }],
    WR: [{ name: 'Tyreek Hill', number: '10' }, { name: 'Jaylen Waddle', number: '17' }, { name: 'Odell Beckham Jr.', number: '3' }],
    TE: [{ name: 'Jonnu Smith', number: '9' }],
    DEF: [{ name: 'Jaelan Phillips', number: '15' }, { name: 'Jordyn Brooks', number: '20' }, { name: 'Jalen Ramsey', number: '5' }]
  },
  'MIN': {
    QB: [{ name: 'Sam Darnold', number: '14' }],
    RB: [{ name: 'Aaron Jones', number: '33' }, { name: 'Cam Akers', number: '3' }],
    WR: [{ name: 'Justin Jefferson', number: '18' }, { name: 'Jordan Addison', number: '3' }, { name: 'Jalen Nailor', number: '83' }],
    TE: [{ name: 'T.J. Hockenson', number: '87' }],
    DEF: [{ name: 'Andrew Van Ginkel', number: '44' }, { name: 'Blake Cashman', number: '54' }, { name: 'Byron Murphy Jr.', number: '0' }]
  },
  'NE': {
    QB: [{ name: 'Drake Maye', number: '10' }],
    RB: [{ name: 'Rhamondre Stevenson', number: '38' }, { name: 'Antonio Gibson', number: '44' }],
    WR: [{ name: 'DeMario Douglas', number: '3' }, { name: 'Kayshon Boutte', number: '19' }, { name: 'Kendrick Bourne', number: '84' }],
    TE: [{ name: 'Hunter Henry', number: '85' }],
    DEF: [{ name: 'Christian Barmore', number: '90' }, { name: 'Ja\'Whaun Bentley', number: '8' }, { name: 'Christian Gonzalez', number: '6' }]
  },
  'NO': {
    QB: [{ name: 'Derek Carr', number: '4' }],
    RB: [{ name: 'Alvin Kamara', number: '41' }, { name: 'Kendre Miller', number: '27' }],
    WR: [{ name: 'Chris Olave', number: '12' }, { name: 'Rashid Shaheed', number: '22' }, { name: 'Marquez Valdes-Scantling', number: '13' }],
    TE: [{ name: 'Foster Moreau', number: '87' }],
    DEF: [{ name: 'Cameron Jordan', number: '94' }, { name: 'Demario Davis', number: '56' }, { name: 'Tyrann Mathieu', number: '32' }]
  },
  'NYG': {
    QB: [{ name: 'Tommy DeVito', number: '15' }],
    RB: [{ name: 'Tyrone Tracy Jr.', number: '29' }, { name: 'Devin Singletary', number: '26' }],
    WR: [{ name: 'Malik Nabers', number: '1' }, { name: 'Wan\'Dale Robinson', number: '17' }, { name: 'Darius Slayton', number: '86' }],
    TE: [{ name: 'Theo Johnson', number: '85' }],
    DEF: [{ name: 'Dexter Lawrence', number: '97' }, { name: 'Bobby Okereke', number: '58' }, { name: 'Deonte Banks', number: '25' }]
  },
  'NYJ': {
    QB: [{ name: 'Aaron Rodgers', number: '8' }],
    RB: [{ name: 'Breece Hall', number: '20' }, { name: 'Braelon Allen', number: '0' }],
    WR: [{ name: 'Garrett Wilson', number: '5' }, { name: 'Allen Lazard', number: '10' }, { name: 'Xavier Gipson', number: '82' }],
    TE: [{ name: 'Tyler Conklin', number: '83' }],
    DEF: [{ name: 'Quinnen Williams', number: '95' }, { name: 'C.J. Mosley', number: '57' }, { name: 'Sauce Gardner', number: '1' }]
  },
  'PHI': {
    QB: [{ name: 'Jalen Hurts', number: '1' }],
    RB: [{ name: 'Saquon Barkley', number: '26' }, { name: 'Kenneth Gainwell', number: '14' }],
    WR: [{ name: 'A.J. Brown', number: '11' }, { name: 'DeVonta Smith', number: '6' }, { name: 'Jahan Dotson', number: '84' }],
    TE: [{ name: 'Dallas Goedert', number: '88' }],
    DEF: [{ name: 'Josh Sweat', number: '94' }, { name: 'Zack Baun', number: '53' }, { name: 'Darius Slay', number: '2' }]
  },
  'PIT': {
    QB: [{ name: 'Russell Wilson', number: '3' }],
    RB: [{ name: 'Najee Harris', number: '22' }, { name: 'Jaylen Warren', number: '30' }],
    WR: [{ name: 'George Pickens', number: '14' }, { name: 'Van Jefferson', number: '18' }, { name: 'Calvin Austin III', number: '19' }],
    TE: [{ name: 'Pat Freiermuth', number: '88' }],
    DEF: [{ name: 'T.J. Watt', number: '90' }, { name: 'Patrick Queen', number: '6' }, { name: 'Minkah Fitzpatrick', number: '39' }]
  },
  'SF': {
    QB: [{ name: 'Brock Purdy', number: '13' }],
    RB: [{ name: 'Christian McCaffrey', number: '23' }, { name: 'Jordan Mason', number: '24' }],
    WR: [{ name: 'Deebo Samuel', number: '19' }, { name: 'Jauan Jennings', number: '15' }, { name: 'Brandon Aiyuk', number: '11' }],
    TE: [{ name: 'George Kittle', number: '85' }],
    DEF: [{ name: 'Nick Bosa', number: '97' }, { name: 'Fred Warner', number: '54' }, { name: 'Charvarius Ward', number: '7' }]
  },
  'SEA': {
    QB: [{ name: 'Geno Smith', number: '7' }],
    RB: [{ name: 'Kenneth Walker III', number: '9' }, { name: 'Zach Charbonnet', number: '26' }],
    WR: [{ name: 'DK Metcalf', number: '14' }, { name: 'Tyler Lockett', number: '16' }, { name: 'Jaxon Smith-Njigba', number: '11' }],
    TE: [{ name: 'Noah Fant', number: '87' }],
    DEF: [{ name: 'Boye Mafe', number: '53' }, { name: 'Jordyn Brooks', number: '56' }, { name: 'Devon Witherspoon', number: '21' }]
  },
  'TB': {
    QB: [{ name: 'Baker Mayfield', number: '6' }],
    RB: [{ name: 'Rachaad White', number: '29' }, { name: 'Bucky Irving', number: '7' }],
    WR: [{ name: 'Mike Evans', number: '13' }, { name: 'Chris Godwin', number: '14' }, { name: 'Sterling Shepard', number: '3' }],
    TE: [{ name: 'Cade Otton', number: '88' }],
    DEF: [{ name: 'Vita Vea', number: '50' }, { name: 'Lavonte David', number: '54' }, { name: 'Antoine Winfield Jr.', number: '31' }]
  },
  'TEN': {
    QB: [{ name: 'Will Levis', number: '8' }],
    RB: [{ name: 'Tony Pollard', number: '20' }, { name: 'Tyjae Spears', number: '2' }],
    WR: [{ name: 'Calvin Ridley', number: '0' }, { name: 'Tyler Boyd', number: '83' }, { name: 'Nick Westbrook-Ikhine', number: '15' }],
    TE: [{ name: 'Chigoziem Okonkwo', number: '85' }],
    DEF: [{ name: 'Jeffery Simmons', number: '98' }, { name: 'Harold Landry III', number: '58' }, { name: 'L\'Jarius Sneed', number: '38' }]
  },
  'WAS': {
    QB: [{ name: 'Jayden Daniels', number: '5' }],
    RB: [{ name: 'Brian Robinson Jr.', number: '8' }, { name: 'Austin Ekeler', number: '30' }],
    WR: [{ name: 'Terry McLaurin', number: '17' }, { name: 'Noah Brown', number: '85' }, { name: 'Olamide Zaccheaus', number: '14' }],
    TE: [{ name: 'Zach Ertz', number: '86' }],
    DEF: [{ name: 'Jonathan Allen', number: '93' }, { name: 'Bobby Wagner', number: '54' }, { name: 'Benjamin St-Juste', number: '25' }]
  }
};

module.exports = nflRealPlayers;
