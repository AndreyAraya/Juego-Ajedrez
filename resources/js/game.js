// RULES (MOTOR MATEMÁTICO OPTIMIZADO)

// Convierte un string FEN (estándar de ajedrez) en un objeto manejable por JavaScript
function fenToState(fen) {
    const parts = fen.split(" ");
    const rows = parts[0].split("/");

    // Mapeamos el tablero reemplazando los números por espacios nulos (casillas vacías)
    const board = rows.map((r) =>
        r.split("").reduce((acc, c) => {
            if (isNaN(c)) acc.push(c);
            else for (let i = 0; i < parseInt(c); i++) acc.push(null);
            return acc;
        }, []),
    );

    return {
        board,
        turn: parts[1] === "w" ? "white" : "black",
        castling: parts[2] || "-",
        ep: parts[3] || "-",
        half: parseInt(parts[4] || "0"),
        full: parseInt(parts[5] || "1"),
    };
}

// Convierte el estado actual del tablero de vuelta a un string FEN para guardarlo en la base de datos
function stateToFen(state) {
    const fenBoard = state.board
        .map((row) => {
            let fen = "",
                empty = 0;
            for (const cell of row) {
                if (cell === null) empty++;
                else {
                    if (empty > 0) {
                        fen += empty;
                        empty = 0;
                    }
                    fen += cell;
                }
            }
            if (empty > 0) fen += empty;
            return fen;
        })
        .join("/");

    const turn = state.turn === "white" ? "w" : "b";
    return `${fenBoard} ${turn} ${state.castling || "-"} ${state.ep || "-"} ${state.half || 0} ${state.full || 1}`;
}

// Utilidades de conversión de coordenadas (ej: de 'e2' a [6, 4])
function squareToIndex(sq) {
    return { row: 8 - parseInt(sq[1]), col: sq.charCodeAt(0) - 97 };
}
function indexToSquare(row, col) {
    return String.fromCharCode(97 + col) + (8 - row);
}

// Utilidades para identificar el color de las piezas (Mayúsculas = Blancas, Minúsculas = Negras)
function isWhitePiece(p) {
    return p && p === p.toUpperCase();
}
function isBlackPiece(p) {
    return p && p === p.toLowerCase();
}
function sameColor(a, b) {
    if (!a || !b) return false;
    return (
        (isWhitePiece(a) && isWhitePiece(b)) ||
        (isBlackPiece(a) && isBlackPiece(b))
    );
}

// Calcula los movimientos legales de un peón (incluyendo primer paso doble y captura al paso)
function pawnMoves(state, row, col) {
    const board = state.board;
    const moves = [];
    const piece = board[row][col];
    const dir = isWhitePiece(piece) ? -1 : 1;
    const startRow = isWhitePiece(piece) ? 6 : 1;

    // Movimiento hacia adelante
    if (board[row + dir]?.[col] === null) {
        moves.push([row + dir, col]);
        if (row === startRow && board[row + dir * 2]?.[col] === null)
            moves.push([row + dir * 2, col]);
    }

    // Capturas diagonales y Peón al paso (En Passant)
    for (const dc of [-1, 1]) {
        const target = board[row + dir]?.[col + dc];
        if (target && !sameColor(piece, target)) {
            moves.push([row + dir, col + dc]);
        } else if (state.ep !== "-") {
            const epRow = 8 - parseInt(state.ep[1]);
            const epCol = state.ep.charCodeAt(0) - 97;
            if (row + dir === epRow && col + dc === epCol)
                moves.push([row + dir, col + dc]);
        }
    }
    return moves;
}

// Función genérica para calcular movimientos de piezas que se deslizan (Torre, Alfil, Reina)
function slidingMoves(board, row, col, directions) {
    const moves = [];
    const piece = board[row][col];
    for (const [dr, dc] of directions) {
        let r = row + dr,
            c = col + dc;
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            if (board[r][c] === null) {
                moves.push([r, c]);
            } else {
                if (!sameColor(piece, board[r][c])) moves.push([r, c]);
                break; // Se detiene al chocar con otra pieza
            }
            r += dr;
            c += dc;
        }
    }
    return moves;
}

