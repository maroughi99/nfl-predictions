// API Base URL - use relative path so it works both locally and on Vercel
const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';

// Helper function to get date string in EST timezone
function getESTDateString(date) {
    const estDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const year = estDate.getFullYear();
    const month = String(estDate.getMonth() + 1).padStart(2, '0');
    const day = String(estDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// State
let currentSport = 'nfl'; // 'nfl' or 'nba'
let currentDate = new Date();
let todaysGames = [];
let currentPrediction = null;

// Get API endpoint based on current sport
function getAPIPath(endpoint) {
    if (currentSport === 'nba') {
        return `${API_BASE}/nba/${endpoint}`;
    }
    return `${API_BASE}/${endpoint}`;
}

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    await loadTodaysGames();
    updateDateDisplay();
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('refreshBtn').addEventListener('click', () => loadTodaysGames());
    document.getElementById('prevDay').addEventListener('click', () => changeDate(-1));
    document.getElementById('nextDay').addEventListener('click', () => changeDate(1));
    
    // Sport switching
    document.querySelectorAll('.sport-btn').forEach(btn => {
        btn.addEventListener('click', () => switchSport(btn.dataset.sport));
    });
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // History tab buttons
    document.getElementById('updateResultsBtn')?.addEventListener('click', updateResults);
    document.getElementById('updatePropResultsBtn')?.addEventListener('click', updatePropResults);
}

// Switch sports (NFL <-> NBA)
function switchSport(sport) {
    if (currentSport === sport) return;
    
    currentSport = sport;
    
    // Update sport buttons
    document.querySelectorAll('.sport-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sport === sport);
    });
    
    // Update header
    const sportName = sport.toUpperCase();
    document.getElementById('sportName').textContent = sportName;
    
    // Reload games for new sport
    currentDate = new Date();
    updateDateDisplay();
    loadTodaysGames();
}

// Switch tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });
    
    const activeTab = document.getElementById(`${tabName}Tab`);
    activeTab.classList.add('active');
    activeTab.style.display = 'block';
    
    // Load data if switching to history
    if (tabName === 'history') {
        loadAccuracy();
        loadPropAccuracy();
        loadHistory();
    }
    
    // Load games if switching to parlay
    if (tabName === 'parlay') {
        loadParlayGames();
    }
}

// Load accuracy metrics
async function loadAccuracy() {
    try {
        const response = await fetch(`${API_BASE}/accuracy`);
        const data = await response.json();
        
        document.getElementById('totalPredictions').textContent = data.totalPredictions || 0;
        document.getElementById('totalCompleted').textContent = data.totalCompleted || 0;
        document.getElementById('winnerAccuracy').textContent = `${data.winnerAccuracy || 0}%`;
        document.getElementById('avgScoreDiff').textContent = `${data.avgTotalScoreDiff || 0} pts`;
        
        // Confidence breakdown
        if (data.byConfidence) {
            document.getElementById('highAccuracy').textContent = `${data.byConfidence.High.accuracy}%`;
            document.getElementById('highDetail').textContent = `${data.byConfidence.High.correct}/${data.byConfidence.High.total} correct`;
            
            document.getElementById('mediumAccuracy').textContent = `${data.byConfidence.Medium.accuracy}%`;
            document.getElementById('mediumDetail').textContent = `${data.byConfidence.Medium.correct}/${data.byConfidence.Medium.total} correct`;
            
            document.getElementById('lowAccuracy').textContent = `${data.byConfidence.Low.accuracy}%`;
            document.getElementById('lowDetail').textContent = `${data.byConfidence.Low.correct}/${data.byConfidence.Low.total} correct`;
        }
    } catch (error) {
        console.error('Error loading accuracy:', error);
    }
}

// Load prop accuracy metrics
async function loadPropAccuracy() {
    try {
        const response = await fetch(`${API_BASE}/prop-accuracy`);
        const data = await response.json();
        
        document.getElementById('totalProps').textContent = data.totalProps || 0;
        document.getElementById('completedProps').textContent = data.totalCompleted || 0;
        document.getElementById('propAccuracy').textContent = `${data.accuracy || 0}%`;
        document.getElementById('correctProps').textContent = `${data.correctPredictions || 0}/${data.totalCompleted || 0}`;
        
        // Confidence breakdown
        if (data.byConfidence) {
            document.getElementById('propHighAccuracy').textContent = `${data.byConfidence.High.accuracy}%`;
            document.getElementById('propHighDetail').textContent = `${data.byConfidence.High.correct}/${data.byConfidence.High.total} correct`;
            
            document.getElementById('propMediumAccuracy').textContent = `${data.byConfidence.Medium.accuracy}%`;
            document.getElementById('propMediumDetail').textContent = `${data.byConfidence.Medium.correct}/${data.byConfidence.Medium.total} correct`;
            
            document.getElementById('propLowAccuracy').textContent = `${data.byConfidence.Low.accuracy}%`;
            document.getElementById('propLowDetail').textContent = `${data.byConfidence.Low.correct}/${data.byConfidence.Low.total} correct`;
        }
    } catch (error) {
        console.error('Error loading prop accuracy:', error);
    }
}

