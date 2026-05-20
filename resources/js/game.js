// ═══════════════════════════════════════════════════════
// RULES
// ═══════════════════════════════════════════════════════

function fenToBoard(fen) {
    const board = [];
    const rows = fen.split(' ')[0].split('/');
    for (const row of rows) {
        const line = [];
        for (const ch of row) {
            if (isNaN(ch)) { line.push(ch); }
            else { for (let i = 0; i < parseInt(ch); i++) line.push(null); }
        }
        board.push(line);
    }
    return board;
}

function boardToFen(board, turn) {
    const rows = board.map(row => {
        let fen = ''; let empty = 0;
        for (const cell of row) {
            if (cell === null) { empty++; }
            else { if (empty > 0) { fen += empty; empty = 0; } fen += cell; }
        }
        if (empty > 0) fen += empty;
        return fen;
    });
    return `${rows.join('/')} ${turn} KQkq - 0 1`;
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

function pawnMoves(board, row, col) {
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
        if (target && !sameColor(piece, target)) moves.push([row + dir, col + dc]);
    }
    return moves;
}

function rookMoves(board, row, col) {
    const moves = []; const piece = board[row][col];
    for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
        let r = row + dr, c = col + dc;
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            if (board[r][c] === null) { moves.push([r, c]); }
            else { if (!sameColor(piece, board[r][c])) moves.push([r, c]); break; }
            r += dr; c += dc;
        }
    }
    return moves;
}

function bishopMoves(board, row, col) {
    const moves = []; const piece = board[row][col];
    for (const [dr, dc] of [[1,1],[1,-1],[-1,1],[-1,-1]]) {
        let r = row + dr, c = col + dc;
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            if (board[r][c] === null) { moves.push([r, c]); }
            else { if (!sameColor(piece, board[r][c])) moves.push([r, c]); break; }
            r += dr; c += dc;
        }
    }
    return moves;
}

function knightMoves(board, row, col) {
    const piece = board[row][col];
    return [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]
        .map(([dr, dc]) => [row + dr, col + dc])
        .filter(([r, c]) => r >= 0 && r < 8 && c >= 0 && c < 8 && !sameColor(piece, board[r][c]));
}

function queenMoves(board, row, col) {
    return [...rookMoves(board, row, col), ...bishopMoves(board, row, col)];
}

function kingMoves(board, row, col) {
    const piece = board[row][col];
    return [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
        .map(([dr, dc]) => [row + dr, col + dc])
        .filter(([r, c]) => r >= 0 && r < 8 && c >= 0 && c < 8 && !sameColor(piece, board[r][c]));
}

function rawMoves(board, row, col) {
    const type = board[row][col]?.toUpperCase();
    if (type === 'P') return pawnMoves(board, row, col);
    if (type === 'R') return rookMoves(board, row, col);
    if (type === 'B') return bishopMoves(board, row, col);
    if (type === 'N') return knightMoves(board, row, col);
    if (type === 'Q') return queenMoves(board, row, col);
    if (type === 'K') return kingMoves(board, row, col);
    return [];
}

function isInCheck(board, color) {
    const kingPiece = color === 'white' ? 'K' : 'k';
    let kingRow = -1, kingCol = -1;
    for (let r = 0; r < 8; r++)
        for (let c = 0; c < 8; c++)
            if (board[r][c] === kingPiece) { kingRow = r; kingCol = c; }
    if (kingRow === -1) return false;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (!p) continue;
            const isEnemy = color === 'white' ? isBlackPiece(p) : isWhitePiece(p);
            if (isEnemy && rawMoves(board, r, c).some(([mr, mc]) => mr === kingRow && mc === kingCol))
                return true;
        }
    }
    return false;
}

function applyMove(board, fr, fc, tr, tc) {
    const nb = board.map(r => [...r]);
    nb[tr][tc] = nb[fr][fc]; nb[fr][fc] = null;
    if (nb[tr][tc] === 'P' && tr === 0) nb[tr][tc] = 'Q';
    if (nb[tr][tc] === 'p' && tr === 7) nb[tr][tc] = 'q';
    return nb;
}

function legalMoves(board, row, col, color) {
    const piece = board[row][col];
    if (!piece) return [];
    if (color === 'white' && !isWhitePiece(piece)) return [];
    if (color === 'black' && !isBlackPiece(piece)) return [];
    return rawMoves(board, row, col).filter(([tr, tc]) => !isInCheck(applyMove(board, row, col, tr, tc), color));
}

