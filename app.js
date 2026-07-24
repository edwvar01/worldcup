// FIFA World Cup 2026 - Hub & Simulator Logic
let IS_ADMIN = false;

if (window.location.pathname.toLowerCase().includes('admin.html')) {
    if (sessionStorage.getItem('fifa2026_admin_auth') === 'true') {
        IS_ADMIN = true;
    } else {
        document.addEventListener("DOMContentLoaded", () => {
            const overlay = document.getElementById("admin-login-overlay");
            if (overlay) {
                overlay.style.display = "flex";
                overlay.classList.add("active");
            }
        });
    }
}

// --- FIREBASE CONFIGURATION ---
// PASTE YOUR FIREBASE CONFIG OBJECT HERE:
const firebaseConfig = {
  apiKey: "AIzaSyA73IUyC2Smxfilw_iQrf39k0mkPKbqMJw",
  authDomain: "worldcup2026-de200.firebaseapp.com",
  databaseURL: "https://worldcup2026-de200-default-rtdb.firebaseio.com",
  projectId: "worldcup2026-de200",
  storageBucket: "worldcup2026-de200.firebasestorage.app",
  messagingSenderId: "961839917905",
  appId: "1:961839917905:web:674332bacf9ffeec2c8170"
};

let dbRef = null;
if (firebaseConfig.apiKey) {
    firebase.initializeApp(firebaseConfig);
    dbRef = firebase.database().ref('worldcup-state');
    
    // Auto-seed admin credentials if they don't exist
    firebase.database().ref('admin-credentials').once('value').then(snap => {
        if (!snap.exists()) {
            firebase.database().ref('admin-credentials').set({
                username: "cekiedcfootball",
                password: "password123"
            });
            console.log("Admin credentials seeded in database.");
        }
    });
}
// ------------------------------

// Admin Authentication Handler
function attemptAdminLogin() {
    const user = document.getElementById("admin-user").value;
    const pass = document.getElementById("admin-pass").value;
    const errorEl = document.getElementById("admin-login-error");
    
    if (!user || !pass) {
        errorEl.innerText = "Please enter both username and password.";
        errorEl.style.display = "block";
        return;
    }

    if (!dbRef) {
        // Fallback for local testing without Firebase
        if (user === "cekiedcfootball" && pass === "admin") {
            sessionStorage.setItem('fifa2026_admin_auth', 'true');
            location.reload();
        } else {
            errorEl.innerText = "Invalid username or password.";
            errorEl.style.display = "block";
        }
        return;
    }

    // Query Firebase for admin-credentials
    firebase.database().ref('admin-credentials').once('value').then(snapshot => {
        if (!snapshot.exists()) {
            errorEl.innerText = "No credentials configured in database.";
            errorEl.style.display = "block";
            return;
        }
        const creds = snapshot.val();
        if (creds.username === user && creds.password === pass) {
            sessionStorage.setItem('fifa2026_admin_auth', 'true');
            location.reload();
        } else {
            errorEl.innerText = "Invalid username or password.";
            errorEl.style.display = "block";
        }
    }).catch(err => {
        console.error("Login Error: ", err);
        errorEl.innerText = "Error connecting to database.";
        errorEl.style.display = "block";
    });
}

// 1. Qualified Teams Dataset (45 Teams)
const TEAMS = {
    // Group A
    "BRA": { id: "BRA", name: "Brazil", flag: "br", conf: "CONMEBOL", rank: 5, star: "Vinícius Júnior", coach: "Dorival Júnior", group: "A" },
    "DEN": { id: "DEN", name: "Denmark", flag: "dk", conf: "UEFA", rank: 21, star: "Christian Eriksen", coach: "Kasper Hjulmand", group: "A" },
    "CIV": { id: "CIV", name: "Ivory Coast", flag: "ci", conf: "CAF", rank: 38, star: "Franck Kessié", coach: "Emerse Faé", group: "A" },
    "CHN": { id: "CHN", name: "China", flag: "cn", conf: "AFC", rank: 88, star: "Wu Lei", coach: "Aleksandar Janković", group: "A" },
    "POL": { id: "POL", name: "Poland", flag: "pl", conf: "UEFA", rank: 31, star: "Robert Lewandowski", coach: "Michał Probierz", group: "A" },
    
    // Group B
    "FRA": { id: "FRA", name: "France", flag: "fr", conf: "UEFA", rank: 2, star: "Kylian Mbappé", coach: "Didier Deschamps", group: "B" },
    "SUI": { id: "SUI", name: "Switzerland", flag: "ch", conf: "UEFA", rank: 19, star: "Granit Xhaka", coach: "Murat Yakin", group: "B" },
    "QAT": { id: "QAT", name: "Qatar", flag: "qa", conf: "AFC", rank: 34, star: "Akram Afif", coach: "Tintín Márquez", group: "B" },
    "COD": { id: "COD", name: "DR Congo", flag: "cd", conf: "CAF", rank: 60, star: "Chancel Mbemba", coach: "Sébastien Desabre", group: "B" },
    "AUS": { id: "AUS", name: "Australia", flag: "au", conf: "AFC", rank: 24, star: "Jackson Irvine", coach: "Tony Popovic", group: "B" },
    
    // Group C
    "ARG": { id: "ARG", name: "Argentina", flag: "ar", conf: "CONMEBOL", rank: 1, star: "Lionel Messi", coach: "Lionel Scaloni", group: "C" },
    "CRO": { id: "CRO", name: "Croatia", flag: "hr", conf: "UEFA", rank: 12, star: "Luka Modrić", coach: "Zlatko Dalić", group: "C" },
    "USA": { id: "USA", name: "USA", flag: "us", conf: "CONCACAF", rank: 11, star: "Christian Pulisic", coach: "Mauricio Pochettino", group: "C" },
    "CPV": { id: "CPV", name: "Cabo Verde", flag: "cv", conf: "CAF", rank: 65, star: "Ryan Mendes", coach: "Bubista", group: "C" },
    "CAN": { id: "CAN", name: "Canada", flag: "ca", conf: "CONCACAF", rank: 49, star: "Alphonso Davies", coach: "Jesse Marsch", group: "C" },
    
    // Group D
    "POR": { id: "POR", name: "Portugal", flag: "pt", conf: "UEFA", rank: 8, star: "Cristiano Ronaldo", coach: "Roberto Martínez", group: "D" },
    "NED": { id: "NED", name: "Netherlands", flag: "nl", conf: "UEFA", rank: 7, star: "Virgil van Dijk", coach: "Ronald Koeman", group: "D" },
    "MEX": { id: "MEX", name: "Mexico", flag: "mx", conf: "CONCACAF", rank: 15, star: "Santiago Giménez", coach: "Javier Aguirre", group: "D" },
    "NGA": { id: "NGA", name: "Nigeria", flag: "ng", conf: "CAF", rank: 30, star: "Victor Osimhen", coach: "José Peseiro", group: "D" },
    "SCO": { id: "SCO", name: "Scotland", flag: "gb-sct", conf: "UEFA", rank: 39, star: "Scott McTominay", coach: "Steve Clarke", group: "D" },
    
    // Group E
    "BEL": { id: "BEL", name: "Belgium", flag: "be", conf: "UEFA", rank: 6, star: "Kevin De Bruyne", coach: "Domenico Tedesco", group: "E" },
    "ITA": { id: "ITA", name: "Italy", flag: "it", conf: "UEFA", rank: 9, star: "Federico Chiesa", coach: "Luciano Spalletti", group: "E" },
    "MAR": { id: "MAR", name: "Morocco", flag: "ma", conf: "CAF", rank: 13, star: "Achraf Hakimi", coach: "Walid Regragui", group: "E" },
    "SEN": { id: "SEN", name: "Senegal", flag: "sn", conf: "CAF", rank: 21, star: "Sadio Mané", coach: "Pape Thiaw", group: "E" },
    "RSA": { id: "RSA", name: "South Africa", flag: "za", conf: "CAF", rank: 59, star: "Percy Tau", coach: "Hugo Broos", group: "E" },
    
    // Group F
    "ENG": { id: "ENG", name: "England", flag: "gb-eng", conf: "UEFA", rank: 4, star: "Jude Bellingham", coach: "Thomas Tuchel", group: "F" },
    "URU": { id: "URU", name: "Uruguay", flag: "uy", conf: "CONMEBOL", rank: 14, star: "Federico Valverde", coach: "Marcelo Bielsa", group: "F" },
    "KOR": { id: "KOR", name: "South Korea", flag: "kr", conf: "AFC", rank: 23, star: "Son Heung-min", coach: "Hong Myung-bo", group: "F" },
    "SWE": { id: "SWE", name: "Sweden", flag: "se", conf: "UEFA", rank: 28, star: "Viktor Gyökeres", coach: "Jon Dahl Tomasson", group: "F" },
    "PAN": { id: "PAN", name: "Panama", flag: "pa", conf: "CONCACAF", rank: 35, star: "Adalberto Carrasquilla", coach: "Thomas Christiansen", group: "F" },
    
    // Group G
    "ESP": { id: "ESP", name: "Spain", flag: "es", conf: "UEFA", rank: 3, star: "Lamine Yamal", coach: "Luis de la Fuente", group: "G" },
    "COL": { id: "COL", name: "Colombia", flag: "co", conf: "CONMEBOL", rank: 9, star: "Luis Díaz", coach: "Néstor Lorenzo", group: "G" },
    "EGY": { id: "EGY", name: "Egypt", flag: "eg", conf: "CAF", rank: 30, star: "Mohamed Salah", coach: "Hossam Hassan", group: "G" },
    "RUS": { id: "RUS", name: "Russia", flag: "ru", conf: "UEFA", rank: 38, star: "Aleksandr Golovin", coach: "Valery Karpin", group: "G" },
    "WAL": { id: "WAL", name: "Wales", flag: "gb-wls", conf: "UEFA", rank: 29, star: "Brennan Johnson", coach: "Rob Page", group: "G" },
    
    // Group H
    "GER": { id: "GER", name: "Germany", flag: "de", conf: "UEFA", rank: 16, star: "Florian Wirtz", coach: "Julian Nagelsmann", group: "H" },
    "ECU": { id: "ECU", name: "Ecuador", flag: "ec", conf: "CONMEBOL", rank: 31, star: "Piero Hincapié", coach: "Sebastián Beccacece", group: "H" },
    "JPN": { id: "JPN", name: "Japan", flag: "jp", conf: "AFC", rank: 18, star: "Kaoru Mitoma", coach: "Hajime Moriyasu", group: "H" },
    "KSA": { id: "KSA", name: "Saudi Arabia", flag: "sa", conf: "AFC", rank: 53, star: "Salem Al-Dawsari", coach: "Roberto Mancini", group: "H" },
    "PAR": { id: "PAR", name: "Paraguay", flag: "py", conf: "CONMEBOL", rank: 56, star: "Miguel Almirón", coach: "Gustavo Alfaro", group: "H" },
    
    // Group I
    "NOR": { id: "NOR", name: "Norway", flag: "no", conf: "UEFA", rank: 47, star: "Erling Haaland", coach: "Ståle Solbakken", group: "I" },
    "IND": { id: "IND", name: "India", flag: "in", conf: "AFC", rank: 117, star: "Sunil Chhetri", coach: "Igor Štimac", group: "I" },
    "SMR": { id: "SMR", name: "San Marino", flag: "sm", conf: "UEFA", rank: 210, star: "Matteo Vitaioli", coach: "Roberto Cevoli", group: "I" },
    "AUT": { id: "AUT", name: "Austria", flag: "at", conf: "UEFA", rank: 22, star: "Marcel Sabitzer", coach: "Ralf Rangnick", group: "I" },
    "TUR": { id: "TUR", name: "Turkey", flag: "tr", conf: "UEFA", rank: 26, star: "Hakan Çalhanoğlu", coach: "Vincenzo Montella", group: "I" }
};

