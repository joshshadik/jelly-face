"use strict";
class JellyFace {

    static RT_TEX_SIZE()
    {
        return 512;
    }


    constructor()
    {
        
        this._cubeBatch = null; // batch of cubed voxels
 
        this._voxelMaterials = [];    // materials to render the voxels with
        this._voxelMaterialIndex = 0; // index of material currently used

        this._screenQuadMesh = null; // mesh to apply full-screen effects and blitting
        this._floorMesh = null;

        this._copyFbo = null;   // framebuffer for copying framebuffer contents
        this._posFbo = null;
        this._velFbo = null;

        this._screenFbo = null;
        this._screenColorFbo  = null;

        this._copyMaterial;      // material to copy texture
        this._posMaterial;
        this._velMaterial;

        this._floorMaterials = [];

        this._floorColorMaterial = null;

        this._composeMaterial = null;   // applies any post processing effects

        this._pMatrix = [];
        this._vMatrix = [];
        this._mMatrix = [];

        this._cameraRotation =  [];
        this._cameraPosition = [];

        this._modelRotation = [];
        this._modelPosition = [];
        this._modelScale = [];

        this._faceMaterials = [];
        this._grabMaterial = null;

        this._faceColorBuffer = null;
        this._grabBuffer = null;

        this._faceLoaded = false;
        this._faceColorSize = 4096;
        
        this._shadowFboSize = 2048;
        this._shadowScreenScale = 0.5;

        this._shadowFbo = null;
        this._shadowScreenFbo = null;

        this._shadowScreenMaterial = null;

        this._lightPosition = [];
        this._lightRotation = [];

        this._lightPerspective = [];
        this._lightView = [];
        this._lightVP = [];
        this._lightMVP = [];

        this._shadowsEnabled = true;

        this.vColorFS = null;
    }


