<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
// Importamos las clases de relaciones para el tipado estricto
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Game extends Model
{
    use HasFactory;

    // Campos que se pueden llenar masivamente al crear o actualizar una partida
    protected $fillable = [
        'white_player_id',
        'black_player_id',
        'status',
        'winner_id',
        'fen',
    ];

    // Constante con la posición inicial estándar de todas las piezas en formato FEN
    const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    // Relación: Una partida pertenece a un jugador que lleva las blancas
    public function whitePlayer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'white_player_id');
    }

    // Relación: Una partida pertenece a un jugador que lleva las negras
    public function blackPlayer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'black_player_id');
    }

    // Relación: Una partida puede tener un jugador ganador
    public function winner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'winner_id');
    }

    // Relación: Una partida tiene muchos movimientos (ordenados del más antiguo al más reciente)
    public function moves(): HasMany
    {
        return $this->hasMany(Move::class)->orderBy('created_at');
    }

    // Verifica si la partida está esperando a que se una el segundo jugador
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    // Verifica si la partida se está jugando actualmente
    public function isActive(): bool
    {
        return $this->status === 'in_progress';
    }

    // Devuelve qué color está jugando un usuario específico en esta partida
    public function colorOf(int $userId): ?string
    {
        if ($this->white_player_id === $userId) return 'white';
        if ($this->black_player_id === $userId) return 'black';

        return null;
    }

    // Devuelve de quién es el turno actualmente ('white' o 'black')
    public function currentTurn(): string
    {
        // OPTIMIZACIÓN: Leemos de quién es el turno directamente desde el FEN
        // El formato FEN tiene el turno en la segunda posición separada por un espacio (ej: "... w ...")
        // Esto evita hacer una consulta SQL pesada a la tabla de movimientos
        $fenParts = explode(' ', $this->fen);

        // Extraemos la letra (w o b). Si por algún error el FEN está vacío, asumimos 'w'
        $turnChar = $fenParts[1] ?? 'w';

        return $turnChar === 'w' ? 'white' : 'black';
    }
}
