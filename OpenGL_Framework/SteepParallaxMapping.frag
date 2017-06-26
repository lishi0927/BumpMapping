#version 330 core

// Interpolated values from the vertex shaders
in vec2 UV;
in vec3 Position_worldspace;

in vec3 LightDirection_tangentspace;
in vec3 EyeDirection_tangentspace;

// Ouput data
out vec3 color;

// Values that stay constant for the whole mesh.
uniform sampler2D DiffuseTextureSampler;
uniform sampler2D NormalTextureSampler;
uniform sampler2D SpecularTextureSampler;
uniform sampler2D HeightTextureSampler;
uniform vec3 LightPosition_worldspace;

const float height_scale = 0.1;

vec2 ParallaxMapping(vec2 texCoords, vec3 viewDir)
{ 
    const float numLayers = 10;
	float layerDepth = 1.0 / numLayers;
	float currentLayerDepth = 0.0;
	vec2 p = viewDir.xy * height_scale;
	vec2 deltaTexCoords = p / numLayers;
	
	vec2 currentTexCoords = texCoords;
	float currentDepthMapValue = texture(HeightTextureSampler, currentTexCoords).r;
	
	while(currentLayerDepth < currentDepthMapValue)
	{
	  // shift texture coordinates along direction of P
	  currentTexCoords -= deltaTexCoords;
	  // get depthmap value at current texture coordinates
	  currentDepthMapValue = texture(HeightTextureSampler, currentTexCoords).r;
	  // get depth of next layer
      currentLayerDepth += layerDepth; 
	}   

	return currentTexCoords;
} 

void main(){

	// Light emission properties
	// You probably want to put them as uniforms
	vec3 LightColor = vec3(1,1,1);
	float LightPower = 32.0;
	
	// Eye vector (towards the camera)
	vec3 E = normalize(EyeDirection_tangentspace);
	vec2 texcoords = ParallaxMapping(UV, E);

	if(texcoords.x > 1.0 || texcoords.y > 1.0 || texcoords.x < 0.0 || texcoords.y < 0.0)
       discard;

	// Material properties
	vec3 MaterialDiffuseColor = texture( DiffuseTextureSampler, texcoords ).rgb;
	vec3 MaterialAmbientColor = vec3(0.1,0.1,0.1) * MaterialDiffuseColor;
	vec3 MaterialSpecularColor = texture( SpecularTextureSampler, texcoords ).rgb * 0.3;

	// Local normal, in tangent space. V tex coordinate is inverted because normal map is in TGA (not in DDS) for better quality
	vec3 TextureNormal_tangentspace = normalize(texture( NormalTextureSampler, texcoords ).rgb*2.0 - 1.0);
	
	// Distance to the light
	float distance = length( LightPosition_worldspace - Position_worldspace );

	// Normal of the computed fragment, in camera space
	vec3 n = TextureNormal_tangentspace;
	// Direction of the light (from the fragment to the light)
	vec3 l = normalize(LightDirection_tangentspace);
	// Cosine of the angle between the normal and the light direction, 
	// clamped above 0
	//  - light is at the vertical of the triangle -> 1
	//  - light is perpendicular to the triangle -> 0
	//  - light is behind the triangle -> 0
	float cosTheta = clamp( dot( n,l ), 0,1 );

	
	// Direction in which the triangle reflects the light
	vec3 R = reflect(-l,n);
	// Cosine of the angle between the Eye vector and the Reflect vector,
	// clamped to 0
	//  - Looking into the reflection -> 1
	//  - Looking elsewhere -> < 1
	float cosAlpha = clamp( dot( E,R ), 0,1 );
	
	color = 
		// Ambient : simulates indirect lighting
		MaterialAmbientColor +
		// Diffuse : "color" of the object
		MaterialDiffuseColor * LightColor * LightPower * cosTheta / (distance*distance) +
		// Specular : reflective highlight, like a mirror
		MaterialSpecularColor * LightColor * LightPower * pow(cosAlpha,5) / (distance*distance);
}