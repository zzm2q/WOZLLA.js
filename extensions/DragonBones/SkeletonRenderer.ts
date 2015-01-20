module WOZLLA.DragonBones {

    export class SkeletonRenderer extends WOZLLA.Renderer {

        get skeletonSrc():string {
            return this._skeletonSrc;
        }

        set skeletonSrc(value:string) {
            this._skeletonSrc = value;
        }

        get textureSrc():string {
            return this._textureSrc;
        }

        set textureSrc(value:string) {
            this._textureSrc = value;
        }

        get armatureName():string {
            return this._armatureName;
        }

        set armatureName(value:string) {
            this._armatureName = value;
        }

        get armature():dragonBones.Armature {
            return this._armature;
        }

        _skeletonSrc;
        _textureSrc;

        _factory;
        _skeletonJSONAsset;
        _wTextureAtlas;
        _armatureName:string;
        _armature:dragonBones.Armature;
        _container:WOZLLA.GameObject;

        init() {
            this.initArmature();
            super.init();
        }

        destroy() {
            this._skeletonJSONAsset && this._skeletonJSONAsset.release();
            this._skeletonJSONAsset = null;
            this._wTextureAtlas && this._wTextureAtlas.release();
            this._wTextureAtlas = null;
            this._armature && this._armature.dispose();
            this._armature = null;
            this._factory && this._factory.dispose();
            if(this._container) {
                this._container.destroy();
                this._container.removeMe();
                this._container = null;
            }
            super.destroy();
        }

        render(renderer:WOZLLA.renderer.IRenderer, flags:number):void {
            this._container.visit(renderer, this.transform, flags);
        }

        loadAssets(callback:Function) {
            var assetLoader;
            if(this._skeletonSrc && this._textureSrc && this._armatureName) {
                assetLoader = Director.getInstance().assetLoader;
                assetLoader.load(this._skeletonSrc, WOZLLA.assets.JSONAsset, () => {
                    var jsonAsset = <WOZLLA.assets.JSONAsset>assetLoader.getAsset(this._skeletonSrc);
                    if(!jsonAsset) {
                        callback();
                        return;
                    }
                    jsonAsset.retain();
                    assetLoader.load(this._textureSrc, WTextureAtlas, () => {
                        var wTextureAtlas = assetLoader.getAsset(this._textureSrc);
                        if(!wTextureAtlas) {
                            jsonAsset.release();
                            callback();
                            return;
                        }
                        wTextureAtlas.retain();
                        this._skeletonJSONAsset = jsonAsset;
                        this._wTextureAtlas = wTextureAtlas;
                        callback();
                    });
                });
            } else {
                callback();
            }
        }

        protected initArmature() {
            var skeletonData, factory, armature, container;
            if(this._skeletonJSONAsset && this._wTextureAtlas && this._armatureName) {
                factory = new WFactory();
                skeletonData = this._skeletonJSONAsset.cloneData();
                factory.addSkeletonData(dragonBones.DataParser.parseDragonBonesData(skeletonData), skeletonData.name);
                factory.addTextureAtlas(this._wTextureAtlas, this._wTextureAtlas.name);
                armature = factory.buildArmature(this._armatureName);
                container = <WOZLLA.GameObject>armature.getDisplay();
                dragonBones.WorldClock.clock.add(armature);
                setupWorldClock();
                this._container = container;
                this._factory = factory;
                this._armature = armature;
            }
        }

    }

}