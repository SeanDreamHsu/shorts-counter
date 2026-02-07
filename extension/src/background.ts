interface Session {
    id: string;
    startTime: number;
    endTime: number;
    videoCount: number;
    platform: 'youtube' | 'tiktok';
    accumulatedTime: number; // Actual time spent watching
    videoLog?: { title: string, timestamp: number }[];
}

interface StorageState {
    currentSession: {
        startTime: number;
        videoCount: number;
        platform: 'youtube' | 'tiktok';
        accumulatedTime: number; // Time accumulated BEFORE the current active period
        lastResumeTime: number | null; // If tracking, this is when it started
        isTracking: boolean;
        videoLog: { title: string, timestamp: number }[];
    } | null;
    history: Session[];
    activeTabId: number | null;
    trackingTabId: number | null;
    dailyStats: { [date: string]: { totalTime: number, totalVideos: number } };
}

// Mutex for serialization
let operationQueue = Promise.resolve();

// Helper to get state
const getState = async (): Promise<StorageState> => {
    const result = await chrome.storage.local.get(['currentSession', 'history', 'activeTabId', 'trackingTabId', 'dailyStats']);
    return {
        currentSession: (result.currentSession as any) || null,
        history: (result.history as any) || [],
        activeTabId: (result.activeTabId as any) || null,
        trackingTabId: (result.trackingTabId as any) || null,
        dailyStats: (result.dailyStats as any) || {}
    };
};

const setState = (state: Partial<StorageState>): Promise<void> => {
    return chrome.storage.local.set(state);
};

// Message Handler
chrome.runtime.onMessage.addListener((message: { type: string, platform?: 'youtube' | 'tiktok', status?: 'ACTIVE' | 'INACTIVE', title?: string }, sender, sendResponse) => {
    const { type, platform, status, title } = message;

    // Chain operations to ensure serialization
    // Important: We need to return true immediately to keep sendResponse valid for async operations
    const promise = operationQueue.then(async () => {
        try {
            // console.log(`[Background] Processing: ${type}`, message); // Debug log (can remove for prod)

            if (type === 'STATE_UPDATE') {
                const result = await handleStateUpdate(status!, platform!, sender.tab?.id);
                sendResponse(result);
            } else if (type === 'VIDEO_CHANGED') {
                await incrementCount(title);
                sendResponse({ success: true });
            } else if (type === 'GET_STATUS') {
                const status = await getRealtimeStatus();
                sendResponse(status);
            } else if (type === 'GET_DAILY_STATS') {
                const state = await getState();
                const today = new Date().toDateString();
                const stats = state.dailyStats?.[today] || { totalTime: 0, totalVideos: 0 };

                // Add current session time if active
                if (state.currentSession) {
                    const sessionTime = Date.now() - state.currentSession.startTime + (state.currentSession.accumulatedTime || 0);
                    stats.totalTime += sessionTime;
                    stats.totalVideos += state.currentSession.videoCount;
                }

                sendResponse(stats);
            } else if (type === 'CLOSE_TAB') {
                if (sender.tab?.id) {
                    chrome.tabs.remove(sender.tab.id);
                }
                sendResponse({ success: true });
            }
            // All paths that need to sendResponse are handled, we resolve the promise

        } catch (err) {
            console.error('[Background] Error processing message:', err);
        }
    });

    // Update queue
    operationQueue = promise;

    return true; // Keep channel open for sendResponse
});

// Calculate current totals including any active tracking time
const getRealtimeStatus = async () => {
    const state = await getState();
    if (!state.currentSession) return { dailyStats: { totalTime: 0, totalVideos: 0 }, session: null };

    const { accumulatedTime, lastResumeTime, isTracking, videoCount, startTime, platform } = state.currentSession;

    // Calculate current duration
    let currentTotalTime = accumulatedTime;
    if (isTracking && lastResumeTime) {
        currentTotalTime += (Date.now() - lastResumeTime);
    }

    // Get stats from history for today to add to daily total? 
    // For now, let's just return current session stats + maybe we can do daily aggregation later if requested.
    // The previous implementation had 'dailyStats'. Let's reconstruct it briefly or just wait for History feature.
    // Re-implementing simplified "all time/daily" aggregation from history later.
    // For now, "dailyStats" will just reflect current session for simplicity unless I scan history.
    // Let's scan history for today's stats quickly.

    const today = new Date().setHours(0, 0, 0, 0);
    const todaysSessions = state.history.filter(s => s.startTime >= today);
    const historyTime = todaysSessions.reduce((acc, s) => acc + (s.accumulatedTime || (s.endTime - s.startTime)), 0);
    const historyVideos = todaysSessions.reduce((acc, s) => acc + s.videoCount, 0);

    return {
        dailyStats: {
            totalTime: historyTime + currentTotalTime,
            totalVideos: historyVideos + videoCount
        },
        session: {
            startTime,
            platform,
            accumulatedTime: currentTotalTime,
            videoCount,
            isTracking
        }
    };
};

