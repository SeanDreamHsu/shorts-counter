"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tracker } from "@/components/tracker"
import { Dashboard } from "@/components/dashboard"
import { BarChart3, Timer } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background p-4 pb-20 font-[family-name:var(--font-geist-sans)]">
      <header className="mb-8 pt-4 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-primary">Shorts Tracker</h1>
        <p className="text-muted-foreground">Mindful scrolling</p>
      </header>

      <main className="max-w-md mx-auto">
        <Tabs defaultValue="track" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="track" className="text-base">
              <Timer className="w-4 h-4 mr-2" />
              Track
            </TabsTrigger>
            <TabsTrigger value="stats" className="text-base">
              <BarChart3 className="w-4 h-4 mr-2" />
              Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="track">
            <Tracker />
          </TabsContent>

          <TabsContent value="stats">
            <Dashboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
