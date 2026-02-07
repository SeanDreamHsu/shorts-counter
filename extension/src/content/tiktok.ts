export const initTikTokDetector = () => {
    let isTracking = false;
    let lastUrl = window.location.href;
    let lastVideoSrc = '';

    // State for UI & Persistence
    let sessionStartTime = 0;
    let dailyStats = { totalTime: 0, totalVideos: 0 };
    let statsTimestamp = Date.now();
    let localVideoCount = 0;
    let localTotalTime = 0;

    // Root Host for Shadow DOM
    const host = document.createElement('div');
    host.id = 'tiktok-tracker-host';
    Object.assign(host.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '0',
        height: '0',
        zIndex: '99999',
        pointerEvents: 'none',
    });
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });

    // Container for UI
    const container = document.createElement('div');
    Object.assign(container.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        fontFamily: 'sans-serif',
        pointerEvents: 'none',
    });
    shadow.appendChild(container);

    // Helper to create a capsule
    const createCapsule = (text: string, color = 'white', border = '1px solid rgba(255,255,255,0.2)') => {
        const div = document.createElement('div');
        Object.assign(div.style, {
            padding: '6px 12px',
            background: 'rgba(0,0,0,0.8)',
            color: color,
            borderRadius: '20px',
            fontSize: '12px',
            border: border,
            fontWeight: '500',
            transition: 'all 0.3s ease',
            whiteSpace: 'nowrap',
            boxSizing: 'border-box'
        });
        div.innerText = text;
        return div;
    };

    const countCapsule = createCapsule('0 vids');
    const timeCapsule = createCapsule('0m today');
    const statusCapsule = createCapsule('○ Idle', '#9ca3af', '1px solid transparent');

    container.appendChild(countCapsule);
    container.appendChild(timeCapsule);
    container.appendChild(statusCapsule);

    const formatTimeShort = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const mins = Math.floor(seconds / 60);
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        return `${hours}h ${mins % 60}m`;
    };

    const updateUI = () => {
        timeCapsule.innerText = `${formatTimeShort(localTotalTime)}`;
        countCapsule.innerText = `${localVideoCount} vids`;

        chrome.storage.local.get(['showCapsule', 'visualDecayMode'], (res) => {
            const show = res.showCapsule !== false;
            const decayMode = res.visualDecayMode === true;

            if (!show) {
                container.style.display = 'none';
            } else {
                if (isTracking) {
                    // Ensure it is visible if tracking
                    container.style.display = 'flex';
                } else {
                    // Check paused state visibility logic if consistent with YouTube
                    container.style.display = 'flex';
                }
            }

            // Visual Decay Logic
            if (decayMode) {
                const decayStart = 5;
                const decayMax = 25;
                let grayscale = 0;

                if (localVideoCount > decayStart) {
                    const progress = Math.min(1, (localVideoCount - decayStart) / (decayMax - decayStart));
                    grayscale = progress * 100;
                }

                // TikTok selector is tricky, try body for now but keep our host outside? 
                // Our host is direct child of body. Filter on body affects direct children.
                // We need to target the app wrapper. 
                // Common TikTok wrapper: #app, #main-content-id_react...
                // Let's try #app or #main. If not found, nothing happens.
                const appElement = document.getElementById('app') || document.body;

                if (appElement && appElement !== document.body) {
                    if (grayscale > 0) {
                        appElement.style.filter = `grayscale(${grayscale}%)`;
                    } else {
                        appElement.style.filter = '';
                    }
                } else {
                    // Fallback to body but acknowledge it might gray out UI. 
                    // Wait, shadow dom host is fixed. If body has filter, fixed children are also filtered.
                    // Risk accepted for now on fallback.
                    if (grayscale > 0) {
                        document.body.style.filter = `grayscale(${grayscale}%)`;
                    } else {
                        document.body.style.filter = '';
                    }
                }
            } else {
                const appElement = document.getElementById('app') || document.body;
                if (appElement) appElement.style.filter = '';
            }
        });
    };

    const syncToBackground = () => {
        chrome.runtime.sendMessage({
            type: 'SYNC_SESSION',
            time: localTotalTime,
            count: localVideoCount
        });
    };

    const handleNavigation = () => {
        const isTikTok = location.hostname.includes('tiktok.com');
        // TikTok detection is trickier. Usually "/video/..." or just scroll.
        // Assuming simpler detection for now based on URL or element.
        // Existing detection used URL check mostly.
        const isVideoPage = location.href.includes('/video/') || location.pathname.startsWith('/@');
        const isPageVisible = !document.hidden;
        const video = document.querySelector('video');
        const isVideoPlaying = !!(video && !video.paused && !video.ended);
        const shouldTrack = isTikTok && isVideoPage && isPageVisible && isVideoPlaying;

        // State Logic
        if (shouldTrack) {
            // If we weren't tracking, send ACTIVE
            if (!isTracking) {
                isTracking = true;
                chrome.runtime.sendMessage({
                    type: 'STATE_UPDATE',
                    status: 'ACTIVE',
                    platform: 'tiktok'
                });
            }

            // Check for new video
            if (location.href !== lastUrl) {
                // Scrape Title
                let title = '';
                const titleEl = document.querySelector('[data-e2e="video-desc"], .video-desc, h1');
                if (titleEl) {
                    title = (titleEl as HTMLElement).innerText.trim();
                }
                if (!title) {
                    title = document.title.replace(' | TikTok', '');
                }

                chrome.runtime.sendMessage({
                    type: 'VIDEO_CHANGED',
                    title
                });

                localVideoCount++;
                updateUI();
                // syncToBackground(); // Removed legacy sync
            }
        } else {
            // Not tracking (Paused/Hidden)
            if (isTracking) {
                isTracking = false;
                chrome.runtime.sendMessage({
                    type: 'STATE_UPDATE',
                    status: 'INACTIVE',
                    platform: 'tiktok'
                });
            }
        }

        lastUrl = location.href;
    };

    // Restore State on Load
    chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
        if (response && response.dailyStats) {
            localTotalTime = response.dailyStats.totalTime || 0;
            localVideoCount = response.dailyStats.totalVideos || 0;
            if (response.session && response.session.platform === 'tiktok') {
                isTracking = true;
                // Use accumulatedTime if available
                if (response.session.accumulatedTime !== undefined) {
                    localTotalTime = response.session.accumulatedTime;
                } else {
                    const currentDuration = Date.now() - response.session.startTime;
                    localTotalTime += currentDuration;
                }
            }
            updateUI();
        }
        handleNavigation();
    });

    // Listeners
    // TikTok is SPA, uses History API mostly.
    window.addEventListener('popstate', handleNavigation);
    const observer = new MutationObserver(() => handleNavigation());
    observer.observe(document.body, { childList: true, subtree: true });
    // Also basic interval

    // Polling for UI updates (every second)
    setInterval(() => {
        if (isTracking) {
            localTotalTime += 1000;
            updateUI();
            syncToBackground();
        }
        // handleNavigation(); // MutationObserver handles most checks, but checking video.paused needs polling or events
        // TikTok doesn't fire standard video events reliably for all swipes. Polling video state is safer.
        handleNavigation();
    }, 1000);
    // Listen for settings changes real-time
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.showCapsule) {
            const show = changes.showCapsule.newValue;
            container.style.display = show ? 'flex' : 'none';
        }
    });
};
