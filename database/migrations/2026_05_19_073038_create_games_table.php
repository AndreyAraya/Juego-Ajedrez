<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Ejecuta la migración para crear la tabla de partidas en la base de datos
    public function up(): void
    {
        Schema::create('games', function (Blueprint $table) {
            $table->id();

            // Relación con el jugador que controla las piezas blancas (siempre obligatorio al crear)
            $table->foreignId('white_player_id')->constrained('users');

            // Relación con el jugador que controla las negras (permite nulos porque se unen después)
            $table->foreignId('black_player_id')->nullable()->constrained('users');

            // Estado actual de la partida para controlar el flujo en el lobby
            $table->enum('status', ['pending', 'in_progress', 'finished', 'draw'])->default('pending');

            // Posición exacta del tablero. Aumentamos a 255 para coincidir con el GameController y evitar cortes
            $table->string('fen', 255);

            // Relación con el jugador que ganó la partida (nulo si es empate o sigue en progreso)
            $table->foreignId('winner_id')->nullable()->constrained('users');

            // Crea automáticamente las columnas 'created_at' y 'updated_at'
            $table->timestamps();
        });
    }

    // Revierte la migración eliminando la tabla si ejecutamos 'php artisan migrate:rollback'
    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};
