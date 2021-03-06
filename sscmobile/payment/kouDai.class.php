<?php
namespace sscmobile\payment;
if (!defined('IN_LIGHT')) {
    die('KCAH');
}
class kouDai extends newPayModel{
    /**
     * 联付宝
     * @param array $data
     * @return string $str
     * @author Jacky
     */
    public function run($data=[])
    {
        $card_info = isset($data['card_info']) ? $data['card_info'] : '';
        if (empty($card_info)) {
            echo '卡信息出错,请联系客服!';
            return false;
        }
        if (empty($card_info['mer_key'])) {
            echo '配置有误,请联系客服!';
            return false;
        }
        if (empty($card_info['mer_no'])) {
            echo '配置有误,请联系客服!';
        }
        $partner = $card_info['mer_no'];
        $key = $card_info['mer_key'];
        $className = explode('\\', __CLASS__);
        $protocol = strpos(strtolower($_SERVER['SERVER_PROTOCOL']), 'https') == false ? 'http' : 'https';
        $domain = $protocol . '://' . $_SERVER['HTTP_HOST'] . ':' . $_SERVER['SERVER_PORT'] . '/';
        $shop_url = $card_info['shop_url'];
        if ($shop_url == "") {
            $callbackurl = $domain . 'newPay/backPay/' . end($className);
            $sameBackUrl = $domain . 'pay/hrefback.php';
        } else if (strpos($shop_url, '?c=pay') === 0) {
            $this->logdump('xdShopUrl','第三方支付域名错误');
            echo '支付域名错误';
        } else if (strpos($shop_url, '?c=pay') > 0) {
            $this->logdump('xdShopUrl','第三方支付域名错误');
            echo '支付域名错误';
        } else {
            $callbackurl = $shop_url .  'pay/' . end($className) . 'Back.php';
            $sameBackUrl = $shop_url . 'hrefback.php';
        }
        $service_type = '';
        $apiUrl = $GLOBALS['cfg']['pay_url']['koudai_api'];
        if ($card_info['netway'] == 'WX') {
              $service_type = "21";
        } elseif ($card_info['netway'] == 'WX_WAP') {
              $service_type = "33";
        } elseif ($card_info['netway'] == 'QQ') {
            $service_type = "89";
        } elseif ($card_info['netway'] == 'QQ_WAP') {
            $service_type = "92";
        } elseif ($card_info['netway'] == 'WY') {
            $service_type = "1";
            switch ($data['third_party_bank_id']) {
                // 工商银行
                case '1':
                    $banktype = '10001';
                    break;
                // 农业银行
                case '2':
                    $banktype = '10002';
                    break;
                // 建设银行
                case '3':
                    $banktype = '10005';
                    break;
                // 招商银行
                case '4':
                    $banktype = '10003';
                    break;
                // 交通银行
                case '5':
                    $banktype = '10008';
                    break;
                // 中信银行
                case '6':
                    $banktype = '10007';
                    break;
                case '7':
                    break;
                // 中国光大银行
                case '8':
                    $banktype = '10010';
                    break;
                // 民生银行
                case '9':
                    $banktype = '10006';
                    break;
                // 上海浦东发展银行
                case '10':
                    $banktype = '10015';
                    break;
                // 兴业银行
                case '11':
                    $banktype = '10009';
                    break;
                // 广发银行
                case '12':
                    $banktype = '10016';
                    break;
                // 平安银行
                case '13':
                    $banktype = '10014';
                    break;
                // 华夏银行
                case '15':
                    $banktype = '10025';
                    break;
                // 东莞银行
                case '16':
                    break;
                // 渤海银行
                case '17':
                    $banktype = '10017';
                    break;
                // 浙商银行
                case '19':
                    break;
                // 北京银行
                case '20':
                    $banktype = '10013';
                    break;
                // 广州银行
                case '21':
                    $banktype = '';
                    break;
                // 中国银行
                case '22':
                    $banktype = '10004';
                    break;
                // 邮政储蓄
                case '23':
                    $banktype = '10012';
                    break;
            }
        } else {
            echo '暂时不支持该支付';
        }
        $postData['P_UserID'] = $partner;
        $postData['P_OrderID'] = $data['ordernumber'];//
        $postData['P_FaceValue'] = $data['money'];
        $postData['P_ChannelID'] = $service_type;
        $postData['P_Description'] = @$banktype;//
        $postData['P_Price'] = 1;//
        $postData['P_CardId'] = "";//
        $postData['P_CardPass'] = "";
        $postData['P_Result_URL'] = $callbackurl;
        $postData['P_Notify_URL'] = $sameBackUrl;
        $preEncodeStr = $postData['P_UserID']."|".$postData['P_OrderID']."|".$postData['P_CardId']."|".$postData['P_CardPass']."|".$postData['P_FaceValue']."|".$postData['P_ChannelID']."|".$key;
        $postData['P_PostKey'] = md5($preEncodeStr);
        $url = $apiUrl."?P_UserId=".$postData['P_UserID'];
        $url.= "&P_OrderId=".$postData['P_OrderID'];
        $url.= "&P_FaceValue=".$postData['P_FaceValue'];
        $url.= "&P_ChannelId=".$postData['P_ChannelID'];
        if($card_info['netway'] == 'WY'){
            $url.= "&P_Description=".$postData['P_Description'];
        }
        $url.= "&P_Price=".$postData['P_Price'];
        $url.= "&P_PostKey=".$postData['P_PostKey'];
        $url.= "&P_Result_URL=".$postData['P_Result_URL'];
        $url.= "&P_Notify_URL=".$postData['P_Notify_URL'];

            $requestURI = $data['requestURI'];
            $bank_id = $data['bank_id'];
            $bank_id = authcode($bank_id, 'DECODE', 'a6sbe!x4^5d_ghd');
            $array = array(
                'order_number' => $data['ordernumber'],
                'user_id' => $data['user_id'],
                'username' => $data['username'],
                'amount' => $data['money'],
                'pay_time' => date('Y-m-d H:i:s'),
                'source' => $_SERVER['HTTP_HOST'],
                'requestURI' => $requestURI,
                'card_id' => $data['card_id'],
                'bank_id' => $bank_id,
            );
            if (\pay::addItem($array)) {
                if (strstr($card_info['netway'], "WAP") > '-1') {
                    if (file_exists(ROOT_PATH . 'cdn.xml')) {
                        $xml = simplexml_load_file(ROOT_PATH . 'cdn.xml');
                        $imgCdnUrl = (string)$xml->mobile;
                    } else {
                        $imgCdnUrl = config::getConfig('site_main_domain');
                    }
                    $jsUrl = $imgCdnUrl . "/js/jquery.js";
                    $this->logdump('kouDai.log', $jsUrl);
                    $str = <<<HTML
<!DOCTYPE HTML>
<html>
<head>
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta content="webkit" name="renderer">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>跳转中</title>
       <script src="$jsUrl" type="text/javascript"></script>
    <script>
        $(document).ready(function(){
            $("input[name=pay]").click(function(){
                window.open($("input[name=qrcode_url]").val(), "_blank");
            });
        });
    </script>
</head>
<body>
<input name="qrcode_url" type="hidden" value="$url" />
<input name="pay" type="button" value="启动 QQ/微信/支付宝 支付" />
</body>
</html>
HTML;
                    echo $str;
                    die();
                } else {
                    header("location:" . $url);
                    die();
                }
            }else{
                echo "生成订单失败!";
                $this->logdump('kouDai', $postData);

            }

    }

