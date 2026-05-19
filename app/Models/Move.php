<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Move extends Model
{
    use HasFactory;

    // Campos que permitimos guardar en la BD
    protected $fillable = [
        'game_id',
        'player_id',
        'from_square',
        'to_square',
        'piece'
    ];

    // Relación: Este movimiento pertenece a una partida
    public function game()
    {
        return $this->belongsTo(Game::class);
    }

    // Relación: Este movimiento fue hecho por un jugador
    public function player()
    {
        return $this->belongsTo(User::class, 'player_id');
    }
}
