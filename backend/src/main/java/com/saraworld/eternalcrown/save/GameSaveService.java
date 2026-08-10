package com.saraworld.eternalcrown.save;

import org.springframework.stereotype.Service;
import java.time.Instant;

@Service
public class GameSaveService {
    private final GameSaveRepository repository;
    public GameSaveService(GameSaveRepository repository){this.repository=repository;}

    public GameSave load(String playerId){return toSave(repository.find(playerId).orElseGet(()->repository.insertIfMissing(playerId)));}

    public GameSave save(String playerId,String state,long expectedVersion){
        if(state==null||state.isBlank())throw new IllegalArgumentException("EMPTY_STATE");
        var updated=repository.updateIfVersion(playerId,state,expectedVersion,Instant.now());
        if(updated.isEmpty())throw new IllegalStateException("VERSION_CONFLICT");
        return toSave(updated.get());
    }
    private GameSave toSave(GameSaveRepository.GameSaveRecord r){return new GameSave(r.playerId(),r.state(),r.version(),r.updatedAt());}
    public record GameSave(String playerId,String state,long version,Instant updatedAt){}
}