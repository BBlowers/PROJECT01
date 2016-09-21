var game = game || {};
var board = board || {};
game.domElement = document.getElementById("game");
game.titleElement = document.createElement("H1");
game.titleElement.textContent = "Checkers";
game.winScreenElement = document.createElement("DIV");
game.winScreenElement.className = "hidden";
game.winScreenTextElement = document.createElement("H2");
game.images = ["/images/highlighted.png", "/images/player1hashops.png", "/images/player1isking.png", "/images/player1iskinghashops.png", "/images/player1iskingisselected.png", "/images/player1isselected.png", "/images/player2.png", "/images/player2hashops.png", "/images/player2isking.png", "/images/player2iskinghashops.png", "/images/player2iskingisselected.png", "/images/player2isselected.png"];
game.preloadImages = function () {
  for (var i = 0; i < game.images.length; i++) {
    var image = new Image();
    image.src = game.images[i];
  }
}
game.domElement.appendChild(game.titleElement);
game.domElement.appendChild(game.winScreenElement);
game.winScreenElement.appendChild(game.winScreenTextElement);

game.preloadImages();

board.squares = [];
board.width = 8;
board.noActiveMove = true;
board.currentPlayer = "player1";
board.currentSelectedSquare = null; 
board.activeMove = null;
board.domElement = document.createElement("DIV");
board.domElement.className = "board";
board.currentPlayerNeedsToHop = false;

board.createBoard = function() {
  game.domElement.appendChild(this.domElement);
  for (var i = 0; i < this.width * 8; i++) {
    this.squares.push(new Square(i));
  }
};

board.kingMe = function(square) { //this will need to be revissited to check how the indeces work
  if (square.player === "player1" && square.boardIndex >= board.squares.length - board.width) {
    square.isKing = true;
  } else if (square.player === "player2" && square.boardIndex < board.width) {
    square.isKing = true;
  }
};

board.isSquareEmpty = function(square) { //returns null if square is black, true if its empty and false if it contains a players piece.
  if (square === undefined) {
    return false;
  }
  if (square.domElement.className === "square black") {
    return null;
  } else if (square.player === "empty") {
    return true;
  } else {
    return false;
  }
};

board.getPossibleSquares = function(square) {
  var availableSquares = [];
  if (square.player === "player1" || square.isKing) {
    availableSquares.push([board.squares[square.boardIndex + board.width + 1],board.squares[square.boardIndex + board.width * 2 + 2]]);
    availableSquares.push([board.squares[square.boardIndex + board.width - 1],board.squares[square.boardIndex + board.width * 2 - 2]]);
  }
  if (square.player === "player2" || square.isKing) {
    availableSquares.push([board.squares[square.boardIndex - board.width + 1],board.squares[square.boardIndex - board.width * 2 + 2]]);
    availableSquares.push([board.squares[square.boardIndex - board.width - 1],board.squares[square.boardIndex - board.width * 2 - 2]]);
  }
  return availableSquares; //returns a 2d array with adjacents at index [?][0] and secondaries at [?][1] available to the piece.
};

board.checkPossibleMoves = function(availableSquares) {
  var possibleMoves = [];
  for (var i = 0; i < availableSquares.length; i++) {//could rewrite this reffering to current player rather than square.player.
    if (board.isSquareEmpty(availableSquares[i][0])) {
      possibleMoves.push(availableSquares[i][0]); 
    } else if (board.isSquareEmpty(availableSquares[i][1]) && availableSquares[i][0].player !== board.currentPlayer && board.isSquareEmpty(availableSquares[i][1]) !== null) {
      availableSquares[i][1].hoppedSquare = availableSquares[i][0];
      possibleMoves.push(availableSquares[i][1]); //[i][0] should be marked if [i][1] is "empty", so that it can be removed if  [i][1] is chosen as the move
    }
  }
  return possibleMoves;
};

board.checkPossibleHops = function(availableSquares) {
  var possibleHops = [];
  for (var i = 0; i < availableSquares.length; i++) {//could rewrite this reffering to current player rather than square.player.
    if (board.isSquareEmpty(availableSquares[i][1]) && availableSquares[i][0].player !== board.currentPlayer && !board.isSquareEmpty(availableSquares[i][0]) && board.isSquareEmpty(availableSquares[i][1]) !== null) {
      availableSquares[i][1].hoppedSquare = availableSquares[i][0];
      possibleHops.push(availableSquares[i][1]); //[i][0] should be marked if [i][1] is "empty", so that it can be removed if  [i][1] is chosen as the move
    }
  }
  return possibleHops;
};

board.highlightCurrentSquares = function(possibleMoves) {
  for (var i = 0; i < board.squares.length; i++) {
    board.squares[i].isHighlighted = false;
    board.squares[i].domElement.innerHTML = board.squares[i].player;
  }
  for (var i = 0; i < possibleMoves.length; i++) {
    if (possibleMoves[i].domElement.className !== "black")
    possibleMoves[i].isHighlighted = true;
    // possibleMoves[i].domElement.innerHTML = '<img src=/images/highlighted.png>' 
  }
};

