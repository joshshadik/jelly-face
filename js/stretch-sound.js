function StretchSound() {
    this._oscillator = new Tone.Oscillator({
        "frequency" : 440,
        "volume" : -10,
        "type" : "square"
    }).toMaster();
    this._frequency = 0.0;
    this._velocity = 0.0;
    this._distance = 0.0;
    this._isPlaying = false;

    this._desiredFactor = 0.0;
    this._currentFactor = 0.0;
    this._desiredFrequency = 0.0;

    this._stiffness = 400.0;
    this._damping = 5.0;

    this._desiredVolume = 0.0;
    this._volume = 0.0;
    this._volumeVelocity = 0.0;
}

StretchSound.prototype.start = function() {
    this._oscillator.start();
    Tone.Master.volume.rampTo(-5, 0.05);
    this._isPlaying = true;
}

StretchSound.prototype.end = function() {
    Tone.Master.volume.rampTo(-100.0, 5.0);
    this._isPlaying = false;
}

StretchSound.prototype.stretch = function(distance) {
    var stretch =  ((distance - this._distance) / Time.deltaTime()) * 0.5;
    //var stretch = distance * 500.0;

    this._desiredFrequency = stretch;
    this._distance = distance;
    this._desiredFactor = distance * 3.0;

    this._desiredVolume = Math.max(-1.0 / distance, -20.0);
};


StretchSound.prototype.update = function(dt) {

    var stretch = this._desiredFactor - this._currentFactor;

    var accel = stretch * this._stiffness - this._velocity * this._damping;
    this._velocity += accel * dt;
    this._currentFactor += this._velocity * dt;
    this._frequency = Math.exp(this._currentFactor) * 50.0;
    this._oscillator.frequency.rampTo( Math.max(this._frequency, 0.0), 0.05);


    // stretch = this._desiredVolume - this._volume;

    // if( Math.abs(stretch) > 1 )
    // {

    // accel = stretch * 50.0 - this._volumeVelocity * 50.0;
    // this._volumeVelocity += accel * dt;
    // this._volume += this._volumeVelocity * dt;

    // if( isNaN(this._volume))
    // {
    //     this._volume = -50.0;
    // }
    // console.log(this._volume);

    // var vol = this._volume;

    // // if( vol < -50.0 )
    // // {
    // //     vol = -Infinity;
    // // }
    // Tone.Master.volume.value = vol;
    //}
}