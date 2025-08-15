// ===== 1. MISE À JOUR DE exercise-manager.js =====
// js/exercise-manager.js
class ExerciseManager {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.exercises = new Map();
        this.currentExercise = null;
        this.exerciseList = null;
    }

    // Charger la liste des exercices disponibles
    async loadExerciseList() {
        try {
            const response = await fetch('./data/exercises/exercise-list.json');
            this.exerciseList = await response.json();
            return this.exerciseList;
        } catch (error) {
            console.error('Erreur lors du chargement de la liste des exercices:', error);
            throw error;
        }
    }

    // Charger un exercice spécifique
    async loadExercise(exerciseId) {
        try {
            const response = await fetch(`./data/exercises/${exerciseId}.json`);
            const exerciseData = await response.json();
            
            const exercise = new Exercise(exerciseData, this.audioEngine);
            this.exercises.set(exerciseId, exercise);
            this.currentExercise = exercise;
            
            return exercise;
        } catch (error) {
            console.error(`Erreur lors du chargement de l'exercice ${exerciseId}:`, error);
            throw error;
        }
    }

    // Obtenir un exercice chargé
    getExercise(exerciseId) {
        return this.exercises.get(exerciseId);
    }

    // Obtenir l'exercice actuel
    getCurrentExercise() {
        return this.currentExercise;
    }

    // Obtenir tous les exercices chargés
    getAllExercises() {
        return Array.from(this.exercises.values());
    }

    // Obtenir la liste des exercices disponibles
    getExerciseList() {
        return this.exerciseList;
    }
}

// ===== 2. NOUVELLE CLASSE Exercise =====
// Ajoutez cette classe dans exercise-manager.js ou créez un nouveau fichier exercise.js
class Exercise {
    constructor(data, audioEngine) {
        this.audioEngine = audioEngine;
        this.id = data.id;
        this.title = data.title;
        this.composer = data.composer;
        this.difficulty = data.difficulty;
        this.category = data.category;
        this.duration = data.duration;
        this.tempo = data.tempo;
        this.timeSignature = data.timeSignature;
        this.key = data.key;
        this.description = data.description;
        this.objectives = data.objectives;
        this.instructions = data.instructions;
        this.rightHand = data.rightHand;
        this.leftHand = data.leftHand;
        this.practiceNotes = data.practiceNotes;
        this.commonMistakes = data.commonMistakes;
        this.variations = data.variations || [];
        this.prerequisites = data.prerequisites || [];
        this.nextExercises = data.nextExercises || [];
        this.tags = data.tags || [];
        this.audioFiles = data.audioFiles || {};
        this.sheetMusic = data.sheetMusic || {};
    }

    // Obtenir les notes pour une mesure donnée
    getNotesForMeasure(hand, measureNumber) {
        const handData = hand === 'right' ? this.rightHand : this.leftHand;
        const measure = handData.measures.find(m => m.measure === measureNumber);
        return measure ? measure.notes : [];
    }

    // Obtenir le doigté pour une mesure donnée
    getFingeringForMeasure(hand, measureNumber) {
        const handData = hand === 'right' ? this.rightHand : this.leftHand;
        const measure = handData.measures.find(m => m.measure === measureNumber);
        return measure ? measure.fingering : [];
    }

    // Obtenir les timings pour une mesure donnée
    getTimingForMeasure(hand, measureNumber) {
        const handData = hand === 'right' ? this.rightHand : this.leftHand;
        const measure = handData.measures.find(m => m.measure === measureNumber);
        return measure ? measure.timing : [];
    }

    // Obtenir la dynamique pour une mesure donnée
    getDynamicsForMeasure(hand, measureNumber) {
        const handData = hand === 'right' ? this.rightHand : this.leftHand;
        const measure = handData.measures.find(m => m.measure === measureNumber);
        return measure ? measure.dynamics : 'mf';
    }

