"use strict";

var FaceCullModeEnum = {
    FRONT: 0,
    BACK: 1,
    BOTH: 2,
    NONE: 3
};


// var vertexAttributeToggler = new Object();
// vertexAttributeToggler.currAttributes = 0x0; // assume no more than 32 attributes
// vertexAttributeToggler.enable = function(attributes) {
//     var x = this.currAttributes ^ attributes;

//     for( var v = 0; v < 32; v += 1 )
//     {
//         var curr = ((1 << v) & this.currAttributes);
//         if( curr != ((1 << v) & attributes))
//         {
//             if( curr != 0 )
//             {
//                 gl.disableVertexAttribArray(v);
//             }
//             else
//             {
//                 gl.enableVertexAttribArray(v);
//             }
//         }
//     }

//     this.currAttributes = attributes;
// };

class Material {
    constructor(vertexShader, fragmentShader) 
    {     
        this.shaderProgram = null;
        if( vertexShader != null && fragmentShader != null )
        {
            this.shaderProgram = gl.createProgram();
            gl.attachShader(this.shaderProgram, vertexShader);
            gl.attachShader(this.shaderProgram, fragmentShader);
            gl.linkProgram(this.shaderProgram);
            
            if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) 
            {
                alert("Unable to initialize the shader program: " + gl.getProgramInfoLog(this.shaderProgram));
            }
        }
        
        this.textureAttributes = [];
        this.floatAttributes = [];
        this.vertexAttributes = [];
        this.matrixAttributes = [];
        this.vec3Attributes = [];
        this.vec2Attributes = [];

        this._cullMode = FaceCullModeEnum.BACK;

        this.vAttribBits = 0;
    }
    
    
    setTexture(attName, value ) 
    {
        this.textureAttributes[attName] = [gl.getUniformLocation(this.shaderProgram, attName), value];
    }
    
    setFloat( attName, value ) 
    {
        this.floatAttributes[attName] = [gl.getUniformLocation(this.shaderProgram, attName), value];
    }
    
    setMatrix( attName, value ) 
    {
        this.matrixAttributes[attName] = [gl.getUniformLocation(this.shaderProgram, attName), value];
    }

    setVec2( attName, value )
    {
        this.vec2Attributes[attName] = [gl.getUniformLocation(this.shaderProgram, attName), value];
    }
    
    setVec3( attName, value )
    {
        this.vec3Attributes[attName] = [gl.getUniformLocation(this.shaderProgram, attName), value];
    }
    
    setShader(shaderProgram )
    {
        this.shaderProgram = shaderProgram;
    }
    
    addVertexAttribute( attName ) 
    {
        var attValue = gl.getAttribLocation(this.shaderProgram, attName );
        gl.enableVertexAttribArray(attValue);
        this.vertexAttributes[attName] = attValue;
        if(!_supportsWebGL2)
        {
            gl.disableVertexAttribArray(attValue);
        }
        

        this.vAttribBits = 0;
        for( var attName in this.vertexAttributes )
        {
            this.vAttribBits |= 1 << this.vertexAttributes[attName];
        }

        return attValue;
    }
    
    getVertexAttribute( attName ) 
    {
        return this.vertexAttributes[attName];
    }

    setCull( value)
    {
        this._cullMode = value;
    }
    
    
    apply() 
    {
        
        switch(this._cullMode )
        {
            case FaceCullModeEnum.FRONT:
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.FRONT);
            break;

            case FaceCullModeEnum.BACK:
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.BACK);
            break;

            case FaceCullModeEnum.BOTH:
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.FRONT_AND_BACK);
            break;

            case FaceCullModeEnum.NONE:
            gl.disable(gl.CULL_FACE);
            break;
        }

        gl.useProgram(this.shaderProgram);
  
        var texCount = 0;
        for( var attName in this.textureAttributes )
        {
            gl.activeTexture(gl.TEXTURE0 + texCount);
            gl.bindTexture(gl.TEXTURE_2D, this.textureAttributes[attName][1]);
            gl.uniform1i(this.textureAttributes[attName][0], texCount);   
              
            texCount++;
        }
        
        for( var attName in this.floatAttributes )
        {
            gl.uniform1f( this.floatAttributes[attName][0], this.floatAttributes[attName][1] );           
        }
        
        for( var attName in this.matrixAttributes )
        {
            gl.uniformMatrix4fv( this.matrixAttributes[attName][0], false, this.matrixAttributes[attName][1] );
        }
        
        for( var attName in this.vec3Attributes )
        {
            gl.uniform3fv( this.vec3Attributes[attName][0], this.vec3Attributes[attName][1]) ;
        }

        for( var attName in this.vec2Attributes )
        {
            gl.uniform2fv( this.vec2Attributes[attName][0], this.vec2Attributes[attName][1]) ;
        }
        
        if(!_supportsWebGL2)
        {
            for( var attName in this.vertexAttributes )
            {
                gl.enableVertexAttribArray( this.vertexAttributes[attName] );
            }
        }

        //vertexAttributeToggler.enable(this.vAttribBits);
    }

    unapply()
    {
        if(!_supportsWebGL2)
        {
            for( var attName in this.vertexAttributes )
            {
                gl.disableVertexAttribArray( this.vertexAttributes[attName] );
            }
        }

        gl.enable(gl.CULL_FACE);
    }

    //
    // getShader
    //
    // loads a shader program by scouring the current document,
    // looking for a script with the specified ID.
    //
    static getShader(gl, id) 
    {
        var shaderScript = document.getElementById(id);

        // Didn't find an element with the specified ID; abort.
        if (!shaderScript) {
            return null;
        }

        // Walk through the source element's children, building the shader source string
        var theSource = "";
        var currentChild = shaderScript.firstChild;

        while(currentChild) {
            if (currentChild.nodeType == 3) {
                theSource += currentChild.textContent;
            }

            currentChild = currentChild.nextSibling;
        }

        // Now figure out what type of shader script we have, based on its MIME type.
        var shader;

        if (shaderScript.type == "x-shader/x-fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (shaderScript.type == "x-shader/x-vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
            return null;  // Unknown shader type
        }

        gl.shaderSource(shader, theSource);

        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }


    static createShader(source, glType)
    {
        var shader = gl.createShader(glType);

        gl.shaderSource(shader, source);

        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }
    
}