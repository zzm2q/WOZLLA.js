/// <reference path="../../libs/WOZLLA.d.ts"/>
/// <reference path="../../libs/jasmine.d.ts"/>
/// <reference path="../data.ts"/>
module WOZLLA.renderer {

    describe('WOZLLA.renderer', function() {
        describe("ShaderModuleTest", function () {

            var canvas:HTMLCanvasElement = <HTMLCanvasElement>document.createElement('canvas');
            var gl = WebGLUtils.getGLContext(canvas);

            var shaderManager = new ShaderManager(gl);

            it("create and delete program", function () {
                var shaderProgram = shaderManager.createShaderProgram(WOZLLA.test.shaderPair[0], WOZLLA.test.shaderPair[1]);
                expect(shaderProgram).not.toBeUndefined();
                expect(shaderManager.getShaderProgram(shaderProgram.id)).not.toBeUndefined();
                shaderManager.deleteShaderProgram(shaderProgram);
                expect(shaderManager.getShaderProgram(shaderProgram.id)).toBeUndefined();
            });

            it("clear shader program", function () {
                var shaderProgram1 = shaderManager.createShaderProgram(WOZLLA.test.shaderPair[0], WOZLLA.test.shaderPair[1]);
                var shaderProgram2 = shaderManager.createShaderProgram(WOZLLA.test.shaderPair[0], WOZLLA.test.shaderPair[1]);
                shaderManager.clear();
                expect(shaderManager.getShaderProgram(shaderProgram1.id)).toBeUndefined();
                expect(shaderManager.getShaderProgram(shaderProgram2.id)).toBeUndefined();
            });
        });
    });


}