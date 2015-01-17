/// <reference path="../../libs/WOZLLA.d.ts"/>
/// <reference path="../../libs/jasmine.d.ts"/>
/// <reference path="../data.ts"/>
/// <reference path="test_help_classes.ts"/>
module WOZLLA.renderer {

    describe('WOZLLA.renderer', function() {
        describe("RendererTest", function () {

            it("render quad with default material", function (done) {

                var flag = false;

                waitsFor(function() {
                    return flag;
                }, "load image", 1000);

                var image = new Image();
                image.src = 'images/cursor.png';
                image.onload = function() {
                    // create renderer
                    var canvas = document.createElement('canvas');
//                    document.body.appendChild(canvas);
                    Renderer.MAX_QUAD_SIZE = 1;
                    var renderer = new Renderer(WebGLUtils.getGLContext(canvas), {
                        x: 0,
                        y: 0,
                        width: canvas.width,
                        height: canvas.height
                    });
                    renderer.layerManager.define('main', 0);

                    // create texture
//                    var texCanvas = document.createElement('canvas');
//                    texCanvas.width = texCanvas.height = 50;
//                    var texContext = texCanvas.getContext('2d');
//                    console.log(texContext);
//                    texContext.fillStyle = '#000000';
//                    texContext.fillRect(0, 0, 50, 50);
                    var texture = renderer.textureManager.generateTexture(new Test_HTMLImageDescriptor(image));

                    var frame = {
                        x: 0,
                        y: 0,
                        width: 50,
                        height: 50
                    };
                    var offset = {
                        x: 0,
                        y: 0
                    };
                    var tw = frame.width;
                    var th = frame.height;
                    var uvs:any = {};
                    uvs.x0 = frame.x / tw;
                    uvs.y0 = frame.y / th;
                    uvs.x1 = (frame.x + frame.width) / tw;
                    uvs.y1 = frame.y / th;
                    uvs.x2 = (frame.x + frame.width) / tw;
                    uvs.y2 = (frame.y + frame.height) / th;
                    uvs.x3 = frame.x / tw;
                    uvs.y3 = (frame.y + frame.height) / th;

                    var w1 = offset.x;
                    var w0 = w1 + frame.width;

                    var h1 = offset.y;
                    var h0 = h1 + frame.height;

                    var a = 1;
                    var c = 0;
                    var b = 0;
                    var d = 1;
                    var tx = 0;
                    var ty = 0;

                    var x1 = a * w1 + b * h1 + tx;
                    var y1 = d * h1 + c * w1 + ty;
                    var x2 = a * w0 + b * h1 + tx;
                    var y2 = d * h1 + c * w0 + ty;
                    var x3 = a * w0 + b * h0 + tx;
                    var y3 = d * h0 + c * w0 + ty;
                    var x4 = a * w1 + b * h0 + tx;
                    var y4 = d * h0 + c * w1 + ty;

                    var quad = new Quad(1);
                    quad.setVertices(x1, y1, x2, y2, x3, y3, x4, y4);
                    quad.setTexCoords(uvs.x0, uvs.y0, uvs.x1, uvs.y1, uvs.x2, uvs.y2, uvs.x3, uvs.y3);
                    quad.setAlpha(1);
                    quad.setColor(0xFFFFFF);
                    renderer.addCommand(QuadCommand.init(0, 'main', texture, IMaterial.DEFAULT, quad));
                    renderer.render();

                    expect(1).toBe(1);
                    flag = true;
                };
            });

        });
    });


}