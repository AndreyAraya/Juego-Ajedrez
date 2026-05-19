import { ChessBoard } from './chess/board.js';

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

        if (e.status === 'checkmate') {
            showStatus('♟ ¡Jaque mate! Has ganado.', 'checkmate');
        } else if (e.status === 'draw') {
            showStatus('🤝 ¡Tablas!', 'draw');
        } else if (e.status === 'check') {
            showStatus('⚠️ ¡Jaque!', 'check');
        } else {
            showStatus('Tu turno', 'active');
        }
    });

async function handleMyMove({ from, to, piece, fen, status }) {
    addMoveToHistory(from, to, piece);
    updateTurnIndicator();

    if (status === 'checkmate') {
        showStatus('♟ ¡Jaque mate! Ganaste.', 'checkmate');
    } else if (status === 'draw') {
        showStatus('🤝 Tablas por ahogado.', 'draw');
    } else if (status === 'check') {
        showStatus('⚠️ ¡Le diste jaque!', 'check');
    } else {
        showStatus('Turno del oponente...', 'waiting');
    }

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