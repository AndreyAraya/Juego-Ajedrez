// REGLAS FIDE COMPLETAS (MÓDULO EXPORTABLE)

// Exportamos la función que convierte el FEN en un objeto de estado completo
export function fenToState(fen) {
    const parts = fen.split(" ");
    const rows = parts[0].split("/");

    // Decodificamos el tablero
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

// Exportamos la función que devuelve el estado a formato FEN para guardarlo
export function stateToFen(state) {
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

// Exportamos los conversores de coordenadas
export function squareToIndex(sq) {
    return { row: 8 - parseInt(sq[1]), col: sq.charCodeAt(0) - 97 };
}

export function indexToSquare(row, col) {
    return String.fromCharCode(97 + col) + (8 - row);
}

// Funciones internas de validación de color (no necesitan ser exportadas)
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

// Lógica de Peones (Incluye doble paso y captura al paso)
function pawnMoves(state, row, col) {
    const board = state.board;
    const moves = [];
    const piece = board[row][col];
    const dir = isWhitePiece(piece) ? -1 : 1;
    const startRow = isWhitePiece(piece) ? 6 : 1;

    // Avance normal
    if (board[row + dir]?.[col] === null) {
        moves.push([row + dir, col]);
        // Doble avance inicial
        if (row === startRow && board[row + dir * 2]?.[col] === null)
            moves.push([row + dir * 2, col]);
    }

    // Capturas y Peón al paso (En Passant)
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

// Movimientos de deslizamiento (Torre, Alfil, Reina)
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
                break;
            }
            r += dr;
            c += dc;
        }
    }
    return moves;
}

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

// Lógica del Rey (Incluye Enroque corto y largo)
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

    const isW = isWhitePiece(piece);
    const rK = isW ? "K" : "k",
        rQ = isW ? "Q" : "q";

    // Verificamos si las casillas están vacías y los derechos de enroque siguen intactos
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

// Consolida todos los movimientos crudos según la pieza
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

// Exportamos la verificación de jaque
export function isInCheck(state, color) {
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
            // Si algún movimiento crudo enemigo puede llegar a la casilla de tu rey, estás en jaque
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

// Exportamos la función que aplica el movimiento y actualiza las reglas complejas
export function applyMove(state, fr, fc, tr, tc) {
    const nb = state.board.map((r) => [...r]);
    const piece = nb[fr][fc];
    let ep = "-",
        castling = state.castling,
        half = state.half + 1;

    // Se reinicia la regla de 50 turnos si mueves peón o comes
    if (piece.toUpperCase() === "P" || nb[tr][tc] !== null) half = 0;

    nb[tr][tc] = piece;
    nb[fr][fc] = null;

    // Coronación automática
    if (piece === "P" && tr === 0) nb[tr][tc] = "Q";
    if (piece === "p" && tr === 7) nb[tr][tc] = "q";

    // Mueve la pieza capturada al paso
    if (piece.toUpperCase() === "P" && state.ep !== "-") {
        const epRow = 8 - parseInt(state.ep[1]),
            epCol = state.ep.charCodeAt(0) - 97;
        if (tr === epRow && tc === epCol) nb[fr][tc] = null;
    }

    // Activa la bandera de captura al paso para el rival
    if (piece.toUpperCase() === "P" && Math.abs(tr - fr) === 2)
        ep = String.fromCharCode(97 + fc) + (8 - (fr + tr) / 2);

    // Ejecuta el movimiento de la torre si es un enroque
    if (piece.toUpperCase() === "K" && Math.abs(tc - fc) === 2) {
        if (tc === 6) {
            nb[tr][5] = nb[tr][7];
            nb[tr][7] = null;
        } else if (tc === 2) {
            nb[tr][3] = nb[tr][0];
            nb[tr][0] = null;
        }
    }

    // Invalida derechos de enroque permanentemente si se mueve el rey o torre
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

// Exportamos la función final que valida si el movimiento es 100% legal (No es suicida)
export function legalMoves(state, row, col, color) {
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

        // Validaciones extra para el enroque (no cruzar casillas amenazadas)
        if (piece.toUpperCase() === "K" && Math.abs(tc - col) === 2) {
            if (isInCheck(state, color)) return false;
            const passCol = col + (tc - col) / 2;
            const passState = applyMove(state, row, col, row, passCol);
            if (isInCheck(passState, color)) return false;
        }
        return true;
    });
}

// Exportamos la función que dicta el fin del juego
export function getGameStatus(state) {
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
    if (!hasAnyMove && !inCheck) return "draw"; // Ahogado
    if (state.half >= 100) return "draw"; // Empate por regla de 50 turnos

    if (inCheck) return "check";
    return "active";
}
