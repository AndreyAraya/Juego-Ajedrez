import {
    fenToBoard, boardToFen, squareToIndex, indexToSquare,
    legalMoves, getGameStatus, isInCheck
} from './rules.js';

const PIECES = {
    K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
    k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

export class ChessBoard {
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
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.addEventListener('click', () => this._handleClick(r, c));
                this.container.appendChild(cell);
                rowCells.push(cell);
            }
            this.cells.push(rowCells);
        }

        if (this.myColor === 'black') {
            this.container.style.transform = 'rotate(180deg)';
        }
    }

    loadFen(fen) {
        this.board = fenToBoard(fen);
        this.turn  = fen.split(' ')[1] === 'w' ? 'white' : 'black';
        this.status = getGameStatus(this.board, this.turn);
        this._render();
    }

    applyOpponentMove(from, to, fen) {
        this.board = fenToBoard(fen);
        this.turn  = fen.split(' ')[1] === 'w' ? 'white' : 'black';
        this.status = getGameStatus(this.board, this.turn);
        this.selected   = null;
        this.highlights = [];
        this._render();
        this._flashCell(from);
        this._flashCell(to);
    }

    _handleClick(row, col) {
        if (this.locked || this.status !== 'active') return;
        if (this.turn !== this.myColor) return;

        const piece = this.board[row][col];

        if (this.selected) {
            const isValidMove = this.highlights.some(([r, c]) => r === row && c === col);
            if (isValidMove) {
                this._executeMove(this.selected.row, this.selected.col, row, col);
                return;
            }
        }

        if (piece && ((this.myColor === 'white' && piece === piece.toUpperCase()) ||
                      (this.myColor === 'black' && piece === piece.toLowerCase()))) {
            this.selected   = { row, col };
            this.highlights = legalMoves(this.board, row, col, this.myColor);
            this._render();
        } else {
            this.selected   = null;
            this.highlights = [];
            this._render();
        }
    }

    _executeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const from  = indexToSquare(fromRow, fromCol);
        const to    = indexToSquare(toRow, toCol);

        this.board[toRow][toCol]     = piece;
        this.board[fromRow][fromCol] = null;

        if (piece === 'P' && toRow === 0) this.board[toRow][toCol] = 'Q';
        if (piece === 'p' && toRow === 7) this.board[toRow][toCol] = 'q';

        const nextTurn = this.turn === 'white' ? 'black' : 'white';
        const fen      = boardToFen(this.board, nextTurn === 'white' ? 'w' : 'b');
        const status   = getGameStatus(this.board, nextTurn);

        this.turn       = nextTurn;
        this.status     = status;
        this.selected   = null;
        this.highlights = [];
        this.locked     = true;

        this._render();
        this.onMove({ from, to, piece: piece.toUpperCase(), fen, status });
    }

    unlock() {
        this.locked = false;
    }

    _render() {
        const inCheck = isInCheck(this.board, this.turn);
        let kingPos = null;

        if (inCheck) {
            const kingPiece = this.turn === 'white' ? 'K' : 'k';
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (this.board[r][c] === kingPiece) kingPos = `${r},${c}`;
                }
            }
        }

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell  = this.cells[r][c];
                const piece = this.board[r][c];
                const base  = (r + c) % 2 === 0 ? 'light' : 'dark';

                cell.className = `chess-cell ${base}`;
                cell.innerHTML = '';

                if (this.myColor === 'black') cell.style.transform = 'rotate(180deg)';

                if (this.selected && this.selected.row === r && this.selected.col === c)
                    cell.classList.add('selected');

                if (this.highlights.some(([hr, hc]) => hr === r && hc === c)) {
                    cell.classList.add('highlight');
                    if (piece) cell.classList.add('capture');
                }

                if (kingPos === `${r},${c}`) cell.classList.add('in-check');

                if (piece) {
                    const span = document.createElement('span');
                    span.className = 'piece ' + (piece === piece.toUpperCase() ? 'white-piece' : 'black-piece');
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