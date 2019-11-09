'use strict';

///////////////////////
// UTILITY FUNCTIONS //
///////////////////////

Interpreter.prototype.gotoOrGosub = function (labelId, gosub) {
    if (this.symbolStack.stackFrame.subroutine !== undefined) {
        var instructionIndex = this.symbolStack.stackFrame.subroutine.instructionLabels[labelId];

        if (instructionIndex === undefined) {
            this.throwError(['CantFindLabel', 'NotInThisSub'], this.symbolStack.getLabelName(labelId));
        }
    } else {
        var instructionIndex = this.symbolStack.instructionLabels[labelId];

        if (instructionIndex === undefined) {
            this.throwError('CantFindLabel', this.symbolStack.getLabelName(labelId));
        }
    }

    if (gosub) {
        this.callStack.push({
            type: 'GOSUB',
            programCounter: this.programCounter,
        });
    }

    this.programCounter = instructionIndex;
};

//////////////////
// INSTRUCTIONS //
//////////////////

Interpreter.prototype.instructionCALL_FUNCTION_OR_ARRAY = function (id, numArguments) {
    const subroutineOrArray = this.symbolStack.getSubroutine(id);
    if (subroutineOrArray !== undefined && subroutineOrArray.address) {
        this.instructionCALL_FUNCTION(id, numArguments);
    } else {
        this.loadArray(id, numArguments);
    }
};

Interpreter.prototype.instructionCALL_FUNCTION = function (id, numArguments) {
    // if the requested subroutine does not exist, throw an error
    const subroutine = this.symbolStack.getSubroutine(id);

    if (subroutine === undefined || subroutine.dimensions) {
        this.throwError('CantFind', this.strings.get('Subroutine'), this.symbolStack.getSubroutineName(id));
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
        programCounter: this.programCounter,
    });
    this.symbolStack.pushStackFrame(id);

    this.programCounter = subroutine.address;
};

Interpreter.prototype.instructionRETURN = function (hasReturnValue) {
    if (this.symbolStack.stackFrame.subroutine !== undefined) {
        if (this.callStack[this.callStack.length - 1].type === 'GOSUB') {
            this.throwError('ReturnFromSubWithoutCall');
        }

        if (hasReturnValue) {
            const returnValueType = this.strings.get('A' + this.valuesStackPeek().type);
            const subroutineType = this.strings.get('A' + this.symbolStack.stackFrame.subroutine.type);

            if (returnValueType !== subroutineType) {
                this.throwError('SubReturnsButShouldReturn', returnValueType, subroutineType);
            }
        } else {
            if (this.symbolStack.stackFrame.subroutine.type === 'String') {
                this.pushString('');
            } else {
                this.pushNumber(0);
            }
        }

        const context = this.callStack.pop();
        this.symbolStack.popStackFrame();

        this.programCounter = context.programCounter;
    } else {
        if (this.callStack.length === 0) {
            this.throwError('ReturnWithoutGosub');
        }

        this.programCounter = this.callStack.pop().programCounter;
    }
};

Interpreter.prototype.instructionSTORE_LOCAL_ARRAY_REFERENCE = function (id) {
    if (this.symbolStack.arraysScope[id]) {
        this.throwError('AlreadyDefinedWithinSub', this.symbolStack.getArrayName(id));
    }

    this.symbolStack.arraysScope[id] = 'LOCAL';

    const value = this.popValue();

    this.symbolStack.getArray(id) = {
        dimensions: value.dimensions,
        values: value.values,
    };
};

Interpreter.prototype.instructionLOCAL_ARRAY = function (id, numDimensions) {
    if (this.symbolStack.arraysScope[id] !== undefined) {
        this.throwError('AlreadyDefinedWithinSub', this.symbolStack.getArrayName(id));
    }

    this.symbolStack.arraysScope[id] = 'LOCAL';

    this.instructionDIM(id, numDimensions);
};

Interpreter.prototype.instructionSTATIC_ARRAY = function (id, numDimensions) {
    if (this.symbolStack.arraysScope[id] === 'LOCAL') {
        this.throwError('AlreadyDefinedWithinSub', this.symbolStack.getArrayName(id));
    }

    this.symbolStack.arraysScope[id] = 'STATIC';

    this.instructionDIM(id, numDimensions);
};

Interpreter.prototype.instructionGOTO = function (labelId) {
    this.gotoOrGosub(labelId, false);
};

Interpreter.prototype.instructionGOSUB = function (labelId) {
    this.gotoOrGosub(labelId, true);
};

Interpreter.prototype.instructionON_GOTO = function (labelIds) {
    // numberToInt? 2.64: TODO, 2.66: TODO 
    const on = Math.min(Math.max(0, this.numberToInt(this.popNumber()) - 1), labelIds.length - 1);
    this.instructionGOTO(labelIds[on]);
};

