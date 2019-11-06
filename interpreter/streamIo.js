'use strict';

///////////////////////
// UTILITY FUNCTIONS //
///////////////////////

Interpreter.prototype.setStreamError = function (name, ...parameters) {
    const errors = [
        '', '',
        'StreamAlreadyInUse',
        'IsNotAValidFilemode',
        'CouldNotOpen',
        'ReachedMaxOpenFiles',
        '', '', '',
        'CanOnlyHandleStreamsFromTo',
        '', '', '',
    ]

    this.streamError = [errors.indexOf(name), [name, ...parameters]];
};

Interpreter.prototype.pushNumberAndSetStreamError = function (number, name, ...parameters) {
    this.setStreamError(name, ...parameters);
    this.pushNumber(number);
};

Interpreter.prototype.pushBooleanAndSetStreamError = function (boolean, name, ...parameters) {
    this.setStreamError(name, ...parameters);
    this.pushBoolean(boolean);
};

Interpreter.prototype.pushNumberAndResetStreamError = function (number) {
    this.streamError[0] = 0;
    this.pushNumber(number);
};

Interpreter.prototype.pushBooleanAndResetStreamError = function (boolean) {
    this.streamError[0] = 0;
    this.pushBoolean(boolean);
};

Interpreter.prototype.popStream1To16OrThrowError = function () {
    // ~~? 2.64: TODO, 2.66: TODO 
    const stream = ~~this.popNumber();
    if (stream < 1 || stream > 16) {
        this.throwError('CanOnlyHandleStreamsFromTo', 16);
    }
    return stream;
};

Interpreter.prototype.checkIfStreamOpenOrThrowError = function () {
    const stream = this.popStream1To16OrThrowError();
    if (stream !== null && !this.streams[stream - 1]) {
        this.throwError('StreamNotOpened', stream);
    }
    return stream;
};

Interpreter.prototype.popStreamForUseOrThrowError = function () {
    const stream = this.popStream1To16OrThrowError();
    if (stream !== null && this.streams[stream - 1]) {
        this.throwError('StreamAlreadyInUse');
    }
    return stream;
};

Interpreter.prototype.popStreamForUseOrSetStreamError = function () {
    // ~~? 2.64: TODO, 2.66: TODO 
    const stream = ~~this.popNumber();
    if (stream < 1 || stream > 16) {
        this.pushBooleanAndSetStreamError(false, 'CanOnlyHandleStreamsFromTo', 16);
        return null;
    } else if (this.streams[stream - 1]) {
        this.pushBooleanAndSetStreamError(false, 'StreamAlreadyInUse');
        return null;
    }
    return stream;
};

Interpreter.prototype.getNextOpenStream = function () {
    let stream = 0;
    while (stream < this.streams.length && this.streams[stream]) {
        stream++;
    }
    if (stream >= this.streams.length) {
        this.pushNumberAndSetStreamError(0, 'ReachedMaxOpenFiles');
        return null;
    }
    return stream;
};

//////////////////
// INSTRUCTIONS //
//////////////////

Interpreter.prototype.instructionPOKE_STREAM = function () {
    const value = this.popStringOrNumberWithType();
    const stream = this.popStream1To16OrThrowError();
    if (stream !== null) {
        if (!this.streams[stream - 1]) {
            this.throwError('StreamNotOpenForWriting', stream);
        } else if (value[1] === 'Number') {
            // ~~? 2.64: TODO, 2.66: TODO 
            const byte = ~~value[0];
            if (byte < 0 || byte > 255) {
                this.throwError('StreamPokeOutOfByteRange');
            }
        }
    }
};

Interpreter.prototype.instructionPEEK_STREAM = function () {
    const stream = this.popStream1To16OrThrowError();
    if (stream !== null) {
        this.throwError('StreamNotOpenForReading', stream);
    }
};

Interpreter.prototype.instructionCLOSE = function () {
    const stream = this.popStream1To16OrThrowError();
    if (stream !== null) {
        if (this.streams[stream - 1]) {
            this.streams[stream - 1] = false;
        } else {
            this.queueWarning('StreamAlreadyClosed', stream);
        }
    }
};

Interpreter.prototype.instructionEOF = function () {
    if (this.popStream1To16OrThrowError() !== null) {
        this.pushBoolean(true);
    }
};

Interpreter.prototype.instructionTELL = function () {
    if (this.checkIfStreamOpenOrThrowError() !== null) {
        this.pushNumber(-1);
    }
};

