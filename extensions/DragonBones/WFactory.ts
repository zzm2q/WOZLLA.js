/// <reference path="../../libs/DragonBones.d.ts"/>
/// <reference path="WSlot.ts"/>
/// <reference path="WTextureAtlas.ts"/>
/// <reference path="../../src/core/Scheduler.ts"/>
/// <reference path="../../src/core/GameObject.ts"/>
/// <reference path="../../src/component/renderer/SpriteRenderer.ts"/>
module WOZLLA.DragonBones {

    var clockSetup = false;

    export function setupWorldClock() {
        if(clockSetup) {
            return;
        }
        clockSetup = true;
        WOZLLA.Director.getInstance().scheduler.scheduleLoop(function() {
            dragonBones.WorldClock.clock.advanceTime(1/60);
        });
    }

    export class WFactory extends dragonBones.BaseFactory {
        constructor() {
            super(this);
        }

        /** @private */
        public _generateArmature():dragonBones.Armature {
            var container = new WOZLLA.GameObject();
            container.init();
            return new dragonBones.Armature(container);
        }

        /** @private */
        public _generateSlot():dragonBones.Slot {
            return new WSlot();
        }

        /** @private */
        public _generateDisplay(textureAtlas:WTextureAtlas, fullName:string, pivotX:number, pivotY:number):any {
            var gameObj = new WOZLLA.GameObject();
            var spriteRenderer = new WOZLLA.component.SpriteRenderer();
            spriteRenderer.sprite = textureAtlas.getSprite(fullName);
            spriteRenderer.spriteOffset = {
                x: pivotX/spriteRenderer.sprite.frame.width,
                y: pivotY/spriteRenderer.sprite.frame.height
            };
            gameObj.addComponent(spriteRenderer);
            gameObj.init();
            return gameObj;
        }
    }

}