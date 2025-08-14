/**
 * PianoLearn - Gestionnaire MIDI
 * Gestion des connexions et messages MIDI
 */

class MIDIHandler {
    constructor() {
        this.midiAccess = null;
        this.inputs = [];
        this.isConnected = false;
        
        // Callbacks
        this.onNoteOn = null;
        this.onNoteOff = null;
        this.onConnectionChange = null;
        
        // Mapping des notes MIDI vers noms
        this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    }

    async connect() {
        console.log('🎹 Tentative de connexion MIDI...');
        
        if (!navigator.requestMIDIAccess) {
            console.warn('❌ Web MIDI API non supportée par ce navigateur');
            return false;
        }

        try {
            this.midiAccess = await navigator.requestMIDIAccess();
            
            // Gérer les changements de connexion
            this.midiAccess.onstatechange = (event) => {
                this.handleStateChange(event);
            };
            
            // Configurer les entrées existantes
            this.setupInputs();
            
            return this.inputs.length > 0;
            
        } catch (error) {
            console.error('❌ Erreur lors de la connexion MIDI:', error);
            return false;
        }
    }

    setupInputs() {
        this.inputs = [];
        
        for (let input of this.midiAccess.inputs.values()) {
            console.log(`🎵 Périphérique MIDI détecté: ${input.name}`);
            
            input.onmidimessage = (message) => {
                this.handleMIDIMessage(message);
            };
            
            this.inputs.push({
                id: input.id,
                name: input.name,
                input: input
            });
        }
        
        this.isConnected = this.inputs.length > 0;
        
        if (this.isConnected) {
            console.log(`✅ ${this.inputs.length} périphérique(s) MIDI connecté(s)`);
        } else {
            console.log('⚠️ Aucun périphérique MIDI trouvé');
        }
        
        // Notifier du changement de statut
        if (this.onConnectionChange) {
            this.onConnectionChange(this.isConnected, this.inputs);
        }
    }

    handleStateChange(event) {
        console.log(`🔄 Changement d'état MIDI: ${event.port.name} - ${event.port.state}`);
        
        // Reconfigurer les entrées
        setTimeout(() => {
            this.setupInputs();
        }, 100);
    }

    handleMIDIMessage(message) {
        const [command, note, velocity] = message.data;
        const channel = command & 0x0f;
        const messageType = command & 0xf0;
        
        // Note ON (avec vélocité > 0)
        if (messageType === 0x90 && velocity > 0) {
            const noteName = this.midiNoteToName(note);
            
            console.log(`🎵 Note ON: ${noteName} (${note}) - Vélocité: ${velocity}`);
            
            if (this.onNoteOn) {
                this.onNoteOn(noteName, velocity, note);
            }
        }
        
        // Note OFF (ou Note ON avec vélocité 0)
        else if (messageType === 0x80 || (messageType === 0x90 && velocity === 0)) {
            const noteName = this.midiNoteToName(note);
            
            console.log(`🎵 Note OFF: ${noteName} (${note})`);
            
            if (this.onNoteOff) {
                this.onNoteOff(noteName, note);
            }
        }
        
        // Control Change
        else if (messageType === 0xb0) {
            console.log(`🎛️ Control Change - CC: ${note}, Valeur: ${velocity}`);
        }
        
        // Program Change
        else if (messageType === 0xc0) {
            console.log(`🎼 Program Change: ${note}`);
        }
    }

    midiNoteToName(midiNote) {
        const noteIndex = midiNote % 12;
        return this.noteNames[noteIndex];
    }

    getConnectedDevices() {
        return this.inputs.map(input => ({
            id: input.id,
            name: input.name,
            manufacturer: input.input.manufacturer || 'Inconnu'
        }));
    }

    disconnect() {
        if (this.midiAccess) {
            for (let input of this.midiAccess.inputs.values()) {
                input.onmidimessage = null;
            }
        }
        
        this.inputs = [];
        this.isConnected = false;
        this.midiAccess = null;
        
        console.log('🔌 Déconnexion MIDI');
        
        if (this.onConnectionChange) {
            this.onConnectionChange(false, []);
        }
    }

    // Envoyer des messages MIDI (pour les claviers avec retour tactile)
    sendNoteOn(note, velocity = 64, channel = 0) {
        if (!this.isConnected) return;
        
        const midiNote = this.nameToMidiNote(note);
        if (midiNote === null) return;
        
        const message = [0x90 + channel, midiNote, velocity];
        
        for (let input of this.inputs) {
            if (input.input.send) {
                try {
                    input.input.send(message);
                } catch (error) {
                    console.warn('Impossible d\'envoyer le message MIDI:', error);
                }
            }
        }
    }

    sendNoteOff(note, channel = 0) {
        if (!this.isConnected) return;
        
        const midiNote = this.nameToMidiNote(note);
        if (midiNote === null) return;
        
        const message = [0x80 + channel, midiNote, 0];
        
        for (let input of this.inputs) {
            if (input.input.send) {
                try {
                    input.input.send(message);
                } catch (error) {
                    console.warn('Impossible d\'envoyer le message MIDI:', error);
                }
            }
        }
    }

    nameToMidiNote(noteName, octave = 4) {
        const noteIndex = this.noteNames.indexOf(noteName);
        if (noteIndex === -1) return null;
        
        return (octave + 1) * 12 + noteIndex;
    }

    // Utilitaires pour les tests
    testConnection() {
        console.log('🧪 Test de connexion MIDI...');
        console.log(`Statut: ${this.isConnected ? 'Connecté' : 'Déconnecté'}`);
        console.log(`Périphériques: ${this.inputs.length}`);
        
        this.inputs.forEach((input, index) => {
            console.log(`  ${index + 1}. ${input.name} (ID: ${input.id})`);
        });
        
        return {
            connected: this.isConnected,
            deviceCount: this.inputs.length,
            devices: this.getConnectedDevices()
        };
    }

    // Monitoring des performances
    startPerformanceMonitoring() {
        this.messageCount = 0;
        this.lastMessageTime = 0;
        this.averageLatency = 0;
        
        console.log('📊 Monitoring MIDI démarré');
    }

    stopPerformanceMonitoring() {
        if (this.messageCount > 0) {
            console.log(`📊 Statistiques MIDI:
                Messages reçus: ${this.messageCount}
                Latence moyenne: ${this.averageLatency.toFixed(2)}ms`);
        }
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MIDIHandler;
} else {
    window.MIDIHandler = MIDIHandler;
}
