window.AudioContext = window.AudioContext || window.webkitAudioContext
var ac = new AudioContext()
var synth = require('./')(ac)
// just connect and start the synth to make sure it plays, edit as needed!
synth.connect(ac.destination)


window.setInterval(function () {
    synth.update({freq: [222, 420, 333, 555, 666][~~(Math.random() * 5)]}, ac.currentTime + 0.5)
    synth.start(ac.currentTime)
}, 1000)

