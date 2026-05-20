<?php

namespace App\Http\Controllers;

use App\Events\MoveMade;
use App\Events\GameStarted;
use App\Models\Game;
use App\Models\Move;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GameController extends Controller
{
    // Lobby: lista partidas disponibles + ranking
    public function index()
    {
        $pendingGames = Game::with('whitePlayer')
            ->where('status', 'pending')
            ->where('white_player_id', '!=', Auth::id())
            ->latest()
            ->get();

        $myActiveGame = Game::where('status', 'in_progress')
            ->where(function ($q) {
                $q->where('white_player_id', Auth::id())
                    ->orWhere('black_player_id', Auth::id());
            })
            ->first();

        $ranking = \App\Models\User::orderByDesc('ranking')->take(10)->get();

        $myGames = Game::with(['whitePlayer', 'blackPlayer', 'winner'])
            ->where('status', 'finished')
            ->where(function ($q) {
                $q->where('white_player_id', Auth::id())
                    ->orWhere('black_player_id', Auth::id());
            })
            ->latest()
            ->take(5)
            ->get();

        return view('chess.lobby', compact('pendingGames', 'myActiveGame', 'ranking', 'myGames'));
    }

    // Crear nueva partida
    public function store()
    {
        $existing = Game::where('status', 'in_progress')
            ->where(function ($q) {
                $q->where('white_player_id', Auth::id())
                    ->orWhere('black_player_id', Auth::id());
            })->first();

        if ($existing) {
            return redirect()->route('chess.game', $existing->id);
        }

        $game = Game::create([
            'white_player_id' => Auth::id(),
            'status'          => 'pending',
            'fen'             => Game::INITIAL_FEN,
        ]);

        return redirect()->route('chess.game', $game->id);
    }

    // Unirse a una partida existente como negras
    public function join(Game $game)
    {
        if (!$game->isPending() || $game->white_player_id === Auth::id()) {
            return redirect()->route('chess.lobby');
        }

        $game->update([
            'black_player_id' => Auth::id(),
            'status'          => 'in_progress',
        ]);

        broadcast(new GameStarted($game))->toOthers();

        return redirect()->route('chess.game', $game->id);
    }

    // Ver el tablero de una partida
    public function show(Game $game)
    {
        $userId = Auth::id();

        if ($game->white_player_id !== $userId && $game->black_player_id !== $userId) {
            return redirect()->route('chess.lobby');
        }

        $game->load(['whitePlayer', 'blackPlayer', 'moves.player']);
        $myColor = $game->colorOf($userId);

        return view('chess.game', compact('game', 'myColor'));
    }

    // Procesar un movimiento
    public function move(Request $request, Game $game)
    {
        $userId = Auth::id();

        if (!$game->isActive()) {
            return response()->json(['error' => 'Partida no activa'], 422);
        }

        $myColor = $game->colorOf($userId);
        if (!$myColor || $myColor !== $game->currentTurn()) {
            return response()->json(['error' => 'No es tu turno'], 422);
        }

        $request->validate([
            'from'   => 'required|string|size:2',
            'to'     => 'required|string|size:2',
            'piece'  => 'required|string|max:2',
            'fen'    => 'required|string|max:100',
            'status' => 'required|string|in:active,check,checkmate,draw',
        ]);

        $move = Move::create([
            'game_id'     => $game->id,
            'player_id'   => $userId,
            'from_square' => $request->from,
            'to_square'   => $request->to,
            'piece'       => $request->piece,
        ]);

        $game->fen = $request->fen;

        if ($request->status === 'checkmate') {
            $game->status    = 'finished';
            $game->winner_id = $userId;
            $game->save();
            $this->updateRanking($userId, $game->colorOf($userId) === 'white' ? $game->black_player_id : $game->white_player_id);
        } elseif ($request->status === 'draw') {
            $game->status = 'draw';
            $game->save();
        } else {
            $game->save();
        }

        broadcast(new MoveMade($game, $move, $request->fen, $request->status))->toOthers();

        return response()->json(['ok' => true]);
    }

    // Historial de partidas del usuario
    public function history()
    {
        $games = Game::with(['whitePlayer', 'blackPlayer', 'winner'])
            ->where(function ($q) {
                $q->where('white_player_id', Auth::id())
                    ->orWhere('black_player_id', Auth::id());
            })
            ->whereIn('status', ['finished', 'draw'])
            ->latest()
            ->paginate(10);

        return view('chess.history', compact('games'));
    }

    // Eliminar una partida
    public function destroy(Game $game)
    {
        $userId = Auth::id();

        // Seguridad: Verificar que el usuario sea uno de los jugadores de esta partida
        if ($game->white_player_id !== $userId && $game->black_player_id !== $userId) {
            return back()->with('error', 'No tienes permiso para eliminar esta partida.');
        }

        // Eliminar la partida
        $game->delete();

        return redirect()->route('chess.lobby')->with('success', 'Partida eliminada correctamente.');
    }

    // Ranking ELO simple
    private function updateRanking(int $winnerId, int $loserId): void
    {
        \App\Models\User::where('id', $winnerId)->increment('ranking', 20);
        \App\Models\User::where('id', $loserId)->decrement('ranking', 20);
    }
public function abandon(Game $game)
{
    $userId = Auth::id();
    if ($game->white_player_id !== $userId && $game->black_player_id !== $userId) {
        return redirect()->route('chess.lobby');
    }
    $winnerId = $game->white_player_id === $userId ? $game->black_player_id : $game->white_player_id;
    $game->update([
        'status'    => 'finished',
        'winner_id' => $winnerId,
    ]);
    return redirect()->route('chess.lobby');
}

}
