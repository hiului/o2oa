MWF.xApplication.Selector = MWF.xApplication.Selector || {};
//MWF.xDesktop.requireApp("Selector", "lp."+MWF.language, null, false);
//MWF.xDesktop.requireApp("Selector", "Actions.RestActions", null, false);
MWF.xApplication.Selector.Person = new Class({
    Extends: MWF.widget.Common,
    Implements: [Options, Events],

    options: {
        "style": "default",
        "count": 0,
        "title": "",
        "groups": [],
        "roles": [],
        "values": [],
        "exclude" : [],
        "zIndex": 1000,
        "expand": true,
        "embedded" : false, //是否嵌入在其他容器中
        "selectAllEnable" : false, //是否允许全选
        "selectAllRange" : "direct", //全选直属人员 还是 所有下级人员
        "selectAllActiveNestSub": true, //全选时，是否展开子级级以后的层次

        "level1Indent" : 10, //第一级的缩进
        "indent" : 10, //后续的缩进

        "hasLetter" : true, //字母
        "hasTop" : false, //可选、已选的标题

        "hasShuttle" : false, //穿梭按钮
        "searchbarInTopNode" : true, //搜索框在标题上还是另起一行
        "hasSelectedSearchbar" : false, //已选是不是有搜索框
        "noSelectedContainer" : false, //是否隐藏右侧已选区域
        "contentUrl" : "", //和默认的页面布局不一样的话，可以传入页面布局HTML URL
        "injectToBody" : false, //当传入HTML URL的时候是否插入到document.body, false的时候插入到this.container
        "selectSingleItem" : false, //当只有一个候选项的时候，是否默认选中
        "hiddenEmptyCategory" : false,

        "flatCategory" : false, //扁平化展现分类,
        "selectType" : "person",

        "isCheckStatus" : false,
        "showSelectedCount" : false,

        "itemHeight" : 29,
        "identityItemWidth" : 0, //选项宽度，如果不为0，设置为float:left,

        "storeRange" : "full", //数据是否保存为精简，可选值：full,simple

        "showEmptyText" : true
    },
    setInitTitle: function(){
        this.setOptions({"title": MWF.xApplication.Selector.LP.selectPerson});
    },
    initialize: function(container, options){
        this.active = true;

        this.setOptions(options);
        if (!this.options.title) this.setInitTitle();

        this.path = "../x_component_Selector/$Selector/";
        this.cssPath = "../x_component_Selector/$Selector/"+this.options.style+"/css.wcss";
        this._loadCss(true);

        this.container = $(container);

        if( ["flow"].contains(this.options.style)  ){
            this.options.contentUrl = this.path + this.options.style + "/"+( this.options.embedded ? "selector_embedded":"selector" )+".html";
            this.options.level1Indent = 10;
            this.options.indent = 20;
        }

        Object.defineProperties(this, {
            "orgAction": {"get": function(){return o2.Actions.get("x_organization_assemble_control");}},
            "processAction": {"get": function(){return o2.Actions.get("x_processplatform_assemble_surface");}},
            "designerAction": {"get": function(){return o2.Actions.get("x_processplatform_assemble_designer");}},
            "portalAction": {"get": function(){return o2.Actions.get("x_portal_assemble_surface");}},
            "portalDesignerAction": {"get": function(){return o2.Actions.get("x_portal_assemble_designer");}},
            "cmsAction": {"get": function(){return o2.Actions.get("x_cms_assemble_control");}},
            "queryAction": {"get": function(){return o2.Actions.get("x_query_assemble_designer");}}
        });

        // this.orgAction = MWF.Actions.get("x_organization_assemble_control");
        // //this.org2Action = MWF.Actions.get("x_organization_assemble_express");
        // this.processAction = MWF.Actions.get("x_processplatform_assemble_surface");
        // this.designerAction = MWF.Actions.get("x_processplatform_assemble_designer");
        // this.portalAction = MWF.Actions.get("x_portal_assemble_surface");
        // this.portalDesignerAction = MWF.Actions.get("x_portal_assemble_designer");
        // this.cmsAction = MWF.Actions.get("x_cms_assemble_control");
        // this.queryAction = MWF.Actions.get("x_query_assemble_designer");

        //this.action = new MWF.xApplication.Selector.Actions.RestActions();

        this.lastPeople = "";
        this.pageCount = "13";

        this.selectedItems = []; //所有已选项

        this.items = []; //所有选择项

        this.subCategorys = []; //直接的分类
        this.subItems = []; //直接的选择项

        this.subCategoryMap = {};
        this.subCategoryMapWithDuty = {};

        if( !this.options.values ){
            this.options.values = [];
        }

        this.tooltips = [];

        this.availableStatusTypes = ["identity","custom"];

        this._init();
    },
    _init : function(){
        this.selectType = "person";
        this.className = "Person";
    },
    load: function(){
        debugger;
        this.fireEvent("queryLoad",[this]);
        if( this.options.contentUrl ){
            this.loadWithUrl()
        }else{
            if (layout.mobile){
                this.loadMobile();
            }else{
                this.loadPc();
            }
            this.fireEvent("load");
        }
    },
    loadMobile: function(){
        this.overrideSelectedItems();

        this.maskRelativeNode = $(document.body);
        this.maskRelativeNode.mask({
            "destroyOnHide": true,
            "style": this.css.maskNode
        });

        this.node = new Element("div", {"styles": this.css.containerNodeMobile});
        this.node.setStyle("z-index", this.options.zIndex.toInt()+1);
        this.node.setStyle("height", ( $(document.body).getSize().y ) + "px");
        this.titleNode = new Element("div", {
            "styles": this.css.titleNodeMobile
        }).inject(this.node);

        this.titleCancelActionNode = new Element("div", {
            "styles": this.css.titleCancelActionNodeMobile,
            "text": MWF.SelectorLP.back
        }).inject(this.titleNode);
        this.titleOkActionNode = new Element("div", {
            "styles": this.css.titleOkActionNodeMobile,
            "text": MWF.SelectorLP.ok
        }).inject(this.titleNode);

        this.titleTextNode = new Element("div", {
            "styles": this.css.titleTextNodeMobile,
            "text": this.options.title
        }).inject(this.titleNode);

        this.contentNode = new Element("div", {
            "styles": this.css.contentNode
        }).inject(this.node);

        var size = $(document.body).getSize();
        var height = size.y-40;
        //var height = size.y;
        this.contentNode.setStyle("height", ""+height+"px");

        this.node.inject($(document.body));
        this.node.setStyles({
            "top": "0px",
            "left": "0px"
        });

        this.loadContent();

        this.setEvent();
    },
    overrideSelectedItems: function(){
       var  _self = this;

        var oldPush = this.selectedItems.push;
        this.selectedItems.push = function(){
            oldPush.apply(this, arguments);
            _self.setSelectedCount();
        };

        var oldErase = this.selectedItems.erase;
        this.selectedItems.erase = function(){
            oldErase.apply(this, arguments);
            _self.setSelectedCount();
        };

        var oldConcat = this.selectedItems.concat;
        this.selectedItems.concat = function(){
            oldConcat.apply(this, arguments);
            _self.setSelectedCount();
        };
    },
    setSelectedCount: function(){
        var quantifier = MWF.SelectorLP.quantifier[ this.selectType ] || "";
        if(this.selectedCountTextNode)this.selectedCountTextNode.set("text", quantifier + ":"+ this.selectedItems.length );
        if(this.selectedTitleCountNode){
            if( this.inMulitple ){
                this.selectedTitleCountNode.set("text", quantifier + ":" + this.selectedItems.length );
            }else{
                this.selectedTitleCountNode.set("text", "("+ quantifier + ":" + this.selectedItems.length +")");
            }
        }
    },
    loadSelectedCountNode: function(){
        if( this.inMulitple )return;
        this.selectedCountNode = new Element("div.selectedCountNode", {
            "styles": this.css.selectedCountNodeMobile,
            "events":{
                "click": function () {
                    this.css.selectedMaskNodeMobile["z-index"] = this.options.zIndex + 2;
                    this.selectedMaskNode = new Element("div", {
                        "styles": this.css.selectedMaskNodeMobile,
                        "events":{
                            "click": function () {
                                this.selectedWrapNode.hide();
                                this.selectedMaskNode.destroy();
                            }.bind(this)
                        }
                    }).inject( this.node );
                    this.selectedWrapNode.show().inject( this.node );
                }.bind(this)
            }
        }).inject(this.selectNode);

        this.selectedCountLabelNode = new Element("div", {
            "styles": this.css.selectedCountLabelNodeMobile,
            "text": MWF.SelectorLP.selected2
        }).inject( this.selectedCountNode );
        this.selectedCountTextNode = new Element("div", {
            "styles": this.css.selectedCountTextNodeMobile,
            "text": (MWF.SelectorLP.quantifier[ this.selectType ] || "") + ":0"
        }).inject( this.selectedCountNode );
    },
    setMaskResize: function(){
        var size = this.container.getSize();
        this.mask.resize();
        this.maskInterval = window.setInterval(function(){
            var resize = this.container.getSize();
            if ((size.x!==resize.x) || (size.y!==resize.y)){
                this.mask.position();
                this.mask.resize();
                size.x = resize.x;
                size.y = resize.y;
            }
        }.bind(this), 66);
    },
    loadPc: function(){
        if( this.options.embedded ){
            this.node = new Element("div", {
                "styles": this.css.containerNode_embedded, //(this.options.count.toInt()===1) ? this.css.containerNodeSingle_embedded : this.css.containerNode_embedded,
                "events": {
                    "click": function(e){e.stopPropagation();},
                    "mousedown": function(e){e.stopPropagation();},
                    "mouseover": function(e){e.stopPropagation();},
                    "mouseout": function(e){e.stopPropagation();},
                    "keydown": function(e){e.stopPropagation();}
                }
            });

            this.contentNode = new Element("div", {
                "styles": this.css.contentNode_embedded ? this.css.contentNode_embedded : this.css.contentNode
            }).inject(this.node);

            this.loadContent();

            if( this.options.width || this.options.height ){
                this.setSize()
            }

            this.node.inject(this.container);
        } else {
            this.css.maskNode["z-index"] = this.options.zIndex;
            var position = this.container.getPosition(this.container.getOffsetParent());
            this.mask = new Mask(this.container, {
                "destroyOnHide": true,
                "style": this.css.maskNode,
                "useIframeShim": true,
                "iframeShimOptions": {"browsers": true},
                "onShow": function () {
                    this.shim.shim.setStyles({
                        "opacity": 0,
                        "top": "" + position.y + "px",
                        "left": "" + position.x + "px"
                    });
                }
                //
                // "destroyOnHide": true,
                // "style": this.css.maskNode,
                // "useIframeShim": true,
                // "iframeShimOptions": {"browsers": true},
                // "onShow": function(){
                //     this.shim.shim.setStyles({
                //         "opacity": 0,
                //         "top": ""+position.y+"px",
                //         "left": ""+position.x+"px"
                //     });
                // }
            });
            this.mask.show();
            this.setMaskResize();

            //  this.container.setStyle("z-index", this.options.zIndex);
            this.node = new Element("div", {
                "styles": this.options.noSelectedContainer ? this.css.containerNodeSingle : this.css.containerNode, //(this.options.count.toInt()===1)
                "events": {
                    "click": function(e){e.stopPropagation();},
                    "mousedown": function(e){e.stopPropagation();},
                    "mouseover": function(e){e.stopPropagation();},
                    "mouseout": function(e){e.stopPropagation();},
                    "keydown": function(e){e.stopPropagation();}
                }
            });
            this.node.setStyle("z-index", this.options.zIndex.toInt()+1);
            this.titleNode = new Element("div.titleNode", {
                "styles": this.css.titleNode
            }).inject(this.node);

            this.titleActionNode = new Element("div", {
                "styles": this.css.titleActionNode
            }).inject(this.titleNode);
            this.titleTextNode = new Element("div", {
                "styles": this.css.titleTextNode,
                "text": this.options.title
            }).inject(this.titleNode);

            this.contentNode = new Element("div", {
                "styles": this.css.contentNode
            }).inject(this.node);

            this.loadContent();

            this.actionNode = new Element("div", {
                "styles": this.css.actionNode
            }).inject(this.node);
            //if (this.options.count.toInt() === 1) this.actionNode.setStyle("text-align", "center");
            this.loadAction();

            this.node.inject(this.container);

            this.node.position({
                relativeTo: this.container,
                position: "center",
                edge: "center"
            });

            var size = this.container.getSize();
            var nodeSize = this.node.getSize();
            this.node.makeDraggable({
                "handle": this.titleNode,
                "limit": {
                    "x": [0, size.x - nodeSize.x],
                    "y": [0, size.y - nodeSize.y]
                }
            });

            if( this.options.width || this.options.height ){
                this.setSize()
            }

            this.setEvent();

        }
    },

    loadWithUrl : function(){
        if( this.options.style === "flow" ){
            debugger;
            var node = new Element("div");
            node.loadHtml( this.options.contentUrl, {
                "bind": { "lp": MWF.xApplication.Selector.LP, "options": this.options },
                "module": this
            },function () {
                this.node = node.getFirst();
                this.node.loadCss("../x_component_Selector/$Selector/flow/style.css");
                this.loadContentWithHTML();
                this.fireEvent("load");
            }.bind(this));
        }else{
            var request = new Request.HTML({
                url: this.options.contentUrl,
                method: "GET",
                async: false,
                onSuccess: function(responseTree, responseElements, responseHTML, responseJavaScript){
                    this.node = responseTree[0];
                    this.loadContentWithHTML();
                    this.fireEvent("load");
                }.bind(this),
                onFailure: function(xhr){
                    alert(xhr);
                }
            });
            request.send();
        }
    },
    loadContentWithHTML : function(){
        debugger;
        var container = this.options.injectToBody ? $(document.body) : this.container;
        if( !this.options.embedded ){
            this.maskRelativeNode = container;
            this.css.maskNode["z-index"] = this.options.zIndex;
            this.maskRelativeNode.mask({
                "destroyOnHide": true,
                "style": this.css.maskNode
            });
        }

        if( !this.options.embedded ) {
            this.node.setStyles( layout.mobile ? this.css.containerNodeMobile : this.css.containerNode );
            this.node.setStyle("z-index", this.options.zIndex.toInt() + 1);
        }
        if( layout.mobile ){
            this.node.setStyle("height", ( container.getSize().y ) + "px");
        }

        this.titleNode = this.node.getElement(".MWF_selector_titleNode");
        this.titleTextNode = this.node.getElement(".MWF_selector_titleTextNode");
        this.titleCancelActionNode = this.node.getElement(".MWF_selector_titleCancelActionNode");
        this.titleOkActionNode = this.node.getElement(".MWF_selector_titleOkActionNode");

        this.titleActionNode = this.node.getElement(".MWF_selector_titleActionNode");

        this.contentNode = this.node.getElement(".MWF_selector_contentNode");

        this.selectNode = this.node.getElement(".MWF_selector_selectNode");
        this.selectTopNode = this.node.getElement(".MWF_selector_selectTopNode");
        this.selectTopTextNode = this.node.getElement(".MWF_selector_selectTopTextNode");
        this.searchInputDiv = this.node.getElement(".MWF_selector_searchInputDiv");
        this.searchInput = this.node.getElement(".MWF_selector_searchInput");
        this.searchCancelAction = this.node.getElement(".MWF_selector_searchCancelAction");
        this.letterActionNode = this.node.getElement(".MWF_selector_letterActionNode");

        this.flatCategoryScrollNode = this.node.getElement(".MWF_selector_flatCategoryScrollNode");
        this.flatCategoryNode = this.node.getElement(".MWF_selector_flatCategoryNode");
        if( this.options.flatCategory && this.flatCategoryScrollNode ){
            this.isFlatCategory = true;
            this.flatSubCategoryNodeList = [];
        }

        this.letterAreaNode = this.node.getElement(".MWF_selector_letterAreaNode");

        this.itemAreaScrollNode = this.node.getElement(".MWF_selector_itemAreaScrollNode");
        this.itemAreaNode = this.node.getElement(".MWF_selector_itemAreaNode");

        this.itemSearchAreaScrollNode = this.node.getElement(".MWF_selector_itemSearchAreaScrollNode");
        this.itemSearchAreaNode = this.node.getElement(".MWF_selector_itemSearchAreaNode");

        this.selectedContainerNode = this.node.getElement(".MWF_selector_selectedContainerNode");

        this.selectedTopNode = this.node.getElement(".MWF_selector_selectedTopNode");
        this.selectedTopTextNode = this.node.getElement(".MWF_selector_selectedTopTextNode");
        this.emptySelectedNode = this.node.getElement(".MWF_selector_emptySelectedNode");

        this.selectedScrollNode = this.node.getElement(".MWF_selector_selectedScrollNode");
        this.selectedNode = this.node.getElement(".MWF_selector_selectedNode");
        this.selectedItemSearchAreaNode = this.node.getElement(".MWF_selector_selectedItemSearchAreaNode");

        this.actionNode = this.node.getElement(".MWF_selector_actionNode");
        this.okActionNode = this.node.getElement(".MWF_selector_okActionNode");
        this.cancelActionNode = this.node.getElement(".MWF_selector_cancelActionNode");

        if (this.titleNode) this.titleNode.setStyles( layout.mobile ? this.css.titleNodeMobile : this.css.titleNode );
        if (this.titleTextNode){
            this.titleTextNode.setStyles(layout.mobile ? this.css.titleTextNodeMobile : this.css.titleTextNode);
            if(this.options.title)this.titleTextNode.set("text", this.options.title);
        }
        if (this.titleActionNode)this.titleActionNode.setStyles(this.css.titleActionNode);
        if (this.titleCancelActionNode) this.titleCancelActionNode.setStyles(this.css.titleCancelActionNodeMobile);
        if (this.titleOkActionNode) this.titleOkActionNode.setStyles(this.css.titleOkActionNodeMobile);
        if (this.contentNode) this.contentNode.setStyles(this.css.contentNode);

        if (this.selectNode) this.selectNode.setStyles( layout.mobile ? this.css.selectNodeMobile : this.css.selectNode);
        if (this.selectTopNode)this.selectTopNode.setStyles(this.css.selectTopNode);
        if (this.selectTopTextNode)this.selectTopTextNode.setStyles(this.css.selectTopTextNode);
        if (this.searchInputDiv) this.searchInputDiv.setStyles(this.css.searchInputDiv);
        if (this.searchInput) this.searchInput.setStyles( (this.options.count.toInt()===1 || this.options.noSelectedContainer) ? this.css.searchInputSingle : this.css.searchInput );
        if (this.searchCancelAction) this.searchCancelAction.setStyles(this.css.searchCancelAction);
        if (this.letterActionNode) this.letterActionNode.setStyles(this.css.letterActionNode);
        if (this.letterAreaNode) this.letterAreaNode.setStyles(this.css.letterAreaNode);
        if (this.itemAreaScrollNode) this.itemAreaScrollNode.setStyles(this.css.itemAreaScrollNode);
        if (this.itemAreaNode) this.itemAreaNode.setStyles(this.css.itemAreaNode);

        if (this.itemSearchAreaScrollNode) this.itemSearchAreaScrollNode.setStyles(this.css.itemSearchAreaScrollNode);
        if (this.itemSearchAreaNode) this.itemSearchAreaNode.setStyles(this.css.itemAreaNode);

        if (this.selectedContainerNode)this.selectedContainerNode.setStyles(this.css.selectedContainerNode);
        if (this.selectedTopNode)this.selectedTopNode.setStyles(this.css.selectedTopNode);
        if (this.selectedTopTextNode)this.selectedTopTextNode.setStyles(this.css.selectedTopTextNode);
        if (this.emptySelectedNode)this.emptySelectedNode.setStyles(this.css.selectedTopActionNode);

        if (this.selectedScrollNode) this.selectedScrollNode.setStyles(this.css.selectedScrollNode);
        if (this.selectedNode) this.selectedNode.setStyles(this.css.selectedNode);
        if (this.selectedItemSearchAreaNode) this.selectedItemSearchAreaNode.setStyles(this.css.itemAreaNode);

        if (this.actionNode) this.actionNode.setStyles(this.css.actionNode);
        if (this.okActionNode) {
            this.okActionNode.setStyles(this.css.okActionNode);
            this.okActionNode.set("text", MWF.SelectorLP.ok);
        }
        if (this.cancelActionNode) {
            this.cancelActionNode.setStyles(this.css.cancelActionNode);
            this.cancelActionNode.set("text", MWF.SelectorLP.cancel);
        }

        this.node.inject( container );

        this.loadContent();
        if( this.actionNode ){
            this.loadAction();
        }

        if( !this.options.embedded ){
            if( layout.mobile ){
                this.node.setStyles({
                    "top": "0px",
                    "left": "0px"
                });
            }else{
                if( this.options.width || this.options.height ){
                    this.setSize()
                }
                this.node.position({
                    relativeTo: this.container,
                    position: "center",
                    edge: "center"
                });

                var size = this.container.getSize();
                var nodeSize = this.node.getSize();
                this.node.makeDraggable({
                    "handle": this.titleNode,
                    "limit": {
                        "x": [0, size.x - nodeSize.x],
                        "y": [0, size.y - nodeSize.y]
                    }
                });
            }
        }else{
            if( this.options.width || this.options.height ){
                this.setSize()
            }
        }

        this.setEvent();
    },
    switchLetterArea: function(){
        var showing = this.letterAreaNode.offsetParent;
        this.letterAreaNode.setStyle("display", showing ? "none" : "" );

        this.letterActionNode.setStyles( showing ? this.css.letterActionNode : this.css.letterActionNode_active )
        if( showing ){
            this.letterActionNode.removeClass("MWF_selector_letterActionNode_active");
            if( this.options.mainColorEnable )this.letterActionNode.removeClass("mainColor_color");
        }else{
            this.letterActionNode.addClass("MWF_selector_letterActionNode_active");
            if( this.options.mainColorEnable )this.letterActionNode.addClass("mainColor_color");
        }

        if( this.letterAreaNode.offsetParent )this.loadLetters();

        var height = this.selectNode.getSize().y - this.getOffsetY( this.selectNode );

        if( this.searchInput ){
            height = height - this.getOffsetY( this.searchInputDiv ) - ( this.searchInputDiv.getStyle("height").toInt() || 0 )
        }

        if( !showing ){
            height = height - this.getOffsetY( this.letterAreaNode ) - ( this.letterAreaNode.getStyle("height").toInt() || 0 );
        }

        this.itemAreaScrollNode.setStyle("height", ""+height+"px");

        if( this.itemSearchAreaScrollNode ){
            this.itemSearchAreaScrollNode.setStyle("height", ""+height+"px");
        }
    },
    getUnitIdentityCount : function(){

    },
    getUnitSelecteIndentityCount : function( unitLevelName ){ //根据组织获取已选身份数
        var count;
        this.selectedItems.each( function (item) {
            if( item.data.unitLevelName.indexOf( unitLevelName ) === 0 )count++;
        }.bind(this));
        return count;
    },
    getGroupNestCount : function(){
        // o2.Actions.load("x_organization_assemble_express").
    },
    getGroupSelecteIndentityCount : function( groupName ){ //根据组织获取已选身份数
        var count;
        this.selectedItems.each( function (item) {
            if( item.data.unitLevelName.indexOf( unitLevelName ) === 0 )count++;
        }.bind(this));
        return count;
    },
    setEvent: function(){
        if (this.titleActionNode){
            this.titleActionNode.addEvent("click", function(){
                this.fireEvent("cancel", this);
                this.close();
            }.bind(this));
        }
        if (this.titleCancelActionNode){
            this.titleCancelActionNode.addEvent("click", function(){
                this.fireEvent("cancel", this);
                this.close();
            }.bind(this));
        }
        if (this.titleOkActionNode){
            this.titleOkActionNode.addEvent("click", function(){
                this.fireEvent("complete", [this.selectedItems]);
                if( this.options.closeOnclickOk !== false )this.close();
            }.bind(this));
        }
    },
    close: function(){
        this.fireEvent("close");
        this.clearTooltip();
        this.node.destroy();
        //if (this.mask) this.mask.hide();
        if( !this.options.embedded ){
            (this.maskRelativeNode || this.container).unmask();
        }
        if (this.maskInterval){
            window.clearInterval(this.maskInterval);
            this.maskInterval = null;
        }
        this.active = false;
        MWF.release(this);
        delete this;
    },
    clearTooltip: function(){
        if( this.tooltips && this.tooltips.length ){
            this.tooltips.each(function (tooltip) {
                if(tooltip.destroy)tooltip.destroy();
            }.bind(this));
            this.tooltips = [];
        }
    },
    loadAction: function(){
        if( !this.okActionNode ){
            this.okActionNode = new Element("button", {
                "styles": this.css.okActionNode,
                "text": MWF.SelectorLP.ok
            }).inject(this.actionNode);
        }
        if( !this.cancelActionNode ){
            this.cancelActionNode = new Element("button", {
                "styles": this.css.cancelActionNode,
                "text": MWF.SelectorLP.cancel
            }).inject(this.actionNode);
        }
        this.okActionNode.addEvent("click", function(){
            this.fireEvent("complete", [this.selectedItems]);
            if( this.options.closeOnclickOk !== false )this.close();
        }.bind(this));
        this.cancelActionNode.addEvent("click", function(){this.fireEvent("cancel", this); this.close();}.bind(this));
    },
    loadContent: function( contentNode, isHTML ){

        this.selectedItemsMap = {};

        this.fireEvent("queryLoadContent",[this]);

        if( contentNode )this.contentNode = contentNode;
        if( this.options.contentUrl || isHTML ){
            if( layout.mobile ){
                this.loadSelectedNodeHTMLMobile();
                this.loadSelectNodeHTMLMobile(contentNode);
            }else{
                this.loadSelectNodeHTML(contentNode);
                this.loadSelectedNodeHTML();
            }
        }else{
            if (layout.mobile){
                this.loadSelectedNodeMobile();
                this.loadSelectNodeMobile();
                this.setSelectedItem();
            }else{
                this.loadSelectNode();
                if( this.options.hasShuttle ){
                    this.loadShuttleNode();
                }
                //if (this.options.count.toInt()!==1) this.loadSelectedNode();
                this.loadSelectedNode();
            }
        }
        this.fireEvent("postLoadContent", [this]);
    },
    getOffsetX : function(node){
        return (node.getStyle("margin-left").toInt() || 0 )+
            (node.getStyle("margin-right").toInt() || 0 ) +
            (node.getStyle("padding-left").toInt() || 0 ) +
            (node.getStyle("padding-right").toInt() || 0 ) +
            (node.getStyle("border-left-width").toInt() || 0 ) +
            (node.getStyle("border-right-width").toInt() || 0 );
    },
    getOffsetY : function(node){
        return (node.getStyle("margin-top").toInt() || 0 ) +
            (node.getStyle("margin-bottom").toInt() || 0 ) +
            (node.getStyle("padding-top").toInt() || 0 ) +
            (node.getStyle("padding-bottom").toInt() || 0 )+
            (node.getStyle("border-top-width").toInt() || 0 ) +
            (node.getStyle("border-bottom-width").toInt() || 0 );
    },
    loadSelectNodeHTML: function(contentNode){
        var size;
        var height;
        debugger;
        if( contentNode ){
            size = contentNode.getSize();
            height = size.y;
            if( height === 0 ){
                height = contentNode.getStyle("height").toInt();
            }
        }else{
            size = this.node.getSize();

            // var zoom = this.node.getStyle("zoom").toInt() || 0;
            // if( zoom ){
            //     size.x = size.x * 100 / zoom;
            //     size.y = size.y * 100 / zoom;
            // }

            height = size.y-this.getOffsetY( this.contentNode );
            if( this.titleNode ){
                height = height - this.getOffsetY( this.titleNode ) - ( this.titleNode.getStyle("height").toInt() || 0 )
            }
            if( this.actionNode ){
                height = height - this.getOffsetY( this.actionNode ) - ( this.actionNode.getStyle("height").toInt() || 0 )
            }

            this.contentNode.setStyle("height", ""+height+"px");
        }

        height = height - this.getOffsetY( this.selectNode );
        this.selectNode.setStyle("height", ""+height+"px");

        this.selectedContainerNode.setStyle("height", ""+height+"px");
        var selectedTopHeight = 0;
        if( this.selectedTopNode )selectedTopHeight = this.getOffsetY( this.selectedTopNode ) + ( this.selectedTopNode.getStyle("height").toInt() || 0 )
        this.selectedScrollNode.setStyle("height", ""+( height - selectedTopHeight )+"px");


        if( this.searchInput ){
            this.initSearchInput();
            height = height - this.getOffsetY( this.searchInputDiv ) - ( this.searchInputDiv.getStyle("height").toInt() || 0 )
        }

        if( this.options.hasLetter && this.letterAreaNode){
            if( this.letterAreaNode.offsetParent ){
                this.loadLetters();
                height = height - this.getOffsetY( this.letterAreaNode ) - ( this.letterAreaNode.getStyle("height").toInt() || 0 );
            }
        }

        this.itemAreaScrollNode.setStyle("height", ""+height+"px");
        this.itemAreaScrollNode.setStyle("overflow", "auto");

        if(this.itemSearchAreaScrollNode){
            this.itemSearchAreaScrollNode.setStyles({
                "display": "none",
                "height": ""+height+"px",
                "overflow" : "auto"
            });
        }
        this.itemSearchAreaNode.setStyle("display", "none");

        this.initLoadSelectItems();
        this.checkLoadSelectItems();
    },
    loadSelectedNodeHTML: function(){

        if( this.emptySelectedNode ){
            this.emptySelectedNode.addEvent("click", function () {
                this.emptySelectedItems()
            }.bind(this))
        }

        this.setSelectedItem();

        //if(this.selectedScrollNode)this.selectedScrollNode.setStyle("display", "none");
    },

    loadSelectNodeHTMLMobile: function(contentNode){
        var size;
        var height;
        if( contentNode ){
            size = contentNode.getSize();
            height = size.y;
            if( height === 0 ){
                height = contentNode.getStyle("height").toInt();
            }
        }else{
            var container = this.options.injectToBody ? $(document.body) : this.container;
            //var containerSize = this.container.getSize();
            //var bodySize = $(document.body).getSize();
            size = container.getSize();
            if(size.y === 0){
                size.y = $(document.body).getSize().y
            }

            //size = {
            //    "x" : Math.min( containerSize.x, bodySize.x ),
            //    "y" : Math.min( containerSize.y, bodySize.y )
            //};
            if(this.node){
                var zoom = this.node.getStyle("zoom").toInt() || 0;
                if( zoom ){
                    size.x = size.x * 100 / zoom;
                    size.y = size.y * 100 / zoom;
                }
                this.node.setStyles({
                    "width" : size.x+"px",
                    "height" : size.y+"px"
                })
            }
            height = size.y-this.getOffsetY( this.contentNode );
            if( this.titleNode ){
                height = height - this.getOffsetY( this.titleNode ) - ( this.titleNode.getStyle("height").toInt() || 0 )
            }
            if( this.actionNode ){
                height = height - this.getOffsetY( this.actionNode ) - ( this.actionNode.getStyle("height").toInt() || 0 )
            }

            this.contentNode.setStyle("height", ""+height+"px");
        }


        var isFormWithAction = window.location.href.toLowerCase().indexOf("workmobilewithaction.html") > -1;

        this.selectNode.setStyle("height", ""+height+"px");


        if( this.searchInput ){
            this.initSearchInput();
            height = height - this.getOffsetY( this.searchInputDiv ) - ( this.searchInputDiv.getStyle("height").toInt() || 0 )
        }

        if( this.options.hasLetter && this.letterAreaNode ){
            var width = size.x - 18;
            this.letterAreaNode.setStyle("width", "" + width + "px");
            this.loadLetters();
            height = height - this.getOffsetY( this.letterAreaNode ) - ( this.letterAreaNode.getStyle("height").toInt() || 0 )
        }

        this.itemAreaScrollNode.setStyle("height", ""+height+"px");
        this.itemAreaScrollNode.setStyle("overflow", "auto");

        if(this.itemSearchAreaScrollNode){
            this.itemSearchAreaScrollNode.setStyles({
                "display": "none",
                "height": ""+height+"px",
                "overflow" : "auto"
            });
        }
        this.itemSearchAreaNode.setStyle("display", "none");

        this.initLoadSelectItems();
        this.checkLoadSelectItems();
    },


    loadSelectNodeMobile: function(){
        this.selectNode = new Element("div.selectNode", {
            "styles": this.css.selectNodeMobile
        }).inject(this.contentNode);

        var containerSize = this.container.getSize();
        var bodySize = $(document.body).getSize();

        var size = {
            "x" : Math.min( containerSize.x, bodySize.x ),
            "y" : Math.min( containerSize.y, bodySize.y )
        };

        var height;
        if( !this.inMulitple ){
            var isFormWithAction = window.location.href.toLowerCase().indexOf("workmobilewithaction.html") > -1;

            var formActionY = 0;
            if( isFormWithAction ){
                // var formActions = document.getElement(".o2_form_mobile_actions");
                // if(formActions)formActionY = formActions.getSize().y - this.getOffsetY(formActions);
            }

            height = size.y - formActionY - this.titleNode.getSize().y - this.getOffsetY(this.titleNode);
            this.selectNode.setStyle("height", ""+height+"px");
        }


        this.searchInputDiv = new Element("div.searchInputDiv", {
            "styles": this.css.searchInputDiv
        }).inject(this.selectNode);
        this.searchInput = new Element("input.searchInput", {
            "styles": (this.options.count.toInt()===1 || this.options.noSelectedContainer) ? this.css.searchInputSingle : this.css.searchInput,
            "type": "text"
        }).inject(this.searchInputDiv);
        var width = size.x-20-18;
        this.searchInput.setStyle("width", ""+width+"px");
        this.searchInput.setStyle("height", "20px");
        this.initSearchInput();

        if( this.options.hasLetter ) {
            this.letterAreaNode = new Element("div", {
                "styles": this.css.letterAreaMobileNode
            }).inject(this.selectNode);
            width = size.x - 18;
            this.letterAreaNode.setStyle("width", "" + width + "px");
            this.loadLetters();
        }

        this.itemAreaScrollNode = new Element("div.itemAreaScrollNode", {
            "styles": this.css.itemAreaScrollNode
        }).inject(this.selectNode);

        this.loadSelectedCountNode();

        if( !this.inMulitple ) {
            var y = this.getOffsetY(this.itemAreaScrollNode);
            if (this.searchInputDiv) y = y + this.searchInputDiv.getSize().y + this.getOffsetY(this.searchInputDiv);
            if (this.letterAreaNode) y = y + this.letterAreaNode.getSize().y + this.getOffsetY(this.letterAreaNode);
            if (this.selectedCountNode) y = y + this.selectedCountNode.getSize().y + this.getOffsetY(this.selectedCountNode);

            height = height - y;

            this.itemAreaScrollNode.setStyle("height", "" + height + "px");

            if( this.itemSearchAreaScrollNode ){
                this.itemSearchAreaScrollNode.setStyle("height", "" + height + "px");
            }
        }
        this.itemAreaScrollNode.setStyle("overflow", "auto");

        this.itemAreaNode = new Element("div.itemAreaNode", {
            "styles": this.css.itemAreaNode
        }).inject(this.itemAreaScrollNode);
        this.itemSearchAreaNode = new Element("div.itemSearchAreaNode", {
            "styles": this.css.itemAreaNode
        }).inject(this.itemAreaScrollNode);
        this.itemSearchAreaNode.setStyle("display", "none");



        //MWF.require("MWF.widget.ScrollBar", function(){
        //    var _self = this;
        //    new MWF.widget.ScrollBar(this.itemAreaScrollNode, {
        //        "style":"xApp_Organization_Explorer",
        //        "where": "before",
        //        "distance": 30,
        //        "friction": 4,
        //        "axis": {"x": false, "y": true},
        //        "onScroll": function(y){
        //            _self._scrollEvent(y);
        //        }
        //    });
        //}.bind(this));
        this.initLoadSelectItems();
        this.checkLoadSelectItems();
    },
    loadSelectedNodeHTMLMobile: function(){

        this.setSelectedItem();

        //MWF.require("MWF.widget.ScrollBar", function(){
        //    var _self = this;
        //    new MWF.widget.ScrollBar(this.selectedScrollNode, {
        //        "style":"xApp_Organization_Explorer", "where": "before", "distance": 100, "friction": 4,"axis": {"x": false, "y": true}
        //    });
        //}.bind(this));
        if(this.selectedScrollNode)this.selectedScrollNode.setStyle("display", "none");
    },

    checkLoadSelectItems: function(){
        if (!this.options.groups.length && !this.options.roles.length){
            this.loadSelectItems();
        }else{
            this.loadSelectItemsByCondition();
        }
    },

    loadShuttleNode : function(){
        if(this.shuttleNode)return;

        this.shuttleNode = new Element("div.shuttleNode", {
            "styles": this.css.shuttleNode
        }).inject(this.contentNode);

        this.shuttleInnerNode = new Element("div.shuttleInnerNode", {
            "styles": this.css.shuttleInnerNode
        }).inject(this.shuttleNode);

        this.goRightNode = new Element("div.goRightNode", {
            "styles": this.css.goRightNode
        }).inject(this.shuttleInnerNode);

        this.goLeftNode = new Element("div.goLeftNode", {
            "styles": this.css.goLeftNode
        }).inject(this.shuttleInnerNode);

    },

    loadSelectNode: function(){
        this.selectNode = new Element("div.selectNode", {
            "styles": this.css.selectNode //(this.options.count.toInt()===1) ? this.css.selectNodeSingle : this.css.selectNode
        }).inject(this.contentNode);

        if( this.options.hasTop ){ //if( this.options.embedded && this.options.count.toInt()!==1 ){
            this.selectTopNode = new Element("div.selectTopNode",{
                "styles" : this.css.selectTopNode
            }).inject( this.selectNode );
            this.selectTopTextNode = new Element("div",{
                "text" : MWF.SelectorLP.waitingSelect,
                "styles" : this.css.selectTopTextNode
            }).inject( this.selectTopNode );
        }

        if( this.options.searchbarInTopNode ){
            this.searchInputDiv = new Element("div", {
                "styles": this.css.searchInputDiv
            }).inject( this.selectTopNode || this.selectNode);
        }else{
            this.searchInputDiv = new Element("div.searchInputDiv", {
                "styles": this.css.searchInputDiv
            }).inject( this.selectNode);
        }
        this.searchInput = new Element("input", {
            "styles": this.css.searchInput, //(this.options.count.toInt()===1) ? this.css.searchInputSingle : this.css.searchInput,
            "placeholder" : MWF.SelectorLP.searchDescription,
            "type": "text"
        }).inject(this.searchInputDiv);

        if( this.css.searchCancelAction ){
            this.searchCancelAction = new Element("div.searchCancelAction", {
                "styles": this.css.searchCancelAction
            }).inject( this.searchInputDiv);
        }
        this.initSearchInput();

        if( this.options.hasLetter ){
            this.letterAreaNode = new Element("div", {
                "styles": this.css.letterAreaNode
            }).inject(this.selectNode);
            this.loadLetters();
        }

        this.itemAreaScrollNode = new Element("div", {
            "styles": this.css.itemAreaScrollNode
        }).inject(this.selectNode);

        this.itemAreaNode = new Element("div", {
            "styles": this.css.itemAreaNode
        }).inject(this.itemAreaScrollNode);
        this.itemSearchAreaNode = new Element("div", {
            "styles": this.css.itemAreaNode
        }).inject(this.itemAreaScrollNode);
        this.itemSearchAreaNode.setStyle("display", "none");

        this.loadSelectNodeScroll();
        this.initLoadSelectItems();
        this.checkLoadSelectItems();
    },
    loadSelectNodeScroll: function(){
        var overflowY = this.itemAreaScrollNode.getStyle("overflow-y");
        if( typeOf(overflowY)==="string" && (overflowY.toLowerCase() === "auto" || overflowY.toLowerCase() === "scroll") )return;
        MWF.require("MWF.widget.ScrollBar", function(){
            var _self = this;
            new MWF.widget.ScrollBar(this.itemAreaScrollNode, {
                "style":"xApp_Organization_Explorer",
                "where": "before",
                "distance": 30,
                "friction": 4,
                "axis": {"x": false, "y": true},
                "onScroll": function(y){
                    _self._scrollEvent(y);
                }
            });
        }.bind(this));
    },
    initSearchInput: function(){
        this.searchInput.addEvents({
            "keydown": function(e){
                var iTimerID = this.searchInput.retrieve("searchTimer", null);
                if (iTimerID){
                    window.clearTimeout(iTimerID);
                    this.searchInput.eliminate("searchTimer");
                }

                iTimerID = window.setTimeout(function(){
                    this.search();
                }.bind(this), 800);

                this.searchInput.store("searchTimer", iTimerID);
                if(this.searchCancelAction)this.searchCancelAction.show();
            }.bind(this),
            "change": function(e){
                var key = this.searchInput.get("value");
                if (!key) this.initSearchArea(false);
                if(this.searchCancelAction)this.searchCancelAction[ key ? "show" : "hide" ]();
            }.bind(this),
            "blur": function(){
                var key = this.searchInput.get("value");
                if (!key) this.initSearchArea(false);
                if(this.searchCancelAction)this.searchCancelAction[ key ? "show" : "hide" ]();
            }.bind(this)
        });

        if( this.letterActionNode ){
            this.letterActionNode.addEvent("click", function () {
                this.switchLetterArea()
            }.bind(this))
        }

        if( this.searchCancelAction && this.searchInput ){
            this.searchCancelAction.addEvent("click", function () {
                this.searchInput.set("value", "");
                this.searchInput.focus();
                this.initSearchArea(false);
                this.searchCancelAction.hide();
            }.bind(this))
        }

    },

    initSearchArea: function(flag){
        this.searchItems = [];
        if (flag){
            this.itemSearchAreaNode.empty();
            this.itemAreaNode.setStyle("display", "none");
            if( this.itemSearchAreaNode.getParent() !== this.itemAreaScrollNode ){
                this.itemAreaScrollNode.setStyle("display", "none");
            }
            if(this.flatCategoryScrollNode){
                this.flatCategoryScrollNode.setStyle("display", "none");
            }
            if( this.itemSearchAreaScrollNode )this.itemSearchAreaScrollNode.setStyle("display", "block");
            this.itemSearchAreaNode.setStyle("display", "block");
        }else{
            this.itemAreaScrollNode.setStyle("display", "block");
            this.itemAreaNode.setStyle("display", "block");
            if(this.flatCategoryScrollNode && this.flatSubCategoryNodeList && this.flatSubCategoryNodeList.length > 1 ){
                this.flatCategoryScrollNode.setStyle("display", "block");
            }
            if( this.itemSearchAreaScrollNode )this.itemSearchAreaScrollNode.setStyle("display", "none");
            this.itemSearchAreaNode.setStyle("display", "none");
        }
    },

    search: function(){
        if (!this.options.groups.length && !this.options.roles.length && !this.options.forceSearchInItem ){
            var key = this.searchInput.get("value");
            if (key){
                this._listItemByKey(function(json){
                    this.initSearchArea(true);
                    json.data.each(function(data){
                        if( !this.isExcluded( data ) ) {
                            var itemSearch = this._newItemSearch(data, this, this.itemSearchAreaNode);
                            this.searchItems.push( itemSearch );
                        }
                        //this._newItem(data, this, this.itemSearchAreaNode);
                    }.bind(this));
                }.bind(this), null, key);
            }else{
                this.initSearchArea(false);
            }
        }else{
            var key = this.searchInput.get("value");
            if (key){
                this.initSearchArea(true);
                this.searchInItems(key);
            }else{
                this.initSearchArea(false);
            }
        }
    },
    searchInItems: function(key){

        var createdId = [];
        this.createItemsSearchData(function(){
            var word = key.toLowerCase();

            this.itemsSearchData.each(function(obj){
                var text = obj.text+"#"+obj.pinyin+"#"+obj.firstPY;
                var id = obj.data.distinguishedName || obj.data.id || obj.data.name || obj.data.text;
                if (text.indexOf(word)!==-1){
                    if (createdId.indexOf( id )===-1){
                        this._newItem(obj.data, this, this.itemSearchAreaNode);
                        createdId.push( id );
                    }
                }
            }.bind(this));

            //delete createdId;
        }.bind(this));
        return createdId;
    },
    createItemsSearchData: function(callback){
        if (!this.itemsSearchData){
            this.itemsSearchData = [];
            MWF.require("MWF.widget.PinYin", function(){
                var initIds = [];
                this.items.each(function(item){
                    var id = item.data.distinguishedName || item.data.id || item.data.name || item.data.text;
                    if (initIds.indexOf( id )==-1){
                        var text = item._getShowName().toLowerCase();
                        var pinyin = text.toPY().toLowerCase();
                        var firstPY = text.toPYFirst().toLowerCase();
                        this.itemsSearchData.push({
                            "text": text,
                            "pinyin": pinyin,
                            "firstPY": firstPY,
                            "data": item.data
                        });
                        initIds.push( id );
                    }
                }.bind(this));
                delete initIds;
                if (callback) callback();
            }.bind(this));
        }else{
            if (callback) callback();
        }
    },


    initSelectedSearchInput: function(){
        this.selectedSearchInput.addEvents({
            "keydown": function(e){
                var iTimerID = this.selectedSearchInput.retrieve("searchTimer", null);
                if (iTimerID){
                    window.clearTimeout(iTimerID);
                    this.selectedSearchInput.eliminate("searchTimer");
                }

                iTimerID = window.setTimeout(function(){
                    this.selectedSearch();
                }.bind(this), 800);

                this.selectedSearchInput.store("searchTimer", iTimerID);
                if(this.selectedSearchCancelAction)this.selectedSearchCancelAction.show();
            }.bind(this),
            "change": function(e){
                var key = this.selectedSearchInput.get("value");
                if (!key) this.selectedSearch();
                if(this.selectedSearchCancelAction)this.selectedSearchCancelAction[ key ? "show" : "hide" ]();
            }.bind(this),
            "blur": function(){
                var key = this.selectedSearchInput.get("value");
                if (!key) this.selectedSearch();
                if(this.selectedSearchCancelAction)this.selectedSearchCancelAction[ key ? "show" : "hide" ]();
            }.bind(this)
        });

        if( this.selectedSearchCancelAction && this.selectedSearchInput ){
            this.selectedSearchCancelAction.addEvent("click", function () {
                this.selectedSearchInput.set("value", "");
                this.selectedSearchInput.focus();
                this.selectedSearch();
                this.selectedSearchCancelAction.hide();
            }.bind(this))
        }
    },

    selectedSearch: function(){
        var key = this.selectedSearchInput.get("value");
        if (key){
            this.selectedSearchInItems(key);
        }else{
            this.showAllSelectedItem()
        }
    },
    selectedSearchInItems: function(key){
        var word = key.toLowerCase();
        MWF.require("MWF.widget.PinYin", function() {
            this.selectedItems.each(function (item) {
                if (!item.searchedText) {
                    var text = item._getShowName().toLowerCase();
                    var pinyin = text.toPY().toLowerCase();
                    var firstPY = text.toPYFirst().toLowerCase();
                    item.searchedText = text + "#" + pinyin + "#" + firstPY
                }
                if (item.searchedText.indexOf(word) !== -1) {
                    item.node.show()
                } else {
                    item.node.hide()
                }
            }.bind(this));
        }.bind(this), null, false);
    },
    showAllSelectedItem: function(){
        this.selectedItems.each(function(item){
            item.node.show()
        })
    },

    loadSelectedNode: function( callback ){
        if( this.selectedContainerNode )return;
        this.selectedContainerNode = new Element("div", {
            "styles": this.css.selectedContainerNode
        }).inject(this.contentNode);

        if( this.options.noSelectedContainer ){
            this.selectedContainerNode.hide();
        }

        //if( this.options.embedded && this.options.count.toInt()!==1 ){
        if( this.options.hasTop ){
            this.selectedTopNode = new Element("div",{
                "styles" : this.css.selectedTopNode
            }).inject( this.selectedContainerNode );
            this.selectedTopTextNode = new Element("div",{
                "text" : MWF.SelectorLP.selected,
                "styles" : this.css.selectedTopTextNode
            }).inject( this.selectedTopNode );

            this.emptySelectedNode = new Element("div",{
                "text" : MWF.SelectorLP.empty,
                "styles" : this.css.selectedTopActionNode,
                "events" : {
                    "click" : function(){
                        this.emptySelectedItems()
                    }.bind(this)
                }
            }).inject( this.selectedTopNode );
        }

        if( this.options.hasSelectedSearchbar ){
            if( this.options.searchbarInTopNode ){
                this.selectedSearchInputDiv = new Element("div", {
                    "styles": this.css.searchInputDiv
                }).inject( this.selectedTopNode || this.selectedContainerNode);
            }else{
                this.selectedSearchInputDiv = new Element("div.selectedSearchInputDiv", {
                    "styles": this.css.searchInputDiv
                }).inject( this.selectedContainerNode);
            }
            this.selectedSearchInput = new Element("input", {
                "styles": this.css.searchInput, //(this.options.count.toInt()===1) ? this.css.searchInputSingle : this.css.searchInput,
                "placeholder" : MWF.SelectorLP.searchDescription,
                "type": "text"
            }).inject(this.selectedSearchInputDiv);

            if( this.css.searchCancelAction ){
                this.selectedSearchCancelAction = new Element("div.selectedSearchCancelAction", {
                    "styles": this.css.searchCancelAction
                }).inject( this.selectedSearchInputDiv);
            }
            this.initSelectedSearchInput();
        }

        this.selectedScrollNode = new Element("div.selectedScrollNode", {
            "styles": this.css.selectedScrollNode
        }).inject(this.selectedContainerNode);

        this.selectedNode = new Element("div.selectedNode", {
            "styles": this.css.selectedNode
        }).inject(this.selectedScrollNode);

        if( this.options.hasSelectedSearchbar ){
            this.selectedItemSearchAreaNode = new Element("div.selectedItemSearchAreaNode", {
                "styles": this.css.itemAreaNode
            }).inject(this.selectedScrollNode);
            this.selectedItemSearchAreaNode.setStyle("display", "none");
        }

        this.setSelectedItem();

        this.loadSelectedNodeScroll();

        if(callback)callback();
    },
    emptySelectedItems : function(){
        while (this.selectedItems.length){
            this.selectedItems[0].clickItem();
        }
    },
    loadSelectedNodeScroll: function(){
        var overflowY = this.selectedScrollNode.getStyle("overflow-y");
        if( typeOf(overflowY)==="string" && (overflowY.toLowerCase() === "auto" || overflowY.toLowerCase() === "scroll") )return;
        MWF.require("MWF.widget.ScrollBar", function(){
            var _self = this;
            new MWF.widget.ScrollBar(this.selectedScrollNode, {
                "style":"xApp_Organization_Explorer", "where": "before", "distance": 100, "friction": 4,"axis": {"x": false, "y": true}
            });
        }.bind(this));
    },

    loadSelectedNodeMobile: function(){
        if( this.inMulitple )return;
        this.css.selectedWrapNodeMobile["z-index"] = this.options.zIndex + 2;
        this.selectedWrapNode = new Element("div.selectedWrapNode", {
            "styles": this.css.selectedWrapNodeMobile
        }).inject(this.contentNode);

        this.selectedTitleNode = new Element("div.selectedTitleNodeMobile", {
            "styles": this.css.selectedTitleNodeMobile
        }).inject(this.selectedWrapNode);
        this.selectedTitleLabelNode = new Element("span", {
            "style": "font-weight:bold; padding-right:5px;",
            "text": MWF.SelectorLP.selected2
        }).inject(this.selectedTitleNode);
        this.selectedTitleCountNode = new Element("span", {
            "text": "(0)"
        }).inject(this.selectedTitleNode);

        this.selectedScrollNode = new Element("div.selectedScrollNode", {
            "styles": this.css.selectedScrollNodeMobile
        }).inject(this.selectedWrapNode);


        this.selectedNode = new Element("div.selectedNode", {
            "styles": this.css.selectedNodeMobile
        }).inject(this.selectedScrollNode);

        // MWF.require("MWF.widget.ScrollBar", function(){
        //     var _self = this;
        //     new MWF.widget.ScrollBar(this.selectedScrollNode, {
        //         "style":"xApp_Organization_Explorer", "where": "before", "distance": 100, "friction": 4,"axis": {"x": false, "y": true}
        //     });
        // }.bind(this));
        this.selectedWrapNode.setStyle("display", "none");
    },

    setSelectedItem: function(){
        if (this.options.values.length){
            this.options.values.each(function(v, i){
                if (typeOf(v)==="object"){
                    v.isFromValues = true;
                    var selecteditem = this._newItemSelected(v, this, null);
                    this.selectedItems.push(selecteditem);
                    if(this.addToSelectedItemsMap)this.addToSelectedItemsMap(v, selecteditem);
                }else if( typeOf(v)==="string" ){
                    var fun = function(json){
                        if( !json || !json.data )return;
                        this.options.values[i] = json.data;
                        json.data.isFromValues = true;
                        var selecteditem = this._newItemSelected(json.data, this, null);
                        this.selectedItems.push(selecteditem);
                        if(this.addToSelectedItemsMap)this.addToSelectedItemsMap(json.data, selecteditem);
                    }.bind(this);
                    if( this.options.resultType === "person" && this.selectType === "identity" && v.split("@").getLast().toLowerCase() === "p" ){
                        this.orgAction.getPerson(function(json){
                            fun(json);
                        }.bind(this), null, v, false);
                    }else{
                        this._getItem(fun, null, v, false);
                    }
                }
                // this._getItem(function(json){
                // 	this.selectedItems.push(this._newItemSelected(json.data, this, null));
                // }.bind(this), null, v, false);
            }.bind(this));
        }
    },

    setValues: function( values ){
        this.emptySelectedItems();
        this.options.values = values;
        this.setSelectedItem();
    },

    loadLetters: function(){
        if( this.lettersLoaded )return;
        this.lettersLoaded = true;

        var _self = this;
        var letters = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];

        var letterNodeCss = this.css.letterNode;
        var letterNodeCss_over = this.css.letterNode_over;
        if (layout.mobile){
            letterNodeCss = this.css.letterNode_mobile || letterNodeCss;
            letterNodeCss_over = this.css.letterNode_mobile_over || letterNodeCss_over;
            var size = this.container.getSize();
            // var w = (layout.mobile) ? (size.x-18)/13 : (size.x-20-4-18)/13;
            var w = (layout.mobile) ? (size.x - this.getOffsetX(this.container) - this.getOffsetX(this.letterAreaNode) - 10 )/13 : (size.x-20-4-18)/13;
            //letterNode.setStyle("width", ""+w+"px");
            letterNodeCss.width = ""+w+"px";
            letterNodeCss_over.width = ""+w+"px";
        }else if( this.options.style === "flow" ){
            var width = ( this.letterAreaNode.getSize().x - this.getOffsetX(this.letterAreaNode) - 10 ) / 13;
            letterNodeCss.width = ""+width+"px";
            letterNodeCss_over.width = ""+width+"px";
        }

        letters.each(function(l){
            var letterNode = new Element("div", {
                "styles": letterNodeCss,
                "text": l
            }).inject(this.letterAreaNode);

            if (layout.mobile){
                letterNode.addEvents({
                    "click": function(){
                        _self.listPersonByPinyin(this);
                        if(_self.searchCancelAction)_self.searchCancelAction.show();
                    }
                });
            }else{
                letterNode.addEvents({
                    "mouseover": function(e){
                        e.target.setStyles(letterNodeCss_over);
                        var showNode = new Element("div", {
                            "styles": this.css.letterShowNode,
                            "text": e.target.get("text")
                        }).inject(this.selectNode);
                        showNode.position({
                            relativeTo: this.itemAreaScrollNode,
                            position: "center",
                            edge: "center"
                        });
                        e.target.store("showNode", showNode);
                    }.bind(this),
                    "mouseout": function(e){
                        var showNode = e.target.retrieve("showNode");
                        showNode.destroy();
                        e.target.setStyles(letterNodeCss);
                    }.bind(this),
                    "click": function(){
                        _self.listPersonByPinyin(this);
                        if(_self.searchCancelAction)_self.searchCancelAction.show();
                    }
                });
            }

        }.bind(this));
    },

    listPersonByPinyin: function(node){
        this.searchInput.focus();
        var pinyin = this.searchInput.get("value");
        pinyin = pinyin+node.get("text");
        this.searchInput.set("value", pinyin);

        if (!this.options.groups.length && !this.options.roles.length){
            if (pinyin){
                this._listItemByPinyin(function(json){
                    this.initSearchArea(true);
                    json.data.each(function(data){
                        // var flag = true;
                        // if (this.options.departments){
                        //     if (this.options.departments.length){
                        //         if (this.options.departments.indexOf(data.departmentName)==-1) flag = false;
                        //     }
                        // }
                        // if (this.options.companys){
                        //     if (this.options.companys.length){
                        //         if (this.options.companys.indexOf(data.company)==-1) flag = false;
                        //     }
                        // }
                        if( !this.isExcluded( data ) ) {
                            this._newItemSearch(data, this, this.itemSearchAreaNode);
                        }
                        //this._newItem(data, this, this.itemSearchAreaNode);
                        //this._newItem(data, this, this.itemSearchAreaNode);
                    }.bind(this));
                }.bind(this), null, pinyin.toLowerCase());
            }
        }else{
            if (pinyin){
                this.initSearchArea(true);
                this.searchInItems(pinyin);
            }else{
                this.initSearchArea(false);
            }
        }
    },
    initLoadSelectItems: function(){
        this.loaddingItems = false;
        this.isItemLoaded = false;
        this.loadItemsQueue = 0;
        this.initSearchArea(false);
    },
    //loadSelectItems: function(addToNext){
    //    if (!this.isItemLoaded){
    //        if (!this.loaddingItems){
    //            this.loaddingItems = true;
    //            var count = 20;
    //            this._listItemNext(this.getLastLoadedItemId(), count, function(json){
    //                if (json.data.length){
    //                    json.data.each(function(data){
    //                        var item = this._newItem(data, this, this.itemAreaNode);
    //                        this.items.push(item);
    //                    }.bind(this));
    //                    this.loaddingItems = false;
    //
    //                    if (json.data.length<count){
    //                        this.isItemLoaded = true;
    //                    }else{
    //                        if (this.loadItemsQueue>0){
    //                            this.loadItemsQueue--;
    //                            this.loadSelectItems();
    //                        }
    //                    }
    //                }else{
    //                    this.isItemLoaded = true;
    //                    this.loaddingItems = false;
    //                }
    //            }.bind(this));
    //        }else{
    //            if (addToNext) this.loadItemsQueue++;
    //        }
    //    }
    //},
    loadSelectItems: function(addToNext, lastExcludeCount ){
        //lastExcludeCount 参数：表示本次加载是为了补足上次load的时候被排除的数量
        if (!this.isItemLoaded){
            if (!this.loaddingItems){
                this.loaddingItems = true;
                var count = 20;
                this._listItemNext(this.getLastLoadedItemId(), count, function(json){
                    if (json.data.length){
                        var excludedCount = 0;
                        json.data.each(function(data, i){
                            if( this.isExcluded( data ) ){
                                excludedCount++;
                                if( i+1 === count )this.tailExcludeItemId = data.distinguishedName
                            }else{
                                var item = this._newItem(data, this, this.itemAreaNode);
                                this.items.push(item);
                                if( i+1 === count )this.tailExcludeItemId = null;
                            }
                        }.bind(this));
                        this.loaddingItems = false;

                        if( lastExcludeCount ){ //如果是因为上次load的时候被排除而加载的
                            if( count - lastExcludeCount - excludedCount < 0 ){ //如果本次load的数量还不够补足排除的数量，需要再次load
                                excludedCount = lastExcludeCount + excludedCount - count; //把不足的数量作为再次load的参数
                                this.loadItemsQueue++
                            }
                        }else if( excludedCount > 0  ){ //把排除的数量作为再次load的参数
                            this.loadItemsQueue++
                        }
                        if (json.data.length<count){
                            this.isItemLoaded = true;
                        }else{
                            if (this.loadItemsQueue>0){
                                this.loadItemsQueue--;
                                this.loadSelectItems( addToNext, excludedCount );
                            }
                        }
                    }else{
                        this.isItemLoaded = true;
                        this.loaddingItems = false;
                    }
                    if( this.afterLoadSelectItem )this.afterLoadSelectItem();
                }.bind(this));
            }else{
                if (addToNext) this.loadItemsQueue++;
            }
        }
    },
    getLastLoadedItemId: function(){
        if( this.tailExcludeItemId )return this.tailExcludeItemId;
        return (this.items.length) ? this.items[this.items.length-1].data.distinguishedName : "(0)";
    },

    //loadSelectItemsByCondition: function(){
    //    this.options.groups.each(function(group){
    //
    //        this.orgAction.listGroupByKey(function(json){
    //            if (json.data.length){
    //                var groupData = json.data[0];
    //                var category = this._newItemCategory("ItemGroupCategory", groupData, this, this.itemAreaNode);
    //                this._getChildrenItemIds(groupData).each(function(id){
    //                    this._getItem(function(json){
    //                        var item = this._newItem(json.data, this, category.children);
    //                        this.items.push(item);
    //                    }.bind(this), null, id);
    //                }.bind(this));
    //            }
    //        }.bind(this), null, group);
    //    }.bind(this));
    //
    //    this.options.roles.each(function(role){
    //        this.orgAction.listRoleByKey(function(json){
    //            if (json.data.length){
    //                var roleData = json.data[0];
    //                var category = this._newItemCategory("ItemRoleCategory", roleData, this, this.itemAreaNode);
    //                this._getChildrenItemIds(roleData).each(function(id){
    //                    this._getItem(function(json){
    //                        var item = this._newItem(json.data, this, category.children);
    //                        this.items.push(item);
    //                    }.bind(this), null, id)
    //                }.bind(this));
    //            }
    //        }.bind(this), null, role);
    //    }.bind(this));
    //},
    loadSelectItemsByCondition: function(){
        this.options.groups.each(function(group){
            this.orgAction.listGroupByKey(function(json){
                if (json.data.length){
                    var groupData = json.data[0];
                    var category = this._newItemCategory("ItemGroupCategory", groupData, this, this.itemAreaNode);
                    this.subCategorys.push(category);
                    this._getChildrenItemIds(groupData).each(function(id){
                        this._getItem(function(json){
                            if( !this.isExcluded( json.data ) ) {
                                var item = this._newItem(json.data, this, category.children);
                                this.items.push(item);
                            }
                        }.bind(this), null, id);
                    }.bind(this));
                }
            }.bind(this), null, group);
        }.bind(this));

        this.options.roles.each(function(role){
            this.orgAction.listRoleByKey(function(json){
                if (json.data.length){
                    var roleData = json.data[0];
                    var category = this._newItemCategory("ItemRoleCategory", roleData, this, this.itemAreaNode);
                    this.subCategorys.push(category);
                    this._getChildrenItemIds(roleData).each(function(id){
                        this._getItem(function(json){
                            if( !this.isExcluded( json.data ) ) {
                                var item = this._newItem(json.data, this, category.children);
                                this.items.push(item);
                            }
                        }.bind(this), null, id)
                    }.bind(this));
                }
            }.bind(this), null, role);
        }.bind(this));
    },
    isInValues: function(d){
        if( this.options.values.length === 0 )return false;
        if( !this.valueFlagMap ){
            this.valueFlagMap = {};
            this.options.values.each( function( e ){
                if( !e )return;
                this.valueFlagMap[ typeOf( e ) === "string" ? e : ( e.distinguishedName || e.unique || e.employee || e.levelName || e.id) ] = true;
            }.bind(this));
        }
        var map = this.valueFlagMap;
        return ( d.distinguishedName && map[ d.distinguishedName ] ) ||
            ( d.unique && map[ d.unique ] ) ||
            ( d.employee && map[ d.employee ] ) ||
            ( d.levelName && map[ d.levelName ] ) ||
            ( d.id && map[ d.id ] );
    },
    isExcluded : function( d ){
        if( this.options.exclude.length === 0 )return false;
        if( !this.excludeFlagMap ){
            this.excludeFlagMap = {};
            this.options.exclude.each( function( e ){
                if( !e )return;
                this.excludeFlagMap[ typeOf( e ) === "string" ? e : ( e.distinguishedName || e.unique || e.employee || e.levelName || e.id ) ] = true;
            }.bind(this));
        }
        var map = this.excludeFlagMap;
        return ( d.distinguishedName && map[ d.distinguishedName ] ) ||
            ( d.id && map[ d.id ] ) ||
            ( d.unique && map[ d.unique ] ) ||
            ( d.employee && map[ d.employee ] ) ||
            ( d.levelName && map[ d.levelName ] );
    },
    _getChildrenItemIds: function(data){
        return data.personList;
    },
    _newItemCategory: function(type, data, selector, item){
        return new MWF.xApplication.Selector.Person[type](data, selector, item)
    },

    _listItemByKey: function(callback, failure, key){
        this.orgAction.listPersonByKey(function(json){
            if (callback) callback.apply(this, [json]);
        }.bind(this), failure, key);
    },
    _getItem: function(callback, failure, id, async){

        this.orgAction.getPerson(function(json){
            if (callback) callback.apply(this, [json]);
        }.bind(this), failure, ((typeOf(id)==="string") ? id : id.distinguishedName), async);
    },
    _newItemSelected: function(data, selector, item, selectedNode){
        return new MWF.xApplication.Selector.Person.ItemSelected(data, selector, item, selectedNode)
    },
    _listItemByPinyin: function(callback, failure, key){
        this.orgAction.listPersonByPinyin(function(json){
            if (callback) callback.apply(this, [json]);
        }.bind(this), failure, key);
    },
    _newItem: function(data, selector, container){
        return new MWF.xApplication.Selector.Person.Item(data, selector, container);
    },
    _newItemSearch: function(data, selector, container){
        return this._newItem(data, selector, container);
    },
    _listItemNext: function(last, count, callback){
        this.orgAction.listPersonNext(last, count, function(json){
            if (callback) callback.apply(this, [json]);
        }.bind(this));
    },
    _scrollEvent: function(y){
        if (!this.options.groups.length && !this.options.roles.length){
            var scrollSize = this.itemAreaScrollNode.getScrollSize();
            var clientSize = this.itemAreaScrollNode.getSize();
            var scrollHeight = scrollSize.y-clientSize.y;
            if (y+30>scrollHeight) {
                if (!this.isItemLoaded) this.loadSelectItems();
            }
        }
    },
    afterLoadSelectItem : function(){
        if( this.items.length === 0 && this.subItems.length === 0 && this.subCategorys.length === 0 ){
            this.noSelectableItemTextDiv = new Element("div", {
                text : MWF.SelectorLP.noSelectableItemText,
                styles : this.css.noSelectableItemText
            }).inject( this.itemAreaNode );
        }

        if( this.options.selectSingleItem ){
            this.selectSingleItem()
        }
        this.fireEvent("afterLoadSelectItem", [this]);
    },
    selectSingleItem: function(){
        if( !this.options.contentUrl && !layout.mobile){
            if( this.options.hasShuttle && !this.shuttleNode ){
                this.loadShuttleNode();
            }
            if( !this.selectedContainerNode ) {
                this.loadSelectedNode(function () {
                    this._selectSingleItem();
                }.bind(this));
            }else{
                this._selectSingleItem();
            }
        }else{
            this._selectSingleItem();
        }
    },
    _selectSingleItem : function(){
        var _self = this;
        var checkItem = function () {
            if(this.items.length === 1 || this.subItems.length === 1 ){
                if( this.items.length === 1 && this.subItems.length === 0 ){
                    if( !this.items[0].isSelected )this.items[0].clickItem();
                    this.fireEvent("afterSelectSingleItem",[this, this.items[0]]);
                }else if( this.items.length === 0 && this.subItems.length === 1 ){
                    if( !this.items[0].isSelected )this.subItems[0].clickItem();
                    this.fireEvent("afterSelectSingleItem",[this, this.items[0]])
                }else if( this.items.length === 1 && this.subItems.length === 1 ){
                    if( this.items[0] === this.subItems[0] ){
                        if( !this.items[0].isSelected )this.items[0].clickItem();
                        this.fireEvent("afterSelectSingleItem",[this, this.items[0]])
                    }else{
                        _self.fireEvent("afterCheckSelectSingleItem",[_self])
                    }
                }else{
                    _self.fireEvent("afterCheckSelectSingleItem",[_self])
                }
            }else{
                _self.fireEvent("afterCheckSelectSingleItem",[_self])
            }
        }.bind(this);

        var checkCategoryItem = function (category) {
            if( !category.subCategorys || category.subCategorys.length === 0 ){
                if( category.subItems && category.subItems.length === 1 ){
                    isSingleItem = true;
                    if( !category.subItems[0].isSelected )category.subItems[0].clickItem();
                    _self.fireEvent("afterSelectSingleItem",[_self, category.subItems[0]])
                }else{
                    _self.fireEvent("afterCheckSelectSingleItem",[_self])
                }
            }else if(category.subCategorys.length === 1){
                if( category.subItems && category.subItems.length > 0 ){
                    _self.fireEvent("afterCheckSelectSingleItem",[_self])
                }else if( !category.subCategorys[0]._hasChild || !category.subCategorys[0]._hasChild() ){ //category.subCategorys[0].isItem &&
                    isSingleItem = true;
                    if( !category.subItems[0].isSelected )category.subItems[0].clickItem();
                    _self.fireEvent("afterSelectSingleItem",[_self, category.subItems[0]])
                }else{
                    checkCategory( category.subCategorys[0] )
                }
            }else{
                var list = [];
                for( var i=0; i<category.subCategorys.length; i++ ){
                    if( category.subCategorys[i]._hasChild && category.subCategorys[i]._hasChild()  ){
                        list.push( category.subCategorys[i] );
                    }
                }
                if( list.length === 1 ){
                    if( !category.subItems || category.subItems.length === 0 ){
                        checkCategory( list[0] );
                    }
                }
                if( list.length === 0 ){
                    if( category.subItems && category.subItems.length === 1 ){
                        isSingleItem = true;
                        if( !category.subItems[0].isSelected )category.subItems[0].clickItem();
                        _self.fireEvent("afterSelectSingleItem",[_self, category.subItems[0]])
                    }else{
                        _self.fireEvent("afterCheckSelectSingleItem",[_self])
                    }
                }else{
                    _self.fireEvent("afterCheckSelectSingleItem",[_self])
                }
            }
        };


        var checkCategory = function ( category ) {
            if( category.loaded ){
                checkCategoryItem( category )
            }else if( category.loading ){
                window.setTimeout( function () {
                    checkCategory( category )
                }, 100 )
            }
        };

        if( this.subCategorys.length === 1 && this.subItems.length === 0) {
            checkCategory( this.subCategorys[0] );
        }else if( this.subCategorys.length === 0 ){
            checkItem();
        }else{
            _self.fireEvent("afterCheckSelectSingleItem",[_self])
        }
    },
    setSize : function(){

        if( !this.options.width && !this.options.height )return;

        var getOffsetX = function(node){
            return (node.getStyle("margin-left").toInt() || 0 )+
                (node.getStyle("margin-right").toInt() || 0 ) +
                (node.getStyle("padding-left").toInt() || 0 ) +
                (node.getStyle("padding-right").toInt() || 0 ) +
                (node.getStyle("border-left-width").toInt() || 0 ) +
                (node.getStyle("border-right-width").toInt() || 0 );
        };

        var getOffsetY = function(node){
            return (node.getStyle("margin-top").toInt() || 0 ) +
                (node.getStyle("margin-bottom").toInt() || 0 ) +
                (node.getStyle("padding-top").toInt() || 0 ) +
                (node.getStyle("padding-bottom").toInt() || 0 )+
                (node.getStyle("border-top-width").toInt() || 0 ) +
                (node.getStyle("border-bottom-width").toInt() || 0 );
        };


        if( this.options.width && this.options.width === "auto" ){
            //if (this.options.count.toInt() !== 1){
            if( this.node )this.node.setStyle("width", "auto");

            this.selectNode.setStyles({
                "width": "50%",
                "float" : "left"
            });
            //this.searchInput.setStyle("width", "99%");
            if(this.letterAreaNode ){
                this.letterAreaNode.setStyle("width", "auto");
            }

            this.selectedContainerNode.setStyle("width", "auto");
            var overflowY = this.selectedScrollNode.getStyle("overflow-y");
            if( typeOf(overflowY)==="string" && (overflowY.toLowerCase() === "auto" || overflowY.toLowerCase() === "scroll") ){
                this.selectedScrollNode.setStyle("width", "auto");
            }else{
                this.selectedScrollNode.setStyle("margin-right", "8px");
            }
            //}else{
            //    this.node.setStyle("width", "auto");
            //    this.selectNode.setStyle("width", "auto");
            //}

        }else if( this.options.width && typeOf( this.options.width.toInt() ) === "number" ){
            var nodeWidth;
            if( this.node ){
                nodeWidth = this.options.width.toInt() - getOffsetX(this.node);
                this.node.setStyle("width", nodeWidth);
            }else{
                nodeWidth = this.options.width.toInt();
            }

            nodeWidth = nodeWidth - getOffsetX( this.contentNode );

            if( this.shuttleNode ){
                nodeWidth = nodeWidth - getOffsetX(this.shuttleNode) - this.shuttleNode.getStyle("width").toInt();
            }

            //if (this.options.count.toInt() !== 1){
            var width = nodeWidth - getOffsetX(this.selectNode) - getOffsetX(this.selectedContainerNode);

            var halfWidth = this.options.noSelectedContainer ? width : ( Math.floor(width / 2) - 2);

            this.selectNode.setStyle("width", halfWidth);
            //this.searchInput.setStyle("width", halfWidth - 6);
            if(this.letterAreaNode ){
                this.letterAreaNode.setStyle("width", halfWidth - 19);
            }

            this.selectedContainerNode.setStyle("width", halfWidth);

            var overflowY = this.selectedScrollNode.getStyle("overflow-y");
            if( typeOf(overflowY)==="string" && (overflowY.toLowerCase() === "auto" || overflowY.toLowerCase() === "scroll") ){
                this.selectedScrollNode.setStyle("width", halfWidth);
            }else{
                this.selectedScrollNode.setStyle("width", halfWidth - 8);
            }
            //}else{
            //    var width = nodeWidth - getOffsetX(this.selectNode);
            //    this.selectNode.setStyle("width", width);
            //}
        }

        if( this.options.height && typeOf( this.options.height.toInt() ) === "number" ){
            var nodeHeight;
            if( this.node ){
                nodeHeight = this.options.height.toInt() - getOffsetY(this.node);
                this.node.setStyle("height", nodeHeight);
            }else{
                nodeHeight = this.options.height.toInt();
            }

            nodeHeight = nodeHeight - getOffsetY( this.contentNode ) - 1;
            if( this.titleNode ){
                nodeHeight = nodeHeight - getOffsetY( this.titleNode ) - this.titleNode.getStyle("height").toInt();
            }

            if( this.actionNode ){
                nodeHeight = nodeHeight - getOffsetY( this.actionNode ) - this.actionNode.getStyle("height").toInt();
            }

            this.contentNode.setStyle("height", nodeHeight);

            var selectNodeHeight = nodeHeight - getOffsetY(this.selectNode);
            this.selectNode.setStyle("height", selectNodeHeight);

            if( this.shuttleNode ){
                this.shuttleNode.setStyle("height", selectNodeHeight);
                var shuttleInnerHieght = getOffsetY( this.shuttleInnerNode ) + this.shuttleInnerNode.getStyle("height").toInt();
                this.shuttleInnerNode.setStyle("margin-top", (selectNodeHeight-shuttleInnerHieght)/2 +"px" )
            }

            var itemAreaScrollNodeHeight = selectNodeHeight - getOffsetY( this.searchInputDiv ) - this.searchInputDiv.getStyle("height").toInt();
            if( !this.options.searchbarInTopNode && this.selectTopNode ){
                itemAreaScrollNodeHeight = itemAreaScrollNodeHeight - getOffsetY( this.selectTopNode ) - this.selectTopNode.getStyle("height").toInt();
            }
            if(this.letterAreaNode && this.letterAreaNode.offsetParent){
                itemAreaScrollNodeHeight = itemAreaScrollNodeHeight - getOffsetY( this.letterAreaNode ) - this.letterAreaNode.getStyle("height").toInt();
            }
            itemAreaScrollNodeHeight = itemAreaScrollNodeHeight - getOffsetY( this.itemAreaScrollNode );
            this.itemAreaScrollNode.setStyle("height", itemAreaScrollNodeHeight);

            if( this.itemSearchAreaScrollNode ){
                this.itemSearchAreaScrollNode.setStyle("height", itemAreaScrollNodeHeight);
            }

            var selectedContainerNodeHeight = nodeHeight - getOffsetY(this.selectedContainerNode);
            this.selectedContainerNode.setStyle("height", selectedContainerNodeHeight);

            var selectedScrollNodeHeight = selectedContainerNodeHeight;
            if( this.selectedTopNode ) {
                selectedScrollNodeHeight = selectedScrollNodeHeight - getOffsetY(this.selectedTopNode) - this.selectedTopNode.getStyle("height").toInt();
            }
            if( !this.options.searchbarInTopNode && this.selectedSearchInputDiv ){
                selectedScrollNodeHeight = selectedScrollNodeHeight - getOffsetY( this.selectedSearchInputDiv ) - this.selectedSearchInputDiv.getStyle("height").toInt();
            }
            this.selectedScrollNode.setStyle("height", selectedScrollNodeHeight);
        }
        this.fireEvent("setSize",[this])
    },


    addFlatCategoryItem : function( categoryItemNode, hasChildrenItem, itemNodeContainer, isCreateSubCategoryListNode ){
        if(!this.flatSubCategoryNodeList)this.flatSubCategoryNodeList = [];
        if( hasChildrenItem )this.flatSubCategoryNodeList.push( categoryItemNode );
        if( !this.isFlatCategoryLoaded && this.flatSubCategoryNodeList.length > 1  ){
            this.flatCategoryScrollNode.show();
            this.flatCategoryScrollNode.setStyles( this.css.flatCategoryScrollNode );

            var height = this.itemAreaScrollNode.getStyle("height").toInt();
            this.flatCategoryScrollNode.setStyle("height", ""+height+"px");

            this.flatCategoryNode.setStyles( this.css.flatCategoryNode );
            this.isFlatCategoryLoaded = true;
            this.itemAreaScrollNode.setStyles( this.css.itemAreaScrollNode_flatCategory );
            //alert(this.flatSubCategoryNodeList[0].outerHTML)
        }
        if( hasChildrenItem )categoryItemNode.inject( itemNodeContainer || this.flatCategoryNode );
        var subCategoryListNode;
        if( isCreateSubCategoryListNode ){
            subCategoryListNode = new Element("div.subCategoryListNode").inject( itemNodeContainer || this.flatCategoryNode );
        }
        //this.setFlatCategorySequence(categoryItemNode, itemNodeContainer, subCategoryListNode);

        if( hasChildrenItem ){
            //if( this.checkClickFlatCategoryItem(categoryItemNode, itemNodeContainer) ){
            //    categoryItemNode.click();
            //}
            if( !this.currentCategoryItemNode ){
                categoryItemNode.click();
                this.currentCategoryItemNode = categoryItemNode
            }else{
                //var date = new Date();
                var first = this.flatCategoryNode.getElement(".flatCategoryItemNode");
                //if(first)console.log(first.get("title"));
                //console.log(new Date() - date );
                //console.log("      " );
                if( first ){
                    var dn1 = first.retrieve("dn");
                    var dn2 = this.currentCategoryItemNode.retrieve("dn");
                    if( dn1 && dn2 ){
                        if( dn1 != dn2 ){
                            categoryItemNode.click();
                            this.currentCategoryItemNode = categoryItemNode
                        }
                    }else{
                        var title1 = first.get("title");
                        var title2 = this.currentCategoryItemNode.get("title");
                        if( title1 && title1 ){
                            if( title1 != title2 ){
                                categoryItemNode.click();
                                this.currentCategoryItemNode = categoryItemNode
                            }
                        }else{
                            var text1 = first.get("text");
                            var text2 = this.currentCategoryItemNode.get("text");
                            if( text1 != text2 ){
                                categoryItemNode.click();
                                this.currentCategoryItemNode = categoryItemNode
                            }
                        }
                    }
                }
            }
        }

        return subCategoryListNode;
    },
    isCheckStatusOrCount: function(){
        if( this.isCheckStatusFlag )return this.isCheckStatusFlag === "y";
        if( this.availableStatusTypes.contains(this.selectType) &&
                ( this.options.count.toInt() !== 1)  && (this.options.resultType !== "person") &&
                ( this.options.showSelectedCount || this.options.isCheckStatus ) ){

            if( this.selectType === "unit" ){
                if( this.options.expandSubEnable ){
                    this.isCheckStatusFlag = "y";
                    return true;
                }else{
                    this.isCheckStatusFlag = "n";
                    return false;
                }
            }else{
                this.isCheckStatusFlag = "y";
                return true;
            }
        }else{
            this.isCheckStatusFlag = "n";
            return false;
        }
    },
    checkCountAndStatus: function(){
        if( this.subCategorys && this.subCategorys.length ){
            this.subCategorys.each(function (category) {
                if(category.checkCountAndStatus)category.checkCountAndStatus(true);
            })
        }
    },
    addSelectedCount: function( itemOrItemSelected, count ){

    }
    //checkClickFlatCategoryItem : function(categoryItemNode, itemNodeContainer){
    //    if( !this.flatCategorySeqObj_current ){
    //        this.flatCategorySeqObj_current = categoryItemNode.retrieve("seq");
    //        //console.log(this.flatCategorySeqObj_current)
    //        return true;
    //    }
    //    var seq_cur = this.flatCategorySeqObj_current;
    //    var seq = categoryItemNode ? categoryItemNode.retrieve("seq") : [];
    //    for( var i=0; i<seq.length; i++ ){
    //        if( seq_cur[i] && seq[i] < seq_cur[i] ){
    //            //console.log(seq)
    //            this.flatCategorySeqObj_current = seq;
    //            return true;
    //        }else if( !seq_cur[i] || seq[i] > seq_cur[i] ){
    //            return false;
    //        }
    //    }
    //    return false;
    //},
    //setFlatCategorySequence: function(categoryItemNode, itemNodeContainer, subCategoryListNode){
    //    if( !this.flatCategorySeqObj )this.flatCategorySeqObj = {};
    //    var parentSeq = itemNodeContainer ? itemNodeContainer.retrieve("seq") : [];
    //    var seq = Array.clone( parentSeq );
    //    if( this.flatCategorySeqObj[ parentSeq.length ] ){
    //        seq.push( this.flatCategorySeqObj[ parentSeq.length ] + 1 );
    //        this.flatCategorySeqObj[parentSeq.length] = this.flatCategorySeqObj[parentSeq.length]+1;
    //
    //        categoryItemNode.store( "seq", seq );
    //        categoryItemNode.set( "seq", seq );
    //
    //        if(subCategoryListNode){
    //            seq = Array.clone( seq );
    //            seq[ seq.length - 1 ] = seq[ seq.length - 1 ]+1;
    //            this.flatCategorySeqObj[parentSeq.length] = this.flatCategorySeqObj[parentSeq.length]+1;
    //            subCategoryListNode.store("seq", seq );
    //            subCategoryListNode.set( "seq", seq );
    //        }
    //    }else{
    //        seq.push( 1 );
    //        this.flatCategorySeqObj[ parentSeq.length ] = 1;
    //        categoryItemNode.store( "seq", seq );
    //        categoryItemNode.set( "seq", seq );
    //
    //        if(subCategoryListNode) {
    //            seq = Array.clone(seq);
    //            seq[seq.length - 1] = seq[seq.length - 1]+1;
    //            this.flatCategorySeqObj[parentSeq.length] = this.flatCategorySeqObj[parentSeq.length]+1;
    //            subCategoryListNode.store("seq", seq);
    //            subCategoryListNode.set("seq", seq);
    //        }
    //    }
    //}
});

