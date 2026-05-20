<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Ejecuta la migración para añadir la columna FEN a una tabla de juegos ya existente
    public function up(): void
    {
        // Medida de seguridad: Validamos que la columna no exista para evitar que la migración falle
        if (!Schema::hasColumn('games', 'fen')) {
            Schema::table('games', function (Blueprint $table) {
                // Aumentamos a 255 para guardar sin problemas el estado completo del tablero, enroques y turnos
                // Se mantiene nullable() por si tienes partidas viejas guardadas que no tenían este dato
                $table->string('fen', 255)->nullable()->after('status');
            });
        }
    }

    // Revierte la migración si hacemos un rollback
    public function down(): void
    {
        // Medida de seguridad: Solo intentamos borrarla si la columna realmente existe
        if (Schema::hasColumn('games', 'fen')) {
            Schema::table('games', function (Blueprint $table) {
                $table->dropColumn('fen');
            });
        }
    }
};
