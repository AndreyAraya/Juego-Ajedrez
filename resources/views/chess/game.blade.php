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

    <link href="https://cdnjs.cloudflare.com/ajax/libs/chess-icons/1.0.0/css/chess-icons.min.css" rel="stylesheet">

    <script>
        window.CHESS_GAME_ID = '{{ $game->id }}';
        window.CHESS_MY_COLOR = '{{ $myColor }}';
        window.CHESS_INIT_FEN = "{!! $game->fen ?? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' !!}";
        window.CHESS_STATUS = '{{ $game->status }}';
    </script>

    <style>
        /* Estructura del Tablero */
        .chess-grid {
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            width: min(80vw, 520px);
            height: min(80vw, 520px);
            border: 4px solid #374151;
            border-radius: 4px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }

        .chess-cell {
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            position: relative;
        }

        .chess-cell.light {
            background: #f0d9b5;
        }

        .chess-cell.dark {
            background: #b58863;
        }

        .chess-cell.selected {
            background: #f6f669 !important;
        }

        .chess-cell.highlight {
            background: rgba(20, 85, 30, 0.35) !important;
        }

        .chess-cell.capture {
            background: rgba(20, 85, 30, 0.6) !important;
        }

        .chess-cell.in-check {
            background: #e74c3c !important;
        }

        /* Iconos de piezas (ChessIcons) */
        .piece-icon {
            font-family: 'ChessIcons' !important;
            font-size: 45px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            user-select: none;
        }

        .black-piece {
            color: #000000 !important;
            text-shadow: 0 0 1px #ffffff;
        }

        .white-piece {
            color: #ffffff !important;
            text-shadow: 0 0 2px #000000;
        }

        /* Indicador de turno */
        #turn-indicator {
            font-size: 14px;
            font-weight: 700;
            padding: 10px 20px;
            border-radius: 8px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            text-align: center;
        }

        .turn-mine {
            background: #059669;
            color: #ffffff;
        }

        .turn-theirs {
            background: #475569;
            color: #ffffff;
        }

        .status-check {
            background: #d97706;
            color: #ffffff;
        }

        /* Historial */
        #move-history {
            list-style: none;
            padding: 0;
            margin: 0;
            max-height: 300px;
            overflow-y: auto;
        }

        #move-history li {
            padding: 8px;
            font-size: 13px;
            color: #6f7581;
            border-bottom: 1px solid #e5e7eb;
            font-family: monospace;
        }

        /* Dark Mode Ajustes */
        .dark #move-history li {
            color: #d1d5db;
            border-bottom-color: #374151;
        }
    </style>

    <div class="py-8">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex flex-col lg:flex-row gap-6 items-start justify-center">

                <div class="flex flex-col items-center gap-3">
                    <div id="chess-board"></div>
                </div>

                <div class="w-full lg:w-64 space-y-4">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center">
                        <div id="turn-indicator" class="turn-theirs">Cargando...</div>
                    </div>

                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                        <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Historial</h4>
                        </div>
                        <ul id="move-history" class="p-2"></ul>
                    </div>
                </div>

            </div>
        </div>
    </div>

    @vite(['resources/js/app.js', 'resources/js/game.js'])
</x-app-layout>