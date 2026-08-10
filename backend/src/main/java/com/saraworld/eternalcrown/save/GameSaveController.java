package com.saraworld.eternalcrown.save;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/save")
public class GameSaveController {
    private final GameSaveService service;
    public GameSaveController(GameSaveService service){this.service=service;}

    @GetMapping("/{playerId}")
    public GameSaveService.GameSave load(@PathVariable String playerId){return service.load(playerId);}

    @PutMapping("/{playerId}")
    public ResponseEntity<?> save(@PathVariable String playerId,@RequestBody SaveRequest request){
        try{return ResponseEntity.ok(service.save(playerId,request.state(),request.version()));}
        catch(IllegalStateException ex){return ResponseEntity.status(409).body(service.load(playerId));}
    }
    public record SaveRequest(String state,long version){}
}