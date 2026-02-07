import { initYouTubeDetector } from './youtube';
import { initTikTokDetector } from './tiktok';

console.log('Shorts Tracker: Content script loaded');

if (window.location.hostname.includes('youtube.com')) {
    initYouTubeDetector();
} else if (window.location.hostname.includes('tiktok.com')) {
    initTikTokDetector();
}
