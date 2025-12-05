const express = require('express')
const cors = require('cors')
const mysql = require('mysql2/promise')

const app = express()

app.use(cors())
app.use(express.json())

// Configuration de la connexion à la base de données MariaDB
const DB_HOST = process.env.DB_HOST || 'eaglenest.fr'
const DB_PORT = process.env.DB_PORT || 3306
const DB_NAME = process.env.DB_NAME || 'ndi2025'
const DB_USER = process.env.DB_USER || 'ndi2025'
const DB_PASSWORD = process.env.DB_PASSWORD || '3-[NN2jhM@v[BEu-'

// Configuration de la connexion MariaDB
const dbConfig = {
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}

// Création du pool de connexions
const pool = mysql.createPool(dbConfig)

// Fonction pour tester la connexion à la base de données
async function testConnection() {
    try {
        const connection = await pool.getConnection()
        console.log('✓ Connexion à la base de données MariaDB réussie')
        console.log(`  Host: ${DB_HOST}:${DB_PORT}`)
        console.log(`  Database: ${DB_NAME}`)
        console.log(`  User: ${DB_USER}`)
        
        // Test d'une requête simple
        const [rows] = await connection.query('SELECT VERSION() as version, DATABASE() as database')
        console.log(`  Version MySQL/MariaDB: ${rows[0].version}`)
        console.log(`  Base de données active: ${rows[0].database}`)
        
        connection.release()
        return { success: true, message: 'Connexion réussie', version: rows[0].version, database: rows[0].database }
    } catch (err) {
        console.error('✗ Erreur de connexion à la base de données:')
        console.error(`  Code: ${err.code}`)
        console.error(`  Message: ${err.message}`)
        console.error(`  Host: ${DB_HOST}:${DB_PORT}`)
        return { success: false, error: err.message, code: err.code }
    }
}

// Test de la connexion au démarrage
testConnection()
    .then((result) => {
        if (!result.success) {
            console.error('Impossible de se connecter à la base de données. Arrêt du serveur.')
            process.exit(1)
        }
    })
    .catch((err) => {
        console.error('Erreur lors du test de connexion:', err)
        process.exit(1)
    })

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

// Endpoint pour tester la connexion à la base de données
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await testConnection()
        if (result.success) {
            res.json({
                success: true,
                message: 'Connexion à la base de données réussie',
                host: DB_HOST,
                port: DB_PORT,
                database: DB_NAME,
                user: DB_USER,
                version: result.version,
                activeDatabase: result.database
            })
        } else {
            res.status(500).json({
                success: false,
                message: 'Erreur de connexion à la base de données',
                error: result.error,
                code: result.code,
                host: DB_HOST,
                port: DB_PORT,
                database: DB_NAME,
                user: DB_USER
            })
        }
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors du test de connexion',
            error: err.message
        })
    }
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