class VRButton {
    constructor(position, rotation, scale, mesh, texture, material, uvRect, onClick = null, radius = 0.0)
    {
        this._position = position;
        this._rotation = rotation;
        this._scale = scale;
        
        this._matrix = [];
        mat4.fromRotationTranslationScale(this._matrix, rotation, position, scale);

        this._mesh = mesh;
        this._material = material;
        this._texture = texture;

        this._material.setVec2("uTexcoordOffset", [uvRect[0], uvRect[1]]);
        this._material.setVec2("uTexcoordScale", [uvRect[2], uvRect[3]]);
      
        this._material.setTexture("uColorTex", this._texture);

        this._onClick = onClick;
        this._radius = radius;
        this._sqRadius = radius*radius;


        this._worldPosition = [];
        this._worldMatrix = [];
        vec3.copy(this._worldPosition, this._position);
        mat4.copy(this._worldMatrix, this._matrix);

        this._hoveredFrame = false;
    }


    hover(position)
    {
        if( this._hoveredFrame )
        {
            return false;
        }

        var isHovering = false;
        var sqDist = vec3.squaredDistance(position, this._worldPosition);

        if( sqDist <= this._sqRadius )
        {
            this._material.setFloat("uHover", 1.0);   
            isHovering = true;         
        }
        else
        {
            this._material.setFloat("uHover", 0.0);   
        }

        this._hoveredFrame = isHovering;

        return isHovering;
    }

    click()
    {
        this._onClick();
    }

    updateWorld(parentMatrix)
    {
        mat4.multiply(this._worldMatrix, parentMatrix, this._matrix);
        vec3.transformMat4(this._worldPosition, this._position, parentMatrix);
    }


    render( viewMatrix, projMatrix)
    {
        this._material.setMatrix("uMMatrix", this._worldMatrix);
        this._material.setMatrix("uVMatrix", viewMatrix);
        this._material.setMatrix("uPMatrix", projMatrix);

        this._material.apply();
        this._mesh.render();
        this._material.unapply();

        this._hoveredFrame = false;
    }
}