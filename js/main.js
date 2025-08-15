// main.js

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 PianoLearn démarre...");

    // Initialisation des modules
    const audioEngine = new AudioEngine();
    await audioEngine.init();

    const midiHandler = new MIDIHandler();
    midiHandler.init();

    const exerciseManager = new ExerciseManager();
    const languageManager = new LanguageManager("fr"); // ou "en"

    const app = new PianoLearnApp({
        audioEngine,
        midiHandler,
        exerciseManager,
        languageManager
    });

    app.start();
});
