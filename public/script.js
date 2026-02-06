// Remove this line: import api from './api-client.js';
// api is now available globally from api-client.js

// Google Generative Language API Configuration
let GEMINI_API_KEY = "YOUR_API_KEY" //localStorage.getItem('GEMINI_API_KEY') || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 3000;

// Mood color mapping
const MOOD_COLORS = {
    'Happy': { primary: '#FFD700', secondary: '#FFA500', glow: 'rgba(255, 215, 0, 0.3)', star: 'rgba(255, 215, 0, 0.6)' },
    'Sad': { primary: '#4A90E2', secondary: '#357ABD', glow: 'rgba(74, 144, 226, 0.3)', star: 'rgba(74, 144, 226, 0.6)' },
    'Energetic': { primary: '#FF6B35', secondary: '#FF8C42', glow: 'rgba(255, 107, 53, 0.3)', star: 'rgba(255, 107, 53, 0.6)' },
    'Chill': { primary: '#9B59B6', secondary: '#8E44AD', glow: 'rgba(155, 89, 182, 0.3)', star: 'rgba(155, 89, 182, 0.6)' },
    'Angry': { primary: '#E74C3C', secondary: '#C0392B', glow: 'rgba(231, 76, 60, 0.3)', star: 'rgba(231, 76, 60, 0.6)' },
    'Romantic': { primary: '#E84B8A', secondary: '#C41E6F', glow: 'rgba(232, 75, 138, 0.3)', star: 'rgba(232, 75, 138, 0.6)' }
};

// ========== AUTHENTICATION FUNCTIONS ==========

function updateAuthUI() {
    const user = api.getCurrentUser();
    const loggedOut = document.getElementById('loggedOutSection');
    const loggedIn = document.getElementById('loggedInSection');
    const userName = document.getElementById('userName');
    
    if (user && api.isAuthenticated()) {
        loggedOut.style.display = 'none';
        loggedIn.style.display = 'flex';
        userName.textContent = user.name;
    } else {
        loggedOut.style.display = 'flex';
        loggedIn.style.display = 'none';
    }
}

function showLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('loginEmail').focus();
    document.getElementById('loginError').textContent = '';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginError').textContent = '';
}

function showRegisterModal() {
    document.getElementById('registerModal').style.display = 'flex';
    document.getElementById('registerName').focus();
    document.getElementById('registerError').textContent = '';
}

function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
    document.getElementById('registerName').value = '';
    document.getElementById('registerEmail').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('registerError').textContent = '';
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    const btn = document.getElementById('loginSubmitBtn');
    
    if (!email || !password) {
        errorDiv.textContent = 'Please fill in all fields';
        return;
    }
    
    btn.disabled = true;
    btn.textContent = 'Logging in...';
    errorDiv.textContent = '';
    
    const result = await api.login(email, password);
    
    if (result.success) {
        closeLoginModal();
        updateAuthUI();
        showNotification('✅ Welcome back!', 'success');
    } else {
        errorDiv.textContent = result.data?.error || 'Login failed. Please try again.';
    }
    
    btn.disabled = false;
    btn.textContent = 'Login';
}

async function handleRegister() {
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const errorDiv = document.getElementById('registerError');
    const btn = document.getElementById('registerSubmitBtn');
    
    if (!name || !email || !password) {
        errorDiv.textContent = 'Please fill in all fields';
        return;
    }
    
    if (password.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters';
        return;
    }
    
    btn.disabled = true;
    btn.textContent = 'Creating account...';
    errorDiv.textContent = '';
    
    const result = await api.register(email, password, name);
    
    if (result.success) {
        closeRegisterModal();
        updateAuthUI();
        showNotification('✅ Account created successfully!', 'success');
    } else {
        errorDiv.textContent = result.data?.errors?.join(', ') || 'Registration failed. Please try again.';
    }
    
    btn.disabled = false;
    btn.textContent = 'Create Account';
}

async function handleLogout() {
    await api.logout();
    updateAuthUI();
    showNotification('👋 Logged out successfully', 'info');
}

