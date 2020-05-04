define("ace/mode/ntsl_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function(require, exports, module) {
    "use strict";
    
    var oop = require("../lib/oop");
    var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;
    
    var NtslHighlightRules = function() {
    
        var keywordMapper = this.createKeywordMapper({
            "keyword": 
                "with when while for if function func",
        }, "text", true, " ");
        
         
        this.$rules = {
            "start" : [
                {token : "string", regex : "`", next  : "string"},
                {token : "string", regex : "'", next  : "astring"},
                {token : "string", regex : "\"", next  : "qstring"},
                {token : "doc.comment", regex : /\$\*/, next : "multiline_comment"},
                {token : "doc.comment", regex : /\$.*/},
                {token : "paren.lparen", regex : "[\\[({]"},
                {token : "paren.rparen", regex : "[\\])}]"},
                {token : "constant.numeric", regex: "[+-]?\\d+\\b"},
                {token : "variable.parameter", regex : /sy|pa?\d\d\d\d\|t\d\d\d\.|innnn/}, 
                {token : "variable.parameter", regex : /\w+-\w[\-\w]*/},
                {token : keywordMapper, regex : "\\b\\w+\\b"},
                {caseInsensitive: true}
            ],
            "astring" : [
                {token : "constant.language.escape",   regex : "\\."},
                {token : "string", regex : "'",     next  : "start"},
                {defaultToken : "string"}
            ],
            "qstring" : [
                {token : "constant.language.escape",   regex : "\\."},
                {token : "string", regex : "\"",     next  : "start"},
                {defaultToken : "string"}
            ],
            "string" : [
                {token : "constant.language.escape",   regex : "\\."},
                {token : "string", regex : "`",     next  : "start"},
                {defaultToken : "string"}
            ],
            "multiline_comment" : [
                {token : "doc.comment", regex : "\\*\\$", next: "start"},
                {defaultToken: "doc.comment"}
            ]
        };
    };
    oop.inherits(NtslHighlightRules, TextHighlightRules);
    
    exports.NtslHighlightRules = NtslHighlightRules;
});

define('ace/mode/ntsl', function(require, exports, module) {

    var oop = require("ace/lib/oop");
    var TextMode = require("ace/mode/text").Mode;
    var HighlightRules = require("ace/mode/ntsl_highlight_rules").NtslHighlightRules;
    
    var Mode = function() {
        this.HighlightRules = HighlightRules;
    };
    oop.inherits(Mode, TextMode);
    
    (function() {
        // Extra logic goes here. (see below)
    }).call(Mode.prototype);
    
    exports.Mode = Mode;
});
    