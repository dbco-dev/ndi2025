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
    
    const maxScore = questions.length * 25 // 12 questions × 25 points max = 300 points

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
    
    const getButtonClassName = (answer: string) => {
        const baseClass = 'px-4 py-2 rounded transition-colors text-left'
        
        // Si on a reçu une réponse de l'API
        if (correctAnswer !== null) {
            // Vérifier si cette réponse est la bonne
            const isThisCorrect = Array.isArray(correctAnswer) 
                ? correctAnswer.includes(answer)
                : correctAnswer === answer
            
            // Si c'est la bonne réponse, toujours en vert
            if (isThisCorrect) {
                return `${baseClass} bg-green-500 text-white`
            }
            
            // Si c'est la réponse choisie et qu'elle est incorrecte, en rouge
            if (answerResults[answer] === false) {
                return `${baseClass} bg-red-500 text-white`
            }
        }
        
        // État de chargement
        if (loading === answer) {
            return `${baseClass} opacity-50 cursor-not-allowed`
        }
        
        // État par défaut
        return `${baseClass} bg-gray-200 hover:bg-gray-300`
    }

    const progressPercentage = (totalScore / maxScore) * 100
    const successRate = (correctAnswersCount / questions.length) * 100

    // Écran de récapitulatif
    if (gameFinished) {
        return (
            <Window title="Récapitulatif" initialPosition={{ x: 200, y: 200 }} initialSize={{ width: 800, height: 800 }} shouldBlink={shouldBlink}>
                <div className="w-full h-full p-6 flex flex-col overflow-y-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">🎉 Questionnaire terminé !</h1>
                        <p className="text-gray-600">Voici vos statistiques</p>
                    </div>

                    {/* Score global */}
                    <div className="mb-6 p-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white">
                        <h2 className="text-xl font-semibold mb-4">Score final</h2>
                        <div className="flex items-baseline gap-4">
                            <div className="text-5xl font-bold">{totalScore}</div>
                            <div className="text-2xl opacity-90">/ {maxScore} points</div>
                        </div>
                        <div className="mt-4">
                            <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                                <div 
                                    className="h-full bg-white rounded-full transition-all duration-500"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                            <p className="mt-2 text-sm opacity-90">{Math.round(progressPercentage)}% de réussite</p>
                        </div>
                    </div>

                    {/* Statistiques détaillées */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="text-3xl font-bold text-green-700">{correctAnswersCount}</div>
                            <div className="text-sm text-green-600">Bonnes réponses sur {questions.length}</div>
                            <div className="text-xs text-green-500 mt-1">{Math.round(successRate)}% de réussite</div>
                        </div>
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="text-3xl font-bold text-yellow-700">{earnedBadges.size}</div>
                            <div className="text-sm text-yellow-600">Badges obtenus sur {badges.length}</div>
                            <div className="text-xs text-yellow-500 mt-1">{Math.round((earnedBadges.size / badges.length) * 100)}% de complétion</div>
                        </div>
                    </div>

                    {/* Badges obtenus */}
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">🏆 Vos badges</h2>
                        {earnedBadges.size > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                                {Array.from(earnedBadges).map(badgeId => {
                                    const badge = badges.find(b => b.id === badgeId)
                                    const section = sections.find(s => s.id === badgeId)
                                    const sectionScore = sectionScores[badgeId] || 0
                                    return badge ? (
                                        <div 
                                            key={badgeId}
                                            className="p-4 bg-white border-2 border-yellow-300 rounded-lg shadow-sm"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-4xl">{badge.icon}</span>
                                                <div className="flex-1">
                                                    <div className="font-semibold text-gray-800">{badge.name}</div>
                                                    <div className="text-sm text-gray-600">{section?.name}</div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {sectionScore} / {section?.maxPoints} points
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null
                                })}
                            </div>
                        ) : (
                            <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-500">
                                Aucun badge obtenu. Réessayez pour débloquer des badges !
                            </div>
                        )}
                    </div>

                    {/* Badges manqués */}
                    {earnedBadges.size < badges.length && (
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">🔒 Badges à débloquer</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {badges
                                    .filter(badge => !earnedBadges.has(badge.id))
                                    .map(badge => {
                                        const section = sections.find(s => s.id === badge.id)
                                        const sectionScore = sectionScores[badge.id] || 0
                                        const threshold = (section?.maxPoints || 50) / 2
                                        return (
                                            <div 
                                                key={badge.id}
                                                className="p-4 bg-gray-100 border border-gray-300 rounded-lg opacity-60"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-4xl grayscale">{badge.icon}</span>
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-gray-600">{badge.name}</div>
                                                        <div className="text-sm text-gray-500">{section?.name}</div>
                                                        <div className="text-xs text-gray-400 mt-1">
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
                    <div className="mt-auto pt-6 border-t border-gray-200">
                        <button
                            onClick={handleRestart}
                            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold text-lg"
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
            <div className="w-full h-full p-6 flex flex-col">
                {/* Barre de progression du score */}
                <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-700">Score : {totalScore} / {maxScore} points</span>
                        <span className="text-xs text-gray-500">{Math.round(progressPercentage)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300 ease-out"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Badges obtenus */}
                {earnedBadges.size > 0 && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h3 className="text-sm font-semibold text-yellow-800 mb-2">🏆 Badges obtenus :</h3>
                        <div className="flex flex-wrap gap-2">
                            {Array.from(earnedBadges).map(badgeId => {
                                const badge = badges.find(b => b.id === badgeId)
                                const section = sections.find(s => s.id === badgeId)
                                return badge ? (
                                    <div 
                                        key={badgeId}
                                        className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-yellow-300 shadow-sm"
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

                <div className="mb-4 flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                        Question {currentQuestionIndex + 1} / {questions.length}
                    </p>
                    <div className="flex items-center gap-2">
                        <div className={`text-lg font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-blue-500'}`}>
                            ⏱️ {timeLeft}s
                        </div>
                    </div>
                </div>
                
                <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-6">{currentQuestion.text}</h2>
                    
                    <div className="flex flex-col gap-3">
                        {(['a', 'b', 'c', 'd'] as const).map((key) => (
                            <button 
                                key={key}
                                onClick={() => handleAnswerClick(currentQuestion.id, key)}
                                disabled={loading !== null || correctAnswer !== null}
                                className={getButtonClassName(key)}
                            >
                                <span className="font-semibold">{key.toUpperCase()}) </span>
                                {loading === key ? '...' : currentQuestion.options[key]}
                            </button>
                        ))}
                    </div>

                    {correctAnswer !== null && (
                        <>
                            {timerExpired && (
                                <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                                    <h3 className="font-semibold text-yellow-800 mb-2">⏰ Temps écoulé !</h3>
                                    <p className="text-yellow-700 text-sm">
                                        La bonne réponse était : <strong>{Array.isArray(correctAnswer) ? correctAnswer.join(', ') : correctAnswer.toUpperCase()}</strong>
                                    </p>
                                </div>
                            )}
                            {timeAtAnswer !== null && Object.values(answerResults).some(result => result === true) && (
                                <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 rounded">
                                    <h3 className="font-semibold text-green-800 mb-2">✅ Bonne réponse !</h3>
                                    <p className="text-green-700 text-sm">
                                        Vous avez gagné <strong>{timeAtAnswer} points</strong> pour cette question !
                                        {timeAtAnswer === 25 && <span className="ml-2 text-xs">⚡ Réponse rapide !</span>}
                                    </p>
                                </div>
                            )}
                            {newBadgeEarned !== null && (
                                <div className="mt-6 p-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg animate-pulse">
                                    <h3 className="font-bold text-yellow-900 mb-2 text-lg">
                                        🏆 Nouveau badge obtenu !
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{badges.find(b => b.id === newBadgeEarned)?.icon}</span>
                                        <div>
                                            <p className="font-semibold text-yellow-900">
                                                {badges.find(b => b.id === newBadgeEarned)?.name}
                                            </p>
                                            <p className="text-sm text-yellow-700">
                                                {badges.find(b => b.id === newBadgeEarned)?.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                                <h3 className="font-semibold text-blue-800 mb-2">💡 Pour aller plus loin :</h3>
                                <p className="text-blue-700 text-sm leading-relaxed">
                                    {currentQuestion.educationalText}
                                </p>
                            </div>
                        </>
                    )}

                    {showNextButton && (
                        <div className="mt-6">
                            <button
                                onClick={handleNextQuestion}
                                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                                {isLastQuestion ? 'Terminer' : 'Question suivante'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Window>
    )
}

export default MainGame
