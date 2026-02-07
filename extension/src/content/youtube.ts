export const initYouTubeDetector = () => {
    let lastUrl = location.href;
    let lastSentState: 'ACTIVE' | 'INACTIVE' | null = null;
    let uiInterval: any = null;
    let focusModeBlocker: HTMLElement | null = null;

    // Focus Mode Blocking Logic
    const checkFocusMode = () => {
        chrome.storage.local.get(['focusMode', 'focusBlockScope'], (res) => {
            const focusMode = res.focusMode === true;
            const scope = res.focusBlockScope || 'shorts';
            const isOnShorts = location.pathname.includes('/shorts');

            // Always hide Shorts shelf when Focus Mode is ON
            updateShortsShelfVisibility(focusMode);

            if (focusMode) {
                if (scope === 'fullsite') {
                    // Block entire YouTube
                    showFocusBlocker();
                } else if (scope === 'shorts' && isOnShorts) {
                    // Block only Shorts
                    showFocusBlocker();
                } else {
                    hideFocusBlocker();
                }
            } else {
                hideFocusBlocker();
            }
        });
    };

    const showFocusBlocker = () => {
        if (focusModeBlocker) return; // Already showing

        // Pause any playing video
        const video = document.querySelector('video');
        if (video) video.pause();

        focusModeBlocker = document.createElement('div');
        focusModeBlocker.id = 'shorts-focus-blocker';
        Object.assign(focusModeBlocker.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            backgroundColor: '#0a0a0a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '2147483647',
            fontFamily: 'system-ui, sans-serif',
            color: 'white',
            textAlign: 'center',
            padding: '20px',
            boxSizing: 'border-box'
        });

        focusModeBlocker.innerHTML = `
            <button id="focus-close-x" style="
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(255,255,255,0.1);
                border: none;
                color: #71717a;
                cursor: pointer;
                padding: 8px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: color 0.2s, background 0.2s;
            ">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <div style="font-size: 64px; margin-bottom: 24px;">🛡️</div>
            <h1 style="margin: 0 0 12px 0; font-size: 28px; font-weight: 700;">Focus Mode Active</h1>
            <p style="margin: 0 0 32px 0; color: #71717a; font-size: 16px; max-width: 400px; line-height: 1.5;">
                You've enabled Focus Mode to help you stay productive.<br/>
                Take a deep breath and get back to what matters.
            </p>
            <div style="
                background: rgba(139, 92, 246, 0.15);
                border: 1px solid rgba(139, 92, 246, 0.3);
                padding: 16px 24px;
                border-radius: 12px;
                max-width: 320px;
            ">
                <p style="margin: 0; color: #a78bfa; font-size: 14px; line-height: 1.5;">
                    💡 To disable Focus Mode, click the Shorts Tracker extension icon in your browser toolbar.
                </p>
            </div>
        `;

        document.body.appendChild(focusModeBlocker);

        // Add click handler for close X button
        const closeBtn = document.getElementById('focus-close-x');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                chrome.storage.local.set({ focusMode: false });
                hideFocusBlocker();
            });
            closeBtn.addEventListener('mouseenter', () => {
                (closeBtn as HTMLElement).style.color = 'white';
                (closeBtn as HTMLElement).style.background = 'rgba(255,255,255,0.2)';
            });
            closeBtn.addEventListener('mouseleave', () => {
                (closeBtn as HTMLElement).style.color = '#71717a';
                (closeBtn as HTMLElement).style.background = 'rgba(255,255,255,0.1)';
            });
        }
    };

    const hideFocusBlocker = () => {
        if (focusModeBlocker) {
            focusModeBlocker.remove();
            focusModeBlocker = null;
        }
    };

    // Root Host for Shadow DOM
    const host = document.createElement('div');
    host.id = 'shorts-tracker-host';
    Object.assign(host.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '0',
        height: '0',
        zIndex: '2147483647', // Max Z-index
        pointerEvents: 'none', // Pass through events by default
    });
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });

    // Container for UI (Capsules)
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

    const updateUIDisplay = (totalTime: number, totalVideos: number, isTracking: boolean) => {
        timeCapsule.innerText = formatTimeShort(totalTime);
        countCapsule.innerText = `${totalVideos} vids`;

        chrome.storage.local.get(['showCapsule'], (res) => {
            const show = res.showCapsule !== false; // Default true

            if (!show) {
                container.style.display = 'none';
                return;
            }

            if (isTracking) {
                statusCapsule.innerText = '● Live';
                statusCapsule.style.color = '#4ade80';
                statusCapsule.style.borderColor = '#4ade80';
                container.style.display = 'flex';
            } else {
                statusCapsule.innerText = '○ Paused';
                statusCapsule.style.color = '#fbbf24';
                statusCapsule.style.borderColor = 'transparent';
                container.style.display = 'flex';
            }
        });
    };

    let lastAlertedCount = 0;

    // Break Reminder Modal
    const showBreakReminder = (count: number) => {
        // Check if already exists in shadow root
        if (shadow.getElementById('shorts-break-modal')) return;

        // Pause video immediately
        const video = document.querySelector('video');
        if (video) video.pause();

        const overlay = document.createElement('div');
        overlay.id = 'shorts-break-modal';
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: '0',
            transition: 'opacity 0.5s ease',
            pointerEvents: 'auto'
        });

        const modal = document.createElement('div');
        Object.assign(modal.style, {
            backgroundColor: '#1f1f1f',
            color: 'white',
            padding: '32px',
            borderRadius: '24px',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            maxWidth: '400px',
            width: '90%',
            fontFamily: 'sans-serif',
            transform: 'scale(0.9)',
            transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative' // For absolute positioning of X button
        });

        modal.innerHTML = `
            <button id="shorts-break-close-x" style="
                position: absolute;
                top: 16px;
                right: 16px;
                background: transparent;
                border: none;
                color: #71717a;
                cursor: pointer;
                padding: 4px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: color 0.2s, background 0.2s;
            ">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <div style="font-size: 48px; margin-bottom: 16px;">☕️</div>
            <h2 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 600;">Time for a break?</h2>
            <p style="margin: 0 0 24px 0; color: #a1a1aa; line-height: 1.5; font-size: 16px;">
                You've watched <span style="color: #4ade80; font-weight: bold;">${count} shorts</span> in this session.
                <br/>Maybe take a deep breath or stretch?
            </p>
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button id="shorts-break-exit" style="
                    background: #ef4444; 
                    color: white; 
                    border: none; 
                    padding: 12px 24px; 
                    border-radius: 99px; 
                    font-weight: 600; 
                    cursor: pointer;
                    font-size: 14px;
                    transition: transform 0.1s;
                ">Exit YouTube</button>
            </div>
        `;

        overlay.appendChild(modal);
        shadow.appendChild(overlay);

        // Animate in
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            modal.style.transform = 'scale(1)';
        });

        // Close logic (X button)
        const closeBtn = modal.querySelector('#shorts-break-close-x');
        const closeModal = () => {
            overlay.style.opacity = '0';
            modal.style.transform = 'scale(0.9)';
            setTimeout(() => {
                overlay.remove();
            }, 500);
        };
        closeBtn?.addEventListener('click', closeModal);

        // Hover effect for X button
        closeBtn?.addEventListener('mouseenter', () => {
            (closeBtn as HTMLElement).style.color = 'white';
            (closeBtn as HTMLElement).style.background = 'rgba(255,255,255,0.1)';
        });
        closeBtn?.addEventListener('mouseleave', () => {
            (closeBtn as HTMLElement).style.color = '#71717a';
            (closeBtn as HTMLElement).style.background = 'transparent';
        });

        // Exit logic
        const exitBtn = modal.querySelector('#shorts-break-exit');
        exitBtn?.addEventListener('click', () => {
            chrome.runtime.sendMessage({ type: 'CLOSE_TAB' });
        });
    };

    // Fetch latest data from background to render UI
    const syncUI = () => {
        chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
            if (response && response.dailyStats) {
                const isRemoteTracking = response.session ? response.session.isTracking : false;
                const currentSessionCount = response.session ? response.session.videoCount : 0;

                // Watchdog: If we think we are ACTIVE but remote is NOT currently tracking, we might be desynced.
                if (lastSentState === 'ACTIVE' && !isRemoteTracking) {
                    console.warn('[Content] Desync detected: Local ACTIVE, Remote IDLE. Forcing update.');
                    // Force re-send active state
                    chrome.runtime.sendMessage({
                        type: 'STATE_UPDATE',
                        status: 'ACTIVE',
                        platform: 'youtube'
                    }, (res) => {
                        if (res && res.success) {
                            console.log('[Content] Recovered from desync.');
                        }
                    });
                }

                updateUIDisplay(
                    response.dailyStats.totalTime || 0,
                    response.dailyStats.totalVideos || 0,
                    isRemoteTracking
                );

                // Check for Break Reminder (Every 15 videos)
                // We reset logic if new session (count < last)
                if (currentSessionCount < lastAlertedCount) {
                    lastAlertedCount = 0;
                }

                if (currentSessionCount > 0 && currentSessionCount % 15 === 0 && currentSessionCount !== lastAlertedCount) {
                    showBreakReminder(currentSessionCount);
                    lastAlertedCount = currentSessionCount;
                }

                // Visual Decay Logic
                chrome.storage.local.get(['visualDecayMode'], (res) => {
                    if (res.visualDecayMode) {
                        const decayStart = 5; // Start decaying after 5 videos
                        const decayMax = 25; // Max decay at 25 videos

                        let grayscale = 0;
                        if (currentSessionCount > decayStart) {
                            const progress = Math.min(1, (currentSessionCount - decayStart) / (decayMax - decayStart));
                            grayscale = progress * 100; // 0 to 100%
                        }

                        const appElement = document.querySelector('ytd-app') as HTMLElement;
                        if (appElement) {
                            if (grayscale > 0) {
                                appElement.style.filter = `grayscale(${grayscale}%)`;
                            } else {
                                appElement.style.filter = '';
                            }
                        }
                    } else {
                        // Reset if disabled
                        const appElement = document.querySelector('ytd-app') as HTMLElement;
                        if (appElement && appElement.style.filter.includes('grayscale')) {
                            appElement.style.filter = '';
                        }
                    }
                });
            }
        });
    };

    const recomputeActiveState = () => {
        const isShortsPage = location.pathname.startsWith('/shorts/');
        const isPageVisible = !document.hidden;

        // Find the actual playing video (YouTube often keeps multiple video elements in DOM)
        const videos = Array.from(document.querySelectorAll('video'));
        const playingVideo = videos.find(v => !v.paused && !v.ended && v.readyState > 2);
        const isVideoPlaying = !!playingVideo;

        const shouldTrack = isShortsPage && isPageVisible && isVideoPlaying;
        const newState = shouldTrack ? 'ACTIVE' : 'INACTIVE';

        // 1. Handle Video Count (URL Change)
        // We check URL change separately from state to ensure we catch every scroll
        if (location.href !== lastUrl) {
            // Check focus mode on URL change (SPA navigation)
            checkFocusMode();

            if (isShortsPage) {
                // Scrape Title
                // Try multiple selectors common in Shorts
                let title = '';
                const titleEl = document.querySelector('ytd-reel-video-renderer[is-active] .yt-shorts-video-title, ytd-reel-video-renderer[is-active] h2.title');
                if (titleEl) {
                    title = (titleEl as HTMLElement).innerText.trim();
                }

                // If not found, try document title fallback (clean up " - YouTube")
                if (!title) {
                    title = document.title.replace(' - YouTube', '');
                }

                // If we are on shorts and url changed, it's a new video
                chrome.runtime.sendMessage({ type: 'VIDEO_CHANGED', title });
                // Force an immediate UI sync to show the count jump
                setTimeout(syncUI, 50);
            }
            lastUrl = location.href;
        }

        // 2. Handle State Change (Pause/Play/Hide)
        if (newState !== lastSentState) {
            console.log(`[Content] State changed: ${lastSentState} -> ${newState}`);

            // Optimistically update local state to avoid rapid-fire loops
            const prevState = lastSentState;
            lastSentState = newState;

            chrome.runtime.sendMessage({
                type: 'STATE_UPDATE',
                status: newState,
                platform: 'youtube'
            }, (response) => {
                // Confirmation logic
                if (chrome.runtime.lastError) {
                    console.error('[Content] Message failed:', chrome.runtime.lastError);
                    // Revert state so we retry next tick
                    lastSentState = prevState;
                } else if (!response || !response.success) {
                    // Handled error or rejected
                    console.warn('[Content] Server rejected state update:', response);
                } else {
                    // Success - immediate UI sync to feel responsive
                    syncUI();
                }
            });
        }
    };

    // Listeners
    window.addEventListener('yt-navigate-finish', recomputeActiveState);
    window.addEventListener('popstate', recomputeActiveState);
    document.addEventListener('visibilitychange', recomputeActiveState);

    // Video events - we need to attach to the video element. 
    // Since YouTube is SPA, video element might stay same or change.
    // We can use a MutationObserver or just a global capture listener if possible.
    // Easier: Add listeners to 'play', 'pause', 'waiting' on document with capture phase.
    document.addEventListener('play', recomputeActiveState, true);
    document.addEventListener('pause', recomputeActiveState, true);
    document.addEventListener('ended', recomputeActiveState, true);
    document.addEventListener('playing', recomputeActiveState, true); // For buffering recovery

    // Polling for UI updates (every second)
    // This now ONLY updates the UI visuals, it does NOT calculate time.
    // It also acts as a "watchdog" to correct state if events missed.
    setInterval(() => {
        recomputeActiveState(); // Ensure state is correct (watchdog)
        syncUI(); // Update UI numbers
    }, 1000);

    // --- Hide Shorts Shelf Logic ---
    let shortsShelfStyle: HTMLStyleElement | null = null;

    const updateShortsShelfVisibility = (hide: boolean) => {
        if (hide) {
            if (!shortsShelfStyle) {
                shortsShelfStyle = document.createElement('style');
                shortsShelfStyle.id = 'shorts-tracker-hide-shelf';
                shortsShelfStyle.textContent = `
                    /* Hide Shorts shelf on homepage and other pages */
                    ytd-rich-shelf-renderer[is-shorts],
                    ytd-reel-shelf-renderer,
                    ytd-shorts-shelf-renderer,
                    ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]),
                    ytd-rich-section-renderer:has([is-shorts]),
                    /* Hide Shorts in sidebar */
                    ytd-mini-guide-entry-renderer[aria-label="Shorts"],
                    ytd-guide-entry-renderer:has(a[title="Shorts"]),
                    /* Hide Shorts tab on channel pages */
                    yt-tab-shape[tab-title="Shorts"],
                    tp-yt-paper-tab:has([tab-title="Shorts"]) {
                        display: none !important;
                    }
                `;
                document.head.appendChild(shortsShelfStyle);
            }
        } else {
            if (shortsShelfStyle) {
                shortsShelfStyle.remove();
                shortsShelfStyle = null;
            }
        }
    };

    // Listen for settings changes real-time
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
            if (changes.showCapsule) {
                const show = changes.showCapsule.newValue;
                container.style.display = show ? 'flex' : 'none';
            }
            if (changes.focusMode || changes.focusBlockScope) {
                checkFocusMode();
            }
        }
    });

    // Initial check - run immediately plus retries to ensure it applies after YouTube SPA hydration
    checkFocusMode(); // Immediate
    setTimeout(checkFocusMode, 500);
    setTimeout(checkFocusMode, 1500); // Retry after YouTube content loads
    setTimeout(recomputeActiveState, 1000); // Wait for DOM
};
