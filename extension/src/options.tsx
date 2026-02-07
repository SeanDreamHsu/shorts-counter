import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import { Trash2, Clock, PlayCircle, Settings, Zap, Brain, Gamepad2, Smile, Ghost, TrendingUp, TrendingDown, BarChart3, LineChartIcon, Sparkles } from 'lucide-react'
import AppleLiquidCard from './components/AppleLiquidCard'
import Aurora from './components/Aurora'
import MagicCard, { MagicGrid } from './components/MagicCard'
import GlassSurface from './components/GlassSurface'
// AI analyzer stub - for future use
// import { analyzeWithGemini } from './utils/aiAnalyzer'
import './index.css'

// --- Content Analysis Logic (Duplicated for now to keep files independent) ---
const analyzeVibe = (sessions: Session[], startDate: number) => {
    const recentVideos: { title: string }[] = [];
    sessions.forEach(s => {
        if (s.startTime >= startDate && s.videoLog) {
            recentVideos.push(...s.videoLog);
        }
    });

    if (recentVideos.length === 0) return { vibe: "Neutral", icon: Zap, color: "text-gray-400", desc: "No data yet" };

    const keywords = {
        learning: ['tutorial', 'how to', 'learn', 'course', 'guide', 'tips', 'documentary', 'science', 'math', 'code', 'build'],
        gaming: ['game', 'play', 'minecraft', 'roblox', 'fortnite', 'valorant', 'league', 'stream', 'twitch'],
        entertainment: ['funny', 'meme', 'comedy', 'prank', 'fail', 'challenge', 'react', 'laugh'],
        brainrot: ['skibidi', 'sigma', 'gyatt', 'rizz', 'only in ohio', 'fanum', 'tax']
    };

    let scores = { learning: 0, gaming: 0, entertainment: 0, brainrot: 0 };

    recentVideos.forEach(v => {
        const lowerTitle = v.title.toLowerCase();
        if (keywords.brainrot.some(k => lowerTitle.includes(k))) scores.brainrot += 3;
        else if (keywords.learning.some(k => lowerTitle.includes(k))) scores.learning++;
        else if (keywords.gaming.some(k => lowerTitle.includes(k))) scores.gaming++;
        else if (keywords.entertainment.some(k => lowerTitle.includes(k))) scores.entertainment++;
    });

    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) return { vibe: "Mixed Bags", icon: Zap, color: "text-blue-400", desc: "A bit of everything" };

    if (scores.brainrot === maxScore) return { vibe: "Pure Brain Rot", icon: Ghost, color: "text-purple-400", desc: "Terminal stage internet usage" };
    if (scores.learning === maxScore) return { vibe: "Knowledge Hunter", icon: Brain, color: "text-emerald-400", desc: "Big brain energy" };
    if (scores.gaming === maxScore) return { vibe: "Gamer Mode", icon: Gamepad2, color: "text-indigo-400", desc: "Locked in 🎮" };
    return { vibe: "Comedy Gold", icon: Smile, color: "text-yellow-400", desc: "Just here for laughs" };
}

interface Session {
    id: string
    startTime: number
    endTime: number
    videoCount: number
    platform: 'youtube' | 'tiktok'
    videoLog?: { title: string, timestamp: number }[]
}

const TOOLTIP_CONTENT_STYLE = { backgroundColor: '#333', borderColor: '#444', borderRadius: '8px' }
const TOOLTIP_CURSOR_STYLE = false // Disabled hover highlight


const ChartSection = React.memo(({ data }: { data: any[] }) => (
    <div className="bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm mb-8">
        <h3 className="text-lg font-semibold mb-4">Last 7 Days</h3>
        <div className="h-[250px] w-full min-w-0">
            <ResponsiveContainer width="99%" height="100%" minWidth={0} minHeight={0} debounce={10}>
                <BarChart data={data}>
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                        contentStyle={TOOLTIP_CONTENT_STYLE}
                        cursor={TOOLTIP_CURSOR_STYLE}
                    />
                    <Bar dataKey="minutes" fill="#8884d8" radius={[4, 4, 0, 0]} className="fill-primary" isAnimationActive={false} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
));

