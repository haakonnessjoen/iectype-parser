# IEC 61131-3 Type parser

## Using Jison

To learn writing parsers with the common tools available today (flex/bison/etc and jison), I set myself the goal to parse type defintions in the ST language for PLC's.
The reason I want to do this, is because I have already created a node-js module for reading/writing binary data to structures and arrays to/from PLC's. But you need to
recreate the structure using class methods, instead of just pasting the type definition from your ST program.

But most examples out there are either too simple, just a calculator with inline code in the parser. Or way too complex.. coffeescript/ANSI C/etc. So the learning curve without any books available, is a bit steep.

But after a day or two with googling and playtesting I have now created something that can read fairly complex type definitions. But while it kind of works, I feel that it is kind of "hacky". I should write it from scratch and do proper
"node-tree" stuff.
