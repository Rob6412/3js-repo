//COLORS
var Colors = {
    red: 0xf25346,
    white: 0xd8d0d1,
    brown: 0x59332e,
    brownDark: 0x23190f,
    pink: 0xF5986E,
    yellow: 0xf4ce93,
    blue: 0x68c3c0
};

var game;
var deltaTime = 0;
var newTime = new Date().getTime();
var oldTime = new Date().getTime();
var ennemiesPool = [];
var particlesPool = [];
var particlesInUse = [];
var scene
var camera
var fieldOfView
var aspectRatio
var nearPlane
var farPlane
var renderer
var container
var controls
var HEIGHT
var WIDTH
var mousePos = {x: 0, y: 0};
var sheild;

function resetGame() {
    game = {
        speed: 0,
        initSpeed: .00035,
        baseSpeed: .00035,
        targetBaseSpeed: .00035,
        incrementSpeedByTime: .000004,
        incrementSpeedByLevel: .000002,
        distanceForSpeedUpdate: 100,
        speedLastUpdate: 0,

        distance: 0,
        ratioSpeedDistance: 50,
        energy: 100,
        ratioSpeedEnergy: 3,

        level: 1,
        levelLastUpdate: 0,
        distanceForLevelUpdate: 1000,

        planeDefaultHeight: 100,
        planeAmpHeight: 80,
        planeAmpWidth: 75,
        planeMoveSensivity: 0.005,
        planeRotXSensivity: 0.0008,
        planeRotZSensivity: 0.0004,
        planeFallSpeed: .001,
        planeMinSpeed: 1.2,
        planeMaxSpeed: 1.6,
        planeSpeed: 0,
        planeCollisionDisplacementX: 0,
        planeCollisionSpeedX: 0,

        planeCollisionDisplacementY: 0,
        planeCollisionSpeedY: 0,

        seaRadius: 600,
        seaLength: 800,
        wavesMinAmp: 5,
        wavesMaxAmp: 20,
        wavesMinSpeed: 0.001,
        wavesMaxSpeed: 0.003,

        cameraFarPos: 500,
        cameraNearPos: 150,
        cameraSensivity: 0.002,

        coinDistanceTolerance: 15,
        coinValue: 3,
        coinsSpeed: .5,
        coinLastSpawn: 0,
        distanceForCoinsSpawn: 100,

        ennemyDistanceTolerance: 20,
        ennemyValue: 20,
        ennemiesSpeed: .6,
        ennemyLastSpawn: 0,
        distanceForEnnemiesSpawn: 50,

        status: "playing",
        DistanceTolerance: 15,
        tokenValue: 3,
        tokenSpeed: .5,
        tokenLastSpawn: 0,
        distanceForTokenSpawn: 300,
        tokenDistanceTolerance: 15

    };
    // fieldLevel.innerHTML = Math.floor(game.level);
}

function createScene() {
    // var audio = document.createElement('audio');
    // var source = document.createElement('source');
    // source.src = '/public/backtrack.mp3';
    // audio.appendChild(source);
    // audio.play();
    // audio.setLoop(true);

    var listener = new THREE.AudioListener()
    var sound = new THREE.Audio(listener)
    var audioLoader = new THREE.AudioLoader();
    audioLoader.load('/public/backtrack.mp3', function(buffer) {
        sound.setBuffer(buffer)
        sound.setLoop(true)
        sound.setVolume(0.8)
        sound.play()
    })

    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    scene = new THREE.Scene();
    aspectRatio = WIDTH / HEIGHT;
    fieldOfView = 50;
    nearPlane = .1;
    farPlane = 10000;
    camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);
    scene.fog = new THREE.Fog(0xf7d9aa, 250, 950);
    camera.position.x = 0;
    camera.position.z = 250;
    camera.position.y = game.planeDefaultHeight;
    renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    renderer.setSize(WIDTH, HEIGHT);
    renderer.shadowMap.enabled = true;
    container = document.getElementById('world');
    container.appendChild(renderer.domElement);
    window.addEventListener('resize', handleWindowResize, false);
}

// LIGHTS

