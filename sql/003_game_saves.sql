SET NOCOUNT ON;
IF OBJECT_ID(N'dbo.ec_game_saves',N'U') IS NULL
BEGIN
 CREATE TABLE dbo.ec_game_saves(
  PlayerId nvarchar(100) NOT NULL CONSTRAINT PK_ec_game_saves PRIMARY KEY,
  StateJson nvarchar(max) NOT NULL,
  Version bigint NOT NULL CONSTRAINT DF_ec_game_saves_version DEFAULT(0),
  UpdatedAt datetime2(3) NOT NULL CONSTRAINT DF_ec_game_saves_updated DEFAULT(SYSUTCDATETIME()),
  CONSTRAINT CK_ec_game_saves_json CHECK(ISJSON(StateJson)=1)
 );
END;
