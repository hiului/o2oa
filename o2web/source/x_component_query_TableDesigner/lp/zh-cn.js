MWF.xApplication.query.TableDesigner.LP = {
    "title": "数据表设计",
    "newTable": "新建数据表",
    "property": "属性",
    "item": "项目",
    "type": "类型",
    "value": "值",
    "stat": "统计",
    "unnamed": "无标题列",
    "newColumn": "新建列",
    "unCategory": "未分类",
    "close": "关闭",

    "id": "标识",
    "name": "名称",
    "alias": "别名",
    "description": "描述",

    "application" : "数据应用",
    "copyStat" : "拷贝统计",
    "newStatName" : "新统计名称",
    "copy" : "副本",
    "ok" : "确定",
    "cancel" : "取消",
    "view" : "视图",
    "table": "数据表",
    "clumn": "列",
    "addLine": "添加数据",

    "jpqlType": "JPQL类型",
    "jpqlFromResult": "查询开始条目",
    "jpqlMaxResult": "最大返回结果",
    "jpqlSelectTitle": "JPQL语句",
    "inputWhere": "您可以在下面的编辑框输入Where子句",
    "jpqlRunSuccess": "JPQL执行成功",
    "newLineSuccess": "插入数据成功",
    "newLineJsonError": "插入数据错误，数据格式有误",

    "action": {
        "move": "移动",
        "delete": "删除",
        "add": "添加"
    },
    "errorName": "列名只允许使用字母数字和下划线组合，并且不能以数字和大写字母开头。",
    "nameUseKeywork": "列名不允许使用{key}",
    "errorFieldList": "请先创建数据列。",
    "duplicateName": "同名的列已存在",
    "inputName": "请输入列名称",
    "inputTableName": "请输入数据表名称",
    "tableNameNotStartWithLetter" : "数据表名称必须以字母开头",
    "tableAliasNotStartWithLetter" : "数据表别名必须以字母开头",
    "tableNameNotBeLetterAndNumber" : "数据表名称必须是全字母或字母加数字",
    "tableAliasNotBeLetterAndNumber" : "数据表别名必须是全字母或字母加数字",
    "save_success": "数据表保存成功！",
    "deleteColumnTitle": "删除列确认",
    "deleteColumn": "是否确定删除当前列？",
    "statusBuildTitle": "发布数据表",
    "statusBuildInfor": "当前数据表将会发布到编译环境，如果您删除了列或修改了列的类型，您可能需要手工删除数据库表。您确定要执行此操作吗？",
    "statusDraftTitle": "取消编译数据表",
    "statusDraftInfor": "<span style='color: #FF0000;'>注意：您正在将此数据表从编译环境中删除，下次编译会删除数据库表。</span><br><br>您确定要执行此操作吗？",
    "statusDraftInforAgain": "<span style='color: #FF0000;'>注意：您正在将此数据表从编译环境中删除，您将无法使用当前数据表，这可能会影响到已使用此数据表的相关应用。</span><br><br>请再次确认要执行此操作吗？",
    "statusBuild_success": "当前数据表已经发布到编译环境，您需要运行“全部编译”使其生效",
    "statusDraft_success": "当前数据表已从编译环境取消，下次“全部编译”时会删除从数据库中删除表",
    "buildAllViewTitle": "编译所有数据表",
    "tableExplodeTitle": "导出数据",
    "tableExplodeInfo": "默认最多导出2000行。确认是否导出？",
    "tableExplode_success": "导出成功",

    "buildNoTableError": "当前应用还没有数据表，不需要编译。",
    "buildCurrentAppTitle": "编译当前应用数据表",
    "buildCurrentAppInfor": "下列数据表将被编译：</br>{buildlist}",
    "unbuildCurrentAppInfor":   "下列数据表不编译或取消编译：</br>{draftList}",
    "buildCurrentAppQuection": "</br>您确定要执行此操作吗？",
    "buildCurrentApp_success": "已编译当前应用数据表！",
    "building": "正在编译...",

    "tableImplodeTitle": "导入数据",
    "tableImplodeInfo": "导入的数据会覆盖。确认是否导入？",
    "tableExcelImplodeInfo": "导入的数据如果有id字段，会覆盖，否则会新增。确认是否导入？",
    "tableImplode_success": "导入成功",

    "tableClearTitle": "清空数据",
    "tableClearInfo": "清空的数据不能恢复！！确认是否清空？",
    "tableClear_success": "清空成功",
    "exportExcelFileName" : "导出数据",

    "buildAllViewInfor": "即将编译所有数据表，包括所有数据应用中的数据表，<span style='color: #FF0000;'>编译后您请马上重启服务器，否则可能造成JVM崩溃</span>。您确定要执行此操作吗？",
    "buildAllView_success": "已编译所有数据表，请马上重启服务器！",
    // "tableHelp": "数据表能够在系统数据库中自动创建真实表，并生成java实体对象，您可以使用JPQL操作数据表。创建数据表需要以下步骤：<br><br>1、创建数据表，并创建每一列；<br>2、点击工具栏按钮，将数据表发布到编译状态；<br>3、点击工具栏按钮，执行“编译当前应用所有数据表”操作<br>4、马上重启服务器(否则可能造成JVM崩溃)，数据表就可使用了。",

    "tableHelp": "数据表能够在系统数据库中自动创建真实表，并生成java实体对象，您可以使用JPQL操作数据表。创建数据表需要以下步骤：<br><br>1、创建数据表，并创建每一列；<br>2、点击工具栏按钮，将数据表发布到编译状态；<br>3、点击工具栏按钮，执行“编译当前应用所有数据表”操作，成功后数据表就可使用了。",

    "propertyTemplate": {
        "base": "基本",
        "event": "事件",
        "html": "HTML",
        "json": "JSON",
        "action": "操作",
        "select": "选择",
        "alias": "别名",

        "id": "标识",
        "name": "名称",
        "description": "描述",
        "style": "样式",
        "attribute": "属性",
        "type": "类型",
        "status": "状态",
        "draft": "草稿",
        "published": "已发布",

        "authority":"执行权限",
        "readPersonList":"可读人",
        "readUnitList":"可读组织",
        "editPersonList":"可编辑人",
        "editUnitList":"可编辑组织"
    },
    "formToolbar":{
        "save": "保存",
        "saveAs": "另存为",
        "autoSave": "自动保存",
        "preview": "预览",
        "help": "帮助",
        "build": "发布数据表，进入可编译状态",
        "statusDraft": "取消数据库编译，重新编译时会删除已编译的数据表",
        "bulidCurrentApp":"编译当前应用所有数据表",
        "tableExplode":"数据导出",
        "tableImplode":"数据导入",
        "tableExcelExplode":"Excel导出",
        "tableExcelImplode":"Excel导入",
        "tableClear":"清空表数据"
    }
};
