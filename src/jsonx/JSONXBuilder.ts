module WOZLLA.jsonx {


    function emptyCallback(root:WOZLLA.GameObject, done:Function) {
        done();
    }
    // reference: @src#asGameObject

    export class JSONXBuilder {

        private src;
        private data;
        private err;
        private root:WOZLLA.GameObject;
        private newCallback:(root:WOZLLA.GameObject, done:Function) => void;
        private doLoad:boolean = false;
        private doInit:boolean = false;
        private loadCallback:(root:WOZLLA.GameObject, done:Function) => void;

        instantiateWithSrc(src, callback:(root:WOZLLA.GameObject, done:Function) => void = emptyCallback) {
            this.src = src;
            this.newCallback = callback;
            return this;
        }

        instantiateWithJSON(data:any, callback:(root:WOZLLA.GameObject, done:Function) => void = emptyCallback) {
            this.data = data;
            this.newCallback = callback;
            return this;
        }

        load(callback:(root:WOZLLA.GameObject, done:Function) => void = emptyCallback) {
            this.doLoad = true;
            this.loadCallback = callback;
            return this;
        }

        init() {
            if(this.doLoad) {
                this.doInit = true;
            } else {
                this.err = 'JSONXBuilder: init must after load';
            }
            return this;
        }

        build(callback:(error:any, root:WOZLLA.GameObject) => void) {
            this._loadJSONData(() => {
                if(this._checkError(callback)) return;
                this._newGameObjectTree(() => {
                    if(this._checkError(callback)) return;
                    if(!this.doLoad) {
                        callback(this.err, this.root);
                        return;
                    }
                    this.newCallback(this.root, () => {
                        this._loadAssets(() => {
                            if(this._checkError(callback)) return;
                            if(!this.doInit) {
                                callback(this.err, this.root);
                                return;
                            }
                            this._init();
                            callback(this.err, this.root);
                        });
                    });
                });
            });
        }

        private _checkError(callback:(error:any, root:WOZLLA.GameObject) => void) {
            if(this.err) {
                callback(this.err, null);
                return true;
            }
            return false;
        }

        private _loadJSONData(callback:Function) {
            if(this.src && !this.data) {
                WOZLLA.utils.Ajax.request({
                    url: this.src,
                    contentType: 'json',
                    success: (data) => {
                        this.data = data;
                        callback && callback();
                    },
                    error: (err) => {
                        this.err = err;
                        callback && callback()
                    }
                });
            } else {
                callback && callback();
            }
        }

        private _newGameObjectTree(callback:Function) {
            this._newGameObject(this.data.root, (root:WOZLLA.GameObject) => {
                this.root = root;
                callback && callback();
            });
        }

        private _newGameObject(data:any, callback:(gameObj:WOZLLA.GameObject) => void) {
            var gameObj = new WOZLLA.GameObject(data.rect);
            gameObj.id = data.id;
            gameObj.name = data.name;
            gameObj.active = data.active;
            gameObj.visible = data.visible;
            gameObj.touchable = data.touchable;
            gameObj.transform.set(data.transform);

            var components:Array<any> = data.components;
            if(components && components.length > 0) {
                components.forEach((compData:any) => {
                    gameObj.addComponent(this._newComponent(compData));
                });
            }

            var createdChildCount = 0;
            var children:Array<any> = data.children;
            if(!children || children.length === 0) {
                callback(gameObj);
                return;
            }
            children.forEach((childData:any) => {
                if(childData.reference) {
                    this._newReferenceObject(childData, (child) => {
                        if(child) {
                            gameObj.addChild(child);
                        }
                        createdChildCount ++;
                        if(createdChildCount === children.length) {
                            callback(gameObj);
                        }
                    });
                } else {
                    this._newGameObject(childData, (child) => {
                        gameObj.addChild(child);
                        createdChildCount ++;
                        if(createdChildCount === children.length) {
                            callback(gameObj);
                        }
                    });
                }
            });
        }

        private _newReferenceObject(data:any, callback:(gameObj:WOZLLA.GameObject) => void) {
            var builder = new JSONXBuilder();
            builder.instantiateWithSrc(data.reference).build((err:any, root:WOZLLA.GameObject) => {
                if(err) {
                    this.err = err;
                }
                else if(root) {
                    root.name = data.name;
                    root.id = data.id;
                    root.active = data.active;
                    root.visible = data.visible;
                    root.touchable = data.touchable;
                    root.transform.set(data.transform);
                }
                callback(root);
            });
        }

        private _newComponent(compData:any) {
            var component = WOZLLA.Component.create(compData.name);
            var config = WOZLLA.Component.getConfig(compData.name);
            config.properties.forEach((prop) => {
                var value = compData.properties[prop.name];
                value = typeof value === 'undefined' ? prop.defaultValue : value;
                if(prop.convert) {
                    value = prop.convert(value);
                }
                component[prop.name] = value;
            });
            return component;
        }

        private _loadAssets(callback:Function) {
            this.root.loadAssets(callback);
        }

        private _init() {
            this.root.init();
        }

    }

}