// 16 Official Stadiums & Cities
const STADIUMS = [
    { name: "Estadio Azteca", city: "Mexico City", country: "MEX", cap: 87523 },
    { name: "MetLife Stadium", city: "New York/New Jersey", country: "USA", cap: 82500 },
    { name: "AT&T Stadium", city: "Dallas", country: "USA", cap: 80000 },
    { name: "Mercedes-Benz Stadium", city: "Atlanta", country: "USA", cap: 71000 },
    { name: "SoFi Stadium", city: "Los Angeles", country: "USA", cap: 70240 },
    { name: "BC Place", city: "Vancouver", country: "CAN", cap: 54500 },
    { name: "BMO Field", city: "Toronto", country: "CAN", cap: 45000 },
    { name: "Estadio BBVA", city: "Monterrey", country: "MEX", cap: 53500 },
    { name: "Estadio Akron", city: "Guadalajara", country: "MEX", cap: 48070 },
    { name: "Hard Rock Stadium", city: "Miami", country: "USA", cap: 64767 },
    { name: "Gillette Stadium", city: "Boston", country: "USA", cap: 65878 },
    { name: "Arrowhead Stadium", city: "Kansas City", country: "USA", cap: 76416 },
    { name: "NRG Stadium", city: "Houston", country: "USA", cap: 72220 },
    { name: "Lincoln Financial Field", city: "Philadelphia", country: "USA", cap: 69796 },
    { name: "Levi's Stadium", city: "San Francisco", country: "USA", cap: 68500 },
    { name: "Lumen Field", city: "Seattle", country: "USA", cap: 69000 }
];

// App State
let appState = {
    fixtures: [],
    standings: {},
    best3rd: [],
    bracket: {
        r32: Array(16).fill(null).map(() => ({ home: null, away: null, homeScore: null, awayScore: null, winner: null })),
        r16: Array(8).fill(null).map(() => ({ home: null, away: null, homeScore: null, awayScore: null, winner: null })),
        qf: Array(4).fill(null).map(() => ({ home: null, away: null, homeScore: null, awayScore: null, winner: null })),
        sf: Array(2).fill(null).map(() => ({ home: null, away: null, homeScore: null, awayScore: null, winner: null })),
        final: { home: null, away: null, homeScore: null, awayScore: null, winner: null }
    },
    standingsOverrides: {},
    bracketOverrides: { r32: {}, r16: {}, qf: {}, sf: {}, final: {} },
    hostFilterOnly: false,
    gallery: []
};

// 2. Generate Group Fixtures (90 matches total)
function initFixtures() {
    appState.fixtures = [];
    const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
    const rounds = [
        [[0, 1], [2, 3]], // Matchday 1
        [[0, 2], [4, 1]], // Matchday 2
        [[0, 3], [2, 4]], // Matchday 3
        [[0, 4], [3, 1]], // Matchday 4
        [[1, 2], [3, 4]]  // Matchday 5
    ];
    let matchId = 1;
    let dateObj = new Date("2026-06-12T00:00:00");
    
    rounds.forEach((roundPairings, roundIdx) => {
        groups.forEach(g => {
            const groupTeams = Object.values(TEAMS).filter(t => t.group === g);
            roundPairings.forEach(pair => {
                if (groupTeams.length < 5) return;
                const homeTeam = groupTeams[pair[0]];
                const awayTeam = groupTeams[pair[1]];
                
                // Generate sequence of dates from Jun 12 to Jun 27
                // 90 matches over 15 days = 6 matches per day
                const dayOffset = Math.floor((matchId - 1) / 6);
                const matchDate = new Date(dateObj.getTime() + (dayOffset * 86400000));
                const dateStr = matchDate.toISOString().split('T')[0];
                
                const timeStr = ["12:00", "15:00", "18:00", "21:00", "14:00", "19:00"][matchId % 6];
                const stadium = STADIUMS[matchId % STADIUMS.length];
                
                appState.fixtures.push({
                    id: matchId,
                    group: g,
                    round: roundIdx + 1,
                    home: homeTeam.id,
                    away: awayTeam.id,
                    homeScore: null,
                    awayScore: null,
                    date: dateStr,
                    time: timeStr,
                    timeIST: "", // dynamically generated in UI based on UTC offset now
                    venue: stadium.name + ", " + stadium.city,
                    approved: false
                });
                matchId++;
            });
        });
    });
}

// 3. Initialize Standings structure
function initStandings() {
    const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
    groups.forEach(g => {
        const groupTeams = Object.values(TEAMS).filter(t => t.group === g);
        appState.standings[g] = groupTeams.map(t => ({
            id: t.id,
            name: t.name,
            flag: t.flag,
            mp: 0, w: 0, d: 0, l: 0,
            gf: 0, ga: 0, gd: 0,
            pts: 0
        }));
    });
}

// 4. Standings calculations engine
function calculateStandings() {
    // Reset all
    initStandings();

    // Loop through matches
    appState.fixtures.forEach(m => {
        if (m.homeScore != null && m.awayScore != null && m.approved) {
            const hs = parseInt(m.homeScore);
            const as = parseInt(m.awayScore);
            const group = m.group;
            
            const homeStanding = appState.standings[group].find(t => t.id === m.home);
            const awayStanding = appState.standings[group].find(t => t.id === m.away);

            if (homeStanding && awayStanding) {
                homeStanding.mp += 1;
                awayStanding.mp += 1;
                homeStanding.gf += hs;
                homeStanding.ga += as;
                awayStanding.gf += as;
                awayStanding.ga += hs;

                if (hs > as) {
                    homeStanding.w += 1;
                    homeStanding.pts += 3;
                    awayStanding.l += 1;
                } else if (hs < as) {
                    awayStanding.w += 1;
                    awayStanding.pts += 3;
                    homeStanding.l += 1;
                } else {
                    homeStanding.d += 1;
                    homeStanding.pts += 1;
                    awayStanding.d += 1;
                    awayStanding.pts += 1;
                }

                homeStanding.gd = homeStanding.gf - homeStanding.ga;
                awayStanding.gd = awayStanding.gf - awayStanding.ga;
            }
        }
    });

    // Apply Manual Overrides
    if (appState.standingsOverrides) {
        Object.keys(appState.standings).forEach(g => {
            appState.standings[g].forEach(t => {
                if (appState.standingsOverrides[t.id]) {
                    Object.assign(t, appState.standingsOverrides[t.id]);
                }
            });
        });
    }

    // Sort groups
    const groups = Object.keys(appState.standings);
    groups.forEach(g => {
        appState.standings[g].sort((a, b) => {
            if (b.pts !== a.pts) return b.pts - a.pts;
            if (b.gd !== a.gd) return b.gd - a.gd;
            if (b.gf !== a.gf) return b.gf - a.gf;
            // Fallback: FIFA Rank (lower number is higher/better)
            const teamA = TEAMS[a.id];
            const teamB = TEAMS[b.id];
            return teamA.rank - teamB.rank;
        });
    });

    // Calculate Best 3rd place teams
    // calculateBest3rdPlaces(); removed

    // Auto-seed Knockout Round of 32
    seedRoundOf32();
}

