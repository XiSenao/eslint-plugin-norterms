# eslint-plugin-norterms

Good standard word detection plug-in, through the configuration of the mapping between compliance words and non-compliance words to accurately detect the problem of improper words in the project.

## Note that

a fix is not immediately applied, and may not be applied at all if there are conflicts with other fixes. After applying fixes, ESLint will run all of the enabled rules again on the fixed code, potentially applying more fixes. This process will repeat up to 10 times, or until no more fixable problems are found. Afterwards, any remaining problems will be reported as usual.

## Installation

You'll first need to install [ESLint](http://eslint.org):

```
$ npm i eslint --save-dev
```

Next, install `eslint-plugin-norterms`:

```
$ npm install eslint-plugin-norterms --save-dev
```


## Normal Usage

Add `norterms` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
    "plugins": [
        "norterms"
    ]
}
```


Then configure the rules you want to use under the rules section.

```json
{
    "rules": {
        "norterms/replacement": ["error"]
    }
}
```

## Quick Usage
Create a new `.eslintrc` file 
```typescript
module.exports = {
    env: {
        browser: true,
    },
    globals: {
        _global: false,
    },
    extends: [],
    settings: {
        react: {
            version: '>= 15',
        },
    },
    plugins: ['norterms'],
    rules: {
        'norterms/replacement': ["error", { forceUpdateConfig: true, maxCacheTime: 24 * 60 * 60 * 1000 }]
    },
};

The second item of the rules array can pass the object options, Now the following parameters are supported.

interface NortermsOptions {
    /** force config update. default false. */
    forceUpdateConfig: boolean;
    /** config cache time. default 7 days, unit: ms. */
    maxCacheTime: number;
}

```



Then add the script to package.json, as shown below

```json
{
    "scripts": {
        "lint": "eslint -c [.eslintrc file path] --ext js,jsx,ts,tsx [target file] [--fix]",
    }
}
```

Then just need to execute the script to run it

## Quick Dev
```javascript
/** install dependence first  */
yarn pre

/** establish soft link */
yarn link:pre

/** execute eslint */
yarn lint

/** execute eslint --fix */
yarn lint:fix

/** start dev-pro */
yarn dev

```

## Supported Rules

* Fill in provided rules here

## Show
The mapping relationship of sensitive words is configured
```javascript
const option = [
  {
    name: '有赞E卡',
    suspSets: ['有赞e卡', '优赞E卡', '游赞E卡'],
    fixed: true,
  }, {
    name: 'Youzan',
    suspSets: ['youzan', 'YOUZAN', 'youZAN', '有赞e卡'],
    fixed: true,
  }, {
    name: 'MC卡',
    suspSets: ['WWE卡'],
  }, {
    name: 'zentold',
    suspSets: ['zent'],
    logPath: '/log/youzan'
  }
]
```
Assume the non-compliant copy is as follows
```javascript
console.log(`
          有 
 赞
 e
   卡 我
   是
     测 哦
 修许 有 
    赞 e  
          卡youzan W
  W        E     卡  
      ze
  nt      
      hellozen
      t
`);
```
Display after executing the `--fix` instruction
```javascript
console.log(`
          有赞E卡 我
   是
     测 哦
 修许 有赞E卡Youzan MC卡  
      zentold      
      hellozentold
`);
```


