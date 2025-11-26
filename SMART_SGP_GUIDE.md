# 🎯 Smart NBA Same-Game Parlay (SGP) Builder

## What It Does

This system **learns from real bets** like your friend's Lakers vs Clippers parlay and **detects role player traps** that cause parlays to fail.

### The Problem It Solves

**Your friend's bet:** 11-leg parlay where **10 legs hit** but **Ivica Zubac 15+ Points FAILED** ❌

**Why it failed:** Zubac is a ROLE PLAYER (4th-5th scoring option) who averages 10.5 PPG. Asking him to score 15+ is a **43% increase** from his average = **TRAP**

## 🔍 How It Works

### 1. **Player Usage Tiers** (Key Innovation)

The system categorizes every player by their role:

- **PRIMARY** (20+ PPG) - Stars like LeBron, Luka, Harden
  - ✅ SAFE for OVER points props
  - These are your go-to scorers
  
- **SECONDARY** (15-20 PPG) - Austin Reaves, Norman Powell
  - ⚖️ MEDIUM RISK for points
  - Safe if line is close to their average
  
- **TERTIARY** (10-15 PPG) - Third options
  - ⚠️ RISKY for OVER points
  - Better for other props
  
- **ROLE PLAYER** (<10 PPG) - Ivica Zubac
  - ❌ **DANGEROUS** for OVER points props
  - **SAFE for REBOUNDS** (their specialty)

### 2. **"Stretch Line" Detection**

Automatically flags dangerous props:

```
⚠️ ROLE PLAYER TRAP: Ivica Zubac averages 10.5 PPG but line is 15+ (43% increase)
💡 Alternative: Consider Zubac REBOUNDS or a PRIMARY scorer instead
```

**What makes a "stretch line":**
- Role player asked to exceed average by 25%+
- Tertiary player asked to exceed average by 35%+

### 3. **Prop Type Safety Rankings**

