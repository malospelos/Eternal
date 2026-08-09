import Phaser from 'phaser';
import './style.css';

class KingdomScene extends Phaser.Scene {
  constructor() {
    super('KingdomScene');
  }

  create(): void {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#6e934f');

    this.add.text(width / 2, height * 0.15, 'ETERNAL CROWN', {
      fontFamily: 'Georgia, serif',
      fontSize: '32px',
      color: '#fff4d0',
      stroke: '#332719',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.46, '🏰', {
      fontSize: '112px'
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.65, 'Tu reino comienza aquí', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      color: '#ffffff',
      stroke: '#26351f',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.74, '🎯 Próximo objetivo: construir una granja', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 14, y: 10 }
    }).setOrigin(0.5);
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#6e934f',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [KingdomScene]
};

new Phaser.Game(config);
