(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
window.AudioContext = window.AudioContext || window.webkitAudioContext
var ac = new AudioContext()
var synth = require('./')(ac)
// just connect and start the synth to make sure it plays, edit as needed!
synth.connect(ac.destination)


window.setInterval(function () {
    synth.update({freq: [222, 420, 333, 555, 666][~~(Math.random() * 5)]}, ac.currentTime + 0.5)
    synth.start(ac.currentTime)
}, 1000)


},{"./":2}],2:[function(require,module,exports){
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
},{"a-d-s-r":3,"make-distortion-curve":4}],3:[function(require,module,exports){
module.exports = function (gainNode, when, adsr) {
  gainNode.gain.exponentialRampToValueAtTime(adsr.peak, when + adsr.attack)
  gainNode.gain.exponentialRampToValueAtTime(adsr.mid, when + adsr.attack + adsr.decay)
  gainNode.gain.setValueAtTime(adsr.mid, when + adsr.sustain + adsr.attack + adsr.decay)
  gainNode.gain.exponentialRampToValueAtTime(adsr.end, when + adsr.sustain + adsr.attack + adsr.decay + adsr.release)
}

},{}],4:[function(require,module,exports){
module.exports = function(amount) {
  var k = typeof amount === 'number' ? amount : 50,
    n_samples = 44100,
    curve = new Float32Array(n_samples),
    deg = Math.PI / 180,
    i = 0,
    x;
  for ( ; i < n_samples; ++i ) {
    x = i * 2 / n_samples - 1;
    curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
  }
  return curve;
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiZGVtby5qcyIsImluZGV4LmpzIiwibm9kZV9tb2R1bGVzL2EtZC1zLXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbWFrZS1kaXN0b3J0aW9uLWN1cnZlL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIndpbmRvdy5BdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHRcbnZhciBhYyA9IG5ldyBBdWRpb0NvbnRleHQoKVxudmFyIHN5bnRoID0gcmVxdWlyZSgnLi8nKShhYylcbi8vIGp1c3QgY29ubmVjdCBhbmQgc3RhcnQgdGhlIHN5bnRoIHRvIG1ha2Ugc3VyZSBpdCBwbGF5cywgZWRpdCBhcyBuZWVkZWQhXG5zeW50aC5jb25uZWN0KGFjLmRlc3RpbmF0aW9uKVxuXG5cbndpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgc3ludGgudXBkYXRlKHtmcmVxOiBbMjIyLCA0MjAsIDMzMywgNTU1LCA2NjZdW35+KE1hdGgucmFuZG9tKCkgKiA1KV19LCBhYy5jdXJyZW50VGltZSArIDAuNSlcbiAgICBzeW50aC5zdGFydChhYy5jdXJyZW50VGltZSlcbn0sIDEwMDApXG5cbiIsInZhciBhZHNyID0gcmVxdWlyZSgnYS1kLXMtcicpXG52YXIgbWFrZURpc3RvcnRpb25DdXJ2ZSA9IHJlcXVpcmUoJ21ha2UtZGlzdG9ydGlvbi1jdXJ2ZScpXG5cbi8vIHlyIGZ1bmN0aW9uIHNob3VsZCBhY2NlcHQgYW4gYXVkaW9Db250ZXh0LCBhbmQgb3B0aW9uYWwgcGFyYW1zL29wdHNcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGFjLCBvcHRzKSB7XG4gIC8vIG1ha2Ugc29tZSBhdWRpb05vZGVzLCBjb25uZWN0IHRoZW0sIHN0b3JlIHRoZW0gb24gdGhlIG9iamVjdFxuICB2YXIgYXVkaW9Ob2RlcyA9IHtcbiAgICBvbmU6ICBhYy5jcmVhdGVPc2NpbGxhdG9yKCksXG4gICAgdHdvOiAgYWMuY3JlYXRlT3NjaWxsYXRvcigpLFxuICAgIHRocmVlOiAgYWMuY3JlYXRlT3NjaWxsYXRvcigpLFxuICAgIGZvdXI6ICBhYy5jcmVhdGVPc2NpbGxhdG9yKCksXG4gICAgbGZvOiBhYy5jcmVhdGVPc2NpbGxhdG9yKCksXG4gICAgZmlsdGVybGZvZ2FpbjogYWMuY3JlYXRlR2FpbigpLFxuICAgIHBvc3RmaWx0ZXJsZm9nYWluOiBhYy5jcmVhdGVHYWluKCksXG4gICAgcHJlZ2FpbjogYWMuY3JlYXRlR2FpbigpLFxuICAgIHBvc3RHYWluOiBhYy5jcmVhdGVHYWluKCksXG4gICAgZmlsdGVyOiBhYy5jcmVhdGVCaXF1YWRGaWx0ZXIoKSxcbiAgICBkZWxheTogYWMuY3JlYXRlRGVsYXkoMC4wNzUpLFxuICAgIGRpc3RvcnRpb246IGFjLmNyZWF0ZVdhdmVTaGFwZXIoKSxcbiAgICBwb3N0RmlsdGVyOiBhYy5jcmVhdGVCaXF1YWRGaWx0ZXIoKSxcbiAgICBlbnZlbG9wZTogYWMuY3JlYXRlR2FpbigpLFxuICAgIHNldHRpbmdzOiB7XG4gICAgICBmcmVxOiA0NDAsXG4gICAgICBhdHRhY2s6IDAuMDUxLFxuICAgICAgZGVjYXk6IDAuMDUsXG4gICAgICBzdXN0YWluOiAwLjIxLFxuICAgICAgcmVsZWFzZTogMC4yNSxcbiAgICAgIGRldHVuZTogNSxcbiAgICAgIHBlYWs6IDAuNSxcbiAgICAgIG1pZDogMC4zLFxuICAgICAgZW5kOiAwLjAwMDAwMVxuICAgIH1cbiAgfVxuXG4gIGF1ZGlvTm9kZXMub25lLnR5cGUgPSAnc3F1YXJlJ1xuICBhdWRpb05vZGVzLnR3by50eXBlID0gJ3Nhd3Rvb3RoJ1xuICBhdWRpb05vZGVzLnRocmVlLnR5cGUgPSAnc2luZSdcbiAgYXVkaW9Ob2Rlcy5mb3VyLnR5cGUgPSAnc2F3dG9vdGgnXG5cbiAgYXVkaW9Ob2Rlcy5vbmUuZGV0dW5lLnNldFZhbHVlQXRUaW1lKCgoKE1hdGgucmFuZG9tKCkgKiAyKSAtIDEpICogMSksIGFjLmN1cnJlbnRUaW1lKVxuICBhdWRpb05vZGVzLnR3by5kZXR1bmUuc2V0VmFsdWVBdFRpbWUoKCgoTWF0aC5yYW5kb20oKSAqIDIpIC0gMSkgKiAyKSwgYWMuY3VycmVudFRpbWUpXG4gIGF1ZGlvTm9kZXMudGhyZWUuZGV0dW5lLnNldFZhbHVlQXRUaW1lKCgoKE1hdGgucmFuZG9tKCkgKiAyKSAtIDEpICogMyksIGFjLmN1cnJlbnRUaW1lKVxuICBhdWRpb05vZGVzLmZvdXIuZGV0dW5lLnNldFZhbHVlQXRUaW1lKCgoKE1hdGgucmFuZG9tKCkgKiAyKSAtIDEpICogMyksIGFjLmN1cnJlbnRUaW1lKVxuXG4gIGF1ZGlvTm9kZXMuZmlsdGVyLnR5cGUgPSAnbG93cGFzcydcbiAgYXVkaW9Ob2Rlcy5wb3N0RmlsdGVyLnR5cGUgPSAncGVha2luZydcblxuICBhdWRpb05vZGVzLmZpbHRlcmxmb2dhaW4uZ2Fpbi52YWx1ZSA9IDE1MDUwXG4gIGF1ZGlvTm9kZXMucG9zdGZpbHRlcmxmb2dhaW4uZ2Fpbi52YWx1ZSA9IDEwMDAwXG5cbiAgYXVkaW9Ob2Rlcy5sZm8uY29ubmVjdChhdWRpb05vZGVzLmZpbHRlcmxmb2dhaW4pXG4gIGF1ZGlvTm9kZXMubGZvLmNvbm5lY3QoYXVkaW9Ob2Rlcy5wb3N0ZmlsdGVybGZvZ2FpbilcbiAgYXVkaW9Ob2Rlcy5maWx0ZXJsZm9nYWluLmNvbm5lY3QoYXVkaW9Ob2Rlcy5maWx0ZXIuZnJlcXVlbmN5KVxuICBhdWRpb05vZGVzLnBvc3RmaWx0ZXJsZm9nYWluLmNvbm5lY3QoYXVkaW9Ob2Rlcy5wb3N0RmlsdGVyLmZyZXF1ZW5jeSlcblxuICBhdWRpb05vZGVzLmRpc3RvcnRpb24uY3VydmUgPSBtYWtlRGlzdG9ydGlvbkN1cnZlKDc1MClcblxuXG4gIGF1ZGlvTm9kZXMub25lLmNvbm5lY3QoYXVkaW9Ob2Rlcy5wcmVnYWluKVxuICBhdWRpb05vZGVzLnR3by5jb25uZWN0KGF1ZGlvTm9kZXMucHJlZ2FpbilcbiAgYXVkaW9Ob2Rlcy50aHJlZS5jb25uZWN0KGF1ZGlvTm9kZXMucHJlZ2FpbilcbiAgYXVkaW9Ob2Rlcy5mb3VyLmNvbm5lY3QoYXVkaW9Ob2Rlcy5wcmVnYWluKVxuICBhdWRpb05vZGVzLnByZWdhaW4uY29ubmVjdChhdWRpb05vZGVzLmZpbHRlcilcbiAgYXVkaW9Ob2Rlcy5maWx0ZXIuY29ubmVjdChhdWRpb05vZGVzLmRlbGF5KVxuICBhdWRpb05vZGVzLmRlbGF5LmNvbm5lY3QoYXVkaW9Ob2Rlcy5wb3N0R2FpbilcbiAgYXVkaW9Ob2Rlcy5maWx0ZXIuY29ubmVjdChhdWRpb05vZGVzLmRpc3RvcnRpb24pXG4gIGF1ZGlvTm9kZXMuZGlzdG9ydGlvbi5jb25uZWN0KGF1ZGlvTm9kZXMucG9zdEdhaW4pXG4gIGF1ZGlvTm9kZXMucG9zdEdhaW4uY29ubmVjdChhdWRpb05vZGVzLnBvc3RGaWx0ZXIpXG4gIGF1ZGlvTm9kZXMucG9zdEZpbHRlci5jb25uZWN0KGF1ZGlvTm9kZXMuZW52ZWxvcGUpXG5cblxuICBhdWRpb05vZGVzLnByZWdhaW4uZ2Fpbi5zZXRWYWx1ZUF0VGltZSgxLjAgLyAzLjAsIGFjLmN1cnJlbnRUaW1lKVxuICBhdWRpb05vZGVzLnBvc3RHYWluLmdhaW4uc2V0VmFsdWVBdFRpbWUoMC41LCBhYy5jdXJyZW50VGltZSlcbiAgYXVkaW9Ob2Rlcy5lbnZlbG9wZS5nYWluLnNldFZhbHVlQXRUaW1lKDAsIGFjLmN1cnJlbnRUaW1lKVxuICBhdWRpb05vZGVzLmxmby5mcmVxdWVuY3kuc2V0VmFsdWVBdFRpbWUoMSwgYWMuY3VycmVudFRpbWUpXG5cbiAgYXVkaW9Ob2Rlcy5vbmUuc3RhcnQoYWMuY3VycmVudFRpbWUpXG4gIGF1ZGlvTm9kZXMudHdvLnN0YXJ0KGFjLmN1cnJlbnRUaW1lKVxuICBhdWRpb05vZGVzLnRocmVlLnN0YXJ0KGFjLmN1cnJlbnRUaW1lKVxuICBhdWRpb05vZGVzLmZvdXIuc3RhcnQoYWMuY3VycmVudFRpbWUpXG4gIGF1ZGlvTm9kZXMubGZvLnN0YXJ0KGFjLmN1cnJlbnRUaW1lKVxuXG4gIHJldHVybiB7XG4gICAgY29ubmVjdDogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICBhdWRpb05vZGVzLmVudmVsb3BlLmNvbm5lY3QoaW5wdXQpXG4gICAgfSxcbiAgICBzdGFydDogZnVuY3Rpb24gKHdoZW4pIHtcbiAgICAgIC8vIC8vdGhpcyBmdW5jdGlvbiBzaG91bGQgY2FsbCBgc3RhcnQod2hlbilgIG9uIHlyIHNvdXJjZSBub2Rlcy4gUHJvYmFibHkgb3NjaWxsYXRvcnMvc2FtcGxlcnMgaSBndWVzcywgYW5kIGFueSBMRk8gdG9vIVxuICAgICAgYWRzcihhdWRpb05vZGVzLmVudmVsb3BlLCB3aGVuLCBhdWRpb05vZGVzLnNldHRpbmdzKVxuICAgIH0sXG4gICAgc3RvcDogZnVuY3Rpb24gKHdoZW4pIHtcbiAgICAgIGF1ZGlvTm9kZXMub25lLnN0b3Aod2hlbilcbiAgICAgIGF1ZGlvTm9kZXMudHdvLnN0b3Aod2hlbilcbiAgICAgIGF1ZGlvTm9kZXMudGhyZWUuc3RvcCh3aGVuKVxuICAgIH0sXG4gICAgdXBkYXRlOiBmdW5jdGlvbiAob3B0cywgd2hlbikge1xuICAgICAgT2JqZWN0LmtleXMob3B0cykuZm9yRWFjaChmdW5jdGlvbiAoaykge1xuICAgICAgICB2YXIgdiA9IG9wdHNba11cbiAgICAgICAgaWYgKGsgPT0gJ21pZGlOb3RlJyB8fCBrID09ICdmcmVxJykge1xuICAgICAgICAgIHZhciBmcmVxID0gayA9PSAnbWlkaU5vdGUnID8gTUlESVV0aWxzLm5vdGVOdW1iZXJUb0ZyZXF1ZW5jeSh2KSA6IHZcbiAgICAgICAgICBhdWRpb05vZGVzLm9uZS5mcmVxdWVuY3kuc2V0VmFsdWVBdFRpbWUoZnJlcSAvIDQuMCwgd2hlbilcbiAgICAgICAgICBhdWRpb05vZGVzLnR3by5mcmVxdWVuY3kuc2V0VmFsdWVBdFRpbWUoZnJlcSAvIDIuMCwgd2hlbilcbiAgICAgICAgICBhdWRpb05vZGVzLnRocmVlLmZyZXF1ZW5jeS5zZXRWYWx1ZUF0VGltZShmcmVxIC8gOC4wLCB3aGVuKVxuICAgICAgICAgIGF1ZGlvTm9kZXMuZm91ci5mcmVxdWVuY3kuc2V0VmFsdWVBdFRpbWUoZnJlcSAvIDQuMCwgd2hlbilcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBqdXN0IGFuIEFEU1IgdmFsdWVcbiAgICAgICAgICBhdWRpb05vZGVzLnNldHRpbmdzW2tdID0gdlxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgfSxcbiAgICBub2RlczogZnVuY3Rpb24gKCkge1xuICAgICAgLy8gcmV0dXJucyBhbiBvYmplY3Qgb2YgYHtzdHJpbmdLZXk6IGF1ZGlvTm9kZX1gIGZvciByYXcgbWFuaXB1bGF0aW9uXG4gICAgICByZXR1cm4gYXVkaW9Ob2Rlc1xuICAgIH1cbiAgfVxufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGdhaW5Ob2RlLCB3aGVuLCBhZHNyKSB7XG4gIGdhaW5Ob2RlLmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZShhZHNyLnBlYWssIHdoZW4gKyBhZHNyLmF0dGFjaylcbiAgZ2Fpbk5vZGUuZ2Fpbi5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lKGFkc3IubWlkLCB3aGVuICsgYWRzci5hdHRhY2sgKyBhZHNyLmRlY2F5KVxuICBnYWluTm9kZS5nYWluLnNldFZhbHVlQXRUaW1lKGFkc3IubWlkLCB3aGVuICsgYWRzci5zdXN0YWluICsgYWRzci5hdHRhY2sgKyBhZHNyLmRlY2F5KVxuICBnYWluTm9kZS5nYWluLmV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoYWRzci5lbmQsIHdoZW4gKyBhZHNyLnN1c3RhaW4gKyBhZHNyLmF0dGFjayArIGFkc3IuZGVjYXkgKyBhZHNyLnJlbGVhc2UpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFtb3VudCkge1xuICB2YXIgayA9IHR5cGVvZiBhbW91bnQgPT09ICdudW1iZXInID8gYW1vdW50IDogNTAsXG4gICAgbl9zYW1wbGVzID0gNDQxMDAsXG4gICAgY3VydmUgPSBuZXcgRmxvYXQzMkFycmF5KG5fc2FtcGxlcyksXG4gICAgZGVnID0gTWF0aC5QSSAvIDE4MCxcbiAgICBpID0gMCxcbiAgICB4O1xuICBmb3IgKCA7IGkgPCBuX3NhbXBsZXM7ICsraSApIHtcbiAgICB4ID0gaSAqIDIgLyBuX3NhbXBsZXMgLSAxO1xuICAgIGN1cnZlW2ldID0gKCAzICsgayApICogeCAqIDIwICogZGVnIC8gKCBNYXRoLlBJICsgayAqIE1hdGguYWJzKHgpICk7XG4gIH1cbiAgcmV0dXJuIGN1cnZlO1xufVxuIl19
