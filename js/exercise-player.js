class ExercisePlayer {
    constructor() {
        this.currentExercise = null;
        this.isPlaying = false;
        this.currentTempo = 72;
        this.currentNoteIndex = 0;
        this.currentMeasure = 0;
        this.playMode = 'both'; // 'both', 'right', 'left'
        this.metronomeInterval = null;
        this.exerciseInterval = null;
        this.audioEngine = null;

        // Callbacks pour l'interface
        this.onStateChange = null;
        this.onProgress = null;
        this.onMetronomeBeat = null;
        this.onPlayModeChange = null;
    }

    async loadExercise(exerciseId) {
        try {
            const response = await fetch(`./data/exercises/${exerciseId}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.currentExercise = await response.json();
            return this.currentExercise;
        } catch (error) {
            console.error('❌ Erreur lors du chargement de l\'exercice:', error);
            return null;
        }
    }

    setAudioEngine(audioEngine) {
        this.audioEngine = audioEngine;
    }

    startExercise() {
        if (this.isPlaying || !this.currentExercise) return;

        this.isPlaying = true;
        this.currentNoteIndex = 0;
        this.currentMeasure = 0;

        this.startMetronome();
        this.playExercise();

        this.onStateChange?.('playing');
    }

    stopExercise() {
        this.isPlaying = false;
        this.currentNoteIndex = 0;
        this.currentMeasure = 0;

        clearInterval(this.metronomeInterval);
        clearInterval(this.exerciseInterval);

        this.onStateChange?.('stopped');
    }

    startMetronome() {
        const beatInterval = 60000 / this.currentTempo;

        this.metronomeInterval = setInterval(() => {
            this.onMetronomeBeat?.();
        }, beatInterval);
    }

    playExercise() {
        const noteInterval = (60 / this.currentTempo) * 500; // demi-temps en ms

        this.exerciseInterval = setInterval(() => {
            if (!this.isPlaying || !this.currentExercise) return;

            const totalMeasures = this.currentExercise.rightHand.measures.length;
            const notesPerMeasure = 8;

            if (this.currentMeasure >= totalMeasures) {
                this.stopExercise();
                return;
            }

            const measure = this.currentMeasure;
            const noteInMeasure = this.currentNoteIndex % notesPerMeasure;

            // Jouer main droite
            if (this.playMode === 'both' || this.playMode === 'right') {
                const rightNote = this.currentExercise.rightHand.measures[measure].notes[noteInMeasure];
                const rightFingering = this.currentExercise.rightHand.measures[measure].fingering[noteInMeasure];
                if (rightNote && this.audioEngine) {
                    this.audioEngine.playNote(rightNote, rightFingering);
                }
            }

            // Jouer main gauche
            if (this.playMode === 'both' || this.playMode === 'left') {
                const leftNote = this.currentExercise.leftHand.measures[measure].notes[noteInMeasure];
                const leftFingering = this.currentExercise.leftHand.measures[measure].fingering[noteInMeasure];
                if (leftNote && this.audioEngine) {
                    this.audioEngine.playNote(leftNote, leftFingering);
                }
            }

            // Mise à jour de la progression
            const totalNotes = totalMeasures * notesPerMeasure;
            const currentNote = measure * notesPerMeasure + noteInMeasure + 1;
            const progress = (currentNote / totalNotes) * 100;

            this.onProgress?.(progress, measure + 1, noteInMeasure + 1);

            // Avancer
            this.currentNoteIndex++;
            if (this.currentNoteIndex >= notesPerMeasure) {
                this.currentNoteIndex = 0;
                this.currentMeasure++;
            }

        }, noteInterval);
    }

    setTempo(tempo) {
        this.currentTempo = tempo;
        if (this.isPlaying) {
            this.stopExercise();
            setTimeout(() => this.startExercise(), 100);
        }
    }

    setPlayMode(mode) {
        this.playMode = mode;
        this.onPlayModeChange?.(mode);
    }
}

// ✅ Export global pour utilisation dans l'interface
window.ExercisePlayer = ExercisePlayer;
