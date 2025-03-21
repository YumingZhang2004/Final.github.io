import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 创建场景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

// 创建相机
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// 创建渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 添加轨道控制器
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// 背景变量
let currentBackground = 0;
const backgrounds = [
    { color: 0xf0f0f0, type: 'color' }, // 默认浅灰色
    { color: 0x87CEEB, type: 'color' }, // 天蓝色
    { color: 0xFFB6C1, type: 'color' }, // 浅粉色
    { type: 'gradient', colors: [0x1E90FF, 0xFF69B4] }, // 蓝粉渐变
    { type: 'stars' } // 星空背景
];

// 创建星空背景
let stars;
function createStars() {
    if (stars) scene.remove(stars);
    
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
    
    stars = new THREE.Points(geometry, material);
    return stars;
}

// 创建渐变背景
let gradientScene, gradientCamera, gradientMesh;
function setupGradientBackground(color1, color2) {
    if (!gradientScene) {
        gradientScene = new THREE.Scene();
        gradientCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        
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
        
        gradientMesh = new THREE.Mesh(geometry, material);
        gradientScene.add(gradientMesh);
    } else {
        gradientMesh.material.uniforms.color1.value = new THREE.Color(color1);
        gradientMesh.material.uniforms.color2.value = new THREE.Color(color2);
    }
}

// 更改背景
function changeBackground() {
    currentBackground = (currentBackground + 1) % backgrounds.length;
    const bg = backgrounds[currentBackground];
    
    if (bg.type === 'color') {
        scene.background = new THREE.Color(bg.color);
        renderer.autoClear = true;
    } 
    else if (bg.type === 'gradient') {
        setupGradientBackground(bg.colors[0], bg.colors[1]);
        renderer.autoClear = false;
    }
    else if (bg.type === 'stars') {
        scene.background = new THREE.Color(0x000000);
        if (!stars) {
            stars = createStars();
            scene.add(stars);
        } else {
            scene.add(stars);
        }
    }
}

// 添加光源
const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
backLight.position.set(-1, -1, -1);
scene.add(backLight);

// 创建STL加载器
const loader = new STLLoader();
let model;

// 加载STL文件
loader.load('cookie.stl', function (geometry) {
    // 为模型创建材质
    const material = new THREE.MeshPhongMaterial({
        color: 0xf5deb3,
        specular: 0x111111,
        shininess: 100
    });
    
    // 创建网格
    model = new THREE.Mesh(geometry, material);
    
    // 居中模型
    geometry.computeBoundingBox();
    const boundingBox = geometry.boundingBox;
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    model.position.set(-center.x, -center.y, -center.z);
    
    // 调整模型大小
    const maxDim = Math.max(
        boundingBox.max.x - boundingBox.min.x,
        boundingBox.max.y - boundingBox.min.y,
        boundingBox.max.z - boundingBox.min.z
    );
    const scale = 2 / maxDim;
    model.scale.set(scale, scale, scale);
    
    // 添加到场景
    scene.add(model);
}, undefined, function (error) {
    console.error('加载STL文件时出错:', error);
});

// 动画参数和状态控制
let time = 0;
const jumpHeight = 0.2;
const jumpSpeed = 0.05;
const rotationSpeed = 0.01;

// 动画状态
const animationState = {
    jumping: true,
    rotating: false,
    paused: false
};

// 窗口大小调整
window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 按钮事件处理
document.getElementById('btnJump').addEventListener('click', function() {
    animationState.jumping = true;
    animationState.rotating = false;
    animationState.paused = false;
    updateButtonStates('btnJump');
});

document.getElementById('btnRotate').addEventListener('click', function() {
    animationState.jumping = false;
    animationState.rotating = true;
    animationState.paused = false;
    updateButtonStates('btnRotate');
});

document.getElementById('btnBoth').addEventListener('click', function() {
    animationState.jumping = true;
    animationState.rotating = true;
    animationState.paused = false;
    updateButtonStates('btnBoth');
});

document.getElementById('btnStop').addEventListener('click', function() {
    animationState.paused = true;
    updateButtonStates('btnStop');
});

document.getElementById('btnChangeBg').addEventListener('click', function() {
    changeBackground();
});

// 更新按钮状态
function updateButtonStates(activeId) {
    const buttons = ['btnJump', 'btnRotate', 'btnBoth', 'btnStop'];
    buttons.forEach(id => {
        const btn = document.getElementById(id);
        if (id === activeId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    
    // 如果有渐变背景，先绘制渐变
    if (currentBackground === 3) { // 渐变背景的索引
        renderer.render(gradientScene, gradientCamera);
    }
    
    if (model && !animationState.paused) {
        // 跳跃动画
        if (animationState.jumping) {
            time += jumpSpeed;
            model.position.y = Math.abs(Math.sin(time)) * jumpHeight;
        } else {
            model.position.y = 0; // 不跳时回到原位
        }
        
        // 旋转动画
        if (animationState.rotating) {
            model.rotation.y += rotationSpeed;
        }
    }
    
    // 星空背景动画
    if (stars && currentBackground === 4) {
        stars.rotation.y += 0.0005;
    }
    
    controls.update();
    renderer.render(scene, camera);
}

animate(); 