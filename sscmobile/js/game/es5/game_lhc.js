'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

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

if ((typeof console === 'undefined' ? 'undefined' : _typeof(console)) != "object") {
    var console = {
        info: function info(a) {
            window.status = a;
        }
    };
}
var runTime = {
    remainTimer: 0,
    waitOpenTimer: 0,
    getLastOpenTimer: 0,
    scollTopIntervalTimer: 0,
    traceRemainTimer: 0,
    traceWaitOpenTimer: 0,
    buyTodayTimer: 0,
    clearAll: function clearAll() {
        clearInterval(runTime.remainTimer);
        clearInterval(runTime.waitOpenTimer);
        clearInterval(runTime.getLastOpenTimer);
        clearInterval(runTime.scollTopIntervalTimer);
        clearInterval(runTime.traceRemainTimer);
        clearInterval(runTime.traceWaitOpenTimer);
        clearInterval(runTime.buyTodayTimer);
    }
};

(function ($) {

    $.init = function (settings) {
        //检查传过来的参数的正确性
        var verifyParams = function verifyParams() {
            var flag = 0;
            if (settings.lotteryId == undefined || !is_numeric(settings.lotteryId) || settings.lotteryId <= 0) {
                flag = -1;
            } else if (settings.lotteryName == undefined || settings.lotteryName == '') {
                flag = -2;
            } else if (settings.lotteryType == undefined || !is_numeric(settings.lotteryType) || $.inArray(settings.lotteryType, [1, 2, 4, 5, 6, 7, 8, 9]) == -1) {
                flag = -3;
            } else if (settings.methods == undefined || !$.isArray(settings.methods) || settings.methods.length == 0) {
                flag = -4;
            } else if (settings.openedIssues == undefined || !$.isArray(settings.openedIssues) || settings.openedIssues.length == 0) {
                flag = -5;
            } else if (settings.minRebateGaps == undefined || !$.isArray(settings.minRebateGaps) || settings.minRebateGaps.length == 0) {
                flag = -6;
            } else if (settings.rebate == undefined || !is_numeric(settings.rebate) || settings.rebate < 0 || settings.rebate > 0.178) {
                flag = -7;
            } else if (settings.defaultMode == undefined || !is_numeric(settings.defaultMode) || !$.inArray(settings.defaultMode, [1, 0.5, 0.1, 0.05, 0.01, 0.001]) == -1) {
                flag = -8;
            } else if (settings.defaultRebate == undefined || !is_numeric(settings.defaultRebate) || settings.defaultRebate < 0 || settings.defaultRebate > settings.rebate) {
                flag = -9;
            } else if (settings.maxCombPrize == undefined || !is_numeric(settings.maxCombPrize) || settings.maxCombPrize <= 0) {
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
            lotteryName: 'CQSSC',
            lotteryType: 1, //采种类型
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
            defaultMode: 1, //1,0.1,0.01
            defaultRebate: 0.123, //默认选中的返点
            missHot: {
                miss: [],
                hot: []
            }, //上期开奖冷热数据
            halt: function halt(msg) {
                //致命错误处理
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
            counters: 0 //第一次加载
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
            $('#todayIssuesBody').children().last().remove();
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
            pokerNumMaps: {
                A: 1,
                2: 2,
                3: 3,
                4: 4,
                5: 5,
                6: 6,
                7: 7,
                8: 8,
                9: 9,
                T: 10,
                J: 11,
                Q: 12,
                K: 13
            },
            factorial: function factorial(n) {
                if (n <= 1) {
                    return 1;
                } else {
                    return n * helper.factorial(n - 1);
                }
            },
            /**
             * 提取issue的期号 By Davy
             * issue 有如下类型：20150403-001 20150615-01     2015040
             * 逻辑：有'-'的取其后所有字符,没有的取最后三位
             */
            getNumByIssue: function getNumByIssue(issue) {
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
            expandLotto: function expandLotto($nums) {
                var result = [];
                var tempVars = [];
                var oneAreaIsEmpty = 0;
                $.each($nums, function (k, v) {
                    if ($.trim(v) == "") {
                        oneAreaIsEmpty = 1;
                        return;
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
                $.each(result, function (k, v) {
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
            uniqueArr: function uniqueArr(a) {
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

        var initModesBar = function initModesBar() {
            var tmpMode = 1;
            var mod = parseFloat(getCookie("mod_" + ps.lotteryId));
            $.each([1, 0.5, 0.1, 0.05, 0.01, 0.001], function (k, v) {
                if (v == mod) {
                    tmpMode = v;
                }
            });
            ps.curMode = tmpMode;

            //元角分厘点击事件
            $("#yuan").click(function () {
                $("#yuan").removeClass().addClass("yuan");
                $("#jiao").removeClass();
                $("#fen").removeClass();
                $("#li").removeClass();
                $("#yuanYi").removeClass();
                $("#jiaoYi").removeClass();
                $("#modesDIV").val(1);
                modesBar.modesBtn_Click();
            });
            $("#jiao").click(function () {
                $("#jiao").removeClass().addClass("jiao");
                $("#yuan").removeClass();
                $("#fen").removeClass();
                $("#li").removeClass();
                $("#yuanYi").removeClass();
                $("#jiaoYi").removeClass();
                $("#modesDIV").val(0.1);
                modesBar.modesBtn_Click();
            });
            $("#fen").click(function () {
                $("#fen").removeClass().addClass("fen");
                $("#jiao").removeClass();
                $("#yuan").removeClass();
                $("#li").removeClass();
                $("#yuanYi").removeClass();
                $("#jiaoYi").removeClass();
                $("#modesDIV").val(0.01);
                modesBar.modesBtn_Click();
            });
            $("#yuanYi").click(function () {
                $("#yuanYi").removeClass().addClass("yuanYi");
                $("#jiaoYi").removeClass();
                $("#yuan").removeClass();
                $("#jiao").removeClass();
                $("#fen").removeClass();
                $("#li").removeClass();
                $("#modesDIV").val(0.5);
                modesBar.modesBtn_Click();
            });
            $("#jiaoYi").click(function () {
                $("#jiaoYi").removeClass().addClass("jiaoYi");
                $("#yuanYi").removeClass();
                $("#jiao").removeClass();
                $("#yuan").removeClass();
                $("#fen").removeClass();
                $("#li").removeClass();
                $("#modesDIV").val(0.05);
                modesBar.modesBtn_Click();
            });
            $("#li").click(function () {
                $("#li").removeClass().addClass("li");
                $("#fen").removeClass();
                $("#jiao").removeClass();
                $("#yuan").removeClass();
                $("#yuanYi").removeClass();
                $("#jiaoYi").removeClass();
                $("#modesDIV").val(0.001);
                modesBar.modesBtn_Click();
            });

            switch (ps.curMode) {
                case 1:
                    $("#yuan").click();
                    break;
                case 0.5:
                    $("#yuanYi").click();
                    break;
                case 0.1:
                    $("#jiao").click();
                    break;
                case 0.05:
                    $("#jiaoYi").click();
                    break;
                case 0.01:
                    $("#fen").click();
                    break;
                case 0.001:
                    $("#li").click();
                    break;
            };
            // $('<option value="1">元</option><option value="0.1">角</option><option value="0.01">分</option><option value="0.001">厘</option>').prependTo("#modesDIV");
            // $("#modesDIV").change(modesBar.modesBtn_Click);
            // $("#modesDIV").val(ps.curMode);
        };

        var modesBar = {
            //点击模式按钮事件
            modesBtn_Click: function modesBtn_Click() {
                var curModeSpan = $("#modesDIV").val();
                if ($('#projectList').children('li').length > 0) {
                    parent.layer.confirm('切换元角分模式将影响您现有投注项，是否继续？', { icon: 7 }, function (i) {
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
                        prizeBar.showPirze(); //每点一下应更新对应的玩法
                        parent.layer.close(i);
                    }, function (i) {
                        switch (ps.curMode) {
                            case '1':
                                $("#yuan").removeClass().addClass("yuan");
                                $("#jiao").removeClass().addClass("jiao_off");
                                $("#fen").removeClass().addClass("fen_off");
                                $("#li").removeClass().addClass("li_off");
                                $("#yuanYi").removeClass().addClass("yuanYi_off");
                                $("#jiaoYi").removeClass().addClass("jiaoYi_off");
                                break;
                            case '0.5':
                                $("#yuan").removeClass().addClass("yuan_off");
                                $("#jiao").removeClass().addClass("jiao_off");
                                $("#fen").removeClass().addClass("fen_off");
                                $("#li").removeClass().addClass("li_off");
                                $("#yuanYi").removeClass().addClass("yuanYi");
                                $("#jiaoYi").removeClass().addClass("jiaoYi_off");
                                break;
                            case '0.1':
                                $("#yuan").removeClass().addClass("yuan_off");
                                $("#jiao").removeClass().addClass("jiao");
                                $("#fen").removeClass().addClass("fen_off");
                                $("#li").removeClass().addClass("li_off");
                                $("#yuanYi").removeClass().addClass("yuanYi_off");
                                $("#jiaoYi").removeClass().addClass("jiaoYi_off");
                                break;
                            case '0.05':
                                $("#yuan").removeClass().addClass("yuan_off");
                                $("#jiao").removeClass().addClass("jiao_off");
                                $("#fen").removeClass().addClass("fen_off");
                                $("#li").removeClass().addClass("li_off");
                                $("#yuanYi").removeClass().addClass("yuanYi_off");
                                $("#jiaoYi").removeClass().addClass("jiaoYi");
                                break;
                            case '0.01':
                                $("#yuan").removeClass().addClass("yuan_off");
                                $("#jiao").removeClass().addClass("jiao_off");
                                $("#fen").removeClass().addClass("fen");
                                $("#li").removeClass().addClass("li_off");
                                $("#yuanYi").removeClass().addClass("yuanYi_off");
                                $("#jiaoYi").removeClass().addClass("jiaoYi_off");
                                break;
                            case '0.001':
                                $("#li").removeClass().addClass("li");
                                $("#yuan").removeClass().addClass("yuan_off");
                                $("#jiao").removeClass().addClass("jiao_off");
                                $("#fen").removeClass().addClass("fen_off");
                                $("#yuanYi").removeClass().addClass("yuanYi_off");
                                $("#jiaoYi").removeClass().addClass("jiaoYi_off");
                                break;
                        }
                        $("#modesDIV").val(ps.curMode);
                    });
                } else {
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
                    prizeBar.showPirze(); //每点一下应更新对应的玩法
                }
            },
            saveLastModes: function saveLastModes() {
                //目前是保存到cookie里面
                setCookie('mod_' + ps.lotteryId, ps.curMode, 30 * 86400);
            }
        };

        //1.2 滑动奖金栏
        var initPrizeBar = function initPrizeBar() {
            ps.rebateGapList = prizeBar.generateGapList();
            // ps.curPrizeIndex = 0;
            // var reb = getCookie("reb_" + ps.lotteryId);
            // $.each(ps.rebateGapList,
            //         function(k, v) {
            //             if (reb == v.rebate) {
            //                 ps.curPrizeIndex = k;
            //             }
            //         });
            // if (ps.curPrizeIndex == undefined) {
            //     ps.halt("initPrizeBar failed");
            // }
            if (ps.rebateGapList.length == 0) {
                ps.halt("initPrizeBar failed");
            }

            ps.curPrizeIndex = ps.rebateGapList.length - 1;
            prizeBar.showPirze();
            $('#curPrizeSpan').change(prizeBar.changePrize);
        };

        //奖金滑动事件处理
        var prizeBar = {
            changePrize: function changePrize() {

                if ($.isEmptyObject(ps.curMethod) !== true) {
                    if (ps.curMethod.description.indexOf("@P@") > 0) {
                        //变更相应的玩法奖金说明
                        var curPrize = $("#curPrizeSpan option:selected").text().split("/");
                        var newDescription = '';
                        var descriptions = ps.curMethod.description.split("@P@");
                        for (var i = 1; i < descriptions.length; i++) {
                            if (ps.curMethod.prize[i] != undefined) {
                                //以避免后台人员录入通配符错误导致程序错误
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
            generateGapList: function generateGapList() {
                var result = [];
                $.each(ps.minRebateGaps, function (k, v) {
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
                $.each(result, function (k, v) {
                    var prize = round(ps.maxCombPrize * (ps.prizeRate + v), 0);

                    result2.push({
                        rebate: round(ps.rebate - v, 3),
                        prize: prize
                    });
                });

                return result2;
            },
            //显示当前奖金
            showPirze: function showPirze() {
                if ($.isEmptyObject(ps.curMethod) !== true) {
                    $('#curPrizeSpan').empty();
                    $.each(ps.rebateGapList, function (k, v) {
                        var selectPrize1 = round(ps.curMode * ps.curMethod.prize[1] * (ps.prizeRate + ps.rebate - ps.rebateGapList[k].rebate) / ps.prizeRate, 4);
                        var selectPrize2 = round(ps.curMode * ps.curMethod.prize[2] * (ps.prizeRate + ps.rebate - ps.rebateGapList[k].rebate) / ps.prizeRate, 4);
                        var selectRebate = number_format(parseFloat(ps.rebateGapList[k].rebate) * 100, 1);
                        if (ps.curMethod.cname == "特码直选" || ps.curMethod.cname == "三中三" || ps.curMethod.cname == "二中二" || ps.curMethod.cname == "正特一码") {
                            $('#curPrizeSpan').append('<option value="' + k + '">' + selectPrize1 + ',' + selectRebate + '%</option>');
                        } else {
                            $('.bor-top01 b').css({ 'margin-left': '0rem', 'font-size': '0.6rem' });
                            $('.gameTZbtn').css({ 'margin-right': '0.1rem', 'width': '1rem' });
                            $('.bor-top01 select').css({ 'margin-left': '0rem' });
                            $('#curPrizeSpan').append('<option value="' + k + '">' + selectPrize1 + '/' + selectPrize2 + ',' + selectRebate + '%</option>');
                        }
                        $('#curPrizeSpan').siblings('span').html('奖金/返点');
                    });
                    $("#curPrizeSpan").val(ps.curPrizeIndex);
                    // if(ps.curMethod.cname=="特码直选" || ps.curMethod.cname=="三中三" || ps.curMethod.cname=="二中二" || ps.curMethod.cname=="正特一码"){
                    //     $("#gamesPrize").html($('#curPrizeSpan').find("option:selected").text().split(",")[0]);
                    // }else{
                    // $("#gamesPrize").html($('#curPrizeSpan').find("option:selected").html().slice(4).replace('二等奖','/').replace(/\/\d+\.\d+%/,''));
                    $("#gamesPrize").html($('#curPrizeSpan').find("option:selected").html().split(',')[0]);
                    prizeBar.changePrize();
                    //var realPrize = round(ps.curMode * ps.curMethod.prize * (ps.prizeRate + ps.rebate - ps.rebateGapList[ps.curPrizeIndex].rebate) / ps.prizeRate, 2);
                    //$("#curPrizeSpan").text(realPrize + "/" + number_format(parseFloat(ps.rebateGapList[ps.curPrizeIndex].rebate) * 100, 1));
                    // $('#selectRebate').slider({//初始化滑动块 手机端用下拉框所有这里注释掉
                    //     range: 'min',
                    //     min: 0,
                    //     max: ($('#curPrizeSpan option').length -1),
                    //     value: $('#curPrizeSpan option:selected').index(),
                    //     slide: function(event, ui){
                    //         $('#curPrizeSpan option').removeAttr('selected');
                    //         $('#curPrizeSpan option').eq(ui.value).attr('selected', true);
                    //         $('#rebateValue').html($('#curPrizeSpan option').eq(ui.value).html());
                    //         $('#curPrizeSpan').change();
                    //         ps.curPrizeIndex = ui.value;
                    //     }
                    // });
                    $('#rebateValue').html($('#curPrizeSpan option:selected').html().split(',')[1]);
                }
            },
            //保存当前奖金设置
            saveLastPrize: function saveLastPrize() {
                setCookie("reb_" + ps.lotteryId, ps.rebateGapList[ps.curPrizeIndex].rebate, 30 * 86400);
            }
        };

        //3.玩法相关
        var initMethodBar = function initMethodBar() {
            /*
             * <li id="methodGroup_0"><label>后一</label>
             <ul id="method_0" class="methodPopStyle" style="display: none;">
             <li id="method_0_1">后一直选</li>
             <li id="method_0_2">五星选</li>
             </ul>
             </li>
             */
            $.each(ps.methods, function (i, n) {
                if (n.childs.length == 1) {
                    $('<li class="methodGroupLI" id="methodGroup_' + i + '"><label>' + n.mg_name + "</label></li>").click(methodBar.methodGroup_Click).appendTo("#methodGroupContainer");
                } else {
                    $('<li class="methodGroupLI" id="methodGroup_' + i + '"><label>' + n.mg_name + "</label></li>").click(methodBar.methodGroup_Click).hover(methodBar.methodGroup_hoverOver, methodBar.methodGroup_hoverOut).appendTo("#methodGroupContainer");
                }
                var dl1 = '',
                    dl2 = '',
                    dl3 = '',
                    dl4 = '',
                    dl5 = '',
                    dl6 = '',
                    dl7 = '',
                    dl8 = '',
                    dl9 = '',
                    dl0 = '',
                    dl10 = '';

                if (n.mg_id == 6 || n.mg_id == 50 || n.mg_id == 57 || n.mg_id == 169) {
                    //如果是11选5任选
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
                var div = $('<div id="method_' + i + '"></div>').addClass('methodPopStyle').hide();
                $.each(n.childs, function (ii, nn) {
                    var dd = '<dd class="method" name="' + nn.name + '" id="method_' + i + "_" + ii + '">' + nn.cname + '</dd>';
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
                        ddSon = '<dd class="method" name="' + nn.name + "son" + '" id="method_' + i + "_" + ii + "son" + '">' + nn.cname + "单式" + "</dd>";
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
                dl1 += '</dl>';dl2 += '</dl>';dl3 += '</dl>';dl4 += '</dl>';dl5 += '</dl>';dl6 += '</dl>';dl7 += '</dl>';dl8 += '</dl>';dl9 += '</dl>';dl0 += '</dl>';dl10 += '</dl>';
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
                $("#methodGroup_" + i).append(div);
            });
            $(".subTopBar").mouseleave(function () {
                $(this).find("li").removeClass("methodGroup_hover");
                // /\w+_(\d+)/.test($(this).attr("id"));
                // var index = RegExp.$1;
                $(this).find("ul li .methodPopStyle").hide();
            });
            methodBar.selectDefault();
        };

        //玩法组及玩法菜单事件处理
        var methodBar = {
            methodGroup_Click: function methodGroup_Click(e) {
                $(this).addClass("methodGroup_selected").siblings().removeClass("methodGroup_selected methodGroup_hover");
                //必须这样做
                if ($(e.target).is('label')) {
                    $("#traceBtn").show();
                    if ($(".choMainTab").children('.progressBar')) {
                        $(".progressBar").remove();
                        $(".choMainTab").css("padding-top", "");
                    }
                };
                $(this).addClass("methodGroup_hover");
                /\w+_(\d+)/.test($(this).attr("id"));
                var index = RegExp.$1;
                $(".playNav ul .methodPopStyle").hide();
                $(this).find('.methodPopStyle').show();
            },
            methodGroup_hoverOver: function methodGroup_hoverOver() {
                $(this).addClass("methodGroup_hover");
                if ($(this).hasClass("methodGroup_selected")) {
                    $(this).find('.methodPopStyle').show();
                };
            },
            methodGroup_hoverOut: function methodGroup_hoverOut() {
                $(this).removeClass("methodGroup_hover");
                /\w+_(\d+)/.test($(this).attr("id"));
                var index = RegExp.$1;
            },
            method_hoverOver: function method_hoverOver() {
                $(this).addClass("method_hover");
                /\w+_(\d+)/.test($(this).attr("id"));
                var index = RegExp.$1;
                //$("#method_" + index).show().siblings().hide();
                //$("#method_" + index).children(":first").click();
                $(this).find('.methodPopStyle').show();
            },
            method_hoverOut: function method_hoverOut() {
                $(this).removeClass("method_hover");
                /\w+_(\d+)/.test($(this).attr("id"));
                var index = RegExp.$1;
                $(this).find('.methodPopStyle').hide();
            },
            method_Click: function method_Click(e) {
                ps.curMethod = e.data;
                $('.methodPopStyle').hide();
                //设置当前玩法前景色以示区别
                $('#methodGroupContainer').find('.method').removeClass("method_selected");
                $(this).addClass("method_selected");
                $(".GameText span").text($(this).text());
                $('#curMethod').text(ps.curMethod.cname);
                //玩法提示文字
                $("#methodDesc").html(ps.curMethod.description).hide();
                //备注tips
                $("#methodTipInfo").click(function () {
                    layer.tips($("#methodDesc").html(), this, {
                        tips: [2, '#f13131'],
                        time: 0,
                        closeBtn: 0,
                        shade: [0.1, '#000'],
                        shadeClose: true
                    });
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
                };

                var counts = propLen(ps.curMethod.field_def);
                if (counts == 2) {
                    $(".locate").css("padding", "10px 0");
                };
                if (propLen(ps.curMethod.field_def) == 3) {
                    $(".locate").css("padding", "10px 0");
                };
                if (propLen(ps.curMethod.field_def) == 4) {
                    $(".locate").css("padding", "5px 0");
                };
                return false;
            },
            selectDefault: function selectDefault() {
                $("#methodGroupContainer").find("label:contains('特码')").click();
                //console.log(23);
                //$("#methodGroup_0").click();
                $(".playNav ul ul").hide();
            }
        };
        //3.1投注球事件处理 ball_Selected为选中后的样式
        var ballBar = {
            reset: function reset() {
                if ($.isEmptyObject(ps.curMethod.field_def)) {
                    return;
                }
                $.each(ps.curMethod.field_def, function (i, prop) {
                    $('#field_' + i).children().removeClass('ball_Selected');
                });
                buyBar.updateSingle(0);
            },
            showInput: function showInput() {
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
            generateBall: function generateBall() {
                $("#selectArea").children().remove();
                var filterBtn = '<li class="Quick"><div class="QuickChoose"><dl class="navSub"><dd>全</dd><dd>奇</dd><dd>偶</dd> <dd>大</dd><dd>小</dd><dd>清</dd></dl></div></li>';
                var Reds = new Array(1, 2, 7, 8, 12, 13, 18, 19, 23, 24, 29, 30, 34, 35, 40, 45, 46);
                var Blues = new Array(3, 4, 9, 10, 14, 15, 20, 25, 26, 31, 36, 37, 41, 42, 47, 48);
                var Greens = new Array(5, 6, 11, 16, 17, 21, 22, 27, 28, 32, 33, 38, 39, 43, 44, 49);
                $.each(ps.curMethod.field_def, function (i, prop) {
                    //注：i从1开始
                    var numList = prop.nums.split(" ");
                    var ballStr = '',
                        hzbdStr = "";
                    var ballClass = '';
                    $.each(numList, function (ii, nn) {
                        switch (ps.curMethod.name) {
                            case "SXBD":
                            case "ZSBD":
                            case "QSBD":
                                ballStr += '<li>' + nn + '</li>'; //<span class="HZBD">' + helper.SXBD[ii] + "</span>"
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
                                ballStr += '<li class="' + ballClass + '">' + nn + '</li>';
                                break;
                            default:
                                var sballlist = '';
                                if (nn == '红') {
                                    sballlist = 'red';
                                };
                                if (nn == '蓝') {
                                    sballlist = 'blue';
                                };
                                if (nn == '绿') {
                                    sballlist = 'green';
                                };
                                ballStr += '<li class=' + sballlist + '>' + nn + "</li>";
                                break;
                        }
                    });

                    var ballListName = 'ballList';
                    ballStr = '<li><ul class="' + ballListName + (/(BD|HZ)$/.test(ps.curMethod.name) ? " w400" : "") + '" id=field_' + i + ">" + ballStr + "</ul></li>";
                    hzbdStr = '<li><ul class="BDHZinfo">' + hzbdStr + "</ul></li>";
                    var specialClass = "";
                    if (/(DXDS)$/.test(ps.curMethod.name)) {
                        specialClass = ' DXDS-margin-left';
                    } else if (/(SDDDS)$/.test(ps.curMethod.name)) {
                        specialClass = ' SDDDS-margin-left';
                    } else if (/(SDCZW)$/.test(ps.curMethod.name)) {
                        specialClass = ' SDCZW-margin-left';
                    }

                    $('<div class="locate" id="locate_' + i + '"><ul class="lotteryNumber' + specialClass + '">' + (prop.prompt ? '<li class="areaPrefix">' + prop.prompt + "</li>" : "") + ballStr + "</ul></div>").appendTo("#selectArea");

                    //特殊处理和值包点
                    // if (/(BD|HZ)$/.test(ps.curMethod.name) && ps.curMethod.name != 'JSHZ') {
                    //     $('#locate_' + i + ' .lotteryNumber').append('<li class="BDHZprompt">包含注数:</li>' + hzbdStr);
                    // }
                    //处理是否有筛选功能
                    if (prop.has_filter_btn) {

                        $("#locate_" + i).find("ul .areaPrefix").after(filterBtn);

                        $("#locate_" + i).find("dd").click(function () {
                            $(this).addClass("DDcolor").siblings().removeClass("DDcolor");
                            switch ($(this).text()) {
                                case '全':
                                    $('#field_' + i).children().addClass('ball_Selected');
                                    break;
                                case '奇':
                                    if (ps.lotteryType == 1 || ps.lotteryType == 4) {
                                        $('#field_' + i).children().removeClass('ball_Selected').parent().find(":odd").addClass('ball_Selected');
                                    } else if (ps.lotteryType == 2) {
                                        $('#field_' + i).children().removeClass('ball_Selected').parent().find(":even").addClass('ball_Selected');
                                    }
                                    break;
                                case '偶':
                                    if (ps.lotteryType == 1 || ps.lotteryType == 4) {
                                        $('#field_' + i).children().removeClass('ball_Selected').parent().find(":even").addClass('ball_Selected');
                                    } else if (ps.lotteryType == 2) {
                                        $('#field_' + i).children().removeClass('ball_Selected').parent().find(":odd").addClass('ball_Selected');
                                    }
                                    break;
                                case '大':
                                    $('#field_' + i).children().removeClass('ball_Selected').filter(function (idx) {
                                        return idx >= 5;
                                    }).addClass('ball_Selected');
                                    break;
                                case '小':
                                    $('#field_' + i).children().removeClass('ball_Selected').filter(function (idx) {
                                        return idx < 5;
                                    }).addClass('ball_Selected');
                                    break;
                                case '清':
                                    $('#field_' + i).children().removeClass('ball_Selected');
                                    break;
                                case '质':
                                    if (ps.lotteryType == 1 || ps.lotteryType == 4) {
                                        $('#field_' + i).children().removeClass('ball_Selected').filter(function (idx) {
                                            return $.inArray(idx, [2, 3, 5, 7]) != -1;
                                        }).addClass('ball_Selected');
                                    } else if (ps.lotteryType == 2) {
                                        $('#field_' + i).children().removeClass('ball_Selected').filter(function (idx) {
                                            return $.inArray(idx, [1, 2, 4, 6, 10]) != -1;
                                        }).addClass('ball_Selected');
                                    }
                                    break;
                                case '合':
                                    if (ps.lotteryType == 1 || ps.lotteryType == 4) {
                                        $('#field_' + i).children().removeClass('ball_Selected').filter(function (idx) {
                                            return $.inArray(idx, [4, 6, 8, 9]) != -1;
                                        }).addClass('ball_Selected');
                                    } else if (ps.lotteryType == 2) {
                                        $('#field_' + i).children().removeClass('ball_Selected').filter(function (idx) {
                                            return $.inArray(idx, [3, 5, 7, 8, 9]) != -1;
                                        }).addClass('ball_Selected');
                                    }
                                    break;
                                // case '反':
                                //     $('#field_' + i).children().toggleClass('ball_Selected');
                                //     break;
                            }
                            ballBar.computeSingle();
                        });
                    }
                    //暂不显示遗漏冷热
                    //var result = ballBar.getAssisInfo(i);
                    var result = [];
                    if (result.length > 0) {
                        $.each(result, function (i, n) {
                            $(n).appendTo('#selectArea');
                        });
                    }
                });
                //绑定球点击事件
                //                $(".ballList li").bind("click", ballBar.ball_Click);
                //                $(".ballList_k3no_square li").bind("click", ballBar.ball_Click);
                //                $(".ballList_k3no_sttx li").bind("click", ballBar.ball_Click);
                $('.lotteryNumber ul>li').bind("click", ballBar.ball_Click);
            },
            //是否显示遗漏冷热
            getAssisInfo: function getAssisInfo(field_def_idx) {
                var str = "",
                    result = [];
                if (!$.isArray(ps.missHot.miss) || !$.isArray(ps.missHot.hot)) {
                    return [];
                }
                var idx = -1;
                switch (ps.curMethod.name) {
                    case "QSZX":
                    case "QSLX":
                    case "QEZX":
                    case "QELX":
                    case "QSIZX":
                    case "WXZX":
                    case "WXLX":
                    case "WXDW":
                    case 'SXDW':
                    case "SDQSZX":
                    case "SDQEZX":
                        idx = field_def_idx - 1 + 0;
                        break;
                    case "SIXZX":
                    case "ZSZX":
                    case "ZSLX":
                        idx = field_def_idx - 1 + 1;
                        break;
                    case "SXZX":
                    case "SXLX":
                        idx = field_def_idx - 1 + 2;
                        break;
                    case "EXZX":
                    case "EXLX":
                        idx = field_def_idx - 1 + 3;
                        break;
                    case "YXZX":
                        idx = field_def_idx - 1 + 4;
                        break;
                }
                if (idx > -1) {
                    $.each(ps.missHot.miss[idx], function (i, n) {
                        str += '<li class="yiLouNum">' + n + "</li>";
                    });
                    str = '<div class="missDIV" id="missHot_' + field_def_idx + '"><ul class="missHotNumber"><li class="missHotUnit">遗漏:</li><li><ul class="yiLouList" id=yiLouList_' + field_def_idx + ">" + str + "</ul></li></ul></div>";
                    result.push(str);
                    str = "";
                    $.each(ps.missHot.hot[idx], function (i, n) {
                        str += '<li class="yiLouNum">' + n + "</li>";
                    });
                    str = '<div class="hotDIV" id="missHot_' + field_def_idx + '"><ul class="missHotNumber"><li class="missHotUnit">冷热:</li><li><ul class="yiLouList" id=yiLouList_' + field_def_idx + ">" + str + "</ul></li></ul></div>";
                    result.push(str);
                }
                return result;
            },
            ball_Click: function ball_Click(e) {
                $(this).toggleClass("ball_Selected");
                /\w+_(\d+)/.test($(this).parent().attr("id"));
                var index = RegExp.$1;
                if ($(this).parent().find(".ball_Selected").length > ps.curMethod.field_def[index].max_selected) {
                    if (ps.curMethod.field_def[index].max_selected == 1) {
                        $(this).siblings(".ball_Selected").removeClass("ball_Selected");
                    } else {
                        $(this).removeClass("ball_Selected");
                        parent.layer.alert("当前最多只能选择" + ps.curMethod.field_def[index].max_selected + "个号码", { icon: 7 });
                    }
                } else {
                    //JSETDX 江苏快三 二同号单选 特殊处理
                    if (ps.curMethod.name == 'JSETDX') {
                        $('#locate_' + (index == 1 ? 2 : 1)).find(".ballList_k3no_square li").eq(parseInt($(this).text().substr(0, 1)) - 1).removeClass("ball_Selected");
                    }

                    ballBar.computeSingle();
                }
            },
            //计算注数
            computeSingle: function computeSingle() {
                var codes = [];
                $.each(ps.curMethod.field_def, function (i, n) {
                    var tmp = "";
                    var tmp2 = ps.curMethod.field_def[i].nums.split(" ");
                    $("#field_" + i + " li").each(function (ii) {
                        if ($(this).hasClass("ball_Selected")) {

                            if (ps.lotteryType == 9 || ps.curMethod.field_def[i].max_selected > 10 || tmp2[tmp2.length - 1].length > 1) {
                                tmp += $(this).text() + "_";
                            } else {
                                tmp += $(this).text();
                            }
                        }
                    });
                    if (tmp.indexOf("_") == -1) {
                        codes.push(tmp);
                    } else {
                        codes.push(tmp.substr(0, tmp.length - 1));
                    }
                });

                var ob = isLegalCode(codes);
                buyBar.updateSingle(ob.singleNum);

                if (ps.curMethod.name == 'WXDW' || ps.curMethod.name == 'REZX' || ps.curMethod.name == 'RSZX' || ps.curMethod.name == 'RSIZX') {
                    //如果是REZX || RSZX
                    $.each(codes, function (k, v) {
                        if (v == '') {
                            codes[k] = '-';
                        }
                    });
                }

                var resultCode = codes.join(",");
                if (ps.curMethod.name == 'JSSTTX') {
                    resultCode = '111_222_333_444_555_666';
                } else if (ps.curMethod.name == 'JSSLTX') {
                    //如果是三连号通选(nyjah)
                    resultCode = '123_234_345_456';
                }

                return {
                    singleNum: ob.singleNum,
                    isDup: ob.isDup,
                    code: resultCode
                };
            }
        };

        //4.遗漏
        var initMissHotBar = function initMissHotBar() {
            $("input[name=missHotBtn]").click(missHotBar.missHotBtn_Click);
            $('input[name=missHotBtn][value="1"]').click();
        };
        var missHotBar = {
            missHotBtn_Click: function missHotBtn_Click() {
                if ($(this).val() == "1") {
                    $("#selectArea .missDIV").removeClass("hidden");
                    $("#selectArea .hotDIV").addClass("hidden");
                } else {
                    $("#selectArea .missDIV").addClass("hidden");
                    $("#selectArea .hotDIV").removeClass("hidden");
                }
            }
        };
        //5.投注区相关
        var initBuyBar = function initBuyBar() {
            ps.nextProjectCounter = 0;
            buyBar.removeAll();
            //$("#totalSingleInfo").prepend('总计[<span>0</span>]注 倍数<input name="multiple" id="multiple" value="1"/>');
            $("#multiple").click(function () {
                this.focus();
                this.select();
            }).blur(function () {
                if (this.value == '' || this.value == 0) {
                    this.value = 1;
                    buyBar.updateTotalSingle();
                }
            }).keyup(buyBar.checkMultiple).keyup(buyBar.updateTotalSingle);
            $(".inputNumJian").click(function () {
                var multipleVal = $("#multiple").val();
                if (multipleVal == 1) {
                    $("#multiple").val(parseInt(1));
                } else {
                    $("#multiple").val(parseInt(multipleVal) - 1);
                };
                buyBar.updateTotalSingle();
            });
            $(".inputNumJia").click(function () {
                var multipleVal = $("#multiple").val();
                if (multipleVal > 5000) {
                    $("#multiple").val(parseInt(5000));
                } else {
                    $("#multiple").val(parseInt(multipleVal) + 1);
                };
                buyBar.updateTotalSingle();
            });
            $(".xDel").live("click", function () {
                $(this).parent().remove();
                buyBar.updateTotalSingle();
            });
            $("#clearProjectBtn").click(buyBar.removeAll);
            $("#clearProjectBtn1").click(buyBar.removeAll);
            $("#inputBtn").click(buyBar.inputBtn_Click);
            $("#selectCodeBtn").click(buyBar.selectCodeBtn_Click);
            $("#selectCodeBtnFast").click(buyBar.selectCodeBtnFast);
            $("#confirmBtn").click(function () {
                buyBar.confirmBtn_Click(0);
            });
            // $("#traceBtn").click(buyBar.traceBtn_Click);
            $(".selectRandomBtn").click(buyBar.selectRandomBtn_Click);
        };
        var buyBar = {
            selectCodeBtnFast: function selectCodeBtnFast() {
                buyBar.selectCodeBtn_Click();
                buyBar.confirmBtn_Click(1); //秒投传个参不走confirm
            },
            inputBtn_Click: function inputBtn_Click(e) {
                ps.curMethod = e.data;
                $('.methodPopStyle').hide();
                ballBar.showInput();
                //$("#singleInfo").hide();
                $('#methodGroupContainer').find('.method').removeClass("method_selected");
                $(this).addClass("method_selected");
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
            selectCodeBtn_Click: function selectCodeBtn_Click() {
                //var d = new Date();var t0 = d.getTime();
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
                            if (ob.isDup) {
                                //对于三星连选，选1注相当于3注，所以不能加ob.singleNum != 1条件
                                parent.layer.alert("您输入的号码有误，请重新检查输入!", { icon: 7 });
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
                    } else {
                        var allCodesStr = '';
                        var allProjectsStr = '';
                        for (var i in allCodes) {
                            if (allCodesStr) {
                                allCodesStr += '|';
                            }
                            allCodesStr += allCodes[i].join(",");
                            var ob = isLegalCode(allCodes[i]);
                            if (ob.isDup) {
                                //对于三星连选，选1注相当于3注，所以不能加ob.singleNum != 1条件
                                parent.layer.alert("您输入的号码有误，请重新检查输入!", { icon: 7 });
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
                $(".betPage").addClass('DisplayBlock');
                $(".locate dd").removeClass("DDcolor");
                //var d = new Date();var t1 = d.getTime();
                //alert("66 t0=" + t0 + "\nt1=" + t1 + "\nt1-t0=" + (t1-t0));
            },
            rxInputCodes: function rxInputCodes(position, inputArr) {
                // position: 勾选的位数; inputArr: 填入的其中的一注号码
                var code = ['-', '-', '-', '-', '-'];
                for (var i = position[0]; i <= position[position.length - 1]; i++) {
                    code[i] = '';
                }
            },
            //刷新layer投注区
            layerremoveAll: function layerremoveAll(index) {
                $(".NumberBox5").addClass("DisplayBlock").removeClass("DisplayNone");
                $(".moreGame").addClass("DisplayBlock").removeClass("DisplayNone");
                $(".GameBoxall").addClass("DisplayBlock").removeClass("DisplayNone");
                $(".betPage").addClass('DisplayNone').removeClass("DisplayBlock");
                $("#projectList").empty();
            },
            removeAll: function removeAll() {
                $("#token").val("");
                $("#projectList").empty();
                $(".lotteryNumber li").removeClass('ball_Selected');
                ps.nextProjectCounter = 0;
                $("#multiple").val("1");
                $('#betCount').html('0');
                buyBar.updateTotalSingle();
            },
            updateSingle: function updateSingle(singleNum) {
                var singleAmount = number_format(singleNum * 2 * ps.curMode, 3);
                $("#betCount").text(singleNum);
                $("#betAmount").text(singleAmount);
                var projectListLen = $('#projectList li').length == 0 ? 1 : $('#projectList li').length;
                if (singleNum > 0) {
                    $("#selectCodeBtn").addClass('selectCodeBtn_selected');
                    //选号
                    $(".selectCodeBtn_selected").click(function () {
                        $(".NumberBox5").addClass("DisplayNone").removeClass("DisplayBlock");
                        $(".moreGame").addClass("DisplayNone").removeClass("DisplayBlock");
                        $(".GameBoxall").addClass("DisplayNone").removeClass("DisplayBlock");
                        $(".betPage").addClass('DisplayBlock').removeClass("DisplayNone");
                        $(".locate dd").removeClass("DDcolor");
                    });
                    //计算盈亏
                    var totalBetAmount = $("#totalBetAmount").text();
                    var curPrizeHtml = $('#curPrizeSpan').find("option:selected").text();
                    var curPrize;
                    if (ps.curMethod.cname == "特码直选" || ps.curMethod.cname == "三中三" || ps.curMethod.cname == "二中二" || ps.curMethod.cname == "正特一码") {
                        curPrize = curPrizeHtml.split(',')[0];
                    } else {
                        curPrize = curPrizeHtml.split('/')[0];
                    }
                    $("#totalWin").text(number_format(curPrize * projectListLen * $("#multiple").val() - totalBetAmount - singleAmount, 3));
                } else {
                    $("#selectCodeBtn").click(function () {
                        $(".NumberBox5").addClass("DisplayBlock").removeClass("DisplayNone");
                        $(".moreGame").addClass("DisplayBlock").removeClass("DisplayNone");
                        $(".GameBoxall").addClass("DisplayBlock").removeClass("DisplayNone");
                        $(".betPage").addClass('DisplayNone').removeClass("DisplayBlock");
                    });
                    $("#selectCodeBtn").parent().removeClass('selectCodeBtn_selected');
                    //计算盈亏
                    var totalBetAmount = $("#totalBetAmount").text();
                    var curPrizeHtml = $('#curPrizeSpan').find("option:selected").text();
                    var curPrize;
                    if (ps.curMethod.cname == "特码直选" || ps.curMethod.cname == "三中三" || ps.curMethod.cname == "三中二" || ps.curMethod.cname == "二中二" || ps.curMethod.cname == "正特一码") {
                        curPrize = curPrizeHtml.split(',')[0];
                    } else {
                        curPrize = curPrizeHtml.split('/')[0];
                    }

                    $("#totalWin").text(number_format(curPrize * projectListLen * $("#multiple").val() - totalBetAmount, 3));
                }
            },
            updateTotalSingle: function updateTotalSingle() {
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
                if (ps.curMethod.cname == "特码直选" || ps.curMethod.cname == "三中三" || ps.curMethod.cname == "三中二" || ps.curMethod.cname == "二中二" || ps.curMethod.cname == "正特一码") {
                    curPrize = curPrizeHtml.split(',')[0];
                } else {
                    curPrize = curPrizeHtml.split('/')[0];
                }
                $("#totalWin").text(number_format(curPrize * projectListLen * $("#multiple").val() - totalBetAmount, 3));
            },
            checkMultiple: function checkMultiple() {
                var multipleNum = 50000;
                this.value = this.value.replace(/^0|[^\d]/g, '');
                if ($(this).val() > multipleNum) {
                    parent.layer.alert("请输入正确的倍数，最大为50000倍", { icon: 7 });
                    $(this).val(multipleNum);
                    return true;
                }
                return true;
            },

            //确认按钮
            confirmBtn_Click: function confirmBtn_Click(fastBet) {
                /*
                 var spans, codes, tmpMethod, mid, code, listFirst;
                 $("#projectList").children("li").each(function(i) {
                 spans = $(this).children();
                 // 46:1,2,3,4,5|6,7,8,9,0|1,2,3,4,5#43:1,2,3|6,7,0
                 mid = spans.eq(0).attr("mid");
                 code = spans.eq(1).text();
                 listFirst = false;
                 if (!tmpMethod) {
                 tmpMethod = mid;
                 codes = mid + ":";
                 listFirst = true;
                 }
                 if (tmpMethod != mid) {
                 codes += "#" + mid + ":";
                 tmpMethod = mid;
                 codes += code;
                 } else {
                 if (listFirst == true) {
                 codes += code;
                 } else {
                 codes += "|" + code;
                 }
                 }
                 });
                 */
                //140329 按要求去掉重复选号
                //1.先按玩法归类到一个对象
                var methodCodes = {},
                    codes = '';

                $("#projectList").children("li").each(function (i) {
                    var mname = $(this).children().eq(0).attr("mname");

                    if (!methodCodes[$(this).children().eq(0).attr("mid")]) {
                        methodCodes[$(this).children().eq(0).attr("mid")] = {};
                    }

                    methodCodes[$(this).children().eq(0).attr("mid")][i] = $(this).children().eq(1).text();
                });

                //2.拼出codes格式  46:1,2,3,4,5|6,7,8,9,0|1,2,3,4,5#43:1,2,3|6,7,0
                $.each(methodCodes, function (mid, v) {
                    codes += mid + ':';
                    $.each(v, function (code, vv) {
                        codes += vv + '|';
                    });
                    codes = rtrim(codes, '|');
                    codes += '#';
                });
                codes = rtrim(codes, '#');
                if (!ps.canBuy) {
                    parent.layer.alert("该期已截止购买", { icon: 7 });
                    return false;
                }
                if (codes.length == 0) {
                    parent.layer.alert("请先选择号码再投注", { icon: 7, closeBtn: 0 }, function (index) {
                        buyBar.layerremoveAll();
                        layer.close(index);
                    });
                    return false;
                }

                $("#token").val(getRandChar(32));

                var betTotalAmount = $("#totalBetAmount").text();
                var betTotalBetCount = $("#totalBetCount").text();
                var totalSingleInfo = $("#multiple").val();
                //输入正整数时
                if (!/^[1-9]*[1-9][0-9]*$/.test(totalSingleInfo)) {
                    parent.layer.alert("请输入正确的倍数，最大为50000倍", { icon: 7 });
                    $("#multiple").val("1");
                    return false;
                };
                var Flag = 0;
                if (fastBet == 0) {
                    var pattern = ps.curMode == 1 ? "2元" : ps.curMode == 0.5 ? "1元" : ps.curMode == 0.1 ? "2角" : ps.curMode == 0.05 ? "1角" : ps.curMode == 0.01 ? "分" : "厘";
                    var confirmInfo = '<div id="buy_message">请确认以下投注内容：<br>************************<br>单倍注数：' + betTotalBetCount + "注<br>总 金 额：￥" + betTotalAmount + "<br>模&nbsp;&nbsp;式：" + pattern + "模式<br>倍&nbsp;&nbsp;数：" + totalSingleInfo + "倍<br>************************<br></div>";
                    var confirmLayer = parent.layer.confirm(confirmInfo, { icon: 7 }, function (i) {
                        //使用进度条代替按钮
                        parent.$('.xubox_botton').empty();
                        parent.$('.xubox_botton').html('<div class="LoadingShow"><span class="Loading_icon"></span><span class="Loading_Font">投注中，请稍后...</span></div>');

                        //判断是重新新疆天津否是奖池玩法
                        Flag += 1;
                        if (Flag == 1) {
                            $.post("?c=game&a=play", {
                                op: "buy",
                                lotteryId: ps.lotteryId,
                                issue: ps.curIssueInfo.issue,
                                curRebate: ps.rebateGapList[ps.curPrizeIndex].rebate,
                                modes: ps.curMode,
                                codes: codes,
                                multiple: $("#multiple").val(),
                                token: $("#token").val()
                            }, function (response) {
                                if (response.errno == 0) {
                                    drawBar.todayBuyBtnNew_Click();
                                    //奖池玩法刷新
                                    buyBar.removeAll();
                                    var msg = '<div id="buy_success_message">购买成功!<br>************************<br>订单编号：' + response.pkgnum + "<br>投注期号：" + ps.curIssueInfo.issue + "<br>投注总额：￥" + betTotalAmount + "<br>模&nbsp;&nbsp;式：" + pattern + "模式<br>倍&nbsp;&nbsp;数：" + totalSingleInfo + "倍<br>************************<br></div>";
                                    parent.layer.close(i);
                                    parent.layer.alert(msg, { icon: 1, closeBtn: 0 }, function (index) {
                                        buyBar.layerremoveAll();
                                        layer.close(index);
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
                                } else if (response.errno == 65534) {//重复投啥都不用做

                                } else {
                                    parent.layer.close(i);
                                    console.log("错误代码:" + response.errno);
                                    parent.layer.alert("购买失败:" + response.errstr, { icon: 2 });
                                }
                                showBalance();
                            }, "json").fail(function (msg) {
                                parent.layer.close(i);
                                parent.layer.alert("网络异常，请在“游戏记录-订单查询”中确认该订单是否提交成功。", { icon: 2 });
                            });
                            var disonckick = setInterval(function () {
                                Flag = 0;
                                if (Flag == 0) {
                                    clearInterval(disonckick);
                                }
                            }, 5000);
                        }
                    });
                } else {
                    //秒投
                    //使用进度条代替按钮
                    parent.$('.xubox_botton').empty();
                    parent.$('.xubox_botton').html('<div class="LoadingShow"><span class="Loading_icon"></span><span class="Loading_Font">投注中，请稍后...</span></div>');

                    //判断是重新新疆天津否是奖池玩法
                    $.post("?c=game&a=play", {
                        op: "buy",
                        lotteryId: ps.lotteryId,
                        issue: ps.curIssueInfo.issue,
                        curRebate: ps.rebateGapList[ps.curPrizeIndex].rebate,
                        modes: ps.curMode,
                        codes: codes,
                        multiple: $("#multiple").val(),
                        token: $("#token").val()
                    }, function (response) {
                        if (response.errno == 0) {
                            drawBar.todayBuyBtnNew_Click();
                            //奖池玩法刷新
                            buyBar.removeAll();
                            var pattern = ps.curMode == 1 ? "2元" : ps.curMode == 0.5 ? "1元" : ps.curMode == 0.1 ? "2角" : ps.curMode == 0.05 ? "1角" : ps.curMode == 0.01 ? "分" : "厘";
                            var msg = '<div id="buy_success_message">购买成功!<br>************************<br>订单编号：' + response.pkgnum + "<br>投注期号：" + ps.curIssueInfo.issue + "<br>投注总额：￥" + betTotalAmount + "<br>模&nbsp;&nbsp;式：" + pattern + "模式<br>倍&nbsp;&nbsp;数：" + totalSingleInfo + "倍<br>************************<br></div>";
                            parent.layer.alert(msg, { icon: 1 });
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
                            console.log("错误代码:" + response.errno);
                            parent.layer.alert("购买失败:" + response.errstr, { icon: 2 });
                        }
                        showBalance();
                    }, "json").fail(function (msg) {
                        parent.layer.alert("网络异常，请在“游戏记录-订单查询”中确认该订单是否提交成功。", { icon: 2 });
                    });
                }
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
            },
            //追号按钮
            traceBtn_Click: function traceBtn_Click() {

                // $("#traceBtn").attr("mark",1);
                if ($("#projectList li").length == 0) {
                    parent.layer.alert("请先选择投注号码", { icon: 7 });
                    return false;
                }
                // $("#traceBtn").attr('disabled', "true");
                var mids = [];
                $("#projectList li").each(function (i) {
                    if ($.inArray($(this).find("span:first").attr("mid"), mids) == -1) {
                        mids.push($(this).find("span:first").attr("mid"));
                    }
                });
                $.ajax({
                    url: "?c=game&a=play",
                    type: "POST",
                    data: {
                        op: "getTracePage",
                        lotteryId: ps.lotteryId,
                        mids: mids.join(",")
                    },
                    cache: false,
                    dataType: "json",
                    timeout: 30000,
                    success: function success(response) {
                        $("#traceBtn").removeAttr("disabled");
                        if (response.errno == 0) {
                            ps.canTraceIssues = response.issues;
                            ps.traceMethodPrize = response.prize;
                            ps.tracePrizeLimit = response.prizeLimit;
                            var content = '<div id="traceHtml"><div class="beitouToolsBox"><ul class="beitouToolsQishi"><li class="beitouToolsQishiR"><span class="SpanPlace">倍数:</span><div class="inputNum select-area"><input type="text" id="style1BodyMultiple" class="zhuiz_number_e2 select-value" value="1" size="5"  maxlength="5" /><select class="multipleNumValue hand"><option>1</option><option>5</option><option>10</option><option>20</option></select></div><div  class="multipleNum"><span class="SpanPlace">追号期数：</span><div class="inputNum select-area"><input type="text" id="traceNum" class="zhuiz_number_e2" value="1" size="5"  maxlength="5" /></div><select class="multipleNumValue hand"><option>1</option><option>5</option><option>10</option><option>20</option></select><li class="beitouToolsQishiL"><span>起始:</span><span><select id="startIssue"></select></span></li><div class="beitouToolsfotter FloatRight"><p><span style="font-weight:bold;">中奖后停止</span><input  type="checkbox" value="1" name="stopOnWin" checked="checked" /></p></div></ul><div class="beitouToolsmainBox"><div style="display:block;" id="multipleStyle1DIV"><ul class="beitouToolsmainBoxTop" id="style1Head"><li class="checkbox"><input type="checkbox" id="checkAll" checked /></li><li>期号</li><li>倍数</li><li>当前投入</li><li>累计投入</li></ul><ul class="beitouToolsmainBoxCont" id="style1Body"></ul></div><div class="beitouToolSmainbt" id="multipleStyle2DIV" style="display:none;"><p>起始倍数<input type="text" value="1" class="beitouToolsinput" name="startMultiple" id="startMultiple" maxlength="5" size="5"/></p><ul class="beitouToolSmainbtzk" id="beitouToolSmainbtzk"><li><input type="radio" name="profitStyle"  value="1" />                            全程利润率:<input type="text" size="5" value="10" name="totalProfitRate" class="beitouToolsinput" class="beitouToolsinput" />                            %</li><li><input type="radio" name="profitStyle"  value="2"/>                            前<input type="text" size="5" value="5" name="first5Rate" class="beitouToolsinput"/>                            期利润率<input type="text" size="5"  class="beitouToolsinput" value="10" name="first5RateValue"/>                            %,之后利润率<input type="text" size="5" value="5" class="beitouToolsinput" name="laterRateValue"/>                            %</li><li><input type="radio" name="profitStyle"  value="3"/>                            全程累计利润:<input type="text" size="5" value="100" name="totalProfit" class="beitouToolsinput" />                            元</li><li><input type="radio" name="profitStyle" value="4"/>                            前<input type="text" size="5" value="5" class="beitouToolsinput" name="first5Profit" />                            期累计利润<input type="text" size="5"  class="beitouToolsinput" value="100" name="first5ProfitValue" />                            元,之后累计利润<input type="text" size="5" value="50" class="beitouToolsinput"  name="laterProfitValue" />                            元</li></ul><span class="beitouTooltzjhb"><input type="button"  class="bt_tools_navys" id="generalPlanBtn" value="生成投资计划表"/></span><ul class="beitouToolSmainbtContTop" id="style2Head"><li class="spanWidth90px">期号</li><li class="spanWidth50px">倍数</li><li class="spanWidth70px">当前投入</li><li class="spanWidth70px">累积投入</li><li class="spanWidth70px">当期奖金</li><li class="spanWidth70px">合计利润</li><li class="spanWidth70px">利润率</li></ul><ul class="beitouToolSmainBTContZneir" id="style2Body"></ul></div></div><ul class="beitouToolsTop"><li class="TextAlignC"> 包含当前期最多追<span id="maxTraceCount">0</span>期</li><li class="beitouToolsTopContent fix"><ul><li class="beitouToolsTopCont1">单倍注数<span id="singleNum"></span>注,购买<span id="issuesNum2"></span>期,<span class="FloatRight">合计￥<span id="traceTotalAmount"></span></span></li></ul><ul class="beitouToolsQs"><li>期数倍数<span><input type="radio" name="multipleStyle" id="multipleStyle1" value="1" class="radio1" /><label for="multipleStyle1">自定义</label></span><span class="FloatRight">                                当前期倒计时：<label id="remainTimerLabel"></label></span></li></ul><ul><li class="beitouToolsButton"><input class="btnOne" id="confirmTraceBtn" value="确认追号"></input></li></ul></li><li class="beitouToolsTopR"></li></ul></div>          ';
                            var i = traceFunc.showTracePage(content);

                            //特例： 一下玩法不能使用倍投工具。
                            var disableMethods = [250, 251, 360, 368, 28, 56, 101, 202, 298, 34, 57, 102, 203, 304, 4, 52, 106, 193, 274, 5, 53, 107, 194, 275, 81, 108, 109, 195, 351, 42, 75, 115, 219, 312, 43, 76, 116, 220, 313, 38, 71, 120, 214, 308, 39, 72, 121, 215, 309, 82, 110, 122, 216, 352, 86, 93, 126, 228, 356, 87, 94, 127, 229, 357, 88, 95, 128, 230, 358, 47, 78, 141, 222, 317, 235, 236, 386, 25, 155, 173, 189, 24, 154, 172, 188];

                            if (response.prize == 0 || mids.length != 1 || $.inArray(parseInt(ps.curMethod.method_id), disableMethods) != -1) {
                                $("#multipleStyle2", parent.document).attr("disabled", true);
                            }
                            $("input[name=multipleStyle]", parent.document).click(traceFunc.multipleStyle_Click);
                            $("#confirmTraceBtn", parent.document).click(function () {
                                if (traceFunc.confirmTraceBtn_Click()) {
                                    parent.layer.close(i);
                                }
                            });
                            $("#cancelTraceBtn", parent.document).click(function () {
                                traceFunc.cancelTraceBtn_Click();
                                parent.layer.close(i);
                            });
                            $("#startIssue", parent.document).change(traceFunc.startIssue_Change);
                            $("#traceNum", parent.document).click(function () {
                                this.focus();
                                this.select();
                            }).keyup(buyBar.checkMultiple).keyup(traceFunc.traceNum_Keyup);
                            // 点击下三角图标
                            $(".multipleNumDropdown", parent.document).mousemove(function () {
                                $(this).addClass('multipleNumDropdownSelected');
                            }).mouseout(function () {
                                $(this).removeClass('multipleNumDropdownSelected');
                            }).click(function () {
                                if ($(this).next('.multipleNumValue').css('display') == 'none') {
                                    $(this).next('.multipleNumValue').slideDown('fast');
                                } else {
                                    $(this).next('.multipleNumValue').slideUp('fast');
                                }
                            });
                            // 选择下拉菜单
                            $(".multipleNumValue li", parent.document).mousemove(function () {
                                $(this).addClass('multipleNumValueSelected');
                            }).mouseout(function () {
                                $(this).removeClass('multipleNumValueSelected');
                            }).click(function () {
                                var obj = $(this).parent().siblings('.zhuiz_number_e2');
                                obj.val(parseInt($(this).text()));
                                // 转换选择框的值的类型
                                var proxy_0 = $.proxy(buyBar.checkMultiple, obj.get(0));
                                proxy_0();

                                // 当是倍数下拉框时，修改倍数的输入框，并且修改总金额
                                if (obj.attr('id') == 'style1BodyMultiple') {
                                    $('.style1BodyMultiple', parent.document).val(obj.val()).each(function () {
                                        var proxy_1 = $.proxy(traceFunc.style1BodyMultiple_Keyup, $(this).get(0));
                                        proxy_1();
                                    });
                                    traceFunc.updateTotalMoney();
                                }
                                // 当是期数下拉框时，修改期数的输入框，并且调用对应的方法
                                else if (obj.attr('id') == 'traceNum') {
                                        // $.proxy 将参数2的作用域传递给参数1的函数中。
                                        var proxy_2 = $.proxy(traceFunc.traceNum_Keyup, obj.get(0));
                                        proxy_2();
                                    }
                                $(this).parent().slideUp('fast');
                            });
                            // 倍数除了下拉框，还可以通过输入框来调整倍数，并且修改总金额
                            $('#style1BodyMultiple', parent.document).click(function () {
                                this.focus();
                                this.select();
                            }).keyup(buyBar.checkMultiple).keyup(function () {
                                if (isNaN(parseInt($(this).val()))) {
                                    //$(this).val("1");
                                    $('.style1BodyMultiple').val(1);
                                    return;
                                }
                                $('.style1BodyMultiple', parent.document).val($(this).val()).each(function () {
                                    var proxy_1 = $.proxy(traceFunc.style1BodyMultiple_Keyup, $(this).get(0));
                                    proxy_1();
                                });
                                traceFunc.updateTotalMoney();
                            });
                            $('#checkAll', parent.document).click(function () {
                                if ($(this).is(':checked')) {
                                    $('.checkbox input[type=checkbox]', parent.document).attr('checked', true).parent().parent().css('color', '');
                                } else {
                                    $('.checkbox input[type=checkbox]', parent.document).attr('checked', false).parent().parent().css('color', '#ccc');
                                }
                                traceFunc.updateTotalMoney();
                            });
                            $('.checkbox input[type=checkbox]', parent.document).live('click', function () {
                                if ($(this).attr('id') != 'checkAll') {
                                    if ($(this).is(':checked')) {
                                        $(this).parent().parent().css('color', '');
                                    } else {
                                        // 修改文字颜色为灰色
                                        $(this).parent().parent().css('color', '#ccc');
                                    }
                                    var index = $(this).parent().parent().index();
                                    var proxy_3 = $.proxy(traceFunc.style1BodyMultiple_Keyup, $('#style1BodyMultiple_' + index, parent.document).get(0));
                                    proxy_3();
                                    traceFunc.updateTotalMoney();
                                }
                            });

                            //                            $("#ui-dialog2", parent.document).keyup(function(e) {
                            //                                var key = e.keyCode ? e.keyCode : e.which;
                            //                                if (key == 27) {
                            //                                    $("#cancelTraceBtn", parent.document).click()
                            //                                }
                            //                            });


                            $("#singleNum", parent.document).text($("#totalBetCount").text());
                            $("#issuesNum2", parent.document).text("1");
                            $("#multipleStyle1", parent.document).click();
                            traceFunc.updateTotalMoney();
                            runTime.traceRemainTimer = window.setInterval(traceFunc.traceRemain_Timer_Handle, 1000);
                        } else {
                            alert("系统繁忙，请稍候再试(01)");
                        }
                    },
                    error: function error(XMLHttpRequest, textStatus, errorThrown) {
                        $("#traceBtn").removeAttr("disabled");
                        if (errorThrown.indexOf("a=logout") != -1 || errorThrown.indexOf("a=login") != -1) {
                            alert("您已经退出，请重新登录");
                            window.location.href = "?a=logout";
                        } else {
                            alert("操作超时，请刷新页面.");
                        }
                    }
                });
            },
            // 机选方法
            selectRandom: function selectRandom() {
                var counts = propLen(ps.curMethod.field_def); // 获得位数
                var ball,
                    code,
                    singleNum,
                    mixSelect = {},
                    codes = []; // ball: 球的个数; code: 随机取的号码; mixSelect: 选择号码最小个数
                switch (ps.curMethod.name) {
                    case 'WXDW':
                        //五星定位(任一直选) 随机两位，每位一个数
                        mixSelect['WXDW'] = 1;
                    case 'REZX':
                        //任二直选:随机两位，每位一个数
                        mixSelect['REZX'] = 2;
                    case 'RSZX':
                        //任三直选:随机两位，每位一个数
                        mixSelect['RSZX'] = 3;

                        // 初始化每个位数的值
                        for (var n = 0; n < counts; n++) {
                            codes[n] = "-";
                        }
                        // 生成不重复的两个位数，然后在这两个位数中各自生成一个随机数
                        var tmpCounts = [];
                        for (var i = 1; i <= mixSelect[ps.curMethod.name]; i++) {
                            count = Math.floor(Math.random() * counts + 1); // 随机位数
                            var isEqual = false;
                            for (var idx in tmpCounts) {
                                if (tmpCounts[idx] === count) {
                                    isEqual = true;
                                    break;
                                }
                            }
                            if (isEqual) {
                                i--;
                            } else {
                                tmpCounts.push(count);

                                // 生成随机数并存入codes数组中
                                ball = parseInt(ps.curMethod.field_def[i].max_selected); // 获得投注球个数
                                code = Math.floor(Math.random() * ball);
                                var codesArr = ps.curMethod.field_def[i].nums.split(" ");
                                var value = codesArr[code];
                                // 获得随机出来的号码对应的投注值,生成的是一个字符串 code:1 value:"1"
                                codes[count - 1] = value;
                            }
                        }
                        break;
                    case 'RSIZX':
                        //任四直选:随机四位，每位一个数
                        mixSelect['RSIZX'] = 4;

                        // 初始化每个位数的值
                        for (var n = 0; n < counts; n++) {
                            codes[n] = "-";
                        }
                        // 生成不重复的两个位数，然后在这两个位数中各自生成一个随机数
                        var tmpCounts = [];
                        for (var i = 1; i <= mixSelect[ps.curMethod.name]; i++) {
                            count = Math.floor(Math.random() * counts + 1); // 随机位数
                            var isEqual = false;
                            for (var idx in tmpCounts) {
                                if (tmpCounts[idx] === count) {
                                    isEqual = true;
                                    break;
                                }
                            }
                            if (isEqual) {
                                i--;
                            } else {
                                tmpCounts.push(count);

                                // 生成随机数并存入codes数组中
                                ball = parseInt(ps.curMethod.field_def[i].max_selected); // 获得投注球个数
                                code = Math.floor(Math.random() * ball);
                                var codesArr = ps.curMethod.field_def[i].nums.split(" ");
                                var value = codesArr[code];
                                // 获得随机出来的号码对应的投注值,生成的是一个字符串 code:1 value:"1"
                                codes[count - 1] = value;
                            }
                        }
                        break;
                    case 'EXZUX':
                        //后二组选
                        mixSelect['EXZUX'] = [2];
                    case 'SXZS':
                        //后三组三
                        mixSelect['SXZS'] = [2];
                    case 'SXZL':
                        //后三组六
                        mixSelect['SXZL'] = [3];
                    case 'QEZUX':
                        //前二组选
                        mixSelect['QEZUX'] = [2];
                    case 'QSZS':
                        //前三组三
                        mixSelect['QSZS'] = [2];
                    case 'QSZL':
                        //前三组六
                        mixSelect['QSZL'] = [3];
                    case "ZSZS":
                        //中三组三
                        mixSelect['ZSZS'] = [2];
                    case "ZSZL":
                        //中三组六
                        mixSelect['ZSZL'] = [3];
                    case 'ZUX24':
                        //后四组选24
                        mixSelect['ZUX24'] = [4];
                    case 'ZUX12':
                        //后四组选12
                        mixSelect['ZUX12'] = [1, 2];
                    case 'ZUX6':
                        //后四组选6
                        mixSelect['ZUX6'] = [2];
                    case 'ZUX4':
                        //后四组选4
                        mixSelect['ZUX4'] = [1, 1];
                    case 'ZUX120':
                        //组选120
                        mixSelect['ZUX120'] = [5];
                    case 'ZUX60':
                        //五星组选60
                        mixSelect['ZUX60'] = [1, 3];
                    case 'ZUX30':
                        //五星组选30
                        mixSelect['ZUX30'] = [2, 1];
                    case 'ZUX20':
                        //五星组选20
                        mixSelect['ZUX20'] = [1, 2];
                    case 'ZUX10':
                        //五星组选10
                        mixSelect['ZUX10'] = [1, 1];
                    case 'ZUX5':
                        //五星组选5
                        mixSelect['ZUX5'] = [1, 1];

                        // 根据位数以及最小选择数生成不重复的数值
                        var allCodes = [];
                        for (var i = 1; i <= counts; i++) {
                            var tmpArr = [],
                                tmp = "";
                            ball = parseInt(ps.curMethod.field_def[i].max_selected); // 获得投注球个数

                            for (var j = 1; j <= mixSelect[ps.curMethod.name][i - 1]; j++) {
                                var isEqual = false;
                                // 生成随机数
                                code = Math.floor(Math.random() * ball);
                                for (var idx in allCodes) {
                                    if (allCodes[idx] === code) {
                                        isEqual = true;
                                        break;
                                    }
                                }
                                if (isEqual) {
                                    j--;
                                } else {
                                    allCodes.push(code); // 将每位的号码存入tmpCodes数组中，不能重复
                                    tmpArr.push(code); // 将每位的号码存入tmpArr数组中
                                    tmp = tmpArr.sort().join(''); // 排序并将一列号码转为字符串，例[1,2] => "12"
                                }
                            }
                            codes.push(tmp);
                        }
                        break;
                    default:
                        // 循环位数,每个位数必须有一个号码
                        for (i = 1; i <= counts; i++) {
                            ball = parseInt(ps.curMethod.field_def[i].max_selected); // 获得投注球个数
                            // 获得号码
                            code = Math.floor(Math.random() * ball);
                            var codesArr = ps.curMethod.field_def[i].nums.split(" ");
                            var value = codesArr[code];
                            // 获得随机出来的号码对应的投注值,生成的是一个字符串 code:1 value:"1"
                            codes.push(value);
                        }
                        break;
                }
                var ob = isLegalCode(codes); // 验证号码并获得注数
                var resultCode = codes.join(",");
                if (ob.singleNum == 0) {
                    return false;
                }
                ps.nextProjectCounter++;
                var singleAmount = number_format(ob.singleNum * 2 * ps.curMode, 3);
                $('<li><span class="width1" mid="' + ps.curMethod.method_id + '" mname="' + ps.curMethod.name + '">' + ps.curMethod.cname + '</span><span class="width2">' + resultCode + '</span><span class="width3">' + ob.singleNum + '注</span><span class="width4">￥' + singleAmount + '</span><span class="xDel">X</span></li>').appendTo("#projectList");

                buyBar.updateTotalSingle();
            },
            // 机选点击事件
            selectRandomBtn_Click: function selectRandomBtn_Click() {
                // 将按钮变为未选中
                $(this).attr('disabled', 'true');
                var num = $(this).attr('num'),
                    i;
                // 循环机选注数
                for (i = 1; i <= num; i++) {
                    buyBar.selectRandom();
                }
                $(this).removeAttr('disabled');
                $(".betPage").addClass('DisplayBlock');
            }
        };

        //5.1定义追号几个按钮事件 放在buyBar前面
        var traceFunc = {
            multipleStyle_Click: function multipleStyle_Click() {
                $("#startIssue", parent.document).get(0).selectedIndex = 0;
                $("#traceNum", parent.document).val(1);
                $("#style1BodyMultiple", parent.document).val(1);
                if ($(this).val() == 1) {
                    $(".style1BodyMultiple", parent.document).live("click", function () {
                        this.focus();
                        this.select();
                    }).live("keyup", buyBar.checkMultiple).live("keyup", traceFunc.style1BodyMultiple_Keyup);
                    traceFunc.updateStyle1();
                    $(".multipleNum", parent.document).eq(0).show();
                    $("#multipleStyle1DIV", parent.document).show();
                    $("#multipleStyle2DIV", parent.document).hide();
                } else {
                    $("#startMultiple", parent.document).click(function () {
                        this.focus();
                        this.select();
                    });
                    $("#beitouToolSmainbtzk input", parent.document).click(function () {
                        $(this).parent().click();
                    }).focus(function () {
                        this.select();
                    });
                    $("#beitouToolSmainbtzk li", parent.document).click(function () {
                        $(this).addClass("checked").siblings().removeClass("checked");
                        $(this).find("input[name=profitStyle]").attr("checked", true);
                    });
                    $(".multipleNum", parent.document).eq(0).hide();
                    $("#generalPlanBtn", parent.document).click(traceFunc.generalPlanBtn_Click);
                    $("#issuesNum2", parent.document).text("1");
                    $("#traceTotalAmount", parent.document).text(number_format(parseInt($("#singleNum", parent.document).text()) * 2 * ps.curMode, 3));
                    $("#style2Body", parent.document).empty();
                    $("#startMultiple", parent.document).val("1");
                    $("input[name=totalProfitRate]", parent.document).val("10");
                    $("input[name=first5Rate]", parent.document).val("5");
                    $("input[name=first5RateValue]", parent.document).val("10");
                    $("input[name=laterRateValue]", parent.document).val("5");
                    $("input[name=totalProfit]", parent.document).val("100");
                    $("input[name=first5Profit]", parent.document).val("5");
                    $("input[name=first5ProfitValue]", parent.document).val("100");
                    $("input[name=laterProfitValue]", parent.document).val("50");
                    $("#beitouToolSmainbtzk li:first", parent.document).click();
                    $("#multipleStyle1DIV", parent.document).hide();
                    $("#multipleStyle2DIV", parent.document).show();
                }
            },
            startIssue_Change: function startIssue_Change() {
                if ($("input[name=multipleStyle]:checked", parent.document).val() == "1") {
                    traceFunc.updateStyle1();
                } else {
                    traceFunc.generalPlanBtn_Click();
                }
            },
            traceNum_Keyup: function traceNum_Keyup() {
                if ($("input[name=multipleStyle]:checked", parent.document).val() == "1") {
                    traceFunc.updateStyle1();
                }
            },
            //追号界面也加一个倒计时
            traceRemain_Timer_Handle: function traceRemain_Timer_Handle() {
                var d = subTime(ps.curRemainTime);
                if (ps.curRemainTime > 0) {
                    $("#remainTimerLabel", parent.document).text(d.day + ":" + d.hour + ":" + d.minute + ":" + d.second);
                    $("#traceBtn").attr("mark", 0);
                } else {
                    clearInterval(runTime.traceRemainTimer);
                    var d2 = subTime(ps.curWaitOpenTime);
                    $("#remainTimerLabel", parent.document).text(d2.day + ":" + d2.hour + ":" + d2.minute + ":" + d2.second);
                    runTime.traceWaitOpenTimer = window.setInterval(traceFunc.traceWaitOpen_Timer_Handle, 100);
                    //去掉过期的一期
                    parent.layer.alert("第" + ps.curIssueInfo.issue + "期投注时间已结束，投注内容将进入到下一期！", { icon: 7 });
                    if ($("#traceBtn").attr("mark") != 1) {
                        $("#startIssue", parent.document).children(":first").remove();
                        $("#startIssue", parent.document).children(":first").text($("#startIssue", parent.document).children(":first").text() + "(当前期)");

                        // 自定义追号
                        if ($("input[name=multipleStyle]:checked", parent.document).val() == "1") {
                            var tmpArr = [];
                            $(".style1BodyMultiple", parent.document).each(function () {
                                tmpArr.push(this.value);
                            });
                            traceFunc.updateStyle1();
                            $(".style1BodyMultiple", parent.document).each(function () {
                                this.value = tmpArr.pop();
                            });
                        }
                        // 倍投时，当已经生成投资计划表时，当前期改变，投资计划表一起改变
                        else {
                                if ($("#style2Body li", parent.document).length > 0) {
                                    traceFunc.generalPlanBtn_Click();
                                }
                            }
                    }
                }
            },
            //显示锁倒计时
            traceWaitOpen_Timer_Handle: function traceWaitOpen_Timer_Handle() {
                var d = subTime(ps.curWaitOpenTime);
                $("#remainTimerLabel", parent.document).text(d.day + ":" + d.hour + ":" + d.minute + ":" + d.second);
                if (ps.curWaitOpenTime < 0) {
                    clearInterval(runTime.traceWaitOpenTimer);
                    runTime.traceRemainTimer = window.setInterval(traceFunc.traceRemain_Timer_Handle, 1000);
                }
            },
            style1BodyMultiple_Keyup: function style1BodyMultiple_Keyup() {
                var multiple = parseInt($(this).val());
                if (isNaN(multiple) || multiple < 1 || multiple > 99999) {
                    multiple = 1;
                }
                var $reg = /\w+_(\d+)/;
                $reg.test($(this).attr("id"));
                var idx = RegExp.$1;
                if (idx == 0) {
                    var prevTotalMoney = 0;
                } else {
                    var prevIdx;
                    for (var i = idx - 1; i >= 0; i--) {
                        if ($('#check_' + i, parent.document).is(':checked')) {
                            prevIdx = i;
                            break;
                        }
                    }
                    var prevTotalMoney = parseFloat($("#totalMoney_" + prevIdx, parent.document).text());
                }
                // 只改变修改单个倍数对应的期号金额
                $("#style1BodyMultiple_" + idx, parent.document).val(multiple);
                var curMoney = parseInt($("#singleNum", parent.document).text()) * multiple * 2 * ps.curMode;
                $("#curMoney_" + idx, parent.document).text(number_format(curMoney, 3));
                while (idx <= $("#style1Body li", parent.document).length) {
                    if ($('#check_' + idx, parent.document).is(':checked')) {
                        prevTotalMoney += parseFloat($("#curMoney_" + idx, parent.document).text());
                        $("#totalMoney_" + idx, parent.document).text(number_format(prevTotalMoney, 3));
                    }
                    idx++;
                }
                traceFunc.updateTotalMoney();
            },
            updateStyle1: function updateStyle1() {
                var idx = -1;
                $.each(ps.canTraceIssues, function (k, v) {
                    if (v == $("#startIssue", parent.document).val()) {
                        idx = k;
                    }
                });
                if (idx == -1) {
                    //alert("数据出错");
                    //throw "数据出错";
                    return;
                }
                if (isNaN(parseInt($("#traceNum", parent.document).val()))) {
                    //$("#traceNum", parent.document).val("1");
                    $("#style1Body", parent.document).empty();
                    return;
                }
                $('#style1BodyMultiple', parent.document).val("1");
                var willTraceIssues = ps.canTraceIssues.slice(idx, idx + parseInt($("#traceNum", parent.document).val()));
                if (willTraceIssues.length < $("#traceNum", parent.document).val()) {
                    parent.layer.alert("最多只能追" + willTraceIssues.length + "期", { icon: 7 });
                    $("#traceNum", parent.document).val(willTraceIssues.length);
                }
                $("#style1Body", parent.document).empty();
                var str = "",
                    curMoney,
                    totalMoney = 0;
                $('#checkAll', parent.document).attr('checked', true);
                $.each(willTraceIssues, function (k, v) {
                    curMoney = parseInt($("#singleNum", parent.document).text()) * 2 * ps.curMode;
                    totalMoney += curMoney;
                    var shortIssue = '';
                    // switch (ps.property_id){
                    //     case 1://20161202-025
                    //     case 2:
                    //     case 3:
                    //         shortIssue = v.substring(8,12);
                    //         break;
                    //     case 5://   2016248
                    //         shortIssue = v.substring(4,7);
                    //         break;
                    //     case 6://574040
                    //         shortIssue = v;
                    //         break;
                    // }
                    var str = '<li id="traceIssueLI_' + k + '"><span class="checkbox"><input type="checkbox" id="check_' + k + '" checked /></span><span id="traceIssue_' + k + '">' + v + '</span><span><input type="text" value="1" id="style1BodyMultiple_' + k + '" class="beitouToolsinput style1BodyMultiple" maxlength="5" /></span><span id=curMoney_' + k + ">" + number_format(curMoney, 3) + "</span><span id=totalMoney_" + k + ">" + number_format(totalMoney, 3) + "</span></li>";
                    $("#style1Body", parent.document).append(str);
                    $(".style1BodyMultiple", parent.document).bind("click", function () {
                        this.focus();
                        this.select();
                    }).bind("keyup", buyBar.checkMultiple).bind("keyup", traceFunc.style1BodyMultiple_Keyup);
                });
                traceFunc.updateTotalMoney();
            },
            confirmTraceBtn_Click: function confirmTraceBtn_Click() {
                var spans, codes, tmpMethod, mid, code, listFirst;
                $("#projectList").children("li").each(function (i) {
                    spans = $(this).children();
                    mid = spans.eq(0).attr("mid");
                    code = spans.eq(1).text();
                    listFirst = false;
                    if (!tmpMethod) {
                        tmpMethod = mid;
                        codes = mid + ":";
                        listFirst = true;
                    }

                    if (tmpMethod != mid) {
                        codes += "#" + mid + ":";
                        tmpMethod = mid;
                        codes += code;
                    } else {
                        if (listFirst == true) {
                            codes += code;
                        } else {
                            codes += "|" + code;
                        }
                    }
                });
                if (!ps.canBuy) {
                    parent.layer.alert("该期已截止购买", { icon: 7 });
                    return false;
                }
                if (codes.length == 0) {
                    parent.layer.alert("请先选择号码再投注", { icon: 7, closeBtn: 0 }, function (index) {
                        buyBar.layerremoveAll();
                        layer.close(index);
                    });
                    return false;
                }

                var traceData = [];
                if ($("input[name=multipleStyle]:checked", parent.document).val() == "1") {
                    $("#style1Body li", parent.document).each(function (i) {
                        if ($(this).find("input[type=checkbox]").is(':checked')) {
                            var issue = $(this).find("span:eq(1)").text();
                            var multiple = $(this).find("input[type=text]").val();
                            traceData.push({
                                issue: issue,
                                multiple: multiple
                            });
                        }
                    });
                } else {
                    $("#style2Body li", parent.document).each(function (i) {
                        var issue = $(this).find("span:eq(0)").text();
                        var multiple = $(this).find("span:eq(1)").text();
                        traceData.push({
                            issue: issue,
                            multiple: multiple
                        });
                    });
                }
                if (!traceData || traceData.length <= 0) {
                    parent.layer.alert("追号的期数不能为空", { icon: 7 });
                    return false;
                }

                $("#token").val(getRandChar(32));

                var pattern = ps.curMode == 1 ? "2元" : ps.curMode == 0.5 ? "1元" : ps.curMode == 0.1 ? "2角" : ps.curMode == 0.05 ? "1角" : ps.curMode == 0.01 ? "分" : "厘";
                var traceTotalAmount = $("#traceTotalAmount", parent.document).text();
                var stopOnWin = $("input[name=stopOnWin]", parent.document).attr("checked") ? 1 : 0;
                var confirmInfo = '<div id="buy_message">请确认以下投注内容：<br>************************<br>是否追号：是<br>单倍注数：' + $("#totalBetCount").text() + "注<br>总 金 额：￥" + traceTotalAmount + "<br>超始期号：" + traceData[0].issue + "<br>追号期数：" + traceData.length + "<br>模&nbsp;&nbsp;式：" + pattern + "模式<br>************************<br></div>";
                traceFunc.destroyTracePage();
                parent.layer.confirm(confirmInfo, { icon: 7 }, function (i) {

                    $.post("?c=game&a=play", {
                        op: "buy",
                        lotteryId: ps.lotteryId,
                        issue: ps.curIssueInfo.issue,
                        curRebate: ps.rebateGapList[ps.curPrizeIndex].rebate,
                        modes: ps.curMode,
                        codes: codes,
                        traceData: traceData,
                        stopOnWin: stopOnWin,
                        token: $("#token").val()
                    }, function (response) {
                        if (response.errno == 0) {
                            buyBar.removeAll();
                            drawBar.todayBuyBtnNew_Click();
                            var msg = '<div id="buy_success_message">追号订单成功!<br>************************<br>订单编号：' + response.pkgnum + "<br>起始期号：" + traceData[0].issue + "<br>追号期数：" + traceData.length + "<br>追号总额：￥" + traceTotalAmount + "<br>模&nbsp;&nbsp;式：" + pattern + "模式<br>************************<br></div>";
                            parent.layer.close(i);
                            parent.layer.alert(msg, { icon: 1 });
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
                        } else {
                            parent.layer.close(i);
                            parent.layer.alert("追号失败:" + response.errstr + response.errno, { icon: 2 });
                        }
                        //showBalance()
                    }, "json").fail(function (msg) {
                        parent.layer.close(i);
                        layer.alert("网络异常，请在“游戏记录-追号记录”中确认该订单是否提交成功。", { icon: 2 });
                    });
                    //使用进度条代替按钮
                    parent.$('.xubox_botton').empty();
                    parent.$('.xubox_botton').html('<div class="LoadingShow"><span class="Loading_icon"></span><span class="Loading_Font">投注中，请稍后...</span></div>');
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

                return true;
            },
            cancelTraceBtn_Click: function cancelTraceBtn_Click() {
                traceFunc.destroyTracePage();
            },
            showTracePage: function showTracePage(content) {
                //                var wnd = window.parent;
                //                $("body", wnd.document).append('<div id="ui-dialog2" style="outline: 0px none; z-index: 1002;" class="ui-dialog" tabindex="-1"></div>');
                //                var uiDialog2 = $("#ui-dialog2", wnd.document).append(content).css("width", 530).hide();
                //                $("body", wnd.document).append('<div id="ui-widget-overlay2" class="ui-widget-overlay2" style="z-index: 1001;"></div>');
                //                var dialogOverlay2 = $("#ui-widget-overlay2", wnd.document).css("width", $(wnd.document).width()).css("height", $(wnd.document).height());
                //                var rect = getXY(wnd);
                //                uiDialog2.css("left", rect.scrollX + (rect.width - uiDialog2.width()) / 2);
                //                uiDialog2.css("top", rect.scrollY + (rect.height - uiDialog2.height()) / 2);
                //                uiDialog2.show();
                //                dialogOverlay2.show();
                var i = parent.layer.open({
                    type: 1,
                    title: '追号管理',
                    offset: ['0', '0'],
                    //border: [0],
                    area: ['auto', '28.44rem'],
                    content: content,
                    success: function success(l) {
                        var traceIssueOptions = '';
                        $.each(ps.canTraceIssues, function (k, v) {
                            traceIssueOptions += '<option value="' + v + '">' + v + '期</option>';
                        });
                        $("#startIssue", parent.document).html(traceIssueOptions).children(":first").text($("#startIssue", parent.document).children(":first").text() + "(当前期)");
                        $('#maxTraceCount', parent.document).html(ps.canTraceIssues.length);
                    },
                    close: traceFunc.cancelTraceBtn_Click
                });
                $(document, parent.document).one('keyup', function (e) {
                    var key = e.keyCode ? e.keyCode : e.which;
                    if (key == 27) {
                        traceFunc.cancelTraceBtn_Click();
                        parent.layer.close(i);
                    }
                });
                return i;
            },
            destroyTracePage: function destroyTracePage() {
                //                $("#ui-dialog2", parent.document).remove();
                //                $("#ui-widget-overlay2", parent.document).remove();
                clearInterval(runTime.traceRemainTimer);
                clearInterval(runTime.traceWaitOpenTimer);
            },
            updateTotalMoney: function updateTotalMoney() {
                var totalMultiple = 0;
                if ($("input[name=multipleStyle]:checked", parent.document).val() == "1") {
                    $("#style1Body li", parent.document).each(function (i) {
                        if ($(this).find("input[type=checkbox]").is(':checked')) {
                            totalMultiple += parseInt($(this).find("input[type=text]").val());
                        }
                    });
                    $("#issuesNum2", parent.document).text($("#style1Body li input[type=checkbox]:checked", parent.document).length);
                } else {
                    $("#style2Body li", parent.document).each(function (i) {
                        totalMultiple += parseInt($(this).find("span:eq(1)").text());
                    });
                    $("#issuesNum2", parent.document).text($("#style2Body li", parent.document).length);
                }
                $("#traceTotalAmount", parent.document).text(number_format(parseInt($("#singleNum", parent.document).text()) * totalMultiple * 2 * ps.curMode, 3));
            },
            generalPlanBtn_Click: function generalPlanBtn_Click() {
                var computeMultiple = function computeMultiple(startMultiple, profitRate, singleAmount, totalMoney, prize) {
                    startMultiple = isNaN(parseInt(startMultiple)) ? -1 : parseInt(startMultiple);
                    profitRate = isNaN(parseInt(profitRate)) ? -1 : parseInt(profitRate);
                    singleAmount = isNaN(parseFloat(singleAmount)) ? -1 : parseFloat(singleAmount);
                    totalMoney = isNaN(parseFloat(totalMoney)) ? -1 : parseFloat(totalMoney);
                    prize = parseFloat(prize);
                    if (startMultiple < 0 || profitRate < 0 || singleAmount < 0 || totalMoney < 0 || prize <= 0) {
                        return 0;
                    }
                    var result = 0;
                    if (singleAmount > 0) {
                        if (profitRate > 0) {
                            result = (profitRate / 100 + 1) * totalMoney / (prize - singleAmount * (profitRate / 100 + 1));
                            result = Math.ceil(round(result, 3));
                        } else {
                            result = 1;
                        }
                        if (result > 0 && result < startMultiple) {
                            result = startMultiple;
                        }
                    }
                    return result;
                };
                var idx = -1;
                $.each(ps.canTraceIssues, function (k, v) {
                    if (v == $("#startIssue", parent.document).val()) {
                        idx = k;
                    }
                });
                if (idx == -1) {
                    alert("数据出错");
                    throw "数据出错";
                }
                if (isNaN(parseInt($("#traceNum", parent.document).val()))) {
                    $("#traceNum", parent.document).val("1");
                }
                var willTraceIssues = ps.canTraceIssues.slice(idx, idx + parseInt($("#traceNum", parent.document).val()));
                if (willTraceIssues.length < $("#traceNum", parent.document).val()) {
                    parent.layer.alert("最多只能追" + willTraceIssues.length + "期", { icon: 7 });
                    $("#traceNum", parent.document).val(willTraceIssues.length);
                }
                $("#style2Body", parent.document).empty();
                var traces = [],
                    str = "",
                    curMultiple,
                    curMoney,
                    totalMoney = 0;
                var singleMoney = parseInt($("#singleNum", parent.document).text()) * 2 * ps.curMode;
                var prize = ps.traceMethodPrize * (ps.rebateGapList[ps.curPrizeIndex].prize / (ps.maxCombPrize * ps.prizeRate)) * ps.curMode;
                $.each(willTraceIssues, function (k, v) {
                    if ($("input[name=profitStyle]:checked", parent.document).val() == 1) {
                        if (k == 0) {
                            curMultiple = parseInt($("#startMultiple", parent.document).val());
                            curMoney = curMultiple * parseInt($("#singleNum", parent.document).text()) * 2 * ps.curMode;
                            if ((curMultiple * prize - curMoney) / curMoney * 100 < $("input[name=totalProfitRate]", parent.document).val()) {
                                parent.layer.alert("该计划无法实现，请调整目标", { icon: 7 });
                                return false;
                            }
                        } else {
                            curMultiple = computeMultiple($("#startMultiple", parent.document).val(), $("input[name=totalProfitRate]", parent.document).val(), singleMoney, totalMoney, prize);
                        }
                    } else {
                        if ($("input[name=profitStyle]:checked", parent.document).val() == 2) {
                            if (k == 0) {
                                curMultiple = parseInt($("#startMultiple", parent.document).val());
                                curMoney = curMultiple * parseInt($("#singleNum", parent.document).text()) * 2 * ps.curMode;
                                if ((curMultiple * prize - curMoney) / curMoney * 100 < $("input[name=first5RateValue]", parent.document).val()) {
                                    parent.layer.alert("该计划无法实现，请调整目标", { icon: 7 });
                                    return false;
                                }
                            } else {
                                if (k < $("input[name=first5Rate]", parent.document).val()) {
                                    curMultiple = computeMultiple($("#startMultiple", parent.document).val(), $("input[name=first5RateValue]", parent.document).val(), singleMoney, totalMoney, prize);
                                } else {
                                    curMultiple = computeMultiple($("#startMultiple", parent.document).val(), $("input[name=laterRateValue]", parent.document).val(), singleMoney, totalMoney, prize);
                                }
                            }
                        } else {
                            if ($("input[name=profitStyle]:checked", parent.document).val() == 3) {
                                curMultiple = Math.ceil(round((parseInt($("input[name=totalProfit]", parent.document).val()) + totalMoney) / (prize - parseInt($("#singleNum", parent.document).text()) * 2 * ps.curMode), 3));
                                if (curMultiple < $("#startMultiple", parent.document).val()) {
                                    curMultiple = $("#startMultiple", parent.document).val();
                                }
                            } else {
                                if ($("input[name=profitStyle]:checked", parent.document).val() == 4) {
                                    if (k < $("input[name=first5Profit]", parent.document).val()) {
                                        curMultiple = Math.ceil(round((parseInt($("input[name=first5ProfitValue]", parent.document).val()) + totalMoney) / (prize - parseInt($("#singleNum", parent.document).text()) * 2 * ps.curMode), 3));
                                    } else {
                                        curMultiple = Math.ceil(round((parseInt($("input[name=laterProfitValue]", parent.document).val()) + totalMoney) / (prize - parseInt($("#singleNum", parent.document).text()) * 2 * ps.curMode), 3));
                                    }
                                }
                            }
                        }
                    }
                    if (curMultiple == 0) {
                        parent.layer.alert("您输入的参数有误，必须为正整数", { icon: 7 });
                        return false;
                    } else {
                        if (curMultiple < 0) {
                            parent.layer.alert("该计划不可能实现，请调整目标", { icon: 7 });
                            return false;
                        } else {
                            if (curMultiple * prize > ps.tracePrizeLimit) {
                                parent.layer.alert("该计划超出无法实现，请调整目标", { icon: 7 });
                                return false;
                            }
                        }
                    }
                    curMoney = curMultiple * parseInt($("#singleNum", parent.document).text()) * 2 * ps.curMode;
                    totalMoney += curMoney;
                    traces.push({
                        issue: v,
                        multiple: curMultiple,
                        curMoney: number_format(curMoney, 2),
                        totalMoney: number_format(totalMoney, 2),
                        curPrize: number_format(curMultiple * prize, 2),
                        totalProfit: number_format(curMultiple * prize - totalMoney, 2),
                        totalProfitRate: round((curMultiple * prize - totalMoney) / totalMoney, 2)
                    });
                });
                traceFunc._showPlan(traces);
            },
            _showPlan: function _showPlan(traces) {
                $.each(traces, function (k, v) {
                    var str = '<li><span class="spanWidth90px">' + v.issue + '</span><span class="spanWidth50px">' + v.multiple + '</span><span class="spanWidth70px">' + v.curMoney + '</span><span class="spanWidth70px">' + v.totalMoney + '</span><span class="spanWidth70px">' + v.curPrize + '</span><span class="spanWidth70px">' + v.totalProfit + '</span><span class="spanWidth70px">' + Math.round(v.totalProfitRate * 100) + "%</span></li>";
                    $("#style2Body", parent.document).append(str);
                });
                traceFunc.updateTotalMoney();
            }
        };

        //6.开奖区
        var initDrawBar = function initDrawBar() {
            $("#curLotteryName").text(ps.lotteryName);
            $("header p").text(ps.lotteryName);
            $("#todayIssuesHead").html('<li class="width:30%">期号</li><li class="width:70%">开奖号</li>');

            $("#todayDrawBtn").find(drawBar.todayDrawBtn_Click);
            $("#prizeRankBtn").click(drawBar.prizeRankBtn_Click);
            drawBar.todayBuyBtnNew_Click();

            $.each(ps.openedIssues, function (k, v) {
                v.prop = drawBar.getMoreInfo(v.code);
                ps.todayDrawList.push(v);
            });
            $("#prizeRankBtn").click();
            drawBar.getCurIssue(drawBar.init);
            //为东京1.5开奖号算法初始化移入移出效果
            $('#thisIssueNumUL').live({
                mouseenter: function mouseenter() {
                    if ($('#original_code').html() != '') {
                        $('#original_code').fadeIn(200);
                    }
                },
                mouseleave: function mouseleave() {
                    $('#original_code').hide().stop();
                }
            });
        };

        var drawBar = {
            init: function init() {
                runTime.remainTimer = window.setInterval(drawBar.showCurIssue_Timer, 1000);
                if (ps.lastIssueInfo.code == "") {
                    ps.getLastOpenTime = 0;
                    clearInterval(runTime.getLastOpenTimer);
                    runTime.getLastOpenTimer = window.setInterval(drawBar.getLastOpen_Timer, 1000);
                    $("#thisIssueInfo").addClass("lock");
                    ps.canBuy = false;
                    $("#thisIssueSpan").text(ps.lastIssueInfo.issue);
                } else {
                    //友好界面 1秒等待后显示
                    //更新最近一期数据，否则导致draw.init()中重复调用
                    var latest = ps.todayDrawList[0];

                    if (ps.lastIssueInfo.issue != latest.issue) {
                        var tmp = ps.lastIssueInfo;
                        var ob = drawBar.getMoreInfo(tmp.code);
                        tmp.prop = ob;
                        ps.todayDrawList.unshift(tmp);
                        $.post("?c=game&a=play", {
                            op: "getBuyRecords",
                            lotteryId: ps.lotteryId,
                            issue: ps.lastIssueInfo.issue
                        }, function (response) {
                            if (response.errno == 0) {
                                if (response.prj.length != 0) {
                                    var proj = response.prj[0];

                                    if (proj.prizeStatus == "已中奖") {
                                        parent.layer.open({
                                            title: "中奖通知",
                                            offset: '172px',
                                            content: '恭喜您中得<span style="color:red">' + ps.lotteryName + '</span>第<span style="color:red">' + proj.issue + '</span>期<span style="color:red">￥' + proj.prize + '</span>'
                                        });
                                    }
                                }
                            }
                        }, "json");
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

                $('#thisIssueNumUL').empty();
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
            //扑克 开奖区 显示code：以花色+数字的方式显示   code : 7s Ac Td
            pokerOpenCode: function pokerOpenCode(code) {
                var parts = code.split(' ');
                var trans = { 's': 'poker_heit', 'h': 'poker_hongt', 'c': 'poker_meih', 'd': 'poker_fangk' };
                var poker = '';
                var str = '<div class="poker_kj">';
                for (i = 0; i < 3; i++) {
                    poker = parts[i].split(''); //0=>number 1=>suit
                    str += '<span class="poker_kj_num ' + eval('trans.' + poker[1]) + '"><i></i><em>' + drawBar.translateT(poker[0]) + '</em></span>';
                }
                str += '</div>';

                return str;
            },
            getCurIssue: function getCurIssue(callback) {
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
                    success: function success(response) {
                        if (response.errno == 0) {
                            if (response.kTime != 0) {
                                $('#selectCodeBtn').attr("disabled", "disabled");
                                $('#selectCodeBtn').css("background", "#ccc");
                                $('.qiehuan_x').attr("disabled", "disabled");
                                $('.qiehuan_x').css("background", "#ccc");
                                var t = response.kTime / 1000;
                                $('.GameName').text('');
                                $('#thisIssueNumUL').html("<div style='font-size: 27px;text-align:center;float: left;margin-left: 77px;margin-top:12px;'>休市中...</div>");

                                $('.issue').text('距离下次开市:');
                                window.setInterval(function () {
                                    --t;
                                    var d = subTime(t);
                                    $("#thisIssueRemainTime").html("<span>" + d.hour + "</span><em>:</em><span>" + d.minute + "</span><em>:</em><span>" + d.second + "</span>");
                                }, 1000);

                                window.setTimeout(function () {
                                    clearInterval(runTime.waitOpenTimer);
                                    window.location.reload();
                                    /// drawBar.getCurIssue(drawBar.init1);
                                }, response.kTime);
                            } else {
                                ps.curIssueInfo = response.issueInfo;
                                ps.curServerTime = response.serverTime;
                                ps.curRemainTime = getTS(ps.curIssueInfo.end_time) - getTS(ps.curServerTime);
                                ps.curWaitOpenTime = 8; //显示锁形的时间，可酌情减少，不构成风险
                                ps.lastIssueInfo = response.lastIssueInfo;
                                if (response.lastIssueInfo && ps.counters > 0) {
                                    todayGetCurIssue(response.lastIssueInfo);
                                }
                                ps.counters++;
                                if (typeof callback == "function") {
                                    callback();
                                }
                            }
                        } else {
                            alert("系统繁忙，请稍候再试(02)");
                        }
                    },
                    error: function error(XMLHttpRequest, textStatus, errorThrown) {
                        if (errorThrown.indexOf("a=logout") != -1 || errorThrown.indexOf("a=login") != -1) {
                            top.layer.alert("您已经超时退出，请重新登录", { icon: 7 });
                            window.location.href = "?a=logout";
                        } else {
                            top.layer.alert("操作超时，请刷新页面..", { icon: 7 });
                        }
                    }
                });
            },
            showCurIssue_Timer: function showCurIssue_Timer() {
                $("#thisIssueSpan").text(ps.curIssueInfo.issue);
                $("#thisIssueSpan2").text(ps.curIssueInfo.issue);
                var d = subTime(--ps.curRemainTime);
                if (ps.curRemainTime >= 0) {
                    $("#thisIssueRemainTime").html("<span>" + d.day + "</span><em>:</em><span>" + d.hour + "</span><em>:</em><span>" + d.minute + "</span><em>:</em><span>" + d.second + "</span>");
                    $("#thisIssueTimerIcon").removeClass("lock").addClass('clock').text("可以投注");
                } else {
                    clearInterval(runTime.remainTimer);
                    $('#thisIssueTimerIcon').removeClass('clock').addClass('lock').text("已截止投注");
                    var d2 = subTime(ps.curWaitOpenTime);
                    layer.alert(ps.lastIssueInfo.issue + '期销售已截止，请进入下一期购买', { icon: 7 });
                    $('#thisIssueRemainTime').html("<span>" + d2.day + "</span><em>:</em><span>" + d2.hour + "</span><em>:</em><span>" + d2.minute + "</span><em>:</em><span>" + d2.second + "</span>");
                    //$("#thisIssueRemainTime").addClass("lotteryTime-lock");
                    //$("#thisIssueMoreInfo").html('<div class="remainOpenDIV">第 ' + ps.curIssueInfo.issue + ' 期开奖倒计时：<span class="lotteryTime2">' + ps.curWaitOpenTime + "</span></div>");
                    ps.canBuy = false;
                    runTime.waitOpenTimer = window.setInterval(drawBar.waitOpen_Timer, 1000);
                }
            },
            //显示锁倒计时
            waitOpen_Timer: function waitOpen_Timer() {
                --ps.curWaitOpenTime;

                var d = subTime(ps.curWaitOpenTime);
                $("#thisIssueRemainTime").html("<span>" + d.day + "</span><em>:</em><span>" + d.hour + "</span><em>:</em><span>" + d.minute + "</span><em>:</em><span>" + d.second + "</span>");
                if (ps.curWaitOpenTime < 0) {
                    clearInterval(runTime.waitOpenTimer);
                    drawBar.getCurIssue(drawBar.init);
                }
            },
            getLastOpen_Timer: function getLastOpen_Timer() {
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
                        success: function success(response) {
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
                                    if (typeof response.issueInfo.code != "undefined") {
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
                        error: function error(XMLHttpRequest, textStatus, errorThrown) {
                            if (errorThrown.indexOf("a=logout") != -1 || errorThrown.indexOf("a=login") != -1) {
                                top.layer.alert("您已经超时退出，请重新登录", { icon: 7 });
                                window.location.href = "?a=logout";
                            } else {
                                top.layer.alert("操作超时，请刷新页面...", { icon: 7 });
                            }
                        }
                    });
                }
            },
            //显示上一期开奖结果
            showLastDraw: function showLastDraw() {
                var latest = ps.todayDrawList[0];
                $("#lastIssueSpan").text(ps.lastIssueInfo.issue);
                var str;
                if (ps.lastIssueInfo.issue == latest.issue) {
                    var nums = latest.code.split(" ");
                    str = "<ul><li>第一位：<span>" + nums[0] + "</span></li><li>第二位：<span>" + nums[0] + "," + nums[1] + "</span></li></ul><ul><li>第三位：<span>" + nums[0] + "," + nums[1] + "," + nums[2] + "</span></li></ul>";

                    /**pendingBall
                     * 动画第二版
                     */
                    var index = 0,
                        index2 = 0;

                    if ($("#todayIssuesBody").find("li:first").text() != ps.curIssueInfo.issue) {
                        //如果开奖才更新，否则不操作
                        drawBar.todayBuyBtnNew_Click(); //此时开号了就更新今日投注
                    }
                    $(".sfnums").hide(); //隐藏特码文字

                    var openCodeCallback = function openCodeCallback() {
                        if ($("#thisIssueNumUL").children(".pendingBall").length > 0) {
                            var obj = $("#thisIssueNumUL").children(".pendingBall").first();
                            window.setTimeout(function () {
                                obj.removeClass("pendingBall sd115Ball").text(nums[index++]); //显示数字
                                obj.addClass("sd115_Ball bl" + nums[index2++]);
                                //显示特码文字
                                if ($(".lan").hasClass("sd115_Ball")) {
                                    $(".sfnums").show();
                                };

                                openCodeCallback();
                            }, 500);
                        }
                    };
                    window.setTimeout(openCodeCallback, 100); //需要间隔时间触发才转
                } else {
                    $("#thisIssueNumUL").children().addClass("pendingBall").removeClass("sd115_Ball");
                    str = "<ul><li>第一位：<span></span></li><li>第二位：<span></span></li><li>第三位：<span></span></li></ul>";
                }
                $("#thisIssueMoreInfo").html(str);
            },
            //今日开奖
            todayDrawBtn_Click: function todayDrawBtn_Click() {
                // $("#todayIssuesHead").empty().show();
                // $("#todayIssuesBody").empty().show();
                // $("#prizeScrollContent").hide();
                $("#todayIssuesHead").html('<li>期号</li><li>开奖号</li>');

                $("#todayIssuesBody").empty();
                $.each(ps.todayDrawList, function (k, v) {
                    var splitCode = "";
                    var splitCode2 = "";
                    for (var i = 0; i < v.code.length; i++) {
                        splitCode += "<b>" + v.code[i] + "</b>";
                        splitCode2 += v.code[i];
                    }

                    var arr = splitCode2.split(" ").join("</b><b>");
                    var str = '<ul class="fix1"><li style="width:30%">' + '第' + v.issue + '期' + '</li><li style="width:70%"><b>' + arr + "</b></li></ul>";

                    $("#todayIssuesBody").append(str);
                });
            },
            //中奖排行榜
            prizeRankBtn_Click: function prizeRankBtn_Click() {
                $("#todayBuyBody").empty().hide();
                $.post("?c=game&a=play", {
                    op: "getPrizeRank",
                    lotteryId: ps.lotteryId
                }, function (response) {
                    if (response.errno == 0) {
                        if (response.data.length == 0) {
                            $('<div class="todayNoBet">暂时没有记录！</div>').appendTo("#prizeScrollContent");
                        } else {
                            $("#prizeScrollContent").empty();
                            $.each(response.data, function (k, v) {
                                $('<ul><li><span>' + v.nick_name + "</span> 喜中 <em>" + number_format(v.total_prize, 2) + "</em>元</li></ul>").appendTo($("#prizeScrollContent"));
                            });
                            $("#prizeScrollContent").html($("#prizeScrollContent").html() + $("#prizeScrollContent").html()).show();
                            if (runTime.scollTopIntervalTimer == 0) {
                                runTime.scollTopIntervalTimer = window.setInterval(drawBar.scrollPrizeRank, 100);
                                $("#prizeScrollContent").mouseover(function () {
                                    clearInterval(runTime.scollTopIntervalTimer);
                                }).mouseout(function () {
                                    runTime.scollTopIntervalTimer = window.setInterval(drawBar.scrollPrizeRank, 100);
                                });
                            }
                        }
                    } else {
                        alert("暂时没有排行数据！");
                    }
                }, "json");
            },
            todayBuyBtnNew_Click: function todayBuyBtnNew_Click() {
                if ($("#todayIssuesBody").find("li:first").text() != ps.curIssueInfo.issue) {
                    $.post("?c=game&a=play", {
                        op: "getBuyRecords",
                        lotteryId: ps.lotteryId
                    }, function (response) {
                        if (response.errno == 0) {
                            $("#todayBuyBody").empty();
                            $('<ul><li class="C1">玩法</li><li class="C2">期号</li><li class="C4">金额</li><li class="C5">状态</li></ul><div class="clear"></div>').appendTo("#todayBuyBody");
                            if (response.prj.length == 0) {
                                $('<div class="todayNoBet">暂时没有记录！</div>').appendTo("#todayBuyBody");
                            } else {
                                $.each(response.prj, function (k, v) {
                                    $('<ul class="fix"><li class="C1"><a href="javascript:void(0);" onclick="showPackageDetail(\'' + v.wrapId + '\');return false;">' + v.methodName + '</a></li><li class="C2">' + helper.getNumByIssue(v.issue) + '</li><li class="C4">' + v.amount + '</li><li class="C5">' + v.prizeStatus + "</li></ul>").click(function () {
                                        //为适应客户端statusText，这里不再用jq定义
                                        //window.open("?c=game&a=packageDetail&wrap_id=" + v.wrapId, "_blank")
                                    }).appendTo("#todayBuyBody");
                                });
                            }
                        } else {
                            alert("系统繁忙，请稍候再试(04)");
                        }
                    }, "json");
                }
            },

            scrollPrizeRank: function scrollPrizeRank() {
                var obj = $("#prizeScrollContent")[0];
                obj.scrollTop += 1;
                if (obj.scrollTop >= $("#prizeScrollContent")[0].scrollHeight / 2) {
                    obj.scrollTop = 0;
                }
            },
            getMoreInfo: function getMoreInfo(code) {
                //得到扩展信息
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
            translateT: function translateT(num) {
                if (num == 'T') {
                    return '10';
                }
                return num;
            },
            translateCards: function translateCards($nums) {
                var $result = [],
                    $tmp;
                for (var i = 0; i < $nums.length; i++) {
                    $tmp = { num: "", className: "" };
                    switch ($nums[i].charAt(0)) {
                        case 'T':
                            $tmp.num = '10';
                            break;
                        default:
                            $tmp.num = $nums[i].charAt(0);
                            break;
                    }

                    switch ($nums[i].charAt(1)) {
                        case 's':
                            $tmp.className = 'poker_heit';
                            break;
                        case 'h':
                            $tmp.className = 'poker_hongt';
                            break;
                        case 'c':
                            $tmp.className = 'poker_meih';
                            break;
                        case 'd':
                            $tmp.className = 'poker_fangk';
                            break;
                        default:
                            throw new exception('unknown color');
                            break;
                    }
                    $result.push($tmp);
                }

                return $result;
            },

            zutai: function zutai(a, b, c) {
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
            dxds: function dxds(n1, n2) {
                var a = [],
                    b = [];
                a.push(n1 >= 5 ? "大" : "小");
                a.push(n1 % 2 == 1 ? "单" : "双");
                b.push(n2 >= 5 ? "大" : "小");
                b.push(n2 % 2 == 1 ? "单" : "双");
                return [a[0] + b[0], a[0] + b[1], a[1] + b[0], a[1] + b[1]].join(",");
            },
            //扑克组态
            pokerZutai: function pokerZutai(a, b, c) {
                var num = [helper.pokerNumMaps[a.charAt(0)], helper.pokerNumMaps[b.charAt(0)], helper.pokerNumMaps[c.charAt(0)]];
                num.sort();
                if (a.charAt(0) == b.charAt(0) && a.charAt(0) == c.charAt(0) && b.charAt(0) == c.charAt(0)) {
                    return "豹子";
                } else if (num[0] + 1 == num[1] && num[1] + 1 == num[2] || num[0] == 1 && num[1] == 12 && num[2] == 13) {
                    if (a.charAt(1) == b.charAt(1) && a.charAt(1) == c.charAt(1) && b.charAt(1) == c.charAt(1)) {
                        return "同花顺";
                    } else {
                        return "顺子";
                    }
                } else if (a.charAt(1) == b.charAt(1) && a.charAt(1) == c.charAt(1) && b.charAt(1) == c.charAt(1)) {
                    return "同花";
                } else if (a.charAt(0) == b.charAt(0) || b.charAt(0) == c.charAt(0) || a.charAt(0) == c.charAt(0)) {
                    return "对子";
                } else {
                    return "散牌";
                }
            }
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
            parent.layer.alert("数据初始化失败", { icon: 2 });
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
            var flag = 1,
                charsNum = 0;
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

        var isLegalCode = function isLegalCode(codes) {

            //这一段加上否则直选和值类玩法不选号也能添加
            if (allHasValue(codes)['charsNum'] == 0) {
                return {
                    singleNum: 0,
                    isDup: 0
                };
            }

            var singleNum = 0,
                isDup = 0,
                parts;
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
                case 'SXZX': //三星直选 12,34,567
                case "ZSZX":
                case 'QSZX':
                    //前三直选
                    singleNum = codes[0].length * codes[1].length * codes[2].length;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'SXZS': //三星组三
                case "ZSZS":
                case 'QSZS':
                    singleNum = codes[0].length * (codes[0].length - 1);
                    isDup = singleNum > 2 ? 1 : 0;
                    break;
                case 'SXZL': //三星组六  1234
                case "ZSZL":
                case 'QSZL':
                    singleNum = codes[0].length * (codes[0].length - 1) * (codes[0].length - 2) / helper.factorial(3);
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'SXLX': //三星连选 12345,123,58
                case "ZSLX":
                case 'QSLX':
                    //每区都必须有数字
                    if (allHasValue(codes)['flag'] == 0) {
                        return {
                            singleNum: 0,
                            isDup: 0
                        };
                    }

                    var $betNums3 = 0,
                        $betNums2 = 0,
                        $betNums1 = 0;
                    //算注数 后三注数+后二注数+后一注数
                    $betNums3 = codes[0].length * codes[1].length * codes[2].length;
                    $betNums2 = codes[1].length * codes[2].length;
                    $betNums1 = codes[2].length;
                    singleNum = $betNums3 + $betNums2 + $betNums1;
                    isDup = singleNum > 3 ? 1 : 0;
                    break;
                case 'SXBD': //三星包点 一注可以有多个号码 不同号码之间要用_分隔 因为有大于9的结果
                case "ZSBD":
                case 'QSBD':
                    parts = codes[0].split('_');
                    $.each(parts, function (k, v) {
                        singleNum += helper.SXBD[v];
                    });
                    isDup = parts.length > 1 ? 1 : 0;
                    break;
                case 'SXHHZX': //三星混合组选 仅支持单式手工录入 12,34,567
                case "ZSHHZX":
                case 'QSHHZX':
                    //前三混合组选 仅支持单式手工录入 12,34,567
                    singleNum = codes[0].length * codes[1].length * codes[2].length;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'EXZX': //二星直选 0123456789,0123456789
                case 'QEZX':
                    singleNum = codes[0].length * codes[1].length;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'EXZUX': //二星组选 0123456789
                case 'QEZUX':
                    singleNum = codes[0].length * (codes[0].length - 1) / 2;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'EXLX': //二星连选 0123456789,0123456789
                case 'QELX':
                    //每区都必须有数字
                    if (allHasValue(codes)['flag'] == 0) {
                        return {
                            singleNum: 0,
                            isDup: 0
                        };
                    }

                    //算注数 后二注数+后一注数
                    var $betNums2 = 0,
                        $betNums1 = 0;
                    $betNums2 = codes[0].length * codes[1].length;
                    $betNums1 = codes[1].length;
                    singleNum = $betNums2 + $betNums1;
                    isDup = singleNum > 2 ? 1 : 0;
                    break;
                case 'EXBD': //二星包点 一注可以有多个号码 不同号码之间要用_分隔 因为有大于9的结果
                case 'QEBD':
                    parts = codes[0].split('_');
                    $.each(parts, function (k, v) {
                        singleNum += helper.EXBD[v];
                    });
                    isDup = parts.length > 1 ? 1 : 0;
                    break;
                case 'YXZX':
                    //一星直选
                    singleNum = codes[0].length;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'WXDW':
                    //五星定位
                    var n = 4; //5!
                    for (var i = 0; i < 5; i++) {
                        if (codes[i] != '-') {
                            singleNum += codes[i].length;
                        }
                    }
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'SXDW':
                    //低频特有 三星定位
                    singleNum = codes[0].length + codes[1].length + codes[2].length;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'EMBDW': //三星二码不定位 一注仅限一组号码，如1,2，因为奖金本来就低，也为了判断方便
                case 'QSEMBDW': //新增前三二码
                case 'ZSEMBDW': //新增中三二码
                case 'SXEMBDW': //新增四星二码不定位
                case 'WXEMBDW':
                    //新增五星二码不定位
                    singleNum = codes[0].length * (codes[0].length - 1) / 2;
                    isDup = 0;
                    break;
                case 'WXSMBDW':
                    //新增五星三码不定位
                    singleNum = codes[0].length * (codes[0].length - 1) * (codes[0].length - 2) / 6;
                    isDup = 0;
                    break;
                case 'EXDXDS': //二星大小单双 一注仅限一个号码 因为奖金本来就低
                case 'QEDXDS':
                    //低频3D特有 前二大小单双 一注仅限一个号码 因为奖金本来就低
                    singleNum = codes[0].length * codes[1].length == 1 ? 1 : 0;
                    isDup = 0;
                    break;
                case 'SXDXDS':
                    //三星大小单双 一注仅限一个号码 因为奖金本来就低
                    singleNum = codes[0].length * codes[1].length * codes[2].length == 1 ? 1 : 0;
                    isDup = 0;
                    break;
                case 'YMBDW': //三星一码不定位 一注仅限一个号码，如1，因为奖金本来就低，也为了判断方便
                case 'ZSYMBDW': //新增中三一码不定位
                case 'SXYMBDW': //新增四星一码不定位
                case 'WXYMBDW': //新增五星一码不定位
                case 'QSYMBDW':
                    //低频P3P5特有 前三一码不定位
                    singleNum = codes[0].length;
                    isDup = 0;
                    break;
                case 'SXHZ': //三星和值 一注可以有多个号码 不同号码之间要用_分隔 因为有大于9的结果
                case "ZSHZ":
                case 'QSHZ':
                    parts = codes[0].split('_');
                    $.each(parts, function (k, v) {
                        singleNum += helper.SXHZ[v];
                    });
                    isDup = parts.length > 1 ? 1 : 0;
                    break;
                case 'EXHZ': //二星和值 一注可以有多个号码 不同号码之间要用_分隔 因为有大于9的结果
                case 'QEHZ':
                    parts = codes[0].split('_');
                    $.each(parts, function (k, v) {
                        singleNum += helper.EXHZ[v];
                    });
                    isDup = parts.length > 1 ? 1 : 0;
                    break;
                case 'SXZXHZ': //低频3D特有 组选和值
                case 'QSZXHZ':
                    //低频P3P5特有 组选和值
                    parts = codes[0].split('_');
                    $.each(parts, function (k, v) {
                        singleNum += helper.SXZXHZ[v];
                    });
                    isDup = parts.length > 1 ? 1 : 0;
                    break;
                case 'SIXZX': //四星直选 12,34,567
                case 'QSIZX':
                    //前四直选
                    singleNum = codes[0].length * codes[1].length * codes[2].length * codes[3].length;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'WXZX':
                    //五星直选
                    //算注数 相乘即可
                    singleNum = codes[0].length * codes[1].length * codes[2].length * codes[3].length * codes[4].length;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'WXLX':
                    //五星连选
                    //每区都必须有数字
                    if (allHasValue(codes)['flag'] == 0) {
                        return {
                            singleNum: 0,
                            isDup: 0
                        };
                    }

                    var $betNums5 = 0,
                        $betNums3 = 0,
                        $betNums2 = 0,
                        $betNums1 = 0;
                    //算注数 后三注数+后二注数+后一注数
                    $betNums5 = codes[0].length * codes[1].length * codes[2].length * codes[3].length * codes[4].length;
                    $betNums3 = codes[2].length * codes[3].length * codes[4].length;
                    $betNums2 = codes[3].length * codes[4].length;
                    $betNums1 = codes[4].length;
                    singleNum = $betNums5 + $betNums3 + $betNums2 + $betNums1;
                    isDup = singleNum > 4 ? 1 : 0;
                    break;

                //========== sd11y ===========//
                case 'REZX':
                    //任二直选
                    var n = 4; //5!
                    for (var i = 0; i < 4; i++) {
                        //如果注码不写'-'的话可以省略两个if判断,效率差不多
                        if (codes[i] != '-') {
                            for (var j = i + 1; j < 5; j++) {
                                if (codes[j] != '-') {
                                    singleNum += codes[i].length * codes[j].length;
                                }
                            }
                        }
                    }
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'RSZX':
                    //任三直选  ["678", "67", "7", "7", "7"]
                    for (var i = 0; i < 3; i++) {
                        if (codes[i] != '-') {
                            for (var j = i + 1; j < 4; j++) {
                                if (codes[j] != '-') {
                                    for (var k = j + 1; k < 5; k++) {
                                        if (codes[k] != '-') {
                                            singleNum += codes[i].length * codes[j].length * codes[k].length;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'RSIZX':
                    //任四直选["678", "67", "7", "7", "7"]
                    for (var g = 0; g < 2; g++) {
                        if (codes[g] != '-') {
                            for (var i = g + 1; i < 3; i++) {
                                if (codes[i] != '-') {
                                    for (var j = i + 1; j < 4; j++) {
                                        if (codes[j] != '-') {
                                            for (var k = j + 1; k < 5; k++) {
                                                if (codes[k] != '-') {
                                                    singleNum += codes[g].length * codes[i].length * codes[j].length * codes[k].length;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'SDQSZX':
                    //前三直选 01_02_03_04,02_03,01_05
                    if (codes.length != 3) {
                        return {
                            singleNum: 0,
                            isDup: 0
                        };
                    }
                    var result = helper.expandLotto(codes);
                    singleNum = result.length;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'SDQEZX':
                    //前二直选 二段 01_02_03_04,02_03
                    if (codes.length != 2) {
                        return {
                            singleNum: 0,
                            isDup: 0
                        };
                    }
                    var result = helper.expandLotto(codes);

                    singleNum = result.length;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'SDQSZUX':
                    //前三组选 一段 01_02_03_04
                    parts = codes[0].split('_');
                    singleNum = parts.length * (parts.length - 1) * (parts.length - 2) / helper.factorial(3);
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'SDQEZUX':
                    //前二组选 一段 01_02_03_04_05_06_07_08_09_10_11
                    parts = codes[0].split('_');
                    singleNum = parts.length * (parts.length - 1) / 2;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'SDRX1':
                    //任选1 一段 01_02_03_04_05_06_07_08_09_10_11
                    parts = codes[0].split('_');
                    singleNum = parts.length;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'SDRX2':
                    //任选2 一段 01_02_03_04_05_06_07_08_09_10_11
                    parts = codes[0].split('_');
                    singleNum = parts.length * (parts.length - 1) / 2;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'SDRX3':
                    //任选3 一段 01_02_03_04_05_06_07_08_09_10_11
                    parts = codes[0].split('_');
                    singleNum = parts.length * (parts.length - 1) * (parts.length - 2) / 6;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'SDRX4':
                    //任选4 一段 01_02_03_04_05_06_07_08_09_10_11
                    parts = codes[0].split('_');
                    singleNum = parts.length * (parts.length - 1) * (parts.length - 2) * (parts.length - 3) / 24;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'SDRX5':
                    //任选5 一段 01_02_03_04_05_06_07_08_09_10_11
                    parts = codes[0].split('_');
                    singleNum = parts.length * (parts.length - 1) * (parts.length - 2) * (parts.length - 3) * (parts.length - 4) / 120;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'SDRX6':
                    //任选6 一段 01_02_03_04_05_06_07_08_09_10_11
                    parts = codes[0].split('_');
                    singleNum = parts.length * (parts.length - 1) * (parts.length - 2) * (parts.length - 3) * (parts.length - 4) * (parts.length - 5) / 720;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'SDRX7':
                    //任选7 一段 01_02_03_04_05_06_07_08_09_10_11
                    parts = codes[0].split('_');
                    singleNum = parts.length * (parts.length - 1) * (parts.length - 2) * (parts.length - 3) * (parts.length - 4) * (parts.length - 5) * (parts.length - 6) / 5040;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'SDRX8':
                    //任选8 一段 01_02_03_04_05_06_07_08_09_10_11
                    parts = codes[0].split('_');
                    singleNum = parts.length * (parts.length - 1) * (parts.length - 2) * (parts.length - 3) * (parts.length - 4) * (parts.length - 5) * (parts.length - 6) * (parts.length - 7) / 40320;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'SDQSBDW':
                    //前3不定位胆 一段 01_02_03_04_05_06_07_08_09_10_11
                    parts = codes[0].split('_');
                    singleNum = parts.length;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'SDQSDWD':
                    //前3定位胆 01_02_03,04_05,06_07为一单 也可以只买一位，如'01_02_03,,'表示只买个位胆，没买的位留空
                    $.each(codes, function (k, v) {
                        if (v != '') {
                            //号码不得重复
                            parts = v.split('_');
                            singleNum += parts.length; //注意是数组长度，所以前面必须判断v != ''
                        }
                    });
                    isDup = singleNum > 3 ? 1 : 0;
                    break;
                case 'SDDDS': //0单5双:750.0000元 (1注) 5单0双:125.0000元 (6注)1单4双:25.0000元 (30注)4单1双:10.0000元 (75注)2单3双:5.0000元 (150注)3单2双:3.7000元 (200注)
                case 'SDCZW':
                    // 一次只能选一注
                    singleNum = 1;
                    isDup = 1;
                    break;

                case 'YFFS': //趣味玩法,一帆风顺
                case 'HSCS': //趣味玩法,好事成双
                case 'SXBX': //趣味玩法,三星报喜
                case 'SJFC':
                    //趣味玩法,四季发财
                    singleNum = codes[0].length; //传来的数据模式 13567
                    isDup = singleNum > 1 ? 1 : 0;
                    break;

                case 'ZUX120':
                    //组选120
                    if (codes[0].length > 4) {
                        singleNum = codes[0].length === 5 ? 1 : helper.factorial(codes[0].length) / (helper.factorial(codes[0].length - 5) * 120);
                    }
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'ZUX24':
                    //组选24
                    if (codes[0].length > 3) {
                        singleNum = helper.factorial(codes[0].length) / (helper.factorial(codes[0].length - 4) * 24);
                    }
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'ZUX6':
                    //组选6
                    if (codes[0].length > 1) {
                        singleNum = helper.factorial(codes[0].length) / (helper.factorial(codes[0].length - 2) * 2);
                    }
                    isDup = singleNum > 1 ? 1 : 0;
                    break;

                case 'ZUX10': //组选10
                case 'ZUX5': //组选5
                case 'ZUX4':
                    //组选4
                    if (codes[0].length > 0 && codes[1].length > 0) {
                        var compareNum = codes[1].length;
                        for (i = 0; i < codes[0].length; i++) {
                            var tmp = compareNum;
                            if (codes[1].indexOf(codes[0].substr(i, 1)) > -1) {
                                tmp = compareNum - 1;
                            }
                            if (tmp > 0) {
                                singleNum += helper.factorial(tmp) / helper.factorial(tmp - 1);
                            }
                        }
                    }
                    isDup = singleNum > 1 ? 1 : 0;
                    break;

                case 'ZUX20': //组选20
                case 'ZUX12':
                    //组选12
                    if (codes[0].length > 0 && codes[1].length > 1) {
                        var compareNum = codes[1].length;
                        for (i = 0; i < codes[0].length; i++) {
                            var tmp = compareNum;
                            if (codes[1].indexOf(codes[0].substr(i, 1)) > -1) {
                                tmp = compareNum - 1;
                            }
                            if (tmp > 1) {
                                singleNum += helper.factorial(tmp) / (helper.factorial(tmp - 2) * 2);
                            }
                        }
                    }
                    isDup = singleNum > 1 ? 1 : 0;
                    break;

                case 'ZUX60':
                    //组选60
                    if (codes[0].length > 0 && codes[1].length > 2) {
                        var compareNum = codes[1].length;
                        for (i = 0; i < codes[0].length; i++) {
                            var tmp = compareNum;
                            if (codes[1].indexOf(codes[0].substr(i, 1)) > -1) {
                                tmp = compareNum - 1;
                            }
                            if (tmp > 2) {
                                singleNum += helper.factorial(tmp) / (helper.factorial(tmp - 3) * 6);
                            }
                        }
                    }
                    isDup = singleNum > 1 ? 1 : 0;
                    break;

                case 'ZUX30':
                    //组选30
                    if (codes[0].length > 1 && codes[1].length > 0) {
                        var compareNum = codes[0].length;
                        for (i = 0; i < codes[1].length; i++) {
                            var tmp = compareNum;
                            if (codes[0].indexOf(codes[1].substr(i, 1)) > -1) {
                                tmp = compareNum - 1;
                            }
                            if (tmp > 1) {
                                singleNum += helper.factorial(tmp) / (helper.factorial(tmp - 2) * 2);
                            }
                        }
                    }
                    isDup = singleNum > 1 ? 1 : 0;
                    break;

                //江苏快三
                case 'JSETDX':
                    //二同单选 2个号区 11_22,34
                    if (codes.length != 2) {
                        return {
                            singleNum: 0,
                            isDup: 0
                        };
                    }
                    var parts0 = codes[0].length ? codes[0].split('_') : [];
                    var parts1 = codes[1].length ? codes[1].split('') : [];
                    singleNum = parts0.length * parts1.length;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'JSETFX':
                    //二同复选 1个号区 11_22_33
                    parts = codes[0].split('_');
                    singleNum = parts.length;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;

                case 'JSHZ':
                    //快三和值
                    parts = codes[0].split('_');
                    singleNum = parts.length;
                    isDup = parts.length > 1 ? 1 : 0;
                    break;
                case 'JSSTTX':
                    //快三   江苏三同号通选
                    //parts = codes[0].split('_');  //111_222_333_444_555_666
                    singleNum = 1;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'JSSLTX':
                    //快三三连号通选
                    singleNum = 1;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'JSEBT':
                    //二不同号
                    var codesLen = codes[0].length;
                    singleNum = (codesLen - 1) * codesLen / 2;
                    isDup = codesLen > 2 ? 1 : 0;
                    break;
                case 'JSSTDX':
                    //三同号单选
                    parts = codes[0].split('_');
                    singleNum = parts.length;
                    isDup = parts.length > 1 ? 1 : 0;
                    break;
                case 'JSSBT':
                    //三不同号
                    var codesLen = codes[0].length;
                    singleNum = (codesLen - 1) * (codesLen - 2) * codesLen / 6;
                    isDup = codesLen > 3 ? 1 : 0;
                    break;

                //快乐扑克
                case 'PKSZ':
                    //顺子
                    parts = codes[0].split('_');
                    singleNum = parts.length;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'PKBZ':
                    //豹子
                    parts = codes[0].split('_');
                    singleNum = parts.length;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'PKDZ':
                    //对子
                    parts = codes[0].split('_');
                    singleNum = parts.length;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'PKTH':
                    //同花
                    parts = codes[0].split('_');
                    singleNum = parts.length;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'PKTHS':
                    //同花顺
                    parts = codes[0].split('_');
                    singleNum = parts.length;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'PKBX':
                    //包选
                    parts = codes[0].split('_');
                    singleNum = parts.length;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'PKRX1':
                    //任选1
                    parts = codes[0].split('_');
                    singleNum = parts.length;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'PKRX2':
                    //任选2
                    parts = codes[0].split('_');
                    singleNum = parts.length * (parts.length - 1) / 2;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'PKRX3':
                    //任选3
                    parts = codes[0].split('_');
                    singleNum = parts.length * (parts.length - 1) * (parts.length - 2) / 6;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'PKRX4':
                    //任选4
                    parts = codes[0].split('_');
                    singleNum = parts.length;
                    var codeNum = parts.length;
                    singleNum = codeNum * (codeNum - 1) * (codeNum - 2) * (codeNum - 3) / 24;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'PKRX5':
                    //任选5
                    parts = codes[0].split('_');
                    var codeNum = parts.length;
                    singleNum = codeNum * (codeNum - 1) * (codeNum - 2) * (codeNum - 3) * (codeNum - 4) / 120;
                    isDup = singleNum > 1 ? 1 : 0;
                    break;
                case 'PKRX6':
                    //任选6
                    parts = codes[0].split('_');
                    var codeNum = parts.length;
                    singleNum = codeNum * (codeNum - 1) * (codeNum - 2) * (codeNum - 3) * (codeNum - 4) * (codeNum - 5) / 720;
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
    };
})(jQuery);