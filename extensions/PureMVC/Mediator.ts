module WOZLLA.PureMVC {

    export class Mediator extends puremvc.Mediator {

        getStage():WOZLLA.Stage {
            return Director.getInstance().stage;
        }

        getView():View {
            return <View>this.getViewComponent();
        }

        show(callback?:Function) {
            var view = this.getView();
            this.getStage().addChild(view.gameObject);
            callback && callback();
        }

        hide(callback?:Function) {
            var view = this.getView();
            view.gameObject.removeMe();
            callback && callback();
        }

        close(callback?:Function) {
            var view = this.getView();
            view.gameObject.destroy();
            view.gameObject.removeMe();
            callback && callback();
        }
    }

}