/// <reference path="QuadRenderer.ts"/>
/// <reference path="../../assets/Sprite.ts"/>
/// <reference path="../../assets/SpriteAtlas.ts"/>
module WOZLLA.component {

    /**
     * @class WOZLLA.component.SpriteRenderer
     */
    export class SpriteRenderer extends QuadRenderer {

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

        _sprite:WOZLLA.assets.Sprite;
    }

    Component.register(SpriteRenderer, {
        name: "SpriteRenderer",
        properties: [{
            name: 'color',
            type: 'int'
        }]
    });

}