import * as THREE from 'three';

export default class AudioPlayer {
	constructor(camera, audioPath) {
		// set local varables
		this.camera = camera;
		this.audioPath = audioPath;

		// create audio listener and add it to the camera
		this.listener = new THREE.AudioListener();
		this.camera.add(this.listener);

		// create an audio source
		this.sound = new THREE.Audio(this.listener);

		// load a sound and set it as the audio object's buffer
		const audioLoader = new THREE.AudioLoader();
		audioLoader.load(this.audioPath, (buffer) => {
			this.sound.setBuffer(buffer);
			this.sound.setLoop(true);
			this.sound.setVolume(0.5);
		});
	}
}
