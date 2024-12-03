/**
 * @Instructions
 * 		@task1 : Complete the setTexture function to handle non power of 2 sized textures
 * 		@task2 : Implement the lighting by modifying the fragment shader, constructor,
 *      @task3:
 *      @task4:
 * 		setMesh, draw, setAmbientLight, setSpecularLight and enableLighting functions
 */

function GetModelViewProjection(
  projectionMatrix,
  translationX,
  translationY,
  translationZ,
  rotationX,
  rotationY
) {
  var trans1 = [
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    translationX,
    translationY,
    translationZ,
    1,
  ];
  var rotatXCos = Math.cos(rotationX);
  var rotatXSin = Math.sin(rotationX);

  var rotatYCos = Math.cos(rotationY);
  var rotatYSin = Math.sin(rotationY);

  var rotatx = [
    1,
    0,
    0,
    0,
    0,
    rotatXCos,
    -rotatXSin,
    0,
    0,
    rotatXSin,
    rotatXCos,
    0,
    0,
    0,
    0,
    1,
  ];

  var rotaty = [
    rotatYCos,
    0,
    -rotatYSin,
    0,
    0,
    1,
    0,
    0,
    rotatYSin,
    0,
    rotatYCos,
    0,
    0,
    0,
    0,
    1,
  ];

  var test1 = MatrixMult(rotaty, rotatx);
  var test2 = MatrixMult(trans1, test1);
  var mvp = MatrixMult(projectionMatrix, test2);

  return mvp;
}

class MeshDrawer {
  // The constructor is a good place for taking care of the necessary initializations.
  constructor() {
    this.prog = InitShaderProgram(meshVS, meshFS);
    this.mvpLoc = gl.getUniformLocation(this.prog, "mvp");
    this.showTexLoc = gl.getUniformLocation(this.prog, "showTex");

    this.colorLoc = gl.getUniformLocation(this.prog, "color");

    this.vertPosLoc = gl.getAttribLocation(this.prog, "pos");
    this.texCoordLoc = gl.getAttribLocation(this.prog, "texCoord");

    this.vertbuffer = gl.createBuffer();
    this.texbuffer = gl.createBuffer();

    this.numTriangles = 0;

    this.lightPosLoc = gl.getUniformLocation(this.prog, "lightPos");
    this.ambientLoc = gl.getUniformLocation(this.prog, "ambient");
    this.enableLightingLoc = gl.getUniformLocation(this.prog, "enableLighting");
    this.normalLoc = gl.getAttribLocation(this.prog, "normal");
    this.normalbuffer = gl.createBuffer();

    // Default lighting settings
    this.enableLightingFlag = false;
    this.ambientIntensity = 0.5; // Default ambient light

    //TASK 3
    this.specularLoc = gl.getUniformLocation(this.prog, "specularIntensity");
    this.shininessLoc = gl.getUniformLocation(this.prog, "shininess");

    // Default specular settings
    this.specularIntensity = 0.5; // Default specular intensity
    this.shininess = 32.0; // Default shininess

    this.diffuseTexLoc = gl.getUniformLocation(this.prog, "diffuseTex");
    this.normalTexLoc = gl.getUniformLocation(this.prog, "normalTex");
    this.useNormalMapLoc = gl.getUniformLocation(this.prog, "useNormalMap");

    // Create textures
    this.diffuseTexture = gl.createTexture();
    this.normalTexture = gl.createTexture();
    this.hasNormalMap = false;

    this.textureBlendLoc = gl.getUniformLocation(this.prog, "textureBlend");
    this.blendFactorLoc = gl.getUniformLocation(this.prog, "blendFactor");
    this.blendFactor = 0.5; // Default blend factor

  }


  setBlendFactor(factor) {
    this.blendFactor = factor;
    gl.useProgram(this.prog);
    gl.uniform1f(this.blendFactorLoc, this.blendFactor);
    DrawScene();
}

  setMesh(vertPos, texCoords, normalCoords) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

    // update texture coordinates
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

    this.numTriangles = vertPos.length / 3;

