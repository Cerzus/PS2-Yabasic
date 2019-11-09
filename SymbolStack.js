'use strict';

class SymbolStack {
    constructor(symbolTable) {
        this.symbolTable = symbolTable;

        this.stackFrames = [];

        this.pushStackFrame();

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
            const id = this.symbolTable.subroutinesAndArrays.indexOf(name);

            // only add new subroutines and arrays or subroutines that overwrite arrays of the same name
            const currentSubroutineOrArray = this.globalSubroutinesAndArrays[id];
            if (currentSubroutineOrArray === undefined || currentSubroutineOrArray.address === undefined) {
                const subroutineOrArray = subroutinesAndArrays[name];

                // subroutines get symbol stores for static variables and arrays
                if (subroutineOrArray.address) {
                    subroutineOrArray.numericVariables = [];
                    subroutineOrArray.stringVariables = [];
                    subroutineOrArray.arrays = [];
                }

                this.globalSubroutinesAndArrays[id] = subroutineOrArray;
            }
        }
    }

    setGlobalInstructionLabels(instructionLabels) {
        this.instructionLabels = instructionLabels;
    }

    setGlobalDataLabels(dataLabels) {
        this.dataLabels = dataLabels;
    }

    pushStackFrame(subroutineId) {
        this.stackFrame = this.stackFrames[this.stackFrames.push({
            subroutine: subroutineId !== undefined ? this.globalSubroutinesAndArrays[subroutineId] : undefined,

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

    getStringVariableStore(id) {
        switch (this.stringVariablesScope[id]) {
            case undefined:
                return this.globalStringVariables;
            case 'LOCAL':
                return this.localStringVariables;
            default:
                return this.stackFrame.subroutine.stringVariables;
        }
    }

    getNumericVariableStore(id) {
        switch (this.numericVariablesScope[id]) {
            case undefined:
                return this.globalNumericVariables;
            case 'LOCAL':
                return this.localNumericVariables;
            default:
                return this.stackFrame.subroutine.numericVariables;
        }
    }

    getArrayStore(id) {
        switch (this.arraysScope[id]) {
            case undefined:
                return this.globalSubroutinesAndArrays;
            case 'LOCAL':
                return this.localArrays;
            default:
                return this.stackFrame.subroutine.arrays;
        }
    }

    getArray(id) {
        return this.getArrayStore(id)[id];
    }

    getArrayName(id) {
        return this.symbolTable.subroutinesAndArrays[id];
    }

    getArrayType(id) {
        return this.symbolTable.subroutinesAndArrays[id].endsWith('$') ? 'String' : 'Number';
    }

    getSubroutine(id) {
        return this.globalSubroutinesAndArrays[id];
    }

    getSubroutineName(id) {
        return this.symbolTable.subroutinesAndArrays[id];
    }

    getSubroutineType(id) {
        return this.symbolTable.subroutinesAndArrays[id].endsWith('$') ? 'String' : 'Number';
    }

    getCurrentSubroutineType() {
        return this.getSubroutineType(this.globalSubroutinesAndArrays.indexOf(this.stackFrame.subroutine));
    }

    getLabelName(id) {
        return this.symbolTable.labels[id];
    }
}
