///<reference path='../../libs/puremvc-typescript-multicore-1.1.d.ts'/>
///<reference path='../../libs/WOZLLA.d.ts'/>
module WOZLLA.PureMVC {

    var modelIdGen = 0;
    function generateModelId():string {
        return ++modelIdGen + '';
    }

    export class Model extends WOZLLA.event.EventDispatcher {

        protected data:any = {
            _modelId: generateModelId()
        };
        protected definedField:any = {};

        constructor() {
            this.initFields();
        }

        initFields() {
            this.defineField('_modelId');
        }

        defineField(field:string) {
            this.definedField[field] = true;
        }

        get(field:string):any {
            Assert.isTrue(this.definedField[field], 'Field not defined: ' + field);
            return this.data[field];
        }

        set(field:string, value:any, silent:boolean=false) {
            var oldValue;
            Assert.isTrue(this.definedField[field], 'Field not defined: ' + field);
            oldValue = this.data[field];
            this.data[field] = value;
            if(!silent) {
                this.dispatchEvent(new WOZLLA.event.Event(
                    'fieldchanged', true, new FieldChangeEventData(field, value, oldValue)));
            }
        }

    }

    export class FieldChangeEventData {

        get field():string { return this._field; }
        get value():any { return this._value; }
        get oldValue():any { return this._oldValue; }

        _field:string;
        _value:any;
        _oldValue:any;

        constructor(field:string, value:any, oldValue:any) {
            this._field = field;
            this._value = value;
            this._oldValue = oldValue;
        }

    }

}