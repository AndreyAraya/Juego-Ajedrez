<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Ejecuta la migración para crear la tabla de historial de movimientos
    public function up(): void
    {
        Schema::create('moves', function (Blueprint $table) {
            $table->id();

            // Relación con la partida. 'cascade' borra el historial si la partida es eliminada
            $table->foreignId('game_id')->constrained('games')->onDelete('cascade');

            // Relación con el usuario que ejecutó este movimiento
            $table->foreignId('player_id')->constrained('users');

            // Casilla de origen y destino (Ej: 'e2' a 'e4') limitadas a 2 caracteres
            $table->string('from_square', 2);
            $table->string('to_square', 2);

            // Pieza que se movió (Ej: 'P'). Limitada a 2 caracteres y obligatoria para proteger la BD
            $table->string('piece', 2);

            // Registra el momento exacto para saber el orden cronológico de los turnos
            $table->timestamps();
        });
    }

    // Revierte la migración eliminando la tabla de la base de datos
    public function down(): void
    {
        Schema::dropIfExists('moves');
    }
};
