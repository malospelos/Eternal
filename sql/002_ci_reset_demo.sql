/* ETERNAL CROWN - Reset controlado SOLO del jugador demo de CI. */
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;
SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRANSACTION;

DECLARE @PlayerId BIGINT;
DECLARE @KingdomId BIGINT;

SELECT @PlayerId = Id FROM dbo.ec_players WHERE PlayerName = N'Comandante';
SELECT @KingdomId = Id FROM dbo.ec_kingdoms WHERE PlayerId = @PlayerId;

IF @KingdomId IS NOT NULL
BEGIN
    DELETE FROM dbo.ec_resource_transactions WHERE KingdomId = @KingdomId;
    DELETE FROM dbo.ec_construction_queue WHERE KingdomId = @KingdomId;

    UPDATE dbo.ec_kingdom_buildings
       SET Level = CASE WHEN BuildingTypeCode = 'CASTLE' THEN 1 ELSE 0 END
     WHERE KingdomId = @KingdomId;

    UPDATE dbo.ec_kingdom_resources
       SET Amount = CASE ResourceCode
            WHEN 'FOOD' THEN 500
            WHEN 'WOOD' THEN 500
            WHEN 'STONE' THEN 500
            WHEN 'GOLD' THEN 500
            WHEN 'GEMS' THEN 100
            ELSE Amount END,
           LastCalculatedAt = SYSUTCDATETIME()
     WHERE KingdomId = @KingdomId;
END;

COMMIT TRANSACTION;
PRINT 'Reino demo restablecido para prueba de integracion.';
