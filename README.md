# Multi YouTube Player

A web application that allows users to play multiple YouTube videos simultaneously in a responsive grid layout with individual controls for each video.

## Key Features

- Multiple video playback in a responsive grid
- Smart input that automatically detects YouTube links or search terms
- Individual controls for each video (play/pause, mute/unmute)
- Auto-muted playback by default
- Only one video can have audio playing at a time

## Setup Instructions

1. Clone this repository
2. Ensure all three files are present:
   - `index.html`
   - `script.js`
   - `styles.css`
3. Open `index.html` in a modern web browser

## Usage

Enter either:
- A YouTube URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)
- A search term (e.g., "cute cats")

The system will automatically:
- Add the video directly if a valid YouTube URL is detected
- Show search results if a search term is entered

## Important Implementation Details

### YouTube API Integration

The YouTube IFrame API must be loaded correctly:
```html
<!-- Always use player_api instead of iframe_api -->
<script src="https://www.youtube.com/player_api"></script>
```

### Critical CSS Properties

The video container must maintain these properties for proper video display:
```css
.video-wrapper {
    position: relative;
    aspect-ratio: 16/9;
}

.video-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.video-container iframe {
    position: absolute;
    width: 100%;
    height: 100%;
}
```

### JavaScript Requirements

1. Player initialization must include:
```javascript
playerVars: {
    'playsinline': 1,
    'rel': 0,
    'autoplay': 1,
    'mute': 1,
    'controls': 0,
    'modestbranding': 1,
    'showinfo': 0,
    'enablejsapi': 1
}
```

2. API Ready check:
```javascript
let isYouTubeAPIReady = false;
function onYouTubePlayerAPIReady() {
    isYouTubeAPIReady = true;
}
```

## Troubleshooting

### Video Not Visible
1. Check browser console for YouTube API ready message
2. Verify video container CSS properties (position, dimensions)
3. Ensure video ID is correctly extracted from URL
4. Check if iframe is properly created in the DOM

### Controls Not Working
1. Verify z-index hierarchy (controls should be above video)
2. Check event propagation (use stopPropagation on control events)
3. Ensure control menu has proper positioning and display properties

### Audio Issues
1. Videos should start muted by default
2. Only one video should have audio playing at a time
3. Check mute/unmute toggle functionality

### Input Processing Issues
1. Check if URL validation is working correctly
2. Verify search functionality is properly connected to YouTube Data API
3. Ensure proper error handling for invalid inputs

### Browser Support
- Tested on modern browsers (Chrome, Firefox, Safari)
- Requires JavaScript enabled
- Uses modern CSS features (aspect-ratio)

## Common Fixes

1. If videos are not visible but playing:
   - Check CSS positioning and z-index
   - Verify iframe creation and dimensions

2. If controls are not responding:
   - Check z-index values
   - Verify event listeners are properly attached

3. If API fails to load:
   - Use `player_api` instead of `iframe_api`
   - Verify API ready callback is properly named

4. If videos don't autoplay:
   - Ensure `mute: 1` is set in playerVars
   - Check browser autoplay policies

## Browser Console Checks

Watch for these messages in the console:
- "YouTube API is ready" - Confirms API initialization
- "Player ready" - Confirms successful player creation
- "Video is playing" - Confirms playback started

## Dependencies

- YouTube Player API
- Modern web browser with JavaScript enabled
- No additional libraries required 