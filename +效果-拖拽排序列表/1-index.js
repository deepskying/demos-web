// -----------------------------------------------------------------------------------------------------------------------------------------------------基于定位
class DragBasePosition {
    // desc : 注册拖拽事件,'insert' | 'swap'用于控制是交换效果还是插入效果
    // step0 前置工作,容器响应释放
    // step2 : 初始化排序
    // step3: 注册拖拽事件
    static register(box, effect, real = false) {
        const EFFECT = effect;
        // step0 前置工作,容器响应释放
        box.ondragenter = (e) => {
            e.preventDefault();
        };
        box.ondragover = (e) => {
            e.preventDefault();
        };
        // step1 准备数据结构
        const map = new Map();
        for (let i = 0; i < box.children.length; i++) {
            const el = box.children[i];
            map.set(el, i);
        }
        // step2 : 初始化排序
        this.order(map);
        // step3: 注册拖拽事件
        for (const el of box.children) {
            if (real) {
                if (EFFECT === "swap")
                    this.register_drag_target_swap_real(map, el);
                else
                    this.register_drag_target_insert_real(map, el);
            }
            else {
                if (EFFECT === "swap")
                    this.register_drag_target_swap(map, el);
                else
                    this.register_drag_target_insert(map, el);
            }
        }
    }
    // desc : 根据map初始化排序
    static order(map) {
        for (const [el, index] of map) {
            const offset = this.sum_translate(map, index);
            el.style.transform = `translateX(${offset}px)`;
        }
    }
    // desc : 获取第index元素的偏移量
    static sum_translate(map, index) {
        let sum = 0;
        for (const [el, idx] of map) {
            if (idx < index) {
                const w = el.getBoundingClientRect().width;
                sum += w;
            }
        }
        return sum;
    }
    // desc : 交换效果
    static register_drag_target_swap(map, el) {
        el.ondragstart = function (e) {
            var _a;
            let pos_drag = map.get(el);
            if (typeof pos_drag === "number")
                (_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData("text", `${pos_drag}`);
        };
        // 释放时交换两个元素的位置
        el.ondrop = function (e) {
            var _a;
            let pos_current = map.get(el);
            const pos_drag = Number((_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.getData("text"));
            if (typeof pos_current !== "number")
                return;
            for (const [item, index] of map) {
                if (index === pos_drag) {
                    map.set(item, pos_current);
                    map.set(el, pos_drag);
                    DragBasePosition.order(map);
                    break;
                }
            }
        };
    }
    // desc : 插入效果
    static register_drag_target_insert(map, el) {
        el.ondragstart = function (e) {
            var _a;
            let pos_drag = map.get(el);
            if (typeof pos_drag !== "number")
                return;
            (_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData("text", `${pos_drag}`);
        };
        el.ondrop = function (e) {
            var _a;
            let pos_current = map.get(el);
            const pos_drag = Number((_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.getData("text"));
            let target;
            for (const [el, index] of map) {
                if (index === pos_drag)
                    target = el;
            }
            if (!target)
                return;
            if (typeof pos_current !== "number")
                return;
            let from = pos_drag > pos_current ? "right" : "left"; //判断拖拽目标是从左边过来还是从右边过来
            // 如果拖拽目标从左边过来,则,拖拽目标要放在pos_current,释放目标到pos_current-1,元素位置在区间[pos_drag,pos_current]全部-1
            // 如果拖拽目标从右边过来,则拖拽目标要放在pos_current,释放目标pos_current+1,元素位置在区间[pos_current,pos_drag]全部+1
            for (const [el, index] of map) {
                if (from === "left" && index >= pos_drag && index <= pos_current)
                    map.set(el, index - 1);
                else if (from === "right" && index >= pos_current && index <= pos_drag)
                    map.set(el, index + 1);
            }
            map.set(target, pos_current);
            DragBasePosition.order(map);
        };
    }
    // desc : 交换效果-实时
    static register_drag_target_swap_real(map, el) {
        el.ondragstart = function (e) {
            let pos_drag = map.get(el);
            DragBasePosition.scope_real.pos_drag = pos_drag;
            // if (typeof pos_drag === "number") e.dataTransfer?.setData("text", `${pos_drag}`);
        };
        // 释放时交换两个元素的位置
        el.ondragenter = function (e) {
            let pos_current = map.get(el);
            const pos_drag = DragBasePosition.scope_real.pos_drag;
            if (pos_drag === pos_current)
                return;
            if (typeof pos_current !== "number")
                return;
            for (const [item, index] of map) {
                if (index === pos_drag) {
                    map.set(item, pos_current);
                    map.set(el, pos_drag);
                    DragBasePosition.scope_real.pos_drag = pos_current;
                    DragBasePosition.order(map);
                    break;
                }
            }
        };
    }
    // desc : 插入效果-实时
    static register_drag_target_insert_real(map, el) {
        el.ondragstart = function (e) {
            let pos_drag = map.get(el);
            DragBasePosition.scope_real.pos_drag = pos_drag;
        };
        el.ondrag = (e) => { console.log('xxxxx'); };
        el.ondragenter = function (e) {
            let pos_current = map.get(el);
            const pos_drag = DragBasePosition.scope_real.pos_drag;
            if (pos_current === pos_drag)
                return;
            let target;
            for (const [el, index] of map) {
                if (index === pos_drag)
                    target = el;
            }
            if (!target)
                return;
            if (typeof pos_current !== "number")
                return;
            let from = pos_drag > pos_current ? "right" : "left"; //判断拖拽目标是从左边过来还是从右边过来
            // 如果拖拽目标从左边过来,则,拖拽目标要放在pos_current,释放目标到pos_current-1,元素位置在区间[pos_drag,pos_current]全部-1
            // 如果拖拽目标从右边过来,则拖拽目标要放在pos_current,释放目标pos_current+1,元素位置在区间[pos_current,pos_drag]全部+1
            for (const [el, index] of map) {
                if (from === "left" && index >= pos_drag && index <= pos_current)
                    map.set(el, index - 1);
                else if (from === "right" && index >= pos_current && index <= pos_drag)
                    map.set(el, index + 1);
            }
            map.set(target, pos_current);
            DragBasePosition.scope_real.pos_drag = pos_current; // 这里要注意修改当前拖拽目标的位置了,因为它在实时变化
            DragBasePosition.order(map);
        };
    }
}
DragBasePosition.scope_real = {
    pos_drag: undefined,
};
class Drag {
    // desc : 初始化拖动
    // step1 : 容器的拖拽事件
    // step2 : 初始化数据结构
    static register(el, effect) {
        var _a;
        const scope = {
            map: new Map(),
            pos_drag: undefined,
            drag_target: undefined,
            pd: 0,
        };
        const pd2 = (_a = el.firstElementChild) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect().x;
        if (pd2)
            scope.pd = pd2;
        // step1
        el.ondragenter = (e) => {
            e.preventDefault();
        };
        el.ondragover = (e) => {
            e.preventDefault();
        };
        const children = el.children;
        for (let i = 0; i < children.length; i++) {
            const item = children[i];
            scope.map.set(item, i);
            if (effect === "swap")
                this.dep_register_drag_swap_real(scope, item);
            else
                this.dep_register_drag_insert_real(scope, item);
        }
    }
    // desc : 获取第index元素的偏移量
    static sum_translate(map, index) {
        let sum = 0;
        for (const [el, idx] of map) {
            if (idx < index) {
                const w = el.getBoundingClientRect().width;
                sum += w;
            }
        }
        return sum;
    }
    // desc : 用于计算一个元素的原始位置
    static get_origin_x(el) {
        const rect = el.getBoundingClientRect();
        const matrix = window.getComputedStyle(el).transform;
        if (!matrix || matrix === "none")
            return rect.x;
        const translatex = Number(matrix.split(",").slice(-2, -1)[0]);
        return rect.x - translatex;
    }
    // desc : 排序一个元素
    // step1 : 先获取元素的索引位置
    // step2 : 计算元素的偏移量,
    static order_one(scope, el) {
        const { map, pd } = scope;
        // step1
        const index = map.get(el);
        if (typeof index !== "number")
            return;
        // step2
        const sum = this.sum_translate(map, index);
        const offset = sum + pd - this.get_origin_x(el);
        el.style.transform = `translateX(${offset}px)`;
    }
    // desc : 排序所有元素
    static order_dep(scope) {
        const { map } = scope;
        for (const [el, idx] of map)
            this.order_one(scope, el);
    }
    // 交换效果-实时
    static dep_register_drag_swap_real(scope, el) {
        const { map } = scope;
        el.ondragstart = (e) => {
            const pos = map.get(el);
            scope.pos_drag = pos;
            scope.drag_target = el;
        };
        // 释放时交换两个元素的位置
        el.ondragenter = function (e) {
            let pos_current = map.get(el);
            const pos_drag = scope.pos_drag;
            if (pos_drag === pos_current)
                return;
            if (typeof pos_current !== "number")
                return;
            const item = scope.drag_target;
            if (!item)
                return;
            if (typeof scope.pos_drag !== "number")
                return;
            map.set(item, pos_current);
            map.set(el, scope.pos_drag);
            scope.pos_drag = pos_current;
            Drag.order_dep(scope);
        };
    }
    // 插入效果-实时
    static dep_register_drag_insert_real(scope, el) {
        const { map } = scope;
        el.ondragstart = (e) => {
            const pos = map.get(el);
            scope.pos_drag = pos;
            scope.drag_target = el;
        };
        el.ondragenter = dodrag;
        // el.ondragover=dodrag
        function dodrag(e) {
            let pos_current = map.get(el);
            // if(scope.going.has(pos_current))return;
            const pos_drag = scope.pos_drag;
            if (pos_current === pos_drag)
                return;
            let target;
            for (const [el, index] of map) {
                if (index === pos_drag)
                    target = el;
            }
            if (!target)
                return;
            if (typeof scope.pos_drag !== "number")
                return;
            if (typeof pos_current !== "number")
                return;
            let from = scope.pos_drag > pos_current ? "right" : "left"; //判断拖拽目标是从左边过来还是从右边过来
            // 如果拖拽目标从左边过来,则,拖拽目标要放在pos_current,释放目标到pos_current-1,元素位置在区间[pos_drag,pos_current]全部-1
            // 如果拖拽目标从右边过来,则拖拽目标要放在pos_current,释放目标pos_current+1,元素位置在区间[pos_current,pos_drag]全部+1
            for (const [el, index] of map) {
                if (from === "left" && index >= scope.pos_drag && index <= pos_current)
                    map.set(el, index - 1);
                else if (from === "right" && index >= pos_current && index <= scope.pos_drag)
                    map.set(el, index + 1);
            }
            map.set(target, pos_current);
            scope.pos_drag = pos_current; // 这里要注意修改当前拖拽目标的位置了,因为它在实时变化
            Drag.order_dep(scope);
        }
    }
}
