/**
 * AudioManager - handles sound effects and background music.
 * Currently a stub that will be populated when audio assets are added.
 * Phaser's built-in sound manager is used under the hood.
 */
export class AudioManager {
  private scene: Phaser.Scene;
  private musicPlaying: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  playMusic(_key: string): void {
    // Will be implemented when music assets are added
    // Example: this.scene.sound.play(key, { loop: true, volume: 0.5 });
    this.musicPlaying = true;
  }

  stopMusic(): void {
    this.scene.sound.stopAll();
    this.musicPlaying = false;
  }

  playSFX(_key: string): void {
    // Will be implemented when SFX assets are added
    // Example: this.scene.sound.play(key, { volume: 0.7 });
  }

  isMusicPlaying(): boolean {
    return this.musicPlaying;
  }
}
