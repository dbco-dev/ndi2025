const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors())
app.use(express.json())

// Mapping des réponses correctes pour chaque question par ID
// Les IDs correspondent aux IDs des questions dans questions.json
const correctAnswers = {
    // Section 1: Sobriété numérique
    1: 'a',   // Email avec pièce jointe
    2: 'a',   // Data center
    13: 'b',  // Smartphone consommation
    14: 'b',  // Streaming vidéo
    
    // Section 2: Reconditionnement
    3: 'd',   // Pourcentage CO2 économisé (80%)
    4: 'c',   // Prix reconditionné (430€)
    15: 'c',  // Durée de vie (4-5 ans)
    16: 'b',  // Avantage écologique (évite destruction)
    
    // Section 3: Linux
    5: 'c',   // Distribution éducation (PrimTux)
    6: ['a', 'b', 'c', 'd'], // Pourquoi Linux (toutes les réponses sont bonnes)
    17: 'b',  // Distribution vieux PC (Lubuntu)
    18: 'a',  // Avantage économique (pas de coût licence)
    
    // Section 4: Forge des communs
    7: 'b',   // Objectif Forge des communs
    8: 'b',   // Moodle (Commun numérique)
    19: 'b',  // Avantage partage (mutualiser)
    20: 'b',  // Licence Creative Commons
    
    // Section 5: Transition écoresponsable
    9: 'b',   // Label E3D
    10: 'b',  // Premier levier (sensibiliser)
    21: 'b',  // Action simple (éteindre box)
    22: 'b',  // Écoconception
    
    // Section 6: Co-construction
    11: 'b',  // Avantage co-construction
    12: 'a',  // Outil libre (Framapad)
    23: 'b',  // Impliquer élèves
    24: 'b'   // Avantage outils libres
}

// Fonction pour obtenir la réponse correcte
function getCorrectAnswer(questionId) {
    // Si questionId est un objet avec section et question (ancien format)
    if (typeof questionId === 'object' && questionId.section && questionId.question) {
        // Conversion pour compatibilité avec ancien format si nécessaire
        // On cherche dans le mapping par section
        const sectionMapping = {
            1: { 1: 'a', 2: 'a', 3: 'b', 4: 'b' },
            2: { 1: 'd', 2: 'c', 3: 'c', 4: 'b' },
            3: { 1: 'c', 2: ['a', 'b', 'c', 'd'], 3: 'b', 4: 'a' },
            4: { 1: 'b', 2: 'b', 3: 'b', 4: 'b' },
            5: { 1: 'b', 2: 'b', 3: 'b', 4: 'b' },
            6: { 1: 'b', 2: 'a', 3: 'b', 4: 'b' }
        }
        const section = sectionMapping[questionId.section]
        if (section) {
            return section[questionId.question]
        }
    }
    
    // Mapping par ID de question (nouveau format - 24 questions)
    return correctAnswers[questionId] || null
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