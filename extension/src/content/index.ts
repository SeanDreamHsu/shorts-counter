import { initYouTubeDetector } from './youtube';
// TikTok detector disabled - coming soon
// import { initTikTokDetector } from './tiktok';

console.log('Shorts Tracker: Content script loaded');

if (window.location.hostname.includes('youtube.com')) {
    initYouTubeDetector();
} else if (window.location.hostname.includes('tiktok.com')) {
    // TikTok tracking coming soon
    // initTikTokDetector();
    console.log('[Shorts Tracker] TikTok support coming soon!');
}