const handleStateUpdate = async (status: 'ACTIVE' | 'INACTIVE', platform: 'youtube' | 'tiktok', tabId?: number) => {
    let state = await getState();

    // Initialize session if needed
    if (!state.currentSession) {
        if (status === 'ACTIVE') {
            await startSession(platform, tabId);
            // Refresh state after start
            state = await getState();
        } else {
            return; // Ignore inactive if no session exists
        }
    }

    // Safety check: if platform changed (unlikely with just YouTube for now), restart
    if (state.currentSession && state.currentSession.platform !== platform) {
        await stopSession();
        if (status === 'ACTIVE') {
            await startSession(platform, tabId);
            state = await getState();
        } else {
            return;
        }
    }

    const session = state.currentSession!;
    let isTracking = session.isTracking;

    if (status === 'ACTIVE') {
        // If already tracking, do nothing. If not, resume.
        if (!session.isTracking) {
            isTracking = true;
            await setState({
                currentSession: {
                    ...session,
                    isTracking: true,
                    lastResumeTime: Date.now()
                },
                trackingTabId: tabId || state.trackingTabId
            });
        }
    } else {
        // INACTIVE
        // If currently tracking, pause and accumulate time.
        if (session.isTracking && session.lastResumeTime) {
            const addedTime = Date.now() - session.lastResumeTime;
            isTracking = false;
            await setState({
                currentSession: {
                    ...session,
                    isTracking: false,
                    lastResumeTime: null,
                    accumulatedTime: session.accumulatedTime + addedTime
                }
            });
        }
    }

    return { success: true, isTracking };
};

const startSession = async (platform: 'youtube' | 'tiktok', tabId?: number) => {
    const newState = {
        currentSession: {
            startTime: Date.now(),
            videoCount: 0,
            platform,
            accumulatedTime: 0,
            lastResumeTime: Date.now(),
            isTracking: true,
            videoLog: []
        },
        trackingTabId: tabId || null
    };
    await setState(newState);
};

const stopSession = async () => {
    const state = await getState();
    if (!state.currentSession) return;

    const { startTime, videoCount, platform, accumulatedTime, lastResumeTime, isTracking, videoLog } = state.currentSession;

    let finalTime = accumulatedTime;
    if (isTracking && lastResumeTime) {
        finalTime += (Date.now() - lastResumeTime);
    }

    const newSession: Session = {
        id: crypto.randomUUID(),
        startTime,
        endTime: Date.now(),
        videoCount,
        platform,
        accumulatedTime: finalTime,
        videoLog: videoLog || []
    };

    await setState({
        currentSession: null,
        trackingTabId: null,
        history: [newSession, ...state.history]
    });
    console.log('[Background] Session stopped', newSession);
};

const incrementCount = async (title?: string) => {
    const state = await getState();
    if (!state.currentSession) return;

    const newLog = [...(state.currentSession.videoLog || [])];
    if (title) {
        newLog.push({ title, timestamp: Date.now() });
    }

    setState({
        currentSession: {
            ...state.currentSession,
            videoCount: state.currentSession.videoCount + 1,
            videoLog: newLog
        }
    });
};

// Tab Removal Listener
chrome.tabs.onRemoved.addListener(async (tabId) => {
    const state = await getState();
    if (state.currentSession && state.trackingTabId === tabId) {
        await stopSession();
    }
});

// Tab Update Listener (for navigation away)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        const state = await getState();
        if (state.currentSession && state.trackingTabId === tabId) {
            if (tab.url && !tab.url.includes('youtube.com/shorts') && !tab.url.includes('tiktok.com')) {
                await stopSession();
            }
        }
    }
});

