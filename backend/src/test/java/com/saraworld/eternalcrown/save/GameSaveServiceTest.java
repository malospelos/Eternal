package com.saraworld.eternalcrown.save;

import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class GameSaveServiceTest {
 @Test void guardaCargaYProtegeConflictos(){
  var repo=new MemoryRepo();var s=new GameSaveService(repo);
  var initial=s.load("arthur");assertEquals(0,initial.version());
  var saved=s.save("arthur","{\"phase\":8}",0);assertEquals(1,saved.version());assertEquals("{\"phase\":8}",s.load("arthur").state());
  assertThrows(IllegalStateException.class,()->s.save("arthur","{}",0));
  assertThrows(IllegalArgumentException.class,()->s.save("arthur","",1));
 }
 static class MemoryRepo implements GameSaveRepository{
  final Map<String,GameSaveRecord> m=new HashMap<>();
  public Optional<GameSaveRecord> find(String id){return Optional.ofNullable(m.get(id));}
  public GameSaveRecord insertIfMissing(String id){return m.computeIfAbsent(id,x->new GameSaveRecord(x,"{}",0,Instant.now()));}
  public Optional<GameSaveRecord> updateIfVersion(String id,String state,long v,Instant at){var c=insertIfMissing(id);if(c.version()!=v)return Optional.empty();var n=new GameSaveRecord(id,state,v+1,at);m.put(id,n);return Optional.of(n);}
 }
}