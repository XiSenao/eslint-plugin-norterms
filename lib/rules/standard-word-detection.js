/**
 * @fileoverview standard-word-detection
 * @author Ashen
 */
"use strict";
const Container = require("./../core/dfa").default;
const CGS = require("console-grid").Style;
const Grid = require("console-grid");
const grid = new Grid();
const config = require('./../../config/config');
const boxen = require('boxen');
const chalk = require('chalk')

/**
 * 
 *  @argument
 *  由于 eslint 默认会在 fix 后重新检索当前节点, 直到无法替换或者替换次数达到10次才停止, 命中算法采取地为尽可能匹配的方案, 因此会存在循环替换的现象.
 *  例如: zent 为非合规词命中后转换为 zent-old, 再次检索后又命中 zent 转换为 zent-old-old, 这是不合规的行为.
 *  
 *  采取新的设计思路: 
 *     配置中新增 fixed 项, 默认为 false. 默认处理行为为 target 为非敏感树的 header 且 target 所涉及的内容包含已命中过的区间范围, 则采取区间合并的处理.
 *  当 fixed 为 true, 所携带fixed的区间在再次匹配的时候将中断. 为优化区间合并的流程, 后期采取二分法和快速排序算法进行优化.
 * 
 */
// 预计算坐标
let saveCurrentState = [];

const defaultGridConfig = {
  option: {
    sortField: "irregularityWord",
  },
  columns: [{
    id: "irregularityWord",
    name: CGS.magenta("不合规词"),
    type: "string",
    maxWidth: 1000,
  }, {
    id: "substitutableWords",
    name: CGS.magenta("可替换词语"),
    type: "string",
    maxWidth: 1000,
  }, {
    id: "hitCoordinates",
    name: CGS.magenta("命中坐标"),
    type: "string",
    maxWidth: 1000,
  }, {
    id: "hitCopywriter",
    name: CGS.magenta("命中文案"),
    type: "string",
    maxWidth: 100,
  }, {
    id: "filePath",
    name: CGS.magenta("文件路径"),
    type: "string",
    maxWidth: 100,
  }],
  rows: []
};

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------
// const configPath = path.resolve(process.cwd(), '.textSpecificationDetection.js');


