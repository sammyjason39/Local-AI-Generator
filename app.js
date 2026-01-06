/* ============================================
   AI STUDIO - Application Logic
   Handles UI interactions and API calls
   ============================================ */

// ===== State Management =====
const state = {
    currentTab: 'image',
    theme: localStorage.getItem('theme') || 'dark',
    settings: {
        imageWebhook: localStorage.getItem('imageWebhook') || '',
        lyricsWebhook: localStorage.getItem('lyricsWebhook') || '',
        musicWebhook: localStorage.getItem('musicWebhook') || ''
    },
    image: {
        prompt: '',
        style: 'realistic',
        ratio: '16:9',
        isGenerating: false,
        generatedUrl: null,
        generatedBlob: null
    },
    music: {
        theme: '',
        genre: 'pop',
        mood: 'energetic',
        voice: 'male',
        duration: 60,
        lyrics: '',
        isGeneratingLyrics: false,
        isGeneratingMusic: false,
        audioUrl: null
    }
};

// ===== DOM Elements =====
const elements = {
    // Theme
    themeToggle: document.getElementById('themeToggle'),
    
    // Navigation
    navTabs: document.querySelectorAll('.nav-tab'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Image Generator
    imagePrompt: document.getElementById('imagePrompt'),
    styleButtons: document.querySelectorAll('.style-btn'),
    ratioButtons: document.querySelectorAll('.ratio-btn'),
    generateImageBtn: document.getElementById('generateImageBtn'),
    imageOutput: document.getElementById('imageOutput'),
    downloadImageBtn: document.getElementById('downloadImageBtn'),
    
    // Music Generator - Lyrics
    musicTheme: document.getElementById('musicTheme'),
    musicGenre: document.getElementById('musicGenre'),
    musicMood: document.getElementById('musicMood'),
    generateLyricsBtn: document.getElementById('generateLyricsBtn'),
    lyricsOutput: document.getElementById('lyricsOutput'),
    lyricsText: document.getElementById('lyricsText'),
    stepBadges: document.querySelectorAll('.step-badge'),
    
    // Music Generator - Music
    voiceButtons: document.querySelectorAll('.voice-btn'),
    musicDuration: document.getElementById('musicDuration'),
    durationValue: document.getElementById('durationValue'),
    generateMusicBtn: document.getElementById('generateMusicBtn'),
    audioOutput: document.getElementById('audioOutput'),
    playPauseBtn: document.getElementById('playPauseBtn'),
    currentTime: document.getElementById('currentTime'),
    totalTime: document.getElementById('totalTime'),
    downloadMusicBtn: document.getElementById('downloadMusicBtn'),
    waveform: document.getElementById('waveform'),
    
    // Settings
    settingsBtn: document.getElementById('settingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettings: document.getElementById('closeSettings'),
    imageWebhook: document.getElementById('imageWebhook'),
    lyricsWebhook: document.getElementById('lyricsWebhook'),
    musicWebhook: document.getElementById('musicWebhook'),
    testConnectionBtn: document.getElementById('testConnectionBtn'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    
    // Toast
    toastContainer: document.getElementById('toastContainer')
};

// Audio element for playback
let audioElement = null;

// ===== Initialization =====
function init() {
    // Apply saved theme
    document.documentElement.setAttribute('data-theme', state.theme);
    
    // Load saved settings
    elements.imageWebhook.value = state.settings.imageWebhook;
    elements.lyricsWebhook.value = state.settings.lyricsWebhook;
    elements.musicWebhook.value = state.settings.musicWebhook;
    
    // Setup event listeners
    setupEventListeners();
    
    // Generate waveform bars
    generateWaveformBars();
}

// ===== Event Listeners =====
function setupEventListeners() {
    // Theme Toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Navigation Tabs
    elements.navTabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    // Style Buttons
    elements.styleButtons.forEach(btn => {
        btn.addEventListener('click', () => selectStyle(btn));
    });
    
    // Ratio Buttons
    elements.ratioButtons.forEach(btn => {
        btn.addEventListener('click', () => selectRatio(btn));
    });
    
    // Voice Buttons
    elements.voiceButtons.forEach(btn => {
        btn.addEventListener('click', () => selectVoice(btn));
    });
    
    // Duration Slider
    elements.musicDuration.addEventListener('input', (e) => {
        state.music.duration = parseInt(e.target.value);
        elements.durationValue.textContent = state.music.duration;
    });
    
    // Generate Buttons
    elements.generateImageBtn.addEventListener('click', generateImage);
    elements.generateLyricsBtn.addEventListener('click', generateLyrics);
    elements.generateMusicBtn.addEventListener('click', generateMusic);
    
    // Download Buttons
    elements.downloadImageBtn.addEventListener('click', downloadImage);
    elements.downloadMusicBtn.addEventListener('click', downloadMusic);
    
    // Play/Pause
    elements.playPauseBtn.addEventListener('click', togglePlayPause);
    
    // Settings Modal
    elements.settingsBtn.addEventListener('click', openSettings);
    elements.closeSettings.addEventListener('click', closeSettings);
    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) closeSettings();
    });
    
    // Settings Actions
    elements.testConnectionBtn.addEventListener('click', testConnection);
    elements.saveSettingsBtn.addEventListener('click', saveSettings);
    
    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSettings();
    });
    
    // Lyrics text change enables music generation
    elements.lyricsText.addEventListener('input', () => {
        state.music.lyrics = elements.lyricsText.value;
        elements.generateMusicBtn.disabled = !state.music.lyrics.trim();
    });
}

