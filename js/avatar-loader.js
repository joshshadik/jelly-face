"use strict"

function loadAvatarFromPly(buf)
{
    var dv = new DataView(buf);

    var idx = 0;
    var currLine = "";

    var vertexCount = 0;
    var faceCount = 0;

    while(idx < buf.byteLength)
    {
        var v = dv.getUint8(idx++);

        if( v == 10)
        {   
            var words = currLine.split(' ');
            if( words[0] == "element")
            {
                if(words[1] == "vertex")
                {
                    vertexCount = parseInt(words[2]);
                }
                else if(words[1] == "face")
                {
                    faceCount = parseInt(words[2]);
                }
            }
            else if( words[0] == "end_header")
            {
                break;
            }

            currLine = "";
        }
        else
        {
            currLine += String.fromCharCode(v);
        }

    }

    var vertices = [];
    var indices = [];
    var texcoords = [];

    for( var i = 0; i < vertexCount * 3; ++i )
    {
        vertices.push(dv.getFloat32(idx, true));
        idx += 4;
    }

    for( var i = 0; i < faceCount; ++i )
    {
        var el = dv.getUint8(idx++, true);
        for(var j = 0; j < el; ++j )
        {
            indices.push(dv.getUint32(idx, true));
            idx += 4;
        }

        el = dv.getUint8(idx++, true);
        for(var j = 0; j < el; ++j )
        {
            texcoords.push(dv.getFloat32(idx, true));
            idx += 4;
        }
    }

    var vboData = [];
    var iboData = [];

    var maxMeshSize = _supportsUIntIndices ? 1 << 32 : 1 << 16;
    var meshCount = (indices.length / maxMeshSize) + 1;
    var meshes = [];
    var currIdx = 0;

    var layout = {
        "aPos" : [0, 3, 0],
        "aTexcoord" : [12, 2, 1],
        "aVertexID" : [20, 1, 2]
    };

    for( var i = 0; i < indices.length; ++i )
    {
        var idx = indices[i];
        vboData.push(vertices[idx*3]);
        vboData.push(vertices[idx*3+1]);
        vboData.push(vertices[idx*3+2]);
        vboData.push(texcoords[i*2]);
        vboData.push(texcoords[i*2+1]);
        vboData.push(idx*1.0);

        iboData.push(currIdx);
        ++currIdx;

        if (currIdx == maxMeshSize - 1 || i == indices.length - 1)
        {
            
            var mesh = new Mesh(vboData, iboData, 24, layout);
            meshes.push(mesh);
            vboData = [];
            iboData = [];
            currIdx = 0;
        }

    }

    return meshes;
}

function loadAvatar(url, callback)
{
    var meshUrl = url;

    JSZipUtils.getBinaryContent(meshUrl, function(err, data) {
        if(err) {
            throw err; 
        }
    
        JSZip.loadAsync(data).then(function (zip) {
            var model = zip.file("model.ply")
            model.async("uint8array").then(function(dat) {              
                callback(loadAvatarFromPly(dat.buffer));
                
            });
            
        });
    });
}




