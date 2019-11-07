{
    let isInsideFunction = null;
    let numberedLineAllowed = true;

    function extractOptional(optional, index) {
        return optional ? optional[index] : null;
    }

    function extractList(list, index) {
        return list.map(function (element) { return element[index]; });
    }

    function buildList(head, tail, index) {
        return [head].concat(extractList(tail, index));
    }

    function buildNumericBinaryExpression(head, tail) {
        return tail.reduce(function (result, element) {
            return createNode({
                type: "NUMERIC_BINARY_EXPRESSION",
                left: result,
                operator: element[1],
                right: element[3],
            });
        }, head);
    }

    function buildStringBinaryExpression(head, tail) {
        return tail.reduce(function (result, element) {
            return createNode({
                type: "STRING_BINARY_EXPRESSION",
                left: result,
                operator: element[1],
                right: element[3],
            });
        }, head);
    }

    function buildLogicalExpression(head, tail) {
        return tail.reduce(function (result, element) {
            return createNode({
                type: "LOGICAL_EXPRESSION",
                left: result,
                operator: element[1],
                right: element[3],
            });
        }, head);
    }

    function createImportStatement(library) {
        library = library.match(/^[A-Za-z0-9_]{0,200}/)[0];

        if (library.length > 0) {
            error(["CouldntOpenLibrary", library]);
        }

        return { type: "IMPORT_STATEMENT" };
    }

    function createLabelledStatement(label, statement) {
        const internalLabel = isInsideFunction ? isInsideFunction + "/" + label : label;

        if (options.internalLabels.indexOf(internalLabel) >= 0) {
            error(["Duplicate", "label", label]);
        }

        options.internalLabels.push(internalLabel);

        return createNode({ type: "LABELLED_STATEMENT", label: internalLabel, statement });
    }

    function createSubroutineStatement(name, parameters, body) {
        if (options.subroutineNames.indexOf(name) >= 0) {
            error(["Duplicate", "subroutine", name]);
        }

        options.subroutineNames.push(name);

        return createNode({ type: "SUBROUTINE_STATEMENT", name, parameters, body });
    }

    function addFunctionOrArrayNameToSymbolTable(name) {
        if (name.endsWith('$')) {
            if (options.symbolTable.stringFunctionsAndArrays.indexOf(name) < 0) {
                options.symbolTable.stringFunctionsAndArrays.push(name);
            }
        } else {
            if (options.symbolTable.numericFunctionsAndArrays.indexOf(name) < 0) {
                options.symbolTable.numericFunctionsAndArrays.push(name);
            }
        }
        return name;
    }

    function optionalList(value) {
        return value !== null ? value : [];
    }

    function createNode(node) {
        return { ...node, line: location().start.line };
    }
}

Start
    = (CommentedLine __)? body:SourceElements (Comment EOF)?
        { return createNode({ type: "PROGRAM", body }); }
        
SourceElements
    = _ __* body:(StatementList _ __*)?
        { return optionalList(extractOptional(body, 0)); }

StatementList
    = head:Statement tail:(__+ Statement)*
        { return buildList(head, tail, 1); }

// Skipped

_ "whitespace"
    = WhiteSpace*

__ "end of line"
    = _ (Comment _)? ("\n" CommentedLine)+ "\n" _
        { numberedLineAllowed = true; }
    / _ (Comment _)? "\n" _
        { numberedLineAllowed = true; }
    / _ (Comment _)? (":" _ !UnsignedInteger) _

EOF
    = !.

// ----- A.1 Lexical Grammar -----

SourceCharacter
    = [^\n]

WhiteSpace "whitespace"
    = [ \t\f\r\v]

LineTerminator "end of line"
    = "\n"
    / ":"

Comment "comment"
    = RemToken (WhiteSpace SourceCharacter*)?

CommentedLine
    = ("#" / "'") SourceCharacter*

StringScalarOrArray
    = name:StringNonArrayIdentifier _ index:Arguments
        { return createNode({ type: "STRING_ARRAY_MUTATOR", array: addFunctionOrArrayNameToSymbolTable(name), index }); }
    / StringVariable

ArrayIdentifier
    = StringArrayIdentifier
    / NumericArrayIdentifier

NonArrayIdentifier
    = StringNonArrayIdentifier
    / NumericNonArrayIdentifier

Variable
    = StringVariable
    / NumericVariable

_Array
    = StringArray
    / NumericArray

StringArray
    = name:StringArrayIdentifier
        { return createNode({ type: "STRING_ARRAY", name: addFunctionOrArrayNameToSymbolTable(name) }); }

NumericArray
    = name:NumericArrayIdentifier
        { return createNode({ type: "NUMERIC_ARRAY", name: addFunctionOrArrayNameToSymbolTable(name) }); }

StringArrayIdentifier
    = id:StringNonArrayIdentifier _ "(" _ ")" { return id; }

NumericArrayIdentifier
    = id:NumericNonArrayIdentifier _ "(" _ ")" { return id; }

NumericVariable
    = name:NumericNonArrayIdentifier
        {
            if (options.symbolTable.numericVariables.indexOf(name) < 0) {
                options.symbolTable.numericVariables.push(name);
            }
            return createNode({ type: "NUMERIC_VARIABLE", name }); 
        }

StringVariable
    = name:StringNonArrayIdentifier
        {
            if (options.symbolTable.stringVariables.indexOf(name) < 0) {
                options.symbolTable.stringVariables.push(name);
            }
            return createNode({ type: "STRING_VARIABLE", name });
        }
        
NumericNonArrayIdentifier
    = !ReservedWord id:IdentifierName { return id; }

StringNonArrayIdentifier
    = !ReservedWord$ id:$(IdentifierName "$") { return id; }

IdentifierName "identifier"
    = $(IdentifierStart IdentifierPart* ("." IdentifierStart IdentifierPart*)?)

IdentifierStart
    = [A-Za-z_]

IdentifierPart
    = [A-Za-z0-9_]