function getGameStatus(board, turn) {
    const inCheck = isInCheck(board, turn);
    let hasAnyMove = false;
    outer:
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (!p) continue;
            if (turn === 'white' && !isWhitePiece(p)) continue;
            if (turn === 'black' && !isBlackPiece(p)) continue;
            if (legalMoves(board, r, c, turn).length > 0) { hasAnyMove = true; break outer; }
        }
    }
    if (!hasAnyMove && inCheck)  return 'checkmate';
    if (!hasAnyMove && !inCheck) return 'draw';
    if (inCheck)                 return 'check';
    return 'active';
}

// ═══════════════════════════════════════════════════════
// BOARD
// ═══════════════════════════════════════════════════════

const PIECES = {
    K:'♔', Q:'♕', R:'♖', B:'♗', N:'♘', P:'♙',
    k:'♚', q:'♛', r:'♜', b:'♝', n:'♞', p:'♟',
};

class ChessBoard {
    constructor(containerId, options = {}) {
        this.container  = document.getElementById(containerId);
        this.myColor    = options.myColor || 'white';
        this.onMove     = options.onMove || (() => {});
        this.board      = null;
        this.turn       = 'white';
        this.selected   = null;
        this.highlights = [];
        this.locked     = false;
        this.status     = 'active';
        this._buildGrid();
    }

    _buildGrid() {
        this.container.innerHTML = '';
        this.container.className = 'chess-grid';
        this.cells = [];
        for (let r = 0; r < 8; r++) {
            const rowCells = [];
            for (let c = 0; c < 8; c++) {
                const cell = document.createElement('div');
                cell.className = 'chess-cell ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
                cell.addEventListener('click', () => this._handleClick(r, c));
                this.container.appendChild(cell);
                rowCells.push(cell);
            }
            this.cells.push(rowCells);
        }
        if (this.myColor === 'black') this.container.style.transform = 'rotate(180deg)';
    }

    loadFen(fen) {
        this.board  = fenToBoard(fen);
        this.turn   = fen.split(' ')[1] === 'w' ? 'white' : 'black';
        this.status = getGameStatus(this.board, this.turn);
        this._render();
    }

    applyOpponentMove(from, to, fen) {
        this.board  = fenToBoard(fen);
        this.turn   = fen.split(' ')[1] === 'w' ? 'white' : 'black';
        this.status = getGameStatus(this.board, this.turn);
        this.selected = null; this.highlights = [];
        this._render();
        this._flashCell(from); this._flashCell(to);
    }

    _handleClick(row, col) {
        if (this.locked || this.status !== 'active') return;
        if (this.turn !== this.myColor) return;
        const piece = this.board[row][col];
        if (this.selected) {
            if (this.highlights.some(([r, c]) => r === row && c === col)) {
                this._executeMove(this.selected.row, this.selected.col, row, col);
                return;
            }
        }
        if (piece && ((this.myColor === 'white' && isWhitePiece(piece)) ||
                      (this.myColor === 'black' && isBlackPiece(piece)))) {
            this.selected   = { row, col };
            this.highlights = legalMoves(this.board, row, col, this.myColor);
        } else {
            this.selected = null; this.highlights = [];
        }
        this._render();
    }

    _executeMove(fromRow, fromCol, toRow, toCol) {
        const piece    = this.board[fromRow][fromCol];
        const from     = indexToSquare(fromRow, fromCol);
        const to       = indexToSquare(toRow, toCol);
        this.board[toRow][toCol]     = piece;
        this.board[fromRow][fromCol] = null;
        if (piece === 'P' && toRow === 0) this.board[toRow][toCol] = 'Q';
        if (piece === 'p' && toRow === 7) this.board[toRow][toCol] = 'q';
        const nextTurn = this.turn === 'white' ? 'black' : 'white';
        const fen      = boardToFen(this.board, nextTurn === 'white' ? 'w' : 'b');
        const status   = getGameStatus(this.board, nextTurn);
        this.turn = nextTurn; this.status = status;
        this.selected = null; this.highlights = [];
        this.locked = true;
        this._render();
        this.onMove({ from, to, piece: piece.toUpperCase(), fen, status });
    }

    unlock() { this.locked = false; }

