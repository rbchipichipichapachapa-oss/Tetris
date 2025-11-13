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

// --- Music: relaxing ambient generator (Web Audio API) ---
let audioCtx = null
let musicPlaying = false
let masterGain, osc1, osc2, lfo, noiseNode, noiseGain, filter

const musicBtn = document.getElementById('musicBtn')
const musicMode = document.getElementById('musicMode')

function initAudio(){
  if(audioCtx) return
  audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  masterGain = audioCtx.createGain(); masterGain.gain.value = 0.0; masterGain.connect(audioCtx.destination)

  // two detuned sine oscillators for warmth
  osc1 = audioCtx.createOscillator(); osc1.type = 'sine'; osc1.frequency.value = 220
  osc2 = audioCtx.createOscillator(); osc2.type = 'sine'; osc2.frequency.value = 330
  const oscGain = audioCtx.createGain(); oscGain.gain.value = 0.04
  osc1.connect(oscGain); osc2.connect(oscGain); oscGain.connect(masterGain)

  // slow LFO to modulate filter cutoff for movement
  lfo = audioCtx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.05
  const lfoGain = audioCtx.createGain(); lfoGain.gain.value = 300
  filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 800
  oscGain.connect(filter); filter.connect(masterGain)
  lfo.connect(lfoGain); lfoGain.connect(filter.frequency)

  // gentle noise for texture
  const bufferSize = 2 * audioCtx.sampleRate
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate)
  const output = noiseBuffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) output[i] = (Math.random()*2-1) * 0.2
  noiseNode = audioCtx.createBufferSource(); noiseNode.buffer = noiseBuffer; noiseNode.loop = true
  noiseGain = audioCtx.createGain(); noiseGain.gain.value = 0.02
  const noiseFilter = audioCtx.createBiquadFilter(); noiseFilter.type='lowpass'; noiseFilter.frequency.value = 1200
  noiseNode.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(masterGain)

  // start nodes
  osc1.start(); osc2.start(); lfo.start(); noiseNode.start();
}

function fadeInMusic(){
  initAudio()
  // Start the selected mode
  masterGain.gain.cancelScheduledValues(audioCtx.currentTime)
  masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime)
  masterGain.gain.linearRampToValueAtTime(0.6, audioCtx.currentTime + 2.5)
  musicPlaying = true
  musicBtn.textContent = 'Pause Music'
  // if the user selected folk, start the folk engine instead of ambient
  if(musicMode && musicMode.value === 'folk'){
    startFolkMusic()
  }
}

function fadeOutMusic(){
  if(!audioCtx) return
  masterGain.gain.cancelScheduledValues(audioCtx.currentTime)
  masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime)
  masterGain.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + 1.5)
  // stop folk-specific nodes if running
  stopFolkMusic()
  musicPlaying = false
  musicBtn.textContent = 'Play Music'
}

musicBtn.addEventListener('click', async ()=>{
  // Web Audio requires user gesture to start on many browsers
  if(!audioCtx){
    try{initAudio()}catch(e){console.warn('Audio init failed',e)}
  }
  if(!musicPlaying){
    // resume context if suspended
    if(audioCtx.state === 'suspended') await audioCtx.resume()
    // If ambient selected, ensure ambient nodes exist (initAudio already created them)
    if(musicMode && musicMode.value === 'ambient'){
      // ambient was created by initAudio
    }
    fadeInMusic()
  } else {
    fadeOutMusic()
  }
})

// --- Folk music implementation (simple melody + chord accompaniment) ---
let folkGain = null
let folkInterval = null
let folkChordNodes = []
let folkMelodyIndex = 0

function noteFreqFromSemitone(rootFreq, semitoneOffset){
  return rootFreq * Math.pow(2, semitoneOffset/12)
}

