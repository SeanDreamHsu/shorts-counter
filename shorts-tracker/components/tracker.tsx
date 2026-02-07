"use client"

import { useEffect, useState } from "react"
import { useTrackerStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Square, Plus } from "lucide-react"

export function Tracker() {
    const { currentSession, startSession, stopSession, incrementCount } = useTrackerStore()
    const [elapsed, setElapsed] = useState(0)

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (currentSession) {
            setElapsed(Date.now() - currentSession.startTime)
            interval = setInterval(() => {
                setElapsed(Date.now() - currentSession.startTime)
            }, 1000)
        } else {
            setElapsed(0)
        }
        return () => clearInterval(interval)
    }, [currentSession])

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000)
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        }
        return `${minutes}:${seconds.toString().padStart(2, "0")}`
    }

    if (!currentSession) {
        return (
            <Card className="w-full max-w-md mx-auto shadow-lg border-2 border-primary/10">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl font-bold tracking-tight">Ready to scroll?</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-6 items-center pt-6 pb-8">
                    <div className="text-muted-foreground text-center mb-4">
                        Start the timer when you open your shorts app.
                    </div>
                    <Button
                        size="lg"
                        className="w-32 h-32 rounded-full text-xl font-semibold shadow-xl transition-all hover:scale-105"
                        onClick={startSession}
                    >
                        <div className="flex flex-col items-center gap-2">
                            <Play className="w-8 h-8 fill-current" />
                            START
                        </div>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md mx-auto shadow-lg border-primary/20">
            <CardHeader className="text-center pb-2">
                <CardTitle className="text-4xl font-mono font-bold text-primary">
                    {formatTime(elapsed)}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-8 items-center pt-6 pb-8">
                <div className="text-center">
                    <div className="text-sm text-muted-foreground uppercase tracking-widest mb-1">Videos Watched</div>
                    <div className="text-6xl font-black tabular-nums">{currentSession.videoCount}</div>
                </div>

                <Button
                    variant="outline"
                    className="w-full h-32 text-2xl border-dashed border-2 hover:bg-muted/50 transition-colors"
                    onClick={incrementCount}
                >
                    <div className="flex flex-col items-center gap-2">
                        <Plus className="w-8 h-8" />
                        One More
                    </div>
                </Button>

                <Button
                    variant="destructive"
                    size="lg"
                    className="w-full font-semibold"
                    onClick={stopSession}
                >
                    <Square className="w-4 h-4 mr-2 fill-current" />
                    Stop Session
                </Button>
            </CardContent>
        </Card>
    )
}
