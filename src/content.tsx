import type { PlasmoCSConfig } from "plasmo"
import { useState, useEffect } from "react"
import { useFloating, offset, flip, shift } from "@floating-ui/react"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

const lookupCache = new Map<string, any>()

export default function VocaHabitContent() {
  const [selectedText, setSelectedText] = useState("")
  const [isButtonVisible, setIsButtonVisible] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)

  const isFloatingVisible = isButtonVisible || isOpen

  const { refs, floatingStyles } = useFloating({
    open: isFloatingVisible,
    onOpenChange: (nextOpen) => {
      if (!nextOpen) {
        setIsButtonVisible(false)
        setIsOpen(false)
      }
    },
    middleware: [offset(8), flip(), shift()]
  })

  const handleLookupWord = async (word: string) => {
    const normalizedWord = word.trim()
    if (!normalizedWord) return

    if (lookupCache.has(normalizedWord.toLowerCase())) {
      const cachedData = lookupCache.get(normalizedWord.toLowerCase())
      setSelectedText(normalizedWord)
      setIsButtonVisible(false)
      setIsOpen(true)
      setLoading(false)
      setData(cachedData)
      return
    }

    setSelectedText(normalizedWord)
    setIsButtonVisible(false)
    setIsOpen(true)
    setLoading(true)
    setData(null)

    try {
      const res = await fetch("http://localhost:3000/api/xray", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: normalizedWord })
      })

      const resData = await res.json()
      lookupCache.set(normalizedWord.toLowerCase(), resData)
      setData(resData)
    } catch (error) {
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection()
      const text = selection?.toString().trim()

      if (!text || text.length === 0 || text.length > 50) {
        setIsButtonVisible(false)
        setIsOpen(false)
        return
      }

      const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null
      const rect = range?.getBoundingClientRect()

      if (rect) {
        refs.setReference({ getBoundingClientRect: () => rect })
      }

      setSelectedText(text)
      setIsButtonVisible(true)
      setIsOpen(false)
      setData(null)
      setLoading(false)
    }

    document.addEventListener("mouseup", handleMouseUp)
    return () => document.removeEventListener("mouseup", handleMouseUp)
  }, [refs])

  if (!isFloatingVisible) return null

  return (
    <div
      ref={refs.setFloating}
      style={{
        ...floatingStyles,
        zIndex: 999999,
        position: "fixed",
        fontFamily: "sans-serif",
        fontSize: "13px"
      }}
    >
      {isButtonVisible && !isOpen ? (
        <button
          onClick={() => handleLookupWord(selectedText)}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "999px",
            padding: "10px 16px",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            boxShadow: "0 15px 25px -5px rgba(37, 99, 235, 0.4)",
            whiteSpace: "nowrap"
          }}
        >
          Bắt đầu tra nghĩa
        </button>
      ) : (
        <div
          style={{
            background: "#0f172a",
            color: "#fff",
            padding: "16px",
            borderRadius: "12px",
            width: "280px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
            border: "1px solid #334155"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <strong style={{ color: "#38bdf8", fontSize: "15px" }}>{selectedText}</strong>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>

          {loading ? (
            <div style={{ color: "#94a3b8", padding: "10px 0" }}>🔍 VocaHabit đang tra cứu...</div>
          ) : data ? (
            <div>
              <p style={{ margin: "4px 0 8px 0", color: "#4ade80", fontWeight: "bold", fontSize: "14px" }}>
                {data.contextual_meaning}{" "}
                {data.phonetic && (
                  <span style={{ color: "#94a3b8", fontWeight: "normal", fontSize: "12px" }}>
                    [{data.phonetic}]
                  </span>
                )}
              </p>
              {data.collocations?.length > 0 && (
                <div style={{ marginTop: "8px" }}>
                  <span style={{ color: "#94a3b8", fontSize: "11px" }}>Ví dụ / Cụm từ:</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                    {data.collocations.map((c: string, i: number) => (
                      <span
                        key={i}
                        style={{
                          background: "#1e293b",
                          color: "#cbd5e1",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "11px"
                        }}
                      >
                        • {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: "#f87171" }}>Lỗi tra cứu. Hãy kiểm tra Backend Next.js.</div>
          )}
        </div>
      )}
    </div>
  )
}