module.exports = {
  meta: {
    docs: {
      description: "standard word detection",
      recommended: false
    },
    fixable: "code",
    schema: [
      // fill in your schema
    ]
  },

  create: function (context) {
    const sourceCode = context.getSourceCode();
    const filterWord = (node, txt) => {
      const { start } = node.loc;
      const { range } = node;
      let excuteQueue = [];
      Container.filterSensitiveWord(txt, (map) => {
        // JSXText的文本在同行时不需要加一, 因为没有单引号.
        const isJSXText = node.type === 'JSXText';
        for (let item in map) {
          // 命中合规词不进行处理
          if (Container.allCompliance.has(item)) continue;
          const data = {
            ...defaultGridConfig,
            rows: map[item].queue.map((i, curIndex) => {
              const baseConfig = curIndex === 0 ? {
                irregularityWord: CGS.red(item),
                substitutableWords: CGS.green(map[item].legalWords.join()),
                hitCopywriter: map[item].targetCW,
                filePath: CGS.blue(context.getFilename()),
              } : {};
              return {
                ...baseConfig,
                hitCoordinates: CGS.cyan(`${context.getFilename()}:${start.line + i.startRow}:${(i.startRow ? i.startColumn : start.column + i.startColumn + Number(!isJSXText)) + 1}`)
              }
            })
          };

          const baseStart = range[0] + Number(!isJSXText);
          excuteQueue = [
            ...excuteQueue,
            ...map[item].queue.map(i => {
              return [[baseStart + i.sourceStartIndex - 1, baseStart + i.sourceEndIndex], map[item].legalWords[0], item, map[item].legalWords.join()]
            })
          ]

          grid.render(data)
        }
      }, saveCurrentState);

      if (excuteQueue.length) {
        const { option = [] } = config;
        const fixedOptionName = option.filter(config => config.fixed).map(config => config.name);
        const uniqueFixedOptionName = [...new Set(fixedOptionName)];

        const handleDetectOverlap = (start, end, isEqual = false) => {
          if (isEqual && start.start === end.start && start.end === end.end) return false;
          return end.start < start.end && start.start < end.end;
        }

        const filterExcuteQueue = [];
        const saveDeleteStateIndex = new Set();
        excuteQueue.forEach(excute => {
          const targetCopywriter = excute[1];
          const [hitStartPosition, hitEndPosition] = excute[0];
          const differenceLength = targetCopywriter.length - (hitEndPosition - hitStartPosition);
          const length = saveCurrentState.length;
          const deleteStateIndex = new Set();
          let isOk = true;
          for (let i = 0; i < length; ++i) {
            const { loc = [], fixed = false } = saveCurrentState[i];
            const startIndex = loc[0] || 0;
            const endIndex = loc[1] || 0;
            // 区间重合或者和 fixed 存在交集
            if (hitStartPosition >= startIndex && hitEndPosition <= endIndex || (fixed && handleDetectOverlap({ start: startIndex, end: endIndex }, { start: hitStartPosition, end: hitEndPosition }))) {
              isOk = false;
              break;
            }
            if (!fixed && handleDetectOverlap({ start: startIndex, end: endIndex }, { start: hitStartPosition, end: hitEndPosition }, true)) {
              deleteStateIndex.add(i);
            }
          }
          if (isOk) {
            excute[4] = differenceLength;
            saveDeleteStateIndex.add(...deleteStateIndex);
            filterExcuteQueue.push(excute);
          }
        });
        [...saveDeleteStateIndex].filter(v => v).forEach(index => {
          delete saveCurrentState[index];
        });
        saveCurrentState = [
          ...saveCurrentState,
          ...filterExcuteQueue.map(excute => {
            return {
              loc: excute[0],
              fixed: uniqueFixedOptionName.includes(excute[1]),
              diff: excute[4]
            }
          })
        ]
        saveCurrentState = saveCurrentState.filter(v => v).sort((a, b) => a.loc[0] - b.loc[1]);
        let diffSum = 0;
        saveCurrentState = saveCurrentState.map(item => {
          const { loc, diff = 0, fixed } = item;
          // 预计算 fixed 之后的位置.
          const result = {
            loc: [loc[0] + diffSum, loc[1] + diffSum + diff],
            diff: 0,
            fixed
          }
          diffSum += diff;
          return result;
        })
        const lines = [];
        const { length } = filterExcuteQueue;
        filterExcuteQueue.forEach((item, index) => {
          let showText = `${chalk.red.bold(item[2])} 为非合规词, 可使用 ${chalk.green.bold(item[3])} 合规词来进行替换`;
          if (index < length - 1) {
            showText = `${chalk.red.bold(item[2])} 为非合规词, 可使用 ${chalk.green.bold(item[3])} 合规词来进行替换\n`
          }
          lines.push(showText);
        })
        context.report({
          node: node,
          message: boxen(lines.join('\n'), {
            margin: 1,
            padding: 1,
            borderColor: 'blue',
            borderStyle: 'classic',
          }),
          fix(fixer) {
            return filterExcuteQueue.map(excute => {
              return fixer.replaceTextRange(
                excute[0], excute[1]
              )
            });
          },
        });
      }

    }
    return {
      Program(node) {
        // 获取所有注释的节点
        const comments = sourceCode.getAllComments();
        comments.forEach(comment => {
          let { value, type } = comment;
          if (value && value.trimStart()[0] === '@') {
            return;
          }
          const commentBack = {
            ...comment
          };
          if (type === 'Line') {
            commentBack.value = `/${value}`;
          } else {
            commentBack.value = `*${value}`;
          }
          filterWord(commentBack, commentBack.value);
        })
      },

      "JSXText": function (node) {
        if (node.value.trim()) {
          filterWord(node, node.value);
        }
      },

      "Literal": function (node) {
        if (node.parent.type === 'JSXAttribute' || node.parent.type === 'ImportDeclaration') {
          return;
        }
        filterWord(node, node.value);
      },

      "TemplateElement": function (node) {
        filterWord(node, node.value.raw);
      }
    };
  }
};
