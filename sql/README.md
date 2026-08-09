# SQL - Eternal Crown

Esta carpeta contendrá los scripts versionados para SQL Server 2019.

Reglas iniciales:

- Fechas persistentes en UTC con `DATETIME2(3)`.
- Claves internas con `BIGINT IDENTITY`.
- Identificadores públicos con `UNIQUEIDENTIFIER` cuando proceda.
- Recursos con `DECIMAL(19,4)`.
- Toda operación económica crítica debe ser transaccional y trazable.
- Los temporizadores se modelan mediante fechas de inicio/fin; no mediante procesos en espera.

El primer script de esquema se añadirá cuando cerremos la revisión final del modelo MVP v0.1.
