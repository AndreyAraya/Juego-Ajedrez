// RULES (MOTOR MATEMÁTICO OPTIMIZADO)

function fenToState(fen) {
    const parts = fen.split(" ");
    const rows = parts[0].split("/");
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

function stateToFen(state) {
    const fenBoard = state.board
        .map((row) => {
            let fen = "", empty = 0;
            for (const cell of row) {
                if (cell === null) empty++;
                else {
                    if (empty > 0) { fen += empty; empty = 0; }
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

function squareToIndex(sq) {
    return { row: 8 - parseInt(sq[1]), col: sq.charCodeAt(0) - 97 };
}

function indexToSquare(row, col) {
    return String.fromCharCode(97 + col) + (8 - row);
}

function isWhitePiece(p) { return p && p === p.toUpperCase(); }
function isBlackPiece(p) { return p && p === p.toLowerCase(); }
function sameColor(a, b) {
    if (!a || !b) return false;
    return (isWhitePiece(a) && isWhitePiece(b)) || (isBlackPiece(a) && isBlackPiece(b));
}

function pawnMoves(state, row, col) {
    const board = state.board;
    const moves = [];
    const piece = board[row][col];
    const dir = isWhitePiece(piece) ? -1 : 1;
    const startRow = isWhitePiece(piece) ? 6 : 1;

    if (board[row + dir]?.[col] === null) {
        moves.push([row + dir, col]);
        if (row === startRow && board[row + dir * 2]?.[col] === null)
            moves.push([row + dir * 2, col]);
    }
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

function slidingMoves(board, row, col, directions) {
    const moves = [];
    const piece = board[row][col];
    for (const [dr, dc] of directions) {
        let r = row + dr, c = col + dc;
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            if (board[r][c] === null) { moves.push([r, c]); }
            else { if (!sameColor(piece, board[r][c])) moves.push([r, c]); break; }
            r += dr; c += dc;
        }
    }
    return moves;
}

function rookMoves(board, row, col) {
    return slidingMoves(board, row, col, [[0,1],[0,-1],[1,0],[-1,0]]);
}
function bishopMoves(board, row, col) {
    return slidingMoves(board, row, col, [[1,1],[1,-1],[-1,1],[-1,-1]]);
}
function queenMoves(board, row, col) {
    return [...rookMoves(board, row, col), ...bishopMoves(board, row, col)];
}

function knightMoves(board, row, col) {
    const piece = board[row][col];
    return [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]
        .map(([dr, dc]) => [row + dr, col + dc])
        .filter(([r, c]) => r >= 0 && r < 8 && c >= 0 && c < 8 && !sameColor(piece, board[r][c]));
}

function kingMoves(state, row, col) {
    const board = state.board;
    const piece = board[row][col];
    const moves = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
        .map(([dr, dc]) => [row + dr, col + dc])
        .filter(([r, c]) => r >= 0 && r < 8 && c >= 0 && c < 8 && !sameColor(piece, board[r][c]));

    const isW = isWhitePiece(piece);
    const rK = isW ? "K" : "k", rQ = isW ? "Q" : "q";

    if (state.castling.includes(rK) && board[row][5] === null && board[row][6] === null)
        moves.push([row, 6]);
    if (state.castling.includes(rQ) && board[row][3] === null && board[row][2] === null && board[row][1] === null)
        moves.push([row, 2]);

    return moves;
}

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

function isInCheck(state, color) {
    const kingPiece = color === "white" ? "K" : "k";
    let kingRow = -1, kingCol = -1;
    for (let r = 0; r < 8; r++)
        for (let c = 0; c < 8; c++)
            if (state.board[r][c] === kingPiece) { kingRow = r; kingCol = c; }
    if (kingRow === -1) return false;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = state.board[r][c];
            if (!p) continue;
            const isEnemy = color === "white" ? isBlackPiece(p) : isWhitePiece(p);
            if (isEnemy && rawMoves(state, r, c).some(([mr, mc]) => mr === kingRow && mc === kingCol))
                return true;
        }
    }
    return false;
}

function applyMove(state, fr, fc, tr, tc) {
    const nb = state.board.map((r) => [...r]);
    const piece = nb[fr][fc];
    let ep = "-", castling = state.castling, half = state.half + 1;

    if (piece.toUpperCase() === "P" || nb[tr][tc] !== null) half = 0;

    nb[tr][tc] = piece;
    nb[fr][fc] = null;

    if (piece === "P" && tr === 0) nb[tr][tc] = "Q";
    if (piece === "p" && tr === 7) nb[tr][tc] = "q";

    if (piece.toUpperCase() === "P" && state.ep !== "-") {
        const epRow = 8 - parseInt(state.ep[1]), epCol = state.ep.charCodeAt(0) - 97;
        if (tr === epRow && tc === epCol) nb[fr][tc] = null;
    }

    if (piece.toUpperCase() === "P" && Math.abs(tr - fr) === 2)
        ep = String.fromCharCode(97 + fc) + (8 - (fr + tr) / 2);

    if (piece.toUpperCase() === "K" && Math.abs(tc - fc) === 2) {
        if (tc === 6) { nb[tr][5] = nb[tr][7]; nb[tr][7] = null; }
        else if (tc === 2) { nb[tr][3] = nb[tr][0]; nb[tr][0] = null; }
    }

    if (piece === "K") castling = castling.replace("K", "").replace("Q", "");
    if (piece === "k") castling = castling.replace("k", "").replace("q", "");
    if (piece === "R" && fr === 7 && fc === 0) castling = castling.replace("Q", "");
    if (piece === "R" && fr === 7 && fc === 7) castling = castling.replace("K", "");
    if (piece === "r" && fr === 0 && fc === 0) castling = castling.replace("q", "");
    if (piece === "r" && fr === 0 && fc === 7) castling = castling.replace("k", "");
    if (!castling) castling = "-";

    return {
        board: nb,
        turn: state.turn === "white" ? "black" : "white",
        castling, ep, half,
        full: state.turn === "black" ? state.full + 1 : state.full,
    };
}

// Movimientos válidos por pieza (sin restricción de jaque — permite jugadas libres)
function legalMoves(state, row, col, color) {
    const piece = state.board[row][col];
    if (!piece) return [];
    if ((color === "white" && !isWhitePiece(piece)) || (color === "black" && !isBlackPiece(piece)))
        return [];
    return rawMoves(state, row, col);
}

function getGameStatus(state) {
    // Si el rey fue capturado, termina el juego
    const whiteKingAlive = state.board.some(row => row.includes('K'));
    const blackKingAlive = state.board.some(row => row.includes('k'));
    if (!whiteKingAlive) return 'checkmate';
    if (!blackKingAlive) return 'checkmate';

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
    if (!hasAnyMove && inCheck) return 'checkmate';
    if (!hasAnyMove && !inCheck) return 'draw';
    if (state.half >= 100) return 'draw';
    if (inCheck) return 'check';
    return 'active';
}

// UI DEL TABLERO

const SVGS = {
    K: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
    Q: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
    R: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
    B: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
    N: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
    P: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
    k: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
    q: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
    r: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
    b: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
    n: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
    p: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
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

    _buildGrid() {
        this.container.innerHTML = "";
        this.container.className = "chess-grid";
        this.cells = [];
        for (let r = 0; r < 8; r++) {
            const rowCells = [];
            for (let c = 0; c < 8; c++) {
                const cell = document.createElement("div");
                cell.className = "chess-cell " + ((r + c) % 2 === 0 ? "light" : "dark");
                cell.addEventListener("click", () => this._handleClick(r, c));
                this.container.appendChild(cell);
                rowCells.push(cell);
            }
            this.cells.push(rowCells);
        }
        if (this.myColor === "black") this.container.style.transform = "rotate(180deg)";
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
        if (this.locked || (this.status !== "active" && this.status !== "check") || this.state.turn !== this.myColor)
            return;

        const piece = this.state.board[row][col];

        if (this.selected) {
            if (this.highlights.some(([r, c]) => r === row && c === col)) {
                this._executeMove(this.selected.row, this.selected.col, row, col);
                return;
            }
        }

        if (piece && ((this.myColor === "white" && isWhitePiece(piece)) || (this.myColor === "black" && isBlackPiece(piece)))) {
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

        // Detectar captura del rey ANTES de aplicar el movimiento
        const targetPiece = this.state.board[toRow][toCol];
        const capturingKing = targetPiece === 'K' || targetPiece === 'k';

        this.state = applyMove(this.state, fromRow, fromCol, toRow, toCol);

        // Si comiste el rey es jaque mate directo, sin recalcular
        const status = capturingKing ? 'checkmate' : getGameStatus(this.state);

        this.status = status;
        this.selected = null;
        this.highlights = [];
        this.locked = true;

        this._render();
        this.onMove({ from, to, piece: piece.toUpperCase(), fen: stateToFen(this.state), status });
    }

    unlock() { this.locked = false; }

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

                if (this.myColor === "black") cell.style.transform = "rotate(180deg)";
                if (this.selected?.row === r && this.selected?.col === c) cell.classList.add("selected");
                if (this.highlights.some(([hr, hc]) => hr === r && hc === c)) {
                    cell.classList.add("highlight");
                    if (piece) cell.classList.add("capture");
                }
                if (kingPos === `${r},${c}`) cell.classList.add("in-check");

                if (piece) {
                    const img = document.createElement('img');
                    img.src = SVGS[piece];
                    img.style.cssText = 'width:85%;height:85%;object-fit:contain;pointer-events:none;';
                    cell.appendChild(img);
                } else if (this.highlights.some(([hr, hc]) => hr === r && hc === c)) {
                    const dot = document.createElement('span');
                    dot.className = 'move-dot';
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

const GAME_ID = window.CHESS_GAME_ID;
const MY_COLOR = window.CHESS_MY_COLOR;
const INIT_FEN = window.CHESS_INIT_FEN;

const chess = new ChessBoard("chess-board", {
    myColor: MY_COLOR,
    onMove: handleMyMove,
});

chess.loadFen(INIT_FEN);

if (window.CHESS_STATUS === "pending") {
    chess.locked = true;
    updateTurnIndicator("⏳ Esperando oponente...", "waiting");
} else if (window.CHESS_STATUS === "finished" || window.CHESS_STATUS === "draw") {
    chess.locked = true;
    updateTurnIndicator("🏁 Partida finalizada.", "draw");
} else {
    updateTurnIndicator();
}

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

async function handleMyMove({ from, to, piece, fen, status }) {
    addMoveToHistory(from, to, piece);
    if (status === "checkmate")
        updateTurnIndicator("🏆 ¡Jaque mate! Ganaste.", "checkmate");
    else if (status === "draw")
        updateTurnIndicator("🤝 ¡Empate/Tablas!", "draw");
    else updateTurnIndicator();

    try {
        const res = await fetch(`/chess/move/${GAME_ID}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').content,
            },
            body: JSON.stringify({ from, to, piece, fen, status }),
        });
        if (!res.ok) chess.unlock();
    } catch (err) {
        console.error(err);
        chess.unlock();
    }
}

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
    if (chess.status === "check") {
        msg = isMyTurn ? "⚠️ ¡Jaque! Tu turno" : "⏳ ¡Jaque al oponente! Esperando...";
        type = "status-check";
    }
    el.textContent = msg;
    el.className = type;
}

let moveCounter = 0;
function addMoveToHistory(from, to, piece) {
    moveCounter++;
    const list = document.getElementById("move-history");
    if (!list) return;
    const li = document.createElement("li");
    li.textContent = `${moveCounter}. ${piece} ${from}→${to}`;
    list.appendChild(li);
    list.scrollTop = list.scrollHeight;
}