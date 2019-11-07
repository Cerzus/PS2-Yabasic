'use strict';

class SymbolStack {
    constructor(symbolTable) {
        this.symbolTable = symbolTable;

        this.stackFrames = [];

        this.pushStackFrame(null);

        this.globalStringVariables = this.localStringVariables;
        this.globalNumericVariables = this.localNumericVariables;
        this.globalSubroutinesAndArrays = this.localArrays;
    }

    setGlobalVariables(variables) {
        for (let name in variables) {
            if (name.endsWith('$')) {
                this.globalStringVariables[this.symbolTable.stringVariables.indexOf(name)] = variables[name];
            } else {
                this.globalNumericVariables[this.symbolTable.numericVariables.indexOf(name)] = variables[name];
            }
        }
    }

    setGlobalSubroutinesAndArrays(subroutinesAndArrays) {
        for (let name in subroutinesAndArrays) {
            const subroutineOrArray = subroutinesAndArrays[name];

            // subroutines get symbolstores for static variables and arrays
            if ('parameters' in subroutineOrArray) {
                subroutineOrArray.numericVariables = [];
                subroutineOrArray.stringVariables = [];
                subroutineOrArray.arrays = [];
            }

            this.globalSubroutinesAndArrays[this.symbolTable.subroutinesAndArrays.indexOf(name)] = subroutinesAndArrays[name];
        }
    }

    pushStackFrame(subroutineName) {
        this.stackFrame = this.stackFrames[this.stackFrames.push({
            subroutine: subroutineName !== null ? this.globalSubroutinesAndArrays[this.symbolTable.subroutinesAndArrays.indexOf(subroutineName)] : null,

            numericVariables: [],
            numericVariablesScope: [],

            stringVariables: [],
            stringVariablesScope: [],

            arrays: [],
            arraysScope: [],
        }) - 1];

        this.localStringVariables = this.stackFrame.stringVariables;
        this.stringVariablesScope = this.stackFrame.stringVariablesScope;

        this.localNumericVariables = this.stackFrame.numericVariables;
        this.numericVariablesScope = this.stackFrame.numericVariablesScope;

        this.localArrays = this.stackFrame.arrays;
        this.arraysScope = this.stackFrame.arraysScope;
    }

    popStackFrame() {
        this.stackFrames.pop();
        this.stackFrame = this.stackFrames[this.stackFrames.length - 1];

        this.localStringVariables = this.stackFrame.stringVariables;
        this.stringVariablesScope = this.stackFrame.stringVariablesScope;

        this.localNumericVariables = this.stackFrame.numericVariables;
        this.numericVariablesScope = this.stackFrame.numericVariablesScope;

        this.localArrays = this.stackFrame.arrays;
        this.arraysScope = this.stackFrame.arraysScope;
    }

    getStringVariableStore(variableName) {
        switch (this.stringVariablesScope[variableName]) {
            case undefined:
                return this.globalStringVariables;
            case 'LOCAL':
                return this.localStringVariables;
            default:
                return this.stackFrame.subroutine.stringVariables;
        }
    }

    getNumericVariableStore(variableName) {
        switch (this.numericVariablesScope[variableName]) {
            case undefined:
                return this.globalNumericVariables;
            case 'LOCAL':
                return this.localNumericVariables;
            default:
                return this.stackFrame.subroutine.numericVariables;
        }
    }

    getArrayStore(arrayName) {
        switch (this.arraysScope[arrayName]) {
            case undefined:
                return this.globalArrays;
            case 'LOCAL':
                return this.localArrays;
            default:
                return this.stackFrame.subroutine.arrays;
        }
    }
}
