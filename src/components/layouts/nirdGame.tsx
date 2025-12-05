import { useState, useEffect, useRef } from 'react'
import Window from '../blocks/window'
import questionsData from '../../data/questions.json'

interface Question {
    id: number
    section: number
    text: string
    options: {
        a: string
        b: string
        c: string
        d: string
    }
    educationalText: string
}

interface Badge {
    id: number
    name: string
    description: string
    icon: string
}

interface Section {
    id: number
    name: string
    maxPoints: number
}

const sections: Section[] = questionsData.sections
const badges: Badge[] = questionsData.badges
const questions: Question[] = questionsData.questions

function NirdGame({ title, onClose, onClick, shouldBlink }: { title: string, onClose: () => void, onClick: (position: { x: number, y: number }) => void, shouldBlink?: boolean }) {
    const [gameStarted, setGameStarted] = useState(false)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [loading, setLoading] = useState<string | null>(null)
    const [answerResults, setAnswerResults] = useState<Record<string, boolean>>({})
    const [correctAnswer, setCorrectAnswer] = useState<string | string[] | null>(null)
    const [showNextButton, setShowNextButton] = useState(false)
    const [timeLeft, setTimeLeft] = useState(30)
    const [timerExpired, setTimerExpired] = useState(false)
    const [totalScore, setTotalScore] = useState(0)
    const [sectionScores, setSectionScores] = useState<Record<number, number>>({})
    const [earnedBadges, setEarnedBadges] = useState<Map<number, 'bronze' | 'argent' | 'or'>>(new Map())
    const [newBadgeEarned, setNewBadgeEarned] = useState<{ sectionId: number, level: 'bronze' | 'argent' | 'or' } | null>(null)
    const [rotatingBadges, setRotatingBadges] = useState<Set<number>>(new Set())
    const [gameFinished, setGameFinished] = useState(false)
    const [correctAnswersCount, setCorrectAnswersCount] = useState(0)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    
    // Calculer les dimensions en plein écran au montage
    const [fullscreenSize, setFullscreenSize] = useState(() => ({
        width: typeof window !== 'undefined' ? window.innerWidth : 1920,
        height: typeof window !== 'undefined' ? window.innerHeight : 1080
    }))
    const fullscreenPosition = { x: 0, y: 0 }
    
    // Mettre à jour les dimensions si la fenêtre est redimensionnée
    useEffect(() => {
        const updateSize = () => {
            setFullscreenSize({
                width: window.innerWidth,
                height: window.innerHeight
            })
        }
        
        window.addEventListener('resize', updateSize)
        return () => window.removeEventListener('resize', updateSize)
    }, [])
    
    const maxScore = questions.length * 25 // 24 questions × 25 points max = 600 points

    const currentQuestion = questions[currentQuestionIndex]
    const isLastQuestion = currentQuestionIndex === questions.length - 1

    // Gestion du timer
    useEffect(() => {
        // Réinitialiser le timer à chaque nouvelle question
        setTimeLeft(30)
        setTimerExpired(false)
        setCorrectAnswer(null)
        setAnswerResults({})
        setShowNextButton(false)

        const questionId = currentQuestion.id

        // Fonction pour révéler la bonne réponse automatiquement
        const revealCorrectAnswer = async () => {
            try {
                // On envoie une requête avec une réponse vide pour obtenir la bonne réponse
                const response = await fetch('http://eaglenest.fr:4000/api/checkAnswer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ question: questionId, answer: '' }),
                })
                const data = await response.json()
                
                // Stocker la bonne réponse
                setCorrectAnswer(data.correctAnswer)
                setShowNextButton(true)
                setTimerExpired(true)
            } catch (error) {
                console.error('Erreur lors de l\'appel API:', error)
            }
        }

        // Démarrer le décompte
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    // Le timer est terminé, révéler la bonne réponse
                    if (timerRef.current) {
                        clearInterval(timerRef.current)
                    }
                    revealCorrectAnswer()
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        // Nettoyer le timer au démontage ou changement de question
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
    }, [currentQuestionIndex])

    // Arrêter le timer si l'utilisateur a répondu
    useEffect(() => {
        if (correctAnswer !== null && !timerExpired) {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
    }, [correctAnswer, timerExpired])

    const handleAnswerClick = async (question: number, answer: string) => {
        // Sauvegarder le temps restant au moment de la réponse
        const currentTimeLeft = timeLeft
        setLoading(answer)
        
        // Arrêter le timer immédiatement
        if (timerRef.current) {
            clearInterval(timerRef.current)
        }
        
        try {
            const response = await fetch('http://eaglenest.fr:4000/api/checkAnswer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question, answer }),
            })
            const data = await response.json()
            console.log('Réponse API:', data)
            
            // Stocker le résultat pour cette réponse
            setAnswerResults(prev => ({
                ...prev,
                [answer]: data.isCorrect
            }))
            
            // Si la réponse est correcte, calculer les points selon la nouvelle logique
            if (data.isCorrect && currentTimeLeft !== null) {
                // Nouvelle logique : 25 points si réponse dans les 5 premières secondes (timeLeft >= 25)
                // Sinon, autant de points que de secondes restantes
                const pointsEarned = currentTimeLeft >= 25 ? 25 : currentTimeLeft
                setTotalScore(prev => prev + pointsEarned)
                setCorrectAnswersCount(prev => prev + 1)
                
                // Mettre à jour timeAtAnswer pour l'affichage
                
                // Ajouter les points à la section correspondante
                const questionData = questions.find(q => q.id === question)
                if (questionData) {
                    setSectionScores(prev => {
                        const newScores = {
                            ...prev,
                            [questionData.section]: (prev[questionData.section] || 0) + pointsEarned
                        }
                        
                        // Vérifier si un badge est obtenu selon le pourcentage de points
                        const section = sections.find(s => s.id === questionData.section)
                        if (section) {
                            const sectionScore = newScores[questionData.section]
                            const maxPoints = section.maxPoints
                            const percentage = sectionScore / maxPoints
                            
                            // Déterminer le niveau du badge
                            let badgeLevel: 'bronze' | 'argent' | 'or' | null = null
                            if (percentage >= 0.75) { // 3/4 = 75%
                                badgeLevel = 'or'
                            } else if (percentage >= 0.6667) { // 2/3 = 66.67%
                                badgeLevel = 'argent'
                            } else if (percentage >= 0.35) { // 35%
                                badgeLevel = 'bronze'
                            }
                            
                            // Vérifier si on a obtenu un nouveau niveau ou amélioré un niveau existant
                            if (badgeLevel) {
                                const currentLevel = earnedBadges.get(questionData.section)
                                const levelOrder = { bronze: 1, argent: 2, or: 3 }
                                const shouldUpdate = !currentLevel || levelOrder[badgeLevel] > levelOrder[currentLevel]
                                
                                if (shouldUpdate) {
                                    // Si c'est une amélioration de niveau (pas juste un nouveau badge), déclencher la rotation
                                    if (currentLevel && levelOrder[badgeLevel] > levelOrder[currentLevel]) {
                                        setRotatingBadges(prev => new Set([...prev, questionData.section]))
                                        // Retirer de l'animation après la fin de l'animation
                                        setTimeout(() => {
                                            setRotatingBadges(prev => {
                                                const newSet = new Set(prev)
                                                newSet.delete(questionData.section)
                                                return newSet
                                            })
                                        }, 800)
                                    }
                                    
                                    setEarnedBadges(prev => {
                                        const newMap = new Map(prev)
                                        newMap.set(questionData.section, badgeLevel!)
                                        return newMap
                                    })
                                    setNewBadgeEarned({ sectionId: questionData.section, level: badgeLevel! })
                                    // Masquer la notification après 5 secondes
                                    setTimeout(() => setNewBadgeEarned(null), 5000)
                                }
                            }
                        }
                        
                        return newScores
                    })
                }
            }
            
            // Stocker la bonne réponse
            setCorrectAnswer(data.correctAnswer)
            setShowNextButton(true)
        } catch (error) {
            console.error('Erreur lors de l\'appel API:', error)
        } finally {
            setLoading(null)
        }
    }

    const handleNextQuestion = () => {
        if (isLastQuestion) {
            // Terminer le questionnaire
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
            setGameFinished(true)
        } else {
            // Arrêter le timer actuel
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
            setCurrentQuestionIndex(prev => prev + 1)
            setLoading(null)
            setAnswerResults({})
            setCorrectAnswer(null)
            setShowNextButton(false)
            setTimerExpired(false)
        }
    }

    const handleRestart = () => {
        // Réinitialiser tous les états
        setGameStarted(false)
        setCurrentQuestionIndex(0)
        setLoading(null)
        setAnswerResults({})
        setCorrectAnswer(null)
        setShowNextButton(false)
        setTimeLeft(30)
        setTimerExpired(false)
        setTotalScore(0)
        setSectionScores({})
        setEarnedBadges(new Map())
        setNewBadgeEarned(null)
        setRotatingBadges(new Set())
        setGameFinished(false)
        setCorrectAnswersCount(0)
    }

    const handleStartGame = () => {
        setGameStarted(true)
    }

    const handleSkipQuestion = () => {
        // Arrêter le timer actuel
        if (timerRef.current) {
            clearInterval(timerRef.current)
        }
        
        // Révéler la bonne réponse automatiquement
        const revealCorrectAnswer = async () => {
            try {
                const response = await fetch('http://eaglenest.fr:4000/api/checkAnswer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ question: currentQuestion.id, answer: '' }),
                })
                const data = await response.json()
                setCorrectAnswer(data.correctAnswer)
                setShowNextButton(true)
                setTimerExpired(true)
            } catch (error) {
                console.error('Erreur lors de l\'appel API:', error)
            }
        }
        
        revealCorrectAnswer()
    }

    const handleStopGame = () => {
        // Arrêter le timer actuel
        if (timerRef.current) {
            clearInterval(timerRef.current)
        }
        // Terminer le questionnaire
        setGameFinished(true)
    }
    
    const getButtonClassName = (answer: string) => {
        const baseClass = 'px-3 sm:px-4 md:px-5 py-2 sm:py-3 md:py-4 rounded-xl sm:rounded-2xl transition-all duration-300 text-left backdrop-blur-md border relative overflow-hidden flex items-start gap-2 sm:gap-3'
        
        // Si on a reçu une réponse de l'API
        if (correctAnswer !== null) {
            // Vérifier si cette réponse est la bonne
            const isThisCorrect = Array.isArray(correctAnswer) 
                ? correctAnswer.includes(answer)
                : correctAnswer === answer
            
            // Si c'est la bonne réponse, toujours en vert avec effet glass
            if (isThisCorrect) {
                return `${baseClass} bg-gradient-to-r from-emerald-400/30 to-green-500/30 text-white border-emerald-300/50 shadow-lg shadow-emerald-500/30`
            }
            
            // Si c'est la réponse choisie et qu'elle est incorrecte, en rouge avec effet glass
            if (answerResults[answer] === false) {
                return `${baseClass} bg-gradient-to-r from-red-400/30 to-rose-500/30 text-white border-red-300/50 shadow-lg shadow-red-500/30`
            }
        }
        
        // État de chargement
        if (loading === answer) {
            return `${baseClass} bg-white/20 text-gray-600 border-white/30 opacity-50 cursor-not-allowed`
        }
        
        // État par défaut avec effet glass
        return `${baseClass} bg-white/20 hover:bg-white/30 text-gray-800 border-white/40 hover:border-white/60 shadow-md hover:shadow-xl hover:scale-[1.02]`
    }

    const progressPercentage = (totalScore / maxScore) * 100
    const successRate = (correctAnswersCount / questions.length) * 100

    // Fonction helper pour obtenir les couleurs selon le niveau du badge
    const getBadgeColors = (level: 'bronze' | 'argent' | 'or') => {
        switch (level) {
            case 'bronze':
                return {
                    bg: 'from-amber-600/60 via-amber-700/50 to-amber-800/60',
                    border: 'from-amber-700 via-amber-800 to-amber-900',
                    glow: 'rgba(180, 83, 9, 0.6)',
                    text: 'Bronze'
                }
            case 'argent':
                return {
                    bg: 'from-gray-300/60 via-gray-400/50 to-gray-500/60',
                    border: 'from-gray-400 via-gray-500 to-gray-600',
                    glow: 'rgba(156, 163, 175, 0.6)',
                    text: 'Argent'
                }
            case 'or':
                return {
                    bg: 'from-yellow-400/60 via-amber-400/50 to-amber-600/60',
                    border: 'from-yellow-300 via-amber-400 to-yellow-600',
                    glow: 'rgba(251, 191, 36, 0.6)',
                    text: 'Or'
                }
        }
    }

    // Page de démarrage
    if (!gameStarted) {
        return (
            <Window title={title} initialPosition={fullscreenPosition} initialSize={fullscreenSize} onClose={onClose} onClick={onClick} shouldBlink={shouldBlink}>
                <div className="w-full h-full p-2 sm:p-4 md:p-6 lg:p-8 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 relative overflow-y-auto">
                    {/* Effets de lumière en arrière-plan */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-30">
                        <div className="absolute top-20 left-20 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-72 lg:h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
                        <div className="absolute top-40 right-20 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-72 lg:h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-700"></div>
                        <div className="absolute bottom-20 left-1/2 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-72 lg:h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
                    </div>
                    
                    <div className="text-center mb-4 sm:mb-6 md:mb-8 relative z-10 w-full px-2">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 sm:mb-3 md:mb-4 drop-shadow-lg">
                            🎮 Bienvenue au Quiz !
                        </h1>
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 font-medium">Testez vos connaissances</p>
                    </div>

                    <div className="backdrop-blur-xl bg-white/30 rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl border border-white/40 p-3 sm:p-4 md:p-6 lg:p-8 mb-4 sm:mb-6 md:mb-8 max-w-lg w-full relative z-10 glass-card animate-float overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl sm:rounded-2xl md:rounded-3xl"></div>
                        <div className="absolute inset-0 animate-shine pointer-events-none"></div>
                        <div className="relative z-10">
                            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                                <span className="text-xl sm:text-2xl md:text-3xl">📋</span>
                                Règles du jeu
                            </h2>
                            <ul className="space-y-2 sm:space-y-3 md:space-y-4 text-left">
                                <li className="flex items-start gap-2 sm:gap-3 backdrop-blur-sm bg-white/20 rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-white/30 relative overflow-hidden glass-card hover:scale-[1.02] transition-all duration-500">
                                    <div className="absolute inset-0 animate-shine opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                                    <span className="text-lg sm:text-xl md:text-2xl relative z-10 flex-shrink-0">❓</span>
                                    <div className="text-xs sm:text-sm md:text-base text-gray-800 font-medium relative z-10">
                                        <strong className="text-indigo-600">{questions.length} questions</strong> vous attendent
                                    </div>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-3 backdrop-blur-sm bg-white/20 rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-white/30 relative overflow-hidden glass-card hover:scale-[1.02] transition-all duration-500">
                                    <div className="absolute inset-0 animate-shine opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                                    <span className="text-lg sm:text-xl md:text-2xl relative z-10 flex-shrink-0">⏱️</span>
                                    <div className="text-xs sm:text-sm md:text-base text-gray-800 font-medium relative z-10">
                                        <strong className="text-purple-600">30 secondes</strong> par question
                                    </div>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-3 backdrop-blur-sm bg-white/20 rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-white/30 relative overflow-hidden glass-card hover:scale-[1.02] transition-all duration-500">
                                    <div className="absolute inset-0 animate-shine opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                                    <span className="text-lg sm:text-xl md:text-2xl relative z-10 flex-shrink-0">⚡</span>
                                    <div className="text-xs sm:text-sm md:text-base text-gray-800 font-medium relative z-10">
                                        <strong className="text-pink-600">25 points</strong> si vous répondez dans les 5 premières secondes
                                    </div>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-3 backdrop-blur-sm bg-white/20 rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-white/30 relative overflow-hidden glass-card hover:scale-[1.02] transition-all duration-500">
                                    <div className="absolute inset-0 animate-shine opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                                    <span className="text-lg sm:text-xl md:text-2xl relative z-10 flex-shrink-0">🏆</span>
                                    <div className="text-xs sm:text-sm md:text-base text-gray-800 font-medium relative z-10">
                                        Débloquez des <strong className="text-yellow-600">badges</strong> : <strong className="text-amber-700">Bronze</strong> (35%), <strong className="text-gray-500">Argent</strong> (2/3), <strong className="text-yellow-600">Or</strong> (3/4)
                                    </div>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-3 backdrop-blur-sm bg-white/20 rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-white/30 relative overflow-hidden glass-card hover:scale-[1.02] transition-all duration-500">
                                    <div className="absolute inset-0 animate-shine opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                                    <span className="text-lg sm:text-xl md:text-2xl relative z-10 flex-shrink-0">💡</span>
                                    <div className="text-xs sm:text-sm md:text-base text-gray-800 font-medium relative z-10">
                                        Chaque question inclut un <strong className="text-blue-600">texte éducatif</strong> pour apprendre
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="backdrop-blur-xl bg-gradient-to-r from-yellow-400/20 to-orange-400/20 border-2 border-yellow-300/40 rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-5 mb-4 sm:mb-5 md:mb-6 max-w-lg w-full relative z-10 shadow-xl">
                        <p className="text-xs sm:text-sm text-gray-800 text-center font-semibold">
                            💡 <strong>Astuce :</strong> Répondez rapidement pour maximiser vos points !
                        </p>
                    </div>

                    <button
                        onClick={handleStartGame}
                        className="relative z-10 px-4 sm:px-6 md:px-8 lg:px-10 py-3 sm:py-4 md:py-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-sm sm:text-base md:text-lg lg:text-xl font-bold rounded-xl sm:rounded-2xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-500 shadow-2xl hover:shadow-3xl transform hover:scale-105 backdrop-blur-sm border border-white/30 glass-button animate-glow overflow-hidden w-full sm:w-auto max-w-lg"
                        style={{
                            boxShadow: '0 20px 40px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
                            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    >
                        <div className="absolute inset-0 animate-shine"></div>
                        <span className="relative z-10">🚀 Commencer le questionnaire</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 rounded-xl sm:rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                    </button>
                </div>
            </Window>
        )
    }

    // Écran de récapitulatif
    if (gameFinished) {
        return (
            <Window title="Récapitulatif" initialPosition={fullscreenPosition} initialSize={fullscreenSize} shouldBlink={shouldBlink}>
                <div className="w-full h-full p-2 sm:p-3 md:p-4 lg:p-6 flex flex-col overflow-y-auto bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative">
                    {/* Effets de lumière */}
                    <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-3xl -z-0"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-3xl -z-0"></div>
                    
                    <div className="text-center mb-4 sm:mb-6 md:mb-8 relative z-10">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 drop-shadow-lg">
                            🎉 Questionnaire terminé !
                        </h1>
                        <p className="text-xs sm:text-sm md:text-base text-gray-700 font-medium">Voici vos statistiques</p>
                    </div>

                    {/* Score global */}
                    <div className="mb-4 sm:mb-5 md:mb-6 p-3 sm:p-4 md:p-5 lg:p-6 backdrop-blur-xl bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-pink-500/40 rounded-xl sm:rounded-2xl md:rounded-3xl text-white border border-white/40 shadow-2xl relative z-10">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl sm:rounded-2xl md:rounded-3xl"></div>
                        <div className="relative z-10">
                            <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 md:mb-4">Score final</h2>
                            <div className="flex items-baseline gap-2 sm:gap-3 md:gap-4">
                                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold drop-shadow-lg">{totalScore}</div>
                                <div className="text-lg sm:text-xl md:text-2xl opacity-90">/ {maxScore} points</div>
                            </div>
                            <div className="mt-3 sm:mt-4">
                                <div className="w-full bg-white/50 rounded-full h-5 sm:h-6 md:h-7 overflow-hidden shadow-inner border-2 border-white/60 relative ring-2 ring-white/40">
                                    <div 
                                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 shadow-xl relative ring-2 ring-white/50"
                                        style={{ width: `${progressPercentage}%` }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="text-xs sm:text-sm font-bold text-white drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                                            {Math.round(progressPercentage)}%
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-2 sm:mt-3 text-sm sm:text-base font-bold opacity-100 bg-white/40 px-3 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl inline-block shadow-md">{Math.round(progressPercentage)}% de réussite</p>
                            </div>
                        </div>
                    </div>

                    {/* Statistiques détaillées */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6 relative z-10">
                        <div className="p-3 sm:p-4 md:p-5 backdrop-blur-xl bg-gradient-to-br from-emerald-400/20 to-green-400/20 border border-emerald-300/50 rounded-xl sm:rounded-2xl shadow-xl">
                            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-emerald-700 mb-1 sm:mb-2">{correctAnswersCount}</div>
                            <div className="text-xs sm:text-sm text-gray-700 font-medium">Bonnes réponses sur {questions.length}</div>
                            <div className="text-[10px] sm:text-xs text-emerald-600 mt-1 sm:mt-2 bg-white/30 px-2 sm:px-3 py-1 rounded-full inline-block">{Math.round(successRate)}% de réussite</div>
                        </div>
                        <div className="p-3 sm:p-4 md:p-5 backdrop-blur-xl bg-gradient-to-br from-yellow-400/20 to-amber-400/20 border border-yellow-300/50 rounded-xl sm:rounded-2xl shadow-xl">
                            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-yellow-700 mb-1 sm:mb-2">{earnedBadges.size}</div>
                            <div className="text-xs sm:text-sm text-gray-700 font-medium">Badges obtenus sur {badges.length}</div>
                            <div className="text-[10px] sm:text-xs text-yellow-600 mt-1 sm:mt-2 bg-white/30 px-2 sm:px-3 py-1 rounded-full inline-block">{Math.round((earnedBadges.size / badges.length) * 100)}% de complétion</div>
                        </div>
                    </div>

                    {/* Badges obtenus */}
                    <div className="mb-4 sm:mb-5 md:mb-6 relative z-10">
                        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                            <span className="text-xl sm:text-2xl">🏆</span>
                            Vos badges
                        </h2>
                        {earnedBadges.size > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                {Array.from(earnedBadges.entries()).map(([badgeId, level]) => {
                                    const badge = badges.find(b => b.id === badgeId)
                                    const section = sections.find(s => s.id === badgeId)
                                    const sectionScore = sectionScores[badgeId] || 0
                                    const colors = getBadgeColors(level)
                                    const bgClass = level === 'bronze' ? 'from-amber-600/20 to-amber-700/20' :
                                                   level === 'argent' ? 'from-gray-300/20 to-gray-400/20' :
                                                   'from-yellow-400/20 to-amber-400/20'
                                    const borderClass = level === 'bronze' ? 'border-amber-600/60' :
                                                       level === 'argent' ? 'border-gray-400/60' :
                                                       'border-yellow-300/60'
                                    return badge ? (
                                        <div 
                                            key={badgeId}
                                            className={`p-3 sm:p-4 md:p-5 backdrop-blur-xl bg-gradient-to-br ${bgClass} border-2 ${borderClass} rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all`}
                                        >
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <span className="text-2xl sm:text-3xl md:text-4xl flex-shrink-0">{badge.icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs sm:text-sm md:text-base font-semibold text-gray-800">{badge.name}</div>
                                                    <div className="text-xs sm:text-sm text-gray-700">{section?.name}</div>
                                                    <div className="flex items-center gap-2 mt-1 sm:mt-2">
                                                        <div className={`text-[10px] sm:text-xs px-2 py-1 rounded-full inline-block font-semibold ${
                                                            level === 'bronze' ? 'bg-amber-600/30 text-amber-800' :
                                                            level === 'argent' ? 'bg-gray-400/30 text-gray-700' :
                                                            'bg-yellow-400/30 text-yellow-800'
                                                        }`}>
                                                            {colors.text}
                                                        </div>
                                                        <div className="text-[10px] sm:text-xs text-gray-600 bg-white/30 px-2 py-1 rounded-full inline-block">
                                                            {sectionScore} / {section?.maxPoints} points
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null
                                })}
                            </div>
                        ) : (
                            <div className="p-3 sm:p-4 md:p-5 backdrop-blur-xl bg-white/20 border border-white/40 rounded-xl sm:rounded-2xl text-center text-xs sm:text-sm text-gray-600 shadow-lg">
                                Aucun badge obtenu. Réessayez pour débloquer des badges !
                            </div>
                        )}
                    </div>

                    {/* Badges manqués */}
                    {earnedBadges.size < badges.length && (
                        <div className="mb-4 sm:mb-5 md:mb-6 relative z-10">
                            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                                <span className="text-xl sm:text-2xl">🔒</span>
                                Badges à débloquer
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                {badges
                                    .filter(badge => !earnedBadges.has(badge.id))
                                    .map(badge => {
                                        const section = sections.find(s => s.id === badge.id)
                                        const sectionScore = sectionScores[badge.id] || 0
                                        const thresholdBronze = Math.ceil((section?.maxPoints || 50) * 0.35)
                                        return (
                                            <div 
                                                key={badge.id}
                                                className="p-3 sm:p-4 md:p-5 backdrop-blur-xl bg-white/10 border border-gray-300/40 rounded-xl sm:rounded-2xl opacity-70 grayscale hover:opacity-90 hover:grayscale-0 transition-all"
                                            >
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <span className="text-2xl sm:text-3xl md:text-4xl flex-shrink-0">{badge.icon}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs sm:text-sm md:text-base font-semibold text-gray-600">{badge.name}</div>
                                                        <div className="text-xs sm:text-sm text-gray-500">{section?.name}</div>
                                                        <div className="text-[10px] sm:text-xs text-gray-400 mt-1 sm:mt-2 bg-white/20 px-2 py-1 rounded-full inline-block">
                                                            {sectionScore} / {thresholdBronze} points pour Bronze
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                            </div>
                        </div>
                    )}

                    {/* Bouton pour recommencer */}
                    <div className="mt-auto pt-4 sm:pt-5 md:pt-6 relative z-10">
                        <button
                            onClick={handleRestart}
                            className="w-full px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl sm:rounded-2xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold text-sm sm:text-base md:text-lg shadow-2xl hover:shadow-3xl hover:scale-105 backdrop-blur-sm border border-white/30"
                            style={{
                                boxShadow: '0 20px 40px rgba(99, 102, 241, 0.4)'
                            }}
                        >
                            🔄 Recommencer le questionnaire
                        </button>
                    </div>
                </div>
            </Window>
        )
    }

    return (
        <Window title={title} initialPosition={fullscreenPosition} initialSize={fullscreenSize} onClose={onClose} onClick={onClick} shouldBlink={shouldBlink}>
            <div className="w-full h-full p-2 sm:p-3 md:p-4 lg:p-6 flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-y-auto">
                {/* Effets de lumière subtils */}
                <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-3xl -z-0"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-3xl -z-0"></div>
                
                {/* Notification latérale pour les badges */}
                {newBadgeEarned !== null && (() => {
                    const badge = badges.find(b => b.id === newBadgeEarned.sectionId)
                    const colors = getBadgeColors(newBadgeEarned.level)
                    return (
                        <div className="absolute top-4 right-4 z-50 animate-slide-in-right">
                            <div className={`backdrop-blur-xl bg-gradient-to-r ${colors.bg} border-2 border-${colors.border.split(' ')[0]}/60 rounded-xl sm:rounded-2xl shadow-2xl p-3 sm:p-4 md:p-5 max-w-xs sm:max-w-sm animate-pulse`} style={{ boxShadow: `0 0 20px ${colors.glow}` }}>
                                <div className="flex items-start gap-2 sm:gap-3">
                                    <span className="text-2xl sm:text-3xl md:text-4xl flex-shrink-0">{badge?.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 mb-1 sm:mb-2 flex items-center gap-2">
                                            <span className="text-lg sm:text-xl">🏆</span>
                                            Badge {colors.text} obtenu !
                                        </h3>
                                        <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 mb-1">
                                            {badge?.name}
                                        </p>
                                        <p className="text-xs sm:text-sm text-gray-700">
                                            {badge?.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })()}
                
                {/* Barre de progression du score */}
                <div className="absolute bottom-2 left-2 right-2 p-2 sm:p-3 md:p-4 lg:p-5 backdrop-blur-xl bg-gradient-to-r from-indigo-500/80 via-purple-500/80 to-pink-500/80 rounded-xl sm:rounded-2xl border-[1px] border-indigo-300/60 shadow-2xl z-10 ring-2 sm:ring-4 ring-indigo-200/30 z-20">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-2 sm:mb-3 md:mb-4">
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                            <span className="text-xs sm:text-sm md:text-base font-bold text-gray-900 py-2 px-2 rounded-lg sm:rounded-xl text-shadow-lg text-white sm:w-auto text-center sm:text-left">
                                <span className="text-4xl font-medium">{totalScore}</span> / {maxScore} points</span>
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                {badges.map(badge => {
                                    const badgeLevel = earnedBadges.get(badge.id)
                                    const isEarned = badgeLevel !== undefined
                                    const colors = isEarned ? getBadgeColors(badgeLevel) : null
                                    
                                    return (
                                        <div 
                                            key={badge.id}
                                            className={`relative w-10 h-12 sm:w-12 sm:h-14 md:w-14 md:h-16 flex items-center justify-center transition-all overflow-hidden ${isEarned ? `shadow-xl hover:shadow-2xl hover:scale-110 ${rotatingBadges.has(badge.id) ? 'animate-rotate-badge' : ''}` : 'opacity-50'}`}
                                            style={{
                                                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                                filter: isEarned ? `drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 16px ${colors?.glow})` : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
                                                boxShadow: isEarned ? `inset 0 2px 4px rgba(255, 255, 255, 0.3), 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 20px ${colors?.glow}` : 'none',
                                                transformStyle: 'preserve-3d',
                                                border: isEarned ? 'none' : '2px dashed rgba(150, 150, 150, 0.6)',
                                                background: isEarned ? 'transparent' : 'rgba(200, 200, 200, 0.1)'
                                            }}
                                        >
                                            {isEarned ? (
                                                <>
                                                    {/* Bordure extérieure selon le niveau */}
                                                    <div 
                                                        className={`absolute -inset-[2px] bg-gradient-to-br ${
                                                            badgeLevel === 'bronze' ? 'from-amber-700 via-amber-800 to-amber-900' :
                                                            badgeLevel === 'argent' ? 'from-gray-400 via-gray-500 to-gray-600' :
                                                            'from-yellow-300 via-amber-400 to-yellow-600'
                                                        }`}
                                                        style={{
                                                            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                                            zIndex: 0
                                                        }}
                                                    />
                                                    {/* Fond principal avec gradient selon le niveau */}
                                                    <div 
                                                        className={`absolute inset-[2px] bg-gradient-to-b ${
                                                            badgeLevel === 'bronze' ? 'from-amber-600/80 via-amber-700/70 to-amber-800/80' :
                                                            badgeLevel === 'argent' ? 'from-gray-300/80 via-gray-400/70 to-gray-500/80' :
                                                            'from-yellow-400/80 via-amber-400/70 to-amber-600/80'
                                                        }`}
                                                        style={{
                                                            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                                            zIndex: 1
                                                        }}
                                                    />
                                                    {/* Effet de brillance animé */}
                                                    <div 
                                                        className="absolute inset-[2px] opacity-90 animate-shine pointer-events-none"
                                                        style={{
                                                            background: 'linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.3) 45%, rgba(255, 255, 255, 0.7) 50%, rgba(255, 255, 255, 0.3) 55%, transparent 100%)',
                                                            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                                            backgroundSize: '200% 200%',
                                                            zIndex: 2
                                                        }}
                                                    />
                                                    {/* Reflet métallique en haut */}
                                                    <div 
                                                        className="absolute top-[2px] left-[2px] right-[2px] h-[35%] opacity-60 pointer-events-none"
                                                        style={{
                                                            background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.1), transparent)',
                                                            clipPath: 'polygon(50% 0%, 100% 25%, 50% 35%, 0% 25%)',
                                                            zIndex: 3
                                                        }}
                                                    />
                                                    {/* Bordure intérieure brillante */}
                                                    <div 
                                                        className="absolute inset-[4px] pointer-events-none"
                                                        style={{
                                                            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                                            border: '1px solid rgba(255, 255, 255, 0.4)',
                                                            zIndex: 3
                                                        }}
                                                    />
                                                    <span className="text-lg sm:text-xl md:text-2xl drop-shadow-lg relative z-10" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 8px rgba(251, 191, 36, 0.4))' }}>{badge.icon}</span>
                                                </>
                                            ) : (
                                                <>
                                                    {/* Blason en pointillés pour les badges non obtenus */}
                                                    <div 
                                                        className="absolute inset-0"
                                                        style={{
                                                            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                                            border: '2px dashed rgba(150, 150, 150, 0.6)',
                                                            background: 'rgba(200, 200, 200, 0.05)',
                                                            zIndex: 0
                                                        }}
                                                    />
                                                    <span className="text-lg sm:text-xl md:text-2xl relative z-10 opacity-40" style={{ filter: 'grayscale(100%)' }}>{badge.icon}</span>
                                                </>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-indigo-700 bg-gradient-to-r from-indigo-400 to-purple-500 text-white px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-full shadow-lg ring-2 ring-white/50 w-full sm:w-auto text-center sm:text-right">{Math.round(progressPercentage)}%</span>
                    </div>
                    <div className="w-full bg-white/60 rounded-full h-4 overflow-hidden shadow-inner border-2 border-white/70 relative">
                        <div 
                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out rounded-full shadow-xl relative ring-2 ring-white/50"
                            style={{ width: `${progressPercentage}%` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-[10px] sm:text-xs font-bold text-gray-700 drop-shadow-lg" style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}>
                            </div>
                        </div>
                    </div>
                </div>


                <div className="mb-2 sm:mb-3 md:mb-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-0 backdrop-blur-md bg-white/20 rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 border border-white/40 shadow-lg relative z-10">
                    <p className="text-xs sm:text-sm font-semibold text-gray-800 bg-white/30 px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl text-center sm:text-left">
                        Question {currentQuestionIndex + 1} / {questions.length}
                    </p>
                    <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-3">
                        <button
                            onClick={handleSkipQuestion}
                            disabled={correctAnswer !== null}
                            className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-gradient-to-r from-orange-400/30 to-amber-400/30 backdrop-blur-md rounded-full hover:from-orange-500/40 hover:to-amber-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-orange-300/50 shadow-lg hover:shadow-xl hover:scale-110"
                            title="Passer la question"
                        >
                            <span className="text-lg sm:text-xl">⏭️</span>
                        </button>
                        <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16">
                            <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 36 36">
                                <circle
                                    cx="18"
                                    cy="18"
                                    r="16"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="text-gray-200/50"
                                />
                                <circle
                                    cx="18"
                                    cy="18"
                                    r="16"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeDasharray={`${(timeLeft / 30) * 100.53}, 100.53`}
                                    className={`transition-all duration-1000 ${
                                        timeLeft <= 10 
                                            ? 'text-red-500' 
                                            : 'text-indigo-500'
                                    }`}
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                        <button
                            onClick={handleStopGame}
                            className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-gradient-to-r from-red-400/30 to-rose-400/30 backdrop-blur-md rounded-full hover:from-red-500/40 hover:to-rose-500/40 transition-all duration-300 border border-red-300/50 shadow-lg hover:shadow-xl hover:scale-110"
                            title="Arrêter la partie"
                        >
                            <span className="text-lg sm:text-xl">⏹️</span>
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 relative z-10 min-h-0">
                    <div className="backdrop-blur-xl m-2 relative overflow-hidden">
                        <div className="absolute inset-0 animate-shine opacity-30"></div>
                        <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 leading-relaxed relative z-10">{currentQuestion.text}</h2>
                    </div>
                    
                    <div className="flex flex-col gap-2 sm:gap-3 md:gap-4">
                        {(['a', 'b', 'c', 'd'] as const).map((key) => (
                            <button 
                                key={key}
                                onClick={() => handleAnswerClick(currentQuestion.id, key)}
                                disabled={loading !== null || correctAnswer !== null}
                                className={getButtonClassName(key)}
                            >
                                <span className="font-bold text-sm sm:text-base md:text-lg mr-2 sm:mr-3 flex-shrink-0">{key.toUpperCase()})</span>
                                <span className="font-medium text-xs sm:text-sm md:text-base break-words">{loading === key ? '...' : currentQuestion.options[key]}</span>
                            </button>
                        ))}
                    </div>

                    {correctAnswer !== null && (
                        <>
                            <div className="mt-3 sm:mt-4 md:mt-6 p-3 sm:p-4 md:p-5 backdrop-blur-xl bg-gradient-to-r from-blue-400/20 to-indigo-400/20 border border-blue-300/50 rounded-xl sm:rounded-2xl shadow-xl">
                                <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                                    <span className="text-lg sm:text-xl">💡</span>
                                    Pour aller plus loin :
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                                    {currentQuestion.educationalText}
                                </p>
                            </div>
                        </>
                    )}

                    {showNextButton && (
                        <div className="mt-3 sm:mt-4 md:mt-6">
                            <button
                                onClick={handleNextQuestion}
                                className="w-full sm:w-auto px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl sm:rounded-2xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 text-sm sm:text-base font-semibold shadow-xl hover:shadow-2xl hover:scale-105 backdrop-blur-sm border border-white/30"
                                style={{
                                    boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4)'
                                }}
                            >
                                {isLastQuestion ? '✨ Terminer' : '➡️ Question suivante'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Window>
    )
}

export default NirdGame
