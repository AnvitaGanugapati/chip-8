import Renderer from './renderer.js';
import Keyboard from './keyboard.js'; 
import Speaker from './speaker.js'; 
import CPU from './cpu.js';


const renderer = new Renderer(10);
const keyboard = new Keyboard(); 
const speaker = new Speaker();
const cpu = new CPU(renderer, keyboard, speaker); 


let loop;
let fps = 60, fpsInterval, startTime, now, then, elapsed;


function init() {
    fpsInterval = 1000/ fps;

    // Time at initialization is taken
    then = Date.now();
    startTime = then;

    // Pixels are loaded in with the initialization of the emulator
    cpu.loadSpritesIntoMemory();

    // Program loaded in 
    cpu.loadRom("BLINKY");
    loop = requestAnimationFrame(step);
}

function step() {
        now = Date.now();
        elapsed = now - then;

        // If the time elapsed is greated than the time spent on the frame, cycle the CPU
        if (elapsed > fpsInterval) {

            cpu.cycle();
            // With every cycle:
            // Instruction grabbed from memory and executed
            // Timers are updated
            // Display is rendered accordingly

        }

        loop = requestAnimationFrame(step);
}

    
 init();





