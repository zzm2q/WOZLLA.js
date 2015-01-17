///<reference path='../../libs/puremvc-typescript-multicore-1.1.d.ts'/>
module WOZLLA.PureMVC {

    export class ApplicationFacade extends puremvc.Facade {

        public static getInstance(key:string):ApplicationFacade {
            if(ApplicationFacade.instanceMap[key] == null) {
                ApplicationFacade.instanceMap[key] = new ApplicationFacade(key);
            }
            return ApplicationFacade.instanceMap[key];
        }

        public sendNotification(name: string, body?: any, type?: string):void {
            // TODO
            super.sendNotification(name, body, type);
        }

    }

}