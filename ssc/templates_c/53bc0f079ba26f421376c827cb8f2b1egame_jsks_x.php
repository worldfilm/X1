<!DOCTYPE HTML>
<html>
    <head>
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta content="webkit" name="renderer">
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <title><?php echo config::getConfig('site_title'); ?></title>
        <link rel="stylesheet" type="text/css" href="<?php echo $imgCdnUrl ?>/css/global_reset.css" />
        <link rel="stylesheet" type="text/css" href="<?php echo $imgCdnUrl ?>/css/all_LightBlue_x.css?v=<?php echo $html_version ?>" />
        <link rel="stylesheet" type="text/css" href="<?php echo $imgCdnUrl ?>/css/game_k3_x.css?v=<?php echo $html_version ?>" />
        <?php $this->import('public_cssjs') ?>
    	<!-- <style type="text/css">
			#quickSelect{float: right;margin-right: 29px;display: inline-block; margin-left: 10px;width: 140px;height: 40px;line-height: 40px;background:#e4393c;color: #fff;text-align: center;border-radius: 3px;font-size: 17px;}
	        #confirmBtn{display: inline-block;margin-left: 10px;width: 140px;color: #fff;border-radius: 3px;font-size: 17px;height: 40px;line-height: 40px;background: #e4393c url(../images/light_blue/confirmBtn.png) no-repeat 11px 6px; padding-left: 47px;}
	        .locate .lotteryNumber span.x_spanball_selected {background-color: #cb3a3a;background: linear-gradient(#f56868,#cb3a3a);color: #fff !important;border: 1px solid #da4a4a;}
    	    .ball_Selected{border-top-left-radius:0px;}
    	    .locate .lotteryNumber span.x_spanball_selected {background:yellow}
    	</style> -->
    </head>
    <style>.playTimer .Timer span{color:#de4136!important;}</style>
    <body style="background:none;">
    <?php $this->import('public_header') ?>
     <div class="tz_nr">
        <div class="NumberBox_k3 NumberBox5 fix">
            <div class="subTopBar">
                <!-- <div class="SubTit">
                    <h3 class="results" id="curLotteryName"></h3>
                </div> -->
                <!-- 投注玩法 -->
                <div class="playNav">
                    <ul class="lotteryTab" id="methodGroupContainer"></ul>
                </div>
                <div class="crumbs"></div>
            </div>
            <div class="LottLeft">
                <img class="k3icon" src="../images/lottery_logo_<?php echo $lottery['lottery_id'] ?>.png" />
                <div class="Lottstr">
                    <div class="PlayGame_way"><p class="curMethod" id="curMethod"></p></div>
                    <i class="question ShowTips methodTipInfo" id="methodTipInfo" title="">
                        <span>玩法介绍</span><!--<label>?</label>-->
                        <div class="methodDesc" id="methodDesc"></div>
                    </i>
                </div>
                <hr>
                <p class="thisIssue">
                    <span class="issue thisIssueDIV">第<span id="thisIssueSpan"></span>期</span>
                    <span><label id="curLotteryName2"></label><em class="clock" id="thisIssueTimerIcon"></em></span>
                </p>
                <hr>
                <div class="playTimer thisIssueInfo" id="thisIssueInfo">
                    <span class="Timer fix"><div class="thisIssueRemainTime" id="thisIssueRemainTime"><span>00</span><em>:</em><span>00</span><em>:</em><span>00</span></div></span>
                </div>
                <hr>
                <div class="openChart">
                    <a class="chart" target="_blank" href="?c=game&a=chart&lottery_id=<?php echo $lottery['lottery_id']; ?>">开奖走势图</a>
                </div>
            </div>
            <div class="Lottmain">
                <div class="GameName">
                    <label>第<em id="lastIssueSpan" class="lastIssueSpan"></em>期</label>
                    <div class="GameResult_tit">开奖号码：<span id='openCode'></span></div>
                </div>
                <div class="lotteryNum GameNuberFont" id="thisIssueNumUL" style="padding:0;"><div class="NumdiceMove"></div></div>
                <div class="GameNumberResult_k3" id="thisIssueMoreInfo"></div>
            </div>
        </div>
        <!-- 中间选择游戏部分 -->
        <div class="GameBoxall SubGamePlatePadding">
            <div class="Gamepart">
                <!-- 投注主体部分 -->
                <div class="PlayCenter">
                    <div class="playControlBox">
                        
                        <div class="clear"></div>
                        <!-- 投注选号 -->
                        <div class="choMainTab">
                            <div class="chooseNO selectArea" id="selectArea"></div>
                            <datalist id="itemlist">
                                <option>100</option>
                                <option>200</option>
                                <option>500</option>
                                <option>1000</option>
                            </datalist>
                            <div class="MachineSele" style="display: none;">
                                <?php if (in_array($lottery['lottery_id'], array(1, 3, 4, 8, 11))): ?>
                                <div class="MachineSeleBtn">
                                    <input type="button" value="机选10注" num="10" class="Mach10 custBtnStyle selectRandomBtn">
                                    <input type="button" value="机选50注" num="50" class="Mach50 custBtnStyle selectRandomBtn">
                                </div>
                                <?php endif;?>
                            </div>
                            <div class="bonusSlide fix">
                                <span>赔率</span>
                                <div id="selectRebate" class="selectRebate"></div>
                                <span id="rebateValue" class="rebateValue"></span>
                                <select id="curPrizeSpan" style="display:none;"></select>
                                <i class="manuaTip" id="manuaTip"></i>
                            </div>
                            <a hidden="" href="javascript:void(0)" class="quickSelect" id="quickSelect" title="快捷投注" data-val="0">一般投注</a>
                            
                        </div>
                        <div class="chooseOKBtn gameMoney fix" >
                            
                            
                            <div class="fl choPirze" id="choPirze">
                                <ul class="prizeList">
                                    <li class="pirze1" data-value="10">10</li>
                                    <li class="pirze2" data-value="50">50</li>
                                    <li class="pirze3" data-value="100">100</li>
                                    <li class="pirze4" data-value="500">500</li>
                                    <li class="pirze5" data-value="1000">1000</li>
                                    <li class="pirze6" data-value="5000">5000</li>
                                </ul>
                            </div>
                            <div class="gameLeftLI" id="singleInfo" style="padding-top: 0px;">
                                                                                        已选： <em class="betCount" id="betCount">0</em>注 ;
                                <input type="hidden" id="modesDIV" value="0.5">
                                                                                        金额： ￥<input id="multiple"  name="multiple" class="moneyNum f_left" maxlength="5">
                            </div>
                        </div>
                        <div class="gameTZbtn">

                            <input type="button" value="确认投注" class="CantapCodeBtn confirm" id="confirmBtn">
                            <a href="javascript:void(0)" class="clearProjectBtn" id="clearProjectBtn" title="删除投注内容">清空</a>
                        </div>
                        
                    </div>
                    <div class="GameNumber">
                        <div class="TodayReward">
                            <div class="nav">
                                <ul class="navul fix">
                                    <li><a href="javascript:void(0)" class="todayDrawBtn" id="todayBuyBtn">今日投注</a></li>
                                    <li><a href="javascript:void(0)" class="todayDrawBtn" id="todayDrawBtn">今日开奖</a></li>
                                </ul>
                            </div>
                            <div class="lotteryTodayMain">
                                <div class="lotteryTodayBg"></div>
                                <!--  今日投注 -->
                                <div class="lotteryTodayContent" id="todayBuyBody"></div>
                                <!--  今日开奖 -->
                                <div class="rightBoxSrt" id="rightBoxSrt">
                                    <div class="lotteryTodayBox">
                                        <div class="lotteryTodayContent bet" id="todayIssuesBody"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="curImg"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 追号部分 -->
        <div id="traceHtml">
            <div class="beitouToolsBox">
            <ul class="beitouToolsTop">
                <li class="beitouToolsTopContent fix">
                    <ul>
                        <li class="beitouToolsTopCont1">单倍注数<span id="singleNum"></span>注,购买<span id="issuesNum2"></span>期,合计￥<span id="traceTotalAmount"></span></li>
                        <li class="beitouToolsButton"><span class="btnOne" id="confirmTraceBtn">确认追号</span><span class="btnTwo" id="cancelTraceBtn">取消追号</span></li>
                    </ul>
                </li>
                <li class="beitouToolsTopR"></li>
            </ul>
            <ul class="beitouToolsQs">
                <li>期数倍数
                    <span>
                    <input type="radio" name="multipleStyle" id="multipleStyle1" value="1" class="radio1" />
                    <label for="multipleStyle1">自定义</label>
                    </span>
                    <span>
                   
                    </span>
                    <span>
                        当前期倒计时：<label id="remainTimerLabel"></label>
                    </span>
                </li>
            </ul>
            <ul class="beitouToolsQishi">
                <li class="beitouToolsQishiL"><span>起始</span> <span>
                    <select id="startIssue">

                    </select>
                    </span> </li>
                <li class="beitouToolsQishiR">
                    <div class="multipleNum fl">
                        倍数
                        <div class="inputNum">
                            <input type="text" id="style1BodyMultiple" class="zhuiz_number_e2" value="1" size="5"  maxlength="5" />
                            <div class="multipleNumDropdown hand">
                                <i class="downTriangle"></i>
                            </div>
                            <ul class="multipleNumValue hand"><li>1</li><li>5</li><li>10</li><li>20</li></ul>
                        </div>
                    </div>
                    <div  class="multipleNum fr">追
                        <div class="inputNum">
                            <input type="text" id="traceNum" class="zhuiz_number_e2" value="1" size="5"  maxlength="5" />
                                    <div class="multipleNumDropdown hand">
                                <i class="downTriangle"></i>
                            </div>
                            <ul class="multipleNumValue hand"><li>1</li><li>5</li><li>10</li><li>20</li></ul>
                        </div>
                        期(包含当前期最多追<span id="maxTraceCount">0</span>期)
                    </div>
                    <div class="clear"></div>
                </li>
            </ul>
            <div class="beitouToolsmainBox">
                <div style="display:block;" id="multipleStyle1DIV">
                    <ul class="beitouToolsmainBoxTop" id="style1Head">
                        <li class="checkbox"><input type="checkbox" id="checkAll" checked /></li>
                        <li>期号</li>
                        <li>倍数</li>
                        <li>当前投入</li>
                        <li>累计投入</li>
                    </ul>
                    <ul class="beitouToolsmainBoxCont" id="style1Body">
                       
                    </ul>
                </div>
                <div class="beitouToolSmainbt" id="multipleStyle2DIV" style="display:none;">
                    <p>起始倍数
                        <input type="text" value="1" class="beitouToolsinput" name="startMultiple" id="startMultiple" maxlength="5" size="5"/>
                    </p>
                    <ul class="beitouToolSmainbtzk" id="beitouToolSmainbtzk">
                        <li>
                            <input type="radio" name="profitStyle"  value="1" />
                            全程利润率:
                            <input type="text" size="5" value="10" name="totalProfitRate" class="beitouToolsinput" class="beitouToolsinput" />
                            % </li>
                        <li>
                            <input type="radio" name="profitStyle"  value="2"/>
                            前
                            <input type="text" size="5" value="5" name="first5Rate" class="beitouToolsinput"/>
                            期利润率
                            <input type="text" size="5"  class="beitouToolsinput" value="10" name="first5RateValue"/>
                            %,之后利润率
                            <input type="text" size="5" value="5" class="beitouToolsinput" name="laterRateValue"/>
                            % </li>
                        <li>
                            <input type="radio" name="profitStyle"  value="3"/>
                            全程累计利润:
                            <input type="text" size="5" value="100" name="totalProfit" class="beitouToolsinput" />
                            元 </li>
                        <li>
                            <input type="radio" name="profitStyle" value="4"/>
                            前
                            <input type="text" size="5" value="5" class="beitouToolsinput" name="first5Profit" />
                            期累计利润
                            <input type="text" size="5"  class="beitouToolsinput" value="100" name="first5ProfitValue" />
                            元,之后累计利润
                            <input type="text" size="5" value="50" class="beitouToolsinput"  name="laterProfitValue" />
                            元 </li>
                    </ul>
                    <span class="beitouTooltzjhb">
                    <input type="button"  class="bt_tools_navys" id="generalPlanBtn" value="生成投资计划表"/>
                    </span>
                    <ul class="beitouToolSmainbtContTop" id="style2Head">
                        <li class="spanWidth90px">期号</li>
                        <li class="spanWidth50px">倍数</li>
                        <li class="spanWidth70px">当前投入</li>
                        <li class="spanWidth70px">累积投入</li>
                        <li class="spanWidth70px">当期奖金</li>
                        <li class="spanWidth70px">合计利润</li>
                        <li class="spanWidth70px">利润率</li>
                    </ul>
                    <ul class="beitouToolSmainBTContZneir" id="style2Body">
                    </ul>
                </div>
                <div class="beitouToolsfotter">
                    <p>
                        <input  type="checkbox" value="1" name="stopOnWin" checked="checked" />
                        <span style="font-weight:bold;">中奖后停止</span>&nbsp;&nbsp;投注多期时，当某期中奖后，自动放弃后面几期投注操作。</p>
                </div>
            </div>
        </div>
        </div>
        </div>
<?php $this->import('public_foot') ?>
    <script type="text/javascript" src="<?php echo $imgCdnUrl ?>/js/jquery.plugin.js"></script><!--jquery小插件-->
    <script type="text/javascript" src="<?php echo $imgCdnUrl ?>/js/layer-v2.4/layer.js"></script> <!-- 调用弹出层 -->
    
    <script type="text/javascript" src="<?php echo $imgCdnUrl ?>/js/jqueryui.js"></script>
    <script type="text/javascript" src="<?php echo $imgCdnUrl ?>/js/jquery.slider.js?v=<?php echo $html_version; ?>"></script>
    <script type="text/javascript" src="<?php echo $imgCdnUrl ?>/js/game/min/game_jsks_x.min.js?v=<?php echo $html_version; ?>"></script>
    <script type="text/javascript" src="<?php echo $imgCdnUrl ?>/js/qiehuangame.js?v=<?php echo $html_version ?>"></script>
    <script type="text/javascript" src="<?php echo $imgCdnUrl ?>/js/ext.js"></script>
    <script type="text/javascript">
        $(function() {
            var methods = <?php echo $methods ?>;
            $.init({
                lotteryId: <?php echo $lottery['lottery_id']; ?>, lotteryName: '<?php echo $lottery['cname']; ?>', property_id:<?php echo $lottery['property_id']; ?>, prizeRate: <?php echo 1 - $lottery['total_profit']; ?>, lotteryType: <?php echo $lottery['lottery_type']; ?>, methods: methods[<?php echo $lottery['lottery_id'] ?>], maxCombPrize: <?php echo $maxCombPrize; ?>, openedIssues: <?php echo $json_openedIssues; ?>, minRebateGaps: <?php echo $minRebateGaps; ?>, rebate: <?php echo $rebate; ?>, defaultMode: 1, defaultRebate: <?php echo $rebate; ?>, missHot: <?php echo $json_missHot; ?>
            });
            $(".moneyMode a").eq(3).click();


            /***金额输入框**/
//          $('#choPirze li').click(function(){
//              $('#multiple').val($(this).data('value'));
//              $('.txtaddSty').val($(this).data('value'));
//          });
        });
    </script>
</body>
</html>
