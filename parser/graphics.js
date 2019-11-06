'use strict';

/////////////////
// EVALUATIONS //
/////////////////

Parser.prototype.evaluateOPEN_WINDOW_STATEMENT = function (node) {
    this.evaluateNode(node.width);
    this.evaluateNode(node.height);
    if (node.font !== null) {
        this.evaluateNode(node.font);
    }
    this.addInstruction(node.line, 'OPEN_WINDOW', node.font !== null);
};

Parser.prototype.evaluateWINDOW_ORIGIN_STATEMENT = function (node) {
    this.evaluateNode(node.origin);
    this.addInstruction(node.line, 'WINDOW_ORIGIN');
};

Parser.prototype.evaluateDOT_STATEMENT = function (node) {
    this.evaluateNode(node.x);
    this.evaluateNode(node.y);
    this.addInstruction(node.line, 'DOT', node.clear);
};

Parser.prototype.evaluateLINE_STATEMENT = function (node) {
    this.evaluateNode(node.x1);
    this.evaluateNode(node.y1);
    this.evaluateNode(node.x2);
    this.evaluateNode(node.y2);
    this.addInstruction(node.line, 'LINE', node.clear);
};

Parser.prototype.evaluateLINE_TO_STATEMENT = function (node) {
    this.evaluateNode(node.x);
    this.evaluateNode(node.y);
    this.addInstruction(node.line, 'LINE_TO', node.clear);
};

Parser.prototype.evaluateSETRGB_STATEMENT = function (node) {
    this.evaluateNode(node.n);
    this.evaluateNode(node.r);
    this.evaluateNode(node.g);
    this.evaluateNode(node.b);
    this.addInstruction(node.line, 'SETRGB');
};

Parser.prototype.evaluateSETDRAWBUF_STATEMENT = function (node) {
    this.evaluateNode(node.buffer);
    this.addInstruction(node.line, 'SETDRAWBUF');
};

Parser.prototype.evaluateSETDISPBUF_STATEMENT = function (node) {
    this.evaluateNode(node.buffer);
    this.addInstruction(node.line, 'SETDISPBUF');
};

Parser.prototype.evaluateTRIANGLE_STATEMENT = function (node) {
    this.evaluateNode(node.x1);
    this.evaluateNode(node.y1);
    this.evaluateNode(node.x2);
    this.evaluateNode(node.y2);
    this.evaluateNode(node.x3);
    this.evaluateNode(node.y3);
    this.addInstruction(node.line, 'TRIANGLE', node.clear, node.fill);
};

Parser.prototype.evaluateGTRIANGLE_STATEMENT = function (node) {
    this.evaluateNode(node.x1);
    this.evaluateNode(node.y1);
    this.evaluateNode(node.x2);
    this.evaluateNode(node.y2);
    this.evaluateNode(node.x3);
    this.evaluateNode(node.y3);
    this.addInstruction(node.line, 'GTRIANGLE');
};

Parser.prototype.evaluateNEW_CURVE_STATEMENT = function (node) {
    this.addInstruction(node.line, 'NEW_CURVE');
};

Parser.prototype.evaluateCIRCLE_STATEMENT = function (node) {
    this.evaluateNode(node.x);
    this.evaluateNode(node.y);
    this.evaluateNode(node.radius);
    this.addInstruction(node.line, 'CIRCLE', node.clear, node.fill);
};

Parser.prototype.evaluateTEXT_STATEMENT = function (node) {
    this.evaluateNode(node.x);
    this.evaluateNode(node.y);
    this.evaluateNode(node.text);
    if (node.alignment !== null) {
        this.evaluateNode(node.alignment);
    }
    this.addInstruction(node.line, 'TEXT', node.alignment !== null);
};

Parser.prototype.evaluateRECTANGLE_STATEMENT = function (node) {
    this.evaluateNode(node.x1);
    this.evaluateNode(node.y1);
    this.evaluateNode(node.x2);
    this.evaluateNode(node.y2);
    this.addInstruction(node.line, 'RECTANGLE', node.clear, node.fill);
};

Parser.prototype.evaluateCLOSE_WINDOW_STATEMENT = function (node) {
    this.addInstruction(node.line, 'CLOSE_WINDOW');
};

Parser.prototype.evaluateCLEAR_WINDOW_STATEMENT = function (node) {
    this.addInstruction(node.line, 'CLEAR_WINDOW');
};

