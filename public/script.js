console.log("hello world");
//create scene VARIABLES
var scene;
var camera;
var fieldOfView;
var aspectRatio;
var nearPlane;
var farPlane;
var HEIGHT;
var WIDTH;
var renderer;
var container;
// event handlers
var mousePos = {x:0, y: 0};
//create lights VARIABLES
var hemisphereLight;
var shadowLight;
// object VARIABLES
var sea;
var sky;
var airplane;
var Colors = {
	red:0xf25346,
	white:0xffffff,
	brown:0x59332e,
	pink:0xF5986E,
	brownDark:0x23190f,
	blue:0x68c3c0,
};

window.addEventListener('load', init, false);

function createScene() {
    //setup
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    //scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);
    //camera
    aspectRatio = WIDTH / HEIGHT;
    fieldOfView = 60;
    nearPlane = 1;
    farPlane = 10000;
    camera = new THREE.PerspectiveCamera(
        fieldOfView,
        aspectRatio,
        nearPlane,
        farPlane
    );
    //Camera positions
    camera.position.x = 0;
    camera.position.z = 200;
    camera.position.y = 100;
    //renderer
    renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias:true
    })
    //full screen
    renderer.setSize(WIDTH, HEIGHT);
    //enable shadows
    renderer.shadowMap.enabled = true;
    //DOM element
    container = document.getElementById('world');
    container.appendChild(renderer.domElement);
    //resize
    window.addEventListener('resize', handleWindowResize, false)
}

function handleMouseMove(event) {
    // horizontal axis
    var tx = -1 + (event.clientX / WIDTH)*2;
    // vertical axis
    var ty = 1 - (event.clientY / HEIGHT)*2;
    mousePos = {x:tx, y:ty}
}

function handleWindowResize() {
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
}

function createLights() {
    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .8);
    shadowLight = new THREE.DirectionalLight(0xffffff, .8)
    //light direction
    shadowLight.position.set(150, 350, 350);
    //enable shadows
    shadowLight.castShadow = true
    //define visiable shadows
    shadowLight.shadow.camera.left = -400;
    shadowLight.shadow.camera.right = 400;
    shadowLight.shadow.camera.top = 400;
    shadowLight.shadow.camera.bottom = -400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;
    //shadow resolution
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;
    // Ambient light
    ambientLight = new THREE.AmbientLight(0xffffff, .6);
    scene.add(ambientLight)
    //light activation
    scene.add(hemisphereLight);
    scene.add(shadowLight);
}

Sea = function() {
    // create Shape
    var geom = new THREE.CylinderGeometry(600,600,800,40,10);
    geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));
    //wave merge
    geom.mergeVertices();
    // get wave vertices
    var l = geom.vertices.length;
    // store data associated to each vertex
    this.waves = [];
    for (var i = 0; i < l; i++) {
        var v = geom.vertices[i];
        this.waves.push({
            y: v.y,
            x: v.x,
            z: v.z,
            ang: Math.random()*Math.PI*2,
            amp: 5 + Math.random()*15,
            speed: 0.016 + Math.random()*0.032
        });
    }
    // create material
    var mat = new THREE.MeshPhongMaterial({
        color: Colors.brown,
        transparent: true,
        opacity: .6,
        shading: THREE.FlatShading
    });
    // create the object
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.receiveShadow = true;
}

Sea.prototype.moveWaves = function() {
    var verts = this.mesh.geometry.vertices;
    var l = verts.length;
    for (var i = 0; i < l; i++) {
        var v = verts[i];
        // associated data
        var vprops = this.waves[i];
        // update vertex position
        v.x = vprops.x + Math.cos(vprops.ang)*vprops.amp;
        v.y = vprops.y + Math.sin(vprops.ang)*vprops.amp;
        //increment angle for next frame
        vprops.ang += vprops.speed;
    }
    this.mesh.geometry.verticesNeedUpdate = true;
    sea.mesh.rotation.z += .005
}

Cloud = function() {
    //empty container to hold cloud
    this.mesh = new THREE.Object3D()
    // basic shape to be duplicated
    var geom = new THREE.BoxGeometry(20,20,20);
    // basic cloud material
    var mat = new THREE.MeshPhongMaterial({color: Colors.white})
    // duplication
    var nBlocs = 3+Math.floor(Math.random()*3);
    for (var i = 0; i < nBlocs; i++) {
        // create mesh by cloning geo
        var m = new THREE.Mesh(geom, mat);
        //random position of cloned elements
        m.position.x = i*15;
        m.position.y = Math.random()*10;
        m.position.z = Math.random()*10;
        m.position.z = Math.random()*Math.PI*2;
        m.position.y = Math.random()*Math.PI*2;
        //random size of cloned elements
        var s = .1 + Math.random()*.9;
        m.scale.set(s,s,s);
        // recieve shadows
        m.castShadow = true;
        m.receiveShadow = true;
        //add the cloned elements to container
        this.mesh.add(m);
    }
}

