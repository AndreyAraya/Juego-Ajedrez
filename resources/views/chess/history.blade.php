<x-app-layout>
    <x-slot name="header">
        <div class="flex items-center gap-4">
            <a href="{{ route('chess.lobby') }}" class="text-gray-500 hover:text-gray-700 dark:text-gray-400">←</a>
            <h2 class="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                Historial de Partidas
            </h2>
        </div>
    </x-slot>

    <div class="py-8">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">#</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Jugadores</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Resultado</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Movimientos</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                        @forelse ($games as $game)
                        <tr class="hover:bg-gray-50 dark:hover:bg-gray-750">
                            <td class="px-6 py-4 text-gray-500 dark:text-gray-400">#{{ $game->id }}</td>
                            <td class="px-6 py-4">
                                <span class="text-gray-800 dark:text-gray-200">{{ $game->whitePlayer->name }}</span>
                                <span class="text-gray-400 mx-1">vs</span>
                                <span class="text-gray-800 dark:text-gray-200">{{ $game->blackPlayer->name ?? '—' }}</span>
                            </td>
                            <td class="px-6 py-4">
                                @if ($game->status === 'draw')
                                    <span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Tablas</span>
                                @elseif ($game->winner_id === auth()->id())
                                    <span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">✓ Ganaste</span>
                                @else
                                    <span class="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">✗ Perdiste</span>
                                @endif
                            </td>
                            <td class="px-6 py-4 text-gray-500 dark:text-gray-400">{{ $game->moves->count() }}</td>
                            <td class="px-6 py-4 text-gray-500 dark:text-gray-400">{{ $game->updated_at->format('d/m/Y') }}</td>
                        </tr>
                        @empty
                        <tr>
                            <td colspan="5" class="px-6 py-12 text-center text-gray-400">No tienes partidas registradas aún.</td>
                        </tr>
                        @endforelse
                    </tbody>
                </table>
                @if ($games->hasPages())
                <div class="px-6 py-4 border-t border-gray-100 dark:border-gray-700">
                    {{ $games->links() }}
                </div>
                @endif
            </div>
        </div>
    </div>
</x-app-layout>