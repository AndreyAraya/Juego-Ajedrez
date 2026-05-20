<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Ejecuta las migraciones para construir las tablas en la base de datos
    public function up(): void
    {
        // Tabla principal de usuarios del juego
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');

            // Sistema de ELO: Asignamos 1200 puntos por defecto a cada nuevo jugador
            $table->integer('ranking')->default(1200);

            $table->rememberToken();
            $table->timestamps(); // Crea automáticamente 'created_at' y 'updated_at'
        });

        // Tabla requerida por Laravel para manejar los correos de "Olvidé mi contraseña"
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        // Tabla requerida por Laravel para manejar las sesiones activas de los jugadores
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    // Revierte la migración eliminando las tablas si ejecutamos 'php artisan migrate:rollback'
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
