<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    use HasFactory;

    protected $fillable = [
        'white_player_id',
        'black_player_id',
        'status',
        'winner_id',
        'fen',
    ];

    const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    public function whitePlayer()
    {
        return $this->belongsTo(User::class, 'white_player_id');
    }

    public function blackPlayer()
    {
        return $this->belongsTo(User::class, 'black_player_id');
    }

    public function winner()
    {
        return $this->belongsTo(User::class, 'winner_id');
    }

    public function moves()
    {
        return $this->hasMany(Move::class)->orderBy('created_at');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isActive(): bool
    {
        return $this->status === 'in_progress';
    }

    public function colorOf(int $userId): ?string
    {
        if ($this->white_player_id === $userId) return 'white';
        if ($this->black_player_id === $userId) return 'black';
        return null;
    }

    public function currentTurn(): string
    {
        return ($this->moves()->count() % 2 === 0) ? 'white' : 'black';
    }
}