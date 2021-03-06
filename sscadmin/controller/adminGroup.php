<?php

if (!defined('IN_LIGHT')) {
    die('KCAH');
}

/**
 * 控制器：管理员组别管理
 *
 */
class adminGroupController extends sscAdminController
{

    //方法概览
    public $titles = array(
        'groupList' => '分组列表',
        'addGroup' => '增加分组',
        'editGroup' => '修改分组',
        'editPriv' => '修改权限',
        'enableGroup' => '启用分组',
        'disableGroup' => '禁用分组',
    );

    public function init()
    {
        parent::init(parent::INIT_TEMPLATE | parent::INIT_SESSION);
    }

    public function groupList()
    {
        if ($sa = $this->request->getPost('sa', 'trim')) {
            switch ($sa) {
                case 'saveSort':
                    $sort_ids = $this->request->getPost('sort_ids', 'array');
                    foreach ($sort_ids as $group_id => $sort) {
                        adminGroups::updateItem($group_id, array('sort' => $sort));
                    }
                    showMsg("保存成功");
                    break;
                case 'saveIp':
                    $allowIps = $this->request->getPost('allowIps', 'array');
                    foreach ($allowIps as $groupId => $allowIp) {
                        adminGroups::updateItem($groupId, array('allow_ips' => $allowIp));
                    }
                    showMsg("保存成功");
                    break;
            }
        }

        $groups = adminGroups::getItems();
        self::$view->setVar('groups', $groups);
        self::$view->setVar('actionLinks', array(0 => array('title' => '增加分组', 'url' => url('adminGroup', 'addGroup'))));
        self::$view->render('admingroup_grouplist');
    }

    public function addGroup()
    {
        $locations = array(0 => array('title' => '返回分组列表', 'url' => url('adminGroup', 'groupList')));
        //新增数据
        if ($this->request->getPost('submit', 'trim')) {
            $data = array(
                'parent_id' => $this->request->getPost('parent_id', 'intval'),
                'name' => $this->request->getPost('name', 'trim'),
                'priv_list' => '',
                'description' => $this->request->getPost('description', 'trim'),
                'sort' => $this->request->getPost('sort', 'trim'),
                'is_enabled' => $this->request->getPost('is_enabled', 'intval'),
            );
            if ($data['parent_id'] == 0) {
                $data['parent_tree'] = '';
            }
            else {
                $allParents = adminGroups::getAllParents($data['parent_id']);
                $data['parent_tree'] = implode(',', array_keys($allParents));
            }

            if (!adminGroups::addItem($data)) {
                showMsg("添加分组失败。请检查数据输入是否完整");
            }

            showMsg("添加成功");
        }

        self::$view->setVar('firstSecondItems', adminGroups::getFirstSecondItems());
        self::$view->render('admingroup_addgroup');
        $GLOBALS['mc']->flush();
    }

    public function editGroup()
    {
        $locations = array(0 => array('title' => '返回分组列表', 'url' => url('adminGroup', 'groupList')));
        //修改数据
        if ($this->request->getPost('submit', 'trim')) {
            $data = array(
                'parent_id' => $this->request->getPost('parent_id', 'intval'),
                'name' => $this->request->getPost('name', 'trim'),
                'description' => $this->request->getPost('description', 'trim'),
                'sort' => $this->request->getPost('sort', 'trim'),
                'is_enabled' => $this->request->getPost('is_enabled', 'intval'),
            );
            if ($data['parent_id'] == 0) {
                $data['parent_tree'] = '';
            }
            else {
                $allParents = adminGroups::getAllParents($data['parent_id']);
                $data['parent_tree'] = implode(',', array_keys($allParents));
            }
            if (!adminGroups::updateItem($this->request->getPost('group_id', 'trim'), $data)) {
                showMsg("没有数据被更新", 1, $locations);
            }

            showMsg("更新成功", 0, $locations);
        }
        if (!$group_id = $this->request->getGet('group_id', 'trim')) {
            showMsg("参数无效");
        }
        $group = adminGroups::getItem($group_id);

        self::$view->setVar('group', $group);
        self::$view->setVar('firstSecondItems', adminGroups::getAllLevelItems(0, 3));
        self::$view->render('admingroup_addgroup');
        $GLOBALS['mc']->flush();
    }

    public function editPriv()
    {
        $locations = array(0 => array('title' => '返回分组列表', 'url' => url('adminGroup', 'groupList')));

        //修改数据
        if ($this->request->getPost('submit', 'trim')) {
            $data = array(
                'priv_list' => implode(',', $this->request->getPost('menus', 'array')),
            );
            if (!adminGroups::updateItem($this->request->getPost('group_id', 'trim'), $data)) {
                showMsg("没有数据被更新", 1, $locations);
            }

            showMsg("更新成功", 0, $locations);
        }
        if (!$group_id = $this->request->getGet('group_id', 'trim')) {
            showMsg("参数无效");
        }
        if (!$group = adminGroups::getItem($group_id)) {
            showMsg("该分组不存在");
        }
        $privs = explode(',', $group['priv_list']);
        $allMenus = adminMenus::getAllLevelItems(0);

//        foreach ($allMenus as $k => $v) {
//            if (in_array($v['menu_id'], $privs)) {
//                $allMenus[$k]['has_priv'] = true;
//            }
//            else {
//                $allMenus[$k]['has_priv'] = false;
//            }
//            foreach ($v['submenu'] as $kk => $vv) {
//                if (in_array($vv['menu_id'], $privs)) {
//                    $allMenus[$k]['submenu'][$kk]['has_priv'] = true;
//                }
//                else {
//                    $allMenus[$k]['submenu'][$kk]['has_priv'] = false;
//                }
//            }
//        }

        self::$view->setVar('group', $group);
        self::$view->setVar('allMenus', $allMenus);
        self::$view->setVar('privs', $privs);
        self::$view->render('admingroup_editpriv');
        $GLOBALS['mc']->flush();
    }

    public function enableGroup()
    {
        $locations = array(0 => array('title' => '返回分组列表', 'url' => url('adminGroup', 'groupList')));
        if (!$group_id = $this->request->getGet('group_id', 'trim')) {
            showMsg("参数无效", 1, $locations);
        }

        $data = array(
            'status' => 1,
        );
        if (!adminGroups::updateItem($group_id, $data)) {
            showMsg("没有数据被更新", 0, $locations);
        }

        showMsg("更新成功", 0, $locations);
    }

    public function disableGroup()
    {
        $locations = array(0 => array('title' => '返回分组列表', 'url' => url('adminGroup', 'groupList')));
        if (!$group_id = $this->request->getGet('group_id', 'trim')) {
            showMsg("参数无效", 1, $locations);
        }

        $data = array(
            'status' => 0,
        );
        if (!adminGroups::updateItem($group_id, $data)) {
            showMsg("没有数据被更新", 0, $locations);
        }

        showMsg("更新成功", 0, $locations);
    }

    //暂不允许删除
//    public function deleteGroup()
//    {
//        $locations  = array(0 => array('title'=>'返回分组列表','url'=>url('adminGroup','groupList')));m
//        if (!$group_id = $this->request->getGet('group_id', 'trim')) {
//            showMsg("参数无效", 1, $locations);
//        }
//
//        if (!adminGroups::deleteItem($group_id)) {
//            showMsg("删除数据失败", 0, $locations);
//        }
//
//        showMsg("删除数据成功", 0, $locations);
//    }
}

?>