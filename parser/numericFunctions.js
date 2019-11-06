'use strict';

/////////////////
// EVALUATIONS //
/////////////////

Parser.prototype.evaluateSIN = function (node) {
    this.evaluateNode(node.a);
    this.addInstruction(node.line, 'SIN');
};

Parser.prototype.evaluateASIN = function (node) {
    this.evaluateNode(node.a);
    this.addInstruction(node.line, 'ASIN');
};

Parser.prototype.evaluateCOS = function (node) {
    this.evaluateNode(node.a);
    this.addInstruction(node.line, 'COS');
};

Parser.prototype.evaluateACOS = function (node) {
    this.evaluateNode(node.a);
    this.addInstruction(node.line, 'ACOS');
};

Parser.prototype.evaluateTAN = function (node) {
    this.evaluateNode(node.a);
    this.addInstruction(node.line, 'TAN');
};

Parser.prototype.evaluateATAN = function (node) {
    this.evaluateNode(node.a);
    if (node.b !== null) {
        this.evaluateNode(node.b);
        this.addInstruction(node.line, 'ATAN_2');
    } else {
        this.addInstruction(node.line, 'ATAN_1');
    }
};

Parser.prototype.evaluateEXP = function (node) {
    this.evaluateNode(node.a);
    this.addInstruction(node.line, 'EXP');
};

Parser.prototype.evaluateLOG = function (node) {
    this.evaluateNode(node.a);
    this.addInstruction(node.line, 'LOG');
};

Parser.prototype.evaluateSQRT = function (node) {
    this.evaluateNode(node.a);
    this.addInstruction(node.line, 'SQRT');
};

Parser.prototype.evaluateSQR = function (node) {
    this.evaluateNode(node.a);
    this.addInstruction(node.line, 'SQR');
};

Parser.prototype.evaluateINT = function (node) {
    this.evaluateNode(node.a);
    this.addInstruction(node.line, 'INT');
};

Parser.prototype.evaluateFRAC = function (node) {
    this.evaluateNode(node.a);
    this.addInstruction(node.line, 'FRAC');
};

Parser.prototype.evaluateABS = function (node) {
    this.evaluateNode(node.a);
    this.addInstruction(node.line, 'ABS');
};

Parser.prototype.evaluateSIG = function (node) {
    this.evaluateNode(node.a);
    this.addInstruction(node.line, 'SIG');
};

Parser.prototype.evaluateMOD = function (node) {
    this.evaluateNode(node.a);
    this.evaluateNode(node.b);
    this.addInstruction(node.line, 'MOD');
};

Parser.prototype.evaluateMIN = function (node) {
    this.evaluateNode(node.a);
    this.evaluateNode(node.b);
    this.addInstruction(node.line, 'MIN');
};

Parser.prototype.evaluateMAX = function (node) {
    this.evaluateNode(node.a);
    this.evaluateNode(node.b);
    this.addInstruction(node.line, 'MAX');
};

Parser.prototype.evaluateLEN = function (node) {
    this.evaluateNode(node.a);
    this.addInstruction(node.line, 'LEN');
};

Parser.prototype.evaluateVAL = function (node) {
    this.evaluateNode(node.a);
    this.addInstruction(node.line, 'VAL');
};

Parser.prototype.evaluateASC = function (node) {
    this.evaluateNode(node.a);
    this.addInstruction(node.line, 'ASC');
};

Parser.prototype.evaluateDEC = function (node) {
    this.evaluateNode(node.a);
    if (node.b !== null) {
        this.evaluateNode(node.b);
    }
    this.addInstruction(node.line, 'DEC', node.b !== null);
};

Parser.prototype.evaluateINSTR = function (node) {
    this.evaluateNode(node.a);
    this.evaluateNode(node.b);
    if (node.c !== null) {
        this.evaluateNode(node.c);
        this.addInstruction(node.line, 'INSTR_3');
    } else {
        this.addInstruction(node.line, 'INSTR_2');
    }
};

Parser.prototype.evaluateRINSTR = function (node) {
    this.evaluateNode(node.a);
    this.evaluateNode(node.b);
    if (node.c !== null) {
        this.evaluateNode(node.c);
        this.addInstruction(node.line, 'RINSTR_3');
    } else {
        this.addInstruction(node.line, 'RINSTR_2');
    }
};

Parser.prototype.evaluateMOUSEX = function (node) {
    if (node.inkey !== null) {
        this.evaluateNode(node.inkey);
        this.addInstruction(node.line, 'MOUSEX_1');
    } else {
        this.addInstruction(node.line, 'MOUSEX_0');
    }
};

Parser.prototype.evaluateMOUSEY = function (node) {
    if (node.inkey !== null) {
        this.evaluateNode(node.inkey);
        this.addInstruction(node.line, 'MOUSEY_1');
    } else {
        this.addInstruction(node.line, 'MOUSEY_0');
    }
};

Parser.prototype.evaluateMOUSEB = function (node) {
    if (node.inkey !== null) {
        this.evaluateNode(node.inkey);
        this.addInstruction(node.line, 'MOUSEB_1');
    } else {
        this.addInstruction(node.line, 'MOUSEB_0');
    }
};

Parser.prototype.evaluateMOUSEMOD = function (node) {
    if (node.inkey !== null) {
        this.evaluateNode(node.inkey);
        this.addInstruction(node.line, 'MOUSEMOD_1');
    } else {
        this.addInstruction(node.line, 'MOUSEMOD_0');
    }
};

Parser.prototype.evaluateAND = function (node) {
    this.evaluateNode(node.a);
    this.evaluateNode(node.b);
    this.addInstruction(node.line, 'AND');
};

Parser.prototype.evaluateOR = function (node) {
    this.evaluateNode(node.a);
    this.evaluateNode(node.b);
    this.addInstruction(node.line, 'OR');
};

Parser.prototype.evaluateEOR = function (node) {
    this.evaluateNode(node.a);
    this.evaluateNode(node.b);
    this.addInstruction(node.line, 'EOR');
};

Parser.prototype.evaluateTOKEN = function (node) {
    this.evaluateNode(node.a);
    this.evaluateNode(node.b);
    if (node.c !== null) {
        this.evaluateNode(node.c);
        this.addInstruction(node.line, 'SPLIT', true, true);
    } else {
        this.addInstruction(node.line, 'SPLIT', false, true);
    }
};

Parser.prototype.evaluateSPLIT = function (node) {
    this.evaluateNode(node.a);
    this.evaluateNode(node.b);
    this.evaluateNode(node.c);
    this.addInstruction(node.line, 'SPLIT', true, false);
};

Parser.prototype.evaluateARDIM = function (node) {
    this.evaluateNode(node.a);
    this.addInstruction(node.line, 'ARDIM');
};

Parser.prototype.evaluateARSIZE = function (node) {
    this.evaluateNode(node.a);
    this.evaluateNode(node.b);
    this.addInstruction(node.line, 'ARSIZE');
};

Parser.prototype.evaluateRAN = function (node) {
    if (node.a !== null) {
        this.evaluateNode(node.a);
        this.addInstruction(node.line, 'RAN_1');
    } else {
        this.addInstruction(node.line, 'RAN_0');
    }
};
