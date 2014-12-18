/**
 * @name MainApplicationFile
 * @author [author]
 * @description [description]
 * @version [version]
 * @tutorial [link]
 */
;(function(){

    /**
     * Поиск всех вхождений в набор элементов
     * @param   {array|string} cache набор элементов с определенным indexOf
     * @param   {mixed} searchElement искомый элемент
     * @returns {array} массив индексов
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
     * @param   {string} str целевая строка
     * @param   {string} pattern паттерн
     * @returns {boolean} true/false
     */
    function regTest(str, pattern) {
        return pattern ? new RegExp(pattern).test(str) : true;
    }

    /**
     * Получить текущее время в мс
     * @returns {number} время в мс
     */
    function getTime() {
        return new Date().getTime();
    }

    /**
     * Конструктор функции расчета факториала
     * @lambda
     * @returns {function} функция расчета факториала
     */
    var getFactorial = function(){
        var cache = [1,1];
        /**
         * Функция расчета факториала
         * @param  {number} n целое положительное
         * @return {number} значение факториала
         */
        return function(n){
            if (!cache[n]) cache[n] = n * getFactorial(n -1);
            return cache[n];
        };
    }();

    /**
     * Функция подсчета количества сочетаний без повторений
     * @param   {number} k числитель
     * @param   {number} n знаменатель
     * @returns {number} количество сочетаний
     */
    function getSample(k, n) {
        return n >= k ? getFactorial(n) / (getFactorial(k) * getFactorial(n -k)) : 0;
    }

    /**
     * Получить все варинты сочетания без повторений
     * @param   {number} k числитель
     * @param   {number} n знаменатель
     * @returns {Array} массив вариантов в целых числах
     */
    function getComb(k, n) {
        for (var comb = [], cur = (1 << k) -1, tmp; cur < (1 << n); ) {
            comb.push(cur);
            tmp = (cur | (cur -1)) +1;
            cur = tmp | ((((tmp & -tmp) / (cur & -cur)) >> 1) -1);
        } return comb;
    }

    /**
     * Конструктор контроллера валидации форм
     * @lambda
     * @returns {function} функция валидации формы
     */
    var formsValidController = function(){
        // функции валидации
        var cbs = {
            // форма параметров испытания
            form_params: function() {
                var isvalid = !this.find("tr.error").length;
                $("#but_submit").prop("disabled", !isvalid);
                return isvalid;
            }
        }
        /**
         * Функция валидации формы по умолчанию
         * @returns {boolean} true/false
         */
        function cb_default() {
            return !this.find("tr.error").length;
        }
        /**
         * Вызов функции валидации формы
         * @param   {jQuery} $form целевая форма
         * @returns {boolean} true/false
         */
        return function($form) {
            var id = $form.attr("id");
            return cbs[id] ? cbs[id].call($form) : cb_default.call($form);
        }
    }();

    /**
     * Конструктор функции рассчета коллекции
     * @lamda
     * @param   {object} options настройки
     * @returns {function} функция рессчета коллекции
     */
    var RepeatCodeCollection = function(options) {
        /**
         * Конструктор элемента коллекции
         * @constructs
         * @param   {string} binstr бинарный блок
         * @param   {number} length длина блока
         * @param   {error} error кратность ошибки
         * @returns {object} элемент коллекции
         */
        function createOption(binstr, length, error) {
            return {
                /** @type {string} бинарный блок */
                bin: binstr,
                /** @type {Array} массив индексов */
                nums: indexOfAll(binstr, '1'),
                /** @type {boolean} корректный ли элемент */
                correct: function(b, l, e) {
                    return b.match(new RegExp('.{' + l + '}', 'g')).reduce(function(prev, cur) {
                        return prev | parseInt(cur, 2);
                    }, 0).toString(2).replace(/0/g, '').length == e;
                }(binstr, length, error)
            }
        }
        /**
         * Функция формирования коллекции
         * @param   {object} attrs атрибуты
         * @returns {Array} массив элементов коллекции
         */
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
     * @class
     * @param   {jQuery} $view контейнер юнитов
     * @param   {object} options настройки инициализации
     * @returns {object} публичные методы
     */
    function RepeatCodeView($view, options) {
        // настройки конструктора
        options = $.extend(true, {
            /** @type {string} единичный элемент представления */
            item: 'td',
            /** @type {string} класс выбранного юнита */
            select_class: 'selected',
            /** @type {string} класс элемента значения юнита */
            bit_class: 'bitvalue',
            /** @type {string} класс элемента индекса юнита */
            tab_class: 'bittab',
            /** @type {number} длина блока по умолчанию */
            length: 5,
            /** @type {number} количество повторений по умолчанию */
            repeat: 3
        }, options);

        /** @access private */
        var _length = options.length,
            _repeat = options.repeat,
            _$set = [];

        /**
         * Функция формирования представления юнита
         * @param   {number} index индекс юнита
         * @param   {boolean} biter вкл/выкл юнита
         * @returns {string} html-текст представления
         */
        function bitView(index, biter) {
            return "<" + options.item + "><div class='" + options.tab_class + "'>"
                + index + "</div><p class='" + options.bit_class + "'>"
                + (biter ? '1' : '0') + "</" + options.item + ">";
        }

        /**
         * Инверсия юнита
         * @param {jQuery} $item целевой юнит
         */
        function invItem($item) {
            var $input = $item.find('.' + options.bit_class);
            $input.text($input.text() == '0' ? '1' : '0');
        }

        /**
         * Конструктор представления кода
         * @constructs
         * @param {number} length длина кодовой комбинации
         * @param {number} repeat количество повторений
         */
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

        /**
         * Установить код
         * @param {string} code кодовая комбинация
         */
        function setCode(code) {
            for (var i=0, j; i!=_repeat; i++) {
                for (j=0; j!=_length; j++) {
                    _$set.eq(i * _length + j).find('.' + options.bit_class).text(code[j]);
                }
            }
        }

        // инициализация
        initCode();

        // Вернуть публичные методы
        return {
            fn: {
                /**
                 * Функция инициализации
                 * вызов конструктора с параметрами
                 * @param {number} length длина кодовой комбинации
                 * @param {number} repeat количество повторений
                 */
                init: function(length, repeat) {
                    initCode(length, repeat);
                },
                /**
                 * Установить код
                 * делегирование на приватный метод
                 * @param {string} code кодовая комбинация
                 */
                set: function(code) {
                    setCode(code);
                },
                /**
                 * Очистить код представления
                 * все юниты сбрасываются в ноль
                 */
                clear: function() {
                    setCode(new Array(options.length +1).join('0'));
                },
                /**
                 * Выбрать указанные юниты
                 * если аргумент не задан, то сбросить выделение
                 * @param {number|array|undefined} nums требуемые юниты
                 */
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
     * @class
     * @param   {object} options настройки
     * @returns {object} публичные методы
     */
    var RepeatCode = function(options) {
        // настройки
        options = $.extend(true, {
            /** @type {jQuery} объект представления кода */
            $codeview: $("#codeview"),
            /** @type {jQuery} объект представления коллекции */
            $options: $("#options"),
            /** @type {number} максимальное число отображаемых элементов коллекции */
            maxview: 200,
            /** @type {string} единицчный элемент представления коллекции */
            item: 'tr',
            /**
             * Функция вычисления количества всех возможных вариантов
             * @param   {object} a атрибуты
             * @returns {number} количество
             */
            calcAll: function(a) {
                return getSample(a.error, a.length * a.repeat);
            },
            /**
             * Функция вычисления корректных вариантов
             * @param   {object} a атрибуты
             * @returns {number} количество
             */
            calcCorrect: function(a) {
                return getSample(a.error, a.length) * Math.pow(a.repeat, a.error);
            },
            /**
             * Функция отображения результатов вычисления
             * @param {object} result результаты
             */
            showResult: function(result) {
                $statistic = $("#statistic");
                $statistic.find("span[name='all']").text(result.all);
                $statistic.find("span[name='success']").text(result.success + ' [~' + (100 * result.success / result.all).toFixed(2) + '%]');
            },
            /**
             * Функция формирования представления элемента коллекции
             * @param   {object} option элемент коллекции
             * @param   {number} index индекс элемента
             * @returns {string} html-текст элемента
             */
            optView: function(option, index) {
                return "<tr class='" + (option.correct ? "correct" : "") + "'><td>"
                    + index + ".</td><td>[" + option.nums.map(function(n){
                        return n+1;
                }).join(', ') + "]</td></tr>";
            }
        }, options);

        /** @access private */
        var _collection = [],
            _block = null,
            _attrs = null,
            _result = null,
            _$options = [];

        /**
         * @access private
         * @type {RepeatCodeView} представление
         */
        var _codeview = RepeatCodeView(options.$codeview);

        /**
         * Функция расчетов
         * @param   {object} attrs атрибуты
         * @returns {object} результаты
         */
        function repcodeResult(attrs) {
            return {
                all: options.calcAll(attrs),
                success: options.calcCorrect(attrs)
            }
        }

        /**
         * Функция очистки коллекции
         * необходимо вызывать перед конструктором
         */
        function repcodeClear() {
            _collection.length = 0;
            _codeview.fn.init();
            options.$options.empty();
        }

        /**
         * Конструктор модели
         * @constructs
         * @param {string} block кодовая комбинация
         * @param {object} attrs атрибуты
         */
        function repcodeCreate(block, attrs) {
            _block = block;
            _attrs = attrs;
            _codeview.fn.init(_attrs.length, _attrs.repeat);
            _codeview.fn.set(_block);
            _result = repcodeResult(_attrs);
            _collection = RepeatCodeCollection(_attrs);
            // формирование представления коллекции
            for (var i = 0, opts = "", max = options.maxview && options.maxview < _collection.length ? options.maxview : _collection.length; i != max; i++) {
                opts += options.optView(_collection[i], i+1);
            }
            options.$options.append(opts);
            _$options = options.$options.find(options.item);
            // вывод результатов
            if (typeof options.showResult === "function") {
                options.showResult(_result);
            }
        }

        // Обработка наведения курсора на элементы коллекции в представлении
        options.$options.delegate(options.item, 'mouseenter', function(event) {
            var index = _$options.index(this);
            _codeview.fn.select(_collection[index].nums);
        }).delegate(options.item, 'mouseleave', function(event) {
            _codeview.fn.select();
        });

        // Вернуть публичные методы
        return {
            fn: {
                /**
                 * Создание модели
                 * очистка и вызов констуктора
                 * @param   {string} block кодовая комбинация
                 * @param   {object} attrs атрибуты создания
                 */
                create: function(block, attrs) {
                    repcodeClear();
                    repcodeCreate(block, attrs);
                },
                /**
                 * Очистка модели
                 * делегирования приватному методу
                 */
                clear: function() {
                    repcodeClear();
                }
            }
        }
    }

    /**
     * Получить значение поля формы
     * @param   {jQuery} $form целевая форма
     * @param   {string} name  имя поля
     * @returns {number|string|null} значение поля
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

        /** @type {RepeatCode} инициализация */
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
