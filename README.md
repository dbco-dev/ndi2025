# NDI 2025 - Projet Sobriété Numérique

## 🌟 À propos

Ce projet a été développé dans le cadre de la **Nuit de l'Info 2025** par le collectif **NIRD**. La Nuit de l'Info est un événement national qui réunit des équipes d'étudiants et de professionnels autour d'un défi de développement logiciel à réaliser en une nuit.

### Notre motivation

Le thème de cette édition portait sur la **sobriété numérique** et la sensibilisation aux impacts environnementaux du numérique. Notre équipe NIRD a souhaité créer une expérience interactive et ludique permettant de :

- 📚 **Sensibiliser** aux enjeux écologiques du numérique (consommation énergétique, obsolescence programmée, reconditionnement)
- 🎮 **Gamifier** l'apprentissage à travers une interface desktop simulée
- 💡 **Éduquer** sur les bonnes pratiques numériques responsables
- 🌱 **Promouvoir** les solutions durables comme Linux, les logiciels libres et les communs numériques

### La démarche NIRD

**NIRD** (Numérique Inclusif, Responsable et Durable) est une démarche portée par un collectif enseignant issu de la forge des communs numériques éducatifs. Elle vise à promouvoir un numérique libre et écocitoyen dans les établissements scolaires, en s'articulant autour de trois piliers :

- **Inclusion** : accès équitable au numérique et réduction de la fracture numérique
- **Responsabilité** : usage raisonné de technologies souveraines et respectueuses des données personnelles
- **Durabilité** : lutte contre l'obsolescence programmée par l'adoption de Linux et le reconditionnement

Cette démarche s'inspire du projet d'établissement NIRD du lycée Carnot de Bruay-la-Buissière et cherche à essaimer vers d'autres établissements scolaires français. En savoir plus sur [nird.forge.apps.education.fr](https://nird.forge.apps.education.fr/)

## 🎯 Le projet

Notre projet propose une **expérience ludique et immersive** en deux phases :

### 🕵️ Phase 1 : L'exploration

L'utilisateur se retrouve face à l'ordinateur d'un professeur, laissé malencontreusement allumé. En se mettant dans la peau d'un élève curieux, il peut :

- Fouiller dans les fichiers du bureau
- Explorer les emails du professeur
- Consulter des documents (PDF, ODT, TXT) sur la sobriété numérique
- **Découvrir les réponses à un QCM** cachées dans les fichiers

Cette phase permet de sensibiliser l'utilisateur aux thématiques portées par le collectif NIRD (Linux, reconditionnement, consommation énergétique, obsolescence programmée...) de manière ludique et narrative.

### 🎮 Phase 2 : Le QCM interactif

Après avoir exploré l'ordinateur, l'utilisateur peut lancer une application présente sur le bureau du professeur qui démarre un **QCM interactif**. Ce quiz permet de :

- Tester ses connaissances sur les enjeux du numérique responsable
- Gagner des **badges** récompensant ses compétences
- Obtenir un **score** en fonction de ses performances
- Mettre en pratique ce qu'il a appris lors de l'exploration

L'ensemble simule un environnement desktop Linux avec une interface intuitive et moderne.

### ✨ Fonctionnalités supplémentaires

Au-delà de l'expérience principale, le projet intègre des éléments ludiques et surprises :

- **🐍 Jeu Snake** : Un classique du jeu vidéo intégré au desktop, avec système de score, tableau des meilleurs joueurs, et difficulté progressive
- **🎬 Easter eggs** : Des surprises cachées pour récompenser les utilisateurs les plus curieux
- **📂 Explorateur de fichiers** : Navigation intuitive dans une arborescence de dossiers (Bureau, Travail, Projets, Perso, Divers)
- **✉️ Client mail responsive** : Interface email complète avec gestion des dossiers, recherche, et aperçu des messages
- **📄 Visionneuses de documents** :
  - Lecteur PDF avec zoom
  - Éditeur ODT avec barre d'outils WYSIWYG (polices, tailles, couleurs, alignement)
  - Éditeur de texte avec compteurs de mots et caractères
- **🪟 Système de fenêtres** : Fenêtres déplaçables, redimensionnables, avec gestion du focus et empilement intelligent

### Technologies utilisées

- **React** + **TypeScript** : pour une application robuste et maintenable
- **Vite** : pour un développement rapide et performant
- **Tailwind CSS** : pour un design moderne et responsive
- **Architecture modulaire** : composants réutilisables (Window, Files, Mail, etc.)

## 🚀 Installation et lancement

```bash
# Installation des dépendances
npm install

# Lancement en développement
npm run dev

# Build pour la production
npm run build
```

## 📁 Structure du projet

```
src/
├── components/
│   ├── blocks/       # Composants de base (Window, Files, etc.)
│   ├── layouts/      # Layouts applicatifs (Mail, PDF, ODT, TXT)
│   └── shorts/       # Petits composants utilitaires
├── data/             # Données JSON (questions, fichiers, mails)
└── assets/           # Ressources statiques
```

## 🌍 Impact et message

Ce projet illustre qu'il est possible de créer des **interfaces modernes et engageantes** tout en restant **léger et performant**. Chaque choix technique reflète notre engagement pour une informatique plus responsable :

- Code optimisé et composants réutilisables
- Pas de dépendances superflues
- Architecture modulaire facilitant la maintenance
- Design épuré limitant la charge cognitive

---

**Équipe NIRD** - Nuit de l'Info 2025  
_Pour un numérique plus sobre et responsable_ 🌱
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
globalIgnores(['dist']),
{
files: ['**/*.{ts,tsx}'],
extends: [
// Other configs...
// Enable lint rules for React
reactX.configs['recommended-typescript'],
// Enable lint rules for React DOM
reactDom.configs.recommended,
],
languageOptions: {
parserOptions: {
project: ['./tsconfig.node.json', './tsconfig.app.json'],
tsconfigRootDir: import.meta.dirname,
},
// other options...
},
},
])

```

```
