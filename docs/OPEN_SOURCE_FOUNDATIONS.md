# Eternal Crown — Fundaciones inspiradas en TravianZ y OpenFrontIO

## Objetivo

Usar ambos proyectos como referencias de ingeniería y diseño sin convertir Eternal Crown en un derivado directo de su código.

## Regla de licencias

- TravianZ: GPL-3.0. Se usa como especificación funcional y referencia de mecánicas. No se copia código PHP al producto.
- OpenFrontIO: AGPL-3.0. Se estudian arquitectura, algoritmos y patrones. No se copia código fuente al producto.
- OpenFrontIO `/resources`: CC BY-SA 4.0. Solo se reutilizarán assets individualmente revisados, con atribución y cumplimiento de Share-Alike.
- OpenFrontIO `/proprietary`: prohibido reutilizar.

## Mapa de aprovechamiento

| Sistema | Referencia principal | Estrategia Eternal |
|---|---|---|
| Recursos y producción | TravianZ | Reimplementación propia, cálculo offline autoritativo |
| Construcción | TravianZ | Requisitos declarativos + cola transaccional |
| Tropas y entrenamiento | TravianZ | Colas, costes y tiempos propios |
| Combate | Ambos | Reglas propias + simulador determinista |
| Mapa mundial | OpenFrontIO | Tiles compactos, búsquedas y estado binario |
| Multijugador | OpenFrontIO | Cliente predictivo + servidor autoritativo |
| Alianzas | Ambos | Roles, diplomacia, bonuses y chat propios |
| Héroe | TravianZ | Stats, equipo, aventuras y progresión propios |
| Replays | OpenFrontIO | Semilla + comandos + ticks deterministas |
| Anti-exploit | Ambos | Idempotencia, locks, auditoría y validación servidor |

## Arquitectura objetivo

### Cliente

- `src/core`: simulación determinista sin DOM ni Phaser.
- `src/render`: representación Phaser/WebGL.
- `src/ui`: HUD, ventanas y navegación.
- `src/net`: transporte HTTP/WebSocket y sincronización.

### Servidor

Spring Boot es la autoridad final sobre economía, construcción, entrenamiento, combate, mapa, alianzas y persistencia.

## Primer bloque implementado

Esta rama introduce un núcleo TypeScript propio para:

1. PRNG determinista.
2. Mapa compacto por tiles con búsquedas BFS/círculo y propiedad.
3. Economía de recursos con producción y consumo seguros.
4. Cola de construcción determinista.
5. Simulador de combate reproducible mediante semilla.
6. `EternalSimulation`, fachada que integra los subsistemas.

El código es original de Eternal Crown y no copia implementaciones GPL/AGPL.