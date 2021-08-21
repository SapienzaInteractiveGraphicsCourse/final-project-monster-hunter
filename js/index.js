const K_ATTACK = 'J'.charCodeAt(0);
const K_SKILL1 = 'K'.charCodeAt(0);
const K_MOVE_FORWARD = 'W'.charCodeAt(0);
const K_MOVE_BACK = 'S'.charCodeAt(0);
const K_MOVE_LEFT = 'A'.charCodeAt(0);
const K_MOVE_RIGHT = 'D'.charCodeAt(0);



class App {
    constructor() {

        let width = window.innerWidth;
        let height = window.innerHeight;
        let pixelRatio = window.devicePixelRatio;
        let aspect = width / height;
        
        this.camera = new THREE.PerspectiveCamera(100, aspect, 30, 3000);
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({antialias: false});
        this.renderer.setPixelRatio(pixelRatio);
        this.renderer.setSize(width, height);
        this.loadflag = false;

        this.HeroPosition = new THREE.Vector3(0, 0, 0);  //英雄位置
        this.LongPosition = new Array();
        this.LongPosition[0] = new THREE.Vector3(1, 1, 1);  //龙1位置
        this.LongPosition[1] = new THREE.Vector3(1, 1, 1);  //龙2位置
        this.LongPosition[2] = new THREE.Vector3(1, 1, 1);  //龙3位置
        this.attackField = new THREE.Vector3(0, 0, 0);  //攻击范围的圆心点

        //英雄属性
        this.blood = 100;
        this.faceTo = 0;
        this.grade = 0;

        //Contronl
        this.keystate ={};
        this.HeroAttackFlag = false;    //英雄普功flag
        this.HeroSkill1Flag = false;    //英雄技能一
        this.move_forward_flag = false;
        this.move_back_flag = false;
        this.move_right_flag = false;                          
        this.move_left_flag = false;
        this.character_roation_flag = false;

        this.LongAttackFlag = false;  //龙攻击flag
        this.LongDieFlag = false;     //龙死亡flag
        this.HarmFlag = false;        //伤害flag
        this.harmFlag_0 = false;
        this.harmFlag_1 = false;
        this.harmCount = 0;
        this.HeroDieFlag = false;     //英雄死亡flag
        this.HeroRunFlag = false;     //英雄奔跑动画flag
        this.KeyPressFlag = false;    //监控按键flag

        this.MoveDirection = new Array();
        this.MoveDirection[0] = getRandomInt(4); //[0, 1, 2, 3] -> [前, 后, 左， 右]
        this.MoveDirection[1] = getRandomInt(4);

        //英雄移动位置
        this.movement_x = 0;
        this.movement_y = 0;
        this.movement_z = 0;
        this.rotation_y = 9;

        //龙移动位置
        this.LongMove_x = new Array();
        this.LongMove_y = new Array();
        this.LongMove_z = new Array();

        this.target_orientation =0;
        this.orientation = 2;
        this.AttackFrequency = 0;

        //Tween groups
        this.groupA = new TWEEN.Group();
        this.groupLongWalk = new TWEEN.Group();  //龙行走动作
        this.groupLongMove = new TWEEN.Group();  //龙位置移动
        this.groupLongAttack = new TWEEN.Group();//龙攻击
        this.groupHeroAttack = new TWEEN.Group();//英雄攻击动作
        this.groupHeroRun = new TWEEN.Group();   //英雄跑步动作
        this.groupHeroSkill1 = new TWEEN.Group();//英雄一技能，旋转武器

        //-----------------------------------------------------------------------------
        const geometry = new THREE.BoxGeometry(200, 30, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0xFF0010 });  //0x00ff00
        this.cube = new THREE.Mesh(geometry, material);
        this.cube.position.set(600, 400, 600);
        //cube.scale.set(app.blood / 100, 1.0, 1.0);
        this.scene.add(this.cube);
        //-----------------------------------------------------------------------------

