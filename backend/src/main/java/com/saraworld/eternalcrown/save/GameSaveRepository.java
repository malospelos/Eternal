package com.saraworld.eternalcrown.save;

import java.time.Instant;
import java.util.Optional;

public interface GameSaveRepository {
    Optional<GameSaveRecord> find(String playerId);
    GameSaveRecord insertIfMissing(String playerId);
    Optional<GameSaveRecord> updateIfVersion(String playerId, String state, long expectedVersion, Instant updatedAt);

    record GameSaveRecord(String playerId, String state, long version, Instant updatedAt) {}
}
