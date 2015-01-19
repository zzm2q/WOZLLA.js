# WOZLLA.js

**WOZLLA.js** is a JavaScript/TypeScript 2D Game Engine, it aims to provide a complete solution for HTML5
games creation. It uses WebGL for 2D rendering and is NOT compatible with Canvas2D.

## Getting Started

```javascript
// create a director
var director = new WOZLLA.Director(document.getElementById('canvas'));

// load an image as a SpriteAtlas
director.assetLoader.load('images/panda.png', WOZLLA.assets.SpriteAtlas, function() {
    var spriteAtlas = director.assetLoader.getAsset('images/panda.png');

    // create a GameObject
    var gameObj = new WOZLLA.GameObject();

    // create a SpriteRenderer
    var spriteRenderer = new WOZLLA.component.SpriteRenderer();
    spriteRenderer.sprite = spriteAtlas.getSprite();
    spriteRenderer.spriteOffset = {x: 0.5, y: 0.5};

    // add to the game object
    gameObj.addComponent(spriteRenderer);

    gameObj.init();
    gameObj.transform.setPosition(200, 300);
    director.stage.addChild(gameObj);

    // update transform of the game object and the properties of spriteRenderer each frame
    director.scheduler.scheduleLoop(function() {
        gameObj.transform.rotation++;
        spriteRenderer.color = Math.ceil(Math.random() * 0xFFFFFF);
        spriteRenderer.alpha -= 0.01;
        if(spriteRenderer.alpha < 0) {
            spriteRenderer.alpha = 1;
        }
    });

    // run main loop
    director.start();
});
```

## Current Features

Version 0.5.1 (Released)

* WebGL Rendering
* Assets Management
* Touch Input
* GameObject and Component
* Transform and Tween
* Event System
* Graphics: Sprite/NinePatch/Mask
* Animation: DragonBones
* UI widget: Button/CheckBox

## API References
[API References](http://zzm2q.github.io/WOZLLA.js/docs/api/template.html)


## Change Logs

* Support DragonBones
* Version 0.5.1 (Released)

## RoadMap

Version 1.0
* Auto Assets Management
* Graphics: Primitives/Text
* Animation: Sprite Animation/Skeletal Animation

Version 1.5
* Stability Optimization
* Sound System

Version 2.0
* Enhance the JSON file of GameObject structure, so users could simply build a GameObject tree with JSON files.
* Provide an Editor for visual editing


## Bug Reporting

Please report [issues](https://github.com/zzm2q/WOZLLA.js/issues) with as much info as possible.

