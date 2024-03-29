import { BigNumber } from 'mathjs';

export type UserInput = {
    modelName: string,
    n: string[],
    x: string[][],
    w: string[],
};

export type SlotModel = {
    modelName: string,
    settingNames: string[],
    modeNames: string[],
    denominatorNamesByMode: string[],
    elementNamesByMode: string[][],
    table: Setting[],
};

export type Setting = Mode[];

export type Mode = (number | BigNumber)[];
