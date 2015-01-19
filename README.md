# WOZLLA.js

**WOZLLA.js** is a JavaScript/TypeScript 2D Game Engine, it aims to provide a complete solution for HTML5
games creation. It uses WebGL for 2D rendering and is NOT compatible with Canvas2D.

## Getting Started

```javascript
// create director and start main loop
var director = new WOZLLA.Director(document.getElementById('canvas'));
director.start();

// new a GameObject
var gameObj = new WOZLLA.GameObject();
// create a sprite renderer
var spriteRenderer = new WOZLLA.component.SpriteRenderer();
// set image src
spriteRenderer.imageSrc = 'images/panda.png';
// add to gameObj
gameObj.addComponent(spriteRenderer);

// this would automatically load all assets of gameObj, children and children's children.
gameObj.loadAssets(function() {
    // init gameObj
    gameObj.init();
    // add to stage
    director.stage.addChild(gameObj);
});
```

## Current Features

Version 0.5.1 (Released)

* WebGL Rendering
* GameObject and Component
* Transform and Tween
* Event System
* Touch Input
* Graphics: Sprite/NinePatch/Mask
* Animation: DragonBones
* UI widget: Button/CheckBox
* Automatically Assets Management

## API References
[API References](http://zzm2q.github.io/WOZLLA.js/docs/api/template.html)


## Change Logs

* Auto Assets Management
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

## MIT License

