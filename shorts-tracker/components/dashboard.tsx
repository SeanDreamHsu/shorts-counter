"use client"

import { useTrackerStore, Session } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { Trash2, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import AppleLiquidCard from "@/components/AppleLiquidCard"
import { useState } from "react"

export function Dashboard() {
    const { history, deleteSession, experimentalMode, showCapsule, toggleExperimentalMode, toggleCapsule, clearData } = useTrackerStore()
    const [showSettings, setShowSettings] = useState(false)
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // Calculate Today's Stats
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const todaysSessions = history.filter(s => s.startTime >= startOfToday.getTime())

    const totalTimeToday = todaysSessions.reduce((acc, s) => acc + (s.endTime - s.startTime), 0)
    const totalVideosToday = todaysSessions.reduce((acc, s) => acc + s.videoCount, 0)

    // Format Time Helper
    const formatTime = (ms: number) => {
        const minutes = Math.floor(ms / 60000)
        const hours = Math.floor(minutes / 60)
        if (hours > 0) return `${hours}h ${minutes % 60}m`
        return `${minutes}m`
    }

    // LAST 7 DAYS DATA
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        d.setHours(0, 0, 0, 0)
        return d
    })

    const chartData = last7Days.map(date => {
        const nextDay = new Date(date)
        nextDay.setDate(date.getDate() + 1)

        const daySessions = history.filter(s =>
            s.startTime >= date.getTime() && s.startTime < nextDay.getTime()
        )

        const dayMinutes = daySessions.reduce((acc, s) => acc + (s.endTime - s.startTime), 0) / 60000

        return {
            name: date.toLocaleDateString('en-US', { weekday: 'short' }),
            minutes: Math.round(dayMinutes),
            fullDate: date.toLocaleDateString()
        }
    })

    const handleChartClick = (data: any) => {
        // Support both formats: Direct data object (Bar click) or Recharts state (Chart click)
        const date = data?.fullDate || data?.activePayload?.[0]?.payload?.fullDate;
        if (date) {
            setSelectedDate(date);
        }
    }

    // Hourly Data Logic
    const hourlyData = last7Days.length > 0 ? (() => { // Wrapped in IIFE or just use memo to avoid error if reuse logic
        if (!selectedDate) return [];
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
    })() : [];

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
                        <button onClick={() => setShowSettings(false)} className="text-white/60 hover:text-white">
                            <Trash2 className="w-5 h-5 rotate-45" />
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
                                className={`w-12 h-6 rounded-full transition-colors relative ${showCapsule ? 'bg-green-500' : 'bg-white/10'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${showCapsule ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium">Experimental UI</div>
                                <div className="text-sm text-white/60">Enable liquid card design</div>
                            </div>
                            <button
                                onClick={toggleExperimentalMode}
                                className={`w-12 h-6 rounded-full transition-colors relative ${experimentalMode ? 'bg-indigo-500' : 'bg-white/10'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${experimentalMode ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10">
                        <button
                            onClick={() => {
                                if (confirm('Are you sure you want to delete all history? This cannot be undone.')) {
                                    clearData()
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

    const MainContent = () => (
        <div className="flex flex-col gap-6 w-full max-w-md mx-auto relative">
            <div className="flex justify-end">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSettings(true)}
                    className="text-muted-foreground hover:text-foreground"
                >
                    <Settings className="w-5 h-5" />
                </Button>
            </div>

            {/* Today's Overview */}
            <div className="grid grid-cols-2 gap-4">
                <Card className={experimentalMode ? "bg-white/10 backdrop-blur-md border-white/20 text-white shadow-none" : ""}>
                    <CardHeader className="p-4 pb-2">
                        <CardDescription className={experimentalMode ? "text-white/60" : ""}>Time Today</CardDescription>
                        <CardTitle className="text-2xl">{formatTime(totalTimeToday)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className={experimentalMode ? "bg-white/10 backdrop-blur-md border-white/20 text-white shadow-none" : ""}>
                    <CardHeader className="p-4 pb-2">
                        <CardDescription className={experimentalMode ? "text-white/60" : ""}>Videos Today</CardDescription>
                        <CardTitle className="text-2xl">{totalVideosToday}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Chart Section */}
            <Card className={experimentalMode ? "bg-white/10 backdrop-blur-md border-white/20 text-white shadow-none" : ""}>
                <CardHeader>
                    {selectedDate ? (
                        <div className="flex justify-between items-center">
                            <CardTitle>{selectedDate}</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)} className={experimentalMode ? "text-white hover:bg-white/10" : "text-primary hover:bg-primary/10"}>Back</Button>
                        </div>
                    ) : (
                        <>
                            <CardTitle>Last 7 Days</CardTitle>
                            <CardDescription className={experimentalMode ? "text-white/60" : ""}>Minutes spent watching</CardDescription>
                        </>
                    )}
                </CardHeader>
                <CardContent className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={selectedDate ? hourlyData : chartData}
                            className={!selectedDate ? "cursor-pointer" : ""}
                            margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
                            style={{ outline: "none" }}
                        >
                            <XAxis
                                dataKey="name"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                stroke={experimentalMode ? "#ffffff" : "#888888"}
                                interval={selectedDate ? 1 : 0}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '8px',
                                    backgroundColor: experimentalMode ? '#333' : '#fff',
                                    border: experimentalMode ? '1px solid #444' : '1px solid #ccc',
                                    pointerEvents: 'none'
                                }}
                                cursor={{ fill: 'transparent' }}
                                wrapperStyle={{ outline: 'none', pointerEvents: 'none' }}
                                isAnimationActive={false}
                            />
                            <Bar
                                dataKey="minutes"
                                radius={[4, 4, 0, 0]}
                                className={experimentalMode ? "" : "fill-primary"}
                            >
                                {((selectedDate ? hourlyData : chartData) as any[]).map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={experimentalMode ? "white" : undefined} // undefined to let className handle it or fallback
                                        onClick={!selectedDate ? () => handleChartClick(entry) : undefined}
                                        cursor={!selectedDate ? "pointer" : "default"}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Recent History List */}
            <div className="space-y-4">
                <h3 className={`font-semibold text-lg px-1 ${experimentalMode ? "text-white" : "text-muted-foreground"}`}>Recent Sessions</h3>
                {history.length === 0 && (
                    <div className={`text-center text-sm py-8 ${experimentalMode ? "text-white/50" : "text-muted-foreground"}`}>
                        No sessions yet.
                    </div>
                )}
                {history.slice(0, 5).map(session => (
                    <Card key={session.id} className={`overflow-hidden ${experimentalMode ? "bg-white/5 border-white/10 text-white shadow-none" : ""}`}>
                        <div className="flex items-center justify-between p-4">
                            <div>
                                <div className="font-semibold">
                                    {new Date(session.startTime).toLocaleDateString()} &middot; {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className={`text-sm ${experimentalMode ? "text-white/50" : "text-muted-foreground"}`}>
                                    {formatTime(session.endTime - session.startTime)} &middot; {session.videoCount} videos
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteSession(session.id)}
                                className={experimentalMode ? "text-white/50 hover:text-white hover:bg-white/10" : "text-destructive hover:text-destructive hover:bg-destructive/10"}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )

    if (experimentalMode) {
        return (
            <div className="min-h-screen -m-4 p-8 bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white">
                <SettingsModal />
                <AppleLiquidCard>
                    <MainContent />
                </AppleLiquidCard>
            </div>
        )
    }

    return (
        <div className="w-full">
            <SettingsModal />
            <MainContent />
        </div>
    )
}
