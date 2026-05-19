<x-app-layout>
    <x-slot name="header">
        <div class="flex items-center justify-between">
            <h2 class="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                ♟ Lobby de Ajedrez
            </h2>
            <form action="{{ route('chess.create') }}" method="POST">
                @csrf
                <button type="submit"
                    class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition">
                    + Nueva Partida
                </button>
            </form>
        </div>
    </x-slot>

    <div class="py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

            <div class="lg:col-span-2 space-y-6">

                @if ($myActiveGame)
                <div class="bg-indigo-50 dark:bg-indigo-900 border border-indigo-200 dark:border-indigo-700 rounded-xl p-5">
                    <h3 class="font-semibold text-indigo-800 dark:text-indigo-200 mb-2">🎮 Tienes una partida activa</h3>
                    <p class="text-sm text-indigo-700 dark:text-indigo-300 mb-3">
                        vs {{ $myActiveGame->white_player_id === auth()->id()
                            ? ($myActiveGame->blackPlayer->name ?? 'Esperando oponente')
                            : $myActiveGame->whitePlayer->name }}
                    </p>
                    <a href="{{ route('chess.game', $myActiveGame->id) }}"
                       class="inline-block px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition">
                        Continuar partida →
                    </a>
                </div>
                @endif

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                        <h3 class="font-semibold text-gray-800 dark:text-gray-200">Partidas disponibles</h3>
                    </div>
                    @forelse ($pendingGames as $game)
                    <div class="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-gray-700 last:border-0">
                        <div>
                            <p class="font-medium text-gray-800 dark:text-gray-200">{{ $game->whitePlayer->name }}</p>
                            <p class="text-xs text-gray-500">ELO {{ $game->whitePlayer->ranking }} · {{ $game->created_at->diffForHumans() }}</p>
                        </div>
                        <form action="{{ route('chess.join', $game->id) }}" method="POST">
                            @csrf
                            <button type="submit"
                                class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition">
                                Unirse
                            </button>
                        </form>
                    </div>
                    @empty
                    <div class="px-6 py-8 text-center text-gray-400 dark:text-gray-500">
                        <p class="text-3xl mb-2">♟</p>
                        <p>No hay partidas disponibles. ¡Crea una!</p>
                    </div>
                    @endforelse
                </div>

                @if ($myGames->count())
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h3 class="font-semibold text-gray-800 dark:text-gray-200">Mis últimas partidas</h3>
                        <a href="{{ route('chess.history') }}" class="text-xs text-indigo-600 hover:underline">Ver todo</a>
                    </div>
                    @foreach ($myGames as $game)
                    <div class="flex items-center justify-between px-6 py-3 border-b border-gray-50 dark:border-gray-700 last:border-0 text-sm">
                        <span class="text-gray-600 dark:text-gray-400">
                            {{ $game->whitePlayer->name }} vs {{ $game->blackPlayer->name ?? '—' }}
                        </span>
                        @if ($game->status === 'draw')
                            <span class="text-yellow-600 font-medium">Tablas</span>
                        @elseif ($game->winner_id === auth()->id())
                            <span class="text-green-600 font-medium">✓ Ganaste</span>
                        @else
                            <span class="text-red-500 font-medium">✗ Perdiste</span>
                        @endif
                    </div>
                    @endforeach
                </div>
                @endif

            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden h-fit">
                <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 class="font-semibold text-gray-800 dark:text-gray-200">🏆 Ranking</h3>
                </div>
                @foreach ($ranking as $i => $player)
                <div class="flex items-center gap-3 px-6 py-3 border-b border-gray-50 dark:border-gray-700 last:border-0
                    {{ $player->id === auth()->id() ? 'bg-indigo-50 dark:bg-indigo-900/30' : '' }}">
                    <span class="w-6 text-center text-sm font-bold
                        {{ $i === 0 ? 'text-yellow-500' : ($i === 1 ? 'text-gray-400' : ($i === 2 ? 'text-amber-600' : 'text-gray-400 dark:text-gray-500')) }}">
                        {{ $i + 1 }}
                    </span>
                    <span class="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {{ $player->name }}
                        @if ($player->id === auth()->id()) <span class="text-indigo-500 text-xs">(tú)</span> @endif
                    </span>
                    <span class="text-sm font-semibold text-gray-600 dark:text-gray-400">{{ $player->ranking }}</span>
                </div>
                @endforeach
            </div>

        </div>
    </div>
</x-app-layout>