// Ranks 4th-placed teams (we need 5) and seeds Round of 32
function seedRoundOf32() {
    // Check if all group stage matches have been played AND approved
    const playedMatches = appState.fixtures.filter(m => m.homeScore !== null && m.awayScore !== null && m.approved).length;
    if (playedMatches < 90) {
        appState.bracket.r32.forEach(m => {
            m.home = null;
            m.away = null;
            m.winner = null;
            m.homeScore = null;
            m.awayScore = null;
        });
        syncBracketProgression();
        return;
    }

    const standings = appState.standings;
    const fourthPlaced = [];
    const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
    
    groups.forEach(g => {
        if (standings[g] && standings[g][3]) {
            fourthPlaced.push({ ...standings[g][3], group: g });
        }
    });

    fourthPlaced.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        if (b.gf !== a.gf) return b.gf - a.gf;
        const teamA = TEAMS[a.id];
        const teamB = TEAMS[b.id];
        return (teamA ? teamA.rank : 999) - (teamB ? teamB.rank : 999);
    });

    const best4ths = fourthPlaced.slice(0, 5);

    const t1 = [], t2 = [], t3 = [];
    groups.forEach(g => {
        if (standings[g]) {
            if (standings[g][0]) t1.push(standings[g][0].id);
            if (standings[g][1]) t2.push(standings[g][1].id);
            if (standings[g][2]) t3.push(standings[g][2].id);
        }
    });
    
    const b4 = best4ths.map(t => t.id);

    const allAdvancing = [...t1, ...t2, ...t3, ...b4];
    
    const matchesMap = [];
    for (let i = 0; i < 16; i++) {
        matchesMap.push({ 
            home: allAdvancing[i] || null, 
            away: allAdvancing[31 - i] || null 
        });
    }

    matchesMap.forEach((m, idx) => {
        const currentMatch = appState.bracket.r32[idx];
        if (currentMatch.home !== m.home || currentMatch.away !== m.away) {
            currentMatch.home = m.home;
            currentMatch.away = m.away;
            currentMatch.winner = null; 
            currentMatch.homeScore = null;
            currentMatch.awayScore = null;
        }
    });

    syncBracketProgression();
}

// Keep the progression stages synced up beautifully!
function syncBracketProgression() {
    const bracket = appState.bracket;

    // R32 -> R16
    for (let i = 0; i < 8; i++) {
        const m1 = bracket.r32[i * 2];
        const m2 = bracket.r32[i * 2 + 1];
        const nextMatch = bracket.r16[i];
        if (nextMatch.home !== m1.winner || nextMatch.away !== m2.winner) {
            nextMatch.home = m1.winner;
            nextMatch.away = m2.winner;
            nextMatch.winner = null;
            nextMatch.homeScore = null;
            nextMatch.awayScore = null;
        }
    }

    // R16 -> Quarterfinals
    for (let i = 0; i < 4; i++) {
        const m1 = bracket.r16[i * 2];
        const m2 = bracket.r16[i * 2 + 1];
        const nextMatch = bracket.qf[i];
        if (nextMatch.home !== m1.winner || nextMatch.away !== m2.winner) {
            nextMatch.home = m1.winner;
            nextMatch.away = m2.winner;
            nextMatch.winner = null;
            nextMatch.homeScore = null;
            nextMatch.awayScore = null;
        }
    }

    // Quarterfinals -> Semifinals
    for (let i = 0; i < 2; i++) {
        const m1 = bracket.qf[i * 2];
        const m2 = bracket.qf[i * 2 + 1];
        const nextMatch = bracket.sf[i];
        if (nextMatch.home !== m1.winner || nextMatch.away !== m2.winner) {
            nextMatch.home = m1.winner;
            nextMatch.away = m2.winner;
            nextMatch.winner = null;
            nextMatch.homeScore = null;
            nextMatch.awayScore = null;
        }
    }

    // Semifinals -> Final
    const sf1 = bracket.sf[0];
    const sf2 = bracket.sf[1];
    const final = bracket.final;
    if (final.home !== sf1.winner || final.away !== sf2.winner) {
        final.home = sf1.winner;
        final.away = sf2.winner;
        final.winner = null;
        final.homeScore = null;
        final.awayScore = null;
    }
}

// 6. Real-time Knockout Score Handler
function updateKnockoutScore(round, matchIdx, side, value) {
    let match = round === 'final' ? appState.bracket.final : appState.bracket[round][matchIdx];
    
    const currentHome = appState.bracketOverrides?.[round]?.[matchIdx]?.home || match.home;
    const currentAway = appState.bracketOverrides?.[round]?.[matchIdx]?.away || match.away;
    
    if (value === "") {
        if (side === "home") match.homeScore = null;
        else match.awayScore = null;
    } else {
        const score = Math.max(0, parseInt(value));
        if (side === "home") match.homeScore = score;
        else match.awayScore = score;
    }
    
    if (match.homeScore != null && match.awayScore != null) {
        if (match.homeScore > match.awayScore) match.winner = currentHome;
        else if (match.awayScore > match.homeScore) match.winner = currentAway;
        else match.winner = null;
        
        if (round === 'final' && match.winner) triggerCelebration(match.winner);
    } else {
        match.winner = null;
        if (round === 'final') document.getElementById("champion-display").style.display = "none";
    }

    syncBracketProgression();
    saveToLocalStorage();
}

function updateKnockoutTeam(round, matchIdx, side, teamId) {
    if (!appState.bracketOverrides) appState.bracketOverrides = { r32: {}, r16: {}, qf: {}, sf: {}, final: {} };
    if (!appState.bracketOverrides[round]) appState.bracketOverrides[round] = {};
    if (!appState.bracketOverrides[round][matchIdx]) appState.bracketOverrides[round][matchIdx] = {};
    
    if (teamId === "") {
        appState.bracketOverrides[round][matchIdx][side] = null;
    } else {
        appState.bracketOverrides[round][matchIdx][side] = teamId;
    }
    
    // Re-evaluate winner based on the new team
    let match = round === 'final' ? appState.bracket.final : appState.bracket[round][matchIdx];
    const currentHome = appState.bracketOverrides?.[round]?.[matchIdx]?.home || match.home;
    const currentAway = appState.bracketOverrides?.[round]?.[matchIdx]?.away || match.away;
    
    if (match.homeScore != null && match.awayScore != null) {
        if (match.homeScore > match.awayScore) match.winner = currentHome;
        else if (match.awayScore > match.homeScore) match.winner = currentAway;
        else match.winner = null;
    } else {
        match.winner = null;
    }
    
    syncBracketProgression();
    saveToLocalStorage();
    renderBracket();
}

// Smart Soccer Match Simulator (Poisson/Custom realistic distribution)
// average goals is 1.5, slightly skewed based on FIFA Rank differential
function generateRealisticScore(teamARank, teamBRank) {
    // Rank differential
    const diff = teamBRank - teamARank; // positive means A is stronger (lower rank number)
    
    // Average base lambdas (expected goals)
    let lambdaA = 1.35 + (diff * 0.006);
    let lambdaB = 1.35 - (diff * 0.006);
    
    // Limits
    lambdaA = Math.max(0.4, Math.min(3.2, lambdaA));
    lambdaB = Math.max(0.4, Math.min(3.2, lambdaB));

    // Simple Poisson approximation
    const getPoisson = (lambda) => {
        let L = Math.exp(-lambda);
        let k = 0;
        let p = 1.0;
        do {
            k++;
            p *= Math.random();
        } while (p > L);
        return k - 1;
    };

    let scoreA = getPoisson(lambdaA);
    let scoreB = getPoisson(lambdaB);

    // Limit extreme outliers
    scoreA = Math.min(scoreA, 7);
    scoreB = Math.min(scoreB, 7);

    return { home: scoreA, away: scoreB };
}

// Simulate Single Group
function simulateGroup(groupLetter) {
    const groupMatches = appState.fixtures.filter(m => m.group === groupLetter);
    groupMatches.forEach(m => {
        const teamA = TEAMS[m.home];
        const teamB = TEAMS[m.away];
        
        const score = generateRealisticScore(teamA.rank, teamB.rank);
        m.homeScore = score.home;
        m.awayScore = score.away;
    });

    calculateStandings();
    saveToLocalStorage();
    renderAll();
}

// Simulate All Groups Stage
function simulateAllGroups() {
    appState.fixtures.forEach(m => {
        const teamA = TEAMS[m.home];
        const teamB = TEAMS[m.away];
        
        const score = generateRealisticScore(teamA.rank, teamB.rank);
        m.homeScore = score.home;
        m.awayScore = score.away;
    });

    calculateStandings();
    saveToLocalStorage();
    renderAll();
}

// Reset predictions
function resetAllPredictions() {
    appState.fixtures.forEach(m => {
        m.homeScore = null;
        m.awayScore = null;
        m.approved = false;
    });

    // Reset bracket fully
    appState.bracket = {
        r32: Array(16).fill(null).map(() => ({ home: null, away: null, winner: null })),
        r16: Array(8).fill(null).map(() => ({ home: null, away: null, winner: null })),
        qf: Array(4).fill(null).map(() => ({ home: null, away: null, winner: null })),
        sf: Array(2).fill(null).map(() => ({ home: null, away: null, winner: null })),
        final: { home: null, away: null, winner: null }
    };

    calculateStandings();
    saveToLocalStorage();
    renderAll();
    
    // Hide champion display
    document.getElementById("champion-display").style.display = "none";
}

// Storage Management (Firebase or Local fallback)
function saveToLocalStorage() {
    const data = {
        version: 7,
        fixtures: appState.fixtures,
        bracket: appState.bracket,
        standingsOverrides: appState.standingsOverrides,
        bracketOverrides: appState.bracketOverrides
    };
    if (dbRef) {
        dbRef.set(data);
    } else {
        localStorage.setItem("fifa2026_simulator_state_v7", JSON.stringify(data));
    }
}

