<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('games', function (Blueprint $table) {
            $table->id();

            // Jugadores (Relacionados con la tabla usuarios)
            $table->foreignId('white_player_id')->constrained('users');
            $table->foreignId('black_player_id')->nullable()->constrained('users');

            // Estado del juego
            $table->enum('status', ['pending', 'in_progress', 'finished', 'draw'])->default('pending');

            // Ganador (nulo si es empate o no ha terminado)
            $table->foreignId('winner_id')->nullable()->constrained('users');

            $table->timestamps(); // Guarda cuándo empezó y terminó la partida
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};
