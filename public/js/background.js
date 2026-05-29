import * as THREE from "three";

let config = {
    speed: 0.2,
    elevation: 1.5,
    wireframe: true,
    colors: {
        dark: { mesh: "#444444", bg: "#050505" },
        light: { mesh: "#aaaaaa", bg: "#f2f2f7" }
    }
};

// ★修正: 初期状態をシステム設定から取得（クラス付与前でも正しく判定するため）
let isLightMode = window.matchMedia("(prefers-color-scheme: light)").matches;
if (document.body.classList.contains("light-mode")) {
    isLightMode = true;
}

const canvas = document.querySelector("#bg-canvas");
const scene = new THREE.Scene();

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 1, 3);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const geometry = new THREE.PlaneGeometry(10, 10, 64, 64);
const material = new THREE.MeshStandardMaterial({
    color: config.colors.dark.mesh,
    wireframe: config.wireframe,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5
});

const plane = new THREE.Mesh(geometry, material);
plane.rotation.x = -Math.PI * 0.5;
scene.add(plane);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 20);
pointLight.position.set(2, 5, 2);
scene.add(pointLight);

const clock = new THREE.Clock();

function updateColors() {
    if (!config.colors) return;
    const theme = isLightMode ? config.colors.light : config.colors.dark;
    
    // 背景色とメッシュ色を更新
    scene.background = new THREE.Color(theme.bg);
    if (material) {
        material.color.set(theme.mesh);
        material.wireframe = config.wireframe;
    }
}

// 設定読み込み
async function loadSettings() {
    try {
        const response = await fetch("settings.json");
        const data = await response.json();

        if (data.background) {
            config = { ...config, ...data.background };
            updateColors();
        }
    } catch (e) {
        console.warn("Background settings could not be loaded, using defaults.", e);
    }
}

window.addEventListener("resize", () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
});

// ★修正: main.js からのイベントを受け取る
window.addEventListener("theme-change", e => {
    isLightMode = e.detail.isLight;
    updateColors();
});

const tick = () => {
    const elapsedTime = clock.getElapsedTime();
    const positionAttribute = geometry.attributes.position;
    
    for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const z = Math.sin(x * 2 + elapsedTime * config.speed) *
                  Math.sin(y * 1.5 + elapsedTime * config.speed) *
                  (config.elevation * 0.3);
        positionAttribute.setZ(i, z);
    }
    positionAttribute.needsUpdate = true;
    plane.rotation.z = elapsedTime * 0.05;

    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};

// 初期実行
loadSettings();
updateColors(); // 初期状態を適用
tick();