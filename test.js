var iec = require('./iectest');

var parser = iec.parser;
parser._types = {};
parser._scope = [];
var scope = parser.yy;

function checkType(type, line) {
	var internal = ['INT','UINT','WORD','DWORD','BOOL','ENUM','REAL', 'STRUCT', 'SINT', 'T_MaxString'];
	console.log("CHecking for type:", type);
	if (typeof type == 'object' && 'type' in type && type.type != 'ARRAY') {
		return checkType(type.type, line);
	}
	if (typeof type == 'object' && 'type' in type && type.type == 'ARRAY') {
		return checkType(type.oftype, line);
	}

	if (internal.indexOf(type) == -1 && !(type in parser._types)) {
	var util = require('util');
		throw new Error("Unknown type '" + type + "' at line " + line);
		return false;
	}
	return true;
}

scope.getScope = function () { return parser._scope[parser._scope.length-1]; }
scope.getTypes = function () {
	console.log("== GET TYPES ==");
	var types = parser._types;
	console.log("GetTypes init: ", types);
	for (var i = 0; i < parser._scope.length; ++i) {
		if (typeof types[parser._scope[i]].declaration == 'undefined') {
			types[parser._scope[i]].declaration = {};
		}
		types = types[parser._scope[i]].declaration;
		console.log("GetTypes i = " + i + " types: ", types);
	}
	return types;
};
scope.IGNORE_THIS = new function() {this.unique_instance = 1;};
scope.newScope = function (name, type) {
	scope.getTypes()[name] = { type: type };
	parser._scope.push(name);
}
scope.popScope = function () {
	return parser._scope.pop();
}
scope.Declaration = function (name, type, line, internal) {
	console.log("Checking type ", type," for ", name);
	console.log(type + " == " + scope.IGNORE_THIS);
	if (type.type === scope.IGNORE_THIS) {
		return;
	}
	if (!checkType(type, line)) {
		return;
	}
	var types = scope.getTypes();
	console.log("Current scope is:" + scope.getScope());
	types[name] = type;
	console.log("Added ", type, " to " + name);
};

parser.yy = scope;

var util = require('util');
console.log(parser.parse(
/*"TYPE E_EL7201Status :" +
"(" +
"EL7201_NOT_READY_TO_SWITCH_ON	:= 0," +
"EL7201_SWITCH_ON_DISABLED	:= 64," +
"EL7201_READY_TO_SWITCH_ON	:= 33," +
"EL7201_SWITCHED_ON	:= 35," +
"EL7201_OPERATION_ENABLED	:= 39," +
"EL7201_FAULT	:= 8," +
"EL7201_FAULT_REACTION_ACTIVE	:= 15" +
");" +
"END_TYPE\n" +
"TYPE\n" +
"  iTester   : INT (1..20);\n" +
"  eType     : (E_START, E_MIDTEN := 20, E_END);\n" +
"  superType : ARRAY[1..23,25..30] OF INT;\n" +
"  wTeller   : ARRAY[1..4] OF superType;\n" +
"  wTeller2   : ARRAY[1..4,5..6,10..100] OF superType;\n" +
"  bSikker   : BOOL;\n" +
"END_TYPE\n" +
"TYPE ANALOG_RANGE : REAL; END_TYPE\n" +
"TYPE\n" +
" ANALOG_SIGNAL_TYPE : (SINGLE_ENDED, DIFFERENTIAL); END_TYPE " +
"TYPE ANALOG_DATA : INT ( -4095..4095); END_TYPE " +
"TYPE"+
" ANALOG_16_INPUT: ARRAY [1..16] OF ANALOG_DATA;"+
"  ANALOG_ARRAY: ARRAY[1..4,1..16] OF ANALOG_DATA;"+
"  END_TYPE\n" +
"TYPE" +
" ANALOG_CHANNEL_CONFIG : " +
" STRUCT" +
" RANGE : ANALOG_RANGE;" +
" MIN_SCALE : ANALOG_DATA;" +
" MAX_SCALE : ANALOG_DATA;" +
" END_STRUCT;" +
" ANALOG_16_INPUT_CONFIG :" +
" STRUCT" +
" SIGNAL_TYPE : ANALOG_SIGNAL_TYPE;" +
" FILTER_PARAMETER : SINT (0..99);" +
" CHANNEL : ARRAY [1..16] OF ANALOG_CHANNEL_CONFIG;" +
" END_STRUCT;" +
" HAAKONTYPEN: SINT; " +
"END_TYPE " +
*/
"TYPE ST_VirtualBool : "+
"STRUCT " +
"	sName		: T_MaxString; "+
"	Value		: BOOL; "+
"	LastValue	: BOOL; "+
"END_STRUCT "+
"END_TYPE "+
"TYPE ST_VirtualInt : "+
"STRUCT "+
"	sName		: T_MaxString;"+
"	Value		: INT;"+
"	LastValue	: INT; "+
"END_STRUCT "+
"END_TYPE "+
"TYPE ST_VirtualReal : "+
"STRUCT "+
"	sName		: T_MaxString; "+
"	Value		: REAL; "+
"	LastValue	: REAL; "+
"END_STRUCT "+
"VirtualBools		: ARRAY[1..20] OF ST_VirtualBool; "+
"VirtualInts		: ARRAY[1..20] OF ST_VirtualInt; "+
"VirtualReals		: ARRAY[1..20] OF ST_VirtualReal; "+
"END_TYPE"
));
console.log("Types:", JSON.stringify(parser._types));
var internal = ['INT','UINT','WORD','DWORD','BOOL','ENUM','REAL', 'SINT'];
console.log("TYPE\n");
var out = '';
for (var key in parser._types) {
	var value = parser._types[key];
	out += key + ' : ';

	if (value.type == 'ENUM') {
		var result = [];
		for (var i = 0; i < value.data.length; ++i) {
			if (typeof value.data[i] == 'object') {
				result.push(value.data[i].name + ' := ' + value.data[i].value);
			} else {
				result.push(value.data[i]);
			}
		}
		out += "(\n\t" + result.join(",\n\t") + "\n);\n";
	} else
	if (value.type == 'ARRAY') {
		var result = [];
		for (var i = 0; i < value.ranges.length; ++i) {
			result.push(value.ranges[i].from + '..' + value.ranges[i].to);
		}
		out += 'ARRAY[' + result.join(",") + '] OF ' + value.oftype.type + ";\n";
	} else
	if (value.type == 'STRUCT') {
		console.log("This generator needs support for recursion... ", value.declaration);
	}
	if (internal.indexOf(value.type) != -1) {
		out += value.type;
		if ('subrange' in value && typeof value.subrange == 'object') {
			var result = [];
			for (var i = 0; i < value.subrange.length; ++i) {
				result.push(value.subrange[i].from + '..' + value.subrange[i].to);
			}
			out += '(' + result.join(',') + ')';
		}
		out += ";\n";
	}
}
console.log(out);
console.log("END_TYPE\n");
