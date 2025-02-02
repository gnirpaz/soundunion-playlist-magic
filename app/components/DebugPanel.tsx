"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export type LogEntry = {
  timestamp: string
  type: 'request' | 'response' | 'error'
  endpoint?: string
  method?: string
  data?: Record<string, unknown>
  status?: number
  message: string
}

type DebugPanelProps = {
  logs: LogEntry[]
  onClear: () => void
}

export default function DebugPanel({ logs, onClear }: DebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="mt-8 font-mono text-xs">
      <div 
        className="flex items-center justify-between p-2 bg-black cursor-pointer hover:bg-black/80"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2 text-neutral-500">
          {isExpanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          <span>Debug Console ({logs.length})</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onClear()
          }}
          className="h-6 text-neutral-500 hover:text-neutral-300"
        >
          <X size={12} />
        </Button>
      </div>

      {isExpanded && (
        <div className="max-h-96 overflow-y-auto space-y-1 bg-black p-2">
          {logs.map((log, index) => (
            <div
              key={index}
              className="text-neutral-400 space-y-1"
            >
              <div className="flex justify-between opacity-50">
                <span>{log.timestamp}</span>
                <span>{log.type.toUpperCase()}</span>
              </div>
              {log.endpoint && (
                <div className="text-blue-400">
                  {log.method} {log.endpoint}
                </div>
              )}
              {log.status && (
                <div className="opacity-75">Status: {log.status}</div>
              )}
              <div className="text-neutral-300">{log.message}</div>
              {log.data && (
                <pre className="overflow-x-auto bg-black/50 p-1 text-neutral-400">
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 