'use strict';

//////////////////
// INSTRUCTIONS //
//////////////////

Interpreter.prototype.instructionPOP = function () {
    this.valuesStackPop();
};

Interpreter.prototype.instructionJUMP = function (destination) {
    this.programCounter = destination;
};

Interpreter.prototype.instructionJUMP_IF_FALSE = function (destination) {
    if (this.popValue() === false) {
        this.programCounter = destination;
    }
};

Interpreter.prototype.instructionNUMBER = function (value) {
    this.pushNumber(value);
};

Interpreter.prototype.instructionSTRING = function (value) {
    this.pushString(value);
};

Interpreter.prototype.instructionSTORE_STRING_VARIABLE = function (variableName) {
    this.symbolStack.getStringVariableStore(variableName)[variableName] = this.popString();
};

Interpreter.prototype.instructionSTORE_NUMERIC_VARIABLE = function (variableName) {
    this.symbolStack.getNumericVariableStore(variableName)[variableName] = this.popNumber();
};

Interpreter.prototype.instructionLOAD_STRING_VARIABLE = function (variableName) {
    const store = this.symbolStack.getStringVariableStore(variableName);
    let string = store[variableName];

    if (string === undefined) {
        string = '';

        store[variableName] = string;
    }

    this.pushString(string);
};

Interpreter.prototype.instructionLOAD_NUMERIC_VARIABLE = function (variableName) {
    const store = this.symbolStack.getNumericVariableStore(variableName);
    let number = store[variableName];

    if (number === undefined) {
        number = 0;

        store[variableName] = number;
    }

    this.pushNumber(number);
};

Interpreter.prototype.instructionCOMPILE = function () {
    if (!this.isWaitingForRuntimeCompilation) {
        const source = this.popString();

        this.parserWorker.postMessage({
            type: 'source',
            version: this.version,
            source,
            compilingAtRuntime: true,
        });

        this.isWaitingForRuntimeCompilation = true;
    }

    if (this.isWaitingForRuntimeCompilation) {
        if (this.runtimeCompiledSource === null) {
            this.programCounter--;
        } else {
            // TODO: check whether completely replacing everything should or could be done more efficiently
            this.subroutines = this.runtimeCompiledSource.subroutines;
            this.instructions = this.runtimeCompiledSource.instructions;
            this.instructionLabels = this.runtimeCompiledSource.instructionLabels;
            this.data = this.runtimeCompiledSource.data;
            this.dataLabels = this.runtimeCompiledSource.dataLabels;

            console.log(this.instructions);

            this.isWaitingForRuntimeCompilation = false;
            this.runtimeCompiledSource = null;
            // documentation is not added on runtime compilation
        }
    }
}

Interpreter.prototype.instructionGETBIT$ = function () {
    this.throwError('FunctionNotImplemented');
};

Interpreter.prototype.instructionPUTBIT = function () {
    this.throwError('FunctionNotImplemented');
};

Interpreter.prototype.instructionGETSCREEN$ = function () {
    const lastParameter = this.popStringOrNumber();
    const insideString = String.fromCharCode(lastParameter ? 3 : 2);
    const outsideString = ' blbl';
    // ~~? 2.64: TODO, 2.66: TODO 
    const y2 = ~~lastParameter;
    // ~~? 2.64: TODO, 2.66: TODO 
    const x2 = ~~this.popStringOrNumber();
    // ~~? 2.64: TODO, 2.66: TODO 
    const y1 = ~~this.popStringOrNumber();
    // ~~? 2.64: TODO, 2.66: TODO 
    const x1 = ~~this.popStringOrNumber();

    let string = (1 + Math.abs(x1 - x2)) + ',' + (1 + Math.abs(y2 - y1)) + ':';

    for (let i = Math.min(x1, x2); i <= Math.max(x1, x2); i++) {
        for (let j = Math.min(y1, y2); j <= Math.max(y1, y2); j++) {
            if (i >= 0 && i < this.screenWidth && j >= 0 && j < this.screenHeight) {
                string += insideString;
            } else {
                string += outsideString;
            }
        }
    }

    this.pushString(string.substring(0, string.length - 1));
};

Interpreter.prototype.instructionPUTSCREEN = function () {
    // ~~? 2.64: TODO, 2.66: TODO 
    const y = ~~this.popNumber();
    // ~~? 2.64: TODO, 2.66: TODO 
    const x = ~~this.popNumber();
    const string = this.popString();

    if (!/^\s*[-+]?\d+,\s*[-+]?\d+/.test(string)) {
        this.throwError('IllegalScreenString');
    } else {
        // TODO: do something
        this.throwError('OutOfMemory');
    }
};

Interpreter.prototype.instructionERROR = function () {
    throw new YabasicRuntimeError(this.popString().replace(/[^\S\n ]/g, ''));
};