ReservedWord
    = ImportToken
    / RemToken
    / DocumentationToken
    / &{ return options.version >= 2.65; } CompileToken
    / &{ return options.version >= 2.65; } ExecuteToken
    / EndsubToken
    / EndifToken
    / ExportToken
    / ErrorToken
    / ForToken
    / ToToken
    / StepToken
    / NextToken
    / WhileToken
    / WendToken
    / RepeatToken
    / UntilToken
    / GotoToken
    / GosubToken
    / SubToken
    / LocalToken
    / StaticToken
    / OnToken
    / InterruptToken
    / BreakToken
    / ContinueToken
    / LabelToken
    / IfToken
    / ThenToken
    / ElsifToken
    / ElseToken
    / OpenToken
    / CloseToken
    / SeekToken
    / TellToken
    / PrintToken
    / UsingToken
    / ReverseToken
    / ColourToken
    / InputToken
    / ReturnToken
    / DimToken
    / EndToken
    / ExitToken
    / ReadToken
    / DataToken
    / RestoreToken
    / AndToken
    / OrToken
    / NotToken
    / EorToken
    / WindowToken
    / OriginToken
    / PrinterToken
    / DotToken
    / LineToken
    / CurveToken
    / CircleToken
    / ClearToken
    / FillToken
    / TextToken
    / FrameToken
    / RectToken
    / PutbitToken
    / PutscreenToken
    / NewToken
    / WaitToken
    / BellToken
    / LetToken
    / ArdimToken
    / ArsizeToken
    / SinToken
    / AsinToken
    / CosToken
    / AcosToken
    / TanToken
    / AtanToken
    / ExpToken
    / LogToken
    / SqrtToken
    / SqrToken
    / IntToken
    / FracToken
    / AbsToken
    / SigToken
    / ModToken
    / RanToken
    / MinToken
    / MaxToken
    / InstrToken
    / &{ return options.version >= 2.66; } RinstrToken
    / LenToken
    / ValToken
    / EofToken
    / MousexToken
    / MouseyToken
    / MousebToken
    / MousemodToken
    / AscToken
    / DecToken
    / AtToken
    / ScreenToken
    / SystemToken
    / PeekToken
    / PokeToken
    / TokenToken
    / SplitToken
    / GlobToken
    / TriangleToken
    / GtriangleToken
    / SetrgbToken
    / SetdrawbufToken
    / SetdispbufToken

ReservedWord$
    = &{ return options.version >= 2.65; } Execute$Token
    / Getbit$Token
    / Getscreen$Token
    / Left$Token
    / Right$Token
    / Mid$Token
    / Lower$Token
    / Upper$Token
    / Ltrim$Token
    / Rtrim$Token
    / Trim$Token
    / Str$Token
    / Inkey$Token
    / Chr$Token
    / Hex$Token
    / &{ return options.version >= 2.66; } Bin$Token
    / System$Token
    / Date$Token
    / Time$Token
    / Peek$Token
    / Token$Token
    / Split$Token

NumericLiteral
    = negate:"-"? float:UnsignedFloat
        { return createNode({ type: "NUMERIC_LITERAL", value: negate ? -float : float }); }

UnsignedFloat
    = DecimalDigit+ ("." DecimalDigit*)? ExponentPart?
        { return parseFloat(text()); }
    / "." UnsignedInteger ExponentPart?
        { return parseFloat(text()); }
    / "." ExponentPart
        { return 0; }

UnsignedInteger
    = $DecimalDigit+

DecimalDigit
    = [0-9]

ExponentPart
    = "e"i[+-]? UnsignedInteger
    
