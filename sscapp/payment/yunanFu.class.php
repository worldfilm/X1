<?php
namespace sscapp\payment;
class yunanFu extends payModel{
    /**
     * 云安付微信和QQ
     * @param array $data
     * @return string $str
     * @author Jacky
     */

    public function orderNumber($asd = 0)
    {
        $orderno = "1037" . date("YmdHis") . rand(1000, 9999);
        return $orderno;
        // TODO: Implement orderNumber() method.
    }

    public function run($data=[])
    {
        $card_info = isset($data['card_info']) ? $data['card_info'] : '';
        if (empty($card_info)) {
            $this->_error = '卡信息出错,请联系客服!';
            return false;
        }
        if (empty($card_info['mer_key'])) {
            $this->_error = '配置有误,请联系客服!';
            return false;
        }
        if (empty($card_info['mer_no'])) {
            $this->_error = '配置有误,请联系客服!';
            return false;
        }
        $partner = $card_info['mer_no'];
        $key = $card_info['mer_key'];
        $className = explode('\\', __CLASS__);
        $protocol = strpos(strtolower($_SERVER['SERVER_PROTOCOL']), 'https') == false ? 'http' : 'https';
        $domain = $protocol . '://' . $_SERVER['HTTP_HOST'] . ':' . $_SERVER['SERVER_PORT'] . '/';
        $shop_url = $card_info['shop_url'];
        $callbackurl = 'http://' . $_SERVER['HTTP_HOST'] . '/pay/backPay/' . end($className);
        $sameBackUrl = 'http://' . $_SERVER['HTTP_HOST'] . '/pay/inStep/' . end($className);
        $banktype = '';
        $apiUrl = $GLOBALS['cfg']['pay_url']['yunanfu_api'];
        if ($card_info['netway'] == "ZFB") {
            $banktype = "ALIPAY";
        } elseif ($card_info['netway'] == "QQ") {
            $banktype = "TENPAY";
        } else if ($card_info['netway'] == "WX_WAP") {
            $banktype = "WEIXINH5PAY";
        } else if ($card_info['netway'] == "YL") {
            $banktype = "UNIONPAY";
        } elseif ($card_info['netway'] == "JD") {
            $banktype = "JDPAY";
        } elseif ($card_info['netway'] == "WY") {
            $third_party_bank_id = $this->request->getPost('third_party_bank_id', 'intval');
            switch ($third_party_bank_id) {
                // 工商银行
                case '1':
                    $banktype = '1002';
                    break;
                // 农业银行
                case '2':
                    $banktype = '1005';
                    break;
                // 建设银行
                case '3':
                    $banktype = '1003';
                    break;
                // 招商银行
                case '4':
                    $banktype = '1001';
                    break;
                // 交通银行
                case '5':
                    $banktype = '1020';
                    break;
                // 中信银行
                case '6':
                    $banktype = '1021';
                    break;
                case '7':
                    break;
                // 中国光大银行
                case '8':
                    $banktype = '1022';
                    break;
                // 民生银行
                case '9':
                    $banktype = '1006';
                    break;
                // 上海浦东发展银行
                case '10':
                    $banktype = '1004';
                    break;
                // 兴业银行
                case '11':
                    $banktype = '1009';
                    break;
                // 广发银行
                case '12':
                    $banktype = '1027';
                    break;
                // 平安银行
                case '13':
                    $banktype = '1010';
                    break;
                // 华夏银行
                case '15':
                    $banktype = '1025';
                    break;
                // 东莞银行
                case '16':
                    break;
                // 渤海银行
                case '17':
                    $banktype = 'CBHB';
                    break;
                // 浙商银行
                case '19':
                    break;
                // 北京银行
                case '20':
                    $banktype = '1032';
                    break;
                // 广州银行
                case '21':
                    $banktype = '';
                    break;
                // 中国银行
                case '22':
                    $banktype = '1052';
                    break;
                // 邮政储蓄
                case '23':
                    $banktype = '1028';
                    break;
            }

        } else {
            $this->_error = '暂时不支持该支付!';
            return false;
        }
        $partner = $partner;//
        $paymoney = $data['money'];//
        $ordernumber = $data['ordernumber'];//
        $key = $key;//
        $callbackurl = $callbackurl;//
        $banktype = $banktype;//
        $signSource = sprintf("partner=%s&banktype=%s&paymoney=%s&ordernumber=%s&callbackurl=%s%s", $partner, $banktype, $paymoney, $ordernumber, $callbackurl, $key);//
        $sign = md5($signSource);//
        $postUrl = $apiUrl . "?banktype=" . $banktype;
        $postUrl .= "&partner=" . $partner;
        $postUrl .= "&paymoney=" . $paymoney;
        $postUrl .= "&ordernumber=" . $ordernumber;
        $postUrl .= "&callbackurl=" . $callbackurl;
        $postUrl .= "&hrefbackurl=" . $sameBackUrl;
        $postUrl .= "&attach=";
        $postUrl .= "&sign=" . $sign;//

            return ['code' => 'url', 'url' => $postUrl];

    }

    public function callback($response = [], $is_raw = 0){

        if (empty($response)) {
            $this->logdump('yunanFu', '回掉异常(第三方返回参数为空,请支付小组查看处理!)');
            exit;
        }

        if ($is_raw) {
            parse_str($response, $response);
        }

        $paymoney = isset($response['paymoney']) ? $response['paymoney'] : 0;//订单号

        if ($paymoney === 0) {
            $this->logdump('yunanFu', '回掉(paymoney为空!)');
            exit;
        }

        $orderstatus = isset($response['orderstatus']) ? $response['orderstatus'] : '';//订单号
        if (empty($orderstatus)) {
            $this->logdump('yunanFu', '回掉(orderstatus为空!)');
            exit;
        }

        $ordernumber = isset($response['ordernumber']) ? $response['ordernumber'] : '';//1:支付成功，非1为支付失败
        if (empty($ordernumber)) {
            $this->logdump('yunanFu', '回掉(ordernumber为空)');
            exit;
        }

        $sign = isset($response['sign']) ? $response['sign'] : '';//月宝订单号
        if (empty($sign)) {
            $this->logdump('yunanFu', '回掉(sign为空!)');
            exit;
        }

        $deposits = \deposits::getItemByCond(" shop_order_num = '{$ordernumber}'");

        if (empty($deposits)) {
            $this->logdump('yunanFu', '没有找到订单:' . $ordernumber . '的在线支付信息');
            exit;
        }
        $card_info = \cards::getItem($deposits['deposit_card_id']);
        if (empty($card_info)) {
            $this->logdump('yunanFu', '没有找到订单:' . $ordernumber . '的支付卡信息1');
            exit;
        }
        if (empty($card_info['mer_no'])) {
            $this->logdump('yunanFu', '配置有误,请联系客服!');
            exit;
        }
        $partner = $card_info['mer_no'];
        if (empty($card_info['mer_key'])) {
            $this->logdump('yunanFu', '配置有误,请联系客服!');
            exit;
        }
        $key = $card_info['mer_key'];
        $signSource = sprintf("partner=%s&ordernumber=%s&orderstatus=%s&paymoney=%s%s", $partner, $ordernumber, $orderstatus, $paymoney, $key);

        if ($sign == md5($signSource) && $response['orderstatus'] == '1')//签名正确
        {
            $this->bak('gs4fj@5f!sda*dfuf', 'ok', $deposits, $ordernumber, 'yunanFu');
        } else {
            $this->logdump('yunanFu', '回掉(签名验证不通过!请支付小组查看!)');
            exit;
        }
        die('ok');//到不了这里
    }


}