import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface Session {
  id: string
  startTime: number
  endTime: number
  videoCount: number
}

interface TrackerState {
  currentSession: {
    startTime: number
    videoCount: number
  } | null
  history: Session[]

  startSession: () => void
  incrementCount: () => void
  stopSession: () => void
  deleteSession: (id: string) => void

  experimentalMode: boolean
  showCapsule: boolean
  toggleExperimentalMode: () => void
  toggleCapsule: () => void
  clearData: () => void
}

export const useTrackerStore = create<TrackerState>()(
  persist(
    (set, get) => ({
      currentSession: null,
      history: [],

      startSession: () => {
        if (get().currentSession) return
        set({
          currentSession: {
            startTime: Date.now(),
            videoCount: 0,
          },
        })
      },

      incrementCount: () => {
        const { currentSession } = get()
        if (!currentSession) return
        set({
          currentSession: {
            ...currentSession,
            videoCount: currentSession.videoCount + 1,
          },
        })
      },

      stopSession: () => {
        const { currentSession, history } = get()
        if (!currentSession) return

        const newSession: Session = {
          id: crypto.randomUUID(),
          startTime: currentSession.startTime,
          endTime: Date.now(),
          videoCount: currentSession.videoCount,
        }

        set({
          currentSession: null,
          history: [newSession, ...history],
        })
      },

      deleteSession: (id) => {
        set((state) => ({
          history: state.history.filter((s) => s.id !== id),
        }))
      },

      experimentalMode: false,
      showCapsule: false,
      toggleExperimentalMode: () => set((state) => ({ experimentalMode: !state.experimentalMode })),
      toggleCapsule: () => set((state) => ({ showCapsule: !state.showCapsule })),

      clearData: () => set({ history: [], currentSession: null }),
    }),
    {
      name: 'shorts-tracker-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
