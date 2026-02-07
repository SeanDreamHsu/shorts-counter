import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Timer, BarChart2, PlayCircle, Zap, Brain, Gamepad2, Smile, TrendingUp, Ghost, Shield, ShieldOff } from 'lucide-react'
import GlassSurface from './components/GlassSurface'
import MagicCard, { MagicGrid } from './components/MagicCard'
import './index.css'

// --- Content Analysis Logic ---
const analyzeVibe = (videoLog: { title: string, timestamp: number }[]) => {
    if (!videoLog || videoLog.length === 0) return { vibe: "Neutral", icon: Zap, color: "text-gray-400" };

    const keywords = {
        learning: ['tutorial', 'how to', 'learn', 'course', 'guide', 'tips', 'documentary', 'science', 'math', 'code', 'build'],
        gaming: ['game', 'play', 'minecraft', 'roblox', 'fortnite', 'valorant', 'league', 'stream', 'twitch'],
        entertainment: ['funny', 'meme', 'comedy', 'prank', 'fail', 'challenge', 'react', 'laugh'],
        brainrot: ['skibidi', 'sigma', 'gyatt', 'rizz', 'only in ohio', 'fanum', 'tax']
    };

    let scores = { learning: 0, gaming: 0, entertainment: 0, brainrot: 0 };

    videoLog.forEach(v => {
        const lowerTitle = v.title.toLowerCase();
        if (keywords.brainrot.some(k => lowerTitle.includes(k))) scores.brainrot += 3; // Weighted higher
        else if (keywords.learning.some(k => lowerTitle.includes(k))) scores.learning++;
        else if (keywords.gaming.some(k => lowerTitle.includes(k))) scores.gaming++;
        else if (keywords.entertainment.some(k => lowerTitle.includes(k))) scores.entertainment++;
    });

    // Determine dominant vibe
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) return { vibe: "Mixed", icon: Zap, color: "text-blue-400" };

    if (scores.brainrot === maxScore) return { vibe: "Pure Brain Rot", icon: Ghost, color: "text-purple-400" };
    if (scores.learning === maxScore) return { vibe: "Knowledge Hunter", icon: Brain, color: "text-emerald-400" };
    if (scores.gaming === maxScore) return { vibe: "Gamer Mode", icon: Gamepad2, color: "text-indigo-400" };
    return { vibe: "Comedy Gold", icon: Smile, color: "text-yellow-400" };
}

interface Session {
    startTime: number;
    videoCount: number;
    videoLog?: { title: string, timestamp: number }[];
    accumulatedTime?: number;
}