// Load prediction history
async function loadHistory() {
    try {
        const response = await fetch(`${API_BASE}/history?limit=50`);
        const data = await response.json();
        
        const historyList = document.getElementById('historyList');
        
        if (!data.predictions || data.predictions.length === 0) {
            historyList.innerHTML = '<div class="no-history">No predictions yet. Make some predictions to see them here!</div>';
            return;
        }
        
        historyList.innerHTML = data.predictions.map(pred => {
            const hasResult = pred.actual_home_score !== null;
            const predictedWinner = pred.home_win_prob > pred.away_win_prob ? pred.home_team : pred.away_team;
            const correctPrediction = hasResult && predictedWinner === pred.actual_winner;
            
            return `
                <div class="history-item ${hasResult ? (correctPrediction ? 'correct' : 'incorrect') : 'pending'}">
                    <div class="history-header">
                        <div class="history-matchup">
                            <span class="history-team">${pred.away_team}</span>
                            <span class="vs">@</span>
                            <span class="history-team">${pred.home_team}</span>
                        </div>
                        <div class="history-date">${new Date(pred.game_date).toLocaleDateString()}</div>
                    </div>
                    <div class="history-details">
                        <div class="history-prediction">
                            <div class="detail-label">Predicted</div>
                            <div class="detail-value">${pred.predicted_away_score}-${pred.predicted_home_score}</div>
                            <div class="detail-sub">${pred.home_win_prob.toFixed(1)}% ${pred.home_team}</div>
                        </div>
                        ${hasResult ? `
                            <div class="history-actual">
                                <div class="detail-label">Actual</div>
                                <div class="detail-value">${pred.actual_away_score}-${pred.actual_home_score}</div>
                                <div class="detail-sub ${correctPrediction ? 'correct-label' : 'incorrect-label'}">
                                    ${correctPrediction ? '✓ Correct' : '✗ Incorrect'}
                                </div>
                            </div>
                        ` : `
                            <div class="history-pending">
                                <div class="detail-label">Status</div>
                                <div class="detail-value pending-label">Pending</div>
                            </div>
                        `}
                        <div class="history-confidence">
                            <div class="confidence-badge-small ${pred.confidence.toLowerCase()}">${pred.confidence}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading history:', error);
        document.getElementById('historyList').innerHTML = '<div class="error">Failed to load history</div>';
    }
}

// Update results from ESPN
async function updateResults() {
    const btn = document.getElementById('updateResultsBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Updating...';
    
    try {
        const response = await fetch(`${API_BASE}/update-results`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: new Date().toISOString().split('T')[0] })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`✅ Updated ${data.updated} completed game results`);
            await loadAccuracy();
            await loadHistory();
        } else {
            alert('❌ Failed to update results');
        }
    } catch (error) {
        console.error('Error updating results:', error);
        alert('❌ Error updating results');
    } finally {
        btn.disabled = false;
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
            </svg>
            Update Results from ESPN
        `;
    }
}

// Update prop results from Sleeper
async function updatePropResults() {
    const btn = document.getElementById('updatePropResultsBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Updating...';
    
    try {
        // Set a longer timeout for this operation (60 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);
        
        const response = await fetch(`${API_BASE}/update-all-prop-results`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const data = await response.json();
        
        if (data.success) {
            alert(`✅ Updated ${data.updated} player prop results`);
            await loadPropAccuracy();
        } else {
            alert('❌ Failed to update prop results: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error updating prop results:', error);
        if (error.name === 'AbortError') {
            alert('❌ Request timeout: This feature requires loading player stats which can take 15-20 seconds. On Vercel free tier (10 sec limit), this may not work reliably. Try again or run locally.');
        } else {
            alert('❌ Error updating prop results: ' + error.message);
        }
    } finally {
        btn.disabled = false;
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
            </svg>
            Update Prop Results from Sleeper
        `;
    }
}

// Change date
function changeDate(days) {
    currentDate.setDate(currentDate.getDate() + days);
    updateDateDisplay();
    loadTodaysGames();
}

// Update date display
function updateDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = currentDate.toLocaleDateString('en-US', options);
    document.getElementById('displayDate').textContent = dateStr;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(currentDate);
    selected.setHours(0, 0, 0, 0);
    
    const sportName = currentSport.toUpperCase();
    if (selected.getTime() === today.getTime()) {
        document.getElementById('gamesTitle').textContent = `Today's ${sportName} Games`;
    } else if (selected < today) {
        document.getElementById('gamesTitle').textContent = `Past ${sportName} Games`;
    } else {
        document.getElementById('gamesTitle').textContent = `Upcoming ${sportName} Games`;
    }
}

// Load today's games with predictions
async function loadTodaysGames() {
    const statusDiv = document.getElementById('gamesStatus');
    const gamesListDiv = document.getElementById('todaysGamesList');
    
    const sportName = currentSport.toUpperCase();
    statusDiv.innerHTML = `<div class="loading-spinner">Loading ${sportName} games and predictions...</div>`;
    gamesListDiv.innerHTML = '';
    
    try {
        const dateStr = getESTDateString(currentDate);
        const response = await fetch(getAPIPath(`games-with-predictions?date=${dateStr}`));
        const data = await response.json();
        
        if (response.ok) {
            todaysGames = data.games;
            
            if (todaysGames.length === 0) {
                statusDiv.innerHTML = `
                    <div class="no-games-message">
                        <h3>No Games Scheduled</h3>
                        <p>There are no ${sportName} games scheduled for this date.</p>
                        <p>Try checking another day!</p>
                    </div>
                `;
            } else {
                statusDiv.innerHTML = `
                    <div style="text-align: center; color: var(--accent-green); font-weight: 600;">
                        ✓ Found ${todaysGames.length} game${todaysGames.length > 1 ? 's' : ''} with AI predictions
                    </div>
                `;
                displayTodaysGames(todaysGames);
            }
        } else {
            statusDiv.innerHTML = `
                <div class="no-games-message">
                    <h3>Error Loading Games</h3>
                    <p>${data.error || 'Failed to fetch games'}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading games:', error);
        statusDiv.innerHTML = `
            <div class="no-games-message">
                <h3>Connection Error</h3>
                <p>Unable to fetch ${sportName} games. Please check your connection and try again.</p>
            </div>
        `;
    }
}

// Display today's games
function displayTodaysGames(games) {
    const container = document.getElementById('todaysGamesList');
    container.innerHTML = '';
    
    games.forEach(game => {
        const card = createGamePredictionCard(game);
        if (card) {
            container.appendChild(card);
        }
    });
}

// Create simple game card without prediction (for games where prediction failed)
function createGameCardWithoutPrediction(game, statusClass, statusIcon, statusText, timeStr) {
    const card = document.createElement('div');
    card.className = 'game-prediction-card';
    
    card.innerHTML = `
        <div class="game-header">
            <div class="game-status ${statusClass}">
                ${statusIcon} ${statusText}
            </div>
            <div class="game-status">
                ${timeStr} • ${game.broadcast || 'TBD'}
            </div>
        </div>
        
        <div class="game-matchup-display">
            <div class="team-display">
                <img src="${game.awayTeam.logo || `https://a.espncdn.com/i/teamlogos/${currentSport}/500/${game.awayTeam.code}.png`}" 
                     alt="${game.awayTeam.name}" 
                     class="team-logo"
                     onerror="this.style.display='none'">
                <div class="team-info">
                    <div class="team-display-name">${game.awayTeam.name}</div>
                    <div class="team-display-record">Record: ${game.awayTeam.record}</div>
                </div>
            </div>
            
            <div class="matchup-divider">@</div>
            
            <div class="team-display">
                <img src="${game.homeTeam.logo || `https://a.espncdn.com/i/teamlogos/${currentSport}/500/${game.homeTeam.code}.png`}" 
                     alt="${game.homeTeam.name}" 
                     class="team-logo"
                     onerror="this.style.display='none'">
                <div class="team-info">
                    <div class="team-display-name">${game.homeTeam.name}</div>
                    <div class="team-display-record">Record: ${game.homeTeam.record}</div>
                </div>
            </div>
        </div>
        
        <div style="padding: 15px; text-align: center; color: #888;">
            <em>Prediction unavailable</em>
        </div>
    `;
    
    return card;
}

// Create game prediction card
function createGamePredictionCard(game) {
    const card = document.createElement('div');
    card.className = 'game-prediction-card';
    
    const gameTime = new Date(game.date);
    const timeStr = gameTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    
    let statusClass = 'status-upcoming';
    let statusText = game.status.detail;
    let statusIcon = '🕐';
    
    if (game.status.state === 'in') {
        statusClass = 'status-live';
        statusIcon = '🔴';
        statusText = 'LIVE';
    } else if (game.status.completed) {
        statusClass = 'status-final';
        statusIcon = '✓';
        statusText = 'FINAL';
    }
    
    // Check if prediction exists (might timeout or fail)
    if (!game.prediction || !game.prediction.team1 || !game.prediction.team2) {
        console.warn('No prediction data for game:', game.name);
        return createGameCardWithoutPrediction(game, statusClass, statusIcon, statusText, timeStr);
    }
    
    const homeProb = parseFloat(game.prediction.team1.probability);
    const awayProb = parseFloat(game.prediction.team2.probability);
    const homeWinning = homeProb > awayProb;
    
    card.innerHTML = `
        <div class="game-header">
            <div class="game-status ${statusClass}">
                ${statusIcon} ${statusText}
            </div>
            <div class="game-status">
                ${timeStr} • ${game.broadcast}
            </div>
        </div>
        
        <div class="game-matchup-display">
            <div class="team-display">
                <img src="${game.awayTeam.logo || `https://a.espncdn.com/i/teamlogos/${currentSport}/500/${game.awayTeam.code}.png`}" 
                     alt="${game.awayTeam.name}" 
                     class="team-logo"
                     onerror="this.style.display='none'">
                <div class="team-info">
                    <div class="team-display-header">
                        <span class="team-display-name">${game.awayTeam.name}</span>
                        ${!homeWinning ? '<span class="winner-badge">FAVORITE</span>' : ''}
                    </div>
                    <div class="team-display-record">Record: ${game.awayTeam.record}</div>
                    <div class="team-display-prob">${awayProb.toFixed(1)}%</div>
                </div>
            </div>
            
            <div class="matchup-divider">@</div>
            
            <div class="team-display">
                <img src="${game.homeTeam.logo || `https://a.espncdn.com/i/teamlogos/${currentSport}/500/${game.homeTeam.code}.png`}" 
                     alt="${game.homeTeam.name}" 
                     class="team-logo"
                     onerror="this.style.display='none'">
                <div class="team-info">
                    <div class="team-display-header">
                        <span class="team-display-name">${game.homeTeam.name}</span>
                        ${homeWinning ? '<span class="winner-badge">FAVORITE</span>' : ''}
                    </div>
                    <div class="team-display-record">Record: ${game.homeTeam.record}</div>
                    <div class="team-display-prob">${homeProb.toFixed(1)}%</div>
                </div>
            </div>
        </div>
        
        <div class="game-details-grid">
            <div class="game-detail-item">
                <div class="detail-label">Predicted Score</div>
                <div class="detail-value">${game.prediction.team2.predictedScore} - ${game.prediction.team1.predictedScore}</div>
            </div>
            <div class="game-detail-item">
                <div class="detail-label">Confidence</div>
                <div class="detail-value">${game.prediction.confidence}</div>
            </div>
            ${game.prediction.weather ? `
            <div class="game-detail-item">
                <div class="detail-label">Weather</div>
                <div class="detail-value">${getWeatherIcon(game.prediction.weather.condition)} ${game.prediction.weather.temperature}°F</div>
            </div>
            ` : ''}
            <div class="game-detail-item">
                <div class="detail-label">Venue</div>
                <div class="detail-value" style="font-size: 0.85rem;">${game.venue}</div>
            </div>
        </div>
    `;
    
    // Add click handler for detailed view
    card.addEventListener('click', () => {
        showDetailedPrediction(game);
    });
    
    return card;
}

// Show detailed prediction
function showDetailedPrediction(game) {
    currentPrediction = game.prediction;
    displayPrediction(game.prediction);
    document.getElementById('resultsSection').style.display = 'block';
    setTimeout(() => {
        document.getElementById('resultsSection').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }, 100);
}

// Display prediction results
function displayPrediction(prediction) {
    // Team names and probabilities
    document.getElementById('team1Name').textContent = prediction.team1.name;
    document.getElementById('team2Name').textContent = prediction.team2.name;
    document.getElementById('team1Prob').textContent = `${prediction.team1.probability}%`;
    document.getElementById('team2Prob').textContent = `${prediction.team2.probability}%`;
    
    // Setup player tabs
    setupPlayerTabs(prediction);
    
    // Probability bars with animation
    setTimeout(() => {
        document.getElementById('team1Bar').style.width = `${prediction.team1.probability}%`;
        document.getElementById('team2Bar').style.width = `${prediction.team2.probability}%`;
    }, 100);
    
    // Predicted scores
    document.getElementById('team1Score').textContent = prediction.team1.predictedScore;
    document.getElementById('team2Score').textContent = prediction.team2.predictedScore;
    
    // Confidence badge
    const confidenceBadge = document.getElementById('confidenceBadge');
    confidenceBadge.textContent = `${prediction.confidence} Confidence`;
    confidenceBadge.style.borderColor = getConfidenceColor(prediction.confidence);
    
    // Weather conditions (only for NFL games)
    if (prediction.weather) {
        displayWeather(prediction.weather);
    } else {
        // Hide weather section for NBA games
        const weatherInfo = document.getElementById('weatherInfo');
        if (weatherInfo) weatherInfo.style.display = 'none';
    }
    
    // Injury report (only for NFL games)
    if (prediction.team1.stats) {
        displayInjuryReport(prediction.team1, prediction.team2);
    } else {
        // Hide injury section for NBA games
        const injuryInfo = document.getElementById('injuryInfo');
        if (injuryInfo) injuryInfo.style.display = 'none';
    }
    
    // Key factors
    const factorsList = document.getElementById('factorsList');
    factorsList.innerHTML = '';
    prediction.keyFactors.forEach(factor => {
        const li = document.createElement('li');
        li.textContent = factor;
        factorsList.appendChild(li);
    });
    
    // Team statistics
    displayTeamStats(prediction.team1, prediction.team2);
}

// Display team statistics comparison
function displayTeamStats(team1, team2) {
    // Skip for NBA games (no detailed stats object)
    if (!team1.stats || !team2.stats) {
        // Hide the stats section for NBA
        const statsSection = document.querySelector('.team-stats-comparison');
        if (statsSection) statsSection.style.display = 'none';
        return;
    }
    
    // Record
    document.getElementById('team1Record').textContent = `${team1.stats.wins}-${team1.stats.losses}`;
    document.getElementById('team2Record').textContent = `${team2.stats.wins}-${team2.stats.losses}`;
    const team1WinPct = team1.stats.wins / (team1.stats.wins + team1.stats.losses);
    const team2WinPct = team2.stats.wins / (team2.stats.wins + team2.stats.losses);
    updateStatBar('recordBar1', 'recordBar2', team1WinPct, team2WinPct);
    
    // Points per game
    document.getElementById('team1PPG').textContent = team1.stats.pointsPerGame;
    document.getElementById('team2PPG').textContent = team2.stats.pointsPerGame;
    updateStatBar('ppgBar1', 'ppgBar2', 
        parseFloat(team1.stats.pointsPerGame), 
        parseFloat(team2.stats.pointsPerGame)
    );
    
    // Points allowed per game (lower is better)
    document.getElementById('team1PAG').textContent = team1.stats.pointsAllowedPerGame;
    document.getElementById('team2PAG').textContent = team2.stats.pointsAllowedPerGame;
    updateStatBar('pagBar2', 'pagBar1', 
        parseFloat(team1.stats.pointsAllowedPerGame), 
        parseFloat(team2.stats.pointsAllowedPerGame)
    );
    
    // Offensive rating
    document.getElementById('team1OR').textContent = team1.stats.offensiveRating;
    document.getElementById('team2OR').textContent = team2.stats.offensiveRating;
    updateStatBar('orBar1', 'orBar2', 
        parseFloat(team1.stats.offensiveRating), 
        parseFloat(team2.stats.offensiveRating)
    );
    
    // Defensive rating
    document.getElementById('team1DR').textContent = team1.stats.defensiveRating;
    document.getElementById('team2DR').textContent = team2.stats.defensiveRating;
    updateStatBar('drBar1', 'drBar2', 
        parseFloat(team1.stats.defensiveRating), 
        parseFloat(team2.stats.defensiveRating)
    );
    
    // Last 5 games
    const team1Wins = team1.stats.lastFiveGames.filter(g => g.result === 'W').length;
    const team2Wins = team2.stats.lastFiveGames.filter(g => g.result === 'W').length;
    document.getElementById('team1L5').textContent = `${team1Wins}-${5 - team1Wins}`;
    document.getElementById('team2L5').textContent = `${team2Wins}-${5 - team2Wins}`;
    updateStatBar('l5Bar1', 'l5Bar2', team1Wins, team2Wins);
    
    // QB Health
    document.getElementById('team1QB').textContent = `${team1.stats.quarterbackHealth}%`;
    document.getElementById('team2QB').textContent = `${team2.stats.quarterbackHealth}%`;
    updateStatBar('qbBar1', 'qbBar2', 
        parseFloat(team1.stats.quarterbackHealth), 
        parseFloat(team2.stats.quarterbackHealth)
    );
    
    // Injuries (lower is better)
    document.getElementById('team1Injuries').textContent = team1.stats.keyInjuries;
    document.getElementById('team2Injuries').textContent = team2.stats.keyInjuries;
    updateStatBar('injBar1', 'injBar2', 
        team1.stats.keyInjuries, 
        team2.stats.keyInjuries
    );
    
    // Rest days
    document.getElementById('team1Rest').textContent = `${team1.stats.daysSinceLastGame} days`;
    document.getElementById('team2Rest').textContent = `${team2.stats.daysSinceLastGame} days`;
    updateStatBar('restBar1', 'restBar2', 
        team1.stats.daysSinceLastGame, 
        team2.stats.daysSinceLastGame
    );
}

// Display weather conditions
function displayWeather(weather) {
    const weatherInfo = document.getElementById('weatherInfo');
    
    const weatherIcon = getWeatherIcon(weather.condition);
    const dataSource = weather.source === 'Open-Meteo API' ? '📡 Live Weather Data' : '🏟️ Indoor Stadium';
    
    weatherInfo.innerHTML = `
        <div class="weather-title">
            ${weatherIcon} Game Conditions <span style="font-size: 0.75rem; opacity: 0.7; margin-left: 0.5rem;">${dataSource}</span>
        </div>
        <div class="weather-details">
            <div class="weather-item">
                <div class="weather-label">Condition</div>
                <div class="weather-value">${weather.condition}</div>
            </div>
            <div class="weather-item">
                <div class="weather-label">Temperature</div>
                <div class="weather-value">${weather.temperature}°F</div>
            </div>
            ${weather.tempHigh ? `
            <div class="weather-item">
                <div class="weather-label">High / Low</div>
                <div class="weather-value">${weather.tempHigh}° / ${weather.tempLow}°</div>
            </div>
            ` : ''}
            <div class="weather-item">
                <div class="weather-label">Wind Speed</div>
                <div class="weather-value">${weather.windSpeed} mph</div>
            </div>
            ${weather.precipitation > 0 ? `
            <div class="weather-item">
                <div class="weather-label">Precip. Chance</div>
                <div class="weather-value">${weather.precipitation}%</div>
            </div>
            ` : ''}
        </div>
    `;
}

// Get weather icon
function getWeatherIcon(condition) {
    const icons = {
        'Clear': '☀️',
        'Cloudy': '☁️',
        'Light Rain': '🌧️',
        'Rain': '🌧️',
        'Heavy Rain': '⛈️',
        'Thunderstorm': '⛈️',
        'Snow': '❄️',
        'Windy': '💨',
        'Dome': '🏟️'
    };
    return icons[condition] || '🌤️';
}

// Display injury report
function displayInjuryReport(team1, team2) {
    const injuryReport = document.getElementById('injuryReport');
    
    const team1Class = team1.stats.keyInjuries <= 1 ? 'low-injuries' : '';
    const team2Class = team2.stats.keyInjuries <= 1 ? 'low-injuries' : '';
    
    injuryReport.innerHTML = `
        <div class="injury-team ${team1Class}">
            <div class="injury-team-name">${team1.name}</div>
            <div class="injury-stats">
                <div>🏥 Key Injuries: ${team1.stats.keyInjuries}</div>
                <div>🎯 QB Health: ${team1.stats.quarterbackHealth}%</div>
                <div>👥 Starters Available: ${team1.stats.startersAvailable}/22</div>
                ${team1.stats.isComingOffBye ? '<div>✅ Coming off Bye Week</div>' : ''}
            </div>
        </div>
        <div class="injury-team ${team2Class}">
            <div class="injury-team-name">${team2.name}</div>
            <div class="injury-stats">
                <div>🏥 Key Injuries: ${team2.stats.keyInjuries}</div>
                <div>🎯 QB Health: ${team2.stats.quarterbackHealth}%</div>
                <div>👥 Starters Available: ${team2.stats.startersAvailable}/22</div>
                ${team2.stats.isComingOffBye ? '<div>✅ Coming off Bye Week</div>' : ''}
            </div>
        </div>
    `;
}

// Update stat comparison bars
function updateStatBar(bar1Id, bar2Id, value1, value2) {
    const total = value1 + value2;
    const pct1 = (value1 / total) * 100;
    const pct2 = (value2 / total) * 100;
    
    setTimeout(() => {
        document.getElementById(bar1Id).style.width = `${pct1}%`;
        document.getElementById(bar2Id).style.width = `${pct2}%`;
    }, 100);
}

// Get confidence color
function getConfidenceColor(confidence) {
    switch (confidence) {
        case 'High': return '#00f2a0';
        case 'Medium': return '#667eea';
        case 'Low': return '#ff6b9d';
        default: return '#667eea';
    }
}

// Setup player prediction tabs
function setupPlayerTabs(prediction) {
    // Check if this is NBA (has topPlayers) or NFL (has quarterbacks)
    if (prediction.team1.roster && prediction.team1.roster.topPlayers) {
        // NBA mode - display top players
        const playerTabs = document.querySelector('.player-tabs');
        if (playerTabs) playerTabs.style.display = 'none'; // Hide position tabs for NBA
        displayNBAPlayers(prediction);
        return;
    } else if (!prediction.team1.roster) {
        // No roster data at all
        const playerSection = document.getElementById('playerStatsContent');
        if (playerSection) playerSection.style.display = 'none';
        const playerTabs = document.querySelector('.player-tabs');
        if (playerTabs) playerTabs.style.display = 'none';
        return;
    }
    
    // NFL mode - use position tabs
    const tabs = document.querySelectorAll('.player-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            displayPlayerStats(prediction, tab.dataset.position);
        });
    });
    
    // Display QB stats by default
    displayPlayerStats(prediction, 'QB');
}

// Display player statistics
function displayPlayerStats(prediction, position) {
    const content = document.getElementById('playerStatsContent');
    content.innerHTML = '';
    
    // Skip for NBA games (no roster data)
    if (!prediction.team1.roster || !prediction.team2.roster) {
        return;
    }
    
    const positionMap = {
        'QB': 'quarterbacks',
        'RB': 'runningBacks',
        'WR': 'wideReceivers',
        'TE': 'tightEnds',
        'DEF': 'defense'
    };
    
    const rosterKey = positionMap[position];
    
    // Team 1 Players
    const team1Section = document.createElement('div');
    team1Section.className = 'team-players-section';
    team1Section.innerHTML = `<h4 class="team-players-header">${prediction.team1.name}</h4>`;
    
    const team1Grid = document.createElement('div');
    team1Grid.className = 'players-grid';
    
    prediction.team1.roster[rosterKey].forEach(player => {
        team1Grid.appendChild(createPlayerCard(player, position));
    });
    
    team1Section.appendChild(team1Grid);
    content.appendChild(team1Section);
    
    // Team 2 Players
    const team2Section = document.createElement('div');
    team2Section.className = 'team-players-section';
    team2Section.innerHTML = `<h4 class="team-players-header">${prediction.team2.name}</h4>`;
    
    const team2Grid = document.createElement('div');
    team2Grid.className = 'players-grid';
    
    prediction.team2.roster[rosterKey].forEach(player => {
        team2Grid.appendChild(createPlayerCard(player, position));
    });
    
    team2Section.appendChild(team2Grid);
    content.appendChild(team2Section);
}

// Create player card
function createPlayerCard(player, position) {
    const card = document.createElement('div');
    card.className = 'player-card';
    
    let statsHTML = '';
    
    if (position === 'QB') {
        statsHTML = `
            <div class="player-stats-row">
                <div class="player-stat-item">
                    <div class="player-stat-label">Pass Yards</div>
                    <div class="player-stat-value">${player.projectedStats.passingYards}</div>
                    <div class="player-stat-value season">Season: ${player.seasonStats.passingYards}</div>
                </div>
                <div class="player-stat-item">
                    <div class="player-stat-label">Pass TDs</div>
                    <div class="player-stat-value">${player.projectedStats.passingTDs}</div>
                    <div class="player-stat-value season">Season: ${player.seasonStats.passingTDs}</div>
                </div>
                <div class="player-stat-item">
                    <div class="player-stat-label">INTs</div>
                    <div class="player-stat-value">${player.projectedStats.interceptions}</div>
                    <div class="player-stat-value season">Season: ${player.seasonStats.interceptions}</div>
                </div>
                <div class="player-stat-item">
                    <div class="player-stat-label">Completions</div>
                    <div class="player-stat-value">${player.projectedStats.completions}/${player.projectedStats.attempts}</div>
                    <div class="player-stat-value season">Season: ${player.seasonStats.completions}/${player.seasonStats.attempts}</div>
                </div>
                <div class="player-stat-item">
                    <div class="player-stat-label">Rush Yards</div>
                    <div class="player-stat-value">${player.projectedStats.rushingYards}</div>
                    <div class="player-stat-value season">Season: ${player.seasonStats.rushingYards}</div>
                </div>
                <div class="player-stat-item">
                    <div class="player-stat-label">Rush TDs</div>
                    <div class="player-stat-value">${player.projectedStats.rushingTDs}</div>
                    <div class="player-stat-value season">Season: ${player.seasonStats.rushingTDs}</div>
                </div>
            </div>
        `;
    } else if (position === 'RB') {
        statsHTML = `
            <div class="player-stats-row">
                <div class="player-stat-item">
                    <div class="player-stat-label">Rush Yards</div>
                    <div class="player-stat-value">${player.projectedStats.rushingYards}</div>
                    <div class="player-stat-value season">Season: ${player.seasonStats.rushingYards}</div>
                </div>
                <div class="player-stat-item">
                    <div class="player-stat-label">Rush TDs</div>
                    <div class="player-stat-value">${player.projectedStats.rushingTDs}</div>
                    <div class="player-stat-value season">Season: ${player.seasonStats.rushingTDs}</div>
                </div>
                <div class="player-stat-item">
                    <div class="player-stat-label">Attempts</div>
                    <div class="player-stat-value">${player.projectedStats.rushingAttempts}</div>
                    <div class="player-stat-value season">Season: ${player.seasonStats.rushingAttempts}</div>
                </div>
                <div class="player-stat-item">
                    <div class="player-stat-label">Receptions</div>
                    <div class="player-stat-value">${player.projectedStats.receptions}</div>
                    <div class="player-stat-value season">Season: ${player.seasonStats.receptions}</div>
                </div>
                <div class="player-stat-item">
                    <div class="player-stat-label">Rec Yards</div>
                    <div class="player-stat-value">${player.projectedStats.receivingYards}</div>
                    <div class="player-stat-value season">Season: ${player.seasonStats.receivingYards}</div>
                </div>
                <div class="player-stat-item">
                    <div class="player-stat-label">Rec TDs</div>
                    <div class="player-stat-value">${player.projectedStats.receivingTDs}</div>
                    <div class="player-stat-value season">Season: ${player.seasonStats.receivingTDs}</div>
                </div>
            </div>
        `;
    } else if (position === 'WR' || position === 'TE') {
        statsHTML = `
            <div class="player-stats-row">
                <div class="player-stat-item">
                    <div class="player-stat-label">Receptions</div>
                    <div class="player-stat-value">${player.projectedStats.receptions}</div>
                    <div class="player-stat-value season">Season: ${player.seasonStats.receptions}</div>
                </div>
                <div class="player-stat-item">
                    <div class="player-stat-label">Targets</div>
                    <div class="player-stat-value">${player.projectedStats.targets}</div>
                    <div class="player-stat-value season">Season: ${player.seasonStats.targets}</div>
                </div>
                <div class="player-stat-item">
                    <div class="player-stat-label">Rec Yards</div>
                    <div class="player-stat-value">${player.projectedStats.receivingYards}</div>
                    <div class="player-stat-value season">Season: ${player.seasonStats.receivingYards}</div>
                </div>
                <div class="player-stat-item">
                    <div class="player-stat-label">Rec TDs</div>
                    <div class="player-stat-value">${player.projectedStats.receivingTDs}</div>
                    <div class="player-stat-value season">Season: ${player.seasonStats.receivingTDs}</div>
                </div>
                <div class="player-stat-item">
                    <div class="player-stat-label">YPR</div>
                    <div class="player-stat-value season">Season: ${player.seasonStats.yardsPerReception}</div>
                </div>
            </div>
        `;
    } else if (position === 'DEF') {
        statsHTML = `
            <div class="player-stats-row">
                <div class="player-stat-item">
                    <div class="player-stat-label">Tackles</div>
                    <div class="player-stat-value">${player.projectedStats.tackles}</div>
                    <div class="player-stat-value season">Season: ${player.seasonStats.tackles}</div>
                </div>
                <div class="player-stat-item">
                    <div class="player-stat-label">Sacks</div>
                    <div class="player-stat-value">${player.projectedStats.sacks}</div>
                    <div class="player-stat-value season">Season: ${player.seasonStats.sacks}</div>
                </div>
                <div class="player-stat-item">
                    <div class="player-stat-label">Interceptions</div>
                    <div class="player-stat-value">${player.projectedStats.interceptions}</div>
                    <div class="player-stat-value season">Season: ${player.seasonStats.interceptions}</div>
                </div>
                <div class="player-stat-item">
                    <div class="player-stat-label">Pass Deflect.</div>
                    <div class="player-stat-value season">Season: ${player.seasonStats.passDeflections}</div>
                </div>
            </div>
        `;
    }
    
    const playerImageUrl = player.playerId 
        ? `https://sleepercdn.com/content/nfl/players/${player.playerId}.jpg`
        : `https://sleepercdn.com/images/v2/icons/player_default.webp`;
    
    card.innerHTML = `
        <div class="player-header">
            <img src="${playerImageUrl}" 
                 alt="${player.name}" 
                 class="player-headshot-stats"
                 onerror="this.src='https://sleepercdn.com/images/v2/icons/player_default.webp'">
            <div class="player-header-info">
                <div class="player-name">${player.name}</div>
                <div class="player-number">#${player.number} ${player.position}</div>
            </div>
        </div>
        ${statsHTML}
    `;
    
    return card;
}

// Display NBA Players
function displayNBAPlayers(prediction) {
    const content = document.getElementById('playerStatsContent');
    content.innerHTML = '';
    
    // Team 1 Players
    const team1Section = document.createElement('div');
    team1Section.className = 'team-players-section';
    
    let team1Header = `<h4 class="team-players-header">${prediction.team1.name} - Top Players</h4>`;
    if (prediction.team1.injuredPlayers && prediction.team1.injuredPlayers.length > 0) {
        team1Header += `<div class="injury-notice">⚠️ Out: ${prediction.team1.injuredPlayers.join(', ')}</div>`;
    }
    team1Section.innerHTML = team1Header;
    
    const team1Grid = document.createElement('div');
    team1Grid.className = 'players-grid';
    
    prediction.team1.roster.topPlayers.forEach(player => {
        team1Grid.appendChild(createNBAPlayerCard(player));
    });
    
    team1Section.appendChild(team1Grid);
    content.appendChild(team1Section);
    
    // Team 2 Players
    const team2Section = document.createElement('div');
    team2Section.className = 'team-players-section';
    
    let team2Header = `<h4 class="team-players-header">${prediction.team2.name} - Top Players</h4>`;
    if (prediction.team2.injuredPlayers && prediction.team2.injuredPlayers.length > 0) {
        team2Header += `<div class="injury-notice">⚠️ Out: ${prediction.team2.injuredPlayers.join(', ')}</div>`;
    }
    team2Section.innerHTML = team2Header;
    
    const team2Grid = document.createElement('div');
    team2Grid.className = 'players-grid';
    
    prediction.team2.roster.topPlayers.forEach(player => {
        team2Grid.appendChild(createNBAPlayerCard(player));
    });
    
    team2Section.appendChild(team2Grid);
    content.appendChild(team2Section);
}

// Create NBA player card
function createNBAPlayerCard(player) {
    const card = document.createElement('div');
    card.className = 'player-card';
    
    // Check if we have projected stats
    const hasProjection = player.projected && player.projected.points !== undefined;
    
    card.innerHTML = `
        <div class="player-header">
            <div class="player-name">${player.name}</div>
            <div class="player-position">${player.position}</div>
        </div>
        <div class="player-stats-row">
            <div class="player-stat-item">
                <div class="player-stat-label">Points</div>
                ${hasProjection ? `
                    <div class="player-stat-value">${player.projected.points}</div>
                    <div class="player-stat-value season">Season: ${player.points.toFixed(1)}</div>
                ` : `
                    <div class="player-stat-value">${player.points.toFixed(1)}</div>
                `}
            </div>
            <div class="player-stat-item">
                <div class="player-stat-label">Rebounds</div>
                ${hasProjection ? `
                    <div class="player-stat-value">${player.projected.rebounds}</div>
                    <div class="player-stat-value season">Season: ${player.rebounds.toFixed(1)}</div>
                ` : `
                    <div class="player-stat-value">${player.rebounds.toFixed(1)}</div>
                `}
            </div>
            <div class="player-stat-item">
                <div class="player-stat-label">Assists</div>
                ${hasProjection ? `
                    <div class="player-stat-value">${player.projected.assists}</div>
                    <div class="player-stat-value season">Season: ${player.assists.toFixed(1)}</div>
                ` : `
                    <div class="player-stat-value">${player.assists.toFixed(1)}</div>
                `}
            </div>
            <div class="player-stat-item">
                <div class="player-stat-label">3-Pointers</div>
                ${hasProjection ? `
                    <div class="player-stat-value">${player.projected.threes}</div>
                    <div class="player-stat-value season">Season: ${player.fg3Made.toFixed(1)}</div>
                ` : `
                    <div class="player-stat-value">${player.fg3Made.toFixed(1)}</div>
                `}
            </div>
            <div class="player-stat-item">
                <div class="player-stat-label">Steals + Blocks</div>
                ${hasProjection ? `
                    <div class="player-stat-value">${(player.projected.steals + player.projected.blocks).toFixed(1)}</div>
                    <div class="player-stat-value season">Season: ${(player.steals + player.blocks).toFixed(1)}</div>
                ` : `
                    <div class="player-stat-value">${(player.steals + player.blocks).toFixed(1)}</div>
                `}
            </div>
            <div class="player-stat-item">
                <div class="player-stat-label">FG%</div>
                <div class="player-stat-value">${(player.fgPct * 100).toFixed(1)}%</div>
            </div>
        </div>
    `;
    
    return card;
}

// Same Game Parlay Functions
async function loadParlayGames() {
    try {
        const dateStr = getESTDateString(currentDate);
        const response = await fetch(getAPIPath(`games?date=${dateStr}`));
        const data = await response.json();
        const games = data.games || [];
        
        const select = document.getElementById('parlayGameSelect');
        select.innerHTML = '<option value="">-- Select a game --</option>';
        
        games.forEach(game => {
            const option = document.createElement('option');
            option.value = `${game.homeTeam.code}|${game.awayTeam.code}|${game.id}|${dateStr}|${currentSport}`;
            const gameDate = new Date(game.date).toLocaleString();
            option.textContent = `${game.awayTeam.code} @ ${game.homeTeam.code} (${gameDate})`;
            select.appendChild(option);
        });
        
        // Setup event listeners
        select.addEventListener('change', () => {
            const btn = document.getElementById('generateParlayBtn');
            btn.disabled = !select.value;
        });
        
        document.getElementById('generateParlayBtn').addEventListener('click', generateParlay);
        
    } catch (error) {
        console.error('Error loading parlay games:', error);
    }
}

async function generateParlay() {
    const select = document.getElementById('parlayGameSelect');
    const [homeTeam, awayTeam, gameId, gameDate, sport] = select.value.split('|');
    
    if (!homeTeam || !awayTeam) return;
    
    // Show loading
    document.getElementById('parlayLoading').style.display = 'block';
    document.getElementById('parlayResults').style.display = 'none';
    
    try {
        const endpoint = 'same-game-parlay';
        const response = await fetch(getAPIPath(`${endpoint}?homeTeam=${homeTeam}&awayTeam=${awayTeam}&gameId=${gameId}&gameDate=${gameDate}`));
        const data = await response.json();
        
        // Store sport for createPropCard
        data.sport = sport;
        
        // Display suggested parlays - show all three strategies
        const suggestedList = document.getElementById('suggestedParlayList');
        
        let strategiesHTML = '';
        if (data.parlayStrategies) {
            // Conservative Strategy
            if (data.parlayStrategies.conservative.picks.length > 0) {
                strategiesHTML += `
                    <div class="parlay-strategy">
                        <div class="strategy-header">
                            <h3>🛡️ ${data.parlayStrategies.conservative.name}</h3>
                        </div>
                        <p class="strategy-description">${data.parlayStrategies.conservative.description}</p>
                        <div class="strategy-picks">
                            ${data.parlayStrategies.conservative.picks.map(prop => createPropCard(prop, true, data.sport)).join('')}
                        </div>
                    </div>
                `;
            }
            
            // Balanced Strategy
            if (data.parlayStrategies.balanced.picks.length > 0) {
                strategiesHTML += `
                    <div class="parlay-strategy recommended">
                        <div class="strategy-header">
                            <h3>⚖️ ${data.parlayStrategies.balanced.name} <span class="recommended-badge">RECOMMENDED</span></h3>
                        </div>
                        <p class="strategy-description">${data.parlayStrategies.balanced.description}</p>
                        <div class="strategy-picks">
                            ${data.parlayStrategies.balanced.picks.map(prop => createPropCard(prop, true, data.sport)).join('')}
                        </div>
                    </div>
                `;
            }
            
            // Aggressive Strategy
            if (data.parlayStrategies.aggressive.picks.length > 0) {
                strategiesHTML += `
                    <div class="parlay-strategy">
                        <div class="strategy-header">
                            <h3>🔥 ${data.parlayStrategies.aggressive.name}</h3>
                        </div>
                        <p class="strategy-description">${data.parlayStrategies.aggressive.description}</p>
                        <div class="strategy-picks">
                            ${data.parlayStrategies.aggressive.picks.map(prop => createPropCard(prop, true, data.sport)).join('')}
                        </div>
                    </div>
                `;
            }
            
            // Risky Value Strategy
            if (data.parlayStrategies.risky && data.parlayStrategies.risky.picks.length > 0) {
                strategiesHTML += `
                    <div class="parlay-strategy risky">
                        <div class="strategy-header">
                            <h3>💎 ${data.parlayStrategies.risky.name} <span class="risky-badge">YOLO</span></h3>
                        </div>
                        <p class="strategy-description">${data.parlayStrategies.risky.description}</p>
                        <div class="strategy-picks">
                            ${data.parlayStrategies.risky.picks.map(prop => createPropCard(prop, true, data.sport)).join('')}
                        </div>
                    </div>
                `;
            }
        }
        
        suggestedList.innerHTML = strategiesHTML;
        
        // Display all props
        const allPropsList = document.getElementById('allPropsList');
        allPropsList.innerHTML = data.allProps.map(prop => createPropCard(prop, false, data.sport)).join('');
        
        // Show results
        document.getElementById('parlayLoading').style.display = 'none';
        document.getElementById('parlayResults').style.display = 'block';
        
    } catch (error) {
        console.error('Error generating parlay:', error);
        document.getElementById('parlayLoading').style.display = 'none';
        alert('Failed to generate parlay. Please try again.');
    }
}

function createPropCard(prop, isSuggested, sport = 'nfl') {
    const recClass = prop.recommendation === 'OVER' ? 'rec-over' : 
                     prop.recommendation === 'UNDER' ? 'rec-under' : 'rec-pass';
    
    // Generate player image URL based on sport
    let playerImageUrl;
    let fallbackImage;
    
    if (sport === 'nba') {
        // NBA players - use CDN with better fallback
        fallbackImage = 'https://cdn.nba.com/headshots/nba/latest/260x190/fallback.png';
        playerImageUrl = prop.playerId 
            ? `https://cdn.nba.com/headshots/nba/latest/1040x760/${prop.playerId}.png`
            : fallbackImage;
    } else {
        // NFL players - use Sleeper CDN
        playerImageUrl = prop.playerId 
            ? `https://sleepercdn.com/content/nfl/players/${prop.playerId}.jpg`
            : `https://sleepercdn.com/images/v2/icons/player_default.webp`;
        fallbackImage = 'https://sleepercdn.com/images/v2/icons/player_default.webp';
    }
    
    // Determine units based on prop type and sport
    let units = '';
    if (sport === 'nba') {
        // NBA stats typically don't use units
        units = '';
    } else {
        // NFL uses yards
        units = ' yards';
    }
    
    return `
        <div class="prop-card ${isSuggested ? 'suggested' : ''} ${recClass}">
            <div class="prop-header">
                <div class="prop-player">
                    <img src="${playerImageUrl}" 
                         alt="${prop.player}" 
                         class="player-headshot"
                         onerror="this.src='${fallbackImage}'">
                    <div class="player-info">
                        <span class="player-name">${prop.player}</span>
                        <span class="player-team">${prop.team}${prop.position ? ' ' + prop.position : ''}</span>
                    </div>
                </div>
                <span class="confidence-badge-small ${prop.confidence.toLowerCase()}">${prop.confidence}</span>
            </div>
            <div class="prop-details">
                <div class="prop-type">${prop.prop}</div>
                <div class="prop-line">
                    <span class="line-label">Projected:</span>
                    <span class="line-value">${typeof prop.line === 'number' ? prop.line.toFixed(1) : prop.line}${units}</span>
                </div>
                <div class="prop-picks">
                    <div class="prop-pick ${prop.recommendation === 'OVER' ? 'recommended' : ''}">
                        <span>OVER ${prop.over}</span>
                    </div>
                    <div class="prop-pick ${prop.recommendation === 'UNDER' ? 'recommended' : ''}">
                        <span>UNDER ${prop.under}</span>
                    </div>
                </div>
                ${prop.recommendation !== 'PASS' ? `
                    <div class="prop-recommendation">
                        <strong>Pick: ${prop.recommendation}</strong>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Auto-refresh games every 2 minutes
setInterval(() => {
    loadTodaysGames();
}, 120000);
