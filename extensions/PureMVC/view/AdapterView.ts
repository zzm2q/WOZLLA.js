///<reference path='View.ts'/>
///<reference path='AdapterFactory.ts'/>
///<reference path='../model/Store.ts'/>
module WOZLLA.PureMVC {

    export class AdapterView extends View {

        get adapter():Adapter {
            return this._adapter;
        }

        set adapter(value:Adapter) {
            this.setAdapter(value);
        }

        get storeKey():string { return this._storeKey; }
        set storeKey(key:string) { this._storeKey = key; }

        get store():Store {
            return this._store;
        }

        _store:Store;
        _storeKey:string;
        _adapter:Adapter;

        onDestroy():void {
            this.unbindStore();
            super.onDestroy();
        }

        bindStore(store:Store, callback?:Function) {
            this._store = store;
            this.onStoreBind(store, callback);
        }

        unbindStore() {
            var store;
            if(!this._store) return;
            store = this._store;
            this._store = null;
            this.onStoreUnbind(store);
        }

        onStoreBind(store:Store, callback?:Function) {
            if(this._adapter) {
                this._adapter.onStoreBind(store, callback);
            } else {
                callback && callback();
            }
        }

        onStoreUnbind(store:Store) {
            if(this._adapter) {
                this._adapter.onStoreUnbind(store);
            }
        }

        setAdapter(adapter:Adapter, callback?:Function) {
            if(this._adapter && this._store) {
                this._adapter.onStoreUnbind(this._store);
            }
            this._adapter = adapter;
            this._adapter.setAdapterView(this);
            if(this._store) {
                this._adapter.onStoreBind(this._store, callback);
            } else {
                callback && callback();
            }
        }

    }

    Component.register(AdapterView, {
        name: 'MVC.AdapterView',
        properties: [{
            name: 'storeKey',
            type: 'string'
        }, {
            name: 'adapter',
            type: 'MVC.Adapter',
            convert: function(name) {
                if(!name) {
                    return null;
                }
                return AdapterFactory.create(name);
            }
        }]
    });
}