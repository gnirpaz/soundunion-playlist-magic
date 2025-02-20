"use client"

import { useState } from "react"
import { Send, Bot, Loader2 } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface AISongSuggestionsProps {
  onSongListGenerated: (songs: string[]) => void
}

export default function AISongSuggestions({ onSongListGenerated }: AISongSuggestionsProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setMessages(prev => [...prev, { role: "user", content: userMessage }])
    setInput("")
    setIsLoading(true)

    // TODO: Implement AI API call here
    // For now, just simulate a response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Here are some song suggestions based on your request. Would you like me to add them to your playlist?"
      }])
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="bg-black/50 rounded-xl border border-purple-500/20 overflow-hidden">
      <div className="p-4 border-b border-purple-500/20 flex items-center gap-2">
        <Bot className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">AI Song Suggestions</h3>
      </div>

      <div className="h-[200px] overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2 ${
                message.role === "user"
                  ? "bg-purple-500/20 text-white"
                  : "bg-black/50 text-purple-300"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-black/50 rounded-xl px-4 py-2 text-purple-300">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-purple-500/20">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., Suggest songs similar to Pink Floyd's Dark Side of the Moon..."
            className="flex-1 px-4 py-2 bg-black/50 rounded-xl border border-purple-500/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-white placeholder-purple-300/40"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 disabled:hover:bg-purple-500 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </form>
    </div>
  )
} 