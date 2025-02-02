"use client"

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { X, Copy, Check, ChevronRight, ChevronDown, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

type LogEntry = {
  timestamp: string
  message: string
  type: 'info' | 'error'
  data?: Record<string, unknown>
  expanded?: boolean
}

type LogGroup = {
  id: string
  title: string
  entries: LogEntry[]
}

type DebugContextType = {
  addLog: (message: string, type: 'info' | 'error', data?: Record<string, unknown>, groupId?: string) => void
  clearLogs: () => void
}

const DebugContext = createContext<DebugContextType | null>(null)

export function useDebug() {
  const context = useContext(DebugContext)
  if (!context) {
    throw new Error('useDebug must be used within a DebugProvider')
  }
  return context
}

export function DebugProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)  // Start closed by default
  const [logGroups, setLogGroups] = useState<LogGroup[]>([])
  const [copied, setCopied] = useState(false)
  const logsContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll when logs update
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight
    }
  }, [logGroups])

  const addLog = useCallback((message: string, type: 'info' | 'error', data?: Record<string, unknown>, groupId?: string) => {
    const entry = {
      timestamp: new Date().toISOString(),
      message,
      type,
      data,
      expanded: false
    }

    setLogGroups(prev => {
      if (groupId) {
        return prev.map(group => 
          group.id === groupId 
            ? { ...group, entries: [...group.entries, entry] }
            : group
        )
      }
      
      // Create new group if no groupId
      return [...prev, {
        id: Date.now().toString(),
        title: 'General',
        entries: [entry]
      }]
    })
  }, [])

  const toggleLogExpanded = useCallback((groupId: string, entryIndex: number) => {
    setLogGroups(prev => prev.map(group => 
      group.id === groupId 
        ? {
            ...group,
            entries: group.entries.map((entry, i) => 
              i === entryIndex ? { ...entry, expanded: !entry.expanded } : entry
            )
          }
        : group
    ))
  }, [])

  const clearLogs = useCallback(() => setLogGroups([]), [])

  const handleCopyLogs = useCallback(() => {
    const tempDiv = document.createElement('div')
    
    logGroups.forEach(group => {
      if (group.entries.length > 0) {
        // Add group title if there are multiple groups
        if (logGroups.length > 1) {
          const titleDiv = document.createElement('div')
          titleDiv.style.fontWeight = 'bold'
          titleDiv.textContent = group.title
          tempDiv.appendChild(titleDiv)
        }

        group.entries.forEach(entry => {
          const logDiv = document.createElement('div')
          logDiv.style.marginBottom = '8px'
          
          const header = document.createElement('div')
          header.style.opacity = '0.5'
          header.textContent = `${new Date(entry.timestamp).toLocaleTimeString()} ${entry.type.toUpperCase()}`
          logDiv.appendChild(header)
          
          const message = document.createElement('div')
          message.style.color = entry.type === 'error' ? '#f87171' : '#60a5fa'
          message.textContent = entry.message
          logDiv.appendChild(message)
          
          if (entry.data) {
            const pre = document.createElement('pre')
            pre.style.paddingLeft = '16px'
            pre.style.color = '#9ca3af'
            pre.textContent = JSON.stringify(entry.data, null, 2)
            logDiv.appendChild(pre)
          }
          
          tempDiv.appendChild(logDiv)
        })
      }
    })
    
    navigator.clipboard.writeText(tempDiv.innerText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [logGroups])

  const totalLogs = logGroups.reduce((sum, group) => sum + group.entries.length, 0)

  function getLogSummary(data: Record<string, unknown>) {
    if ('response' in data) {
      const response = data.response as { error?: { message: string }, tracks?: { items: unknown[] } }
      if (response?.error) {
        return `Error: ${response.error.message}`
      }
      if (response?.tracks?.items) {
        return `Found ${response.tracks.items.length} tracks`
      }
      return 'OK'
    }
    if ('trackId' in data) {
      return `Track: ${data.name} by ${data.artist}`
    }
    if ('playlistId' in data) {
      return `ID: ${data.playlistId}`
    }
    return Object.entries(data)[0]?.[1]?.toString() || 'View details'
  }

  return (
    <DebugContext.Provider value={{ addLog, clearLogs }}>
      <div className="flex">
        {/* Main Content - dynamic width based on panel state */}
        <div className={`flex-1 transition-all duration-300 ${isOpen ? 'pr-[400px]' : ''}`}>
          {children}
        </div>

        {/* Debug Panel - slides in/out */}
        <div 
          className={`w-[400px] h-screen fixed right-0 top-0 bg-black/95 border-l border-neutral-800 
            font-mono text-xs flex flex-col transition-transform duration-300 
            ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          {/* Toggle Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="absolute left-0 top-1/2 -translate-x-full transform bg-black/95 text-neutral-400 
              p-2 rounded-l-md border border-r-0 border-neutral-800 hover:text-neutral-200"
          >
            {isOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {/* Rest of debug panel content */}
          <div className="flex items-center justify-between p-2 border-b border-neutral-800">
            <span className="text-neutral-400">Debug Console ({totalLogs})</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLogs}
                className="h-6 text-neutral-500 hover:text-neutral-300 flex items-center"
                disabled={totalLogs === 0}
              >
                {copied ? (
                  <>
                    <Check size={12} className="mr-1" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} className="mr-1" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearLogs}
                className="h-6 text-neutral-500 hover:text-neutral-300"
                disabled={totalLogs === 0}
              >
                <X size={12} />
              </Button>
            </div>
          </div>
          
          <div 
            ref={logsContainerRef}
            className="flex-1 overflow-y-auto p-2 space-y-4"
          >
            {logGroups.map(group => (
              <div key={group.id} className="space-y-2">
                {logGroups.length > 1 && (
                  <h3 className="text-neutral-400 font-medium">{group.title}</h3>
                )}
                {group.entries.map((entry, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded ${
                      entry.type === 'error' 
                        ? 'bg-red-500/10 border border-red-500/20' 
                        : 'bg-blue-500/10 border border-blue-500/20'
                    }`}
                  >
                    <div className="flex justify-between text-xs opacity-50 mb-1">
                      <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                      <span>{entry.type.toUpperCase()}</span>
                    </div>
                    <div className={entry.type === 'error' ? 'text-red-400' : 'text-blue-400'}>
                      {entry.message}
                    </div>
                    {entry.data && (
                      <div>
                        <button
                          onClick={() => toggleLogExpanded(group.id, i)}
                          className="flex items-center mt-1 text-neutral-500 hover:text-neutral-300"
                        >
                          {entry.expanded ? (
                            <ChevronDown size={12} className="mr-1" />
                          ) : (
                            <ChevronRight size={12} className="mr-1" />
                          )}
                          {getLogSummary(entry.data)}
                        </button>
                        {entry.expanded && (
                          <pre className="mt-1 p-2 bg-black/50 rounded text-neutral-400 overflow-x-auto">
                            {JSON.stringify(entry.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DebugContext.Provider>
  )
} 