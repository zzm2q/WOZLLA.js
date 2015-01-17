/// <reference path="../../libs/WOZLLA.d.ts"/>
/// <reference path="../../libs/jasmine.d.ts"/>
/// <reference path="../data.ts"/>
module WOZLLA.renderer {

    describe('WOZLLA.renderer', function() {
        describe("LayerManagerTest", function () {

            it("define and undefine layer", function () {
                var layerManager = new LayerManager();
                layerManager.define('layer1', 0);
                expect(layerManager.getZIndex('layer1')).toBe(0);
                layerManager.undefine('layer1');
                expect(layerManager.getZIndex('layer1')).toBeUndefined();
            });

            it("layer order", function() {
                var layerManager = new LayerManager();
                layerManager.define('layer1', 0);
                layerManager.define('layer2', 1);
                expect(layerManager.getZIndex('layer1')).toBe(0);
                expect(layerManager.getZIndex('layer2')).toBe(1);
                var layers = layerManager.getSortedLayers();
                expect(layers.indexOf('layer1') < layers.indexOf('layer2')).toBeTruthy();
            });

        });
    });


}