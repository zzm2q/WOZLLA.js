module WOZLLA.renderer {

    export class Test_HTMLImageDescriptor implements ITextureDescriptor {

        get width():number { return this._source.width; }
        get height():number { return this._source.height; }
        get source():any { return this._source; }
        get textureFormat():TextureFormat { return this._textureFormat; }
        get pixelFormat():PixelFormat { return this._pixelFormat; }

        _source;
        _textureFormat:TextureFormat;
        _pixelFormat:PixelFormat;

        constructor(source) {
            this._source = source;
            this._textureFormat = TextureFormat.PNG;
            this._pixelFormat = PixelFormat.RGBA8888;
        }
    }

    export class Test_PVRDescriptor implements ITextureDescriptor {

        get width():number { return this._source.width; }
        get height():number { return this._source.height; }
        get source():any { return this._source; }
        get textureFormat():TextureFormat { return this._textureFormat; }
        get pixelFormat():PixelFormat { return this._pixelFormat; }

        _source;
        _textureFormat:TextureFormat;
        _pixelFormat:PixelFormat;

        constructor(source, pixelFormat:PixelFormat) {
            this._source = source;
            this._textureFormat = TextureFormat.PVR;
            this._pixelFormat = pixelFormat;
        }
    }

}