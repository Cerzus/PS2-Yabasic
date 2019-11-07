'use strict';

class Parser {
    constructor() {
        this.asciiTable = new AsciiTable();
    }

    compile(version, source, compilingAtRuntime, onAbstractSyntaxTreeCreated) {
        this.isStuck = false;
        this.compilingAtRuntime = compilingAtRuntime;

        // add an implicit END to be able to add compiled code at runtime without running that automatically
        source += '\nend';

        // if not a new program, that means we are compiling at runtime with the COMPILE function,
        // in which case we need to reuse all compilation data
        if (!compilingAtRuntime) {
            this.subroutines = {};
            this.instructions = [];
            this.instructionLabels = {};
            this.data = [];
            this.dataLabels = {};
            this.documentation = [''];

            this.symbolTable = new SymbolTable();
            this.symbolTable.stringVariables = [];
            this.symbolTable.numericVariables = ['numparams', 'PI', 'pi', 'EULER', 'euler'];
            this.symbolTable.stringFunctionsAndArrays = ['docu$'];
            this.symbolTable.numericFunctionsAndArrays = [];
        }

        const abstractSyntaxTree = this.parser.parse(source, {
            version,
            symbolTable: this.symbolTable,

            internalLabels: Object.keys(this.instructionLabels),
            subroutineNames: Object.keys(this.subroutines),
        });

        if (!compilingAtRuntime) {
            onAbstractSyntaxTreeCreated(abstractSyntaxTree);
        }

        console.log('symbolTableStringVariables', this.symbolTable.stringVariables);
        console.log('symbolTableNumericVariables', this.symbolTable.numericVariables);
        console.log('symbolTableStringFunctionsAndArrays', this.symbolTable.stringFunctionsAndArrays);
        console.log('symbolTableNumericFunctionsAndArrays', this.symbolTable.numericFunctionsAndArrays);

        this.evaluateNode(abstractSyntaxTree);

        // TODO: test if sending everything when using COMPILE makes a significant difference
        return this.isStuck ? null : {
            subroutines: this.subroutines,
            instructions: this.instructions,
            instructionLabels: this.instructionLabels,
            data: this.data,
            dataLabels: this.dataLabels,
            documentation: this.documentation,

            symbolTable: this.symbolTable,
        };
    }

    evaluateNode(node) {
        this['evaluate' + node.type](node);
    }

    evaluateArgumentNodes(nodes) {
        for (let node of nodes) {
            if (node.type === 'NUMERIC_FUNCTION_OR_ARRAY' || node.type === 'STRING_FUNCTION_OR_ARRAY') {
                this['evaluate' + node.type](node, true); // true => the function or array is passed as an argument
            } else {
                this.evaluateNode(node);
            }
        }
    }

    evaluateNodeArray(nodes) {
        for (let node of nodes) {
            this.evaluateNode(node);
        }
    }

    addInstruction(...instruction) {
        this.instructions.push({ line: instruction[0], type: 'instruction' + instruction[1], arguments: instruction.slice(2)});
    }

    addInstructionPlaceholder() {
        return this.instructions.push(null) - 1;
    }

    insertInstruction(index, ...instruction) {
        this.instructions[index] = { line: instruction[0], type: 'instruction' + instruction[1], arguments: instruction.slice(2)};
    }

    escapeString(string) {
        for (let i = 0; i < string.length; i++) {
            if (string[i] === '\\') {
                switch (string[i + 1]) {
                    case '\\':
                    case '\'':
                    case '\"':
                        string = string.substring(0, i) + string.substring(i + 1);
                        break;
                    case 'a':
                        string = string.substring(0, i) + String.fromCharCode(7) + string.substring(i + 2);
                        break;
                    case 'b':
                        string = string.substring(0, i) + String.fromCharCode(8) + string.substring(i + 2);
                        break;
                    case 't':
                        string = string.substring(0, i) + '\t' + string.substring(i + 2);
                        break;
                    case 'n':
                        string = string.substring(0, i) + '\n' + string.substring(i + 2);
                        break;
                    case 'v':
                        string = string.substring(0, i) + '\v' + string.substring(i + 2);
                        break;
                    case 'f':
                        string = string.substring(0, i) + '\f' + string.substring(i + 2);
                        break;
                    case 'r':
                        string = string.substring(0, i) + '\r' + string.substring(i + 2);
                        break;
                }
            }
        }
        return string;
    }

    asciiEncodeString(string) {
        return this.compilingAtRuntime ? string : this.asciiTable.encode(string);
    }

    stringVariable(variableName) {
        return this.symbolTable.stringVariables.indexOf(variableName);
    }

    numericVariable(variableName) {
        return this.symbolTable.numericVariables.indexOf(variableName);
    }
}