        document.body.appendChild(this.renderer.domElement);
        // Catch resize events
        window.onresize = (evt) => {
            this.resize(window.innerWidth, window.innerHeight);
        };
    }

    /* Resize viewport */
    resize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    /* Start the main loop */
    start() {
        this.loop();
    }

    loop() {
        requestAnimationFrame(() => this.loop());
        let time = new Date().getTime() / 1000;
        let delta = 0.0;
        if (typeof this.lastUpdate !== 'undefined') {
            delta = time - this.lastUpdate;
        }
        this.update(delta);
        this.lastUpdate = time;

        if (this.keystate[K_ATTACK]){
            this.HeroAttackFlag = true;
        }
        if (this.keystate[K_SKILL1]) {
            this.HeroSkill1Flag = true;    //一技能flag
        }
        if (this.keystate[K_MOVE_FORWARD]){
            this.move_forward_flag = true;

        }
        if (this.keystate[K_MOVE_BACK]){
            this.move_back_flag = true;

        }
        if (this.keystate[K_MOVE_LEFT]){
            this.move_left_flag = true;

        }
        if (this.keystate[K_MOVE_RIGHT]){
            this.move_right_flag = true;

        }

        //英雄朝向
        if (this.move_forward_flag) {
            this.faceTo = 0;
        }
        if (this.move_back_flag) {
            this.faceTo = 2;
        }
        if (this.move_right_flag) {
            this.faceTo = 1;
        }
        if (this.move_left_flag) {
            this.faceTo = 3;
        } 


        this.animation();
        this.render();
        this.cube.position.set(this.movement_x, this.movement_y + 300, this.movement_z);

        if (this.HeroDieFlag) {
            var selectedObject = this.scene.getObjectByName('Hero111');
            this.scene.remove(selectedObject);
            this.HeroDieFlag = false;
            console.log("Hero die !!!!!!!!!!!!!!!" + this.grade);

            localStorage.setItem("firstname", this.grade);

            loadGame();
            
        }

        //------------------------------------------------------
        //判断龙与人的距离，以决定是否攻击
        this.AttackFrequency += 1;
        if (this.loadflag) {
            for (var i = 0; i < 3; i++) {
                if (this.HeroPosition.distanceTo(this.LongPosition[i]) < 200 && this.AttackFrequency % 5 == 0) {
                    this.AttackFrequency = 0;
                    if (Math.random() < 0.5) {
                        this.MonsterAttack(i);
                    }
                }
            }
        }


        if (this.AttackFrequency == 10000) {
            this.AttackFrequency = 0;
        }
        //------------------------------------------------------
    }

    animation(){
        if (this.move_forward_flag || this.move_back_flag || this.move_right_flag || this.move_left_flag) {
            this.groupA.update();
            this.HeroRunFlag = true;
        }

        if (this.HeroRunFlag) {
            this.groupHeroRun.update();   //英雄跑步动作
        }

        if (this.HeroAttackFlag) {
            this.groupHeroAttack.update();//英雄攻击函数
        }

        if (this.LongAttackFlag) {
            this.groupLongAttack.update();
        }
        if (this.HeroSkill1Flag) {
            this.groupHeroSkill1.update(); //英雄一技能
        }

        this.groupLongWalk.update();    //龙行走动作函数

    }

    HeroAttack() {
        //if判断怪物是否在英雄工攻击范围（英雄面前圆形区域），如果在其面前的话，则怪物消失
        //[0, 1, 2, 3]---> [前， 右， 后，左]
        if (this.faceTo == 0) {
            this.attackField.z = this.HeroPosition.z - 20;
            this.attackField.x = this.HeroPosition.x;
            this.attackField.y = this.HeroPosition.y;
        }
        if (this.faceTo == 2) {
            this.attackField.z = this.HeroPosition.z + 20;
            this.attackField.x = this.HeroPosition.x;
            this.attackField.y = this.HeroPosition.y;
        }
        if (this.faceTo == 1) {
            this.attackField.z = this.HeroPosition.z;
            this.attackField.x = this.HeroPosition.x + 20;
            this.attackField.y = this.HeroPosition.y;
        }
        if (this.faceTo == 3) {
            this.attackField.z = this.HeroPosition.z;
            this.attackField.x = this.HeroPosition.x - 20;
            this.attackField.y = this.HeroPosition.y;
        }

        if (this.attackField.distanceTo(this.LongPosition[0]) < 200) {
            var selectedObject = this.scene.getObjectByName('Monster01');
            this.LongMove_x[0] = 300;
            this.LongMove_z[0] = 300;
            this.grade += 1;
        }
        if (this.attackField.distanceTo(this.LongPosition[1]) < 200) {
            var selectedObject = this.scene.getObjectByName('Monster02');
            this.LongMove_x[1] = 300;
            this.LongMove_z[1] = 300;
            this.grade += 1;
        }
        if (this.attackField.distanceTo(this.LongPosition[2]) < 200) {
            var selectedObject = this.scene.getObjectByName('Monster03');
            this.LongMove_x[2] = 300;
            this.LongMove_z[2] = 300;
            this.grade += 1;
        }
        
    }

    HeroSkill_1() {
        if (this.HeroPosition.distanceTo(this.LongPosition[0]) < 200) {
            var selectedObject = this.scene.getObjectByName('Monster01');
            this.LongMove_x[0] = 300;
            this.LongMove_z[0] = 300;
        }
        if (this.HeroPosition.distanceTo(this.LongPosition[1]) < 200) {
            var selectedObject = this.scene.getObjectByName('Monster02');
            this.LongMove_x[1] = 300;
            this.LongMove_z[1] = 300;
        }
        if (this.HeroPosition.distanceTo(this.LongPosition[2]) < 200) {
            var selectedObject = this.scene.getObjectByName('Monster03');
            this.LongMove_x[2] = 300;
            this.LongMove_z[2] = 300;
        }
    }

    update(delta) {
        // Dispatch update event for listeners
        window.dispatchEvent(new CustomEvent('app-update', {
            detail: {
                delta: delta
            }
        }));
    }

    render() {
        let scene = this.scene;
        let camera = this.camera;
        let renderer = this.renderer;
        renderer.render(scene, camera);
        renderer.setClearColor('rgb(135,206,250)',1.0);
        renderer.setClearColor(0xffffff,1.0);
        renderer.setClearColor('#428bca',1.0);
        renderer.setClearColor('rgba(135,206,250,0.5)',1.0); 
    }

    MonsterAttack(i) {
        if (this.HeroPosition.distanceTo(this.LongPosition[i]) < 200) {
            
            if (this.blood > 0) {
                this.LongAttackFlag = true;
                this.blood -= 10;

                if (this.blood == 0) {
                    this.HeroDieFlag = true;
                }
            }
        }
        this.cube.scale.set(this.blood / 100, 1.0, 1.0);
    }
}

