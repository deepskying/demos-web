// -----------------------------------------------------------------------------------------------------------------------------------------------------基于定位

// desc : 基于定位的拖拽排序,使用前请按照一下顺序准备
// step1: 被拖拽元素容器请添加draggable="true" html属性并且其css position:absolute容器元素css position:relative
// step2: 需要为draggable=true的html元素的所有子元素添加样式points-events:var(--titlebar-tab-point-event),如需修改这个css变量可以直接修改静态属性css_var_apoint_event

// tips : 如需更新容器宽度,可以单独调用update_container_width
interface DragScope{
    box:HTMLElement;//容器元素
    pos_drag:undefined|number;
    drag_target:HTMLElement|undefined,//拖拽目标元素
    map:Map<HTMLElement,number>,//元素的本来位置
}

export class DragBasePosition {
    // desc : 注册拖拽事件,'insert' | 'swap'用于控制是交换效果还是插入效果
    // step0 前置工作,容器响应释放
    // step2 : 初始化排序
    // step3: 注册拖拽事件
    static css_var_apoint_event='--titlebar-tab-point-event'
    static prev_order:number[]=[]       //之前的排序结果,其中数字是拖拽元素的排序,每个可拖拽元素的id标记在html属性上data-id
    static scope:DragScope              
    static register(box: HTMLElement, effect: "swap" | "insert", real = false) {
        const scope:DragScope={
            box,
            pos_drag:undefined,
            drag_target:undefined,
            map:new Map()
        }
        this.scope=scope
        // step0 前置工作,容器响应释放
        box.ondragenter = (e) => {
            e.preventDefault();
        };

        box.ondragover = (e) => {
            e.preventDefault();
        };

        // step1 准备数据结构
        for (let i = 0; i < box.children.length; i++) {
            const el= box.children[i] as HTMLElement;
            const tabid = Number(el.dataset.id);
            if (typeof tabid === "number" && tabid>=0) {
                const index = this.prev_order.indexOf(tabid);
                if (index >= 0) scope.map.set(el, index);
                else {
                    this.prev_order.push(tabid);
                    scope.map.set(el, i);
                }
            }
        }
        console.log(this.prev_order)
        console.log([...scope.map.keys()].map(item=>item.textContent))
        // step2 : 初始化排序
        this.update_container_width()
        this.order();
        // step3: 注册拖拽事件
        for (const el of box.children as any) {
            if (real) {
                if (effect === "swap") this.register_drag_target_swap_real( el);
                else this.register_drag_target_insert_real( el);
            } else {
                if (effect === "swap") this.register_drag_target_swap( el);
                else this.register_drag_target_insert( el);
            }
        }
    }

    // desc : 根据map初始化排序
    static order() {
        const map=this.scope.map
        
        for (const [el, index] of map) {
            const offset = this.sum_translate(map, index);
            el.style.transform = `translateX(${offset}px)`;
        }
        // 排序完成后更新共享数据
        const tabid :number[]= [];
        for (const [el, index] of map) {
            tabid[index] = Number(el.dataset.id);
        }
        this.prev_order=tabid
    }

