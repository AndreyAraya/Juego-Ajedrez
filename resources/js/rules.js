export function fenToBoard(fen) {
    const board = [];
    const rows = fen.split(' ')[0].split('/');
    for (const row of rows) {
        const line = [];
        for (const ch of row) {
            if (isNaN(ch)) {
                line.push(ch);
            } else {
                for (let i = 0; i < parseInt(ch); i++) line.push(null);
            }
        }
        board.push(line);
    }
    return board;
}

export function boardToFen(board, turn, castling = 'KQkq', enPassant = '-', halfMove = 0, fullMove = 1) {
    const rows = board.map(row => {
        let fen = '';
        let empty = 0;
        for (const cell of row) {
            if (cell === null) {
                empty++;
            } else {
                if (empty > 0) { fen += empty; empty = 0; }
                fen += cell;
            }
        }
        if (empty > 0) fen += empty;
        return fen;
    });
    return `${rows.join('/')} ${turn} ${castling} ${enPassant} ${halfMove} ${fullMove}`;
}

export function squareToIndex(sq) {
    const col = sq.charCodeAt(0) - 97;
    const row = 8 - parseInt(sq[1]);
    return { row, col };
}

export function indexToSquare(row, col) {
    return String.fromCharCode(97 + col) + (8 - row);
}

function isWhite(piece) { return piece && piece === piece.toUpperCase(); }
function isBlack(piece) { return piece && piece === piece.toLowerCase(); }
function sameColor(a, b) {
    if (!a || !b) return false;
    return (isWhite(a) && isWhite(b)) || (isBlack(a) && isBlack(b));
}

function pawnMoves(board, row, col) {
    const moves = [];
    const piece = board[row][col];
    const dir = isWhite(piece) ? -1 : 1;
    const startRow = isWhite(piece) ? 6 : 1;

    if (board[row + dir]?.[col] === null) {
        moves.push([row + dir, col]);
        if (row === startRow && board[row + dir * 2]?.[col] === null) {
            moves.push([row + dir * 2, col]);
        }
    }
    for (const dc of [-1, 1]) {
        const target = board[row + dir]?.[col + dc];
        if (target && !sameColor(piece, target)) {
            moves.push([row + dir, col + dc]);
        }
    }
    return moves;
}

function rookMoves(board, row, col) {
    const moves = [];
    const piece = board[row][col];
    const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
    for (const [dr, dc] of dirs) {
        let r = row + dr, c = col + dc;
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            if (board[r][c] === null) { moves.push([r, c]); }
            else {
                if (!sameColor(piece, board[r][c])) moves.push([r, c]);
                break;
            }
            r += dr; c += dc;
        }
    }
    return moves;
}

function bishopMoves(board, row, col) {
    const moves = [];
    const piece = board[row][col];
    const dirs = [[1,1],[1,-1],[-1,1],[-1,-1]];
    for (const [dr, dc] of dirs) {
        let r = row + dr, c = col + dc;
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            if (board[r][c] === null) { moves.push([r, c]); }
            else {
                if (!sameColor(piece, board[r][c])) moves.push([r, c]);
                break;
            }
            r += dr; c += dc;
        }
    }
    return moves;
}

function knightMoves(board, row, col) {
    const piece = board[row][col];
    const jumps = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    return jumps
        .map(([dr, dc]) => [row + dr, col + dc])
        .filter(([r, c]) => r >= 0 && r < 8 && c >= 0 && c < 8 && !sameColor(piece, board[r][c]));
}

function queenMoves(board, row, col) {
    return [...rookMoves(board, row, col), ...bishopMoves(board, row, col)];
}

function kingMoves(board, row, col) {
    const piece = board[row][col];
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    return dirs
        .map(([dr, dc]) => [row + dr, col + dc])
        .filter(([r, c]) => r >= 0 && r < 8 && c >= 0 && c < 8 && !sameColor(piece, board[r][c]));
}

function rawMoves(board, row, col) {
    const piece = board[row][col];
    if (!piece) return [];
    const type = piece.toUpperCase();
    if (type === 'P') return pawnMoves(board, row, col);
    if (type === 'R') return rookMoves(board, row, col);
    if (type === 'B') return bishopMoves(board, row, col);
    if (type === 'N') return knightMoves(board, row, col);
    if (type === 'Q') return queenMoves(board, row, col);
    if (type === 'K') return kingMoves(board, row, col);
    return [];
}

export function isInCheck(board, color) {
    const kingPiece = color === 'white' ? 'K' : 'k';
    let kingRow = -1, kingCol = -1;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === kingPiece) { kingRow = r; kingCol = c; }
        }
    }
    if (kingRow === -1) return false;

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (!p) continue;
            const enemyColor = color === 'white' ? 'black' : 'white';
            if ((enemyColor === 'white' && isWhite(p)) || (enemyColor === 'black' && isBlack(p))) {
                const moves = rawMoves(board, r, c);
                if (moves.some(([mr, mc]) => mr === kingRow && mc === kingCol)) return true;
            }
        }
    }
    return false;
}

function applyMove(board, fromRow, fromCol, toRow, toCol) {
    const newBoard = board.map(row => [...row]);
    newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
    newBoard[fromRow][fromCol] = null;
    if (newBoard[toRow][toCol] === 'P' && toRow === 0) newBoard[toRow][toCol] = 'Q';
    if (newBoard[toRow][toCol] === 'p' && toRow === 7) newBoard[toRow][toCol] = 'q';
    return newBoard;
}

export function legalMoves(board, row, col, color) {
    const piece = board[row][col];
    if (!piece) return [];
    if (color === 'white' && !isWhite(piece)) return [];
    if (color === 'black' && !isBlack(piece)) return [];

    const candidates = rawMoves(board, row, col);
    return candidates.filter(([tr, tc]) => {
        const next = applyMove(board, row, col, tr, tc);
        return !isInCheck(next, color);
    });
}

export function getGameStatus(board, turn) {
    const color = turn;
    const inCheck = isInCheck(board, color);
    let hasAnyMove = false;

    outer:
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (!p) continue;
            if (color === 'white' && !isWhite(p)) continue;
            if (color === 'black' && !isBlack(p)) continue;
            if (legalMoves(board, r, c, color).length > 0) {
                hasAnyMove = true;
                break outer;
            }
        }
    }

    if (!hasAnyMove && inCheck)  return 'checkmate';
    if (!hasAnyMove && !inCheck) return 'draw';
    if (inCheck)                 return 'check';
    return 'active';
}