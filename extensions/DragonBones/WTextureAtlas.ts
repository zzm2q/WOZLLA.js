/// <reference path="../../libs/DragonBones.d.ts"/>
/// <reference path="../../src/assets/SpriteAtlas.ts"/>
module WOZLLA.DragonBones {

    function getFileName(url) {
        var idx = url.lastIndexOf('/');
        if(idx !== -1) {
            return url.substr(idx+1, url.length);
        }
        return url;
    }

    export class WTextureAtlas extends WOZLLA.assets.SpriteAtlas implements dragonBones.ITextureAtlas {

        public name:string;

        public dispose():void {}

        public getRegion(subTextureName:string):dragonBones.Rectangle {
            var sprite = this.getSprite(subTextureName);
            var frame = sprite.frame;
            return new dragonBones.Rectangle(frame.x, frame.y, frame.width, frame.height);
        }

        _loadSpriteAtlas(callback:(error:string, image?, spriteData?)=>any) {
            WOZLLA.utils.Ajax.request({
                url: this._metaSrc,
                contentType: 'json',
                success: (data:any) => {
                    var imageSuffix = data.imagePath;
                    var metaFileName = getFileName(this._metaSrc);
                    this._imageSrc = this._metaSrc.replace(new RegExp(metaFileName + '$'), imageSuffix);
                    this._loadImage((error, image) => {
                        if(error) {
                            callback && callback(error);
                        } else {
                            var textureData = this._parseData(data);
                            this.name = textureData.name;
                            callback && callback(null, image, textureData);
                        }
                    });
                },
                error : (err) => {
                    callback('Fail to load sprite: ' + this._metaSrc + ', ' + err.code + ':' + err.message);
                }
            });
        }

        _parseData(data:any):any {
            var spriteData = {
                name: data.name,
                frames: {}
            };
            data.SubTexture.forEach(function(frameData) {
                spriteData.frames[frameData.name] = { frame: frameData };
            });
            return spriteData;
        }
    }

}