    // desc : 更新容器宽度
    static update_container_width(){
        let sum=0
        for(const [el,index] of this.scope.map){
            sum+=el.getBoundingClientRect().width
        }
        this.scope.box.style.width=`${sum}px`
    }

    
    // desc : 获取第index元素的偏移量
    static sum_translate(map: Map<HTMLElement, number>, index: number) {
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
    static register_drag_target_swap( el: HTMLElement) {
        const {map}=this.scope
        el.ondragstart =  (e: DragEvent) =>{
            let pos_drag = map.get(el);
            if (typeof pos_drag === "number") e.dataTransfer?.setData("text", `${pos_drag}`);
            document.body.style.setProperty(this.css_var_apoint_event,'none')
        };

        // 释放时交换两个元素的位置
        el.ondrop =  (e: DragEvent) =>{
            const map=this.scope.map
            let pos_current = map.get(el);
            const pos_drag = Number(e.dataTransfer?.getData("text"));
            if (typeof pos_current !== "number") return;
            for (const [item, index] of map) {
                if (index === pos_drag) {
                    map.set(item, pos_current);
                    map.set(el, pos_drag);
                    DragBasePosition.order();
                    break;
                }
            }
        };
        // 结束拖拽
        el.ondragend=(e:DragEvent)=>{
            document.body.style.setProperty(this.css_var_apoint_event,'auto')
        }
    }

    // desc : 插入效果
    static register_drag_target_insert(el: HTMLElement) {
        const {map}=this.scope
        el.ondragstart =  (e)=> {
            let pos_drag = map.get(el);
            if (typeof pos_drag !== "number") return;
            e.dataTransfer?.setData("text", `${pos_drag}`);
            document.body.style.setProperty(this.css_var_apoint_event,'none')
        };
        el.ondrop =  (e)=> {
            let pos_current = map.get(el);
            const pos_drag = Number(e.dataTransfer?.getData("text"));
            let target;
            for (const [el, index] of map) {
                if (index === pos_drag) target = el;
            }
            if (!target) return;
            if (typeof pos_current !== "number") return;
            let from = pos_drag > pos_current ? "right" : "left"; //判断拖拽目标是从左边过来还是从右边过来

            // 如果拖拽目标从左边过来,则,拖拽目标要放在pos_current,释放目标到pos_current-1,元素位置在区间[pos_drag,pos_current]全部-1
            // 如果拖拽目标从右边过来,则拖拽目标要放在pos_current,释放目标pos_current+1,元素位置在区间[pos_current,pos_drag]全部+1
            for (const [el, index] of map) {
                if (from === "left" && index >= pos_drag && index <= pos_current) map.set(el, index - 1);
                else if (from === "right" && index >= pos_current && index <= pos_drag) map.set(el, index + 1);
            }
            map.set(target, pos_current);
            DragBasePosition.order();
        };
        el.ondragend=()=>{
            document.body.style.setProperty(this.css_var_apoint_event,'auto')
        }
        
    }

    // desc : 交换效果-实时
    static register_drag_target_swap_real(el: HTMLElement) {
        const {map}=this.scope
        el.ondragstart =  (e: DragEvent) =>{
            let pos_drag = map.get(el);
            this.scope.pos_drag = pos_drag;
            document.body.style.setProperty(this.css_var_apoint_event,'none')
            // if (typeof pos_drag === "number") e.dataTransfer?.setData("text", `${pos_drag}`);
        };

        // 进入时交换两个元素的位置
        el.ondragenter =  (e: DragEvent) =>{
            let pos_current = map.get(el);
            const pos_drag = this.scope.pos_drag;
            if (pos_drag === pos_current) return;
            if (typeof pos_current !== "number") return;

            for (const [item, index] of map) {
                if (index === pos_drag) {
                    map.set(item, pos_current);
                    map.set(el, pos_drag);
                    this.scope.pos_drag = pos_current;
                    DragBasePosition.order();
                    break;
                }
            }
        };

        el.ondragend=()=>{
            document.body.style.setProperty(this.css_var_apoint_event,'auto')
        }
    }

    // desc : 插入效果-实时
    static register_drag_target_insert_real(el: HTMLElement) {
        const {map}=this.scope
        el.ondragstart =  (e)=> {
            let pos_drag = map.get(el);
            this.scope.pos_drag = pos_drag;
        };
        
        el.ondragenter = (e) =>{
            let pos_current = map.get(el);
            const pos_drag = this.scope.pos_drag;
            if(pos_drag===undefined)return;
            if (pos_current === pos_drag) return;
            let target;
            for (const [el, index] of map) {
                if (index === pos_drag) target = el;
            }
            if (!target) return;
            if (typeof pos_current !== "number") return;
            const from = pos_drag > pos_current ? "right" : "left"; //判断拖拽目标是从左边过来还是从右边过来

            // 如果拖拽目标从左边过来,则,拖拽目标要放在pos_current,释放目标到pos_current-1,元素位置在区间[pos_drag,pos_current]全部-1
            // 如果拖拽目标从右边过来,则拖拽目标要放在pos_current,释放目标pos_current+1,元素位置在区间[pos_current,pos_drag]全部+1
            for (const [el, index] of map) {
                if (from === "left" && index >= pos_drag && index <= pos_current) map.set(el, index - 1);
                else if (from === "right" && index >= pos_current && index <= pos_drag) map.set(el, index + 1);
            }
            map.set(target, pos_current);
            this.scope.pos_drag = pos_current; // 这里要注意修改当前拖拽目标的位置了,因为它在实时变化
            DragBasePosition.order();
        };
    }
}

// -----------------------------------------------------------------------------------------------------------------------------------------------------不基于定位

interface Scope {
    map: Map<HTMLElement, number>;
    pd: number; //这个pd是第一个元素距离左侧视口的距离,也是所有排序元素的左边界距离视口左侧的距离
    drag_target: HTMLElement | undefined; //当前拖拽元素
    pos_drag: number | undefined; //当前拖拽的元素位置
}

class Drag {
    // desc : 初始化拖动
    // step1 : 容器的拖拽事件
    // step2 : 初始化数据结构
    static register(el: HTMLElement, effect: "swap" | "insert") {
        const scope: Scope = {
            map: new Map(),
            pos_drag: undefined,
            drag_target: undefined,
            pd: 0,
        };

        const pd2 = el.firstElementChild?.getBoundingClientRect().x;
        if (pd2) scope.pd = pd2;
        // step1
        el.ondragenter = (e) => {
            e.preventDefault();
        };
        el.ondragover = (e) => {
            e.preventDefault();
        };

        const children = el.children as any;
        for (let i = 0; i < children.length; i++) {
            const item = children[i];
            scope.map.set(item, i);
            if (effect === "swap") this.dep_register_drag_swap_real(scope, item);
            else this.dep_register_drag_insert_real(scope, item);
        }
    }

