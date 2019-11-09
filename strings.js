class Strings {
    get(name, ...parameters) {
        let string;

        if (name.constructor === String) {
            string = this.strings[name];
        } else {
            string = '';
            for (let i = 0; i < name.length; i++) {
                string += this.strings[name[i]];
            }
        }

        for (let parameter of parameters) {
            string = string.replace(/%[dgns]/, parameter);
        }

        return string;
    }
}

Strings.prototype.strings = {
    OutOfMemory:
        `out of memory`,
    CouldntParse:
        `couldn't parse program`,
    CommandNotImplemented:
        `command %s (%d) not implemented`,
    FunctionNotImplemented:
        `function not implemented in this version of Yabasic`,
    ProgramStoppedDueToError:
        `program stopped due to an error`,
    InternalError:
        `internal error`,
    InternalErrorExpectedButFound:
        `internal error: expected %s but found %s`,
    InternalErrorInvalidPushDblSym:
        `internal error: invalid pushdblsym`,
    ArrayNotDefined:
        `array '%s()' is not defined`,
    OneDimArray:
        `only one dimensional arrays allowed`,
    OnlyNumericalIndicesAllowedForArrays:
        `only numerical indices allowed for arrays`,
    ArrayConflictsWithUserSubroutine:
        `array '%s()' conflicts with user subroutine`,
    ArrayHasMoreThan10Dimensions:
        `array has more than 10 dimensions`,
    CannotChangeDimensionsOfFromTo:
        `cannot change dimension of '%s()' from %d to %d`,
    ArrayIndexLessThanEqualToZero:
        `array index %d is less than or equal to zero`,
    OnlyIndicesBetweenOneAndAreAllowed:
        `only indices between 1 and %d are allowed`,
    IsNeitherArrayNorSubroutine:
        `'%s()' is neither array nor subroutine`,
    ArrayParameterHasNotBeenSupplied:
        `array parameter '%s()' has not been supplied`,
    IndicesSuppliedExpectedFor:
        `%d indices supplied, %d expected for '%s()'`,
    IndexOutOfRange:
        `index %d (=%d) out of range`,
    NotValidFormat:
        `'%s' is not a valid format`,
    CantConvertToChar:
        `can't convert %g to character`,
    CannotConvertBaseNumbers:
        `Cannot convert base-%d numbers`,
    NotABaseNumber:
        `Not a base-%d number: '%s'`,
    IsNotAValidFilemode:
        `\'%s\' is not a valid filemode`,
    ResultIsNotARealNumber:
        `result is not a real number`,
    InvalidInfolevel:
        `invalid infolevel`,
    CouldNotOpen:
        `could not open '%s'`,
    StreamNotOpened:
        `stream %d not opened`,
    StreamAlreadyClosed:
        `stream %d already closed`,
    StreamAlreadyInUse:
        `stream already in use`,
    StreamNotOpenForWriting:
        `stream %d not open for writing`,
    StreamNotOpenForReading:
        `stream %d not open for reading`,
    StreamNotOpenForWritingOrPrinting:
        `stream %d not open for writing or printing`,
    ReachedMaxOpenFiles:
        `reached maximum number of open files`,
    SeekModeIsNeither:
        `seek mode '%s' is none of begin, end, here`,
    CouldNotPositionStreamTo:
        `could not position stream %d to byte %d`,
    CanOnlyHandleStreamsFromTo:
        `can handle only streams from 1 to %d`,
    StreamPokeOutOfByteRange:
        `stream poke out of byte range (0..255)`,
    DontUseQuotesWhenPeeking:
        `don't use quotes when peeking within file`,
    InvalidPeek:
        `invalid peek`,
    DontUseQuotesWhenPoking:
        `don't use quotes when poking into file`,
    InvalidPoke:
        `invalid poke`,
    CouldNotCreateWindow:
        `could not create window`,
    WindowAlreadyOpen:
        `window already open`,
    NoWindowToClose:
        `no window to close`,
    NoWindowToDraw:
        `no opened drawing window`,
    NoWindowToClear:
        `no window to clear`,
    WinWidthLessThanOne:
        `winwidth less than 1 pixel`,
    WinHeightLessThanOne:
        `winheight less than 1 pixel`,
    InvalidTextAlignment:
        `invalid text-alignment`,
    InvalidWindowOrigin:
        `invalid window origin`,
    InvalidBitmap:
        `invalid bitmap`,
    NeedToClearScreen:
        `need to clear screen first`,
    IllegalScreenString:
        `illegal screen string`,
    UnknownColour:
        `unknown colour: '%s'`,
    CouldNotPreparePrinter:
        `could not prepare printer`,
    CantPrintAlreadyPrintingGraphics:
        `cannot open printer: already printing graphics`,
    CannotBitblitToPrinter:
        `cannot bitblit to printer`,
    InvalidModeForBitblit:
        `invalid mode for bitblit: '%s'`,
    CantFindLabel:
        `can't find label '%s'`,
    AlreadyDefinedWithinSub:
        `'%s' already defined within this subroutine`,
    Duplicate:
        `duplicate %s '%s'`,
    CantFind:
        `can't find %s '%s'`,
    Subroutine:
        `subroutine`,
    Label:
        `label`,
    SubReturnsButShouldReturn:
        `subroutine returns %s but should return %s`,
    AString:
        `a string`,
    ANumber:
        `a number`,
    ArrayAlreadyDefinedWithinSub:
        `'%s'() already defined within this subroutine`,
    InvalidSubCallExpectedReplied:
        `invalid subroutine call: %s expected, %s supplied`,
    NotInThisSub:
        ` (not in this subroutine)`,
    RunOutOfDataItems:
        `run out of DATA items`,
    TypeOfReadAndDataDontMatch:
        `type of READ and DATA don't match`,
    ReturnFromSubWithoutCall:
        `RETURN from a subroutine without call`,
    ReturnWithoutGosub:
        `RETURN without GOSUB`,
    ErrorIn:
        `Error in %s,%d: `,  // trailing space important
    FatalErrorIn:
        `Fatal error in %s,%d: `,  // trailing space important
    ColourNumberMustBeBetween:
        `colour number must be between %d and %d`,
    BufferMustBeZeroOrOne:
        `draw or display buffer must be 0 or 1`,
    At:
        `%s at %n`,
    EndOfLine:
        `end of line`,
    NoUseForLocalOutsideFunctions:
        `no use for 'local' outside functions`,
    NoUseForStaticOutsideFunctions:
        `no use for 'static' outside functions`,
    CanNotReturnValue:
        `can not return value`,
    StringNotTerminated:
        `string not terminated`,
    NestedFunctionsNotAllowed:
        `nested functions not allowed`,
    ForAndNextDoNotMatch:
        `'for' and 'next' do not match`,
    WinSizeTooLarge:
        `Window size too large (maximum %dx%d)`,
    ImmediateExitDueToFatalError:
        `---Immediate exit to system, due to a fatal error.\n`,
    Error:
        `Error`,
    Fatal:
        `Fatal error`,
    In:
        ` in %s,%d`,


    Parsing:
        `Parsing`,
    ParsingProgramPleaseWait:
        `Parsing program... Please wait.`,
    CompilationErrorAtLine:
        `Compilation error at line %d`,
    RunTimeErrorAtLine:
        `Run time error at line %d`,
    ParseErrorIn:
        `Error in %s,%d: `,  // trailing space important
    ParseErrorAt:
        `parse error at "%s"`,
    ExecutionComplete:
        `Execution complete`,
    ProgramCompletedExecution:
        `Program completed execution.`,
    UserHaltedExecution:
        `User halted execution.`,
    CouldntOpenLibrary:
        `couldn't open library '%s.yab'`,
    CantConvertNegativeNumberToHexadecimal:
        `can't convert negative number to hexadecimal`,
    NotAHexNumber:
        `Not a hex number: '%s'`,
    Nothing:
        `nothing`,
    Or:
        ` or `,
    String:
        `string`,
    Number:
        `number`,
    StringArray:
        `string array`,
    NumericArray:
        `numeric array`,
    AReferenceToA:
        `a reference to a `,
    WarningIn:
        `Warning in %s,%d: `,  // trailing space important
    NeedStringAsFunctionName:
        `need a string as a function name`,
    ExpectingNameOfFunctionNot:
        `expecting the name of a %s function (not '%s')`,
    Numeric:
        `numeric`,
    SubroutineNotDefined:
        `subroutine '%s' not defined`,
    FatalError:
        `Fatal error`,
    '':
        '',
};
