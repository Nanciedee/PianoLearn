class ExerciseManager {
    constructor() {
        this.currentExercise = null;
    }

    async loadExercise(name, language = 'fr') {
        try {
            const res = await fetch(`data/exercises/${name}.json`);
            const data = await res.json();
            this.currentExercise = data;
            this.displayExercise(data, language);
        } catch (error) {
            console.error("Erreur lors du chargement de l'exercice :", error);
        }
    }

    displayExercise(exercise, lang) {
        const container = document.getElementById("exercise-container");
        if (!container) return;

        container.innerHTML = `
            <h2>${exercise.title[lang]}</h2>
            <p><strong>Compositeur :</strong> ${exercise.composer}</p>
            <p><strong>Durée :</strong> ${exercise.duration}</p>
            <p><strong>Tempo recommandé :</strong> ${exercise.tempo.recommended} ${exercise.tempo.unit}</p>
            <p><strong>Description :</strong> ${exercise.description[lang]}</p>
            <h3>Objectifs</h3>
            <ul>${exercise.objectives[lang].map(obj => `<li>${obj}</li>`).join("")}</ul>
            <h3>Instructions</h3>
            <ul>${exercise.instructions[lang].map(ins => `<li>${ins}</li>`).join("")}</ul>
            <h3>Audio</h3>
            <audio controls src="assets/audio/${exercise.audioFiles.slow}"></audio>
            <audio controls src="assets/audio/${exercise.audioFiles.medium}"></audio>
            <audio controls src="assets/audio/${exercise.audioFiles.fast}"></audio>
            <h3>Partition</h3>
            <a href="assets/pdf/${exercise.sheetMusic.pdf}" target="_blank">Voir la partition (PDF)</a>
        `;
    }
}