    // desc : 获取第index元素的偏移量
    static sum_translate(map: Map<HTMLElement, number>, index: number) {
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
    static get_origin_x(el: HTMLElement) {
        const rect = el.getBoundingClientRect();
        const matrix = window.getComputedStyle(el).transform;
        if (!matrix || matrix === "none") return rect.x;
        const translatex = Number(matrix.split(",").slice(-2, -1)[0]);
        return rect.x - translatex;
    }

    // desc : 排序一个元素
    // step1 : 先获取元素的索引位置
    // step2 : 计算元素的偏移量,
    static order_one(scope: Scope, el: HTMLElement) {
        const { map, pd } = scope;
        // step1
        const index = map.get(el);
        if (typeof index !== "number") return;

        // step2
        const sum = this.sum_translate(map, index);
        const offset = sum + pd - this.get_origin_x(el);
        el.style.transform = `translateX(${offset}px)`;
    }

    // desc : 排序所有元素
    static order_dep(scope: Scope) {
        const { map } = scope;
        for (const [el, idx] of map) this.order_one(scope, el);
    }

    // 交换效果-实时
    static dep_register_drag_swap_real(scope: Scope, el: HTMLElement) {
        const { map } = scope;
        el.ondragstart = (e) => {
            const pos = map.get(el);
            scope.pos_drag = pos;
            scope.drag_target = el;
        };

        // 释放时交换两个元素的位置
        el.ondragenter = function (e: DragEvent) {
            let pos_current = map.get(el);
            const pos_drag = scope.pos_drag;

            if (pos_drag === pos_current) return;
            if (typeof pos_current !== "number") return;

            const item = scope.drag_target;

            if (!item) return;
            if (typeof scope.pos_drag !== "number") return;

            map.set(item, pos_current);
            map.set(el, scope.pos_drag);
            scope.pos_drag = pos_current;
            Drag.order_dep(scope);
        };
    }

    // 插入效果-实时
    static dep_register_drag_insert_real(scope: Scope, el: HTMLElement) {
        const { map } = scope;
        el.ondragstart = (e) => {
            const pos = map.get(el);
            scope.pos_drag = pos;
            scope.drag_target = el;
        };

        el.ondragenter = dodrag;
        // el.ondragover=dodrag
        function dodrag(e: DragEvent) {
            let pos_current = map.get(el);
            // if(scope.going.has(pos_current))return;
            const pos_drag = scope.pos_drag;
            if (pos_current === pos_drag) return;
            let target;
            for (const [el, index] of map) {
                if (index === pos_drag) target = el;
            }
            if (!target) return;
            if (typeof scope.pos_drag !== "number") return;
            if (typeof pos_current !== "number") return;
            let from = scope.pos_drag > pos_current ? "right" : "left"; //判断拖拽目标是从左边过来还是从右边过来

            // 如果拖拽目标从左边过来,则,拖拽目标要放在pos_current,释放目标到pos_current-1,元素位置在区间[pos_drag,pos_current]全部-1
            // 如果拖拽目标从右边过来,则拖拽目标要放在pos_current,释放目标pos_current+1,元素位置在区间[pos_current,pos_drag]全部+1
            for (const [el, index] of map) {
                if (from === "left" && index >= scope.pos_drag && index <= pos_current) map.set(el, index - 1);
                else if (from === "right" && index >= pos_current && index <= scope.pos_drag) map.set(el, index + 1);
            }
            map.set(target, pos_current);
            scope.pos_drag = pos_current; // 这里要注意修改当前拖拽目标的位置了,因为它在实时变化
            Drag.order_dep(scope);
        }
    }
}
