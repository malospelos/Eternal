package com.saraworld.eternalcrown.kingdom;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class KingdomService {

    private static final String DEMO_PLAYER_NAME = "Comandante";

    private final JdbcTemplate jdbc;

    public KingdomService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional
    public KingdomStateResponse getDemoKingdomState() {
        long kingdomId = findDemoKingdomId();
        settleCompletedConstruction(kingdomId);
        settleFoodProduction(kingdomId);
        return loadState(kingdomId);
    }

    @Transactional
    public KingdomStateResponse startFarmUpgrade(UUID requestId) {
        long kingdomId = findDemoKingdomId();
        settleCompletedConstruction(kingdomId);
        settleFoodProduction(kingdomId);

        Integer previous = jdbc.query(
                "SELECT TOP 1 1 FROM dbo.ec_construction_queue WHERE RequestId = ?",
                rs -> rs.next() ? 1 : null,
                requestId
        );
        if (previous != null) {
            return loadState(kingdomId);
        }

        Integer active = jdbc.query(
                "SELECT TOP 1 1 FROM dbo.ec_construction_queue WHERE KingdomId = ? AND Status = 'ACTIVE'",
                rs -> rs.next() ? 1 : null,
                kingdomId
        );
        if (active != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El constructor ya esta ocupado");
        }

        FarmRow farm = jdbc.queryForObject(
                "SELECT Id, Level FROM dbo.ec_kingdom_buildings WHERE KingdomId = ? AND BuildingTypeCode = 'FARM'",
                (rs, rowNum) -> new FarmRow(rs.getLong("Id"), rs.getInt("Level")),
                kingdomId
        );
        if (farm == null || farm.level() >= 10) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La granja ya esta al nivel maximo");
        }

        int targetLevel = farm.level() + 1;
        UpgradeConfig config = jdbc.queryForObject(
                "SELECT bl.BuildSeconds, bl.RequiredCastleLevel, c.Amount " +
                        "FROM dbo.ec_building_levels bl " +
                        "JOIN dbo.ec_building_level_costs c ON c.BuildingTypeCode = bl.BuildingTypeCode AND c.Level = bl.Level " +
                        "WHERE bl.BuildingTypeCode = 'FARM' AND bl.Level = ? AND c.ResourceCode = 'WOOD'",
                (rs, rowNum) -> new UpgradeConfig(
                        rs.getInt("BuildSeconds"),
                        rs.getInt("RequiredCastleLevel"),
                        rs.getBigDecimal("Amount")
                ),
                targetLevel
        );
        if (config == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No existe configuracion para la mejora");
        }

        Integer castleLevel = jdbc.queryForObject(
                "SELECT Level FROM dbo.ec_kingdom_buildings WHERE KingdomId = ? AND BuildingTypeCode = 'CASTLE'",
                Integer.class,
                kingdomId
        );
        if (castleLevel == null || castleLevel < config.requiredCastleLevel()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Debes mejorar primero el castillo");
        }

        BigDecimal wood = jdbc.queryForObject(
                "SELECT Amount FROM dbo.ec_kingdom_resources WITH (UPDLOCK, ROWLOCK) WHERE KingdomId = ? AND ResourceCode = 'WOOD'",
                BigDecimal.class,
                kingdomId
        );
        if (wood == null || wood.compareTo(config.woodCost()) < 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No tienes madera suficiente");
        }

        BigDecimal after = wood.subtract(config.woodCost());
        jdbc.update(
                "UPDATE dbo.ec_kingdom_resources SET Amount = ? WHERE KingdomId = ? AND ResourceCode = 'WOOD'",
                after, kingdomId
        );
        jdbc.update(
                "INSERT INTO dbo.ec_resource_transactions " +
                        "(KingdomId, ResourceCode, Amount, BalanceBefore, BalanceAfter, ReasonCode, ReferenceType, ReferenceId, RequestId) " +
                        "VALUES (?, 'WOOD', ?, ?, ?, 'BUILDING_UPGRADE', 'BUILDING', ?, ?)",
                kingdomId, config.woodCost().negate(), wood, after, farm.id(), requestId
        );

        Instant now = Instant.now();
        Instant finishAt = now.plusSeconds(config.buildSeconds());
        jdbc.update(
                "INSERT INTO dbo.ec_construction_queue " +
                        "(KingdomId, KingdomBuildingId, BuilderSlot, FromLevel, ToLevel, StartedAt, FinishAt, Status, RequestId) " +
                        "VALUES (?, ?, 1, ?, ?, ?, ?, 'ACTIVE', ?)",
                kingdomId, farm.id(), farm.level(), targetLevel,
                Timestamp.from(now), Timestamp.from(finishAt), requestId
        );

        return loadState(kingdomId);
    }

    private long findDemoKingdomId() {
        Long id = jdbc.queryForObject(
                "SELECT k.Id FROM dbo.ec_kingdoms k JOIN dbo.ec_players p ON p.Id = k.PlayerId WHERE p.PlayerName = ?",
                Long.class,
                DEMO_PLAYER_NAME
        );
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No existe el reino demo");
        }
        return id;
    }

    private void settleCompletedConstruction(long kingdomId) {
        Instant now = Instant.now();
        List<CompletedConstruction> completed = jdbc.query(
                "SELECT Id, KingdomBuildingId, ToLevel FROM dbo.ec_construction_queue " +
                        "WHERE KingdomId = ? AND Status = 'ACTIVE' AND FinishAt <= ? ORDER BY FinishAt, Id",
                (rs, rowNum) -> new CompletedConstruction(
                        rs.getLong("Id"), rs.getLong("KingdomBuildingId"), rs.getInt("ToLevel")
                ),
                kingdomId, Timestamp.from(now)
        );

        for (CompletedConstruction item : completed) {
            jdbc.update(
                    "UPDATE dbo.ec_kingdom_buildings SET Level = ? WHERE Id = ?",
                    item.toLevel(), item.buildingId()
            );
            jdbc.update(
                    "UPDATE dbo.ec_construction_queue SET Status = 'COMPLETED', CompletedAt = ? WHERE Id = ? AND Status = 'ACTIVE'",
                    Timestamp.from(now), item.queueId()
            );
        }
    }

    private void settleFoodProduction(long kingdomId) {
        ResourceRow food = jdbc.queryForObject(
                "SELECT Amount, LastCalculatedAt FROM dbo.ec_kingdom_resources WITH (UPDLOCK, ROWLOCK) " +
                        "WHERE KingdomId = ? AND ResourceCode = 'FOOD'",
                (rs, rowNum) -> new ResourceRow(
                        rs.getBigDecimal("Amount"), rs.getTimestamp("LastCalculatedAt").toInstant()
                ),
                kingdomId
        );
        if (food == null) {
            return;
        }

        Instant now = Instant.now();
        long elapsedMillis = Math.max(0, Duration.between(food.lastCalculatedAt(), now).toMillis());
        if (elapsedMillis == 0) {
            return;
        }

        BigDecimal productionPerHour = jdbc.queryForObject(
                "SELECT COALESCE(bl.ProductionPerHour, 0) " +
                        "FROM dbo.ec_kingdom_buildings kb " +
                        "LEFT JOIN dbo.ec_building_levels bl ON bl.BuildingTypeCode = kb.BuildingTypeCode AND bl.Level = kb.Level " +
                        "WHERE kb.KingdomId = ? AND kb.BuildingTypeCode = 'FARM'",
                BigDecimal.class,
                kingdomId
        );
        if (productionPerHour == null) {
            productionPerHour = BigDecimal.ZERO;
        }

        BigDecimal produced = productionPerHour
                .multiply(BigDecimal.valueOf(elapsedMillis))
                .divide(BigDecimal.valueOf(3_600_000L), 4, RoundingMode.DOWN);

        BigDecimal after = food.amount().add(produced);
        jdbc.update(
                "UPDATE dbo.ec_kingdom_resources SET Amount = ?, LastCalculatedAt = ? WHERE KingdomId = ? AND ResourceCode = 'FOOD'",
                after, Timestamp.from(now), kingdomId
        );

        if (produced.signum() > 0) {
            jdbc.update(
                    "INSERT INTO dbo.ec_resource_transactions " +
                            "(KingdomId, ResourceCode, Amount, BalanceBefore, BalanceAfter, ReasonCode, ReferenceType) " +
                            "VALUES (?, 'FOOD', ?, ?, ?, 'OFFLINE_PRODUCTION', 'FARM')",
                    kingdomId, produced, food.amount(), after
            );
        }
    }

    private KingdomStateResponse loadState(long kingdomId) {
        KingdomHeader header = jdbc.queryForObject(
                "SELECT PublicId, KingdomName, KingdomLevel FROM dbo.ec_kingdoms WHERE Id = ?",
                (rs, rowNum) -> new KingdomHeader(
                        UUID.fromString(rs.getString("PublicId")),
                        rs.getString("KingdomName"),
                        rs.getInt("KingdomLevel")
                ),
                kingdomId
        );

        Map<String, BigDecimal> resources = new LinkedHashMap<>();
        jdbc.query(
                "SELECT ResourceCode, Amount FROM dbo.ec_kingdom_resources WHERE KingdomId = ? ORDER BY ResourceCode",
                rs -> resources.put(rs.getString("ResourceCode"), rs.getBigDecimal("Amount")),
                kingdomId
        );

        List<KingdomStateResponse.BuildingState> buildings = jdbc.query(
                "SELECT kb.PublicId, kb.BuildingTypeCode, bt.Name, kb.Level, kb.PositionX, kb.PositionY, " +
                        "COALESCE(bl.ProductionPerHour, 0) AS ProductionPerHour " +
                        "FROM dbo.ec_kingdom_buildings kb " +
                        "JOIN dbo.ec_building_types bt ON bt.Code = kb.BuildingTypeCode " +
                        "LEFT JOIN dbo.ec_building_levels bl ON bl.BuildingTypeCode = kb.BuildingTypeCode AND bl.Level = kb.Level " +
                        "WHERE kb.KingdomId = ? ORDER BY bt.SortOrder",
                (rs, rowNum) -> new KingdomStateResponse.BuildingState(
                        UUID.fromString(rs.getString("PublicId")),
                        rs.getString("BuildingTypeCode"),
                        rs.getString("Name"),
                        rs.getInt("Level"),
                        rs.getBigDecimal("ProductionPerHour"),
                        rs.getInt("PositionX"),
                        rs.getInt("PositionY")
                ),
                kingdomId
        );

        KingdomStateResponse.ConstructionState construction = jdbc.query(
                "SELECT TOP 1 q.PublicId, b.BuildingTypeCode, q.FromLevel, q.ToLevel, q.StartedAt, q.FinishAt " +
                        "FROM dbo.ec_construction_queue q JOIN dbo.ec_kingdom_buildings b ON b.Id = q.KingdomBuildingId " +
                        "WHERE q.KingdomId = ? AND q.Status = 'ACTIVE' ORDER BY q.StartedAt",
                rs -> {
                    if (!rs.next()) return null;
                    Instant startedAt = rs.getTimestamp("StartedAt").toInstant();
                    Instant finishAt = rs.getTimestamp("FinishAt").toInstant();
                    long remaining = Math.max(0, Duration.between(Instant.now(), finishAt).toSeconds());
                    return new KingdomStateResponse.ConstructionState(
                            UUID.fromString(rs.getString("PublicId")),
                            rs.getString("BuildingTypeCode"),
                            rs.getInt("FromLevel"),
                            rs.getInt("ToLevel"),
                            startedAt,
                            finishAt,
                            remaining
                    );
                },
                kingdomId
        );

        return new KingdomStateResponse(
                header.publicId(), header.name(), header.level(), resources, buildings, construction, Instant.now()
        );
    }

    private record FarmRow(long id, int level) {}
    private record UpgradeConfig(int buildSeconds, int requiredCastleLevel, BigDecimal woodCost) {}
    private record CompletedConstruction(long queueId, long buildingId, int toLevel) {}
    private record ResourceRow(BigDecimal amount, Instant lastCalculatedAt) {}
    private record KingdomHeader(UUID publicId, String name, int level) {}
}
