// here, I am imitating the functionality of a chip-8 cpu
class CPU {
    constructor(renderer, keyboard, speaker) {
        this.renderer = renderer;
        this.keyboard = keyboard;
        this.speaker = speaker;

        //4096 bytes of memory, represented as array of 8-bit unsigned integers, with length 4096
        this.memory = new Uint8Array(4096);

        // 16 8-bit registers
        this.v = new Uint8Array(16);

        // A 16 bit register for memory addresses
        this.i = 0;

        //timers
        this.delayTimer = 0;
        this.soundTimer = 0;

        //program counter: stores the currently executing address
        this.pc = 0x200;

        this.stack = new Array();

        // some chip-8 instructions require a specific pause variable
        this.paused = false;

        this.speed = 10;
    }

    loadSpritesIntoMemory() {
        const sprites = [
        0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
        0x20, 0x60, 0x20, 0x20, 0x70, // 1
        0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
        0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
        0x90, 0x90, 0xF0, 0x10, 0x10, // 4
        0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
        0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
        0xF0, 0x10, 0x20, 0x40, 0x40, // 7
        0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
        0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
        0xF0, 0x90, 0xF0, 0x90, 0x90, // A
        0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
        0xF0, 0x80, 0x80, 0x80, 0xF0, // C
        0xE0, 0x90, 0x90, 0x90, 0xE0, // D
        0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
        0xF0, 0x80, 0xF0, 0x80, 0x80  // F
        ];

        // load the sprites into the interpreter section of the memory array (first section @ hex 0x000)
        for (let i = 0; i < sprites.length; i++) {
            this.memory[i] = sprites[i];
        }
    }

    loadProgramIntoMemory(program) {
        for (let loc = 0; loc < program.length; loc++) {
            this.memory[0x200 + loc] = program[loc];
        }
    }

    loadRom(romName) {
        var request = new XMLHttpRequest;
        var self = this;
        
        //handles the response from our request
        request.onload = function() {
            if(request.response) {

                //stores the contents of the response in an 8-bit int array
                let program = new Uint8Array(request.response);

                //loads the ROM into memory
                self.loadProgramIntoMemory(program);
            }
        }

        //request to retreive the ROM from our ROMS folder
        request.open('GET', 'roms/' + romName);

        request.responseType = 'arraybuffer';

        //send the GET request
        request.send();
    }
    
    // Cycles the CPU (each cycle grabs an instruction, executes it, and more)
    cycle() {
        for (let i = 0; i < this.speed; i++) {
            if (!this.paused) {
                let opcode = (this.memory[this.pc] << 8 | this.memory[this.pc + 1]);
                this.executeInstruction(opcode);
            }
        }
        if (!this.paused) {
            this.updateTimers();
        }
        this.playSound();
        this.renderer.render();
    }

    updateTimers() {
        if (this.delayTimer > 0) {
            this.delayTimer -= 1;
        }
        if (this.soundTimer > 0) {
            this.soundTimer -= 1;
        }
    }

    playSound() {
        if (this.soundTimer > 0) {
            this.speaker.play(440);
        } else {
            this.speaker.stop();
        }
    }

