"use strict";
class PullCube {

    static get RT_TEX_SIZE()
    {
        return 512;
    }

    static get CUBE_SIZE()
    {
        return 16;
    }

    static get SCULPT_LAYERS()
    {
        return 4;
    }

    constructor(readyCallback)
    {
        
        this._cubeBatch = null; // batch of cubed voxels
 
        this._voxelMaterials = [];    // materials to render the voxels with
        this._voxelMaterialIndex = 0; // index of material currently used

        this._screenQuadMesh; // mesh to apply full-screen effects and blitting

        this._rtCopyBuffer = null;   // framebuffer for copying framebuffer contents
        this._rtPosBuffer = null;
        this._rtVelBuffer = null;

        this._desiredPosBuffer = null;

        this._screenBuffer = null;

        this._copyMaterial;      // material to copy texture
        this._posMaterial;
        this._velMaterial;

        this._composeMaterial = null;   // applies any post processing effects

        this._pMatrix = [];
        this._vMatrix = [];
        this._mMatrix = [];

        this._cameraRotation =  [];
        this._cameraPosition = [];

        this._modelRotation = [];
        this._modelPosition = [];
        this._modelScale = [];

        this._cameraForward = [];
        this._cameraUp = [];
        this._cameraRight = [];

        this._faceMaterial = null;
        this._grabMaterial = null;
        this._faceUVMaterial = null;

        this._faceColorBuffer = null;
        this._grabBuffer = null;
        this._faceUVBuffer = null;

        this._faceLoaded = false;
        this._faceColorSize = 4096;
        var snoopLayout = [ [0, 3], [12, 2], [20, 1] ];
        var self = this;
        loadVBOFromURL("./snoop.vbo", 24, snoopLayout, function(mesh) {
            self._faceMesh = mesh;
            self._faceLoaded = true;
            //init();

            readyCallback();
        });
    }




    getFloat32Format()
    {
        var texelData = gl.FLOAT;
        var internalFormat = gl.RGBA;
    
        // need either floating point, or half floating point precision for holding position and velocity data
        if( _supportsWebGL2 )
        {
            var ext = gl.getExtension("EXT_color_buffer_float");
            if( ext == null )
            {
                alert("Device & browser needs to support floating point or half floating point textures in order to work properly");
            }
            else
            {
                internalFormat = gl.RGBA32F;
            }
        }
        else
        {
        
            var ext = gl.getExtension("OES_texture_float");
            if( ext == null )
            {
                ext = gl.getExtension("OES_texture_half_float");
                if( ext != null )
                {
                    texelData = ext.HALF_FLOAT_OES;
                }
                else
                {
                    alert("Device & browser needs to support floating point or half floating point textures in order to work properly");
                }
            }

            var ext1 = gl.getExtension("OES_element_index_uint")
        }

        return {"texelData" : texelData, "internalFormat": internalFormat};
    }


    initTransforms()
    {
        mat4.perspective(this._pMatrix, 45, canvas.width/canvas.height, 0.01, 50.0);
        
        this._cameraRotation = quat.create();
        this._cameraPosition = vec3.fromValues(0, 0, -1 );
        this._cameraUp = vec3.fromValues(0.0, 1.0, 0.0 );

        this._modelRotation = quat.fromValues(0.0, 0.0, 0.0, 1.0);
        this._modelPosition = vec3.fromValues(0.0, -0.1, 0.0);
        this._modelScale = vec3.fromValues(1.0, 1.0, 1.0);
        
        
        mat4.fromRotationTranslation( this._vMatrix, this._cameraRotation, this._cameraPosition );
        mat4.fromRotationTranslation( this._mMatrix, this._modelRotation, this._modelPosition );
    
    }