function loadFromLocalStorage() {
    if (!dbRef) {
        const saved = localStorage.getItem("fifa2026_simulator_state_v7");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.fixtures && parsed.bracket) {
                    appState.fixtures = parsed.fixtures;
                    appState.bracket = parsed.bracket;
                    if (parsed.standingsOverrides) appState.standingsOverrides = parsed.standingsOverrides;
                    if (parsed.bracketOverrides) appState.bracketOverrides = parsed.bracketOverrides;
                }
            } catch (e) {}
        }
    }
}

// 7. Render UI Functions
function renderAll() {
    renderCountdown();
    renderGroups();
    renderFixtures();
    renderTeams();
    renderBracket();
}

// Countdown timer renderer
function renderCountdown() {
    // June 11, 2026 15:00:00 (Local/Opening ceremony)
    const openingDate = new Date("2026-06-12T00:30:00+05:30").getTime();
    
    const updateCountdown = () => {
        const now = new Date().getTime();
        const diff = openingDate - now;
        
        const daysEl = document.getElementById("cd-days");
        const hoursEl = document.getElementById("cd-hours");
        const minsEl = document.getElementById("cd-mins");
        const secsEl = document.getElementById("cd-secs");

        if (!daysEl) return;

        if (diff <= 0) {
            document.getElementById("countdown-box").innerHTML = `
                <div class="hero-badge" style="background: var(--primary);">Tournament Live!</div>
            `;
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        daysEl.innerText = String(days).padStart(2, '0');
        hoursEl.innerText = String(hours).padStart(2, '0');
        minsEl.innerText = String(mins).padStart(2, '0');
        secsEl.innerText = String(secs).padStart(2, '0');
    };

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Groups tab renderer
function renderGroups() {
    const container = document.getElementById("groups-grid-container");
    if (!container) return;

    container.innerHTML = "";
    const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];

    groups.forEach(g => {
        const groupCard = document.createElement("div");
        groupCard.className = "glass-card group-card";
        
        const gStandings = appState.standings[g];

        let rowsHtml = "";
        gStandings.forEach((t, idx) => {
            const isTop3 = idx < 3;
            const is4th = idx === 3;
            const rowClass = isTop3 ? "advancing-top2" : is4th ? "advancing-3rd" : "";
            
            if (IS_ADMIN) {
                rowsHtml += `
                    <tr class="${rowClass}">
                        <td class="td-num" style="color: var(--text-muted); font-weight: bold;">${idx + 1}</td>
                        <td class="td-team">
                            <img src="https://flagcdn.com/w40/${t.flag}.png" alt="${t.name}" class="flag-icon" onerror="this.src='https://flagcdn.com/w40/gb.png'">
                            <span>${t.name}</span>
                        </td>
                        <td class="td-num"><input type="number" class="score-input" style="width: 40px; padding: 2px; text-align: center; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: white;" value="${t.mp}" onchange="updateStandingsOverride('${t.id}', 'mp', this.value)"></td>
                        <td class="td-num" style="font-weight: bold;"><input type="number" class="score-input" style="width: 40px; padding: 2px; text-align: center; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: white;" value="${t.pts}" onchange="updateStandingsOverride('${t.id}', 'pts', this.value)"></td>
                        <td class="td-num"><input type="number" class="score-input" style="width: 40px; padding: 2px; text-align: center; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: white;" value="${t.w}" onchange="updateStandingsOverride('${t.id}', 'w', this.value)"></td>
                        <td class="td-num"><input type="number" class="score-input" style="width: 40px; padding: 2px; text-align: center; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: white;" value="${t.d}" onchange="updateStandingsOverride('${t.id}', 'd', this.value)"></td>
                        <td class="td-num"><input type="number" class="score-input" style="width: 40px; padding: 2px; text-align: center; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: white;" value="${t.l}" onchange="updateStandingsOverride('${t.id}', 'l', this.value)"></td>
                        <td class="td-num"><input type="number" class="score-input" style="width: 40px; padding: 2px; text-align: center; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: white;" value="${t.gd}" onchange="updateStandingsOverride('${t.id}', 'gd', this.value)"></td>
                    </tr>
                `;
            } else {
                rowsHtml += `
                    <tr class="${rowClass}">
                        <td class="td-num" style="color: var(--text-muted); font-weight: bold;">${idx + 1}</td>
                        <td class="td-team">
                            <img src="https://flagcdn.com/w40/${t.flag}.png" alt="${t.name}" class="flag-icon" onerror="this.src='https://flagcdn.com/w40/gb.png'">
                            <span>${t.name}</span>
                        </td>
                        <td class="td-num">${t.mp}</td>
                        <td class="td-num" style="font-weight: bold;">${t.pts}</td>
                        <td class="td-num">${t.w}</td>
                        <td class="td-num">${t.d}</td>
                        <td class="td-num">${t.l}</td>
                        <td class="td-num">${t.gd >= 0 ? '+' + t.gd : t.gd}</td>
                    </tr>
                `;
            }
        });

        groupCard.innerHTML = `
            <div class="group-card-header">
                <span class="group-name">Group ${g}</span>
            </div>
            <table class="standings-table">
                <thead>
                    <tr>
                        <th class="th-num">#</th>
                        <th>Team</th>
                        <th class="th-num">MP</th>
                        <th class="th-num">PTS</th>
                        <th class="th-num">W</th>
                        <th class="th-num">D</th>
                        <th class="th-num">L</th>
                        <th class="th-num">GD</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        `;

        container.appendChild(groupCard);
    });
}

// Matches & Fixtures renderer
function renderFixtures() {
    const listContainer = document.getElementById("fixtures-list-container");
    if (!listContainer) return;

    // Get current filters
    const searchVal = document.getElementById("filter-search").value.toLowerCase();
    const stageVal = document.getElementById("filter-stage").value;
    const venueVal = document.getElementById("filter-venue").value;
    const groupVal = document.getElementById("filter-group").value;

    listContainer.innerHTML = "";
    
    // Filter matches
    const filteredMatches = appState.fixtures.filter(m => {
        const teamA = TEAMS[m.home];
        const teamB = TEAMS[m.away];
        
        if (!teamA || !teamB) return false; // Safety check
        
        // Search by team name
        const matchesSearch = teamA.name.toLowerCase().includes(searchVal) || 
                              teamB.name.toLowerCase().includes(searchVal);
        
        // Filter by Group
        const matchesGroup = groupVal === "all" || m.group === groupVal;
        
        // Filter by Venue
        const matchesVenue = venueVal === "all" || m.venue.includes(venueVal);
        
        // Hide unapproved matches for normal users
        const matchesApproved = IS_ADMIN || m.approved;

        return matchesSearch && matchesGroup && matchesVenue && matchesApproved;
    });

    if (filteredMatches.length === 0) {
        listContainer.innerHTML = `
            <div class="glass-card" style="padding: 3rem; text-align: center; color: var(--text-muted);">
                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; color: var(--primary);"></i>
                <p>No fixtures match your selected filters. Try broadening your criteria.</p>
            </div>
        `;
        return;
    }

    filteredMatches.forEach(m => {
        const teamA = TEAMS[m.home];
        const teamB = TEAMS[m.away];
        
        const card = document.createElement("div");
        card.className = "glass-card match-card";

        const formattedDate = new Date(m.date).toLocaleDateString("en-US", {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
        });

        const timeStr = m.time || ["12:00", "15:00", "18:00", "21:00"][m.id % 4];
        const formattedTime = ` @ ${timeStr} Local`;

        let istDisplay = m.timeIST ? (m.timeIST + " IST") : "";
        if (!istDisplay) {
            const timeParts = timeStr.split(":");
            const CITY_UTC_OFFSETS = {
                "Mexico City": 6, "Monterrey": 6, "Guadalajara": 6,
                "Dallas": 5, "Houston": 5, "Kansas City": 5,
                "New York/New Jersey": 4, "Atlanta": 4, "Toronto": 4, "Miami": 4, "Boston": 4, "Philadelphia": 4,
                "Los Angeles": 7, "Vancouver": 7, "San Francisco": 7, "Seattle": 7
            };
            const matchCity = m.venue.match(/\(([^)]+)\)/);
            const offset = (matchCity && CITY_UTC_OFFSETS[matchCity[1]]) ? CITY_UTC_OFFSETS[matchCity[1]] : 4;
            const utcDate = new Date(Date.UTC(parseInt(m.date.substring(0,4)), parseInt(m.date.substring(5,7))-1, parseInt(m.date.substring(8,10)), parseInt(timeParts[0]) + offset, parseInt(timeParts[1])));
            istDisplay = utcDate.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }) + " IST";
        }

        const isSaved = m.homeScore != null && m.awayScore != null;

        card.innerHTML = `
            <div class="match-info-left">
                <span class="match-number">Match #${m.id}</span>
                <span class="match-group-lbl">Group ${m.group} - Round ${m.round}</span>
            </div>
            
            <div class="match-vs-area">
                <div class="match-team team-a">
                    <span class="match-team-name">${teamA.name}</span>
                    <img src="https://flagcdn.com/w40/${teamA.flag}.png" alt="${teamA.name}" class="match-team-flag" onerror="this.src='https://flagcdn.com/w40/gb.png'">
                </div>
                
                <div class="match-score-inputs">
                    <div style="display: flex; align-items: center; justify-content: center;">
                        ${IS_ADMIN ? `
                        <input type="number" min="0" max="20" class="score-input" value="${m.homeScore != null ? m.homeScore : ''}" 
                            onchange="updateMatchScore(${m.id}, 'home', this.value)" placeholder="-">
                        <span class="score-dash">:</span>
                        <input type="number" min="0" max="20" class="score-input" value="${m.awayScore != null ? m.awayScore : ''}" 
                            onchange="updateMatchScore(${m.id}, 'away', this.value)" placeholder="-">
                        ` : `
                        <span class="score-badge">${m.homeScore != null ? m.homeScore : '-'}</span>
                        <span class="score-dash">:</span>
                        <span class="score-badge">${m.awayScore != null ? m.awayScore : '-'}</span>
                        `}
                    </div>
                </div>
                
                <div class="match-team team-b">
                    <img src="https://flagcdn.com/w40/${teamB.flag}.png" alt="${teamB.name}" class="match-team-flag" onerror="this.src='https://flagcdn.com/w40/gb.png'">
                    <span class="match-team-name">${teamB.name}</span>
                </div>
            </div>
            
            <div class="match-action-area">
                ${IS_ADMIN ? `
                <button class="btn-action-mini ${m.approved ? 'saved' : ''}" onclick="toggleMatchApproval(${m.id})" title="Toggle Visibility to Users" style="color: ${m.approved ? 'var(--primary)' : 'var(--text-muted)'}">
                    <i class="fas ${m.approved ? 'fa-eye' : 'fa-eye-slash'}"></i>
                </button>
                <button class="btn-action-mini ${isSaved ? 'saved' : ''}" onclick="this.classList.add('saved');" title="Scores auto-save on typing. Click to visually confirm.">
                    <i class="fas fa-check"></i>
                </button>
                ` : ``}
            </div>
        `;

        listContainer.appendChild(card);
    });
}

