import Phaser from 'phaser';
import MainScene from './scenes/MainScene.js';

export const gameConfig = {
  type: Phaser.AUTO,
  parent: 'phaser-container',
  backgroundColor: '#1d1d1d',
  pixelArt: true,
  roundPixels: true,
  render: { antialias: false, roundPixels: true },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
  },
  scene: [MainScene]
};