MWF.xApplication.Selector.Person.Item = new Class({
    initialize: function(data, selector, container, level, category, delay){
        this.clazz = "Item";
        this.data = data;
        this.selector = selector;
        this.container = container;
        this.isSelected = false;
        this.level = (level) ? level.toInt() : 1;
        this.category = category;
        this.subItems = [];
        this.subCategorys = [];
        this.subCategoryMap = {};
        this.subCategoryMapWithDuty = {};
        // if(!delay)this.load();
        if(delay){
            this.placeholderNode = new Element("div").inject(this.container);
        }else{
            this.load();
        }
    },
    _getShowName: function(){
        return this.data.name + ( this.data.employee ? ("("+this.data.employee+")") : "" );
    },
    _getTtiteText: function(){
        return this.data.name + ( this.data.employee ? ("("+this.data.employee+")") : "" );
    },
    _setIcon: function(){
        var style = this.selector.options.style;
        this.iconNode.setStyle("background-image", "url("+"../x_component_Selector/$Selector/"+style+"/icon/personicon.png)");
    },
    load: function(){
        if( this.clazz === "Item" ){
            this.selector.fireEvent("queryLoadItem",[this]);
        }else if( this.clazz === "ItemSelected" ){
            this.selector.fireEvent("queryLoadItemSelected",[this]);
        }

        if( !this.node ){
            this.node = new Element("div", {
                "styles": this.selector.css.selectorItem
            });
            if(this.placeholderNode){
                this.node.inject( this.placeholderNode, "before");
                this.placeholderNode.destroy();
                this.placeholderNode = null;
            }else{
                this.node.inject(this.container);
            }
        }

        this.levelNode = new Element("div", {
            "styles": this.selector.css.selectorItemLevelNode
        }).inject(this.node);


        if( this.selector.selectType !== "identity" || this.selector.options.identityItemWidth === 0 ) {
            var indent = this.selector.options.level1Indent + (this.level - 1) * this.selector.options.indent;
            this.levelNode.setStyle("width", "" + indent + "px");
        }

        this.iconNode = new Element("div", {
            "styles": this.selector.css.selectorItemIconNode
        }).inject(this.node);
        this._setIcon();

        this.actionNode = new Element("div", {
            "styles": this.selector.css.selectorItemActionNode
        }).inject(this.node);
        if( ( this.selector.options.count.toInt() === 1 || this.selector.options.noSelectedContainer ) && this.selector.css.selectorItemActionNode_single  ){
            this.actionNode.setStyles( this.selector.css.selectorItemActionNode_single );
        }

        this.textNode = new Element("div", {
            "styles": this.selector.css.selectorItemTextNode,
            "text": this._getShowName(),
            "title": this._getTtiteText()
        }).inject(this.node);
        this.textNode.store("indent", indent);
        var m = this.textNode.getStyle("margin-left").toFloat()+indent;
        this.textNode.setStyle("margin-left", ""+m+"px");

        if( this.selector.options.identityItemWidth && this.selector.selectType === "identity"){
            this.node.setStyles({
                "float" : "left",
                "min-width" : this.selector.options.identityItemWidth + "px"
            })
        }

        if(this.postLoad)this.postLoad();

        this.loadSubItem();

        this.setEvent();

        this.check();

        if( this.clazz === "Item" ) {
            this.selector.fireEvent("postLoadItem", [this]);
        }else if( this.clazz === "ItemSelected" ){
            this.selector.fireEvent("postLoadItemSelected",[this]);
        }
    },
    loadSubItem: function(){},
    disable : function(){
      this.node.hide();
      this.disabled = true;
    },
    enable : function(){
        this.node.show();
        this.disabled = false;
    },
    check: function(){
        //if (this.selector.options.count.toInt()===1){
        //    this.checkSelectedSingle();
        //}else{
        this.checkSelected();
        //}
    },
    checkSelectedSingle: function(){
        var selectedItem = this.selector.options.values.filter(function(item, index){
            if (typeOf(item)==="object") return this.data.distinguishedName === item.distinguishedName;
            if (typeOf(item)==="string") return this.data.distinguishedName === item;
            return false;
        }.bind(this));
        if (selectedItem.length){
            this.selectedSingle();
        }
    },
    checkSelected: function(){
        var selectedItem = this.selector.selectedItems.filter(function(item, index){
            return item.data.distinguishedName === this.data.distinguishedName;
        }.bind(this));
        if (selectedItem.length){
            selectedItem[0].addItem(this);
            this.selectedItem = selectedItem[0];
            this.setSelected();
        }
    },
    checkTextNodeIndent : function( textNode, styles ){
        var indent = textNode.retrieve("indent");
        if( indent && styles && styles["margin-left"] ){
            var m = styles["margin-left"].toFloat()+indent;
            textNode.setStyle("margin-left", ""+m+"px");
        }
    },
    setSelected: function(){
        this.isSelected = true;
        if(this.node) {
            this.node.setStyles(this.selector.css.selectorItem_selected);

            this.textNode.setStyles(this.selector.css.selectorItemTextNode_selected);
            this.checkTextNodeIndent(this.textNode, this.selector.css.selectorItemTextNode_selected);

            this.actionNode.setStyles(this.selector.css.selectorItemActionNode_selected);
            if( this.selector.options.style === "flow" ){
                this.actionNode.addClass("o2icon-checkbox");
                if( this.selector.options.mainColorEnable )this.actionNode.addClass("mainColor_color");
            }
            if ((this.selector.options.count.toInt() === 1 || this.selector.options.noSelectedContainer) && this.selector.css.selectorItemActionNode_single_selected) {
                this.actionNode.setStyles(this.selector.css.selectorItemActionNode_single_selected);
            }
        }
        // if( this.category ){
        //     this.category.checkSelectAll();
        // }
    },
    setEvent: function(){
        this.node.addEvents({
            "mouseover": function(){
                this.overItem();
            }.bind(this),
            "mouseout": function(){
                this.outItem();
            }.bind(this),
            "click": function(){
                this.clickItem( null, true );
            }.bind(this)
        });
    },
    clickItem: function( callback, checkValid ){
        // if ( layout.mobile && this.selector.options.count.toInt()===1){
        //     this.selectedSingle( checkValid );
        // }else{
            if (this.isSelected){
                this.unSelected( checkValid);
            }else{
                this.selected( checkValid );
            }
        // }
    },
    overItem: function(){
        if (!this.isSelected ){
            this.node.setStyles(this.selector.css.selectorItem_over);
        }else if( this.selector.css.selectorItem_over_force ){
            this.node.setStyles(this.selector.css.selectorItem_over_force);
        }
        if (!this.isSelected){
            this.actionNode.setStyles(this.selector.css.selectorItemActionNode_over);
            if( ( this.selector.options.count.toInt() === 1 || this.selector.options.noSelectedContainer ) && this.selector.css.selectorItemActionNode_single_over  ){
                this.actionNode.setStyles( this.selector.css.selectorItemActionNode_single_over );
            }
        }else if( this.selector.css.selectorItemActionNode_over_force ){
            this.node.setStyles(this.selector.css.selectorItemActionNode_over_force);
        }
    },
    outItem: function(){
        if (!this.isSelected){
            this.node.setStyles(this.selector.css.selectorItem);
        }else if( this.selector.css.selectorItem_over_force ){
            this.node.setStyles(this.selector.css.selectorItem_selected);
        }
        if (!this.isSelected){
            this.actionNode.setStyles(this.selector.css.selectorItemActionNode);
            if( this.selector.options.style === "flow" ){
                this.actionNode.removeClass("o2icon-checkbox");
                if( this.selector.options.mainColorEnable )this.actionNode.removeClass("mainColor_color");
            }
            if( ( this.selector.options.count.toInt() === 1 || this.selector.options.noSelectedContainer ) && this.selector.css.selectorItemActionNode_single  ){
                this.actionNode.setStyles( this.selector.css.selectorItemActionNode_single );
            }
        }else if( this.selector.css.selectorItemActionNode_over_force ){
            this.actionNode.setStyles(this.selector.css.selectorItemActionNode_selected);
            if( this.selector.options.style === "flow" ){
                this.actionNode.addClass("o2icon-checkbox");
                if( this.selector.options.mainColorEnable )this.actionNode.addClass("mainColor_color");
            }
            if( ( this.selector.options.count.toInt() === 1 || this.selector.options.noSelectedContainer ) && this.selector.css.selectorItemActionNode_single_selected  ){
                this.actionNode.setStyles( this.selector.css.selectorItemActionNode_single_selected );
            }
        }
    },
    selectedSingle: function( checkValid ){
        if (!this.isSelected){
            if (this.selector.currentItem) this.selector.currentItem.unSelectedSingle();
            this.selector.emptySelectedItems();
            this.getData(function(){
                this.selector.currentItem = this;
                this.isSelected = true;

                this.selector.selectedItems.push(this);
                if(this.selector.addToSelectedItemsMap)this.selector.addToSelectedItemsMap(this.data, this);

                this.node.setStyles(this.selector.css.selectorItem_selected);

                this.textNode.setStyles(this.selector.css.selectorItemTextNode_selected);
                this.checkTextNodeIndent( this.textNode, this.selector.css.selectorItemTextNode_selected );

                this.actionNode.setStyles(this.selector.css.selectorItemActionNode_selected);
                if( this.selector.options.style === "flow" ){
                    this.actionNode.addClass("o2icon-checkbox");
                    if( this.selector.options.mainColorEnable )this.actionNode.addClass("mainColor_color");
                }
                if( ( this.selector.options.count.toInt() === 1 || this.selector.options.noSelectedContainer ) && this.selector.css.selectorItemActionNode_single_selected  ){
                    this.actionNode.setStyles( this.selector.css.selectorItemActionNode_single_selected );
                }

                this.selector.fireEvent("selectItem",[this]);
                if( checkValid )this.selector.fireEvent("valid", [this.selector, this]);

            }.bind(this));
        }else {
            this.selector.emptySelectedItems();
            this.unSelectedSingle( checkValid );
        }
    },
    getData: function(callback){
        if (callback) callback();
    },
    unSelectedSingle: function(checkValid){
        this.selector.currentItem = null;
        this.isSelected = false;
        this.selector.selectedItems.erase(this);
        if(this.selector.deleteFromSelectedItemsMap)this.selector.deleteFromSelectedItemsMap(this.data);
        this.node.setStyles(this.selector.css.selectorItem);

        this.textNode.setStyles(this.selector.css.selectorItemTextNode);
        this.checkTextNodeIndent( this.textNode, this.selector.css.selectorItemTextNode );

        this.actionNode.setStyles(this.selector.css.selectorItemActionNode);
        if( ( this.selector.options.count.toInt() === 1 || this.selector.options.noSelectedContainer ) && this.selector.css.selectorItemActionNode_single  ){
            this.actionNode.setStyles( this.selector.css.selectorItemActionNode_single );
        }
        this.selector.fireEvent("unselectItem",[this]);
        if( checkValid )this.selector.fireEvent("valid", [this.selector, this]);
    },
    selected: function( checkValid, callback, selectedNode, bySelectAll ){
        var count = this.selector.options.maxCount || this.selector.options.count;
        count = count.toInt();
        if (!count) count = 0;
        if( count == 1 && this.selector.emptySelectedItems){
            this.selector.emptySelectedItems();
        }
        if ((count===0) || (this.selector.selectedItems.length+1)<=count) {
            this.isSelected = true;
            if( this.node ){
                this.node.setStyles(this.selector.css.selectorItem_selected);

                this.textNode.setStyles(this.selector.css.selectorItemTextNode_selected);
                this.checkTextNodeIndent( this.textNode, this.selector.css.selectorItemTextNode_selected );

                this.actionNode.setStyles(this.selector.css.selectorItemActionNode_selected);
                if( this.selector.options.style === "flow" ){
                    this.actionNode.addClass("o2icon-checkbox");
                    if( this.selector.options.mainColorEnable )this.actionNode.addClass("mainColor_color");
                }
                if( ( this.selector.options.count.toInt() === 1 || this.selector.options.noSelectedContainer ) && this.selector.css.selectorItemActionNode_single_selected  ){
                    this.actionNode.setStyles( this.selector.css.selectorItemActionNode_single_selected );
                }
            }
            this.selectedItem = this.selector._newItemSelected(this.data, this.selector, this, selectedNode);
            // this.selectedItem.check();
            this.selector.selectedItems.push(this.selectedItem);
            if(this.selector.addToSelectedItemsMap)this.selector.addToSelectedItemsMap(this.data, this.selectedItem);

            // if( this.category ){
            //     this.category.checkSelectAll();
            // }

            this.selector.fireEvent("selectItem",[this]);
            if( checkValid )this.selector.fireEvent("valid", [this.selector, this]);
            if(callback)callback();
        }else{
            MWF.xDesktop.notice("error", {x: "right", y:"top"}, MWF.SelectorLP.selectItemMaxText.replace("{count}", count) , this.node);
        }
    },
    unSelected: function( checkValid, callback ){
        var isSelected = this.isSelected;
        this.isSelected = false;
        if( this.node ){
            this.node.setStyles(this.selector.css.selectorItem);

            this.textNode.setStyles(this.selector.css.selectorItemTextNode);
            this.checkTextNodeIndent( this.textNode, this.selector.css.selectorItemTextNode );

            this.actionNode.setStyles(this.selector.css.selectorItemActionNode);
            if( this.selector.options.style === "flow" ){
                this.actionNode.removeClass("o2icon-checkbox");
                if( this.selector.options.mainColorEnable )this.actionNode.removeClass("mainColor_color");
            }
            if( ( this.selector.options.count.toInt() === 1 || this.selector.options.noSelectedContainer ) && this.selector.css.selectorItemActionNode_single  ){
                this.actionNode.setStyles( this.selector.css.selectorItemActionNode_single );
            }
        }

        if( this.category && this.selector.options.selectAllRange !== "all" ){
            this.category.checkUnselectAll();
        }

        if( this.selector.searchItems && this.selector.searchItems.length ){
            this.selector.searchItems.each( function(itemSearch){
                var sd = itemSearch.data;
                var d = this.data;
                if(
                    ( sd.distinguishedName && (sd.distinguishedName === d.distinguishedName) ) ||
                    ( sd.id && (sd.id === d.id) ) ||
                    ( sd.unique && (sd.unique === d.unique) ) ||
                    ( sd.employee && (sd.employee === d.employee) ) ||
                    ( sd.levelName && (sd.levelName === d.levelName) )
                ){
                    itemSearch.isSelected = false;
                    itemSearch.node.setStyles(this.selector.css.selectorItem);

                    itemSearch.textNode.setStyles(this.selector.css.selectorItemTextNode);
                    this.checkTextNodeIndent( itemSearch.textNode, this.selector.css.selectorItemTextNode );

                    itemSearch.actionNode.setStyles(this.selector.css.selectorItemActionNode);
                    if( this.selector.options.style === "flow" ){
                        this.actionNode.removeClass("o2icon-checkbox");
                        if( this.selector.options.mainColorEnable )this.actionNode.removeClass("mainColor_color");
                    }
                    if( ( this.selector.options.count.toInt() === 1 || this.selector.options.noSelectedContainer ) && this.selector.css.selectorItemActionNode_single  ){
                        itemSearch.actionNode.setStyles( this.selector.css.selectorItemActionNode_single );
                    }
                }
            }.bind(this))
        }


        var countItems = [];
        if (this.selectedItem){
            this.selector.selectedItems.erase(this.selectedItem);
            if(this.selector.deleteFromSelectedItemsMap)this.selector.deleteFromSelectedItemsMap(this.selectedItem.data);

            if( this.selector.isCheckStatusOrCount()){
                this.selectedItem.items.each(function(item){
                    if( item.isSelected || ( item === this && isSelected ) ){
                        countItems.push(item);
                    }
                }.bind(this));
            }else if( this.selector.options.selectAllRange === "all" ){
                this.selectedItem.items.each(function(item) {
                    if (item.isSelected || (item === this && isSelected)) {
                        if (item.category && item.category._addSelectAllSelectedCount) item.category._addSelectAllSelectedCount(-1, true);
                    }
                }.bind(this))
           }

            this.selectedItem.items.each(function(item){

                if (item != this){
                    item.isSelected = false;
                    item.node.setStyles(this.selector.css.selectorItem);

                    item.textNode.setStyles(this.selector.css.selectorItemTextNode);
                    this.checkTextNodeIndent( item.textNode, this.selector.css.selectorItemTextNode );

                    item.actionNode.setStyles(this.selector.css.selectorItemActionNode);
                    if( this.selector.options.style === "flow" ){
                        this.actionNode.removeClass("o2icon-checkbox");
                        if( this.selector.options.mainColorEnable )this.actionNode.removeClass("mainColor_color");
                    }
                    if( ( this.selector.options.count.toInt() === 1 || this.selector.options.noSelectedContainer ) && this.selector.css.selectorItemActionNode_single  ){
                        item.actionNode.setStyles( this.selector.css.selectorItemActionNode_single );
                    }
                }
            }.bind(this));

            this.selectedItem.destroy();
            this.selectedItem = null;
        }

        if( this.selector.isCheckStatusOrCount()){
            this.selector.addSelectedCount( this, -1, countItems );
        }

        this.selector.fireEvent("unselectItem",[this]);
        if( checkValid )this.selector.fireEvent("valid", [this.selector, this]);
        if(callback)callback();
    },
    postLoad : function(){},
    getParentCategoryByLevel : function( level ){
        var category = this.category;
        do{
            if( category.level === level ){
                return category;
            }else{
                category = category.category;
            }
        }while( category )
    }
});

