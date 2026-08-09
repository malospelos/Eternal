/* ============================================================
   ETERNAL CROWN - MVP v0.1
   001 - Reino, recursos, granja y construccion persistente
   SQL Server 2019
   ============================================================ */

SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID('dbo.ec_players', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ec_players
    (
        Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ec_players PRIMARY KEY,
        PublicId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_ec_players_PublicId DEFAULT NEWID(),
        PlayerName NVARCHAR(50) NOT NULL,
        PlayerLevel INT NOT NULL CONSTRAINT DF_ec_players_PlayerLevel DEFAULT 1,
        Experience BIGINT NOT NULL CONSTRAINT DF_ec_players_Experience DEFAULT 0,
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_ec_players_CreatedAt DEFAULT SYSUTCDATETIME(),
        LastActivityAt DATETIME2(3) NOT NULL CONSTRAINT DF_ec_players_LastActivityAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_ec_players_PublicId UNIQUE (PublicId),
        CONSTRAINT UQ_ec_players_PlayerName UNIQUE (PlayerName)
    );
END;

IF OBJECT_ID('dbo.ec_kingdoms', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ec_kingdoms
    (
        Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ec_kingdoms PRIMARY KEY,
        PublicId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_ec_kingdoms_PublicId DEFAULT NEWID(),
        PlayerId BIGINT NOT NULL,
        KingdomName NVARCHAR(80) NOT NULL,
        KingdomLevel INT NOT NULL CONSTRAINT DF_ec_kingdoms_KingdomLevel DEFAULT 1,
        BuilderSlots INT NOT NULL CONSTRAINT DF_ec_kingdoms_BuilderSlots DEFAULT 1,
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_ec_kingdoms_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_ec_kingdoms_PublicId UNIQUE (PublicId),
        CONSTRAINT UQ_ec_kingdoms_PlayerId UNIQUE (PlayerId),
        CONSTRAINT FK_ec_kingdoms_Player FOREIGN KEY (PlayerId) REFERENCES dbo.ec_players(Id),
        CONSTRAINT CK_ec_kingdoms_BuilderSlots CHECK (BuilderSlots >= 1)
    );
END;

IF OBJECT_ID('dbo.ec_resource_types', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ec_resource_types
    (
        Code VARCHAR(20) NOT NULL CONSTRAINT PK_ec_resource_types PRIMARY KEY,
        Name NVARCHAR(50) NOT NULL,
        IsPremium BIT NOT NULL CONSTRAINT DF_ec_resource_types_IsPremium DEFAULT 0,
        IsLootable BIT NOT NULL CONSTRAINT DF_ec_resource_types_IsLootable DEFAULT 1,
        SortOrder INT NOT NULL
    );
END;

MERGE dbo.ec_resource_types AS T
USING (VALUES
    ('FOOD',N'Alimentos',0,1,1),('WOOD',N'Madera',0,1,2),('STONE',N'Piedra',0,1,3),
    ('GOLD',N'Oro',0,1,4),('GEMS',N'Cristales',1,0,5)
) AS S(Code,Name,IsPremium,IsLootable,SortOrder)
ON T.Code=S.Code
WHEN MATCHED THEN UPDATE SET Name=S.Name,IsPremium=S.IsPremium,IsLootable=S.IsLootable,SortOrder=S.SortOrder
WHEN NOT MATCHED THEN INSERT(Code,Name,IsPremium,IsLootable,SortOrder)
VALUES(S.Code,S.Name,S.IsPremium,S.IsLootable,S.SortOrder);

IF OBJECT_ID('dbo.ec_kingdom_resources', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ec_kingdom_resources
    (
        KingdomId BIGINT NOT NULL,
        ResourceCode VARCHAR(20) NOT NULL,
        Amount DECIMAL(19,4) NOT NULL CONSTRAINT DF_ec_kingdom_resources_Amount DEFAULT 0,
        LastCalculatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_ec_kingdom_resources_LastCalculatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_ec_kingdom_resources PRIMARY KEY(KingdomId,ResourceCode),
        CONSTRAINT FK_ec_kingdom_resources_Kingdom FOREIGN KEY(KingdomId) REFERENCES dbo.ec_kingdoms(Id),
        CONSTRAINT FK_ec_kingdom_resources_Type FOREIGN KEY(ResourceCode) REFERENCES dbo.ec_resource_types(Code),
        CONSTRAINT CK_ec_kingdom_resources_Amount CHECK(Amount>=0)
    );
END;

IF OBJECT_ID('dbo.ec_resource_transactions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ec_resource_transactions
    (
        Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ec_resource_transactions PRIMARY KEY,
        KingdomId BIGINT NOT NULL, ResourceCode VARCHAR(20) NOT NULL,
        Amount DECIMAL(19,4) NOT NULL, BalanceBefore DECIMAL(19,4) NOT NULL, BalanceAfter DECIMAL(19,4) NOT NULL,
        ReasonCode VARCHAR(50) NOT NULL, ReferenceType VARCHAR(50) NULL, ReferenceId BIGINT NULL,
        RequestId UNIQUEIDENTIFIER NULL,
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_ec_resource_transactions_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_ec_resource_transactions_Kingdom FOREIGN KEY(KingdomId) REFERENCES dbo.ec_kingdoms(Id),
        CONSTRAINT FK_ec_resource_transactions_Type FOREIGN KEY(ResourceCode) REFERENCES dbo.ec_resource_types(Code)
    );
    CREATE INDEX IX_ec_resource_transactions_KingdomDate ON dbo.ec_resource_transactions(KingdomId,CreatedAt DESC);
END;

IF OBJECT_ID('dbo.ec_building_types', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ec_building_types
    (
        Code VARCHAR(30) NOT NULL CONSTRAINT PK_ec_building_types PRIMARY KEY,
        Name NVARCHAR(80) NOT NULL,
        IsResourceProducer BIT NOT NULL CONSTRAINT DF_ec_building_types_Producer DEFAULT 0,
        ProductionResourceCode VARCHAR(20) NULL,
        MaxLevel INT NOT NULL CONSTRAINT DF_ec_building_types_MaxLevel DEFAULT 10,
        SortOrder INT NOT NULL,
        CONSTRAINT FK_ec_building_types_Resource FOREIGN KEY(ProductionResourceCode) REFERENCES dbo.ec_resource_types(Code)
    );
END;

MERGE dbo.ec_building_types AS T
USING (VALUES ('CASTLE',N'Castillo',0,CAST(NULL AS VARCHAR(20)),10,1),('FARM',N'Granja',1,'FOOD',10,2))
AS S(Code,Name,IsResourceProducer,ProductionResourceCode,MaxLevel,SortOrder)
ON T.Code=S.Code
WHEN MATCHED THEN UPDATE SET Name=S.Name,IsResourceProducer=S.IsResourceProducer,ProductionResourceCode=S.ProductionResourceCode,MaxLevel=S.MaxLevel,SortOrder=S.SortOrder
WHEN NOT MATCHED THEN INSERT(Code,Name,IsResourceProducer,ProductionResourceCode,MaxLevel,SortOrder)
VALUES(S.Code,S.Name,S.IsResourceProducer,S.ProductionResourceCode,S.MaxLevel,S.SortOrder);

IF OBJECT_ID('dbo.ec_building_levels', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ec_building_levels
    (
        BuildingTypeCode VARCHAR(30) NOT NULL, Level INT NOT NULL, BuildSeconds INT NOT NULL,
        ProductionPerHour DECIMAL(19,4) NULL,
        RequiredCastleLevel INT NOT NULL CONSTRAINT DF_ec_building_levels_Castle DEFAULT 1,
        CONSTRAINT PK_ec_building_levels PRIMARY KEY(BuildingTypeCode,Level),
        CONSTRAINT FK_ec_building_levels_Type FOREIGN KEY(BuildingTypeCode) REFERENCES dbo.ec_building_types(Code),
        CONSTRAINT CK_ec_building_levels_Level CHECK(Level>=1),
        CONSTRAINT CK_ec_building_levels_Seconds CHECK(BuildSeconds>=0)
    );
END;

MERGE dbo.ec_building_levels AS T
USING (VALUES
 ('CASTLE',1,0,CAST(NULL AS DECIMAL(19,4)),1),('CASTLE',2,10,NULL,1),('CASTLE',3,30,NULL,1),('CASTLE',4,60,NULL,1),('CASTLE',5,180,NULL,1),
 ('CASTLE',6,480,NULL,1),('CASTLE',7,900,NULL,1),('CASTLE',8,1800,NULL,1),('CASTLE',9,3600,NULL,1),('CASTLE',10,7200,NULL,1),
 ('FARM',1,5,600,1),('FARM',2,10,900,1),('FARM',3,30,1300,2),('FARM',4,60,1850,3),('FARM',5,180,2600,4),
 ('FARM',6,480,3600,5),('FARM',7,900,4900,6),('FARM',8,1800,6500,7),('FARM',9,3600,8500,8),('FARM',10,7200,11000,9)
) AS S(BuildingTypeCode,Level,BuildSeconds,ProductionPerHour,RequiredCastleLevel)
ON T.BuildingTypeCode=S.BuildingTypeCode AND T.Level=S.Level
WHEN MATCHED THEN UPDATE SET BuildSeconds=S.BuildSeconds,ProductionPerHour=S.ProductionPerHour,RequiredCastleLevel=S.RequiredCastleLevel
WHEN NOT MATCHED THEN INSERT(BuildingTypeCode,Level,BuildSeconds,ProductionPerHour,RequiredCastleLevel)
VALUES(S.BuildingTypeCode,S.Level,S.BuildSeconds,S.ProductionPerHour,S.RequiredCastleLevel);

IF OBJECT_ID('dbo.ec_building_level_costs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ec_building_level_costs
    (
        BuildingTypeCode VARCHAR(30) NOT NULL, Level INT NOT NULL, ResourceCode VARCHAR(20) NOT NULL, Amount DECIMAL(19,4) NOT NULL,
        CONSTRAINT PK_ec_building_level_costs PRIMARY KEY(BuildingTypeCode,Level,ResourceCode),
        CONSTRAINT FK_ec_building_level_costs_Level FOREIGN KEY(BuildingTypeCode,Level) REFERENCES dbo.ec_building_levels(BuildingTypeCode,Level),
        CONSTRAINT FK_ec_building_level_costs_Resource FOREIGN KEY(ResourceCode) REFERENCES dbo.ec_resource_types(Code)
    );
END;

MERGE dbo.ec_building_level_costs AS T
USING (VALUES ('FARM',1,'WOOD',100),('FARM',2,'WOOD',180),('FARM',3,'WOOD',320),('FARM',4,'WOOD',550),('FARM',5,'WOOD',900),('FARM',6,'WOOD',1500),('FARM',7,'WOOD',2400),('FARM',8,'WOOD',3800),('FARM',9,'WOOD',6000),('FARM',10,'WOOD',9500))
AS S(BuildingTypeCode,Level,ResourceCode,Amount)
ON T.BuildingTypeCode=S.BuildingTypeCode AND T.Level=S.Level AND T.ResourceCode=S.ResourceCode
WHEN MATCHED THEN UPDATE SET Amount=S.Amount
WHEN NOT MATCHED THEN INSERT(BuildingTypeCode,Level,ResourceCode,Amount) VALUES(S.BuildingTypeCode,S.Level,S.ResourceCode,S.Amount);

IF OBJECT_ID('dbo.ec_kingdom_buildings', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ec_kingdom_buildings
    (
        Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ec_kingdom_buildings PRIMARY KEY,
        PublicId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_ec_kingdom_buildings_PublicId DEFAULT NEWID(),
        KingdomId BIGINT NOT NULL, BuildingTypeCode VARCHAR(30) NOT NULL,
        Level INT NOT NULL CONSTRAINT DF_ec_kingdom_buildings_Level DEFAULT 0,
        PositionX INT NOT NULL, PositionY INT NOT NULL,
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_ec_kingdom_buildings_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_ec_kingdom_buildings_PublicId UNIQUE(PublicId),
        CONSTRAINT UQ_ec_kingdom_buildings_Type UNIQUE(KingdomId,BuildingTypeCode),
        CONSTRAINT UQ_ec_kingdom_buildings_Position UNIQUE(KingdomId,PositionX,PositionY),
        CONSTRAINT FK_ec_kingdom_buildings_Kingdom FOREIGN KEY(KingdomId) REFERENCES dbo.ec_kingdoms(Id),
        CONSTRAINT FK_ec_kingdom_buildings_Type FOREIGN KEY(BuildingTypeCode) REFERENCES dbo.ec_building_types(Code),
        CONSTRAINT CK_ec_kingdom_buildings_Level CHECK(Level>=0)
    );
END;

IF OBJECT_ID('dbo.ec_construction_queue', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ec_construction_queue
    (
        Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ec_construction_queue PRIMARY KEY,
        PublicId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_ec_construction_queue_PublicId DEFAULT NEWID(),
        KingdomId BIGINT NOT NULL, KingdomBuildingId BIGINT NOT NULL, BuilderSlot INT NOT NULL,
        FromLevel INT NOT NULL, ToLevel INT NOT NULL, StartedAt DATETIME2(3) NOT NULL, FinishAt DATETIME2(3) NOT NULL,
        CompletedAt DATETIME2(3) NULL, Status VARCHAR(20) NOT NULL CONSTRAINT DF_ec_construction_queue_Status DEFAULT 'ACTIVE',
        RequestId UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT UQ_ec_construction_queue_PublicId UNIQUE(PublicId),
        CONSTRAINT UQ_ec_construction_queue_RequestId UNIQUE(RequestId),
        CONSTRAINT FK_ec_construction_queue_Kingdom FOREIGN KEY(KingdomId) REFERENCES dbo.ec_kingdoms(Id),
        CONSTRAINT FK_ec_construction_queue_Building FOREIGN KEY(KingdomBuildingId) REFERENCES dbo.ec_kingdom_buildings(Id),
        CONSTRAINT CK_ec_construction_queue_Status CHECK(Status IN('ACTIVE','COMPLETED','CANCELLED')),
        CONSTRAINT CK_ec_construction_queue_Levels CHECK(ToLevel=FromLevel+1),
        CONSTRAINT CK_ec_construction_queue_Dates CHECK(FinishAt>=StartedAt)
    );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.ec_construction_queue') AND name='UX_ec_construction_queue_ActiveBuilder')
BEGIN
    CREATE UNIQUE INDEX UX_ec_construction_queue_ActiveBuilder
    ON dbo.ec_construction_queue(KingdomId,BuilderSlot)
    WHERE Status='ACTIVE';
END;

IF NOT EXISTS(SELECT 1 FROM dbo.ec_players WHERE PlayerName=N'Comandante')
BEGIN
    INSERT dbo.ec_players(PlayerName) VALUES(N'Comandante');
    DECLARE @PlayerId BIGINT=SCOPE_IDENTITY();
    INSERT dbo.ec_kingdoms(PlayerId,KingdomName) VALUES(@PlayerId,N'Reino de Elyndor');
    DECLARE @KingdomId BIGINT=SCOPE_IDENTITY();
    INSERT dbo.ec_kingdom_resources(KingdomId,ResourceCode,Amount) VALUES
      (@KingdomId,'FOOD',500),(@KingdomId,'WOOD',500),(@KingdomId,'STONE',500),(@KingdomId,'GOLD',500),(@KingdomId,'GEMS',100);
    INSERT dbo.ec_kingdom_buildings(KingdomId,BuildingTypeCode,Level,PositionX,PositionY) VALUES
      (@KingdomId,'CASTLE',1,0,0),(@KingdomId,'FARM',0,1,1);
END;

PRINT '001_mvp_reino_recursos_granja.sql ejecutado correctamente.';
