<x-app-layout>
    <x-slot name="header">
        <div class="flex items-center justify-between">
            <h2 class="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                ♟ Partida #{{ $game->id }}
            </h2>
            <div class="flex items-center gap-4">
                <form action="{{ route('chess.abandon', $game->id) }}" method="POST" class="inline">
                    @csrf
                    <button type="submit"
                        onclick="return confirm('¿Abandonar la partida? El oponente ganará.')"
                        class="text-sm text-red-500 hover:text-red-700">
                        Abandonar
                    </button>
                </form>
                <a href="{{ route('chess.lobby') }}" class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
                    ← Volver al lobby
                </a>
            </div>
        </div>
    </x-slot>

    <script>
        window.CHESS_GAME_ID  = {{ $game->id }};
        window.CHESS_MY_COLOR = "{{ $myColor }}";
        window.CHESS_INIT_FEN = @json($game->fen ?? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        window.CHESS_STATUS   = "{{ $game->status }}";
    </script>

    <style>
        .chess-grid {
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            width: min(80vw, 520px);
            height: min(80vw, 520px);
            border: 3px solid #374151;
            border-radius: 4px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
        .chess-cell {
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; position: relative; transition: background 0.15s;
        }
        .chess-cell.light { background: #f0d9b5; }
        .chess-cell.dark  { background: #b58863; }
        .chess-cell.selected   { background: #f6f669 !important; }
        .chess-cell.highlight  { background: rgba(20, 85, 30, 0.35) !important; }
        .chess-cell.capture    { background: rgba(20, 85, 30, 0.6) !important; }
        .chess-cell.in-check   { background: #e74c3c !important; }
        .chess-cell.flash      { background: #f1c40f !important; }
        .piece {
            font-size: clamp(24px, 5vw, 48px);
            line-height: 1;
            user-select: none;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        .white-piece { filter: drop-shadow(0 1px 1px rgba(0,0,0,0.5)); }
        .black-piece { filter: drop-shadow(0 1px 1px rgba(255,255,255,0.1)); }
        .move-dot {
            width: 30%; height: 30%;
            background: rgba(20, 85, 30, 0.5);
            border-radius: 50%;
        }
        #turn-indicator { font-size: 14px; font-weight: 600; padding: 6px 12px; border-radius: 20px; }
        .turn-mine   { background: #dcfce7; color: #166534; }
        .turn-theirs { background: #f1f5f9; color: #64748b; }
        .game-status { font-size: 13px; padding: 6px 10px; border-radius: 8px; margin-top: 8px; }
        .status-active    { background: #e0f2fe; color: #0369a1; }
        .status-check     { background: #fef9c3; color: #854d0e; }
        .status-checkmate { background: #fee2e2; color: #991b1b; font-weight: 700; }
        .status-draw      { background: #f3f4f6; color: #374151; }
        .status-waiting   { background: #f5f3ff; color: #5b21b6; }
        #move-history { list-style: none; padding: 0; margin: 0; max-height: 300px; overflow-y: auto; }
        #move-history li { padding: 4px 8px; font-size: 12px; color: #374151; border-bottom: 1px solid #f3f4f6; font-family: monospace; }
        .dark #move-history li { color: #e5e7eb; border-bottom-color: #374151; }
    </style>

    <div class="py-8">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex flex-col lg:flex-row gap-6 items-start justify-center">

                <div class="flex flex-col items-center gap-3">
                    <div class="flex items-center gap-2 self-stretch">
                        <div class="w-8 h-8 rounded-full bg-gray-800 dark:bg-gray-600 flex items-center justify-center text-white text-xs font-bold">
                            {{ strtoupper(substr($game->blackPlayer->name ?? '?', 0, 1)) }}
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                {{ $game->blackPlayer->name ?? 'Esperando...' }}
                                @if ($myColor === 'black') <span class="text-xs text-indigo-500">(tú)</span> @endif
                            </p>
                            <p class="text-xs text-gray-500">♟ Negras · ELO {{ $game->blackPlayer->ranking ?? '—' }}</p>
                        </div>
                    </div>

                    <div id="chess-board"></div>

                    <div class="flex items-center gap-2 self-stretch">
                        <div class="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center text-gray-800 text-xs font-bold">
                            {{ strtoupper(substr($game->whitePlayer->name, 0, 1)) }}
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                {{ $game->whitePlayer->name }}
                                @if ($myColor === 'white') <span class="text-xs text-indigo-500">(tú)</span> @endif
                            </p>
                            <p class="text-xs text-gray-500">♙ Blancas · ELO {{ $game->whitePlayer->ranking }}</p>
                        </div>
                    </div>
                </div>

                <div class="w-full lg:w-64 space-y-4">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                        <span id="turn-indicator" class="turn-theirs">Cargando...</span>
                        <div id="game-status" class="game-status status-waiting mt-2">Iniciando...</div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                        <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Movimientos</h4>
                        </div>
                        <div class="p-2">
                            <ul id="move-history">
                                @foreach ($game->moves as $i => $move)
                                <li>{{ $i + 1 }}. {{ $move->piece }} {{ $move->from_square }}→{{ $move->to_square }}</li>
                                @endforeach
                            </ul>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <p>Partida #{{ $game->id }}</p>
                        <p>Iniciada {{ $game->created_at->diffForHumans() }}</p>
                        <p>Jugando con <strong class="text-gray-700 dark:text-gray-300">{{ $myColor === 'white' ? '♙ Blancas' : '♟ Negras' }}</strong></p>
                    </div>
                </div>

            </div>
        </div>
    </div>

    @vite(['resources/css/app.css', 'resources/js/app.js', 'resources/js/game.js'])
</x-app-layout>