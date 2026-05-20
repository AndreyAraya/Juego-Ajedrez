<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
// Importamos la clase BelongsTo para darle un tipado estricto a las relaciones
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Move extends Model
{
    use HasFactory;

    // Protegemos la base de datos definiendo exactamente qué columnas se pueden llenar desde el controlador
    protected $fillable = [
        'game_id',
        'player_id',
        'from_square',
        'to_square',
        'piece'
    ];

    // Relación: Cada movimiento pertenece a una única partida
    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    // Relación: Cada movimiento es ejecutado por un único jugador
    // Especificamos 'player_id' porque el nombre de la función (player) no coincide exactamente con 'user_id'
    public function player(): BelongsTo
    {
        return $this->belongsTo(User::class, 'player_id');
    }
}
