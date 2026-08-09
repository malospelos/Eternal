import Phaser from 'phaser';
import './style.css';

type Building = {
  id: string;
  code: string;
  name: string;
  level: number;
  productionPerHour: number;
  positionX: number;
  positionY: number;
};

type Construction = {
  id: string;
  buildingCode: string;
  fromLevel: number;
  toLevel: number;
  startedAt: string;
  finishAt: string;
  remainingSeconds: number;
};

type KingdomState = {
  kingdomId: string;
  kingdomName: string;
  kingdomLevel: number;
  resources: Record<string, number>;
  buildings: Building[];
  construction: Construction | null;
  serverTime: string;
};

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');

async function loadKingdom(): Promise<KingdomState> {
  const response = await fetch(`${API_BASE}/api/kingdom`);
  if (!response.ok) throw new Error('No se pudo cargar el reino');
  return response.json();
}

async function upgradeFarm(): Promise<KingdomState> {
  const response = await fetch(`${API_BASE}/api/kingdom/farm/upgrade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId: crypto.randomUUID() })
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail ?? 'No se pudo mejorar la granja');
  }
  return response.json();
}

class KingdomScene extends Phaser.Scene {
  private state?: KingdomState;
  private status?: Phaser.GameObjects.Text;
  private resourceText?: Phaser.GameObjects.Text;
  private farmText?: Phaser.GameObjects.Text;
  private farmButton?: Phaser.GameObjects.Text;
  private timer?: Phaser.Time.TimerEvent;

  constructor() {
    super('KingdomScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#6e934f');
    this.scale.on('resize', () => this.renderScene());
    this.status = this.add.text(20, 20, 'Cargando reino...', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#00000099',
      padding: { x: 12, y: 8 }
    }).setDepth(20);

    void this.refresh();
    this.timer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => void this.refresh(false)
    });
  }

  private async refresh(showError = true): Promise<void> {
    try {
      this.state = await loadKingdom();
      this.status?.setText('');
      this.renderScene();
    } catch (error) {
      if (showError) this.status?.setText(error instanceof Error ? error.message : 'Error cargando el reino');
    }
  }

  private renderScene(): void {
    if (!this.state) return;
    const { width, height } = this.scale;
    const farm = this.state.buildings.find((b) => b.code === 'FARM');
    const construction = this.state.construction;

    this.children.list
      .filter((child) => child !== this.status)
      .forEach((child) => child.destroy());

    this.add.text(width / 2, Math.max(55, height * 0.09), this.state.kingdomName.toUpperCase(), {
      fontFamily: 'Georgia, serif', fontSize: '30px', color: '#fff4d0', stroke: '#332719', strokeThickness: 6
    }).setOrigin(0.5);

    const r = this.state.resources;
    this.resourceText = this.add.text(width / 2, Math.max(105, height * 0.16),
      `🌾 ${Math.floor(r.FOOD ?? 0)}   🪵 ${Math.floor(r.WOOD ?? 0)}   🪨 ${Math.floor(r.STONE ?? 0)}   🪙 ${Math.floor(r.GOLD ?? 0)}   💎 ${Math.floor(r.GEMS ?? 0)}`,
      { fontFamily: 'system-ui, sans-serif', fontSize: '18px', color: '#ffffff', backgroundColor: '#00000088', padding: { x: 14, y: 8 } }
    ).setOrigin(0.5);

    this.add.text(width * 0.43, height * 0.46, '🏰', { fontSize: '100px' }).setOrigin(0.5);
    this.add.text(width * 0.58, height * 0.53, '🌾', { fontSize: '72px' }).setOrigin(0.5);

    const farmLevel = farm?.level ?? 0;
    this.farmText = this.add.text(width * 0.58, height * 0.65,
      farmLevel === 0 ? 'Granja sin construir' : `Granja · Nivel ${farmLevel}\n+${Math.floor(farm?.productionPerHour ?? 0)} alimentos/h`,
      { align: 'center', fontFamily: 'system-ui, sans-serif', fontSize: '17px', color: '#ffffff', stroke: '#26351f', strokeThickness: 4 }
    ).setOrigin(0.5);

    if (construction?.buildingCode === 'FARM') {
      this.add.text(width / 2, height * 0.77,
        `🔨 Construyendo Granja nivel ${construction.toLevel} · ${this.formatTime(construction.remainingSeconds)}`,
        { fontFamily: 'system-ui, sans-serif', fontSize: '18px', color: '#fff4d0', backgroundColor: '#332719dd', padding: { x: 16, y: 10 } }
      ).setOrigin(0.5);
    } else if (farmLevel < 10) {
      this.farmButton = this.add.text(width / 2, height * 0.78,
        farmLevel === 0 ? 'CONSTRUIR GRANJA' : 'MEJORAR GRANJA',
        { fontFamily: 'system-ui, sans-serif', fontStyle: 'bold', fontSize: '19px', color: '#ffffff', backgroundColor: '#8a5a24', padding: { x: 22, y: 13 } }
      ).setOrigin(0.5).setInteractive({ useHandCursor: true });
      this.farmButton.on('pointerdown', () => void this.onUpgradeFarm());
    }

    this.add.text(width / 2, height * 0.9,
      farmLevel === 0 ? '🎯 Objetivo: construye tu primera granja' : 'Tu reino sigue produciendo aunque cierres el juego',
      { fontFamily: 'system-ui, sans-serif', fontSize: '16px', color: '#ffffff', backgroundColor: '#00000077', padding: { x: 14, y: 9 } }
    ).setOrigin(0.5);
  }

  private async onUpgradeFarm(): Promise<void> {
    this.farmButton?.disableInteractive().setText('INICIANDO...');
    try {
      this.state = await upgradeFarm();
      this.renderScene();
    } catch (error) {
      this.status?.setText(error instanceof Error ? error.message : 'No se pudo iniciar la construccion');
      this.renderScene();
    }
  }

  private formatTime(seconds: number): string {
    const s = Math.max(0, seconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':');
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#6e934f',
  scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [KingdomScene]
};

new Phaser.Game(config);
