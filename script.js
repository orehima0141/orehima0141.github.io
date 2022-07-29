/*
memo:
    あり
        多項係数（組み合わせの数）

    なし
        確率質量関数、尤度関数
        分散（偏差）




    標本 = { サンプル1, サンプル2, サンプル3, ... }
    標準偏差sd: 個々のサンプルのばらつき
    標準誤差se: 標本平均値のばらつき

    => 標準誤差率 ~= 標本の精度の高さ、とできる？

    標準誤差率: 標準誤差 / sqrt(標本平均) = se / sqrt(m) = sqrt(sd^2 / n) / m = sqrt(sd^2 / nm)
    変動係数: 標準偏差 / 標本平均 = sd / m = sqrt(sd^2) / m

    そもそも尤度 ~= 生起確率なんだから "R(x,y) = P(x) * Q(y)" を計算するのでいいのでは？？？

    => R(x,y | 設定a) = P(x | 設定a) * Q(y | 設定a) として、各設定で尤度比調べれば良いのでは？？？？？？？？？？？
*/

/* bignumber定数 */
const one = math.bignumber(1);


/* 台データ（データ元） */
/*
    レギュレーション
    type: 'SlotDataSource'
    modelName: 日本語文字列
    settingNames: 設定名のリスト
    flagNames: フラグ名のリスト、各フラグが互いに排他関係にあること、はずれフラグは含まないものとする
    ptable: 各設定におけるフラグ成立確率、float、ptable[設定][フラグ]=>成立確率、はずれフラグは含まないものとする
*/
const slotDataSources = [
    {
        type: 'SlotDataSource',
        modelName: 'アイムジャグラー',
        settingNames: ['設定_1', '設定_2', '設定_3', '設定_4', '設定_5', '設定_6',],
        flagNames: ['grape', 'singleBig', 'cherryBig', 'singleReg', 'cherryReg',],
        ptable: [
            [1 / 6.02, 1 / 389.2, 1 / 915.8, 1 / 633.4, 1 / 1439.3,],
            [1 / 6.02, 1 / 381.5, 1 / 920.0, 1 / 568.7, 1 / 1344.1,],
            [1 / 6.02, 1 / 381.5, 1 / 920.0, 1 / 471.4, 1 / 1111.1,],
            [1 / 6.02, 1 / 370.0, 1 / 863.2, 1 / 446.3, 1 / 1071.1,],
            [1 / 6.02, 1 / 370.0, 1 / 863.2, 1 / 361.7, 1 / 864.1,],
            [1 / 5.78, 1 / 361.7, 1 / 864.1, 1 / 361.7, 1 / 864.1,],
        ],
    },
];

function validateSlotDataSource(slotDataSource) {
    if (slotDataSource
        || slotDataSource.type || slotDataSource.type !== 'SlotDataSouce'
        || slotDataSource.modelName || slotDataSource.modelName !== ''
        || slotDataSource.settingNames || slotDataSource.settingNames != []
        || slotDataSource.flagNames || slotDataSource.flagNames !== []
        || slotDataSource.ptables
        || slotDataSource.ptables.length !== slotDataSource.settingNames.length
        || slotDataSource.ptables[0]
        || slotDataSource.ptables[0].length !== slotDataSource.flagNames.length
    ) {
        throw new Error('validation error (SlotDataSource)');
    }
}

function modelNameMapToSlotDataSource(modelName) {
    const results = slotDataSources.filter((s) => {
        return (s.modelName === modelName);
    });
    return results ? results[0] : null;
}

/* 台データのptableを数値計算用にマッピング（ハズレ確率の追加） */
function ptableMapForCalc(ptable) {
    const newPtable = math.bignumber(ptable);
    for (let s = 0; s < newPtable.length; s++) {
        const sum = math.sum(newPtable[s]);
        const otherp = math.subtract(one, sum);
        newPtable[s].push(otherp);
    }
    return newPtable;
}

/* ユーザ入力値 */
const userInputData = {
    modelName: '',
    n: 0,
    x: [],
};

/* ユーザ入力値を数値計算用にマッピング */
function nMapForCalc(n) {
    return math.bignumber(n);
}
function xMapForCalc(n, x) {
    const n_ = math.bignumber(n);
    const x_ = math.bignumber(x);
    const sum = math.sum(x_);
    const other = math.subtract(n_, sum);
    x_.push(other);
    return x_;
}

