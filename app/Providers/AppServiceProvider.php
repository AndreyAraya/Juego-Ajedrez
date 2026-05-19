<?php

namespace App\Providers;
use Illuminate\Support\Facades\URL; // Agregar esto arriba
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
{
    // Agregar esto dentro:
    if (env('APP_ENV') !== 'local' || request()->header('x-forwarded-proto') === 'https') {
        URL::forceScheme('https');
    }
}
}