// Inline score updater
function updateMatchScore(matchId, side, value) {
    const match = appState.fixtures.find(m => m.id === matchId);
    if (!match) return;

    if (value === "") {
        if (side === "home") match.homeScore = null;
        else match.awayScore = null;
    } else {
        const score = Math.max(0, parseInt(value));
        if (side === "home") match.homeScore = score;
        else match.awayScore = score;
    }

    calculateStandings();
    saveToLocalStorage();
    
    // Re-render group tables and bracket seamlessly
    renderGroups();
    renderBracket();
}

// Quick simulate single match via dice icon
function quickSimMatch(matchId) {
    const match = appState.fixtures.find(m => m.id === matchId);
    if (!match) return;

    const teamA = TEAMS[match.home];
    const teamB = TEAMS[match.away];

    const score = generateRealisticScore(teamA.rank, teamB.rank);
    match.homeScore = score.home;
    match.awayScore = score.away;

    calculateStandings();
    saveToLocalStorage();
    renderGroups();
    renderFixtures();
    renderBracket();
}

// Teams tab explorer renderer
function renderTeams() {
    const grid = document.getElementById("teams-grid-container");
    if (!grid) return;

    const searchVal = document.getElementById("team-search").value.toLowerCase();
    const confVal = document.getElementById("team-conf-filter").value;

    // Reset host filter if manual search/filters are applied by user
    if (searchVal !== "" || confVal !== "all") {
        appState.hostFilterOnly = false;
    }

    grid.innerHTML = "";

    const filtered = Object.values(TEAMS).filter(t => {
        // If hostFilterOnly is active, show only USA, CAN, MEX
        if (appState.hostFilterOnly && !(t.id === 'USA' || t.id === 'CAN' || t.id === 'MEX')) {
            return false;
        }
        const matchesSearch = t.name.toLowerCase().includes(searchVal) || 
                              t.id.toLowerCase().includes(searchVal);
        const matchesConf = confVal === "all" || t.conf === confVal;
        return matchesSearch && matchesConf;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="glass-card" style="padding: 3rem; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">
                <i class="fas fa-users-slash" style="font-size: 2rem; margin-bottom: 1rem; color: var(--primary);"></i>
                <p>No teams match your search details.</p>
            </div>
        `;
        return;
    }

    filtered.forEach(t => {
        const card = document.createElement("div");
        card.className = "glass-card team-card";
        card.onclick = () => showTeamDetails(t.id);

        card.innerHTML = `
            <img src="https://flagcdn.com/w80/${t.flag}.png" alt="${t.name}" class="team-card-flag" onerror="this.src='https://flagcdn.com/w80/gb.png'">
            <h3 class="team-card-name">${t.name}</h3>
            <span class="team-card-conf">${t.conf}</span>
            <div class="team-card-stats">
                <div class="team-stat-item">
                    <span>Rank</span>
                    <strong>#${t.rank}</strong>
                </div>
                <div class="team-stat-item">
                    <span>Group</span>
                    <strong>${t.group}</strong>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Team detailed Modal displayer
const SURNAMES = {
    "UEFA": ["Smith", "Müller", "Rossi", "Silva", "García", "Ivanov", "Novak", "Hansen", "Johansson", "López", "Dubois", "Moreau", "Weber", "Bauer", "Conti", "Esposito", "Costa", "Ferreira"],
    "CONMEBOL": ["Rodríguez", "González", "Pérez", "Gómez", "Silva", "Santos", "Oliveira", "Souza", "Martínez", "López", "Fernández", "García"],
    "CONCACAF": ["Davis", "Johnson", "Hernández", "Martínez", "Davies", "Brown", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas"],
    "CAF": ["Traoré", "Diallo", "Mensah", "Keita", "Ndlovu", "Touré", "Cissé", "Camara", "Kone", "Diop", "Osei", "Kalu", "Gyan", "Boateng"],
    "AFC": ["Kim", "Lee", "Sato", "Tanaka", "Al-Dawsari", "Nguyen", "Park", "Choi", "Suzuki", "Takahashi", "Al-Muwallad", "Al-Shehri", "Wang", "Zhang"],
    "OFC": ["Wood", "Smith", "Tuiloma", "Cacace", "Barbarouses", "Marinovic", "Rojas", "Boxall", "Waine", "Payne", "Just"]
};

function getSquadForTeam(team) {
    if (team.squad) return team.squad;

    const surnames = SURNAMES[team.conf] || SURNAMES["UEFA"];
    const firstInitials = "ABCDEFGHIJKLMNOPRSTVWZ";
    
    let squadList = { gk: [], def: [], mid: [], fwd: [] };
    
    const getRandomName = () => {
        const init = firstInitials[Math.floor(Math.random() * firstInitials.length)];
        const sur = surnames[Math.floor(Math.random() * surnames.length)];
        return `${init}. ${sur}`;
    };

    for(let i=0; i<3; i++) squadList.gk.push(getRandomName());
    for(let i=0; i<7; i++) squadList.def.push(getRandomName());
    for(let i=0; i<8; i++) squadList.mid.push(getRandomName());
    for(let i=0; i<5; i++) squadList.fwd.push(getRandomName());

    let starRole = Math.random() > 0.5 ? squadList.mid : squadList.fwd;
    starRole[0] = team.star;
    
    team.squad = squadList;
    return squadList;
}

function toggleSquadView(teamId) {
    const squadDiv = document.getElementById("modal-squad-list");
    if (!squadDiv) return;
    
    if (squadDiv.style.display === "block") {
        squadDiv.style.display = "none";
        return;
    }
    
    const t = TEAMS[teamId];
    if (!t) return;
    
    const squad = getSquadForTeam(t);
    
    const gkHTML = squad.gk.map((name, i) => `<div class="squad-player"><span class="squad-number">${i === 0 ? 1 : i === 1 ? 12 : 23}</span> <span class="squad-name">${name}</span></div>`).join('');
    const defHTML = squad.def.map((name, i) => `<div class="squad-player"><span class="squad-number">${i+2}</span> <span class="squad-name">${name}</span></div>`).join('');
    const midHTML = squad.mid.map((name, i) => `<div class="squad-player"><span class="squad-number">${i+9}</span> <span class="squad-name">${name}</span> ${name === t.star ? '<i class="fas fa-star squad-star"></i>' : ''}</div>`).join('');
    const fwdHTML = squad.fwd.map((name, i) => `<div class="squad-player"><span class="squad-number">${i+17}</span> <span class="squad-name">${name}</span> ${name === t.star ? '<i class="fas fa-star squad-star"></i>' : ''}</div>`).join('');

    squadDiv.innerHTML = `
        <h4 style="margin-bottom: 1rem; color: var(--primary); text-align: center;">Official 23-Man Squad</h4>
        <div class="squad-grid">
            <div class="squad-category">
                <h5>Goalkeepers</h5>
                ${gkHTML}
            </div>
            <div class="squad-category">
                <h5>Defenders</h5>
                ${defHTML}
            </div>
            <div class="squad-category">
                <h5>Midfielders</h5>
                ${midHTML}
            </div>
            <div class="squad-category">
                <h5>Forwards</h5>
                ${fwdHTML}
            </div>
        </div>
    `;
    squadDiv.style.display = "block";
}

function showTeamDetails(teamId) {
    const t = TEAMS[teamId];
    const modal = document.getElementById("team-modal");
    if (!t || !modal) return;

    document.getElementById("modal-flag-img").src = `https://flagcdn.com/w160/${t.flag}.png`;
    document.getElementById("modal-team-name").innerText = t.name;
    document.getElementById("modal-group-lbl").innerText = `Group ${t.group}`;
    document.getElementById("modal-rank").innerText = `#${t.rank}`;
    document.getElementById("modal-conf").innerText = t.conf;
    document.getElementById("modal-player").innerText = t.star;
    document.getElementById("modal-coach").innerText = t.coach;

    const squadDiv = document.getElementById("modal-squad-list");
    if (squadDiv) squadDiv.style.display = "none";
    
    const viewSquadBtn = document.getElementById("view-squad-btn");
    if (viewSquadBtn) {
        viewSquadBtn.onclick = () => toggleSquadView(teamId);
    }

    modal.classList.add("active");
}

function closeModal() {
    const modal = document.getElementById("team-modal");
    if (modal) modal.classList.remove("active");
}

// Knockout Bracket visualizer
function renderBracket() {
    // Strict Enforcement: Wipe default seeded bracket if group stages are not finished & approved
    const playedMatches = appState.fixtures.filter(m => m.homeScore !== null && m.awayScore !== null && m.approved).length;
    if (playedMatches < 90) {
        ['r32', 'r16', 'qf', 'sf'].forEach(phase => {
            appState.bracket[phase].forEach(m => { m.home = null; m.away = null; m.winner = null; });
        });
        appState.bracket.final.home = null;
        appState.bracket.final.away = null;
        appState.bracket.final.winner = null;
    }

    const r32Left = document.getElementById("bracket-r32-left");
    const r32Right = document.getElementById("bracket-r32-right");
    const r16Left = document.getElementById("bracket-r16-left");
    const r16Right = document.getElementById("bracket-r16-right");
    const qfLeft = document.getElementById("bracket-qf-left");
    const qfRight = document.getElementById("bracket-qf-right");
    const sfLeft = document.getElementById("bracket-sf-left");
    const sfRight = document.getElementById("bracket-sf-right");
    const finalCol = document.getElementById("bracket-final");

    if (!r32Left) return;

    const bracket = appState.bracket;

    // Helper to generate a team slot HTML
    const getSlotHtml = (m, side, round, matchIdx, isFlipped = false) => {
        const overridenTeamId = appState.bracketOverrides?.[round]?.[matchIdx]?.[side];
        const teamId = overridenTeamId || (side === 'home' ? m.home : m.away);
        const score = side === 'home' ? m.homeScore : m.awayScore;
        
        let teamSelectHtml = "";
        if (IS_ADMIN) {
            teamSelectHtml = `<select class="bracket-team-select" style="background: rgba(0,0,0,0.5); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 2px; max-width: 65px; font-size: 0.7rem;" onchange="updateKnockoutTeam('${round}', '${matchIdx}', '${side}', this.value)">`;
            teamSelectHtml += `<option value="">TBD</option>`;
            Object.values(TEAMS).sort((a,b)=>a.name.localeCompare(b.name)).forEach(tm => {
                teamSelectHtml += `<option value="${tm.id}" ${tm.id === teamId ? 'selected' : ''}>${tm.name}</option>`;
            });
            teamSelectHtml += `</select>`;
        }

        if (!teamId && !IS_ADMIN) {
            return `<div class="bracket-team-slot empty" style="text-align: ${isFlipped ? 'right' : 'left'};">TBD</div>`;
        }
        
        const t = teamId ? TEAMS[teamId] : null;
        let slotClass = "bracket-team-slot";
        if (m.winner !== null && m.winner === teamId) slotClass += " winner";
        if (m.winner !== null && m.winner !== teamId) slotClass += " loser";
        if (isFlipped) slotClass += " flipped";

        return `
            <div class="${slotClass}" style="display: flex; align-items: center; justify-content: space-between; padding: 0.3rem 0.5rem; flex-direction: ${isFlipped ? 'row-reverse' : 'row'};">
                <div class="bracket-team-info" style="display: flex; align-items: center; gap: 0.5rem; flex-direction: ${isFlipped ? 'row-reverse' : 'row'}; text-align: ${isFlipped ? 'right' : 'left'};">
                    ${t ? `<img src="https://flagcdn.com/w40/${t.flag}.png" alt="${t.name}" class="flag-icon" onerror="this.src='https://flagcdn.com/w40/gb.png'">` : '<div class="flag-icon" style="background: rgba(255,255,255,0.1); width: 20px; height: 14px; border-radius: 2px;"></div>'}
                    ${IS_ADMIN ? teamSelectHtml : `<span>${t ? t.name : 'TBD'}</span>`}
                </div>
                ${IS_ADMIN ? `
                <input type="number" min="0" max="20" class="score-input knockout-score-input" 
                    style="width: 28px; height: 26px; font-size: 0.85rem; text-align: center; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: white; margin-${isFlipped ? 'right' : 'left'}: auto;" 
                    value="${score !== undefined && score !== null ? score : ''}" 
                    onchange="updateKnockoutScore('${round}', ${matchIdx}, '${side}', this.value)">
                ` : `
                <span class="score-badge bracket-score-badge" style="margin-${isFlipped ? 'right' : 'left'}: auto;">${score !== undefined && score !== null ? score : '-'}</span>
                `}
            </div>
        `;
    };

    const renderPhase = (col, headerTitle, roundKey, matchArray, startIndex, isFlipped) => {
        if (!col) return;
        col.innerHTML = `<div class="bracket-col-header">${headerTitle}</div><div class="bracket-matchups"></div>`;
        const matchupsContainer = col.querySelector(".bracket-matchups");
        matchArray.forEach((m, relativeIdx) => {
            const idx = startIndex + relativeIdx;
            const card = document.createElement("div");
            card.className = "bracket-matchup-card" + (isFlipped ? " flipped" : "");
            
            const homeSlot = document.createElement("div");
            homeSlot.innerHTML = getSlotHtml(m, 'home', roundKey, idx, isFlipped);

            const awaySlot = document.createElement("div");
            awaySlot.innerHTML = getSlotHtml(m, 'away', roundKey, idx, isFlipped);

            card.appendChild(homeSlot);
            card.appendChild(awaySlot);
            matchupsContainer.appendChild(card);
        });
    };

    // Render Round of 32 (16 matches: 8 left, 8 right)
    renderPhase(r32Left, "Round of 32", "r32", bracket.r32.slice(0, 8), 0, false);
    renderPhase(r32Right, "Round of 32", "r32", bracket.r32.slice(8, 16), 8, true);

    // Render Round of 16 (8 matches: 4 left, 4 right)
    renderPhase(r16Left, "Round of 16", "r16", bracket.r16.slice(0, 4), 0, false);
    renderPhase(r16Right, "Round of 16", "r16", bracket.r16.slice(4, 8), 4, true);

    // Render Quarterfinals (4 matches: 2 left, 2 right)
    renderPhase(qfLeft, "Quarterfinals", "qf", bracket.qf.slice(0, 2), 0, false);
    renderPhase(qfRight, "Quarterfinals", "qf", bracket.qf.slice(2, 4), 2, true);

    // Render Semifinals (2 matches: 1 left, 1 right)
    renderPhase(sfLeft, "Semifinals", "sf", bracket.sf.slice(0, 1), 0, false);
    renderPhase(sfRight, "Semifinals", "sf", bracket.sf.slice(1, 2), 1, true);

    // Render Final
    if (finalCol) {
        finalCol.innerHTML = `<div class="bracket-col-header" style="color: var(--gold); border-bottom-color: var(--gold);">Grand Final</div><div class="bracket-matchups"></div>`;
        const finalMatchups = finalCol.querySelector(".bracket-matchups");
        const mFinal = bracket.final;
        
        const card = document.createElement("div");
        card.className = "bracket-matchup-card final-match-card";
        card.style.border = "1.5px solid var(--gold)";
        card.style.boxShadow = "0 0 20px rgba(245, 158, 11, 0.3)";

        const homeSlot = document.createElement("div");
        homeSlot.innerHTML = getSlotHtml(mFinal, 'home', 'final', 0, false);

        const awaySlot = document.createElement("div");
        awaySlot.innerHTML = getSlotHtml(mFinal, 'away', 'final', 0, false);

        card.appendChild(homeSlot);
        card.appendChild(awaySlot);
        finalMatchups.appendChild(card);
    }

    // Champion display
    if (bracket.final.winner) {
        triggerCelebration(bracket.final.winner);
    } else {
        const champDisplay = document.getElementById("champion-display");
        if (champDisplay) champDisplay.style.display = "none";
    }
}

// Celebration details
function triggerCelebration(teamId) {
    const t = TEAMS[teamId];
    const container = document.getElementById("champion-display");
    if (!t || !container) return;

    document.getElementById("champ-flag-img").src = `https://flagcdn.com/w160/${t.flag}.png`;
    document.getElementById("champ-team-name").innerText = t.name;
    container.style.display = "block";

    // Confetti canvas trigger
    triggerConfetti();
}

function triggerConfetti() {
    const canvas = document.getElementById("confetti-canvas");
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#10b981", "#3b82f6", "#ef4444", "#f59e0b", "#a855f7", "#ec4899"];
    const pieces = [];

    for (let i = 0; i < 150; i++) {
        pieces.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            r: Math.random() * 6 + 4,
            d: Math.random() * canvas.height,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.random() * 10 - 5,
            tiltAngleIncremental: Math.random() * 0.07 + 0.02,
            tiltAngle: 0
        });
    }

    let animationFrame;
    const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        pieces.forEach(p => {
            p.tiltAngle += p.tiltAngleIncremental;
            p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
            p.x += Math.sin(p.tiltAngle);
            p.tilt = Math.sin(p.tiltAngle - p.r/2) * 15;

            ctx.beginPath();
            ctx.lineWidth = p.r;
            ctx.strokeStyle = p.color;
            ctx.moveTo(p.x + p.tilt + p.r/2, p.y);
            ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r/2);
            ctx.stroke();
        });

        // Loop animation for 5 seconds
        if (pieces.some(p => p.y < canvas.height)) {
            animationFrame = requestAnimationFrame(draw);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    draw();

    // Clean up animation on resize or tab switch
    setTimeout(() => {
        cancelAnimationFrame(animationFrame);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 6000);
}

// 8. Tab management
function switchTab(tabId) {
    const tabs = document.querySelectorAll(".nav-tab");
    const contents = document.querySelectorAll(".tab-content");

    tabs.forEach(t => t.classList.remove("active"));
    contents.forEach(c => c.classList.remove("active"));

    // Find trigger tab
    const activeTab = Array.from(tabs).find(t => t.hasAttribute("onclick") && t.getAttribute("onclick").includes(tabId));
    if (activeTab) activeTab.classList.add("active");

    const activeContent = document.getElementById(tabId);
    if (activeContent) activeContent.classList.add("active");

    // Close mobile nav menu
    document.getElementById("nav-menu-links").classList.remove("active");

    // Rerender specific views on tab load
    if (tabId === "groups") renderGroups();
    if (tabId === "fixtures") renderFixtures();
    if (tabId === "teams") renderTeams();
    if (tabId === "bracket") renderBracket();
    if (tabId === "gallery") {
        if (IS_ADMIN) renderAdminGallery();
        else renderGallery();
    }
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    const menu = document.getElementById("nav-menu-links");
    if (menu) menu.classList.toggle("active");
}

// 9. Initial Load
window.addEventListener("DOMContentLoaded", () => {
    initFixtures();
    initStandings();
    renderCountdown();
    
    if (dbRef) {
        // Use Firebase Realtime Sync
        dbRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data && data.fixtures) {
                if (data.version !== 7) {
                    console.log("Stale cloud data detected. Forcing cloud sync with local v7 fixtures.");
                    saveToLocalStorage();
                    return;
                }
                appState.fixtures = data.fixtures;
                
                if (data.bracket) {
                    const rounds = ['r32', 'r16', 'qf', 'sf'];
                    rounds.forEach(r => {
                        if (data.bracket[r]) {
                            data.bracket[r].forEach((m, idx) => {
                                if (m) appState.bracket[r][idx] = { ...appState.bracket[r][idx], ...m };
                            });
                        }
                    });
                    if (data.bracket.final) {
                        appState.bracket.final = { ...appState.bracket.final, ...data.bracket.final };
                    }
                }
                if (data.standingsOverrides) appState.standingsOverrides = data.standingsOverrides;
                if (data.bracketOverrides) appState.bracketOverrides = data.bracketOverrides;
            }
            calculateStandings();
            
            // Protect Admin focus from being stolen by live sync while typing
            renderGroups();
            renderTeams();
            
            if (IS_ADMIN) {
                const activeEl = document.activeElement;
                const isTyping = activeEl && (activeEl.classList.contains("score-input") || activeEl.classList.contains("knockout-score-input"));
                if (!isTyping) {
                    renderFixtures();
                    renderBracket();
                }
            } else {
                renderFixtures();
                renderBracket();
            }
        });
        
        // Gallery Sync
        firebase.database().ref('gallery').on('value', (snapshot) => {
            const data = snapshot.val();
            appState.gallery = [];
            if (data) {
                Object.keys(data).forEach(key => {
                    appState.gallery.push({
                        id: key,
                        ...data[key]
                    });
                });
                // Sort by timestamp descending
                appState.gallery.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            }
            if (IS_ADMIN) {
                renderAdminGallery();
            } else {
                renderGallery();
            }
        });
    } else {
        // Fallback to local storage
        loadFromLocalStorage();
        calculateStandings();
        renderAll();
    }
});

