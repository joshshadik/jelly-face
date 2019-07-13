"use strict";
class Mesh {
    constructor(vertices, indices, stride = 12, layout = [[0, 3]])
    {
        this.vertexBuffer = gl.createBuffer();
        this.indexBuffer = gl.createBuffer();
        this.stride = stride;
        this.layout = layout;

        this.elementCount = indices.length;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        if(_supportsUIntIndices)
        {
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);
        }
        else
        {
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        }
        
    }

    render( primitive = gl.TRIANGLES)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

        for( var i = 0; i < this.layout.length; i++ )
        {
            gl.vertexAttribPointer(i, this.layout[i][1], gl.FLOAT, false, this.stride, this.layout[i][0]);
        }

        //gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);  
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        if(_supportsUIntIndices)
        {
            gl.drawElements(primitive, this.elementCount, gl.UNSIGNED_INT, 0);
        }
        else
        {
            gl.drawElements(primitive, this.elementCount, gl.UNSIGNED_SHORT, 0); 
        }   
    }
}