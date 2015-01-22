///<reference path='Adapter.ts'/>
///<reference path='AdapterFactory.ts'/>
///<reference path='../view/SimpleView.ts'/>
///<reference path='../model/ArrayStore.ts'/>
///<reference path='../../../src/utils/Assert.ts'/>
module WOZLLA.PureMVC {

    var Assert = WOZLLA.Assert;

    export class ListAdapter extends Adapter {

        get arrayStore():ArrayStore<Model> {
            return <ArrayStore<Model>> this._adapterView.store;
        }

        get listView():ListView {
            return <ListView>this._adapterView;
        }

        getCount():number {
            var arrayStore:ArrayStore<Model> = this.arrayStore;
            return arrayStore ? arrayStore.count : 0;
        }

        getItem(index:any):Model {
            var arrayStore:ArrayStore<Model> = this.arrayStore;
            return arrayStore ? arrayStore.getAt(index) : null;
        }

        getView(index:any, callback:(view:SimpleView) => void) {
            this.loadItemView(index, callback);
        }

        onStoreBind(store:Store, callback:Function) {
            var loadedCount;
            var arrayStore = <ArrayStore<Model>>store;
            Assert.isTrue(store instanceof ArrayStore, 'ListAdapter only support bind ArrayStore');

            arrayStore.addListenerScope('add', this.onStoreAdd, this);
            arrayStore.addListenerScope('remove', this.onStoreRemove, this);
            arrayStore.addListenerScope('clear', this.onStoreClear, this);
            arrayStore.addListenerScope('sync', this.onStoreSync, this);

            if(arrayStore.count === 0) {
                callback && callback();
            } else {
                loadedCount = arrayStore.count;
                arrayStore.each((model:Model, idx:number) => {
                    this.getView(idx, (itemView:SimpleView) => {
                        this.listView.addItemView(itemView);
                        if (--loadedCount === 0) {
                            callback && callback();
                        }
                    });
                });
            }
        }

        onStoreUnbind(store:Store) {
            var arrayStore = this.arrayStore;
            arrayStore.removeListenerScope('add', this.onStoreAdd, this);
            arrayStore.removeListenerScope('remove', this.onStoreRemove, this);
            arrayStore.removeListenerScope('clear', this.onStoreClear, this);
            arrayStore.removeListenerScope('sync', this.onStoreSync, this);
            this.listView.clearItemViews();
        }

        onStoreAdd(e) {
            this.getView(e.data.index, (itemView) => {
                this.listView.addItemView(itemView);
                itemView.gameObject.loadAssets(() => itemView.gameObject.init());
            });
        }

        onStoreRemove(e) {
            this.listView.removeItemViewAt(e.data.index);
        }

        onStoreClear(e) {
            this.listView.clearItemViews();
        }

        onStoreSync(e) {

        }

        protected loadItemView(index:any, callback?:(view:SimpleView) => void) {
            var viewBuilder = new ViewBuilder();
            viewBuilder.setSync();
            viewBuilder.instantiateWithSrc(this.listView.itemViewSrc);
            viewBuilder.addModel(ListView.DEFAUL_ITEM_MODEL_KEY, this.getItem(index));
            viewBuilder.build((error:any, root:WOZLLA.GameObject) => {
                var itemView = <SimpleView>root.getComponent(SimpleView);
                callback && callback(itemView);
            });
        }

    }

    AdapterFactory.register('ListAdapter', ListAdapter);

}