var ambientLight
var hemisphereLight
var shadowLight

function createLights() {
    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9)
    ambientLight = new THREE.AmbientLight(0xdc8874, .5);
    shadowLight = new THREE.DirectionalLight(0xffffff, .9);
    shadowLight.position.set(150, 350, 350);
    shadowLight.castShadow = true;
    shadowLight.shadow.camera.left = -400;
    shadowLight.shadow.camera.right = 400;
    shadowLight.shadow.camera.top = 400;
    shadowLight.shadow.camera.bottom = -400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;
    shadowLight.shadow.mapSize.width = 4096;
    shadowLight.shadow.mapSize.height = 4096;
    scene.add(hemisphereLight);
    scene.add(shadowLight);
    scene.add(ambientLight);

}

var AirPlane = function() {
    this.mesh = new THREE.Object3D();
    this.mesh.name = "airPlane"
    // create the sheild
    var sheildGeom = new THREE.SphereGeometry(120, 6, 6);
    var sheildMat = new THREE.MeshPhongMaterial({color: 0x1F363D, transparent: true, opacity: 0.3, shading: THREE.FlatShading});
    // create the cabin
    var geomCockpit = new THREE.SphereGeometry(50, 6, 6);
    var matCockpit = new THREE.MeshPhongMaterial({color: 0x000000, transparent: true, opacity: 0.5, shading: THREE.FlatShading});
    var sheild = new THREE.Mesh(sheildGeom, sheildMat)
    // this.mesh.add(sheild)
    //combining dome
    var cockpit = new THREE.Mesh(geomCockpit, matCockpit);
    cockpit.position.y = 15;
    cockpit.castShadow = true;
    cockpit.recieveShadow = true;
    this.mesh.add(cockpit);
    // create the body
    var geomEngine = new THREE.CylinderGeometry(70, 90, 15, 9, 55);
    var geomEngineBottom = new THREE.CylinderGeometry(90, 60, 30, 9, 55)
    var matEngine = new THREE.MeshPhongMaterial({color: Colors.white, shading: THREE.FlatShading})
    var matEngineBottom = new THREE.MeshPhongMaterial({color: 0xD6DBD2, shading: THREE.FlatShading})
    var engine = new THREE.Mesh(geomEngine, matEngine);
    var engineBottom = new THREE.Mesh(geomEngineBottom, matEngineBottom)
    engine.position.x = 0;
    engineBottom.position.y = -23;
    engine.castShadow = true;
    engine.recieveShadow = true;
    this.mesh.add(engine);
    this.mesh.add(engineBottom)
}

Sky = function() {
    this.mesh = new THREE.Object3D();
    this.nClouds = 20;
    this.clouds = [];
    var stepAngle = Math.PI * 2 / this.nClouds;
    for (var i = 0; i < this.nClouds; i++) {
        var c = new Cloud();
        this.clouds.push(c);
        var a = stepAngle * i;
        var h = game.seaRadius + 150 + Math.random() * 200;
        c.mesh.position.y = Math.sin(a) * h;
        c.mesh.position.x = Math.cos(a) * h;
        c.mesh.position.z = -300 - Math.random() * 500;
        c.mesh.rotation.z = a + Math.PI / 2;
        var s = 1 + Math.random() * 2;
        c.mesh.scale.set(s, s, s);
        this.mesh.add(c.mesh);
    }
}