Interpreter.prototype.instructionSEEK = function (hasMode) {
    const mode = hasMode ? this.popString().toLowerCase() : 'end';
    // numberToInt? 2.64: TODO, 2.66: TODO 
    const position = this.numberToInt(this.popNumber());
    // ~~? 2.64: TODO, 2.66: TODO 
    const stream = ~~this.popNumber();

    if (!/^(begin|end|here)$/.test(mode)) {
        if (this.version < 2.65) {
            this.throwError('SeekModeIsNeither', mode);
        } else {
            this.throwError(...this.streamError[1]);
        }
    } else if (stream < 1 || stream > 16) {
        this.throwError('CanOnlyHandleStreamsFromTo', 16);
    } else if (!this.streams[stream - 1]) {
        if (this.version < 2.65) {
            this.throwError('StreamNotOpened', stream);
        } else {
            this.throwError(...this.streamError[1]);
        }
    } else {
        if (this.version < 2.65) {
            this.throwError('CouldNotPositionStreamTo', stream, position);
        } else {
            this.throwError(...this.streamError[1]);
        }
    }
};

Interpreter.prototype.instructionSEEK_BOOLEAN = function (hasMode) {
    const mode = hasMode ? this.popString().toLowerCase() : 'end';
    // numberToInt? 2.64: TODO, 2.66: TODO 
    const position = this.numberToInt(this.popNumber());
    // ~~? 2.64: TODO, 2.66: TODO 
    const stream = ~~this.popNumber();
    if (!/^(begin|end|here)$/.test(mode)) {
        this.streamError[0] = 12;
        this.pushBoolean(false);
    } else if (stream < 1 || stream > 16) {
        this.throwError('CanOnlyHandleStreamsFromTo', 16);
    } else if (!this.streams[stream - 1]) {
        this.streamError[0] = 11;
        this.pushBoolean(false);
    } else {
        this.streamError[0] = 10;
        this.pushBoolean(false);
    }
};

Interpreter.prototype.instructionOPEN_PRINTER = function () {
    const stream = this.popStreamForUseOrThrowError();
    if (stream !== null) {
        this.streams[stream - 1] = true;
        this.streamError[0] = 0;
    }
};

Interpreter.prototype.instructionOPEN_FILE = function () {
    const file = this.popString();
    if (this.popStreamForUseOrThrowError() !== null) {
        this.throwError('CouldNotOpen', file);
    }
};

Interpreter.prototype.instructionOPEN_FILE_MODE = function () {
    const mode = this.popString();
    const file = this.popString();
    if (this.popStreamForUseOrThrowError() !== null) {
        if (!/^[arw]b?$/.test(mode)) {
            this.throwError('IsNotAValidFilemode', mode);
        } else {
            this.throwError('CouldNotOpen', file);
        }
    }
};

Interpreter.prototype.instructionOPEN_PRINTER_BOOLEAN = function () {
    const stream = this.popStreamForUseOrSetStreamError();
    if (stream !== null) {
        this.streams[stream - 1] = true;
        this.pushBooleanAndResetStreamError();
    }
};

Interpreter.prototype.instructionOPEN_FILE_BOOLEAN = function () {
    const file = this.popString();
    if (this.popStreamForUseOrSetStreamError() !== null) {
        this.pushBooleanAndSetStreamError(false, 'CouldNotOpen', file);
    }
};

Interpreter.prototype.instructionOPEN_FILE_MODE_BOOLEAN = function () {
    const mode = this.popString();
    const file = this.popString();
    if (this.popStreamForUseOrSetStreamError() !== null) {
        if (!/^[arw]b?$/.test(mode)) {
            this.pushBooleanAndSetStreamError(false, 'IsNotAValidFilemode', mode);
        } else {
            this.pushBooleanAndSetStreamError(false, 'CouldNotOpen', file);
        }
    }
};

Interpreter.prototype.instructionOPEN_PRINTER_NUMBER = function () {
    const stream = this.getNextOpenStream();
    if (stream !== null) {
        this.streams[stream] = true;
        this.pushNumberAndResetStreamError(stream + 1);
    }
};

Interpreter.prototype.instructionOPEN_FILE_NUMBER = function () {
    const file = this.popString();
    if (this.getNextOpenStream() !== null) {
        this.pushNumberAndSetStreamError(0, 'CouldNotOpen', file);
    }
};

Interpreter.prototype.instructionOPEN_FILE_MODE_NUMBER = function () {
    const mode = this.popString();
    const file = this.popString();
    if (this.getNextOpenStream() !== null) {
        if (!/^[arw]b?$/.test(mode)) {
            this.pushNumberAndSetStreamError(0, 'IsNotAValidFilemode', mode);
        } else {
            this.pushNumberAndSetStreamError(0, 'CouldNotOpen', file);
        }
    }
};

