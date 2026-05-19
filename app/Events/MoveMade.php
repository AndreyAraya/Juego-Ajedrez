<?php

namespace App\Events;

use App\Models\Game;
use App\Models\Move;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MoveMade implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Game   $game,
        public Move   $move,
        public string $fen,
        public string $status
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('game.' . $this->game->id)];
    }

    public function broadcastWith(): array
    {
        return [
            'from'   => $this->move->from_square,
            'to'     => $this->move->to_square,
            'piece'  => $this->move->piece,
            'fen'    => $this->fen,
            'status' => $this->status,
            'player' => $this->move->player_id,
        ];
    }
}