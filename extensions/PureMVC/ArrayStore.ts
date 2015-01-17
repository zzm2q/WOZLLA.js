///<reference path='../../libs/puremvc-typescript-multicore-1.1.d.ts'/>
///<reference path='../../libs/WOZLLA.d.ts'/>
///<reference path='Model.ts'/>
///<reference path='Store.ts'/>
module WOZLLA.PureMVC {

    export class ArrayStore<T extends Model> extends Store {

        protected list = [];

        get count():number { return this.list.length; }

        add(model:T, silent:boolean=false) {
            this.list.push(model);
            if(!silent) {
                this.dispatchEvent(new WOZLLA.event.Event('add', true, model));
            }
        }

        addAt(model:T, index:number, silent:boolean=false) {
            this.list.splice(index, 0, model);
            if(!silent) {
                this.dispatchEvent(new WOZLLA.event.Event('add', true, model));
            }
        }

        remove(model:T, silent:boolean=false) {
            var index = this.indexOf(model);
            this.list.splice(index, 1);
            if(!silent) {
                this.dispatchEvent(new WOZLLA.event.Event('remove', true, model));
            }
        }

        removeAt(index:number, silent:boolean=false) {
            var model = this.list[index];
            this.list.splice(index, 1);
            if(!silent) {
                this.dispatchEvent(new WOZLLA.event.Event('remove', true, model));
            }
        }

        clear(silent:boolean=false) {
            this.list.length = 0;
            if(!silent) {
                this.dispatchEvent(new WOZLLA.event.Event('clear', true));
            }
        }

        getAt(index:number) {
            return this.list[index];
        }

        getRange(start:number, count:number):Array<T> {
            return this.list.slice(start, start+count);
        }

        indexOf(model:T) {
            return this.list.indexOf(model);
        }

        sync() {
            this.dispatchEvent(new WOZLLA.event.Event('sync', true));
        }

        each(func:(model:T, index:number) => any) {
            var list = this.list.slice(0);
            list.forEach(func);
        }

        query(func:(model:T, index:number) => any):Array<T> {
            var result = [];
            this.each((model:T, index:number) => {
                if(func(model, index)) {
                    result.push(model);
                }
            });
            return result;
        }

        sort(func:(a:T, b:T) => any, silent:boolean=false) {
            this.list.sort(func);
            if(!silent) {
                this.dispatchEvent(new WOZLLA.event.Event('sort', true));
            }
        }

    }

}