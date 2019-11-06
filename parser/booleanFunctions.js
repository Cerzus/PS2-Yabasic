'use strict';

/////////////////
// EVALUATIONS //
/////////////////

Parser.prototype.evaluateGLOB = function (node) {
    this.evaluateNode(node.a);
    this.evaluateNode(node.b);
    this.addInstruction(node.line, 'GLOB');
};

