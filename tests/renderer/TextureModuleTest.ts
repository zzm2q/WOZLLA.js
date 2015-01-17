/// <reference path="../../libs/WOZLLA.d.ts"/>
/// <reference path="../../libs/jasmine.d.ts"/>
/// <reference path="../data.ts"/>
/// <reference path="test_help_classes.ts"/>
module WOZLLA.renderer {

    describe('WOZLLA.renderer', function() {
        describe("TextureModuleTest", function () {

            var canvas:HTMLCanvasElement = <HTMLCanvasElement>document.createElement('canvas');
            var gl = WebGLUtils.getGLContext(canvas);

            // create texture manager
            var textureManager = new TextureManager(gl);

            it("generate and delete texture from canvas", function () {
                var source = document.createElement('canvas');
                source.width = 100;
                source.height = 100;
                source.getContext('2d').fillRect(20, 20, 60, 60);
                var textureDescriptor = new Test_HTMLImageDescriptor(source);
                var texture = textureManager.generateTexture(textureDescriptor);
                expect(texture).toBeDefined();
                textureManager.deleteTexture(texture);
                expect(textureManager.getTexture(texture.id)).toBeUndefined();
            });

            it("generate and delete from pvrtc format", function () {
                if (WebGLExtension.getExtension(gl, WebGLExtension.PVRTC, false)) {
                    var textureDescriptor = new Test_PVRDescriptor(WOZLLA.test.pvrData, PixelFormat.PVRTC4);
                    var texture = textureManager.generateTexture(textureDescriptor);
                    expect(texture).toBeDefined();
                    textureManager.deleteTexture(texture);
                    expect(textureManager.getTexture(texture.id)).toBeUndefined();
                }
            });

            it("clear all generated texture", function () {
                var source = document.createElement('canvas');
                source.width = 100;
                source.height = 100;
                source.getContext('2d').fillRect(20, 20, 60, 60);
                var textureDescriptor = new Test_HTMLImageDescriptor(source);
                var texture1 = textureManager.generateTexture(textureDescriptor);
                var texture2 = textureManager.generateTexture(new Test_HTMLImageDescriptor(source));
                textureManager.clear();
                expect(textureManager.getTexture(texture1.id)).toBeUndefined();
                expect(textureManager.getTexture(texture2.id)).toBeUndefined();
            });
        });
    });


}