import { useState, useRef } from 'react'

function WeirdTextField() {
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [text, setText] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)

    const handleMouseEnter = () => {
        if (!containerRef.current) return
        
        // Obtient les dimensions du conteneur parent (celui avec position: relative)
        const parentElement = containerRef.current.offsetParent as HTMLElement
        if (!parentElement) return
        
        const parentRect = parentElement.getBoundingClientRect()
        
        // Calcule les limites en tenant compte de la taille du champ
        const fieldWidth = 128 // 128px = largeur du champ (w-32)
        const fieldHeight = 40 // 40px = hauteur du champ (h-10)
        
        const maxX = parentRect.width - fieldWidth
        const maxY = parentRect.height - fieldHeight
        
        const randomX = Math.max(0, Math.floor(Math.random() * maxX))
        const randomY = Math.max(0, Math.floor(Math.random() * maxY))
        
        setPosition({ x: randomX, y: randomY })
    }

    const getEmojiForLetter = (letter: string): string => {
        const normalizedLetter = letter.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        
        // Mapping des lettres vers des emojis correspondant à des mots français
        const emojiMap: { [key: string]: string } = {
            'a': '✈️',  // Avion
            'b': '🚢',  // Bateau
            'c': '🐱',  // Chat
            'd': '🐬',  // Dauphin
            'e': '🐘',  // Éléphant
            'f': '🌸',  // Fleur
            'g': '🦒',  // Girafe
            'h': '🚁',  // Hélicoptère
            'i': '🧊',  // Igloo
            'j': '🧃',  // Jus
            'k': '🦘',  // Kangourou
            'l': '🦁',  // Lion
            'm': '🏠',  // Maison
            'n': '☁️',  // Nuage
            'o': '🐦',  // Oiseau
            'p': '🍎',  // Pomme
            'q': '❓',  // Question
            'r': '🌹',  // Rose
            's': '☀️',  // Soleil
            't': '🐢',  // Tortue
            'u': '🦄',  // Licorne
            'v': '🚗',  // Voiture
            'w': '🚋',  // Onde (Wave)
            'x': '❌',  // X
            'y': '⛵',  // Yacht
            'z': '🦓'   // Zèbre
        }
        
        return emojiMap[normalizedLetter] || letter
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value
        // Convertit chaque lettre en emoji
        const emojiText = inputValue
            .split('')
            .map(char => {
                if (/[a-zA-ZÀ-ÿ]/.test(char)) {
                    return getEmojiForLetter(char)
                }
                return char
            })
            .join('')
        
        setText(emojiText)
    }

    return (
        <div 
            ref={containerRef}
            className="absolute"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transition: 'all 0.1s ease-out'
            }}
        >
            <input 
                type="text" 
                className="h-10 w-[300px] bg-zinc-300 rounded-md p-2"
                onMouseEnter={handleMouseEnter}
                onChange={handleInputChange}
                value={text}
                placeholder="Essayez saisir quelque chose..."
            />
        </div>
    )
}

export default WeirdTextField