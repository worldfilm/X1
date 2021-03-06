/*
 * 调试好的文件，在http://tool.chinaz.com/Tools/JsFormat.aspx 有压缩工具进行加密压缩，替换gamecq2.js
 *
 * 玩法基本属性：
 几个号段组成最少投注，最少多少注;
 时时调用methods::isLegalCode()检查是否合法投注，且返回注数
 根据不同玩法展示投注界面：
 几个选区
 array(
 array(
 'nums'  => '0 1 2 3 4 5 6 7 8 9',   //号码列表
 'multi' => 1,   //是否可多选
 'prompt'    => '百位',    //前导提示符
 'has_filter_btn' => 1,  //是否显示筛选按钮
 ),
 )

 号码表示方法：号区之间用,分隔，同区内号码之间一般不用分隔符，若可能有2位表示的，用_分隔（如和值玩法或sd11y）
 注单表示方法（改进版）：String codes = "46:1,2,3,4,5|6,7,8,9,0|1,2,3,4,5#43:1,2,3|6,7,0";

 修改历史：
 3000注5星直选 网络传输量451k
 3000注5星直选 网络传输量75k 解码后39k  格式46:1,2,3,4,5|46:6,7,8,9,0|46:1,2,3,4,5
 3000注5星直选 网络传输量60k 解码后30k  格式46:1,2,3,4,5|6,7,8,9,0|1,2,3,4,5#43:1,2,3|6,7,0

 jq Tip:
 1.find()是在孩子结点中条件查找，filter是用于在一个集合中进行筛选，不处理子结点。不能用于同级别元素的条件筛选，要么先parent()再find()，要么用filter()
 如查找具有某一属性的结点：filter('[mode='+ps.curMode+']')
 var ob = $('<div><span>aa</span><span>bb</span><input value="123"/></div> <div class="me"><span>cc</span><span>dd</span><input value="456"/></div></div>');
 console.info(ob.children().length); //返回6 children()返回所有子结点
 console.info(ob.filter('input').val()); //返回undefined 当前集合只有2个div
 console.info(ob.filter('.me').html()); //返回<span>cc</span><span>dd</span><input value="456"> 从当前集合查找有me类的div元素集合
 console.info(ob.children().filter('input').val()); //123 找到2个结点，val()输出第一个结点的值
 console.info(ob.children().f
 ilter('input:eq(1)').val()); //456 输出第2个input的值
 console.info(ob.find('input').val()); //123 成功找到input结点，val()输出第一个结点的值
 console.info(ob.find('input:eq(0)').val()); //123
 console.info(ob.find('input:eq(1)').val()); //undefined 奇怪的问题，为何返回undefined
 console.info(ob.find('input:first').val()); //123
 console.info(ob.find('input:last').val());  //456
 console.info(ob.find('input').eq(1).val()); //456
 $.each(ob.find('input'), function(k,v){
 console.info(k);
 });

 2.empty()和remove()的区别在于前者是移除所有子节点，后者是移除包括自身
 3.ie6下iframe中操作父框架不支持appendTo()，也不支持$('#id').append(jQuery对象)，仅支持$('#id').append('html')

 */

if (typeof (console) != "object") {
    var console = {
        info: function (a) {
            window.status = a;
        }
    }
}
var runTime = {
    remainTimer: 0,
    waitOpenTimer: 0,
    getLastOpenTimer: 0,
    scollTopIntervalTimer: 0,
    traceRemainTimer: 0,
    traceWaitOpenTimer: 0,
    buyTodayTimer: 0,
    clearAll: function () {
        clearInterval(runTime.remainTimer);
        clearInterval(runTime.waitOpenTimer);
        clearInterval(runTime.getLastOpenTimer);
        clearInterval(runTime.scollTopIntervalTimer);
        clearInterval(runTime.traceRemainTimeball_Selectedr);
        clearInterval(runTime.traceWaitOpenTimer);
        clearInterval(runTime.buyTodayTimer);
    }
};

