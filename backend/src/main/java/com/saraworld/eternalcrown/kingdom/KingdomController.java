package com.saraworld.eternalcrown.kingdom;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/kingdom")
public class KingdomController {

    private final KingdomService kingdomService;

    public KingdomController(KingdomService kingdomService) {
        this.kingdomService = kingdomService;
    }

    @GetMapping
    public KingdomStateResponse getKingdom() {
        return kingdomService.getDemoKingdomState();
    }

    @PostMapping("/farm/upgrade")
    public ResponseEntity<KingdomStateResponse> upgradeFarm(@Valid @RequestBody UpgradeFarmRequest request) {
        return ResponseEntity.ok(kingdomService.startFarmUpgrade(request.requestId()));
    }

    public record UpgradeFarmRequest(@NotNull UUID requestId) {
    }
}
