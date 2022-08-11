import { create, all, MathType, BigNumber, ConfigOptions } from 'mathjs';
import { SlotModel, Setting, Mode, } from './type';

const config: ConfigOptions = {
    number: 'BigNumber'
};
const math = create(all, config);

const mystat = {
    /* 多項係数 */
    mulnom: function (x: BigNumber[]) {
        const n = math.sum(x) as BigNumber;
        let result = math.factorial(n) as BigNumber;
        for (let i = 0; i < x.length; i++) {
            result = math.divide(result, math.factorial(x[i])) as BigNumber;
        }
        return result;
    },
    /* 確率質量関数、尤度関数（多項分布） */
    pmf: function (x: BigNumber[], p: BigNumber[]) {
        let result = this.mulnom(x) as BigNumber;
        for (let i = 0; i < x.length; i++) {
            result = math.multiply(result, math.pow(p[i], x[i])) as BigNumber;
        }
        return result;
    },
    lhf: function (x: BigNumber[], p: BigNumber[]) {
        return this.pmf(x, p);
    },
};

export default mystat;
