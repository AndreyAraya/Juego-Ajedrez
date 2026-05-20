<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
// Importamos la clase HasMany para el tipado estricto de las relaciones
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    // Atributos que permitimos guardar masivamente en la base de datos (incluyendo el ELO/ranking)
    protected $fillable = [
        'name',
        'email',
        'password',
        'ranking',
    ];

    // Atributos que se ocultan por seguridad cuando el usuario se envía como respuesta JSON o Array
    protected $hidden = [
        'password',
        'remember_token',
    ];

    // Le indica a Laravel cómo transformar ciertos datos al leerlos o guardarlos
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed', // Hashea la contraseña automáticamente al guardar
        ];
    }

    // --- RELACIONES PARA EL AJEDREZ ---

    // Relación: Un usuario puede crear/jugar muchas partidas utilizando las piezas blancas
    public function gamesAsWhite(): HasMany
    {
        return $this->hasMany(Game::class, 'white_player_id');
    }

    // Relación: Un usuario puede unirse/jugar muchas partidas utilizando las piezas negras
    public function gamesAsBlack(): HasMany
    {
        return $this->hasMany(Game::class, 'black_player_id');
    }

    // Relación: Un usuario puede tener un registro de todos los movimientos que ha hecho históricamente
    public function moves(): HasMany
    {
        return $this->hasMany(Move::class, 'player_id');
    }
}
