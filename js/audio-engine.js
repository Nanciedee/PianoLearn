class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.sounds = new Map();
        this.exerciseAudioUrl = './assets/audio/exercises/';
        this.onNotePlay = null; // Callback pour l'interface
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 AudioContext initialisé');
        } catch (e) {
            console.warn('⚠️ AudioContext non supporté sur ce navigateur');
        }
    }

    async playNote(note, fingering = null) {
        if (!this.audioContext) return;

        // Reprendre le contexte si suspendu
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        const frequency = this.getNoteFrequency(note);
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'triangle';
        oscillator.frequency.value = frequency;

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.8);

        // Notifier l'interface
        if (typeof this.onNotePlay === 'function') {
            this.onNotePlay(note, fingering);
        }
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
            console.warn(`❌ Fichier audio non trouvé: ${audioUrl}`);
            alert(`Fichier audio non disponible:\n${exerciseId}-${speed}.mp3\n\nAjoutez-le dans assets/audio/exercises/`);
        }
    }
}

// ✅ Export global pour utilisation dans d'autres fichiers
window.AudioEngine = AudioEngine;