    // Obtenir le nombre total de mesures
    getTotalMeasures() {
        return Math.max(
            this.rightHand.measures.length,
            this.leftHand.measures.length
        );
    }

    // Convertir une note en fréquence
    noteToFrequency(note) {
        const noteMap = {
            'C': -9, 'C#': -8, 'Db': -8, 'D': -7, 'D#': -6, 'Eb': -6,
            'E': -5, 'F': -4, 'F#': -3, 'Gb': -3, 'G': -2, 'G#': -1,
            'Ab': -1, 'A': 0, 'A#': 1, 'Bb': 1, 'B': 2
        };
        
        const match = note.match(/^([A-G]#?b?)(\d+)$/);
        if (!match) return 440; // Fallback à A4
        
        const [, noteName, octave] = match;
        const semitoneOffset = noteMap[noteName] || 0;
        const octaveOffset = (parseInt(octave) - 4) * 12;
        const semitones = semitoneOffset + octaveOffset;
        
        return 440 * Math.pow(2, semitones / 12);
    }

    // Obtenir toutes les fréquences pour une mesure
    getFrequenciesForMeasure(hand, measureNumber) {
        const notes = this.getNotesForMeasure(hand, measureNumber);
        return notes.map(note => this.noteToFrequency(note));
    }

    // Jouer une mesure avec l'AudioEngine
    async playMeasure(measureNumber, handsMode = 'both', tempo = null) {
        const actualTempo = tempo || this.tempo.recommended;
        const beatDuration = 60 / actualTempo; // durée d'un beat en secondes

        const promises = [];

        // Main droite
        if (handsMode === 'both' || handsMode === 'right') {
            const rightNotes = this.getNotesForMeasure('right', measureNumber);
            const rightTimings = this.getTimingForMeasure('right', measureNumber);
            const rightDynamics = this.getDynamicsForMeasure('right', measureNumber);

            for (let i = 0; i < rightNotes.length; i++) {
                const frequency = this.noteToFrequency(rightNotes[i]);
                const startTime = rightTimings[i] * beatDuration;
                const duration = 0.5; // durée de base d'une note
                
                promises.push(
                    new Promise(resolve => {
                        setTimeout(() => {
                            this.audioEngine.playTone(frequency, duration, rightDynamics);
                            resolve();
                        }, startTime * 1000);
                    })
                );
            }
        }

        // Main gauche
        if (handsMode === 'both' || handsMode === 'left') {
            const leftNotes = this.getNotesForMeasure('left', measureNumber);
            const leftTimings = this.getTimingForMeasure('left', measureNumber);
            const leftDynamics = this.getDynamicsForMeasure('left', measureNumber);

            for (let i = 0; i < leftNotes.length; i++) {
                const frequency = this.noteToFrequency(leftNotes[i]);
                const startTime = leftTimings[i] * beatDuration;
                const duration = 0.5;
                
                promises.push(
                    new Promise(resolve => {
                        setTimeout(() => {
                            this.audioEngine.playTone(frequency, duration, leftDynamics);
                            resolve();
                        }, startTime * 1000);
                    })
                );
            }
        }

        return Promise.all(promises);
    }

    // Charger les fichiers audio associés
    async loadAudioFiles() {
        const audioPromises = [];
        
        if (this.audioFiles.slow) {
            audioPromises.push(this.audioEngine.loadAudio(`./data/audio/${this.audioFiles.slow}`, 'slow'));
        }
        if (this.audioFiles.medium) {
            audioPromises.push(this.audioEngine.loadAudio(`./data/audio/${this.audioFiles.medium}`, 'medium'));
        }
        if (this.audioFiles.fast) {
            audioPromises.push(this.audioEngine.loadAudio(`./data/audio/${this.audioFiles.fast}`, 'fast'));
        }

        return Promise.all(audioPromises);
    }

    // Jouer un fichier audio pré-enregistré
    async playAudioFile(speed = 'medium') {
        if (this.audioFiles[speed]) {
            return this.audioEngine.play(speed);
        } else {
            console.warn(`Fichier audio ${speed} non disponible pour ${this.id}`);
        }
    }
}

// ===== 3. MISE À JOUR DE exercise-player.js =====
// js/exercise-player.js
class ExercisePlayer {
    constructor(containerId, exerciseManager, languageManager) {
        this.container = document.getElementById(containerId);
        this.exerciseManager = exerciseManager;
        this.languageManager = languageManager;
        this.currentExercise = null;
        this.currentMeasure = 1;
        this.currentTempo = 72;
        this.handsMode = 'both'; // 'left', 'right', 'both'
        this.isPlaying = false;
        
        this.init();
    }

    init() {
        this.createHTML();
        this.bindEvents();
    }

    createHTML() {
        this.container.innerHTML = `
            <div class="exercise-player">
                <div class="exercise-header">
                    <h2 id="exercise-title">Chargement...</h2>
                    <div class="exercise-meta">
                        <span id="exercise-composer"></span>
                        <span id="exercise-difficulty"></span>
                        <span id="exercise-key"></span>
                    </div>
                </div>

                <div class="exercise-info">
                    <div class="exercise-description">
                        <h3 data-lang-key="description">Description</h3>
                        <p id="exercise-description-text"></p>
                    </div>
                    
                    <div class="exercise-objectives">
                        <h3 data-lang-key="objectives">Objectifs</h3>
                        <ul id="exercise-objectives-list"></ul>
                    </div>
                </div>

                <div class="exercise-controls">
                    <div class="tempo-control">
                        <label data-lang-key="tempo">Tempo: <span id="tempo-value">72</span> BPM</label>
                        <input type="range" id="tempo-slider" min="60" max="120" value="72">
                    </div>

                    <div class="hands-control">
                        <label data-lang-key="hands">Mains:</label>
                        <select id="hands-selector">
                            <option value="both" data-lang-key="both-hands">Les deux mains</option>
                            <option value="right" data-lang-key="right-hand">Main droite</option>
                            <option value="left" data-lang-key="left-hand">Main gauche</option>
                        </select>
                    </div>

                    <div class="measure-controls">
                        <button id="prev-measure" data-lang-key="previous">Précédent</button>
                        <span id="measure-indicator">Mesure 1 / 1</span>
                        <button id="next-measure" data-lang-key="next">Suivant</button>
                    </div>

                    <div class="playback-controls">
                        <button id="play-measure" class="play-button" data-lang-key="play-measure">
                            Jouer la mesure
                        </button>
                        <button id="play-exercise" class="play-button" data-lang-key="play-exercise">
                            Jouer l'exercice
                        </button>
                    </div>
                </div>

                <div class="current-measure-display">
                    <h3 id="current-measure-title">Mesure 1</h3>
                    
                    <div id="right-hand-display" class="hand-display">
                        <h4 data-lang-key="right-hand">Main droite</h4>
                        <div class="notes-display">
                            <span data-lang-key="notes">Notes:</span>
                            <span id="right-notes"></span>
                        </div>
                        <div class="fingering-display">
                            <span data-lang-key="fingering">Doigtés:</span>
                            <span id="right-fingering"></span>
                        </div>
                    </div>

                    <div id="left-hand-display" class="hand-display">
                        <h4 data-lang-key="left-hand">Main gauche</h4>
                        <div class="notes-display">
                            <span data-lang-key="notes">Notes:</span>
                            <span id="left-notes"></span>
                        </div>
                        <div class="fingering-display">
                            <span data-lang-key="fingering">Doigtés:</span>
                            <span id="left-fingering"></span>
                        </div>
                    </div>
                </div>

                <div class="exercise-instructions">
                    <h3 data-lang-key="practice-instructions">Instructions de pratique</h3>
                    <ul id="instructions-list"></ul>
                </div>

                <div class="common-mistakes">
                    <h3 data-lang-key="common-mistakes">Erreurs communes</h3>
                    <ul id="mistakes-list"></ul>
                </div>

                <div class="exercise-variations" id="variations-section" style="display: none;">
                    <h3 data-lang-key="variations">Variations</h3>
                    <div id="variations-list"></div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Contrôle du tempo
        const tempoSlider = document.getElementById('tempo-slider');
        const tempoValue = document.getElementById('tempo-value');
        tempoSlider.addEventListener('input', (e) => {
            this.currentTempo = parseInt(e.target.value);
            tempoValue.textContent = this.currentTempo;
        });

        // Sélection des mains
        document.getElementById('hands-selector').addEventListener('change', (e) => {
            this.handsMode = e.target.value;
            this.updateMeasureDisplay();
        });

        // Navigation des mesures
        document.getElementById('prev-measure').addEventListener('click', () => {
            this.previousMeasure();
        });

        document.getElementById('next-measure').addEventListener('click', () => {
            this.nextMeasure();
        });

        // Contrôles de lecture
        document.getElementById('play-measure').addEventListener('click', () => {
            this.playCurrentMeasure();
        });

        document.getElementById('play-exercise').addEventListener('click', () => {
            this.playFullExercise();
        });
    }

    async loadExercise(exerciseId) {
        try {
            this.currentExercise = await this.exerciseManager.loadExercise(exerciseId);
            this.currentMeasure = 1;
            
            // Initialiser le tempo avec la valeur recommandée
            this.currentTempo = this.currentExercise.tempo.recommended;
            document.getElementById('tempo-slider').value = this.currentTempo;
            document.getElementById('tempo-slider').min = this.currentExercise.tempo.min;
            document.getElementById('tempo-slider').max = this.currentExercise.tempo.max;
            document.getElementById('tempo-value').textContent = this.currentTempo;
            
            this.updateDisplay();
            this.updateMeasureDisplay();
            
        } catch (error) {
            console.error('Erreur lors du chargement de l\'exercice:', error);
            this.showError('Erreur lors du chargement de l\'exercice');
        }
    }

    updateDisplay() {
        if (!this.currentExercise) return;

        const lang = this.languageManager.getCurrentLanguage();
        
        // Mise à jour de l'en-tête
        document.getElementById('exercise-title').textContent = this.currentExercise.title[lang];
        document.getElementById('exercise-composer').textContent = this.currentExercise.composer;
        document.getElementById('exercise-difficulty').textContent = this.currentExercise.difficulty;
        document.getElementById('exercise-key').textContent = this.currentExercise.key;

        // Description
        document.getElementById('exercise-description-text').textContent = 
            this.currentExercise.description[lang];

        // Objectifs
        const objectivesList = document.getElementById('exercise-objectives-list');
        objectivesList.innerHTML = '';
        this.currentExercise.objectives[lang].forEach(objective => {
            const li = document.createElement('li');
            li.textContent = objective;
            objectivesList.appendChild(li);
        });

        // Instructions
        const instructionsList = document.getElementById('instructions-list');
        instructionsList.innerHTML = '';
        this.currentExercise.instructions[lang].forEach(instruction => {
            const li = document.createElement('li');
            li.textContent = instruction;
            instructionsList.appendChild(li);
        });

        // Erreurs communes
        const mistakesList = document.getElementById('mistakes-list');
        mistakesList.innerHTML = '';
        this.currentExercise.commonMistakes[lang].forEach(mistake => {
            const li = document.createElement('li');
            li.textContent = mistake;
            mistakesList.appendChild(li);
        });

        // Variations
        if (this.currentExercise.variations && this.currentExercise.variations.length > 0) {
            const variationsSection = document.getElementById('variations-section');
            const variationsList = document.getElementById('variations-list');
            
            variationsList.innerHTML = '';
            this.currentExercise.variations.forEach(variation => {
                const div = document.createElement('div');
                div.className = 'variation';
                div.innerHTML = `
                    <h4>${variation.name[lang]}</h4>
                    <p>${variation.description[lang]}</p>
                `;
                variationsList.appendChild(div);
            });
            
            variationsSection.style.display = 'block';
        }
    }

    updateMeasureDisplay() {
        if (!this.currentExercise) return;

        const totalMeasures = this.currentExercise.getTotalMeasures();
        
        // Mise à jour de l'indicateur de mesure
        document.getElementById('measure-indicator').textContent = 
            `Mesure ${this.currentMeasure} / ${totalMeasures}`;
        document.getElementById('current-measure-title').textContent = 
            `Mesure ${this.currentMeasure}`;

        // Contrôles de navigation
        document.getElementById('prev-measure').disabled = this.currentMeasure === 1;
        document.getElementById('next-measure').disabled = this.currentMeasure === totalMeasures;

        // Affichage des mains selon le mode sélectionné
        const rightDisplay = document.getElementById('right-hand-display');
        const leftDisplay = document.getElementById('left-hand-display');

        rightDisplay.style.display = (this.handsMode === 'right' || this.handsMode === 'both') ? 'block' : 'none';
        leftDisplay.style.display = (this.handsMode === 'left' || this.handsMode === 'both') ? 'block' : 'none';

        // Mise à jour des notes et doigtés
        if (this.handsMode === 'right' || this.handsMode === 'both') {
            const rightNotes = this.currentExercise.getNotesForMeasure('right', this.currentMeasure);
            const rightFingering = this.currentExercise.getFingeringForMeasure('right', this.currentMeasure);
            
            document.getElementById('right-notes').textContent = rightNotes.join(' - ');
            document.getElementById('right-fingering').textContent = rightFingering.join(' - ');
        }

        if (this.handsMode === 'left' || this.handsMode === 'both') {
            const leftNotes = this.currentExercise.getNotesForMeasure('left', this.currentMeasure);
            const leftFingering = this.currentExercise.getFingeringForMeasure('left', this.currentMeasure);
            
            document.getElementById('left-notes').textContent = leftNotes.join(' - ');
            document.getElementById('left-fingering').textContent = leftFingering.join(' - ');
        }
    }

    previousMeasure() {
        if (this.currentMeasure > 1) {
            this.currentMeasure--;
            this.updateMeasureDisplay();
        }
    }

    nextMeasure() {
        const totalMeasures = this.currentExercise?.getTotalMeasures() || 1;
        if (this.currentMeasure < totalMeasures) {
            this.currentMeasure++;
            this.updateMeasureDisplay();
        }
    }

    async playCurrentMeasure() {
        if (!this.currentExercise || this.isPlaying) return;

        try {
            this.isPlaying = true;
            document.getElementById('play-measure').disabled = true;
            
            await this.currentExercise.playMeasure(
                this.currentMeasure, 
                this.handsMode, 
                this.currentTempo
            );
            
        } catch (error) {
            console.error('Erreur lors de la lecture:', error);
        } finally {
            this.isPlaying = false;
            document.getElementById('play-measure').disabled = false;
        }
    }

    async playFullExercise() {
        if (!this.currentExercise || this.isPlaying) return;

        try {
            this.isPlaying = true;
            document.getElementById('play-exercise').disabled = true;
            
            const totalMeasures = this.currentExercise.getTotalMeasures();
            
            for (let measure = 1; measure <= totalMeasures; measure++) {
                this.currentMeasure = measure;
                this.updateMeasureDisplay();
                
                await this.currentExercise.playMeasure(
                    measure, 
                    this.handsMode, 
                    this.currentTempo
                );
                
                // Pause entre les mesures
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
        } catch (error) {
            console.error('Erreur lors de la lecture complète:', error);
        } finally {
            this.isPlaying = false;
            document.getElementById('play-exercise').disabled = false;
        }
    }

    showError(message) {
        this.container.innerHTML = `
            <div class="error-message">
                <h3>Erreur</h3>
                <p>${message}</p>
            </div>
        `;
    }
}

// ===== 4. FICHIER exercise-list.json =====
// data/exercises/exercise-list.json
{
  "exercises": [
    {
      "id": "hanon-01",
      "title": {
        "fr": "Hanon Exercice N°1 - Indépendance des doigts",
        "en": "Hanon Exercise No.1 - Finger Independence"
      },
      "composer": "Charles-Louis Hanon",
      "difficulty": "beginner",
      "category": "technique",
      "duration": "5-10 minutes",
      "tags": ["hanon", "technique", "doigts", "velocite", "independance"]
    }
    // Ajoutez d'autres exercices ici...
  ]
}

// ===== 5. MISE À JOUR DE app.js =====
// js/app.js - Ajoutez ces méthodes à votre classe PianoLearnApp
class PianoLearnApp {
    constructor() {
        // ... votre code existant ...
        this.exercisePlayer = null;
    }

    async initExercisePage() {
        // Initialiser le lecteur d'exercices sur la page exercise.html
        if (document.getElementById('exercise-container')) {
            this.exercisePlayer = new ExercisePlayer(
                'exercise-container',
                this.exerciseManager,
                this.languageManager
            );
            
            // Charger la liste des exercices pour le sélecteur
            await this.loadExerciseSelector();
        }
    }

    async loadExerciseSelector() {
        try {
            const exerciseList = await this.exerciseManager.loadExerciseList();
            const selector = document.getElementById('exercise-selector');
            
            if (selector) {
                selector.innerHTML = '<option value="">Choisir un exercice...</option>';
                
                exerciseList.exercises.forEach(exercise => {
                    const option = document.createElement('option');
                    option.value = exercise.id;
                    option.textContent = `${exercise.title[this.languageManager.getCurrentLanguage()]} - ${exercise.composer}`;
                    selector.appendChild(option);
                });
                
                selector.addEventListener('change', (e) => {
                    if (e.target.value) {
                        this.exercisePlayer.loadExercise(e.target.value);
                    }
                });
            }
        } catch (error) {
            console.error('Erreur lors du chargement du sélecteur:', error);
        }
    }
}

// ===== 6. MISE À JOUR DE main.js =====
// js/main.js
document.addEventListener('DOMContentLoaded', async () => {
    const app = new PianoLearnApp();
    await app.init();
    
    // Initialiser la page d'exercices si nous sommes sur exercise.html
    if (window.location.pathname.includes('exercise.html')) {
        await app.initExercisePage();
    }
});

// ===== 7. EXEMPLE DE FICHIER HTML POUR exercise.html =====
/*
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exercices - PianoLearn</title>
    <link rel="stylesheet" href="./css/styles.css">
    <link rel="stylesheet" href="./css/exercise.css">
</head>
<body>
    <header>
        <h1>PianoLearn - Exercices</h1>
        <nav>
            <a href="index.html">Accueil</a>
            <select id="language-selector">
                <option value="fr">Français</option>
                <option value="en">English</option>
            </select>
        </nav>
    </header>

    <main>
        <div class="exercise-selector-container">
            <label for="exercise-selector">Choisir un exercice:</label>
            <select id="exercise-selector">
                <option value="">Chargement...</option>
            </select>
        </div>

        <div id="exercise-container">
            <!-- Le lecteur d'exercices sera généré ici -->
        </div>
    </main>

    <!-- Scripts -->
    <script src="./js/audio-engine.js"></script>
    <script src="./js/midi-handler.js"></script>
    <script src="./js/exercise-manager.js"></script>
    <script src="./js/language-manager.js"></script>
    <script src="./js/exercise-player.js"></script>
    <script src="./js/app.js"></script>
    <script src="./js/main.js"></script>
</body>
</html>
*/
