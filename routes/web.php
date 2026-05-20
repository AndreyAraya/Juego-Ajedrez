<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\GameController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// ── Rutas de Ajedrez ──────────────────────────────────────────────────────────
Route::middleware(['auth', 'verified'])->prefix('chess')->name('chess.')->group(function () {
    Route::get('/',               [GameController::class, 'index'])->name('lobby');
    Route::post('/create',        [GameController::class, 'store'])->name('create');
    Route::post('/join/{game}',   [GameController::class, 'join'])->name('join');
    Route::get('/game/{game}',    [GameController::class, 'show'])->name('game');
    Route::post('/move/{game}',   [GameController::class, 'move'])->name('move');
    Route::get('/history',        [GameController::class, 'history'])->name('history');

    // Nueva ruta para eliminar la partida
    Route::delete('/game/{game}', [GameController::class, 'destroy'])->name('game.destroy');
});
// ─────────────────────────────────────────────────────────────────────────────

require __DIR__ . '/auth.php';
