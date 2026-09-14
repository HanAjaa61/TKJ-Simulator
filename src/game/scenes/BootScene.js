import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this.add.text(50, 50, 'Scene Phaser jalan!', { fontSize: '24px', color: '#ffffff' });
  }
}