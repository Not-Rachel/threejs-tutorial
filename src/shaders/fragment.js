export default /*glsl*/ `

uniform float u_time;
uniform vec2 u_resolution;
// uniform sampler2D image;
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vPattern;
void main(){
    vec2 st = gl_FragCoord.xy / u_resolution;
//   vec4 texture = texture2D(image, st);
    // float pattern = (abs(vUv.x - 0.5) -0.4) * 10.f;
    gl_FragColor = vec4(vPattern,1.0);
}`;
