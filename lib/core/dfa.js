const DEFALUT_CONFIG = require('./../../config/config');

const DFASTATUS = {
  UNINITIALIZED: 'uninitialized', // 未初始化
  INITIALIZING: 'initializing', // 初始化中(工作中)
  INITIALIZED: 'initialized', // 初始化完成(准备状态)
};
const LOGPATH = './logInstance/textSpecificationLog.log';

// 白名单字符不存在敏感树中.
const whiteList = ['▽', ' '];
const DivideWorld = '▽';

/**
 * 
 *  Efficient retrieval of sensitive words in copy.
 *  The instance has a built-in default configuration
 *  while the development can customize the configuration using the 'makeSensitiveMap' method
 *  The user-defined configuration will overwrite the original configuration.
 * 
 *  The following is a brief description of what attributes do:
 * 
 *  taskQueue:
 * 		{
 * 			txt: String, // 过滤后的目标文案
 *      originTxt: String, // 原文案
 * 			index: Number, // 未检索坐标
 *      originRow: Number, // 检索到当前文案的行数
 *      originIndex: Number, // 检索到当前文案的索引下标
 * 			endIndex: Number // 目标文本长度
 * 		}
 *   
 *  methodTaskQueue:
 *    {
 * 			type: String, // 执行方法类型
 * 			data: any // 方法携带的数据
 * 		}
 *  
 * 
 * 	@author Ashen <https://gitlab.qima-inc.com/chenjiaxiang>
 *  @package https://gitlab.qima-inc.com/chenjiaxiang/eslint-plugin-norterms
 * 
 */

class DFAContainer {
  constructor(config = DEFALUT_CONFIG) {
    /** 所有文案建树的根节点 */
    this.sensitiveSets = new Map();
    /** 敏感词和合规词汇的映射关系 */
    this.sensitiveWordListMap = new Map();
    /** 合规词汇和存储位置的映射关系(后者覆盖前者) */
    this.locationMap = new Map();
    /** 有限自动机目前所处的状态 */
    this.init = DFASTATUS.UNINITIALIZED;
    this.taskQueue = [];
    /** 未处理的任务队列 */
    this.methodTaskQueue = [];
    this.sensiMap = new Map();
    /** 敏感词集 */
    this.allSensitive = new Set();
    /** 合规词集 */
    this.allCompliance = new Set();
    this.initConfig(config, true);
  }

  get status() {
    return this.init;
  }

  set status(status) {
    this.init = status;
    /** 空闲时资源分配 */
    if (status === DFASTATUS.INITIALIZED && this.methodTaskQueue.length) {
      const { type, data } = this.methodTaskQueue.shift();
      switch (type) {
        case 'makeSensitiveMap':
          this.makeSensitiveMap(data);
          break;
        case 'doTaskQueue':
          this.doTaskQueue(data);
          break;
        default:
          break;
      }
    }
  }

  initConfig(config = {}, isVerify = false) {
    const { option = [] } = config;
    /** 建立所有敏感词和合规词之间的关系, 表示一个非合规词可以被哪些合规词所替换. */
    const initializeWord = (word, complianceWord) => {
      const sets = this.sensitiveWordListMap[word] || new Set();
      this.sensitiveWordListMap[word] = sets.add(complianceWord);
      this.allSensitive.add(word);
    }
    option.forEach(item => {
      const { name, suspSets = [], logPath = config.logPath || LOGPATH } = item;
      /** 建立合规词和日志路径之间的映射. TODO: 日志存储. */
      this.locationMap[name] = logPath;
      suspSets.forEach(word => {
        initializeWord(word, name);
      });
      initializeWord(name, name);
      /** 记录所有的合规词 */
      this.allCompliance.add(name);
    });
    isVerify && this.makeSensitiveMap([...this.allSensitive]);
  }

