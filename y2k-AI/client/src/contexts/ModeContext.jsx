import { createContext, useContext, useState, useEffect } from 'react'

const ModeContext = createContext(null)

export function ModeProvider({ children }) {
    const [mode, setModeState] = useState(() => localStorage.getItem('y2k_mode') || 'blue')
    const [switching, setSwitching] = useState(false)

    const setMode = async (newMode) => {
        if (newMode === mode) return
        setSwitching(true)
        // Tell server
        try {
            await fetch('/api/agent/mode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: newMode })
            })
        } catch { }
        localStorage.setItem('y2k_mode', newMode)
        setModeState(newMode)
        setTimeout(() => setSwitching(false), 400)
    }

    // Apply mode class to root
    useEffect(() => {
        document.documentElement.setAttribute('data-mode', mode)
    }, [mode])

    return (
        <ModeContext.Provider value={{ mode, setMode, switching, isBlue: mode === 'blue', isRed: mode === 'red' }}>
            {children}
        </ModeContext.Provider>
    )
}

export function useMode() {
    const ctx = useContext(ModeContext)
    if (!ctx) throw new Error('useMode must be used inside ModeProvider')
    return ctx
}