(function ($) {

    $.init = function (settings) {
        //检查传过来的参数的正确性
        var verifyParams = function () {
            var flag = 0;
            if (settings.lotteryId == undefined || !is_numeric(settings.lotteryId) || settings.lotteryId <= 0) {
                flag = -1;
            }
            else if (settings.lotteryName == undefined || settings.lotteryName == '') {
                flag = -2;
            }
            else if (settings.lotteryType == undefined || !is_numeric(settings.lotteryType) || $.inArray(settings.lotteryType, [9]) == -1) {
                flag = -3;
            }
            else if (settings.methods == undefined || !$.isArray(settings.methods) || settings.methods.length == 0) {
                flag = -4;
            }
            else if (settings.openedIssues == undefined || !$.isArray(settings.openedIssues) || settings.openedIssues.length == 0) {
                flag = -5;
            }
            else if (settings.minRebateGaps == undefined || !$.isArray(settings.minRebateGaps) || settings.minRebateGaps.length == 0) {
                flag = -6;
            }
            else if (settings.rebate == undefined || !is_numeric(settings.rebate) || settings.rebate < 0 || settings.rebate > 0.15) {
                flag = -7;
            }
            else if (settings.defaultMode == undefined || !is_numeric(settings.defaultMode) || !$.inArray(settings.defaultMode, [0.5]) == -1) {
                flag = -8;
            }
            else if (settings.defaultRebate == undefined || !is_numeric(settings.defaultRebate) || settings.defaultRebate < 0 || settings.defaultRebate > settings.rebate) {
                flag = -9;
            }
            else if (settings.maxCombPrize == undefined || !is_numeric(settings.maxCombPrize) || settings.maxCombPrize <= 0) {
                flag = -10;
            }

            if (flag < 0) {
                console.info('参数错误：flag=' + flag);
            }
            return flag == 0;
        };

        var ps = $.extend({
            counter: 0,
            //应传过来的设置
            lotteryId: 1,
            lotteryName: 'LHC',
            lotteryType: 9, //采种类型
            //startIssueInfo: {issue_id: '11444', issue:'20130131-080', 'end_time': '2013/01/31 19:14:10', 'input_time': '2013/01/31 19:14:20'},
            property_id: 1,
            methods: [],
            maxCombPrize: 0, //全包奖金
            openedIssues: [], //已开奖奖期
            minRebateGaps: [{
                from: 0,
                to: 0.12,
                gap: 0.005
            }, {
                from: 0.12,
                to: 0.125,
                gap: 0.001
            }],
            rebate: 0.123, //用户的返点
            defaultMode: 0.5, //1,0.1,0.01
            defaultRebate: 0.123, //默认选中的返点
            missHot: {
                miss: [],
                hot: []
            }, //上期开奖冷热数据
            halt: function (msg) {    //致命错误处理
                alert(msg + '!');
                throw msg;
            },
            //运行时变量
            prizeRate: 0, //返奖率
            curIssueInfo: {}, //当前奖期{ issue_id="15712", issue="20130201-070", end_time="2013-02-01 17:48:30", input_time=2013-02-01 17:50:30"}
            lastIssueInfo: {}, //上一期{ issue_id="15712", issue="20130201-070", code="96983"}
            curMode: 0, //当前选择的元角分模式
            //curRebate: 0,       //当前选择的返点值=ps.rebateGapList[ps.curPrizeIndex].rebate，这里不再需要
            curMethod: {}, //当前选择的玩法
            curProjects: [], //当前投注栏内容
            nextProjectCounter: 0, //投注栏计数器
            curPrizeIndex: -1, //当前选择的返点在rebateGapList数组的下标
            rebateGapList: [], //计算出来的滑动奖金列表
            todayDrawList: [], //今天已开奖奖期
            curServerTime: '', //当前服务器时间
            curRemainTime: 0, //当前期剩余秒数
            remainTimer: {}, //倒数计时器
            curWaitOpenTime: 0, //当前等待开奖秒数
            waitOpenTimer: {}, //等待开奖计时器
            getLastOpenTime: 0, //等待开奖的循环时间计时
            getLastOpenTimer: {}, //得到上一期开奖结果计时器
            canBuy: false, //当前状态是否允许游戏
            traceMethodPrize: 0, //可利润率追号时，传回该玩法奖金
            tracePrizeLimit: 0, //购买奖金限额
            canTraceIssues: [], //可追号的期号列表
            counters: 0,//第一次加载
        }, settings);
        //更新当前期出结果的开奖期数
        function todayGetCurIssue(lastIssueInfo) {
            if (!lastIssueInfo.code) {
                return;
            }
            var codes = "";
            var codes2 = "";
            for (var i = 0; i < lastIssueInfo.code.length; i++) {
                codes += "<b>" + lastIssueInfo.code[i] + "</b>";
                codes2 += lastIssueInfo.code[i];
            }

            $("#todayIssuesBody").prepend('<ul class="fix"><li>' + lastIssueInfo.issue + '</li><li><b>' + codes2.split(' ').join('</b><b>') + '</b></li></ul>');
        }

        var helper = {
            SXBD: {
                0: 1,
                1: 1,
                2: 2,
                3: 3,
                4: 4,
                5: 5,
                6: 7,
                7: 8,
                8: 10,
                9: 12,
                10: 13,
                11: 14,
                12: 15,
                13: 15,
                14: 15,
                15: 15,
                16: 14,
                17: 13,
                18: 12,
                19: 10,
                20: 8,
                21: 7,
                22: 5,
                23: 4,
                24: 3,
                25: 2,
                26: 1,
                27: 1
            },
            EXBD: {
                0: 1,
                1: 1,
                2: 2,
                3: 2,
                4: 3,
                5: 3,
                6: 4,
                7: 4,
                8: 5,
                9: 5,
                10: 5,
                11: 4,
                12: 4,
                13: 3,
                14: 3,
                15: 2,
                16: 2,
                17: 1,
                18: 1
            },
            SXHZ: {
                0: 1,
                1: 3,
                2: 6,
                3: 10,
                4: 15,
                5: 21,
                6: 28,
                7: 36,
                8: 45,
                9: 55,
                10: 63,
                11: 69,
                12: 73,
                13: 75,
                14: 75,
                15: 73,
                16: 69,
                17: 63,
                18: 55,
                19: 45,
                20: 36,
                21: 28,
                22: 21,
                23: 15,
                24: 10,
                25: 6,
                26: 3,
                27: 1
            },
            EXHZ: {
                0: 1,
                1: 2,
                2: 3,
                3: 4,
                4: 5,
                5: 6,
                6: 7,
                7: 8,
                8: 9,
                9: 10,
                10: 9,
                11: 8,
                12: 7,
                13: 6,
                14: 5,
                15: 4,
                16: 3,
                17: 2,
                18: 1
            },
            SXZXHZ: {
                1: 1,
                2: 2,
                3: 2,
                4: 4,
                5: 5,
                6: 6,
                7: 8,
                8: 10,
                9: 11,
                10: 13,
                11: 14,
                12: 14,
                13: 15,
                14: 15,
                15: 14,
                16: 14,
                17: 13,
                18: 11,
                19: 10,
                20: 8,
                21: 6,
                22: 5,
                23: 4,
                24: 2,
                25: 2,
                26: 1
            },
            factorial: function (n) {
                if (n <= 1) {
                    return 1
                } else {
                    return n * helper.factorial(n - 1)
                }
            },
            /**
             * 提取issue的期号 By Davy
             * issue 有如下类型：20150403-001 20150615-01     2015040
             * 逻辑：有'-'的取其后所有字符,没有的取最后三位
             */
            getNumByIssue: function (issue) {
                if (issue.length == 0) {
                    return false;
                }
                var pos = issue.indexOf("-");
                if (pos != -1) {
                    return issue.substr(pos + 1);
                } else {
                    return issue.substr(issue.length - 3);
                }
            },
            expandLotto: function ($nums) {
                var result = [];
                var tempVars = [];
                var oneAreaIsEmpty = 0;
                $.each($nums,
                    function (k, v) {
                        if ($.trim(v) == "") {
                            oneAreaIsEmpty = 1;
                            return
                        }
                        var tmp = v.split("_");
                        tmp.sort();
                        tempVars.push(tmp);
                    });
                if (oneAreaIsEmpty) {
                    return [];
                }

                var i, j, k, L, m;
                switch ($nums.length) {
                    case 2:
                        for (i = 0; i < tempVars[0].length; i++) {
                            for (j = 0; j < tempVars[1].length; j++) {
                                result.push(tempVars[0][i] + " " + tempVars[1][j]);
                            }
                        }
                        break;
                    case 3:
                        for (i = 0; i < tempVars[0].length; i++) {
                            for (j = 0; j < tempVars[1].length; j++) {
                                for (k = 0; k < tempVars[2].length; k++) {
                                    result.push(tempVars[0][i] + " " + tempVars[1][j] + " " + tempVars[2][k]);
                                }
                            }
                        }
                        break;
                    case 5:
                        for (i = 0; i < tempVars[0].length; i++) {
                            for (j = 0; j < tempVars[1].length; j++) {
                                for (k = 0; k < tempVars[2].length; k++) {
                                    for (L = 0; L < tempVars[3].length; L++) {
                                        for (m = 0; m < tempVars[4].length; m++) {
                                            result.push(tempVars[0][i] + " " + tempVars[1][j] + " " + tempVars[2][k] + " " + tempVars[2][L] + " " + tempVars[2][m]);
                                        }
                                    }
                                }
                            }
                        }
                        break;
                    default:
                        throw "unkown expand";
                        break;
                }
                var $finalResult = [];
                $.each(result,
                    function (k, v) {
                        var $parts = v.split(" ");
                        var tmp = array_unique($parts);
                        if (tmp.length == $parts.length) {
                            $finalResult.push(v);
                        }
                    });
                return $finalResult;
            }
        };

        var tool = {
            uniqueArr: function (a) {
                var hash = {};
                len = a.length;
                result = [];

                for (var i = 0; i < len; i++) {
                    if (!hash[a[i]]) {
                        hash[a[i]] = true;
                        result.push(a[i]);
                    }
                }
                return result;
            }
        };

        var initModesBar = function () {
            var tmpMode = 0.5;
            var mod = parseFloat(getCookie("mod_" + ps.lotteryId));
            $.each([0.5],
                function (k, v) {
                    if (v == mod) {
                        tmpMode = v;
                    }
                });
            ps.curMode = tmpMode;
        };

        var modesBar = {
            //点击模式按钮事件
            modesBtn_Click: function () {
                var curModeSpan = $("#modesDIV").val();
                if ($('#projectList').children('li').length > 0) {
                    parent.layer.confirm('切换元角分模式将影响您现有投注项，是否继续？', {icon: 7}, function (i) {
                            //更新当前选择的模式
                            ps.curMode = curModeSpan;
                            //重新计算投注区金额
                            buyBar.updateTotalSingle();
                            //重置所有小球为未选择的状态
                            //ballBar.reset();
                            //更新当前已选中小球金额
                            if ($('#betCount').text() != 0) {
                                buyBar.updateSingle($('#betCount').text());
                            }
                            //保存所选模式
                            modesBar.saveLastModes();
                            prizeBar.showPirze();   //每点一下应更新对应的玩法
                            parent.layer.close(i);
                        },
                        function (i) {
                            switch (ps.curMode) {
                            }
                            $("#modesDIV").val(ps.curMode);
                        });
                }
                else {
                    //更新当前选择的模式
                    ps.curMode = curModeSpan;
                    //更新当前已选中小球金额
                    if ($('#betCount').text() != 0) {
                        buyBar.updateSingle($('#betCount').text());
                    }

                    //加上选择样式
                    //curModeSpan.parent().children().removeClass('colorRed').filter('[mode=' + ps.curMode + ']').addClass('colorRed');
                    //重置所有小球为未选择的状态
                    //ballBar.reset();
                    //保存所选模式
                    modesBar.saveLastModes();
                    prizeBar.showPirze();   //每点一下应更新对应的玩法
                }

            },
            saveLastModes: function () {  //目前是保存到cookie里面
                setCookie('mod_' + ps.lotteryId, ps.curMode, 30 * 86400);
            }
        };

        //1.2 滑动奖金栏
        var initPrizeBar = function () {
            ps.rebateGapList = prizeBar.generateGapList();

            if (ps.rebateGapList.length == 0) {
                ps.halt("initPrizeBar failed");
            }

            ps.curPrizeIndex = ps.rebateGapList.length - 1;
            prizeBar.showPirze();
            $('#curPrizeSpan').change(prizeBar.changePrize);
        };

        //奖金滑动事件处理
        var prizeBar = {
            changePrize: function () {

                if ($.isEmptyObject(ps.curMethod) !== true) {
                    if (ps.curMethod.description.indexOf("@P@") > 0) {
                        //变更相应的玩法奖金说明
                        var curPrize = $("#curPrizeSpan option:selected").text().split("/");
                        var newDescription = '';
                        var descriptions = ps.curMethod.description.split("@P@");
                        for (var i = 1; i < descriptions.length; i++) {
                            if (ps.curMethod.prize[i] != undefined) {//以避免后台人员录入通配符错误导致程序错误
                                newDescription += descriptions[i - 1] + Math.round(ps.curMethod.prize[i] * curPrize[0] / ps.curMethod.prize[1] * 10000) / 10000 + "元";
                            }
                        }
                        newDescription += descriptions[descriptions.length - 1];
                        $("#methodDesc").text(newDescription);
                    }
                }
                ps.curPrizeIndex = $("#curPrizeSpan").val();
                prizeBar.saveLastPrize();
                buyBar.updateTotalSingle();
            },
            generateGapList: function () {
                var result = [];
                $.each(ps.minRebateGaps,
                    function (k, v) {
                        v.from = parseFloat(v.from);
                        v.to = parseFloat(v.to);
                        v.gap = parseFloat(v.gap);
                        if (ps.rebate > v.to) {
                            for (var i = v.from; i <= v.to; i += v.gap) {
                                result.push(parseFloat(number_format(i, 3)));
                            }
                        } else {
                            for (i = v.from; i < v.to && i < ps.rebate; i += v.gap) {
                                result.push(parseFloat(number_format(i, 3)));
                            }
                            result.push(parseFloat(number_format(ps.rebate, 3)));
                        }
                    });

                result = array_unique(result);
                var result2 = [];
                $.each(result,
                    function (k, v) {
                        var prize = round(ps.maxCombPrize * (ps.prizeRate + v), 0);
                        result2.push({
                            rebate: round(ps.rebate - v, 3),
                            prize: prize
                        });
                    });

                return result2;
            },
            //显示当前奖金
            showPirze: function () {
                if ($.isEmptyObject(ps.curMethod) !== true) {
                    $('#curPrizeSpan').empty();
                    $.each(ps.rebateGapList,
                        function (k, v) {
                            var selectPrize1 = round(ps.curMode * ps.curMethod.prize[1] * (ps.prizeRate + ps.rebate - ps.rebateGapList[k].rebate) / ps.prizeRate, 4);
                            var selectPrize2 = round(ps.curMode * ps.curMethod.prize[2] * (ps.prizeRate + ps.rebate - ps.rebateGapList[k].rebate) / ps.prizeRate, 4);
                            var selectRebate = number_format(parseFloat(ps.rebateGapList[k].rebate) * 100, 1);

                            if(ps.curMethod.name=="TMZX" || ps.curMethod.name=="SZS" || ps.curMethod.name=="EZE" || ps.curMethod.name=="ZTYM"){
                                $('#curPrizeSpan').append('<option value="' + k + '"><a>' + selectPrize1 + '</a>/' + selectRebate +'%;</option>')
                            }else{
                                $('#curPrizeSpan').append('<option value="' + k + '">一等奖:' + selectPrize1 + ';二等奖:' +selectPrize2+ '/' + selectRebate + '%</option>');
                            }

                            if ($.inArray(ps.curMethod.name, ['ELX','SLX','SILX','SZS','EZE','SZE']) !== -1) {
                                $('#rebateText').text('赔率/返点:');
                            } else {
                                $('#rebateText').text('返点:');
                            }
                            //$('.rebateValue2').append( '<option value="' + k + '">'+ selectPrize2 + '</option>');
                        });
                    /*滑块置左*/
                    // ps.curPrizeIndex = 0;
                    $("#curPrizeSpan").val(ps.curPrizeIndex);
                    prizeBar.changePrize();
                    //console.log($('#curPrizeSpan option').length -1);
                    $fun = function($curPrizeSpan){
                        if ($.inArray(ps.curMethod.name, ['ZTYM','TMZX','TMSX','TMWS','TMSB','TMDXDS','ZTYX','ZTWS']) !== -1) {
                            $('.rebateValue1').html($curPrizeSpan.split('/')[0]);
                            $('.rebateValue2').html($curPrizeSpan.substring(4,$curPrizeSpan.indexOf(";")));
                            $('.rebateValue3').html($curPrizeSpan.substring($curPrizeSpan.indexOf(";")+5).split('/')[0]);
                            $('#rebateValue').html($curPrizeSpan.split('/')[1]);
                            $('.prize').text('返点：');
                        } else {
                            $('.rebateValue_lmlx').html($curPrizeSpan);
                            $('.rebateValue1').html($curPrizeSpan.split('/')[0]);
                            $('.rebateValue2').html($curPrizeSpan.substring(4,$curPrizeSpan.indexOf(";")));
                            $('.rebateValue3').html($curPrizeSpan.substring($curPrizeSpan.indexOf(";")+5).split('/')[0]);
                            $('.rebateValue10').val($curPrizeSpan);
                            $('.rebateValue11').val($curPrizeSpan);
                            $('.rebateValue12').val($curPrizeSpan);
                            $('#rebateValue').html($curPrizeSpan);
                            $('.prize').text('赔率/返点：');
                        }
                    };

                    $('#selectRebate').slider({//初始化滑动块.
                        range: 'min',
                        min: 0,
                        max: ($('#curPrizeSpan option').length -1),
                        value: $('#curPrizeSpan option:selected').index(),
                        slide: function(event, ui){
                            $('#curPrizeSpan option').removeAttr('selected');
                            $('#curPrizeSpan option').eq(ui.value).attr('selected', true);

                            var $curPrizeSpan = $('#curPrizeSpan option').eq(ui.value).html();
                            $fun($curPrizeSpan);
                            $('#curPrizeSpan').change();
                            ps.curPrizeIndex = ui.value;
                        }
                    });

                    var $curPrizeSpan = $('#curPrizeSpan option:selected').html();
                    $fun($curPrizeSpan);
                }
            },
            //保存当前奖金设置
            saveLastPrize: function () {
                setCookie("reb_" + ps.lotteryId, ps.rebateGapList[ps.curPrizeIndex].rebate, 30 * 86400);
            }
        };

        //3.玩法相关
        var initMethodBar = function () {
            /*
             <li id="methodGroup_0"><label>后一</label>
             <ul id="method_0" class="methodPopStyle" style="display: none;">
             <li id="method_0_1">后一直选</li>
             <li id="method_0_2">五星选</li>
             </ul>
             </li>
             */
            $.each(ps.methods,
                function (i, n) {
                    if (n.childs.length == 1) {
                        $('<li class="methodGroupLI_' + i + '" id="methodGroup_' + i + '"><label>' + n.mg_name + "</label></li>").click(methodBar.methodGroup_Click).appendTo("#methodGroupContainer");
                    } else {
                        $('<li class="methodGroupLI_' + i + '" id="methodGroup_' + i + '"><label>' + n.mg_name + "</label></li>").click(methodBar.methodGroup_Click).hover(methodBar.methodGroup_hoverOver, methodBar.methodGroup_hoverOut).appendTo("#methodGroupContainer");
                    }
                    var dl1 = '',dl2 = '',dl3 = '',dl4 = '',dl5 = '',dl6 = '',dl7 = '',dl8 = '',dl9 = '',dl0 = '',dl10 = '';
                    if (n.mg_id == 6 || n.mg_id == 50 || n.mg_id == 57 || n.mg_id == 169) {//如果是11选5任选
                        dl0 = '<dl class="fix"><dt>任选复式：</dt>';
                        dl10 = '<dl class="fix"><dt>任选单式：</dt>';
                    } else {
                        dl1 = '<dl class="fix"><dt>直选：</dt>';
                        dl2 = '<dl class="fix"><dt>组选：</dt>';
                        dl3 = '<dl class="fix"><dt>趣味：</dt>';
                        dl4 = '<dl class="fix"><dt>特殊：</dt>';
                        dl5 = '<dl class="fix"><dt>定位：</dt>';
                        dl6 = '<dl class="fix"><dt>不定位：</dt>';
                        dl7 = '<dl class="fix"><dt>任选二：</dt>';
                        dl8 = '<dl class="fix"><dt>任选三：</dt>';
                        dl9 = '<dl class="fix"><dt>任选四：</dt>';
                        dl0 = '<dl class="fix"><dt>其他：</dt>';
                    }
                    var methodStr = '';
                    var div = '';
                    if (i == 0) {
                        div = $('<div id="method_' + i + '" class="methodControl"></div>').addClass('methodPopStyle');   //.hide();
                    } else {
                        div = $('<div id="method_' + i + '" class="methodControl"></div>').addClass('methodPopStyle').hide();
                    }
                    $.each(n.childs, function (ii, nn) {
                        var dd = '<dd class="method" name="' + nn.name + '" pid="method_' + i + '" id="method_' + i + "_" + ii + '">' + nn.cname + '</dd>';
                        var ddSon = '';
                        // nn.method_property 1直选2组选3趣味4特殊0其他
                        if (nn.method_property == 1) {
                            dl1 += dd;
                        } else if (nn.method_property == 2) {
                            dl2 += dd;
                        } else if (nn.method_property == 3) {
                            dl3 += dd;
                        } else if (nn.method_property == 4) {
                            dl4 += dd;
                        } else if (nn.method_property == 5) {
                            dl5 += dd;
                        } else if (nn.method_property == 6) {
                            dl6 += dd;
                        } else if (nn.method_property == 7) {
                            dl7 += dd;
                        } else if (nn.method_property == 8) {
                            dl8 += dd;
                        } else if (nn.method_property == 9) {
                            dl9 += dd;
                        } else if (nn.method_property == 0) {
                            dl0 += dd;
                        }
                        //如果该玩法有单式就再补充进去
                        if (nn.can_input == 1) {
                            ddSon = '<dd class="method" name="' + nn.name + "son" + '" pid="method_' + i + '" id="method_' + i + "_" + ii + "son" + '">' + nn.cname + "单式" + "</dd>";
                            if (nn.method_property == 1) {
                                dl1 += ddSon;
                            } else if (nn.method_property == 2) {
                                dl2 += ddSon;
                            } else if (nn.method_property == 3) {
                                dl3 += ddSon;
                            } else if (nn.method_property == 4) {
                                dl4 += ddSon;
                            } else if (nn.method_property == 5) {
                                dl5 += ddSon;
                            } else if (nn.method_property == 6) {
                                dl6 += ddSon;
                            } else if (nn.method_property == 7) {
                                dl7 += ddSon;
                            } else if (nn.method_property == 8) {
                                dl8 += ddSon;
                            } else if (nn.method_property == 9) {
                                dl9 += ddSon;
                            } else if (nn.method_property == 0) {
                                if (n.mg_id == 6 || n.mg_id == 50 || n.mg_id == 57 || n.mg_id == 169) {
                                    dl10 += ddSon;
                                } else {
                                    dl0 += ddSon;
                                }
                            }
                        }
                    });
                    dl1 += '</dl>';
                    dl2 += '</dl>';
                    dl3 += '</dl>';
                    dl4 += '</dl>';
                    dl5 += '</dl>';
                    dl6 += '</dl>';
                    dl7 += '</dl>';
                    dl8 += '</dl>';
                    dl9 += '</dl>';
                    dl0 += '</dl>';
                    dl10 += '</dl>';
                    if (dl1.indexOf('</dd>') < 0) {
                        dl1 = '';
                    }
                    if (dl2.indexOf('</dd>') < 0) {
                        dl2 = '';
                    }
                    if (dl3.indexOf('</dd>') < 0) {
                        dl3 = '';
                    }
                    if (dl4.indexOf('</dd>') < 0) {
                        dl4 = '';
                    }
                    if (dl5.indexOf('</dd>') < 0) {
                        dl5 = '';
                    }
                    if (dl6.indexOf('</dd>') < 0) {
                        dl6 = '';
                    }
                    if (dl7.indexOf('</dd>') < 0) {
                        dl7 = '';
                    }
                    if (dl8.indexOf('</dd>') < 0) {
                        dl8 = '';
                    }
                    if (dl9.indexOf('</dd>') < 0) {
                        dl9 = '';
                    }
                    if (dl0.indexOf('</dd>') < 0) {
                        dl0 = '';
                    }
                    if (dl10.indexOf('</dd>') < 0) {
                        dl10 = '';
                    }
                    $(dl1 + dl2 + dl3 + dl4 + dl5 + dl6 + dl7 + dl8 + dl9 + dl0 + dl10).appendTo(div);
                    $.each(n.childs, function (ii, nn) {
                        $('#method_' + i + "_" + ii).live("click", nn, methodBar.method_Click).hover(methodBar.method_hoverOver, methodBar.methodGroup_hoverOut);
                        $("#method_" + i + "_" + ii + "son").live("click", nn, buyBar.inputBtn_Click).hover(methodBar.method_hoverOver, methodBar.methodGroup_hoverOut);
                    });
                    $("#methods").append(div);
                });
            $(".subTopBar").mouseleave(function () {
                $(this).find("li").removeClass("methodGroup_hover");
                // /\w+_(\d+)/.test($(this).attr("id"));
                // var index = RegExp.$1;
                //$(this).find("ul li .methodPopStyle").hide();
            });
            methodBar.selectDefault();
        };

        //玩法组及玩法菜单事件处理
        var methodBar = {
            methodGroup_Click: function (e) {
                $(this).addClass("methodGroup_selected").siblings().removeClass("methodGroup_selected methodGroup_hover");
                //必须这样做
                if ($(e.target).is('label')) {
                    $(this).find('dd:first').click();
                    //   $("#traceBtn").show();
                    if ($(".choMainTab").children('.progressBar')) {
                        $(".progressBar").remove();
                        $(".choMainTab").css("padding-top", "");
                    }
                }
                ;
                $(this).addClass("methodGroup_hover");
                /\w+_(\d+)/.test($(this).attr("id"));
                var index = RegExp.$1;
                $(".playNav ul .methodPopStyle").hide();
                $(this).find('.methodPopStyle').show();
                $(".methodControl").hide();
                $("#method_" + index).show();
                $("#method_" + index + "_0").click();
            },
            methodGroup_hoverOver: function () {
                $(this).addClass("methodGroup_hover");
                if ($(this).hasClass("methodGroup_selected")) {
                    $(this).find('.methodPopStyle').show();
                }
                ;
            },
            methodGroup_hoverOut: function () {
                $(this).removeClass("methodGroup_hover");
                /\w+_(\d+)/.test($(this).attr("id"));
                var index = RegExp.$1;
            },
            method_hoverOver: function () {
                $(this).addClass("method_hover");
                /\w+_(\d+)/.test($(this).attr("id"));
                var index = RegExp.$1;
                //$("#method_" + index).show().siblings().hide();
                //$("#method_" + index).children(":first").click();
                $(this).find('.methodPopStyle').show();
            },
            method_hoverOut: function () {
                $(this).removeClass("method_hover");
                /\w+_(\d+)/.test($(this).attr("id"));
                var index = RegExp.$1;
                $(this).find('.methodPopStyle').hide();
            },
            method_Click: function (e) {
                ps.curMethod = e.data;
                //$('.methodPopStyle').hide();
                //设置当前玩法前景色以示区别
                //$('#methodGroupContainer').find('.method').removeClass("method_selected");
                //$(this).addClass("method_selected");
                var $method = $(this);
                var pid = $method.attr("pid");
                $("#" + pid).find('.method').removeClass("method_selected");
                $method.addClass("method_selected");

                $('#curMethod').text(ps.curMethod.cname);
                //玩法提示文字
                $("#methodDesc").text(ps.curMethod.description).hide();
                //备注tips
                $("#methodTipInfo").hover(function () {
                    var t = layer.tips($("#methodDesc").text(), this, {
                        tips: [2, '#f13131'],
                        maxWidth: 250,
                        time: 0,
                        closeBtn: 0
                    });
                }, function () {
                    layer.closeAll('tips');
                });
                // $('#methodTipInfo').hover(function() {
                //     $("#methodDesc").show();
                // }, function() {
                //     $("#methodDesc").hide();
                // });
                //显示手工输入
                // if (ps.curMethod.can_input == 1) {
                //     $("#inputBtn").show();
                // } else {
                //     $("#inputBtn").hide();
                // }
                ballBar.generateBall();
                //$("input[name=missHotBtn]:checked").click();
                //$("#inputBtn").text("手工录入");
                //$("#singleInfo").hide();
                $(".selectRandomBtn").parent().hide();
                buyBar.updateSingle(0);
                prizeBar.showPirze();
                if (propLen(ps.curMethod.field_def) == 0) {
                    ballBar.showInput();
                    $("#singleInfo").show();
                    // $("#delTA").click(function() {
                    //     $("#inputTA").val("");
                    // });
                    $("#selectArea").removeClass("N-selected");
                }
                ;

                var counts = propLen(ps.curMethod.field_def);
                if (counts == 2) {
                    $(".locate").css("padding", "10px 0");
                }
                ;
                if (propLen(ps.curMethod.field_def) == 3) {
                    $(".locate").css("padding", "10px 0");
                }
                ;
                if (propLen(ps.curMethod.field_def) == 4) {
                    $(".locate").css("padding", "5px 0");
                }
                ;
            },
            selectDefault: function () {
                $("#methodGroupContainer").find("label:contains('特码')").click();
                $(".playNav ul ul").hide();
            }
        };
        //3.1投注球事件处理 ball_Selected为选中后的样式
        var ballBar = {
            reset: function () {
                if ($.isEmptyObject(ps.curMethod.field_def)) {
                    return;
                }
                $.each(ps.curMethod.field_def, function (i, prop) {
                    $('#field_' + i).children().removeClass('ball_Selected');
                });
                buyBar.updateSingle(0);
            },
            showInput: function () {
                $("#selectArea").children().remove();
                $(str).appendTo("#selectArea");
                $("#delTA").click(function () {
                    $("#inputTA").val("");
                    $(".FatherCodeBtn").removeClass("selectCodeBtn_selected");
                    //$("#selectCodeBtn").removeClass("selectCodeBtn_selected");
                });
                $("#inputTA").live('keyup', function () {
                    if ($("#inputTA").val() != '') {
                        $(".FatherCodeBtn").addClass('selectCodeBtn_selected');
                        $(this).removeClass('MachineSeleBg');
                    } else {
                        $(".FatherCodeBtn").removeClass('selectCodeBtn_selected');
                        $(this).addClass('MachineSeleBg');
                    }
                });
            },
            //显示投注球
            generateBall: function () {
                $("#selectArea").children().remove();
                $('#quickSelect').data('val', 0).text('快捷投注'); // quickSelect

                /* 信用不需要最下边的输入框  begin */
                if ($.inArray(ps.curMethod.name, ['TMZX', 'TMSX', 'TMWS', 'TMSB', 'TMDXDS', 'ZTYX', 'ZTWS', 'ZTYM']) !== -1) {
                    $('#quickSelect').show();

                } else {
                    $('#quickSelect').hide();
                }
                /* 信用不需要最下边的输入框  end */

                var Reds = new Array(1, 2, 7, 8, 12, 13, 18, 19, 23, 24, 29, 30, 34, 35, 40, 45, 46);
                var Blues = new Array(3, 4, 9, 10, 14, 15, 20, 25, 26, 31, 36, 37, 41, 42, 47, 48);
                var Greens = new Array(5, 6, 11, 16, 17, 21, 22, 27, 28, 32, 33, 38, 39, 43, 44, 49);
                $.each(ps.curMethod.field_def, function (i, prop) {  //注：i从1开始
                    var numList = prop.nums.split(" ");
                    var ballStr = '', hzbdStr = "";
                    var ballClass = '';
                    //var traceMethodPrize='';
                    $.each(numList, function (ii, nn) {
                        switch (ps.curMethod.name) {
                            case "SXBD":
                            case "ZSBD":
                            case "QSBD":
                                ballStr += '<li>' + nn + '</li>';    //<span class="HZBD">' + helper.SXBD[ii] + "</span>"
                                hzbdStr += '<li>' + helper.SXBD[ii] + '</li>';
                                break;
                            case "SXHZ":
                            case "ZSHZ":
                            case "QSHZ":
                                ballStr += '<li>' + nn + '</li>';
                                hzbdStr += '<li>' + helper.SXHZ[ii] + '</li>';
                                break;
                            case "EXBD":
                            case "QEBD":
                                ballStr += '<li>' + nn + '</li>';
                                hzbdStr += '<li>' + helper.EXBD[ii] + '</li>';
                                break;
                            case "EXHZ":
                            case "QEHZ":
                                ballStr += '<li>' + nn + '</li>';
                                hzbdStr += '<li>' + helper.EXHZ[ii] + '</li>';
                                break;
                            case 'SXZXHZ':
                            case 'QSZXHZ':
                                ballStr += '<li>' + nn + '</li>';
                                hzbdStr += '<li>' + helper.SXZXHZ[ii + 1] + '</li>';
                                break;
                            case 'TMZX':
                            case 'ZTYM':
                                if ($.inArray(parseInt(nn), Reds) != -1) {
                                    ballClass = 'red';
                                } else if ($.inArray(parseInt(nn), Blues) != -1) {
                                    ballClass = 'blue';
                                } else if ($.inArray(parseInt(nn), Greens) != -1) {
                                    ballClass = 'green';
                                }
                                ballStr += '<li>' + '<span class="' + ballClass + '">' + nn + '</span><b class="rebateValue1"></b>' + '<input type="number" list="itemlist" name="multiple" class="f-left form-control" maxlength="5" data-ball="' + nn + '" /></li>';

                                break;
                            case 'ELX':
                            case 'SLX':
                            case 'SILX':
                            case 'SZS':
                            case 'SZE':
                            case 'EZE':
                                //ballStr += '<li>' + nn +'<input class="rebateValue12" /></li>';
                                ballStr += '<li>' + nn + '</li>';
                                break;
                            default:
                                var sballlist = 'red';
                                if (nn == '蓝') {
                                    sballlist = 'blue';
                                }
                                ;
                                if (nn == '绿') {
                                    sballlist = 'green';
                                }
                                ;
                                ballStr += '<li>' + '<span class="' + sballlist + '">' + nn + '</span>';
                                var layClass = 'rebateValue2';
                                //var layname = '红';
                                //var layname = '0';
                                if (nn > 0) {
                                    layClass = 'rebateValue3';
                                }
                                ;
                                if (nn == '鸡') {
                                    layClass = 'rebateValue3';
                                }
                                ;
                                if (nn == '红') {
                                    layClass = 'rebateValue3';
                                }
                                ;
                                if (nn == '大') {
                                    layClass = 'rebateValue3';
                                }
                                ;
                                if (nn == '单') {
                                    layClass = 'rebateValue3';
                                }
                                ;
                                ballStr += '<b name="' + nn + '" class="' + layClass + '"></b>'
                                ballStr += '<input type="number" list="itemlist" name="multiple" class="f-left form-control" maxlength="5" data-ball="' + nn + '" /></li>';
                                break;
                        }
                        ;
                    });
                    var ballListName = 'ballList';
                    if (ps.curMethod.name === "ELX" || ps.curMethod.name === "SLX" || ps.curMethod.name === "SILX" || ps.curMethod.name === "SZS" || ps.curMethod.name === "SZE" || ps.curMethod.name === "EZE") {
                        ballStr = '<li><ul class="' + ballListName + (/(BD|HZ)$/.test(ps.curMethod.name) ? " w400" : "") + ' x_uimb" id=field_' + i + ">" + ballStr + "</ul></li>";
                        //$("#selectCodeBtn").show();
                        $("#confirmBtn").show();
                        $(".rebateValue_lmlx").show();
                        $("#totalSingleInfo").show();
                        $("#multiple").show();
                    } else {
                        ballStr = '<li class="allw100"><ul class="' + ballListName + (/(BD|HZ)$/.test(ps.curMethod.name) ? " w400" : "") + 'new_x" id=field_' + i + ">" + ballStr + "</ul></li>";
                        // $("#selectCodeBtn").hide();
                        $("#confirmBtn").show();
                        $("#rebateValue").show();
                        $(".rebateValue_lmlx").hide();
                        $("#totalSingleInfo").hide();
                        $("#multiple").hide();
                    }
                    hzbdStr = '<li><ul class="BDHZinfo">' + hzbdStr + "</ul></li>";
                    var specialClass = "";

                    $('<div class="locate" id="locate_' + i + '"><ul class="lotteryNumber' + specialClass + '">' + (prop.prompt ? '<li class="areaPrefix" style="display:none">' + prop.prompt + "</li>" : "") + ballStr + "</ul></div>").appendTo("#selectArea");

                    //暂不显示遗漏冷热
                    //var result = ballBar.getAssisInfo(i);
                    var result = [];
                    if (result.length > 0) {
                        $.each(result, function (i, n) {
                            $(n).appendTo('#selectArea');
                        });
                    }
                    ;
                });
                //绑定球点击事件
                if ($.inArray(ps.curMethod.name, ['TMZX', 'TMSX', 'TMWS', 'TMSB', 'TMDXDS', 'ZTYX', 'ZTWS', 'ZTYM']) === -1) {
                    $('.lotteryNumber ul>li').bind("click", ballBar.ball_Click);
                }

                //input输入判断
                $(".f-left").click(function () {
                    this.focus();
                    this.select();
                }).blur(function () {
                    if (this.value == '' || this.value == 0) {
                        this.value = '';
                        buyBar.updateTotalSingle();
                    }
                }).keyup(buyBar.checkMultiple).keyup(buyBar.updateTotalSingle);
            },
            ball_Click: function (e) {
                var $this = $(this);
                $(this).toggleClass("ball_Selected");

                /* quickSelect begin */
                if ($this.find('span').length > 0) {
                    $this.find('span').toggleClass('lhc_select');
                }
                /* quickSelect end */

                /\w+_(\d+)/.test($(this).parent().attr("id"));
                var index = RegExp.$1;
                if ($(this).parent().find(".ball_Selected").length > ps.curMethod.field_def[index].max_selected) {
                    if (ps.curMethod.field_def[index].max_selected == 1) {
                        $(this).siblings(".ball_Selected").removeClass("ball_Selected");
                    } else {
                        $(this).removeClass("ball_Selected");
                        parent.layer.alert("当前最多只能选择" + ps.curMethod.field_def[index].max_selected + "个号码", {icon: 7});
                    }
                } else {

                    ballBar.computeSingle();
                }
            },
            //计算注数
            computeSingle: function () {
                var codes = [];
                $.each(ps.curMethod.field_def,
                    function (i, n) {
                        var tmp = "";
                        var tmp2 = ps.curMethod.field_def[i].nums.split(" ");
                        $("#field_" + i + " li").each(function (ii) {
                            var $this = $(this);
                            if ($(this).hasClass("ball_Selected")) {

                                if (ps.lotteryType == 9 || ps.curMethod.field_def[i].max_selected > 10 || tmp2[tmp2.length - 1].length > 1) {
                                    /* quickSelect begin */
                                    if (+($('#quickSelect').data('val')) === 1) {
                                        tmp += $this.find('span').text() + '_';
                                    } else {
                                        tmp += $this.text() + '_';
                                    }
                                    /* quickSelect end */
                                } else {
                                    /* quickSelect begin */
                                    if (+($('#quickSelect').data('val')) === 1) {
                                        tmp += $this.find('span').text();
                                    } else {
                                        tmp += $this.text();
                                    }
                                    /* quickSelect end */
                                }
                            }
                        });
                        if (tmp.indexOf("_") == -1) {
                            codes.push(tmp)
                        } else {
                            codes.push(tmp.substr(0, tmp.length - 1))
                        }
                    });

                var ob = isLegalCode(codes);
                buyBar.updateSingle(ob.singleNum);
                var resultCode = codes.join(",");
                return {
                    singleNum: ob.singleNum,
                    isDup: ob.isDup,
                    code: resultCode
                }
            }
        };

        //4.遗漏
        var initMissHotBar = function () {
            $("input[name=missHotBtn]").click(missHotBar.missHotBtn_Click);
            $("input[name=missHotBtn][value=1]").click()
        };
        var missHotBar = {
            missHotBtn_Click: function () {
                if ($(this).val() == "1") {
                    $("#selectArea .missDIV").removeClass("hidden");
                    $("#selectArea .hotDIV").addClass("hidden")
                }
                else {
                    $("#selectArea .missDIV").addClass("hidden");
                    $("#selectArea .hotDIV").removeClass("hidden")
                }
            }
        };

        //5.投注区相关
        var initBuyBar = function () {
            ps.nextProjectCounter = 0;
            buyBar.removeAll();

            //$("#totalSingleInfo").prepend('总计[<span>0</span>]注 倍数<input name="multiple" id="multiple" value="1"/>');
            $("#multiple").click(function () {
                this.focus();
                this.select();
            })
                /*.blur(function(){
                 if(this.value == '' || this.value == 0) {
                 this.value = 1;
                 }
                 })*/
                .keyup(buyBar.checkMultiple).keyup(buyBar.updateTotalSingle);
            $(".xDel").live("click",
                function () {
                    $(this).parent().remove();
                    buyBar.updateTotalSingle();
                });
            /* quickSelect begin */
            $('#quickSelect').click(function () {
                var $this = $(this);
                var quickSelect = +($(this).data('val'));
                $('#betCount').text('0');
                if (quickSelect === 0) {
                    $this.data('val', 1);
                    // 禁用行内输入框
                    $('.f-left').attr('readonly', 'readonly').css('backgroundColor', '#eee').addClass('cur-not').val('');
                    // 显示输入栏
                    $('#totalSingleInfo').show();
                    $('#singleInfo').show();
                    $('#multiple').show().val('');
                    // 绑定行内点击事件
                    $('.lotteryNumber ul>li').bind('click', ballBar.ball_Click).addClass("ball_lihover");
                    $this.text('一般投注');
                } else {
                    $this.data('val', 0);
                    // 启用行内输入框
                    $('.f-left').removeAttr('readonly').css('backgroundColor', '').removeClass('cur-not').val('');
                    // 显示输入栏
                    $('#totalSingleInfo').hide();
                    $('#singleInfo').hide();
                    $('#multiple').val('');
                    // 解除行内点击事件
                    $('.lotteryNumber ul>li').unbind('click', ballBar.ball_Click).removeClass("ball_lihover");
                    // 清除已选球样式
                    $('.ball_Selected').removeClass('ball_Selected');
                    $('.lhc_select').removeClass('lhc_select');
                    $this.text('快捷投注');
                }
            });

            // 快捷金额
            $('#choPirze li').click(function () {
                var length = $('.f-left').length;
                var quickSelect = +($('#quickSelect').data('val'));
                if (quickSelect || length === 0) {
                    $('#multiple').val($(this).data('value'));
                } else {
                    $('.f-left').val($(this).data('value'));
                }
            });
            /* quickSelect end */

            $("#clearProjectBtn").click(buyBar.removeAll);
            $("#inputBtn").click(buyBar.inputBtn_Click);
            $("#selectCodeBtn").click(buyBar.selectCodeBtn_Click);
            $("#selectCodeBtnFast").click(buyBar.selectCodeBtnFast);
            $("#confirmBtn").click(function () {
                buyBar.confirmBtn_Click()
            });
            //$("#traceBtn").click(buyBar.traceBtn_Click);
            $(".selectRandomBtn").click(buyBar.selectRandomBtn_Click);
            $("#plusBtn").click(buyBar.plusBtn_Click);
            $("#minusBtn").click(buyBar.minusBtn_Click);

        };

        var buyBar = {
            plusBtn_Click: function () {
                var multiple = $("#multiple").val();
                $("#multiple").val(parseInt(multiple) + 1);
                buyBar.checkMultiple();
                buyBar.updateTotalSingle();
            }
            , minusBtn_Click: function () {
                var multiple = $("#multiple").val();
                if (parseInt(multiple) > 1) {
                    $("#multiple").val(multiple - 1);
                    buyBar.checkMultiple();
                    buyBar.updateTotalSingle();
                }
            }
            , inputBtn_Click: function (e) {
                ps.curMethod = e.data;
                //$('.methodPopStyle').hide();
                ballBar.showInput();
                //$("#singleInfo").hide();
                //$('#methodGroupContainer').find('.method').removeClass("method_selected");
                //$(this).addClass("method_selected");
                var $method = $(this);
                var pid = $method.attr("pid");
                $("#" + pid).find('.method').removeClass("method_selected");
                $method.addClass("method_selected");
                $("#selectCodeBtn").addClass("selectCodeBtn_selected");
                $(".selectRandomBtn").parent().show();
                /*
                 $("#inputTA").mouseout(function() {
                 if ($("#inputTA").val() !== "") {
                 $("#selectCodeBtn").addClass("selectCodeBtn_selected");
                 } else {
                 $("#selectCodeBtn").removeClass("selectCodeBtn_selected");
                 }
                 });
                 */
                $("#selectArea").removeClass("N-selected");
                //$(".selectRandomBtn").hide();
                //            if ($(this).text() == "手工录入") {
                //                $(this).text("常规录入");
                //            } else {
                //                $(this).text("手工录入");
                //                $("#singleInfo").show();
                //                ballBar.generateBall();
                //                $("input[name=missHotBtn]:checked").click();
                //                $("#selectArea").addClass("N-selected");
                //                $("#selectCodeBtn").removeClass("selectCodeBtn_selected");
                // $(".selectRandomBtn").show();
                //            }
            },
            selectCodeBtn_Click: function () {
                //var d = new Date();var t0 = d.getTime();
                if ($("#totalBetCount").text() == 0) {
                    parent.layer.alert("请先选择号码再投注", {icon: 7});
                }
                ;
                if ($("#inputTA").length > 0) {
                    var allCodes = [];
                    var str = $.trim($("#inputTA").val());
                    if (str.length == 0) {
                        return false;
                    }

                    //节省字符串连接时间
                    var ob = {
                        singleNum: 1,
                        isDup: 0
                    };
                    var strPart1 = '<li><span class="width1" mid="' + ps.curMethod.method_id + '" mname="' + ps.curMethod.name + '">';
                    var strPart2 = ps.curMethod.cname + '</span><span class="width2">';
                    //+ps.nextProjectCounter + "." + ps.curMethod.cname + '</span><span class="width60px">';
                    if (allCodes.length <= 1000) {
                        for (var i in allCodes) {
                            var ob = isLegalCode(allCodes[i]);
                            //对于三星连选，选一注的singleNum是3注，所以这个得动态算
                            var singleAmount = number_format(ob.singleNum * 2 * ps.curMode, 3);
                            var strPart3 = '</span><span class="width3">' + ob.singleNum + '注</span><span class="width4">￥' + singleAmount + '</span><span class="xDel">X</span></li>';
                            if (ob.isDup) { //对于三星连选，选1注相当于3注，所以不能加ob.singleNum != 1条件
                                parent.layer.alert("您输入的号码有误，请重新检查输入!", {icon: 7});
                                return false;
                            }
                            ps.nextProjectCounter++;
                            //var singleAmount = number_format(ob.singleNum * 2 * ps.curMode, 2);
                            //140329 加入排除重复号码功能 相同号码将无法加上 为效率起见100以下方案才判断
//                        var isDuplicate = false;
//                        if (allCodes.length < 100) {
//                            $("#projectList").children("li").each(function(ii) {
//                                if (ps.curMethod.method_id == $(this).children().eq(0).attr("mid") && allCodes[i].join(",") == $(this).children().eq(1).text()) {
//                                    isDuplicate = true;
//                                }
//                            });
//                            if (isDuplicate) {
//                                //parent.layer.alert('"' + allCodes[i].join(",") + '" 已添加至投注项，请勿重复添加！');
//                                continue;
//                            }
//                        }

                            //$('<li><span class="width80px" mid="' + ps.curMethod.method_id + '">' + ps.nextProjectCounter + "." + ps.curMethod.cname + '</span><span class="width60px">' + allCodes[i].join(",") + '</span><span class="width100px">' + ob.singleNum + '注</span><span class="width100px">￥' + singleAmount + '</span><span class="xDel">X</span></li>').appendTo("#projectList")
                            $(strPart1 + strPart2 + allCodes[i].join(",") + strPart3).appendTo("#projectList");
                        }
                    }
                    else {
                        var allCodesStr = '';
                        var allProjectsStr = '';
                        for (var i in allCodes) {
                            if (allCodesStr) {
                                allCodesStr += '|';
                            }
                            allCodesStr += allCodes[i].join(",");
                            var ob = isLegalCode(allCodes[i]);
                            if (ob.isDup) { //对于三星连选，选1注相当于3注，所以不能加ob.singleNum != 1条件
                                parent.layer.alert("您输入的号码有误，请重新检查输入!", {icon: 7});
                                return false;
                            }
                        }
                        var singleAmount = number_format(allCodes.length * 2 * ps.curMode, 3);
                        var strPart3 = '</span><span class="width3">' + allCodes.length + '注</span><span class="width4">￥' + singleAmount + '</span><span class="xDel">X</span></li>';
                        ps.nextProjectCounter = allCodes.length;
                        allProjectsStr += strPart1 + strPart2 + allCodesStr + strPart3;
                        $(allProjectsStr).appendTo("#projectList");
                    }
                    buyBar.updateTotalSingle();
                    //$("#confirmBtn").removeClass('CantapCodeBtn');
                    $("#delTA").click();
                } else {
                    var ob = ballBar.computeSingle();
                    if (ob.singleNum == 0) {
                        return false;
                    }

                    ps.nextProjectCounter++;
                    var singleAmount = number_format(ob.singleNum * 2 * ps.curMode, 3);
                    //140329 加入排除重复号码功能 相同号码将无法加上 为效率起见100以下方案才判断
//                    var isDuplicate = false;
//                    if ($("#projectList").children("li").length < 100) {
//                        $("#projectList").children("li").each(function(i) {
//                            if (ps.curMethod.method_id == $(this).children().eq(0).attr("mid") && ob.code == $(this).children().eq(1).text()) {
//                                isDuplicate = true;
//                            }
//                        });
//                        if (isDuplicate) {
//                            //parent.layer.alert('"' + ob.code + '" 已添加至投注项，请勿重复添加！');
//                            return false;
//                        }
//                    }

                    $('<li><span class="width1" mid="' + ps.curMethod.method_id + '" mname="' + ps.curMethod.name + '">' + ps.curMethod.cname + '</span><span class="width2">' + ob.code + '</span><span class="width3">' + ob.singleNum + '注</span><span class="width4">￥' + singleAmount + '</span><span class="xDel">X</span></li>').appendTo("#projectList");
                    buyBar.updateTotalSingle();
                    ballBar.reset();
                    //$("#confirmBtn").removeClass('CantapCodeBtn');
                }
                //var d = new Date();var t1 = d.getTime();
                //alert("66 t0=" + t0 + "\nt1=" + t1 + "\nt1-t0=" + (t1-t0));
                $("#confirmBtn").click();
            },
            rxInputCodes: function (position, inputArr) {// position: 勾选的位数; inputArr: 填入的其中的一注号码
                var code = ['-', '-', '-', '-', '-'];
                for (var i = position[0]; i <= position[position.length - 1]; i++) {
                    code[i] = '';
                }

            },
            removeAll: function () {
                $("#token").val("");
                $(".ball_Selected").removeClass("ball_Selected");
                $(".lhc_select").removeClass("lhc_select");
                $('#betCount').text(0);
                $("#projectList").empty();
                ps.nextProjectCounter = 0;
                $("#multiple").val("");
                buyBar.updateTotalSingle();
            },
            updateSingle: function (singleNum) {
                var singleAmount = number_format(singleNum * 2 * ps.curMode, 3);
                $("#betCount").text(singleNum);
                $("#betAmount").text(singleAmount);

                return true;
                var projectListLen = $('#projectList li').length == 0 ? 1 : $('#projectList li').length;
                if (singleNum > 0) {
                    $("#selectCodeBtn").parent().addClass('selectCodeBtn_selected');
                    //计算盈亏
                    var totalBetAmount = $("#totalBetAmount").text()
                    var curPrizeHtml = $('#curPrizeSpan').find("option:selected").text();
                    var curPrize;
                    if (ps.curMethod.cname == "特码直选" || ps.curMethod.cname == "三中三" || ps.curMethod.cname == "二中二" || ps.curMethod.cname == "正特一码") {
                        curPrize = curPrizeHtml.split('/')[0];
                    } else {
                        curPrize = curPrizeHtml.match(/\d+\.\d+/)[0];
                    }
                    $("#totalWin").text(number_format(curPrize * projectListLen * $("#multiple").val() - totalBetAmount - singleAmount, 3));
                } else {
                    $("#selectCodeBtn").parent().removeClass('selectCodeBtn_selected');
                    //计算盈亏
                    var totalBetAmount = $("#totalBetAmount").text()
                    var curPrizeHtml = $('#curPrizeSpan').find("option:selected").text();
                    var curPrize;
                    if (ps.curMethod.cname == "特码直选" || ps.curMethod.cname == "三中三" || ps.curMethod.cname == "二中二" || ps.curMethod.cname == "正特一码") {
                        curPrize = curPrizeHtml.split('/')[0];
                    } else {
                        curPrize = curPrizeHtml.match(/\d+\.\d+/)[0];
                    }
                    $("#totalWin").text(number_format(curPrize * projectListLen * $("#multiple").val() - totalBetAmount, 3));
                }
            },
            updateTotalSingle: function () {
                var totalSingleNum = 0;
                $("#projectList").children("li").each(function (i) {
                    var spans = $(this).children();
                    totalSingleNum += parseInt(spans.eq(2).text());
                    spans.eq(3).text("￥" + number_format(parseInt(spans.eq(2).text()) * 2 * $("#multiple").val() * ps.curMode, 3));
                });
                if (totalSingleNum > 0) {
                    $("#confirmBtn").addClass('CantapCodeBtn_selected');
                } else {
                    $("#confirmBtn").removeClass('CantapCodeBtn_selected');
                }
                var projectListLen = $('#projectList li').length == 0 ? 1 : $('#projectList li').length;
                $("#totalBetCount").text(totalSingleNum);
                var totalBetAmount = number_format(totalSingleNum * 2 * $("#multiple").val() * ps.curMode, 3);
                $("#totalBetAmount").text(totalBetAmount);
                var curPrizeHtml = $('#curPrizeSpan').find("option:selected").text();
                var curPrize;
                if (ps.curMethod.cname == "特码直选" || ps.curMethod.cname == "三中三" || ps.curMethod.cname == "二中二" || ps.curMethod.cname == "正特一码") {
                    curPrize = curPrizeHtml.split('/')[0];
                } else {
                    curPrize = curPrizeHtml.match(/\d+\.\d+/)[0];
                }
                $("#totalWin").text(number_format(curPrize * projectListLen * $("#multiple").val() - totalBetAmount, 3));
            },
            checkMultiple: function () {
                var multipleNum = 50000;
                this.value = this.value.replace(/^0|[^\d]/g, '');
                if ($(this).val() > multipleNum) {
                    parent.layer.alert("请填写充值金额", {icon: 7});
                    $(this).val(multipleNum);
                    return true;
                }
                return true;
            },

            //确认按钮1
            confirmBtn_Click: function () {
                var $op = '';
                var codes = [];
                var betTotalAmount = 0;
                var betTotalBetCount = 0;
                var quickSelect = +($('#quickSelect').data('val')); // quickSelect

                if (["ELX", "SLX", "SILX", "SZS", "SZE", "EZE"].includes(ps.curMethod.name) || quickSelect === 1) {
                    $op = 'buy';
                    $('.locate').each(function (i) {
                        i = i + 1;
                        var tmp = [];
                        $('#locate_' + i + ' .ball_Selected').each(function (j, item) {
                            var $item = $(item);
                            if (quickSelect) { // quickSelect
                                tmp[tmp.length] = $item.find('span').text();
                            } else {
                                tmp[tmp.length] = $item.text();
                            }
                        });

                        codes[codes.length] = tmp.join('_');
                    });

                    codes = codes.join(',');
                    betTotalBetCount = $('#betCount').text();
                    betTotalAmount += betTotalBetCount * $("#multiple").val();

                    if (!(/^[1-9]*[1-9][0-9]*$/.test($("#multiple").val()))) {
                        parent.layer.alert("请填写投注金额", {icon: 7});
                        $("#multiple").val("");
                        return false;
                    }
                } else {
                    $op = 'xbuy';
                    $.each($('.f-left'), function (i, item) {
                        var $item = $(item);
                        if (/^[1-9]*[1-9][0-9]*$/.test($item.val())) {//必须是正整数
                            codes[codes.length] = $item.data('ball').toString() + '+' + $item.val();
                            betTotalAmount += parseInt($item.val());
                            ++betTotalBetCount;
                        }
                    });
                    codes = codes.join('|');

                    if (betTotalAmount === 0 || betTotalBetCount === 0) {
                        parent.layer.alert("请选填写整数金额，例如：100", {icon: 7});
                        return false;
                    }
                }

                codes = ps.curMethod.method_id.toString() + ':' + codes;

                if (!ps.canBuy) {
                    parent.layer.alert("该期已截止购买", {icon: 7});
                    return false;
                }
                if (codes.length === 0) {
                    parent.layer.alert("请先选择号码再投注", {icon: 7});
                    return false;
                }

                //var confirmInfo = '<div id="buy_message">请确认以下投注内容：<br>************************<br>单倍注数：' + betTotalBetCount + "注<br>总 金 额：￥" + betTotalAmount + "<br>模&nbsp;&nbsp;式：" + pattern + "模式<br>倍&nbsp;&nbsp;数：1倍<br>************************<br></div>";
                var codesx = '';//号码格式
                var Flag=0;
                var confirmInfo;
                if (ps.curMethod.name === "ELX" || ps.curMethod.name === "SLX" || ps.curMethod.name === "SILX" || ps.curMethod.name === "SZS" || ps.curMethod.name === "SZE" || ps.curMethod.name === "EZE") {
                    codesx = codes.split(':')[1];
                    confirmInfo = '<div id="buy_message">请确认以下投注内容：<br>************************<br>玩法：<span>' + ps.curMethod.cname + '</span><br>期号：' + ps.curIssueInfo.issue + '<br>内容：' + codesx + "<br>注数：" + betTotalBetCount + "注<br>总 金 额：￥" + betTotalAmount + "<br>************************<br></div>";
                } else {
                    codesx = codes.split(':')[1].replace(/\+.*?\|/g, ',').split('+')[0];
                    confirmInfo = '<div id="buy_message">请确认以下投注内容：<br>************************<br>玩法：<span>' + ps.curMethod.cname + '</span><br>期号：' + ps.curIssueInfo.issue + '<br>内容：' + codesx + "<br>总 金 额：￥" + betTotalAmount + "<br>************************<br></div>";
                }
                var confirmLayer = parent.layer.confirm(confirmInfo, {icon: 7},
                    function (i) {
                        //使用进度条代替按钮
                        parent.$('.xubox_botton').empty();
                        parent.$('.xubox_botton').html('<div class="LoadingShow"><span class="Loading_icon"></span><span class="Loading_Font">投注中，请稍后...</span></div>');
                        //判断是重新新疆天津否是奖池玩法
                        Flag+=1;
                        if(Flag==1){
                        $.post("?c=game&a=play", {
                                op: $op,
                                lotteryId: ps.lotteryId,
                                issue: ps.curIssueInfo.issue,
                                curRebate: ps.rebateGapList[ps.curPrizeIndex].rebate,
                                modes: ps.curMode,
                                codes: codes,
                                xgame: 1,
                                multiple: $op === 'xbuy' ? 1 : $("#multiple").val(),
                                token: getRandChar(32)
                            },
                            function (response) {
                                if (response.errno == 0) {
                                    drawBar.todayBuyBtnNew_Click();
                                    //奖池,玩法刷新
                                    $('.f-left').val("");
                                    buyBar.removeAll();
                                    if (ps.curMethod.name === "ELX" || ps.curMethod.name === "SLX" || ps.curMethod.name === "SILX" || ps.curMethod.name === "SZS" || ps.curMethod.name === "SZE" || ps.curMethod.name === "EZE") {
                                        var msg = '<div id="buy_success_message">购买成功!<br>************************<br>订单编号：' + response.pkgnum + "<br>玩法：<span>" + ps.curMethod.cname + '</span><br>期号：' + ps.curIssueInfo.issue + '<br>内容：' + codesx + "<br>注数：" + betTotalBetCount + "注<br>投注总额：￥" + betTotalAmount + "<br>************************<br></div>";
                                    } else {
                                        var msg = '<div id="buy_success_message">购买成功!<br>************************<br>订单编号：' + response.pkgnum + "<br>玩法：<span>" + ps.curMethod.cname + '</span><br>期号：' + ps.curIssueInfo.issue + '<br>内容：' + codesx + "<br>投注总额：￥" + betTotalAmount + "<br>************************<br></div>";
                                    }
                                    parent.layer.close(i);
                                    parent.layer.alert(msg, {icon: 1});
                                    parent.$('.xubox_yes').focus();
                                    parent.$('.xubox_yes').one('keyup', function (e) {
                                        var key = e.keyCode ? e.keyCode : e.which;
                                        if (key == 32) {
                                            parent.$('.xubox_yes').trigger("click");
                                        }
                                        if (key == 27) {
                                            parent.$('.xubox_no').trigger("click");
                                        }
                                    });

                                } else if (response.errno == 65534) {//重复投啥都不用做

                                } else {
                                    parent.layer.close(i);
                                    parent.layer.alert("购买失败:" + response.errstr, {icon: 2});
                                    console.log("错误代码:" + response.errno);
                                }
                                showBalance();
                            }, "json").fail(function (msg) {
                                parent.layer.close(i);
                                parent.layer.alert("网络异常，请在“游戏记录-订单查询”中确认该订单是否提交成功。", {icon: 2});
                            });
                            var disonckick=setInterval(function(){
                              Flag=0;
                              if(Flag==0){
                                clearInterval(disonckick);
                              }
                            },5000)
                          }
                    });

                parent.$('.xubox_yes').focus();
                parent.$('.xubox_yes').one('keyup', function (e) {
                    var key = e.keyCode ? e.keyCode : e.which;
                    if (key == 32) {
                        parent.$('.xubox_yes').trigger("click");
                    }
                    if (key == 27) {
                        parent.$('.xubox_no').trigger("click");
                    }
                });
                //投注清空填写金额
                //$('.f-left').val("");
                //清空选号栏
                $("#projectList").empty();
                //重置注数
                $("#totalBetCount").text("0");
            }
        };
        //清空填写金额
        $('#clearProjectBtn').click(function () {
            $('.f-left').val("");
        });

        //6.开奖区
        var initDrawBar = function () {
            $("#curLotteryName").text(ps.lotteryName);
            $("#curLotteryName2").text(ps.lotteryName);
            $("#todayIssuesHead").html('<li class="width:30%">期号</li><li class="width:70%">开奖号</li>');

            $("#todayDrawBtn").find(drawBar.todayDrawBtn_Click);
            $("#prizeRankBtn").click(drawBar.prizeRankBtn_Click);
            drawBar.todayBuyBtnNew_Click();

            $.each(ps.openedIssues,
                function (k, v) {
                    v.prop = drawBar.getMoreInfo(v.code);
                    ps.todayDrawList.push(v);
                });
            $("#prizeRankBtn").click();
            drawBar.getCurIssue(drawBar.init);
        };

        var drawBar = {
            init: function () {
                runTime.remainTimer = window.setInterval(drawBar.showCurIssue_Timer, 1000);
                if (ps.lastIssueInfo.code == "") {
                    ps.getLastOpenTime = 0;
                    clearInterval(runTime.getLastOpenTimer);
                    runTime.getLastOpenTimer = window.setInterval(drawBar.getLastOpen_Timer, 1000);
                    $("#thisIssueInfo").addClass("lock");
                    ps.canBuy = false;
                    $("#thisIssueSpan").text(ps.lastIssueInfo.issue);
                }
                else {  //友好界面 1秒等待后显示
                    //更新最近一期数据，否则导致draw.init()中重复调用
                    var latest = ps.todayDrawList[0];

                    if (ps.lastIssueInfo.issue != latest.issue) {
                        var tmp = ps.lastIssueInfo;
                        var ob = drawBar.getMoreInfo(tmp.code);
                        tmp.prop = ob;
                        ps.todayDrawList.unshift(tmp);
                        if ($("#todayDrawBtn").hasClass("cur")) {
                            var v = ps.todayDrawList[0];
                            var str = '<ul class="fix"><li class="width:30%">' + v.issue + '</li><li class="width:70%">' + v.code + "</li>";
                            $("#todayIssuesBody").prepend(str);
                        }
                    }
                }
                var nums;
                //初始化开奖球数目
                if (ps.todayDrawList[0].code != null) {
                    nums = ps.todayDrawList[0].code.split(" ");
                }

                $('#thisIssueNumUL').empty().hide();
                $('#pendingText').show();
                if (nums != null) {
                    $.each(nums, function (i, n) {
                        if (i < nums.length - 1) {
                            $('#thisIssueNumUL').append('<span class="pendingBall"></span>');
                        } else {
                            $('#thisIssueNumUL').append('<span class="lan pendingBall"></span><a class="sfnums">特</a>');
                        }
                    });
                }
                drawBar.showLastDraw();
                ps.canBuy = true;
            },
            getCurIssue: function (callback) {
                $.ajax({
                    url: "?c=game&a=play",
                    type: "POST",
                    data: {
                        op: "getCurIssue",
                        lotteryId: ps.lotteryId
                    },
                    cache: false,
                    dataType: "json",
                    timeout: 30000,
                    success: function (response) {
                        if (response.errno == 0) {
                            if (response.kTime != 0) {
                                $('#confirmBtn').attr("disabled", "disabled");
                                $('#confirmBtn').css("background", "#ccc");
                                $('#quickSelect').attr('disabled','disabled');
                                $('#quickSelect').css('background','#ccc');
                                $('#lastIssueSpan').text('**');
                                $('#curIssueSpan').text('**');
                                $('#thisIssueSpan').text('*************');
                                var t = response.kTime / 1000;

                                window.setInterval(function () {
                                    --t;
                                    var d = subTime(t);
                                    var ht = '<span style="font-size: 26px;color: red; text-align: center;   margin-top: 20px;">休市中...</span>';
                                    ht += "<div style='font-size: 18px;'><span>距离下次开市:" + d.hour + "</span><em>:</em><span>" + d.minute + "</span><em>:</em><span>" + d.second + "</span></div>";
                                    $('#pendingText').html(ht);

                                }, 1000)
                                window.setTimeout(function () {
                                    clearInterval(runTime.waitOpenTimer);
                                    window.location.reload();
                                    /// drawBar.getCurIssue(drawBar.init1);
                                }, response.kTime)

                            } else {
                                ps.curIssueInfo = response.issueInfo;
                                ps.curServerTime = response.serverTime;
                                ps.curRemainTime = getTS(ps.curIssueInfo.end_time) - getTS(ps.curServerTime);
                                ps.curWaitOpenTime = 8;    //显示锁形的时间，可酌情减少，不构成风险
                                ps.lastIssueInfo = response.lastIssueInfo;
                                if (response.lastIssueInfo && ps.counters > 0) {
                                    todayGetCurIssue(response.lastIssueInfo);
                                }
                                ps.counters++;
                                if (typeof (callback) == "function") {
                                    callback();
                                }
                            }
                        } else {
                            alert("系统繁忙，请稍候再试(02)");
                        }
                    },
                    error: function (XMLHttpRequest, textStatus, errorThrown) {
                        if (errorThrown.indexOf("a=logout") != -1 || errorThrown.indexOf("a=login") != -1) {
                            top.layer.alert("您已经超时退出，请重新登录", {icon: 7});
                            window.location.href = "?a=logout";
                        } else {
                            top.layer.alert("操作超时，请刷新页面..", {icon: 7});
                        }
                    }
                })
            },
            showCurIssue_Timer: function () {
                $("#thisIssueSpan").text(ps.curIssueInfo.issue);
                $("#thisIssueSpan2").text(ps.curIssueInfo.issue);
                var d = subTime(--ps.curRemainTime);
                if (ps.curRemainTime >= 0) {
                    remainTime(d);
                    //$("#thisIssueRemainTime").html("<span>" + d.day + "</span><em>:</em><span>"+ d.hour + "</span><em>:</em><span>" + d.minute + "</span><em>:</em><span>" + d.second + "</span>");
                    $("#thisIssueTimerIcon").removeClass("lock").addClass('clock').text("可以投注");
                } else {
                    clearInterval(runTime.remainTimer);
                    layer.alert(ps.curIssueInfo.issue + '期销售已截止，请进入下一期购买', {icon: 7});
                    $('#thisIssueTimerIcon').removeClass('clock').addClass('lock').text("已截止投注");
                    var d2 = subTime(ps.curWaitOpenTime);
                    d.day = d2.day;
                    d.hour = d2.hour;
                    d.minute = d2.minute;
                    d.second = d2.second;
                    //$('#thisIssueRemainTime').html("<span>" + d2.day + "</span><em>:</em><span>"+ d2.hour + "</span><em>:</em><span>" + d2.minute + "</span><em>:</em><span>" + d2.second + "</span>");
                    remainTime(d2);
                    //$("#thisIssueRemainTime").addClass("lotteryTime-lock");
                    //$("#thisIssueMoreInfo").html('<div class="remainOpenDIV">第 ' + ps.curIssueInfo.issue + ' 期开奖倒计时：<span class="lotteryTime2">' + ps.curWaitOpenTime + "</span></div>");
                    ps.canBuy = false;
                    runTime.waitOpenTimer = window.setInterval(drawBar.waitOpen_Timer, 1000);
                }
            },
            //显示锁倒计时
            waitOpen_Timer: function () {
                $('#pendingText').show();
                $('#thisIssueNumUL').hide();
                --ps.curWaitOpenTime;

                var d = subTime(ps.curWaitOpenTime);
                remainTime(d);
                //$("#thisIssueRemainTime").html("<span>" + d.day + "</span><em>:</em><span>"+ d.hour + "</span><em>:</em><span>" + d.minute + "</span><em>:</em><span>" + d.second + "</span>");
                if (ps.curWaitOpenTime < 0) {
                    clearInterval(runTime.waitOpenTimer);
                    drawBar.getCurIssue(drawBar.init);
                }
            },
            getLastOpen_Timer: function () {
                ps.getLastOpenTime++;

                //每10秒请求一次
                if (ps.getLastOpenTime % 10 == 0) {
                    $.ajax({
                        url: "?c=game&a=play",
                        type: "POST",
                        data: {
                            op: "getLastIssueCode",
                            lotteryId: ps.lotteryId,
                            issue: ps.lastIssueInfo.issue
                        },
                        cache: false,
                        dataType: "json",
                        timeout: 30000,
                        success: function (response) {
                            if (response.errno == 0) {
                                if (response.kTime != 0) {
                                    clearInterval(runTime.waitOpenTimer);
                                    window.location.reload();
                                    //        window.setTimeout(function(){
                                    //            $ ('#pendingText').html('<span style="font-size: 26px;color: red; text-align: center;   margin-top: 20px;">休市中...</span>');
                                    //            clearInterval(runTime.waitOpenTimer);
                                    //            window.location.reload();
                                    //     /// drawBar.getCurIssue(drawBar.init1);
                                    // },response.kTime)

                                } else {
                                    if (typeof (response.issueInfo.code) != "undefined") {
                                        clearInterval(runTime.getLastOpenTimer);
                                        ps.getLastOpenTime = 0;
                                        //更新最近一期数据，否则导致draw.init()中重复调用
                                        ps.lastIssueInfo = response.issueInfo;
                                        todayGetCurIssue(response.issueInfo);
                                        var ob = drawBar.getMoreInfo(response.issueInfo.code);
                                        response.issueInfo.prop = ob;
                                        ps.todayDrawList.unshift(response.issueInfo);
                                        if ($("#todayDrawBtn").hasClass("cur")) {
                                            var v = ps.todayDrawList[0];
                                            var str = '<ul><li class="width247px">' + v.issue + '</li><li class="width247px">' + v.code + "</li>";

                                            $("#todayIssuesBody").prepend(str);
                                        }
                                        drawBar.showLastDraw();
                                    }
                                }
                            } else {
                                alert("系统繁忙，请稍候再试(03)");
                            }
                        },
                        error: function (XMLHttpRequest, textStatus, errorThrown) {
                            if (errorThrown.indexOf("a=logout") != -1 || errorThrown.indexOf("a=login") != -1) {
                                top.layer.alert("您已经超时退出，请重新登录", {icon: 7});
                                window.location.href = "?a=logout";
                            } else {
                                top.layer.alert("操作超时，请刷新页面...", {icon: 7});
                            }
                        }
                    })
                }
            },
            //显示上一期开奖结果
            showLastDraw: function () {
                var latest = ps.todayDrawList[0];
                $("#curIssueSpan").text(ps.lastIssueInfo.issue);
                $("#lastIssueSpan").text(ps.lastIssueInfo.issue);

                var str;
                if (ps.lastIssueInfo.issue == latest.issue) {
                    if (latest.code == null) return;
                    $('#pendingText').hide();
                    $('#thisIssueNumUL').show();
                    var nums = latest.code.split(" ");
                    str = "<ul><li>第一位：<span>" + nums[0] + "</span></li><li>第二位：<span>" + nums[0] + "," + nums[1] + "</span></li></ul><ul><li>第三位：<span>" + nums[0] + "," + nums[1] + "," + nums[2] + "</span></li></ul>";

                    /**pendingBall
                     * 动画第二版
                     */
                    var index = 0,index2 = 0;

                    if ($("#todayIssuesBody").find("li:first").text() != ps.curIssueInfo.issue) {//如果开奖才更新，否则不操作
                        drawBar.todayBuyBtnNew_Click();//此时开号了就更新今日投注
                    }
                    $(".sfnums").hide();//隐藏特码文字

                    var openCodeCallback = function () {
                        if ($("#thisIssueNumUL").children(".pendingBall").length > 0) {
                            var obj = $("#thisIssueNumUL").children(".pendingBall").first();
                            window.setTimeout(function () {
                                obj.removeClass("pendingBall sd115Ball").text(nums[index++]) //显示数字
                                obj.addClass("sd115_Ball bl" + nums[index2++]);
                                //显示特码文字
                                if ($(".lan").hasClass("sd115_Ball")) {
                                    $(".sfnums").show();
                                }
                                ;

                                openCodeCallback();
                            }, 500);
                        }

                    };
                    window.setTimeout(openCodeCallback, 100);   //需要间隔时间触发才转
                } else {
                    $("#thisIssueNumUL").children().addClass("pendingBall").removeClass("sd115_Ball");
                    str = "<ul><li>第一位：<span></span></li><li>第二位：<span></span></li><li>第三位：<span></span></li></ul>";
                }
                $("#thisIssueMoreInfo").html(str);
            },
            //今日开奖
            todayDrawBtn_Click: function () {
                $("#todayIssuesHead").html('<li class="w60iss">期号</li><li class="w145iss">开奖号</li>');

                $("#todayIssuesBody").empty();
                $.each(ps.todayDrawList,
                    function (k, v) {
                        var splitCode = "";
                        var splitCode2 = "";
                        for (var i = 0; i < v.code.length; i++) {
                            splitCode += "<b>" + v.code[i] + "</b>";
                            splitCode2 += v.code[i];
                        }

                        var arr = splitCode2.split(" ").join("</b><b>");
                        var str = '<ul class="fix1"><li class="w60iss">' + v.issue + '</li><li class="w170iss"><b>' + arr + "</b></li></ul>";

                        $("#todayIssuesBody").append(str);
                    })
            },
            //中奖排行榜
            prizeRankBtn_Click: function () {
                $("#todayBuyBody").empty().hide();
                $.post("?c=game&a=play", {
                        op: "getPrizeRank",
                        lotteryId: ps.lotteryId
                    },
                    function (response) {
                        if (response.errno == 0) {
                            if (response.data.length == 0) {
                                $('<div class="todayNoBet">暂时没有记录！</div>').appendTo("#prizeScrollContent");
                            } else {
                                $("#prizeScrollContent").empty();
                                $.each(response.data,
                                    function (k, v) {
                                        $('<ul><li><span>' + v.nick_name + "</span> 喜中 <em>" + number_format(v.total_prize, 2) + "</em>元</li></ul>").appendTo($("#prizeScrollContent"));
                                    });
                                $("#prizeScrollContent").html($("#prizeScrollContent").html() + $("#prizeScrollContent").html()).show();
                                if (runTime.scollTopIntervalTimer == 0) {
                                    runTime.scollTopIntervalTimer = window.setInterval(drawBar.scrollPrizeRank, 100);
                                    $("#prizeScrollContent").mouseover(function () {
                                        clearInterval(runTime.scollTopIntervalTimer);
                                    }).mouseout(function () {
                                        runTime.scollTopIntervalTimer = window.setInterval(drawBar.scrollPrizeRank, 100);
                                    })
                                }
                            }
                        } else {
                            alert("暂时没有排行数据！");
                        }
                    },
                    "json");
            },
            todayBuyBtnNew_Click: function () {
                if ($("#todayIssuesBody").find("li:first").text() != ps.curIssueInfo.issue) {
                    $.post("?c=game&a=play", {
                            op: "getBuyRecords",
                            lotteryId: ps.lotteryId,
                        },
                        function (response) {
                            if (response.errno == 0) {
                                $("#todayBuyBody").empty();
                                $('<ul><li class="C1">玩法</li><li class="C2">期号</li><li class="C4">金额</li><li class="C5">状态</li></ul><div class="clear"></div>').appendTo("#todayBuyBody");
                                if (response.prj.length == 0) {
                                    $('<div class="todayNoBet">暂时没有记录！</div>').appendTo("#todayBuyBody");
                                } else {
                                    $.each(response.prj,
                                        function (k, v) {
                                            $('<ul class="fix"><li class="C1"><a href="javascript:void(0);" onclick="showPackageDetail(\'' + v.wrapId + '\');return false;">' + v.methodName + '</a></li><li class="C2">' + helper.getNumByIssue(v.issue) + '</li><li class="C4">' + v.amount + '</li><li class="C5">' + v.prizeStatus + "</li></ul>").click(function () {
                                                //为适应客户端statusText，这里不再用jq定义
                                                //window.open("?c=game&a=packageDetail&wrap_id=" + v.wrapId, "_blank")
                                            }).appendTo("#todayBuyBody");
                                        });
                                }
                            } else {
                                alert("系统繁忙，请稍候再试(04)");
                            }
                        },
                        "json");
                }
            },
            scrollPrizeRank: function () {
                var obj = $("#prizeScrollContent")[0];
                obj.scrollTop += 1;
                if (obj.scrollTop >= $("#prizeScrollContent")[0].scrollHeight / 2) {
                    obj.scrollTop = 0;
                }
            },
            getMoreInfo: function (code) {   //得到扩展信息
                var $result = {};
                if (ps.lotteryType == 1 || ps.lotteryType == 4) {
                    var nums = code.split("");
                    $result.qshz = parseInt(nums[0]) + parseInt(nums[1]) + parseInt(nums[2]);
                    $result.qszt = drawBar.zutai(nums[0], nums[1], nums[2]);
                    $result.hshz = parseInt(nums[2]) + parseInt(nums[3]) + parseInt(nums[4]);
                    $result.hszt = drawBar.zutai(nums[2], nums[3], nums[4]);
                    $result.hehz = parseInt(nums[3]) + parseInt(nums[4]);
                    $result.dxds = drawBar.dxds(nums[3], nums[4]);
                }

                return $result;
            },
            zutai: function (a, b, c) {
                if (a == b && a == c && b == c) {
                    return "豹子";
                } else {
                    if (a == b || a == c || b == c) {
                        return "组三";
                    } else {
                        return "组六";
                    }
                }
            },
            dxds: function (n1, n2) {
                var a = [], b = [];
                a.push(n1 >= 5 ? "大" : "小");
                a.push(n1 % 2 == 1 ? "单" : "双");
                b.push(n2 >= 5 ? "大" : "小");
                b.push(n2 % 2 == 1 ? "单" : "双");
                return [a[0] + b[0], a[0] + b[1], a[1] + b[0], a[1] + b[1]].join(",");
            },
        };

        function subTime(t) {
            var ob = t > 0 ? {
                day: Math.floor(t / 86400),
                hour: Math.floor(t % 86400 / 3600),
                minute: Math.floor(t % 3600 / 60),
                second: Math.floor(t % 60)
            } : {
                day: 0,
                hour: 0,
                minute: 0,
                second: 0
            };
            if ((ob.hour + "").length == 1) {
                ob.hour = "0" + ob.hour;
            }
            if ((ob.minute + "").length == 1) {
                ob.minute = "0" + ob.minute;
            }
            if ((ob.second + "").length == 1) {
                ob.second = "0" + ob.second;
            }
            return ob;
        }

        if (!verifyParams()) {
            parent.layer.alert("数据初始化失败", {icon: 2});
            return false;
        }
        initPrizeBar();
        initModesBar();
        initMethodBar();
        initMissHotBar();
        initBuyBar();
        initDrawBar();

        //判断是否每区都有值
        function allHasValue(cds) {
            var flag = 1, charsNum = 0;
            $.each(cds, function (k, v) {
                charsNum += v.length;
                if (v.length == 0) {
                    flag = 0;
                }
            });
            return {
                flag: flag,
                charsNum: charsNum
            };
        }

        //倒计时时间分割
        function remainTime(d) {
            var hour = d.hour.toString().split('');
            var minute = d.minute.toString().split('');
            var second = d.second.toString().split('');

            $("#thisIssueRemainTime").html(
                "<span>" + d.day + "</span><em>:</em>" +
                "<span>" + hour[0] + "</span><span>" + hour[1] + "</span><em>:</em>" +
                "<span>" + minute[0] + "</span><span>" + minute[1] + "</span><em>:</em>" +
                "<span>" + second[0] + "</span><span>" + second[1] + "</span>"
            );
        }

        var isLegalCode = function (codes) {

            //这一段加上否则直选和值类玩法不选号也能添加
            if (allHasValue(codes)['charsNum'] == 0) {
                return {
                    singleNum: 0,
                    isDup: 0
                };
            }

            var singleNum = 0, isDup = 0, parts;
            switch (ps.curMethod.name) {
                case 'TMZX':
                case 'TMSX':
                case 'TMWS':
                case 'TMSB':
                case 'TMDXDS':
                case 'ZTYM':
                case 'ZTYX':
                case 'ZTWS':
                    parts = codes[0].split('_');
                    singleNum = parts.length;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'ELX':
                case 'EZE':
                    parts = codes[0].split('_');
                    if (parts.length >= 2) {
                        singleNum = parts.length * (parts.length - 1) / 2;
                    }

                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'SLX':
                case 'SZS':
                case 'SZE':
                    parts = codes[0].split('_');
                    if (parts.length >= 3) {
                        singleNum = parts.length * (parts.length - 1) * (parts.length - 2) / 6;
                    }

                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'SILX':
                    parts = codes[0].split('_');
                    if (parts.length >= 4) {
                        singleNum = parts.length * (parts.length - 1) * (parts.length - 2) * (parts.length - 3) / 24;
                    }

                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                default:
                    throw "unknown method2 " + ps.curMethod.name;
                    break;
            }

            return {
                singleNum: singleNum,
                isDup: isDup
            };
        };
    }
})(jQuery);