// Simple notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#1DB954' : type === 'error' ? '#E74C3C' : '#4A90E2'};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========== SETTINGS MODAL MANAGEMENT ==========

function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const input = document.getElementById('apiKeyInput');
    modal.style.display = 'flex';
    input.value = GEMINI_API_KEY;
    input.focus();
}

function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
}

function saveApiKey() {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    
    if (!apiKey) {
        alert('Please enter your API key');
        return;
    }
    
    localStorage.setItem('GEMINI_API_KEY', apiKey);
    GEMINI_API_KEY = apiKey;
    
    closeSettingsModal();
    showNotification('✅ API Key saved successfully!', 'success');
}

// ========== MOOD RECOMMENDATION ==========

function updateThemeColors(mood) {
    const colors = MOOD_COLORS[mood] || MOOD_COLORS['Happy'];
    document.documentElement.style.setProperty('--primary', colors.primary);
    document.documentElement.style.setProperty('--primary-secondary', colors.secondary);
    document.documentElement.style.setProperty('--primary-glow', colors.glow);
    document.documentElement.style.setProperty('--star-color', colors.star);
}

async function handleRecommend() {
    const moodInput = document.getElementById('moodInput').value.trim();
    
    if (!moodInput) {
        alert('Please enter a mood or write something!');
        return;
    }

    if (!GEMINI_API_KEY) {
        alert('Please set your API key first! Click the ⚙️ settings button.');
        openSettingsModal();
        return;
    }

    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const waitTime = Math.ceil((MIN_REQUEST_INTERVAL - timeSinceLastRequest) / 1000);
        alert(`⏱️ Please wait ${waitTime} seconds before making another request.`);
        return;
    }

    const btn = document.getElementById('recommendBtn');
    btn.disabled = true;
    btn.textContent = 'Analyzing mood...';
    lastRequestTime = Date.now();

    try {
        const result = await analyzeAndRecommendWithGemini(moodInput);
        const sentimentAnalysis = result.sentiment;
        const songs = result.songs;
        
        if (sentimentAnalysis.emotion) {
            updateThemeColors(sentimentAnalysis.emotion);
        }

        setTimeout(() => {
            const sentimentDisplay = document.getElementById('sentimentDisplay');
            sentimentDisplay.classList.add('active');
            document.getElementById('sentimentFill').style.width = sentimentAnalysis.sentiment + '%';
            document.getElementById('sentimentLabel').textContent = sentimentAnalysis.label;
            document.getElementById('sentimentScore').textContent = sentimentAnalysis.sentiment;
            
            displayRecommendations(sentimentAnalysis, songs, moodInput);
        }, 600);

        // Save to backend if user is logged in
        if (api.isAuthenticated()) {
            const saveResult = await api.saveSongSuggestions(
                sentimentAnalysis.emotion || moodInput,
                moodInput,
                songs
            );
            
            if (saveResult.success) {
                console.log('✅ Songs saved to history!');
                showNotification(`💾 Saved ${saveResult.data.saved_count} songs to your history`, 'success');
            } else {
                console.log('Not saved - user may need to log in');
            }
        }
        
    } catch (error) {
        console.error('Error:', error);
        const errorMsg = error.message;
        
        if (errorMsg.includes('Rate limit') || errorMsg.includes('429')) {
            alert('⏱️ Rate limit exceeded! Please wait and try again.');
        } else {
            alert('Error: ' + errorMsg);
        }
    } finally {
        btn.disabled = false;
        btn.textContent = 'Find Songs';
    }
}