// Movimientos específicos por tipo de pieza
function rookMoves(board, row, col) {
    return slidingMoves(board, row, col, [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
    ]);
}
function bishopMoves(board, row, col) {
    return slidingMoves(board, row, col, [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
    ]);
}
function queenMoves(board, row, col) {
    return [...rookMoves(board, row, col), ...bishopMoves(board, row, col)];
}

function knightMoves(board, row, col) {
    const piece = board[row][col];
    return [
        [-2, -1],
        [-2, 1],
        [-1, -2],
        [-1, 2],
        [1, -2],
        [1, 2],
        [2, -1],
        [2, 1],
    ]
        .map(([dr, dc]) => [row + dr, col + dc])
        .filter(
            ([r, c]) =>
                r >= 0 &&
                r < 8 &&
                c >= 0 &&
                c < 8 &&
                !sameColor(piece, board[r][c]),
        );
}

function kingMoves(state, row, col) {
    const board = state.board;
    const piece = board[row][col];
    const moves = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
    ]
        .map(([dr, dc]) => [row + dr, col + dc])
        .filter(
            ([r, c]) =>
                r >= 0 &&
                r < 8 &&
                c >= 0 &&
                c < 8 &&
                !sameColor(piece, board[r][c]),
        );

    // Lógica del Enroque
    const isW = isWhitePiece(piece);
    const rK = isW ? "K" : "k",
        rQ = isW ? "Q" : "q";

    if (
        state.castling.includes(rK) &&
        board[row][5] === null &&
        board[row][6] === null
    )
        moves.push([row, 6]);
    if (
        state.castling.includes(rQ) &&
        board[row][3] === null &&
        board[row][2] === null &&
        board[row][1] === null
    )
        moves.push([row, 2]);

    return moves;
}

// Enrutador de movimientos dependiendo de la letra de la pieza
function rawMoves(state, row, col) {
    const type = state.board[row][col]?.toUpperCase();
    if (type === "P") return pawnMoves(state, row, col);
    if (type === "R") return rookMoves(state.board, row, col);
    if (type === "B") return bishopMoves(state.board, row, col);
    if (type === "N") return knightMoves(state.board, row, col);
    if (type === "Q") return queenMoves(state.board, row, col);
    if (type === "K") return kingMoves(state, row, col);
    return [];
}

// Verifica si el rey de un color específico está bajo amenaza (Jaque)
function isInCheck(state, color) {
    const kingPiece = color === "white" ? "K" : "k";
    let kingRow = -1,
        kingCol = -1;

    for (let r = 0; r < 8; r++)
        for (let c = 0; c < 8; c++)
            if (state.board[r][c] === kingPiece) {
                kingRow = r;
                kingCol = c;
            }

    if (kingRow === -1) return false;

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = state.board[r][c];
            if (!p) continue;
            const isEnemy =
                color === "white" ? isBlackPiece(p) : isWhitePiece(p);
            if (
                isEnemy &&
                rawMoves(state, r, c).some(
                    ([mr, mc]) => mr === kingRow && mc === kingCol,
                )
            )
                return true;
        }
    }
    return false;
}

