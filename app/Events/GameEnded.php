<?php

namespace App\Events;

use App\Models\Game;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
// Mantenemos ShouldBroadcastNow para que la notificación de abandono sea instantánea
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

// Evento que se dispara cuando un jugador presiona el botón de "Abandonar"
class GameEnded implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    // Usamos la promoción de propiedades de PHP 8 para declarar y asignar $game en un solo paso
    public function __construct(public Game $game)
    {
        // No necesitamos código extra aquí, PHP 8 asigna $this->game automáticamente
    }

    // Definimos el canal de WebSockets por donde viajará esta alerta
    public function broadcastOn(): array
    {
        // Retornamos el canal privado de esta partida específica para no alertar a otros juegos
        return [
            new PrivateChannel('game.' . $this->game->id)
        ];
    }
}
