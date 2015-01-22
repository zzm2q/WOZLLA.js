module WOZLLA.layout {

    export class LayoutBase extends Component {

        private _layoutSchedule;

        init():void {
            super.init();
            this.gameObject.addListenerScope('childadd', this.onChildAdd, this);
            this.gameObject.addListenerScope('childremove', this.onChildRemove, this);
            this.requestLayout();
        }

        destroy():void {
            this.gameObject.removeListenerScope('childadd', this.onChildAdd, this);
            this.gameObject.removeListenerScope('childremove', this.onChildRemove, this);
            super.destroy();
        }

        doLayout():void {
        }

        requestLayout() {
            if(this._layoutSchedule) return;
            this._layoutSchedule = WOZLLA.Director.getInstance().scheduler.scheduleFrame(() => {
                this.doLayout();
                this._layoutSchedule = null;
            });
        }

        cancelLayout() {
            this._layoutSchedule && WOZLLA.Director.getInstance().scheduler.removeSchedule(this._layoutSchedule);
            this._layoutSchedule = null;
        }

        protected onChildAdd(e) {
            this.requestLayout();
        }

        protected onChildRemove(e) {
            alert('remove');
            this.requestLayout();
        }

    }

}