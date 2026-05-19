<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('game.{gameId}', function ($user, $gameId) {
    $game = \App\Models\Game::find($gameId);
    if (!$game) return false;
    return $game->white_player_id === $user->id || $game->black_player_id === $user->id;
});