MWF.xApplication.Selector.Person.ItemSelected = new Class({
    Extends: MWF.xApplication.Selector.Person.Item,
    initialize: function(data, selector, item, selectedNode, delay){
        this.data = data;
        this.selector = selector;
        this.container = selectedNode || this.selector.selectedNode;
        this.isSelected = false;
        this.clazz = "ItemSelected";
        this.items = [];
        if (item) this.items.push(item);

        this.level = this.selector.options.style === "flow" ? 1 : 0;

        this.node = new Element("div", {
            "styles": this.selector.css.selectorItem
        }).inject(this.container);
        this.node.setStyle("display","none");

        if(this.data.isFromValues){
            this.isFromValues = true;
            this.data.isFromValues = false;
        }

        this.getData(function(){
            this.node.setStyle("display","");
            if(!delay){
                this.load();
            }else{
                this.check();
            }
        }.bind(this));
    },
    postLoad : function(){
        if( this.selector.css.selectorSelectedItemTextNode ){
            this.textNode.setStyles(this.selector.css.selectorSelectedItemTextNode);
        }
        if( layout.mobile && !this.selector.contentUrl ){
            this.actionNode.set("text", MWF.SelectorLP.remove );
            if( this.selector.css.selectedItemActionNodeMobile ){
                this.actionNode.setStyles( this.selector.css.selectedItemActionNodeMobile );
            }
            if( this.selector.css.selectorItemMobile ){
                this.node.setStyles( this.selector.css.selectorItemMobile );
            }
        }else if( this.selector.css.selectorSelectedItemActionNode ){
            this.actionNode.setStyles( this.selector.css.selectorSelectedItemActionNode );
            if( ( this.selector.options.count.toInt() === 1 || this.selector.options.noSelectedContainer ) && this.selector.css.selectorSelectedItemActionNode_single  ){
                this.actionNode.setStyles( this.selector.css.selectorSelectedItemActionNode_single );
            }
        }
    },
    getData: function(callback){
        if (callback) callback();
    },
    clickItem: function( callback, checkValid ){
        if( this.tooltip ){
            if( this.selector.tooltips )this.selector.tooltips.erase(this.tooltip);
            this.tooltip.destroy();
            this.tooltip = null;
        }
        if (this.items.length){
            var items = [], map = {};
            this.items.each(function(item){
                if( item.data.distinguishedName || item.data.unique ){
                    if( (!item.data.distinguishedName || !map[item.data.distinguishedName]) && ( !item.data.unique || !map[item.data.unique])){
                        items.push(item);
                        map[item.data.distinguishedName] = true;
                        map[item.data.unique] = true;
                    }
                }else{
                    items.push(item);
                }
            });
            items.each(function(item){
                item.unSelected( checkValid );
            });
            if( checkValid )this.selector.fireEvent("valid", [this.selector, this])
        }else{
            //this.item.selectedItem = null;
            //this.item.isSelected = false;

            if( this.selector.isCheckStatusOrCount()){
                this.selector.addSelectedCount( this, -1, [] );
            }

            this.destroy();
            this.selector.selectedItems.erase(this);
            if(this.selector.deleteFromSelectedItemsMap)this.selector.deleteFromSelectedItemsMap(this.data);
            if( checkValid )this.selector.fireEvent("valid", [this.selector, this])
        }
    },
    //overItem: function(){
    //    if (!this.isSelected){
    //        this.node.setStyles(this.selector.css.selectorItem_over);
    //        this.actionNode.setStyles(this.selector.css.selectorItemActionNode_selected_over);
    //    }
    //},
    overItem: function(){
        if( layout.mobile )return;
        if (!this.isSelected ){
            if( this.selector.css.selectorItem_selected_over ){
                this.node.setStyles(this.selector.css.selectorItem_selected_over);
            }else{
                this.node.setStyles(this.selector.css.selectorItem_over);
            }
            this.actionNode.setStyles(this.selector.css.selectorItemActionNode_selected_over);
            if( ( this.selector.options.count.toInt() === 1 || this.selector.options.noSelectedContainer ) && this.selector.css.selectorItemActionNode_single_selected_over  ){
                this.actionNode.setStyles( this.selector.css.selectorItemActionNode_single_selected_over );
            }
        }
    },
    outItem: function(){
        if( layout.mobile )return;
        if (!this.isSelected){
            var styles = this.selector.css.selectorSelectedItem || this.selector.css.selectorItem;
            this.node.setStyles(styles);
        }else if( this.selector.css.selectorItem_over_force ){
            this.node.setStyles(this.selector.css.selectorItem_selected);
        }
        if (!this.isSelected){
            var styles = this.selector.css.selectorSelectedItemActionNode || this.selector.css.selectorItemActionNode;
            this.actionNode.setStyles(styles);
            if( this.selector.options.style === "flow" ){
                this.actionNode.removeClass("o2icon-checkbox");
                if( this.selector.options.mainColorEnable )this.actionNode.removeClass("mainColor_color");
            }
            if( ( this.selector.options.count.toInt() === 1 || this.selector.options.noSelectedContainer ) &&
                ( this.selector.css.selectorSelectedItemActionNode_single || this.selector.css.selectorItemActionNode_single )  ){
                this.actionNode.setStyles( this.selector.css.selectorSelectedItemActionNode_single || this.selector.css.selectorItemActionNode_single );
            }
        }else if( this.selector.css.selectorItemActionNode_over_force ){
            this.actionNode.setStyles(this.selector.css.selectorItemActionNode_selected);
            if( this.selector.options.style === "flow" ){
                this.actionNode.addClass("o2icon-checkbox");
                if( this.selector.options.mainColorEnable )this.actionNode.addClass("mainColor_color");
            }
            if( ( this.selector.options.count.toInt() === 1 || this.selector.options.noSelectedContainer ) && this.selector.css.selectorItemActionNode_single_selected  ){
                this.actionNode.setStyles( this.selector.css.selectorItemActionNode_single_selected );
            }
        }
    },
    addItem: function(item){
        if (this.items.indexOf(item)===-1) this.items.push(item);
    },
    check: function(){
        if (this.selector.items.length){
            var items = this.selector.items.filter(function(item, index){
                return item.data.distinguishedName === this.data.distinguishedName;
            }.bind(this));
            this.items = items;
            if (items.length){
                items.each(function(item){
                    item.selectedItem = this;
                    item.setSelected();
                    // if( this.selector.options.showSelectedCount ){
                    //     if(item.category)item.category._addSelectedCount( 1, true );
                    // }
                }.bind(this));
            }
        }
        if( this.afterCheck )this.afterCheck();
    },
    destroy: function(){
        if(this.node){
            // var parent = this.node.getParent(".categorySelectedNode");
            // if( parent && !this.node.getPrevious() && !this.node.getNext() ){ //parent.getChildren().length <= 1
            //     parent.destroy();
            // }else{
                this.node.destroy();
            // }
        }
        delete this;
    }
});

