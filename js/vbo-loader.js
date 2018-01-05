

function loadVBO(buf, stride, layout)
{
    var dv = new DataView(buf);

    var vCount = dv.getUint32(0);
    var iCount = dv.getUint32(4);

    console.log(vCount)

    var vertices = new Float32Array(buf, 8, vCount * stride/4);
    var indices = new Uint32Array(buf, 8 + vCount * stride, iCount);

    console.log(indices[indices.length - 1]);
    return new Mesh(vertices, indices, stride, layout);
}

function loadVBOFromURL(url, stride, layout, callback) {
    var req = new XMLHttpRequest();

    req.onreadystatechange = function()
    {
        if( req.readyState == req.DONE ) 
        {
            if( req.status == 200 && req.response )
            {
                callback(loadVBO(req.response, stride, layout));
            }
        }
    }

    req.open("GET", url, true);
    req.responseType = "arraybuffer";    
    req.send();
}