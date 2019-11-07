'use strict';

/////////////////
// EVALUATIONS //
/////////////////

Parser.prototype.evaluatePROGRAM = function (node) {
    this.evaluateNodeArray(node.body);
};

Parser.prototype.evaluateON_INTERRUPT_STATEMENT = function (node) {
    //
};

Parser.prototype.evaluateDOC_STATEMENT = function (node) {
    if (node.comment !== null) {
        this.documentation.push(this.asciiEncodeString(node.comment));
    } else {
        this.isStuck = true;
    }
};

Parser.prototype.evaluateIMPORT_STATEMENT = function (node) {
    this.isStuck = true;
};

Parser.prototype.evaluateCOMPILE_STATEMENT = function (node) {
    this.evaluateNode(node.source);
    this.addInstruction(node.line, 'COMPILE');
};

Parser.prototype.evaluateGETBIT$ = function (node) {
    this.evaluateNode(node.x1);
    this.evaluateNode(node.y1);
    this.evaluateNode(node.x2);
    this.evaluateNode(node.y2);
    this.addInstruction(node.line, 'GETBIT$');
};

Parser.prototype.evaluatePUTBIT_STATEMENT = function (node) {
    this.evaluateNode(node.string);
    this.evaluateNode(node.x);
    this.evaluateNode(node.y);
    if (node.mode !== null) {
        this.evaluateNode(node.mode);
    }
    this.addInstruction(node.line, 'PUTBIT');
};

Parser.prototype.evaluateGETSCREEN$ = function (node) {
    this.evaluateNode(node.x1);
    this.evaluateNode(node.y1);
    this.evaluateNode(node.x2);
    this.evaluateNode(node.y2);
    this.addInstruction(node.line, 'GETSCREEN$');
};

Parser.prototype.evaluatePUTSCREEN_STATEMENT = function (node) {
    this.evaluateNode(node.string);
    this.evaluateNode(node.x);
    this.evaluateNode(node.y);
    this.addInstruction(node.line, 'PUTSCREEN');
};

Parser.prototype.evaluateERROR_STATEMENT = function (node) {
    this.evaluateNode(node.error);
    this.addInstruction(node.line, 'ERROR');
};

Parser.prototype.evaluateERROR_STATEMENT = function (node) {
    this.evaluateNode(node.error);
    this.addInstruction(node.line, 'ERROR');
};

Parser.prototype.evaluatePEEK$ = function (node) {
    this.evaluateNode(node.a);
    if (node.b !== null) {
        this.evaluateNode(node.b);
        this.addInstruction(node.line, 'PEEK$_2');
    } else {
        this.addInstruction(node.line, 'PEEK$_1');
    }
};

Parser.prototype.evaluatePEEK = function (node) {
    this.evaluateNode(node.a);
    this.addInstruction(node.line, 'PEEK');
};

Parser.prototype.evaluatePOKE_STATEMENT = function (node) {
    this.evaluateNode(node.internal);
    this.evaluateNode(node.value);
    this.addInstruction(node.line, 'POKE');
};

Parser.prototype.evaluateWAIT_STATEMENT = function (node) {
    this.evaluateNode(node.seconds);
    this.addInstruction(node.line, 'WAIT');
};

Parser.prototype.evaluateNUMERIC_FUNCTION_OR_ARRAY = function (node, isUsedAsArgument) {
    this.evaluateArgumentNodes(node.arguments);
    this.addInstruction(node.line, 'CALL_FUNCTION_OR_ARRAY', node.name, node.arguments.length, isUsedAsArgument);
};

Parser.prototype.evaluateSTRING_FUNCTION_OR_ARRAY = function (node, isUsedAsArgument) {
    this.evaluateArgumentNodes(node.arguments);
    this.addInstruction(node.line, 'CALL_FUNCTION_OR_ARRAY', node.name, node.arguments.length, isUsedAsArgument);
};

Parser.prototype.evaluateARRAY_DIMENSIONS_STATEMENT = function (node) {
    for (let array of node.arrays) {
        this.evaluateArgumentNodes(array.dimensions);
        this.addInstruction(node.line, 'DIM', array.name, array.dimensions.length);
    }
};

Parser.prototype.evaluateASSIGNMENT_STATEMENT = function (node) {
    switch (node.left.type) {
        case 'STRING_VARIABLE':
            this.evaluateNode(node.right);
            this.addInstruction(node.left.line, 'STORE_STRING_VARIABLE', this.stringVariable(node.left.name));
            break;
        case 'NUMERIC_VARIABLE':
        case 'NUMPARAMS':
            this.evaluateNode(node.right);
            this.addInstruction(node.left.line, 'STORE_NUMERIC_VARIABLE', this.numericVariable(node.left.name));
            break;
        case 'STRING_FUNCTION_OR_ARRAY':
        case 'NUMERIC_FUNCTION_OR_ARRAY':
            this.evaluateArgumentNodes(node.left.arguments);
            this.evaluateNode(node.right);
            this.addInstruction(node.left.line, 'STORE_ARRAY_ELEMENT', node.left.name, node.left.arguments.length);
            break;
    }
};

Parser.prototype.evaluateDATA_STATEMENT = function (node) {
    this.data = this.data.concat(node.data.map(node => {
        if (node.type === 'STRING_LITERAL') {
            return { value: this.asciiEncodeString(this.escapeString(node.value)), type: 'String' };
        } else {
            return { value: node.value, type: 'Number' };
        }
    }));
};

Parser.prototype.evaluateREAD_STATEMENT = function (node) {
    for (let variable of node.variables) {

        switch (variable.type) {
            case 'STRING_VARIABLE':
                this.addInstruction(variable.line, 'READ', 'String');
                this.addInstruction(variable.line, 'STORE_STRING_VARIABLE', this.stringVariable(variable.name));
                break;
            case 'NUMERIC_VARIABLE':
            case 'NUMPARAMS':
                this.addInstruction(variable.line, 'READ', 'Number');
                this.addInstruction(variable.line, 'STORE_NUMERIC_VARIABLE', this.numericVariable(variable.name));
                break;
            case 'STRING_FUNCTION_OR_ARRAY':
            case 'NUMERIC_FUNCTION_OR_ARRAY':
                this.evaluateArgumentNodes(variable.arguments);
                this.addInstruction(variable.line, 'READ', variable.name.endsWith('$') ? 'String' : 'Number');
                this.addInstruction(variable.line, 'STORE_ARRAY_ELEMENT', variable.name, variable.arguments.length);
                break;
        }
    }
};

Parser.prototype.evaluateRESTORE_STATEMENT = function (node) {
    this.addInstruction(node.line, 'RESTORE', node.label);
};

Parser.prototype.evaluateBELL_STATEMENT = function (node) {
    this.addInstruction(node.line, 'BELL');
};

