(function (global, factory) {
    typeof exports==='object'&&typeof module!=='undefined'?module.exports=factory():
        typeof define==='function'&&define.amd?define(factory):
            (global=global||self,global.Slider=factory())
})(this, function () {
    'use strict';

    /**
     * 解析一个字符串，并返回一个浮点数
     * @param {string} num
     * @returns {number}
     */
    function parseNum(num) {
        var n = parseFloat(num);
        return isNaN(n) ? 0 : n
    }

    /**
     * 在指定的元素节点上存取数据，返回设置值
     * @param {HTMLElement} el -dom节点对象
     * @param {string} key -可选。String类型 指定的键名字符串
     * @param {object} value -可选。 Object类型 需要存储的任意类型的数据
     * @returns {HTMLElement|object} 存数据时返回当前dom节点对象,取数据时则返回之前存的数据
     * @description HTMLElement类型 要存储数据的DOM对象。参数key,value都不为空则存数据，否则为取数据。都为空时取所有存储的数据
     */
    function elData(el, key, value) {
        var _dataname = '_elData', ktype = typeof(key), vtype = typeof(value);
        key = ktype === 'string' ? key.trim() : key;
        //set
        if (ktype !== 'undefined' && vtype !== 'undefined') {
            if (key === null || ktype === 'number' || ktype === 'boolean') {
                return el
            }
            if (!(_dataname in el)) {
                el[_dataname] = {}
            }
            el[_dataname][key] = value;
            return el
        }
        //get
        if (ktype === 'undefined' && vtype === 'undefined') {
            return el[_dataname] || {}
        }
        if (ktype !== 'undefined' && vtype === 'undefined') {
            return (_dataname in el && key in el[_dataname]) ? el[_dataname][key] : undefined
        }
    }

    /**
     * 移除之前通过elData()法绑定的数据，返回当前dom节点
     * @param {HTMLElement} el -dom节点对象
     * @param {string} key -可选,规定要移除的数据的名称。如果没有规定名称，该方法将从被选元素中移除所有已存储的数据。
     * @returns {HTMLElement} 返回当前dom元素节点
     */
    function delElData(el, key) {
        var type = typeof(key), _dataname = '_elData';
        key = type === 'string' ? key.trim() : key;
        if (key === null || type === 'number' || type === 'boolean') {
            return el
        }
        if (type === 'undefined') {//remove all
            if (_dataname in el) delete el[_dataname]
        } else {
            if (_dataname in el && key in el[_dataname]) delete el[_dataname][key]
        }
        return el
    }

    /**
     * 获取dom元素的CSS属性的值
     * @param {HTMLElement} el -dom元素
     * @param {string} prop -css属性名
     * @returns {string}
     */
    function getStyle(el, prop) {
        return window.getComputedStyle ? getComputedStyle(el, null)[prop] : el.currentStyle[prop]
    }

    /**
     * 记录绑定一些与高度相关的css信息到节点元素上即便后面元素的css样式有变化也可以从中取得其原始值
     * @param {HTMLElement} el -dom元素
     */
    function bindData(el){
        if (!elData(el, 'slide')) {
            elData(el, 'slide', true);
            elData(el, 'cssText', el.style.cssText);
            elData(el, 'borderTopWidth', getStyle(el, 'border-top-width'));
            elData(el, 'borderBottomWidth', getStyle(el, 'border-bottom-width'));
            elData(el, 'paddingTop', getStyle(el, 'padding-top'));
            elData(el, 'paddingBottom', getStyle(el, 'padding-bottom'));
            elData(el, 'height', getStyle(el, 'height'))
        }
        if (elData(el, 'height') === 'auto') {
            el.setAttribute('hidden', true);
            var c = el.style.cssText;
            el.style.cssText = 'display:block';
            elData(el, 'height', getStyle(el, 'height'));
            el.style.cssText = c;
            el.removeAttribute('hidden');
        }
    }

    /**
     * 获取当前状态中与元素高度相关的css样式值
     * @param {HTMLElement} el -dom节点对象
     * @returns {{bt: string, bb: string, pt: string, pb: string, h: string}}
     */
    function nowH(el){
        return {
            bt: getStyle(el, 'border-top-width'),
            bb: getStyle(el, 'border-bottom-width'),
            pt: getStyle(el, 'padding-top'),
            pb: getStyle(el, 'padding-bottom'),
            h: getStyle(el, 'height'),
        }
    }

    /**
     * 获取最初始未有更改过的block状态中与元素高度相关的css样式值
     * @param {HTMLElement} el -dom节点对象
     * @returns {{css: (HTMLElement|Object), bt: (HTMLElement|Object), bb: (HTMLElement|Object), pt: (HTMLElement|Object), pb: (HTMLElement|Object), h: (HTMLElement|Object)}}
     */
    function endH(el){
        return {
            css: elData(el, 'cssText'),
            bt: elData(el, 'borderTopWidth'),
            bb: elData(el, 'borderBottomWidth'),
            pt: elData(el, 'paddingTop'),
            pb: elData(el, 'paddingBottom'),
            h: elData(el, 'height'),
        }
    }
//#region slider plugin
    /**
     * 滑动收展节点元素
     * @param {HTMLElement} el -dom节点对象
     * @returns {Slider}
     * @constructor
     * @description 不考虑’border-box:box-sizing‘这种情况(可能卡顿收展不能平滑过渡)
     */
    function Slider(el) {
        if (!(this instanceof Slider)) {
            return new Slider(el)
        }
        this.el = typeof (el) === "string"
            ? document.querySelector(el)
            : (((typeof HTMLElement === 'object')
                ? (el instanceof HTMLElement)
                : (el && typeof el === 'object' && el.nodeType === 1 && typeof el.nodeName === 'string'))
                ? el : null);
        return this;
    }

    Slider.prototype = {
        constructor: Slider,
        /**
         * 以滑动方式隐藏节点
         * @param {number} millisecond -滑动速度(完成滑动所需毫秒时间),默认值300
         */
        slideUp: function (millisecond) {
            bindData(this.el);
            elData(this.el,'slideToggle','slideup');
            var el=this.el,
                slide = Symbol('slide').toString(),
                now = nowH(el),
                end =endH(el),
                bt = parseNum(end.bt),
                bb = parseNum(end.bb),
                pt = parseNum(end.pt),
                pb = parseNum(end.pb),
                h = parseNum(end.h),
                total = h + pt + pb + bt + bb,
                finish = false,
                sum = total - (parseNum(now.bt) + parseNum(now.bb) + parseNum(now.pt) + parseNum(now.pb) + parseNum(now.h)),
                speed = (millisecond ? total / millisecond : total / 300) * 5;
            el.style.cssText = el.style.cssText + 'overflow:hidden;';
            clearInterval(el[slide]);
            el[slide] = setInterval(function () {
                if (finish) {
                    clearInterval(el[slide]);
                    el.style.cssText = end.css + 'display:none';
                    if (slide in el) {
                        delete el[slide]
                    }
                } else {
                    sum += speed;
                    if (bb - sum > 0) {
                        el.style.borderBottomWidth = bb - sum + 'px'
                    } else {
                        el.style.borderBottomWidth = 0 + 'px';
                        if (bb + pb - sum > 0) {
                            el.style.paddingBottom = bb + pb - sum + 'px';
                        } else {
                            el.style.paddingBottom = 0 + 'px';
                            if (bb + pb + h - sum > 0) {
                                el.style.height = bb + pb + h - sum + 'px';
                            } else {
                                el.style.height = 0 + 'px';
                                if (bb + pb + h + pt - sum > 0) {
                                    el.style.paddingTop = bb + pb + h + pt - sum + 'px';
                                } else {
                                    el.style.paddingTop = 0 + 'px';
                                    if (bb + pb + h + pt + bt - sum > 0) {
                                        el.style.borderTopWidth = bb + pb + h + pt + bt - sum + 'px';
                                    } else {
                                        el.style.borderTopWidth = 0 + 'px';
                                        finish = true;
                                    }
                                }
                            }
                        }
                    }
                }
            }, 5);//间隔时间不要过小或过大,否则最终花费时间会与设定的完成时间误差较大,且设置间隔过大会卡顿没有平缓过度效果
            return this
        },
        /**
         * 以滑动方式显示节点
         * @param {number} millisecond 滑动速度(完成滑动所需毫秒时间),默认值300
         */
        slideDown: function (millisecond) {
            bindData(this.el);
            elData(this.el,'slideToggle','slidedown');
            var el = this.el,
                slide = Symbol('slide').toString(),
                now = nowH(el),
                end = endH(el),
                bt = parseNum(end.bt),
                bb = parseNum(end.bb),
                pt = parseNum(end.pt),
                pb = parseNum(end.pb),
                h = parseNum(end.h),
                total = h + pt + pb + bt + bb,
                finish = false,
                speed = (millisecond ? total / millisecond : total / 300) * 5,
                sum = 0;
            if (getStyle(el, 'display') === 'none') {
                el.style.cssText = end.css + 'overflow:hidden;height:0;display:block;border-top-width:0;border-bottom-width:0;padding-top:0;padding-bottom:0;';
            } else {
                el.style.cssText = el.style.cssText + 'overflow:hidden';
                sum = parseNum(now.bt) +parseNum(now.bb) +parseNum(now.pt) +parseNum(now.pb) +parseNum(now.h);
            }
            clearInterval(el[slide]);
            el[slide] = setInterval(function () {
                if (finish) {
                    clearInterval(el[slide]);
                    el.style.cssText = end.css + 'display:block';
                    if (slide in el) {
                        delete el[slide]
                    }
                } else {
                    sum += speed;
                    if (bt - sum > 0) {
                        el.style.borderTopWidth = sum + 'px';
                    } else {
                        el.style.borderTopWidth = bt + 'px';
                        if (bt + pt - sum > 0) {
                            el.style.paddingTop = sum - bt + 'px';
                        } else {
                            el.style.paddingTop = pt + 'px';
                            if (bt + pt + h - sum > 0) {
                                el.style.height = sum - bt - pt + 'px';
                            } else {
                                el.style.height = h + 'px';
                                if (bt + pt + h + pb - sum > 0) {
                                    el.style.paddingBottom = sum - bt - pt - h + 'px';
                                } else {
                                    el.style.paddingBottom = pb + 'px';
                                    if (bt + pt + h + pb + bb - sum > 0) {
                                        el.style.borderBottomWidth = sum - bt - pt - h - pb + 'px';
                                    } else {
                                        el.style.borderBottomWidth = bb + 'px';
                                        finish = true;
                                    }
                                }
                            }
                        }
                    }
                }
            }, 5);
            return this;
        },
        /**
         * dom元素以滑动方式在显示隐藏状态之间切换
         * @param {number} millisecond 滑动速度(完成滑动所需毫秒时间),默认值300
         */
        slideToggle: function (millisecond) {
            getStyle(this.el, 'display') === 'none'
            ||elData(this.el,'slideToggle')==='slideup'
                ? this.slideDown.call(this, millisecond)
                : this.slideUp.call(this, millisecond);
            return this
        }
    };

//#endregion
    return Slider
});