function displayRecommendations(analysis, songs, originalMood) {
    const songsGrid = document.getElementById('songsGrid');
    const resultsTitle = document.getElementById('resultsTitle');
    const resultsSubtitle = document.getElementById('resultsSubtitle');

    songsGrid.innerHTML = '';

    resultsTitle.textContent = `${analysis.label.split(' ')[0]} Vibes Playlist`;
    resultsSubtitle.textContent = `${analysis.genre} • Based on your mood: "${originalMood}"`;

    songs.forEach((song, index) => {
        const matchScore = 85 + Math.floor(Math.random() * 15);
        const songCard = document.createElement('div');
        songCard.className = 'song-card';
        
        const imageUrl = song.image_url || 'https://via.placeholder.com/300';
        
        songCard.innerHTML = `
            <div class="album-art" style="background-image: url('${imageUrl}'); background-size: cover; background-position: center;">
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 50px;">♪</span>
                </div>
            </div>
            <div class="song-info">
                <div class="song-title">${song.title}</div>
                <div class="song-artist">${song.artist}</div>
                <div class="song-details">
                    <div class="song-feature">
                        <span class="feature-label">Energy</span>
                        <span class="feature-value">${song.energy}</span>
                    </div>
                    <div class="song-feature">
                        <span class="feature-label">Dance</span>
                        <span class="feature-value">${song.danceability}</span>
                    </div>
                    <div class="song-feature">
                        <span class="feature-label">Mood</span>
                        <span class="feature-value">${song.valence}</span>
                    </div>
                    <div class="match-badge">${matchScore}% Match</div>
                </div>
            </div>
        `;
        
        songCard.addEventListener('click', () => {
            if (song.external_url) {
                window.open(song.external_url, '_blank');
            } else {
                alert(`🎵 Now Playing: "${song.title}" by ${song.artist}`);
            }
        });

        songsGrid.appendChild(songCard);
    });

    document.getElementById('resultsSection').classList.add('active');

    setTimeout(() => {
        document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function handleTryAnotherMood() {
    document.getElementById('moodInput').focus();
    document.getElementById('moodInput').value = '';
    document.getElementById('resultsSection').classList.remove('active');
}

// ========== GEMINI API ==========

async function analyzeAndRecommendWithGemini(userInput) {
    const prompt = `You are a mood analyzer and music recommender. Based on the user's input, provide sentiment analysis and song recommendations.

User input: "${userInput}"

Respond with JSON in this exact format (no markdown, no extra text):
{
  "sentiment": {
    "sentiment": <0-100 score where 0 is very negative and 100 is very positive>,
    "label": "<mood description with emoji>",
    "emotion": "<ONE WORD emotion from this list: Happy, Sad, Energetic, Chill, Angry, or Romantic>",
    "genre": "<music genre that matches this mood>"
  },
  "songs": [
    {
      "title": "Song Title",
      "artist": "Artist Name",
      "energy": "high/medium/low",
      "danceability": "high/medium/low",
      "valence": "positive/neutral/negative",
      "duration": "3:45"
    },
    {
      "title": "Song Title 2",
      "artist": "Artist Name 2",
      "energy": "high/medium/low",
      "danceability": "high/medium/low",
      "valence": "positive/neutral/negative",
      "duration": "4:12"
    },
    {
      "title": "Song Title 3",
      "artist": "Artist Name 3",
      "energy": "high/medium/low",
      "danceability": "high/medium/low",
      "valence": "positive/neutral/negative",
      "duration": "3:30"
    },
    {
      "title": "Song Title 4",
      "artist": "Artist Name 4",
      "energy": "high/medium/low",
      "danceability": "high/medium/low",
      "valence": "positive/neutral/negative",
      "duration": "2:58"
    },
    {
      "title": "Song Title 5",
      "artist": "Artist Name 5",
      "energy": "high/medium/low",
      "danceability": "high/medium/low",
      "valence": "positive/neutral/negative",
      "duration": "3:22"
    }
  ]
}`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            const statusCode = response.status;
            
            if (statusCode === 401 || statusCode === 403) {
                throw new Error('Invalid API key. Please check settings.');
            } else if (statusCode === 429) {
                throw new Error('Rate limit exceeded.');
            } else {
                throw new Error(`API Error (${statusCode})`);
            }
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0]) {
            throw new Error('No response from Gemini API');
        }

        const responseText = data.candidates[0].content.parts[0].text;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            throw new Error('Could not parse response');
        }
        
        const result = JSON.parse(jsonMatch[0]);
        
        return {
            sentiment: {
                sentiment: Math.min(100, Math.max(0, result.sentiment.sentiment)),
                label: result.sentiment.label || 'Neutral',
                emotion: result.sentiment.emotion || 'Happy',
                genre: result.sentiment.genre || 'Pop'
            },
            songs: result.songs || []
        };
    } catch (error) {
        console.error('Analysis error:', error);
        throw new Error('Failed to analyze mood: ' + error.message);
    }
}