// Interactive Dashboard Stats Card click handler
function handleStatClick(type) {
    if (type === 'teams') {
        appState.hostFilterOnly = false;
        const searchInput = document.getElementById("team-search");
        const confFilter = document.getElementById("team-conf-filter");
        if (searchInput) searchInput.value = "";
        if (confFilter) confFilter.value = "all";
        switchTab('teams');
    } else if (type === 'fixtures') {
        const searchInput = document.getElementById("filter-search");
        const groupFilter = document.getElementById("filter-group");
        const venueFilter = document.getElementById("filter-venue");
        if (searchInput) searchInput.value = "";
        if (groupFilter) groupFilter.value = "all";
        if (venueFilter) venueFilter.value = "all";
        renderFixtures();
        switchTab('fixtures');
    } else if (type === 'hosts') {
        appState.hostFilterOnly = true;
        const searchInput = document.getElementById("team-search");
        const confFilter = document.getElementById("team-conf-filter");
        if (searchInput) searchInput.value = "";
        if (confFilter) confFilter.value = "all";
        switchTab('teams');
    } else if (type === 'venues') {
        switchTab('dashboard');
        const list = document.querySelector(".stadium-mini-list");
        if (list) {
            list.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Trigger visual neon pulse border glow
            const parentCard = list.closest(".glass-panel");
            if (parentCard) {
                parentCard.classList.add("venue-highlight-effect");
                setTimeout(() => {
                    parentCard.classList.remove("venue-highlight-effect");
                }, 2500);
            }
        }
    }
}