MWF.xApplication.Selector.Person.ItemCategory = new Class({
    Extends: MWF.xApplication.Selector.Person.Item,
    initialize: function(data, selector, container, level, parentCategory, delay, notActive){
        this.data = data;
        this.selector = selector;
        this.container = container;
        this.isSelected = false;
        this.level = (level) ? level.toInt() : 1;
        this.category = parentCategory;
        this.subItems = [];
        this.subCategorys = [];
        this.subCategoryMap = {};
        this.subCategoryMapWithDuty = {};
        this.notActive = notActive;
        if(!delay)this.load();
    },
    load : function(){
        if( this.selector.isFlatCategory ){
            this.loadForFlat();
        }else if( !this.notActive ){
            this.loadForNormal();
        }else{
            this.createNode();
            // this.node.hide();
            this.children = new Element("div.children", {
                "styles": this.selector.css.selectorItemCategoryChildrenNode
            }).inject(this.node, "after");
            // this.children.hide();
        }
    },
    active: function(){
        this.notActive = false;
        this.node.show();
        this.children.show();
        this.loadForNormal();
    },
    loadForFlat : function(){
        this.selector.fireEvent("queryLoadCategory",[this]);

        //this.createNode();
        this.node = new Element("div.flatCategoryItemNode", {
            "styles": this.selector.css.flatCategoryItemNode,
            "title" : this._getTtiteText()
        });
        this.node.store( "category", this );
        this.node.store( "dn", this.data.distinguishedName );

        this.textNode = new Element("div", {
            "styles": this.selector.css.flatCategoryItemTextNode,
            "text": this._getShowName()
        }).inject(this.node);

        //var level = this.level;
        //var category = this;
        //while( category.category ){
        //    level =  category.category + "_" + level;
        //    category = category.category;
        //}


        this.children = new Element("div", {
            "styles": this.selector.css.selectorItemCategoryChildrenNode
        }).inject(this.selector.itemAreaNode); //this.container
        //if (!this.selector.options.expand)
        this.children.setStyle("display", "none");

        if( this.selector.options.selectAllEnable && this.selector.options.count.toInt()!==1 ){
            var selectAllWrap = new Element("div",{
                styles : this.selector.css.flatCategory_selectAllWrap
            }).inject(this.children);
            this.selectAllNode = new Element("div", {
                "styles": this.selector.css.flatCategory_selectAll,
                "text" : MWF.SelectorLP.selectAll
            }).inject(selectAllWrap);
            this.selectAllNode.addEvent( "click", function(ev){
                if( this.isSelectedAll ){
                    this.selector.options.selectAllRange === "all" ? this.unselectAllNested(ev, null, true ) : this.unselectAll(ev, null, true);
                    this.selector.fireEvent("unselectCatgory",[this]);
                    this.selector.fireEvent("unselectCatgeory",[this]);
                }else{
                    this.selector.options.selectAllRange === "all" ? this.selectAllNested(ev, true) : this.selectAll(ev, true);
                    this.selector.fireEvent("selectCatgory",[this]);
                    this.selector.fireEvent("selectCatgeory",[this]);
                }
                ev.stopPropagation();
            }.bind(this));
        }

        // var subIdList = this.selector._getChildrenItemIds(this.data);
        // if (subIdList){
        //     var count = subIdList.length;
        //     this.childrenHeight = count*this.selector.options.itemHeight;
        //     this.children.setStyle("height", ""+this.childrenHeight+"px");
        // }
        //if (!this._hasChild()){
        //    this.textNode.setStyle("color", "#333");
        //}

        if( this.selectAllNode ){
            if( this.selector.options.selectAllRange === "direct" && !this._hasChildItem() ){
                this.selectAllNode.setStyle("display", "none");
            }
        }

        this.node.addEvents({
            //"mouseover": function(){
            //    if (!this.isSelected )this.node.setStyles(this.selector.css.flatCategoryItemNode_over );
            //}.bind(this),
            //"mouseout": function(){
            //    if (!this.isSelected )this.node.setStyles(this.selector.css.flatCategoryItemNode );
            //}.bind(this),
            "click": function(){
                if( this.selector.currentFlatCategory === this )return;
                if( this.selector.currentFlatCategory ){
                    this.selector.currentFlatCategory.clickFlatCategoryItem(null, true); //取消原来选择的
                }
                this.selector.currentFlatCategory = this;
                this.clickFlatCategoryItem();
            }.bind(this)
        });
        //this.setEvent();

        var isCreateSubCategoryListNode = this._hasChildCategory ?  this._hasChildCategory() : true;
        var nodeContainer;
        if( this.nodeContainer ){
            nodeContainer = this.nodeContainer;
        }else{
            nodeContainer = (this.category &&  this.category.subCategoryListNode) ? this.category.subCategoryListNode : null;
        }
        this.subCategoryListNode = this.selector.addFlatCategoryItem( this.node, this._hasChildItem(), nodeContainer,  isCreateSubCategoryListNode );

        this.check();

        if( this.loadCategoryChildren )this.loadCategoryChildren();

        //this.afterLoad();
        this.selector.fireEvent("postLoadCategory",[this]);
    },
    loadForNormal : function(){
        this.selector.fireEvent("queryLoadCategory",[this]);
        if(!this.node)this.createNode();
        this.levelNode = new Element("div", {
            "styles": this.selector.css.selectorItemLevelNode
        }).inject(this.node);

        if(this.selector.selectType !== "identity" || this.selector.options.identityItemWidth === 0 ){
            var indent = this.selector.options.level1Indent + (this.level - 1) * this.selector.options.indent;
            this.levelNode.setStyle("width", "" + indent + "px");
        }else{
            this.node.setStyle("clear","both");
        }

        this.iconNode = new Element("div", {
            "styles": this.selector.css.selectorItemCategoryIconNode || this.selector.css.selectorItemIconNode
        }).inject(this.node);
        this._setIcon();

        this.actionNode = new Element("div", {
            "styles": (this.selector.options.expand) ? this.selector.css.selectorItemCategoryActionNode_expand : this.selector.css.selectorItemCategoryActionNode_collapse
        }).inject(this.node);
        if( this.selector.options.style === "flow" )this.actionNode.inject( this.iconNode, "before" );

        if( this.selector.options.selectAllEnable && this.selector.options.count.toInt()!==1 ){
            var selectAllNodeStyles = this.selector.css.selectorItemCategoryActionNode_selectAll;
            if( this.isSelectedAll ){
                if( this.selector.isFlatCategory ){
                    selectAllNodeStyles = this.selector.css.flatCategory_selectAll_selected;
                }else if( this.selector.css.selectorItemCategoryActionNode_selectAll_selected ){
                    selectAllNodeStyles = this.selector.css.selectorItemCategoryActionNode_selectAll_selected;
                }
            }
            this.selectAllNode = new Element("div", {
                "styles": selectAllNodeStyles,
                "title" : MWF.SelectorLP.selectChildren
            }).inject(this.node);
            this.selectAllNode.addEvent( "click", function(ev){
                if( this.isSelectedAll ){
                    // this.unselectAll(ev);
                    this.selector.options.selectAllRange === "all" ? this.unselectAllNested(ev, null, true ) : this.unselectAll(ev, null, true);
                    this.selector.fireEvent("unselectCatgory",[this]);
                    this.selector.fireEvent("unselectCategory",[this]);
                }else{
                    // this.selectAll(ev);
                    if( this.selector.options.selectAllRange === "all" ){
                        var node = new Element("div.categorySelectedNode").inject( this.selector.selectedNode );
                        this.selectAllNested(ev, true, node );
                    }else{
                        this.selectAll(ev, true)
                    }
                    this.selector.fireEvent("selectCatgory",[this]);
                    this.selector.fireEvent("selectCategory",[this]);
                }
                ev.stopPropagation();
            }.bind(this));
            if( this.selector.css.selectorItemCategoryActionNode_selectAll_over ){
                this.selectAllNode.addEvents( {
                    "mouseover" : function(ev){
                        if( !this.isSelectedAll && !this.isSelectedSome )this.selectAllNode.setStyles( this.selector.css.selectorItemCategoryActionNode_selectAll_over );
                        //ev.stopPropagation();
                    }.bind(this),
                    "mouseout" : function(ev){
                        if( !this.isSelectedAll && !this.isSelectedSome )this.selectAllNode.setStyles( this.selector.css.selectorItemCategoryActionNode_selectAll );
                        //ev.stopPropagation();
                    }.bind(this)
                })
            }
        }

        this.textNode = new Element("div", {
            "styles": this.selector.css.selectorItemCategoryTextNode,
            "text": this._getShowName()
        }).inject(this.node);
        var m = this.textNode.getStyle("margin-left").toFloat()+indent;
        this.textNode.setStyle("margin-left", ""+m+"px");

        if( this.selector.options.showSelectedCount && this.selector.availableStatusTypes.contains(this.selector.selectType) ){
            this.selectedCountNode = new Element("span").inject(this.textNode);
        }

        if(!this.children)this.children = new Element("div.children", {
            "styles": this.selector.css.selectorItemCategoryChildrenNode
        }).inject(this.node, "after");
        if (!this.selector.options.expand) this.children.setStyle("display", "none");

        if( this.selector.options.expandEmptyCategory && !this._hasChildItem() ){ //点击允许展开空分类
            this.children.hide();
            this.actionNode.setStyles(this.selector.css.selectorItemCategoryActionNode_collapse);
            this.isExpand = false;
        }else{
            var subIdList = this.selector._getChildrenItemIds(this.data);
            if (subIdList){
                var count = subIdList.length;
                this.childrenHeight = count*this.selector.options.itemHeight;
                this.children.setStyle("height", ""+this.childrenHeight+"px");
            }

            if(this.selector.options.identityItemWidth && this.selector.selectType === "identity"){
                var indent = this.level === 0 ? this.selector.options.level1Indent : this.selector.options.indent;
                this.children.setStyles({
                    "padding-left": "" + indent + "px",
                    "overflow" : "hidden"
                });
            }

            if ( !this._hasChild()){
                if( this.selector.options.hiddenEmptyCategory ){
                    this.node.hide()
                }else{
                    if( this.selector.options.style === "flow" ){
                        this.node.setStyles({
                            "opacity": "0.5",
                            "cursor": "default"
                        });
                    }else{
                        this.actionNode.setStyle("background", "transparent");
                        this.textNode.setStyle("color", "#777");
                    }
                }
            }

            if( this.selectAllNode ){
                if( this.selector.options.selectAllRange === "direct" && !this._hasChildItem() ){
                    this.selectAllNode.setStyle("display", "none");
                }
            }
        }

        this.setEvent();

        this.check();

        this.afterLoad();
        this.selector.fireEvent("postLoadCategory",[this]);
    },
    createNode: function(){
        this.node = new Element("div", {
            "styles": this.selector.css.selectorItemCategory,
            "title" : this._getTtiteText()
        }).inject(this.container);
    },
    setEvent: function(){
        this.node.addEvents({
            "mouseover": function(){
                this.overItem();
            }.bind(this),
            "mouseout": function(){
                this.outItem();
            }.bind(this),
            "click": function(){
                this.clickItem();
            }.bind(this)
        });
    },
    unselectAll : function(ev, exclude, checkValid ){
        var fun = function(){
            var excludeList = exclude || [];
            if( exclude && typeOf(exclude) !== "array"  )excludeList = [exclude];
            ( this.subItems || [] ).each( function(item){
                if(item.isSelected && !excludeList.contains(item) ){
                    item.unSelected( checkValid );
                }
            }.bind(this));

            if( this.selectAllNode ){
                if( this.selector.isFlatCategory ){
                    this.selectAllNode.setStyles( this.selector.css.flatCategory_selectAll );
                }else if(this.selector.css.selectorItemCategoryActionNode_selectAll){
                    this.selectAllNode.setStyles( this.selector.css.selectorItemCategoryActionNode_selectAll );
                }
            }
            this.isSelectedAll = false;
        }.bind(this);

        if( this.loaded ){
            fun();
        }else{
            this.clickItem( function(){
                fun();
            }.bind(this))
        }
    },
    unselectAllNested : function( ev, exclude, checkValid ){
        this.unselectAll(ev, exclude, checkValid);
        if( this.subCategorys && this.subCategorys.length ){
            this.subCategorys.each( function( category ){
                category.unselectAllNested( ev, exclude, checkValid )
            })
        }
    },
    selectAllNested : function( ev, checkValid, selectedNode, notActive ){
        var node;
        if(selectedNode)node = new Element("div.categorySelectedNode").inject( selectedNode );

        this.selectAll(ev, checkValid, node, function () {
            if( this.subCategorys && this.subCategorys.length ){
                this.subCategorys.each( function( category ){
                    if(selectedNode)var node = new Element("div.categorySelectedNode").inject( selectedNode );
                    category.selectAllNested(ev, checkValid, node, notActive)
                })
            }
        }.bind(this), notActive);
    },
    selectAll: function(ev, checkValid, selectedNode, callback, notActive){
        if( this.loaded || this.selector.isFlatCategory ){
            this._selectAll( ev, checkValid, selectedNode, notActive );
            if(callback)callback();
        }else{
            this.clickItem( function(){
                this._selectAll( ev, checkValid, selectedNode, notActive );
                if(callback)callback();
                //this.children.setStyles({
                //    "display": "none",
                //    "height": "0px"
                //});
                //this.actionNode.setStyles(this.selector.css.selectorItemCategoryActionNode_collapse);
            }.bind(this), notActive);
        }
    },
    _selectAll : function( ev, checkValid, selectedNode, notActive ){
        if( this.selector.options.selectAllRange === "direct" && ( !this.subItems || !this.subItems.length ) )return;
        var count = this.selector.options.maxCount || this.selector.options.count;
        if (!count) count = 0;
        var selectedSubItemCount = 0;
        this.subItems.each( function(item){
            if(item.isSelected)selectedSubItemCount++
        }.bind(this));
        if ((count.toInt()===0) || (this.selector.selectedItems.length+(this.subItems.length-selectedSubItemCount))<=count){
            var checkedCount = 0;

            var doSelectAll = function () {
                this.subItems.each( function(item){
                    if(!item.isSelected && !item.disabled )item.selected( false, function () {
                        checkedCount++;
                        if( this.subItems.length === checkedCount ){
                            if( checkValid )this.selector.fireEvent("valid", [this.selector, this]);
                        }
                    }.bind(this), selectedNode);
                }.bind(this));

                if( this.selectAllNode ){
                    if( this.selector.isFlatCategory ){
                        this.selectAllNode.setStyles( this.selector.css.flatCategory_selectAll_selected );
                    }else if(this.selector.css.selectorItemCategoryActionNode_selectAll_selected){

                        var styles = this.selector.css.selectorItemCategoryActionNode_selectAll_selected;

                        if( this.selector.options.isCheckStatus && this.selector.availableStatusTypes.contains(this.selector.selectType) ){
                            if( this._getSelectedCount() < this._getTotalCount() ){
                                styles = this.selector.css.selectorItemCategoryActionNode_selectsome_selected;
                            }
                        }
                        this.selectAllNode.setStyles( styles );
                    }
                }
                this.isSelectedAll = true;
            }.bind(this);

            if( this._beforeSelectAll ){
                this._beforeSelectAll( doSelectAll );
            }else{
                doSelectAll();
            }

        }else{
            MWF.xDesktop.notice("error", {x: "right", y:"top"}, MWF.SelectorLP.selectItemMaxText.replace("{count}", count), this.node);
        }
    },
    checkSelectAll : function(){
        if( this.isSelectedAll )return;
        if( !this.selectAllNode )return;
        if( !this.subItems )return;
        var isAllItemSelected = true;
        for( var i=0; i< this.subItems.length; i++ ){
            if( !this.subItems[i].isSelected ){
                isAllItemSelected = false;
                break;
            }
        }
        if( isAllItemSelected ){
            if( this.selector.isFlatCategory ){
                this.selectAllNode.setStyles( this.selector.css.flatCategory_selectAll_selected );
            }else if( this.selector.css.selectorItemCategoryActionNode_selectAll_selected ){
                this.selectAllNode.setStyles( this.selector.css.selectorItemCategoryActionNode_selectAll_selected );
            }
            this.isSelectedAll = true;
        }
    },
    checkUnselectAll : function(){
        if( !this.isSelectedAll )return;
        if( !this.selectAllNode )return;
        if( !this.subItems )return;
        var hasSelectedItem = false;
        for( var i=0; i< this.subItems.length; i++ ){
            if( this.subItems[i].isSelected ){
                hasSelectedItem = true;
                break;
            }
        }
        if( !hasSelectedItem ){
            if( this.selector.isFlatCategory ){
                this.selectAllNode.setStyles( this.selector.css.flatCategory_selectAll );
            }else if( this.selector.css.selectorItemCategoryActionNode_selectAll ){
                this.selectAllNode.setStyles( this.selector.css.selectorItemCategoryActionNode_selectAll );
            }
            this.isSelectedAll = false;
        }
    },
    afterLoad: function(){
        if (this.level===1) this.clickItem();
    },
    clickFlatCategoryItem : function( callback, hidden ){
        if (this._hasChildItem()){
            var display = this.children.getStyle("display");
            if( hidden ){
                this.children.setStyles({ "display": "none" });
                this.node.setStyles( this.selector.css.flatCategoryItemNode );
                this.isExpand = false;
            }else if (display === "none"){
                this.children.setStyles({
                    "display": "block",
                    "height": "auto"
                });
                this.node.setStyles( this.selector.css.flatCategoryItemNode_selected );
                this.isExpand = true;
            }else{
                this.children.setStyles({
                    "display": "none"
                });
                this.node.setStyles( this.selector.css.flatCategoryItemNode );
                this.isExpand = false;
            }
            if(callback)callback()
        }
    },
    clickItem: function( callback ){
        if (this._hasChild() || this.selector.options.expandEmptyCategory ){
            if (!this.fx){
                this.fx = new Fx.Tween(this.children, {
                    "duration": 200
//                "transition": Fx.Transitions.Cubic.easeIn
                });
            }
            if (!this.fx.isRunning()){
                var display = this.children.getStyle("display");
                if (display === "none"){
                    this.children.setStyles({
                        "display": "block",
                        "height": "0px"
                    });
                    this.fx.start("height", "0px", ""+this.childrenHeight+"px");
                    this.actionNode.setStyles(this.selector.css.selectorItemCategoryActionNode_expand);
                    this.isExpand = true;
                    this.selector.fireEvent("expand", [this] );
                }else{
                    if (!this.childrenHeight) this.childrenHeight = this.children.getStyle("height").toFloat();
                    this.fx.start("height", ""+this.childrenHeight+"px", "0px").chain(function(){
                        this.children.setStyles({
                            "display": "none",
                            "height": "0px"
                        });
                    }.bind(this));
                    this.actionNode.setStyles(this.selector.css.selectorItemCategoryActionNode_collapse);
                    this.isExpand = false;
                    this.selector.fireEvent("collapse", [this] );
                }
            }
            if(callback)callback()
        }
    },
    activeSub: function(){
        if(this.subItems) {
            this.subItems.each(function (item) {
                item.load()
            });
        }
        if(this.subCategorys)this.subCategorys.each(function(category){
            if(category.notActive)category.active();
        });
        this.subNotActive = false;
    },
    overItem: function(){
        //if (!this.isSelected){
        //    this.node.setStyles(this.selector.css.selectorItem_over);
        //    this.actionNode.setStyles(this.selector.css.selectorItemActionNode_over);
        //}
        if( this.selector.css.selectorItemCategory_over ){
            this.node.setStyles(this.selector.css.selectorItemCategory_over);
        }
        var display = this.children.getStyle("display");
        if( display === "none" ){
            if( this._hasChild() && this.selector.css.selectorItemCategoryActionNode_collapse_over ){
                this.actionNode.setStyles( this.selector.css.selectorItemCategoryActionNode_collapse_over )
            }
        }else{
            if( this._hasChild() && this.selector.css.selectorItemCategoryActionNode_expand_over ){
                this.actionNode.setStyles( this.selector.css.selectorItemCategoryActionNode_expand_over )
            }
        }

    },
    outItem: function(){
        //if (!this.isSelected){
        //    this.node.setStyles(this.selector.css.selectorItem);
        //    this.actionNode.setStyles(this.selector.css.selectorItemActionNode);
        //}
        if( this.selector.css.selectorItemCategory_over ){
            this.node.setStyles(this.selector.css.selectorItemCategory);
        }
        var display = this.children.getStyle("display");
        if( display === "none" ){
            if( this._hasChild() && this.selector.css.selectorItemCategoryActionNode_collapse_over ){
                this.actionNode.setStyles( this.selector.css.selectorItemCategoryActionNode_collapse )
            }
        }else{
            if( this._hasChild() && this.selector.css.selectorItemCategoryActionNode_expand_over ){
                this.actionNode.setStyles( this.selector.css.selectorItemCategoryActionNode_expand )
            }
        }
    },
    _hasChild: function(){
        var subIdList = this.selector._getChildrenItemIds(this.data);
        if (subIdList) if (subIdList.length) return true;
        return false;
    },
    _hasChildCategory: function(){
        return null;
    },
    _hasChildItem: function(){
        return this._hasChild();
    },
    _getTtiteText: function(){
        if( this.data.levelName ){
            return this.data.name+"("+ this.data.levelName +")";
        }else{
            return this.data.name;
        }
    },
    checkCountAndStatus: function( nestedSub ){
        var count = this._getSelectedCount();
        this._checkCountAndStatus(count);
        if( nestedSub && this.subCategorys && this.subCategorys.length){
            this.subCategorys.each(function(category){
                if( category.checkCountAndStatus )category.checkCountAndStatus(nestedSub);
            }.bind(this))
        }
    },
    _checkCountAndStatus: function( count ){
        if( this.selector.isCheckStatusOrCount() ){
            if(this.selectedCountNode){
                if( this.selector.options.showSelectedCount && this.selector.options.showAllCount ){
                    var totalCount = this._getTotalCount();
                    if(count || totalCount)this.selectedCountNode.set("text", (count||0)+"/"+ (totalCount||0));
                }else if(this.selector.options.showSelectedCount){
                    this.selectedCountNode.set("text", count ? "(" + count + ")" : "" );
                }else if(this.selector.options.showAllCount){
                    var totalCount = this._getTotalCount();
                    this.selectedCountNode.set("text", totalCount ? "(" + totalCount + ")" : "" );
                }
            }
            if( this.selector.options.isCheckStatus && this.selectAllNode ){
                var total = this._getTotalCount();
                if( total ){
                    var styles;
                    if( count >= total ){
                        styles = this.selector.css.selectorItemCategoryActionNode_selectAll_selected;
                        this.isSelectedSome = false;
                        this.isSelectedAll = true;
                    }else if( count > 0 ){
                        styles = this.selector.css.selectorItemCategoryActionNode_selectsome_selected;
                        this.isSelectedSome = true;
                        this.isSelectedAll = false;
                    }else{
                        styles = this.selector.css.selectorItemCategoryActionNode_selectAll;
                        this.isSelectedSome = false;
                        this.isSelectedAll = false;
                    }
                    this.selectAllNode.setStyles( styles );
                }
            }
        }else if( count === 0 && this.selector.options.selectAllRange === "all" && this.selectAllNode ){
            styles = this.selector.css.selectorItemCategoryActionNode_selectAll;
            this.isSelectedSome = false;
            this.isSelectedAll = false;
            this.selectAllNode.setStyles( styles );
        }

        // if( !this.selectedCountNode1 ){
        //     this.selectedCountNode1 = new Element("span").inject(this.textNode);
        // }
        // this.selectedCountNode1.set("text",count);
    }
})