function Popup() {
    const [session, setSession] = useState<Session | null>(null)
    const [elapsed, setElapsed] = useState(0)
    const [experimentalMode, setExperimentalMode] = useState(false)
    const [focusMode, setFocusMode] = useState(false)
    const [dailyTimeLimitEnabled, setDailyTimeLimitEnabled] = useState(false)
    const [dailyTimeLimit, setDailyTimeLimit] = useState(30)
    const [dailyTimeUsed, setDailyTimeUsed] = useState(0)

    useEffect(() => {
        // Initial fetch
        chrome.storage.local.get(['currentSession', 'experimentalMode', 'focusMode', 'dailyTimeLimitEnabled', 'dailyTimeLimit'], (result: any) => {
            setSession(result.currentSession || null)
            if (result.experimentalMode) setExperimentalMode(result.experimentalMode)
            if (result.focusMode) setFocusMode(result.focusMode)
            if (result.dailyTimeLimitEnabled !== undefined) setDailyTimeLimitEnabled(result.dailyTimeLimitEnabled)
            if (result.dailyTimeLimit !== undefined) setDailyTimeLimit(result.dailyTimeLimit)
        })

        // Fetch daily stats
        chrome.runtime.sendMessage({ type: 'GET_DAILY_STATS' }, (response) => {
            if (response?.totalTime) setDailyTimeUsed(response.totalTime)
        })

        // Listen for updates
        const listener = (changes: any, areaName: string) => {
            if (areaName === 'local') {
                if (changes.currentSession) setSession(changes.currentSession.newValue)
                if (changes.experimentalMode) setExperimentalMode(changes.experimentalMode.newValue)
                if (changes.focusMode) setFocusMode(changes.focusMode.newValue)
                if (changes.dailyTimeLimitEnabled) setDailyTimeLimitEnabled(changes.dailyTimeLimitEnabled.newValue)
                if (changes.dailyTimeLimit) setDailyTimeLimit(changes.dailyTimeLimit.newValue)
            }
        }
        chrome.storage.onChanged.addListener(listener)

        // Refresh daily stats every 5 seconds
        const statsInterval = setInterval(() => {
            chrome.runtime.sendMessage({ type: 'GET_DAILY_STATS' }, (response) => {
                if (response?.totalTime) setDailyTimeUsed(response.totalTime)
            })
        }, 5000)

        return () => {
            chrome.storage.onChanged.removeListener(listener)
            clearInterval(statsInterval)
        }
    }, [])

    useEffect(() => {
        let interval: any;
        if (session) {
            // If session tracks accumulatedTime, use that.
            // Fallback to simpler calc if not present.
            // Since stats are now actively synced by content logic, we rely on session state updates.
            // We can assume session.accumulatedTime is the source of truth if available.
            const baseTime = (session as any).accumulatedTime || 0; // cast since type might not be updated in popup.tsx check

            // If we are relying on background pushing updates, we just set elapsed to that.
            // But we might want smooth seconds between updates.
            // However, if we are paused, we don't want to increment.
            // If we are playing, content script updates every 1s, so storage changes, so this listener triggers.
            // So we purely display what is in storage! No more setInterval simulation in popup 
            // OR we interpolate if we want smoothness, but raw sync is accurate for "pausing".

            setElapsed(baseTime);

            // We can effectively remove the setInterval simulation if the update rate from storage is 1s.
            // This prevents "running ahead" when paused.
        } else {
            setElapsed(0)
        }
        return () => clearInterval(interval)
    }, [session])

    const toggleExperimental = () => {
        const newValue = !experimentalMode
        setExperimentalMode(newValue)
        chrome.storage.local.set({ experimentalMode: newValue })
    }

    const toggleFocusMode = () => {
        const newValue = !focusMode
        setFocusMode(newValue)
        chrome.storage.local.set({ focusMode: newValue })
    }

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000)
        const minutes = Math.floor(totalSeconds / 60)
        const seconds = totalSeconds % 60
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    const openDashboard = () => {
        chrome.runtime.openOptionsPage()
    }

    const OriginalContent = () => (
        <>
            <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
                <div className="text-center space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Session Time</span>
                    <div className="text-6xl font-sans font-bold tracking-tighter tabular-nums text-foreground animate-in zoom-in-50 duration-300">
                        {formatTime(elapsed)}
                    </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-full text-xs text-secondary-foreground border border-border/50">
                    <PlayCircle className="w-3 h-3" />
                    <span>{session ? `${session.videoCount} videos` : 'Ready to track'}</span>
                </div>
            </main>

            <footer className="p-4 border-t bg-card/30 space-y-2">
                <button
                    onClick={openDashboard}
                    className="w-full flex items-center justify-center gap-2 h-9 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                    <BarChart2 className="w-4 h-4" />
                    Open Dashboard
                </button>
            </footer>
        </>
    )

    // Using require here to avoid import issues if not using full module resolution, 
    // but typically imports are top-level. For simplicity in this edit, I'll use the component if imported.
    // Wait, I need to import it at the top. Let me revise the file content completely to include import.
    // To do that in one go, replacement needs to include top. 
    // For this ReplaceFileContent tool, I only replace function body? 
    // Actually, I should probably use ViewFile -> ReplaceFileContent for full file if I want to add import.
    // The instructions say "ReplaceFileContent... a single contiguous block".
    // I need to add import. I'll revert and use MultiReplace or just replace the whole file content.
    // Replacing the function body only prevents adding imports.
    // I will replace the whole return block and add the toggling logic, but imports are tricky without MultiReplace or logic.
    // Let me try to just modify the component logic first, assuming I can add the import in a separate step or assume it's available (which it isn't).

    // Plan: 
    // 1. Add import (top of file)
    // 2. Update component (function body)

    // I'll do this in two chunks using MultiReplaceFileContent which is safer for adding imports.
    // Vibe Check
    const currentVibe = React.useMemo(() => {
        return session && session.videoLog ? analyzeVibe(session.videoLog) : { vibe: "No Data", icon: Zap, color: "text-muted-foreground" };
    }, [session]);

    // Light Mode Content (White Theme)
    const LightContent = () => (
        <main className="flex-1 flex flex-col gap-3 p-4">
            {/* Main Stats Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-400 uppercase font-semibold tracking-wider">今日时长</span>
                    <div className="h-9 w-9 bg-violet-50 rounded-xl flex items-center justify-center text-violet-500 hover:bg-violet-100 transition-colors">
                        <Timer className="w-4 h-4" />
                    </div>
                </div>
                <div className="text-4xl font-bold text-gray-900 tracking-tight">
                    {Math.floor(dailyTimeUsed / 60000)}<span className="text-xl text-gray-400 ml-1">分钟</span>
                </div>

                {/* Progress Bar */}
                {dailyTimeLimitEnabled && (
                    <div className="mt-4">
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${dailyTimeUsed >= dailyTimeLimit * 60000 ? 'bg-red-500' :
                                    dailyTimeUsed >= dailyTimeLimit * 60000 * 0.8 ? 'bg-amber-400' :
                                        'bg-emerald-400'
                                    }`}
                                style={{ width: `${Math.min(100, (dailyTimeUsed / (dailyTimeLimit * 60000)) * 100)}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-xs">
                            <span className={dailyTimeUsed >= dailyTimeLimit * 60000 ? 'text-red-500 font-medium' : 'text-gray-400'}>
                                {Math.floor(dailyTimeUsed / 60000)} / {dailyTimeLimit} 分钟
                            </span>
                            <span className="text-gray-400">
                                {dailyTimeUsed >= dailyTimeLimit * 60000
                                    ? '已超限!'
                                    : `剩余 ${Math.max(0, dailyTimeLimit - Math.floor(dailyTimeUsed / 60000))} 分钟`
                                }
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-3">
                {/* Video Count */}
                <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 group">
                    <span className="text-xs text-gray-400 uppercase font-semibold tracking-wider">视频</span>
                    <div className="flex items-baseline gap-1.5 mt-2">
                        <span className="text-3xl font-bold text-gray-900 group-hover:text-violet-600 transition-colors">{session ? session.videoCount : 0}</span>
                        <span className="text-xs text-gray-400">个</span>
                    </div>
                </div>

                {/* Vibe Check */}
                <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 group">
                    <span className="text-xs text-gray-400 uppercase font-semibold tracking-wider">氛围</span>
                    <div className="flex items-center gap-2 mt-2">
                        <currentVibe.icon className={`w-5 h-5 ${currentVibe.color} group-hover:scale-110 transition-transform`} />
                        <span className={`text-sm font-semibold ${currentVibe.color}`}>{currentVibe.vibe}</span>
                    </div>
                </div>
            </div>

            {/* Focus Mode Toggle */}
            <button
                onClick={toggleFocusMode}
                className={`rounded-2xl p-4 flex items-center justify-between transition-all duration-200 ${focusMode
                    ? 'bg-red-50 hover:bg-red-100'
                    : 'bg-white hover:bg-gray-50 shadow-sm hover:shadow-md'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${focusMode ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
                        {focusMode ? <Shield className="w-5 h-5" /> : <ShieldOff className="w-5 h-5" />}
                    </div>
                    <div className="text-left">
                        <div className={`font-semibold text-sm ${focusMode ? 'text-red-600' : 'text-gray-900'}`}>
                            {focusMode ? '专注模式已开启' : '专注模式'}
                        </div>
                        <div className={`text-xs ${focusMode ? 'text-red-400' : 'text-gray-400'}`}>
                            {focusMode ? 'Shorts 已被屏蔽' : '屏蔽 Shorts 并隐藏推荐'}
                        </div>
                    </div>
                </div>
                <div className={`w-11 h-6 rounded-full transition-colors relative ${focusMode ? 'bg-red-500' : 'bg-gray-200'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ease-out ${focusMode ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
            </button>

            {/* Dashboard Button */}
            <button
                onClick={openDashboard}
                className="bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white font-semibold rounded-2xl p-4 flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
            >
                <BarChart2 className="w-4 h-4" />
                查看详细统计
            </button>
        </main>
    )

    // Dark Mode Content (Liquid Glass Theme with Magic Cards)
    const DarkContent = () => (
        <MagicGrid className="flex-1 grid grid-cols-2 gap-2.5 p-3.5">
            {/* Main Stats (Full Width) */}
            <MagicCard className="col-span-2" glowColor="139, 92, 246" glowRadius={250}>
                <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-white/50 uppercase font-bold tracking-wider">Today's Time</span>
                        <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                            <Timer className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-3xl font-sans font-bold tracking-tighter tabular-nums text-white">
                        {Math.floor(dailyTimeUsed / 60000)}m
                    </div>

                    {/* Progress Bar */}
                    {dailyTimeLimitEnabled && (
                        <div className="mt-3">
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${dailyTimeUsed >= dailyTimeLimit * 60000 ? 'bg-red-500' :
                                        dailyTimeUsed >= dailyTimeLimit * 60000 * 0.8 ? 'bg-amber-500' :
                                            'bg-emerald-500'
                                        }`}
                                    style={{ width: `${Math.min(100, (dailyTimeUsed / (dailyTimeLimit * 60000)) * 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-1.5 text-xs">
                                <span className={dailyTimeUsed >= dailyTimeLimit * 60000 ? 'text-red-400' : 'text-white/50'}>
                                    {Math.floor(dailyTimeUsed / 60000)}m / {dailyTimeLimit}m
                                </span>
                                <span className="text-white/50">
                                    {dailyTimeUsed >= dailyTimeLimit * 60000
                                        ? 'Limit reached!'
                                        : `${Math.max(0, dailyTimeLimit - Math.floor(dailyTimeUsed / 60000))}m left`
                                    }
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </MagicCard>

            {/* Video Count */}
            <MagicCard glowColor="34, 197, 94" glowRadius={150}>
                <div className="p-4 flex flex-col justify-between h-full">
                    <span className="text-xs text-white/50 uppercase font-bold tracking-wider">Videos</span>
                    <div className="flex items-end gap-2 mt-2">
                        <span className="text-2xl font-bold text-white">{session ? session.videoCount : 0}</span>
                        <span className="text-xs text-white/50 mb-1">watched</span>
                    </div>
                </div>
            </MagicCard>

            {/* Vibe Check */}
            <MagicCard glowColor="244, 114, 182" glowRadius={150}>
                <div className="p-4 flex flex-col justify-between h-full">
                    <span className="text-xs text-white/50 uppercase font-bold tracking-wider">Vibe</span>
                    <div className="flex items-center gap-2 mt-2">
                        <currentVibe.icon className={`w-5 h-5 ${currentVibe.color}`} />
                        <span className={`text-sm font-medium leading-tight ${currentVibe.color}`}>{currentVibe.vibe}</span>
                    </div>
                </div>
            </MagicCard>

            {/* Focus Mode Toggle (Full Width) */}
            <MagicCard
                className="col-span-2"
                glowColor={focusMode ? '239, 68, 68' : '139, 92, 246'}
                glowRadius={200}
            >
                <button
                    onClick={toggleFocusMode}
                    className={`w-full p-4 flex items-center justify-between transition-all ${focusMode
                        ? 'text-red-400'
                        : 'text-white/70 hover:bg-white/5'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        {focusMode ? <Shield className="w-5 h-5" /> : <ShieldOff className="w-5 h-5" />}
                        <div className="text-left">
                            <div className="font-medium text-sm">{focusMode ? 'Focus Mode ON' : 'Focus Mode'}</div>
                            <div className="text-xs opacity-60">{focusMode ? 'Shorts blocked' : 'Block distracting content'}</div>
                        </div>
                    </div>
                    <div className={`w-10 h-6 rounded-full transition-colors relative ${focusMode ? 'bg-red-500' : 'bg-white/10'}`}>
                        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 ease-out ${focusMode ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                </button>
            </MagicCard>

            {/* Open Dashboard (Full Width Button) */}
            <button
                onClick={openDashboard}
                className="col-span-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-2xl p-4 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20"
            >
                <BarChart2 className="w-4 h-4" />
                Open Dashboard
            </button>
        </MagicGrid>
    )

    return (
        <div className={`w-[340px] min-h-[420px] flex flex-col relative overflow-hidden ${experimentalMode ? 'bg-background text-foreground' : 'bg-gray-50'}`}>
            {/* Experimental Background */}
            {experimentalMode && (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-black z-0 pointer-events-none" />
            )}

            <header className={`px-5 py-4 flex items-center justify-between z-10 sticky top-0 ${experimentalMode ? 'bg-card/10 backdrop-blur-md' : 'bg-white shadow-sm'}`}>
                <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${session ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                    <span className={`font-semibold text-sm tracking-tight ${experimentalMode ? 'opacity-90' : 'text-gray-900'}`}>Shorts Tracker</span>
                </div>
                <button
                    onClick={toggleExperimental}
                    className={`p-2 rounded-xl transition-all duration-200 ${experimentalMode ? 'text-primary hover:bg-white/10' : 'text-gray-400 hover:text-violet-500 hover:bg-violet-50'}`}
                >
                    <Zap className="w-4 h-4" />
                </button>
            </header>

            {experimentalMode ? (
                <div className="flex-1 p-3 z-10 flex flex-col text-foreground">
                    <GlassSurface
                        borderRadius={24}
                        blur={14}
                        brightness={45}
                        opacity={0.85}
                        backgroundOpacity={0.08}
                        saturation={1.3}
                        distortionScale={-120}
                        className="flex-1 !p-0"
                    >
                        <DarkContent />
                    </GlassSurface>
                </div>
            ) : (
                <div className="flex-1 flex flex-col z-10">
                    <LightContent />
                </div>
            )}
        </div>
    )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Popup />
    </React.StrictMode>,
)