function startFolkMusic(){
  if(!audioCtx) return
  // if already running, don't start again
  if(folkInterval) return
  // create a dedicated gain for folk so we can fade/stop it independently
  folkGain = audioCtx.createGain(); folkGain.gain.value = 0.0; folkGain.connect(audioCtx.destination)

  // Chord pad: simple detuned saws
  const padRoot = 196 // G3 ~ folk-friendly
  const chordProgression = [0,7,9,5] // I, V, vi, IV in semitones relative to G
  let chordIndex = 0

  function playChord(progStep){
    // stop previous chord nodes
    folkChordNodes.forEach(n=>{ try{ n.osc.stop(); }catch(e){} })
    folkChordNodes = []
    const chordRoot = padRoot * Math.pow(2, chordProgression[progStep]/12)
    const thirds = [0,4,7] // major triad
    thirds.forEach((st,i)=>{
      const o = audioCtx.createOscillator(); o.type='sawtooth'; o.frequency.value = chordRoot * Math.pow(2,i)
      o.detune.value = (i%2===0)?-10:10
      const g = audioCtx.createGain(); g.gain.value = 0.06
      const f = audioCtx.createBiquadFilter(); f.type='lowpass'; f.frequency.value = 900
      o.connect(f); f.connect(g); g.connect(folkGain)
      o.start()
      folkChordNodes.push({osc:o,gain:g,filter:f})
    })
  }

  // initial chord
  playChord(chordIndex)
  // change chord every 4 beats (approx)
  const chordTimeMs = 1600
  const chordTimer = setInterval(()=>{
    chordIndex = (chordIndex+1) % chordProgression.length
    playChord(chordIndex)
  }, chordTimeMs)

  // Melody: simple folk-like motif using semitone offsets in major scale
  const root = 392 // G4
  const majorScale = [0,2,4,5,7,9,11,12]
  const melody = [0,2,4,2,0, -2,0,4,5,7,5,4,2,0]
  folkMelodyIndex = 0

  function playMelodyNote(){
    const semitone = melody[folkMelodyIndex % melody.length]
    const freq = noteFreqFromSemitone(root, semitone)
    const o = audioCtx.createOscillator(); o.type='triangle'; o.frequency.value = freq
    const g = audioCtx.createGain(); g.gain.value = 0
    const env = {a:0.01,d:0.12,s:0.6,r:0.6}
    o.connect(g); g.connect(folkGain)
    const now = audioCtx.currentTime
    g.gain.cancelScheduledValues(now)
    g.gain.setValueAtTime(0, now)
    g.gain.linearRampToValueAtTime(0.18, now + env.a)
    g.gain.linearRampToValueAtTime(env.s * 0.18, now + env.a + env.d)
    g.gain.linearRampToValueAtTime(0, now + env.a + env.d + env.r)
    o.start(now)
    o.stop(now + env.a + env.d + env.r + 0.05)
    folkMelodyIndex++
  }

  // Start playing melody regularly
  folkInterval = setInterval(()=>{
    playMelodyNote()
  }, 400)

  // fade in folk gain
  folkGain.gain.cancelScheduledValues(audioCtx.currentTime)
  folkGain.gain.setValueAtTime(0, audioCtx.currentTime)
  folkGain.gain.linearRampToValueAtTime(0.6, audioCtx.currentTime + 1.5)

  // store chordTimer so we can clear it on stop (attach to folkInterval object)
  folkInterval._chordTimer = chordTimer
}

function stopFolkMusic(){
  if(!audioCtx) return
  if(!folkInterval) return
  // fade out
  try{
    folkGain.gain.cancelScheduledValues(audioCtx.currentTime)
    folkGain.gain.setValueAtTime(folkGain.gain.value, audioCtx.currentTime)
    folkGain.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + 0.8)
  }catch(e){}
  // clear intervals and stop oscillators after fade
  clearInterval(folkInterval)
  if(folkInterval._chordTimer) clearInterval(folkInterval._chordTimer)
  setTimeout(()=>{
    try{ folkChordNodes.forEach(n=>{ n.osc.stop(); }) }catch(e){}
    try{ folkGain.disconnect(); }catch(e){}
    folkGain = null
    folkChordNodes = []
    folkInterval = null
  }, 900)
}