function KeybaordListener(app){
        ////键盘监听事件
        window.addEventListener('keydown', (evt) => {
            app.keystate[evt.which] = true;
            app.KeyPressFlag = false;
        }, false);
        window.addEventListener('keyup', (evt) => {
            app.keystate[evt.which] = false;
            app.KeyPressFlag = true;
            
        }, false);
        window.addEventListener('keypress', (evt) => {
            app.keystate[evt.which] = false;

            if (evt.which == 106) {
                app.HeroAttack();
            }
            if (evt.which == 107) {
                app.HeroSkill_1();
            }
            
        }, false);

};

function loadmanager(app) {
        //loadmanager
        const manager = new THREE.LoadingManager();
        manager.onStart = function ( url, itemsLoaded, itemsTotal ) {
            //console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
        };
        manager.onLoad = function ( ) {
            //document.getElementById("distance").style.display = 'block'
            console.log( 'Loading complete!');
        };
        manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
    
            //console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
        };
        manager.onError = function ( url ) {
            //console.log( 'There was an error loading ' + url );
        };
        return manager

}

function CreatePizza(app) {

    const manager = loadmanager(app);
    //创建GLTF加载器对象
    //let characterControls = new ThirdPersonControls(app);
    
    var gltfLoader = new THREE.GLTFLoader(manager);
    gltfLoader.load('./model/Pizza/scene.gltf', function (gltf) {
        const root = gltf.scene;
        root.scale.x = 5;
        root.scale.y = 5;
        root.scale.z = 5;

        root.position.x = 300;
        root.position.z = 200;
        root.position.y = 35;

        root.traverse((object) => {
            if (object.isMesh) {
                object.frustumCulled = true;
                object.material.depthWrite = true;
                if (true) {
                    object.receiveShadow = true;
                    object.castShadow = true;
                }
            }
        });

        app.scene.add(root);
        app.start();
    }, undefined, function (error) {
        console.error(error);
    });
};

