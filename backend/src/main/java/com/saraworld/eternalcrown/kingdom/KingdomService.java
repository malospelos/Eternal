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
    public KingdomService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Transactional public KingdomStateResponse getDemoKingdomState(){long id=findDemoKingdomId();settleCompletedConstruction(id);settleFoodProduction(id);return loadState(id);}
    @Transactional public KingdomStateResponse startFarmUpgrade(UUID requestId){
        long kingdomId=findDemoKingdomId();settleCompletedConstruction(kingdomId);settleFoodProduction(kingdomId);
        Integer previous=jdbc.query("SELECT TOP 1 1 FROM dbo.ec_construction_queue WHERE RequestId = ?",rs->rs.next()?1:null,requestId);if(previous!=null)return loadState(kingdomId);
        Integer active=jdbc.query("SELECT TOP 1 1 FROM dbo.ec_construction_queue WHERE KingdomId = ? AND Status = 'ACTIVE'",rs->rs.next()?1:null,kingdomId);if(active!=null)throw new ResponseStatusException(HttpStatus.CONFLICT,"El constructor ya esta ocupado");
        FarmRow farm=jdbc.queryForObject("SELECT Id, Level FROM dbo.ec_kingdom_buildings WHERE KingdomId = ? AND BuildingTypeCode = 'FARM'",(rs,n)->new FarmRow(rs.getLong("Id"),rs.getInt("Level")),kingdomId);if(farm==null||farm.level()>=10)throw new ResponseStatusException(HttpStatus.CONFLICT,"La granja ya esta al nivel maximo");
        int target=farm.level()+1;UpgradeConfig cfg=jdbc.queryForObject("SELECT bl.BuildSeconds, bl.RequiredCastleLevel, c.Amount FROM dbo.ec_building_levels bl JOIN dbo.ec_building_level_costs c ON c.BuildingTypeCode=bl.BuildingTypeCode AND c.Level=bl.Level WHERE bl.BuildingTypeCode='FARM' AND bl.Level=? AND c.ResourceCode='WOOD'",(rs,n)->new UpgradeConfig(rs.getInt("BuildSeconds"),rs.getInt("RequiredCastleLevel"),rs.getBigDecimal("Amount")),target);if(cfg==null)throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"No existe configuracion para la mejora");
        Integer castle=jdbc.queryForObject("SELECT Level FROM dbo.ec_kingdom_buildings WHERE KingdomId=? AND BuildingTypeCode='CASTLE'",Integer.class,kingdomId);if(castle==null||castle<cfg.requiredCastleLevel())throw new ResponseStatusException(HttpStatus.CONFLICT,"Debes mejorar primero el castillo");
        BigDecimal wood=jdbc.queryForObject("SELECT Amount FROM dbo.ec_kingdom_resources WITH (UPDLOCK, ROWLOCK) WHERE KingdomId=? AND ResourceCode='WOOD'",BigDecimal.class,kingdomId);if(wood==null||wood.compareTo(cfg.woodCost())<0)throw new ResponseStatusException(HttpStatus.CONFLICT,"No tienes madera suficiente");
        BigDecimal after=wood.subtract(cfg.woodCost());jdbc.update("UPDATE dbo.ec_kingdom_resources SET Amount=? WHERE KingdomId=? AND ResourceCode='WOOD'",after,kingdomId);jdbc.update("INSERT INTO dbo.ec_resource_transactions (KingdomId,ResourceCode,Amount,BalanceBefore,BalanceAfter,ReasonCode,ReferenceType,ReferenceId,RequestId) VALUES (?,'WOOD',?,?,?,'BUILDING_UPGRADE','BUILDING',?,?)",kingdomId,cfg.woodCost().negate(),wood,after,farm.id(),requestId);
        Instant now=Instant.now(),finish=now.plusSeconds(cfg.buildSeconds());jdbc.update("INSERT INTO dbo.ec_construction_queue (KingdomId,KingdomBuildingId,BuilderSlot,FromLevel,ToLevel,StartedAt,FinishAt,Status,RequestId) VALUES (?,?,1,?,?,?,?, 'ACTIVE',?)",kingdomId,farm.id(),farm.level(),target,Timestamp.from(now),Timestamp.from(finish),requestId);return loadState(kingdomId);
    }
    private long findDemoKingdomId(){Long id=jdbc.queryForObject("SELECT k.Id FROM dbo.ec_kingdoms k JOIN dbo.ec_players p ON p.Id=k.PlayerId WHERE p.PlayerName=?",Long.class,DEMO_PLAYER_NAME);if(id==null)throw new ResponseStatusException(HttpStatus.NOT_FOUND,"No existe el reino demo");return id;}
    private void settleCompletedConstruction(long id){Instant now=Instant.now();List<CompletedConstruction> list=jdbc.query("SELECT Id,KingdomBuildingId,ToLevel FROM dbo.ec_construction_queue WHERE KingdomId=? AND Status='ACTIVE' AND FinishAt<=? ORDER BY FinishAt,Id",(rs,n)->new CompletedConstruction(rs.getLong("Id"),rs.getLong("KingdomBuildingId"),rs.getInt("ToLevel")),id,Timestamp.from(now));for(var x:list){jdbc.update("UPDATE dbo.ec_kingdom_buildings SET Level=? WHERE Id=?",x.toLevel(),x.buildingId());jdbc.update("UPDATE dbo.ec_construction_queue SET Status='COMPLETED',CompletedAt=? WHERE Id=? AND Status='ACTIVE'",Timestamp.from(now),x.queueId());}}
    private void settleFoodProduction(long id){ResourceRow food=jdbc.queryForObject("SELECT Amount,LastCalculatedAt FROM dbo.ec_kingdom_resources WITH (UPDLOCK,ROWLOCK) WHERE KingdomId=? AND ResourceCode='FOOD'",(rs,n)->new ResourceRow(rs.getBigDecimal("Amount"),rs.getTimestamp("LastCalculatedAt").toInstant()),id);if(food==null)return;Instant now=Instant.now();long ms=Math.max(0,Duration.between(food.lastCalculatedAt(),now).toMillis());if(ms==0)return;BigDecimal rate=jdbc.queryForObject("SELECT COALESCE(bl.ProductionPerHour,0) FROM dbo.ec_kingdom_buildings kb LEFT JOIN dbo.ec_building_levels bl ON bl.BuildingTypeCode=kb.BuildingTypeCode AND bl.Level=kb.Level WHERE kb.KingdomId=? AND kb.BuildingTypeCode='FARM'",BigDecimal.class,id);if(rate==null)rate=BigDecimal.ZERO;BigDecimal made=rate.multiply(BigDecimal.valueOf(ms)).divide(BigDecimal.valueOf(3600000L),4,RoundingMode.DOWN),after=food.amount().add(made);jdbc.update("UPDATE dbo.ec_kingdom_resources SET Amount=?,LastCalculatedAt=? WHERE KingdomId=? AND ResourceCode='FOOD'",after,Timestamp.from(now),id);if(made.signum()>0)jdbc.update("INSERT INTO dbo.ec_resource_transactions (KingdomId,ResourceCode,Amount,BalanceBefore,BalanceAfter,ReasonCode,ReferenceType) VALUES (?,'FOOD',?,?,?,'OFFLINE_PRODUCTION','FARM')",id,made,food.amount(),after);}
    private KingdomStateResponse loadState(long id){
        KingdomHeader h=jdbc.queryForObject("SELECT PublicId,KingdomName,KingdomLevel FROM dbo.ec_kingdoms WHERE Id=?",(rs,n)->new KingdomHeader(UUID.fromString(rs.getString("PublicId")),rs.getString("KingdomName"),rs.getInt("KingdomLevel")),id);
        Map<String,BigDecimal> resources=new LinkedHashMap<>();List<Map.Entry<String,BigDecimal>> resourceRows=jdbc.query("SELECT ResourceCode,Amount FROM dbo.ec_kingdom_resources WHERE KingdomId=? ORDER BY ResourceCode",(rs,n)->Map.entry(rs.getString("ResourceCode"),rs.getBigDecimal("Amount")),id);resourceRows.forEach(e->resources.put(e.getKey(),e.getValue()));
        List<KingdomStateResponse.BuildingState> buildings=jdbc.query("SELECT kb.PublicId,kb.BuildingTypeCode,bt.Name,kb.Level,kb.PositionX,kb.PositionY,COALESCE(bl.ProductionPerHour,0) AS ProductionPerHour FROM dbo.ec_kingdom_buildings kb JOIN dbo.ec_building_types bt ON bt.Code=kb.BuildingTypeCode LEFT JOIN dbo.ec_building_levels bl ON bl.BuildingTypeCode=kb.BuildingTypeCode AND bl.Level=kb.Level WHERE kb.KingdomId=? ORDER BY bt.SortOrder",(rs,n)->new KingdomStateResponse.BuildingState(UUID.fromString(rs.getString("PublicId")),rs.getString("BuildingTypeCode"),rs.getString("Name"),rs.getInt("Level"),rs.getBigDecimal("ProductionPerHour"),rs.getInt("PositionX"),rs.getInt("PositionY")),id);
        KingdomStateResponse.ConstructionState construction=jdbc.query("SELECT TOP 1 q.PublicId,b.BuildingTypeCode,q.FromLevel,q.ToLevel,q.StartedAt,q.FinishAt FROM dbo.ec_construction_queue q JOIN dbo.ec_kingdom_buildings b ON b.Id=q.KingdomBuildingId WHERE q.KingdomId=? AND q.Status='ACTIVE' ORDER BY q.StartedAt",rs->{if(!rs.next())return null;Instant started=rs.getTimestamp("StartedAt").toInstant(),finish=rs.getTimestamp("FinishAt").toInstant();return new KingdomStateResponse.ConstructionState(UUID.fromString(rs.getString("PublicId")),rs.getString("BuildingTypeCode"),rs.getInt("FromLevel"),rs.getInt("ToLevel"),started,finish,Math.max(0,Duration.between(Instant.now(),finish).toSeconds()));},id);
        return new KingdomStateResponse(h.publicId(),h.name(),h.level(),resources,buildings,construction,Instant.now());
    }
    private record FarmRow(long id,int level){} private record UpgradeConfig(int buildSeconds,int requiredCastleLevel,BigDecimal woodCost){} private record CompletedConstruction(long queueId,long buildingId,int toLevel){} private record ResourceRow(BigDecimal amount,Instant lastCalculatedAt){} private record KingdomHeader(UUID publicId,String name,int level){}
}
