"use strict";
var Translucent = {
    cmap: null,
    flagDataLoaded: false,
    brain: null,
    stats:null,
    scene: null,
    renderer: null,
    composer: null,
    camera: null,
    cameraControls: null,
    light: null,
    geometry: null,
    surfacemesh: null,
    coordinates: null,
    container: null,
    loadScript: function loadScript(path) {
        var def = new $.Deferred();
        var s = document.createElement("script");
        s.src = path;
        s.onload=function () {
            console.log("Loaded",path);
            def.resolve();
        };
        document.body.appendChild(s);
        return def.promise();
    },
    widget: function widget(param) {
        var me = Translucent;
        me.coordinates = param.coordinates;
        me.container = param.container;
        
        console.log("Loading libraries");
        me.loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/84/three.min.js')
        .then(function(){return me.loadScript('https://cdn.rawgit.com/mrdoob/three.js/dev/examples/js/controls/TrackballControls.js')})
        .then(function(){return me.loadScript('https://cdn.rawgit.com/mrdoob/three.js/dev/examples/js/modifiers/SubdivisionModifier.js')})
        .then(function(){return me.loadScript('https://cdn.rawgit.com/mrdoob/three.js/dev/examples/js/loaders/BinaryLoader.js')})
        .then(function(){
            console.log("all libraries loaded \o/");
            me.init();
            me.animate();
        });
    },
    init: function init() {
        var me = Translucent;
        var w, h;
        w = me.container.width();
        h = me.container.height();
    // init the scene
        me.renderer = new THREE.WebGLRenderer({
            antialias				: true,	// to get smoother output
            preserveDrawingBuffer	: true	// to allow screenshot
        });
        me.renderer.setSize( w, h );
        document.getElementById('container').appendChild(me.renderer.domElement);
        me.scene = new THREE.Scene();
        me.scene.background = new THREE.Color( 0xffffff );
        me.camera	= new THREE.PerspectiveCamera(35, w/h, 10, 100 );
        me.camera.position.set(0, 0, 40);
        me.scene.add(me.camera);

        // create a camera control
        me.cameraControls=new THREE.TrackballControls(me.camera,me.container[0] )
        me.cameraControls.addEventListener( 'change', function(){me.light.position.copy( me.camera.position );} );
        me.cameraControls.rotateSpeed = 6;

        me.light	= new THREE.AmbientLight( Math.random() * 0xffffff );
        me.scene.add( me.light );
        me.light	= new THREE.PointLight( 0xffffff,2,80 );
        me.light.position.copy( me.camera.position );
        me.scene.add( me.light );

        var loader = new THREE.BinaryLoader(true);
        loader.load("lrh3.js", function(geom,material){
            var material	= new THREE.ShaderMaterial({
                uniforms: { 
                    coeficient	: {
                        type	: "f", 
                        value	: 1.0
                    },
                    power		: {
                        type	: "f",
                        value	: 2
                    },
                    glowColor	: {
                        type	: "c",
                        value	: new THREE.Color('grey')
                    },
                },
                vertexShader	: [ 'varying vec3	vVertexWorldPosition;',
                                    'varying vec3	vVertexNormal;',
                                    'varying vec4	vFragColor;',
                                    'void main(){',
                                    '	vVertexNormal	= normalize(normalMatrix * normal);',
                                    '	vVertexWorldPosition	= (modelMatrix * vec4(position, 1.0)).xyz;',
                                    '	gl_Position	= projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
                                    '}',
                                    ].join('\n'),
                fragmentShader	: [ 'uniform vec3	glowColor;',
                                    'uniform float	coeficient;',
                                    'uniform float	power;',
                                    'varying vec3	vVertexNormal;',
                                    'varying vec3	vVertexWorldPosition;',
                                    'varying vec4	vFragColor;',
                                    'void main(){',
                                    '	vec3 worldCameraToVertex= vVertexWorldPosition - cameraPosition;',
                                    '	vec3 viewCameraToVertex	= (viewMatrix * vec4(worldCameraToVertex, 0.0)).xyz;',
                                    '	viewCameraToVertex	= normalize(viewCameraToVertex);',
                                    '	float intensity		= pow(coeficient + dot(vVertexNormal, viewCameraToVertex), power);',
                                    '	gl_FragColor		= vec4(glowColor, intensity);',
                                    '}',
                                ].join('\n'),
                transparent	: true,
                depthWrite	: false,
            });

            var modifier = new THREE.SubdivisionModifier(1);
            modifier.modify(geom);
            for(var i=0;i<geom.vertices.length;i++)
            {
                geom.vertices[i].x*=0.14;
                geom.vertices[i].y*=0.14;
                geom.vertices[i].z*=0.14;
                geom.vertices[i].y+=3;
                geom.vertices[i].z-=2;
            }
            me.brain=new THREE.Mesh(geom,material);
            me.scene.add(me.brain);
        
            // Add stereotaxic coordinates as spheres
            geom = new THREE.SphereGeometry(1,16,16);
            var	color=0xff0000;
            for(var j=0;j<me.coordinates.length;j++)
            {
                var x=me.coordinates[j][0];
                var y=me.coordinates[j][1];
                var z=me.coordinates[j][2];
                var sph = new THREE.Mesh( geom, new THREE.MeshLambertMaterial({color: color}));
                sph.position.x=parseFloat(x)*0.14;
                sph.position.y=parseFloat(y)*0.14+3;
                sph.position.z=parseFloat(z)*0.14-2;
                me.scene.add(sph);
            }
        
            me.flagDataLoaded = true;
        });
        return false;
    },
    animate: function animate() {
        var me = Translucent;
        requestAnimationFrame( me.animate );
        if(me.flagDataLoaded)
            me.render();
    },
    render: function render() {
        var me = Translucent;
        me.cameraControls.update();
        me.renderer.render( me.scene, me.camera );
    }
}