function CreateTree(app) {

    const manager = loadmanager(app);
    //创建GLTF加载器对象
    //let characterControls = new ThirdPersonControls(app);

    var gltfLoader = new THREE.GLTFLoader(manager);
    gltfLoader.load('./model/Tree/scene.gltf', function (gltf) {
        const root = gltf.scene;
        root.scale.x = 0.5;
        root.scale.y = 0.5;
        root.scale.z = 0.5;

        root.position.x = 2000;
        root.position.z = 0;
        root.position.y = 0;

        root.traverse((object) => {
            if (object.isMesh) {
                object.frustumCulled = true;
                object.material.depthWrite = true;
                if (true) {
                    object.receiveShadow = true;
                    object.castShadow = true;
                }
            }
        });

        app.scene.add(root);
        app.start();
    }, undefined, function (error) {
        console.error(error);
    });
};

function CreateHero(app) {

    const manager = loadmanager(app);  
    //创建GLTF加载器对象
    //let characterControls = new ThirdPersonControls(app);
    var gltfLoader = new THREE.GLTFLoader(manager);
    gltfLoader.load('./model/Hero/scene.gltf', function (gltf) {
        const root = gltf.scene;

        root.scale.x = 20;
        root.scale.y = 20;
        root.scale.z = 20;

        root.position.x = 1200;
        root.position.z = 1200;

        root.traverse((object) => {
            if (object.isMesh) {
                object.frustumCulled = true;
                object.material.depthWrite = true;
                if (true) {
                    object.receiveShadow = true;
                    object.castShadow = true;
                }
            }
        });

        HeroRun(app, root);
        HeroAttack(app, root);
        HeroMove(app, root);
        HeroSkill1(app, root);

        root.name = 'Hero111';

        app.HeroPosition = root.position;
         app.scene.add(root);
         app.start();
       }, undefined, function (error) {
         console.error(error);
     });
 };
 
 function HeroSkill1(app, root) {
 
     //var Sword = root.getObjectByName("sword_FIN");
     var HandLeft = root.getObjectByName("Hand_L_FIN");

     //var AniSword = new TWEEN.Tween(Sword.rotation, app.groupHeroSkill1);
     var AniHero = new TWEEN.Tween(root.rotation, app.groupHeroSkill1);

     var Anitime = 600;

     //AniSword.to({ z: [Math.PI * 1.5, Sword.rotation.z], y: [Math.PI * 0.5, Sword.rotation.y] }, Anitime);
     AniHero.to({ y: [Math.PI, 0,  Math.PI * 3] }, Anitime);

     AniHero.onRepeat(function () { app.HeroSkill1Flag = false; }).delay(10).repeat(Infinity).start();
};

