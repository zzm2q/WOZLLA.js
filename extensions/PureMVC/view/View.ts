///<reference path='../../../src/core/Component.ts' />
module WOZLLA.PureMVC {

    export class View extends WOZLLA.Component {

        init():void {
            this.onInit();
            super.init();
        }

        destroy():void {
            this.onDestroy();
            super.destroy();
        }

        onCreate() {}

        onInit() {}

        onDestroy() {}
    }

}