/// <reference path="../../libs/DragonBones.d.ts"/>
/// <reference path="../../src/core/GameObject.ts"/>
module WOZLLA.DragonBones {

    export class WSlot extends dragonBones.Slot {

        private _display:WOZLLA.GameObject;

        constructor() {
            super(this);
            this._display = null;
        }

        public dispose():void{
            if(this._display) {
                this._display.destroy();
                this._display.removeMe();
            }
            super.dispose();
            this._display = null;
        }

        /** @private */
        public _updateDisplay(value:any):void{
            this._display = <WOZLLA.GameObject>value;
        }

        //Abstract method

        /** @private */
        public _getDisplayIndex():number {
            return -1;
        }

        /** @private */
        public _addDisplayToContainer(container:any, index:number=-1):void{
            var gameObjContainer = <WOZLLA.GameObject> container;
            if(this._display && gameObjContainer) {
                gameObjContainer.addChild(this._display);
            }
        }

        /** @private */
        public _removeDisplayFromContainer():void{
            if(this._display && this._display.parent) {
                this._display.parent.removeChild(this._display);
            }
        }

        /** @private */
        public _updateTransform():void {
            var trans;
            if(this._display) {
                trans = this._display.transform;
                trans.__local_matrix = this._globalTransformMatrix;
                trans.dirty = true;
                //trans.setPosition(this._global.x, this._global.y);
                //trans.setScale(this._global.scaleX, this._global.scaleY);
                //trans.setSkew(this._global.skewX, this._global.skewY);
                //trans.setRotation(this._global.rotation);

            }
        }

        /** @private */
        public _updateDisplayVisible(value:boolean):void{
            if(this._display && this._parent) {
                this._display.visible = this._parent._visible && this._visible && value;
            }
        }

        /** @private */
        public _updateDisplayColor(aOffset:number, rOffset:number, gOffset:number, bOffset:number, aMultiplier:number, rMultiplier:number, gMultiplier:number, bMultiplier:number):void {
            super._updateDisplayColor(aOffset, rOffset, gOffset, bOffset, aMultiplier, rMultiplier, gMultiplier, bMultiplier);
            if(this._display) {
                var spriteRenderer:WOZLLA.component.SpriteRenderer = <WOZLLA.component.SpriteRenderer>this._display.renderer;
                if(spriteRenderer) {
                    spriteRenderer.alpha = aMultiplier;
                }
                // TODO color
            }
        }

        /** @private */
        public _updateDisplayBlendMode(value:string):void{
            if(this._display && value) {
            }
        }

    }

}