    //
    // initParticleData
    //
    // initializes framebuffers, render textures, and materials
    //
    initParticleData() 
    {
        var formats = this.getFloat32Format();

        var texelData = formats["texelData"];
        var internalFormat = formats["internalFormat"];
    
        // setup framebuffer to render voxel colors & visibility into texture : rgb = xyz, a = visibility
        this._rtPosBuffer = new Framebuffer(
            [new Texture(PullCube.RT_TEX_SIZE, PullCube.RT_TEX_SIZE, internalFormat, gl.RGBA, texelData )], null,
            PullCube.RT_TEX_SIZE, PullCube.RT_TEX_SIZE
        );

        this._rtVelBuffer = new Framebuffer(
            [new Texture(PullCube.RT_TEX_SIZE, PullCube.RT_TEX_SIZE, internalFormat, gl.RGBA, texelData )], null,
            PullCube.RT_TEX_SIZE, PullCube.RT_TEX_SIZE
        );

        this._desiredPosBuffer = new Framebuffer(
            [new Texture(PullCube.RT_TEX_SIZE, PullCube.RT_TEX_SIZE, internalFormat, gl.RGBA, texelData )], null,
            PullCube.RT_TEX_SIZE, PullCube.RT_TEX_SIZE
        );

        // setup framebuffer as intermediate - to copy content
        this._rtCopyBuffer = new Framebuffer(
            [new Texture(PullCube.RT_TEX_SIZE, PullCube.RT_TEX_SIZE, internalFormat, gl.RGBA, texelData )], null,
            PullCube.RT_TEX_SIZE, PullCube.RT_TEX_SIZE
        );

        this._faceColorBuffer = new Framebuffer(
            [new Texture(this._faceColorSize, this._faceColorSize, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE )], null,
            this._faceColorSize, this._faceColorSize
        );

        this._grabBuffer = new Framebuffer(
            [new Texture(PullCube.RT_TEX_SIZE, PullCube.RT_TEX_SIZE, internalFormat, gl.RGBA, texelData )], null,
            PullCube.RT_TEX_SIZE, PullCube.RT_TEX_SIZE
        );
        

        this.setupScreenBuffer();

        this._screenQuadMesh = new Mesh(quadVertices, quadVertexIndices);
    
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        
        
        // setup data materials
        var quadVS = Material.getShader(gl, "screenquad-vs");
        var copyFS = Material.getShader(gl, "copy-fs");     
        var posFS = Material.getShader(gl, "position-fs");  
        var velFS = Material.getShader(gl, "velocity-fs" );
        var composeFS = Material.getShader(gl, "compose-fs");

        var posFS = Material.getShader(gl, "pos-fs");
        var velVS = Material.getShader(gl, "vel-vs");
        var grabVS = Material.getShader(gl, "grab-vs");

        var vColorFS = Material.getShader(gl, "vColor-fs");
        

        this._velMaterial = new Material(velVS, vColorFS);
        this._velMaterial.setTexture("uPosTex", this._rtPosBuffer.color().native());
        this._velMaterial.setTexture("uVelTex", this._rtVelBuffer.color().native());
        this._velMaterial.setTexture("uGrabTex", this._grabBuffer.color().native());
        this._velMaterial.addVertexAttribute("aPos");
        this._velMaterial.addVertexAttribute("aVertexID");
        this._velMaterial.setFloat("uRadius", 0.25 );
        this._velMaterial.setFloat("uAspect", canvas.height / canvas.width);   
        this._velMaterial.setFloat("uImageSize", PullCube.RT_TEX_SIZE);

        this._posMaterial = new Material(quadVS, posFS);
        this._posMaterial.setTexture("uPosTex", this._rtPosBuffer.color().native());
        this._posMaterial.setTexture("uVelTex", this._rtVelBuffer.color().native());
        this._posMaterial.addVertexAttribute("aPos");
        this._posMaterial.setFloat("uImageSize", PullCube.RT_TEX_SIZE);

        this._grabMaterial = new Material(grabVS, vColorFS);
        this._grabMaterial.setTexture("uPosTex", this._rtPosBuffer.color().native());
        this._grabMaterial.setTexture("uScreenPosTex", this._screenBuffer.color(1).native());
        this._grabMaterial.addVertexAttribute("aVertexID");
        this._grabMaterial.setFloat("uRadius", 0.25 );
        this._grabMaterial.setFloat("uAspect", canvas.height / canvas.width);   
        this._grabMaterial.setFloat("uImageSize", PullCube.RT_TEX_SIZE);
        
        // material to copy 1 texture into another
        this._copyMaterial = new Material(quadVS, copyFS);   
        this._copyMaterial.setTexture("uCopyTex", this._rtCopyBuffer.color().native() );
        this._copyMaterial.addVertexAttribute("aPos");

        this._composeMaterial = new Material(quadVS, composeFS);
        this._composeMaterial.setTexture("uScrTex", this._screenBuffer.color().native());
        this._composeMaterial.setTexture("uPosTex", this._rtPosBuffer.color().native());
        this._composeMaterial.setTexture("uVelTex", this._rtVelBuffer.color().native());
        this._composeMaterial.addVertexAttribute("aPos");
        this._composeMaterial.setFloat("uAspect", canvas.height / canvas.width);
        
        // initialize data into vox texture
        var initPosVS = Material.getShader(gl, "initPos-vs");
        var initDataMaterial = new Material( initPosVS, vColorFS );
        initDataMaterial.addVertexAttribute("aPos");
        initDataMaterial.addVertexAttribute("aVertexID");
        initDataMaterial.setMatrix("uPMatrix", new Float32Array( this._pMatrix ) );
        initDataMaterial.setMatrix("uVMatrix", new Float32Array( this._vMatrix ) );
        initDataMaterial.setMatrix("uMMatrix", new Float32Array(this._mMatrix));
        initDataMaterial.setFloat("uImageSize", PullCube.RT_TEX_SIZE);
        
        gl.viewport(0, 0, PullCube.RT_TEX_SIZE, PullCube.RT_TEX_SIZE);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        
        this.renderDataBuffer( this._rtPosBuffer.fbo(), initDataMaterial, this._faceMesh, gl.POINTS );
        
        gl.bindFramebuffer( gl.FRAMEBUFFER, null ); 
        gl.viewport(0, 0, canvas.width, canvas.height);

        loadImageFromUrl("./snoop.jpg");
    }

