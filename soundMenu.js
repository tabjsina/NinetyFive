// soundMenu.js
class SoundSettings {
    static STORAGE_KEY = 'soundSettings';
    static DEFAULT_SETTINGS = {
        firstTap: true,
        interval19: true,
        finalTap: true
    };

    static loadSettings() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored ? JSON.parse(stored) : this.DEFAULT_SETTINGS;
    }

    static saveSettings(settings) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const settingsButton = document.getElementById('settingsButton');
    const soundMenu = document.getElementById('soundMenu');

    const firstTapButton = document.getElementById('soundFirstTap');
    const interval19Button = document.getElementById('sound19Interval');
    const finalTapButton = document.getElementById('soundFinalTap');

    // Load initial settings
    let settings = SoundSettings.loadSettings();
    
    // Initialize button states
    function updateButtonStates() {
        firstTapButton.classList.toggle('disabled', !settings.firstTap);
        interval19Button.classList.toggle('disabled', !settings.interval19);
        finalTapButton.classList.toggle('disabled', !settings.finalTap);
    }
    updateButtonStates();

    // Handle clicks outside the menu to close it
    document.addEventListener('click', (event) => {
        if (!soundMenu.contains(event.target)) {
            soundMenu.classList.remove('visible');
        }
    });

    // Toggle menu when settings button is clicked
    settingsButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the document click from immediately closing the menu
        soundMenu.classList.toggle('visible');
    });

    // Sound toggle handlers
    firstTapButton.addEventListener('click', () => {
        settings.firstTap = !settings.firstTap;
        SoundSettings.saveSettings(settings);
        updateButtonStates();
    });

    interval19Button.addEventListener('click', () => {
        settings.interval19 = !settings.interval19;
        SoundSettings.saveSettings(settings);
        updateButtonStates();
    });

    finalTapButton.addEventListener('click', () => {
        settings.finalTap = !settings.finalTap;
        SoundSettings.saveSettings(settings);
        updateButtonStates();
    });
});