function Options() {
    const [history, setHistory] = useState<Session[]>([])
    const [currentSession, setCurrentSession] = useState<{ startTime: number, videoCount: number, platform: 'youtube' | 'tiktok' } | null>(null)
    const [now, setNow] = useState(Date.now())
    const [filter, setFilter] = useState<'all' | 'youtube' | 'tiktok'>('all')
    const [showSettings, setShowSettings] = useState(false)
    const [experimentalMode, setExperimentalMode] = useState(false)
    const [showCapsule, setShowCapsule] = useState(true)
    const [visualDecayMode, setVisualDecayMode] = useState(false)
    const [chartType, setChartType] = useState<'bar' | 'line'>('bar')
    // AI-related state removed - feature coming soon
    const [focusBlockScope, setFocusBlockScope] = useState<'shorts' | 'fullsite'>('shorts')
    const [dailyTimeLimitEnabled, setDailyTimeLimitEnabled] = useState(false)
    const [dailyTimeLimit, setDailyTimeLimit] = useState(30) // minutes

    useEffect(() => {
        // Fetch settings
        chrome.storage.local.get(['history', 'currentSession', 'experimentalMode', 'showCapsule'], (result) => {
            if (result.history) setHistory(result.history as Session[])
            if (result.currentSession) setCurrentSession(result.currentSession as any)
            if (result.experimentalMode !== undefined) setExperimentalMode(result.experimentalMode as boolean)
            if (result.showCapsule !== undefined) setShowCapsule(result.showCapsule as boolean)
            if (result.visualDecayMode !== undefined) setVisualDecayMode(result.visualDecayMode as boolean)
            if (result.focusBlockScope) setFocusBlockScope(result.focusBlockScope as 'shorts' | 'fullsite')
            if (result.dailyTimeLimitEnabled !== undefined) setDailyTimeLimitEnabled(result.dailyTimeLimitEnabled as boolean)
            if (result.dailyTimeLimit !== undefined) setDailyTimeLimit(result.dailyTimeLimit as number)
        })

        // Listen for changes
        const listener = (changes: any, areaName: string) => {
            if (areaName === 'local') {
                if (changes.history) setHistory(changes.history.newValue)
                if (changes.currentSession) setCurrentSession(changes.currentSession.newValue)
                if (changes.experimentalMode) setExperimentalMode(changes.experimentalMode.newValue)
                if (changes.showCapsule) setShowCapsule(changes.showCapsule.newValue)
                if (changes.visualDecayMode) setVisualDecayMode(changes.visualDecayMode.newValue)
            }
        }
        chrome.storage.onChanged.addListener(listener)
        return () => chrome.storage.onChanged.removeListener(listener)
    }, [])

    // Live timer for active session
    useEffect(() => {
        if (!currentSession) return
        const interval = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(interval)
    }, [currentSession])

    // AI Analysis disabled - coming soon

    const deleteSession = (id: string) => {
        const newHistory = history.filter(s => s.id !== id)
        chrome.storage.local.set({ history: newHistory })
        setHistory(newHistory)
    }

    const toggleExperimentalMode = () => {
        const newVal = !experimentalMode
        setExperimentalMode(newVal)
        chrome.storage.local.set({ experimentalMode: newVal })
    }

    const toggleCapsule = () => {
        const newVal = !showCapsule
        setShowCapsule(newVal)
        chrome.storage.local.set({ showCapsule: newVal })
    }

    const toggleVisualDecay = () => {
        const newVal = !visualDecayMode
        setVisualDecayMode(newVal)
        chrome.storage.local.set({ visualDecayMode: newVal })
    }

    // Filter Logic
    const filteredHistory = history.filter(s => filter === 'all' || s.platform === filter)
    const filteredCurrentSession = currentSession && (filter === 'all' || currentSession.platform === filter) ? currentSession : null

    // Stats Logic
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    // Calculate active session impact
    let activeTimeToday = 0
    let activeVideosToday = 0

    if (filteredCurrentSession && filteredCurrentSession.startTime >= startOfToday.getTime()) {
        activeTimeToday = now - filteredCurrentSession.startTime
        activeVideosToday = filteredCurrentSession.videoCount
    }

    const todaysSessions = filteredHistory.filter(s => s.startTime >= startOfToday.getTime())
    const historyTimeToday = todaysSessions.reduce((acc, s) => acc + (s.endTime - s.startTime), 0)
    const historyVideosToday = todaysSessions.reduce((acc, s) => acc + s.videoCount, 0)

    const totalTimeToday = historyTimeToday + activeTimeToday
    const totalVideosToday = historyVideosToday + activeVideosToday

    // Yesterday's stats for comparison
    const startOfYesterday = new Date()
    startOfYesterday.setDate(startOfYesterday.getDate() - 1)
    startOfYesterday.setHours(0, 0, 0, 0)
    const endOfYesterday = new Date(startOfToday)
    const yesterdaySessions = filteredHistory.filter(s =>
        s.startTime >= startOfYesterday.getTime() && s.startTime < endOfYesterday.getTime()
    )
    const totalTimeYesterday = yesterdaySessions.reduce((acc, s) => acc + (s.endTime - s.startTime), 0)

    // Last week average for comparison
    const startOfLastWeek = new Date()
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)
    startOfLastWeek.setHours(0, 0, 0, 0)
    const lastWeekSessions = filteredHistory.filter(s =>
        s.startTime >= startOfLastWeek.getTime() && s.startTime < startOfToday.getTime()
    )
    const totalTimeLastWeek = lastWeekSessions.reduce((acc, s) => acc + (s.endTime - s.startTime), 0)
    const avgTimeLastWeek = totalTimeLastWeek / 7

    // Chart Logic (Last 7 Days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        d.setHours(0, 0, 0, 0)
        return d
    })

    const chartData = React.useMemo(() => last7Days.map(date => {
        const nextDay = new Date(date)
        nextDay.setDate(date.getDate() + 1)

        const daySessions = filteredHistory.filter(s =>
            s.startTime >= date.getTime() && s.startTime < nextDay.getTime()
        )

        let dayMinutes = daySessions.reduce((acc, s) => acc + (s.endTime - s.startTime), 0) / 60000

        // Add active session if it falls on this day (usually it's today)
        if (filteredCurrentSession && filteredCurrentSession.startTime >= date.getTime() && filteredCurrentSession.startTime < nextDay.getTime()) {
            dayMinutes += (now - filteredCurrentSession.startTime) / 60000
        }

        return {
            name: date.toLocaleDateString('en-US', { weekday: 'short' }),
            minutes: Math.round(dayMinutes),
            fullDate: date.toLocaleDateString()
        }
    }), [filteredHistory, filteredCurrentSession, Math.floor(now / 60000)])

    // Alias for experimental mode
    const last7DaysData = chartData

    const formatTime = (ms: number) => {
        const minutes = Math.floor(ms / 60000)
        const hours = Math.floor(minutes / 60)
        if (hours > 0) return `${hours}h ${minutes % 60}m`
        return `${minutes}m`
    }

    const SettingsModal = () => {
        if (!showSettings) return null;

        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowSettings(false)}>
                <div
                    className="bg-black/60 backdrop-blur-xl text-white p-6 rounded-xl border border-white/10 shadow-2xl w-full max-w-sm"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Settings</h2>
                        <button onClick={() => setShowSettings(false)} className="text-white/40 hover:text-white transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium">Show Overlay Capsule</div>
                                <div className="text-sm text-white/60">Show real-time stats on video</div>
                            </div>
                            <button
                                onClick={toggleCapsule}
                                className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${showCapsule ? 'bg-green-500' : 'bg-white/10'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 ease-out ${showCapsule ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium">Experimental UI</div>
                                <div className="text-sm text-white/60">Enable liquid card design</div>
                            </div>
                            <button
                                onClick={toggleExperimentalMode}
                                className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${experimentalMode ? 'bg-indigo-500' : 'bg-white/10'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 ease-out ${experimentalMode ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium">Visual Decay</div>
                                <div className="text-sm text-white/60">Fade to grayscale over time</div>
                            </div>
                            <button
                                onClick={toggleVisualDecay}
                                className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${visualDecayMode ? 'bg-orange-500' : 'bg-white/10'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 ease-out ${visualDecayMode ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Focus Mode Scope */}
                        <div className="pt-4 border-t border-white/10">
                            <div className="font-medium mb-2">Focus Mode Blocking</div>
                            <div className="text-sm text-white/60 mb-3">What to block when Focus Mode is ON</div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setFocusBlockScope('shorts')
                                        chrome.storage.local.set({ focusBlockScope: 'shorts' })
                                    }}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${focusBlockScope === 'shorts'
                                        ? 'bg-red-500 text-white'
                                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                                        }`}
                                >
                                    Shorts Only
                                </button>
                                <button
                                    onClick={() => {
                                        setFocusBlockScope('fullsite')
                                        chrome.storage.local.set({ focusBlockScope: 'fullsite' })
                                    }}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${focusBlockScope === 'fullsite'
                                        ? 'bg-red-500 text-white'
                                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                                        }`}
                                >
                                    Entire YouTube
                                </button>
                            </div>
                        </div>

                        {/* Daily Time Limit */}
                        <div className="pt-4 border-t border-white/10">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <div className="font-medium">Daily Time Limit</div>
                                    <div className="text-sm text-white/60">Get warned when limit is reached</div>
                                </div>
                                <button
                                    onClick={() => {
                                        const newVal = !dailyTimeLimitEnabled
                                        setDailyTimeLimitEnabled(newVal)
                                        chrome.storage.local.set({ dailyTimeLimitEnabled: newVal })
                                    }}
                                    className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${dailyTimeLimitEnabled ? 'bg-amber-500' : 'bg-white/10'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 ease-out ${dailyTimeLimitEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>
                            {dailyTimeLimitEnabled && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-white/60">Limit:</span>
                                        <span className="font-medium text-amber-400">{dailyTimeLimit} minutes</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="5"
                                        max="120"
                                        step="5"
                                        value={dailyTimeLimit}
                                        onChange={e => {
                                            const val = parseInt(e.target.value)
                                            setDailyTimeLimit(val)
                                            chrome.storage.local.set({ dailyTimeLimit: val })
                                        }}
                                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                    />
                                    <div className="flex justify-between text-xs text-white/40">
                                        <span>5 min</span>
                                        <span>120 min</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* AI Analysis Section - Coming Soon */}
                        <div className="pt-4 border-t border-white/10">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-4 h-4 text-purple-400/50" />
                                <span className="font-medium text-white/50">AI Analysis</span>
                                <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded-full">Coming Soon</span>
                            </div>
                            <div className="text-sm text-white/40">
                                AI-powered content analysis will be available in a future update. Stay tuned! 🚀
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    chrome.storage.local.get(['history'], (result) => {
                                        const data = JSON.stringify(result.history || [], null, 2);
                                        const blob = new Blob([data], { type: 'application/json' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `shorts-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);
                                    });
                                }}
                                className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors border border-white/10"
                            >
                                Export
                            </button>
                            <label className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors border border-white/10 cursor-pointer text-center">
                                Import
                                <input
                                    type="file"
                                    accept=".json"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            try {
                                                const importedData = JSON.parse(event.target?.result as string);
                                                if (!Array.isArray(importedData)) {
                                                    alert('Invalid file format. Expected an array of sessions.');
                                                    return;
                                                }

                                                // Merge with existing history (dedupe by id)
                                                chrome.storage.local.get(['history'], (result) => {
                                                    const existing = (result.history || []) as Session[];
                                                    const existingIds = new Set(existing.map((s) => s.id));
                                                    const newSessions = importedData.filter((s: any) => !existingIds.has(s.id));
                                                    const merged = [...existing, ...newSessions].sort((a: any, b: any) => b.startTime - a.startTime);

                                                    chrome.storage.local.set({ history: merged });
                                                    setHistory(merged);
                                                    alert(`Imported ${newSessions.length} new sessions. (${importedData.length - newSessions.length} duplicates skipped)`);
                                                });
                                            } catch {
                                                alert('Failed to parse JSON file.');
                                            }
                                        };
                                        reader.readAsText(file);
                                        e.target.value = ''; // Reset for re-import
                                    }}
                                />
                            </label>
                        </div>

                        <button
                            onClick={() => {
                                if (confirm('Are you sure you want to delete all history? This cannot be undone.')) {
                                    chrome.storage.local.set({ history: [], currentSession: null })
                                    setHistory([])
                                    setCurrentSession(null)
                                    setShowSettings(false)
                                }
                            }}
                            className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors"
                        >
                            Reset All Data
                        </button>
                    </div>

                    <div className="mt-4 text-center text-xs text-white/40">
                        Shorts Tracker v1.1
                    </div>
                </div>
            </div>
        )
    };

    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const handleChartClick = (data: any) => {
        if (data && data.activePayload && data.activePayload.length > 0) {
            const payload = data.activePayload[0].payload;
            setSelectedDate(payload.fullDate); // fullDate is locale string, ensuring consistency depends on locale
        }
    }

    // Hourly Data Logic
    const hourlyData = React.useMemo(() => {
        if (!selectedDate) return [];
        // Filter sessions for that date
        const targetDateStr = selectedDate;
        const sessions = history.filter(s => new Date(s.startTime).toLocaleDateString() === targetDateStr);

        const hours = Array(24).fill(0);
        sessions.forEach(s => {
            const h = new Date(s.startTime).getHours();
            hours[h] += (s.endTime - s.startTime);
        });

        return hours.map((ms, i) => ({
            name: `${i}:00`,
            minutes: Math.round(ms / 60000)
        }));
    }, [selectedDate, history]);

    const ChartSection = React.memo(({ data, onClick, chartType, onToggle }: { data: any[], onClick?: (data: any) => void, chartType: 'bar' | 'line', onToggle: () => void }) => (
        <div className={`rounded-2xl p-6 mb-8 transition-shadow duration-200 ${experimentalMode ? 'bg-card text-card-foreground border border-border' : 'bg-white shadow-sm hover:shadow-md text-gray-900'}`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Last 7 Days</h3>
                <div className="flex items-center gap-3">
                    <span className={`text-xs ${experimentalMode ? 'text-muted-foreground' : 'text-gray-400'}`}>Click for details</span>
                    <button
                        onClick={onToggle}
                        className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium ${experimentalMode ? 'bg-secondary/50 hover:bg-secondary' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                    >
                        {chartType === 'bar' ? <LineChartIcon className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
                        {chartType === 'bar' ? 'Trend' : 'Bar'}
                    </button>
                </div>
            </div>
            <div className="h-[250px] w-full min-w-0 pointer-events-auto">
                <ResponsiveContainer width="99%" height="100%" minWidth={0} minHeight={0} debounce={10}>
                    {chartType === 'bar' ? (
                        <BarChart data={data} className="cursor-pointer" margin={{ top: 5, right: 5, bottom: 5, left: -20 }} style={{ outline: 'none' }}>
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: experimentalMode ? '#ffffff' : '#6b7280' }} />
                            <Tooltip
                                contentStyle={{ ...TOOLTIP_CONTENT_STYLE, pointerEvents: 'none' }}
                                cursor={false}
                                wrapperStyle={{ outline: 'none', pointerEvents: 'none' }}
                                isAnimationActive={false}
                            />
                            <Bar
                                dataKey="minutes"
                                radius={[4, 4, 0, 0]}
                                className="fill-primary hover:opacity-80 transition-opacity"
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        onClick={() => onClick && onClick(entry)}
                                        fill="#8b5cf6"
                                        cursor="pointer"
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    ) : (
                        <LineChart data={data} margin={{ top: 5, right: 15, bottom: 5, left: -20 }} style={{ outline: 'none' }}>
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: experimentalMode ? '#ffffff' : '#6b7280' }} />
                            <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#9ca3af' }} width={30} />
                            <Tooltip
                                contentStyle={{ ...TOOLTIP_CONTENT_STYLE, pointerEvents: 'none' }}
                                wrapperStyle={{ outline: 'none', pointerEvents: 'none' }}
                                isAnimationActive={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="minutes"
                                stroke="#8b5cf6"
                                strokeWidth={3}
                                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
                                activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}
                            />
                        </LineChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    ));

    const HourlyChartSection = ({ data, date, onBack }: { data: any[], date: string, onBack: () => void }) => (
        <div className={`rounded-2xl p-6 mb-8 animate-in slide-in-from-right transition-shadow duration-200 ${experimentalMode ? 'bg-card text-card-foreground border border-border' : 'bg-white shadow-sm hover:shadow-md text-gray-900'}`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{date} Breakdown</h3>
                <button onClick={onBack} className="text-sm text-violet-500 hover:underline">Back to Week</button>
            </div>
            <div className="h-[250px] w-full min-w-0">
                <ResponsiveContainer width="99%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={data}>
                        <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} interval={2} tick={{ fill: experimentalMode ? '#ffffff' : '#6b7280' }} />
                        <Tooltip
                            contentStyle={TOOLTIP_CONTENT_STYLE}
                            cursor={TOOLTIP_CURSOR_STYLE}
                        />
                        <Bar dataKey="minutes" fill="#8b5cf6" radius={[2, 2, 0, 0]} className="fill-primary" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    const MainContent = () => (
        <div className="min-h-screen w-full px-6 py-8 lg:px-12 lg:py-10">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Shorts Tracker</h1>
                    <p className="text-gray-500 text-sm mt-1">Your viewing insights at a glance</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Platform Filter */}
                    <div className="bg-white/80 backdrop-blur-sm shadow-sm rounded-2xl p-1 flex">
                        {(['all', 'youtube', 'tiktok'] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setFilter(p)}
                                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${filter === p
                                    ? 'bg-violet-500 text-white shadow-md'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                                    }`}
                            >
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                        ))}
                    </div>
                    {/* Settings */}
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-3 rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-gray-500 hover:text-violet-500 transition-all duration-200"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-12 gap-5 auto-rows-min">
                {/* Hero Card - Today's Time (Large, Left-Top) */}
                <div className="col-span-12 lg:col-span-5 row-span-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-violet-500/20 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent_50%)]" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-white/70 mb-4">
                            <Clock className="w-5 h-5" />
                            <span className="text-sm font-medium uppercase tracking-wider">Today's Screen Time</span>
                        </div>
                        <div className="text-6xl font-bold tracking-tight mb-2">{formatTime(totalTimeToday)}</div>
                        <div className="text-white/60 text-sm">on short-form videos</div>
                        {/* Today's Videos Mini Stat */}
                        <div className="mt-8 pt-6 border-t border-white/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <PlayCircle className="w-5 h-5 text-white/70" />
                                    <span className="text-white/70">Videos Watched</span>
                                </div>
                                <span className="text-2xl font-bold">{totalVideosToday}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total Wasted Card */}
                <div className="col-span-6 lg:col-span-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-red-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-orange-600/70 mb-3">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs font-semibold uppercase tracking-wider">Total Time Spent</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-800">
                            {formatTime(filteredHistory.reduce((acc, s) => acc + (s.endTime - s.startTime), 0) + (activeTimeToday || 0))}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">All time</div>
                    </div>
                </div>

                {/* Total Videos Card */}
                <div className="col-span-6 lg:col-span-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-blue-600/70 mb-3">
                            <PlayCircle className="w-4 h-4" />
                            <span className="text-xs font-semibold uppercase tracking-wider">Total Videos</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-800">
                            {filteredHistory.reduce((acc, s) => acc + s.videoCount, 0) + (activeVideosToday || 0)}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Videos watched since install</div>
                    </div>
                </div>

                {/* VS Yesterday Comparison */}
                <div className="col-span-6 lg:col-span-3 bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
                    {(() => {
                        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
                        const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
                        const todayTime = filteredHistory.filter(s => s.startTime >= todayStart.getTime()).reduce((a, s) => a + (s.endTime - s.startTime), 0) + activeTimeToday;
                        const yesterdayTime = filteredHistory.filter(s => s.startTime >= yesterdayStart.getTime() && s.startTime < todayStart.getTime()).reduce((a, s) => a + (s.endTime - s.startTime), 0);
                        const diff = todayTime - yesterdayTime;
                        const isDown = diff <= 0;
                        const diffMins = Math.abs(Math.round(diff / 60000));
                        return (<>
                            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">vs Yesterday</div>
                            <div className="flex items-center gap-3">
                                {isDown ? <TrendingDown className="w-8 h-8 text-emerald-500" /> : <TrendingUp className="w-8 h-8 text-red-500" />}
                                <div>
                                    <div className={`text-xl font-bold ${isDown ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {diffMins}m {isDown ? 'less' : 'more'}
                                    </div>
                                    <div className="text-xs text-gray-400">{isDown ? '🎉 Nice!' : 'Keep trying!'}</div>
                                </div>
                            </div>
                        </>);
                    })()}
                </div>

                {/* VS Last Week Comparison */}
                <div className="col-span-6 lg:col-span-4 bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
                    {(() => {
                        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
                        const thisWeekStart = new Date(todayStart); thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
                        const lastWeekStart = new Date(thisWeekStart); lastWeekStart.setDate(lastWeekStart.getDate() - 7);
                        const thisWeekTime = filteredHistory.filter(s => s.startTime >= thisWeekStart.getTime()).reduce((a, s) => a + (s.endTime - s.startTime), 0) + activeTimeToday;
                        const lastWeekTime = filteredHistory.filter(s => s.startTime >= lastWeekStart.getTime() && s.startTime < thisWeekStart.getTime()).reduce((a, s) => a + (s.endTime - s.startTime), 0);
                        const diff = thisWeekTime - lastWeekTime;
                        const isDown = diff <= 0;
                        const diffMins = Math.abs(Math.round(diff / 60000));
                        return (<>
                            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">vs Last Week</div>
                            <div className="flex items-center gap-3">
                                {isDown ? <TrendingDown className="w-8 h-8 text-emerald-500" /> : <TrendingUp className="w-8 h-8 text-red-500" />}
                                <div>
                                    <div className={`text-xl font-bold ${isDown ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {diffMins}m {isDown ? 'less' : 'more'}
                                    </div>
                                    <div className="text-xs text-gray-400">{isDown ? '💪 Great progress!' : 'Room to improve'}</div>
                                </div>
                            </div>
                        </>);
                    })()}
                </div>

                {/* Chart Section - Full Width */}
                <div className="col-span-12 lg:col-span-8 bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Last 7 Days</h3>
                            <p className="text-xs text-gray-400">Click a bar for hourly breakdown</p>
                        </div>
                        <button
                            onClick={() => setChartType(prev => prev === 'bar' ? 'line' : 'bar')}
                            className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                            {chartType === 'bar' ? <LineChartIcon className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
                            {chartType === 'bar' ? 'Trend' : 'Bar'}
                        </button>
                    </div>
                    <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            {chartType === 'bar' ? (
                                <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
                                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="minutes" radius={[6, 6, 0, 0]} cursor="pointer">
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={`url(#barGradient)`} onClick={() => handleChartClick(entry)} />
                                        ))}
                                    </Bar>
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#8b5cf6" />
                                            <stop offset="100%" stopColor="#6366f1" />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            ) : (
                                <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
                                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#9ca3af' }} />
                                    <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#d1d5db' }} width={30} />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                    <Line type="monotone" dataKey="minutes" stroke="url(#lineGradient)" strokeWidth={3} dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
                                    <defs>
                                        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#8b5cf6" />
                                            <stop offset="100%" stopColor="#06b6d4" />
                                        </linearGradient>
                                    </defs>
                                </LineChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Today's Vibe */}
                <div className="col-span-12 lg:col-span-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
                        Today's Vibe
                    </h3>
                    {(() => {
                        const todayStart = new Date().setHours(0, 0, 0, 0);
                        const vibe = analyzeVibe(filteredHistory, todayStart);
                        return (
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-white/60">
                                    <vibe.icon className={`w-8 h-8 ${vibe.color}`} />
                                </div>
                                <div>
                                    <div className={`text-xl font-bold ${vibe.color}`}>{vibe.vibe}</div>
                                    <div className="text-xs text-gray-400">{vibe.desc}</div>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Recent Sessions */}
                <div className="col-span-12 bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4">Recent Sessions</h3>
                    {filteredCurrentSession && (
                        <div className="flex items-center justify-between p-4 mb-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                <div>
                                    <div className="font-medium text-gray-800">Active Now</div>
                                    <div className="text-xs text-gray-400">{formatTime(now - filteredCurrentSession.startTime)} · {filteredCurrentSession.videoCount} videos</div>
                                </div>
                            </div>
                            <span className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-500 uppercase">{filteredCurrentSession.platform}</span>
                        </div>
                    )}
                    {filteredHistory.length === 0 && !filteredCurrentSession && <p className="text-gray-400 text-sm">No sessions found.</p>}
                    <div className="space-y-2 max-h-[240px] overflow-y-auto">
                        {filteredHistory.slice(0, 8).reverse().map(session => (
                            <div key={session.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors group">
                                <div>
                                    <div className="font-medium text-gray-700 flex items-center gap-2">
                                        {new Date(session.startTime).toLocaleDateString()} · {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        <span className="text-xs px-2 py-0.5 rounded-lg bg-gray-200/50 text-gray-500 uppercase">{session.platform}</span>
                                    </div>
                                    <div className="text-sm text-gray-400">{formatTime(session.endTime - session.startTime)} · {session.videoCount} videos</div>
                                </div>
                                <button onClick={() => deleteSession(session.id)} className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )

    if (experimentalMode) {
        return (
            <div className="min-h-screen bg-black text-white relative overflow-hidden">
                {/* Aurora Background */}
                <div className="fixed inset-0 z-0">
                    <Aurora colorStops={['#8B5CF6', '#06B6D4', '#EC4899']} amplitude={1.2} blend={0.6} speed={0.8} />
                </div>
                {/* Gradient Overlay */}
                <div className="fixed inset-0 z-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                <SettingsModal />

                {/* Main Content */}
                <div className="relative z-10 min-h-screen p-6 lg:p-10">
                    {/* Header */}
                    <header className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">Shorts Tracker</h1>
                            <p className="text-white/50 text-sm mt-1">Your viewing insights at a glance</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Platform Filter */}
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-1 flex border border-white/10">
                                {(['all', 'youtube', 'tiktok'] as const).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setFilter(p)}
                                        className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${filter === p
                                            ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                                            : 'text-white/60 hover:text-white hover:bg-white/10'
                                            }`}
                                    >
                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                    </button>
                                ))}
                            </div>
                            {/* Settings */}
                            <button
                                onClick={() => setShowSettings(true)}
                                className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all duration-200"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                        </div>
                    </header>

                    {/* Bento Grid with Magic Cards */}
                    <MagicGrid className="grid grid-cols-12 gap-4 auto-rows-min">
                        {/* Hero Card - Today's Time */}
                        <MagicCard className="col-span-12 lg:col-span-5 row-span-2" glowColor="139, 92, 246" glowRadius={350}>
                            <div className="p-8 h-full flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-2 text-white/50 mb-4">
                                        <Clock className="w-5 h-5" />
                                        <span className="text-sm font-medium uppercase tracking-wider">Today's Screen Time</span>
                                    </div>
                                    <div className="text-6xl font-bold tracking-tight text-white">{formatTime(totalTimeToday)}</div>
                                    <div className="text-white/40 text-sm mt-1">on short-form videos</div>
                                </div>
                                <div className="mt-8 pt-6 border-t border-white/10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <PlayCircle className="w-5 h-5 text-white/50" />
                                            <span className="text-white/50">Videos Watched</span>
                                        </div>
                                        <span className="text-2xl font-bold text-white">{totalVideosToday}</span>
                                    </div>
                                </div>
                            </div>
                        </MagicCard>

                        {/* Total Time Card */}
                        <MagicCard className="col-span-6 lg:col-span-3" glowColor="249, 115, 22" glowRadius={200}>
                            <div className="p-6">
                                <div className="flex items-center gap-2 text-orange-400/70 mb-3">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-xs font-semibold uppercase tracking-wider">Total Time</span>
                                </div>
                                <div className="text-3xl font-bold text-white">
                                    {formatTime(filteredHistory.reduce((acc, s) => acc + (s.endTime - s.startTime), 0) + (activeTimeToday || 0))}
                                </div>
                                <div className="text-xs text-white/30 mt-1">All time</div>
                            </div>
                        </MagicCard>

                        {/* Total Videos Card */}
                        <MagicCard className="col-span-6 lg:col-span-4" glowColor="34, 197, 94" glowRadius={200}>
                            <div className="p-6">
                                <div className="flex items-center gap-2 text-emerald-400/70 mb-3">
                                    <PlayCircle className="w-4 h-4" />
                                    <span className="text-xs font-semibold uppercase tracking-wider">Total Videos</span>
                                </div>
                                <div className="text-3xl font-bold text-white">
                                    {filteredHistory.reduce((acc, s) => acc + s.videoCount, 0) + (currentSession?.videoCount || 0)}
                                </div>
                                <div className="text-xs text-white/30 mt-1">Videos watched</div>
                            </div>
                        </MagicCard>

                        {/* Comparison Cards */}
                        <MagicCard className="col-span-6 lg:col-span-3" glowColor="59, 130, 246" glowRadius={180}>
                            <div className="p-5">
                                <span className="text-xs text-white/40 uppercase font-semibold">vs Yesterday</span>
                                <div className="flex items-center gap-2 mt-2">
                                    {totalTimeToday > totalTimeYesterday ? (
                                        <TrendingUp className="w-5 h-5 text-red-400" />
                                    ) : (
                                        <TrendingDown className="w-5 h-5 text-emerald-400" />
                                    )}
                                    <span className={`text-xl font-bold ${totalTimeToday > totalTimeYesterday ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {totalTimeYesterday > 0 ? `${Math.round(((totalTimeToday - totalTimeYesterday) / totalTimeYesterday) * 100)}%` : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </MagicCard>

                        <MagicCard className="col-span-6 lg:col-span-4" glowColor="168, 85, 247" glowRadius={180}>
                            <div className="p-5">
                                <span className="text-xs text-white/40 uppercase font-semibold">vs Last Week Avg</span>
                                <div className="flex items-center gap-2 mt-2">
                                    {totalTimeToday > avgTimeLastWeek ? (
                                        <TrendingUp className="w-5 h-5 text-red-400" />
                                    ) : (
                                        <TrendingDown className="w-5 h-5 text-emerald-400" />
                                    )}
                                    <span className={`text-xl font-bold ${totalTimeToday > avgTimeLastWeek ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {avgTimeLastWeek > 0 ? `${Math.round(((totalTimeToday - avgTimeLastWeek) / avgTimeLastWeek) * 100)}%` : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </MagicCard>

                        {/* Chart Card */}
                        <MagicCard className="col-span-12 lg:col-span-8" glowColor="139, 92, 246" glowRadius={400}>
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Last 7 Days</h3>
                                    <div className="flex bg-white/10 rounded-xl p-0.5">
                                        <button onClick={() => setChartType('bar')} className={`p-2 rounded-lg transition-all ${chartType === 'bar' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}>
                                            <BarChart3 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setChartType('line')} className={`p-2 rounded-lg transition-all ${chartType === 'line' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}>
                                            <LineChartIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="99%" height="100%">
                                        {chartType === 'bar' ? (
                                            <BarChart data={last7DaysData}>
                                                <defs>
                                                    <linearGradient id="darkBarGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                                                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.6} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="#ffffff40" />
                                                <Tooltip contentStyle={{ backgroundColor: '#1f1f1f', borderColor: '#333', borderRadius: '12px', color: '#fff' }} />
                                                <Bar dataKey="minutes" fill="url(#darkBarGradient)" radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        ) : (
                                            <LineChart data={last7DaysData}>
                                                <defs>
                                                    <linearGradient id="darkLineGradient" x1="0" y1="0" x2="1" y2="0">
                                                        <stop offset="0%" stopColor="#8b5cf6" />
                                                        <stop offset="100%" stopColor="#06b6d4" />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="#ffffff40" />
                                                <Tooltip contentStyle={{ backgroundColor: '#1f1f1f', borderColor: '#333', borderRadius: '12px', color: '#fff' }} />
                                                <Line type="monotone" dataKey="minutes" stroke="url(#darkLineGradient)" strokeWidth={3} dot={false} />
                                            </LineChart>
                                        )}
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </MagicCard>

                        {/* Vibe Card */}
                        <MagicCard className="col-span-12 lg:col-span-4" glowColor="236, 72, 153" glowRadius={250}>
                            <div className="p-6">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">
                                    Today's Vibe
                                </h3>
                                {(() => {
                                    const todayStart = new Date().setHours(0, 0, 0, 0);
                                    const vibe = analyzeVibe(filteredHistory, todayStart);
                                    return (
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-2xl bg-white/10">
                                                <vibe.icon className={`w-8 h-8 ${vibe.color}`} />
                                            </div>
                                            <div>
                                                <div className={`text-xl font-bold ${vibe.color}`}>{vibe.vibe}</div>
                                                <div className="text-xs text-white/40">{vibe.desc}</div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </MagicCard>

                        {/* Recent Sessions */}
                        <MagicCard className="col-span-12" glowColor="99, 102, 241" glowRadius={500}>
                            <div className="p-6">
                                <h3 className="font-bold text-white mb-4">Recent Sessions</h3>
                                {filteredCurrentSession && (
                                    <div className="flex items-center justify-between p-4 mb-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <span className="relative flex h-2.5 w-2.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                            </span>
                                            <div>
                                                <div className="font-medium text-white">Active Now</div>
                                                <div className="text-xs text-white/40">{formatTime(now - filteredCurrentSession.startTime)} · {filteredCurrentSession.videoCount} videos</div>
                                            </div>
                                        </div>
                                        <span className="text-xs px-2 py-1 rounded-lg bg-white/10 text-white/50 uppercase">{filteredCurrentSession.platform}</span>
                                    </div>
                                )}
                                {filteredHistory.length === 0 && !filteredCurrentSession && <p className="text-white/40 text-sm">No sessions found.</p>}
                                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                    {filteredHistory.slice(0, 6).reverse().map(session => (
                                        <div key={session.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors group">
                                            <div>
                                                <div className="font-medium text-white/90">{new Date(session.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                                <div className="text-xs text-white/40">{formatTime(session.endTime - session.startTime)} · {session.videoCount} videos</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs px-2 py-1 rounded-lg bg-white/10 text-white/50 uppercase">{session.platform}</span>
                                                <button onClick={() => deleteSession(session.id)} className="p-2 text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </MagicCard>
                    </MagicGrid>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 text-gray-900">
            <SettingsModal />
            <MainContent />
        </div>
    )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Options />
    </React.StrictMode>,
)
