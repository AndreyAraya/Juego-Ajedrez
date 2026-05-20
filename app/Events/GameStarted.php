<?php

namespace App\Events;

use App\Models\Game;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

// Implementamos ShouldBroadcastNow para que la pantalla de espera se quite al instante
class GameStarted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    // Variable para enviar el nombre del rival al frontend
    public string $black_player;

    // Usamos la promoción de propiedades de PHP 8 para declarar la partida directamente en el parámetro
    public function __construct(public Game $game)
    {
        // Extraemos el nombre del jugador de las piezas negras a través de la relación de Eloquent
        // Si por alguna razón la relación falla o está vacía, usamos 'Oponente' como respaldo seguro
        $this->black_player = $this->game->blackPlayer->name ?? 'Oponente';
    }

    // Definimos el canal seguro de WebSockets por donde viajará este mensaje
    public function broadcastOn(): PrivateChannel
    {
        // Apuntamos explícitamente al canal privado de la partida en curso
        // Solo los usuarios autorizados en channels.php podrán escuchar este evento
        return new PrivateChannel('game.' . $this->game->id);
    }
}
