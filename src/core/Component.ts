/// <reference path="Transform.ts"/>
/// <reference path="../utils/Assert.ts"/>
module WOZLLA {

    /**
     * Top class of all components
     * @class WOZLLA.Component
     * @abstract
     */
    export class Component {

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
        public static register(ctor:Function, configuration) {
            Assert.isObject(configuration);
            Assert.isString(configuration.name);
            Assert.isUndefined(Component.configMap[configuration.name]);
            Component.configMap[configuration.name] = ctor;
        }

        /**
         * create component by it's registed name.
         * @param name the component name
         * @returns {WOZLLA.Component}
         */
        public static create(name:any):WOZLLA.Component {
            var ctor:Function = Component.configMap[name];
            Assert.isFunction(ctor);
            return <WOZLLA.Component>new (<any>ctor)();
        }

    }

}