// Aplica el movimiento al estado matemático de la memoria (sin dibujar en pantalla)
function applyMove(state, fr, fc, tr, tc) {
    const nb = state.board.map((r) => [...r]);
    const piece = nb[fr][fc];
    let ep = "-",
        castling = state.castling,
        half = state.half + 1;

    // Reinicia el contador de la regla de los 50 movimientos si se mueve un peón o se come pieza
    if (piece.toUpperCase() === "P" || nb[tr][tc] !== null) half = 0;

    nb[tr][tc] = piece;
    nb[fr][fc] = null;

    // Coronación automática a Reina
    if (piece === "P" && tr === 0) nb[tr][tc] = "Q";
    if (piece === "p" && tr === 7) nb[tr][tc] = "q";

    // Ejecuta captura de peón al paso
    if (piece.toUpperCase() === "P" && state.ep !== "-") {
        const epRow = 8 - parseInt(state.ep[1]),
            epCol = state.ep.charCodeAt(0) - 97;
        if (tr === epRow && tc === epCol) nb[fr][tc] = null;
    }

    // Registra posibilidad de captura al paso para el siguiente turno
    if (piece.toUpperCase() === "P" && Math.abs(tr - fr) === 2)
        ep = String.fromCharCode(97 + fc) + (8 - (fr + tr) / 2);

    // Ejecuta el movimiento de la torre durante un enroque
    if (piece.toUpperCase() === "K" && Math.abs(tc - fc) === 2) {
        if (tc === 6) {
            nb[tr][5] = nb[tr][7];
            nb[tr][7] = null;
        } else if (tc === 2) {
            nb[tr][3] = nb[tr][0];
            nb[tr][0] = null;
        }
    }

    // Invalida los enroques futuros si se mueve el rey o una de las torres originales
    if (piece === "K") castling = castling.replace("K", "").replace("Q", "");
    if (piece === "k") castling = castling.replace("k", "").replace("q", "");
    if (piece === "R" && fr === 7 && fc === 0)
        castling = castling.replace("Q", "");
    if (piece === "R" && fr === 7 && fc === 7)
        castling = castling.replace("K", "");
    if (piece === "r" && fr === 0 && fc === 0)
        castling = castling.replace("q", "");
    if (piece === "r" && fr === 0 && fc === 7)
        castling = castling.replace("k", "");
    if (!castling) castling = "-";

    return {
        board: nb,
        turn: state.turn === "white" ? "black" : "white",
        castling,
        ep,
        half,
        full: state.turn === "black" ? state.full + 1 : state.full,
    };
}

// Filtra los movimientos crudos para evitar jugadas suicidas (que dejen a tu rey en jaque)
function legalMoves(state, row, col, color) {
    const piece = state.board[row][col];
    if (!piece) return [];
    if (
        (color === "white" && !isWhitePiece(piece)) ||
        (color === "black" && !isBlackPiece(piece))
    )
        return [];

    return rawMoves(state, row, col).filter(([tr, tc]) => {
        const nextState = applyMove(state, row, col, tr, tc);
        if (isInCheck(nextState, color)) return false;

        // Evita enrocar si se está en jaque o si se pasa por una casilla atacada (Regla oficial)
        if (piece.toUpperCase() === "K" && Math.abs(tc - col) === 2) {
            if (isInCheck(state, color)) return false;
            const passCol = col + (tc - col) / 2;
            const passState = applyMove(state, row, col, row, passCol);
            if (isInCheck(passState, color)) return false;
        }
        return true;
    });
}

// Evalúa si el juego terminó
function getGameStatus(state) {
    const inCheck = isInCheck(state, state.turn);
    let hasAnyMove = false;

    outer: for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (legalMoves(state, r, c, state.turn).length > 0) {
                hasAnyMove = true;
                break outer;
            }
        }
    }

    if (!hasAnyMove && inCheck) return "checkmate";
    if (!hasAnyMove && !inCheck) return "draw";
    if (state.half >= 100) return "draw"; // Empate técnico por 50 movimientos
    if (inCheck) return "check";

    return "active";
}

// UI DEL TABLERO (CONECTADA AL NUEVO ESTADO)

const PIECES = {
    K: "♔",
    Q: "♕",
    R: "♖",
    B: "♗",
    N: "♘",
    P: "♙",
    k: "♚",
    q: "♛",
    r: "♜",
    b: "♝",
    n: "♞",
    p: "♟",
};

