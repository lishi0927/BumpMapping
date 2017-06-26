#version 330 core

// Input vertex data, different for all executions of this shader.
layout(location = 0) in vec3 vertexPosition_modelspace;
layout(location = 1) in vec2 vertexUV;
layout(location = 2) in vec3 vertexNormal_modelspace;
layout(location = 3) in vec3 vertexTangent_modelspace;
layout(location = 4) in vec3 vertexBitangent_modelspace;

// Output data will be interpolated for each fragment.
out vec2 UV;
out vec3 Position_worldspace;
out vec3 LightDirection_tangentspace;
out vec3 EyeDirection_tangentspace;

// Values that stay constant for the whole mesh.
uniform mat4 MVP;
uniform mat4 M;
uniform vec3 LightPosition_worldspace;
uniform vec3 CameraPosition_worldspace;

void main()
{

// Output position of the vertex, in clip space : MVP * position
	gl_Position =  MVP * vec4(vertexPosition_modelspace,1);

// Position of the vertex, in worldspace : M * position
	Position_worldspace = (M * vec4(vertexPosition_modelspace,1)).xyz;

   vec3 EyeDirection_worldspace = CameraPosition_worldspace - Position_worldspace;
   vec3 LightDirection_worldspace = LightPosition_worldspace - Position_worldspace;

   // UV of the vertex. No special space for this one.
	UV = vertexUV;

	vec3 vertexTangent_worldspace = (M * vec4(vertexTangent_modelspace, 1.0)).xyz;
	vec3 vertexBitangent_worldspace = (M * vec4(vertexBitangent_modelspace, 1.0)).xyz;
	vec3 vertexNormal_worldspace = (M * vec4(vertexNormal_modelspace, 1.0)).xyz;

	mat3 TBN = transpose(mat3(
		vertexTangent_worldspace,
		vertexBitangent_worldspace,
		vertexNormal_worldspace	
	)); // You can use dot products instead of building this matrix and transposing it. See References for details.

	LightDirection_tangentspace = TBN * LightDirection_worldspace;
	EyeDirection_tangentspace =  TBN * EyeDirection_worldspace;
}