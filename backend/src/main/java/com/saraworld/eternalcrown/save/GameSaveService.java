package com.saraworld.eternalcrown.save;

import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GameSaveService {
    private final Map<String, GameSave> saves = new ConcurrentHashMap<>();

    public GameSave load(String playerId) {
        return saves.computeIfAbsent(playerId, id -> new GameSave(id, "{}", 0L, Instant.now()));
    }

    public synchronized GameSave save(String playerId, String state, long expectedVersion) {
        GameSave current = load(playerId);
        if (current.version() != expectedVersion) throw new IllegalStateException("VERSION_CONFLICT");
        GameSave next = new GameSave(playerId, state, current.version() + 1, Instant.now());
        saves.put(playerId, next);
        return next;
    }

    public record GameSave(String playerId, String state, long version, Instant updatedAt) {}
}