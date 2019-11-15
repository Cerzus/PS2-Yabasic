'use strict';

Interpreter.prototype.allowedColoursForColourClause = 'black white red blue green yellow cyan magenta'.split(' ');

//////////////////
// INSTRUCTIONS //
//////////////////

Interpreter.prototype.instructionCLEAR_SCREEN = function () {
    this.hideTextScreen = false;

    this.textScreen.reset();
    this.textScreen.show();
    this.isScreenCleared = true;
};

Interpreter.prototype.instructionSET_IO_STREAM = function (mode) {
    // numberToInt? 2.64: TODO, 2.66: TODO 
    this.ioStream = this.numberToInt(this.popNumber());

    if (mode === 'w') {
        if (this.ioStream > 0 && this.ioStream <= this.streams.length) {
            if (!this.streams[this.ioStream - 1]) {
                this.throwError('StreamNotOpenForWritingOrPrinting', this.ioStream);
            }
        }
        // stream #0 and streams #-2^31 or smaller function as regular printing
        else if (this.ioStream !== 0 && this.ioStream > -this.EXP2E31) {
            this.throwError('StreamNotOpenForWritingOrPrinting', this.ioStream);
        }
    }
};

Interpreter.prototype.instructionSET_PROMPT = function (message) {
    this.inputPrompt = message;
};

Interpreter.prototype.instructionFLUSH_PROMPT = function () {
    if (this.inputPrompt !== null) {
        this.textScreen.print(this.inputPrompt);
        this.inputPrompt = null;
    }
};

Interpreter.prototype.instructionREVERSE = function () {
    if (!this.isScreenCleared) {
        this.throwError('NeedToClearScreen');
    }
};

Interpreter.prototype.instructionAT = function () {
    if (!this.isScreenCleared) {
        this.throwError('NeedToClearScreen');
    }

    this.popNumber();
    this.popNumber();
};

Interpreter.prototype.instructionCOLOUR = function (numArguments) {
    if (!this.isScreenCleared) {
        this.throwError('NeedToClearScreen');
    }

    let args = [];
    for (let i = 0; i < numArguments; i++) {
        args.push(this.popString());
    }

    for (let argument of args) {
        const colour = this.asciiTable.toLowerCase(argument);
        if (this.allowedColoursForColourClause.indexOf(colour) === -1) {
            this.throwError('UnknownColour', colour)
        }
    }
};

// TODO: check debouncing for keyboard: 0?inkey$(.1):goto 0
Interpreter.prototype.instructionINKEY$ = function (hasTimeout) {
    const now = Date.now();
    if (this.waitStartTime === null) {
        this.waitStartTime = now;
    }

    const button = this.input.getLatestButton();

    if (button !== null) {
        if (hasTimeout) {
            this.popStringOrNumber();
        }
        this.pushString(button);
    } else if (hasTimeout && now >= this.waitStartTime + 1000 * this.valuesStackPeek().value) {
        this.waitStartTime = null;
        this.popStringOrNumber();
        this.pushString('');
    } else {
        this.programCounter--;
    }
};

Interpreter.prototype.instructionPRINT = function (using) {
    this.hideTextScreen = false;

    if (using) {
        const format = this.popString();
        const number = this.popNumber();
        const prefix = this.previousPrintType === 'Number' ? ' ' : '';
        this.textScreen.print(prefix + this.numberToString(number, format));
        this.previousPrintType = 'Number';
    } else {
        const value = this.popStringOrNumberWithType();

        if (value.type === 'String') {
            this.textScreen.print(value.value);
        } else if (value.type === 'Number') {
            const prefix = this.previousPrintType === 'Number' ? ' ' : '';
            const number = value.value;
            const format = number >= -this.EXP2E31 && number < this.EXP2E31 && Math.abs(number % 1) === 0 ? '%.10g' : '%.6g';
            this.textScreen.print(prefix + this.formatter.toString(number, format));
        }

        this.previousPrintType = value.type;
    }
};

Interpreter.prototype.instructionINPUT = function (splitOnSpaces, isString) {
    if (this.waitingForInput !== null) {
        this.textScreen.replaceLastCharacter(Date.now() % 800 < 400 ? '_' : ' ');
        this.programCounter--;
    }

    else if (this.ioStream !== 0 && this.ioStream > -this.EXP2E31) {
        this.throwError('StreamNotOpenForReading', this.ioStream);
    }

    // streams #-2^31 and smaller seem to just skip the entire instruction
    else if (this.ioStream === 0) {
        this.hideTextScreen = false;

        if (!this.inputBuffer.length) {
            const message = this.inputPrompt !== null ? this.inputPrompt : '?';
            this.inputPrompt = null;
            this.textScreen.print(message + ' ');
            this.programCounter--;
            this.waitingForInput = this.input.addKeyDownListener(key => {
                if (key.length === 1 && this.inputBuffer.length < 254) {
                    const character = this.asciiTable.encode(key);
                    this.inputBuffer += character;
                    this.textScreen.replaceLastCharacter(character);
                    this.textScreen.print(' ');
                } else if (key === 'Backspace' && this.inputBuffer.length > 0) {
                    this.inputBuffer = this.inputBuffer.substring(0, this.inputBuffer.length - 1);
                    this.textScreen.backspace();
                } else if (key === 'Enter') {
                    this.textScreen.backspace();
                    this.textScreen.print('\n');
                    this.input.removeKeyDownListener(this.waitingForInput);
                    this.waitingForInput = null;
                }
            });
        } else {
            if (splitOnSpaces) {
                // take first word
                this.inputBuffer = this.inputBuffer.trimLeft();
                let firstWhitespaceIndex = this.inputBuffer.indexOf(' ');
                if (firstWhitespaceIndex === -1) {
                    firstWhitespaceIndex = this.inputBuffer.length;
                }
                var value = this.inputBuffer.substring(0, firstWhitespaceIndex);
                this.inputBuffer = this.inputBuffer.substring(firstWhitespaceIndex).trimLeft();
            } else {
                // take everything
                var value = this.inputBuffer;
                this.inputBuffer = '';
            }

            // push the value to the stack
            if (isString) {
                this.pushString(value);
            } else {
                value = parseFloat(value);
                this.pushNumber(isNaN(value) ? 0 : value);
            }
        }
    }
};