// Sync across tabs if admin updates data
window.addEventListener('storage', (e) => {
    if (e.key === 'fifa2026_simulator_state_v2') {
        loadFromLocalStorage();
        calculateStandings(); // Ensure derivations are intact
        renderAll();
    }
});

// ------------------------------
// Gallery Functions
// ------------------------------

function renderGallery() {
    const container = document.getElementById("gallery-grid-container");
    if (!container) return;
    
    container.innerHTML = "";
    
    if (!appState.gallery || appState.gallery.length === 0) {
        container.innerHTML = `<div class="glass-card" style="padding: 3rem; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">
            <i class="fas fa-images" style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--text-muted); opacity: 0.5;"></i>
            <p>No photos have been uploaded yet.</p>
        </div>`;
        return;
    }
    
    let html = "";
    appState.gallery.forEach(item => {
        const dateStr = new Date(item.timestamp).toLocaleDateString();
        // Pass the data cleanly avoiding quote issues
        const safeUrl = item.url.replace(/'/g, "\\'");
        const safeCaption = (item.caption || '').replace(/'/g, "\\'");
        html += `
            <div class="glass-card" style="border-radius: 8px; overflow: hidden; cursor: pointer; transition: transform 0.2s ease;" onclick="openGalleryModal('${safeUrl}', '${safeCaption}', '${dateStr}')" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                <img src="${item.url}" alt="Gallery Image" style="width: 100%; height: 200px; object-fit: cover;">
                <div style="padding: 1rem; width: 100%; box-sizing: border-box; overflow: hidden;">
                    <p style="font-size: 1rem; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 0.5rem; width: 100%; display: block;">${item.caption || 'World Cup 2026 Moment'}</p>
                    <p style="color: var(--text-muted); font-size: 0.8rem;">${dateStr}</p>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderAdminGallery() {
    const container = document.getElementById("admin-gallery-grid-container");
    if (!container) return;
    
    container.innerHTML = "";
    
    if (!appState.gallery || appState.gallery.length === 0) {
        container.innerHTML = `<div class="glass-card" style="padding: 3rem; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">
            <p>No photos uploaded yet.</p>
        </div>`;
        return;
    }
    let html = "";
    appState.gallery.forEach(item => {
        const dateStr = new Date(item.timestamp).toLocaleDateString();
        const safeUrl = item.url.replace(/'/g, "\\'");
        const safeCaption = (item.caption || '').replace(/'/g, "\\'");
        html += `
            <div class="glass-card" style="border-radius: 8px; overflow: hidden; position: relative;">
                <div style="cursor: pointer;" onclick="openGalleryModal('${safeUrl}', '${safeCaption}', '${dateStr}')">
                    <img src="${item.url}" alt="Gallery Image" style="width: 100%; height: 180px; object-fit: cover;">
                    <div style="padding: 1rem; padding-bottom: 3.5rem; width: 100%; box-sizing: border-box; overflow: hidden;">
                        <p style="font-size: 1rem; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 0.5rem; width: 100%; display: block;">${item.caption}</p>
                        <p style="color: var(--text-muted); font-size: 0.8rem;">${dateStr}</p>
                    </div>
                </div>
                <button onclick="deleteGalleryItem('${item.id}')" style="position: absolute; bottom: 0.5rem; right: 0.5rem; background: rgba(220, 53, 69, 0.8); color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem;"><i class="fas fa-trash-alt"></i> Delete</button>
            </div>
        `;
    });
    container.innerHTML = html;
}

async function uploadToGallery() {
    const fileInput = document.getElementById("gallery-file");
    const captionInput = document.getElementById("gallery-caption");
    const statusEl = document.getElementById("upload-status");
    const btn = document.getElementById("upload-btn");
    
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        statusEl.innerText = "Please select an image first.";
        statusEl.style.color = "var(--accent)";
        statusEl.style.display = "block";
        return;
    }
    
    const file = fileInput.files[0];
    const caption = captionInput.value.trim();
    
    if (!dbRef) {
        statusEl.innerText = "Firebase not fully initialized.";
        statusEl.style.color = "var(--accent)";
        statusEl.style.display = "block";
        return;
    }
    
    try {
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing...`;
        statusEl.style.display = "none";
        
        // Read and compress image using Canvas
        const base64Image = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = event => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Compress to JPEG with 0.7 quality
                    resolve(canvas.toDataURL("image/jpeg", 0.7));
                };
                img.onerror = err => reject(err);
            };
            reader.onerror = error => reject(error);
        });
        
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Uploading...`;
        
        // Save to Database
        const newGalleryRef = firebase.database().ref('gallery').push();
        await newGalleryRef.set({
            url: base64Image,
            caption: caption,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        // Reset form
        fileInput.value = "";
        captionInput.value = "";
        
        statusEl.innerText = "Upload successful!";
        statusEl.style.color = "var(--primary)";
        statusEl.style.display = "block";
        
        setTimeout(() => {
            statusEl.style.display = "none";
        }, 3000);
        
    } catch (err) {
        console.error("Upload error:", err);
        statusEl.innerText = "Error: Failed to process or upload image.";
        statusEl.style.color = "var(--accent)";
        statusEl.style.display = "block";
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-cloud-upload-alt"></i> Upload to Gallery`;
    }
}

