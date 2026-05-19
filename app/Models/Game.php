<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    use HasFactory;

    // Campos que permitimos guardar en la BD
    protected $fillable = [
        'white_player_id',
        'black_player_id',
        'status',
        'winner_id'
    ];

    // Relación: El jugador de piezas blancas (es un Usuario)
    public function whitePlayer()
    {
        return $this->belongsTo(User::class, 'white_player_id');
    }

    // Relación: El jugador de piezas negras (es un Usuario)
    public function blackPlayer()
    {
        return $this->belongsTo(User::class, 'black_player_id');
    }

    // Relación: El ganador de la partida
    public function winner()
    {
        return $this->belongsTo(User::class, 'winner_id');
    }

    // Relación: Una partida tiene muchos movimientos
    public function moves()
    {
        return $this->hasMany(Move::class);
    }
}