    //
    // initMaterials
    //
    // Initializes materials for cubes
    //
    initMaterials() 
    {
        this._voxelMaterials.length = 2;
        
        var faceVS = Material.getShader(gl, "face-vs");
        var faceFS = Material.getShader(gl, "face-fs");

        this._faceMaterial = new Material(faceVS, faceFS);
        //this._faceMaterial.addVertexAttribute("aPos");
        this._faceMaterial.addVertexAttribute("aTexcoord");
        this._faceMaterial.addVertexAttribute("aVertexID");
        this._faceMaterial.setTexture("uColorTex", this._faceColorBuffer.color().native());
        this._faceMaterial.setTexture("uPosTex", this._rtPosBuffer.color().native());
        this._faceMaterial.setTexture("uVelTex", this._rtVelBuffer.color().native());
        this._faceMaterial.setVec2("uTexelSize", [1.0 / this._faceColorBuffer._width, 1.0 / this._faceColorBuffer._height ])
        this._faceMaterial.setFloat("uImageSize", PullCube.RT_TEX_SIZE);
        
        var basicVS = Material.getShader(gl, "basic-vs" );  
        var voxelFS = Material.getShader(gl, "cornercolor-fs" );
        var wireframeFS = Material.getShader(gl, "cubeframe-fs");


        this._velMaterial.setMatrix("uPMatrix", new Float32Array( this._pMatrix ) );
        this._velMaterial.setMatrix("uVMatrix", new Float32Array( this._vMatrix ) );
        this._velMaterial.setMatrix("uMMatrix", new Float32Array(this._mMatrix));

        this._grabMaterial.setMatrix("uPMatrix", new Float32Array( this._pMatrix ) );
        this._grabMaterial.setMatrix("uVMatrix", new Float32Array( this._vMatrix ) );
        this._grabMaterial.setMatrix("uMMatrix", new Float32Array(this._mMatrix));

        this._faceMaterial.setMatrix("uPMatrix", new Float32Array( this._pMatrix ) );
        this._faceMaterial.setMatrix("uVMatrix", new Float32Array( this._vMatrix ) );
        this._faceMaterial.setMatrix("uMMatrix", new Float32Array(this._mMatrix));
    }

    
    setupScreenBuffer()
    {
        var texelData = gl.UNSIGNED_BYTE;
        var depthInternal = _supportsWebGL2 ? gl.DEPTH_COMPONENT24 : gl.DEPTH_COMPONENT;

        var formats = this.getFloat32Format();

        var fTexelData = formats["texelData"];
        var fInternalFormat = formats["internalFormat"];

        var colorTex = [new Texture( canvas.width, canvas.height, gl.RGBA, gl.RGBA, texelData ), new Texture(canvas.width, canvas.height, fInternalFormat, gl.RGBA, fTexelData)];
        var depthTex = new Texture(canvas.width, canvas.height, depthInternal, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT);
        
        if( this._screenBuffer )
        {
            this._screenBuffer.setup( colorTex, depthTex, canvas.width, canvas.height );
        }
        else
        {
            this._screenBuffer = new Framebuffer( colorTex, depthTex, canvas.width, canvas.height );
        }

        if( this._composeMaterial )
        {
            this._composeMaterial.setTexture("uScrTex", this._screenBuffer.color().native());
            this._composeMaterial.setFloat("uAspect", canvas.height / canvas.width);
        }

        if( this._velMaterial)
        {
            this._velMaterial.setVec2("uCanvasSize", new Float32Array([canvas.width, canvas.height]));
            this._velMaterial.setFloat("uAspect", canvas.height / canvas.width);   
        }

    }


