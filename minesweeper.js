/**
 * Minesweeper API
 */

function Minesweeper(difficulty) {
  // Difficulty level settings
  this.BEGINNER = { width: 8, height: 8, mines: 10 };
  this.INTERMEDIATE = { width: 16, height: 16, mines: 40 };
  this.EXPERT = { width: 30, height: 16, mines: 99 };
  
  // Board location states
  this.UNREVEALED = 1;        // Player has not revealed
  this.REVEALED = 2;          // Player has revealed
  this.FLAGGED = 4;           // Player flagged as mine
  this.MARKED = 8;            // Player pencil-marked as "?"
  this.MINED = 16;            // Revealed as a mine (game ended)
  this.MINE_EXPLODED = 32;    // Revealed as an exploded mine (game ended)
  this.CORRECT_MINE = 64;     // Player correctly flagged location (game ended)
  this.INCORRECT_MINE = 128;  // Player incorrectly flagged location (game ended)
  
  this.board = [];
  this.settings = {};
  this.inProgress = true;
  this.win = false;
  
  switch (difficulty) {
    case "expert":
      this.settings = this.EXPERT;
      break;
    case "intermediate":
      this.settings = this.INTERMEDIATE;
      break;
    default:
      this.settings = this.BEGINNER;
  }
  
  this.initBoard();
  this.initMines();
}

/**
 * Initialize the game board.
 */
Minesweeper.prototype.initBoard = function () {
  var x, y, col;
  for (x = 0; x < this.settings.width ; x++) {
    col = [];
    for (y = 0; y < this.settings.height ; y++) {
      col.push({
        x: x,
        y: y,
        mined: false,
        state: this.UNREVEALED
      });
    }
    this.board.push(col);
  }
};

/**
 * Set mines in random locations on the board and set each loction's number
 * of neighboring mines.
 */
Minesweeper.prototype.initMines = function () {
  // Populate mines
  var minesRemaining = this.settings.mines;
  while (minesRemaining > 0) {
    var randomX = Math.floor(Math.random() * this.settings.width);
    var randomY = Math.floor(Math.random() * this.settings.height);
    if (!this.board[randomX][randomY].mined) {
      this.board[randomX][randomY].mined = true;
      minesRemaining--;
    }
  }
  // Set nearby mines values
  var x, y;
  for (x = 0; x < this.settings.width ; x++) {
    for (y = 0; y < this.settings.height ; y++) {
      this.board[x][y].nearbyMines = this.countNearbyMines(x, y);
    }
  }
};

/**
 * Actions taken when the player flags a location as mined.  Allow this if the
 * location is currently unrevealed or marked.
 *
 * @param X coordinate
 * @param Y coordinate
 */
Minesweeper.prototype.flag = function (x, y) {
  if (!this.inProgress) return;
  
  if ((this.board[x][y].state & (this.UNREVEALED + this.MARKED)) > 0) {
    this.board[x][y].state = this.FLAGGED;
  }
};

/**
 * Actions taken when the player pencil marks a location.  Allow this if the
 * location is currently unrevealed or flagged.
 *
 * @param X coordinate
 * @param Y coordinate
 */
Minesweeper.prototype.mark = function (x, y) {
  if (!this.inProgress) return;
  
  if ((this.board[x][y].state & (this.UNREVEALED + this.FLAGGED)) > 0) {
    this.board[x][y].state = this.MARKED;
  }
};

/**
 * Set a location as unrevealed (e.g., when toggling out of the MARKED state).
 * Allow this if the location is currently flagged or marked.
 *
 * @param X coordinate
 * @param Y coordinate
 */
Minesweeper.prototype.unreveal = function (x, y) {
  if (!this.inProgress) return;
  
  if ((this.board[x][y].state & (this.FLAGGED + this.MARKED)) > 0) {
    this.board[x][y].state = this.UNREVEALED;
  }
};

/**
 * Reveal this location and determine whether neighboring locations should also
 * be revealed.
 *
 * @param X coordinate
 * @param Y coordinate
 */
