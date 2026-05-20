<?php

namespace App\Events;

use App\Models\Game;
use App\Models\Move;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
// Importamos ShouldBroadcastNow para que el WebSocket se envíe al instante y no se quede atascado en colas
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

// Implementamos ShouldBroadcastNow para garantizar el tiempo real sin demoras
class MoveMade implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    // Usamos la promoción de propiedades de PHP 8 para declarar y asignar variables limpiamente
    public function __construct(
        public Game   $game,   // La instancia de la partida actual
        public Move   $move,   // El registro del movimiento recién guardado en la base de datos
        public string $fen,    // La nueva posición del tablero en formato matemático FEN
        public string $status  // El estado de la partida tras el movimiento (active, check, checkmate, draw)
    ) {}

    // Define en qué canal exacto de WebSocket se va a emitir este mensaje
    public function broadcastOn(): array
    {
        // Usamos un PrivateChannel con el ID de la partida para que nadie fuera de este juego pueda espiar los movimientos
        return [new PrivateChannel('game.' . $this->game->id)];
    }

    // Define exactamente qué paquete de datos va a recibir tu archivo JavaScript en el frontend
    public function broadcastWith(): array
    {
        return [
            'from'   => $this->move->from_square, // Casilla de origen (ej. e2)
            'to'     => $this->move->to_square,   // Casilla de destino (ej. e4)
            'piece'  => $this->move->piece,       // Letra de la pieza movida (ej. P)
            'fen'    => $this->fen,               // El FEN actualizado para sincronizar el tablero del rival
            'status' => $this->status,            // El estado para que el JS sepa si lanzar alertas de jaque o victoria
            'player' => $this->move->player_id,   // El ID del jugador que realizó la jugada
        ];
    }
}