function HeroMove(app, root) {
    //////////////平移///////////////

    var speed = 2;
    app.movement_x = root.position.x;
    app.movement_z = root.position.z;
    var rootAnimation = new TWEEN.Tween(root.position, app.groupA)
    rootAnimation.to({ x: root.position.x, z: root.position.z }, 20);
    rootAnimation.onUpdate(function () {
        if (app.move_back_flag) {
            root.position.z = app.movement_z;
            root.position.x = app.movement_x;
            app.rotation_y = 0;
            root.rotation.y = app.rotation_y;
            if (app.movement_z + speed <= 1900) {
                app.movement_z += speed;
            }
        }
        else if (app.move_forward_flag) {
            root.position.z = app.movement_z;
            root.position.x = app.movement_x;
            app.rotation_y = Math.PI;
            root.rotation.y = app.rotation_y;
            if (app.movement_z - speed >= 300) {
                app.movement_z -= speed;
            }
        }
        else if (app.move_left_flag) {
            root.position.x = app.movement_x;
            root.position.z = app.movement_z;
            app.rotation_y = -Math.PI / 2;
            root.rotation.y = app.rotation_y;
            if (app.movement_x - speed >= 300) {
                app.movement_x -= speed;
            }
        }
        else if (app.move_right_flag) {
            root.position.x = app.movement_x;
            root.position.z = app.movement_z;
            app.rotation_y = Math.PI / 2;
            root.rotation.y = app.rotation_y;
            if (app.movement_x + speed <= 1900) {
                app.movement_x += speed;
            }
        }
    });
    rootAnimation.repeat(Infinity);
    rootAnimation.onRepeat(function () {
        app.move_forward_flag = false;
        app.move_back_flag = false;
        app.move_left_flag = false;
        app.move_right_flag = false;
    });
    rootAnimation.start();
}

function HeroRun(app, root) {
    var RightUpperLeg = root.getObjectByName("UpperLeg_R_FIN");
    var RightLowerLeg = root.getObjectByName("LowerLeg_R_FIN");
    var LeftUpperLeg = root.getObjectByName("UpperLeg_L_FIN");
    var LeftLowerLeg = root.getObjectByName("LowerLeg_L_FIN");

    var AniRightUpperLeg = new TWEEN.Tween(RightUpperLeg.rotation, app.groupHeroRun);
    var AniRightLowerLeg = new TWEEN.Tween(RightLowerLeg.rotation, app.groupHeroRun);
    var AniLeftUpperLeg = new TWEEN.Tween(LeftUpperLeg.rotation, app.groupHeroRun);
    var AniLeftLowerLeg = new TWEEN.Tween(LeftLowerLeg.rotation, app.groupHeroRun);

    AniRightUpperLeg.to({ x: [Math.PI * 0.45, RightUpperLeg.rotation.x, -Math.PI * 0.2, RightUpperLeg.rotation.x] }, 500);
    AniRightLowerLeg.to({ x: [-Math.PI * 0.4, RightLowerLeg.rotation.x, -Math.PI * 0.2, RightLowerLeg.rotation.x] }, 500);
    AniLeftUpperLeg.to({ x: [-Math.PI * 0.2, RightUpperLeg.rotation.x, Math.PI * 0.45, RightUpperLeg.rotation.x] }, 500);
    AniLeftLowerLeg.to({ x: [-Math.PI * 0.2, RightLowerLeg.rotation.x, -Math.PI * 0.4, RightLowerLeg.rotation.x] }, 500);

    AniRightUpperLeg.repeat(Infinity).onRepeat(function () { if (app.KeyPressFlag) app.HeroRunFlag = false; });
    AniRightLowerLeg.repeat(Infinity);
    AniLeftUpperLeg.repeat(Infinity);
    AniLeftLowerLeg.repeat(Infinity);

    AniRightUpperLeg.start();
    AniRightLowerLeg.start();
    AniLeftUpperLeg.start();
    AniLeftLowerLeg.start();
}

