'use strict';

///////////////////////
// UTILITY FUNCTIONS //
///////////////////////

Interpreter.prototype.gotoOrGosub = function (label, gosub) {
    if (this.subroutineName) {
        const scopedLabel = this.subroutineName + '/' + label;

        if (!(scopedLabel in this.instructionLabels)) {
            this.throwError(['CantFindLabel', 'NotInThisSub'], label);
        }

        label = scopedLabel;
    } else if (!(label in this.instructionLabels)) {
        this.throwError('CantFindLabel', label);
    }

    if (gosub) {
        this.callStack.push({
            type: 'GOSUB',
            programCounter: this.programCounter,
        });
    }

    this.programCounter = this.instructionLabels[label];
};

//////////////////
// INSTRUCTIONS //
//////////////////

Interpreter.prototype.instructionCALL_FUNCTION_OR_ARRAY = function (name, numArguments) {
    const subroutineOrArray = this.symbolStack.globalSubroutinesAndArrays[name];
    if (subroutineOrArray !== undefined && subroutineOrArray.address) {
        this.instructionCALL_FUNCTION(name, numArguments);
    } else {
        this.loadArray(name, numArguments);
    }
};

Interpreter.prototype.instructionCALL_FUNCTION = function (name, numArguments) {
    // if the requested subroutine does not exist, throw an error
    const subroutine = this.symbolStack.globalSubroutinesAndArrays[name];
    if (subroutine === undefined) {
        this.throwError('CantFind', this.strings.get('Subroutine'), this.getRealSubroutineOrArrayName(name));
    }

    const parameters = subroutine.parameters;

    // check for wrong argument types
    for (let i = 0; i < numArguments; i++) {
        const supplied = this.strings.get(this.valuesStackPeek(numArguments - 1 - i).type)
        const expected = this.strings.get(i < parameters.length ? parameters[i] : 'Nothing');

        if (supplied !== expected) {
            this.throwError('InvalidSubCallExpectedReplied', expected, supplied);
        }
    }

    // add default values to the values stack if too few arguments are given
    for (let i = numArguments; i < parameters.length; i++) {
        switch (parameters[i]) {
            case 'String':
                this.pushString('');
                break;
            case 'Number':
                this.pushNumber(0);
                break;
            case 'StringArray':
                this.pushStringArray({ dimensions: [] });
                break;
            case 'NumericArray':
                this.pushNumericArray({ dimensions: [] });
                break;
        }
    }

    // NUMPARAMS
    this.pushNumber(numArguments);

    this.callStack.push({
        type: 'SUBROUTINE',
        subroutineName: this.subroutineName,
        programCounter: this.programCounter,
    });
    this.symbolStack.pushStackFrame(name);

    this.subroutineName = this.getRealSubroutineOrArrayName(name);

    this.programCounter = subroutine.address;

    this.currentSubroutineLevel++;
};

Interpreter.prototype.instructionRETURN = function (hasReturnValue) {
    if (this.subroutineName) {
        if (this.callStack[this.callStack.length - 1].type === 'GOSUB') {
            this.throwError('ReturnFromSubWithoutCall');
        }

        if (hasReturnValue) {
            const returnValueType = this.strings.get('A' + this.valuesStackPeek().type);
            const subroutineType = this.strings.get(this.subroutineName.endsWith('$') ? 'AString' : 'ANumber');

            if (returnValueType !== subroutineType) {
                this.throwError('SubReturnsButShouldReturn', returnValueType, subroutineType);
            }
        } else {
            if (this.subroutineName.endsWith('$')) {
                this.pushString('');
            } else {
                this.pushNumber(0);
            }
        }

        const context = this.callStack.pop();
        this.symbolStack.popStackFrame();

        this.subroutineName = context.subroutineName;

        this.programCounter = context.programCounter;
        this.currentSubroutineLevel--;
    } else {
        if (this.callStack.length === 0) {
            this.throwError('ReturnWithoutGosub');
        }

        this.programCounter = this.callStack.pop().programCounter;
    }
};

Interpreter.prototype.instructionLOCAL_ARRAY = function (arrayName, numDimensions) {
    if (this.symbolStack.arraysScope[arrayName]) {
        this.throwError('AlreadyDefinedWithinSub', this.getRealSubroutineOrArrayName(arrayName));
    }

    this.symbolStack.arraysScope[arrayName] = 'LOCAL';

    this.instructionDIM(arrayName, numDimensions);
};

Interpreter.prototype.instructionSTATIC_ARRAY = function (arrayName, numDimensions) {
    if (this.symbolStack.arraysScope[arrayName] === 'LOCAL') {
        this.throwError('AlreadyDefinedWithinSub', this.getRealSubroutineOrArrayName(arrayName));
    }

    this.symbolStack.arraysScope[arrayName] = 'STATIC';

    this.instructionDIM(arrayName, numDimensions);
};

