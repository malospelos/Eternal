package com.saraworld.eternalcrown.save;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;

@Repository
public class JdbcGameSaveRepository implements GameSaveRepository {
    private final JdbcTemplate jdbc;
    public JdbcGameSaveRepository(JdbcTemplate jdbc){this.jdbc=jdbc;}

    @Override public Optional<GameSaveRecord> find(String playerId){
        return jdbc.query("SELECT PlayerId, StateJson, Version, UpdatedAt FROM dbo.ec_game_saves WHERE PlayerId=?", (rs,n)->new GameSaveRecord(rs.getString(1),rs.getString(2),rs.getLong(3),rs.getTimestamp(4).toInstant()), playerId).stream().findFirst();
    }
    @Override public GameSaveRecord insertIfMissing(String playerId){
        jdbc.update("IF NOT EXISTS(SELECT 1 FROM dbo.ec_game_saves WHERE PlayerId=?) INSERT dbo.ec_game_saves(PlayerId,StateJson,Version,UpdatedAt) VALUES(?,N'{}',0,SYSUTCDATETIME())",playerId,playerId);
        return find(playerId).orElseThrow();
    }
    @Override public Optional<GameSaveRecord> updateIfVersion(String playerId,String state,long expectedVersion,Instant updatedAt){
        int changed=jdbc.update("UPDATE dbo.ec_game_saves SET StateJson=?,Version=Version+1,UpdatedAt=? WHERE PlayerId=? AND Version=?",state,Timestamp.from(updatedAt),playerId,expectedVersion);
        return changed==1?find(playerId):Optional.empty();
    }
}