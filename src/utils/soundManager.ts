import { Audio } from 'expo-av';

export type SoundType = 'click' | 'win' | 'draw' | 'error' | 'remove' | 'button' | 'lose';

class SoundManager {
  private sounds: Map<SoundType, Audio.Sound> = new Map();
  private isLoaded: boolean = false;

  async initialize() {
    if (this.isLoaded) return;

    try {
      // Set audio mode for the app
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Load actual sound files from assets
      await this.preloadActualSounds();
      this.isLoaded = true;
    } catch (error) {
      console.warn('Failed to initialize sound manager:', error);
    }
  }

  private async preloadActualSounds() {
    try {
      // Load WIN sound
      const { sound: winSound } = await Audio.Sound.createAsync(
        require('../../assets/TicTacMasterXO WIN.wav')
      );
      this.sounds.set('win', winSound);

      // Load DRAW sound  
      const { sound: drawSound } = await Audio.Sound.createAsync(
        require('../../assets/TicTacMasterXO DRAW.wav')
      );
      this.sounds.set('draw', drawSound);

      // Load LOSE sound
      const { sound: loseSound } = await Audio.Sound.createAsync(
        require('../../assets/TicTacMasterXO LOSE.wav')
      );
      this.sounds.set('lose', loseSound);
      this.sounds.set('error', loseSound); // Also use for errors

      console.log('🔊 Sound files loaded successfully');
    } catch (error) {
      console.warn('Failed to preload sound files:', error);
    }
  }

  async playSound(type: SoundType, volume: number = 1.0) {
    if (!this.isLoaded) {
      await this.initialize();
    }

    try {
      const sound = this.sounds.get(type);
      if (sound) {
        // Stop any currently playing instance
        await sound.stopAsync();
        await sound.setPositionAsync(0);
        await sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
        await sound.playAsync();
        console.log(`🔊 Playing ${type} sound`);
      } else {
        // Fallback to simulated sound for types without loaded files
        this.simulateSoundFeedback(type);
      }
    } catch (error) {
      console.warn(`Failed to play ${type} sound:`, error);
      // Fallback to simulation
      this.simulateSoundFeedback(type);
    }
  }

  private simulateSoundFeedback(type: SoundType) {
    // This is a placeholder for actual sound implementation
    // In a real app, you would play actual sound files here
    
    switch (type) {
      case 'click':
        // Light click sound
        console.log('🔊 Click sound');
        break;
      case 'win':
        // Victory fanfare
        console.log('🔊 Win sound');
        break;
      case 'draw':
        // Neutral tone
        console.log('🔊 Draw sound');
        break;
      case 'error':
        // Error buzz
        console.log('🔊 Error sound');
        break;
      case 'remove':
        // Piece removal sound
        console.log('🔊 Remove sound');
        break;
      case 'button':
        // UI button sound
        console.log('🔊 Button sound');
        break;
      case 'lose':
        // Loss/defeat sound
        console.log('🔊 Lose sound');
        break;
    }
  }

  async stopAllSounds() {
    try {
      for (const [type, sound] of this.sounds.entries()) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }
      this.sounds.clear();
    } catch (error) {
      console.warn('Failed to stop sounds:', error);
    }
  }

  async setVolume(volume: number) {
    try {
      // Set global volume for all sounds
      for (const [type, sound] of this.sounds.entries()) {
        await sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
      }
    } catch (error) {
      console.warn('Failed to set volume:', error);
    }
  }

  // Create and play a simple tone (fallback method)
  private async createSimpleTone(frequency: number, duration: number = 200, volume: number = 0.3) {
    try {
      // This is a simplified implementation
      // In a real app, you would use actual sound files or a tone generator library
      console.log(`🎵 Playing tone: ${frequency}Hz for ${duration}ms at volume ${volume}`);
      
      // You could implement this using a library like 'react-native-tone'
      // or pre-recorded tone files
      
    } catch (error) {
      console.warn('Failed to create tone:', error);
    }
  }

  // Method to create different tones for different game events
  async playGameTone(type: SoundType) {
    switch (type) {
      case 'click':
        await this.createSimpleTone(800, 100, 0.2);
        break;
      case 'win':
        // Play a sequence of ascending tones
        await this.createSimpleTone(523, 150, 0.3); // C5
        setTimeout(() => this.createSimpleTone(659, 150, 0.3), 150); // E5
        setTimeout(() => this.createSimpleTone(784, 300, 0.4), 300); // G5
        break;
      case 'draw':
        await this.createSimpleTone(440, 500, 0.2);
        break;
      case 'error':
        await this.createSimpleTone(200, 200, 0.3);
        break;
      case 'remove':
        await this.createSimpleTone(600, 150, 0.2);
        break;
      case 'button':
        await this.createSimpleTone(1000, 80, 0.15);
        break;
      case 'lose':
        await this.createSimpleTone(200, 1000, 0.4);
        break;
    }
  }

  dispose() {
    this.stopAllSounds();
    this.isLoaded = false;
  }
}

// Create and export a singleton instance
export const soundManager = new SoundManager();

// Sound configuration for different game events
export const SOUND_CONFIG = {
  click: {
    volume: 0.6,
    frequency: 800,
    duration: 100,
  },
  win: {
    volume: 0.8,
    frequency: [523, 659, 784], // C5, E5, G5 chord
    duration: 500,
  },
  draw: {
    volume: 0.5,
    frequency: 440,
    duration: 400,
  },
  error: {
    volume: 0.7,
    frequency: 200,
    duration: 200,
  },
  remove: {
    volume: 0.4,
    frequency: 600,
    duration: 150,
  },
  button: {
    volume: 0.3,
    frequency: 1000,
    duration: 80,
  },
  lose: {
    volume: 0.6,
    frequency: 200,
    duration: 1000,
  },
};

// Enhanced sound utilities
export class SoundUtils {
  static async preloadSounds() {
    await soundManager.initialize();
  }

  static async playFeedback(type: SoundType, enabled: boolean = true) {
    if (!enabled) return;
    
    try {
      // First try to play the actual sound file
      await soundManager.playSound(type);
    } catch (error) {
      console.warn(`Failed to play ${type} feedback:`, error);
      // Fallback to tone generation
      try {
        await soundManager.playGameTone(type);
      } catch (fallbackError) {
        console.warn(`Failed to play ${type} tone fallback:`, fallbackError);
      }
    }
  }

  static async playVictorySequence() {
    try {
      // Play a victory sequence
      const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
      for (let i = 0; i < notes.length; i++) {
        setTimeout(async () => {
          await soundManager.playGameTone('win');
        }, i * 150);
      }
    } catch (error) {
      console.warn('Failed to play victory sequence:', error);
    }
  }

  static async cleanup() {
    await soundManager.dispose();
  }
}
