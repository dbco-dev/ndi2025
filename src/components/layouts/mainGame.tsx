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

function MainGame({ uuid, title, initialPosition, initialSize, onClose, onClick, shouldBlink }: { uuid: number, title: string, initialPosition: { x: number, y: number }, initialSize: { width: number, height: number }, onClose: () => void, onClick: (position: { x: number, y: number }) => void, shouldBlink?: boolean }) {
    const [gameStarted, setGameStarted] = useState(false)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [loading, setLoading] = useState<string | null>(null)
    const [answerResults, setAnswerResults] = useState<Record<string, boolean>>({})
    const [correctAnswer, setCorrectAnswer] = useState<string | string[] | null>(null)
    const [showNextButton, setShowNextButton] = useState(false)
    const [timeLeft, setTimeLeft] = useState(30)
    const [timerExpired, setTimerExpired] = useState(false)
    const [totalScore, setTotalScore] = useState(0)
    const [timeAtAnswer, setTimeAtAnswer] = useState<number | null>(null)
    const [sectionScores, setSectionScores] = useState<Record<number, number>>({})
    const [earnedBadges, setEarnedBadges] = useState<Set<number>>(new Set())
    const [newBadgeEarned, setNewBadgeEarned] = useState<number | null>(null)
    const [gameFinished, setGameFinished] = useState(false)
    const [correctAnswersCount, setCorrectAnswersCount] = useState(0)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    
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
        setTimeAtAnswer(null)

        const questionId = currentQuestion.id

        // Fonction pour révéler la bonne réponse automatiquement
        const revealCorrectAnswer = async () => {
            try {
                // On envoie une requête avec une réponse vide pour obtenir la bonne réponse
                const response = await fetch('http://localhost:4000/api/checkAnswer', {
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
        setTimeAtAnswer(currentTimeLeft)
        setLoading(answer)
        
        // Arrêter le timer immédiatement
        if (timerRef.current) {
            clearInterval(timerRef.current)
        }
        
        try {
            const response = await fetch('http://localhost:4000/api/checkAnswer', {
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
                setTimeAtAnswer(pointsEarned)
                
                // Ajouter les points à la section correspondante
                const questionData = questions.find(q => q.id === question)
                if (questionData) {
                    setSectionScores(prev => {
                        const newScores = {
                            ...prev,
                            [questionData.section]: (prev[questionData.section] || 0) + pointsEarned
                        }
                        
                        // Vérifier si un badge est obtenu (au moins 50% des points de la section)
                        const section = sections.find(s => s.id === questionData.section)
                        if (section) {
                            const sectionScore = newScores[questionData.section]
                            const threshold = section.maxPoints / 2 // 50% = 25 points pour 50 max
                            
                            if (sectionScore >= threshold && !earnedBadges.has(questionData.section)) {
                                setEarnedBadges(prev => new Set([...prev, questionData.section]))
                                setNewBadgeEarned(questionData.section)
                                // Masquer la notification après 5 secondes
                                setTimeout(() => setNewBadgeEarned(null), 5000)
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
            setTimeAtAnswer(null)
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
        setTimeAtAnswer(null)
        setSectionScores({})
        setEarnedBadges(new Set())
        setNewBadgeEarned(null)
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
                const response = await fetch('http://localhost:4000/api/checkAnswer', {
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
        const baseClass = 'px-5 py-4 rounded-2xl transition-all duration-300 text-left backdrop-blur-md border relative overflow-hidden'
        
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

    // Page de démarrage
    if (!gameStarted) {
        return (
            <Window title={title} initialPosition={initialPosition} initialSize={{ width: 700, height: 600 }} onClose={onClose} onClick={onClick} shouldBlink={shouldBlink}>
                <div className="w-full h-full p-8 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 relative overflow-hidden">
                    {/* Effets de lumière en arrière-plan */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-30">
                        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
                        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-700"></div>
                        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
                    </div>
                    
                    <div className="text-center mb-8 relative z-10">
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 drop-shadow-lg">
                            🎮 Bienvenue au Quiz !
                        </h1>
                        <p className="text-xl text-gray-700 font-medium">Testez vos connaissances</p>
                    </div>

                    <div className="backdrop-blur-xl bg-white/30 rounded-3xl shadow-2xl border border-white/40 p-8 mb-8 max-w-lg w-full relative z-10 glass-card animate-float overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl"></div>
                        <div className="absolute inset-0 animate-shine pointer-events-none"></div>
                        <div className="relative z-10">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                                <span className="text-3xl">📋</span>
                                Règles du jeu
                            </h2>
                            <ul className="space-y-4 text-left">
                                <li className="flex items-start gap-3 backdrop-blur-sm bg-white/20 rounded-2xl p-3 border border-white/30 relative overflow-hidden glass-card hover:scale-[1.02] transition-all duration-500">
                                    <div className="absolute inset-0 animate-shine opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                                    <span className="text-2xl relative z-10 animate-sparkle">❓</span>
                                    <div className="text-gray-800 font-medium relative z-10">
                                        <strong className="text-indigo-600">{questions.length} questions</strong> vous attendent
                                    </div>
                                </li>
                                <li className="flex items-start gap-3 backdrop-blur-sm bg-white/20 rounded-2xl p-3 border border-white/30 relative overflow-hidden glass-card hover:scale-[1.02] transition-all duration-500">
                                    <div className="absolute inset-0 animate-shine opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                                    <span className="text-2xl relative z-10 animate-sparkle" style={{ animationDelay: '0.2s' }}>⏱️</span>
                                    <div className="text-gray-800 font-medium relative z-10">
                                        <strong className="text-purple-600">30 secondes</strong> par question
                                    </div>
                                </li>
                                <li className="flex items-start gap-3 backdrop-blur-sm bg-white/20 rounded-2xl p-3 border border-white/30 relative overflow-hidden glass-card hover:scale-[1.02] transition-all duration-500">
                                    <div className="absolute inset-0 animate-shine opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                                    <span className="text-2xl relative z-10 animate-sparkle" style={{ animationDelay: '0.4s' }}>⚡</span>
                                    <div className="text-gray-800 font-medium relative z-10">
                                        <strong className="text-pink-600">25 points</strong> si vous répondez dans les 5 premières secondes
                                    </div>
                                </li>
                                <li className="flex items-start gap-3 backdrop-blur-sm bg-white/20 rounded-2xl p-3 border border-white/30 relative overflow-hidden glass-card hover:scale-[1.02] transition-all duration-500">
                                    <div className="absolute inset-0 animate-shine opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                                    <span className="text-2xl relative z-10 animate-sparkle" style={{ animationDelay: '0.6s' }}>🏆</span>
                                    <div className="text-gray-800 font-medium relative z-10">
                                        Débloquez des <strong className="text-yellow-600">badges</strong> en obtenant au moins 50% des points par section
                                    </div>
                                </li>
                                <li className="flex items-start gap-3 backdrop-blur-sm bg-white/20 rounded-2xl p-3 border border-white/30 relative overflow-hidden glass-card hover:scale-[1.02] transition-all duration-500">
                                    <div className="absolute inset-0 animate-shine opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                                    <span className="text-2xl relative z-10 animate-sparkle" style={{ animationDelay: '0.8s' }}>💡</span>
                                    <div className="text-gray-800 font-medium relative z-10">
                                        Chaque question inclut un <strong className="text-blue-600">texte éducatif</strong> pour apprendre
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="backdrop-blur-xl bg-gradient-to-r from-yellow-400/20 to-orange-400/20 border-2 border-yellow-300/40 rounded-3xl p-5 mb-6 max-w-lg w-full relative z-10 shadow-xl">
                        <p className="text-sm text-gray-800 text-center font-semibold">
                            💡 <strong>Astuce :</strong> Répondez rapidement pour maximiser vos points !
                        </p>
                    </div>

                    <button
                        onClick={handleStartGame}
                        className="relative z-10 px-10 py-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-xl font-bold rounded-2xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-500 shadow-2xl hover:shadow-3xl transform hover:scale-105 backdrop-blur-sm border border-white/30 glass-button animate-glow overflow-hidden"
                        style={{
                            boxShadow: '0 20px 40px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
                            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    >
                        <div className="absolute inset-0 animate-shine"></div>
                        <span className="relative z-10">🚀 Commencer le questionnaire</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                    </button>
                </div>
            </Window>
        )
    }

    // Écran de récapitulatif
    if (gameFinished) {
        return (
            <Window title="Récapitulatif" initialPosition={{ x: 200, y: 200 }} initialSize={{ width: 800, height: 800 }} shouldBlink={shouldBlink}>
                <div className="w-full h-full p-6 flex flex-col overflow-y-auto bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative">
                    {/* Effets de lumière */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-3xl -z-0"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-3xl -z-0"></div>
                    
                    <div className="text-center mb-8 relative z-10">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 drop-shadow-lg">
                            🎉 Questionnaire terminé !
                        </h1>
                        <p className="text-gray-700 font-medium">Voici vos statistiques</p>
                    </div>

                    {/* Score global */}
                    <div className="mb-6 p-6 backdrop-blur-xl bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-pink-500/40 rounded-3xl text-white border border-white/40 shadow-2xl relative z-10">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl"></div>
                        <div className="relative z-10">
                            <h2 className="text-xl font-semibold mb-4">Score final</h2>
                            <div className="flex items-baseline gap-4">
                                <div className="text-6xl font-bold drop-shadow-lg">{totalScore}</div>
                                <div className="text-2xl opacity-90">/ {maxScore} points</div>
                            </div>
                            <div className="mt-4">
                                <div className="w-full bg-white/30 rounded-full h-5 overflow-hidden shadow-inner border border-white/40">
                                    <div 
                                        className="h-full bg-gradient-to-r from-white via-white/90 to-white rounded-full transition-all duration-500 shadow-lg relative"
                                        style={{ width: `${progressPercentage}%` }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                                    </div>
                                </div>
                                <p className="mt-3 text-sm opacity-95 font-medium">{Math.round(progressPercentage)}% de réussite</p>
                            </div>
                        </div>
                    </div>

                    {/* Statistiques détaillées */}
                    <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                        <div className="p-5 backdrop-blur-xl bg-gradient-to-br from-emerald-400/20 to-green-400/20 border border-emerald-300/50 rounded-2xl shadow-xl">
                            <div className="text-4xl font-bold text-emerald-700 mb-2">{correctAnswersCount}</div>
                            <div className="text-sm text-gray-700 font-medium">Bonnes réponses sur {questions.length}</div>
                            <div className="text-xs text-emerald-600 mt-2 bg-white/30 px-3 py-1 rounded-full inline-block">{Math.round(successRate)}% de réussite</div>
                        </div>
                        <div className="p-5 backdrop-blur-xl bg-gradient-to-br from-yellow-400/20 to-amber-400/20 border border-yellow-300/50 rounded-2xl shadow-xl">
                            <div className="text-4xl font-bold text-yellow-700 mb-2">{earnedBadges.size}</div>
                            <div className="text-sm text-gray-700 font-medium">Badges obtenus sur {badges.length}</div>
                            <div className="text-xs text-yellow-600 mt-2 bg-white/30 px-3 py-1 rounded-full inline-block">{Math.round((earnedBadges.size / badges.length) * 100)}% de complétion</div>
                        </div>
                    </div>

                    {/* Badges obtenus */}
                    <div className="mb-6 relative z-10">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-2xl">🏆</span>
                            Vos badges
                        </h2>
                        {earnedBadges.size > 0 ? (
                            <div className="grid grid-cols-2 gap-4">
                                {Array.from(earnedBadges).map(badgeId => {
                                    const badge = badges.find(b => b.id === badgeId)
                                    const section = sections.find(s => s.id === badgeId)
                                    const sectionScore = sectionScores[badgeId] || 0
                                    return badge ? (
                                        <div 
                                            key={badgeId}
                                            className="p-5 backdrop-blur-xl bg-gradient-to-br from-yellow-400/20 to-amber-400/20 border-2 border-yellow-300/60 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-4xl">{badge.icon}</span>
                                                <div className="flex-1">
                                                    <div className="font-semibold text-gray-800">{badge.name}</div>
                                                    <div className="text-sm text-gray-700">{section?.name}</div>
                                                    <div className="text-xs text-gray-600 mt-2 bg-white/30 px-2 py-1 rounded-full inline-block">
                                                        {sectionScore} / {section?.maxPoints} points
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null
                                })}
                            </div>
                        ) : (
                            <div className="p-5 backdrop-blur-xl bg-white/20 border border-white/40 rounded-2xl text-center text-gray-600 shadow-lg">
                                Aucun badge obtenu. Réessayez pour débloquer des badges !
                            </div>
                        )}
                    </div>

                    {/* Badges manqués */}
                    {earnedBadges.size < badges.length && (
                        <div className="mb-6 relative z-10">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="text-2xl">🔒</span>
                                Badges à débloquer
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                {badges
                                    .filter(badge => !earnedBadges.has(badge.id))
                                    .map(badge => {
                                        const section = sections.find(s => s.id === badge.id)
                                        const sectionScore = sectionScores[badge.id] || 0
                                        const threshold = (section?.maxPoints || 50) / 2
                                        return (
                                            <div 
                                                key={badge.id}
                                                className="p-5 backdrop-blur-xl bg-white/10 border border-gray-300/40 rounded-2xl opacity-70 grayscale hover:opacity-90 hover:grayscale-0 transition-all"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-4xl">{badge.icon}</span>
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-gray-600">{badge.name}</div>
                                                        <div className="text-sm text-gray-500">{section?.name}</div>
                                                        <div className="text-xs text-gray-400 mt-2 bg-white/20 px-2 py-1 rounded-full inline-block">
                                                            {sectionScore} / {threshold} points nécessaires
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
                    <div className="mt-auto pt-6 relative z-10">
                        <button
                            onClick={handleRestart}
                            className="w-full px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 backdrop-blur-sm border border-white/30"
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
        <Window title={title} initialPosition={initialPosition} initialSize={initialSize} onClose={onClose} onClick={onClick} shouldBlink={shouldBlink}>
            <div className="w-full h-full p-6 flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
                {/* Effets de lumière subtils */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-3xl -z-0"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-3xl -z-0"></div>
                
                {/* Barre de progression du score */}
                <div className="mb-4 p-4 backdrop-blur-xl bg-white/30 rounded-2xl border border-white/40 shadow-xl relative z-10">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-semibold text-gray-800">Score : {totalScore} / {maxScore} points</span>
                        <span className="text-xs font-medium text-gray-600 bg-white/40 px-3 py-1 rounded-full">{Math.round(progressPercentage)}%</span>
                    </div>
                    <div className="w-full bg-white/40 rounded-full h-4 overflow-hidden shadow-inner border border-white/50">
                        <div 
                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out rounded-full shadow-lg relative"
                            style={{ width: `${progressPercentage}%` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                        </div>
                    </div>
                </div>

                {/* Badges obtenus */}
                {earnedBadges.size > 0 && (
                    <div className="mb-4 p-4 backdrop-blur-xl bg-gradient-to-r from-yellow-400/20 to-amber-400/20 border border-yellow-300/40 rounded-2xl shadow-xl relative z-10">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <span className="text-xl">🏆</span>
                            Badges obtenus :
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {Array.from(earnedBadges).map(badgeId => {
                                const badge = badges.find(b => b.id === badgeId)
                                const section = sections.find(s => s.id === badgeId)
                                return badge ? (
                                    <div 
                                        key={badgeId}
                                        className="flex items-center gap-2 px-4 py-2 backdrop-blur-md bg-white/40 rounded-full border border-white/50 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                                    >
                                        <span className="text-xl">{badge.icon}</span>
                                        <div>
                                            <div className="text-xs font-semibold text-gray-800">{badge.name}</div>
                                            <div className="text-xs text-gray-600">{section?.name}</div>
                                        </div>
                                    </div>
                                ) : null
                            })}
                        </div>
                    </div>
                )}

                <div className="mb-4 flex justify-between items-center backdrop-blur-md bg-white/20 rounded-2xl p-4 border border-white/40 shadow-lg relative z-10">
                    <p className="text-sm font-semibold text-gray-800 bg-white/30 px-4 py-2 rounded-xl">
                        Question {currentQuestionIndex + 1} / {questions.length}
                    </p>
                    <div className="flex items-center gap-3">
                        <div className={`text-xl font-bold px-4 py-2 rounded-xl backdrop-blur-md border ${
                            timeLeft <= 10 
                                ? 'text-red-600 bg-red-400/20 border-red-300/50 shadow-lg shadow-red-500/30' 
                                : 'text-indigo-600 bg-indigo-400/20 border-indigo-300/50 shadow-lg shadow-indigo-500/30'
                        }`}>
                            ⏱️ {timeLeft}s
                        </div>
                    </div>
                </div>

                {/* Boutons d'action */}
                <div className="mb-4 flex gap-3 justify-end relative z-10">
                    <button
                        onClick={handleSkipQuestion}
                        disabled={correctAnswer !== null}
                        className="relative px-5 py-3 bg-gradient-to-r from-orange-400/30 to-amber-400/30 backdrop-blur-md text-white rounded-2xl hover:from-orange-500/40 hover:to-amber-500/40 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold border border-orange-300/50 shadow-lg hover:shadow-xl hover:scale-105 glass-button overflow-hidden"
                    >
                        <div className="absolute inset-0 animate-shine opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                        <span className="relative z-10">⏭️ Passer la question</span>
                    </button>
                    <button
                        onClick={handleStopGame}
                        className="relative px-5 py-3 bg-gradient-to-r from-red-400/30 to-rose-400/30 backdrop-blur-md text-white rounded-2xl hover:from-red-500/40 hover:to-rose-500/40 transition-all duration-500 text-sm font-semibold border border-red-300/50 shadow-lg hover:shadow-xl hover:scale-105 glass-button overflow-hidden"
                    >
                        <div className="absolute inset-0 animate-shine opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                        <span className="relative z-10">⏹️ Arrêter la partie</span>
                    </button>
                </div>
                
                <div className="flex-1 relative z-10">
                    <div className="backdrop-blur-xl bg-white/30 rounded-2xl p-6 mb-6 border border-white/40 shadow-xl glass-card relative overflow-hidden">
                        <div className="absolute inset-0 animate-shine opacity-30"></div>
                        <h2 className="text-2xl font-semibold text-gray-800 leading-relaxed relative z-10">{currentQuestion.text}</h2>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                        {(['a', 'b', 'c', 'd'] as const).map((key) => (
                            <button 
                                key={key}
                                onClick={() => handleAnswerClick(currentQuestion.id, key)}
                                disabled={loading !== null || correctAnswer !== null}
                                className={getButtonClassName(key)}
                            >
                                <span className="font-bold text-lg mr-3">{key.toUpperCase()})</span>
                                <span className="font-medium">{loading === key ? '...' : currentQuestion.options[key]}</span>
                            </button>
                        ))}
                    </div>

                    {correctAnswer !== null && (
                        <>
                            {timerExpired && (
                                <div className="mt-6 p-5 backdrop-blur-xl bg-gradient-to-r from-yellow-400/20 to-amber-400/20 border border-yellow-300/50 rounded-2xl shadow-xl">
                                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                        <span className="text-xl">⏰</span>
                                        Temps écoulé !
                                    </h3>
                                    <p className="text-gray-700 text-sm">
                                        La bonne réponse était : <strong className="text-yellow-700">{Array.isArray(correctAnswer) ? correctAnswer.join(', ') : correctAnswer.toUpperCase()}</strong>
                                    </p>
                                </div>
                            )}
                            {timeAtAnswer !== null && Object.values(answerResults).some(result => result === true) && (
                                <div className="mt-6 p-5 backdrop-blur-xl bg-gradient-to-r from-emerald-400/20 to-green-400/20 border border-emerald-300/50 rounded-2xl shadow-xl">
                                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                        <span className="text-xl">✅</span>
                                        Bonne réponse !
                                    </h3>
                                    <p className="text-gray-700 text-sm">
                                        Vous avez gagné <strong className="text-emerald-700">{timeAtAnswer} points</strong> pour cette question !
                                        {timeAtAnswer === 25 && <span className="ml-2 text-xs bg-white/30 px-2 py-1 rounded-full">⚡ Réponse rapide !</span>}
                                    </p>
                                </div>
                            )}
                            {newBadgeEarned !== null && (
                                <div className="mt-6 p-5 backdrop-blur-xl bg-gradient-to-r from-yellow-400/30 to-amber-400/30 border-2 border-yellow-300/60 rounded-2xl shadow-2xl animate-pulse">
                                    <h3 className="font-bold text-gray-800 mb-3 text-lg flex items-center gap-2">
                                        <span className="text-2xl">🏆</span>
                                        Nouveau badge obtenu !
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <span className="text-4xl">{badges.find(b => b.id === newBadgeEarned)?.icon}</span>
                                        <div>
                                            <p className="font-semibold text-gray-800">
                                                {badges.find(b => b.id === newBadgeEarned)?.name}
                                            </p>
                                            <p className="text-sm text-gray-700">
                                                {badges.find(b => b.id === newBadgeEarned)?.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="mt-6 p-5 backdrop-blur-xl bg-gradient-to-r from-blue-400/20 to-indigo-400/20 border border-blue-300/50 rounded-2xl shadow-xl">
                                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <span className="text-xl">💡</span>
                                    Pour aller plus loin :
                                </h3>
                                <p className="text-gray-700 text-sm leading-relaxed">
                                    {currentQuestion.educationalText}
                                </p>
                            </div>
                        </>
                    )}

                    {showNextButton && (
                        <div className="mt-6">
                            <button
                                onClick={handleNextQuestion}
                                className="px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold shadow-xl hover:shadow-2xl hover:scale-105 backdrop-blur-sm border border-white/30"
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

export default MainGame
