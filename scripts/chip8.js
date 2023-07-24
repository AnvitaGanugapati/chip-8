import Renderer from './renderer.js';
import Keyboard from './keyboard.js'; // NEW
import Speaker from './speaker.js'; // NEW
import CPU from './cpu.js';


const renderer = new Renderer(10);
const keyboard = new Keyboard(); // NEW
const speaker = new Speaker();
const cpu = new CPU(renderer, keyboard, speaker); // N


let loop;
let fps = 60, fpsInterval, startTime, now, then, elapsed;


function init() {
    console.log("chip 8 init");
    fpsInterval = 1000/ fps;
    then = Date.now();
    startTime = then;
    cpu.loadSpritesIntoMemory();
    cpu.loadRom("BLINKY");
    loop = requestAnimationFrame(step);
}



function step() {
        now = Date.now();
        elapsed = now - then;
        if (elapsed > fpsInterval) {
            

            cpu.cycle();
            // Cycle the CPU. We'll come back to this later and fill it out.
        }
        loop = requestAnimationFrame(step);
}

    
 init();