// ========== FLOATING STARS ==========

function createStars() {
    const container = document.getElementById('starsContainer');
    let starCount = window.innerWidth < 480 ? 15 : window.innerWidth < 768 ? 25 : 50;
    
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 5 + 's';
        
        let randomSize = window.innerWidth < 480 ? 1.5 + Math.random() * 1.5 : 2 + Math.random() * 2;
        star.style.width = randomSize + 'px';
        star.style.height = randomSize + 'px';
        
        container.appendChild(star);
    }
}

// ========== EVENT LISTENERS ==========

document.addEventListener('DOMContentLoaded', () => {
    // Auth button listeners
    const loginBtn = document.querySelector('.btn-login');
    const signupBtn = document.querySelector('.btn-signup');
    const logoutBtn = document.querySelector('.btn-logout');
    const historyBtn = document.querySelector('.btn-history');
    
    if (loginBtn) loginBtn.addEventListener('click', showLoginModal);
    if (signupBtn) signupBtn.addEventListener('click', showRegisterModal);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (historyBtn) historyBtn.addEventListener('click', () => {
        window.location.href = 'history.html';
    });
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.settings-modal');
            if (modal) {
                if (modal.id === 'loginModal') closeLoginModal();
                else if (modal.id === 'registerModal') closeRegisterModal();
                else if (modal.id === 'settingsModal') closeSettingsModal();
            }
        });
    });
    
    // Login/Register submit buttons
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');
    const registerSubmitBtn = document.getElementById('registerSubmitBtn');
    
    if (loginSubmitBtn) loginSubmitBtn.addEventListener('click', handleLogin);
    if (registerSubmitBtn) registerSubmitBtn.addEventListener('click', handleRegister);
    
    // Enter key support for login/register
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const registerPassword = document.getElementById('registerPassword');
    
    if (loginEmail) loginEmail.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    if (loginPassword) loginPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    if (registerPassword) registerPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleRegister();
    });
    
    // Settings modal
    const settingsBtn = document.getElementById('settingsBtn');
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    const settingsModal = document.getElementById('settingsModal');
    const apiKeyInput = document.getElementById('apiKeyInput');
    
    if (settingsBtn) settingsBtn.addEventListener('click', openSettingsModal);
    if (saveApiKeyBtn) saveApiKeyBtn.addEventListener('click', saveApiKey);
    if (settingsModal) settingsModal.addEventListener('click', (e) => {
        if (e.target.id === 'settingsModal') closeSettingsModal();
    });
    if (apiKeyInput) apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveApiKey();
    });
    
    // Mood recommendation
    const recommendBtn = document.getElementById('recommendBtn');
    const moodInput = document.getElementById('moodInput');
    
    if (recommendBtn) recommendBtn.addEventListener('click', handleRecommend);
    if (moodInput) moodInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleRecommend();
    });
    
    // Mood chips
    document.querySelectorAll('.mood-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const mood = chip.textContent.trim();
            const moodInputEl = document.getElementById('moodInput');
            if (moodInputEl) moodInputEl.value = mood;
            updateThemeColors(mood);
            document.querySelectorAll('.mood-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
        });
    });
    
    // Try Another Mood button
    const tryAnotherBtn = document.getElementById('tryAnotherMoodBtn');
    if (tryAnotherBtn) tryAnotherBtn.addEventListener('click', handleTryAnotherMood);
});

// Window load event
window.addEventListener('load', () => {
    const moodInput = document.getElementById('moodInput');
    if (moodInput) moodInput.focus();
    createStars();
    updateAuthUI();
    
    if (!GEMINI_API_KEY) {
        setTimeout(() => {
            openSettingsModal();
        }, 500);
    }
});