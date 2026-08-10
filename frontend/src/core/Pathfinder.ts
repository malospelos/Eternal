import {WorldMap,type TileRef} from './WorldMap';
export interface PathResult{tiles:TileRef[];cost:number;}
export class Pathfinder{
 constructor(private map:WorldMap){}
 find(start:TileRef,goal:TileRef):PathResult|null{
  if(start===goal)return{tiles:[start],cost:0};
  const open=new Set<TileRef>([start]),came=new Map<TileRef,TileRef>(),g=new Map<TileRef,number>([[start,0]]),f=new Map<TileRef,number>([[start,this.map.manhattan(start,goal)]]);
  while(open.size){let current=[...open].reduce((a,b)=>(f.get(a)??Infinity)<=(f.get(b)??Infinity)?a:b);if(current===goal){const tiles=[current];while(came.has(current)){current=came.get(current)!;tiles.push(current);}tiles.reverse();return{tiles,cost:g.get(goal)!};}open.delete(current);
   for(const n of this.map.neighbors4(current)){if(!this.map.isPassable(n))continue;const tentative=(g.get(current)??Infinity)+this.map.movementCost(n);if(tentative<(g.get(n)??Infinity)){came.set(n,current);g.set(n,tentative);f.set(n,tentative+this.map.manhattan(n,goal));open.add(n);}}
  }return null;
 }
}