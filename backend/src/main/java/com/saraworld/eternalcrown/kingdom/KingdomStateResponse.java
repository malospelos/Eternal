package com.saraworld.eternalcrown.kingdom;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record KingdomStateResponse(
        UUID kingdomId,
        String kingdomName,
        int kingdomLevel,
        Map<String, BigDecimal> resources,
        List<BuildingState> buildings,
        ConstructionState construction,
        Instant serverTime
) {
    public record BuildingState(
            UUID id,
            String code,
            String name,
            int level,
            BigDecimal productionPerHour,
            int positionX,
            int positionY
    ) {
    }

    public record ConstructionState(
            UUID id,
            String buildingCode,
            int fromLevel,
            int toLevel,
            Instant startedAt,
            Instant finishAt,
            long remainingSeconds
    ) {
    }
}