    loadFace(path, readyCallback)
    {
        this._faceLoaded = false;
        var bufLayout = [ [0, 3], [12, 2], [20, 1] ];
        var self = this;
        var meshPath = path + ".vbo";
        var imgPath = path + ".jpg";
        self.init();

        loadVBOFromURL(meshPath, 24, bufLayout, function(mesh) {
            self._faceMesh = mesh;

            // initialize data into vox texture
            var initPosVS = Material.createShader(shaders.vs.initPos, gl.VERTEX_SHADER);
            var initDataMaterial = new Material( initPosVS, self.vColorFS );
            initDataMaterial.addVertexAttribute("aPos");
            initDataMaterial.addVertexAttribute("aVertexID");
            initDataMaterial.setMatrix("uPMatrix", self._pMatrix );
            initDataMaterial.setMatrix("uVMatrix", self._vMatrix );
            initDataMaterial.setMatrix("uMMatrix", self._mMatrix );
            initDataMaterial.setFloat("uImageSize", JellyFace.RT_TEX_SIZE());
            
            gl.viewport(0, 0, JellyFace.RT_TEX_SIZE(), JellyFace.RT_TEX_SIZE());
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            
            self.renderDataBuffer( self._posFbo.fbo(), initDataMaterial, self._faceMesh, gl.POINTS );
            
            gl.bindFramebuffer( gl.FRAMEBUFFER, null ); 
            gl.viewport(0, 0, canvas.width, canvas.height);

            loadImageFromUrl(imgPath, function() {           
                readyCallback();
            });


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
            if( ext != null )
            {
                internalFormat = gl.RGBA32F;
            }
            else
            {            
                alert("This experiment requires the WebGL 2.0 extension EXT_color_buffer_float. Maybe try another web browser.");                
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
                    alert("This experiment requires the WebGL extension OES_texture_float or OES_texture_half_float. Maybe try another web browser.");
                }
            }

            var ext1 = gl.getExtension("OES_element_index_uint")

            if( ext1 == null )
            {
                alert("This experiment requires WebGL 2.0 or the WebGL 1.0 extension OES_element_index_uint. Maybe try another web browser.");
            }
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
    
        this._lightPosition = vec3.fromValues( 0.0, 0.0, -3.0 );
        this._lightRotation = quat.create();
        
        quat.rotateX(this._lightRotation, this._lightRotation, 0.678);
        quat.rotateY(this._lightRotation, this._lightRotation, -0.3);
        quat.rotateX(this._lightRotation, this._lightRotation, -0.3);
        quat.rotateZ(this._lightRotation, this._lightRotation, -0.1);
        
        mat4.fromRotationTranslation( this._lightView, this._lightRotation, this._lightPosition ); 

        var orthoSize = 0.9;
        mat4.ortho( this._lightPerspective, -orthoSize, orthoSize, -orthoSize, orthoSize, 1.0, 5.0 );
        //mat4.perspective(this._lightPerspective, 0.62, 1.0, 0.1, 5.0);

        mat4.multiply(this._lightVP, this._lightPerspective, this._lightView);
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
    
        this._posFbo = new Framebuffer(
            [new Texture(JellyFace.RT_TEX_SIZE(), JellyFace.RT_TEX_SIZE(), internalFormat, gl.RGBA, texelData)], null,
            JellyFace.RT_TEX_SIZE(), JellyFace.RT_TEX_SIZE()
        );

        this._velFbo = new Framebuffer(
            [new Texture(JellyFace.RT_TEX_SIZE(), JellyFace.RT_TEX_SIZE(), internalFormat, gl.RGBA, texelData)], null,
            JellyFace.RT_TEX_SIZE(), JellyFace.RT_TEX_SIZE()
        );

        this._copyFbo = new Framebuffer(
            [new Texture(JellyFace.RT_TEX_SIZE(), JellyFace.RT_TEX_SIZE(), internalFormat, gl.RGBA, texelData )], null,
            JellyFace.RT_TEX_SIZE(), JellyFace.RT_TEX_SIZE()
        );

        this._grabBuffer = new Framebuffer(
            [new Texture(JellyFace.RT_TEX_SIZE(), JellyFace.RT_TEX_SIZE(), internalFormat, gl.RGBA, texelData )], null,
            JellyFace.RT_TEX_SIZE(), JellyFace.RT_TEX_SIZE()
        );

        var depthInternal = _supportsWebGL2 ? gl.DEPTH_COMPONENT24 : gl.DEPTH_COMPONENT;

        this._shadowFbo = new Framebuffer(
            [new Texture(this._shadowFboSize, this._shadowFboSize, internalFormat, gl.RGBA, texelData)],
            new Texture(this._shadowFboSize, this._shadowFboSize, depthInternal, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT),
            this._shadowFboSize,
            this._shadowFboSize
        );

        this._faceColorBuffer = new Framebuffer(
            [new Texture(this._faceColorSize, this._faceColorSize, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE )], null,
            this._faceColorSize, this._faceColorSize
        );
        

        this.setupScreenBuffer();

        this._screenQuadMesh = new Mesh(quadVertices, quadVertexIndices);
        this._floorMesh = new Mesh(floorVertices, floorIndices);
    
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        
        

        // setup data materials
        var quadVS = Material.createShader(shaders.vs.quad, gl.VERTEX_SHADER);

        var copyFS = Material.createShader(shaders.fs.copy, gl.FRAGMENT_SHADER);     
        var posFS = Material.createShader(shaders.fs.pos, gl.FRAGMENT_SHADER);  
        var composeFS = Material.createShader(shaders.fs.compose, gl.FRAGMENT_SHADER);

        var shadowScreenFS = Material.createShader(shaders.fs.shadowBuffer, gl.FRAGMENT_SHADER);
        
        var velVS = Material.createShader(shaders.vs.vel, gl.VERTEX_SHADER);
        var grabVS = Material.createShader(shaders.vs.grab, gl.VERTEX_SHADER);

        this.vColorFS = Material.createShader(shaders.fs.vColor, gl.FRAGMENT_SHADER);      

        var floorVS = Material.createShader(shaders.vs.floor, gl.VERTEX_SHADER);
        var floorFS = Material.createShader(shaders.fs.floor, gl.FRAGMENT_SHADER);
        

        this._velMaterial = new Material(velVS, this.vColorFS);
        this._velMaterial.setTexture("uPosTex", this._posFbo.color().native());
        this._velMaterial.setTexture("uVelTex", this._velFbo.color().native());
        this._velMaterial.setTexture("uGrabTex", this._grabBuffer.color().native());
        this._velMaterial.addVertexAttribute("aPos");
        this._velMaterial.addVertexAttribute("aVertexID");

        this._velMaterial.setFloat("uRadius", 0.25 );
        this._velMaterial.setFloat("uAspect", canvas.height / canvas.width);   
        this._velMaterial.setFloat("uImageSize", JellyFace.RT_TEX_SIZE());

        this._posMaterial = new Material(quadVS, posFS);
        this._posMaterial.setTexture("uPosTex", this._posFbo.color().native());
        this._posMaterial.setTexture("uVelTex", this._velFbo.color().native());
        this._posMaterial.addVertexAttribute("aPos");
        this._posMaterial.setFloat("uImageSize", JellyFace.RT_TEX_SIZE());

        this._grabMaterial = new Material(grabVS, this.vColorFS);
        this._grabMaterial.setTexture("uPosTex", this._posFbo.color().native());
        this._grabMaterial.addVertexAttribute("aVertexID");

        this._grabMaterial.setFloat("uRadius", 0.25 );
        this._grabMaterial.setFloat("uAspect", canvas.height / canvas.width);   
        this._grabMaterial.setFloat("uImageSize", JellyFace.RT_TEX_SIZE());
        
        // material to copy 1 texture into another
        this._copyMaterial = new Material(quadVS, copyFS);   
        this._copyMaterial.setTexture("uCopyTex", this._copyFbo.color().native() );
        this._copyMaterial.addVertexAttribute("aPos");

        this._composeMaterial = new Material(quadVS, composeFS);
        this._composeMaterial.setTexture("uShadowTex", this._shadowScreenFbo.color().native());
        this._composeMaterial.addVertexAttribute("aPos");
        this._composeMaterial.setFloat("uAspect", canvas.height / canvas.width);

        this._shadowScreenMaterial = new Material(quadVS, shadowScreenFS);
        this._shadowScreenMaterial.setTexture("uShadowTex", this._shadowFbo.color().native());
        this._shadowScreenMaterial.addVertexAttribute("aPos");
        this._shadowScreenMaterial.setFloat("uAspect", canvas.height / canvas.width);

        

        this._floorMaterials = [new Material(floorVS, floorFS)];

        for( var i = 0; i < this._floorMaterials.length; ++i )
        {
            this._floorMaterials[i].addVertexAttribute("aPos");
            this._floorMaterials[i].setMatrix("uPMatrix", this._pMatrix );
            this._floorMaterials[i].setMatrix("uVMatrix", this._vMatrix );
            this._floorMaterials[i].setMatrix("uMMatrix", this._mMatrix );
        }
        

    }

    //
    // initMaterials
    //
    // Initializes materials for cubes
    //
    initMaterials() 
    {
        this._voxelMaterials.length = 2;
        
        var faceVS = Material.createShader(shaders.vs.face, gl.VERTEX_SHADER);
        var faceFS = Material.createShader(shaders.fs.face, gl.FRAGMENT_SHADER);

        this._faceMaterials.push(new Material(faceVS, faceFS));

        if( !_supportsWebGL2 )
        {
            var faceColFS = Material.createShader(shaders.fs.faceCol, gl.FRAGMENT_SHADER);
            this._faceMaterials.push(new Material(faceVS, faceColFS));
        }

        for( var i = 0; i < this._faceMaterials.length; ++i )
        {
            this._faceMaterials[i].addVertexAttribute("aTexcoord");
            this._faceMaterials[i].addVertexAttribute("aVertexID");
            if(!_supportsWebGL2)
            {
                this._faceMaterials[i].addVertexAttribute("aPos");
            }
            this._faceMaterials[i].setTexture("uColorTex", this._faceColorBuffer.color().native());
            this._faceMaterials[i].setTexture("uPosTex", this._posFbo.color().native());
            this._faceMaterials[i].setTexture("uVelTex", this._velFbo.color().native());
            this._faceMaterials[i].setVec2("uTexelSize", [1.0 / this._faceColorBuffer._width, 1.0 / this._faceColorBuffer._height ])
            this._faceMaterials[i].setFloat("uImageSize", JellyFace.RT_TEX_SIZE());

            this._faceMaterials[i].setMatrix("uPMatrix", this._pMatrix );
            this._faceMaterials[i].setMatrix("uVMatrix", this._vMatrix );
            this._faceMaterials[i].setMatrix("uMMatrix", this._mMatrix );

        }
        
        this._velMaterial.setMatrix("uPMatrix", this._pMatrix );
        this._velMaterial.setMatrix("uVMatrix", this._vMatrix );
        this._velMaterial.setMatrix("uMMatrix", this._mMatrix );

        this._grabMaterial.setMatrix("uPMatrix", this._pMatrix );
        this._grabMaterial.setMatrix("uVMatrix", this._vMatrix );
        this._grabMaterial.setMatrix("uMMatrix", this._mMatrix );

        this._shadowScreenMaterial.setMatrix("uLightSpace", this._lightVP);

        this.updateScreenBufferMaterials();
    }

    
    setupScreenBuffer()
    {
        var texelData = gl.UNSIGNED_BYTE;
        var depthInternal = _supportsWebGL2 ? gl.DEPTH_COMPONENT24 : gl.DEPTH_COMPONENT;

        var formats = this.getFloat32Format();

        var fTexelData = formats["texelData"];
        var fInternalFormat = formats["internalFormat"];

        var width = canvas.width;
        var height = canvas.height;

        var colorTexs = [new Texture(width, height, fInternalFormat, gl.RGBA, fTexelData)];

        if( _supportsWebGL2 )
        {
            colorTexs.push(new Texture(width, height, gl.RGBA, gl.RGBA, texelData));
        }

        var depthTex = new Texture(width, height, depthInternal, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT);
        
        if( this._screenFbo )
        {
            this._screenFbo.setup( colorTexs, depthTex, width, height );
        }
        else
        {
            this._screenFbo = new Framebuffer( colorTexs, depthTex, width, height );
        }

        if(!_supportsWebGL2 )
        {
            var screenColorTex = [new Texture(width, height, gl.RGBA, gl.RGBA, texelData)];

            if( this._screenColorFbo )
            {
                this._screenColorFbo.setup( screenColorTex, depthTex, width, height );
            }
            else
            {
                this._screenColorFbo = new Framebuffer( screenColorTex, depthTex, width, height );
            }
        }

        var shadowWidth = width * this._shadowScreenScale;
        var shadowHeight = height * this._shadowScreenScale;
        var shadowTex = [new Texture(shadowWidth, shadowHeight, gl.RGBA, gl.RGBA, texelData, gl.LINEAR, gl.LINEAR)];
        var shadowDepth = new Texture(shadowWidth, shadowHeight, depthInternal, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT);
        if( this._shadowScreenFbo)
        {
            this._shadowScreenFbo.setup(shadowTex, shadowDepth, shadowWidth, shadowHeight);
        }
        else
        {
            this._shadowScreenFbo = new Framebuffer(shadowTex, shadowDepth, shadowWidth, shadowHeight);
        }

        this.updateScreenBufferMaterials();
    }

    updateScreenBufferMaterials()
    {
        var width = canvas.width;
        var height = canvas.height;

        if( this._composeMaterial )
        {
            if( _supportsWebGL2 )
            {
                this._composeMaterial.setTexture("uColTex", this._screenFbo.color(1).native());
            }
            else
            {
                this._composeMaterial.setTexture("uColTex", this._screenColorFbo.color(0).native());
            }
            
            this._composeMaterial.setTexture("uPosTex", this._screenFbo.color(0).native());
            this._composeMaterial.setFloat("uAspect", height / width);

            this._composeMaterial.setTexture("uShadowTex", this._shadowScreenFbo.color().native());
        }

        if( this._shadowScreenMaterial )
        {           
            if( _supportsWebGL2 )
            {
                this._shadowScreenMaterial.setTexture("uColTex", this._screenFbo.color(1).native());
            }
            else
            {
                this._shadowScreenMaterial.setTexture("uColTex", this._screenColorFbo.color(0).native());
            }

            this._shadowScreenMaterial.setTexture("uPosTex", this._screenFbo.color(0).native());
            this._shadowScreenMaterial.setFloat("uAspect", height / width);
        }

        if( this._velMaterial)
        {
            this._velMaterial.setVec2("uCanvasSize", new Float32Array([width, height]));
            this._velMaterial.setFloat("uAspect", height / width);   
        }

        if( this._grabMaterial )
        {
            this._grabMaterial.setTexture("uScreenPosTex", this._screenFbo.color(0).native());
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
        
        this._copyMaterial.setTexture("uCopyTex", this._copyFbo.color().native() );
        
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

        this._faceLoaded = true;
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
        gl.bindFramebuffer( gl.FRAMEBUFFER, this._copyFbo.fbo() );
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
        gl.viewport(0, 0, JellyFace.RT_TEX_SIZE(), JellyFace.RT_TEX_SIZE());
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        
        this._posMaterial.setFloat("uDeltaTime", deltaTime );
        this._velMaterial.setFloat("uDeltaTime", deltaTime );

        this.renderDataBuffer( this._velFbo.fbo(), this._velMaterial, this._faceMesh, gl.POINTS );
        this.renderDataBuffer( this._posFbo.fbo(), this._posMaterial, this._screenQuadMesh );
        
        Framebuffer.bindDefault();
    }

    renderShadows()
    {
        this._faceMaterials[0].setMatrix("uPMatrix", this._lightPerspective);
        this._faceMaterials[0].setMatrix("uVMatrix", this._lightView);

        this._shadowFbo.bind();
        gl.clearColor( 0.0, 0.0, 0.0, 0.0);
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

        this._faceMaterials[0].apply();
        this._faceMesh.render();
        this._faceMaterials[0].unapply();

        this._faceMaterials[0].setMatrix("uPMatrix", this._pMatrix);
        this._faceMaterials[0].setMatrix("uVMatrix", this._vMatrix);

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

        this._faceMaterials[0].setMatrix("uMMatrix", this._mMatrix);
        this._faceMaterials[0].setMatrix("uVMatrix", this._vMatrix);

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

    }

    
    debugPosBuffer()
    {   
        gl.bindFramebuffer( gl.FRAMEBUFFER, null );
        gl.viewport(0, 0, 512, 512);
        //gl.clear( gl.COLOR_BUFFER_BIT );
    
        this._copyMaterial.setTexture("uCopyTex", this._shadowFbo.color().native() );
        this._copyMaterial.apply();   
        this._screenQuadMesh.render();
        this._copyMaterial.unapply();
        
        this._copyMaterial.setTexture("uCopyTex", this._copyFbo.color().native() );
        //this.blit( this._posFbo.color().native(), null, 512, 512);
    }

    render()
    {   
        if(this._faceLoaded)
        {
            this.renderParticleData( Time.deltaTime() );
        }

        this._screenFbo.bind();
        if( _supportsWebGL2 )
        {
            gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
        }
        gl.clearColor( 0.5, 0.5, 0.5, 0.0 );
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if( this._faceLoaded )
        {
            this._faceMaterials[0].apply();
            this._faceMesh.render();
            this._faceMaterials[0].unapply();

    
            if( _supportsWebGL2 )
            {
                gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
            }
    
            this._floorMaterials[0].apply();
            this._floorMesh.render();
            this._floorMaterials[0].unapply();

            if(!_supportsWebGL2 )
            {
                this._screenColorFbo.bind();
        
                gl.clearColor( 0.5, 0.5, 0.5, 0.0 );
                gl.clear(gl.COLOR_BUFFER_BIT);
            

                this._faceMaterials[1].apply();
                this._faceMesh.render();
                this._faceMaterials[1].unapply();
            }


    
        }


        if( this._shadowsEnabled )
        {
            if( this._faceLoaded )
            {
                this.renderShadows();
            }

            this._shadowScreenFbo.bind();
            gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
            gl.clear( gl.COLOR_BUFFER_BIT );
            this._shadowScreenMaterial.apply();
            this._screenQuadMesh.render();
            this._shadowScreenMaterial.unapply();
        }

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

        for( var i = 0; i < this._faceMaterials.length; ++i )
        {
            this._faceMaterials[i].setMatrix("uPMatrix", this._pMatrix);
        }
        
    
        // for( var i=0; i < this._voxelMaterials.length; i++ )
        // {
        //     this._voxelMaterials[i].setMatrix("uPMatrix", this._pMatrix );
        // }

        this._velMaterial.setMatrix("uPMatrix", this._pMatrix);
        this._grabMaterial.setMatrix("uPMatrix", this._pMatrix);

        for( var i = 0; i < this._floorMaterials.length; ++i )
        {
            this._floorMaterials[i].setMatrix("uPMatrix", this._pMatrix);
        }
        
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

        // var horizontalRotCamera = quat.create();
        // quat.rotateY(horizontalRotCamera, horizontalRotCamera, dX * 25.0);
        
        quat.multiply( this._modelRotation, horizontalRot, this._modelRotation );
        //quat.multiply( this._cameraRotation, horizontalRotCamera, this._cameraRotation );
    }

    startToolUse()
    {
        gl.viewport(0, 0, JellyFace.RT_TEX_SIZE(), JellyFace.RT_TEX_SIZE());
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        
        this.renderDataBuffer( this._grabBuffer.fbo(), this._grabMaterial, this._faceMesh, gl.POINTS );
        
        Framebuffer.bindDefault();
    }

    endToolUse()
    {
        gl.viewport(0, 0, JellyFace.RT_TEX_SIZE(), JellyFace.RT_TEX_SIZE());
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
        this._posFbo.bind();
        var pixels = new Uint8Array(JellyFace.RT_TEX_SIZE()*JellyFace.RT_TEX_SIZE()*4);

        gl.readPixels(0, 0, JellyFace.RT_TEX_SIZE(), JellyFace.RT_TEX_SIZE(), gl.RGBA, gl.UNSIGNED_BYTE, pixels);

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
    -10.0, -0.5, -10.0,
    -10.0, -0.5, 10.0,
    10.0, -0.5, 10.0,
    10.0, -0.5, -10.0
];

var floorIndices = quadVertexIndices;

