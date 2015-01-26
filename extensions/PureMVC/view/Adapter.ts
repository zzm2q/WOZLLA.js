///<reference path='AdapterView.ts'/>
///<reference path='../model/Model.ts'/>
module WOZLLA.PureMVC {

    export class Adapter {

        _adapterView:AdapterView;

        setAdapterView(view:AdapterView) {
            this._adapterView = view;
        }

        getCount():number {
            return 0;
        }

        getItem(index:any):Model {
            return null;
        }

        getView(index:any, callback:(view:SimpleView) => void) {

        }

        onStoreBind(store:Store, callback?:Function) {
            console.log('onbind', store, callback);
            callback && callback();
        }

        onStoreUnbind(store:Store) {

        }

    }

}