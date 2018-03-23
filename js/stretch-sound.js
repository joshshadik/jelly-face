"use strict";
function StretchSound() {
    this._oscillator = new Tone.Oscillator({
        "frequency" : 0,
        "volume" : -Infinity,
        "type" : "sawtooth4",
    }).toMaster();


    this._frequency = 0.0;
    this._velocity = 0.0;
    this._distance = -1.0;
    this._isPlaying = false;

    this._desiredFactor = 0.0;
    this._currentFactor = 0.0;

    this._stiffness = 600.0;
    this._damping = 10.0;

    this._desiredVolume = -100.0;
    this._volume = -100.0;
    this._volumeVelocity = 0.0;

    this._oscillator.start();
}

StretchSound.prototype.begin = function() {
    this._desiredVolume = -10.0;
    this._isPlaying = true;

}

StretchSound.prototype.end = function() {
    this._velocity = -70.0;
    this._desiredFactor = this._distance;
    this._desiredVolume = -50.0;
    this._volumeVelocity = 0.0;
}

StretchSound.prototype.stop = function() {
    this._frequency = 0.0;
    this._velocity = 0.0;
    this._desiredFactor  = 0.0;
    this._desiredVolume = -100.0;
    this._volume = -100.0;
    this._isPlaying = false;
}


StretchSound.prototype.stretch = function(distance) {
    if( this._distance < 0.0 )
    {
        this._distance = distance;
        return;
    }

    var stretch =  Math.min(Math.abs((distance - this._distance) / Time.deltaTime()), 0.5);

    this._distance = distance;
    this._desiredFactor = Math.min( distance, 2.0 ) + stretch * 1.5;
    this._desiredVolume = -10.0; //Math.max(-1.0 / distance, -20.0);
};


StretchSound.prototype.update = function(dt) {

    if(!this._isPlaying )
    {
        return;
    }

    this._desiredFactor = Math.max( this._desiredFactor - dt, 0.0 );
    var stretch = this._desiredFactor - this._currentFactor;

    var accel = stretch * this._stiffness - this._velocity * this._damping;
    this._velocity += accel * dt;
    this._currentFactor += this._velocity * dt;
    this._frequency = Math.max(Math.min(Math.exp(this._currentFactor) * 20.0, 500.0) , 0.0);

    if(!isFinite(this._frequency ) )
    {
        this._frequency = 0.0;
        this._currentFactor = 0.0;
    }

    this._oscillator.frequency.rampTo( this._frequency, 0.01 );

    stretch = this._desiredVolume - this._volume;

    if( Math.abs(stretch) > 1 )
    {
        accel = stretch * 50.0 - this._volumeVelocity * 5;
        this._volumeVelocity += accel * dt;
        this._volume += this._volumeVelocity * dt;

        if( isNaN(this._volume))
        {
            this._volume = -100.0;
        }

        if( !isFinite(this._volume ))
        {
            this._volume = -100.0;
        }

        this._oscillator.volume.targetRampTo( this._volume, 2.0 );
    }

    this._desiredVolume = Math.max( this._desiredVolume - dt * 10.0, -100.0 );
}