function HeroAttack(app, root) {

    var UpperLeftArm = root.getObjectByName("UpperArm_L_FIN");
    var LowerLeftArm = root.getObjectByName("LowerArm_L_FIN");
    var UpperRightArm = root.getObjectByName("UpperArm_R_FIN");
    var LowerRightArm = root.getObjectByName("LowerArm_R_FIN");
    var HandLeft = root.getObjectByName("Hand_L_FIN");

    var AniUpperLeftArm = new TWEEN.Tween(UpperLeftArm.rotation, app.groupHeroAttack);
    var AniLowerLeftArm = new TWEEN.Tween(LowerLeftArm.rotation, app.groupHeroAttack);
    var AniUpperRightArm = new TWEEN.Tween(UpperRightArm.rotation, app.groupHeroAttack);
    var AniLowerRightArm = new TWEEN.Tween(UpperLeftArm.rotation, app.groupHeroAttack);
    var AniHandLeft = new TWEEN.Tween(HandLeft.rotation, app.groupHeroAttack);

    var Anitime = 1000;

    AniUpperLeftArm.to({ y: [-Math.PI * 0.2, UpperLeftArm.rotation.y], z: [Math.PI * 0.01, UpperLeftArm.rotation.z] }, Anitime);
    AniUpperRightArm.to({ y: [-Math.PI * 0.3, UpperRightArm.rotation.y] }, Anitime);
    AniLowerLeftArm.to({ y: [-Math.PI * 0.2, LowerLeftArm.rotation.y]}, Anitime);
    AniLowerRightArm.to({ y: [-Math.PI * 0.6, LowerRightArm.rotation.y] }, Anitime);
    AniHandLeft.to({ z: [Math.PI * 0.3, HandLeft.rotation.z], y: [Math.PI * 0.3, HandLeft.rotation.y] }, Anitime);

    AniUpperLeftArm.onRepeat(function () { app.HeroAttackFlag = false; });

    AniUpperLeftArm.repeat(Infinity).start();
    AniUpperRightArm.repeat(Infinity).start();
    AniLowerLeftArm.repeat(Infinity).start();
    AniLowerRightArm.repeat(Infinity).start();
    AniHandLeft.repeat(Infinity).start();
}

function CreateLong(app, position = 300, noOfLong = 0, name = 'Monster01') {

    const manager = loadmanager(app, positionX = 200);
    //创建GLTF加载器对象
    //let characterControls = new ThirdPersonControls(app);
    var gltfLoader = new THREE.GLTFLoader(manager);
    gltfLoader.load('./model/long/scene.gltf', function (gltf) {
        const root = gltf.scene;
        //root.scale.multiplyScalar(15);
        root.scale.x = 40;
        root.scale.y = 40;
        root.scale.z = 40;

        //root.position.y = app.heroPosition.y;
        root.position.x = position; //positionX;
        root.position.z = 600; //400;
        root.position.y = 120;
        root.rotation.y = Math.PI;

        root.traverse((object) => {
            if (object.isMesh) {
                object.frustumCulled = true;
                object.material.depthWrite = true;
                if (true) {
                    object.receiveShadow = true;
                    object.castShadow = true;
                }
            }
        });

        LongMove(app, root, noOfLong);
        LongAttack(app, root);

        app.LongPosition[noOfLong] = root.position;
        root.name = name;

        app.scene.add(root);
        app.start();
    }, undefined, function (error) {
        console.error(error);
    });
};

