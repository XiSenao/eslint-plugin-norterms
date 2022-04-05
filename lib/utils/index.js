/**
 *  type: 'array' 
 *  若 validate 返回一个对象, 则数组中的每一项都需要按照 validate 返回的对象来进行检测.
 *  若 validate 返回一个boolean, 则数组中的每一项直接通过 validate 函数来进行校验.
 *  
 *  type: 'object'
 *  validate 函数需要返回一个对象, 里面包含配置对象的属性.
 */
const CONFIG_REQUIRE_PROPERTY = {
	name: {
		type: 'string',
		require: true,
		validate (name) {
			return typeof name === 'string';
		}
	},
	logPath: {
		type: 'string',
		validate (_logPath) {
			return true;
		}
	},
	fullSuspSets: {
		type: 'string',
		validate (_logPath) {
			return true;
		}
	},
	option: {
		type: 'array',
		require: true,
		validate () {
			return {
				name: {
					type: 'string',
					require: true,
					validate (name) {
						return typeof name === 'string';
					}
				},
				suspSets: {
					type: 'array',
					require: true,
					validate (suspSets) {
						return typeof suspSets === 'string';
					}
				},
				description: {
					type: 'string',
					validate (_description) {
						return true;
					}
				},
				logPath: {
					type: 'string',
					validate (_logPath) {
						return true;
					}
				}
			}
		}
	}
};

const checkConfigLegal = (config = {}) => {
	if (typeof config !== 'object' || config === null) {
		return false;
	}
	const dfsCheck = (baseValidate, config) => {
		const params = Object.keys(baseValidate);
		for (let i = 0; i < params.length; ++i) {
			const key = params[i];
			const value = baseValidate[key];

			if (value.type === 'array' || value.type === 'object') {
				const validate = typeof value.validate === 'function' ? value.validate() : null;
				if (validate !== void 0) {
					if (value.type === 'object' && typeof validate === 'object') {
						/** 对象 */
						return dfsCheck(validate, config[key] || {});
					} else if (value.type === 'array' && typeof validate === 'object') {
						/** 数组对象 */
						const configArr = config[key] || [];
						let isValidatePass = true;
						for (let i = 0; i < configArr.length; ++i) {
							const configArrValue = configArr[i] || {};
							isValidatePass = isValidatePass && dfsCheck(validate, configArrValue);
						}
						if (!isValidatePass) return false;
					} else if (value.type === 'array' && typeof validate === 'boolean') {
						/** 数组存储基本数据类型 */
						const target = config[key] || [];
						/** 若为必填项获非必填项时传入值 */
						if ((value.require || target.length) && !target.every(item => value.validate(item))) {
							return false;
						}
					}
				}
			} else {
				/** 必须校验但校验不通过 */
				if (value.require && !value.validate(config[key])) {
					return false;
				}
				/** 非必需校验但存在而校验不通过 */
				if (!value.require && config[key] && !value.validate(config[key])) {
					return false;
				}
			}
		}
		return true;
	};
	return dfsCheck(CONFIG_REQUIRE_PROPERTY, config);
}


module.exports = {
	checkConfigLegal
}