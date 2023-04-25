import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import AudioAnalyser from './AudioAnalyser.js';
import AudioPlayer from './AudioPlayer.js';

// ------ window ------

// canvas
const canvas = document.querySelector('canvas.threejs');

// viewport
const viewport = {
	width: window.innerWidth,
	height: window.innerHeight
};
viewport.viewAspect = viewport.width / viewport.height;

// ------ loaders ------
const textureLoader = new THREE.TextureLoader();
const displacementTexture = textureLoader.load('/static/displacementMap.png');

// ------ scene ------

// scene
const scene = new THREE.Scene();

// camera
const camera = new THREE.PerspectiveCamera(75, viewport.viewAspect, 0.1, 100);
camera.position.set(0, 0, 10);
scene.add(camera);

// renderer
const renderer = new THREE.WebGLRenderer({
	canvas: canvas
});
renderer.setSize(viewport.width, viewport.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ------ update window size ------

window.addEventListener('resize', () => {
	viewport.width = window.innerWidth;
	viewport.height = window.innerHeight;
	viewport.viewAspect = viewport.width / viewport.height;

	camera.aspect = viewport.viewAspect;
	camera.updateProjectionMatrix();

	renderer.setSize(viewport.width, viewport.height);
	renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
});

// ------ controls ------

const gui = new GUI();

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// ------ audio ------

const playState = Object.freeze({
	Off: Symbol('off'),
	Playing: Symbol('playing')
});
let currentPlayState = playState.Off;

const audioPath = '/static/reflect.wav';
const audioPlayer = new AudioPlayer(camera, audioPath);
const audioAnalyser = new AudioAnalyser(audioPlayer.sound);
const playImage = '/static/play.png';
const pauseImage = '/static/pause.png';
const playButton = document.getElementById('playpause');

playButton.onclick = () => {
	if (currentPlayState === playState.Off) {
		playButton.src = pauseImage;
		currentPlayState = playState.Playing;
		audioPlayer.sound.play();
		console.log('audio started');
	} else if (currentPlayState === playState.Playing) {
		playButton.src = playImage;
		currentPlayState = playState.Off;
		audioPlayer.sound.pause();
		console.log('audio stopped');
	}
};

gui.add(audioAnalyser, 'dampingSpeed').min(0.01).max(20);
gui.add(audioAnalyser, 'intensityScale').min(1).max(10);

// ------ scene objects ------

// objects
const audioBands = new THREE.Group();
scene.add(audioBands);

const band1Parent = new THREE.Group();
band1Parent.position.y = -2;
audioBands.add(band1Parent);

const band1 = new THREE.Mesh(
	new THREE.BoxGeometry(1, 1, 1),
	new THREE.MeshStandardMaterial()
);
band1.position.y = 0.5;
band1Parent.add(band1);

const shaderGeometry = new THREE.PlaneGeometry(10, 10, 50, 50);
const shaderMaterial = new THREE.ShaderMaterial({
	transparent: true,
	precision: 'lowp',
	uniforms: {
		uCustomTime: { value: 0 },
		uTime: { value: 0 },
		uDisplacementTexture: { value: displacementTexture },
		uDisplacementStrength: { value: 1.5 }
	},
	vertexShader: document.getElementById('vertex-shader').text,
	fragmentShader: document.getElementById('fragment-shader').text
});
displacementTexture.wrapS = THREE.RepeatWrapping;
displacementTexture.wrapT = THREE.RepeatWrapping;

const shaderMesh = new THREE.Mesh(shaderGeometry, shaderMaterial);
shaderMesh.rotation.x = Math.PI * 0.5;
shaderMesh.rotation.z = Math.PI * 0.5;
shaderMesh.position.y = 3;
scene.add(shaderMesh);

// lights
const ambientLight = new THREE.AmbientLight('#ffffff', 0.3);
const directionalLight = new THREE.DirectionalLight('#ffffff', 0.7);
directionalLight.position.set(1, 2, 1.5);
scene.add(ambientLight, directionalLight);

// ------ update ------

const clock = new THREE.Clock();
let previousElapsedTime = 0;

const tick = () => {
	const elapsedTime = clock.getElapsedTime();
	const deltaTime = elapsedTime - previousElapsedTime;
	previousElapsedTime = elapsedTime;

	// update analyser
	const audioIntensity = audioAnalyser.getBandData(3, deltaTime);
	shaderMaterial.uniforms.uTime.value = elapsedTime;

	band1Parent.scale.y = audioIntensity;

	let timeToAdd = deltaTime;
	if (audioIntensity / audioAnalyser.intensityScale > 1) {
		timeToAdd *= audioIntensity;
	}
	shaderMaterial.uniforms.uCustomTime.value += timeToAdd;

	// update controls
	controls.update();

	// render
	renderer.render(scene, camera);

	// call on tick on next frame
	window.requestAnimationFrame(tick);
};

tick();