function LongWalk(app, root) {
    // 后右上腿 ： Bone.040_Armature
    // 后右下腿 ： Bone.044_Armature
    // 后左上腿 ： Bone.039_Armature
    // 后左下腿 ： Bone.043_Armature
    var rightUpLeg = root.getObjectByName("Bone040_Armature");
    var rightDownLeg = root.getObjectByName("Bone044_Armature");
    var leftUpLeg = root.getObjectByName("Bone039_Armature");
    var leftDownLeg = root.getObjectByName("Bone043_Armature");

    var AniRightUpLeg = new TWEEN.Tween(rightUpLeg.rotation, app.groupLongWalk);
    var AniRightDownLeg = new TWEEN.Tween(rightDownLeg.rotation, app.groupLongWalk);
    var AniLeftUpLeg = new TWEEN.Tween(leftUpLeg.rotation, app.groupLongWalk);
    var AniLeftDownLeg = new TWEEN.Tween(leftDownLeg.rotation, app.groupLongWalk);

    var Anitime = 1000;

    AniRightUpLeg.to({ x: [-0.4 * Math.PI, 0.4 * Math.PI, rightUpLeg.rotation.x] }, Anitime);
    AniRightDownLeg.to({ x: [0.5 * Math.PI, 0, rightDownLeg.rotation.x] }, Anitime);
    AniLeftUpLeg.to({ x: [0.4 * Math.PI, -0.4 * Math.PI, leftUpLeg.rotation.x] }, Anitime);
    AniLeftDownLeg.to({ x: [0, 0.5 * Math.PI, leftDownLeg.rotation.x] }, Anitime);

    AniRightUpLeg.repeat(Infinity).yoyo();
    AniRightDownLeg.repeat(Infinity).yoyo();
    AniLeftUpLeg.repeat(Infinity).yoyo();
    AniLeftDownLeg.repeat(Infinity).yoyo();

    AniRightUpLeg.start();
    AniRightDownLeg.start();
    AniLeftUpLeg.start();
    AniLeftDownLeg.start();
};

function LongMove(app, root, noOfLong = 0) {

    if (noOfLong == 2) {
        app.loadflag = true;
    }

    LongWalk(app, root);

    var MoveDistance = getRandomInt(2, 2);
    //console.log('移动距离！！！！！！！' + MoveDistance);
    //var MoveDirection = getRandomInt(4); //[0, 1, 2, 3] -> [前, 后, 左， 右]

    var AniLongMove = new TWEEN.Tween(root.position, app.groupLongWalk);

    app.LongMove_x[noOfLong] = root.position.x;
    app.LongMove_z[noOfLong] = root.position.z;

    AniLongMove.to({ x: root.position.x, z: root.position.z }, 500);
    AniLongMove.onUpdate(function () {

        if (app.MoveDirection[noOfLong] == 0) {
            root.position.x = app.LongMove_x[noOfLong];
            root.position.z = app.LongMove_z[noOfLong];
            if (app.LongMove_x[noOfLong] + MoveDistance < 1900) {
                app.LongMove_x[noOfLong] += MoveDistance;
            }
            else {
                app.MoveDirection[noOfLong] = getRandomInt(4);
                MoveDistance = getRandomInt(2, 2);
            }
            root.rotation.y = 0.5 * Math.PI;
        }
        else if (app.MoveDirection[noOfLong] == 1) {
            root.position.x = app.LongMove_x[noOfLong];
            root.position.z = app.LongMove_z[noOfLong];

            if (app.LongMove_x[noOfLong] - MoveDistance > 100) {
                app.LongMove_x[noOfLong] -= MoveDistance;
            }
            else {
                app.MoveDirection[noOfLong] = getRandomInt(4);
                MoveDistance = getRandomInt(2, 2);
            }
            root.rotation.y = -0.5 * Math.PI;
        }
        else if (app.MoveDirection[noOfLong] == 2) {
            root.position.x = app.LongMove_x[noOfLong];
            root.position.z = app.LongMove_z[noOfLong];
            if (app.LongMove_z[noOfLong] + MoveDistance < 1900) {
                app.LongMove_z[noOfLong] += MoveDistance;
            }
            else {
                app.MoveDirection[noOfLong] = getRandomInt(4);
                MoveDistance = getRandomInt(2, 2);
            }
            //root.rotation.y = Math.PI / 2;
            root.rotation.y = 0;
        }
        else if (app.MoveDirection[noOfLong] == 3) {   // && app.LongMove_z < 2048 && app.LongMove_z > 0
            root.position.x = app.LongMove_x[noOfLong];
            root.position.z = app.LongMove_z[noOfLong];
            if (app.LongMove_z[noOfLong] - MoveDistance > 100) {
                app.LongMove_z[noOfLong] -= MoveDistance;
            }
            else {
                app.MoveDirection[noOfLong] = getRandomInt(4);
                MoveDistance = getRandomInt(2, 2);
            }
            root.rotation.y = Math.PI;
        }
    });
    AniLongMove.onRepeat(function () {
        app.MoveDirection[noOfLong] = getRandomInt(4);
        MoveDistance = getRandomInt(2, 2);
    })

    AniLongMove.delay(10);

    AniLongMove.repeat(Infinity);
    AniLongMove.start();

}