Sky.prototype.moveClouds = function() {
    for (var i = 0; i < this.nClouds; i++) {
        var c = this.clouds[i];
        c.rotate();
    }
    this.mesh.rotation.z += game.speed * deltaTime;

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
        opacity: .9,
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

Cloud.prototype.rotate = function() {
    var l = this.mesh.children.length;
    for (var i=0; i < l; i++) {
        var m = this.mesh.children[i];
        m.rotation.z += Math.random()*.005*(i+1)
        m.rotation.y += Math.random()*.002*(i+1)
    }
}


Ennemy = function() {
    var geom = new THREE.TetrahedronGeometry(8, 2);
    var mat = new THREE.MeshPhongMaterial({color: Colors.brownDark, shininess: 0, specular: 0xffffff, shading: THREE.FlatShading});
    this.mesh = new THREE.Mesh(geom, mat);
	var s = .1 + Math.random()*3.5;
	this.mesh.scale.set(s,s,s);
    this.mesh.castShadow = true;
    this.angle = 0;
    this.dist = 0;
}

EnnemiesHolder = function() {
    this.mesh = new THREE.Object3D();
    this.ennemiesInUse = [];
}

EnnemiesHolder.prototype.spawnEnnemies = function() {
    var nEnnemies = game.level;

    for (var i = 0; i < nEnnemies; i++) {
        var ennemy;
        if (ennemiesPool.length) {
            ennemy = ennemiesPool.pop();
        } else {
            ennemy = new Ennemy();
        }

        ennemy.angle = -(i * 0.1);
        ennemy.distance = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight - 20);
        ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle) * ennemy.distance;
        ennemy.mesh.position.x = Math.cos(ennemy.angle) * ennemy.distance;

        this.mesh.add(ennemy.mesh);
        this.ennemiesInUse.push(ennemy);
    }
}

EnnemiesHolder.prototype.rotateEnnemies = function() {
    for (var i = 0; i < this.ennemiesInUse.length; i++) {
        var ennemy = this.ennemiesInUse[i];
        ennemy.angle += game.speed * deltaTime * game.ennemiesSpeed;

        if (ennemy.angle > Math.PI * 2) {
			ennemy.angle -= Math.PI * 2;
		}

        ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle) * ennemy.distance;
        ennemy.mesh.position.x = Math.cos(ennemy.angle) * ennemy.distance;
        ennemy.mesh.rotation.z += Math.random() * .1;
        ennemy.mesh.rotation.y += Math.random() * .1;

        var diffPos = airplane.mesh.position.clone().sub(ennemy.mesh.position.clone());
        var d = diffPos.length();
        if (d < game.ennemyDistanceTolerance) {
            particlesHolder.spawnParticles(ennemy.mesh.position.clone(), 15, Colors.brownDark, 3);

            addSheild();

            var audio = document.createElement('audio');
            var source = document.createElement('source');
            source.src = '/public/shield.wav';
            audio.appendChild(source);
            audio.play();

            // var audio = document.createElement('audio');
            // var source = document.createElement('source');
            // source.src = '/public/crash.wav';
            // audio.appendChild(source);
            // audio.play();

            ennemiesPool.unshift(this.ennemiesInUse.splice(i, 1)[0]);
            this.mesh.remove(ennemy.mesh);
            game.planeCollisionSpeedX = 100 * diffPos.x / d;
            game.planeCollisionSpeedY = 100 * diffPos.y / d;
            ambientLight.intensity = 1;

            removeEnergy();
            i--;
        } else if (ennemy.angle > Math.PI) {
            ennemiesPool.unshift(this.ennemiesInUse.splice(i, 1)[0]);
            this.mesh.remove(ennemy.mesh);
            i--;
        }
    }
}

function addSheild() {
    var sheildGeom = new THREE.SphereGeometry(120, 16, 16);
    var sheildMat = new THREE.MeshPhongMaterial({color: 0x1F363D, transparent: true, opacity: 0.2, shading: THREE.FlatShading});
    var sheild = new THREE.Mesh(sheildGeom, sheildMat)
    airplane.mesh.add(sheild)

    setTimeout(sheildRemove, 200);
    function sheildRemove() {
        console.log("removing sheild");
        airplane.mesh.remove(sheild)
    }

}


Particle = function() {
    var geom = new THREE.TetrahedronGeometry(3, 0);
    var mat = new THREE.MeshPhongMaterial({color: 0x009999, shininess: 0, specular: 0xffffff, shading: THREE.FlatShading});
    this.mesh = new THREE.Mesh(geom, mat);
}