/* 数値計算関数定義 */
const mathp = {
    /* 多項係数 */
    mulnom: function (x) {
        const n = math.sum(x);
        let result = math.factorial(n);
        for (let i = 0; i < x.length; i++) {
            // mulnom = (((n! / x[0]!) / x[1]!) ...x[n-1])
            result = math.divide(result, math.factorial(x[i]));
        }
        return result;
    },
    /* 確率質量関数、尤度関数 */
    pmf: function (x, p) {
        let result = this.mulnom(x);
        for (let i = 0; i < x.length; i++) {
            // mulnom(x) * p[0]^x[0] * p[1]^x[1] * ...
            result = math.multiply(result, math.pow(p[i], x[i]));
        }
        return result;
    },
    lhf: function (x, p) {
        return this.pmf(x, p);
    },
    /* 尤度比 */
    lhr: function (x, ptable) {
        const lh = [];
        for (let i = 0; i < ptable.length; i++) {
            lh.push(this.lhf(x, ptable[i]));
        }
        const lhr_ = math.divide(lh, math.sum(lh));
        return lhr_;
    }
}

/* valication入力値 */
function validUserInputData() {
    validSlotName();
    validN();
    validX();
}
function validSlotName() {
    const slotModel = modelNameMapToSlotDataSource(userInputData.modelName);
    if (!slotModel) throw new Error('機種名前がおかしいぞ');
}
function validN() {
    if (!userInputData.n || Number.isNaN(userInputData.n)) throw new Error('試行回数がおかしいぞ');
}
function validX() {
    if (!userInputData.x || userInputData.x.length === 0) throw new Error('判別要素がおかしいぞ');
    for (let i = 0; i < userInputData.x.length; i++) {
        if (!Number.isInteger(userInputData.x[i])) throw new Error('判別要素' + i + 'がおかしいぞ');
        if (userInputData.x[i] < 0) throw new Error('判別要素' + i + 'がおかしいぞ');
    }
}

/* UI初期化 */
function resetModelSelect() {
    //pulldown
    const modelSelect = document.querySelector('#model-select select');
    while (modelSelect.firstChild) {
        modelSelect.removeChild(modelSelect.firstChild);
    }
    for (let i = 0; i < slotDataSources.length; i++) {
        const s = slotDataSources[i];
        const option = document.createElement('option');
        option.value = s.modelName;
        option.textContent = s.modelName;
        modelSelect.appendChild(option);
    }
    if (modelSelect.firstChild) modelSelect.firstChild.selected = true;
}
function resetInputDataN() {
    const input = document.querySelector('#input-data-n input');
    input.textContent = null;
}
function resetInputDataX() {
    const flagNames = modelNameMapToSlotDataSource(userInputData.modelName).flagNames;
    console.log(flagNames);
    const parent = document.querySelector('#input-data-x');
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }

    for (let i = 0; i < flagNames.length; i++) {
        const flagName = flagNames[i];

        const inputGroup = document.createElement('div');
        inputGroup.classList.add('input-group');

        const span = document.createElement('span');
        span.classList.add('input-group-text');
        span.textContent = flagName;
        inputGroup.appendChild(span);

        const input = document.createElement('input');
        input.type = 'text';
        input.classList.add('form-control');
        input.addEventListener('input', function () { xOnInputHandler(this, i) });
        inputGroup.appendChild(input);

        parent.appendChild(inputGroup);
    }
}

/* 試行回数、判別要素の初期化 */
function resetUserInputData() {
    userInputData.modelName = document.querySelector('#model-select select').value;
    const slotModel = modelNameMapToSlotDataSource(userInputData.modelName);

    userInputData.n = 0;

    const x = Array(slotModel.flagNames.length).fill(0);
    for (let i = 0; i < x.length; i++) {
        x[i] = userInputData.x[i];
    }
    userInputData.x = x;
}

/* フォーム入力時のイベントハンドラー */
function modelSelectOnChangeHandler(event) {
    // 入力情報更新
    userInputData.modelName = event.value;
    // 機種が変わるので試行回数、判別要素初期化
    resetUserInputData();
}
function nOnInputHandler(event) {
    userInputData.n = Number(event.value);
}
function xOnInputHandler(event, index) {
    console.log(event);
    console.log(index);
    userInputData.x[index] = Number(event.value);
    console.log(userInputData.x[index]);
}
function calcButtonOnClickHandler() {
    // validation
    validUserInputData();
    // 尤度比を求めるためのパラメータ用意
    const slotModel = modelNameMapToSlotDataSource(userInputData.modelName);
    const ptable = ptableMapForCalc(slotModel.ptable);
    const n = nMapForCalc(userInputData.n);
    const x = xMapForCalc(userInputData.n, userInputData.x);

    // 尤度比
    let lhr = mathp.lhr(x, ptable);
    lhr = math.round(lhr, 4);
    lhr = math.multiply(lhr, math.bignumber(100));

    // 判別結果表示
    const elements = document.querySelectorAll('#calc-result > .calc-result-main');
    console.log(elements.length);
    for (let i = 0; i < lhr.length; i++) {
        const lh = lhr[i];
        const str = slotModel.settingNames[i] + ' : ' + lh.toString().padStart(5, ' ') + '%';
        console.log(str);
        elements[i].innerHTML = str;
    }
}

window.onload = function () {
    resetUserInputData();
    resetModelSelect();
    resetInputDataN();
    resetInputDataX();
}
