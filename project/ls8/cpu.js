/**
 * LS-8 v2.0 emulator skeleton code
 */

/**
 * Class for simulating a simple Computer (CPU & memory)
 */

const LDI = 0b10011001;
const PRN = 0b01000011;
const HLT = 0b00000001;
const MUL = 0b10101010;
const PUSH = 0b01001101;
const POP = 0b01001100;
const CALL = 0b01001000;
const RET = 0b00001001;
const ADD = 0b10101000;
const SP = 0x07;

class CPU {

    /**
     * Initialize the CPU
     */
    constructor(ram) {
        this.ram = ram;

        this.reg = new Array(8).fill(0); // General-purpose registers R0-R7

        
        // Special-purpose registers
        this.reg.PC = 0; // Program Counter
        this.reg[SP] = 0xf4;
        this.setupBranchTable();
    }

    setupBranchTable() {
        let bt = {}

        bt[LDI] = this.handle_LDI;
        bt[HLT] = this.handle_HLT;
        bt[PRN] = this.handle_PRN;
        bt[MUL] = this.handle_MUL;
        bt[ADD] = this.handle_ADD;
        bt[PUSH] = this.handle_PUSH;
        bt[POP] = this.handle_POP;
        bt[CALL] = this.handle_CALL;
        bt[RET] = this.handle_RET;

        this.branchTable = bt;
    }
	
    /**
     * Store value in memory address, useful for program loading
     */
    poke(address, value) {
        this.ram.write(address, value);
    }

    /**
     * Starts the clock ticking on the CPU
     */
    startClock() {
        this.clock = setInterval(() => {
            this.tick();
        }, 1); // 1 ms delay == 1 KHz clock == 0.000001 GHz
    }

    /**
     * Stops the clock
     */
    stopClock() {
        clearInterval(this.clock);
    }

    /**
     * ALU functionality
     *
     * The ALU is responsible for math and comparisons.
     *
     * If you have an instruction that does math, i.e. MUL, the CPU would hand
     * it off to it's internal ALU component to do the actual work.
     *
     * op can be: ADD SUB MUL DIV INC DEC CMP
     */
    alu(op, regA, regB) {
        switch (op) {
            case 'MUL':
                this.reg[regA] = this.reg[regA] * this.reg[regB];
                // console.log('regA log:', regA);
                break;
            case 'ADD':
                this.reg[regA] = this.reg[regA] + this.reg[regB];
                break;
        }
    }

    /**
     * Advances the CPU one cycle
     */
    tick() {
        // Load the instruction register (IR--can just be a local variable here)
        // from the memory address pointed to by the PC. (I.e. the PC holds the
        // index into memory of the instruction that's about to be executed
        // right now.)
        
        let IR = this.ram.read(this.reg.PC);

        // Debugging output
        // console.log(`${this.reg.PC}: ${IR.toString(2)}`);
        // console.log(typeof IR, IR);

        // Get the two bytes in memory _after_ the PC in case the instruction
        // needs them.

        const operandA = this.ram.read(this.reg.PC + 1);
        const operandB = this.ram.read(this.reg.PC + 2);

        // Execute the instruction. Perform the actions for the instruction as
        // outlined in the LS-8 spec.

        const handlerReturn = this.branchTable[IR](this, operandA, operandB);

        // Increment the PC register to go to the next instruction. Instructions
        // can be 1, 2, or 3 bytes long. Hint: the high 2 bits of the
        // instruction byte tells you how many bytes follow the instruction byte
        // for any particular instruction.

        if(handlerReturn === undefined) {
            const inc = (IR >>> 6) + 1;
            this.reg.PC += inc;
        } else {
            this.reg.PC = handlerReturn;
        }

    }

    handle_LDI (cpu, operandA, operandB) {
        cpu.reg[operandA] = operandB;
    }

    handle_PRN (cpu, operandA) {
        console.log(cpu.reg[operandA]);
    }

    handle_HLT (cpu) {
        cpu.stopClock();
    }

    handle_MUL (cpu, operandA, operandB) {
        cpu.alu('MUL', operandA, operandB);
    }
   
    handle_ADD (cpu, operandA, operandB) {
        cpu.alu('ADD', operandA, operandB);
    }

    handle_PUSH (cpu, opA) {
        // console.log('>>>>>>>>>>>>>>>>>', opA)
        cpu.reg[SP] = cpu.reg[SP] - 1;
        cpu.ram.write(cpu.reg[SP], cpu.reg[opA]);
    }
    
    handle_POP (cpu, opA) {
        cpu.reg[opA] = cpu.ram.read(cpu.reg[SP]);
        cpu.reg[SP]++;
    }

    handle_CALL (cpu, opA) {
        // handle_PUSH(cpu.reg.PC + 2);
        cpu.reg[SP] = cpu.reg[SP] - 1;
        cpu.ram.write(cpu.reg[SP], cpu.reg.PC + 2);
        return cpu.reg[opA];
    }
    
    handle_RET (cpu) {
        const value = cpu.ram.read(cpu.reg[SP]);
        cpu.reg[SP]++;
        return value;
    }

}

module.exports = CPU;
