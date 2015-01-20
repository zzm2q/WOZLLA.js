/// <reference path="../../assets/GLTextureAsset.ts"/>
module WOZLLA.component {

    var global:any = window;
    var createjs:any = global.createjs;

    export class CanvasRenderer extends QuadRenderer {

        protected canvas:any;
        protected context:any;
        protected canvasSize:WOZLLA.math.Size;
        protected graphics:any;
        protected dirty:boolean = true;

        private _glTexture;

        init():void {
            if(this.canvasSize) {
                Assert.isTrue(this.canvasSize.width > 0 && this.canvasSize.width <= 2048);
                Assert.isTrue(this.canvasSize.height > 0 && this.canvasSize.height <= 2048);
                this.initCanvas(this.canvasSize.width, this.canvasSize.height);
                this.graphics = new createjs.Graphics();
                this.draw(this.graphics);
                this.graphics.draw(this.context);
            }
            super.init();
        }

        initCanvas(width:number, height:number) {
            var canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            this.canvas = canvas;
            this.context = canvas.getContext('2d');
        }

        draw(graphics:any):void {

        }

        clear():void {
            this.context.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
        }

        render(renderer: renderer.IRenderer, flags: number): void {
            if(this.canvas && !this._glTexture) {
                this._glTexture = renderer.textureManager.generateTexture(new WOZLLA.assets.HTMLImageDescriptor(this.canvas));
                this.setTexture(this._glTexture);
                this.dirty = false;
            }
            if(this._glTexture) {
                if(this.dirty) {
                    this.draw(this.graphics);
                    this.graphics.draw(this.context);
                    this.dirty = false;
                    renderer.textureManager.updateTexture(this._glTexture);
                }
                super.render(renderer, flags);
            }
        }

    }

}