Interpreter.prototype.instructionGOTO = function (label) {
    this.gotoOrGosub(label, false);
};

Interpreter.prototype.instructionGOSUB = function (label) {
    this.gotoOrGosub(label, true);
};

Interpreter.prototype.instructionON_GOTO = function (labels) {
    // numberToInt? 2.64: TODO, 2.66: TODO 
    const on = Math.min(Math.max(0, this.numberToInt(this.popNumber()) - 1), labels.length - 1);
    this.instructionGOTO(labels[on]);
};

Interpreter.prototype.instructionON_GOSUB = function (labels) {
    // numberToInt? 2.64: TODO, 2.66: TODO 
    const on = Math.min(Math.max(0, this.numberToInt(this.popNumber()) - 1), labels.length - 1);
    this.instructionGOSUB(labels[on]);
};

Interpreter.prototype.instructionEND = function () {
    this.programCounter = this.instructions.length;
}

Interpreter.prototype.instructionEXECUTE$ = function (numArguments) {
    if (numArguments === 0 || this.valuesStackPeek(numArguments - 1).type !== 'String') {
        this.throwError('NeedStringAsFunctionName');
    }

    const realName = this.valuesStackExtract(numArguments - 1).value;

    if (!realName.endsWith('$')) {
        this.throwError('ExpectingNameOfFunctionNot', this.strings.get('String'), realName);
    }

    const name = this.symbolStack.symbolTable.subroutinesAndArrays.indexOf(realName);
    const subroutine = this.symbolStack.globalSubroutinesAndArrays[name];

    if (subroutine === undefined || subroutine.dimensions) {
        this.throwError('SubroutineNotDefined', this.library + '.' + name);
    }

    this.instructionCALL_FUNCTION(name, numArguments - 1);
}

Interpreter.prototype.instructionEXECUTE = function (numArguments) {
    if (numArguments === 0 || this.valuesStackPeek(numArguments - 1).type !== 'String') {
        this.throwError('NeedStringAsFunctionName');
    }

    const realName = this.valuesStackExtract(numArguments - 1).value;

    if (realName.endsWith('$')) {
        this.throwError('ExpectingNameOfFunctionNot', this.strings.get('Numeric'), realName);
    }

    const name = this.symbolStack.symbolTable.subroutinesAndArrays.indexOf(realName);
    const subroutine = this.symbolStack.globalSubroutinesAndArrays[name];

    if (subroutine === undefined || subroutine.dimensions) {
        this.throwError('SubroutineNotDefined', this.library + '.' + name);
    }

    this.instructionCALL_FUNCTION(name, numArguments - 1);

}

Interpreter.prototype.instructionLOCAL_STRING_VARIABLE = function (variableName) {
    if (this.symbolStack.stringVariablesScope[variableName]) {
        this.throwError('AlreadyDefinedWithinSub', this.symbolStack.symbolTable.stringVariables[variableName]);
    }

    this.symbolStack.stringVariablesScope[variableName] = 'LOCAL';
};

Interpreter.prototype.instructionLOCAL_NUMERIC_VARIABLE = function (variableName) {
    if (this.symbolStack.numericVariablesScope[variableName]) {
        this.throwError('AlreadyDefinedWithinSub', this.symbolStack.symbolTable.numericVariables[variableName]);
    }

    this.symbolStack.numericVariablesScope[variableName] = 'LOCAL';
};

Interpreter.prototype.instructionSTATIC_STRING_VARIABLE = function (variableName) {
    this.symbolStack.stringVariablesScope[variableName] = 'STATIC';
};

Interpreter.prototype.instructionSTATIC_NUMERIC_VARIABLE = function (variableName) {
    this.symbolStack.numericVariablesScope[variableName] = 'STATIC';
};

Interpreter.prototype.instructionFOR_CONDITIONAL_EXIT = function (variableName, destination) {
    const step = this.popNumber();
    const end = this.popNumber();
    const start = this.popNumber();

    this.symbolStack.getNumericVariableStore(variableName)[variableName] = start;

    if ((step > 0 && start <= end) || (step < 0 && start >= end) || (step === 0)) {
        // continue loop
    } else {
        this.programCounter = destination; // exit loop
    }
};

Interpreter.prototype.instructionFOR_CONDITIONAL_CONTINUE = function (variableName, destination) {
    const step = this.popNumber();
    const end = this.popNumber();
    const start = this.popNumber();

    const variable = this.symbolStack.getNumericVariableStore(variableName)[variableName] += step;

    if ((step > 0 && variable >= start && variable <= end) || (step < 0 && variable >= end && variable <= start) || (step === 0)) {
        this.programCounter = destination; // continue loop
    }

    // exit loop
};