Particle.prototype.explode = function(pos, color, scale) {
    var _this = this;
    var _p = this.mesh.parent;
    this.mesh.material.color = new THREE.Color(color);
    this.mesh.material.needsUpdate = true;
    this.mesh.scale.set(scale, scale, scale);
    var targetX = pos.x + (-1 + Math.random() * 2) * 50;
    var targetY = pos.y + (-1 + Math.random() * 2) * 50;
    var speed = .6 + Math.random() * .2;

    TweenMax.to(this.mesh.rotation, speed, {
        x: Math.random() * 12,
        y: Math.random() * 12
    });
    TweenMax.to(this.mesh.scale, speed, {
        x: .1,
        y: .1,
        z: .1
    });
    TweenMax.to(this.mesh.position, speed, {
        x: targetX,
        y: targetY,
        delay: Math.random() * .1,
        ease: Power2.easeOut,
        onComplete: function() {
            if (_p)
                _p.remove(_this.mesh);
            _this.mesh.scale.set(1, 1, 1);
            particlesPool.unshift(_this);
        }
    });
}

ParticlesHolder = function() {
    this.mesh = new THREE.Object3D();
    this.particlesInUse = [];
}

ParticlesHolder.prototype.spawnParticles = function(pos, density, color, scale) {

    var nPArticles = density;
    for (var i = 0; i < nPArticles; i++) {
        var particle;
        if (particlesPool.length) {
            particle = particlesPool.pop();
        } else {
            particle = new Particle();
        }
        this.mesh.add(particle.mesh);
        particle.mesh.visible = true;
        var _this = this;
        particle.mesh.position.y = pos.y;
        particle.mesh.position.x = pos.x;
        particle.explode(pos, color, scale);
    }
}

Coin = function() {
    var geom = new THREE.SphereGeometry(5, 5, 1);
    var mat = new THREE.MeshPhongMaterial({color: Colors.blue, shininess: 10, specular: 0xffffff, shading: THREE.FlatShading});
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.castShadow = true;
    this.angle = 0;
    this.dist = 0;
}

CoinsHolder = function(nCoins) {
    this.mesh = new THREE.Object3D();
    this.coinsInUse = [];
    this.coinsPool = [];
    for (var i = 0; i < nCoins; i++) {
        var coin = new Coin();
        this.coinsPool.push(coin);
    }
}

CoinsHolder.prototype.spawnCoins = function() {

    var nCoins = 1 + Math.floor(Math.random() * 10);
    var d = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight - 20);
    var amplitude = 10 + Math.round(Math.random() * 10);
    for (var i = 0; i < nCoins; i++) {
        var coin;
        if (this.coinsPool.length) {
            coin = this.coinsPool.pop();
        } else {
            coin = new Coin();
        }
        this.mesh.add(coin.mesh);
        this.coinsInUse.push(coin);
        coin.angle = -(i * 0.02);
        coin.distance = d + Math.cos(i * .5) * amplitude;
        coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle) * coin.distance;
        coin.mesh.position.x = Math.cos(coin.angle) * coin.distance;
    }
}

CoinsHolder.prototype.rotateCoins = function() {
    for (var i = 0; i < this.coinsInUse.length; i++) {
        var coin = this.coinsInUse[i];
        if (coin.exploding)
            continue;
        coin.angle += game.speed * deltaTime * game.coinsSpeed;
        if (coin.angle > Math.PI * 2)
            coin.angle -= Math.PI * 2;
        coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle) * coin.distance;
        coin.mesh.position.x = Math.cos(coin.angle) * coin.distance;
        coin.mesh.rotation.z += Math.random() * .1;
        coin.mesh.rotation.y += Math.random() * .1;

        //var globalCoinPosition =  coin.mesh.localToWorld(new THREE.Vector3());
        var diffPos = airplane.mesh.position.clone().sub(coin.mesh.position.clone());
        var d = diffPos.length();
        if (d < game.coinDistanceTolerance) {
            this.coinsPool.unshift(this.coinsInUse.splice(i, 1)[0]);
            this.mesh.remove(coin.mesh);
            particlesHolder.spawnParticles(coin.mesh.position.clone(), 5, Colors.blue, .8);
            addEnergy();

            var audio = document.createElement('audio');
            var source = document.createElement('source');
            source.src = '/public/token.wav';
            audio.appendChild(source);
            audio.play();
            i--;
        } else if (coin.angle > Math.PI) {
            this.coinsPool.unshift(this.coinsInUse.splice(i, 1)[0]);
            this.mesh.remove(coin.mesh);
            i--;
        }
    }
}

