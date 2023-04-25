import * as THREE from 'three';

export default class AudioAnalyser {
	constructor(sound) {
		this.sound = sound;
		this.dampingSpeed = 10;
		this.currentIntensity = 0;
		this.intensityScale = 3;

		this.analyser = new THREE.AudioAnalyser(this.sound, 32);
	}

	getBandData(band, deltaTime) {
		this.data = this.analyser.getFrequencyData();
		const audioIntensity = this.data[band] / 255;
		const newIntensity =
			1 + audioIntensity * this.intensityScale;

		if (newIntensity > this.currentIntensity) {
			this.currentIntensity = newIntensity;
		} else {
			this.currentIntensity -=
				(this.currentIntensity - newIntensity) *
				deltaTime *
				this.dampingSpeed;
		}

		const i = this.currentIntensity;

		return i;

		// convert to 8 band
	}
}
