///<reference path='AdapterView.ts'/>
///<reference path='ListAdapter.ts'/>
module WOZLLA.PureMVC {

    export class ListView extends AdapterView {

        public static DEFAUL_ITEM_MODEL_KEY = 'item';

        get itemViewSrc():string {
            return this._itemViewSrc;
        }
        set itemViewSrc(src:string) {
            this._itemViewSrc = src;
        }

        _itemViewSrc:string;
        _itemViews:SimpleView[]= [];

        addItemViewAt(itemView:SimpleView, idx:number) {
            this._itemViews.splice(idx, 0, itemView);
            itemView.gameObject.z = idx;
            this.gameObject.addChild(itemView.gameObject);
        }

        removeItemViewAt(idx:number) {
            var itemView:SimpleView = this._itemViews[idx];
            this._itemViews.splice(idx, 1);
            itemView.gameObject.destroy();
            itemView.gameObject.removeMe();
        }

        clearItemViews() {
            this.gameObject.eachChild((child) => {
                child.destroy();
                child.removeMe();
            });
            this._itemViews.length = 0;
        }

        addItemView(itemView:SimpleView) {
            this.addItemViewAt(itemView, this._itemViews.length);
        }

        getItemViewAt(idx:number):SimpleView {
            return this._itemViews[idx];
        }

        removeItemView(itemView:SimpleView) {
            var idx = this.indexOf(itemView);
            this.removeItemViewAt(idx);
        }

        indexOf(itemView:SimpleView) {
            return this._itemViews.indexOf(itemView);
        }

    }

    WOZLLA.Component.register(ListView, {
        name: 'MVC.ListView',
        properties: [
        Component.extendConfig(AdapterView),
        {
            name: 'itemViewSrc',
            type: 'string'
        }]
    });

}