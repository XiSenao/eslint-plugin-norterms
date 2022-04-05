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
const chalk = require('chalk');
const axios = require('axios');
const fs = require('fs');
const { checkConfigLegal } = require('../utils');
/** 最大缓存时间, 默认一周. */
const MAX_CACHE_TIME = 7 * 24 * 60 * 60 * 1000;
/** 请求超时最大时间, 默认3s. */
const MAX_REQUEST_TIME = 3 * 1000;
/** 设置基本配置路径 */
const BASE_CONFIG_SRC = 'https://gitee.com/Xashen/eslint-plugin-norterms/raw/master/config';

const instance = axios.create();
instance.defaults.timeout = MAX_REQUEST_TIME;

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
 *  Action1: 通过预计算 fix 之后的坐标来实现锁区间的能力.
 *  Action2: 区间多匹配处理方案, 预处理之后若匹配到当前区间则跳过 head 节点坐标.
 */

/** 预计算下一次检测时的坐标 */
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

/** eslint 完整生命周期中只能 fetch 一次请求 */
let isFetchConfig = false;

module.exports = {
  meta: {
    docs: {
      description: "standard word detection",
      recommended: false
    },
    fixable: "code",
    schema: [{
      type: 'Object'
    }]
  },

  create: function (context) {
    const sourceCode = context.getSourceCode();
    const options = context.options[0];
    const { forceUpdateConfig = false, maxCacheTime = MAX_CACHE_TIME, configSrc = BASE_CONFIG_SRC } = options || {};
    if (!isFetchConfig) {
      isFetchConfig = true;
      /** 检测配置文件修改时间 */
      fs.stat(`${__dirname}/../../config/config.js`, (err, val) => {
        if (err) {
          console.log(`${chalk.red.bold('Error: 配置文件版本信息获取失败')}`);
          return;
        }
        const { atime } = val || {};
        const fileAccessTime = new Date(atime).getTime();
        /** 是否命中缓存 */
        if (new Date().getTime() - fileAccessTime > maxCacheTime || forceUpdateConfig) {
          instance.get(configSrc)
            .then(configSource => {
              if (!checkConfigLegal(configSource.data || {})) {
                return console.log(`${chalk.red.bold('Error: 配置文件不合规')}`);
              }
              try {
                // const configCode = JSON.stringify(configSource).replace(/(\\r|\\n)\s*/g, '');
                const config = {
                  ...configSource.data,
                  name: (process.cwd() || '').split('/').pop(),
                }
                fs.writeFile(`${__dirname}/../../config/config.js`, `module.exports = ${JSON.stringify(config)}`, (error) => {
                  if (error) {
                    console.log(`\n${chalk.red.bold('Error: 配置文件更新失败')}, ${chalk.bgCyan.bold('原因如下:')}`);
                    console.log(`${chalk.yellowBright.bold(e)}\n`);
                    return;
                  }
                  console.log(`${chalk.green.bold('配置文件已更新到最新版本')}`);
                })
              } catch (e) {
                console.log(`${chalk.red.bold('Error: 解析配置文件失败')}`);
              }
            })
            .catch(_ => {
              console.log(`${chalk.red.bold('Error: 获取配置文件失败')}`, _);
            });
        }
      })
    }

    const filterWord = (node, txt) => {
      const { start } = node.loc;
      const { range } = node;
      let excuteQueue = [];
      Container.filterSensitiveWord(txt, (map) => {
        /** JSXText的文本在同行时不需要加一, 因为没有单引号. */
        const isJSXText = node.type === 'JSXText';
        for (let item in map) {
          /** 由于建树的过程中包含合规词的建造, 因此命中合规词后不进行处理. */
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
          /** fix 操作默认替换的是敏感词对应的所有合规词中的第一项 */
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
            /** 符合区间重合或者和 fixed 存在交集 */
            if (hitStartPosition >= startIndex && hitEndPosition <= endIndex || (fixed && handleDetectOverlap({ start: startIndex, end: endIndex }, { start: hitStartPosition, end: hitEndPosition }))) {
              isOk = false;
              break;
            }
            if (!fixed && handleDetectOverlap({ start: startIndex, end: endIndex }, { start: hitStartPosition, end: hitEndPosition }, true)) {
              deleteStateIndex.add(i);
            }
          }
          if (isOk) {
            /** 扩展第四个参数存放差值, 用于后面做预计算坐标使用. */
            excute[4] = differenceLength;
            saveDeleteStateIndex.add(...deleteStateIndex);
            filterExcuteQueue.push(excute);
          }
        });
        /** 新旧发生位置冲突则需移除旧的 */
        [...saveDeleteStateIndex].filter(v => v).forEach(index => {
          delete saveCurrentState[index];
        });
        /** 新增新位置坐标 */
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
        /** 排序位置, 所得的结果不存在位置冲突的情况. */
        saveCurrentState = saveCurrentState.filter(v => v).sort((a, b) => a.loc[0] - b.loc[1]);
        let diffSum = 0;
        /** 预计算更新完之后的坐标 */
        saveCurrentState = saveCurrentState.map(item => {
          const { loc, diff = 0, fixed } = item;
          // 预计算 fix 之后的位置.
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
      Program() {
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
