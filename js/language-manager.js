class LanguageManager {
    constructor() {
        this.translations = {};
    }

    async loadTranslations() {
        // Exemple de traduction simple
        this.translations = {
            fr: {
                welcome: "Bienvenue sur PianoLearn",
                start: "Commencer"
            },
            en: {
                welcome: "Welcome to PianoLearn",
                start: "Start"
            }
        };
    }

    getTranslation(key, lang = 'fr') {
        return this.translations[lang]?.[key] || key;
    }
}