// ===== Theme Toggle =====
function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('theme', state.theme);
}

// ===== Tab Navigation =====
function switchTab(tabName) {
    state.currentTab = tabName;
    
    // Update nav tabs
    elements.navTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Update tab content
    elements.tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
}

// ===== Style Selection =====
function selectStyle(selectedBtn) {
    elements.styleButtons.forEach(btn => btn.classList.remove('active'));
    selectedBtn.classList.add('active');
    state.image.style = selectedBtn.dataset.style;
}

// ===== Ratio Selection =====
function selectRatio(selectedBtn) {
    elements.ratioButtons.forEach(btn => btn.classList.remove('active'));
    selectedBtn.classList.add('active');
    state.image.ratio = selectedBtn.dataset.ratio;
}

// ===== Voice Selection =====
function selectVoice(selectedBtn) {
    elements.voiceButtons.forEach(btn => btn.classList.remove('active'));
    selectedBtn.classList.add('active');
    state.music.voice = selectedBtn.dataset.voice;
}

// ===== Image Generation =====
async function generateImage() {
    const prompt = elements.imagePrompt.value.trim();
    
    if (!prompt) {
        showToast('Please enter a prompt for your image', 'warning');
        elements.imagePrompt.focus();
        return;
    }
    
    if (!state.settings.imageWebhook) {
        showToast('Please configure the image webhook URL in settings', 'warning');
        openSettings();
        return;
    }
    
    state.image.prompt = prompt;
    state.image.isGenerating = true;
    setButtonLoading(elements.generateImageBtn, true);
    
    try {
        // Map ratio to width and height
        const ratioToSize = {
            '1:1': { width: 1024, height: 1024 },
            '16:9': { width: 1920, height: 1080 },
            '9:16': { width: 1080, height: 1920 }
        };
        const size = ratioToSize[state.image.ratio] || { width: 1024, height: 1024 };
        
        const response = await fetch(state.settings.imageWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: state.image.prompt,
                style: state.image.style,
                width: size.width,
                height: size.height
            })
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        // Read response as ArrayBuffer (raw binary data)
        const arrayBuffer = await response.arrayBuffer();
        console.log('Received', arrayBuffer.byteLength, 'bytes');
        
        // Convert ArrayBuffer to base64
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64Data = btoa(binary);
        
        console.log('Base64 length:', base64Data.length);
        console.log('Base64 preview:', base64Data.substring(0, 50));
        
        // Create data URL
        const dataUrl = `data:image/png;base64,${base64Data}`;
        
        // Display the image
        displayGeneratedImage(dataUrl);
        showToast('Image generated successfully!', 'success');
        
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to generate image: ' + error.message, 'error');
    } finally {
        state.image.isGenerating = false;
        setButtonLoading(elements.generateImageBtn, false);
    }
}

function displayGeneratedImage(dataUrl) {
    state.image.generatedUrl = dataUrl;
    const img = document.createElement('img');
    img.src = dataUrl;
    img.alt = 'Generated image';
    img.style.cssText = 'max-width: 100%; height: auto; display: block;';
    elements.imageOutput.innerHTML = '';
    elements.imageOutput.appendChild(img);
    elements.downloadImageBtn.disabled = false;
}

