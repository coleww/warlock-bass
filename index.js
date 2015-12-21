var adsr = require('a-d-s-r')
var makeDistortionCurve = require('make-distortion-curve')

// yr function should accept an audioContext, and optional params/opts
module.exports = function (ac, opts) {
  // make some audioNodes, connect them, store them on the object
  var audioNodes = {
    one:  ac.createOscillator(),
    two:  ac.createOscillator(),
    three:  ac.createOscillator(),
    four:  ac.createOscillator(),
    lfo: ac.createOscillator(),
    filterlfogain: ac.createGain(),
    postfilterlfogain: ac.createGain(),
    pregain: ac.createGain(),
    postGain: ac.createGain(),
    filter: ac.createBiquadFilter(),
    delay: ac.createDelay(0.075),
    distortion: ac.createWaveShaper(),
    postFilter: ac.createBiquadFilter(),
    envelope: ac.createGain(),
    settings: {
      freq: 440,
      attack: 0.051,
      decay: 0.05,
      sustain: 0.21,
      release: 0.25,
      detune: 5,
      peak: 0.5,
      mid: 0.3,
      end: 0.000001
    }
  }

  audioNodes.one.type = 'square'
  audioNodes.two.type = 'sawtooth'
  audioNodes.three.type = 'sine'
  audioNodes.four.type = 'sawtooth'

  audioNodes.one.detune.setValueAtTime((((Math.random() * 2) - 1) * 1), ac.currentTime)
  audioNodes.two.detune.setValueAtTime((((Math.random() * 2) - 1) * 2), ac.currentTime)
  audioNodes.three.detune.setValueAtTime((((Math.random() * 2) - 1) * 3), ac.currentTime)
  audioNodes.four.detune.setValueAtTime((((Math.random() * 2) - 1) * 3), ac.currentTime)

  audioNodes.filter.type = 'lowpass'
  audioNodes.postFilter.type = 'peaking'

  audioNodes.filterlfogain.gain.value = 15050
  audioNodes.postfilterlfogain.gain.value = 10000

  audioNodes.lfo.connect(audioNodes.filterlfogain)
  audioNodes.lfo.connect(audioNodes.postfilterlfogain)
  audioNodes.filterlfogain.connect(audioNodes.filter.frequency)
  audioNodes.postfilterlfogain.connect(audioNodes.postFilter.frequency)

  audioNodes.distortion.curve = makeDistortionCurve(750)


  audioNodes.one.connect(audioNodes.pregain)
  audioNodes.two.connect(audioNodes.pregain)
  audioNodes.three.connect(audioNodes.pregain)
  audioNodes.four.connect(audioNodes.pregain)
  audioNodes.pregain.connect(audioNodes.filter)
  audioNodes.filter.connect(audioNodes.delay)
  audioNodes.delay.connect(audioNodes.postGain)
  audioNodes.filter.connect(audioNodes.distortion)
  audioNodes.distortion.connect(audioNodes.postGain)
  audioNodes.postGain.connect(audioNodes.postFilter)
  audioNodes.postFilter.connect(audioNodes.envelope)


  audioNodes.pregain.gain.setValueAtTime(1.0 / 3.0, ac.currentTime)
  audioNodes.postGain.gain.setValueAtTime(0.5, ac.currentTime)
  audioNodes.envelope.gain.setValueAtTime(0, ac.currentTime)
  audioNodes.lfo.frequency.setValueAtTime(1, ac.currentTime)

  audioNodes.one.start(ac.currentTime)
  audioNodes.two.start(ac.currentTime)
  audioNodes.three.start(ac.currentTime)
  audioNodes.four.start(ac.currentTime)
  audioNodes.lfo.start(ac.currentTime)

  return {
    connect: function (input) {
      audioNodes.envelope.connect(input)
    },
    start: function (when) {
      // //this function should call `start(when)` on yr source nodes. Probably oscillators/samplers i guess, and any LFO too!
      adsr(audioNodes.envelope, when, audioNodes.settings)
    },
    stop: function (when) {
      audioNodes.one.stop(when)
      audioNodes.two.stop(when)
      audioNodes.three.stop(when)
    },
    update: function (opts, when) {
      Object.keys(opts).forEach(function (k) {
        var v = opts[k]
        if (k == 'midiNote' || k == 'freq') {
          var freq = k == 'midiNote' ? MIDIUtils.noteNumberToFrequency(v) : v
          audioNodes.one.frequency.setValueAtTime(freq / 4.0, when)
          audioNodes.two.frequency.setValueAtTime(freq / 2.0, when)
          audioNodes.three.frequency.setValueAtTime(freq / 8.0, when)
          audioNodes.four.frequency.setValueAtTime(freq / 4.0, when)
        } else {
          // just an ADSR value
          audioNodes.settings[k] = v
        }
      })

    },
    nodes: function () {
      // returns an object of `{stringKey: audioNode}` for raw manipulation
      return audioNodes
    }
  }
}