    //TASK 2
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalCoords), gl.STATIC_DRAW);

    this.numTriangles = vertPos.length / 3;
  }

  // This method is called to draw the triangular mesh.
  // The argument is the transformation matrix, the same matrix returned
  // by the GetModelViewProjection function above.
  draw(trans) {
    gl.useProgram(this.prog);

    // Set MVP matrix
    gl.uniformMatrix4fv(this.mvpLoc, false, trans);

    // Set up vertex positions
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
    gl.enableVertexAttribArray(this.vertPosLoc);
    gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);

    // Set up texture coordinates
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
    gl.enableVertexAttribArray(this.texCoordLoc);
    gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);

    // Set up normals
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalbuffer);
    gl.enableVertexAttribArray(this.normalLoc);
    gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);

    // Update and set light position
    updateLightPos();
    gl.uniform3f(this.lightPosLoc, lightX, lightY, 1.0);

    // Set lighting parameters
    gl.uniform1f(this.ambientLoc, this.ambientIntensity);
    gl.uniform1i(this.enableLightingLoc, this.enableLightingFlag);
    gl.uniform1f(this.specularLoc, this.specularIntensity);
    gl.uniform1f(this.shininessLoc, this.shininess);

    gl.uniform1f(this.blendFactorLoc, this.blendFactor);

    // Bind diffuse (base) texture to texture unit 0
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.diffuseTexture);
    gl.uniform1i(this.diffuseTexLoc, 0);

    // Bind normal map to texture unit 1 if available
    if (this.hasNormalMap) {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.normalTexture);
        gl.uniform1i(this.normalTexLoc, 1);
    }
    gl.uniform1i(this.useNormalMapLoc, this.hasNormalMap);

    gl.uniform1i(this.showTexLoc, true);

    // Draw the triangles
    gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);

    // Clean up
    gl.disableVertexAttribArray(this.vertPosLoc);
    gl.disableVertexAttribArray(this.texCoordLoc);
    gl.disableVertexAttribArray(this.normalLoc);
}

  // This method is called to set the texture of the mesh.
  // The argument is an HTML IMG element containing the texture data.

  setTexture(img, isNormalMap = false) {
    const texture = isNormalMap ? this.normalTexture : this.diffuseTexture;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);

    if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    gl.useProgram(this.prog);

    if (isNormalMap) {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.normalTexture);
        gl.uniform1i(this.normalTexLoc, 1);
        this.hasNormalMap = true;
    } else {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.diffuseTexture);
        gl.uniform1i(this.diffuseTexLoc, 0);
    }
}
  showTexture(show) {
    gl.useProgram(this.prog);
    gl.uniform1i(this.showTexLoc, show);
  }

  enableLighting(show) {
    this.enableLightingFlag = show;
    DrawScene(); // Redraw the scene
}

setAmbientLight(ambient) {
  this.ambientIntensity = ambient;
  DrawScene(); // Redraw the scene
}

setSpecularLight(intensity) {
  this.specularIntensity = intensity; // Convert slider value to 0-1 range
  DrawScene(); // Redraw the scene
}
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

function normalize(v, dst) {
  dst = dst || new Float32Array(3);
  var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  // make sure we don't divide by 0.
  if (length > 0.00001) {
    dst[0] = v[0] / length;
    dst[1] = v[1] / length;
    dst[2] = v[2] / length;
  }
  return dst;
}

// Vertex shader source code
const meshVS = `
    attribute vec3 pos;
    attribute vec2 texCoord;
    attribute vec3 normal;

    uniform mat4 mvp;

    varying vec2 v_texCoord;
    varying vec3 v_normal;
    varying mat3 v_TBN;

    void main() {
        v_texCoord = texCoord;
        v_normal = normal;

        // Calculate tangent space basis vectors
        vec3 T = normalize(vec3(1.0, 0.0, 0.0));
        vec3 N = normalize(normal);
        vec3 B = normalize(cross(N, T));
        T = normalize(cross(B, N));
        v_TBN = mat3(T, B, N);

        gl_Position = mvp * vec4(pos, 1);
    }`;

// Fragment shader source code
/**
 * @Task2 : You should update the fragment shader to handle the lighting
 */
const meshFS = `
    precision mediump float;

    uniform bool showTex;
    uniform bool enableLighting;
    uniform sampler2D diffuseTex;
    uniform sampler2D normalTex;
    uniform bool useNormalMap;
    uniform vec3 color;
    uniform vec3 lightPos;
    uniform float ambient;
    uniform float specularIntensity;
    uniform float shininess;
    uniform float blendFactor;

    varying vec2 v_texCoord;
    varying vec3 v_normal;

    void main() {
        // Get both texture colors
        vec4 baseColor = texture2D(diffuseTex, v_texCoord);
        vec4 normalColor = texture2D(normalTex, v_texCoord);
        
        // Blend the textures
        vec4 blendedColor = mix(baseColor, normalColor, blendFactor);

        if(showTex && enableLighting) {
            // Normalize vectors for lighting calculations
            vec3 normal = normalize(v_normal);
            vec3 lightDir = normalize(lightPos - vec3(0.0, 0.0, 0.0));
            
            // Ambient component
            vec3 ambientColor = blendedColor.rgb * ambient;
            
            // Diffuse component
            float diff = max(dot(normal, lightDir), 0.0);
            vec3 diffuseColor = blendedColor.rgb * diff;
            
            // Specular component
            vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
            vec3 reflectDir = reflect(-lightDir, normal);
            float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
            vec3 specularColor = vec3(1.0) * spec * specularIntensity;
            
            // Combine all lighting components
            vec3 result = ambientColor + diffuseColor + specularColor;
            gl_FragColor = vec4(result, blendedColor.a);
        }
        else if(showTex) {
            gl_FragColor = blendedColor;
        }
        else {
            gl_FragColor = vec4(1.0, 0, 0, 1.0);
        }
    }`;
// Light direction parameters for Task 2
var lightX = 1;
var lightY = 1;

const keys = {};
function updateLightPos() {
  const translationSpeed = 1;
  if (keys["ArrowUp"]) lightY -= translationSpeed;
  if (keys["ArrowDown"]) lightY += translationSpeed;
  if (keys["ArrowRight"]) lightX -= translationSpeed;
  if (keys["ArrowLeft"]) lightX += translationSpeed;
}
///////////////////////////////////////////////////////////////////////////////////