Sky = function() {
    //empty container
    this.mesh = new THREE.Object3D();
    // number of clouds
    this.nClouds = 30;
    // cloud angle
    var stepAngle = Math.PI*2 / this.nClouds;
    // create clouds
    for (var i = 0; i < this.nClouds; i ++) {
        var c = new Cloud();
        // final angle of the cloud
        var a = stepAngle*i
        // distance between center of axis and the cloud
        var h = 750 + Math.random()*200;
        c.mesh.position.y = Math.sin(a)*h;
        c.mesh.position.x = Math.cos(a)*h;
        //rotate according to cloud position
        c.mesh.rotation.z = a + Math.PI / 2;
        // cloud depth
        c.mesh.position.z = -400-Math.random()*400;
        // cloud scale
        var s = 1 + Math.random()*3;
        c.mesh.scale.set(s,s,s);
        // add cloud
        this.mesh.add(c.mesh)
    }
}

var AirPlane = function() {
    this.mesh = new THREE.Object3D();
    // create the cabin
    var geomCockpit = new THREE.SphereGeometry(50,6,6);
    var matCockpit = new THREE.MeshPhongMaterial( { color: 0x000000, transparent: true, opacity: 0.5, shading: THREE.FlatShading });
    //altering the cockit Shape
    // geomCockpit.vertices[4].z += 20;
    // geomCockpit.vertices[21].y += 20;
    // geomCockpit.vertices[20].y += 20;
    // geomCockpit.vertices[19].y += 20;
    // geomCockpit.vertices[18].y += 20;
    // geomCockpit.vertices[17].y += 20;
    // geomCockpit.vertices[16].y += 20;
    //combining cockpit
    var cockpit = new THREE.Mesh(geomCockpit, matCockpit);
    cockpit.position.y = 15;
    cockpit.castShadow = true;
    cockpit.recieveShadow = true;
    this.mesh.add(cockpit);
    // create the engine
    var geomEngine = new THREE.CylinderGeometry(70,90,15, 9, 55);
    var geomEngineBottom = new THREE.CylinderGeometry(90, 60, 30,9, 55)
    var matEngine = new THREE.MeshPhongMaterial({color: Colors.white, shading: THREE.FlatShading})
    var engine = new THREE.Mesh(geomEngine, matEngine);
    var engineBottom = new THREE.Mesh(geomEngineBottom, matEngine)
    engine.position.x = 0;
    engineBottom.position.y = -23;
    engine.castShadow = true;
    engine.recieveShadow = true;
    this.mesh.add(engine);
    this.mesh.add(engineBottom)
    // create the tailPlane
    // var geomTailPlane = new THREE.BoxGeometry(15,20,5,1,1,1);
    // var matTailPlane = new THREE.MeshPhongMaterial({color:Colors.red, shading: THREE.FlatShading})
    // var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
    // tailPlane.position.set(-35, 25, 0);
    // tailPlane.castShadow = true;
    // tailPlane.recieveShadow = true;
    // this.mesh.add(tailPlane);
    // Create the Wings
    // var geoSideWing = new THREE.BoxGeometry(40, 4, 300,5,5);
    // var matSideWIng = new THREE.MeshPhongMaterial({color:Colors.red, shading: THREE.FlatShading});
    // var sideWing = new THREE.Mesh(geoSideWing, matSideWIng);

    // geoSideWing.vertices[25].x += 30
    // geoSideWing.vertices[25].z -= 30
    // geoSideWing.vertices[14].x += 30
    // geoSideWing.vertices[14].z -= 30
    // sideWing.castShadow = true
    // sideWing.recieveShadow = true;
    // this.mesh.add(sideWing);
    // // propellor
    // var geomPropeller = new THREE.BoxGeometry(20,10,10,1,1,1);
    // var matPropeller = new THREE.MeshPhongMaterial({color:Colors.brown, shading: THREE.FlatShading})
    // this.propellor = new THREE.Mesh(geomPropeller, matPropeller);
    // this.propellor.castShadow = true;
    // this.propellor.recieveShadow = true;
    // //blades
    // var geomBlade = new THREE.BoxGeometry(1,100,20,1,1,1);
    // var matBlade = new THREE.MeshPhongMaterial({color:Colors.brownDark, shading: THREE.FlatShading});
    // var blade = new THREE.Mesh(geomBlade, matBlade);
    // blade.position.set(8,0,0);
    // blade.castShadow = true;
    // blade.receiveShadow =true;
    // this.propellor.add(blade);
    // this.propellor.position.set(50,0,0);
    // this.mesh.add(this.propellor);
}


function updatePlane() {
    //plane movements
    var targetX = normalize(mousePos.x, -.75, .75 , -100, 100);
    var targetY = normalize(mousePos.y, -.75, .75, 25, 175);
    // update plane position
    airplane.mesh.position.y += (targetY - airplane.mesh.position.y)*0.1;
    airplane.mesh.rotation.z = (targetY - airplane.mesh.position.y)*0.0128;
    airplane.mesh.rotation.x = (airplane.mesh.position.y - targetY)*0.0064;
    // airplane.propellor.rotation.x += 0.3;
}


function normalize(v, vmin, vmax, tmin, tmax) {
    var nv = Math.max(Math.min(v, vmax), vmin);
    var dv = vmax - vmin;
    var pc = (nv - vmin) / dv;
    var dt = tmax - tmin;
    var tv = tmin + (pc * dt);
    return tv;
}

