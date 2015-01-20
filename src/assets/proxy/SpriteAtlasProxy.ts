module WOZLLA.assets.proxy {

    export class SpriteAtlasProxy extends AssetProxy {

        getSprite(spriteName:string):Sprite {
            if(this.asset) {
                return (<SpriteAtlas>this.asset).getSprite(spriteName);
            }
            return null;
        }

        protected doLoad(callback:(asset:Asset) => void) {
            var src = this.newAssetSrc;
            if(!src) {
                callback(null);
                return;
            }
            AssetLoader.getInstance().load(src, SpriteAtlas, function() {
                callback(AssetLoader.getInstance().getAsset(src));
            });
        }
    }

}