  checkSensitiveWord(target) {
    const { txt, index, endIndex, saveCurrentState } = target;
    let currentMap = this.sensitiveSets;
    let sensitiveWord = '';
    const feedback = {
      sensitiveWord: '',
      legalWords: [],
      isEnd: false,
      location: { startRow: -1, startColumn: -1, sourceStartIndex: -1, endRow: -1, endColumn: -1, sourceEndIndex: -1 }
    };
    /** 获取固定区域 */
    const banRect = saveCurrentState.filter(item => item.fixed).map(item => {
      return item.loc;
    });
    for (let i = index; i < endIndex; ++i) {
      const word = txt.charAt(i);
      target.sourceIndex += 1;
      if (whiteList.includes(word)) {
        if (word === DivideWorld) {
          target.originRow++;
          target.originIndex = 0;
        } else {
          target.originIndex++;
        }
        target.index = i + 1;
        continue;
      }
      if (banRect.find(item => {
        const [start, end] = item;
        /** 若当前坐标在禁用区内 */
        if (target.sourceIndex >= start && target.sourceIndex <= end) {
          return true;
        }
      })) {
        target.index = i + 1;
        target.originIndex++;
        break;
      }
      currentMap = currentMap.get(word);
      if (currentMap) {
        sensitiveWord += word;
        /** 记录起始敏感词坐标 */
        if (feedback.location.startRow === -1) {
          feedback.location.startRow = target.originRow;
          feedback.location.startColumn = target.originIndex;
          feedback.location.sourceStartIndex = target.sourceIndex;
        }
        feedback.location.endRow = target.originRow;
        feedback.location.endColumn = target.originIndex;
        feedback.location.sourceEndIndex = target.sourceIndex;
        if (currentMap.get('target')) {
          feedback.sensitiveWord = sensitiveWord;
          feedback.legalWords = [...currentMap.get('target')];
          target.index = i + 1;
        }
        target.originIndex++;
      } else if (this.sensitiveSets.has(word)) {
        /** 当 word 被树根部所命中, 则需退位, 否则会存在错失非合规词命中. */
        target.index = i;
        target.sourceIndex -= 1;
        break;
      } else {
        target.index = i + 1;
        target.originIndex++;
        break;
      }
      /** 存在遍历结束之后还是有树节点 */
      if (i === endIndex - 1) {
        feedback.isEnd = true;
      }
    }
    if (index >= endIndex) feedback.isEnd = true;
    return feedback;
  }

  /**
   * 	todo: 考虑是否需要细分任务级别资源调度.
   */
  doTaskQueue(noop) {
    let target = undefined;
    this.status = DFASTATUS.INITIALIZING;
    const map = new Map();
    /** 处理任务队列 */
    while ((target = this.taskQueue.shift())) {
      if (target === void 0 || target.index >= target.endIndex) break;
      let matchResult = undefined;
      /** 检索段落文案中所有的敏感词 */
      while ((matchResult = this.checkSensitiveWord(target))) {
        const { sensitiveWord, isEnd, legalWords, location } = matchResult;
        const { startRow, startColumn, sourceStartIndex, endRow, endColumn, sourceEndIndex } = location;
        if (isEnd && !sensitiveWord) break;
        if (sensitiveWord) {
          const resultSets = map[sensitiveWord];
          const position = {
            startRow,
            startColumn,
            sourceStartIndex,
            endRow,
            endColumn,
            sourceEndIndex,
          }
          if (!resultSets) {
            map[sensitiveWord] = {
              name: sensitiveWord,
              legalWords,
              targetCW: target.originTxt,
              queue: [position],
            };
          } else {
            map[sensitiveWord].queue.push(position);
          }
        }
      }
    }
    noop && noop(map);
    /** 可以继续调度其他任务 */
    this.status = DFASTATUS.INITIALIZED;
  }

  makeSensitiveMap(sensitiveWordList) {
    if (![DFASTATUS.UNINITIALIZED, DFASTATUS.INITIALIZED].includes(this.status)) {
      return this.methodTaskQueue.push({
        type: 'makeSensitiveMap',
        data: sensitiveWordList,
      });
    }

    if (!Array.isArray(sensitiveWordList)) {
      return this.initConfig(sensitiveWordList, true);
    }
    this.status = DFASTATUS.INITIALIZING;
    /** 根据提供的文案构建树, 构建复杂度O(n), n = sum(sensitiveWord). */
    for (const word of sensitiveWordList) {
      const { length } = word;
      let map = this.sensitiveSets;
      for (let i = 0; i < length; ++i) {
        const char = word.charAt(i);
        if (!map.get(char)) {
          const item = new Map();
          map.set(char, item);
        }
        map = map.get(char);
        if (i > length - 2) {
          const sets = map.get('target') || [];
          map.set('target', new Set([...sets, ...this.sensitiveWordListMap[word]]));
        }
      }
    }

    this.status = DFASTATUS.INITIALIZED;
  }

  filterSensitiveWord(txt = '', noop = null, saveCurrentState = []) {

    if (!(txt && typeof txt === 'string' && txt.trim())) return;
    const reg = new RegExp("\n", "g");
    /** 换行符使用特殊字符来进行替换, 方便解析. */
    const txtTrim = txt.replace(reg, DivideWorld);

    if (!(txtTrim && txtTrim.trim()) || (noop && typeof noop !== 'function')) return;
    this.taskQueue.push({
      txt: txtTrim,
      originTxt: txt,
      index: 0,
      originRow: 0,
      originIndex: 0,
      sourceIndex: 0,
      endIndex: txtTrim.length,
      saveCurrentState,
    });
    /** 非空闲阶段接收到任务暂时先存储在 methodTaskQueue 队列中. */
    if (this.status !== DFASTATUS.INITIALIZED) {
      return this.methodTaskQueue.push({
        type: 'doTaskQueue',
        data: noop,
      });
    }
    /** 闲置资源时触发任务. */
    this.doTaskQueue(noop);
  }
}

exports.default = new DFAContainer();