board.playersAvailableHops = function () { //this function checks all squares of the current players, sets [i].hasAvailableHops = true; and returns an array of only the players squares which can move
  var availableHops = [];

  for (var i = 0; i < board.squares.length; i++) {
    var availableSquares = board.getPossibleSquares(board.squares[i]);
    var possibleHops = board.checkPossibleHops(availableSquares);
    if (board.squares[i].player === board.currentPlayer && possibleHops.length > 0) {
      board.squares[i].hasAvailableHops = true;
      availableHops.push(board.squares[i]);
    }
    board.resetSquareInnerHTML();

  }
  return availableHops;
}

board.clearLastTurn = function () {
  for (var i = 0; i < board.squares.length; i++) {
    // board.squares[i].domElement.innerHTML = board.squares[i].player;
    board.squares[i].isSelected = false;
    board.squares[i].isHighlighted = false;
    board.squares[i].hoppedSquare = null;
    board.squares[i].hasAvailableHops = false;
    board.squares[i].domElement.innerHTML = board.squares[i].player;
    board.noActiveMove = true;
  }
};

board.emptyCurrentSquares = function (arrayToEmpty) {
  for (var i = 0; i < arrayToEmpty.length; i++) {
    arrayToEmpty[i].isKing = false;
    arrayToEmpty[i].player = "empty";
    arrayToEmpty[i].isHighlighted = false;
    arrayToEmpty[i].hasAvailableHops = false;
    arrayToEmpty[i].isSelected = false;
    arrayToEmpty[i].hoppedSquare = null;
  }
};

board.playerHasAvailableMoves = function () {
  var possibleMoves = [];
  for (var i = 0; i < board.squares.length; i++) {
    if (board.squares[i].player === board.currentPlayer) {
      var availableSquares = board.getPossibleSquares(board.squares[i]);
      possibleMoves = board.checkPossibleMoves(availableSquares);
    }
    if (possibleMoves.length > 0) {      
      return true;
      
    }
  }
  return false;
}

board.checkPossibleMoves = function(availableSquares) {
  var possibleMoves = [];
  for (var i = 0; i < availableSquares.length; i++) {//could rewrite this reffering to current player rather than square.player.
    if (board.isSquareEmpty(availableSquares[i][0])) {
      possibleMoves.push(availableSquares[i][0]); 
    } else if (board.isSquareEmpty(availableSquares[i][1]) && availableSquares[i][0].player !== board.currentPlayer && board.isSquareEmpty(availableSquares[i][1]) !== null) {
      availableSquares[i][1].hoppedSquare = availableSquares[i][0];
      possibleMoves.push(availableSquares[i][1]); //[i][0] should be marked if [i][1] is "empty", so that it can be removed if  [i][1] is chosen as the move
    }
  }
  return possibleMoves;
};

game.fadeIn = function (el) {
  game.winScreenElement.className = "winScreenElement";
  el.style.opacity = 0;

  var last = +new Date();
  var tick = function() {
    el.style.opacity = +el.style.opacity + (new Date() - last) / 400;
    last = +new Date();

    if (+el.style.opacity < 0.8) {
      (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16);
    }
  };
  tick();
}

