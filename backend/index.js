const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors())
app.use(express.json())

// Mapping des réponses correctes pour chaque question
// Format: { section: { questionNumber: 'correctAnswer' } }
const correctAnswers = {
    1: { 1: 'a', 2: 'a' },           // Section 1: Sobriété numérique
    2: { 1: 'd', 2: 'c' },           // Section 2: Reconditionnement
    3: { 1: 'c', 2: ['a', 'b', 'c', 'd'] }, // Section 3: Linux (Q2 a plusieurs bonnes réponses)
    4: { 1: 'b', 2: 'b' },           // Section 4: Forge des communs
    5: { 1: 'b', 2: 'b' },           // Section 5: Transition numérique
    6: { 1: 'b', 2: 'a' }            // Section 6: Co-construction
}

// Fonction pour obtenir la réponse correcte
function getCorrectAnswer(questionId) {
    // Si questionId est un nombre simple, on peut le mapper différemment
    // Pour l'instant, on suppose que questionId peut être un numéro global ou {section, question}
    
    // Si c'est un objet avec section et question
    if (typeof questionId === 'object' && questionId.section && questionId.question) {
        const section = correctAnswers[questionId.section]
        if (section) {
            return section[questionId.question]
        }
    }
    
    // Sinon, on assume une numérotation globale (1-12)
    // Q1 Section 1 = 1, Q2 Section 1 = 2, Q1 Section 2 = 3, etc.
    const globalAnswers = {
        1: 'a',   // Section 1, Q1
        2: 'a',   // Section 1, Q2
        3: 'd',   // Section 2, Q1
        4: 'c',   // Section 2, Q2
        5: 'c',   // Section 3, Q1
        6: ['a', 'b', 'c', 'd'], // Section 3, Q2
        7: 'b',   // Section 4, Q1
        8: 'b',   // Section 4, Q2
        9: 'b',   // Section 5, Q1
        10: 'b',  // Section 5, Q2
        11: 'b',  // Section 6, Q1
        12: 'a'   // Section 6, Q2
    }
    
    return globalAnswers[questionId] || null
}

app.get('/', (req, res) => {
    console.log("Hello World")
    res.json({ message: "Hello World" })
})

app.post('/api/checkAnswer', (req, res) => {
    const { question } = req.body
    console.log('Question reçue:', question)
    const { answer } = req.body
    console.log('Réponse reçue:', answer)
    
    // Récupérer la réponse correcte
    const correctAnswer = getCorrectAnswer(question)
    
    // Vérifier si la réponse est correcte
    let isCorrect = false
    if (Array.isArray(correctAnswer)) {
        // Pour les questions avec plusieurs bonnes réponses
        isCorrect = correctAnswer.includes(answer)
    } else {
        isCorrect = correctAnswer === answer
    }
    
    res.json({ 
        success: true, 
        isCorrect: isCorrect,
        correctAnswer: correctAnswer,
        message: isCorrect 
            ? `Bonne réponse ! La réponse correcte est ${Array.isArray(correctAnswer) ? correctAnswer.join(', ') : correctAnswer}` 
            : `Mauvaise réponse. La réponse correcte est ${Array.isArray(correctAnswer) ? correctAnswer.join(', ') : correctAnswer}`
    })
})

app.listen(4000, () => {
    console.log('Server is running on port 4000')
})