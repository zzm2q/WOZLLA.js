/// <reference path="../core/Component.ts"/>
/// <reference path="../utils/StateMachine.ts"/>
/// <reference path="../component/renderer/SpriteRenderer.ts"/>
module WOZLLA.ui {

    var StateMachine = WOZLLA.utils.StateMachine;

    /**
     * @class WOZLLA.ui.StateWidget
     * @protected
     */
    export class StateWidget extends Component {

        get spriteAtlas():WOZLLA.assets.SpriteAtlas { return this._spriteAtlas; }
        set spriteAtlas(value:WOZLLA.assets.SpriteAtlas) { this._spriteAtlas = value; }

        _stateMachine:WOZLLA.utils.StateMachine = new WOZLLA.utils.StateMachine();

        _spriteRenderer:WOZLLA.component.SpriteRenderer;
        _spriteAtlas:WOZLLA.assets.SpriteAtlas;

        listRequiredComponents():Array<Function> {
            return [WOZLLA.component.SpriteRenderer];
        }

        init():void {
            this._stateMachine.addListener(StateMachine.INIT, (e) => this.onStateChange(e));
            this._stateMachine.addListener(StateMachine.CHANGE, (e) => this.onStateChange(e));
            this._spriteRenderer = <WOZLLA.component.SpriteRenderer>this.gameObject.renderer;
            super.init();
        }

        protected getStateSpriteName(state:string):string {
            return this._stateMachine.getStateData(state, 'spriteName');
        }

        protected setStateSpriteName(state:string, spriteName:string) {
            this._stateMachine.setStateData(state, 'spriteName', spriteName);
        }

        protected onStateChange(e) {
            this._spriteRenderer.sprite = this._spriteAtlas.getSprite(this.getStateSpriteName(e.data.state));
        }

    }

}