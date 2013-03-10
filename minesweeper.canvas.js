/**
 * HTML5 Canvas UI for Minesweeper
 */

var SQUARE_SIZE = 30;

// 0-8 reserved for drawing # of mines
var DRAW_UNREVEALED = 9;
var DRAW_FLAG = 10;
var DRAW_MARKER = 11;
var DRAW_MINE = 12;
var DRAW_EXPLODED = 13;
var DRAW_RANDOM = 14;
var DRAW_CORRECT = 15;
var DRAW_INCORRECT = 16;

var board = {};
var game = {};

function drawBoard(x, y, containerId) {
  var target = document.getElementById(containerId);
  var canvas = document.createElement("canvas");
  var status = document.createElement("div");
  
  canvas.id = "board";
  canvas.width = x * SQUARE_SIZE;
  canvas.height = y * SQUARE_SIZE;
  
  status.id = "status";
  
  board.canvas = canvas;
  board.ctx = canvas.getContext("2d");
  board.ctx.font = "bold 14px Arial";
  board.ctx.textBaseline = "middle";
  board.ctx.textAlign = "center";
  
  var xIndex, yIndex;
  for (yIndex = 0; yIndex < y ; yIndex++) {
    for (xIndex = 0; xIndex < x ; xIndex++) {
      draw(xIndex, yIndex, DRAW_UNREVEALED);
    }
  }
  
  target.appendChild(canvas);
  target.appendChild(status);
}

function draw(squareX, squareY, type) {
  x = squareX * SQUARE_SIZE;
  y = squareY * SQUARE_SIZE;
  
  board.ctx.fillStyle = "#e0e0e0";
  board.ctx.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE);
  
  if (type === 0) {
    board.ctx.fillStyle = "#d0d0d0";
    board.ctx.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE);
  }
  
  if (type > 0 && type <= 8) {
    board.ctx.fillStyle = "#d0d0d0";
    board.ctx.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE);
    board.ctx.fillStyle = "black";
    board.ctx.fillText(type, x + SQUARE_SIZE/2, y + SQUARE_SIZE/2);
  }
  
  if (type === DRAW_UNREVEALED) {
    board.ctx.strokeStyle = "#f0f0f0";
    board.ctx.lineWidth = 1;
    board.ctx.strokeRect(x, y, x + SQUARE_SIZE, y + SQUARE_SIZE);
  }
  
  if (type === DRAW_FLAG) {
    // Flagpole
    board.ctx.strokeStyle = "black";
    board.ctx.beginPath();
    board.ctx.moveTo(x + 20, y + 25);
    board.ctx.lineTo(x + 20, y + 5);
    board.ctx.closePath();
    board.ctx.stroke();
    // Flag
    board.ctx.fillStyle = "red";
    board.ctx.strokeStyle = "red";
    board.ctx.beginPath();
    board.ctx.moveTo(x + 20, y + 5);
    board.ctx.lineTo(x + 10, y + 9);
    board.ctx.lineTo(x + 20, y + 13);
    board.ctx.closePath();
    board.ctx.stroke();
    board.ctx.fill();
  }
  
  if (type === DRAW_MARKER) {
    board.ctx.fillStyle = "black";
    board.ctx.fillText("?", x + SQUARE_SIZE/2, y + SQUARE_SIZE/2);
  }
  
  if (type === DRAW_MINE) {
    board.ctx.beginPath();
    board.ctx.arc(x + SQUARE_SIZE/2, y + SQUARE_SIZE/2, 6, 0, 2 * Math.PI, false);
    board.ctx.fillStyle = "black";
    board.ctx.fill();
  }
  
  if (type === DRAW_EXPLODED) {
    board.ctx.beginPath();
    board.ctx.arc(x + SQUARE_SIZE/2, y + SQUARE_SIZE/2, 6, 0, 2 * Math.PI, false);
    board.ctx.fillStyle = "red";
    board.ctx.fill();
  }
  
  if (type === DRAW_CORRECT) {
    board.ctx.beginPath();
    board.ctx.arc(x + SQUARE_SIZE/2, y + SQUARE_SIZE/2, 6, 0, 2 * Math.PI, false);
    board.ctx.fillStyle = "green";
    board.ctx.fill();
  }
  
  if (type === DRAW_INCORRECT) {
    board.ctx.beginPath();
    board.ctx.arc(x + SQUARE_SIZE/2, y + SQUARE_SIZE/2, 6, 0, 2 * Math.PI, false);
    board.ctx.fillStyle = "red";
    board.ctx.fill();
    board.ctx.fillStyle = "black";
    board.ctx.fillText("X", x + SQUARE_SIZE/2, y + SQUARE_SIZE/2);
  }
  
  if (type === DRAW_RANDOM) {
    var random = Math.floor((Math.random() * 16777216)).toString(16);
    var color = "#00000".substr(0, 7 - random.length) + random;
    board.ctx.fillStyle = color;
    board.ctx.fillRect(x, y, x + SQUARE_SIZE, y + SQUARE_SIZE);
  }
  
  board.ctx.strokeStyle = "#f0f0f0";
  board.ctx.lineWidth = 1;
  board.ctx.strokeRect(x, y, x + SQUARE_SIZE, y + SQUARE_SIZE);
}

