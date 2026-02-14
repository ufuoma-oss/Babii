'use client'

import { useEffect, useRef, useState } from 'react'

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showReveal, setShowReveal] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const gridSize = 4
    const totalPieces = gridSize * gridSize
    let pieces: HTMLDivElement[] = []

    // State for drag
    let isDragging = false
    let draggedPiece: HTMLDivElement | null = null
    let dragStartX = 0
    let dragStartY = 0
    let originalIndex = -1
    let hasMoved = false
    let currentOverPiece: HTMLDivElement | null = null
    let moveCount = 0

    // Create puzzle pieces
    function createPuzzle() {
      container.innerHTML = ''
      pieces = []
      moveCount = 0

      for (let i = 0; i < totalPieces; i++) {
        const row = Math.floor(i / gridSize)
        const col = i % gridSize

        const piece = document.createElement('div')
        piece.className = 'puzzle-piece'
        piece.dataset.originalIndex = String(i)
        piece.dataset.currentIndex = String(i)

        const bgX = (col / (gridSize - 1)) * 100
        const bgY = (row / (gridSize - 1)) * 100

        Object.assign(piece.style, {
          width: '100%',
          height: '100%',
          backgroundImage: 'url(/puzzle-image.png)',
          backgroundSize: '400% 400%',
          backgroundPosition: `${bgX}% ${bgY}%`,
          borderRadius: '8px',
          cursor: 'grab',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserDrag: 'none',
          transition: 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.22s ease',
          willChange: 'transform',
          transform: 'scale(1)',
        } as CSSStyleDeclaration)

        piece.addEventListener('pointerdown', onPointerDown, { passive: false })
        piece.addEventListener('contextmenu', (e) => e.preventDefault())

        pieces.push(piece)
        container.appendChild(piece)
      }
    }

    // Shuffle puzzle
    function shufflePuzzle() {
      const indices = pieces.map((_, i) => i)
      
      // Fisher-Yates shuffle
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[indices[i], indices[j]] = [indices[j], indices[i]]
      }

      // Ensure not solved
      if (indices.every((v, i) => v === i)) {
        ;[indices[0], indices[1]] = [indices[1], indices[0]]
      }

      // Reorder
      const newPieces: HTMLDivElement[] = indices.map((originalIdx) => {
        const piece = pieces[originalIdx]
        piece.dataset.currentIndex = String(indices.indexOf(originalIdx))
        return piece
      })

      container.innerHTML = ''
      newPieces.forEach((piece, i) => {
        piece.style.transition = 'transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)'
        piece.style.transform = 'scale(0.85)'
        container.appendChild(piece)

        setTimeout(() => {
          piece.style.transform = 'scale(1)'
          setTimeout(() => {
            piece.style.transition = 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.22s ease'
          }, 380)
        }, i * 28)
      })

      pieces = newPieces
      setHasPlayed(false)
      setIsComplete(false)
      moveCount = 0
    }

    // Check win
    function checkWin() {
      const solved = pieces.every((piece, index) => {
        return parseInt(piece.dataset.originalIndex || '0') === index
      })

      if (solved && moveCount > 0) {
        setIsComplete(true)
        setHasPlayed(true)
        // Celebration animation
        pieces.forEach((piece, i) => {
          setTimeout(() => {
            piece.style.transition = 'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)'
            piece.style.transform = 'scale(1.05)'
            setTimeout(() => {
              piece.style.transform = 'scale(1)'
            }, 140)
          }, i * 32)
        })
      }
    }

    // Pointer down
    function onPointerDown(e: PointerEvent) {
      e.preventDefault()
      
      const piece = e.currentTarget as HTMLDivElement

      isDragging = true
      draggedPiece = piece
      originalIndex = pieces.indexOf(piece)
      dragStartX = e.clientX
      dragStartY = e.clientY
      hasMoved = false

      piece.setPointerCapture(e.pointerId)
      piece.style.zIndex = '50'
      piece.style.cursor = 'grabbing'

      piece.addEventListener('pointermove', onPointerMove, { passive: false })
      piece.addEventListener('pointerup', onPointerUp)
      piece.addEventListener('pointercancel', onPointerUp)
    }

    // Pointer move
    function onPointerMove(e: PointerEvent) {
      e.preventDefault()
      
      if (!isDragging || !draggedPiece) return

      const dx = e.clientX - dragStartX
      const dy = e.clientY - dragStartY
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 5) {
        hasMoved = true
      }

      if (hasMoved) {
        // Smooth drag
        draggedPiece.style.transition = 'none'
        draggedPiece.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`
        draggedPiece.style.boxShadow = '0 20px 50px rgba(0,0,0,0.35)'

        // Find piece under
        draggedPiece.style.pointerEvents = 'none'
        const elementUnder = document.elementFromPoint(e.clientX, e.clientY) as HTMLDivElement
        draggedPiece.style.pointerEvents = 'auto'

        // Highlight target
        pieces.forEach((p) => {
          if (p !== draggedPiece) {
            if (p === elementUnder && p.classList.contains('puzzle-piece')) {
              if (currentOverPiece !== p) {
                currentOverPiece = p
                p.style.transition = 'transform 0.12s ease, box-shadow 0.12s ease'
                p.style.transform = 'scale(0.92)'
                p.style.boxShadow = '0 0 0 2.5px rgba(255, 138, 128, 0.7)'
              }
            } else {
              p.style.transition = 'transform 0.12s ease, box-shadow 0.12s ease'
              p.style.transform = 'scale(1)'
              p.style.boxShadow = 'none'
            }
          }
        })

        if (!elementUnder?.classList.contains('puzzle-piece')) {
          currentOverPiece = null
        }
      }
    }

    // Pointer up
    function onPointerUp(e: PointerEvent) {
      if (!isDragging || !draggedPiece) return

      const piece = draggedPiece

      piece.releasePointerCapture(e.pointerId)
      piece.removeEventListener('pointermove', onPointerMove)
      piece.removeEventListener('pointerup', onPointerUp)
      piece.removeEventListener('pointercancel', onPointerUp)

      // Find target
      piece.style.pointerEvents = 'none'
      const elementUnder = document.elementFromPoint(e.clientX, e.clientY) as HTMLDivElement
      piece.style.pointerEvents = 'auto'

      const fromIdx = originalIndex
      const toIdx = pieces.indexOf(elementUnder)

      // Reset styles first
      pieces.forEach((p) => {
        p.style.transition = 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.22s ease'
        p.style.transform = 'scale(1)'
        p.style.boxShadow = 'none'
        p.style.zIndex = '1'
        p.style.cursor = 'grab'
      })

      // Swap if valid
      if (hasMoved && elementUnder?.classList.contains('puzzle-piece') && fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
        moveCount++
        
        // Swap data
        const temp = piece.dataset.currentIndex
        piece.dataset.currentIndex = elementUnder.dataset.currentIndex
        elementUnder.dataset.currentIndex = temp

        // Swap in array
        ;[pieces[fromIdx], pieces[toIdx]] = [pieces[toIdx], pieces[fromIdx]]

        // Update DOM
        container.innerHTML = ''
        pieces.forEach((p) => container.appendChild(p))

        // Check win after animation
        setTimeout(checkWin, 120)
      }

      // Reset state
      isDragging = false
      draggedPiece = null
      originalIndex = -1
      hasMoved = false
      currentOverPiece = null
    }

    // Initialize
    createPuzzle()

    // Expose shuffle to external call
    ;(container as any).shufflePuzzle = shufflePuzzle

    // Cleanup
    return () => {
      pieces.forEach((piece) => {
        piece.removeEventListener('pointerdown', onPointerDown)
      })
    }
  }, [])

  const handleStart = () => {
    setHasStarted(true)
    const container = containerRef.current
    if (container && (container as any).shufflePuzzle) {
      ;(container as any).shufflePuzzle()
    }
  }

  const handleShuffle = () => {
    const container = containerRef.current
    if (container && (container as any).shufflePuzzle) {
      ;(container as any).shufflePuzzle()
    }
  }

  const handleReveal = () => {
    if (hasPlayed) {
      setShowReveal(true)
    }
  }

  const closeReveal = () => {
    setShowReveal(false)
  }

  const openPreview = () => setShowPreview(true)
  const closePreview = () => setShowPreview(false)

  // Floating hearts component
  const FloatingHearts = () => {
    const hearts = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2.5,
      duration: 3.5 + Math.random() * 3,
      size: 14 + Math.random() * 22,
      type: ['❤️', '💕', '💗', '💖'][Math.floor(Math.random() * 4)],
    }))

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 2000,
      }}>
        {hearts.map((heart) => (
          <div
            key={heart.id}
            style={{
              position: 'absolute',
              left: `${heart.left}%`,
              bottom: '-40px',
              fontSize: `${heart.size}px`,
              animation: `floatUp ${heart.duration}s ease-out ${heart.delay}s forwards`,
              filter: 'drop-shadow(0 0 8px rgba(255,100,100,0.5))',
            }}
          >
            {heart.type}
          </div>
        ))}
      </div>
    )
  }

  // Floating flowers component
  const FloatingFlowers = () => {
    const flowers = Array.from({ length: 24 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 4 + Math.random() * 4,
      size: 12 + Math.random() * 18,
      type: ['🌸', '🌹', '🪻', '🌷', '✨', '💫'][Math.floor(Math.random() * 6)],
    }))

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 2000,
      }}>
        {flowers.map((flower) => (
          <div
            key={flower.id}
            style={{
              position: 'absolute',
              left: `${flower.left}%`,
              top: '-40px',
              fontSize: `${flower.size}px`,
              animation: `fallDown ${flower.duration}s ease-in ${flower.delay}s forwards`,
              filter: 'drop-shadow(0 0 6px rgba(255,200,200,0.4))',
            }}
          >
            {flower.type}
          </div>
        ))}
      </div>
    )
  }

  return (
    <main style={{
      minHeight: '100vh',
      minHeight: '100dvh',
      background: 'linear-gradient(165deg, #0a0a0f 0%, #121218 50%, #1a1a22 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    }}>
      {/* Decorative gradient orbs */}
      <div style={{
        position: 'fixed',
        top: '-20%',
        right: '-20%',
        width: '60%',
        height: '60%',
        background: 'radial-gradient(circle, rgba(255,107,107,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed',
        bottom: '-30%',
        left: '-20%',
        width: '70%',
        height: '70%',
        background: 'radial-gradient(circle, rgba(255,154,139,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Hero Section */}
      <section style={{
        width: '100%',
        padding: 'clamp(1.5rem, 6vw, 2.5rem) 1.5rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
      }}>
        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(1.6rem, 6vw, 2.2rem)',
          fontWeight: '600',
          color: '#ffffff',
          margin: 0,
          textAlign: 'center',
          letterSpacing: '-0.03em',
          lineHeight: 1.2,
        }}>
          Puzzle Story
        </h1>

        {/* Instructions */}
        <p style={{
          fontSize: 'clamp(0.9rem, 3.5vw, 1rem)',
          color: 'rgba(255,255,255,0.5)',
          margin: 0,
          textAlign: 'center',
          maxWidth: '300px',
          lineHeight: 1.6,
          fontWeight: '400',
        }}>
          Piece us together to reveal the surprise I made for you.
        </p>

        {/* Preview Image Button */}
        <button
          onClick={openPreview}
          aria-label="Tap to preview full image"
          style={{
            position: 'relative',
            width: 'clamp(80px, 22vw, 110px)',
            aspectRatio: '1',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
            boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
            transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease',
          }}
        >
          <div style={{
            width: '100%',
            height: '100%',
            backgroundImage: 'url(/puzzle-image.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '6px',
            right: '6px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'rgba(20,20,25,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            🔍
          </div>
        </button>
      </section>

      {/* Puzzle Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.5rem 1rem 0.75rem',
        width: '100%',
        maxHeight: '55vh',
      }}>
        <div style={{
          position: 'relative',
          width: 'min(82vw, 360px)',
          aspectRatio: '1',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '20px',
          boxShadow: '0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
          padding: '3px',
          border: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div
            ref={containerRef}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gridTemplateRows: 'repeat(4, 1fr)',
              gap: '2px',
              width: '100%',
              height: '100%',
            }}
          />
        </div>
      </div>

      {/* Buttons */}
      <div style={{
        display: 'flex',
        gap: '0.65rem',
        padding: '0.5rem 1rem',
        paddingBottom: 'clamp(2rem, 8vw, 3.5rem)',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {/* Start / Shuffle Button */}
        {!hasStarted ? (
          <button
            onClick={handleStart}
            style={{
              padding: '0.95rem 2.5rem',
              fontSize: 'clamp(0.95rem, 3.5vw, 1rem)',
              fontWeight: '600',
              color: '#ffffff',
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)',
              border: 'none',
              borderRadius: '14px',
              cursor: 'pointer',
              boxShadow: '0 10px 35px rgba(255,107,107,0.35)',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease',
              touchAction: 'manipulation',
              letterSpacing: '0.01em',
            }}
          >
            Start
          </button>
        ) : (
          <button
            onClick={handleShuffle}
            style={{
              padding: '0.95rem 2.25rem',
              fontSize: 'clamp(0.95rem, 3.5vw, 1rem)',
              fontWeight: '600',
              color: '#ffffff',
              background: 'linear-gradient(135deg, #5c5c6e 0%, #6b6b80 100%)',
              border: 'none',
              borderRadius: '14px',
              cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease',
              touchAction: 'manipulation',
              letterSpacing: '0.01em',
            }}
          >
            Shuffle
          </button>
        )}
        
        {/* Reveal Button */}
        <button
          onClick={handleReveal}
          disabled={!hasPlayed}
          style={{
            padding: '0.95rem 2rem',
            fontSize: 'clamp(0.95rem, 3.5vw, 1rem)',
            fontWeight: '600',
            color: hasPlayed ? '#ffffff' : 'rgba(255,255,255,0.25)',
            background: hasPlayed 
              ? 'linear-gradient(135deg, #ff6b6b 0%, #ff9a8b 100%)'
              : 'rgba(255,255,255,0.04)',
            border: hasPlayed ? 'none' : '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            cursor: hasPlayed ? 'pointer' : 'not-allowed',
            boxShadow: hasPlayed 
              ? '0 10px 35px rgba(255,107,107,0.4)'
              : 'none',
            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease, background 0.35s ease',
            touchAction: 'manipulation',
            letterSpacing: '0.01em',
            opacity: hasPlayed ? 1 : 0.4,
          }}
        >
          Reveal ❤️
        </button>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div
          onClick={closePreview}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
            animation: 'fadeIn 0.22s ease',
            cursor: 'pointer',
          }}
        >
          <p style={{
            color: 'rgba(255,255,255,0.35)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            fontWeight: '400',
          }}>
            Tap anywhere to close
          </p>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(78vw, 380px)',
              aspectRatio: '1',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 40px 100px rgba(0,0,0,0.7)',
              animation: 'scaleIn 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{
              width: '100%',
              height: '100%',
              backgroundImage: 'url(/puzzle-image.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              pointerEvents: 'none',
            }} />
          </div>
        </div>
      )}

      {/* Romantic Reveal Modal */}
      {showReveal && (
        <>
          <FloatingHearts />
          <FloatingFlowers />
          <div
            onClick={closeReveal}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(180deg, rgba(10,5,15,0.97) 0%, rgba(25,15,25,0.99) 100%)',
              backdropFilter: 'blur(25px)',
              WebkitBackdropFilter: 'blur(25px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1500,
              padding: '1.5rem',
              cursor: 'pointer',
              animation: 'fadeIn 0.4s ease',
              overflow: 'hidden',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '390px',
                width: '100%',
                textAlign: 'center',
                animation: 'revealIn 0.75s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {/* Heart Glow */}
              <div style={{
                fontSize: 'clamp(3rem, 12vw, 4.5rem)',
                marginBottom: '1.25rem',
                animation: 'heartPulse 1.3s ease-in-out infinite',
                filter: 'drop-shadow(0 0 30px rgba(255,100,100,0.7)) drop-shadow(0 0 60px rgba(255,100,100,0.3))',
              }}>
                ❤️
              </div>

              {/* Message Card */}
              <div style={{
                background: 'linear-gradient(165deg, rgba(255,107,107,0.12) 0%, rgba(255,140,130,0.06) 100%)',
                border: '1px solid rgba(255,130,120,0.15)',
                borderRadius: '24px',
                padding: 'clamp(1.75rem, 5vw, 2.5rem) clamp(1.25rem, 4vw, 2rem)',
                boxShadow: '0 40px 80px rgba(255,107,107,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}>
                {/* Title */}
                <h2 style={{
                  fontSize: 'clamp(1.35rem, 5vw, 1.7rem)',
                  fontWeight: '600',
                  color: '#ffb4b4',
                  margin: '0 0 1.25rem 0',
                  letterSpacing: '-0.02em',
                }}>
                  Happy Valentine's Day, My Babii Love 💕
                </h2>

                {/* Love Message */}
                <div style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 'clamp(0.95rem, 3.5vw, 1.05rem)',
                  lineHeight: '1.85',
                  marginBottom: '1.25rem',
                  fontWeight: '400',
                }}>
                  <p style={{ margin: '0 0 0.9rem 0' }}>
                    On this day of love, I want you to know that you are my favorite person in the entire world. Every beat of my heart whispers your name, and every thought of you makes me smile.
                  </p>
                  <p style={{ margin: '0 0 0.9rem 0' }}>
                    You've turned my life into something beautiful — a love story I never want to end. Thank you for being you, for loving me the way you do, and for making every ordinary day feel extraordinary.
                  </p>
                  <p style={{ margin: '0', fontWeight: '500', color: '#ffc4c4' }}>
                    You are my heart, my soul, my forever Valentine. I love you more than words could ever say. 💖
                  </p>
                </div>

                {/* Signature */}
                <div style={{
                  borderTop: '1px solid rgba(255,130,120,0.12)',
                  paddingTop: '1.1rem',
                  color: 'rgba(255,255,255,0.45)',
                  fontSize: 'clamp(0.85rem, 3vw, 0.9rem)',
                  fontWeight: '400',
                }}>
                  Forever Yours 💝
                </div>
              </div>

              {/* Close hint */}
              <p style={{
                color: 'rgba(255,255,255,0.3)',
                fontSize: '0.8rem',
                marginTop: '1.5rem',
                fontWeight: '400',
              }}>
                Tap anywhere to close
              </p>
            </div>
          </div>
        </>
      )}

      {/* Global Styles */}
      <style jsx global>{`
        * {
          -webkit-tap-highlight-color: transparent;
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          padding: 0;
          overscroll-behavior: none;
        }

        button:active:not(:disabled) {
          transform: scale(0.97) !important;
        }

        button:disabled:active {
          transform: none !important;
        }

        .puzzle-piece {
          pointer-events: auto;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from { 
            opacity: 0; 
            transform: scale(0.85); 
          }
          to { 
            opacity: 1; 
            transform: scale(1); 
          }
        }

        @keyframes revealIn {
          0% { 
            opacity: 0; 
            transform: scale(0.85) translateY(25px); 
          }
          100% { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
        }

        @keyframes heartPulse {
          0%, 100% { 
            transform: scale(1); 
          }
          50% { 
            transform: scale(1.12); 
          }
        }

        @keyframes floatUp {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-105vh) rotate(360deg) scale(0.8);
            opacity: 0;
          }
        }

        @keyframes fallDown {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(105vh) rotate(360deg) scale(0.8);
            opacity: 0;
          }
        }
      `}</style>
    </main>
  )
}

