/**
 * @fileoverview Standard word detection
 * @author Ashen
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var rule = require("../../../lib/rules/standard-word-detection"),

  RuleTester = require("eslint").RuleTester;


//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

var ruleTester = new RuleTester();
ruleTester.run("wsc-standard-words", rule, {

  valid: [
    {
      code: "var a = '有赞E卡'"
    }
  ],

  invalid: [
    {
      code: "var a = '有赞e卡'",
      errors: [{
        message: '\n\t\t使用的文案中有常见的错误用词: 有赞e卡;\n\t\t符合规范的合规词: 有赞E卡,Youzan,WWE卡;\n\t\t命中文件路径: <input>;\n\t\t命中文案: 有赞e卡;\n\t\t命中坐标: 1,9,1,12;\n\t\t\t\t\t\t'
      }]
    }
  ]
});