Token = function() {
    var geom = new THREE.SphereGeometry(5, 5, 5, 6);
    var mat = new THREE.MeshPhongMaterial({color: Colors.red, shininess: 0, specular: 0xffffff, shading: THREE.FlatShading});
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.castShadow = true;
    this.angle = 0;
    this.dist = 0;
}

TokenHolder = function(nToken) {
    this.mesh = new THREE.Object3D();
    this.tokenInUse = [];
    this.tokenPool = [];
    for (var i = 0; i < nToken; i++) {
        var token = new Token();
        this.tokenPool.push(token);
    }
}

TokenHolder.prototype.spawnToken = function() {

    var nToken = 1 + Math.floor(Math.random());
    var d = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight - 20);
    var amplitude = 10 + Math.round(Math.random() * 10);
    for (var i = 0; i < nToken; i++) {
        var token;
        if (this.tokenPool.length) {
            token = this.tokenPool.pop();
        } else {
            token = new Token();
        }
        this.mesh.add(token.mesh);
        this.tokenInUse.push(token);
        token.angle = -(i * 0.02);
        token.distance = d + Math.cos(i * .5) * amplitude;
        token.mesh.position.y = -game.seaRadius + Math.sin(token.angle) * token.distance;
        token.mesh.position.x = Math.cos(token.angle) * token.distance;
    }
}

TokenHolder.prototype.rotateToken = function() {
    for (var i = 0; i < this.tokenInUse.length; i++) {
        var token = this.tokenInUse[i];
        if (token.exploding)
            continue;
        token.angle += game.speed * deltaTime * game.tokenSpeed;
        if (token.angle > Math.PI * 2)
            token.angle -= Math.PI * 2;
        token.mesh.position.y = -game.seaRadius + Math.sin(token.angle) * token.distance;
        token.mesh.position.x = Math.cos(token.angle) * token.distance;
        token.mesh.rotation.z += Math.random() * .1;
        token.mesh.rotation.y += Math.random() * .1;

        //var globalCoinPosition =  coin.mesh.localToWorld(new THREE.Vector3());
        var diffPos = airplane.mesh.position.clone().sub(token.mesh.position.clone());
        var d = diffPos.length();
        if (d < game.tokenDistanceTolerance) {
            this.tokenPool.unshift(this.tokenInUse.splice(i, 1)[0]);
            this.mesh.remove(token.mesh);
            particlesHolder.spawnParticles(token.mesh.position.clone(), 5, Colors.red, .8);
            reduceSpeed();
            var audio = document.createElement('audio');
            var source = document.createElement('source');
            source.src = '/public/coin.wav';
            audio.appendChild(source);
            audio.play();
            i--;
        } else if (token.angle > Math.PI) {
            this.tokenPool.unshift(this.tokenInUse.splice(i, 1)[0]);
            this.mesh.remove(token.mesh);
            i--;
        }
    }
}

function reduceSpeed() {
    game.targetBaseSpeed = .00035

}

// 3D creators
var sea;
var airplane;

function createPlane() {
    airplane = new AirPlane();
    airplane.mesh.scale.set(.15, .15, .15);
    airplane.mesh.position.y = game.planeDefaultHeight;
    scene.add(airplane.mesh);
}

function createSea() {
    sea = new Sea();
    sea.mesh.position.y = -game.seaRadius;
    scene.add(sea.mesh);
}

function createSky() {
    sky = new Sky();
    sky.mesh.position.y = -game.seaRadius;
    scene.add(sky.mesh);
}

function createCoins() {
    coinsHolder = new CoinsHolder(30);
    scene.add(coinsHolder.mesh)
}

function createToken() {
    tokenHolder = new TokenHolder(30);
    scene.add(tokenHolder.mesh)
}

function createEnnemies() {
    for (var i = 0; i < 10; i++) {
        var ennemy = new Ennemy();
        ennemiesPool.push(ennemy);
    }
    ennemiesHolder = new EnnemiesHolder();
    scene.add(ennemiesHolder.mesh)
}

