'use strict';

/////////////////
// EVALUATIONS //
/////////////////

Parser.prototype.evaluatePOKE_STREAM_STATEMENT = function (node) {
    this.evaluateNode(node.stream);
    this.evaluateNode(node.value);
    this.addInstruction(node.line, 'POKE_STREAM');
};

Parser.prototype.evaluatePEEK_STREAM = function (node) {
    this.evaluateNode(node.stream);
    this.addInstruction(node.line, 'PEEK_STREAM');
};

Parser.prototype.evaluateCLOSE_STATEMENT = function (node) {
    this.evaluateNode(node.stream);
    this.addInstruction(node.line, 'CLOSE');
};

Parser.prototype.evaluateEOF = function (node) {
    this.evaluateNode(node.stream);
    this.addInstruction(node.line, 'EOF');
};

Parser.prototype.evaluateTELL = function (node) {
    this.evaluateNode(node.stream);
    this.addInstruction(node.line, 'TELL');
};

Parser.prototype.evaluateSEEK_STATEMENT = function (node) {
    this.evaluateNode(node.stream);
    this.evaluateNode(node.position);
    if (node.mode !== null) {
        this.evaluateNode(node.mode);
    }
    this.addInstruction(node.line, 'SEEK', node.mode !== null);
};

Parser.prototype.evaluateSEEK_BOOLEAN = function (node) {
    this.evaluateNode(node.stream);
    this.evaluateNode(node.position);
    if (node.mode !== null) {
        this.evaluateNode(node.mode);
    }
    this.addInstruction(node.line, 'SEEK_BOOLEAN', node.mode !== null);
};

Parser.prototype.evaluateOPEN_STATEMENT = function (node) {
    this.evaluateNode(node.stream);
    if (node.printer === true) {
        this.addInstruction(node.line, 'OPEN_PRINTER');
    } else {
        this.evaluateNode(node.file);
        if (node.mode !== null) {
            this.evaluateNode(node.mode);
            this.addInstruction(node.line, 'OPEN_FILE_MODE');
        } else {
            this.addInstruction(node.line, 'OPEN_FILE');
        }
    }
};

Parser.prototype.evaluateOPEN_PRINTER = function (node) {
    this.addInstruction(node.line, 'OPEN_PRINTER_NUMBER');
};

Parser.prototype.evaluateOPEN = function (node) {
    this.evaluateNode(node.file);
    if (node.mode !== null) {
        this.evaluateNode(node.mode);
        this.addInstruction(node.line, 'OPEN_FILE_MODE_NUMBER');
    } else {
        this.addInstruction(node.line, 'OPEN_FILE_NUMBER');
    }
};

Parser.prototype.evaluateOPEN_BOOLEAN = function (node) {
    this.evaluateNode(node.stream);
    if (node.printer === true) {
        this.addInstruction(node.line, 'OPEN_PRINTER_BOOLEAN');
    } else {
        this.evaluateNode(node.file);
        if (node.mode !== null) {
            this.evaluateNode(node.mode);
            this.addInstruction(node.line, 'OPEN_FILE_MODE_BOOLEAN');
        } else {
            this.addInstruction(node.line, 'OPEN_FILE_BOOLEAN');
        }
    }
};