function refreshBoard() {
  var x, y;
  for (x = 0; x < game.settings.width ; x++) {
    for (y = 0; y < game.settings.height ; y++) {
      if (game.board[x][y].state === game.REVEALED) {
        draw(x, y, game.board[x][y].nearbyMines);
      }
      if (game.board[x][y].state === game.MINED) {
        draw(x, y, DRAW_MINE);
      }
      if (game.board[x][y].state === game.MINE_EXPLODED) {
        draw(x, y, DRAW_EXPLODED);
      }
      if (game.board[x][y].state === game.CORRECT_MINE) {
        draw(x, y, DRAW_CORRECT);
      }
      if (game.board[x][y].state === game.INCORRECT_MINE) {
        draw(x, y, DRAW_INCORRECT);
      }
      if (game.board[x][y].state === game.FLAGGED) {
        draw(x, y, DRAW_FLAG);
      }
      if (game.board[x][y].state === game.MARKED) {
        draw(x, y, DRAW_MARKER);
      }
      if (game.board[x][y].state === game.UNREVEALED) {
        draw(x, y, DRAW_UNREVEALED);
      }
    }
  }
  var status = document.getElementById("status");
  if (game.inProgress) {
    status.innerHTML = "Mines remaining: " + game.flagsRemaining();
  } else {
    if (game.win) {
      status.innerHTML = "Game over: you won!";
    } else {
      status.innerHTML = "Game over: you lost!";
    }
  }
}

function minesweeper(elementId, difficulty) {
  game = new Minesweeper(difficulty);
  drawBoard(game.settings.width, game.settings.height, elementId);
  refreshBoard();
  board.canvas.addEventListener('click', clickEventHandler);
  board.canvas.addEventListener('contextmenu', clickEventHandler);
}

var clickEventHandler = function (e) {
  e.preventDefault();
  var rightClick = false;
  clickX = e.offsetX ? e.offsetX : e.pageX - document.getElementById(elementId).offsetLeft;
  clickY = e.offsetY ? e.offsetY : e.pageY - document.getElementById(elementId).offsetTop;
  x = Math.floor(clickX / 30);
  y = Math.floor(clickY / 30);
  
  if (e.which) {
    rightClick = (e.which === 3);
  } else if (e.button) {
    rightClick = (e.button === 3);
  }
  
  if (rightClick) {
    if (game.board[x][y].state === game.UNREVEALED) {
      game.flag(x, y);
    } else if (game.board[x][y].state === game.FLAGGED) {
      game.mark(x, y);
    } else {
      game.unreveal(x, y);
    }
  } else {
    game.reveal(x, y);
  }
  
  refreshBoard();
};