    executeInstruction(opcode) {

        // increment program counter by 2 because each instruction is 2 bytes long
        this.pc += 2;
        let x = (opcode & 0x0F00) >> 8;
        let y = (opcode & 0x00F0) >> 4;

        // code for every instruction
        switch (opcode & 0xF000) {
            case 0x0000:
                switch (opcode) {
                    case 0x00E0:
                        this.renderer.clear();
                        break;
                    case 0x00EE:
                        this.pc = this.stack.pop();
                        break;
                }
                break;
            case 0x1000:
                this.pc = (opcode & 0xFFF);
                break;
            case 0x2000:
                this.stack.push(this.pc);
                this.pc = (opcode & 0xFFF);
                break;
            case 0x3000:
                if (this.v[x] === (opcode & 0xFF)) {
                    this.pc += 2;
                }
                break;
            case 0x4000:
                if (this.v[x] !==  (opcode & 0xFF)) {
                    this.pc += 2;
                }
                break;
            case 0x5000:
                if (this.v[x] === this.v[y]) {
                    this.pc += 2;
                }
                break;
            case 0x6000:
                this.v[x] = (opcode & 0xFF);
                break;
            case 0x7000:
                this.v[x] += (opcode & 0xFF);
                break;
            case 0x8000:
                switch (opcode & 0xF) {
                    case 0x0:
                        this.v[x] = this.v[y];
                        break;
                    case 0x1:
                        this.v[x] |= this.v[y]
                        break;
                    case 0x2:
                        this.v[x] &= this.v[y];
                        break;
                    case 0x3:
                        this.v[x] ^= this.v[y];
                        break;
                    case 0x4:
                        let sum = (this.v[x] + this.v[y]);
                        // 0xFF is hex for 255
                        this.v[0xF] = 0;
                        if (sum > 0xFF) {
                            this.v[0xF] = 1;
                        }
                        this.v[x] = sum;
                        break;
                    case 0x5:
                        this.v[0xF] = 0;
                        if (this.v[x] > this.v[y]) {
                            this.v[0xF] = 1;
                        }
                        this.v[x] -= this.v[y];
                        break;
                    case 0x6:
                        // set v at register F to the least significant bit of v[x]
                        this.v[0xF] = (this.v[x] & 0x1);
                        this.v[x] >>= 1;
                        break;
                    case 0x7:
                        this.v[0xF] = 0;
                        if (this.v[y] > this.v[x]) {
                            this.v[0xF] = 1;
                        }
                        this.v[x] = this.v[y] - this.v[x];
                        break;
                    case 0xE:
                        // grabs most significant (leftmost) bit and storing in VF
                        this.v[0xF] = (this.v[x] & 0x80);
                        this.v[x] <<= 1;
                        break;
                }
                break;
            case 0x9000:
                if (this.v[x] !== this.v[y]) {
                    this.pc += 2;
                }
                break;
            case 0xA000:
                this.i = (opcode & 0xFFF);
                break;
            case 0xB000:
                this.pc = (opcode & 0xFFF) + this.v[0];
                break;
            case 0xC000:
                let rand = Math.floor(Math.random() * 0xFF);
                this.v[x] = rand & (opcode & 0xFF);
                break;
            case 0xD000:
                let width = 8;
                let height = (opcode & 0xF);
                this.v[0xF] = 0;
                for (let row = 0; row < height; row++) {
                    let sprite = this.memory[this.i + row];
                     for (let col = 0; col < width; col++) {

                        // If the bit (sprite) is not 0, render/erase the pixel
                        if ((sprite & 0x80) > 0) {

                            // If setPixel returns 1, which means a pixel was erased, set VF to 1
                            if (this.renderer.setPixel(this.v[x] + col, this.v[y] + row)) {
                                this.v[0xF] = 1;
                             }   
                        }

                    // Shift the sprite left 1. This will move the next next col/bit of the sprite into the first position.
                    // Ex. 10010000 << 1 will become 0010000
                    sprite <<= 1;
                     }
                }
            break;
            case 0xE000:
                switch (opcode & 0xFF) {
                    case 0x9E:
                        if (this.keyboard.isKeyPressed(this.v[x])) {
                            this.pc += 2;
                        }
                        break;
                    case 0xA1:
                        if (!this.keyboard.isKeyPressed(this.v[x])) {
                            this.pc += 2;
                        }
                        break;
                }
                break;
            case 0xF000:
                switch (opcode & 0xFF) {
                    case 0x07:
                        this.v[x] = this.delayTimer;
                        break;
                    case 0x0A:

                        // pauses the emulator until a key is pressed
                        this.paused = true;
                        this.keyboard.onNextKeyPress = function(key) {
                            this.v[x] = key;
                            this.paused = false;
                        }.bind(this);
                        break;
                    case 0x15:
                        this.delayTimer = this.v[x];
                        break;
                    case 0x18:
                        this.soundTimer = this.v[x];
                        break;
                    case 0x1E:
                        this.i += this.v[x];
                        break;
                    case 0x29:
                        this.i = this.v[x] * 5;
                        break;
                    case 0x33:
                        this.memory[this.i] = parseInt(this.v[x] / 100);
                        this.memory[this.i + 1] = parseInt((this.v[x] % 100) / 10);
                        this.memory[this.i + 2] = parseInt(this.v[x] % 10);
                        break;
                    case 0x55:
                        for (let registerIndex = 0; registerIndex <= x; registerIndex++) {
                            this.memory[this.i + registerIndex] = this.v[registerIndex];
                        }
                        break;
                    case 0x65:
                        for (let registerIndex = 0; registerIndex <= x; registerIndex++) {
                            this.v[registerIndex] = this.memory[this.i + registerIndex];
                        }
                  
                        break;
                } 
                break;
            default:
                throw new Error('Unknown opcode ' + opcode);
        }  
    }
}

export default CPU;