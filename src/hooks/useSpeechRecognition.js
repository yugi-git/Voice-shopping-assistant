import { useCallback, useEffect, useRef, useState } from 'react'

const SpeechRecognitionImpl =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null

/**
 * Wraps the browser Web Speech API. Falls back gracefully (isSupported: false)
 * on browsers without support (e.g. Firefox) instead of crashing.
 */
export function useSpeechRecognition({ lang = 'en-US', onResult } = {}) {
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

  const isSupported = Boolean(SpeechRecognitionImpl)

  useEffect(() => {
    if (!isSupported) return
    const recognition = new SpeechRecognitionImpl()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = lang

    recognition.onresult = (event) => {
      let finalText = ''
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) finalText += transcript
        else interimText += transcript
      }
      if (interimText) setInterimTranscript(interimText)
      if (finalText) {
        setInterimTranscript('')
        onResultRef.current?.(finalText.trim())
      }
    }

    recognition.onerror = (event) => {
      setError(event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    return () => {
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      recognition.abort()
    }
  }, [lang, isSupported])

  const start = useCallback(() => {
    if (!recognitionRef.current || isListening) return
    setError(null)
    setInterimTranscript('')
    try {
      recognitionRef.current.start()
      setIsListening(true)
    } catch {
      // start() throws if already started; ignore.
    }
  }, [isListening])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  return { isSupported, isListening, interimTranscript, error, start, stop }
}
