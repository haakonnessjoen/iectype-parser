/* lexical grammar */
%lex

%x string

%%

[\n\r]                /* nuffn */
\s+                   /* nothing */
[-]?\d+                   return 'NUMBER'
";"                   return 'SEMICOLON'
"TYPE"                 return 'TYPE'
"END_TYPE"             return 'END_TYPE'
"STRUCT"               return 'STRUCT'
"END_STRUCT"           return 'END_STRUCT'
"ARRAY"               return 'ARRAY'
"OF"                  return 'OF'
"["			return 'BRACKET_START'
"]"                     return 'BRACKET_END'
".."                    return '..'
","                     return ','
"("			return '('
")"			return ')'
(WORD|BOOL|INT|UINT|DWORD|REAL|SINT|T_MaxString) return 'SIMPLE_TYPE'
":="                  return 'ASSIGN'
":"                   return 'DECLARE'
([a-zA-Z_0-9]+)              return 'VARIABLE'
["]                   this.begin("string");
<string>([\\]["]|[^"])*   {yytext = yytext.replace(/\\"/,'"'); console.log("STRING:" + yytext); return 'STRING'; }
<string>["]           { this.popState(); }
<<EOF>>               return 'EOF'
.                     return 'INVALID'

/lex

%start initial

%%


initial
    : variable_decl initial2
    ;

initial2
    : program
    | function
    | EOF
    ;

variable_decl
    :
    | variable_decl TYPE variables END_TYPE
    ;

variable_name: VARIABLE
    { $$ = $1; yy.currentVariable = $1; }
    ;

ranges
    : range
    { $$ = [$1] }
    | ranges "," range
    { $$ = $1.concat($3) }
    ;

range
    : NUMBER ".." NUMBER
    { $$ = { type: 'range', from: $1, to: $3 } }
    ;

array_decl
    : ARRAY BRACKET_START ranges BRACKET_END
    { $$ = $3 }
    ;

subrange_decl
    :
    | "(" ranges ")"
    { $$ = $2 }
    ;

numeric_value: NUMBER
    { $$ = $1 }
    ;

enum_item
    : variable_name
    { $$ = $1 }
    | variable_name ASSIGN numeric_value
    { $$ = { type: 'ENUM_ASSIGN', name: $1, value: $3 } }
    ;

enum_items
    :
    | enum_item
    { $$ = [$1] }
    | enum_items "," enum_item
    { $$ = $1.concat($3) }
    ;

enum_decl
    : "(" enum_items ")"
    { $$ = $2 }
    ;

new_struct
    : STRUCT
    { yy.newScope(yy.currentVariable, 'STRUCT'); }
    ;

struct_done
    : END_STRUCT optional_semicolon
    { yy.popScope() }
    ;

optional_semicolon:
    | SEMICOLON
    ;

struct_decl
    : new_struct variables struct_done
    { $$ = $2 }
    ;

main_types
    : enum_decl SEMICOLON
    { $$ = { type: 'ENUM', data: $1 } }
    | SIMPLE_TYPE subrange_decl SEMICOLON
    { $$ = { type: $1, subrange: $2 } }
    | VARIABLE SEMICOLON
    { $$ = { type: $1 } }
    | struct_decl
    { $$ = yy.IGNORE_THIS }
    ;

type_declaration
    : array_decl OF main_types
    { $$ = { type: 'ARRAY', ranges: $1, oftype: $3 } }
    | main_types
    { if (typeof $1 == 'object' && $1.type) { $$ = $1; } else { $$ = { type: $1 } } }
    ;

variables:
    | variables variable_name DECLARE type_declaration
    { var variabel = $2; var definition = $4; $$ = [ variabel, definition ]; console.log($2 + " : ",$4, " at line " + @2.first_line); $$ = new yy.Declaration($2, $4, @2.first_line); }
    ;