class ChessBoard {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.myColor = options.myColor || "white";
        this.onMove = options.onMove || (() => {});
        this.state = null;
        this.selected = null;
        this.highlights = [];
        this.locked = false;
        this.status = "active";
        this._buildGrid();
    }

    // Construye el HTML visual del tablero
    _buildGrid() {
        this.container.innerHTML = "";
        this.container.className = "chess-grid";
        this.cells = [];

        for (let r = 0; r < 8; r++) {
            const rowCells = [];
            for (let c = 0; c < 8; c++) {
                const cell = document.createElement("div");
                cell.className =
                    "chess-cell " + ((r + c) % 2 === 0 ? "light" : "dark");
                cell.addEventListener("click", () => this._handleClick(r, c));
                this.container.appendChild(cell);
                rowCells.push(cell);
            }
            this.cells.push(rowCells);
        }

        if (this.myColor === "black")
            this.container.style.transform = "rotate(180deg)";
    }

    loadFen(fen) {
        this.state = fenToState(fen);
        this.status = getGameStatus(this.state);
        this._render();
    }

    applyOpponentMove(from, to, fen) {
        this.state = fenToState(fen);
        this.status = getGameStatus(this.state);
        this.selected = null;
        this.highlights = [];
        this._render();
        this._flashCell(from);
        this._flashCell(to);
    }

    _handleClick(row, col) {
        // CORRECCIÓN: Ahora permitimos hacer clic si el estado es 'active' o 'check'
        if (
            this.locked ||
            (this.status !== "active" && this.status !== "check") ||
            this.state.turn !== this.myColor
        ) {
            return;
        }

        const piece = this.state.board[row][col];

        if (this.selected) {
            if (this.highlights.some(([r, c]) => r === row && c === col)) {
                this._executeMove(
                    this.selected.row,
                    this.selected.col,
                    row,
                    col,
                );
                return;
            }
        }

        if (
            piece &&
            ((this.myColor === "white" && isWhitePiece(piece)) ||
                (this.myColor === "black" && isBlackPiece(piece)))
        ) {
            this.selected = { row, col };
            this.highlights = legalMoves(this.state, row, col, this.myColor);
        } else {
            this.selected = null;
            this.highlights = [];
        }
        this._render();
    }

    _executeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.state.board[fromRow][fromCol];
        const from = indexToSquare(fromRow, fromCol);
        const to = indexToSquare(toRow, toCol);

        this.state = applyMove(this.state, fromRow, fromCol, toRow, toCol);
        this.status = getGameStatus(this.state);

        const fen = stateToFen(this.state);
        this.selected = null;
        this.highlights = [];
        this.locked = true;

        this._render();
        this.onMove({
            from,
            to,
            piece: piece.toUpperCase(),
            fen,
            status: this.status,
        });
    }

    unlock() {
        this.locked = false;
    }

    _render() {
        const inCheck = isInCheck(this.state, this.state.turn);
        let kingPos = null;

        if (inCheck) {
            const kp = this.state.turn === "white" ? "K" : "k";
            for (let r = 0; r < 8; r++)
                for (let c = 0; c < 8; c++)
                    if (this.state.board[r][c] === kp) kingPos = `${r},${c}`;
        }

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = this.cells[r][c];
                const piece = this.state.board[r][c];

                cell.className = `chess-cell ${(r + c) % 2 === 0 ? "light" : "dark"}`;
                cell.innerHTML = "";

                if (this.myColor === "black")
                    cell.style.transform = "rotate(180deg)";

                if (this.selected?.row === r && this.selected?.col === c)
                    cell.classList.add("selected");

                if (this.highlights.some(([hr, hc]) => hr === r && hc === c)) {
                    cell.classList.add("highlight");
                    if (piece) cell.classList.add("capture");
                }

                if (kingPos === `${r},${c}`) cell.classList.add("in-check");

                if (piece) {
                    const isWhite = isWhitePiece(piece);
                    const span = document.createElement("span");

                    // Asignamos la clase 'piece-icon' que definimos en el CSS
                    span.className =
                        "piece-icon " +
                        (isWhite ? "white-piece" : "black-piece");

                    // Mapeo para que la letra FEN sea traducida al carácter correcto de la fuente
                    const iconMap = {
                        K: "♔",
                        Q: "♕",
                        R: "♖",
                        B: "♗",
                        N: "♘",
                        P: "♙",
                        k: "♚",
                        q: "♛",
                        r: "♜",
                        b: "♝",
                        n: "♞",
                        p: "♟",
                    };

                    span.textContent = iconMap[piece];
                    cell.appendChild(span);
                } else if (
                    this.highlights.some(([hr, hc]) => hr === r && hc === c)
                ) {
                    const dot = document.createElement("span");
                    dot.className = "move-dot";
                    cell.appendChild(dot);
                }
            }
        }
    }

    _flashCell(square) {
        const { row, col } = squareToIndex(square);
        const cell = this.cells[row][col];
        cell.classList.add("flash");
        setTimeout(() => cell.classList.remove("flash"), 600);
    }
}

// GAME LOGIC & ECHO