    public function callback($response = [], $is_raw = 0){

        if (empty($response)) {
            $this->logdump('kouDai', '回掉异常(第三方返回参数为空,请支付小组查看处理!)');
            exit;
        }
        if ($is_raw) {
            parse_str($response, $response);
        }
        $P_UserId = isset($response['P_UserId']) ? $response['P_UserId'] : '';//商户ID
        if (empty($P_UserId)) {
            $this->logdump('kouDai', '回掉(P_UserId为空!)');
            exit;
        }
        $P_FaceValue = isset($response['P_FaceValue']) ? $response['P_FaceValue'] : 0;//订单号
        if ($P_FaceValue === 0) {
            $this->logdump('kouDai', '回掉(P_FaceValue为空!)');
            exit;
        }

        $P_OrderId = isset($response['P_OrderId']) ? $response['P_OrderId'] : '';//订单号
        if (empty($P_OrderId)) {
            $this->logdump('kouDai', '回掉(P_OrderId为空!)');
            exit;
        }
        $P_CardId = isset($response['P_CardId']) ? $response['P_CardId'] : '';//订单金额 单位分（人民币）

        $P_CardPass = isset($response['P_CardPass']) ? $response['P_CardPass'] : '';//1:支付成功，非1为支付失败

        $P_ChannelId = isset($response['P_ChannelId']) ? $response['P_ChannelId'] : '';//1:支付成功，非1为支付失败
        if (empty($P_ChannelId)) {
            $this->logdump('kouDai', '回掉(P_ChannelId为空)');
            exit;
        }

        $P_PayMoney = isset($response['P_PayMoney']) ? $response['P_PayMoney'] : 0;//1:支付成功，非1为支付失败
        if ($P_PayMoney === 0) {
            $this->logdump('kouDai', '回掉(P_PayMoney为空)');
            exit;
        }

        $P_ErrCode = isset($response['P_ErrCode']) ? $response['P_ErrCode'] : 0;//1:支付成功，非1为支付失败

        $P_PostKey = isset($response['P_PostKey']) ? $response['P_PostKey'] : '';//1:支付成功，非1为支付失败
        if (empty($P_PostKey)) {
            $this->logdump('kouDai', '回掉(P_PostKey为空)');
            exit;
        }

        $deposits = \deposits::getItemByCond(" shop_order_num = '{$P_OrderId}'");

        if (empty($deposits)) {
            $this->logdump('kouDai', '没有找到订单:' . $P_OrderId . '的在线支付信息');
            exit;
        }
        $card_info = \cards::getItem($deposits['deposit_card_id']);
        if (empty($card_info)) {
            $this->logdump('kouDai', '没有找到订单:' . $P_OrderId . '的支付卡信息1');
            exit;
        }
        if (empty($card_info['mer_no'])) {
            $this->logdump('kouDai', '配置有误,请联系客服!');
            exit;
        }
        $this->_partner = $card_info['mer_no'];
        if (empty($card_info['mer_key'])) {
            $this->logdump('kouDai', '配置有误,请联系客服!');
            exit;
        }
        $key = $card_info['mer_key'];
        $encodeStr = md5($P_UserId."|".$P_OrderId."|".$P_CardId."|".$P_CardPass."|".$P_FaceValue."|".$P_ChannelId."|".$P_PayMoney."|".$P_ErrCode."|".$key);
        if ($P_PostKey == $encodeStr && $P_ErrCode == '0')//签名正确
        {
            $this->bak('gs4fj@5f!sda*dfuf', 'errCode=0', $deposits, $P_OrderId, 'kouDai');
        } else {
            $this->logdump('kouDai', '回掉(签名验证不通过!请支付小组查看!)');
            exit;
        }
        die('ok');//到不了这里
    }


}