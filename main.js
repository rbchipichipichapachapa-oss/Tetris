// Simple Tetris-like game
const COLS = 10
const ROWS = 20
const BLOCK = 30 // pixel size

const canvas = document.getElementById('board')
const ctx = canvas.getContext('2d')
canvas.width = COLS * BLOCK
canvas.height = ROWS * BLOCK

const nextCanvas = document.getElementById('next')
const nctx = nextCanvas.getContext('2d')
nextCanvas.width = 4 * BLOCK
nextCanvas.height = 4 * BLOCK

const scoreEl = document.getElementById('score')
const linesEl = document.getElementById('lines')
const levelEl = document.getElementById('level')
const startBtn = document.getElementById('startBtn')

const COLORS = [null,'#00f0f0','#0000f0','#f0a000','#f0f000','#00f000','#a000f0','#f00000']

const SHAPES = [
  [], // empty
  [[1,1,1,1]], // I
  [[2,2],[2,2]], // O
  [[0,3,0],[3,3,3]], // T
  [[4,4,0],[0,4,4]], // S
  [[0,5,5],[5,5,0]], // Z
  [[6,6,6],[6,0,0]], // L
  [[7,7,7],[0,0,7]]  // J
]

function createMatrix(cols, rows){
  const m = []
  for(let y=0;y<rows;y++) m.push(new Array(cols).fill(0))
  return m
}

function drawMatrix(matrix, offset, context, blockSize){
  const g = context || ctx
  const size = blockSize || BLOCK
  for(let y=0;y<matrix.length;y++){
    for(let x=0;x<matrix[y].length;x++){
      const val = matrix[y][x]
      if(val){
        g.fillStyle = COLORS[val]
        g.fillRect((x+offset.x)*size, (y+offset.y)*size, size-1, size-1)
      }
    }
  }
}

function rotate(matrix){
  const N = matrix.length
  const res = []
  for(let x=0;x<N;x++){
    res[x] = []
    for(let y=0;y<N;y++){
      res[x][y] = matrix[N-1-y][x] || 0
    }
  }
  return res
}

function randomPiece(){
  const id = Math.floor(Math.random()* (SHAPES.length-1)) +1
  const shape = SHAPES[id]
  // normalize to square matrix
  const size = Math.max(shape.length, shape[0].length)
  const matrix = []
  for(let y=0;y<size;y++){
    matrix[y]=[]
    for(let x=0;x<size;x++){
      matrix[y][x] = (shape[y] && shape[y][x]) || 0
    }
  }
  return {matrix, id}
}

let board, player, next, dropCounter, dropInterval, lastTime, score, lines, level, gameOver

function resetGame(){
  board = createMatrix(COLS, ROWS)
  player = {pos:{x:3,y:0}, matrix: randomPiece().matrix, id:0}
  next = randomPiece()
  dropCounter = 0
  dropInterval = 1000
  lastTime = 0
  score = 0
  lines = 0
  level = 1
  gameOver = false
  updateUI()
  draw()
}

function merge(board, player){
  const m = player.matrix
  for(let y=0;y<m.length;y++){
    for(let x=0;x<m[y].length;x++){
      if(m[y][x]){
        board[y+player.pos.y][x+player.pos.x] = m[y][x]
      }
    }
  }
}

function collide(board, player){
  const m = player.matrix
  for(let y=0;y<m.length;y++){
    for(let x=0;x<m[y].length;x++){
      if(m[y][x]){
        const by = y + player.pos.y
        const bx = x + player.pos.x
        if(by>=ROWS || bx<0 || bx>=COLS || board[by][bx]) return true
      }
    }
  }
  return false
}

function sweep(){
  let rowCount = 0
  outer: for(let y=ROWS-1;y>=0;y--){
    for(let x=0;x<COLS;x++){
      if(!board[y][x]){
        continue outer
      }
    }
    const row = board.splice(y,1)[0]
    board.unshift(new Array(COLS).fill(0))
    y++
    rowCount++
  }
  if(rowCount>0){
    lines += rowCount
    score += (rowCount * 100) * rowCount
    level = 1 + Math.floor(lines/10)
    dropInterval = Math.max(100, 1000 - (level-1)*100)
    updateUI()
  }
}

function playerDrop(){
  player.pos.y++
  if(collide(board, player)){
    player.pos.y--
    merge(board, player)
    sweep()
    spawn()
  }
  dropCounter = 0
}

function spawn(){
  player.matrix = next.matrix
  player.pos = {x: Math.floor((COLS - player.matrix[0].length)/2), y:0}
  next = randomPiece()
  if(collide(board, player)){
    gameOver = true
  }
}

function playerMove(dir){
  player.pos.x += dir
  if(collide(board, player)) player.pos.x -= dir
}

function playerRotate(){
  const old = player.matrix
  player.matrix = rotate(player.matrix)
  // wall kick basic
  let offset = 1
  while(collide(board, player)){
    player.pos.x += offset
    offset = -(offset + (offset>0?1:-1))
    if(Math.abs(offset) > player.matrix[0].length){
      player.matrix = old
      return
    }
  }
}

function updateUI(){
  scoreEl.textContent = score
  linesEl.textContent = lines
  levelEl.textContent = level
}

function draw(){
  ctx.clearRect(0,0,canvas.width, canvas.height)
  // draw board
  drawMatrix(board, {x:0,y:0})
  // draw player
  drawMatrix(player.matrix, player.pos)
  // next
  nctx.clearRect(0,0,nextCanvas.width,nextCanvas.height)
  drawMatrix(next.matrix, {x:0,y:0}, nctx, BLOCK)
}

function update(time=0){
  const delta = time - lastTime
  lastTime = time
  dropCounter += delta
  if(dropCounter > dropInterval && !gameOver){
    playerDrop()
  }
  draw()
  if(!gameOver) requestAnimationFrame(update)
  else{
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(0, canvas.height/2 -40, canvas.width, 80)
    ctx.fillStyle = '#fff'
    ctx.font = '24px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Game Over', canvas.width/2, canvas.height/2+8)
  }
}

document.addEventListener('keydown', e=>{
  if(gameOver) return
  if(e.key === 'ArrowLeft') playerMove(-1)
  else if(e.key === 'ArrowRight') playerMove(1)
  else if(e.key === 'ArrowDown') playerDrop()
  else if(e.key === 'ArrowUp') playerRotate()
  draw()
})

startBtn.addEventListener('click', ()=>{
  resetGame()
  requestAnimationFrame(update)
})

// init
resetGame()