// Leemos las variables globales inyectadas por Laravel Blade
const GAME_ID = window.CHESS_GAME_ID;
const MY_COLOR = window.CHESS_MY_COLOR;
const INIT_FEN = window.CHESS_INIT_FEN;

// Instanciamos el tablero principal
const chess = new ChessBoard("chess-board", {
    myColor: MY_COLOR,
    onMove: handleMyMove,
});

chess.loadFen(INIT_FEN);

// Verificamos el estado inicial de la partida al cargar la página
if (window.CHESS_STATUS === "pending") {
    chess.locked = true;
    updateTurnIndicator("⏳ Esperando oponente...", "waiting");
} else if (
    window.CHESS_STATUS === "finished" ||
    window.CHESS_STATUS === "draw"
) {
    chess.locked = true;
    updateTurnIndicator("🏁 Partida finalizada.", "draw");
} else {
    updateTurnIndicator();
}

// Conectamos WebSockets al canal privado del juego
window.Echo.private(`game.${GAME_ID}`)
    .listen("GameStarted", (e) => {
        chess.locked = false;
        updateTurnIndicator();
    })
    .listen("MoveMade", (e) => {
        chess.applyOpponentMove(e.from, e.to, e.fen);
        chess.unlock();
        addMoveToHistory(e.from, e.to, e.piece);

        if (e.status === "checkmate")
            updateTurnIndicator("☠️ ¡Jaque mate! Has perdido.", "checkmate");
        else if (e.status === "draw")
            updateTurnIndicator("🤝 ¡Empate/Tablas!", "draw");
        else updateTurnIndicator();
    })
    .listen("GameEnded", (e) => {
        chess.locked = true;
        updateTurnIndicator("🏆 ¡El oponente abandonó! Ganaste.", "checkmate");
    });

// Se ejecuta cuando el jugador actual hace un movimiento en su pantalla
async function handleMyMove({ from, to, piece, fen, status }) {
    addMoveToHistory(from, to, piece);

    if (status === "checkmate")
        updateTurnIndicator("♟ ¡Jaque mate! Ganaste.", "checkmate");
    else if (status === "draw")
        updateTurnIndicator("🤝 ¡Empate/Tablas!", "draw");
    else updateTurnIndicator();

    try {
        // Enviamos la jugada al servidor Laravel
        const res = await fetch(`/chess/move/${GAME_ID}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Extraemos el Token de seguridad CSRF
                "X-CSRF-TOKEN": document.querySelector(
                    'meta[name="csrf-token"]',
                ).content,
            },
            body: JSON.stringify({ from, to, piece, fen, status }),
        });

        // Si hay error en el servidor, desbloqueamos para permitir reintentar
        if (!res.ok) chess.unlock();
    } catch (err) {
        console.error(err);
        chess.unlock();
    }
}

// Actualiza el texto y color del indicador de turnos en el HTML
function updateTurnIndicator(customMessage = null, customClass = null) {
    const el = document.getElementById("turn-indicator");
    if (!el) return;

    if (customMessage) {
        el.textContent = customMessage;
        el.className = customClass ? `status-${customClass}` : "turn-mine";
        return;
    }

    const isMyTurn = chess.state.turn === MY_COLOR;
    let msg = isMyTurn ? "🟢 Tu turno" : "⏳ Turno del oponente";
    let type = isMyTurn ? "turn-mine" : "turn-theirs";

    // CORRECCIÓN: Textos más claros para saber de quién es el turno durante un jaque
    if (chess.status === "check") {
        msg = isMyTurn
            ? "⚠️ ¡Jaque! Tu turno"
            : "⏳ ¡Jaque al oponente! Esperando su jugada...";
        type = "status-check";
    }

    el.textContent = msg;
    el.className = type;
}

// Agrega la notación del movimiento a la lista del historial visual
let moveCounter = 0;
function addMoveToHistory(from, to, piece) {
    moveCounter++;
    const list = document.getElementById("move-history");
    if (!list) return;

    const li = document.createElement("li");
    li.textContent = `${moveCounter}. ${piece} ${from}→${to}`;
    list.appendChild(li);
    list.scrollTop = list.scrollHeight; // Auto-scroll hacia abajo
}
