<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
            {{ __('Dashboard') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
            <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                <div class="p-6 text-gray-900 dark:text-gray-100">
                    Bienvenido, {{ Auth::user()->name }}. ELO actual: <strong>{{ Auth::user()->ranking }}</strong>
                </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <a href="{{ route('chess.lobby') }}"
                   class="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 flex items-center gap-4 hover:shadow-md transition group">
                    <span class="text-4xl">♟</span>
                    <div>
                        <p class="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-indigo-600">Jugar</p>
                        <p class="text-xs text-gray-500">Ir al lobby</p>
                    </div>
                </a>
                <a href="{{ route('chess.history') }}"
                   class="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 flex items-center gap-4 hover:shadow-md transition group">
                    <span class="text-4xl">📋</span>
                    <div>
                        <p class="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-indigo-600">Historial</p>
                        <p class="text-xs text-gray-500">Mis partidas</p>
                    </div>
                </a>
                <div class="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 flex items-center gap-4">
                    <span class="text-4xl">🏆</span>
                    <div>
                        <p class="font-semibold text-gray-800 dark:text-gray-200">Mi ELO</p>
                        <p class="text-2xl font-bold text-indigo-600">{{ Auth::user()->ranking }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-app-layout>