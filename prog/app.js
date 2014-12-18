;(function(){

    /**
     * Поиск всех вхождение в набор элементов
     * @param  {array|string} cache набор элементов с определенным indexOf
     * @param  {mixed} searchElement искомый элемент
     * @return {array} массив индексов
     */
    function indexOfAll(cache, searchElement) {
        var inxs = [], inx = cache.indexOf(searchElement);
        while (inx != -1) {
            inxs.push(inx);
            inx = cache.indexOf(searchElement, inx +1);
        }
        return inxs;
    }

    /**
     * Проверка строки регулярным выражением
     * @param  [string] str - целевая строка
     * @param  [string] pattern - паттерн
     * @return [boolean] true/false
     */
    function regTest(str, pattern) {
        return pattern ? new RegExp(pattern).test(str) : true;
    }

    /**
     * Получить текущее время в мс
     * @return [number] время в мс
     */
    function getTime() {
        return new Date().getTime();
    }

    /**
     * Функция расчета факториала
     * @param  [number] n - заданное число
     * @return [number] результат
     */
    var getFactorial = (function(){
        var cache = [1,1];
        return function(n){
            if (!cache[n]) cache[n] = n * getFactorial(n -1);
            return cache[n];
        };
    })();

    /**
     * Функция расчета выборки
     * @param  [number] k - знаменатель
     * @param  [number] n - числитель
     * @return [number] результат выборки
     */
    function getSample(k, n) {
        return n >= k ? getFactorial(n) / (getFactorial(k) * getFactorial(n -k)) : 0;
    }

    /**
     * Получить все варинты сочетания
     * @param  {integer} k числитель выборки
     * @param  {integer} n знаменатель выборки
     * @return {array} массив вариантов в целых числах
     */
    function getComb(k, n) {
        for (var comb = [], cur = (1 << k) -1, tmp; cur < (1 << n); ) {
            comb.push(cur);
            tmp = (cur | (cur -1)) +1;
            cur = tmp | ((((tmp & -tmp) / (cur & -cur)) >> 1) -1);
        } return comb;
    }

    /**
     * Контроллер валидации форм (конструктор)
     */
    var formsValidController = (function(){
        // функции валидации
        var cbs = {
            // форма параметров испытания
            form_params: function() {
                var isvalid = !this.find("tr.error").length;
                $("#but_submit").prop("disabled", !isvalid);
                return isvalid;
            }
        }
        // функция валидации по умолчанию
        function cb_default() {
            return !this.find("tr.error").length;
        }
        /**
         * Валидация формы
         * @param  [jquery] $form - целевая форма
         * @return [boolean] true/false
         */
        return function($form) {
            var id = $form.attr("id");
            return cbs[id] ? cbs[id].call($form) : cb_default.call($form);
        }
    })();

    /**
     * Конструктор функции рассчета коллекции
     * @param  {object} options настройки
     * @return {function} функция рессчета коллекции
     */
    var RepeatCodeCollection = function(options) {
        function createOption(binstr, length, error) {
            return {
                bin: binstr,
                nums: indexOfAll(binstr, '1'),
                correct: function(b, l, e) {
                    return b.match(new RegExp('.{' + l + '}', 'g')).reduce(function(prev, cur) {
                        return prev | parseInt(cur, 2);
                    }, 0).toString(2).replace(/0/g, '').length == e;
                }(binstr, length, error)
            }
        }

        return function(attrs) {
            var codelen = attrs.length * attrs.repeat,
                comb = getComb(attrs.error, codelen);
            var collection = [];
            for (var bin, i = comb.length -1; i > -1; i--) {
                bin = comb[i].toString(2);
                bin = new Array(15 - bin.length +1).join('0') + bin;
                collection.push(createOption(bin, attrs.length, attrs.error));
            }
            return collection;
        }
    }();

    /**
     * Класс представления кодовой комбинации
     * @constructs
     * @param  {jQuery} $view   контейнер юнитов
     * @param  {object} options настройки инициализации
     * @return {object} публичные методы
     */
    function RepeatCodeView($view, options) {

        options = $.extend(true, {
            item: 'td',
            select_class: 'selected',
            bit_class: 'bitvalue',
            tab_class: 'bittab',
            length: 5,
            repeat: 3
        }, options);

        var _length = options.length,
            _repeat = options.repeat,
            _$set = [];

        function bitView(index, biter) {
            return "<" + options.item + "><div class='" + options.tab_class + "'>"
                + index + "</div><p class='" + options.bit_class + "'>"
                + (biter ? '1' : '0') + "</" + options.item + ">";
        }

        function invItem($item) {
            var $input = $item.find('.' + options.bit_class);
            $input.text($input.text() == '0' ? '1' : '0');
        }

        function initCode(length, repeat) {
            _length = typeof length !== "undefined" ? length : options.length;
            _repeat = typeof repeat !== "undefined" ? repeat : options.repeat;
            for (var bits = "", i = 0, j; i != _repeat; i++) {
                for (j = 0; j != _length; j++) {
                    bits += bitView(j +1);
                }
            }
            $view.empty().append(bits);
            _$set = $view.find(options.item);
        }

        function setCode(code) {
            for (var i=0, j; i!=_repeat; i++) {
                for (j=0; j!=_length; j++) {
                    _$set.eq(i * _length + j).find('.' + options.bit_class).text(code[j]);
                }
            }
        }

        initCode();

        return {
            fn: {
                init: function(length, repeat) {
                    initCode(length, repeat);
                },
                set: function(code) {
                    setCode(code);
                },
                clear: function() {
                    setCode(new Array(options.length +1).join('0'));
                },
                select: function(nums) {
                    _$set.each(function() {
                        var $item = $(this);
                        if ($item.hasClass(options.select_class)) {
                            $item.removeClass(options.select_class);
                            invItem($item);
                        }
                    });
                    _$set.find('.' + options.select_class).removeClass(options.select_class);
                    if (arguments.length) {
                        if (!nums instanceof Array) nums = [nums];
                        nums.forEach(function(num){
                            var $item = _$set.eq(num);
                            $item.addClass(options.select_class);
                            invItem($item);
                        });
                    }
                }
            }
        }
    }

    /**
     * Класс модели кода
     * @constructs
     * @param  {object} options настройки
     * @return {object} публичные методы
     */
    var RepeatCode = function(options) {

        options = $.extend(true, {
            $codeview: $("#codeview"),
            $options: $("#options"),
            maxview: 200,
            item: 'tr',
            calcAll: function(a) {
                return getSample(a.error, a.length * a.repeat);
            },
            calcCorrect: function(a) {
                return getSample(a.error, a.length) * Math.pow(a.repeat, a.error);
            },
            showResult: function(result) {
                $statistic = $("#statistic");
                $statistic.find("span[name='all']").text(result.all);
                $statistic.find("span[name='success']").text(result.success + ' [~' + (100 * result.success / result.all).toFixed(2) + '%]');
            },
            optView: function(option, index) {
                return "<tr class='" + (option.correct ? "correct" : "") + "'><td>"
                    + index + ".</td><td>[" + option.nums.map(function(n){
                        return n+1;
                }).join(', ') + "]</td></tr>";
            }
        }, options);

        var _collection = [],
            _block = null,
            _attrs = null,
            _result = null,
            _$options = [];

        var _codeview = RepeatCodeView(options.$codeview);

        function repcodeResult(attrs) {
            return {
                all: options.calcAll(attrs),
                success: options.calcCorrect(attrs)
            }
        }

        function repcodeClear() {
            _collection.length = 0;
            _codeview.fn.init();
        }

        function repcodeCreate(block, attrs) {
            _block = block;
            _attrs = attrs;
            _codeview.fn.init(_attrs.length, _attrs.repeat);
            _codeview.fn.set(_block);
            _result = repcodeResult(_attrs);
            _collection = RepeatCodeCollection(_attrs);

            for (var i = 0, opts = "", max = options.maxview && options.maxview < _collection.length ? options.maxview : _collection.length; i != max; i++) {
                opts += options.optView(_collection[i], i+1);
            }
            options.$options.empty().append(opts);
            _$options = options.$options.find(options.item);

            if (typeof options.showResult === "function") {
                options.showResult(_result);
            }
        }

        options.$options.delegate(options.item, 'mouseenter', function(event) {
            var index = _$options.index(this);
            _codeview.fn.select(_collection[index].nums);
        }).delegate(options.item, 'mouseleave', function(event) {
            _codeview.fn.select();
        });

        return {
            fn: {
                create: function(block, attrs) {
                    repcodeClear();
                    repcodeCreate(block, attrs);
                },
                clear: function() {
                    repcodeClear();
                }
            }
        }
    }

    /**
     * Получить значение поля формы
     * @param  {jQuery} $form целевая форма
     * @param  {string} name  имя поля
     * @return {number|string|null} значение поля
     */
    function findFormValue($form, name) {
        var $tr = $form.find('tr[name=' + name + ']'),
            $input = $tr.find('.tf_value'),
            value = $input.val(),
            type = $input.attr("data-type");
        return value.length ? (type == "number" ? value -0 : value) : null;
    }

    // После полной загрузки приложения ========================================
    $(window).load(function(){

        var _repcode = RepeatCode();

        // Валидация поля и формы при редактировании значения
        $(".table_form").delegate(".tf_value", "keyup change", function(event) {
            var $this = $(this),
                $item = $this.closest("tr"),
                $error = $item.find(".tf_error"),
                name = $item.attr("name"),
                value = $this.val(),
                pattern = $this.attr("data-pattern"),
                msgempty = $this.attr("data-msgempty"),
                msgerror = $this.attr("data-msgerror");

            $error.text("");
            var isvalid = true;
            try {
                if (!value.length && typeof msgempty !== "undefined") throw { message: msgempty };
                else if (value.length && !regTest(value, pattern)) throw { message: msgerror };
            }
            catch (e) {
                $error.text(e.message);
                isvalid = false;
            }
            $item.toggleClass("error", !isvalid);
            formsValidController($item.closest(".table_form"));
        });

        // валидация формы
        $("#form_params .tf_value").change();
        RepeatCodeView($("#codeview"));

        // Действие при сабмите
        $("#but_submit").click(function(event){
            $params = $("#form_params");
            _repcode.fn.create(findFormValue($params, 'block'), {
                length: findFormValue($params, 'length'),
                repeat: findFormValue($params, 'repeat'),
                error: findFormValue($params, 'error')
            });
        });

    });

})();
