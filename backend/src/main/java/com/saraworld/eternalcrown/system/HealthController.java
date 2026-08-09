package com.saraworld.eternalcrown.system;

import java.time.Instant;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
            "game", "Eternal Crown",
            "status", "UP",
            "version", "0.1.0",
            "serverTime", Instant.now().toString()
        );
    }
}