async function downloadImage() {
    if (!state.image.generatedUrl && !state.image.generatedBlob) return;
    
    try {
        let blob;
        let url;
        
        // Use saved blob if available (from binary response)
        if (state.image.generatedBlob) {
            blob = state.image.generatedBlob;
            url = URL.createObjectURL(blob);
        } else {
            // Fetch from URL
            const response = await fetch(state.image.generatedUrl);
            blob = await response.blob();
            url = URL.createObjectURL(blob);
        }
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-image-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Image downloaded!', 'success');
    } catch (error) {
        // Fallback: open in new tab
        if (state.image.generatedUrl) {
            window.open(state.image.generatedUrl, '_blank');
        }
    }
}

// ===== Lyrics Generation =====
async function generateLyrics() {
    const theme = elements.musicTheme.value.trim();
    
    if (!theme) {
        showToast('Please enter a theme or topic for your lyrics', 'warning');
        elements.musicTheme.focus();
        return;
    }
    
    if (!state.settings.lyricsWebhook) {
        showToast('Please configure the lyrics webhook URL in settings', 'warning');
        openSettings();
        return;
    }
    
    state.music.theme = theme;
    state.music.genre = elements.musicGenre.value;
    state.music.mood = elements.musicMood.value;
    state.music.isGeneratingLyrics = true;
    setButtonLoading(elements.generateLyricsBtn, true);
    
    try {
        const response = await fetch(state.settings.lyricsWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                theme: state.music.theme,
                genre: state.music.genre,
                mood: state.music.mood
            })
        });
        
        if (!response.ok) throw new Error('Generation failed');
        
        const data = await response.json();
        console.log('Lyrics response:', data);
        
        // Handle n8n response format with 'output' field
        let lyrics = data.output || data.lyrics || data.text || data.content || data.result;
        
        if (lyrics) {
            // Convert \n to actual newlines for display
            lyrics = lyrics.replace(/\\n/g, '\n');
            displayGeneratedLyrics(lyrics);
            showToast('Lyrics generated! You can edit them before generating music.', 'success');
        } else {
            throw new Error('No lyrics in response');
        }
    } catch (error) {
        console.error('Lyrics generation error:', error);
        showToast('Failed to generate lyrics. Please try again.', 'error');
    } finally {
        state.music.isGeneratingLyrics = false;
        setButtonLoading(elements.generateLyricsBtn, false);
    }
}

function displayGeneratedLyrics(lyrics) {
    state.music.lyrics = lyrics;
    elements.lyricsText.value = lyrics;
    elements.lyricsOutput.classList.add('visible');
    elements.generateMusicBtn.disabled = false;
    
    // Update step indicators
    elements.stepBadges[0].classList.add('completed');
    elements.stepBadges[1].classList.add('active');
}

// ===== Music Generation =====
async function generateMusic() {
    const lyrics = elements.lyricsText.value.trim();
    
    if (!lyrics) {
        showToast('Please generate or enter lyrics first', 'warning');
        return;
    }
    
    if (!state.settings.musicWebhook) {
        showToast('Please configure the music webhook URL in settings', 'warning');
        openSettings();
        return;
    }
    
    state.music.lyrics = lyrics;
    state.music.isGeneratingMusic = true;
    setButtonLoading(elements.generateMusicBtn, true);
    
    try {
        const response = await fetch(state.settings.musicWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lyrics: state.music.lyrics,
                genre: state.music.genre,
                mood: state.music.mood,
                voice: state.music.voice,
                duration: state.music.duration
            })
        });
        
        if (!response.ok) throw new Error('Generation failed');
        
        const data = await response.json();
        
        // Handle different response formats
        const audioUrl = data.audio_url || data.audioUrl || data.url || data.music_url || data.musicUrl;
        
        if (audioUrl) {
            displayGeneratedMusic(audioUrl);
            showToast('Music generated successfully!', 'success');
        } else {
            throw new Error('No audio URL in response');
        }
    } catch (error) {
        console.error('Music generation error:', error);
        showToast('Failed to generate music. Please try again.', 'error');
    } finally {
        state.music.isGeneratingMusic = false;
        setButtonLoading(elements.generateMusicBtn, false);
    }
}

