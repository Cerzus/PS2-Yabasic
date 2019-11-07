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
    if (numArguments === 0 || this.valuesStackPeek(numArguments - 1)[1] !== 'String') {
        this.throwError('NeedStringAsFunctionName');
    }

    const name = this.valuesStackExtract(numArguments - 1)[0];

    if (!name.endsWith('$')) {
        this.throwError('ExpectingNameOfFunctionNot', this.strings.get('String'), name);
    } else if (!(name in this.subroutines)) {
        this.throwError('SubroutineNotDefined', this.library + '.' + name);
    }

    this.instructionCALL_FUNCTION(name, numArguments - 1);
}

Interpreter.prototype.instructionEXECUTE = function (numArguments) {
    if (numArguments === 0 || this.valuesStackPeek(numArguments - 1)[1] !== 'String') {
        this.throwError('NeedStringAsFunctionName');
    }

    const name = this.valuesStackExtract(numArguments - 1)[0];

    if (name.endsWith('$')) {
        this.throwError('ExpectingNameOfFunctionNot', this.strings.get('Numeric'), name);
    } else if (!(name in this.subroutines)) {
        this.throwError('SubroutineNotDefined', this.library + '.' + name);
    }

    this.instructionCALL_FUNCTION(name, numArguments - 1);
}

Interpreter.prototype.instructionCALL_FUNCTION = function (name, numArguments) {
    // if the requested subroutine does not exist, throw an error
    if (!(name in this.subroutines)) {
        this.throwError('CantFind', this.strings.get('Subroutine'), name);
    }

    const parameters = this.subroutines[name].parameters;

    // check for wrong argument types
    for (let i = 0; i < numArguments; i++) {
        const supplied = this.strings.get(this.valuesStackPeek(numArguments - 1 - i)[1])
        // const supplied = this.strings.get(this.valuesStack[this.valuesStack.length - numArguments + i][1]);
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
                this.pushStringArray({ dimensions: null });
                break;
            case 'NumericArray':
                this.pushNumericArray({ dimensions: null });
                break;
        }
    }

    // NUMPARAMS
    this.pushNumber(numArguments);

    this.callStack.push({
        type: 'SUBROUTINE',
        subroutineName: this.subroutineName,
        // this array contains objects containing arrays, any problems with references?
        arrayReferenceParameters: this.arrayReferenceParameters.slice(),
        // localVariables: this.localVariables.slice(),
        staticVariables: this.staticVariables.slice(),
        localArrays: this.localArrays.slice(),
        staticArrays: this.staticArrays.slice(),
        programCounter: this.programCounter,
    });
    this.symbolStack.pushStackFrame();

    this.subroutineName = name;
    this.arrayReferenceParameters = [];
    // this.localVariables = [];
    this.staticVariables = [];
    this.localArrays = [];
    this.staticArrays = [];

    this.programCounter = this.subroutines[name].address;

    this.currentSubroutineLevel++;
};