    blit( texture, renderBuffer, viewWidth, viewHeight )
    {
        gl.viewport(0, 0, viewWidth, viewHeight);

        this._copyMaterial.setTexture("uCopyTex", texture );
        gl.bindFramebuffer( gl.FRAMEBUFFER, renderBuffer );
        gl.clear( gl.COLOR_BUFFER_BIT );
    
        this._copyMaterial.apply();

        this._screenQuadMesh.render();

        this._copyMaterial.unapply();
        
        this._copyMaterial.setTexture("uCopyTex", this._rtCopyBuffer.color().native() );
        
        Framebuffer.bindDefault();
    }

    handleTextureLoaded(image, texture) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
    
        this.blit(texture, this._faceColorBuffer.fbo(), this._faceColorSize, this._faceColorSize );
    }



    //
    // renderDataBuffer
    //
    // takes a framebuffer and material
    // renders a quad with the dataMaterial into the dataBuffer
    // using a buffer inbetween so it can use it's previous frame texture as data
    //
    renderDataBuffer( dataBuffer, dataMaterial, mesh, primitive = gl.TRIANGLES )
    {    
        // render data into copy texture
        gl.bindFramebuffer( gl.FRAMEBUFFER, this._rtCopyBuffer.fbo() );
        gl.clear( gl.COLOR_BUFFER_BIT );
        
        dataMaterial.apply();     
        mesh.render(primitive);
        dataMaterial.unapply();
        
        
        // render copy texture into data texture
        gl.bindFramebuffer( gl.FRAMEBUFFER, dataBuffer );
        gl.clear( gl.COLOR_BUFFER_BIT );
    
        this._copyMaterial.apply(); 
        this._screenQuadMesh.render(); 
        this._copyMaterial.unapply();
    }

    //
    // renderParticleData
    //
    // Renders updates into the voxel data texture
    //
    renderParticleData(deltaTime) 
    {
        gl.viewport(0, 0, PullCube.RT_TEX_SIZE, PullCube.RT_TEX_SIZE);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        
        this._posMaterial.setFloat("uDeltaTime", deltaTime );
        this._velMaterial.setFloat("uDeltaTime", deltaTime );

        this.renderDataBuffer( this._rtVelBuffer.fbo(), this._velMaterial, this._faceMesh, gl.POINTS );
        this.renderDataBuffer( this._rtPosBuffer.fbo(), this._posMaterial, this._screenQuadMesh );
        
        Framebuffer.bindDefault();
    }

    init()
    {
        this.initTransforms();  
        this.initParticleData();      
        this.initMaterials();
    }

    update()
    {
        mat4.fromRotationTranslation( this._vMatrix, this._cameraRotation, this._cameraPosition);
        mat4.fromRotationTranslationScale( this._mMatrix, this._modelRotation, this._modelPosition, this._modelScale );

        this._faceMaterial.setMatrix("uMMatrix", this._mMatrix);
        this._faceMaterial.setMatrix("uVMatrix", this._vMatrix);

        // this._voxelMaterials[this._voxelMaterialIndex].setMatrix("uMMatrix", this._mMatrix );  
        // this._voxelMaterials[this._voxelMaterialIndex].setMatrix("uVMatrix", this._vMatrix );
    
        this._velMaterial.setMatrix("uMMatrix", this._mMatrix);
        this._velMaterial.setMatrix("uVMatrix", this._vMatrix);

        this._grabMaterial.setMatrix("uMMatrix", this._mMatrix);
        this._grabMaterial.setMatrix("uVMatrix", this._vMatrix);

        var invVP = [];
        //mat4.multiply(invVP, this._vMatrix, this._mMatrix);
        mat4.multiply(invVP, this._pMatrix, this._vMatrix); // , invVP);
        mat4.invert(invVP, invVP);

        this._velMaterial.setMatrix("uInvMVPMatrix", invVP);
        this._grabMaterial.setMatrix("uInvMVPMatrix", invVP);
    }

    postUpdate()
    {
        //this._toolDataMaterial.setVec3("uLastDir", [sculptRay[0], sculptRay[1], sculptRay[2]]);
        this._velMaterial.setVec3("uLastPos", [mouseCoord[0] * 0.5 + 0.5, mouseCoord[1] * 0.5 + 0.5, mouseCoord[2]]);
    }

    
    debugPosBuffer()
    {   
        gl.bindFramebuffer( gl.FRAMEBUFFER, null );
        gl.viewport(0, 0, 512, 512);
        //gl.clear( gl.COLOR_BUFFER_BIT );
    
        this._copyMaterial.setTexture("uCopyTex", this._rtPosBuffer.color().native() );
        this._copyMaterial.apply();   
        this._screenQuadMesh.render();
        this._copyMaterial.unapply();
        
        this._copyMaterial.setTexture("uCopyTex", this._rtCopyBuffer.color().native() );
        //this.blit( this._rtPosBuffer.color().native(), null, 512, 512);
    }

    render()
    {   
        this.renderParticleData( Time.deltaTime );


        this._screenBuffer.bind();
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);

        gl.clearColor( 0.5, 0.5, 0.5, 0.0 );
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        if(this._faceLoaded )
        {
            this._faceMaterial.apply();
            this._faceMesh.render();
            this._faceMaterial.unapply();
        }

        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
    
        Framebuffer.bindDefault();
        gl.clear( gl.COLOR_BUFFER_BIT );
    
        this._composeMaterial.apply();
        this._screenQuadMesh.render();
        this._composeMaterial.unapply();

        //this.debugPosBuffer();
    }

    handleResize()
    {
        mat4.perspective(this._pMatrix, 45, canvas.width/canvas.height, 0.01, 50.0);

        this._faceMaterial.setMatrix("uPMatrix", this._pMatrix);
    
        // for( var i=0; i < this._voxelMaterials.length; i++ )
        // {
        //     this._voxelMaterials[i].setMatrix("uPMatrix", this._pMatrix );
        // }

        this._velMaterial.setMatrix("uPMatrix", this._pMatrix);
        this._grabMaterial.setMatrix("uPMatrix", this._pMatrix);
        
        // Set the viewport to match
        gl.viewport(0, 0, canvas.width,canvas.height);

        this.setupScreenBuffer();
    }

    handleZoom(delta)
    {
        var currentZ = this._cameraPosition[2];

        currentZ += delta * 0.1;

        if( currentZ < -3 )
        {
            currentZ = -3;
        }
        else if ( currentZ > -0.5 )
        {
            currentZ = -0.5;
        }

        this._cameraPosition[2] = currentZ;
    }

    handleRotate(dX, dY )
    {
        var verticalRot = quat.create();
        quat.rotateX(verticalRot, verticalRot, dY * 30.0 );
        
        var horizontalRot = quat.create();
        quat.rotateY(horizontalRot, horizontalRot, dX * 5.0 );

        var horizontalRotCamera = quat.create();
        quat.rotateY(horizontalRotCamera, horizontalRotCamera, dX * 25.0);
        
        quat.multiply( this._modelRotation, horizontalRot, this._modelRotation );
        //quat.multiply( this._modelRotation, verticalRot, this._modelRotation );

        //quat.multiply( this._cameraRotation, horizontalRotCamera, this._cameraRotation );
        //quat.multiply( this._cameraRotation, verticalRot, this._cameraRotation );
        
        // vec3.transformQuat(this._cameraForward, vec3.fromValues(0.0, 0.0, -1.0 ), this._modelRotation );
        // vec3.normalize(this._cameraForward, this._cameraForward );
        // vec3.cross( this._cameraRight, this._cameraForward, this._cameraUp );
        // vec3.normalize(this._cameraRight, this._cameraRight );
        // vec3.cross( this._cameraUp, this._cameraRight, this._cameraForward );
        // vec3.normalize(this._cameraUp, this._cameraUp );
    }

    startToolUse()
    {
        gl.viewport(0, 0, PullCube.RT_TEX_SIZE, PullCube.RT_TEX_SIZE);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        
        this.renderDataBuffer( this._grabBuffer.fbo(), this._grabMaterial, this._faceMesh, gl.POINTS );
        
        Framebuffer.bindDefault();
    }

    endToolUse()
    {
        gl.viewport(0, 0, PullCube.RT_TEX_SIZE, PullCube.RT_TEX_SIZE);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);

        gl.bindFramebuffer( gl.FRAMEBUFFER, this._grabBuffer.fbo() );
        gl.clear( gl.COLOR_BUFFER_BIT );

        Framebuffer.bindDefault();
    }

    handleToolUse(nX, nY)
    {      
        this._velMaterial.setVec3("uMousePos", [ nX * 0.5 + 0.5, nY * 0.5 + 0.5, -1.0]);   
        this._grabMaterial.setVec3("uMousePos", [ nX * 0.5 + 0.5, nY * 0.5 + 0.5, -1.0]);          
    }

    handleMouseMove(nX, nY)
    {
        this._velMaterial.setVec3("uMousePos", [ nX * 0.5 + 0.5, nY * 0.5 + 0.5, -1.0]);
        this._grabMaterial.setVec3("uMousePos", [ nX * 0.5 + 0.5, nY * 0.5 + 0.5, -1.0]);
    }


    changeBrushSize(brushSize) {
        this._velMaterial.setFloat("uRadius", brushSize);
    }


    setVoxelMaterialIndex(materialIndex) {
        // this._voxelMaterialIndex = materialIndex;
    }

    getVoxTextureCPU() {
        this._rtPosBuffer.bind();
        var pixels = new Uint8Array(PullCube.RT_TEX_SIZE*PullCube.RT_TEX_SIZE*4);

        gl.readPixels(0, 0, PullCube.RT_TEX_SIZE, PullCube.RT_TEX_SIZE, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

        Framebuffer.bindDefault();

        return pixels;
    }


}

var quadVertices = [
  -1.0, -1.0,  -1.0,
    1.0, -1.0,  -1.0,
    1.0,  1.0,  -1.0,
  -1.0,  1.0,  -1.0,
];

var quadVertexIndices = [
    0,  1,  2,      
    0,  2,  3
];


var floorVertices = [
    -128.0, -64.0, -128.0,
    -128.0, -64.0, 128.0,
    128.0, -64.0, 128.0,
    128.0, -64.0, -128.0
];

var floorIndices = quadVertexIndices;

