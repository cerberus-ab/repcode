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

            console.log(collection);
        }
    }();

    /**
     * Класс представления кодовой комбинации
     * @param {jQuery} $view   контейнер юнитов
     * @param {object} options настройки инициализации
     */
    function RepeatCodeView($view, options) {

        options = $.extend(true, {
            length: 5,
            repeat: 3,
            item: 'td',
            select_class: 'selected'
        }, options);

        function setCode(code) {
            for (var i=0, j; i!=options.repeat; i++) {
                for (j=0; j!=options.length; j++) {
                    $set.eq(i*options.length + j).text(code[j]);
                }
            }
        }

        var unit_default = '<' + options.item + '>0</' + options.item + '>';
        $view.empty().append(new Array(options.length * options.repeat + 1).join(unit_default));
        var $set = $view.find(options.item);

        return {
            fn: {
                set: function(code) {
                    setCode(code);
                },
                clear: function() {
                    setCode(new Array(options.length +1).join('0'));
                },
                select: function(nums) {
                    $set.find('.' + options.select_class).removeClass(options.select_class);
                    if (arguments.length) {
                        if (!nums instanceof Array) nums = [nums];
                        nums.forEach(function(num){
                            $set.eq(num).addClass(options.select_class);
                        });
                    }
                }
            }
        }
    }


    function RepeatCode(block, attrs, options) {
        options = $.extend(true, {
            $codeview: null,
            $options: null,
            showResult: function(result) {
                $statistic = $("#statistic");
                $statistic.find("span[name='all']").text(result.all);
                $statistic.find("span[name='success']").text(result.success + ' [~' + (100*result.success/result.all).toFixed(2) + '%]');
            }
        }, options);

        var codeview = RepeatCodeView(options.$codeview, {
            length: attrs.length,
            repeat: attrs.repeat
        });
        codeview.fn.set(block);

        var collection = RepeatCodeCollection(attrs);

        var result = {};
        result.all = function(a) {
            return getSample(a.error, a.length * a.repeat);
        }(attrs);
        result.success = function(a) {
            return getSample(a.error, a.length) * Math.pow(a.repeat, a.error);
        }(attrs);

        if (typeof options.showResult === "function") {
            options.showResult(result);
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
            RepeatCode(findFormValue($params, 'block'), {
                length: findFormValue($params, 'length'),
                repeat: findFormValue($params, 'repeat'),
                error: findFormValue($params, 'error')
            }, {
                $codeview: $("#codeview"),
                $options: $("#options")
            });
        });

    });

})();
