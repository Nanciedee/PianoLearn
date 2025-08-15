// js/audio-engine.js - Mise à jour pour supporter les exercices Hanon
class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.loadedAudio = new Map();
        this.isInitialized = false;
        this.currentSources = new Set(); // Pour pouvoir arrêter les sons en cours
    }

    async init() {
        if (this.isInitialized) return;

        try {
            // Créer le contexte audio
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Créer le gain principal
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.7; // Volume principal

            this.isInitialized = true;
            console.log('AudioEngine initialisé avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de l\'AudioEngine:', error);
            throw error;
        }
    }

    async ensureInitialized() {
        if (!this.isInitialized) {
            await this.init();
        }
        
        // Reprendre le contexte s'il est suspendu (requis par les navigateurs modernes)
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    // Jouer une tonalité synthétisée (pour les exercices)
    async playTone(frequency, duration = 0.5, dynamics = 'mf', waveform = 'sine') {
        await this.ensureInitialized();

        // Créer l'oscillateur
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Connecter les nœuds
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // Configurer l'oscillateur
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = waveform;
        
        // Configurer le volume selon la dynamique
        const volume = this.getDynamicsVolume(dynamics);
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        // Démarrer et arrêter l'oscillateur
        const startTime = this.audioContext.currentTime;
        const stopTime = startTime + duration;
        
        oscillator.start(startTime);
        oscillator.stop(stopTime);
        
        // Nettoyer les références
        this.currentSources.add(oscillator);
        oscillator.onended = () => {
            this.currentSources.delete(oscillator);
        };
        
        return oscillator;
    }

    // Jouer plusieurs notes simultanément (accords)
    async playChord(frequencies, duration = 0.5, dynamics = 'mf') {
        await this.ensureInitialized();
        
        const promises = frequencies.map(freq => 
            this.playTone(freq, duration, dynamics)
        );
        
        return Promise.all(promises);
    }

    // Jouer une séquence de notes
    async playSequence(notes, tempo = 72) {
        await this.ensureInitialized();
        
        const beatDuration = 60 / tempo;
        const promises = [];
        
        notes.forEach((note, index) => {
            const delay = index * beatDuration * 1000; // en millisecondes
            
            promises.push(
                new Promise(resolve => {
                    setTimeout(async () => {
                        if (typeof note === 'object') {
                            // Note avec configuration avancée
                            await this.playTone(
                                note.frequency, 
                                note.duration || 0.5, 
                                note.dynamics || 'mf'
                            );
                        } else {
                            // Simple fréquence
                            await this.playTone(note);
                        }
                        resolve();
                    }, delay);
                })
            );
        });
        
        return Promise.all(promises);
    }

    // Charger un fichier audio
    async loadAudio(url, id = null) {
        await this.ensureInitialized();
        
        const audioId = id || url;
        
        if (this.loadedAudio.has(audioId)) {
            return this.loadedAudio.get(audioId);
        }

        try {
            console.log(`Chargement du fichier audio: ${url}`);
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            this.loadedAudio.set(audioId, audioBuffer);
            console.log(`Fichier audio chargé: ${audioId}`);
            
            return audioBuffer;
        } catch (error) {
            console.error(`Erreur lors du chargement de ${url}:`, error);
            throw error;
        }
    }

    // Jouer un fichier audio chargé
    async play(audioId, volume = 1.0, playbackRate = 1.0) {
        await this.ensureInitialized();
        
        const audioBuffer = this.loadedAudio.get(audioId);
        if (!audioBuffer) {
            throw new Error(`Fichier audio non trouvé: ${audioId}`);
        }

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = audioBuffer;
        source.playbackRate.value = playbackRate;
        
        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        gainNode.gain.value = volume;
        
        source.start(0);
        
        // Nettoyer les références
        this.currentSources.add(source);
        source.onended = () => {
            this.currentSources.delete(source);
        };
        
        return source;
    }

    // Arrêter tous les sons en cours
    stopAll() {
        this.currentSources.forEach(source => {
            try {
                source.stop();
            } catch (error) {
                // La source était peut-être déjà arrêtée
                console.warn('Impossible d\'arrêter la source audio:', error);
            }
        });
        this.currentSources.clear();
    }

    // Définir le volume principal
    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(
                Math.max(0, Math.min(1, volume)), 
                this.audioContext.currentTime
            );
        }
    }

    // Convertir les dynamiques musicales en volume
    getDynamicsVolume(dynamics) {
        const dynamicsMap = {
            'ppp': 0.1,   // pianissimo
            'pp': 0.2,    // piano
            'p': 0.3,     // piano
            'mp': 0.45,   // mezzo-piano
            'mf': 0.6,    // mezzo-forte
            'f': 0.75,    // forte
            'ff': 0.9,    // fortissimo
            'fff': 1.0    // fortississimo
        };
        
        return dynamicsMap[dynamics] || 0.6; // défaut mf
    }

    // Créer un métronome
    createMetronome(tempo = 60) {
        return new Metronome(this, tempo);
    }

    // Obtenir les informations sur l'état
    getState() {
        return {
            isInitialized: this.isInitialized,
            contextState: this.audioContext?.state,
            activeSources: this.currentSources.size,
            loadedAudio: Array.from(this.loadedAudio.keys())
        };
    }

    // Nettoyer les ressources
    dispose() {
        this.stopAll();
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        this.loadedAudio.clear();
        this.isInitialized = false;
    }
}

// Classe Métronome pour accompagner les exercices
class Metronome {
    constructor(audioEngine, tempo = 60) {
        this.audioEngine = audioEngine;
        this.tempo = tempo;
        this.isRunning = false;
        this.intervalId = null;
        this.beatCount = 0;
        this.beatsPerMeasure = 4;
        
        // Fréquences pour les différents beats
        this.strongBeatFreq = 800;  // Premier temps de la mesure
        this.weakBeatFreq = 600;    // Autres temps
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.beatCount = 0;
        
        const beatInterval = (60 / this.tempo) * 1000; // en millisecondes
        
        this.intervalId = setInterval(() => {
            this.playBeat();
        }, beatInterval);
        
        // Jouer le premier beat immédiatement
        this.playBeat();
    }

    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.beatCount = 0;
    }

    playBeat() {
        const isStrongBeat = this.beatCount % this.beatsPerMeasure === 0;
        const frequency = isStrongBeat ? this.strongBeatFreq : this.weakBeatFreq;
        const duration = 0.1;
        const dynamics = isStrongBeat ? 'f' : 'mf';
        
        this.audioEngine.playTone(frequency, duration, dynamics, 'square');
        this.beatCount++;
    }

    setTempo(tempo) {
        const wasRunning = this.isRunning;
        
        if (wasRunning) {
            this.stop();
        }
        
        this.tempo = tempo;
        
        if (wasRunning) {
            this.start();
        }
    }

    setTimeSignature(beatsPerMeasure) {
        this.beatsPerMeasure = beatsPerMeasure;
        this.beatCount = 0;
    }

    getTempo() {
        return this.tempo;
    }

    isPlaying() {
        return this.isRunning;
    }
}

// Export pour les modules ES6 (si utilisés)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioEngine, Metronome };
}