async function deleteGalleryItem(id) {
    if (!confirm("Are you sure you want to delete this photo?")) return;
    
    try {
        // Delete from DB only
        await firebase.database().ref(`gallery/${id}`).remove();
    } catch (err) {
        console.error("Error deleting gallery item:", err);
        alert("Failed to delete item.");
    }
}

function updateStandingsOverride(teamId, field, value) {
    if (!appState.standingsOverrides) appState.standingsOverrides = {};
    if (!appState.standingsOverrides[teamId]) appState.standingsOverrides[teamId] = {};
    
    if (value === "") {
        delete appState.standingsOverrides[teamId][field];
        // If empty, clean up
        if (Object.keys(appState.standingsOverrides[teamId]).length === 0) {
            delete appState.standingsOverrides[teamId];
        }
    } else {
        appState.standingsOverrides[teamId][field] = parseInt(value);
    }
    
    calculateStandings();
    saveToLocalStorage();
    renderGroups();
}

function openGalleryModal(url, caption, date) {
    const modal = document.getElementById("gallery-modal");
    if (!modal) return;
    
    document.getElementById("gallery-modal-img").src = url;
    document.getElementById("gallery-modal-caption").innerText = caption;
    document.getElementById("gallery-modal-date").innerText = date;
    
    modal.style.display = "flex";
    // Slight delay to allow display flex to apply before adding opacity class
    setTimeout(() => {
        modal.classList.add("active");
    }, 10);
}

function closeGalleryModal() {
    const modal = document.getElementById("gallery-modal");
    if (modal) {
        modal.classList.remove("active");
        setTimeout(() => {
            modal.style.display = "none";
        }, 300); // Wait for transition
    }
}

// Bulk update team standings by admin
function updateTeamStats(teamId, stats) {
    if (!IS_ADMIN) {
        console.warn("Only admins can override stats.");
        return;
    }
    if (!appState.standingsOverrides) appState.standingsOverrides = {};
    if (!appState.standingsOverrides[teamId]) appState.standingsOverrides[teamId] = {};
    
    Object.assign(appState.standingsOverrides[teamId], stats);
    
    calculateStandings();
    saveToLocalStorage();
    renderGroups();
    console.log(`Updated stats for ${teamId}:`, stats);
}

// --- WEBRTC SCREEN SHARING LOGIC ---
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

let localScreenStream = null;
let adminPeerConnections = {};
let viewerPeerConnection = null;
let viewerId = null;

async function startAdminBroadcast() {
    if (!IS_ADMIN) return;
    try {
        localScreenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        
        const videoEl = document.getElementById("admin-local-video");
        if (videoEl) videoEl.srcObject = localScreenStream;

        const btn = document.getElementById("btn-start-broadcast");
        if (btn) {
            btn.innerHTML = `<i class="fas fa-stop-circle"></i> Stop Share`;
            btn.onclick = stopAdminBroadcast;
            btn.style.background = '#ef4444';
            btn.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.25)';
        }

        // Clear existing viewers
        firebase.database().ref('webrtc/viewers').remove();
        
        // Mark stream as live
        firebase.database().ref('webrtc/status').set('LIVE');

        // Listen for new viewers requesting connection
        firebase.database().ref('webrtc/viewers').on('child_added', handleNewViewer);

        localScreenStream.getVideoTracks()[0].onended = stopAdminBroadcast;
    } catch (err) {
        console.error("Error sharing screen: ", err);
        alert("Failed to capture screen: " + err.message);
    }
}

function stopAdminBroadcast() {
    if (localScreenStream) {
        localScreenStream.getTracks().forEach(track => track.stop());
        localScreenStream = null;
    }
    const videoEl = document.getElementById("admin-local-video");
    if (videoEl) videoEl.srcObject = null;

    const btn = document.getElementById("btn-start-broadcast");
    if (btn) {
        btn.innerHTML = `<i class="fas fa-desktop"></i> Start Screen Share`;
        btn.onclick = startAdminBroadcast;
        btn.style.background = '';
        btn.style.boxShadow = '';
    }

    firebase.database().ref('webrtc/status').set('OFFLINE');
    firebase.database().ref('webrtc/viewers').off('child_added', handleNewViewer);
    firebase.database().ref('webrtc/viewers').remove();

    Object.values(adminPeerConnections).forEach(pc => pc.close());
    adminPeerConnections = {};
    updateViewerCount();
}

async function handleNewViewer(snapshot) {
    const vId = snapshot.key;
    const request = snapshot.val();
    if (!request || !request.requestConnect) return;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    adminPeerConnections[vId] = pc;

    // Add local stream tracks to PC
    if (localScreenStream) {
        localScreenStream.getTracks().forEach(track => pc.addTrack(track, localScreenStream));
    }

    pc.onicecandidate = event => {
        if (event.candidate) {
            firebase.database().ref(`webrtc/viewers/${vId}/candidates/admin`).push(event.candidate.toJSON());
        }
    };

    pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            pc.close();
            delete adminPeerConnections[vId];
            updateViewerCount();
        } else if (pc.connectionState === 'connected') {
            updateViewerCount();
        }
    };

    // Create offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    // Send offer to viewer
    await firebase.database().ref(`webrtc/viewers/${vId}/offer`).set({
        type: offer.type,
        sdp: offer.sdp
    });

    // Listen for viewer answer
    firebase.database().ref(`webrtc/viewers/${vId}/answer`).on('value', async (snap) => {
        const answer = snap.val();
        if (answer && pc.signalingState !== 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
    });

    // Listen for viewer ICE candidates
    firebase.database().ref(`webrtc/viewers/${vId}/candidates/viewer`).on('child_added', async (snap) => {
        const candidate = snap.val();
        if (candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
    });
}

function updateViewerCount() {
    const count = Object.keys(adminPeerConnections).length;
    const countEl = document.getElementById("admin-viewer-count");
    if (countEl) {
        countEl.innerHTML = `<i class="fas fa-users"></i> ${count} Viewers`;
    }
}

// Viewer Logic
async function joinStream() {
    if (IS_ADMIN) return;

    const statusEl = document.getElementById("viewer-status-text");
    const overlayEl = document.getElementById("viewer-status-overlay");
    const btn = document.getElementById("btn-join-stream");
    
    statusEl.innerText = "Connecting to broadcast...";
    if (btn) btn.style.display = "none";

    viewerId = 'viewer_' + Math.random().toString(36).substr(2, 9);
    viewerPeerConnection = new RTCPeerConnection(ICE_SERVERS);

    viewerPeerConnection.ontrack = event => {
        const videoEl = document.getElementById("viewer-remote-video");
        if (videoEl && event.streams && event.streams[0]) {
            videoEl.srcObject = event.streams[0];
            if (overlayEl) overlayEl.style.display = "none";
        }
    };

    viewerPeerConnection.onicecandidate = event => {
        if (event.candidate) {
            firebase.database().ref(`webrtc/viewers/${viewerId}/candidates/viewer`).push(event.candidate.toJSON());
        }
    };
    
    viewerPeerConnection.onconnectionstatechange = () => {
        if (viewerPeerConnection.connectionState === 'disconnected' || viewerPeerConnection.connectionState === 'failed') {
            statusEl.innerText = "Stream disconnected";
            if (btn) {
                btn.style.display = "block";
                btn.innerText = "Reconnect";
            }
            if (overlayEl) overlayEl.style.display = "flex";
        }
    };

    // Request connect
    await firebase.database().ref(`webrtc/viewers/${viewerId}`).set({
        requestConnect: true,
        timestamp: Date.now()
    });

    // Wait for offer from Admin
    firebase.database().ref(`webrtc/viewers/${viewerId}/offer`).on('value', async (snap) => {
        const offer = snap.val();
        if (offer && (viewerPeerConnection.signalingState === 'have-local-offer' || viewerPeerConnection.signalingState === 'stable')) {
            await viewerPeerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            
            const answer = await viewerPeerConnection.createAnswer();
            await viewerPeerConnection.setLocalDescription(answer);
            
            await firebase.database().ref(`webrtc/viewers/${viewerId}/answer`).set({
                type: answer.type,
                sdp: answer.sdp
            });

            // Listen for Admin ICE candidates
            firebase.database().ref(`webrtc/viewers/${viewerId}/candidates/admin`).on('child_added', async (cSnap) => {
                const candidate = cSnap.val();
                if (candidate) {
                    await viewerPeerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                }
            });
        }
    });
}

function toggleFullScreen(elementId) {
    const elem = document.getElementById(elementId);
    if (!elem) return;
    
    if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}

// Admin Match Approval Functions
function toggleMatchApproval(id) {
    if (!IS_ADMIN) return;
    const match = appState.fixtures.find(m => m.id === id);
    if (match) {
        match.approved = !match.approved;
        calculateStandings();
        saveToLocalStorage();
        renderAll();
    }
}

function approveAllMatches() {
    if (!IS_ADMIN) return;
    appState.fixtures.forEach(m => m.approved = true);
    calculateStandings();
    saveToLocalStorage();
    renderAll();
}

function hideAllMatches() {
    if (!IS_ADMIN) return;
    appState.fixtures.forEach(m => m.approved = false);
    calculateStandings();
    saveToLocalStorage();
    renderAll();
}