game.winScreen = function () {
  // board.fadeOut(board.domElement);
  if (board.currentPlayer === "player1") {
    game.winScreenTextElement.textContent = "Congradulations Blue you won!";
    game.winScreenElement.style.backgroundColor = "rgb(51, 153, 255)";
  } else {
    game.winScreenTextElement.textContent = "Congradulations Red you won!";
    game.winScreenElement.style.backgroundColor = "rgb(255, 51, 51)";
  }
  game.fadeIn(game.winScreenElement);


  
}
board.squareClicked = function () {
  if (board.noActiveMove && board.currentPlayerNeedsToHop && this.hasAvailableHops) {//add condition to check whether it is players piece here. replacing !board.isSquareEmpty(this)
    this.isSelected = true;
    board.currentSelectedSquare = this;
    var availableSquares = board.getPossibleSquares(this); //returns 2d array of potential moves for the selected piece

    var possibleHops = board.checkPossibleHops(availableSquares); //returns an array of possible hops for selected piece

    board.highlightCurrentSquares(possibleHops); //highlights the possible hops changing their highlighted porperty and their img to a yellow circle

    board.noActiveMove = false;

  } else if (board.noActiveMove && this.player === board.currentPlayer && !board.currentPlayerNeedsToHop) {//add condition to check whether it is players piece here. replacing !board.isSquareEmpty(this)
    this.isSelected = true;
    board.currentSelectedSquare = this;
    var availableSquares = board.getPossibleSquares(this); //returns 2d array of potential moves for the selected piece

    var possibleMoves = board.checkPossibleMoves(availableSquares); //returns an array of possible moves for selected piece

    board.highlightCurrentSquares(possibleMoves); //highlights the possible moves changing their highlighted porperty and their img to a yellow circle

    board.noActiveMove = false;
    
  } else if (this.isHighlighted) {
    // board.clearLastTurn(); // here is where the this.hasAvailableHops is set to false when it shouldnt be
    this.isKing = board.currentSelectedSquare.isKing;
    this.player = board.currentSelectedSquare.player;
    this.domElement.innerHTML = this.player;
    if (this.hoppedSquare !== null) {
      board.emptyCurrentSquares([board.currentSelectedSquare, this.hoppedSquare]);
    } else {
      board.emptyCurrentSquares([board.currentSelectedSquare]);
    }
    
    // check for available extra hops here
    var availableSquares = board.getPossibleSquares(this); //returns 2d array of potential moves for the selected piece
    var possibleHops = board.checkPossibleHops(availableSquares); //returns an array of possible moves for selected piece
    if (possibleHops.length > 0 && this.hoppedSquare !== null) {
      board.currentSelectedSquare = this;      
      board.highlightCurrentSquares(possibleHops); //highlights the possible moves changing their highlighted porperty and their img to a yellow circle
      this.isSelected = true;
      this.isHighlighted = false;

    } else {
      board.kingMe(this);
      if (board.currentPlayer === "player1") { //this part happens when a person has moved a piece and that piece has no more moves. This happens at the end of a players turn.
        board.currentPlayer = "player2";
      } else {
        board.currentPlayer = "player1";
      }
      // here it should check for available hops for the next persons turn
      board.clearLastTurn();
      if (board.playersAvailableHops().length > 0) {
        board.currentPlayerNeedsToHop = true;
      } else {
        board.currentPlayerNeedsToHop = false;
      }
      board.clearSquareHops();
      if (!board.playerHasAvailableMoves()) {
        game.winScreen();
      }
      
    }

    
  } else if (this.isSelected && this.hoppedSquare === null) {
    this.isSelected = false;
    board.noActiveMove = true;
    board.clearHighlights();
  }
  for (var i = 0; i < board.squares.length; i++) {
    if (board.squares[i].hasAvailableHops) {
    }
  }
  board.resetSquareInnerHTML();
  
  
};

board.clearSquareHops = function () {
  for (var i = 0; i < board.squares.length; i++)
    board.squares[i].hoppedSquare = null;
}
  
board.clearHighlights = function () {
  for (var i = 0; i < board.squares.length; i++) {
    board.squares[i].isHighlighted = false;
  }
}

board.resetSquareInnerHTML = function () {
  for (var i = 0; i < board.squares.length; i++) {
    var isSelectedOrHasHops = "";
    if (board.squares[i].isSelected) {
      isSelectedOrHasHops = "isselected";
    } else if (board.squares[i].hasAvailableHops) {
      isSelectedOrHasHops = "hashops";
    }
    var isHighlighted = "";
    if (board.squares[i].isHighlighted) {
      isHighlighted = "ishighlighted";
    }
    
    var isKing = "";
    if (board.squares[i].isKing) {
      isKing = "isking";
    }
    
    var player = board.squares[i].player;

    if (board.squares[i].player !== "empty") {
      board.squares[i].domElement.innerHTML = '<img className="boardPiece" src="/images/' + player + isKing + isSelectedOrHasHops + isHighlighted + '.png">';
    } else if (board.squares[i].isHighlighted) {
      board.squares[i].domElement.innerHTML = '<img className=highlighted src="/images/highlighted.png">';
    } else {
      board.squares[i].domElement.innerHTML = "";
    }
  }
}
//check win condition after each click

function Square(i) { 
// creates each square on the board applying certain properties depending on position
  this.domElement = document.createElement("div");
  this.boardIndex = i;
  this.squareNumber = i + 1;
  this.isHighlighted = false;
  this.isSelected = false;
  this.isKing = false;
  this.hoppedSquare = null;
  this.hasAvailableHops = false;
  
  if (Math.ceil(this.squareNumber/board.width) % 2 === 0){
    if (this.squareNumber % 2 === 0) {
      this.domElement.className = "square black";
    } else {
      this.domElement.className = "square white";
      this.domElement.addEventListener("click", board.squareClicked.bind(this));
    }

  } else {
    if (this.squareNumber % 2 === 0) {
      this.domElement.className = "square white";
      this.domElement.addEventListener("click", board.squareClicked.bind(this));

    } else {
      this.domElement.className = "square black";
    }
  }
  if (this.domElement.className.includes("white") && this.squareNumber <= board.width * 3) {
    this.domElement.innerHTML = '<img className="boardPiece" src="/images/player1.png">';
    this.player = "player1";
  } else if (this.domElement.className.includes("white") && this.squareNumber > board.width * 5) {
    this.domElement.innerHTML = '<img className="boardPiece" src="/images/player2.png">';
    this.player = "player2";
  } else {
    this.player = "empty";
  }  
  board.domElement.appendChild(this.domElement);
}

board.createBoard();