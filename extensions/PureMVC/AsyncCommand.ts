///<reference path='../../libs/puremvc-typescript-multicore-1.1.d.ts'/>
module WOZLLA.PureMVC {

    export class AsyncCommand extends puremvc.SimpleCommand {

        public execute(notification: puremvc.INotification, onComplete?:Function): void {
            onComplete && onComplete();
        }
    }

}