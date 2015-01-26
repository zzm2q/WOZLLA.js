///<reference path='View.ts'/>
///<reference path='../model/Model.ts'/>
module WOZLLA.PureMVC {

    export class SimpleView extends View {

        get modelKey():string { return this._modelKey; }
        set modelKey(key:string) { this._modelKey = key; }

        get model():Model {
            return this._model;
        }

        _model:Model;
        _modelKey:string;
        _binder:SimpleBinder;

        onDestroy():void {
            this.unbindModel();
            super.onDestroy();
        }

        bindModel(model:Model) {
            if(this._model) {
                this.unbindModel();
            }
            model.addListenerScope('fieldchanged', this.onModelFieldChange, this);
            this._model = model;
            this.onModelBind(model);
        }

        unbindModel() {
            var model;
            if(!this._model) return;
            model = this._model;
            model.removeListenerScope('fieldchanged', this.onModelFieldChange, this);
            this._model = null;
            this.onModelUnbind(model);
        }

        onModelFieldChange(e) {
            this._binder.onModelFieldChange(e);
        }

        onModelBind(model:Model) {
            if(this._binder) {
                this._binder.onModelBind(model);
            }
        }

        onModelUnbind(model:Model) {
            if(this._binder) {
                this._binder.onModelUnbind(model);
            }
        }

        setBinder(binder:SimpleBinder) {
            if(this._binder && this._model) {
                this._binder.onModelUnbind(this._model);
            }
            this._binder = binder;
            if(this._model && binder) {
                this._binder.onModelBind(this._model);
            }
        }

    }

    Component.register(SimpleView, {
        name: 'MVC.SimpleView',
        properties: [{
            name: 'modelKey',
            type: 'string'
        }]
    });

}