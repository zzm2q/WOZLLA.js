///<reference path='View.ts'/>
///<reference path='../../../../WOZLLA.js/src/utils/Assert.ts'/>
///<reference path='../../../../WOZLLA.js/src/jsonx/JSONXBuilder.ts'/>
module WOZLLA.PureMVC {

    var Assert = WOZLLA.Assert;

    export class ViewBuilder extends WOZLLA.jsonx.JSONXBuilder {

        public static fullBuild(src:any, modelMap:any , onComplete:(view:View) => void) {
            var builder = new WOZLLA.PureMVC.ViewBuilder();
            if(typeof src === 'string') {
                builder.instantiateWithSrc(src);
            } else {
                builder.instantiateWithJSON(src);
            }
            for(var key in modelMap) {
                var modelOrStore = modelMap[key];
                if(modelOrStore instanceof Model) {
                    builder.addModel(key, modelOrStore);
                } else {
                    builder.addStore(key, modelOrStore);
                }
            }
            builder.load().init().build((error:any, root:WOZLLA.GameObject) => {
                var view = <View>root.getComponent(View);
                onComplete && onComplete(view);
            });
        }

        _modelMap:any = {};
        _storeMap:any = {};

        _bindList = [];

        addModel(key:string, model:Model) {
            this._modelMap[key] = model;
        }

        getModel(key:string):Model {
            Assert.isNotUndefined(this._modelMap[key]);
            return this._modelMap[key];
        }

        addStore(key:string, store:Store) {
            this._storeMap[key] = store;
        }

        getStore(key:string):Store {
            Assert.isNotUndefined(this._storeMap[key]);
            return this._storeMap[key];
        }

        protected _newGameObjectTree(callback:Function) {
            super._newGameObjectTree(() => {
                var me = this;
                function nextBind() {
                    var bindExec:Function = me._bindList.shift();
                    if(!bindExec) {
                        callback();
                        return;
                    }
                    bindExec(nextBind);
                }
                nextBind();
            });
        }

        protected _newComponent(compData:any, gameObj:WOZLLA.GameObject):WOZLLA.Component {
            var simpleView:SimpleView;
            var adapterView:AdapterView;
            var component = super._newComponent(compData, gameObj);
            if(component instanceof View) {
                (<View>component).onCreate();
                if(component instanceof SimpleView) {
                    simpleView = (<SimpleView>component);
                    if(simpleView.modelKey) {
                        this._bindList.push((next) => {
                            simpleView.bindModel(this.getModel(simpleView.modelKey));
                            next();
                        });
                    }
                } else if(component instanceof AdapterView) {
                    adapterView = <AdapterView>component;
                    if(adapterView.storeKey) {
                        this._bindList.push((next) => {
                            adapterView.bindStore(this.getStore(adapterView.storeKey), next);
                        });
                    }
                }
            }
            return component;
        }
    }

}