var Pilot = function() {
    this.mesh = new THREE.Object3D();
    this.mesh.name = "pilot";
    // animate the hair
    this.angleHairs = 0;
    // create pilot body
    var bodyGeom = new THREE.BoxGeometry(15,15,15);
    var bodyMat = new THREE.MeshPhongMaterial({color: Colors.brown, shading: THREE.FlatShading})
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.set(2, -12, 0);
    this.mesh.add(body);
    //create the face
    var faceGeom = new THREE.BoxGeometry(10, 10, 10);
    var faceMat = new THREE.MeshLambertMaterial({color: Colors.pink});
    var face = new THREE.Mesh(faceGeom, faceMat);
    this.mesh.add(face);
    //create the hair element
    var hairGeom = new THREE.BoxGeometry(4,4,4);
    var hairMat = new THREE.MeshLambertMaterial({color: Colors.brown})
    var hair = new THREE.Mesh(hairGeom, hairMat);
    //align shape to it bottom boundary (easier to scale)
    hair.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,2,0));
    // hair container
    var hairs = new THREE.Object3D();
    // top hair container for animated hair
    this.hairsTop = new THREE.Object3D();
    // top hairs positioned 3*4 grid
    for (var i = 0; i < 12; i++) {
        var h = hair.clone();
        var col = i%3;
        var row = Math.floor(i/3);
        var startPosZ = -4;
        var startPosX = -4;
        h.position.set(startPosX + row * 4, 0, startPosZ + col * 4);
        this.hairsTop.add(h);
    }
    hairs.add(this.hairsTop);
    // side hairs
    var hairSideGeom = new THREE.BoxGeometry(12, 4, 2);
    hairSideGeom.applyMatrix(new THREE.Matrix4().makeTranslation(-6, 0, 0));
    hairSideR = new THREE.Mesh(hairSideGeom, hairMat);
    hairSideL = hairSideR.clone();
    hairSideR.position.set(8, -2, 6);
    hairSideL.position.set(8, -2, -6);
    hairs.add(hairSideR);
    hairs.add(hairSideL);
    // back hair
    var hairBackGeom = new THREE.BoxGeometry(2, 8, 10);
    var hairBack = new THREE.Mesh(hairBackGeom, hairMat);
    hairBack.position.set(-1, -4, 0);
    hairs.add(hairBack);
    hairs.position.set(-5, 5, 0);
    this.mesh.add(hairs);
    // glasses creator
    var glassGeom = new THREE.BoxGeometry(5, 5, 5);
    var glassMat = new THREE.MeshLambertMaterial({color:Colors.brown})
    var glassR = new THREE.MEsh(glassGeom, glassMat);
    glassR.position.set(6, 0, 3);
    var glassL = glassR.clone();
    glassL.Position.z = -glassR.position.z;
    var glassAGeom = new THREE.BoxGeometry(11, 1, 11);
    var glassA = new THREE.Mesh(glassAGeom, glassMat);
    this.mesh.add(glassR);
    this.mesh.add(glassL);
    this.mesh.add(glassA);
    // ear geometry
    var earGeom = new THREE.BoxGeometry(2, 3, 2);
    var earL = new THREe.Mesh(earGeom, faceMat);
    earL.position.set(0, 0, -6);
    var earR = earL.clone();
    earR.position.set(0, 0, 6);
    this.mesh.add(earL);
    this.mesh.add(earR);
}

//move pilots hair
Pilot.prototype.updateHairs = function() {
    var hairs = this.hairsTop.children;
    // update hair according to angle of angleHairs
    var l = hairs.length;
    for (var i = 0; i < l; i++) {
        var h = hairs[i];
        //each hair will scale on cyclindrical basis between 75% and 100% of the original
        h.scale.y = .75 + Math.cos(this.angleHairs + i/3)*.25
    }
    //increment the angleHairs
    this.angleHairs += 0.16;
}

function createSea() {
    sea = new Sea();
    // sea position
    sea.mesh.position.y = -600;
    // add sea mesh to scene
    scene.add(sea.mesh)
}

function createSky() {
    sky = new Sky();
    sky.mesh.position.y = -600;
    scene.add(sky.mesh)
}

function createPlane() {
    airplane = new AirPlane();
    airplane.mesh.scale.set(.15, .15, .15);
    airplane.mesh.position.y = 100;
    airplane.mesh.position.x = -50;

    scene.add(airplane.mesh)
}

function loop() {
    // propellor rotation and scene rotation
    sea.mesh.rotation.z += .005;
    sky.mesh.rotation.z += .01;
    // airplane.pilot.updateHairs();
    //update plane animation
    sea.moveWaves();
    updatePlane();
    //rendering the scene
    renderer.render(scene, camera);
    // call the animation loop
    requestAnimationFrame(loop)
}

function init() {
    createScene()
    createLights()
    createPlane()
    createSea()
    createSky()
    // event Listener
    document.addEventListener('mousemove', handleMouseMove, false);
    //loop to update object positions and render the scene each frame
    loop()
}
