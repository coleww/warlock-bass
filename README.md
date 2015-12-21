# WARLOCK-BASS


A heavy bass synth. For shredding

## WIKI

`npm install warlock-bass`

## USE
```
window.AudioContext = window.AudioContext || window.webkitAudioContext
var ac = new AudioContext()
var evilbass = require('warlock-bass')(ac)
evilbass.connect(ac.destination)

// set the frequency/ADSR/detune
evilbass.update({midiNote: 72, attack: 0.3, decay: 0.1, sustain: 0.3, release: 0.5, peak: 0.5, mid: 0.3, end: 0.00001, detune: 7}, ac.currentTime)
// and trigger it!
evilbass.start(ac.currentTime)


// destroy the oscillators completely. u probably would only wanna do this for garbage collection porpoises.
evilbass.stop(ac.currentTime)


// this will return an object containing all the nodes in the warlock-bass audioGraph, for closer-to-the-metal manipulation than the update/start methods provide.
evilbass.nodes() 
```

















# DEVELOPMENT

```
npm install
npm run test # should pass! Yay!
```

# HEAR THE MAGIC!

- `npm run serve` boot a webserver at port 3000
- `npm run build` build demo.js to a bundle. Run this after making any changes to hear updates (or add [watchify](https://github.com/wham-js/web-audio-advent-calendar/blob/master/package.json#L8), i wanted to keep things "light")
- open `http://localhost:3000/` in a web browser and hear the magic (hopefully)

# RESOURCES


- [openmusic](https://github.com/openmusic) has a ton of helpful modules
- if you need a basic convolver impulse, [voila](https://github.com/mdn/voice-change-o-matic/tree/gh-pages/audio)