// TODO: add more?
Interpreter.prototype.instructionPOKE = function () {
    const value = this.popStringOrNumberWithType();

    switch (this.popStringOrNumberWithType().value.toLowerCase()) {
        case 'dump':
            if (value.value === 'symbols') {
                // TODO
                return;
            }
        case 'read_controls':
            if (value.type === 'Number') {
                this.readControls = !!value.value;
                return;
            }
        case 'fontheight':
            if (value.type === 'Number') {
                // numberToInt? 2.64: TODO, 2.66: yes 
                this.fontHeight = this.numberToInt(value.value);
                return;
            }
        case 'textalign':
            if (value.type === 'String') {
                this.textAlign = this.getTextAlignment(value.value);
                return;
            }
        case 'windoworigin':
            if (value.type === 'String') {
                this.setWindowOrigin(value.value);
                return;
            }
        case 'font':
            if (value.type === 'String') {
                this.font = value.value;
                return;
            }
        case 'stdout':
            if (value.type === 'String') {
                return;
            }
    }

    this.throwError('InvalidPoke');
};

// TODO: add more?
Interpreter.prototype.instructionPEEK$_1 = function () {
    switch (this.popStringOrNumber().toLowerCase()) {
        case 'library':
            this.pushString(this.library);
            return;
        case 'infolevel':
            this.pushString('warning');
            return;
        case 'os':
            this.pushString('PlayStation 2');
            return;
        case 'textalign':
            this.pushString(this.textAlign);
            return;
        case 'windoworigin':
            this.pushString(this.windowOrigin);
            return;
        case 'error':
            this.pushString(this.strings.get(...this.streamError.message));
            return;
        case 'font':
            this.pushString(this.font);
            return;
        case 'argument':
            this.pushString('');
            return;
    }

    this.throwError('InvalidPeek');
};

// TODO: add 'env'?
Interpreter.prototype.instructionPEEK$_2 = function () {
    this.throwError('InvalidPeek');
};

// TODO: add more?
Interpreter.prototype.instructionPEEK = function () {
    switch (this.popStringOrNumber().toLowerCase()) {
        case 'port1':
            this.pushNumber(this.input.getPort1());
            return;
        case 'port2':
            this.pushNumber(this.input.getPort2());
            return;
        case 'version':
            this.pushNumber(this.version);
            return;
        case 'read_controls':
            // ~~? 2.64: TODO, 2.66: TODO 
            this.pushNumber(~~this.readControls);
            return;
        case 'fontheight':
            this.pushNumber(this.fontHeight);
            return;
        case 'winwidth':
            this.pushNumber(this.windowWidth);
            return;
        case 'winheight':
            this.pushNumber(this.windowHeight);
            return;
        case 'screenwidth':
            this.pushNumber(this.screenWidth);
            return;
        case 'screenheight':
            this.pushNumber(this.screenHeight);
            return;
        case 'error':
            this.pushNumber(this.streamError.id);
            return;
        case 'argument':
            this.pushNumber(0);
            return;
    }

    this.throwError('InvalidPeek');
};

Interpreter.prototype.instructionWAIT = function () {
    const now = Date.now();
    if (this.waitStartTime === null) {
        this.waitStartTime = now;
    }

    // TODO: type checking?
    if (now >= this.waitStartTime + 1000 * this.valuesStackPeek().value) {
        this.waitStartTime = null;
        this.popNumber();
    } else {
        this.programCounter--;
    }
};

Interpreter.prototype.instructionBELL = function () {
    const now = Date.now();
    if (now >= this.bellStartTime + this.audio.duration * 1000) {
        this.bellStartTime = now;
        const audio = this.audio.cloneNode();
        audio.volume = 0.05;
        audio.play();
    } else {
        this.programCounter--;
    }

    // const now = Date.now();
    // if (this.bellStartTime === null) {
    //     this.bellStartTime = now;
    //     const audio = this.audio.cloneNode();
    //     audio.volume = 0.05;
    //     audio.play();
    // }

    // if (now >= this.bellStartTime + 1000 * this.audio.duration) {
    //     this.bellStartTime = null;
    // } else {
    //     this.programCounter--;
    // }
};

Interpreter.prototype.instructionCALL_FUNCTION_OR_ARRAY = function (name, numArguments, isUsedAsArgument) {
    if (name in this.subroutines) {
        this.instructionCALL_FUNCTION(name, numArguments);
    } else {
        this.instructionLOAD_ARRAY_ELEMENT(name, numArguments, isUsedAsArgument);
    }
};

Interpreter.prototype.instructionREAD = function (variableType) {
    if (this.dataIndex >= this.numberOfDataItems) {
        this.throwError('RunOutOfDataItems');
    }

    const data = this.data[this.dataIndex];

    if (data.type !== variableType) {
        this.throwError('TypeOfReadAndDataDontMatch');
    }

    this.valuesStackPush(data);

    this.dataIndex++;
};

Interpreter.prototype.instructionRESTORE = function (label) {
    if (label === null) {
        this.dataIndex = 0;
    } else {
        if (!(label in this.dataLabels)) {
            this.throwError('CantFindLabel', this.library + '.' + label);
        }

        this.dataIndex = this.dataLabels[label];
        this.numberOfDataItems = this.data.length;
    }
};
