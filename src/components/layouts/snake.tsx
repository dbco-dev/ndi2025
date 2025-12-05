import { useState, useEffect, useCallback, useRef } from 'react'
import Window from '../blocks/window'

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type Position = { x: number; y: number }
type ScoreEntry = { name: string; score: number; date: string }

const GRID_SIZE = 20
const CELL_SIZE = 15
const INITIAL_SNAKE: Position[] = [{ x: 10, y: 10 }]
const INITIAL_DIRECTION: Direction = 'RIGHT'
const INITIAL_GAME_SPEED = 250 // Vitesse initiale plus lente
const MIN_GAME_SPEED = 80 // Vitesse minimale (maximum de difficulté)
const SPEED_INCREMENT = 3 // Réduction de la vitesse à chaque pomme (accélération)

function Snake({ uuid, title, initialPosition, initialSize, onClose, onClick, shouldBlink }: { uuid: number, title: string, initialPosition: { x: number, y: number }, initialSize: { width: number, height: number }, onClose: () => void, onClick: (position: { x: number, y: number }) => void, shouldBlink?: boolean }) {
    const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE)
    const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION)
    const [food, setFood] = useState<Position>({ x: 15, y: 15 })
    const [score, setScore] = useState(0)
    const [gameOver, setGameOver] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [gameStarted, setGameStarted] = useState(false)
    const [gameSpeed, setGameSpeed] = useState(INITIAL_GAME_SPEED)
    const [wavePhase, setWavePhase] = useState(0)
    const [showScoreboard, setShowScoreboard] = useState(false)
    const [scoreSubmitted, setScoreSubmitted] = useState(false)
    const [playerName, setPlayerName] = useState('')
    const [scoreboard, setScoreboard] = useState<ScoreEntry[]>([])
    const directionRef = useRef<Direction>(INITIAL_DIRECTION)
    const gameLoopRef = useRef<number | null>(null)
    const waveAnimationRef = useRef<number | null>(null)

    // Charger le scoreboard depuis localStorage
    useEffect(() => {
        const saved = localStorage.getItem('snake-scoreboard')
        if (saved) {
            try {
                setScoreboard(JSON.parse(saved))
            } catch (e) {
                console.error('Erreur lors du chargement du scoreboard:', e)
            }
        }
    }, [])

    // Sauvegarder le scoreboard dans localStorage
    const saveScoreboard = (newScoreboard: ScoreEntry[]) => {
        localStorage.setItem('snake-scoreboard', JSON.stringify(newScoreboard))
        setScoreboard(newScoreboard)
    }

    // Ajouter un score au scoreboard
    const addScore = (name: string, score: number) => {
        const newEntry: ScoreEntry = {
            name: name.toUpperCase().slice(0, 10), // Limiter à 10 caractères
            score: score,
            date: new Date().toLocaleDateString('fr-FR')
        }
        const updated = [...scoreboard, newEntry]
            .sort((a, b) => b.score - a.score) // Trier par score décroissant
            .slice(0, 10) // Garder seulement les 10 meilleurs
        saveScoreboard(updated)
        setScoreSubmitted(true)
        setShowScoreboard(true)
    }

    // Générer une nouvelle position de nourriture
    const generateFood = useCallback((currentSnake: Position[]): Position => {
        let newFood: Position
        let attempts = 0
        do {
            newFood = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            }
            attempts++
            // Éviter une boucle infinie si le serpent occupe tout l'espace
            if (attempts > 100) break
        } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y))
        return newFood
    }, [])

    // Vérifier les collisions
    const checkCollision = useCallback((head: Position, body: Position[]): boolean => {
        // Collision avec les murs
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
            return true
        }
        // Collision avec le corps
        return body.some(segment => segment.x === head.x && segment.y === head.y)
    }, [])

    // Boucle de jeu
    useEffect(() => {
        if (!gameStarted || gameOver || isPaused) {
            if (gameLoopRef.current) {
                clearInterval(gameLoopRef.current)
                gameLoopRef.current = null
            }
            return
        }

        gameLoopRef.current = window.setInterval(() => {
            setSnake(prevSnake => {
                const currentDirection = directionRef.current
                const head = { ...prevSnake[0] }

                // Calculer la nouvelle position de la tête
                switch (currentDirection) {
                    case 'UP':
                        head.y -= 1
                        break
                    case 'DOWN':
                        head.y += 1
                        break
                    case 'LEFT':
                        head.x -= 1
                        break
                    case 'RIGHT':
                        head.x += 1
                        break
                }

                // Vérifier les collisions
                if (checkCollision(head, prevSnake)) {
                    setGameOver(true)
                    return prevSnake
                }

                const newSnake = [head, ...prevSnake]

                // Vérifier si on mange la nourriture
                if (head.x === food.x && head.y === food.y) {
                    setScore(prev => prev + 10)
                    setFood(generateFood(newSnake))
                    // Accélérer légèrement le serpent (réduire le délai)
                    setGameSpeed(prevSpeed => Math.max(MIN_GAME_SPEED, prevSpeed - SPEED_INCREMENT))
                } else {
                    // Retirer la queue si on ne mange pas
                    newSnake.pop()
                }

                return newSnake
            })
        }, gameSpeed)

        return () => {
            if (gameLoopRef.current) {
                clearInterval(gameLoopRef.current)
            }
        }
    }, [gameStarted, gameOver, isPaused, food, checkCollision, generateFood, gameSpeed])

    // Animation d'ondulation du serpent
    useEffect(() => {
        if (!gameStarted || gameOver || isPaused) {
            if (waveAnimationRef.current) {
                cancelAnimationFrame(waveAnimationRef.current)
                waveAnimationRef.current = null
            }
            return
        }

        const animateWave = () => {
            setWavePhase(prev => prev + 0.1)
            waveAnimationRef.current = requestAnimationFrame(animateWave)
        }

        waveAnimationRef.current = requestAnimationFrame(animateWave)

        return () => {
            if (waveAnimationRef.current) {
                cancelAnimationFrame(waveAnimationRef.current)
            }
        }
    }, [gameStarted, gameOver, isPaused])

    // Gestion des touches clavier (ZQSD et flèches)
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (!gameStarted || gameOver) return

            const key = e.key.toLowerCase()
            const keyCode = e.key
            const currentDirection = directionRef.current

            // Gestion des flèches directionnelles
            if (keyCode === 'ArrowUp' || key === 'z') {
                if (currentDirection !== 'DOWN') {
                    directionRef.current = 'UP'
                    setDirection('UP')
                }
                e.preventDefault()
                return
            }
            if (keyCode === 'ArrowDown' || key === 's') {
                if (currentDirection !== 'UP') {
                    directionRef.current = 'DOWN'
                    setDirection('DOWN')
                }
                e.preventDefault()
                return
            }
            if (keyCode === 'ArrowLeft' || key === 'q') {
                if (currentDirection !== 'RIGHT') {
                    directionRef.current = 'LEFT'
                    setDirection('LEFT')
                }
                e.preventDefault()
                return
            }
            if (keyCode === 'ArrowRight' || key === 'd') {
                if (currentDirection !== 'LEFT') {
                    directionRef.current = 'RIGHT'
                    setDirection('RIGHT')
                }
                e.preventDefault()
                return
            }
            if (key === ' ') {
                e.preventDefault()
                setIsPaused(prev => !prev)
            }
        }

        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [gameStarted, gameOver])

    // Démarrer le jeu
    const startGame = () => {
        setGameStarted(true)
        setIsPaused(false)
    }

    // Réinitialiser le jeu
    const resetGame = () => {
        setSnake(INITIAL_SNAKE)
        setDirection(INITIAL_DIRECTION)
        directionRef.current = INITIAL_DIRECTION
        setFood(generateFood(INITIAL_SNAKE))
        setScore(0)
        setGameOver(false)
        setIsPaused(false)
        setGameStarted(false) // Remettre à l'écran de démarrage
        setGameSpeed(INITIAL_GAME_SPEED) // Réinitialiser la vitesse
        setWavePhase(0) // Réinitialiser l'ondulation
        setShowScoreboard(false) // Réinitialiser l'affichage du scoreboard
        setScoreSubmitted(false) // Réinitialiser l'état de soumission
        setPlayerName('') // Réinitialiser le nom
    }

    // Générer la nourriture initiale
    useEffect(() => {
        setFood(generateFood(INITIAL_SNAKE))
    }, [generateFood])

    return (
        <Window title={title} initialPosition={initialPosition} initialSize={{ width: 400, height: 450 }} onClose={onClose} onClick={onClick} shouldBlink={shouldBlink}>
            <div 
                className="w-full h-full p-4 flex flex-col items-center"
                style={{
                    background: `
                        repeating-linear-gradient(0deg, #1a1a1a 0px, #1a1a1a 2px, #0f0f0f 2px, #0f0f0f 4px),
                        repeating-linear-gradient(90deg, #1a1a1a 0px, #1a1a1a 2px, #0f0f0f 2px, #0f0f0f 4px)
                    `,
                    imageRendering: 'pixelated'
                }}
            >
                {!gameStarted ? (
                    // Écran de démarrage
                    <div className="w-full h-full flex flex-col items-center justify-center">
                        <h1 
                            className="mb-8"
                            style={{
                                fontSize: '48px',
                                fontFamily: 'monospace',
                                fontWeight: 'bold',
                                color: '#4ade80',
                                textShadow: '4px 4px 0px #000, 2px 2px 0px #22c55e',
                                letterSpacing: '4px',
                                imageRendering: 'pixelated',
                                textTransform: 'uppercase'
                            }}
                        >
                            SNAKE
                        </h1>
                        <div 
                            className="text-center mb-8 space-y-4"
                            style={{
                                fontFamily: 'monospace',
                                color: '#ffffff',
                                fontSize: '16px',
                                imageRendering: 'pixelated'
                            }}
                        >
                            <p style={{ fontSize: '20px', fontWeight: 'bold' }}>PRET A JOUER ?</p>
                            <div 
                                className="space-y-2"
                                style={{
                                    fontSize: '12px',
                                    color: '#a0a0a0',
                                    border: '2px solid #333',
                                    padding: '12px',
                                    backgroundColor: '#1a1a1a',
                                    imageRendering: 'pixelated'
                                }}
                            >
                                <p>CONTROLES: Z/↑ (HAUT), Q/← (GAUCHE)</p>
                                <p>S/↓ (BAS), D/→ (DROITE)</p>
                                <p>ESPACE = PAUSE</p>
                            </div>
                        </div>
                        <button
                            onClick={startGame}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: '#22c55e',
                                color: '#000000',
                                fontFamily: 'monospace',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                border: '4px solid #000',
                                boxShadow: '4px 4px 0px #15803d, inset 2px 2px 0px rgba(255,255,255,0.2)',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                                imageRendering: 'pixelated',
                                transition: 'none'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#4ade80'
                                e.currentTarget.style.transform = 'translate(2px, 2px)'
                                e.currentTarget.style.boxShadow = '2px 2px 0px #15803d, inset 2px 2px 0px rgba(255,255,255,0.2)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#22c55e'
                                e.currentTarget.style.transform = 'translate(0, 0)'
                                e.currentTarget.style.boxShadow = '4px 4px 0px #15803d, inset 2px 2px 0px rgba(255,255,255,0.2)'
                            }}
                        >
                            DEMARRER
                        </button>
                    </div>
                ) : (
                    <>
                        <div 
                            className="mb-4 flex justify-between items-center w-full"
                            style={{
                                fontFamily: 'monospace',
                                imageRendering: 'pixelated'
                            }}
                        >
                            <div 
                                style={{
                                    color: '#ffffff',
                                    fontWeight: 'bold',
                                    fontSize: '18px',
                                    textShadow: '2px 2px 0px #000'
                                }}
                            >
                                SCORE: <span style={{ color: '#4ade80' }}>{score.toString().padStart(4, '0')}</span>
                            </div>
                            {isPaused && (
                                <div 
                                    style={{
                                        color: '#fbbf24',
                                        fontWeight: 'bold',
                                        fontSize: '18px',
                                        textShadow: '2px 2px 0px #000',
                                        letterSpacing: '2px'
                                    }}
                                >
                                    PAUSE
                                </div>
                            )}
                            {gameOver && (
                                <div 
                                    style={{
                                        color: '#ef4444',
                                        fontWeight: 'bold',
                                        fontSize: '18px',
                                        textShadow: '2px 2px 0px #000',
                                        letterSpacing: '2px'
                                    }}
                                >
                                    GAME OVER
                                </div>
                            )}
                        </div>

                        <div 
                            className="relative"
                            style={{
                                width: `${GRID_SIZE * CELL_SIZE}px`,
                                height: `${GRID_SIZE * CELL_SIZE}px`,
                                backgroundColor: '#0a0a0a',
                                border: '4px solid #000',
                                boxShadow: 'inset 2px 2px 0px #333, inset -2px -2px 0px #000',
                                imageRendering: 'pixelated'
                            }}
                        >
                    {/* Damier - lignes de grille pixel art */}
                    {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
                        <div
                            key={`v-${i}`}
                            className="absolute"
                            style={{
                                left: `${i * CELL_SIZE}px`,
                                top: 0,
                                width: '1px',
                                height: '100%',
                                backgroundColor: '#1a1a1a',
                                imageRendering: 'pixelated'
                            }}
                        />
                    ))}
                    {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
                        <div
                            key={`h-${i}`}
                            className="absolute"
                            style={{
                                left: 0,
                                top: `${i * CELL_SIZE}px`,
                                width: '100%',
                                height: '1px',
                                backgroundColor: '#1a1a1a',
                                imageRendering: 'pixelated'
                            }}
                        />
                    ))}

                    {/* Nourriture - Pomme pixel art */}
                    <div
                        className="absolute z-10"
                        style={{
                            left: `${food.x * CELL_SIZE}px`,
                            top: `${food.y * CELL_SIZE}px`,
                            width: `${CELL_SIZE}px`,
                            height: `${CELL_SIZE}px`,
                            imageRendering: 'pixelated'
                        }}
                    >
                        {/* Tige de la pomme */}
                        <div
                            className="absolute"
                            style={{
                                left: '6px',
                                top: '-2px',
                                width: '2px',
                                height: '3px',
                                backgroundColor: '#2d5016',
                                imageRendering: 'pixelated'
                            }}
                        />
                        {/* Corps de la pomme - pixel art */}
                        <div
                            className="absolute"
                            style={{
                                left: '1px',
                                top: '1px',
                                width: `${CELL_SIZE - 2}px`,
                                height: `${CELL_SIZE - 2}px`,
                                background: `
                                    linear-gradient(135deg, #ff0000 0%, #ff3333 25%, #cc0000 50%, #ff3333 75%, #ff0000 100%)
                                `,
                                border: '1px solid #990000',
                                boxShadow: `
                                    inset 2px 2px 0px rgba(255, 200, 200, 0.3),
                                    inset -2px -2px 0px rgba(99, 0, 0, 0.5)
                                `,
                                imageRendering: 'pixelated'
                            }}
                        />
                        {/* Reflet sur la pomme */}
                        <div
                            className="absolute"
                            style={{
                                left: '3px',
                                top: '3px',
                                width: '4px',
                                height: '4px',
                                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                                imageRendering: 'pixelated'
                            }}
                        />
                    </div>

                    {/* Serpent - pixel art avec ondulation */}
                    {snake.map((segment, index) => {
                        // Calculer l'offset d'ondulation basé sur la position dans le corps
                        const waveOffset = Math.sin((snake.length - index) * 0.5 + wavePhase) * 0.8
                        const isHead = index === 0
                        const isTail = index === snake.length - 1

                        return (
                            <div
                                key={index}
                                className="absolute z-10"
                                style={{
                                    left: `${segment.x * CELL_SIZE}px`,
                                    top: `${segment.y * CELL_SIZE + waveOffset}px`,
                                    width: `${CELL_SIZE}px`,
                                    height: `${CELL_SIZE}px`,
                                    imageRendering: 'pixelated'
                                }}
                            >
                                {/* Corps du serpent - style pixel art */}
                                <div
                                    className="absolute"
                                    style={{
                                        left: '0px',
                                        top: '0px',
                                        width: `${CELL_SIZE}px`,
                                        height: `${CELL_SIZE}px`,
                                        backgroundColor: isHead ? '#4ade80' : isTail ? '#16a34a' : '#22c55e',
                                        border: `2px solid ${isHead ? '#22c55e' : isTail ? '#15803d' : '#16a34a'}`,
                                        boxShadow: `
                                            inset 1px 1px 0px rgba(134, 239, 172, 0.5),
                                            inset -1px -1px 0px rgba(20, 83, 45, 0.5),
                                            0 0 2px rgba(34, 197, 94, 0.3)
                                        `,
                                        imageRendering: 'pixelated'
                                    }}
                                />
                                {/* Yeux sur la tête */}
                                {isHead && (
                                    <>
                                        <div
                                            className="absolute"
                                            style={{
                                                left: '3px',
                                                top: '3px',
                                                width: '2px',
                                                height: '2px',
                                                backgroundColor: '#000000',
                                                imageRendering: 'pixelated'
                                            }}
                                        />
                                        <div
                                            className="absolute"
                                            style={{
                                                right: '3px',
                                                top: '3px',
                                                width: '2px',
                                                height: '2px',
                                                backgroundColor: '#000000',
                                                imageRendering: 'pixelated'
                                            }}
                                        />
                                    </>
                                )}
                                {/* Motif pixel art sur le corps */}
                                {!isHead && !isTail && (
                                    <div
                                        className="absolute"
                                        style={{
                                            left: '4px',
                                            top: '4px',
                                            width: '2px',
                                            height: '2px',
                                            backgroundColor: 'rgba(34, 197, 94, 0.4)',
                                            imageRendering: 'pixelated'
                                        }}
                                    />
                                )}
                            </div>
                        )
                    })}
                        </div>

                        <div 
                            className="mt-4 text-center"
                            style={{
                                fontFamily: 'monospace',
                                color: '#a0a0a0',
                                fontSize: '10px',
                                imageRendering: 'pixelated',
                                border: '2px solid #333',
                                padding: '8px',
                                backgroundColor: '#1a1a1a'
                            }}
                        >
                            <p>Z/↑ Q/← S/↓ D/→ | ESPACE = PAUSE</p>
                        </div>

                        {gameOver && !showScoreboard && !scoreSubmitted && (
                            <div 
                                className="mt-4 w-full"
                                style={{
                                    fontFamily: 'monospace',
                                    imageRendering: 'pixelated'
                                }}
                            >
                                <div 
                                    style={{
                                        border: '4px solid #000',
                                        backgroundColor: '#1a1a1a',
                                        padding: '16px',
                                        marginBottom: '12px'
                                    }}
                                >
                                    <p 
                                        style={{
                                            color: '#ffffff',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            marginBottom: '12px',
                                            textAlign: 'center'
                                        }}
                                    >
                                        VOTRE SCORE: <span style={{ color: '#4ade80' }}>{score.toString().padStart(4, '0')}</span>
                                    </p>
                                    <input
                                        type="text"
                                        value={playerName}
                                        onChange={(e) => setPlayerName(e.target.value)}
                                        placeholder="ENTREZ VOTRE NOM"
                                        maxLength={10}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            fontFamily: 'monospace',
                                            fontSize: '14px',
                                            backgroundColor: '#0a0a0a',
                                            color: '#ffffff',
                                            border: '2px solid #333',
                                            textTransform: 'uppercase',
                                            imageRendering: 'pixelated',
                                            textAlign: 'center'
                                        }}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && playerName.trim()) {
                                                addScore(playerName.trim(), score)
                                            }
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => {
                                            if (playerName.trim()) {
                                                addScore(playerName.trim(), score)
                                            }
                                        }}
                                        disabled={!playerName.trim()}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: playerName.trim() ? '#22c55e' : '#666',
                                            color: '#000000',
                                            fontFamily: 'monospace',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            border: '4px solid #000',
                                            boxShadow: '4px 4px 0px #15803d',
                                            cursor: playerName.trim() ? 'pointer' : 'not-allowed',
                                            textTransform: 'uppercase',
                                            letterSpacing: '2px',
                                            imageRendering: 'pixelated',
                                            transition: 'none'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (playerName.trim()) {
                                                e.currentTarget.style.backgroundColor = '#4ade80'
                                                e.currentTarget.style.transform = 'translate(2px, 2px)'
                                                e.currentTarget.style.boxShadow = '2px 2px 0px #15803d'
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (playerName.trim()) {
                                                e.currentTarget.style.backgroundColor = '#22c55e'
                                                e.currentTarget.style.transform = 'translate(0, 0)'
                                                e.currentTarget.style.boxShadow = '4px 4px 0px #15803d'
                                            }
                                        }}
                                    >
                                        ENREGISTRER
                                    </button>
                                    <button
                                        onClick={() => setShowScoreboard(true)}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#3b82f6',
                                            color: '#000000',
                                            fontFamily: 'monospace',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            border: '4px solid #000',
                                            boxShadow: '4px 4px 0px #1e40af',
                                            cursor: 'pointer',
                                            textTransform: 'uppercase',
                                            letterSpacing: '2px',
                                            imageRendering: 'pixelated',
                                            transition: 'none'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#60a5fa'
                                            e.currentTarget.style.transform = 'translate(2px, 2px)'
                                            e.currentTarget.style.boxShadow = '2px 2px 0px #1e40af'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = '#3b82f6'
                                            e.currentTarget.style.transform = 'translate(0, 0)'
                                            e.currentTarget.style.boxShadow = '4px 4px 0px #1e40af'
                                        }}
                                    >
                                        SCOREBOARD
                                    </button>
                                </div>
                            </div>
                        )}

                        {gameOver && showScoreboard && (
                            <div 
                                className="mt-4 w-full"
                                style={{
                                    fontFamily: 'monospace',
                                    imageRendering: 'pixelated'
                                }}
                            >
                                <div 
                                    style={{
                                        border: '4px solid #000',
                                        backgroundColor: '#1a1a1a',
                                        padding: '16px',
                                        marginBottom: '12px'
                                    }}
                                >
                                    <h2 
                                        style={{
                                            color: '#4ade80',
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            marginBottom: '12px',
                                            textAlign: 'center',
                                            textShadow: '2px 2px 0px #000',
                                            letterSpacing: '2px'
                                        }}
                                    >
                                        TOP 10 SCORES
                                    </h2>
                                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        {scoreboard.length === 0 ? (
                                            <p style={{ color: '#666', textAlign: 'center', fontSize: '12px' }}>
                                                AUCUN SCORE ENREGISTRE
                                            </p>
                                        ) : (
                                            scoreboard.map((entry, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        padding: '6px 0',
                                                        borderBottom: '1px solid #333',
                                                        fontSize: '12px',
                                                        color: index === 0 ? '#fbbf24' : '#ffffff'
                                                    }}
                                                >
                                                    <span style={{ fontWeight: 'bold' }}>
                                                        #{index + 1} {entry.name}
                                                    </span>
                                                    <span style={{ color: '#4ade80', fontWeight: 'bold' }}>
                                                        {entry.score.toString().padStart(4, '0')}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={resetGame}
                                    style={{
                                        width: '100%',
                                        padding: '10px 20px',
                                        backgroundColor: '#22c55e',
                                        color: '#000000',
                                        fontFamily: 'monospace',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        border: '4px solid #000',
                                        boxShadow: '4px 4px 0px #15803d, inset 2px 2px 0px rgba(255,255,255,0.2)',
                                        cursor: 'pointer',
                                        textTransform: 'uppercase',
                                        letterSpacing: '2px',
                                        imageRendering: 'pixelated',
                                        transition: 'none'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#4ade80'
                                        e.currentTarget.style.transform = 'translate(2px, 2px)'
                                        e.currentTarget.style.boxShadow = '2px 2px 0px #15803d, inset 2px 2px 0px rgba(255,255,255,0.2)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#22c55e'
                                        e.currentTarget.style.transform = 'translate(0, 0)'
                                        e.currentTarget.style.boxShadow = '4px 4px 0px #15803d, inset 2px 2px 0px rgba(255,255,255,0.2)'
                                    }}
                                >
                                    RECOMMENCER
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Window>
    )
}

export default Snake