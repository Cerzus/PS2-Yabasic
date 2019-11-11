'use strict';

/////////////////
// EVALUATIONS //
/////////////////

Parser.prototype.evaluateCLEAR_SCREEN_STATEMENT = function (node) {
    this.addInstruction(node.line, 'CLEAR_SCREEN');
};

Parser.prototype.evaluatePRINT_STATEMENT = function (node) {
    if ('stream' in node) {
        this.evaluateNode(node.stream);
        this.addInstruction(node.stream.line, 'SET_IO_STREAM', 'w');
    } else {
        if (node.colourOrReverse !== null && node.colourOrReverse.type === 'COLOUR_CLAUSE') {
            this.evaluateNode(node.colourOrReverse.a);
            if (node.colourOrReverse.b !== null) {
                this.evaluateNode(node.colourOrReverse.b);
            }
        }
        if (node.at !== null) {
            this.evaluateNode(node.at);
        }
        if (node.colourOrReverse !== null) {
            switch (node.colourOrReverse.type) {
                case 'COLOUR_CLAUSE':
                    this.addInstruction(node.colourOrReverse.line, 'COLOUR', node.colourOrReverse.b !== null ? 2 : 1);
                    break;
                case 'REVERSE_CLAUSE':
                    this.addInstruction(node.colourOrReverse.line, 'REVERSE');
                    break;
            }
        }
    }

    for (let item of node.items) {
        this.evaluateNode(item.expression);
        if (item.using !== null) {
            this.evaluateNode(item.using);
            this.addInstruction(item.expression.line, 'PRINT', true);
        } else {
            this.addInstruction(item.expression.line, 'PRINT', false);
        }
    }

    switch (node.suffix) {
        case null: {
            this.addInstruction(node.line, 'STRING', '\n');
            this.addInstruction(node.line, 'PRINT');
        } break;
        case ',': {
            this.addInstruction(node.line, 'STRING', '\t');
            this.addInstruction(node.line, 'PRINT');
        } break;
    }

    if ('stream' in node) {
        this.addInstruction(node.stream.line, 'NUMBER', 0);
        this.addInstruction(node.stream.line, 'SET_IO_STREAM');
    }
};

Parser.prototype.evaluateAT_CLAUSE = function (node) {
    this.evaluateNode(node.a);
    this.evaluateNode(node.b);
    this.addInstruction(node.line, 'AT');
};

Parser.prototype.evaluateINPUT_STATEMENT = function (node) {
    if ('stream' in node) {
        this.evaluateNode(node.stream);
        this.addInstruction(node.stream.line, 'SET_IO_STREAM', 'r');
    } else if (node.at !== null) {
        this.evaluateNode(node.at.a);
        this.evaluateNode(node.at.b);
        this.addInstruction(node.at.line, 'AT');
    }

    this.addInstruction(node.line, 'SET_PROMPT', this.asciiEncodeString(this.escapeString(node.prompt)));

    for (let item of node.items) {
        switch (item.type) {
            case 'STRING_VARIABLE':
                this.addInstruction(item.line, 'INPUT', node.splitOnSpaces, true);
                this.addInstruction(item.line, 'STORE_STRING_VARIABLE', this.stringVariable(item.name));
                break;
            case 'NUMERIC_VARIABLE':
            case 'NUMPARAMS':
                this.addInstruction(item.line, 'INPUT', node.splitOnSpaces, false);
                this.addInstruction(item.line, 'STORE_NUMERIC_VARIABLE', this.numericVariable(item.name));
                break;
            case 'STRING_FUNCTION_OR_ARRAY':
            case 'NUMERIC_FUNCTION_OR_ARRAY':
                this.evaluateArgumentNodes(item.arguments);
                this.addInstruction(item.line, 'INPUT', node.splitOnSpaces, item.type === 'STRING_FUNCTION_OR_ARRAY');
                this.addInstruction(item.line, 'STORE_ARRAY_ELEMENT', this.subroutineOrArray(item.name), item.arguments.length);
                break;
        }
    }

    this.addInstruction(node.line, 'FLUSH_PROMPT');

    if ('stream' in node) {
        this.addInstruction(node.stream.line, 'NUMBER', 0);
        this.addInstruction(node.stream.line, 'SET_IO_STREAM');
    }
};

Parser.prototype.evaluateINKEY$ = function (node) {
    if (node.timeout !== null) {
        this.evaluateNode(node.timeout);
    }
    this.addInstruction(node.line, 'INKEY$', !!node.timeout);
};

Parser.prototype.evaluateINKEY$_STATEMENT = function (node) {
    if (node.timeout !== null) {
        this.evaluateNode(node.timeout);
    }
    this.addInstruction(node.line, 'INKEY$', !!node.timeout);
    this.addInstruction(node.line, 'POP');
};

