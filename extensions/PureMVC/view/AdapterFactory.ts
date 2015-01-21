module WOZLLA.PureMVC {

    export class AdapterFactory {

        private static adapterCtorMap:any = {};

        public static create(name:string) {
            var AdapterClass:any = AdapterFactory.adapterCtorMap[name];
            Assert.isNotUndefined(AdapterClass, 'unknow adapter: ' + name);
            return new AdapterClass();
        }

        public static register(name:string, AdapterClass:Function) {
            Assert.isUndefined(AdapterFactory.adapterCtorMap[name], 'adapter name="' + name + '" has been registered');
            AdapterFactory.adapterCtorMap[name] = AdapterClass;
        }

    }

}