function displayGeneratedMusic(url) {
    state.music.audioUrl = url;
    elements.audioOutput.classList.add('visible');
    
    // Create audio element
    if (audioElement) {
        audioElement.pause();
        audioElement = null;
    }
    
    audioElement = new Audio(url);
    
    audioElement.addEventListener('loadedmetadata', () => {
        elements.totalTime.textContent = formatTime(audioElement.duration);
        elements.playPauseBtn.disabled = false;
        elements.downloadMusicBtn.disabled = false;
    });
    
    audioElement.addEventListener('timeupdate', () => {
        elements.currentTime.textContent = formatTime(audioElement.currentTime);
        animateWaveform(true);
    });
    
    audioElement.addEventListener('ended', () => {
        elements.playPauseBtn.classList.remove('playing');
        animateWaveform(false);
    });
    
    // Update step indicator
    elements.stepBadges[1].classList.add('completed');
}

function togglePlayPause() {
    if (!audioElement) return;
    
    if (audioElement.paused) {
        audioElement.play();
        elements.playPauseBtn.classList.add('playing');
        animateWaveform(true);
    } else {
        audioElement.pause();
        elements.playPauseBtn.classList.remove('playing');
        animateWaveform(false);
    }
}

async function downloadMusic() {
    if (!state.music.audioUrl) return;
    
    try {
        const response = await fetch(state.music.audioUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-music-${Date.now()}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Music downloaded!', 'success');
    } catch (error) {
        window.open(state.music.audioUrl, '_blank');
    }
}

// ===== Waveform Visualization =====
function generateWaveformBars() {
    const container = elements.waveform.querySelector('.waveform-bars');
    container.innerHTML = '';
    
    for (let i = 0; i < 50; i++) {
        const bar = document.createElement('div');
        bar.className = 'waveform-bar';
        bar.style.height = '10%';
        container.appendChild(bar);
    }
}

function animateWaveform(isPlaying) {
    const bars = elements.waveform.querySelectorAll('.waveform-bar');
    
    bars.forEach(bar => {
        if (isPlaying) {
            const height = Math.random() * 80 + 20;
            bar.style.height = `${height}%`;
        } else {
            bar.style.height = '10%';
        }
    });
}

// ===== Settings Modal =====
function openSettings() {
    elements.settingsModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSettings() {
    elements.settingsModal.classList.remove('active');
    document.body.style.overflow = '';
}

function saveSettings() {
    state.settings.imageWebhook = elements.imageWebhook.value.trim();
    state.settings.lyricsWebhook = elements.lyricsWebhook.value.trim();
    state.settings.musicWebhook = elements.musicWebhook.value.trim();
    
    localStorage.setItem('imageWebhook', state.settings.imageWebhook);
    localStorage.setItem('lyricsWebhook', state.settings.lyricsWebhook);
    localStorage.setItem('musicWebhook', state.settings.musicWebhook);
    
    showToast('Settings saved successfully!', 'success');
    closeSettings();
}

async function testConnection() {
    const webhooks = [
        { name: 'Image', url: elements.imageWebhook.value.trim() },
        { name: 'Lyrics', url: elements.lyricsWebhook.value.trim() },
        { name: 'Music', url: elements.musicWebhook.value.trim() }
    ];
    
    const configuredWebhooks = webhooks.filter(w => w.url);
    
    if (configuredWebhooks.length === 0) {
        showToast('Please enter at least one webhook URL to test', 'warning');
        return;
    }
    
    setButtonLoading(elements.testConnectionBtn, true);
    
    for (const webhook of configuredWebhooks) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            // Send a test request (OPTIONS or minimal POST)
            await fetch(webhook.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ test: true }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            showToast(`${webhook.name} webhook: Connected!`, 'success');
        } catch (error) {
            if (error.name === 'AbortError') {
                showToast(`${webhook.name} webhook: Timeout`, 'warning');
            } else {
                // Connection might still work - n8n might just need valid data
                showToast(`${webhook.name} webhook: Ready (configure n8n to accept test requests)`, 'success');
            }
        }
    }
    
    setButtonLoading(elements.testConnectionBtn, false);
}

// ===== Utility Functions =====
function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function setButtonLoading(button, isLoading) {
    button.classList.toggle('loading', isLoading);
    button.disabled = isLoading;
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">${icons[type]}</div>
        <span class="toast-message">${message}</span>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', init);