Interpreter.prototype.instructionON_GOSUB = function (labelIds) {
    // numberToInt? 2.64: TODO, 2.66: TODO 
    const on = Math.min(Math.max(0, this.numberToInt(this.popNumber()) - 1), labelIds.length - 1);
    this.instructionGOSUB(labelIds[on]);
};

Interpreter.prototype.instructionEND = function () {
    this.programCounter = this.instructions.length;
}

Interpreter.prototype.instructionEXECUTE$ = function (numArguments) {
    if (numArguments === 0 || this.valuesStackPeek(numArguments - 1).type !== 'String') {
        this.throwError('NeedStringAsFunctionName');
    }

    const name = this.valuesStackExtract(numArguments - 1).value;

    if (!name.endsWith('$')) {
        this.throwError('ExpectingNameOfFunctionNot', this.strings.get('String'), name);
    }

    const id = this.symbolStack.symbolTable.subroutinesAndArrays.indexOf(name);
    const subroutine = this.symbolStack.getSubroutine(id);

    if (subroutine === undefined || subroutine.dimensions) {
        this.throwError('SubroutineNotDefined', this.library + '.' + id);
    }

    this.instructionCALL_FUNCTION(id, numArguments - 1);
}

Interpreter.prototype.instructionEXECUTE = function (numArguments) {
    if (numArguments === 0 || this.valuesStackPeek(numArguments - 1).type !== 'String') {
        this.throwError('NeedStringAsFunctionName');
    }

    const name = this.valuesStackExtract(numArguments - 1).value;

    if (name.endsWith('$')) {
        this.throwError('ExpectingNameOfFunctionNot', this.strings.get('Numeric'), name);
    }

    const id = this.symbolStack.symbolTable.subroutinesAndArrays.indexOf(name);
    const subroutine = this.symbolStack.getSubroutine(id);

    if (subroutine === undefined || subroutine.dimensions) {
        this.throwError('SubroutineNotDefined', this.library + '.' + id);
    }

    this.instructionCALL_FUNCTION(id, numArguments - 1);
}

Interpreter.prototype.instructionSTORE_LOCAL_STRING_VARIABLE = function (id) {
    this.instructionLOCAL_STRING_VARIABLE(id);
    this.instructionSTORE_STRING_VARIABLE(id);
};

Interpreter.prototype.instructionSTORE_LOCAL_NUMERIC_VARIABLE = function (id) {
    this.instructionLOCAL_NUMERIC_VARIABLE(id);
    this.instructionSTORE_NUMERIC_VARIABLE(id);
};

Interpreter.prototype.instructionLOCAL_STRING_VARIABLE = function (id) {
    if (this.symbolStack.stringVariablesScope[id]) {
        this.throwError('AlreadyDefinedWithinSub', this.symbolStack.symbolTable.stringVariables[id]);
    }

    this.symbolStack.stringVariablesScope[id] = 'LOCAL';
};

Interpreter.prototype.instructionLOCAL_NUMERIC_VARIABLE = function (id) {
    if (this.symbolStack.numericVariablesScope[id]) {
        this.throwError('AlreadyDefinedWithinSub', this.symbolStack.symbolTable.numericVariables[id]);
    }

    this.symbolStack.numericVariablesScope[id] = 'LOCAL';
};

Interpreter.prototype.instructionSTATIC_STRING_VARIABLE = function (id) {
    this.symbolStack.stringVariablesScope[id] = 'STATIC';
};

Interpreter.prototype.instructionSTATIC_NUMERIC_VARIABLE = function (id) {
    this.symbolStack.numericVariablesScope[id] = 'STATIC';
};

Interpreter.prototype.instructionFOR_CONDITIONAL_EXIT = function (variableId, destination) {
    const step = this.popNumber();
    const end = this.popNumber();
    const start = this.popNumber();

    this.symbolStack.getNumericVariableStore(variableId)[variableId] = start;

    if ((step > 0 && start <= end) || (step < 0 && start >= end) || (step === 0)) {
        // continue loop
    } else {
        this.programCounter = destination; // exit loop
    }
};

Interpreter.prototype.instructionFOR_CONDITIONAL_CONTINUE = function (variableId, destination) {
    const step = this.popNumber();
    const end = this.popNumber();
    const start = this.popNumber();

    const variable = this.symbolStack.getNumericVariableStore(variableId)[variableId] += step;

    if ((step > 0 && variable >= start && variable <= end) || (step < 0 && variable >= end && variable <= start) || (step === 0)) {
        this.programCounter = destination; // continue loop
    }

    // exit loop
};
