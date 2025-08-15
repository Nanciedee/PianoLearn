/**
 * PianoLearn - Application principale
 * Gestion de l'interface utilisateur et coordination des modules
 */

// === MODULES INTERNES ===

class AudioEngine {
    constructor() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
    }

    async init() {
        console.log("🔊 AudioEngine initialisé");
    }
}

class MIDIHandler {
    constructor() {
        this.onNoteOn = null;
    }
}

class ExerciseManager {
    constructor() {
        this.currentExercise = null;
    }

    loadExercise(name, lang) {
        console.log(`📘 Chargement de l'exercice: ${name} (${lang})`);
        const container = document.getElementById("exercise-container");
        if (container) {
            container.innerHTML = `<h2>Exercice: ${name}</h2><p>Langue: ${lang}</p>`;
        }
    }
}

class LanguageManager {
    constructor() {
        this.translations = {};
    }

    async loadTranslations() {
        this.translations = {
            fr: { welcome: "Bienvenue" },
            en: { welcome: "Welcome" }
        };
    }

    getTranslation(key, lang = 'fr') {
        return this.translations[lang]?.[key] || key;
    }
}

class PianoLearnApp {
    constructor() {
        // État de l'application
        this.currentLanguage = 'fr';
        this.currentLevel = 'debutant';
        this.testAnswers = {};
        this.gameScore = 0;
        
        // Modules
        this.midiHandler = null;
        this.audioEngine = null;
        this.exerciseManager = null;
        this.languageManager = null;
        
        // Initialisation
        this.init();
    }

    async init() {
        console.log('🎹 Initialisation de PianoLearn...');
        
        try {
            // Initialiser les modules
            await this.initializeModules();
            
            // Configurer les événements
            this.setupEventListeners();
            
            // Créer les claviers
            this.createAllKeyboards();
            
            // Mettre à jour la langue
            this.updateLanguage();

            this.loadExercise("hanon-01");
            
            console.log('✅ PianoLearn initialisé avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.showError('Erreur d\'initialisation de l\'application');
        }
    }

    async initializeModules() {
        // Initialiser le gestionnaire audio
        this.audioEngine = new AudioEngine();
        await this.audioEngine.init();
        
        // Initialiser le gestionnaire MIDI
        this.midiHandler = new MIDIHandler();
        this.midiHandler.onNoteOn = (note) => this.handleMIDINote(note);
        
        // Initialiser le gestionnaire d'exercices
        this.exerciseManager = new ExerciseManager();
        
        // Initialiser le gestionnaire de langue
        this.languageManager = new LanguageManager();
        await this.languageManager.loadTranslations();
    }

    setupEventListeners() {
        // Événement de clic pour réactiver l'audio
        document.addEventListener('click', () => {
            if (this.audioEngine && this.audioEngine.context.state === 'suspended') {
                this.audioEngine.context.resume();
            }
        });

        // Gestion du redimensionnement
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Gestion des raccourcis clavier
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcuts(event);
        });
    }

    createAllKeyboards() {
        const keyboardIds = ['testKeyboard', 'exerciseKeyboard', 'gameKeyboard', 'solfegeKeyboard'];
        keyboardIds.forEach(id => {
            this.createPianoKeyboard(id);
        });
    }

    // === GESTION DE LA LANGUE ===
    switchLanguage(lang) {
        this.currentLanguage = lang;
        
        // Mettre à jour les boutons de langue
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        this.updateLanguage();
        this.createAllKeyboards();
        
        // Sauvegarder la préférence
        localStorage.setItem('pianolearn-language', lang);
        
        console.log(`🌍 Langue changée vers: ${lang}`);
    }

  updateLanguage() {
    if (!this.languageManager) return;

    document.querySelectorAll('[data-fr]').forEach(element => {
        const text = this.currentLanguage === 'fr' 
            ? element.getAttribute('data-fr') 
            : element.getAttribute('data-en');

        if (text) {
            if (element.tagName === 'INPUT' || element.tagName === 'BUTTON') {
                element.textContent = text;
            } else {
                element.textContent = text;
            }
        }
    });

    // Textes spéciaux
    const findNoteText = document.getElementById('findNoteText');
    if (findNoteText) {
        findNoteText.textContent = this.currentLanguage === 'fr' 
            ? 'Cliquez sur la note DO' 
            : 'Click on the note C';
    }
}

