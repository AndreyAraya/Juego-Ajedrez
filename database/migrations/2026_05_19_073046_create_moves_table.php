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
        Schema::create('moves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained('games')->onDelete('cascade');
            $table->foreignId('player_id')->constrained('users');

            // Casilla de origen y destino (Ej: 'e2' a 'e4')
            $table->string('from_square', 2);
            $table->string('to_square', 2);

            // Pieza que se movió (Ej: 'P' para peón, 'N' para caballo)
            $table->string('piece')->nullable();

            $table->timestamps(); // Para saber el orden exacto de los turnos
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('moves');
    }
};