Interpreter.prototype.instructionRETURN = function (hasReturnValue) {
    if (this.subroutineName) {
        if (this.callStack[this.callStack.length - 1].type === 'GOSUB') {
            this.throwError('ReturnFromSubWithoutCall');
        }

        if (hasReturnValue) {
            const returnValueType = this.strings.get('A' + this.valuesStackPeek()[1]);
            // const returnValueType = this.strings.get('A' + this.valuesStack[this.valuesStack.length - 1][1]);
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

        // apply any local and static arrays to the arrays they were passed in as
        for (let name in this.arrayReferenceParameters) {
            if (this.staticArrays.indexOf(name) >= 0) {
                this.arrayReferenceParameters[name][0].dimensions = this.arrays[this.staticScopeName(name)].dimensions
                this.arrayReferenceParameters[name][0].values = this.arrays[this.staticScopeName(name)].values;
            } else {
                this.arrayReferenceParameters[name][0].dimensions = this.arrayReferenceParameters[name][1].dimensions;
                this.arrayReferenceParameters[name][0].values = this.arrayReferenceParameters[name][1].values;
            }
        }

        // delete all local variables and arrays
        // for (let name of this.localVariables) {
        //     delete this.variables[this.scopeVariableName(name)];
        // }

        for (let name of this.localArrays) {
            delete this.arrays[this.scopeArrayName(name)];
        }

        const context = this.callStack.pop();
        this.symbolStack.popStackFrame();

        this.subroutineName = context.subroutineName;
        this.arrayReferenceParameters = context.arrayReferenceParameters;
        // this.localVariables = context.localVariables;
        this.staticVariables = context.staticVariables;
        this.localArrays = context.localArrays;
        this.staticArrays = context.staticArrays;

        this.programCounter = context.programCounter;
        this.currentSubroutineLevel--;
    } else {
        if (this.callStack.length === 0) {
            this.throwError('ReturnWithoutGosub');
        }

        this.programCounter = this.callStack.pop().programCounter;
    }
};

Interpreter.prototype.instructionLOCAL_ARRAY_REFERENCE = function (arrayName) {
    if (this.localArrays.indexOf(arrayName) < 0) {
        this.localArrays.push(arrayName);
    }
    // this.instructionDIM(arrayName, 0);
};

Interpreter.prototype.instructionLOCAL_ARRAY = function (arrayName, numDimensions) {
    if (this.localArrays.indexOf(arrayName) >= 0 || this.staticArrays.indexOf(arrayName) >= 0) {
        this.throwError('AlreadyDefinedWithinSub', arrayName);
    }

    this.localArrays.push(arrayName);
    this.instructionDIM(arrayName, numDimensions);
};

Interpreter.prototype.instructionSTATIC_ARRAY = function (arrayName, numDimensions) {
    if (this.staticArrays.indexOf(arrayName) < 0) {
        this.staticArrays.push(arrayName);
    }

    if (this.localArrays.indexOf(arrayName) < 0) {
        this.instructionDIM(arrayName, numDimensions);
    } else if (arrayName in this.arrayReferenceParameters) {
        this.localArrays = this.localArrays.filter(x => x !== arrayName);
        this.instructionDIM(arrayName, numDimensions);
        this.localArrays.push(arrayName);
    } else {
        delete this.arrays[this.localScopeName(arrayName)];
        this.localArrays = this.localArrays.filter(x => x !== arrayName);
        this.instructionDIM(arrayName, numDimensions);
    }
};

// Interpreter.prototype.instructionLOCAL_VARIABLE = function (variableName) {
//     if (this.localVariables.indexOf(variableName) >= 0 || this.staticVariables.indexOf(variableName) >= 0) {
//         this.throwError('AlreadyDefinedWithinSub', variableName);
//     }

//     this.localVariables.push(variableName);
// };

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

Interpreter.prototype.instructionSTATIC_VARIABLE = function (variableName) {
    if (this.staticVariables.indexOf(variableName) < 0) {
        delete this.variables[this.scopeVariableName(variableName)];
        this.localVariables = this.localVariables.filter(x => x !== variableName);

        this.staticVariables.push(variableName);
    }
};

Interpreter.prototype.instructionFOR_CONDITIONAL_EXIT = function (variableName, destination) {
    const step = this.popNumber();
    const end = this.popNumber();
    const start = this.popNumber();

    // variableName = this.scopeVariableName(variableName);
    // this.variables[variableName] = start;
    // const variable = this.variables[variableName];
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

    // variableName = this.scopeVariableName(variableName);
    // this.variables[variableName] += step;
    // const variable = this.variables[variableName];
    const variable = this.symbolStack.getNumericVariableStore(variableName)[variableName] += step;

    if (step > 0 && variable >= start && variable <= end) {
        this.programCounter = destination; // continue loop
    } else if (step < 0 && variable >= end && variable <= start) {
        this.programCounter = destination; // continue loop
    } else if (step === 0) {
        this.programCounter = destination; // continue loop
    } else {
        // exit loop
    }
};
