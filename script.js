let players = [];
let currentlyPlayingPlayer = null;
let isYouTubeAPIReady = false;
const API_KEY = 'AIzaSyDpzhEusfCARiU40mNhGEU2HjbKAR9KrSc'; // Replace with your YouTube Data API key
let isGapiReady = false;
let gapiInitializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

// Initialize Google API client
async function initGapi() {
    console.log('Initializing Google API client...');
    if (gapiInitializationAttempts >= MAX_INIT_ATTEMPTS) {
        throw new Error('Failed to initialize after multiple attempts');
    }
    gapiInitializationAttempts++;

    try {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest']
        });
        isGapiReady = true;
        console.log('Google API client initialized successfully');
    } catch (error) {
        console.error('Error initializing Google API client:', error);
        throw error;
    }
}

// Load and initialize Google API client
function loadGapiClient() {
    return new Promise((resolve, reject) => {
        gapi.load('client', async () => {
            try {
                await initGapi();
                resolve();
            } catch (error) {
                console.error('Error loading Google API client:', error);
                reject(error);
            }
        });
    });
}

// This function is called automatically by YouTube API when it's ready
function onYouTubePlayerAPIReady() {
    console.log('YouTube API is ready');
    isYouTubeAPIReady = true;
    // Initialize Google API after YouTube API is ready
    loadGapiClient()
        .then(() => console.log('Google API loaded successfully'))
        .catch(error => console.error('Failed to load Google API:', error));
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 3000);
}

function updateHeaderAndWelcomeVisibility() {
    const header = document.querySelector('.header-content');
    const welcome = document.getElementById('welcome-message');
    const videoGrid = document.getElementById('videoGrid');
    
    if (videoGrid.children.length === 0) {
        // No videos - show header and welcome message
        header.classList.remove('hidden');
        welcome.style.display = 'block';
        setTimeout(() => {
            welcome.classList.remove('hidden');
        }, 10);
    } else {
        // Has videos - hide welcome message immediately
        welcome.classList.add('hidden');
        welcome.style.display = 'none';
    }
}

async function searchVideos() {
    if (!isYouTubeAPIReady) {
        showError('Please wait for YouTube player to initialize...');
        return;
    }

    const searchQuery = document.getElementById('searchQuery').value.trim();
    if (!searchQuery) {
        showError('Please enter a search term');
        return;
    }

    try {
        showError('Searching videos...');
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&key=${API_KEY}&type=video&maxResults=9&videoEmbeddable=true`
        );
        
        if (!response.ok) {
            throw new Error('Search request failed');
        }

        const data = await response.json();
        const videos = data.items;

        if (!videos || videos.length === 0) {
            showError('No videos found for your search');
            return;
        }

        // Clear search input
        document.getElementById('searchQuery').value = '';

        // Add all videos to the grid
        videos.forEach(video => {
            const videoId = video.id.videoId;
            addVideoById(videoId);
        });

    } catch (error) {
        console.error('Error searching videos:', error);
        showError('Error searching YouTube videos. Please try again.');
    }
}

function removeVideo(wrapper, playerId) {
    // Find and remove the player
    const playerToRemove = players.find(p => p.playerId === playerId);
    if (playerToRemove && playerToRemove.player) {
        try {
            // Stop the video first
            playerToRemove.player.stopVideo();
            // Then destroy the player
            playerToRemove.player.destroy();
        } catch (error) {
            console.error('Error destroying player:', error);
        }
    }
    
    // Remove from players array
    players = players.filter(p => p.playerId !== playerId);
    
    // Remove from DOM
    if (wrapper && wrapper.parentNode) {
        wrapper.remove();
    }
    
    // Update visibility
    updateHeaderAndWelcomeVisibility();
}

function addVideoById(videoId) {
    const videoGrid = document.getElementById('videoGrid');
    
    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'video-wrapper';
    
    // Create video container
    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    const playerId = 'player-' + Date.now() + '-' + videoId;
    videoContainer.id = playerId;
    
    // Create controls container
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'controls-container';
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'control-button close';
    closeButton.innerHTML = '❌';
    closeButton.title = 'Remove Video';
    
    // Add button to controls
    controlsContainer.appendChild(closeButton);
    
    // Add elements to wrapper
    wrapper.appendChild(controlsContainer);
    wrapper.appendChild(videoContainer);
    videoGrid.appendChild(wrapper);

    // Hide welcome message immediately after adding first video
    const welcome = document.getElementById('welcome-message');
    welcome.classList.add('hidden');
    welcome.style.display = 'none';

    // Close button functionality
    closeButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        removeVideo(wrapper, playerId);
    });

    try {
        // Create new player instance
        const player = new YT.Player(playerId, {
            height: '100%',
            width: '100%',
            videoId: videoId,
            playerVars: {
                'playsinline': 1,
                'rel': 0,
                'autoplay': 1,
                'mute': 1,
                'controls': 1,
                'modestbranding': 1,
                'showinfo': 0,
                'enablejsapi': 1,
                'origin': window.location.origin
            },
            events: {
                'onReady': function(event) {
                    console.log('Player ready');
                    const iframe = event.target.getIframe();
                    iframe.style.display = 'block';
                    event.target.playVideo();
                    
                    // Store player with its ID
                    players.push({
                        player: event.target,
                        playerId: playerId,
                        wrapper: wrapper
                    });

                    // Update visibility after adding video
                    updateHeaderAndWelcomeVisibility();
                },
                'onStateChange': function(event) {
                    if (event.data === YT.PlayerState.PLAYING) {
                        console.log('Video is playing');
                    }
                },
                'onError': function(event) {
                    console.error('Player error:', event.data);
                    if (event.data === 2) {
                        showError('Invalid video ID');
                        removeVideo(wrapper, playerId);
                    } else if (event.data === 5 || event.data === 100 || event.data === 101 || event.data === 150) {
                        showError('Video cannot be played due to restrictions');
                        removeVideo(wrapper, playerId);
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating player:', error);
        showError('Error loading video player');
        removeVideo(wrapper, playerId);
    }
}

// Modify the existing addVideo function to use addVideoById
function addVideo() {
    if (!isYouTubeAPIReady) {
        showError('YouTube API is not ready yet. Please try again in a moment.');
        return;
    }

    const videoUrl = document.getElementById('videoUrl').value.trim();
    if (!videoUrl) {
        showError('Please enter a YouTube URL');
        return;
    }

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
        showError('Invalid YouTube URL. Please check the URL and try again.');
        return;
    }

    document.getElementById('videoUrl').value = '';
    addVideoById(videoId);
}

function extractVideoId(url) {
    const patterns = [
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/i,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^/?]+)/i,
        /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^/?]+)/i,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^/?]+)/i
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

// Update header visibility based on mouse position only when videos exist
let headerTimeout;
document.addEventListener('mousemove', (e) => {
    const videoGrid = document.getElementById('videoGrid');
    const header = document.querySelector('.header-content');
    
    if (videoGrid.children.length > 0) {
        if (e.clientY < 150) {
            header.classList.remove('hidden');
            clearTimeout(headerTimeout);
        } else {
            clearTimeout(headerTimeout);
            headerTimeout = setTimeout(() => {
                header.classList.add('hidden');
            }, 1000);
        }
    }
});

// Initial visibility check
document.addEventListener('DOMContentLoaded', updateHeaderAndWelcomeVisibility);

// Add this at the bottom of the file with other event listeners
document.addEventListener('DOMContentLoaded', () => {
    updateHeaderAndWelcomeVisibility();
});