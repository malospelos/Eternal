export type TileRef = number;

export enum TerrainType { Plains=0, Forest=1, Mountain=2, Water=3, Desert=4, Ruins=5 }

export class WorldMap {
  private readonly terrain: Uint8Array;
  private readonly owner: Uint32Array;
  private readonly flags: Uint8Array;

  constructor(public readonly width: number, public readonly height: number, terrain?: Uint8Array) {
    if (width <= 0 || height <= 0) throw new Error('Dimensiones de mapa inválidas');
    const size = width * height;
    if (terrain && terrain.length !== size) throw new Error('El terreno no coincide con el tamaño del mapa');
    this.terrain = terrain ? terrain.slice() : new Uint8Array(size);
    this.owner = new Uint32Array(size);
    this.flags = new Uint8Array(size);
  }

  size(): number { return this.width * this.height; }
  isValidCoord(x:number,y:number):boolean { return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<this.width&&y<this.height; }
  ref(x:number,y:number):TileRef { if(!this.isValidCoord(x,y)) throw new Error(`Coordenada inválida ${x},${y}`); return y*this.width+x; }
  x(ref:TileRef):number { this.assertRef(ref); return ref%this.width; }
  y(ref:TileRef):number { this.assertRef(ref); return Math.floor(ref/this.width); }
  terrainAt(ref:TileRef):TerrainType { this.assertRef(ref); return this.terrain[ref] as TerrainType; }
  setTerrain(ref:TileRef,type:TerrainType):void { this.assertRef(ref); this.terrain[ref]=type; }
  ownerId(ref:TileRef):number { this.assertRef(ref); return this.owner[ref]; }
  setOwner(ref:TileRef,playerId:number):void { this.assertRef(ref); if(playerId<0) throw new Error('Propietario inválido'); this.owner[ref]=playerId; }
  isPassable(ref:TileRef):boolean { const t=this.terrainAt(ref); return t!==TerrainType.Water&&t!==TerrainType.Mountain; }
  movementCost(ref:TileRef):number { switch(this.terrainAt(ref)){case TerrainType.Forest:return 2;case TerrainType.Desert:return 2;case TerrainType.Ruins:return 2;case TerrainType.Water:case TerrainType.Mountain:return Infinity;default:return 1;} }
  setFog(ref:TileRef,value:boolean):void { this.setFlag(ref,1,value); }
  hasFog(ref:TileRef):boolean { return this.hasFlag(ref,1); }

  neighbors4(ref:TileRef):TileRef[] {
    const x=this.x(ref),y=this.y(ref),out:TileRef[]=[];
    if(y>0)out.push(ref-this.width); if(y+1<this.height)out.push(ref+this.width);
    if(x>0)out.push(ref-1); if(x+1<this.width)out.push(ref+1); return out;
  }

  circle(center:TileRef,radius:number,filter?:(tile:TileRef)=>boolean):TileRef[] {
    const cx=this.x(center),cy=this.y(center),r2=radius*radius,out:TileRef[]=[];
    for(let y=Math.max(0,cy-radius);y<=Math.min(this.height-1,cy+radius);y++) for(let x=Math.max(0,cx-radius);x<=Math.min(this.width-1,cx+radius);x++) {
      const dx=x-cx,dy=y-cy,t=this.ref(x,y); if(dx*dx+dy*dy<=r2&&(!filter||filter(t)))out.push(t);
    }
    return out;
  }

  bfs(start:TileRef,accept:(tile:TileRef)=>boolean,maxVisited=10000):TileRef[] {
    this.assertRef(start); const queue=[start],seen=new Uint8Array(this.size()),out:TileRef[]=[]; seen[start]=1;
    for(let i=0;i<queue.length&&i<maxVisited;i++){const current=queue[i]; if(accept(current))out.push(current); for(const n of this.neighbors4(current)) if(!seen[n]&&this.isPassable(n)){seen[n]=1;queue.push(n);}}
    return out;
  }

  manhattan(a:TileRef,b:TileRef):number { return Math.abs(this.x(a)-this.x(b))+Math.abs(this.y(a)-this.y(b)); }
  snapshot(){ return {width:this.width,height:this.height,terrain:this.terrain.slice(),owner:this.owner.slice(),flags:this.flags.slice()}; }
  private setFlag(ref:TileRef,bit:number,value:boolean){this.assertRef(ref);this.flags[ref]=value?this.flags[ref]|bit:this.flags[ref]&~bit;}
  private hasFlag(ref:TileRef,bit:number){this.assertRef(ref);return (this.flags[ref]&bit)!==0;}
  private assertRef(ref:TileRef){if(!Number.isInteger(ref)||ref<0||ref>=this.size())throw new Error(`Tile inválido ${ref}`);}
}