function LongAttack(app, root) {
    // Bone.006/007/008/009_Armature :  脖子
    // ”Bone.019_Armature”         ： 上颚
    // Bone.010_Armature             ： 下颚
    var neck = root.getObjectByName("Bone006_Armature");
    var lowerJaw = root.getObjectByName("Bone010_Armature");

    var AniNeck = new TWEEN.Tween(neck.rotation, app.groupLongAttack);
    var AniLowerJaw = new TWEEN.Tween(lowerJaw.rotation, app.groupLongAttack);

    AniNeck.to({ x: [-0.01 * Math.PI, neck.rotation.x] }, 2000);
    AniLowerJaw.to({ x: [-0.3 * Math.PI, lowerJaw.rotation.x] }, 2000);

    AniNeck.repeat(Infinity).yoyo();
    AniLowerJaw.repeat(Infinity).yoyo();

    AniNeck.onRepeat(function () { app.LongAttackFlag = false; });

    AniNeck.start();
    AniLowerJaw.start();
}

function getRandomInt(max, flag = 1) {
    //计算随机概率
    if (flag == 1) {
        return Math.floor(Math.random() * max);
    }
    else {
        return (Math.random() * max + 2) * 0.5;
    }
};

function lights(app) {
    scene.add(new THREE.AmbientLight(0x666666));
    const light = new THREE.DirectionalLight(0xdfebff, 1);
    light.position.set(50, 200, 100);
    light.position.multiplyScalar(1.3);
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    const d = 300;
    light.shadow.camera.left = - d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = - d;
    light.shadow.camera.far = 1000;
    app.scene.add(light);
}

function ground(app) {
    let controls = new FirstPersonControls(app);


    Terrain.fromImage('images/terrain1.png').then(function (terrain) {
        // app.scene.add(terrain.build());

        // // Scale terrain peaks
        // terrain.mesh.scale.y = 50.0;

        app.terrain = terrain;

        var loader = new THREE.TextureLoader();

        var texture = loader.load('images/texture.png');

        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(terrain.width / 50, terrain.height / 50);

        app.scene.add(terrain.build(texture));

        // Scale terrain peaks
        terrain.mesh.scale.y = 50.0;

        // Start in middle of terrain
        controls.position.x = 500*2;
        controls.position.z = 1000 * 2;

        window.addEventListener('app-update', function (evt) {
            controls.update(evt.detail.delta);
        });
        app.start();
    }).catch(function (e) {
        throw e;
    });
}

function scene(app) {
    // scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcce0ff);
    scene.fog = new THREE.Fog(0xcce0ff, 500, 10000);
}

function loadGame() {
    //document.location.href = "666666";
    
    window.location.href = "./GameOver.html";

    //console.log("11111111111" + document.getElementById('info'));
    //document.getElementById('info').innerHTML = "Grade: " + this.grade;
}

window.onload = function () {
    let app = new App();
    // Let there be light
    container = document.createElement('div');
    document.body.appendChild(container);
    //scene
    scene(app);
    // lights
    lights(app);
    //KeybaordListener
    KeybaordListener(app);
    //character
    CreateHero(app);
    //加载龙
    CreateLong(app, 300, 0, 'Monster01');
    CreateLong(app, 600, 1, 'Monster02');
    CreateLong(app, 900, 2, 'Monster03');

    CreatePizza(app);

    CreateTree(app);

    ground(app);
};
