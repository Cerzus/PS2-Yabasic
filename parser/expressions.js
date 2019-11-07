'use strict';

/////////////////
// EVALUATIONS //
/////////////////

Parser.prototype.evaluateNUMERIC_LITERAL = function (node) {
    this.addInstruction(node.line, 'NUMBER', node.value);
};

Parser.prototype.evaluateSTRING_LITERAL = function (node) {
    this.addInstruction(node.line, 'STRING', this.asciiEncodeString(this.escapeString(node.value)));
};

Parser.prototype.evaluateNUMERIC_UNARY_EXPRESSION = function (node) {
    this.evaluateNode(node.right);

    const operators = {
        '-': 'NEGATE',
    };

    this.addInstruction(node.line, operators[node.operator]);
};

Parser.prototype.evaluateNUMERIC_BINARY_EXPRESSION = function (node) {
    this.evaluateNode(node.left);
    this.evaluateNode(node.right);

    const operators = {
        '+': 'ADD_NUMERIC',
        '-': 'SUBTRACT',
        '*': 'MULTIPLY',
        '/': 'DIVIDE',
        '^': 'POWER',
        '**': 'POWER',
    };

    this.addInstruction(node.line, operators[node.operator]);
};

Parser.prototype.evaluateSTRING_BINARY_EXPRESSION = function (node) {
    this.evaluateNode(node.left);
    this.evaluateNode(node.right);

    const operators = {
        '+': 'ADD_STRING',
    };

    this.addInstruction(node.line, operators[node.operator]);
};

Parser.prototype.evaluateNUMERIC_COMPARISON_EXPRESSION = function (node) {
    this.evaluateNode(node.left);
    this.evaluateNode(node.right);

    const operators = {
        '=': 'EQUALS_NUMERIC',
        '<>': 'NOT_EQUALS_NUMERIC',
        '>': 'GREATER_THAN_NUMERIC',
        '<': 'LESS_THAN_NUMERIC',
        '>=': 'GREATER_THAN_OR_EQUALS_NUMERIC',
        '<=': 'LESS_THAN_OR_EQUALS_NUMERIC',
    };

    this.addInstruction(node.line, operators[node.operator]);
};

Parser.prototype.evaluateSTRING_COMPARISON_EXPRESSION = function (node) {
    this.evaluateNode(node.left);
    this.evaluateNode(node.right);

    const operators = {
        '=': 'EQUALS_STRING',
        '<>': 'NOT_EQUALS_STRING',
        '>': 'GREATER_THAN_STRING',
        '<': 'LESS_THAN_STRING',
        '>=': 'GREATER_THAN_OR_EQUALS_STRING',
        '<=': 'LESS_THAN_OR_EQUALS_STRING',
    };

    this.addInstruction(node.line, operators[node.operator]);
};

Parser.prototype.evaluateLOGICAL_EXPRESSION = function (node) {
    if (node.left) {
        this.evaluateNode(node.left);
    }
    this.evaluateNode(node.right);

    const operators = {
        '!': 'LOGICAL_NOT',
        '&&': 'LOGICAL_AND',
        '||': 'LOGICAL_OR',
    };

    this.addInstruction(node.line, operators[node.operator]);
};

Parser.prototype.evaluateNUMPARAMS = function (node) {
    this.addInstruction(node.line, 'LOAD_NUMERIC_VARIABLE', node.name);
};

Parser.prototype.evaluateNUMERIC_VARIABLE = function (node) {
    this.addInstruction(node.line, 'LOAD_NUMERIC_VARIABLE', this.numericVariable(node.name));
};

Parser.prototype.evaluateSTRING_VARIABLE = function (node) {
    this.addInstruction(node.line, 'LOAD_STRING_VARIABLE', this.stringVariable(node.name));
};

Parser.prototype.evaluateNUMERIC_ARRAY = function (node) {
    this.addInstruction(node.line, 'LOAD_ARRAY_REFERENCE', node.name, 'NumericArray');
};

Parser.prototype.evaluateSTRING_ARRAY = function (node) {
    this.addInstruction(node.line, 'LOAD_ARRAY_REFERENCE', node.name, 'StringArray');
};
