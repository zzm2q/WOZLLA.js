/// <reference path="QuadRenderer.ts"/>
/// <reference path="../../assets/proxy/SpriteAtlasProxy.ts"/>
/// <reference path="../../assets/Sprite.ts"/>
/// <reference path="../../assets/SpriteAtlas.ts"/>
module WOZLLA.component {

    /**
     * @class WOZLLA.component.SpriteRenderer
     */
    export class SpriteRenderer extends QuadRenderer implements WOZLLA.assets.proxy.IProxyTarget {

        get color():number { return this._quadColor; }
        set color(value:number) { this.setQuadColor(value); }

        get alpha():number { return this._quadAlpha; }
        set alpha(value:number) { this.setQuadAlpha(value); }

        get materialId():string { return this._quadMaterialId; }
        set materialId(value:string) { this.setQuadMaterialId(value); }

        get renderLayer():string { return this._quadLayer; }
        set renderLayer(value:string) { this.setQuadLayer(value); }

        get renderOrder():number { return this._quadGlobalZ; }
        set renderOrder(value:number) { this.setQuadGlobalZ(value); }

        get sprite():WOZLLA.assets.Sprite { return this._sprite; }
        set sprite(sprite:WOZLLA.assets.Sprite) {
            var oldSprite = this._sprite;
            if(oldSprite === sprite) return;
            this._sprite = sprite;
            if(!sprite) {
                this.setTexture(null);
                this.setTextureFrame(null);
            } else {
                this.setTextureFrame(sprite.frame);
                if(!oldSprite || oldSprite.spriteAtlas !== sprite.spriteAtlas) {
                    this.setTexture(sprite.spriteAtlas.glTexture);
                }
            }
        }

        get spriteOffset():any { return this._getTextureOffset(); }
        set spriteOffset(value) { this.setTextureOffset(value); }

        get spriteAtlasSrc():string { return this._spriteSrc; }
        set spriteAtlasSrc(value:string) {
            this._spriteSrc = value;
            this._spriteProxy.setAssetSrc(value);
        }

        get spriteName():string { return this._spriteName; }
        set spriteName(value:string) {
            this._spriteName = value;
            this.sprite = this._spriteProxy.getSprite(value);
        }

        _spriteProxy:WOZLLA.assets.proxy.SpriteAtlasProxy;
        _sprite:WOZLLA.assets.Sprite;
        _spriteSrc:string;
        _spriteName:string;

        constructor() {
            super();
            this._spriteProxy = new WOZLLA.assets.proxy.SpriteAtlasProxy(this);
        }

        onAssetLoaded(asset:WOZLLA.assets.Asset) {
            if(asset) {
                this.sprite = (<WOZLLA.assets.SpriteAtlas>asset).getSprite(this._spriteName);
            } else {
                this.sprite = null;
            }
        }

        loadAssets(callback:Function) {
            this._spriteProxy.loadAsset(callback);
        }
    }

    Component.register(SpriteRenderer, {
        name: "SpriteRenderer",
        properties: [{
            name: 'color',
            type: 'int'
        }, {
            name: 'spriteAtlasSrc',
            type: 'string'
        }, {
            name: 'spriteName',
            type: 'string'
        }]
    });

}