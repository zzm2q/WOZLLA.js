/// <reference path="Transform.ts"/>
/// <reference path="../utils/Assert.ts"/>
module WOZLLA {

    /**
     * Top class of all components
     * @class WOZLLA.Component
     * @extends WOZLLA.event.EventDispatcher
     * @abstract
     */
    export class Component extends WOZLLA.event.EventDispatcher {

        /**
         * get the GameObject of this component belongs to.
         * @property {WOZLLA.GameObject} gameObject
         * @readonly
         */
        get gameObject():GameObject { return this._gameObject; }

        /**
         *  get transform of the gameObject of this component
         *  @property {WOZLLA.Transform} transform
         */
        get transform():Transform { return this._gameObject.transform; }

        _gameObject:GameObject;

        /**
         * init this component
         */
        init():void {}

        /**
         * destroy this component
         */
        destroy():void {}

        loadAssets(callback:Function) {
            callback && callback();
        }

        listRequiredComponents():Array<Function> {
            return [];
        }

        private static configMap:any = {};

        /**
         * register an component class and it's configuration
         * @method register
         * @static
         * @param ctor
         * @param configuration
         */
        public static register(ctor:Function, config) {
            Assert.isObject(config);
            Assert.isString(config.name);
            Assert.isUndefined(Component.configMap[config.name]);
            Component.configMap[config.name] = ctor;
        }

        /**
         * create component by it's registed name.
         * @param name the component name
         * @returns {WOZLLA.Component}
         */
        public static create(name:string):WOZLLA.Component {
            Assert.isString(name);
            var ctor:Function = Component.configMap[name];
            Assert.isFunction(ctor);
            return <WOZLLA.Component>new (<any>ctor)();
        }

        public static getConfig(name:string):any {
            var config:any;
            Assert.isString(name);
            config = Component.configMap[name];
            Assert.isNotUndefined(config);
            return config;
        }

    }

}