function createParticles() {
    for (var i = 0; i < 10; i++) {
        var particle = new Particle();
        particlesPool.push(particle);
    }
    particlesHolder = new ParticlesHolder();
    scene.add(particlesHolder.mesh)
}


// MASTER FUNCTION
function loop() {
    newTime = new Date().getTime();
    deltaTime = newTime - oldTime;
    oldTime = newTime;
    if (game.status == "playing") {
        // Add energy coins every 100m;
        if (Math.floor(game.distance) % game.distanceForCoinsSpawn == 0 && Math.floor(game.distance) > game.coinLastSpawn) {
            game.coinLastSpawn = Math.floor(game.distance);
            coinsHolder.spawnCoins();
        }
        if (Math.floor(game.distance) % game.distanceForTokenSpawn == 0 && Math.floor(game.distance) > game.tokenLastSpawn) {
            game.tokenLastSpawn = Math.floor(game.distance);
            tokenHolder.spawnToken();
        }

        if (Math.floor(game.distance) % game.distanceForSpeedUpdate == 0 && Math.floor(game.distance) > game.speedLastUpdate) {
            game.speedLastUpdate = Math.floor(game.distance);
            game.targetBaseSpeed += game.incrementSpeedByTime * deltaTime;
        }

        if (Math.floor(game.distance) % game.distanceForEnnemiesSpawn == 0 && Math.floor(game.distance) > game.ennemyLastSpawn) {
            game.ennemyLastSpawn = Math.floor(game.distance);
            ennemiesHolder.spawnEnnemies();
        }

        if (Math.floor(game.distance) % game.distanceForLevelUpdate == 0 && Math.floor(game.distance) > game.levelLastUpdate) {
            game.levelLastUpdate = Math.floor(game.distance);
            game.level++;
            // fieldLevel.innerHTML = Math.floor(game.level);

            // game.targetBaseSpeed = game.initSpeed + game.incrementSpeedByLevel * game.level
        }

        updatePlane();
        updateDistance();
        updateEnergy();
        game.baseSpeed += (game.targetBaseSpeed - game.baseSpeed) * deltaTime * 0.02;
        game.speed = game.baseSpeed * game.planeSpeed;

    } else if (game.status == "gameover") {

        game.speed *= .99;
        airplane.mesh.rotation.z += (-Math.PI / 2 - airplane.mesh.rotation.z) * .0002 * deltaTime;
        airplane.mesh.rotation.x += 0.0003 * deltaTime;
        game.planeFallSpeed *= 1.05;
        airplane.mesh.position.y -= game.planeFallSpeed * deltaTime;

        if (airplane.mesh.position.y < -200) {
            showReplay();
            game.status = "waitingReplay";

        }
    } else if (game.status == "waitingReplay") {}

    sea.mesh.rotation.z += game.speed * deltaTime;

    if (sea.mesh.rotation.z > 2 * Math.PI)
        sea.mesh.rotation.z -= 2 * Math.PI;

    ambientLight.intensity += (.5 - ambientLight.intensity) * deltaTime * 0.005;
    coinsHolder.rotateCoins();
    tokenHolder.rotateToken();
    ennemiesHolder.rotateEnnemies();

    sky.moveClouds();
    sea.moveWaves();

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
}

function updateDistance() {
    game.distance += game.speed * deltaTime * game.ratioSpeedDistance;
    fieldDistance.innerHTML = Math.floor(game.distance);
    var d = 502 * (1 - (game.distance % game.distanceForLevelUpdate) / game.distanceForLevelUpdate);

}

function updateEnergy() {
    game.energy -= game.speed * deltaTime * game.ratioSpeedEnergy;
    game.energy = Math.max(0, game.energy);
    energyBar.style.right = (100 - game.energy) + "%";
    energyBar.style.backgroundColor = (game.energy < 50)
        ? "#f25346"
        : "#68c3c0";

    if (game.energy < 30) {
        energyBar.style.animationName = "blinking";
    } else {
        energyBar.style.animationName = "none";
    }

    if (game.energy < 1) {
        game.status = "gameover";
    }
}

