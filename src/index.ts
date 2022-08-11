import { create, all, MathType, BigNumber, ConfigOptions } from 'mathjs';
import mystat from './mystat';
import { SlotModel, Setting, Mode, UserInput, } from './type';
import { one, zero, hundred, slotModelDataSources, } from './const';
import util from './util'
import ui from './ui'

const config: ConfigOptions = {
    number: 'BigNumber'
};
const math = create(all, config);

function __calc__(userInput: UserInput) {
    const slotModel = util.cloneSlotModel(
        util.searchSlotModelByModelName(slotModelDataSources, userInput.modelName) as SlotModel
    );

    let lhRatio: BigNumber[] = [];
    let lhTable: BigNumber[][] = [];
    for (let si = 0; si < slotModel.settingNames.length; si++) {
        let lhBySetting: BigNumber = one;
        lhTable.push([]);
        for (let mi = 0; mi < slotModel.modeNames.length; mi++) {
            let includeFlags: boolean[] = util.createIncludeFlags(userInput.n[mi], userInput.x[mi]);
            let n: BigNumber = math.bignumber(userInput.n[mi]);
            let x: BigNumber[] = util.filterX(userInput.x[mi], includeFlags).map((e) => math.bignumber(e));
            x.push(math.subtract(n, math.sum(x) as BigNumber));
            let p: BigNumber[] = util.filterP(slotModel.table[si][mi], includeFlags).map((e) => math.bignumber(e));
            p.push(math.subtract(one, math.sum(p) as BigNumber));

            let lhByMode: BigNumber = one;
            lhByMode = mystat.lhf(x, p);
            lhTable[si].push(math.bignumber(lhByMode));
            lhBySetting = math.multiply(lhBySetting, lhByMode) as BigNumber;
        }
        lhRatio.push(lhBySetting);
    }

    let weight: BigNumber[] = userInput.w.map((e) => math.bignumber(e));
    lhRatio = util.weight(lhRatio, weight);

    lhRatio = util.normalizeRatio(lhRatio);

    lhRatio = math.round(lhRatio, 4);
    lhRatio = math.multiply(lhRatio, hundred) as BigNumber[];
    for (let i = 0; i < lhRatio.length; i++) {
        const lhstr = lhRatio[i].toString().padStart(5, ' ') + '%';
        console.log(lhstr);
    }
}

function __simulate__(userInput: UserInput) {
    const slotModel = util.cloneSlotModel(
        util.searchSlotModelByModelName(slotModelDataSources, userInput.modelName) as SlotModel
    );

    for (let si = 0; si < slotModel.settingNames.length; si++) {
        let lhBySetting: BigNumber = one;
        for (let mi = 0; mi < slotModel.modeNames.length; mi++) {
            let includeFlags: boolean[] = util.createIncludeFlags(userInput.n[mi], userInput.x[mi]);
            let n: BigNumber = math.bignumber(userInput.n[mi]);
            let p: BigNumber[] = util.filterP(slotModel.table[si][mi], includeFlags).map((e) => math.bignumber(e));
            p.push(math.subtract(one, math.sum(p) as BigNumber));
            p = math.cumsum(p) as BigNumber[];

            const x: BigNumber[] = Array<BigNumber>(p.length).fill(zero);
            const rand: BigNumber = math.bignumber(math.random());
            for (let tryNum = 0; tryNum < math.number(n); tryNum++) {
                let elemIndex: number = p.length - 1;
                for (let ei = 0; ei < p.length; ei++) {
                    if (math.compare(rand, p[ei]) <= 0) {
                        elemIndex = ei;
                        break;
                    }
                }
                x[elemIndex] = math.add(x[elemIndex], one);
            }



        }
    }
}

/*
const userInputIm: UserInput = {
    modelName: 'アイムジャグラー',
    n: ['3000'],
    x: [['500', '10', '5', '5', '5',]],
    w: ['1', '1', '1', '1', '1', '1'],
};
const userInputHanabi1: UserInput = {
    modelName: '新ハナビ（RTリプレイ判別版）',
    n: ['3000', '143', '220', '319', '81'],
    x: [
        ['201', '192', '56', '1', '30', '155', '11', '11', '9'],
        ['25', '46'],
        ['18', '30', '129'],
        ['35', '0'],
        ['10', '0'],
    ],
    w: ['1', '1', '1', '1'],
};
const userInputHanabi2: UserInput = {
    modelName: '新ハナビ（RT簡易版）',
    n: ['3000', '143', '220', '319', '81'],
    x: [
        ['201', '192', '56', '1', '30', '155', '11', '11', '9'],
        ['25', '46'],
        ['18', '159'],
        ['35', '0'],
        ['10', '0'],
    ],
    w: ['1', '1', '1', '1'],
};
__calc__(userInputHanabi1); console.log();
__calc__(userInputHanabi2); console.log();

*/

window.addEventListener('load', function () {
    // DOM初期化
    const modelSelect = (document.querySelector('#model-select select') as HTMLSelectElement);
    modelSelect.addEventListener('change', function (e) {
        ui.modelSelectOnChangeHandler(e.target as HTMLSelectElement);
    });
    ui.modelSelect(slotModelDataSources);
    const modelName = (document.querySelector('#model-select select') as HTMLSelectElement).value;
    const selectedSlotModel = util.searchSlotModelByModelName(slotModelDataSources, modelName);
    if (!selectedSlotModel) {
        console.log('選択機種が見つかりません！ at index.ts window.addEventListener()');
        return;
    }
    ui.practicalValue(selectedSlotModel);
    const estimateButton = (document.querySelector('#estimate-button button') as HTMLButtonElement);
    estimateButton.addEventListener('click', function () {
        ui.estimateButtonOnClickHandler();
    });
});