Minesweeper.prototype.checkReveal = function (x, y) {
  if (this.board[x][y].state === this.REVEALED) return;
  
  this.board[x][y].state = this.REVEALED;
  
  if (this.board[x][y].nearbyMines !== 0) return;
  
  var i, j, neighborX, neighborY;
  for (i = -1; i <= 1; i++) {
    for (j = -1; j <= 1; j++) {
      if (!(i === 0 && j === 0)) {
        neighborX = x + i;
        neighborY = y + j;
        if (neighborX >= 0 && neighborX < this.settings.width && neighborY >= 0 && neighborY < this.settings.height) {
          this.checkReveal(neighborX, neighborY);
        }
      }
    }
  }
};

/**
 * Count how many mines surround the given location.
 *
 * @param X coordinate
 * @param Y coordinate
 * @returns This location's number of surrounding mines
 */
Minesweeper.prototype.countNearbyMines = function (x, y) {
  var numMines = 0;
  var i, j, neighborX, neighborY;
  for (i = -1; i <= 1; i++) {
    for (j = -1; j <= 1; j++) {
      if (!(i === 0 && j === 0)) {
        neighborX = x + i;
        neighborY = y + j;
        if (neighborX >= 0 && neighborX < this.settings.width && neighborY >= 0 && neighborY < this.settings.height) {
          if (this.board[neighborX][neighborY].mined) {
            numMines++;
          }
        }
      }
    }
  }
  return numMines;
};

/**
 * Reveal the specified location.  If the location is mined, the game ends.
 * Otherwise, the board is updated.
 *
 * @param X coordinate
 * @param Y coordinate
 */
Minesweeper.prototype.reveal = function (x, y) {
  if (!this.inProgress) return;
  
  if (this.board[x][y].mined) {
    this.endGame(x, y, false);
  } else {
    this.checkReveal(x, y);
    if (this.checkComplete()) {
      this.endGame(x, y, true);
    }
  }
};

/**
 * Game ended.  Determine which flags the player got right and end the game.
 *
 * @param X coordinate of last reveal
 * @param Y coordinate of last reveal
 * @param Boolean indicating whether or not the game is a win
 */
Minesweeper.prototype.endGame = function (lastX, lastY, win) {
  var x, y;
  for (x = 0; x < this.settings.width ; x++) {
    for (y = 0; y < this.settings.height ; y++) {
      if (this.board[x][y].mined && this.board[x][y].state !== this.FLAGGED) {
        this.board[x][y].state = this.MINED;
      }
      if (this.board[x][y].mined && this.board[x][y].state === this.FLAGGED) {
        this.board[x][y].state = this.CORRECT_MINE;
      }
      if (!this.board[x][y].mined && this.board[x][y].state === this.FLAGGED) {
        this.board[x][y].state = this.INCORRECT_MINE;
      }
    }
  }
  
  if (!win) {
    this.board[lastX][lastY].state = this.MINE_EXPLODED;
  }
  
  this.inProgress = false;
  this.win = win;
};

/**
 * Checks the board state to see if the game is complete.  The game is complete
 * if no location is left unrevealed.
 *
 * @returns Boolean indicating whether game is complete.
 */
Minesweeper.prototype.checkComplete = function () {
  var complete = true;
  var x, y;
  for (x = 0; x < this.settings.width ; x++) {
    for (y = 0; y < this.settings.height ; y++) {
      if (!this.board[x][y].mined && (this.board[x][y].state === this.UNREVEALED)) {
        complete = false;
      }
    }
  }
  this.inProgress = !complete;
  return complete;
};

/**
 * Subtracts the number of flagged locations from the number of mines on the
 * board.
 *
 * @returns Number of flags remaining
 */
Minesweeper.prototype.flagsRemaining = function () {
  var flags = this.settings.mines;
  var x, y;
  for (x = 0; x < this.settings.width ; x++) {
    for (y = 0; y < this.settings.height ; y++) {
      if (this.board[x][y].state === this.FLAGGED) {
        flags--;
      }
    }
  }
  return flags;
};