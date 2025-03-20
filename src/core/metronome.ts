const NOTE_LENGTH = 0.05 // length of "beep" (in seconds)
const SCHEDULE_AHEAD_TIME = 0.1 // How far ahead to schedule audio (sec)
const LOOK_AHEAD = 25.0 // How frequently to call scheduling function (in milliseconds)

export class MetronomeController {
  timerWorker!: Worker
  audioContext = new window.AudioContext()
  volume = this.audioContext.createGain()

  current16thNote = 0 // What note is currently last scheduled?
  tempo = 90.0 // tempo (in beats per minute)
  notesInQueue: Array<{ note: number; time: number }> = [] // the notes that have been put into the web audio,
  nextNoteTime = 0.0 // when the next note is due.
  last16thNoteDrawn = -1 // the last "box" we drew on the screen
  noteResolution = 2 // 0 == 16th, 1 == 8th, 2 == quarter note
  // This is calculated from lookahead, and overlaps
  // with next interval (in case the timer is late)
  isPlaying = false // Are we currently playing?
  unlocked = false
  beatStyles: Array<string> = []

  constructor() {}

  getAudioContext() {
    return this.audioContext
  }

  setTemp(tempo: number) {
    this.tempo = tempo
  }

  setMasterVolume(value: number) {
    this.volume.gain.setValueAtTime(value, this.audioContext.currentTime)
  }

  setNoteResolution(noteResolution: number) {
    this.noteResolution = noteResolution
  }

  initTimerWorker(srciptURL: URL) {
    this.timerWorker = new Worker(srciptURL)
    this.timerWorker.onmessage = (e: MessageEvent) => {
      if (e.data == 'tick') {
        this.scheduler()
      } else {
        console.log('message: ' + e.data)
      }
    }
    this.timerWorker.postMessage({ interval: LOOK_AHEAD })

    requestAnimationFrame(() => {
      this.draw()
    })
  }

  draw() {
    let currentNote = this.last16thNoteDrawn
    if (this.audioContext) {
      const currentTime = this.audioContext.currentTime

      while (this.notesInQueue.length && this.notesInQueue[0]?.time < currentTime) {
        currentNote = this.notesInQueue[0]?.note
        this.notesInQueue.splice(0, 1) // remove note from queue
      }

      // We only need to draw if the note has moved.
      if (this.last16thNoteDrawn != currentNote) {
        // let x = Math.floor(canvas.width / 18);
        // canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        const beatStyles = []

        for (let i = 0; i < 16; i++) {
          const fillStyle = currentNote == i ? (currentNote % 4 === 0 ? 'red' : 'blue') : 'black'
          // console.log(fillStyle, i)
          beatStyles.push(fillStyle)
          //   canvasContext.fillRect(x * (i + 1), x, x / 2, x / 2);
        }
        this.beatStyles = beatStyles
        this.last16thNoteDrawn = currentNote
      }
    }
    // set up to draw again
    requestAnimationFrame(() => {
      this.draw()
    })
  }

  play() {
    if (!this.audioContext) this.audioContext = new AudioContext()

    if (!this.unlocked) {
      // play silent buffer to unlock the audio
      const buffer = this.audioContext.createBuffer(1, 1, 22050)
      const node = this.audioContext.createBufferSource()
      node.buffer = buffer
      node.start(0)
      this.unlocked = true
    }

    this.isPlaying = !this.isPlaying

    if (this.isPlaying) {
      // start playing
      this.current16thNote = 0
      this.nextNoteTime = this.audioContext.currentTime
      this.timerWorker.postMessage('start')
    } else {
      this.timerWorker.postMessage('stop')
    }
  }

  stop() {
    this.isPlaying = false
    this.timerWorker.postMessage('stop')
  }

  nextNote() {
    // Advance current note and time by a 16th note...
    const secondsPerBeat = 60.0 / this.tempo // Notice this picks up the CURRENT
    // tempo value to calculate beat length.
    this.nextNoteTime += 0.25 * secondsPerBeat // Add beat length to last beat time

    this.current16thNote++ // Advance the beat number, wrap to zero
    if (this.current16thNote == 16) {
      this.current16thNote = 0
    }
  }

  scheduleNote(beatNumber: number, time: number) {
    // push the note on the queue, even if we're not playing.
    this.notesInQueue.push({ note: beatNumber, time: time })

    if (this.noteResolution == 1 && beatNumber % 2) return // we're not playing non-8th 16th notes
    if (this.noteResolution == 2 && beatNumber % 4) return // we're not playing non-quarter 8th notes

    // create an oscillator
    const note = this.audioContext.createOscillator()
    note.connect(this.volume)
    this.volume.connect(this.audioContext.destination)
    if (beatNumber % 16 === 0)
      // beat 0 == high pitch
      note.frequency.value = 880.0
    else if (beatNumber % 4 === 0)
      // quarter notes = medium pitch
      note.frequency.value = 440.0
    // other 16th notes = low pitch
    else note.frequency.value = 220.0

    note.start(time)
    note.stop(time + NOTE_LENGTH)
  }

  scheduler() {
    // while there are notes that will need to play before the next interval,
    // schedule them and advance the pointer.
    while (this.nextNoteTime < this.audioContext.currentTime + SCHEDULE_AHEAD_TIME) {
      this.scheduleNote(this.current16thNote, this.nextNoteTime)
      this.nextNote()
    }
  }
}
