import { SlotModel, Setting, Mode, UserInput, } from './type';
import { slotModelDataSources, userInputStr } from './const'
import util from './util';
import { BigNumber } from 'mathjs';

const ui = {
    /* HTML要素作成（イベント発生時に呼び出す想定） */
    modelSelect: function (slotModels: SlotModel[]) {
        const ms = document.querySelector('#model-select select');
        if (!ms) {
            console.log('model-select要素が見つかりません！ at ui.ts modelSelect()');
            return;
        }
        while (ms.firstChild) {
            ms.removeChild(ms.firstChild);
        }
        for (let i = 0; i < slotModels.length; i++) {
            const s = slotModels[i];
            const option = document.createElement('option');
            option.value = s.modelName;
            option.textContent = s.modelName;
            ms.appendChild(option);
        }
        if (!ms.firstChild) {
            console.log('model-selectの子要素が見つかりません！ at ui.ts modelSelect()');
            return;
        }
        (ms.firstChild as HTMLOptionElement).selected = true;
    },
    practicalValue: function (selectedSlotModel: SlotModel) {
        const pv = document.querySelector('#practical-value');
        if (!pv) {
            console.log('practical-value要素が見つかりません！ at ui.ts practicalValue()');
            return;
        }
        while (pv.firstChild) {
            pv.removeChild(pv.firstChild);
        }
        for (let midx = 0; midx < selectedSlotModel.modeNames.length; midx++) {
            const pvByMode = ui.practicalValueByMode(selectedSlotModel, midx);
            pv.appendChild(pvByMode);
        }
    },
    practicalValueByMode: function (selectedSlotModel: SlotModel, midx: number) {
        const pvByMode = document.createElement('div');
        pvByMode.id = `practical-value-${midx}`;
        pvByMode.classList.add('practical-value-by-mode');

        const firstChild = document.createElement('div');
        const firstChildSpan = document.createElement('span');
        firstChildSpan.textContent = selectedSlotModel.modeNames[midx];
        firstChild.appendChild(firstChildSpan);
        pvByMode.appendChild(firstChild);

        pvByMode.appendChild(ui.inputDataN(selectedSlotModel, midx));
        pvByMode.appendChild(ui.inputDataX(selectedSlotModel, midx));

        return pvByMode;
    },
    inputDataN: function (selectedSlotModel: SlotModel, midx: number) {
        const inputGroup = document.createElement('div');
        inputGroup.id = `input-data-n-${midx}`;
        inputGroup.classList.add('input-group');

        const span = document.createElement('span');
        span.classList.add('input-group-text');
        span.textContent = '試行回数';
        inputGroup.appendChild(span);

        const input = document.createElement('input');
        input.type = 'number';
        input.classList.add('form-control');
        //input.addEventListener('input', function () { ui.nOnInputHandler(this, midx) });
        inputGroup.appendChild(input);

        return inputGroup;
    },
    inputDataX: function (selectedSlotModel: SlotModel, midx: number) {
        const parent = document.createElement('div');
        parent.id = `nput-data-x-${midx}`;

        for (let eidx = 0; eidx < selectedSlotModel.elementNames[midx].length; eidx++) {
            const inputGroup = document.createElement('div');
            inputGroup.id = `input-data-x-${midx}-${eidx}`;
            inputGroup.classList.add('input-group');

            const span = document.createElement('span');
            span.classList.add('input-group-text');
            span.textContent = selectedSlotModel.elementNames[midx][eidx];
            inputGroup.appendChild(span);

            const input = document.createElement('input');
            input.type = 'number';
            input.classList.add('form-control');
            //input.addEventListener('input', function () { ui.xOnInputHandler(this, midx, eidx) });
            inputGroup.appendChild(input);

            parent.appendChild(inputGroup);
        }

        return parent;
    },
    estimatedResult: function (selectedSlotModel: SlotModel, lhRatio?: BigNumber[]) {
        const er = document.querySelector('#estimated-result');
        if (!er) {
            console.log('estimated-result要素が見つかりません！ at ui.ts estimatedResult()');
            return;
        }
        while (er.firstChild) {
            er.removeChild(er.firstChild);
        }

        const erHead = document.createElement('div');
        erHead.classList.add('estimated-result-head');
        erHead.textContent = '判別結果';
        er.appendChild(erHead);

        for (let sidx = 0; sidx < selectedSlotModel.settingNames.length; sidx++) {
            const element = selectedSlotModel.settingNames[sidx];
            const erMain = document.createElement('div');
            erMain.classList.add('estimated-result-main');

            const span = document.createElement('span');
            let tmp = (lhRatio ? lhRatio[sidx].toString() : '  0.00');
            let [left, right] = tmp.split('.');
            if (!left) left = '';
            if (!right) right = '';
            let leftLen = left.length;
            let rightLen = right.length;
            for (let i = 0; i < 3 - leftLen; i++) {
                left = '&nbsp;' + left;
            }
            for (let i = 0; i < 2 - rightLen; i++) {
                right = right + '0';
            }
            span.innerHTML = (left + '.' + right + '%');
            console.log((left + '.' + right + '%'));
            erMain.appendChild(span);

            er.appendChild(erMain);
        }
    },

    /* フォーム入力時のイベントハンドラー */
    modelSelectOnChangeHandler: function (eventTarget: HTMLSelectElement) {
        const modelName = eventTarget.value;
        const selectedSlotModel = util.searchSlotModelByModelName(slotModelDataSources, modelName);
        if (!selectedSlotModel) {
            console.log('選択機種が見つかりません！ at ui.ts modelSelectOnChangeHandler()');
            return;
        }
        this.practicalValue(selectedSlotModel);
    },
    nOnInputHandler: function (eventTarget: HTMLInputElement, midx: number) {
        userInputStr.n[midx] = eventTarget.value;
    },
    xOnInputHandler: function (eventTarget: HTMLInputElement, midx: number, eidx: number) {
        userInputStr.x[midx][eidx] = eventTarget.value;
    },
    estimateButtonOnClickHandler() {
        console.log('ボタン押された');

        // ユーザ入力値取得
        userInputStr.modelName = (document.querySelector('#model-select select') as HTMLSelectElement).value;
        const selectedSlotModel = util.searchSlotModelByModelName(slotModelDataSources, userInputStr.modelName);
        if (!selectedSlotModel) {
            console.log('選択機種が見つかりません！ at ui.ts estimateButtonOnClickHandler');
            return;
        }

        userInputStr.n = [];
        for (let mi = 0; mi < selectedSlotModel.modeNames.length; mi++) {
            const n = (document.querySelector(`#input-data-n-${mi} input`) as HTMLInputElement).value;
            userInputStr.n.push(n);
        }

        userInputStr.x = [];
        for (let mi = 0; mi < selectedSlotModel.modeNames.length; mi++) {
            userInputStr.x.push([]);
            for (let ei = 0; ei < selectedSlotModel.elementNames[mi].length; ei++) {
                const x = (document.querySelector(`#input-data-x-${mi}-${ei} input`) as HTMLInputElement).value;
                userInputStr.x[mi].push(x);
            }
        }

        // 尤度比計算、結果表示
        const lhRatio = util.lhRatio(userInputStr);
        ui.estimatedResult(selectedSlotModel, lhRatio);

    }
};

export default ui;