MWF.xApplication.Selector.Person.ItemGroupCategory = new Class({
    Extends: MWF.xApplication.Selector.Person.ItemCategory,
    _getShowName: function(){
        return this.data.name;
    },
    _setIcon: function(){
        var style = this.selector.options.style;
        this.iconNode.setStyle("background-image", "url("+"../x_component_Selector/$Selector/"+style+"/icon/groupicon.png)");
    }
});

MWF.xApplication.Selector.Person.ItemRoleCategory = new Class({
    Extends: MWF.xApplication.Selector.Person.ItemCategory,
    _getShowName: function(){
        return this.data.name;
    },
    _setIcon: function(){
        var style = this.selector.options.style;
        this.iconNode.setStyle("background-image", "url("+"../x_component_Selector/$Selector/"+style+"/icon/roleicon.png)");
    }
});

MWF.xApplication.Selector.Person.Filter = new Class({
    Implements: [Options, Events],
    options: {
        "style": "default",
        "groups": [],
        "roles": []
    },
    initialize: function(value, options){
        this.setOptions(options);
        this.value = value;
        this.orgAction = MWF.Actions.get("x_organization_assemble_control");
    },
    filter: function(value, callback){
        this.value = value;
        var key = this.value;

        if (this.options.groups.length || this.options.roles.length) key = {"key": key, "groupList": this.options.groupList, "roleList": this.options.roleList};
        this.orgAction.listPersonByKey(function(json){
            data = json.data;
            if (callback) callback(data)
        }.bind(this), null, key);
    }
});
