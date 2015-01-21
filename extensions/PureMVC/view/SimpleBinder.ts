///<reference path='../../../src/utils/Assert.ts'/>
///<reference path='../../../../WOZLLA.js/src/core/GameObject.ts'/>
module WOZLLA.PureMVC {

    var Assert = WOZLLA.Assert;
    var helpRecord:WOZLLA.QueryRecord = new WOZLLA.QueryRecord();

    export class SimpleBinder {

        _view:SimpleView;
        _config:any;
        _queryCache:any = {};

        constructor(simpleView:SimpleView, config:any) {
            this._view = simpleView;
            this._config = config;
            for(var attrName in config) {
                var attrConfig = config[attrName];
                if(typeof attrConfig === 'string') {
                    config[attrName] = {
                        bind: attrConfig,
                        cache: true
                    };
                }
            }
        }

        syncAttr(name) {
            var target;
            var targetAttrName;
            var model = this._view.model;
            var attrConfig = this._config[name];

            // get model value
            var getter = attrConfig.model && attrConfig.model.getter;
            var value;
            if(model) {
                if(getter) {
                    value = getter(model);
                } else {
                    value = model.get(name);
                }
            }

            // query bind target
            var cacheData;
            var cache = attrConfig.cache !== false;
            var bind = attrConfig.bind;
            if(cache) {
                cacheData = this._queryCache[bind];
                target = cacheData && cacheData.target;
                targetAttrName = cacheData && cacheData.attrName;
            }
            if(!target) {
                var gameObj = this._view.gameObject;
                var queryRecord = helpRecord;
                queryRecord.target = null;
                gameObj.query(bind, queryRecord);
                Assert.isNotUndefined(queryRecord.target, 'Can\'t found "' + bind + '" for binding.');
                target = queryRecord.target;
                targetAttrName = queryRecord.attrName;
                if (cache) {
                    this._queryCache[bind] = {
                        target: target,
                        attrName: targetAttrName
                    };
                }
            }
            // apply model value to view
            target[targetAttrName] = value;
            target.loadAssets();
        }

        onModelFieldChange(e) {
            this.syncAttr(e.data.field);
        }

        onModelBind(model:Model) {
            this.syncAll();
        }

        onModelUnbind(model:Model) {
            this.syncAll();
        }

        syncAll() {
            var config = this._config;
            for(var attrName in config) {
                this.syncAttr(attrName);
            }
        }
    }

}