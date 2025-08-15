class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.sounds = new Map();
        this.exerciseAudioUrl = './assets/audio/exercises/';
        this.init();
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Audio context not supported');
        }
    }

    async playNote(note, fingering = null) {
        // Jouer le son de la note
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        if (this.audioContext) {
            const frequency = this.getNoteFrequency(note);
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'triangle';
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.8);
        }

        // Notifier l'interface pour l'affichage visuel
        this.onNotePlay?.(note, fingering);
    }

    getNoteFrequency(note) {
        const notes = {
            'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
            'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
            'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
        };
        
        const noteName = note.slice(0, -1);
        const octave = parseInt(note.slice(-1));
        const baseFreq = notes[noteName];
        
        return baseFreq * Math.pow(2, octave - 4);
    }

    async playExerciseAudio(exerciseId, speed = 'medium') {
        const audioUrl = `${this.exerciseAudioUrl}${exerciseId}-${speed}.mp3`;
        
        try {
            const audio = new Audio(audioUrl);
            await audio.play();
        } catch (error) {
            console.warn(`Fichier audio non trouvé: ${audioUrl}`);
            alert(`Fichier audio non disponible: ${exerciseId}-${speed}.mp3\n\nVeuillez l'ajouter dans assets/audio/exercises/`);
        }
    }

    // Callback pour l'interface
    onNotePlay = null;
}

// Export pour utilisation globale
window.AudioEngine = AudioEngine;
