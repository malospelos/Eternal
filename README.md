# Eternal Crown

Eternal Crown es un juego web de estrategia medieval fantastica persistente, disenado para navegador y preparado para integrarse posteriormente en aplicaciones moviles mediante un contenedor.

## Objetivo del MVP v0.1

Validar el bucle principal:

1. Crear un reino.
2. Producir recursos de forma persistente.
3. Construir y mejorar edificios con temporizadores reales.
4. Entrenar unidades.
5. Explorar un mapa PvE.
6. Combatir contra campamentos de bandidos.
7. Obtener recompensas y progresar.
8. Cerrar el juego y comprobar al volver que construcciones y produccion han continuado.

## Stack inicial

- Backend: Java 17 + Spring Boot 3
- Base de datos: SQL Server 2019
- Frontend: TypeScript + Phaser 3
- API: REST
- Tiempo real futuro: WebSocket
- App movil futura: Capacitor
- Infraestructura: Docker + Nginx

## Principios

- El servidor es la autoridad sobre recursos, tiempos, recompensas y estado del juego.
- El cliente nunca decide saldos ni resultados economicos.
- Producciones, costes, tiempos y recompensas deben ser configurables y no quedar hardcodeados en el cliente.
- La experiencia inicial debe ser extremadamente clara: el jugador siempre debe saber que hacer a continuacion.
- El MVP se centra en PvE y deja fuera PvP, alianzas, temporadas y monetizacion real hasta validar el nucleo jugable.

## Estructura prevista

```text
backend/   Spring Boot
frontend/  TypeScript + Phaser
sql/       Scripts SQL Server
 docs/      Documentacion funcional y tecnica
```

## Primer hito

El primer hito funcional sera:

> El jugador entra, ve su castillo, construye una granja, cierra el navegador, vuelve mas tarde y comprueba que la construccion y la produccion han continuado correctamente.
