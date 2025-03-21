import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class SceneManager {
    constructor() {
        this.models = {};
        this.currentModel = null;
        this.plate = null;
        this.animationState = {
            jumping: true,
            rotating: false,
            paused: false
        };
        this.currentBackground = 0;
        this.backgrounds = [
            { color: 0xf0f0f0, type: 'color' },
            { color: 0x87CEEB, type: 'color' },
            { color: 0xFFB6C1, type: 'color' },
            { type: 'gradient', colors: [0x1E90FF, 0xFF69B4] },
            { type: 'stars' }
        ];

        this.initScene();
        this.addLights();
        this.setupControls();
        this.loadAllModels();
        this.setupUI();
        this.initBackgroundSystem();
        this.animate();
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0);
        
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 3, 8);
        this.camera.lookAt(0, 0, 0);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.modelContainer = new THREE.Group();
        this.modelContainer.position.y = 2;
        this.scene.add(this.modelContainer);
    }

    addLights() {
        const ambientLight = new THREE.AmbientLight(0x404040, 1);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);

        const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
        backLight.position.set(-1, -1, -1);
        this.scene.add(backLight);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
    }

    loadAllModels() {
        const loader = new STLLoader();
        this.loadPlate(loader);
        this.loadCookieModels(loader);
        this.loadSnowmanAndCake(loader);
    }

    loadPlate(loader) {
        loader.load('models/plate.stl', (geometry) => {
            const material = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                specular: 0x111111,
                shininess: 100
            });
            
            this.plate = new THREE.Mesh(geometry, material);
            
            geometry.computeBoundingBox();
            const center = geometry.boundingBox.getCenter(new THREE.Vector3());
            this.plate.position.sub(center);
            this.plate.position.set(0, 1.5, 0);
            this.plate.rotation.x = -Math.PI / 2;
            this.plate.scale.set(0.5, 0.5, 0.5);
            
            this.scene.add(this.plate);
            console.log('Plate loaded successfully');
        }, undefined, (error) => {
            console.error('Plate loading failed:', error);
        });
    }

    loadCookieModels(loader) {
        this.loadModel(loader, 'models/cookie.stl', {
            material: new THREE.MeshPhongMaterial({
                color: 0xf5deb3,
                specular: 0x111111,
                shininess: 100
            }),
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Euler(Math.PI / 2, 0, 0),
            scale: 0.3
        }, 'cookie');

        this.loadModel(loader, 'models/cookie1.stl', {
            material: new THREE.MeshPhongMaterial({
                color: 0xd2b48c,
                specular: 0x222222,
                shininess: 120
            }),
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Euler(Math.PI / 2, 0, 0),
            scale: 0.4
        }, 'cookie1');

        this.loadModel(loader, 'models/cookie2.stl', {
            material: new THREE.MeshPhongMaterial({
                color: 0xcd853f,
                specular: 0x151515,
                shininess: 80
            }),
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Euler(Math.PI/2, 0, 0),
            scale: 0.4
        }, 'cookie2');

        this.loadModel(loader, 'models/cookie3.stl', {
            material: new THREE.MeshPhongMaterial({
                color: 0x8b4513,
                specular: 0x333333,
                shininess: 150
            }),
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Euler(Math.PI/2, 0, 0),
            scale: 0.4
        }, 'cookie3');
    }

    loadSnowmanAndCake(loader) {
        this.loadModel(loader, 'models/snowman.stl', {
            material: new THREE.MeshPhongMaterial({
                color: 0xffffff,
                specular: 0x111111,
                shininess: 100
            }),
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Euler(-Math.PI/2, 0, 0),
            scale: 1
        }, 'snowman');

        this.loadModel(loader, 'models/cake.stl', {
            material: new THREE.MeshPhongMaterial({
                color: 0x8B4513,
                specular: 0x222222,
                shininess: 50
            }),
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Euler(-Math.PI/2, 0, 0),
            scale: 0.4
        }, 'cake');
    }

    loadModel(loader, path, config, name) {
        loader.load(path, (geometry) => {
            const mesh = new THREE.Mesh(geometry, config.material);
            
            geometry.computeBoundingBox();
            const center = geometry.boundingBox.getCenter(new THREE.Vector3());
            mesh.position.sub(center);
            
            mesh.position.add(config.position);
            mesh.rotation.copy(config.rotation);
            mesh.scale.set(config.scale, config.scale, config.scale);
            mesh.visible = false;
            
            this.models[name] = mesh;
            this.modelContainer.add(mesh);
            
            if(!this.currentModel) this.switchModel(name);
        }, undefined, (error) => {
            console.error(`Error loading ${name}:`, error);
        });
    }

    switchModel(modelName) {
        if (!this.models[modelName]) {
            console.error(`Model ${modelName} not found!`);
            return;
        }

        if (this.currentModel) {
            this.currentModel.visible = false;
        }

        this.currentModel = this.models[modelName];
        this.currentModel.visible = true;

        if (this.plate) {
            const showPlate = !['snowman', 'cake'].includes(modelName);
            this.plate.visible = showPlate;
            
            if (showPlate) {
                this.plate.position.set(0, 1.5, 0);
                this.plate.rotation.x = -Math.PI / 2;
                this.plate.scale.set(0.5, 0.5, 0.5);
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    setupUI() {
        document.getElementById('modelSelector').addEventListener('change', (e) => {
            this.switchModel(e.target.value);
        });

        document.getElementById('btnJump').addEventListener('click', () => {
            this.animationState.jumping = true;
            this.animationState.rotating = false;
            this.animationState.paused = false;
            this.updateButtonStates('btnJump');
        });

        document.getElementById('btnRotate').addEventListener('click', () => {
            this.animationState.jumping = false;
            this.animationState.rotating = true;
            this.animationState.paused = false;
            this.updateButtonStates('btnRotate');
        });

        document.getElementById('btnBoth').addEventListener('click', () => {
            this.animationState.jumping = true;
            this.animationState.rotating = true;
            this.animationState.paused = false;
            this.updateButtonStates('btnBoth');
        });

        document.getElementById('btnStop').addEventListener('click', () => {
            this.animationState.paused = true;
            this.updateButtonStates('btnStop');
        });

        document.getElementById('btnChangeBg').addEventListener('click', () => {
            this.changeBackground();
        });
    }

    updateButtonStates(activeId) {
        const buttons = ['btnJump', 'btnRotate', 'btnBoth', 'btnStop'];
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            btn.classList.toggle('active', id === activeId);
        });
    }

    initBackgroundSystem() {
        this.stars = null;
        this.gradientScene = null;
        this.gradientCamera = null;
        this.gradientMesh = null;
    }

    createStars() {
        if (this.stars) this.scene.remove(this.stars);
        
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        
        for (let i = 0; i < 5000; i++) {
            const x = (Math.random() - 0.5) * 2000;
            const y = (Math.random() - 0.5) * 2000;
            const z = (Math.random() - 0.5) * 2000;
            vertices.push(x, y, z);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 1,
            transparent: true
        });
        
        this.stars = new THREE.Points(geometry, material);
        return this.stars;
    }

    setupGradientBackground(color1, color2) {
        if (!this.gradientScene) {
            this.gradientScene = new THREE.Scene();
            this.gradientCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
            
            const geometry = new THREE.PlaneGeometry(2, 2);
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    color1: { value: new THREE.Color(color1) },
                    color2: { value: new THREE.Color(color2) }
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform vec3 color1;
                    uniform vec3 color2;
                    varying vec2 vUv;
                    void main() {
                        gl_FragColor = vec4(mix(color1, color2, vUv.y), 1.0);
                    }
                `
            });
            
            this.gradientMesh = new THREE.Mesh(geometry, material);
            this.gradientScene.add(this.gradientMesh);
        } else {
            this.gradientMesh.material.uniforms.color1.value = new THREE.Color(color1);
            this.gradientMesh.material.uniforms.color2.value = new THREE.Color(color2);
        }
    }

    changeBackground() {
        this.currentBackground = (this.currentBackground + 1) % this.backgrounds.length;
        const bg = this.backgrounds[this.currentBackground];
        
        if (bg.type === 'color') {
            this.scene.background = new THREE.Color(bg.color);
            this.renderer.autoClear = true;
        } 
        else if (bg.type === 'gradient') {
            this.setupGradientBackground(bg.colors[0], bg.colors[1]);
            this.renderer.autoClear = false;
        }
        else if (bg.type === 'stars') {
            this.scene.background = new THREE.Color(0x000000);
            if (!this.stars) {
                this.stars = this.createStars();
                this.scene.add(this.stars);
            } else {
                this.scene.add(this.stars);
            }
        }
    }

    animate() {
        const clock = new THREE.Clock();
        let time = 0;
        
        const animateLoop = () => {
            requestAnimationFrame(animateLoop);
            
            const delta = clock.getDelta();
            
            if (this.currentBackground === 3) {
                this.renderer.render(this.gradientScene, this.gradientCamera);
            }
            
            if (this.currentModel && !this.animationState.paused) {
                if (this.animationState.jumping) {
                    time += delta;
                    const jumpHeight = 0.5;
                    this.currentModel.position.y = Math.abs(Math.sin(time * 2)) * jumpHeight - (jumpHeight/2) + 2;
                }
                
                if (this.animationState.rotating) {
                    this.currentModel.rotation.z += delta;
                }
            }
            
            if (this.stars && this.currentBackground === 4) {
                this.stars.rotation.y += 0.0005;
            }
            
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        };
        
        animateLoop();
    }
}

new SceneManager();