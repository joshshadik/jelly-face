class Hand {

    constructor()
    {
        this._hand = null;

        this._vBuffer = gl.createBuffer();
        this._iBuffer = gl.createBuffer();

        this._leapVertices = new Float32Array(5 * 4 * 3);
        this._indices = 
        [
            0, 4, 4, 8, 8, 12, 12, 16, 16, 17, 17, 13, 13, 9, 9, 5, 5, 1, 1, 0,
            1, 2, 2, 3, 
            5, 6, 6, 7, 
            9, 10, 10, 11,
            13, 14, 14, 15,
            17, 18, 18, 19
        ];


        this._handOpened = new Float32Array([-19.33, -18.43, 55.01, -19.33, -18.43, 55.01, -48.07, -26.36, 15.27, -59.18, -40.61, -29.93, -10.14, 2.40, 48.84, -25.47, 9.75, -22.37, -30.84, 20.48, -60.74, -36.18, 11.31, -93.53, 1.66, 3.80, 45.84, -3.47, 10.33, -23.09, -3.76, 20.94, -66.93, -8.74, 8.33, -104.07, 13.64, 2.18, 43.98, 18.41, 7.29, -17.97, 23.93, 13.71, -58.91, 22.04, -2.13, -94.49, 24.90, -6.40, 43.88, 37.49, -0.14, -12.09, 47.74, 2.32, -43.45, 47.43, -12.19, -70.18]);
        this._handClosed = new Float32Array([-10.02, -20.22, 43.49, -10.02, -20.22, 43.49, -28.37, -18.54, 8.21, -29.85, -27.96, -34.33, -4.23, -2.63, 39.70, -22.56, 8.10, -14.98, -24.67, -3.77, -48.70, -27.84, -13.72, -77.57, 4.85, -0.60, 36.55, -5.14, 9.89, -17.16, -12.06, -4.29, -54.11, -17.79, -17.49, -86.04, 14.31, -1.05, 34.02, 12.83, 8.31, -15.01, 6.08, -5.88, -48.78, 0.33, -20.46, -79.74, 23.69, -7.22, 32.36, 28.86, 3.01, -12.43, 20.91, -5.76, -39.42, 14.90, -18.45, -62.51]);

        
        this._closed = false;
        this._leapMotion = false;

        this._mMatrix = [];
        mat4.fromScaling(this._mMatrix, vec3.fromValues(0.001, 0.001, 0.001));

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._handOpened, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._iBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this._indices), gl.STATIC_DRAW);

        for( var vv = 0; vv < this._handOpened.length; vv += 3)
        {
            this._handOpened[vv+2] = this._handOpened[vv+2] + 70;
            this._handClosed[vv+2] = this._handClosed[vv+2] + 70;
        }

        this._hidden = true;
    }

    flipHand()
    {
        for( var vv = 0; vv < this._handOpened.length; vv += 3)
        {
            this._handOpened[vv] = -this._handOpened[vv];
            this._handClosed[vv] = -this._handClosed[vv];
        }
    }

    setMatrix(mtx)
    {
        this._mMatrix = mtx;
    }

    setLeapHand(hand)
    {
        this._hand = hand;
        if( hand != null )
        {
            this._leapMotion = true;
            var fingers = this._hand.fingers;

            var idx = 0;
            for( var ff = 0; ff < fingers.length; ++ff )
            {
                this._leapVertices[idx] = fingers[ff].carpPosition[0];
                this._leapVertices[idx+1] = fingers[ff].carpPosition[1];
                this._leapVertices[idx+2] = fingers[ff].carpPosition[2];
                idx += 3;

                this._leapVertices[idx] = fingers[ff].mcpPosition[0];
                this._leapVertices[idx+1] = fingers[ff].mcpPosition[1];
                this._leapVertices[idx+2] = fingers[ff].mcpPosition[2];
                idx += 3;

                this._leapVertices[idx] = fingers[ff].pipPosition[0];
                this._leapVertices[idx+1] = fingers[ff].pipPosition[1];
                this._leapVertices[idx+2] = fingers[ff].pipPosition[2];
                idx += 3;


                this._leapVertices[idx] = fingers[ff].tipPosition[0];
                this._leapVertices[idx+1] = fingers[ff].tipPosition[1];
                this._leapVertices[idx+2] = fingers[ff].tipPosition[2];
                idx += 3;

            }

        }
        else
        {
            this._leapMotion = false;
        }

    }

    isLeapControlled()
    {
        return this._leapMotion;
    }

    setClosed(closed)
    {
        this._closed = closed;
    }

    // saveHand()
    // {
    //     var txt = "";
    //     var pp = this._hand.palmPosition;
    //     for( var vv = 0; vv < this._leapVertices.length/3; ++vv )
    //     {
            
    //         txt = txt + (this._leapVertices[vv*3] - pp[0]).toFixed(2) + ", " + ( this._leapVertices[vv*3 + 1] - pp[1] ).toFixed(2) + ", " + (this._leapVertices[vv*3 + 2] - pp[2]).toFixed(2) + ", ";
    //     }

    //     var blob = new Blob([txt], {type: "text/plain"});

    //     saveAs(blob, "hand.txt");
    // }

    getPinchPos()
    {
        if( this._hand != null )
        {
            var tipPos = hand0.indexFinger.tipPosition;

            return tipPos;
        }
    }


    setHidden(hidden)
    {
        this._hidden = hidden;
    }


    render(material)
    {
        if( !this._hidden )
        {
            if( material != null )
            {
                material.setMatrix("uMMatrix", this._mMatrix);
                material.apply();
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, this._vBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this._leapMotion ? this._leapVertices : (this._closed ? this._handClosed : this._handOpened ), gl.STATIC_DRAW);

            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

            // gl.drawArrays(gl.LINES, 0, 5 * 4);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._iBuffer);
            gl.drawElements(gl.LINES, 40, gl.UNSIGNED_INT, 0);   
            
            gl.drawArrays(gl.POINTS, 0, 5 * 4);
            if( material != null )
            {
                material.unapply();
            }
        }
    }



}