For ROLE PLAYERS like Zubac:
- **REBOUNDS** ✅ SAFE (Zubac 10+ REB would've hit)
- **ASSISTS** ⚖️ MEDIUM (only for playmakers)
- **POINTS OVER** ❌ TRAP (what killed your parlay)

For PRIMARY SCORERS like LeBron:
- **ALL PROPS** ✅ SAFE (they're the focal point)

### 4. **Same-Game Correlations**

**HIGH SCORING GAME** (225+ total)
- Primary/Secondary scorers benefit
- Role players DON'T necessarily benefit
- System warns: "Avoid adding role players"

**STAR DOMINATION** (30+ point projection)
- When LeBron projects 35 pts, teammates may struggle
- System warns about pairing with teammates' OVER props

**FAST PACE** (100+ possessions)
- More assists for playmakers
- More rebounds available

## 🎯 Three Parlay Tiers

### 🛡️ CONSERVATIVE (4-6 legs)
- **Only PRIMARY/SECONDARY scorers**
- 65%+ confidence on each leg
- Safest for consistent hits
- Example: LeBron 20+, Luka 25+, Harden 5+ AST, Austin Reaves 15+

### ⚖️ BALANCED (6-8 legs)
- Mix of stars + safe role player props
- **Avoids role player OVER points traps**
- 60%+ confidence
- Example: Add Zubac 10+ REB instead of 15+ PTS

### 🎰 AGGRESSIVE (8-12 legs)
- Includes tertiary players
- Higher risk/reward
- 55%+ confidence
- Lottery ticket play

## 📊 API Usage

### Endpoint
```
GET /api/nba/smart-sgp?homeTeam=LAL&awayTeam=LAC
```

### Response Highlights

**Role Player Traps Detected:**
```json
{
  "rolePlayerTraps": [
    {
      "player": "Ivica Zubac",
      "team": "LAC",
      "propType": "Points",
      "line": 15,
      "seasonAvg": 10.5,
      "usageTier": "ROLE_PLAYER",
      "warning": "⚠️ ROLE PLAYER TRAP: averages 10.5 PPG but line is 15+ (43% increase)",
      "alternative": "Consider Ivica Zubac REBOUNDS or a PRIMARY scorer instead"
    }
  ]
}
```

**Safe Props (No Stretch Lines):**
```json
{
  "safeProps": [
    {
      "player": "LeBron James",
      "propType": "Points",
      "line": 23,
      "pick": "OVER",
      "projection": 25.3,
      "confidence": 78,
      "usageTier": "PRIMARY"
    },
    {
      "player": "Ivica Zubac",
      "propType": "Rebounds",
      "line": 9,
      "pick": "OVER",
      "projection": 10.2,
      "confidence": 72,
      "usageTier": "ROLE_PLAYER"  // SAFE because it's rebounds!
    }
  ]
}
```

## 🌐 Web Interface

**Access:** `http://localhost:3000/smart-sgp.html`

**Features:**
1. Select any NBA matchup
2. **Role Player Traps** section shows Zubac-style dangers
3. **Correlations** section explains game dynamics
4. **Three Parlay Recommendations** with confidence scores
5. Color-coded by usage tier:
   - 🟢 PRIMARY = Safe
   - 🔵 SECONDARY = Medium
   - 🟡 TERTIARY = Risky
   - ⚫ ROLE_PLAYER = Avoid OVER points

## 📝 Key Lessons from Your Friend's Bet

### ✅ What Worked (10 legs)
- **Luka 25+ Points** - PRIMARY scorer ✅
- **LeBron 20+ Points** - PRIMARY scorer ✅
- **Harden 20+ Points** - PRIMARY scorer ✅
- **Austin Reaves 15+ Points** - SECONDARY scorer ✅
- **James Harden 5+ Assists** - Elite playmaker ✅
- **Luka 5+ Assists** - Elite playmaker ✅
- **LeBron 5+ Assists** - Elite playmaker ✅
- **Zubac 10+ Rebounds** - Role player's specialty ✅
- **Luka 5+ Rebounds** - Star handles ball ✅
- **LeBron 5+ Rebounds** - Star handles ball ✅

### ❌ What Failed (1 leg)
- **Zubac 15+ Points** - ROLE PLAYER asked to exceed by 43% ❌
  - Should have been: Zubac 10+ Rebounds
  - Or: Another PRIMARY scorer's points

## 🎓 Training the System

The system is trained on:

1. **Usage Hierarchy** - Who actually scores
2. **Historical Averages** - Real 2024-25 NBA stats
3. **Stretch Line Math** - When lines are unrealistic
4. **Prop Type Safety** - What each tier is good at
5. **Game Correlations** - How props affect each other

## 🚀 Quick Start

1. **Start server:** `npm start`
2. **Open:** `http://localhost:3000/smart-sgp.html`
3. **Select matchup:** Choose home/away teams
4. **Review traps:** Check role player warnings
5. **Build parlay:** Use CONSERVATIVE or BALANCED recommendations

## 💡 Pro Tips

### ✅ DO:
- Use PRIMARY scorers for points props
- Use ROLE PLAYERS for their specialty (rebounds for Zubac)
- Mix prop types (points + assists + rebounds)
- Check usage tier before betting OVER points
- Trust the trap warnings

### ❌ DON'T:
- Bet role player OVER points (Zubac 15+)
- Ignore usage tier classifications
- Stretch lines by 25%+ for role players
- Add 6+ props from same team
- Ignore the "alternative" suggestions

## 📈 Expected Improvements

**Before (your friend's bet):**
- 11 legs, odds: +8,250
- Hit rate: 0% (lost on final leg)
- Issue: Role player trap

**After (using Smart SGP):**
- **CONSERVATIVE:** 6 legs, odds: +400, hit rate: ~35%
  - Removes Zubac 15+ PTS
  - Keeps only PRIMARY/SECONDARY scorers
  
- **BALANCED:** 8 legs, odds: +800, hit rate: ~25%
  - Replaces Zubac 15+ PTS with Zubac 10+ REB
  - Mix of stars + safe role props

## 🔮 Future Enhancements

- [ ] Historical bet tracking (win/loss by tier)
- [ ] Real-time injury impact
- [ ] Opponent defensive adjustments
- [ ] Live odds comparison
- [ ] Bet sizing recommendations
- [ ] Push notification for trap warnings

## 🎯 Summary

**The #1 Rule:** Never bet role player OVER points props when the line exceeds their average by 25%+.

**Zubac's Correct Props:**
- ✅ Zubac 10+ Rebounds (his specialty)
- ✅ Zubac 1+ Blocks (defensive stat)
- ❌ Zubac 15+ Points (43% increase = TRAP)

**Your New Strategy:**
1. Generate Smart SGP
2. Check role player traps section
3. Use CONSERVATIVE or BALANCED parlay
4. Replace any flagged props with alternatives
5. Verify all PRIMARY/SECONDARY scorers for points

---

Built to learn from real bets and prevent Zubac-style losses 🎯