function addEnergy() {
    game.energy += game.coinValue;
    game.energy = Math.min(game.energy, 100);
}

function removeEnergy() {
    game.energy -= game.ennemyValue;
    game.energy = Math.max(0, game.energy);
}

function updatePlane() {
    game.planeSpeed = normalize(mousePos.x, -.5, .5, game.planeMinSpeed, game.planeMaxSpeed);
    var targetY = normalize(mousePos.y, -.75, .75, game.planeDefaultHeight - game.planeAmpHeight, game.planeDefaultHeight + game.planeAmpHeight);
    var targetX = normalize(mousePos.x, -1, 1, -game.planeAmpWidth * .7, -game.planeAmpWidth);
    game.planeCollisionDisplacementX += game.planeCollisionSpeedX;
    targetX += game.planeCollisionDisplacementX;
    game.planeCollisionDisplacementY += game.planeCollisionSpeedY;
    targetY += game.planeCollisionDisplacementY;
    airplane.mesh.position.y += (targetY - airplane.mesh.position.y) * deltaTime * game.planeMoveSensivity;
    airplane.mesh.position.x += (targetX - airplane.mesh.position.x) * deltaTime * game.planeMoveSensivity;
    airplane.mesh.rotation.z = (targetY - airplane.mesh.position.y) * deltaTime * game.planeRotXSensivity;
    airplane.mesh.rotation.x = (airplane.mesh.position.y - targetY) * deltaTime * game.planeRotZSensivity;
    game.planeCollisionSpeedX += (0 - game.planeCollisionSpeedX) * deltaTime * 0.03;
    game.planeCollisionDisplacementX += (0 - game.planeCollisionDisplacementX) * deltaTime * 0.01;
    game.planeCollisionSpeedY += (0 - game.planeCollisionSpeedY) * deltaTime * 0.03;
    game.planeCollisionDisplacementY += (0 - game.planeCollisionDisplacementY) * deltaTime * 0.01;
}

function showReplay() {
    replayMessage.style.display = "block";
}

function hideReplay() {
    replayMessage.style.display = "none";
}

function normalize(v, vmin, vmax, tmin, tmax) {
    var nv = Math.max(Math.min(v, vmax), vmin);
    var dv = vmax - vmin;
    var pc = (nv - vmin) / dv;
    var dt = tmax - tmin;
    var tv = tmin + (pc * dt);
    return tv;
}

var fieldDistance
var energyBar
var replayMessage
var fieldLevel
var levelCircle

function init(event) {

    fieldDistance = document.getElementById("distValue");
    energyBar = document.getElementById("energyBar");
    replayMessage = document.getElementById("replayMessage");
    fieldLevel = document.getElementById("levelValue");

    resetGame();
    createScene();

    createLights();
    createPlane();
    createSea();
    createSky();
    createToken();
    createCoins();
    createEnnemies();
    createParticles();

    document.addEventListener('mousemove', handleMouseMove, false);
    document.addEventListener('touchmove', handleTouchMove, false);
    document.addEventListener('mouseup', handleMouseUp, false);
    document.addEventListener('touchend', handleTouchEnd, false);

    loop();
}

window.addEventListener('load', init, false);

// MOUSE AND SCREEN EVENTS

function handleWindowResize() {
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
}

function handleMouseMove(event) {
    var tx = -1 + (event.clientX / WIDTH) * 2;
    var ty = 1 - (event.clientY / HEIGHT) * 2;
    mousePos = {
        x: tx,
        y: ty
    };
}

function handleTouchMove(event) {
    event.preventDefault();
    var tx = -1 + (event.touches[0].pageX / WIDTH) * 2;
    var ty = 1 - (event.touches[0].pageY / HEIGHT) * 2;
    mousePos = {
        x: tx,
        y: ty
    };
}

function handleMouseUp(event) {
    if (game.status == "waitingReplay") {
        resetGame();
        hideReplay();
    }
}

function handleTouchEnd(event) {
    if (game.status == "waitingReplay") {
        resetGame();
        hideReplay();
    }
}