StringLiteral
    = '"' chars:$(("\\".) / ([^"]))* '"'
        { return createNode({ type: "STRING_LITERAL", value: chars }); }

ImportToken = "import"i !IdentifierPart
RemToken = "rem"i !IdentifierPart
DocumentationToken = "doc"i ("u"i "mentation"i?)? !IdentifierPart

CompileToken = "compile"i !IdentifierPart
ExecuteToken = "execute"i !IdentifierPart
Execute$Token = "execute$"i !IdentifierPart
EndsubToken = "end"i WhiteSpace+ "sub"i !IdentifierPart
EndifToken = "endif"i !IdentifierPart
    / "end-if"i !IdentifierPart
    / "fi"i !IdentifierPart
    / "end"i WhiteSpace+ "if"i !IdentifierPart
ExportToken = "export"i !IdentifierPart
ErrorToken = "error"i !IdentifierPart
ForToken = "for"i !IdentifierPart { numberedLineAllowed = false; }
ToToken = "to"i !IdentifierPart
StepToken = "step"i !IdentifierPart
NextToken = "next"i !IdentifierPart
WhileToken = "while"i !IdentifierPart
WendToken = "end-while"i !IdentifierPart
    / "wend"i !IdentifierPart
    / "end"i WhiteSpace+ "while"i !IdentifierPart
RepeatToken = "repeat"i !IdentifierPart { numberedLineAllowed = false; }
UntilToken = "until"i !IdentifierPart
GotoToken = "goto"i !IdentifierPart
GosubToken = "gosub"i !IdentifierPart
SubToken = ("sub"i / "subroutine"i) !IdentifierPart { numberedLineAllowed = false; }
LocalToken = "local"i !IdentifierPart { if (!isInsideFunction) error(["NoUseForLocalOutsideFunctions"]); }
StaticToken = "static"i !IdentifierPart { if (!isInsideFunction) error(["NoUseForStaticOutsideFunctions"]); }
OnToken = "on"i !IdentifierPart
InterruptToken = "interrupt"i !IdentifierPart
BreakToken = "break"i !IdentifierPart
ContinueToken = "continue"i !IdentifierPart
LabelToken = "label"i !IdentifierPart
IfToken = "if"i !IdentifierPart { numberedLineAllowed = false; }
ThenToken = "then"i !IdentifierPart
ElsifToken = ("elsif"i / "elseif"i) !IdentifierPart
ElseToken = "else"i !IdentifierPart
OpenToken = "open"i !IdentifierPart
CloseToken = "close"i !IdentifierPart
SeekToken = "seek"i !IdentifierPart
TellToken = "tell"i !IdentifierPart
PrintToken = "print"i !IdentifierPart
    / "?"
UsingToken = "using"i !IdentifierPart
ReverseToken = "reverse"i !IdentifierPart
ColourToken = ("colour"i / "color"i) !IdentifierPart
InputToken = "input"i !IdentifierPart
ReturnToken = "return"i !IdentifierPart
DimToken = ("dim"i / "redim"i) !IdentifierPart
EndToken = "end"i !(IdentifierPart / "-if"i / "-while"i / (WhiteSpace+ ("sub"i / "if"i / "while"i)))
ExitToken = "exit"i !IdentifierPart
ReadToken = "read"i !IdentifierPart
DataToken = "data"i !IdentifierPart
RestoreToken = "restore"i !IdentifierPart
AndToken = "and"i !IdentifierPart
OrToken = "or"i !IdentifierPart
NotToken = "not"i !IdentifierPart
    / "!"
EorToken = ("eor"i / "xor"i) !IdentifierPart
WindowToken = "window"i !IdentifierPart
OriginToken = "origin"i !IdentifierPart
PrinterToken = "printer"i !IdentifierPart
DotToken = "dot"i !IdentifierPart
LineToken = "line"i !IdentifierPart
CurveToken = "curve"i !IdentifierPart
CircleToken = "circle"i !IdentifierPart
ClearToken = "clear"i !IdentifierPart
FillToken = "fill"i "ed"i ? !IdentifierPart
TextToken = "text"i !IdentifierPart
FrameToken = "frame"i !IdentifierPart
RectToken = (("rect"i "angle"i?) / "box"i) !IdentifierPart
PutbitToken = ("bitblit"i / "bitblt"i / "putbit"i) !IdentifierPart
Getbit$Token = ("bitblit$"i / "bitblt$"i / "getbit$"i) !IdentifierPart
PutscreenToken = "putscreen"i !IdentifierPart
Getscreen$Token = "getscreen$"i !IdentifierPart
NewToken = "new"i !IdentifierPart
WaitToken = ("wait"i / "pause"i) !IdentifierPart
BellToken = ("bell"i / "beep"i) !IdentifierPart
LetToken = "let"i !IdentifierPart
ArdimToken = "arraydim"i "ension"i? !IdentifierPart
ArsizeToken = "arraysize"i !IdentifierPart

SinToken = "sin"i !IdentifierPart
AsinToken = "asin"i !IdentifierPart
CosToken = "cos"i !IdentifierPart
AcosToken = "acos"i !IdentifierPart
TanToken = "tan"i !IdentifierPart
AtanToken = "atan"i !IdentifierPart
ExpToken = "exp"i !IdentifierPart
LogToken = "log"i !IdentifierPart
SqrtToken = "sqrt"i !IdentifierPart
SqrToken = "sqr"i !IdentifierPart
IntToken = "int"i !IdentifierPart
FracToken = "frac"i !IdentifierPart
AbsToken = "abs"i !IdentifierPart
SigToken = "sig"i !IdentifierPart
ModToken = "mod"i !IdentifierPart
RanToken = "ran"i !IdentifierPart
MinToken = "min"i !IdentifierPart
MaxToken = "max"i !IdentifierPart
Left$Token = "left$"i !IdentifierPart
Right$Token = "right$"i !IdentifierPart
Mid$Token = "mid$"i !IdentifierPart
Lower$Token = "lower$"i !IdentifierPart
Upper$Token = "upper$"i !IdentifierPart
Ltrim$Token = "ltrim$"i !IdentifierPart
Rtrim$Token = "rtrim$"i !IdentifierPart
Trim$Token = "trim$"i !IdentifierPart
InstrToken = "instr"i !IdentifierPart
RinstrToken = "rinstr"i !IdentifierPart
LenToken = "len"i !IdentifierPart
ValToken = "val"i !IdentifierPart
EofToken = "eof"i !IdentifierPart
Str$Token = "str$"i !IdentifierPart
Inkey$Token = "inkey$"i !IdentifierPart
MousexToken = "mousex"i !IdentifierPart
MouseyToken = "mousey"i !IdentifierPart
MousebToken = "mouseb"i !IdentifierPart
MousemodToken = "mousemod"i !IdentifierPart
Chr$Token = "chr$"i !IdentifierPart
AscToken = "asc"i !IdentifierPart
Hex$Token = "hex$"i !IdentifierPart
Bin$Token = "bin$"i !IdentifierPart
DecToken = "dec"i !IdentifierPart
AtToken = "at"i !IdentifierPart
    / "@"
ScreenToken = "screen"i !IdentifierPart
System$Token = "system$"i !IdentifierPart
SystemToken = "system"i !IdentifierPart
Date$Token = "date$"i !IdentifierPart
Time$Token = "time$"i !IdentifierPart
PeekToken = "peek"i !IdentifierPart
Peek$Token = "peek$"i !IdentifierPart
PokeToken = "poke"i !IdentifierPart
TokenToken = "token"i !IdentifierPart
Token$Token = "token$"i !IdentifierPart
SplitToken = "split"i !IdentifierPart
Split$Token = "split$"i !IdentifierPart
GlobToken = "glob"i !IdentifierPart

TriangleToken = "triangle"i !IdentifierPart
GtriangleToken = "gtriangle"i !IdentifierPart
SetrgbToken = "setrgb"i !IdentifierPart
SetdrawbufToken = "setdrawbuf"i !IdentifierPart
SetdispbufToken = "setdispbuf"i !IdentifierPart

// ----- A.3 Expressions -----

BuiltInNumericExpression
    = &{ return options.version >= 2.65; } args:ExecuteClause { return createNode({ type: "EXECUTE", arguments: args }); }
    / SinToken _ "(" _ a:NumericExpression _ ")" { return createNode({ type: "SIN", a }); }
    / AsinToken _ "(" _ a:NumericExpression _ ")" { return createNode({ type: "ASIN", a }); }
    / CosToken _ "(" _ a:NumericExpression _ ")" { return createNode({ type: "COS", a }); }
    / AcosToken _ "(" _ a:NumericExpression _ ")" { return createNode({ type: "ACOS", a }); }
    / TanToken _ "(" _ a:NumericExpression _ ")" { return createNode({ type: "TAN", a }); }
    / AtanToken _ "(" _ a:NumericExpression _ b:("," _ NumericExpression _)? ")" { return createNode({ type: "ATAN", a, b: extractOptional(b, 2) }); }
    / ExpToken _ "(" _ a:NumericExpression _ ")" { return createNode({ type: "EXP", a }); }
    / LogToken _ "(" _ a:NumericExpression _ ")" { return createNode({ type: "LOG", a }); }
    / SqrtToken _ "(" _ a:NumericExpression _ ")" { return createNode({ type: "SQRT", a }); }
    / SqrToken _ "(" _ a:NumericExpression _ ")" { return createNode({ type: "SQR", a }); }
    / IntToken _ "(" _ a:NumericExpression _ ")" { return createNode({ type: "INT", a }); }
    / FracToken _ "(" _ a:NumericExpression _ ")" { return createNode({ type: "FRAC", a }); }
    / AbsToken _ "(" _ a:NumericExpression _ ")" { return createNode({ type: "ABS", a }); }
    / SigToken _ "(" _ a:NumericExpression _ ")" { return createNode({ type: "SIG", a }); }
    / ModToken _ "(" _ a:NumericExpression _ "," _ b:NumericExpression _ ")" { return createNode({ type: "MOD", a, b }); }
    / RanToken _ "(" _ a:NumericExpression? _ ")" { return createNode({ type: "RAN", a }); }
    / MinToken _ "(" _ a:NumericExpression _ "," _ b:NumericExpression _ ")" { return createNode({ type: "MIN", a, b }); }
    / MaxToken _ "(" _ a:NumericExpression _ "," _ b:NumericExpression _ ")" { return createNode({ type: "MAX", a, b }); }
    / LenToken _ "(" _ a:StringExpression _ ")" { return createNode({ type: "LEN", a }); }
    / ValToken _ "(" _ a:StringExpression _ ")" { return createNode({ type: "VAL", a }); }
    / AscToken _ "(" _ a:StringExpression _ ")" { return createNode({ type: "ASC", a }); }
    / &{ return options.version >= 2.66; } DecToken _ "(" _ a:StringExpression _ "," _ b:NumericExpression _ ")" { return createNode({ type: "DEC", a, b }); }
    / DecToken _ "(" _ a:StringExpression _ ")" { return createNode({ type: "DEC", a, b: null }); }
    / &{ return options.version >= 2.66; } InstrToken _ "(" _ a:StringExpression _ "," _ b:StringExpression _ "," _ c:NumericExpression _ ")" { return createNode({ type: "INSTR", a, b, c }); }
    / InstrToken _ "(" _ a:StringExpression _ "," _ b:StringExpression _ ")" { return createNode({ type: "INSTR", a, b, c: null }); }
    / &{ return options.version >= 2.66; } RinstrToken _ "(" _ a:StringExpression _ "," _ b:StringExpression _ c:("," _ NumericExpression _)? ")" { return createNode({ type: "RINSTR", a, b, c: extractOptional(c, 2) }); }
    / SystemClause
    / PeekToken _ "(" _ stream:HashedNumber _ ")" { return createNode({ type: "PEEK_STREAM", stream }); }
    / PeekToken _ "(" _ a:StringExpression _ b:("," _ StringExpression _)? ")" { return createNode({ type: "PEEK", a, b }); }
    / MousexToken inkey: (_ "(" _ StringExpression _ ")")? { return createNode({ type: "MOUSEX", inkey: extractOptional(inkey, 3) }); }
    / MouseyToken inkey:(_ "(" _ StringExpression _ ")")? { return createNode({ type: "MOUSEY", inkey: extractOptional(inkey, 3) }); }
    / MousebToken inkey: (_ "(" _ StringExpression _ ")")? { return createNode({ type: "MOUSEB", inkey: extractOptional(inkey, 3) }); }
    / MousemodToken inkey:(_ "(" _ StringExpression _ ")")? { return createNode({ type: "MOUSEMOD", inkey: extractOptional(inkey, 3) }); }
    / OpenToken _ "(" _ PrinterToken _ ")" { return createNode({ type: "OPEN_PRINTER" }); }
    / OpenToken _ "(" _ file:StringExpression _ mode:("," _ StringExpression _)? ")" { return createNode({ type: "OPEN", file, mode: extractOptional(mode, 2) }); }
    / AndToken _ "(" _ a: NumericExpression _ "," _ b:NumericExpression _ ")" { return createNode({ type: "AND", a, b }); }
    / OrToken _ "(" _ a:NumericExpression _ "," _ b:NumericExpression _ ")" { return createNode({ type: "OR", a, b }); }
    / EorToken _ "(" _ a:NumericExpression _ "," _ b:NumericExpression _ ")" { return createNode({ type: "EOR", a, b }); }
    / TellToken _ "(" _ stream:HashedNumber _ ")" { return createNode({ type: "TELL", stream }); }
    / TokenToken _ "(" _ a:StringExpression _ "," _ b:StringArray _ c:("," _ StringExpression _)? ")" { return createNode({ type: "TOKEN", a, b, c: extractOptional(c, 2) }); }
    / SplitToken _ "(" _ a:StringExpression _ "," _ b:StringArray _ "," _ c:StringExpression _ ")" { return createNode({ type: "SPLIT", a, b, c }); }
    / ArdimToken _ "(" _ a:_Array _ ")" { return createNode({ type: "ARDIM", a }); }
    / ArsizeToken _ "(" _ a:_Array _ "," _ b:NumericExpression _ ")" { return createNode({ type: "ARSIZE", a, b }); }

BuiltInStringExpression
    = &{ return options.version >= 2.65; } args:Execute$Clause { return createNode({ type: "EXECUTE$", arguments: args }); }
    / Left$Token _ "(" _ a:StringExpression _ "," _ b:NumericExpression _ ")" { return createNode({ type: "LEFT$", a, b }); }
    / Right$Token _ "(" _ a:StringExpression _ "," _ b:NumericExpression _ ")" { return createNode({ type: "RIGHT$", a, b }); }
    / Mid$Token _ "(" _ a:StringExpression _ "," _ b:NumericExpression _ "," _ c:NumericExpression _ ")" { return createNode({ type: "MID$", a, b, c }); }
    / &{ return options.version >= 2.66; } Mid$Token _ "(" _ a:StringExpression _ "," _ b:NumericExpression _ ")" { return createNode({ type: "MID$", a, b, c: null }); }
    / Str$Token _ "(" _ a:NumericExpression _ b:("," _ StringExpression _)? ")" { return createNode({ type: "STR$", a, b:extractOptional(b, 2) }); }
    / timeout:Inkey$Clause { return createNode({ type: "INKEY$", timeout }); }
    / Chr$Token _ "(" _ a:NumericExpression _ ")" { return createNode({ type: "CHR$", a }); }
    / Upper$Token _ "(" _ a:StringExpression _ ")" { return createNode({ type: "UPPER$", a }); }
    / Lower$Token _ "(" _ a:StringExpression _ ")" { return createNode({ type: "LOWER$", a }); }
    / Ltrim$Token _ "(" _ a:StringExpression _ ")" { return createNode({ type: "LTRIM$", a }); }
    / Rtrim$Token _ "(" _ a:StringExpression _ ")" { return createNode({ type: "RTRIM$", a }); }
    / Trim$Token _ "(" _ a:StringExpression _ ")" { return createNode({ type: "TRIM$", a }); }
    / System$Token _ "(" _ StringExpression _ ")" { error(["FunctionNotImplemented"]); }
    / Date$Token { return createNode({ type: "DATE$" }); }
    / Time$Token { return createNode({ type: "TIME$" }); }
    / Peek$Token _ "(" _ a:StringExpression _ b:("," _ StringExpression _)? ")" { return createNode({ type: "PEEK$", a, b: extractOptional(b, 2) }); }
    / Token$Token _ "(" _ a:StringScalarOrArray _ b:("," _ StringExpression _)? ")" { return createNode({ type: "TOKEN$", a, b: extractOptional(b, 2) }); }
    / Split$Token _ "(" _ a:StringScalarOrArray _ b:("," _ StringExpression _)? ")" { return createNode({ type: "SPLIT$", a, b: extractOptional(b, 2) }); }
    / Getbit$Token _ "(" _ coords:FourCoordinates _ ")" { return createNode({ type: "GETBIT$", ...coords }); }
    / Getscreen$Token _ "(" _ coords:FourCoordinates _ ")" { return createNode({ type: "GETSCREEN$", ...coords }); }
    / Hex$Token _ "(" _ a:NumericExpression _ ")" { return createNode({ type: "HEX$", a }); }
    / &{ return options.version >= 2.66; } Bin$Token _ "(" _ a:NumericExpression _ ")" { return createNode({ type: "BIN$", a }); }

BuiltInBooleanExpression
    = GlobToken _ "(" _ a:StringExpression _ "," _ b:StringExpression _ ")" { return createNode({ type: "GLOB", a, b }); }
    / EofToken _ "(" _ stream:NumericExpression _ ")" { return createNode({ type: "EOF", stream }); }
    / open: OpenClause { return createNode({ type: "OPEN_BOOLEAN", ...open }); }
    / &{ return options.version >= 2.65; } seek: SeekClause { return createNode({ type: "SEEK_BOOLEAN", ...seek }); }

FunctionOrArray
    = StringFunctionOrArray
    / NumericFunctionOrArray

StringFunctionOrArray
    = name:StringNonArrayIdentifier _ args:Arguments
        { return createNode({ type: "STRING_FUNCTION_OR_ARRAY", name: addFunctionOrArrayNameToSymbolTable(name), arguments: args }); }

NumericFunctionOrArray
    = name:NumericNonArrayIdentifier _ args:Arguments
        { return createNode({ type: "NUMERIC_FUNCTION_OR_ARRAY", name: addFunctionOrArrayNameToSymbolTable(name), arguments: args }); }

Arguments
    = "(" _ args:ArgumentList? _ ")"
        { return optionalList(args); }

ArgumentList
    = ("," _)? head:Argument tail:(_ "," _ Argument)*
        { return buildList(head, tail, 3); }

Argument
    = Expression

StringPrimaryExpression
    = BuiltInStringExpression
    / StringFunctionOrArray
    / StringVariable
    / StringLiteral
    / "(" _ expression:StringExpression _ ")"
        { return expression; }

NumericPrimaryExpression
    = BuiltInNumericExpression
    / NumericFunctionOrArray
    / Numparams
    / NumericVariable
    / NumericLiteral
    / ParenthesizedNumericExpression

ParenthesizedNumericExpression
    = "(" _ expression:NumericExpression _ ")" { return expression; }

NumericUnaryExpression
    = NumericPrimaryExpression
    / operator:UnaryOperator _ right:NumericUnaryExpression
        { return createNode({ type: "NUMERIC_UNARY_EXPRESSION", operator, right }); }

UnaryOperator
    = "-"

NumericPowerExpression
    = head:NumericUnaryExpression tail:(_ PowerOperator _ NumericUnaryExpression)*
        { return buildNumericBinaryExpression(head, tail); }

PowerOperator
    = "^"
    / "**"

NumericMultiplicativeExpression
    = head:NumericPowerExpression tail:(_ MultiplicativeOperator _ NumericPowerExpression)*
        { return buildNumericBinaryExpression(head, tail); }

MultiplicativeOperator
    = "*"
    / "/"

NumericAdditiveExpression
    = head:NumericMultiplicativeExpression tail:(_ AdditiveOperator _ NumericMultiplicativeExpression)*
        { return buildNumericBinaryExpression(head, tail); }

StringAdditiveExpression
    = head:StringPrimaryExpression tail:(_ "+" _ StringPrimaryExpression)*
        { return buildStringBinaryExpression(head, tail); }

NumericExpression "numeric expression"
    = NumericAdditiveExpression

StringExpression "string expression"
    = StringAdditiveExpression

Expression
    = StringExpression
    / NumericExpression

AdditiveOperator
    = "+"
    / "-"

NumericComparisonExpression
    = left:NumericExpression _ operator:ComparisonOperator _ right:NumericExpression
        { return createNode({ type: "NUMERIC_COMPARISON_EXPRESSION", left, operator, right }); }

StringComparisonExpression
    = left:StringExpression _ operator:ComparisonOperator _ right:StringExpression
        { return createNode({ type: "STRING_COMPARISON_EXPRESSION", left, operator, right }); }

PrimaryConditionalExpression
    = BuiltInBooleanExpression
    / StringComparisonExpression
    / NumericComparisonExpression
    / "(" _ expression:ConditionalExpression _ ")"
        { return expression; }

ComparisonOperator
    = "="
    / "<>"
    / "<="
    / ">="
    / "<"
    / ">"

LogicalNOTExpression
    = PrimaryConditionalExpression
    / LogicalNOTOperator _ right:LogicalNOTExpression
        { return createNode({ type: "LOGICAL_EXPRESSION", operator: "!", left: null, right }); }

LogicalNOTOperator
    = NotToken

LogicalANDExpression
    = head:LogicalNOTExpression tail:(_ LogicalANDOperator _ LogicalNOTExpression)*
        { return buildLogicalExpression(head, tail); }

LogicalANDOperator
    = AndToken { return "&&"; }

LogicalORExpression
    = head:LogicalANDExpression tail:(_ LogicalOROperator _ LogicalANDExpression)*
        { return buildLogicalExpression(head, tail); }

LogicalOROperator
    = OrToken
        { return "||"; }

ConditionalExpression
    = LogicalORExpression

// ----- A.4 Statements -----

Statement
    = Left$AssignmentStatement
    / Right$AssignmentStatement
    / Mid$AssignmentStatement
    / AssignmentStatement
    / ImportStatement
    / DocumentationStatement
    / &{ return options.version >= 2.65; } statement:CompileStatement { return statement; }
    / &{ return options.version >= 2.65; } statement:Execute$Statement { return statement; }
    / &{ return options.version >= 2.65; } statement:ExecuteStatement { return statement; }
    / ErrorStatement
    / IfStatement
    / ForStatement
    / RepeatStatement
    / WhileStatement
    / FunctionDefinitionStatement
    / FunctionOrArrayStatement
    / LocalStatement
    / StaticStatement
    / GotoStatement
    / GosubStatement
    / OnInterruptStatement
    / OnGotoStatement
    / OnGosubStatement
    / LabelledStatement
    / OpenStatement
    / CloseStatement
    / SeekStatement
    / PrintStatement
    / InputStatement
    / ReadStatement
    / DataStatement
    / RestoreStatement
    / ReturnStatement
    / ArrayDimensionsStatement
    / OpenWindowStatement
    / WindowOriginStatement
    / DotStatement
    / LineStatement
    / SetrgbStatement
    / SetdrawbufStatement
    / SetdispbufStatement
    / TriangleStatement
    / GTriangleStatement
    / PutbitStatement
    / PutscreenStatement
    / NewCurveStatement
    / CircleStatement
    / TextStatement
    / RectangleStatement
    / CloseWindowStatement
    / ClearWindowStatement
    / ClearScreenStatement
    / OpenPrinterStatement
    / ClosePrinterStatement
    / WaitStatement
    / BellStatement
    / Inkey$Statement
    / SystemStatement
    / PokeStatement
    / EndStatement
    / ExitStatement

Left$AssignmentStatement
    = (LetToken _)?Left$Token _ "(" _ a:StringScalarOrArray _ "," _ b:NumericExpression _ ")" _ "=" _ right:StringExpression
        { return createNode({ type: "LEFT$_ASSIGNMENT_STATEMENT", a, b, c: null, right }); }

Right$AssignmentStatement
    = (LetToken _)?Right$Token _ "(" _ a:StringScalarOrArray _ "," _ b:NumericExpression _ ")" _ "=" _ right:StringExpression
        { return createNode({ type: "RIGHT$_ASSIGNMENT_STATEMENT", a, b, c: null, right }); }

Mid$AssignmentStatement
    = (LetToken _)?Mid$Token _ "(" _ a:StringScalarOrArray _ "," _ b:NumericExpression _ "," _ c:NumericExpression _ ")" _ "=" _ right:StringExpression
        { return createNode({ type: "MID$_ASSIGNMENT_STATEMENT", a, b, c, right }); }
    / &{ return options.version >= 2.66; } (LetToken _)?Mid$Token _ "(" _ a:StringScalarOrArray _ "," _ b:NumericExpression _ ")" _ "=" _ right:StringExpression
        { return createNode({ type: "MID$_ASSIGNMENT_STATEMENT", a, b, c: null, right }); }

AssignmentStatement
    = (LetToken _)?assignment:(StringAssignment / NumericAssignment)
        { return createNode({ type: "ASSIGNMENT_STATEMENT", ...assignment }); }

StringAssignment
    = left:(StringFunctionOrArray / StringVariable) _ "=" _ right:StringExpression
        { return { left, right }; }

NumericAssignment
    = left:(NumericFunctionOrArray / Numparams / NumericVariable) _ "=" _ right:NumericExpression
        { return { left, right }; }

DocumentationStatement
    = DocumentationToken comment:(WhiteSpace $SourceCharacter*)?
        { return createNode({ type: "DOC_STATEMENT", comment: extractOptional(comment, 1) }); }
            
ImportStatement
    = ImportToken _ library:$([_A-Za-z] SourceCharacter*)?
        { return createImportStatement(library); }

CompileStatement
    = CompileToken _ "(" _ source:StringExpression _ ")"
        { return createNode({ type : "COMPILE_STATEMENT", source }); } 

Execute$Statement
    = args:Execute$Clause
        { return createNode({ type: "EXECUTE$_STATEMENT", arguments: args }); }
    
Execute$Clause
    = Execute$Token _ args:Arguments
        { return args; }
        
ExecuteStatement
    = args:ExecuteClause
        { return createNode({ type: "EXECUTE_STATEMENT", arguments: args }); }
        
ExecuteClause
    = ExecuteToken _ args:Arguments
        { return args; }
    
ErrorStatement
    = ErrorToken _ error:StringExpression
        { return createNode({ type: "ERROR_STATEMENT", error }); }

IfStatement
    = IfToken _ testAndConsequent:IfTestAndConsequent alternate:IfAlternate? EndifToken
        { return createNode({ type: "IF_STATEMENT", ...testAndConsequent, alternate: optionalList(alternate) }); }
    / IfToken _ test:ConditionalExpression _ consequent:Statement?
        { return createNode({ type: "IF_STATEMENT", test, consequent: consequent ? [consequent] : [], alternate: [] }); }

ElsifStatement
    = ElsifToken _ testAndConsequent:IfTestAndConsequent alternate:IfAlternate?
        { return createNode({ type: "IF_STATEMENT", ...testAndConsequent, alternate: optionalList(alternate) }); }
        
IfTestAndConsequent
    = test:ConditionalExpression _ ThenToken consequent:SourceElements
        { return { test, consequent }; }

IfAlternate
    = ElseToken body:SourceElements
        { return body; }
    / elsifStatement:ElsifStatement
        { return [elsifStatement]; }

ForStatement
    = ForToken _ variable:(Numparams / NumericVariable) _ "=" _ start: NumericExpression _
        ToToken _ end:NumericExpression
        step:(_ StepToken _ NumericExpression)?
        body:SourceElements
        _ NextToken next:(_ (Numparams / NumericVariable))?
        {
            next = extractOptional(next, 1);

            if (next && variable.name !== next.name) {
                error(["ForAndNextDoNotMatch"], { start: { line: location().end.line, column: 0 } });
            }

            return createNode({ type: "FOR_STATEMENT", variable, start, end, step: extractOptional(step, 3), body });
        }

RepeatStatement
    = RepeatToken
        body:SourceElements
        UntilToken _ "(" _ test:ConditionalExpression _ ")"
        { return createNode({ type: "REPEAT_STATEMENT", body, test }); }

WhileStatement
    = WhileToken _ "(" _ test:ConditionalExpression _ ")"
        body:SourceElements
        WendToken
        { return createNode({ type: "WHILE_STATEMENT", test, body }); }

FunctionDefinitionStatement
    = header:SubroutineHeader
        body:SourceElements
        subroutineEnd
        { return createSubroutineStatement(header.name, header.parameters, body); }

SubroutineHeader
    = (ExportToken _)? SubToken _ name:NonArrayIdentifier _ "(" _ parameters:(ParameterList _)? ")"
        {
            if (isInsideFunction) error(["NestedFunctionsNotAllowed"]);

            isInsideFunction = name;

            return { name: addFunctionOrArrayNameToSymbolTable(name), parameters: optionalList(extractOptional(parameters, 0)) };
        }

subroutineEnd
    = EndsubToken { isInsideFunction = null; }

ParameterList
    = ("," _)? head:ParameterItem tail:(_ "," _ ParameterItem)*
        { return buildList(head, tail, 3); }

ParameterItem
    = Numparams
    / _Array
    / Variable

FunctionOrArrayStatement
    = statement:FunctionOrArray
        { return createNode({ type: "FUNCTION_OR_ARRAY_STATEMENT", name: statement.name, arguments: statement.arguments }); }

LocalStatement
    = LocalToken _ variables:LocalAndStaticList
        { return createNode({ type: "LOCAL_STATEMENT", variables }); }

StaticStatement
    = StaticToken _ variables:LocalAndStaticList
        { return createNode({ type: "STATIC_STATEMENT", variables }); }

LocalAndStaticList
    = head:LocalAndStaticItem tail:(_ "," _ LocalAndStaticItem)*
        { return buildList(head, tail, 3); }

LocalAndStaticItem
    = Numparams
    / FunctionOrArray
    / Variable

GotoStatement
    = GotoToken _ label:Label
        { return createNode({ type: "GOTO_STATEMENT", label }); }

GosubStatement
    = GosubToken _ label:Label
        { return createNode({ type: "GOSUB_STATEMENT", label }); }

OnInterruptStatement
    = OnToken _ InterruptToken _ BreakToken
        { return createNode({ type: "ON_INTERRUPT_STATEMENT", interrupt: true }); }
    / OnToken _ InterruptToken _ ContinueToken
        { return createNode({ type: "ON_INTERRUPT_STATEMENT", interrupt: false }); }

OnGotoStatement
    = OnToken _ on:NumericExpression _ GotoToken _ labels:OnGotoAndGosubLabelList
        { return createNode({ type: "ON_GOTO_STATEMENT", on, labels }); }

OnGosubStatement
    = OnToken _ on:NumericExpression _ GosubToken _ labels:OnGotoAndGosubLabelList
        { return createNode({ type: "ON_GOSUB_STATEMENT", on, labels }); }

OnGotoAndGosubLabelList
    = head:Label tail:(_ "," _ Label)*
        { return buildList(head, tail, 3); }

LabelledStatement
    = label:NumberedLine _ statement:Statement?
        { return createLabelledStatement(label, statement); }
    / LabelToken _ label: Label
        { return createLabelledStatement(label, null); }

NumberedLine
    = label:UnsignedInteger !(WhiteSpace+ UnsignedInteger)
        { if (!numberedLineAllowed) error(["ParseErrorAt", label]); return label; }

Label
    = UnsignedInteger
    / IdentifierName

OpenStatement
    = open:OpenClause
        { return createNode({ type: "OPEN_STATEMENT", ...open }); }

CloseStatement
    = CloseToken _ stream:HashedNumber
        { return createNode({ type: "CLOSE_STATEMENT", stream }); }

SeekStatement
    = seek:SeekClause
        { return createNode({ type: "SEEK_STATEMENT", ...seek }); }

OpenClause
    = stream:OpenClauseBase file:StringExpression mode:(_ "," _ StringExpression)?
        { return { stream, file, mode: extractOptional(mode, 3) }; }
    / stream:OpenClauseBase printer:PrinterToken
        { return { stream, printer: true }; }

OpenClauseBase
    = OpenToken _ stream:HashedNumber _ "," _
        { return stream; }

SeekClause
    = SeekToken _ stream:HashedNumber _ "," _ position:NumericExpression mode:(_ "," _ StringExpression)?
        { return { stream, position, mode: extractOptional(mode, 3) }; }

PrintStatement
    = PrintToken _ intro:PrintIntro _ items:PrintList? _ suffix:PrintSuffix?
        { return createNode({ type: "PRINT_STATEMENT", ...intro, items: optionalList(items), suffix }); }
    
PrintIntro
    = stream:Stream
        { return { stream }; }
    / colourOrReverse:ColourOrReverseClause? _ at:AtClause?
        { return { colourOrReverse, at }; }

ColourOrReverseClause
    = ColourToken _ "(" _ a:StringExpression b:(_ "," _ StringExpression)?_ ")"
        { return createNode({ type: "COLOUR_CLAUSE", a, b: extractOptional(b, 3) }); }
    / ReverseToken
        { return createNode({ type: "REVERSE_CLAUSE" }); }

AtClause
    = AtToken _ "(" _ a:NumericExpression _ "," _ b:NumericExpression _ ")"
        { return createNode({ type: "AT_CLAUSE", a, b }); }

PrintList
    = ("," _)? head:PrintItem tail:(_ "," _ PrintItem)*
        { return buildList(head, tail, 3); }

PrintItem
    = expression:StringExpression
        { return { expression, using: null }; }
    / expression:NumericExpression _ using:UsingClause?
        { return { expression, using }; }

UsingClause
    = UsingToken _ using:StringExpression
        { return using; }

PrintSuffix
    = ";"
    / ","

InputStatement
    = line:(LineToken _)? InputToken _ body:InputBody
        { return createNode({ type: "INPUT_STATEMENT", splitOnSpaces: !line, ...body }); }

InputBody
    = stream:Stream _ items:InputList
        { return { stream, prompt: "", items }; }
    / at:AtClause? _ prompt:StringLiteral? _ items:InputList
        { return { at, prompt: prompt ? prompt.value : "?", items }; }

InputList
    = head:InputItem tail:(_ "," _    InputItem)*
        { return buildList(head, tail, 3); }

InputItem
    = FunctionOrArray / Numparams / Variable

ReadStatement
    = ReadToken _ variables:ReadList
        { return createNode({ type: "READ_STATEMENT", variables }); }

ReadList
    = head:ReadItem tail:(_ "," _ ReadItem)*
        { return buildList(head, tail, 3); }

ReadItem
    = FunctionOrArray / Numparams / Variable

DataStatement
    = DataToken _ head:DataItem tail:(_ "," _ DataItem)*
        { return createNode({ type: "DATA_STATEMENT", data: buildList(head, tail, 3) }); }

DataItem
    = StringLiteral
    / negate:[+-]? float:UnsignedFloat
        { return createNode({ type: "NUMERIC_LITERAL", value: negate === "-" ? -float : float }); }

RestoreStatement
    = RestoreToken label:(_ Label)?
        { return createNode({ type: "RESTORE_STATEMENT", label: extractOptional(label, 1) }); }

ReturnStatement
    = ReturnToken _ value:Expression
        {
            if (!isInsideFunction) error(["CanNotReturnValue"]);
            return createNode({ type: "RETURN_STATEMENT", value });
        }
    / ReturnToken
        { return createNode({ type: "RETURN_STATEMENT", value: null }); }

ArrayDimensionsStatement
    = DimToken _ head:ArrayDimensionsItem tail:(_ "," _ ArrayDimensionsItem)*
        { return createNode({ type: "ARRAY_DIMENSIONS_STATEMENT", arrays: buildList(head, tail, 3) }); }

ArrayDimensionsItem
    = name:NonArrayIdentifier _ dimensions:Arguments
        { return { name: addFunctionOrArrayNameToSymbolTable(name), dimensions }; }

OpenWindowStatement
    = OpenToken _ WindowToken _ width:NumericExpression _ "," _ height:NumericExpression font:(_ "," _ StringExpression)?
        { return createNode({ type: "OPEN_WINDOW_STATEMENT", width, height, font: extractOptional(font, 3) }); }

WindowOriginStatement
    = WindowToken _ OriginToken _ origin:StringExpression
        { return createNode({ type: "WINDOW_ORIGIN_STATEMENT", origin }); }

DotStatement
    = clear:(ClearToken _)? DotToken _ x:NumericExpression _ "," _ y:NumericExpression
        { return createNode({ type: "DOT_STATEMENT", clear: !!clear, x, y }); }

LineStatement
    = clear:(ClearToken _)? LineToken _ coords:FourCoordinates
        { return createNode({ type: "LINE_STATEMENT", clear: !!clear, ...coords }); }
    / clear:(ClearToken _)? LineToken _ (ToToken _)? x1:NumericExpression _ "," _ y1:NumericExpression
        { return createNode({ type: "LINE_TO_STATEMENT", clear: !!clear, x: x1, y: y1 }); }

SetrgbStatement
    = SetrgbToken _ n:NumericExpression _ "," _ r:NumericExpression _ "," _ g:NumericExpression _ "," _ b:NumericExpression
        { return createNode({ type: "SETRGB_STATEMENT", n, r, g, b }); }

SetdrawbufStatement
    = SetdrawbufToken _ buffer:NumericExpression
        { return createNode({ type: "SETDRAWBUF_STATEMENT", buffer }); }

SetdispbufStatement
    = SetdispbufToken _ buffer:NumericExpression
        { return createNode({ type: "SETDISPBUF_STATEMENT", buffer }); }

TriangleStatement
    = clearFill:ClearFillClause TriangleToken _ coords:SixCoordinates
        { return createNode({ type: "TRIANGLE_STATEMENT", ...clearFill, ...coords }); }

ClearFillClause
    = clear:(ClearToken _) fill:(FillToken _)?
        { return { clear: true, fill: !!fill }; }
    / fill:(FillToken _)? clear:(ClearToken _)?
        { return { clear: !!clear, fill: !!fill }; }

GTriangleStatement
    = GtriangleToken _ coords:SixCoordinates
        { return createNode({ type: "GTRIANGLE_STATEMENT", ...coords }); }

PutbitStatement
    = PutbitToken _ string:StringExpression _ (ToToken / ",") _ x:NumericExpression _ "," _ y:NumericExpression mode:(_ "," _ StringExpression)?
        { return createNode({ type: "PUTBIT_STATEMENT", string, x, y, mode: extractOptional(mode, 3) }); }

PutscreenStatement
    = PutscreenToken _ string:StringExpression _ (ToToken / ",") _ x:NumericExpression _ "," _ y:NumericExpression
        { return createNode({ type: "PUTSCREEN_STATEMENT", string, x, y }); }

NewCurveStatement
    = NewToken _ CurveToken
        { return createNode({ type: "NEW_CURVE_STATEMENT" }); }

CircleStatement
    = clearFill:ClearFillClause CircleToken _ parameters:CircleParameters
        { return createNode({ type: "CIRCLE_STATEMENT", ...clearFill, ...parameters }); }

CircleParameters
    = x:NumericExpression _ "," _ y:NumericExpression _ "," _ radius:NumericExpression
        { return { x, y, radius }; }

TextStatement
    = TextToken _ x:NumericExpression _ "," _ y:NumericExpression _ "," _ text:StringExpression alignment:(_ "," _ StringExpression)?
        { return createNode({ type: "TEXT_STATEMENT", x, y, text, alignment: extractOptional(alignment, 3) }); }

RectangleStatement
    = clearFill:ClearFillClause RectToken _ coords:FourCoordinates
        { return createNode({ type: "RECTANGLE_STATEMENT", ...clearFill, ...coords }); }

CloseWindowStatement
    = CloseToken _ WindowToken
        { return createNode({ type: "CLOSE_WINDOW_STATEMENT" }); }

ClearWindowStatement
    = ClearToken _ WindowToken
        { return createNode({ type: "CLEAR_WINDOW_STATEMENT" }); }

ClearScreenStatement
    = ClearToken _ ScreenToken
        { return createNode({ type: "CLEAR_SCREEN_STATEMENT" }); }

OpenPrinterStatement
    = OpenToken _ PrinterToken(_ StringExpression)?
        { error(["FunctionNotImplemented"]); }

ClosePrinterStatement
    = CloseToken _ PrinterToken
        { error(["FunctionNotImplemented"]); }

WaitStatement
    = WaitToken _ seconds:NumericExpression
        { return createNode({ type: "WAIT_STATEMENT", seconds }); }

BellStatement
    = BellToken
        { return createNode({ type: "BELL_STATEMENT" }); }

Inkey$Statement
    = timeout:Inkey$Clause
        { return createNode({ type: "INKEY$_STATEMENT", timeout }); }

Inkey$Clause
    = Inkey$Token _ "(" _ timeout:NumericExpression? _ ")"
        { return timeout; }
    / Inkey$Token
        { return null; }

SystemStatement
    = SystemClause

SystemClause
    = SystemToken _ "(" _ StringExpression _ ")"
        { error(["FunctionNotImplemented"]); }

PokeStatement
    = PokeToken _ internal:StringExpression _ "," _ value:Expression
        { return createNode({ type: "POKE_STATEMENT", internal, value }); }
    / PokeToken _ stream:HashedNumber _ "," _ value:Expression
        { return createNode({ type: "POKE_STREAM_STATEMENT", stream, value }); }

EndStatement
    = EndToken
        { return createNode({ type: "END_STATEMENT" }); }

ExitStatement
    = ExitToken (_ NumericExpression)?
        { return createNode({ type: "EXIT_STATEMENT" }); }

FourCoordinates
    = x1:NumericExpression _ "," _ y1:NumericExpression _ (ToToken / ",") _ x2:NumericExpression _ "," _ y2:NumericExpression
        { return { x1, y1, x2, y2 }; }

SixCoordinates
    = x1:NumericExpression _ "," _ y1:NumericExpression _ ToToken _
        x2:NumericExpression _ "," _ y2:NumericExpression _ ToToken _
        x3:NumericExpression _ "," _ y3:NumericExpression
        { return { x1, y1, x2, y2, x3, y3 }; }

Numparams
    = ("numparams"i / "numparam"i) !IdentifierPart
        { return createNode({ type: "NUMPARAMS", name: "numparams" }); }

Stream
    = "#" _ stream:ParenthesizedNumericExpression
        { return stream; }
    / "#" _ stream:UnsignedInteger
        { return createNode({ type: "NUMERIC_LITERAL", value: stream }); }

HashedNumber
    = ("#" _)? expression:NumericExpression
        { return expression; }
