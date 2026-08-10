package com.saraworld.eternalcrown.save;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class GameSaveServiceTest {
 @Test void guardaCargaYProtegeConflictos(){
  var s=new GameSaveService();
  var initial=s.load("arthur"); assertEquals(0,initial.version());
  var saved=s.save("arthur","{\"phase\":7}",0); assertEquals(1,saved.version()); assertEquals("{\"phase\":7}",s.load("arthur").state());
  assertThrows(IllegalStateException.class,()->s.save("arthur","{}",0));
 }
}