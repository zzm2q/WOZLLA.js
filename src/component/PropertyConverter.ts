/// <reference path="../math/Rectangle.ts"/>
module WOZLLA.component {

    export class PropertyConverter {

        public static array2rect(arr:Array<number>):WOZLLA.math.Rectangle {
            return new WOZLLA.math.Rectangle(arr[0], arr[1], arr[2], arr[3]);
        }

    }

}