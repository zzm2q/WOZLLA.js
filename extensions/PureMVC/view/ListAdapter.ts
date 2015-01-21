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

        onStoreBind(store:Store, callback:Function) {
            var loadedCount = 0;
            var arrayStore = <ArrayStore<Model>>store;
            Assert.isTrue(store instanceof ArrayStore, 'ListAdapter only support bind ArrayStore');
            if(arrayStore.count === 0) {
                callback && callback();
                return;
            }
            arrayStore.each((model:Model, idx:number) => {
                this.loadItemView(idx, ListView.DEFAUL_ITEM_MODEL_KEY, model, () => {
                    loadedCount++;
                    if(loadedCount === arrayStore.count) {
                        callback && callback();
                    }
                })
            });

            arrayStore.addListenerScope('add', this.onStoreAdd, this);
            arrayStore.addListenerScope('remove', this.onStoreRemove, this);
            arrayStore.addListenerScope('clear', this.onStoreClear, this);
            arrayStore.addListenerScope('sync', this.onStoreSync, this);
        }

        onStoreUnbind(store:Store) {
            this.listView.clearItemViews();
        }

        loadItemView(index:any, modelKey:string, model:Model, callback?:Function) {
            var viewBuilder = new ViewBuilder();
            viewBuilder.instantiateWithSrc(this.listView.itemViewSrc);
            viewBuilder.addModel(modelKey, model);
            viewBuilder.build((error:any, root:WOZLLA.GameObject) => {
                var itemView = <SimpleView>root.getComponent(SimpleView);
                this.listView.addItemViewAt(itemView, index);
                callback && callback(itemView);
            });
        }

        onStoreAdd(e) {
            this.loadItemView(e.data.index, ListView.DEFAUL_ITEM_MODEL_KEY, e.data.model, function(itemView) {
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

    }

    AdapterFactory.register('ListAdapter', ListAdapter);

}