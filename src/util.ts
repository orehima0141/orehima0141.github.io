import { create, all, BigNumber, ConfigOptions } from 'mathjs';
import { SlotModel, Setting, Mode, UserInput, } from './type';
import { hundred, one, slotModelDataSources } from './const';
import mystat from './mystat';

const config: ConfigOptions = {
    number: 'BigNumber'
};
const math = create(all, config);

const util = {
    cloneSlotModel: function (s: SlotModel) {
        const clone: SlotModel = JSON.parse(JSON.stringify(s));
        return clone;
    },

    searchSlotModelByModelName: function (slotDataSources: SlotModel[], modelName: string) {
        const results = slotDataSources.filter((s) => {
            return (s.modelName === modelName);
        });
        return results ? this.cloneSlotModel(results[0]) : null;
    },

    tableMapForCalc: function (s: SlotModel) {
        for (let sidx = 0; sidx < s.settingNames.length; sidx++) {
            for (let midx = 0; midx < s.modeNames.length; midx++) {
                s.table[sidx][midx] = math.bignumber(s.table[sidx][midx]);
            }
        }
    },

    normalizeRatio: function (r: BigNumber[]) {
        const sum = math.sum(r) as BigNumber;
        const normalizedRatio = math.divide(r, sum) as BigNumber[];
        return normalizedRatio;
    },

    weight: function (x: BigNumber[], w: BigNumber[]) {
        const weightedData = [];
        for (let i = 0; i < x.length; i++) {
            weightedData.push(math.multiply(x[i], w[i]) as BigNumber);
        }
        return weightedData;
    },

    fractionalStr: function (p: number | BigNumber, digit?: number) {
        if (math.isZero(p)) return '0';
        if (!digit) digit = 3;
        let denominator = math.divide(one, p) as BigNumber;
        denominator = math.round(denominator, digit);
        return `1/${denominator.toString()}`;
    },

    nMapForCalc: function (n: string) {
        return math.bignumber(n);
    },

    xMapForCalc: function (n: string, x: string[]) {
        const n_ = math.bignumber(n);
        const x_ = x.map((e) => math.bignumber(e));
        const sum = math.sum(x_) as BigNumber;
        const other = math.subtract(n_, sum) as BigNumber;
        x_.push(other);
        return x_;
    },

    createIncludeFlags: function (uin: string, uix: string[]) {
        const includeFlags: boolean[] = [];
        for (let i = 0; i < uix.length; i++) {
            if (!(uin) || uin === '') {
                includeFlags.push(false);
            } else if (!(uix[i]) || uix[i] === '') {
                includeFlags.push(false);
            } else {
                includeFlags.push(true);
            }
        }
        return includeFlags;
    },

    filterX: function (x: (string | BigNumber)[], includeFlags: boolean[]) {
        const filteredx: (string | BigNumber)[] = [];
        for (let i = 0; i < x.length; i++) {
            if (includeFlags[i]) {
                filteredx.push(x[i]);
            }
        }
        return filteredx;
    },
    filterP: function (p: (number | BigNumber)[], includeFlags: boolean[]) {
        const filteredp: (number | BigNumber)[] = [];
        for (let i = 0; i < p.length; i++) {
            if (includeFlags[i]) {
                filteredp.push(p[i]);
            }
        }
        return filteredp;
    },
    lhRatio: function (userInput: UserInput) {
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

        userInput.w = Array<string>(slotModel.settingNames.length).fill('1');
        let weight: BigNumber[] = userInput.w.map((e) => math.bignumber(e));
        lhRatio = util.weight(lhRatio, weight);

        lhRatio = util.normalizeRatio(lhRatio);

        lhRatio = math.round(lhRatio, 4);
        lhRatio = math.multiply(lhRatio, hundred) as BigNumber[];
        for (let i = 0; i < lhRatio.length; i++) {
            const lhstr = lhRatio[i].toString().padStart(5, ' ') + '%';
            console.log(lhstr);
        }

        //return [lhRatio, lhTable];
        return lhRatio;
    }
}

export default util;

/* float to bignumber */

/*
    (ユーザ入力, 台データ) => 必要な数列
    ex1) ユーザが全部入力
        データ削るところなし
        x: [100, 2, 2]
        p: [1/6, 1/250, 1/300]
    ex2) ユーザが"ぶどう"未入力
        ぶどうの実践値、ぶどう確率を削除
        x: [2, 2]
        p: [1/250, 1/300]


    ユーザ入力
    ['要素1','要素2','要素3',...]
    ['true','false','true',...]     <- 入力したかどうか（その要素使うかどうか）

    Li = lhf([x1, x2, ...], [p1, p2, ...])
    L = L1 * L2 * L3 * ...


*/
