// 若启用检测服务，首次启动dev-server时自动拉取并解析所有可疑词汇集置 cert/suspicionCopywriting/sets.js 文件中。
/* 
    导入suspSets需遵循以下规则
        relative path:
            export default [
                'case1',
                'case2'
                ....
            ]
        url:
          ['case1', 'case2' ....]
     导入的fullSuspSets需遵循以下规则
         url:
             [
                 {
                     name: '有赞E卡',
                     suspSets: [target]
                 },
                 ......
             ]
     
*/

const option = [
  {
    "name": "登录",
    "suspSets": [
      "登陆"
    ],
    "logPath": "/log/youzan"
  },
  {
    "name": "请稍候",
    "suspSets": [
      "请稍后"
    ],
    "description": "单独使用时，使用“请稍候”，“请稍后”后面需有其他语句成分。“后”指较晚的，与“前”相对。“候”释义等候，故采用“候”。"
  },
  {
    "name": "确定",
    "suspSets": [
      "确认"
    ],
    "logPath": "/log/youzan",
    "description": "用于询问用户“确定……？”的提示语以及弹窗中的“确定”按钮。"
  },
  {
    "name": "浏览量",
    "suspSets": [
      "PV"
    ]
  },
  {
    "name": "访客数",
    "suspSets": [
      "UV"
    ]
  },
  {
    "name": "新建",
    "suspSets": [
      "新增"
    ],
    "description": "创建内容，如微页面、商品、会员、营销活动等。"
  },
  {
    "name": "日",
    "suspSets": [
      "号"
    ],
    "description": "描述日期时使用，如：15 日。"
  },
  {
    "name": "其他",
    "suspSets": [
      "其它"
    ]
  },
  {
    "name": "验证",
    "suspSets": [
      "校验"
    ],
    "description": "验证码，验证优惠券等。"
  },
  {
    "name": "字",
    "suspSets": [
      "字符"
    ],
    "description": "字数限制等说明中，使用“字”而非“字符”，字符对于商家来讲比较难以理解。"
  },
  {
    "name": "帐号",
    "suspSets": [
      "账号"
    ],
    "description": "帐号是用户在多用户操作系统中的用户名，用户需要向操作系统输入自己的身份证明（帐号或用户名）和个人专用证明（密码），获得访问系统中的一系列数据记录。不允许使用“账号”。"
  },
  {
    "name": "账户",
    "suspSets": [
      "帐户"
    ],
    "description": "账户多与钱相关，用于反映资产要素的增减变动情况及其结果。"
  },
  {
    "name": "阈值",
    "suspSets": [
      "阀值"
    ],
    "description": "阈（yù）值，指一个效应能够产生的最低值或最高值。"
  },
  {
    "name": "iOS",
    "suspSets": [
      "IOS",
      "ios"
    ],
    "description": "苹果公司开发的移动操作系统。"
  },
  {
    "name": "Android",
    "suspSets": [
      "android"
    ],
    "description": "安卓。"
  },
  {
    "name": "PC",
    "suspSets": [
      "Pc",
      "pc"
    ],
    "description": "个人电脑。"
  },
  {
    "name": "Web",
    "suspSets": [
      "web",
      "WEB"
    ],
    "description": "网页。"
  },
  {
    "name": "Pad",
    "suspSets": [
      "pad",
      "PAD"
    ],
    "description": "平板设备，如 iPad。"
  },
  {
    "name": "Phone",
    "suspSets": [
      "phone",
      "PHONE"
    ],
    "description": "手机，如 iPhone。"
  },
  {
    "name": "App",
    "suspSets": [
      "app",
      "APP"
    ],
    "description": "Application（应用程序）的缩写。"
  },
  {
    "name": "SaaS",
    "suspSets": [
      "saas",
      "Sass"
    ],
    "description": "Software-as-a-Service（软件即服务）的缩写。"
  },
  {
    "name": "BBS",
    "suspSets": [
      "Bbs",
      "bbs"
    ],
    "description": "Bulletin Board System（论坛）的缩写。"
  },
  {
    "name": "POS",
    "suspSets": [
      "Pos",
      "pos"
    ],
    "description": "Point of sale（销售终端）的缩写。"
  },
  {
    "name": "ERP",
    "suspSets": [
      "Erp",
      "erp"
    ],
    "description": "Enterprise Resource Planning（企业资源计划）的缩写。"
  },
  {
    "name": "API",
    "suspSets": [
      "Api",
      "api"
    ],
    "description": "Application Programming Interface（应用程序编程接口）的缩写。"
  },
  {
    "name": "VIP",
    "suspSets": [
      "Vip",
      "vip"
    ],
    "description": "Very important person（贵宾）的缩写。"
  },
  {
    "name": "SKU",
    "suspSets": [
      "Sku",
      "sku"
    ],
    "description": "Stock Keeping Unit（库存量单位）的缩写。"
  },
  {
    "name": "SPU",
    "suspSets": [
      "Spu",
      "spu"
    ],
    "description": "Standard Product Unit （标准化产品单元）的缩写。"
  },
  {
    "name": "DAU",
    "suspSets": [
      "Dau",
      "dau"
    ],
    "description": "Daily Active User（日活跃用户数量）的缩写。"
  },
  {
    "name": "你",
    "suspSets": [
      "您"
    ],
    "description": "提示语或功能介绍说明中，称呼使用者。"
  },
  {
    "name": "交易成功",
    "suspSets": [
      "交易完成"
    ],
    "description": "订单成功交易。"
  },
  {
    "name": "交易关闭",
    "suspSets": [
      "交易失败"
    ],
    "description": "订单因某些情况关闭，未完成交易。"
  },
  {
    "name": "快递员",
    "suspSets": [
      "配送员"
    ],
    "description": "物流配送人员。"
  },
  {
    "name": "骑手",
    "suspSets": [
      "配送员",
      "外卖员"
    ],
    "description": "外卖配送人员。"
  },
  {
    "name": "订单编号",
    "suspSets": [
      "订单号",
      "订单号码"
    ]
  },
  {
    "name": "退款编号",
    "suspSets": [
      "退款号",
      "退款单号"
    ]
  },
  {
    "name": "收货人",
    "suspSets": [
      "收件人"
    ]
  },
  {
    "name": "同城配送",
    "suspSets": [
      "同城送",
      "同城配"
    ],
    "description": "同城配送的配送方式。"
  },
  {
    "name": "制单时间",
    "suspSets": [
      "制单日期"
    ],
    "description": "单据制作时间。"
  },
  {
    "name": "买家留言",
    "suspSets": [
      "买家备注"
    ]
  },
  {
    "name": "商家备注",
    "suspSets": [
      "商家留言"
    ]
  },
  {
    "name": "申请退款",
    "suspSets": [
      "申请退货"
    ]
  },
  {
    "name": "退款原因",
    "suspSets": [
      "退货原因"
    ],
    "description": "买家填写的退款说明。"
  }
]

const config = {
  name: 'wsc-pc-cert',
  logPath: './sets', // 无指向结果集输出日志路径,默认路径: ./logInstance/textSpecificationLog.log
  // fullSuspSets: 'url',
  option
}

module.exports = config;