'use strict';

///////////////////////
// UTILITY FUNCTIONS //
///////////////////////

Parser.prototype.stringReplacementAssignment = function (node, instruction) {
    switch (node.a.type) {
        case 'STRING_VARIABLE':
            this.evaluateNode(node.b);
            if (node.c !== null) {
                this.evaluateNode(node.c);
            }
            this.evaluateNode(node.right);
            this.addInstruction(node.line, instruction + '$_VARIABLE', this.stringVariable(node.a.name), node.c !== null);
            break;
        case 'STRING_ARRAY_MUTATOR':
            this.evaluateArgumentNodes(node.a.index);
            this.addInstruction(node.line, 'CALL_ARRAY_PUSH_INDICES', this.subroutineOrArray(node.a.array), node.a.index.length, node.c !== null);
            this.evaluateNode(node.b);
            if (node.c !== null) {
                this.evaluateNode(node.c);
            }
            this.evaluateNode(node.right);
            this.addInstruction(node.line, instruction + '$_ARRAY', this.subroutineOrArray(node.a.array), node.a.index.length, node.c !== null);
            break;
    }
};

Parser.prototype.splitStringAssignment = function (node, removeEmptyStrings) {
    switch (node.a.type) {
        case 'STRING_VARIABLE':
            if (node.b !== null) {
                this.evaluateNode(node.b);
            }
            this.addInstruction(node.line, 'SPLIT$_VARIABLE', node.b !== null, removeEmptyStrings, this.stringVariable(node.a.name));
            break;
        case 'STRING_ARRAY_MUTATOR':
            this.evaluateArgumentNodes(node.a.index);
            this.addInstruction(node.line, 'CALL_ARRAY_PUSH_INDICES', this.subroutineOrArray(node.a.array), node.a.index.length);
            if (node.b !== null) {
                this.evaluateNode(node.b);
            }
            this.addInstruction(node.line, 'SPLIT$_ARRAY', node.b !== null, removeEmptyStrings, this.subroutineOrArray(node.a.array), node.a.index.length);
            break;
    }
};

/////////////////
// EVALUATIONS //
/////////////////

Parser.prototype.evaluateLEFT$_ASSIGNMENT_STATEMENT = function (node) {
    this.stringReplacementAssignment(node, 'LEFT');
};

Parser.prototype.evaluateRIGHT$_ASSIGNMENT_STATEMENT = function (node) {
    this.stringReplacementAssignment(node, 'RIGHT');
};

Parser.prototype.evaluateMID$_ASSIGNMENT_STATEMENT = function (node) {
    this.stringReplacementAssignment(node, 'MID');
};

Parser.prototype.evaluateLEFT$ = function (node) {
    this.evaluateNode(node.a);
    this.evaluateNode(node.b);
    this.addInstruction(node.line, 'LEFT$');
};

Parser.prototype.evaluateRIGHT$ = function (node) {
    this.evaluateNode(node.a);
    this.evaluateNode(node.b);
    this.addInstruction(node.line, 'RIGHT$');
};

Parser.prototype.evaluateMID$ = function (node) {
    this.evaluateNode(node.a);
    this.evaluateNode(node.b);
    if (node.c !== null) {
        this.evaluateNode(node.c);
        this.addInstruction(node.line, 'MID$_3');
    } else {
        this.addInstruction(node.line, 'MID$_2');
    }
};

Parser.prototype.evaluateSTR$ = function (node) {
    this.evaluateNode(node.a);
    if (node.b !== null) {
        this.evaluateNode(node.b);
        this.addInstruction(node.line, 'STR$_2');
    } else {
        this.addInstruction(node.line, 'STR$_1');
    }
};

Parser.prototype.evaluateCHR$ = function (node) {
    this.evaluateNode(node.a);
    this.addInstruction(node.line, 'CHR$');
};

Parser.prototype.evaluateUPPER$ = function (node) {
    this.evaluateNode(node.a);
    this.addInstruction(node.line, 'UPPER$');
};

Parser.prototype.evaluateLOWER$ = function (node) {
    this.evaluateNode(node.a);
    this.addInstruction(node.line, 'LOWER$');
};

Parser.prototype.evaluateLOWER$ = function (node) {
    this.evaluateNode(node.a);
    this.addInstruction(node.line, 'LOWER$');
};

Parser.prototype.evaluateLTRIM$ = function (node) {
    this.evaluateNode(node.a);
    this.addInstruction(node.line, 'LTRIM$');
};

Parser.prototype.evaluateRTRIM$ = function (node) {
    this.evaluateNode(node.a);
    this.addInstruction(node.line, 'RTRIM$');
};

Parser.prototype.evaluateTRIM$ = function (node) {
    this.evaluateNode(node.a);
    this.addInstruction(node.line, 'TRIM$');
};

Parser.prototype.evaluateDATE$ = function (node) {
    this.addInstruction(node.line, 'DATE$');
};

Parser.prototype.evaluateTIME$ = function (node) {
    this.addInstruction(node.line, 'TIME$');
};

Parser.prototype.evaluateTOKEN$ = function (node) {
    this.splitStringAssignment(node, true);
};

Parser.prototype.evaluateSPLIT$ = function (node) {
    this.splitStringAssignment(node, false);
};

Parser.prototype.evaluateHEX$ = function (node) {
    this.evaluateNode(node.a);
    this.addInstruction(node.line, 'HEX$');
};

Parser.prototype.evaluateBIN$ = function (node) {
    this.evaluateNode(node.a);
    this.addInstruction(node.line, 'BIN$');
};