loadExercise(name) {
    if (this.exerciseManager) {
        this.exerciseManager.loadExercise(name, this.currentLanguage);
    }
}

    // === GESTION DU CLAVIER PIANO ===
    createPianoKeyboard(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        const keyboardContainer = document.createElement('div');
        keyboardContainer.className = 'keyboard-container';
        
        const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        const blackKeyPositions = {
            'C#': 0.75, 'D#': 1.75, 'F#': 3.75, 'G#': 4.75, 'A#': 5.75
        };
        
        // Créer les touches blanches
        whiteKeys.forEach((note, index) => {
            const key = this.createKey(note, 'white-key');
            keyboardContainer.appendChild(key);
        });
        
        // Créer les touches noires
        Object.entries(blackKeyPositions).forEach(([note, position]) => {
            const key = this.createKey(note, 'black-key');
            key.style.left = `${position * 48 - 16}px`;
            keyboardContainer.appendChild(key);
        });
        
        container.appendChild(keyboardContainer);
    }

    createKey(note, className) {
        const key = document.createElement('button');
        key.className = `key ${className}`;
        key.dataset.note = note;
        key.textContent = this.getNoteDisplayName(note);
        key.setAttribute('aria-label', `Note ${this.getNoteDisplayName(note)}`);
        
        key.onclick = () => this.playNote(note, key);
        
        // Support tactile
        key.ontouchstart = (e) => {
            e.preventDefault();
            this.playNote(note, key);
        };
        
        return key;
    }

    getNoteDisplayName(note) {
        const noteNames = {
            fr: {
                'C': 'Do', 'C#': 'Do#', 'D': 'Ré', 'D#': 'Ré#', 'E': 'Mi',
                'F': 'Fa', 'F#': 'Fa#', 'G': 'Sol', 'G#': 'Sol#', 'A': 'La', 'A#': 'La#', 'B': 'Si'
            },
            en: {
                'C': 'C', 'C#': 'C#', 'D': 'D', 'D#': 'D#', 'E': 'E',
                'F': 'F', 'F#': 'F#', 'G': 'G', 'G#': 'G#', 'A': 'A', 'A#': 'A#', 'B': 'B'
            }
        };
        
        return noteNames[this.currentLanguage][note] || note;
    }

    // === GESTION AUDIO ===
    playNote(note, keyElement = null) {
        // Animation visuelle
        if (keyElement) {
            this.animateKey(keyElement);
        }
        
        // Jouer le son
        if (this.audioEngine) {
            this.audioEngine.playNote(note);
        }
        
        // Enregistrer si en cours
        if (this.exerciseManager && this.exerciseManager.isRecording) {
            this.exerciseManager.recordNote(note);
        }
        
        // Mettre à jour tous les claviers visibles
        this.highlightNoteOnAllKeyboards(note);
    }

    animateKey(keyElement) {
        keyElement.classList.add('active');
        
        // Effet particule optionnel
        if (Math.random() < 0.3) { // 30% de chance
            keyElement.classList.add('particle-effect');
            setTimeout(() => {
                keyElement.classList.remove('particle-effect');
            }, 800);
        }
        
        setTimeout(() => {
            keyElement.classList.remove('active');
        }, 200);
    }

    highlightNoteOnAllKeyboards(note) {
        const activeKeyboards = document.querySelectorAll('.section.active .piano-keyboard');
        activeKeyboards.forEach(keyboard => {
            const key = keyboard.querySelector(`[data-note="${note}"]`);
            if (key && !key.classList.contains('active')) {
                key.classList.add('active');
                setTimeout(() => key.classList.remove('active'), 200);
            }
        });
    }

    // === GESTION MIDI ===
    async connectMIDI() {
        try {
            const success = await this.midiHandler.connect();
            if (success) {
                this.updateMIDIStatus(true);
                this.showSuccess(
                    this.currentLanguage === 'fr' 
                        ? 'Clavier MIDI connecté avec succès !' 
                        : 'MIDI keyboard connected successfully!'
                );
            } else {
                throw new Error('Connection failed');
            }
        } catch (error) {
            console.error('Erreur MIDI:', error);
            this.showError(
                this.currentLanguage === 'fr' 
                    ? 'Impossible de connecter le clavier MIDI' 
                    : 'Unable to connect MIDI keyboard'
            );
        }
    }

    handleMIDINote(note) {
        this.playNote(note);
    }

    updateMIDIStatus(connected) {
        const statusElement = document.getElementById('midiStatus');
        const statusText = document.getElementById('midiStatusText');
        
        if (connected) {
            statusElement.className = 'midi-status';
            statusText.textContent = this.currentLanguage === 'fr' 
                ? '✅ Clavier MIDI connecté et fonctionnel' 
                : '✅ MIDI keyboard connected and functional';
        } else {
            statusElement.className = 'midi-status midi-disconnected';
            statusText.textContent = this.currentLanguage === 'fr' 
                ? '❌ Non connecté - Connectez un clavier MIDI pour une expérience complète' 
                : '❌ Not connected - Connect a MIDI keyboard for full experience';
        }
    }

    // === NAVIGATION ===
    showSection(sectionId) {
        // Cacher toutes les sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Enlever la classe active de tous les boutons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Afficher la section sélectionnée
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Activer le bouton correspondant
        if (event && event.target) {
            event.target.classList.add('active');
        }
        
        console.log(`📄 Section active: ${sectionId}`);
    }

    // === UTILITAIRES ===
    showError(message) {
        const toast = this.createToast(message, 'error');
        document.body.appendChild(toast);
    }

    showSuccess(message) {
        const toast = this.createToast(message, 'success');
        document.body.appendChild(toast);
    }

    createToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 9999;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            ${type === 'error' ? 'background: #dc3545;' : 'background: #28a745;'}
        `;
        
        // Animation d'entrée
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Suppression automatique
        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
        
        return toast;
    }

    handleResize() {
        // Logique pour gérer le redimensionnement
        const isMobile = window.innerWidth < 768;
        document.body.classList.toggle('mobile', isMobile);
    }

    handleKeyboardShortcuts(event) {
        // Raccourcis clavier utiles
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case '1':
                    event.preventDefault();
                    this.showSection('test');
                    break;
                case '2':
                    event.preventDefault();
                    this.showSection('lessons');
                    break;
                case '3':
                    event.preventDefault();
                    this.showSection('exercises');
                    break;
                case '4':
                    event.preventDefault();
                    this.showSection('games');
                    break;
                case '5':
                    event.preventDefault();
                    this.showSection('solfege');
                    break;
            }
        }
    }
}

// Fonctions globales pour maintenir la compatibilité avec l'HTML
let app;

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    app = new PianoLearnApp();
});

// Fonctions globales exposées pour l'HTML
window.showSection = (sectionId) => app?.showSection(sectionId);
window.switchLanguage = (lang) => app?.switchLanguage(lang);
window.connectMIDI = () => app?.connectMIDI();
window.playNote = (note, keyElement) => app?.playNote(note, keyElement);
