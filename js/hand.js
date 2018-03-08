class Hand {

    constructor()
    {
        this._hand = null;

        this._vBuffer = gl.createBuffer();
        this._iBuffer = gl.createBuffer();

        this._vertices = new Float32Array(5 * 4 * 3);
        this._indices = 
            [
                0, 4, 4, 8, 8, 12, 12, 16, 16, 17, 17, 13, 13, 9, 9, 5, 5, 1, 1, 0,
                1, 2, 2, 3, 
                5, 6, 6, 7, 
                9, 10, 10, 11,
                13, 14, 14, 15,
                17, 18, 18, 19
            ];

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._vertices, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._iBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this._indices), gl.STATIC_DRAW);

        this._initialized = false;
    }

    setHand(hand)
    {
        this._hand = hand;
        if( hand != null )
        {

            var fingers = this._hand.fingers;

            var idx = 0;
            for( var ff = 0; ff < fingers.length; ++ff )
            {
                this._vertices[idx] = fingers[ff].carpPosition[0];
                this._vertices[idx+1] = fingers[ff].carpPosition[1];
                this._vertices[idx+2] = fingers[ff].carpPosition[2];
                idx += 3;

                this._vertices[idx] = fingers[ff].mcpPosition[0];
                this._vertices[idx+1] = fingers[ff].mcpPosition[1];
                this._vertices[idx+2] = fingers[ff].mcpPosition[2];
                idx += 3;

                this._vertices[idx] = fingers[ff].pipPosition[0];
                this._vertices[idx+1] = fingers[ff].pipPosition[1];
                this._vertices[idx+2] = fingers[ff].pipPosition[2];
                idx += 3;


                this._vertices[idx] = fingers[ff].tipPosition[0];
                this._vertices[idx+1] = fingers[ff].tipPosition[1];
                this._vertices[idx+2] = fingers[ff].tipPosition[2];
                idx += 3;

            }

            this._initialized = true;
        }
        else
        {
            this._initialized = false;
        }


        // console.log(this._vertices);
    }

    getPinchPos()
    {
        if( this._hand != null )
        {
            var tipPos = hand0.indexFinger.tipPosition;

            return tipPos;
        }
    }


    render()
    {
        if( this._initialized )
        {

            gl.bindBuffer(gl.ARRAY_BUFFER, this._vBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this._vertices, gl.STATIC_DRAW);

            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

            // gl.drawArrays(gl.LINES, 0, 5 * 4);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._iBuffer);
            gl.drawElements(gl.LINES, 40, gl.UNSIGNED_INT, 0);    
        }
    }



}