/// <reference path="../event/EventDispatcher.ts"/>
/// <reference path="../event/Event.ts"/>
module WOZLLA.assets {

    /**
     * Base class of all assets in WOZLLA engine.
     * an asset contains a reference count which increase by **retain** function,
     * decrease by **release** function.
     * an asset would be unload when reference count reach 0.
     * @class WOZLLA.assets.Asset
     * @extends WOZLLA.event.EventDispatcher
     * @abstract
     */
    export class Asset extends WOZLLA.event.EventDispatcher {

        public static EVENT_UNLOAD = 'unload';

        /**
         * @property {string} src
         * @readonly
         */
        get src():string { return this._src; }

        private _src:string;
        private _refCount = 0;

        constructor(src:string) {
            super();
            this._src = src;
        }

        /**
         * retain this asset
         */
        retain() {
            this._refCount ++;
        }

        /**
         * release this asset
         * @param {boolean} [decreaceRefCount=true]
         */
        release(decreaceRefCount:boolean=true) {
            if(decreaceRefCount) {
                if (this._refCount > 0) {
                    this._refCount--;
                }
            }
            if(this._refCount === 0) {
                this.unload();
            }
        }

        /**
         * load this asset
         * @param onSuccess
         * @param onError
         */
        load(onSuccess:()=>any, onError:(error)=>any) {
            onSuccess();
        }

        /**
         * unload this asset
         * @fires unload event
         */
        unload() {
            var event = new WOZLLA.event.Event(Asset.EVENT_UNLOAD, false);
            event.target = event.currentTarget = this;
            this.dispatchEvent(event);
        }
    }

}