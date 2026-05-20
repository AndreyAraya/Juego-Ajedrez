<?php

namespace App\Http\Controllers;

use App\Events\MoveMade;
use App\Events\GameStarted;
use App\Events\GameEnded;
use App\Models\Game;
use App\Models\Move;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;

class GameController extends Controller
{
    // Muestra la sala de espera (Lobby) con las partidas disponibles, ranking y tu historial
    public function index(): View
    {
        // Buscamos partidas que estén esperando oponente (excluyendo las creadas por el usuario actual)
        $pendingGames = Game::with('whitePlayer')
            ->where('status', 'pending')
            ->where('white_player_id', '!=', Auth::id())
            ->latest()
            ->get();

        // Verificamos si el usuario actual ya tiene una partida en curso para no dejarlo jugar dos a la vez
        $myActiveGame = Game::where('status', 'in_progress')
            ->where(function ($q) {
                $q->where('white_player_id', Auth::id())
                    ->orWhere('black_player_id', Auth::id());
            })
            ->first();

        // Obtenemos el Top 10 de los mejores jugadores según su ELO
        $ranking = \App\Models\User::orderByDesc('ranking')->take(10)->get();

        // Obtenemos las últimas 5 partidas finalizadas del usuario
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

    // Crea una nueva partida donde el usuario actual jugará con las piezas blancas
    public function store(): RedirectResponse
    {
        // Si el usuario ya tiene una partida activa, lo devolvemos a esa partida
        $existing = Game::where('status', 'in_progress')
            ->where(function ($q) {
                $q->where('white_player_id', Auth::id())
                    ->orWhere('black_player_id', Auth::id());
            })->first();

        if ($existing) {
            return redirect()->route('chess.game', $existing->id);
        }

        // Creamos la partida nueva en estado pendiente
        $game = Game::create([
            'white_player_id' => Auth::id(),
            'status'          => 'pending',
            'fen'             => Game::INITIAL_FEN, // Se asume que tienes esta constante en tu modelo Game
        ]);

        return redirect()->route('chess.game', $game->id);
    }

    // Permite a un segundo usuario unirse a una partida pendiente con las piezas negras
    public function join(Game $game): RedirectResponse
    {
        // Evitamos que el creador se una a su propia partida o que se unan a juegos ya iniciados
        if (!$game->isPending() || $game->white_player_id === Auth::id()) {
            return redirect()->route('chess.lobby');
        }

        // Actualizamos la partida asignando las negras y cambiamos el estado a en progreso
        $game->update([
            'black_player_id' => Auth::id(),
            'status'          => 'in_progress',
        ]);

        // Disparamos el WebSocket para avisarle a la pantalla del creador que la partida ha comenzado
        broadcast(new GameStarted($game))->toOthers();

        return redirect()->route('chess.game', $game->id);
    }

    // Muestra el tablero de ajedrez
    public function show(Game $game): View|RedirectResponse
    {
        $userId = Auth::id();

        // Medida de seguridad: Si no eres ni blancas ni negras, no puedes ver el tablero
        if ($game->white_player_id !== $userId && $game->black_player_id !== $userId) {
            return redirect()->route('chess.lobby');
        }

        // Cargamos las relaciones necesarias para optimizar las consultas a la base de datos
        $game->load(['whitePlayer', 'blackPlayer', 'moves.player']);
        $myColor = $game->colorOf($userId); // Asume que tienes este método en el modelo Game

        return view('chess.game', compact('game', 'myColor'));
    }

    // Recibe la jugada desde el Javascript, la valida y actualiza la base de datos
    public function move(Request $request, Game $game): JsonResponse
    {
        $userId = Auth::id();

        // Validamos que la partida no haya terminado
        if (!$game->isActive()) {
            return response()->json(['error' => 'Partida no activa'], 422);
        }

        // Validamos que el usuario solo mueva piezas de su propio color y en su propio turno
        $myColor = $game->colorOf($userId);
        if (!$myColor || $myColor !== $game->currentTurn()) {
            return response()->json(['error' => 'No es tu turno'], 422);
        }

        // Validamos los datos entrantes. Aumentamos el FEN a 255 para prevenir cortes en estados avanzados.
        $request->validate([
            'from'   => 'required|string|size:2',
            'to'     => 'required|string|size:2',
            'piece'  => 'required|string|max:2',
            'fen'    => 'required|string|max:255',
            'status' => 'required|string|in:active,check,checkmate,draw',
        ]);

        // Guardamos el registro del movimiento exacto
        $move = Move::create([
            'game_id'     => $game->id,
            'player_id'   => $userId,
            'from_square' => $request->from,
            'to_square'   => $request->to,
            'piece'       => $request->piece,
        ]);

        $game->fen = $request->fen;

        // Evaluamos el estado reportado por el motor de Javascript
        if ($request->status === 'checkmate') {
            $game->status    = 'finished';
            $game->winner_id = $userId;
            $game->save();
            // Actualizamos los puntos ELO del ganador y el perdedor
            $this->updateRanking($userId, $game->colorOf($userId) === 'white' ? $game->black_player_id : $game->white_player_id);
        } elseif ($request->status === 'draw') {
            $game->status = 'draw';
            $game->save();
        } else {
            $game->save();
        }

        // Emitimos el WebSocket para que el rival vea la pieza moverse al instante
        broadcast(new MoveMade($game, $move, $request->fen, $request->status))->toOthers();

        return response()->json(['ok' => true]);
    }

    // Muestra el historial completo de partidas finalizadas del usuario
    public function history(): View
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

    // Elimina una partida de la base de datos
    public function destroy(Game $game): RedirectResponse
    {
        $userId = Auth::id();

        // Evita que borres partidas de otras personas
        if ($game->white_player_id !== $userId && $game->black_player_id !== $userId) {
            return back()->with('error', 'No tienes permiso para eliminar esta partida.');
        }

        // Evita borrar partidas que se están jugando actualmente
        if ($game->status === 'in_progress') {
            return back()->with('error', 'No puedes eliminar una partida que está en progreso.');
        }

        $game->delete();

        return redirect()->route('chess.lobby')->with('success', 'Partida eliminada correctamente.');
    }

    // Método privado auxiliar para sumar/restar puntos de ranking (ELO)
    private function updateRanking(int $winnerId, int $loserId): void
    {
        // El ganador gana 20 puntos, el perdedor pierde 20
        \App\Models\User::where('id', $winnerId)->increment('ranking', 20);
        \App\Models\User::where('id', $loserId)->decrement('ranking', 20);
    }

    // Permite rendirse en medio de una partida
    public function abandon(Game $game): RedirectResponse
    {
        $userId = Auth::id();

        // Validación de permisos
        if ($game->white_player_id !== $userId && $game->black_player_id !== $userId) {
            return redirect()->route('chess.lobby');
        }

        if ($game->status !== 'in_progress') {
            return redirect()->route('chess.lobby');
        }

        // El rival es declarado ganador automáticamente
        $winnerId = $game->white_player_id === $userId ? $game->black_player_id : $game->white_player_id;

        $game->update([
            'status'    => 'finished',
            'winner_id' => $winnerId,
        ]);

        $this->updateRanking($winnerId, $userId);

        // Disparamos el WebSocket para bloquear el tablero del rival y avisarle que ganó
        broadcast(new GameEnded($game))->toOthers();

        return redirect()->route('chess.lobby');
    }
}