    _render() {
        const inCheck = isInCheck(this.board, this.turn);
        let kingPos = null;
        if (inCheck) {
            const kp = this.turn === 'white' ? 'K' : 'k';
            for (let r = 0; r < 8; r++)
                for (let c = 0; c < 8; c++)
                    if (this.board[r][c] === kp) kingPos = `${r},${c}`;
        }
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell  = this.cells[r][c];
                const piece = this.board[r][c];
                cell.className = `chess-cell ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
                cell.innerHTML = '';
                if (this.myColor === 'black') cell.style.transform = 'rotate(180deg)';
                if (this.selected?.row === r && this.selected?.col === c) cell.classList.add('selected');
                if (this.highlights.some(([hr, hc]) => hr === r && hc === c)) {
                    cell.classList.add('highlight');
                    if (piece) cell.classList.add('capture');
                }
                if (kingPos === `${r},${c}`) cell.classList.add('in-check');
                if (piece) {
                    const span = document.createElement('span');
                    span.className = 'piece ' + (isWhitePiece(piece) ? 'white-piece' : 'black-piece');
                    span.textContent = PIECES[piece] || piece;
                    cell.appendChild(span);
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
        cell.classList.add('flash');
        setTimeout(() => cell.classList.remove('flash'), 600);
    }
}

// ═══════════════════════════════════════════════════════
// GAME
// ═══════════════════════════════════════════════════════

const GAME_ID  = window.CHESS_GAME_ID;
const MY_COLOR = window.CHESS_MY_COLOR;
const INIT_FEN = window.CHESS_INIT_FEN;

const chess = new ChessBoard('chess-board', {
    myColor: MY_COLOR,
    onMove: handleMyMove,
});

chess.loadFen(INIT_FEN);

if (window.CHESS_STATUS === 'pending') {
    chess.locked = true;
    showStatus('⏳ Esperando oponente...', 'waiting');
} else {
    updateTurnIndicator();
}

window.Echo.private(`game.${GAME_ID}`)
    .listen('GameStarted', (e) => {
        chess.locked = false;
        showStatus(`✅ ¡${e.black_player} se unió! La partida comienza.`, 'active');
        updateTurnIndicator();
    })
    .listen('MoveMade', (e) => {
        chess.applyOpponentMove(e.from, e.to, e.fen);
        chess.unlock();
        addMoveToHistory(e.from, e.to, e.piece);
        updateTurnIndicator();
        if (e.status === 'checkmate')     showStatus('♟ ¡Jaque mate! Has ganado.', 'checkmate');
        else if (e.status === 'draw')     showStatus('🤝 ¡Tablas!', 'draw');
        else if (e.status === 'check')    showStatus('⚠️ ¡Jaque!', 'check');
        else                              showStatus('Tu turno', 'active');
    });

async function handleMyMove({ from, to, piece, fen, status }) {
    addMoveToHistory(from, to, piece);
    updateTurnIndicator();
    if (status === 'checkmate')      showStatus('♟ ¡Jaque mate! Ganaste.', 'checkmate');
    else if (status === 'draw')      showStatus('🤝 Tablas por ahogado.', 'draw');
    else if (status === 'check')     showStatus('⚠️ ¡Le diste jaque!', 'check');
    else                             showStatus('Turno del oponente...', 'waiting');
    try {
        const res = await fetch(`/chess/move/${GAME_ID}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
            },
            body: JSON.stringify({ from, to, piece, fen, status }),
        });
        if (!res.ok) chess.unlock();
    } catch (err) {
        console.error(err);
        chess.unlock();
    }
}

function updateTurnIndicator() {
    const el = document.getElementById('turn-indicator');
    if (!el) return;
    const isMyTurn = chess.turn === MY_COLOR;
    el.textContent = isMyTurn ? '🟢 Tu turno' : '⏳ Turno del oponente';
    el.className   = isMyTurn ? 'turn-mine' : 'turn-theirs';
}

function showStatus(msg, type) {
    const el = document.getElementById('game-status');
    if (!el) return;
    el.textContent = msg;
    el.className   = `game-status status-${type}`;
}

let moveCounter = 0;
function addMoveToHistory(from, to, piece) {
    moveCounter++;
    const list = document.getElementById('move-history');
    if (!list) return;
    const li = document.createElement('li');
    li.textContent = `${moveCounter}. ${piece} ${from}→${to}`;
    list.appendChild(li);
    list.scrollTop = list.scrollHeight;
}

