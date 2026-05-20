<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Ejecuta la migración para agregar el sistema de ELO a usuarios existentes
    public function up(): void
    {
        // Medida de seguridad: Validamos que la columna no exista para evitar que la base de datos colapse
        if (!Schema::hasColumn('users', 'ranking')) {
            Schema::table('users', function (Blueprint $table) {
                // Usamos 1200 puntos por defecto para mantener la consistencia con el ELO oficial
                $table->integer('ranking')->default(1200);
            });
        }
    }

    // Revierte la migración si hacemos un rollback
    public function down(): void
    {
        // Medida de seguridad: Solo intentamos borrarla si la columna realmente existe
        if (Schema::hasColumn('users', 'ranking')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('ranking');
            });
        }
    }
};
