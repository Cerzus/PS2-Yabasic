'use strict';

class SymbolStack {
    constructor(symbolTable) {
        this.symbolTable = symbolTable;

        this.stackFrames = [];
        this.pushStackFrame();
        this.globalStringVariables = this.localStringVariables;
        this.globalNumericVariables = this.localNumericVariables;
    }

    pushStackFrame() {
        this.stackFrame = this.stackFrames[this.stackFrames.push({
            numericVariables: new Float64Array(this.symbolTable.numericVariables.length),
            stringVariables: new Array(this.symbolTable.stringVariables.length),

            numericVariablesScope: new Uint8Array(this.symbolTable.numericVariables.length),
            stringVariablesScope: new Uint8Array(this.symbolTable.stringVariables.length),
        }) - 1];

        this.localStringVariables = this.stackFrame.stringVariables;
        this.localNumericVariables = this.stackFrame.numericVariables;

        this.stringVariablesScope = this.stackFrame.stringVariablesScope;
        this.numericVariablesScope = this.stackFrame.numericVariablesScope;
    }

    popStackFrame() {
        this.stackFrames.pop();
        this.stackFrame = this.stackFrames[this.stackFrames.length - 1];

        this.localStringVariables = this.stackFrame.stringVariables;
        this.localNumericVariables = this.stackFrame.numericVariables;

        this.stringVariablesScope = this.stackFrame.stringVariablesScope;
        this.numericVariablesScope = this.stackFrame.numericVariablesScope;
    }

    getStringVariableStore(variableName) {
        switch (this.numericVariablesScope[variableName]) {
            case 1:
                return this.localStringVariables;
            default:
                return this.globalStringVariables;
        }
    }

    getNumericVariableStore(variableName) {
        switch (this.numericVariablesScope[variableName]) {
            case 1:
                return this.localNumericVariables;
            default:
                return this.globalNumericVariables;
        }
    }
}
