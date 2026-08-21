"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
import * as THREE from "three";
export { createNightSkyDioramaModel as createNightSkyDioramaModel };
export { createNightSkyDioramaLookDevLights as createNightSkyDioramaLookDevLights };
export { createNightSkyDioramaEnvironment as createNightSkyDioramaEnvironment };
export { frameNightSkyDioramaCamera as frameNightSkyDioramaCamera };
export { createNightSkyDioramaPresentationComposer as createNightSkyDioramaPresentationComposer };
export { configureNightSkyDioramaRenderer as configureNightSkyDioramaRenderer };
export { createNightSkyDioramaInspectControls as createNightSkyDioramaInspectControls };
function hashString(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}
function readLayerNumber(value, keys, fallback) {
    if (typeof value === 'number')
        return value;
    if (value && typeof value === 'object') {
        const record = value;
        for (const key of keys) {
            if (typeof record[key] === 'number')
                return record[key];
        }
    }
    return fallback;
}
function hexToRgb(hex) {
    const normalized = /^#[0-9a-f]{3}$/i.test(hex)
        ? '#' + hex.slice(1).split('').map((part) => part + part).join('')
        : hex;
    const value = /^#[0-9a-f]{6}$/i.test(normalized) ? Number.parseInt(normalized.slice(1), 16) : 0x8a7a5f;
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}
function materialPalette(spec) {
    const palette = spec.colorVariation?.palette;
    if (Array.isArray(palette) && palette.length > 0)
        return palette.filter((value) => typeof value === 'string');
    const secondary = spec.albedo?.secondary;
    const colors = [spec.baseColor ?? spec.color ?? spec.albedo?.dominant, ...(Array.isArray(secondary) ? secondary : [])];
    return colors.filter((value) => typeof value === 'string' && value.startsWith('#'));
}
function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}
function smoothCurve(value) {
    return value * value * (3 - 2 * value);
}
function periodicHash(x, y, seed, periodX, periodY) {
    const wrappedX = ((x % periodX) + periodX) % periodX;
    const wrappedY = ((y % periodY) + periodY) % periodY;
    let value = Math.imul(wrappedX + seed * 17, 374761393) ^ Math.imul(wrappedY + seed * 31, 668265263);
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}
function periodicValueNoise(u, v, seed, periodX, periodY) {
    const x = u * periodX;
    const y = v * periodY;
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const tx = smoothCurve(x - x0);
    const ty = smoothCurve(y - y0);
    const a = periodicHash(x0, y0, seed, periodX, periodY);
    const b = periodicHash(x0 + 1, y0, seed, periodX, periodY);
    const c = periodicHash(x0, y0 + 1, seed, periodX, periodY);
    const d = periodicHash(x0 + 1, y0 + 1, seed, periodX, periodY);
    return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, tx), THREE.MathUtils.lerp(c, d, tx), ty);
}
function surfaceBands(spec) {
    const source = Array.isArray(spec.surfaceFrequencyBands) ? spec.surfaceFrequencyBands : [];
    const parsed = source.flatMap((item) => {
        if (!item || typeof item !== 'object')
            return [];
        const band = item;
        const frequency = typeof band.frequency === 'number' ? band.frequency : 0;
        const amplitude = typeof band.amplitude === 'number' ? band.amplitude : 0;
        if (frequency <= 0 || amplitude <= 0)
            return [];
        const stretch = Array.isArray(band.stretch) ? band.stretch : [1, 1];
        const description = `${String(band.pattern ?? '')} ${String(band.role ?? '')}`.toLowerCase();
        return [{
                frequency,
                amplitude,
                stretchX: typeof stretch[0] === 'number' ? Math.max(0.1, stretch[0]) : 1,
                stretchY: typeof stretch[1] === 'number' ? Math.max(0.1, stretch[1]) : 1,
                ridge: /(ridge|groove|grain|fiber|striated|crack)/.test(description),
            }];
    });
    return parsed.length > 0 ? parsed : [
        { frequency: 2, amplitude: 0.42, stretchX: 1, stretchY: 1, ridge: false },
        { frequency: 12, amplitude: 0.22, stretchX: 1, stretchY: 1, ridge: false },
        { frequency: 56, amplitude: 0.08, stretchX: 1, stretchY: 1, ridge: false },
    ];
}
function sampleSurface(u, v, bands, seed) {
    let value = 0;
    let weight = 0;
    for (let index = 0; index < bands.length; index += 1) {
        const band = bands[index];
        const periodX = Math.max(1, Math.round(band.frequency * band.stretchX));
        const periodY = Math.max(1, Math.round(band.frequency * band.stretchY));
        let sample = periodicValueNoise(u, v, seed + index * 1013, periodX, periodY);
        if (band.ridge)
            sample = 1 - Math.abs(sample * 2 - 1);
        value += sample * band.amplitude;
        weight += band.amplitude;
    }
    return weight > 0 ? clamp01(value / weight) : 0.5;
}
function mixPalette(colors, value) {
    if (colors.length === 1)
        return colors[0];
    const scaled = clamp01(value) * (colors.length - 1);
    const index = Math.min(colors.length - 2, Math.floor(scaled));
    const mix = scaled - index;
    const a = colors[index];
    const b = colors[index + 1];
    return [
        Math.round(THREE.MathUtils.lerp(a[0], b[0], mix)),
        Math.round(THREE.MathUtils.lerp(a[1], b[1], mix)),
        Math.round(THREE.MathUtils.lerp(a[2], b[2], mix)),
    ];
}
function parseRgba(value) {
    const match = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(value);
    if (!match)
        return [138, 122, 95];
    return [Number(match[1]), Number(match[2]), Number(match[3])];
}
// Analytical per-pixel gradient sample. The extraction schema's colorGradient carries
// exact rgba(...) stop colors (see extract_part_color_recipe.py), so this samples the
// same trend directly in JS math rather than round-tripping through a Canvas 2D
// createLinearGradient/createRadialGradient object — same visual result, and it composes
// directly with the existing noise/height-correlated colorVariation blend below.
function sampleColorGradient(gradient, u, v) {
    const stops = gradient.stops.length >= 2 ? gradient.stops : [{ offset: 0, color: 'rgba(138,122,95,1)' }, { offset: 1, color: 'rgba(138,122,95,1)' }];
    let t;
    if (gradient.type === 'radial') {
        const [cx, cy] = gradient.axis;
        const dx = u - cx;
        const dy = v - cy;
        const maxRadius = Math.max(0.001, Math.hypot(Math.max(cx, 1 - cx), Math.max(cy, 1 - cy)));
        t = clamp01(Math.hypot(dx, dy) / maxRadius);
    }
    else {
        const [ax, ay] = gradient.axis;
        const projection = (u - 0.5) * ax + (v - 0.5) * ay;
        const maxProjection = 0.5 * (Math.abs(ax) + Math.abs(ay)) || 0.5;
        t = clamp01(projection / maxProjection + 0.5);
    }
    const scaled = t * (stops.length - 1);
    const index = Math.min(stops.length - 2, Math.max(0, Math.floor(scaled)));
    const mix = scaled - index;
    const a = parseRgba(stops[index].color);
    const b = parseRgba(stops[index + 1].color);
    return [
        THREE.MathUtils.lerp(a[0], b[0], mix),
        THREE.MathUtils.lerp(a[1], b[1], mix),
        THREE.MathUtils.lerp(a[2], b[2], mix),
    ];
}
function writePixel(data, offset, red, green, blue) {
    data[offset] = Math.max(0, Math.min(255, Math.round(red)));
    data[offset + 1] = Math.max(0, Math.min(255, Math.round(green)));
    data[offset + 2] = Math.max(0, Math.min(255, Math.round(blue)));
    data[offset + 3] = 255;
}
function makeCanvas(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    return canvas;
}
function createMapTexture(canvas, colorSpace, spec, options) {
    const texture = new THREE.CanvasTexture(canvas);
    const projection = spec.textureProjection && typeof spec.textureProjection === 'object' ? spec.textureProjection : {};
    const repeat = Array.isArray(projection.repeat) ? projection.repeat : [2, 2];
    texture.colorSpace = colorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(typeof repeat[0] === 'number' ? repeat[0] : 2, typeof repeat[1] === 'number' ? repeat[1] : 2);
    texture.anisotropy = Math.max(1, Math.round(options.textureAnisotropy ?? projection.anisotropy ?? 8));
    texture.needsUpdate = true;
    return texture;
}
function referenceMapUrl(spec, channel) {
    const reference = spec.referencePbr;
    if (!reference || typeof reference !== 'object')
        return null;
    if (reference.usable === false)
        return null;
    const confidence = typeof reference.confidence === 'number'
        ? reference.confidence
        : (typeof reference.estimatedFidelity === 'number' ? reference.estimatedFidelity : 0);
    const threshold = typeof reference.targetThreshold === 'number' ? reference.targetThreshold : 0.7;
    if (confidence < threshold)
        return null;
    const maps = reference.maps;
    if (!maps || typeof maps !== 'object')
        return null;
    const map = maps[channel];
    if (!map || typeof map !== 'object')
        return null;
    const record = map;
    const url = typeof record.url === 'string' && record.url.trim() ? record.url : record.path;
    return typeof url === 'string' && url.trim() ? url : null;
}
function createLoadedMapTexture(url, colorSpace, spec, options) {
    const texture = new THREE.TextureLoader().load(url);
    const projection = spec.textureProjection && typeof spec.textureProjection === 'object' ? spec.textureProjection : {};
    const repeat = Array.isArray(projection.repeat) ? projection.repeat : [1, 1];
    texture.colorSpace = colorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(typeof repeat[0] === 'number' ? repeat[0] : 1, typeof repeat[1] === 'number' ? repeat[1] : 1);
    texture.anisotropy = Math.max(1, Math.round(options.textureAnisotropy ?? projection.anisotropy ?? 8));
    texture.needsUpdate = true;
    return texture;
}
function makeReferenceTextureSet(spec, options) {
    const albedo = referenceMapUrl(spec, 'albedo');
    const roughness = referenceMapUrl(spec, 'roughness');
    const height = referenceMapUrl(spec, 'height');
    const normal = referenceMapUrl(spec, 'normal');
    const ao = referenceMapUrl(spec, 'ao');
    if (!albedo || !roughness || !height || !normal || !ao)
        return null;
    return {
        albedo: createLoadedMapTexture(albedo, THREE.SRGBColorSpace, spec, options),
        roughness: createLoadedMapTexture(roughness, THREE.NoColorSpace, spec, options),
        height: createLoadedMapTexture(height, THREE.NoColorSpace, spec, options),
        normal: createLoadedMapTexture(normal, THREE.NoColorSpace, spec, options),
        ao: createLoadedMapTexture(ao, THREE.NoColorSpace, spec, options),
        source: 'reference-pixel-extraction',
    };
}
function makeProceduralTextureSet(id, spec, options) {
    if (typeof document === 'undefined')
        return null;
    const qualityFirst = (options.qualityPriority ?? 'reference-fidelity') === 'reference-fidelity';
    const requested = options.textureSize ?? spec.textureResolution;
    const requestedSize = typeof requested === 'number' && Number.isFinite(requested)
        ? requested
        : (qualityFirst ? 1024 : 512);
    const size = Math.max(256, Math.min(2048, 2 ** Math.round(Math.log2(requestedSize))));
    const canvases = {
        albedo: makeCanvas(size),
        roughness: makeCanvas(size),
        height: makeCanvas(size),
        normal: makeCanvas(size),
        ao: makeCanvas(size),
    };
    const contexts = {
        albedo: canvases.albedo.getContext('2d'),
        roughness: canvases.roughness.getContext('2d'),
        height: canvases.height.getContext('2d'),
        normal: canvases.normal.getContext('2d'),
        ao: canvases.ao.getContext('2d'),
    };
    if (!contexts.albedo || !contexts.roughness || !contexts.height || !contexts.normal || !contexts.ao)
        return null;
    const images = {
        albedo: contexts.albedo.createImageData(size, size),
        roughness: contexts.roughness.createImageData(size, size),
        height: contexts.height.createImageData(size, size),
        normal: contexts.normal.createImageData(size, size),
        ao: contexts.ao.createImageData(size, size),
    };
    const seed = hashString(id);
    const bands = surfaceBands(spec);
    const heightField = new Float32Array(size * size);
    const roughnessField = new Float32Array(size * size);
    const palette = materialPalette(spec);
    const fallback = typeof spec.baseColor === 'string' ? spec.baseColor : '#8A7A5F';
    const colors = (palette.length >= 2 ? palette : [fallback, '#6E614B', '#A08F70']).map(hexToRgb);
    const baseRoughness = clamp01(readLayerNumber(spec.roughness, ['base'], 0.76));
    const roughnessVariation = clamp01(readLayerNumber(spec.roughness, ['variation'], 0.18));
    const colorAmplitude = clamp01(readLayerNumber(spec.colorVariation, ['amplitude', 'variation'], 0.18));
    const heightCorrelation = clamp01(readLayerNumber(spec.colorVariation, ['heightCorrelation'], 0.3));
    const colorGradient = spec.colorGradient;
    for (let y = 0; y < size; y += 1) {
        const v = y / size;
        for (let x = 0; x < size; x += 1) {
            const u = x / size;
            const index = y * size + x;
            const height = sampleSurface(u, v, bands, seed + 101);
            const roughNoise = sampleSurface(u, v, bands, seed + 7001);
            const colorNoise = sampleSurface(u, v, bands, seed + 15013);
            heightField[index] = height;
            roughnessField[index] = clamp01(baseRoughness + (roughNoise - 0.5) * roughnessVariation * 2);
            let color;
            if (colorGradient) {
                // Evidence-derived spatial gradient (Plan 1.3 Workstream C) takes priority
                // over the noise-based palette blend below — it is a measured trend, not a guess.
                color = sampleColorGradient(colorGradient, u, v);
            }
            else {
                const paletteValue = clamp01(0.5 + (colorNoise - 0.5) * colorAmplitude * 2 + (height - 0.5) * heightCorrelation);
                color = mixPalette(colors, paletteValue);
            }
            writePixel(images.albedo.data, index * 4, color[0], color[1], color[2]);
        }
    }
    const normalStrength = Math.max(0.05, readLayerNumber(spec.normal, ['strength', 'amplitude'], 0.35));
    const aoStrength = clamp01(readLayerNumber(spec.ambientOcclusion, ['cavityStrength', 'strength'], 0.35));
    for (let y = 0; y < size; y += 1) {
        const up = ((y - 1 + size) % size) * size;
        const down = ((y + 1) % size) * size;
        for (let x = 0; x < size; x += 1) {
            const left = (x - 1 + size) % size;
            const right = (x + 1) % size;
            const index = y * size + x;
            const center = heightField[index];
            const dx = (heightField[y * size + right] - heightField[y * size + left]) * normalStrength * 6;
            const dy = (heightField[down + x] - heightField[up + x]) * normalStrength * 6;
            const inverseLength = 1 / Math.sqrt(dx * dx + dy * dy + 1);
            const normalX = -dx * inverseLength;
            const normalY = -dy * inverseLength;
            const normalZ = inverseLength;
            const neighborAverage = (heightField[y * size + left] + heightField[y * size + right]
                + heightField[up + x] + heightField[down + x]) * 0.25;
            const cavity = Math.max(0, neighborAverage - center);
            const ao = clamp01(1 - aoStrength * (cavity * 12 + (1 - center) * 0.16));
            const offset = index * 4;
            const heightByte = center * 255;
            const roughnessByte = roughnessField[index] * 255;
            writePixel(images.height.data, offset, heightByte, heightByte, heightByte);
            writePixel(images.roughness.data, offset, roughnessByte, roughnessByte, roughnessByte);
            writePixel(images.normal.data, offset, (normalX * 0.5 + 0.5) * 255, (normalY * 0.5 + 0.5) * 255, (normalZ * 0.5 + 0.5) * 255);
            writePixel(images.ao.data, offset, ao * 255, ao * 255, ao * 255);
        }
    }
    contexts.albedo.putImageData(images.albedo, 0, 0);
    contexts.roughness.putImageData(images.roughness, 0, 0);
    contexts.height.putImageData(images.height, 0, 0);
    contexts.normal.putImageData(images.normal, 0, 0);
    contexts.ao.putImageData(images.ao, 0, 0);
    return {
        albedo: createMapTexture(canvases.albedo, THREE.SRGBColorSpace, spec, options),
        roughness: createMapTexture(canvases.roughness, THREE.NoColorSpace, spec, options),
        height: createMapTexture(canvases.height, THREE.NoColorSpace, spec, options),
        normal: createMapTexture(canvases.normal, THREE.NoColorSpace, spec, options),
        ao: createMapTexture(canvases.ao, THREE.NoColorSpace, spec, options),
        source: 'procedural',
    };
}
function createSculptMaterial(id, spec, options) {
    const textures = makeReferenceTextureSet(spec, options) ?? makeProceduralTextureSet(id, spec, options);
    const material = new THREE.MeshPhysicalMaterial({
        color: textures ? 0xffffff : new THREE.Color(typeof spec.baseColor === 'string' ? spec.baseColor : '#8A7A5F'),
        roughness: textures ? 1 : clamp01(readLayerNumber(spec.roughness, ['base'], 0.76)),
        metalness: clamp01(readLayerNumber(spec.metalness, ['base'], 0.0)),
        clearcoat: clamp01(readLayerNumber(spec.clearcoat, ['base', 'amount'], 0)),
        clearcoatRoughness: clamp01(readLayerNumber(spec.clearcoatRoughness, ['base'], 0.25)),
        transmission: clamp01(readLayerNumber(spec.transmission, ['base', 'amount'], 0)),
        ior: Math.max(1, readLayerNumber(spec.ior, ['base', 'value'], 1.5)),
        thickness: Math.max(0, readLayerNumber(spec.thickness, ['base', 'amount'], 0)),
        attenuationDistance: Math.max(0.001, readLayerNumber(spec.attenuationDistance, ['base', 'value'], Infinity)),
        attenuationColor: new THREE.Color(typeof spec.attenuationColor === 'string' ? spec.attenuationColor : '#ffffff'),
        sheen: clamp01(readLayerNumber(spec.sheen, ['base', 'amount'], 0)),
        sheenColor: new THREE.Color(typeof spec.sheenColor === 'string' ? spec.sheenColor : '#ffffff'),
        sheenRoughness: clamp01(readLayerNumber(spec.sheenRoughness, ['base'], 1.0)),
        iridescence: clamp01(readLayerNumber(spec.iridescence, ['base', 'amount'], 0)),
        iridescenceIOR: Math.max(1, readLayerNumber(spec.iridescenceIOR, ['base', 'value'], 1.3)),
        anisotropy: clamp01(readLayerNumber(spec.anisotropy, ['base', 'amount'], 0)),
        anisotropyRotation: readLayerNumber(spec.anisotropy, ['rotation'], 0),
        specularIntensity: clamp01(readLayerNumber(spec.specularIntensity, ['base'], 1.0)),
        specularColor: new THREE.Color(typeof spec.specularColor === 'string' ? spec.specularColor : '#ffffff'),
        emissive: new THREE.Color(typeof spec.emissive === 'string' ? spec.emissive : '#000000'),
        emissiveIntensity: Math.max(0, readLayerNumber(spec.emissiveIntensity, ['base'], 1.0)),
        opacity: clamp01(readLayerNumber(spec.opacity, ['base'], 1)),
        transparent: readLayerNumber(spec.transmission, ['base', 'amount'], 0) > 0 || readLayerNumber(spec.opacity, ['base'], 1) < 1,
        alphaTest: Math.max(0, readLayerNumber(spec.alpha, ['cutoff', 'alphaTest'], 0)),
        wireframe: options.wireframe ?? false,
        side: spec.doubleSided === true ? THREE.DoubleSide : THREE.FrontSide,
    });
    if (textures) {
        material.map = textures.albedo;
        material.roughnessMap = textures.roughness;
        material.normalMap = textures.normal;
        material.normalScale.setScalar(Math.max(0.05, readLayerNumber(spec.normal, ['strength', 'amplitude'], 0.35)));
        material.aoMap = textures.ao;
        material.aoMap.channel = 0;
        material.aoMapIntensity = readLayerNumber(spec.ambientOcclusion, ['cavityStrength', 'strength'], 0.35);
        const bumpScale = Math.max(0, readLayerNumber(spec.bump, ['amplitude', 'strength'], 0));
        if (bumpScale > 0) {
            material.bumpMap = textures.height;
            material.bumpScale = bumpScale;
        }
        const displacementScale = Math.max(0, readLayerNumber(spec.displacement, ['amplitude', 'strength'], 0));
        if (displacementScale > 0) {
            material.displacementMap = textures.height;
            material.displacementScale = displacementScale;
            material.displacementBias = -displacementScale * 0.5;
        }
    }
    material.envMapIntensity = readLayerNumber(spec, ['envMapIntensity'], 0.8);
    material.userData.sculptMaterial = spec;
    material.userData.proceduralMapsIndependent = true;
    material.userData.pbrTextureSource = textures?.source ?? 'flat-fallback';
    material.userData.referencePbr = spec.referencePbr ?? null;
    material.needsUpdate = true;
    return material;
}
function readVector3(value, fallback) {
    if (Array.isArray(value) && value.length === 3 && value.every((item) => typeof item === 'number')) {
        return new THREE.Vector3(value[0], value[1], value[2]);
    }
    return new THREE.Vector3(fallback[0], fallback[1], fallback[2]);
}
function readNumber(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
function makeAttachmentEndpoint(attachment) {
    if (!attachment || typeof attachment !== 'object')
        return null;
    const record = attachment;
    const start = readVector3(record.localStart, [0, 0, 0]);
    const end = readVector3(record.localEnd, [0, 1, 0]);
    const delta = end.clone().sub(start);
    const length = delta.length();
    if (length <= 0.0001)
        return null;
    const direction = delta.clone().normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    const baseRadius = Math.max(0.005, readNumber(record.baseRadius, 0.06));
    const endRadius = Math.max(0.003, readNumber(record.endRadius, baseRadius * 0.55));
    return {
        start,
        midpoint: delta.multiplyScalar(0.5),
        quaternion,
        length,
        baseRadius,
        endRadius,
    };
}
// Generated from ObjectSculptSpec target: NightSkyDiorama
// Sculpt build pass: optimization-pass
// This factory is intentionally pass-gated. Finish browser screenshot review before unlocking deeper passes.
function createNightSkyDioramaModel(options = {}) {
    const root = new THREE.Group();
    root.name = "NightSkyDiorama";
    root.userData.reconstructionEvidence = { "itemFamily": null, "subtype": null, "componentAdapter": null, "route": null, "exactnessTier": null, "referenceCamera": { "solved": false, "fovDegrees": 40, "aspect": 2.0, "orientation": { "yaw": 0, "pitch": 0, "roll": 0 }, "positionHint": [0, 4.5, 19], "note": "Environment diorama: front view framing match only; camera solve not applicable (no fixed object landmarks)." }, "approximationNotes": ["Stylized procedural diorama, not photogrammetry; leaf distribution, branch topology, cloud microstructure are procedural approximations.", "Sky dome + billboard galaxy: galaxy is 2.5D by design (reference shows a painted element)."] };
    const materialMap = {};
    materialMap["matSky"] = createSculptMaterial("matSky", { "id": "matSky", "name": "Night sky gradient", "type": "physical", "shaderModel": "MeshPhysicalMaterial", "baseColor": "#1b2a5e", "color": "#1b2a5e", "albedo": { "dominant": "#1b2a5e", "secondary": ["#0a0e2a", "#1b2a5e", "#2e4a8f", "#4a6fc0"], "samplingNotes": "Palette sampled from reference color zones." }, "colorVariation": { "palette": ["#0a0e2a", "#1b2a5e", "#2e4a8f", "#4a6fc0"], "pattern": "mottled", "amplitude": 0.16, "heightCorrelation": 0.32 }, "textureResolution": 1024, "textureProjection": { "mode": "box", "texelDensity": { "units": "texels-per-unit", "value": 16 }, "repeat": [1, 1], "anisotropy": 8 }, "roughness": { "base": 1.0, "variation": 0.12, "map": "independent-roughness-canvas" }, "metalness": { "base": 0.0 }, "emissive": "#ffffff", "emissiveIntensity": { "base": 1.2 }, "opacity": { "base": 1.0 }, "transparent": false, "doubleSided": true, "envMapIntensity": 0.35, "normal": { "strength": 0.3, "amplitude": 0.3 }, "ambientOcclusion": { "cavityStrength": 0.25, "strength": 0.25 }, "colorGradient": { "type": "linear", "axis": [0, 1], "stops": [{ "offset": 0.0, "color": "rgba(3,16,79,1)" }, { "offset": 0.28, "color": "rgba(7,36,111,1)" }, { "offset": 0.58, "color": "rgba(18,60,158,1)" }, { "offset": 1.0, "color": "rgba(20,80,184,1)" }] /* patch: sky-gradient-darken (reference navy ramp) */ }, "localOverrides": [{ "id": "skyGradientRamp", "kind": "decal", "description": "Vertical gradient ramp on interior dome: zenith #0a0e2a -> horizon #4a6fc0; emissiveMap = albedo gradient so dome self-illuminates (no warm-light tint)." }], "surfaceFrequencyBands": [{ "id": "macro", "frequency": 1, "amplitude": 0.02, "stretch": [1, 1], "pattern": "gradient", "role": "sky gradient ramp" }, { "id": "meso", "frequency": 1, "amplitude": 0.02, "stretch": [1, 1], "pattern": "smooth", "role": "no banding" }, { "id": "micro", "frequency": 1, "amplitude": 0.02, "stretch": [1, 1], "pattern": "smooth", "role": "noise-free zenith" }] }, options);
    materialMap["matSky"].emissiveMap = materialMap["matSky"].map; // patch: matsky-emissivemap
    materialMap["matSky"].emissive.set(0xffffff);
    materialMap["matSky"].emissiveIntensity = 0.85; // patch: sky-emissive-lower (washed-out dome -> reference navy)
    materialMap["matSky"].needsUpdate = true; // patch: matsky-needsupdate (recompile shader with EMISSIVE_MAP define)
    materialMap["matSky"].needsUpdate = true; // recompile shader with EMISSIVE_MAP define
    materialMap["matFoliage"] = createSculptMaterial("matFoliage", { "id": "matFoliage", "name": "Foliage", "type": "physical", "shaderModel": "MeshPhysicalMaterial", "baseColor": "#1e5f5a", "color": "#1e5f5a", "albedo": { "dominant": "#1e5f5a", "secondary": ["#123b42", "#1e5f5a", "#2aa198", "#c8e6a0"], "samplingNotes": "Palette sampled from reference color zones." }, "colorVariation": { "palette": ["#123b42", "#1e5f5a", "#2aa198", "#c8e6a0"], "pattern": "mottled", "amplitude": 0.42, "heightCorrelation": 0.45 }, "textureResolution": 512, "textureProjection": { "mode": "box", "texelDensity": { "units": "texels-per-unit", "value": 16 }, "repeat": [1, 1], "anisotropy": 8 }, "roughness": { "base": 0.85, "variation": 0.12, "map": "independent-roughness-canvas" }, "metalness": { "base": 0.0 }, "emissive": "#0e2b2a", "emissiveIntensity": { "base": 0.25 }, "opacity": { "base": 1.0 }, "transparent": false, "doubleSided": false, "envMapIntensity": 0.35, "normal": { "strength": 0.3, "amplitude": 0.3 }, "ambientOcclusion": { "cavityStrength": 0.25, "strength": 0.25 }, "localOverrides": [{ "id": "foliageHighlightZones", "kind": "gloss", "description": "Highlight clumps (#c8e6a0) concentrated on upper-lit canopy side; shadow mass (#123b42) on interior/lower side.", "region": { "hemisphere": "upper", "coverage": 0.25 } }], "surfaceFrequencyBands": [{ "id": "macro", "frequency": 2, "amplitude": 0.45, "stretch": [1, 1], "pattern": "clump", "role": "canopy clump value zones" }, { "id": "meso", "frequency": 10, "amplitude": 0.3, "stretch": [1, 1], "pattern": "cluster", "role": "leaf cluster variation" }, { "id": "micro", "frequency": 40, "amplitude": 0.12, "stretch": [1, 1], "pattern": "speckle", "role": "leaf grain" }], "clearcoat": { "base": 0.3, "amount": 0.3 }, "clearcoatRoughness": { "base": 0.35 } }, options);
    materialMap["matBark"] = createSculptMaterial("matBark", { "id": "matBark", "name": "Tree bark", "type": "physical", "shaderModel": "MeshPhysicalMaterial", "baseColor": "#2b2333", "color": "#2b2333", "albedo": { "dominant": "#2b2333", "secondary": ["#241d2b", "#2b2333", "#3a2f3a"], "samplingNotes": "Palette sampled from reference color zones." }, "colorVariation": { "palette": ["#241d2b", "#2b2333", "#3a2f3a"], "pattern": "mottled", "amplitude": 0.16, "heightCorrelation": 0.32 }, "textureResolution": 512, "textureProjection": { "mode": "box", "texelDensity": { "units": "texels-per-unit", "value": 16 }, "repeat": [1, 1], "anisotropy": 8 }, "roughness": { "base": 0.95, "variation": 0.12, "map": "independent-roughness-canvas" }, "metalness": { "base": 0.0 }, "emissive": "#000000", "emissiveIntensity": { "base": 0.0 }, "opacity": { "base": 1.0 }, "transparent": false, "doubleSided": false, "envMapIntensity": 0.35, "normal": { "strength": 0.3, "amplitude": 0.3 }, "ambientOcclusion": { "cavityStrength": 0.25, "strength": 0.25 }, "surfaceFrequencyBands": [{ "id": "macro", "frequency": 4, "amplitude": 0.55, "stretch": [0.4, 3.0], "pattern": "ridge", "role": "vertical bark ridges" }, { "id": "meso", "frequency": 18, "amplitude": 0.25, "stretch": [1, 2], "pattern": "grain", "role": "fine fiber" }, { "id": "micro", "frequency": 64, "amplitude": 0.08, "stretch": [1, 1], "pattern": "pebble", "role": "bark pore" }], "localOverrides": [{ "id": "trunkBarkRidges", "kind": "ridge", "description": "Vertical ridge relief on trunk surface; dark cavity tones between ridges.", "relief": { "type": "ridge", "width": 0.05, "height": 0.04 } }] }, options);
    materialMap["matCloud"] = createSculptMaterial("matCloud", { "id": "matCloud", "name": "Cloud", "type": "physical", "shaderModel": "MeshPhysicalMaterial", "baseColor": "#ffffff", "color": "#ffffff", "albedo": { "dominant": "#ffffff", "secondary": ["#ffffff", "#e8eef8", "#8fa6c9"], "samplingNotes": "Palette sampled from reference color zones." }, "colorVariation": { "palette": ["#ffffff", "#e8eef8", "#8fa6c9"], "pattern": "mottled", "amplitude": 0.16, "heightCorrelation": 0.32 }, "textureResolution": 512, "textureProjection": { "mode": "box", "texelDensity": { "units": "texels-per-unit", "value": 16 }, "repeat": [1, 1], "anisotropy": 8 }, "roughness": { "base": 1.0, "variation": 0.12, "map": "independent-roughness-canvas" }, "metalness": { "base": 0.0 }, "emissive": "#ffffff", "emissiveIntensity": { "base": 0.62 }, /* patch: cloud-white-lift (reference cloud whites) */ "opacity": { "base": 0.92 }, "transparent": true, "doubleSided": false, "envMapIntensity": 0.35, "normal": { "strength": 0.3, "amplitude": 0.3 }, "ambientOcclusion": { "cavityStrength": 0.25, "strength": 0.25 }, "localOverrides": [{ "id": "cloudEdgeFalloff", "kind": "contour", "description": "Opacity falls off toward puff/wisp silhouette edges; soft boundaries, no hard rims." }, { "id": "cloudShadowUnderside", "kind": "stain", "description": "Blue-gray #8fa6c9 value zone on undersides of puffs (below midline).", "region": { "hemisphere": "lower", "coverage": 0.16 } /* patch: cloud-stain-weaker (blue underside only at bank bottom) */ }], "surfaceFrequencyBands": [{ "id": "macro", "frequency": 1, "amplitude": 0.15, "stretch": [1, 1], "pattern": "puff", "role": "puff top/bottom value" }, { "id": "meso", "frequency": 6, "amplitude": 0.12, "stretch": [1, 1], "pattern": "wisp", "role": "edge wisp variation" }, { "id": "micro", "frequency": 24, "amplitude": 0.05, "stretch": [1, 1], "pattern": "soft", "role": "vapor grain" }] }, options);
    materialMap["matCloud"].emissive.set(0xffffff);
    materialMap["matCloud"].emissiveIntensity = 1.05; // patch: cloud-emissive-force (bright white puffs)
    materialMap["matCloud"].needsUpdate = true;
    materialMap["matWispy"] = createSculptMaterial("matWispy", { "id": "matWispy", "name": "Wispy cloud", "type": "physical", "shaderModel": "MeshPhysicalMaterial", "baseColor": "#ffffff", "color": "#ffffff", "albedo": { "dominant": "#ffffff", "secondary": ["#ffffff", "#dfe8f5"], "samplingNotes": "Palette sampled from reference color zones." }, "colorVariation": { "palette": ["#ffffff", "#dfe8f5"], "pattern": "mottled", "amplitude": 0.16, "heightCorrelation": 0.32 }, "textureResolution": 512, "textureProjection": { "mode": "box", "texelDensity": { "units": "texels-per-unit", "value": 16 }, "repeat": [1, 1], "anisotropy": 8 }, "roughness": { "base": 1.0, "variation": 0.12, "map": "independent-roughness-canvas" }, "metalness": { "base": 0.0 }, "emissive": "#dfe8f5", "emissiveIntensity": { "base": 0.35 }, "opacity": { "base": 0.55 }, "transparent": true, "doubleSided": false, "envMapIntensity": 0.35, "normal": { "strength": 0.3, "amplitude": 0.3 }, "ambientOcclusion": { "cavityStrength": 0.25, "strength": 0.25 }, "localOverrides": [{ "id": "cloudEdgeFalloff", "kind": "contour", "description": "Feathery opacity falloff at all edges of the wisp ribbon." }], "surfaceFrequencyBands": [{ "id": "macro", "frequency": 1, "amplitude": 0.2, "stretch": [2, 1], "pattern": "streak", "role": "wisp streak" }, { "id": "meso", "frequency": 8, "amplitude": 0.15, "stretch": [2, 1], "pattern": "filament", "role": "feather filaments" }, { "id": "micro", "frequency": 32, "amplitude": 0.06, "stretch": [2, 1], "pattern": "soft", "role": "vapor grain" }] }, options);
    materialMap["matStar"] = createSculptMaterial("matStar", { "id": "matStar", "name": "Star points", "type": "physical", "shaderModel": "MeshPhysicalMaterial", "baseColor": "#0a0e2a", "color": "#0a0e2a", "albedo": { "dominant": "#0a0e2a", "secondary": ["#0a0e2a", "#131a36", "#1b2a5e"], "samplingNotes": "Palette sampled from reference color zones." }, "colorVariation": { "palette": ["#0a0e2a", "#131a36", "#1b2a5e"], "pattern": "mottled", "amplitude": 0.16, "heightCorrelation": 0.32 }, "textureResolution": 512, "textureProjection": { "mode": "box", "texelDensity": { "units": "texels-per-unit", "value": 16 }, "repeat": [1, 1], "anisotropy": 8 }, "roughness": { "base": 1.0, "variation": 0.12, "map": "independent-roughness-canvas" }, "metalness": { "base": 0.0 }, "emissive": "#000000", "emissiveIntensity": { "base": 0.0 }, "opacity": { "base": 0.3 }, "transparent": true, "doubleSided": true, "envMapIntensity": 0.35, "normal": { "strength": 0.3, "amplitude": 0.3 }, "ambientOcclusion": { "cavityStrength": 0.25, "strength": 0.25 }, "localOverrides": [{ "id": "translucentNavyShell", "kind": "shell", "description": "Dark translucent navy shell behind the star points: keeps sky gradient visible through it while blocking the bright mottled look." }], "surfaceFrequencyBands": [{ "id": "macro", "frequency": 1, "amplitude": 0.02, "stretch": [1, 1], "pattern": "flat", "role": "uniform dark shell" }, { "id": "meso", "frequency": 1, "amplitude": 0.02, "stretch": [1, 1], "pattern": "flat", "role": "uniform dark shell" }, { "id": "micro", "frequency": 1, "amplitude": 0.02, "stretch": [1, 1], "pattern": "flat", "role": "uniform dark shell" }] }, options);
    materialMap["matGalaxy"] = createSculptMaterial("matGalaxy", { "id": "matGalaxy", "name": "Galaxy spiral", "type": "physical", "shaderModel": "MeshPhysicalMaterial", "baseColor": "#bcd8ff", "color": "#bcd8ff", "albedo": { "dominant": "#bcd8ff", "secondary": ["#bcd8ff", "#8fa9d9", "#e8f2ff"], "samplingNotes": "Palette sampled from reference color zones." }, "colorVariation": { "palette": ["#bcd8ff", "#8fa9d9", "#e8f2ff"], "pattern": "mottled", "amplitude": 0.16, "heightCorrelation": 0.32 }, "textureResolution": 512, "textureProjection": { "mode": "box", "texelDensity": { "units": "texels-per-unit", "value": 16 }, "repeat": [1, 1], "anisotropy": 8 }, "roughness": { "base": 1.0, "variation": 0.12, "map": "independent-roughness-canvas" }, "metalness": { "base": 0.0 }, "emissive": "#bcd8ff", "emissiveIntensity": { "base": 1.1 }, "opacity": { "base": 0.85 }, "transparent": true, "doubleSided": false, "envMapIntensity": 0.35, "normal": { "strength": 0.3, "amplitude": 0.3 }, "ambientOcclusion": { "cavityStrength": 0.25, "strength": 0.25 }, "localOverrides": [{ "id": "galaxySpiralBand", "kind": "emissive", "description": "Dense star-dot spiral band painted on canvas texture; emissiveMap = albedo canvas so the card self-illuminates with the mottled pattern." }], "surfaceFrequencyBands": [{ "id": "macro", "frequency": 1, "amplitude": 0.3, "stretch": [1, 1], "pattern": "spiral", "role": "spiral band" }, { "id": "meso", "frequency": 14, "amplitude": 0.35, "stretch": [1, 1], "pattern": "star-dots", "role": "star cluster density" }, { "id": "micro", "frequency": 60, "amplitude": 0.2, "stretch": [1, 1], "pattern": "dust", "role": "dust grain" }] }, options);
    materialMap["matGalaxy"].emissiveMap = materialMap["matGalaxy"].map; // patch: matgalaxy-emissivemap
    materialMap["matGalaxy"].emissive.set(0xffffff);
    materialMap["matGalaxy"].emissiveIntensity = 1.1;
    materialMap["matGalaxy"].needsUpdate = true;

    // patch: galaxy-star-band (curved diagonal dense star-dot band painted onto the map)
    (function () {
        const _b = document.createElement('canvas');
        _b.width = _b.height = 256;
        const _bx = _b.getContext('2d');
        const _bimg = _bx.createImageData(256, 256);
        const _band = (t) => { const x = (1 - t) * 256; const y = 66 + 122 * t + 24 * Math.sin(t * 2.6 + 0.5); return [x, y]; }; // patch: galaxy-band-mirror (right end high, descends toward lower-left)
        const _dot = (x, y, r, col, a) => {
            for (let _dy = -2; _dy <= 2; _dy++) {
                for (let _dx = -2; _dx <= 2; _dx++) {
                    const _px = Math.round(x + _dx), _py = Math.round(y + _dy);
                    if (_px < 0 || _px > 255 || _py < 0 || _py > 255) continue;
                    if (_dx * _dx + _dy * _dy > r * r + 1) continue;
                    const _i = (_py * 256 + _px) * 4;
                    const _cov = Math.max(0, 1 - (_dx * _dx + _dy * _dy) / (r * r + 1));
                    _bimg.data[_i] = Math.max(_bimg.data[_i], col[0]);
                    _bimg.data[_i + 1] = Math.max(_bimg.data[_i + 1], col[1]);
                    _bimg.data[_i + 2] = Math.max(_bimg.data[_i + 2], col[2]);
                    _bimg.data[_i + 3] = Math.max(_bimg.data[_i + 3], Math.round(a * _cov * 255));
                }
            }
        };
        // soft band body: pale blue-white haze with brighter core
        for (let _t = 0; _t < 1; _t += 0.004) {
            const [bx, by] = _band(_t);
            const _along = 0.5 - Math.abs(_t - 0.5) * 1.6; // brighter toward center
            for (let _o = -34; _o <= 34; _o += 1) {
                const _px = Math.round(bx - _o * 0.20);
                const _py = Math.round(by + _o * 0.37);
                if (_px < 0 || _px > 255 || _py < 0 || _py > 255) continue;
                const _off = Math.abs(_o);
                const _core = Math.max(0, 1 - _off / 10);
                const _wing = Math.max(0, 1 - _off / 34);
                const _a = (0.10 * _wing + 0.30 * _core) * (0.55 + 0.45 * Math.max(0, _along));
                const _i = (_py * 256 + _px) * 4;
                _bimg.data[_i] = Math.max(_bimg.data[_i], 188);
                _bimg.data[_i + 1] = Math.max(_bimg.data[_i + 1], 214);
                _bimg.data[_i + 2] = Math.max(_bimg.data[_i + 2], 255);
                _bimg.data[_i + 3] = Math.max(_bimg.data[_i + 3], Math.round(_a * 255));
            }
        }
        // dense tiny star dots along the band (denser near center, larger few bright markers)
        for (let _s = 0; _s < 900; _s++) {
            const _t = 0.06 + 0.88 * Math.random();
            const [bx, by] = _band(_t);
            const _off = (Math.random() + Math.random() + Math.random() - 1.5) * 16;
            const _nx = bx - _off * 0.20;
            const _ny = by + _off * 0.37;
            const _big = Math.random() < 0.06;
            const _r = _big ? 1.6 : 0.5 + Math.random() * 0.9;
            const _col = _big ? [255, 252, 240] : (Math.random() < 0.5 ? [232, 240, 255] : [188, 208, 255]);
            _dot(_nx, _ny, _r, _col, _big ? 0.95 : 0.55 + 0.4 * Math.random());
        }
        _bx.putImageData(_bimg, 0, 0);
        const _btex = new THREE.CanvasTexture(_b);
        materialMap["matGalaxy"].map = _btex;
        materialMap["matGalaxy"].emissiveMap = _btex;
        materialMap["matGalaxy"].needsUpdate = true;
    })();

    // patch: galaxy-alpha-fade (elliptical radial fade -> soft nebula patch, no hard square edge)
    (function () {
        const _gc = document.createElement('canvas');
        _gc.width = _gc.height = 256;
        const _gctx = _gc.getContext('2d');
        const _gimg = _gctx.createImageData(256, 256);
        for (let _y = 0; _y < 256; _y++) {
            for (let _x = 0; _x < 256; _x++) {
                const rx = (_x / 255 - 0.5) * 2;
                const ry = (_y / 255 - 0.5) * 2 * (256 / 256) * 1.3;
                const r2 = rx * rx + ry * ry;
                const a = Math.pow(Math.max(0, 1 - r2), 1.6);
                const _i = (_y * 256 + _x) * 4;
                _gimg.data[_i] = _gimg.data[_i + 1] = _gimg.data[_i + 2] = 255;
                _gimg.data[_i + 3] = Math.round(a * 255);
            }
        }
        _gctx.putImageData(_gimg, 0, 0);
        const _gtex = new THREE.CanvasTexture(_gc);
        materialMap["matGalaxy"].alphaMap = _gtex;
        materialMap["matGalaxy"].needsUpdate = true;
    })();

    // patch: cloud-alpha-falloff (ribbon alphaMap: opaque center, feathery taper at width edges and both ends)
    (function () {
        const _c = document.createElement('canvas');
        _c.width = _c.height = 256;
        const _ctx = _c.getContext('2d');
        const _img = _ctx.createImageData(256, 256);
        for (let _y = 0; _y < 256; _y++) {
            const v = _y / 255;
            const vF = Math.pow(Math.max(0, Math.min(1, (0.5 - Math.abs(v - 0.5)) * 2)), 2.6);
            for (let _x = 0; _x < 256; _x++) {
                const u = _x / 255;
                const hF = Math.min(1, Math.min(u, 1 - u) / 0.24);
                const a = vF * hF * hF;
                const _i = (_y * 256 + _x) * 4;
                _img.data[_i] = _img.data[_i + 1] = _img.data[_i + 2] = 255;
                _img.data[_i + 3] = Math.round(a * 255);
            }
        }
        _ctx.putImageData(_img, 0, 0);
        const _tex = new THREE.CanvasTexture(_c);
        materialMap["matWispy"].alphaMap = _tex;
        materialMap["matWispy"].needsUpdate = true;
    })();
    materialMap["matSilhouette"] = createSculptMaterial("matSilhouette", { "id": "matSilhouette", "name": "Backdrop silhouette", "type": "physical", "shaderModel": "MeshPhysicalMaterial", "baseColor": "#0c1024", "color": "#0c1024", "albedo": { "dominant": "#0c1024", "secondary": ["#0c1024", "#131a36"], "samplingNotes": "Palette sampled from reference color zones." }, "colorVariation": { "palette": ["#0c1024", "#131a36"], "pattern": "mottled", "amplitude": 0.16, "heightCorrelation": 0.32 }, "textureResolution": 512, "textureProjection": { "mode": "box", "texelDensity": { "units": "texels-per-unit", "value": 16 }, "repeat": [1, 1], "anisotropy": 8 }, "roughness": { "base": 1.0, "variation": 0.12, "map": "independent-roughness-canvas" }, "metalness": { "base": 0.0 }, "emissive": "#000000", "emissiveIntensity": { "base": 0.0 }, "opacity": { "base": 0.92 }, "transparent": true, "doubleSided": false, "envMapIntensity": 0.35, "normal": { "strength": 0.3, "amplitude": 0.3 }, "ambientOcclusion": { "cavityStrength": 0.25, "strength": 0.25 }, "surfaceFrequencyBands": [{ "id": "macro", "frequency": 1, "amplitude": 0.1, "stretch": [1, 1], "pattern": "flat", "role": "dark mass" }, { "id": "meso", "frequency": 6, "amplitude": 0.08, "stretch": [1, 1], "pattern": "soft", "role": "soft edge" }, { "id": "micro", "frequency": 20, "amplitude": 0.04, "stretch": [1, 1], "pattern": "soft", "role": "silhouette grain" }] }, options);
    materialMap["matGround"] = createSculptMaterial("matGround", { "id": "matGround", "name": "Ground glow", "type": "physical", "shaderModel": "MeshPhysicalMaterial", "baseColor": "#0a0f24", "color": "#0a0f24", "albedo": { "dominant": "#0a0f24", "secondary": ["#0a0f24", "#14204a"], "samplingNotes": "Palette sampled from reference color zones." }, "colorVariation": { "palette": ["#0a0f24", "#14204a"], "pattern": "mottled", "amplitude": 0.16, "heightCorrelation": 0.32 }, "textureResolution": 512, "textureProjection": { "mode": "box", "texelDensity": { "units": "texels-per-unit", "value": 16 }, "repeat": [1, 1], "anisotropy": 8 }, "roughness": { "base": 1.0, "variation": 0.12, "map": "independent-roughness-canvas" }, "metalness": { "base": 0.0 }, "emissive": "#0a0f24", "emissiveIntensity": { "base": 0.35 }, "opacity": { "base": 1.0 }, "transparent": false, "doubleSided": false, "envMapIntensity": 0.35, "normal": { "strength": 0.3, "amplitude": 0.3 }, "ambientOcclusion": { "cavityStrength": 0.25, "strength": 0.25 }, "colorGradient": { "type": "radial", "axis": [0.5, 0.5], "stops": [{ "offset": 0.0, "color": "rgba(20,32,74,1)" }, { "offset": 0.55, "color": "rgba(10,15,36,1)" }, { "offset": 1.0, "color": "rgba(6,8,20,1)" }] }, "surfaceFrequencyBands": [{ "id": "macro", "frequency": 1, "amplitude": 0.2, "stretch": [1, 1], "pattern": "radial", "role": "radial glow falloff" }, { "id": "meso", "frequency": 8, "amplitude": 0.1, "stretch": [1, 1], "pattern": "soft", "role": "soft ground variation" }, { "id": "micro", "frequency": 32, "amplitude": 0.05, "stretch": [1, 1], "pattern": "soft", "role": "ground grain" }] }, options);
    const nodes = { root };
    const meshes = {};
    const sockets = {};
    const colliders = {};
    const destructionGroups = {};
    const attachment_sky_0 = null;
    const endpoint_sky_0 = makeAttachmentEndpoint(attachment_sky_0);
    const node_sky_0 = new THREE.Group();
    node_sky_0.name = "Sky dome__pivot";
    if (endpoint_sky_0) {
        node_sky_0.position.copy(endpoint_sky_0.start);
        node_sky_0.rotation.set(0, 0, 0);
        node_sky_0.scale.set(1, 1, 1);
    }
    else {
        node_sky_0.position.set(0.0, 6.0, 0.0);
        node_sky_0.rotation.set(0.0, 0.0, 0.0);
        node_sky_0.scale.set(40.0, 40.0, 40.0);
    }
    node_sky_0.userData.sculptComponent = { "id": "sky", "name": "Sky dome", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.8, "primitive": "sphere", "topologyClass": "conforming-shell", "topologyRationale": "Sky dome: conforming-shell form per surface_topology classification.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": null, "dimensions": { "width": 40, "height": 40, "depth": 40, "units": "world", "confidence": 0.9 }, "transform": { "position": [0, 6, 0], "rotation": [0, 0, 0], "scale": [40, 40, 40] }, "material": "matSky", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "localFeatures": [{ "id": "skyGradientRamp", "kind": "decal", "description": "Vertical navy->blue->cerulean gradient sampled from reference; dark #0a0e2a at zenith, #4a6fc0 near horizon; smooth ramp, no banding.", "confidence": 0.8 }], "colorMaterialRecipe": { "dominantAlbedo": "rgba(27,42,94,1)", "secondaryAlbedo": "rgba(10,14,42,1)", "materialClass": "unknown", "materialClassConfidence": 0.8, "colorGradient": { "type": "linear", "axis": [0, 1], "stops": [{ "offset": 0, "color": "rgba(74,111,192,1)" }, { "offset": 0.42, "color": "rgba(46,74,143,1)" }, { "offset": 0.72, "color": "rgba(27,42,94,1)" }, { "offset": 1, "color": "rgba(10,14,42,1)" }] } } };
    node_sky_0.userData.actionProfile = { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } };
    (nodes["root"] ?? root).add(node_sky_0);
    nodes["sky"] = node_sky_0;
    const mesh_sky_0Geometry = endpoint_sky_0
        ? new THREE.CylinderGeometry(endpoint_sky_0.endRadius, endpoint_sky_0.baseRadius, endpoint_sky_0.length, 32, 12)
        : new THREE.SphereGeometry(0.5, 64, 40);
    const mesh_sky_0 = new THREE.Mesh(mesh_sky_0Geometry, materialMap["matSky"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 }));
    mesh_sky_0.name = "Sky dome";
    if (endpoint_sky_0) {
        mesh_sky_0.position.copy(endpoint_sky_0.midpoint);
        mesh_sky_0.quaternion.copy(endpoint_sky_0.quaternion);
    }
    mesh_sky_0.castShadow = options.castShadow ?? true;
    mesh_sky_0.receiveShadow = options.receiveShadow ?? true;
    mesh_sky_0.userData.sculptComponent = { "id": "sky", "name": "Sky dome", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.8, "primitive": "sphere", "topologyClass": "conforming-shell", "topologyRationale": "Sky dome: conforming-shell form per surface_topology classification.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": null, "dimensions": { "width": 40, "height": 40, "depth": 40, "units": "world", "confidence": 0.9 }, "transform": { "position": [0, 6, 0], "rotation": [0, 0, 0], "scale": [40, 40, 40] }, "material": "matSky", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "localFeatures": [{ "id": "skyGradientRamp", "kind": "decal", "description": "Vertical navy->blue->cerulean gradient sampled from reference; dark #0a0e2a at zenith, #4a6fc0 near horizon; smooth ramp, no banding.", "confidence": 0.8 }], "colorMaterialRecipe": { "dominantAlbedo": "rgba(27,42,94,1)", "secondaryAlbedo": "rgba(10,14,42,1)", "materialClass": "unknown", "materialClassConfidence": 0.8, "colorGradient": { "type": "linear", "axis": [0, 1], "stops": [{ "offset": 0, "color": "rgba(74,111,192,1)" }, { "offset": 0.42, "color": "rgba(46,74,143,1)" }, { "offset": 0.72, "color": "rgba(27,42,94,1)" }, { "offset": 1, "color": "rgba(10,14,42,1)" }] } } };
    node_sky_0.add(mesh_sky_0);
    meshes["sky"] = mesh_sky_0;
    colliders["sky"] = { "type": "sphere", "radius": 1.0 };
    const attachment_starfield_1 = null;
    const endpoint_starfield_1 = makeAttachmentEndpoint(attachment_starfield_1);
    const node_starfield_1 = new THREE.Group();
    node_starfield_1.name = "Starfield__pivot";
    if (endpoint_starfield_1) {
        node_starfield_1.position.copy(endpoint_starfield_1.start);
        node_starfield_1.rotation.set(0, 0, 0);
        node_starfield_1.scale.set(1, 1, 1);
    }
    else {
        node_starfield_1.position.set(0.0, 5.0, 0.0); // patch: starfield-center-y (hemisphere 5..15.2; ~60% of stars inside frustum)
        node_starfield_1.rotation.set(0.0, 0.0, 0.0);
        node_starfield_1.scale.set(1.0, 1.0, 1.0); // patch: starfield-group-scale (shell mesh keeps 26x)
    }
    node_starfield_1.userData.sculptComponent = { "id": "starfield", "name": "Starfield", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.8, "primitive": "sphere", "topologyClass": "material-only", "topologyRationale": "Starfield: material-only form per surface_topology classification.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": null, "dimensions": { "width": 26, "height": 26, "depth": 26, "units": "world", "confidence": 0.9 }, "transform": { "position": [0, 6, 0], "rotation": [0, 0, 0], "scale": [26.0, 26.0, 26.0] }, "material": "matStar", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "localFeatures": [{ "id": "brightMarkerStars", "kind": "emissive", "description": "A few larger, brighter 4-point sparkle stars (one center-above-wisp, one near galaxy) among the fine field; higher luminance than field stars.", "confidence": 0.8 }] };
    node_starfield_1.userData.actionProfile = { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } };
    (nodes["root"] ?? root).add(node_starfield_1);
    nodes["starfield"] = node_starfield_1;
    const mesh_starfield_1Geometry = endpoint_starfield_1
        ? new THREE.CylinderGeometry(endpoint_starfield_1.endRadius, endpoint_starfield_1.baseRadius, endpoint_starfield_1.length, 32, 12)
        : new THREE.SphereGeometry(0.5, 64, 40);
    const mesh_starfield_1 = new THREE.Mesh(mesh_starfield_1Geometry, materialMap["matStar"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 }));
    mesh_starfield_1.name = "Starfield";
    mesh_starfield_1.scale.set(26.0, 26.0, 26.0); // patch: starfield-mesh-scale
    mesh_starfield_1.visible = false; // patch: hide-starfield-shell (shell wraps the camera and veils the stars)
    if (endpoint_starfield_1) {
        mesh_starfield_1.position.copy(endpoint_starfield_1.midpoint);
        mesh_starfield_1.quaternion.copy(endpoint_starfield_1.quaternion);
    }
    mesh_starfield_1.castShadow = options.castShadow ?? true;
    mesh_starfield_1.receiveShadow = options.receiveShadow ?? true;
    mesh_starfield_1.userData.sculptComponent = { "id": "starfield", "name": "Starfield", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.8, "primitive": "sphere", "topologyClass": "material-only", "topologyRationale": "Starfield: material-only form per surface_topology classification.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": null, "dimensions": { "width": 26, "height": 26, "depth": 26, "units": "world", "confidence": 0.9 }, "transform": { "position": [0, 6, 0], "rotation": [0, 0, 0], "scale": [26.0, 26.0, 26.0] }, "material": "matStar", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "localFeatures": [{ "id": "brightMarkerStars", "kind": "emissive", "description": "A few larger, brighter 4-point sparkle stars (one center-above-wisp, one near galaxy) among the fine field; higher luminance than field stars.", "confidence": 0.8 }] };
    node_starfield_1.add(mesh_starfield_1);
    meshes["starfield"] = mesh_starfield_1;
    colliders["starfield"] = { "type": "sphere", "radius": 1.0 };
    const attachment_galaxy_2 = null;
    const endpoint_galaxy_2 = makeAttachmentEndpoint(attachment_galaxy_2);
    const node_galaxy_2 = new THREE.Group();
    node_galaxy_2.name = "Galaxy spiral__pivot";
    if (endpoint_galaxy_2) {
        node_galaxy_2.position.copy(endpoint_galaxy_2.start);
        node_galaxy_2.rotation.set(0, 0, 0);
        node_galaxy_2.scale.set(1, 1, 1);
    }
    else {
        node_galaxy_2.position.set(10.2, 8.37, -7.87); // patch: galaxy-pos-left (card mostly in frame) // patch: galaxy-scale-mirror (toward reference corner region)
        node_galaxy_2.rotation.set(0.0, 0.0, 0.0);
        node_galaxy_2.scale.set(5.2, 3.9, 1.0); // patch: galaxy-scale-mirror (band ~2x, reference-sized)
    }
    node_galaxy_2.userData.sculptComponent = { "id": "galaxy", "name": "Galaxy spiral", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.8, "primitive": "plane-card", "topologyClass": "material-only", "topologyRationale": "Galaxy spiral: material-only form per surface_topology classification.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": null, "dimensions": { "width": 2.6, "height": 2.0, "depth": 0.1, "units": "world", "confidence": 0.8 }, "transform": { "position": [7.27, 8.37, -7.87], "rotation": [0.0, 0.0, 0.0], "scale": [3.0, 2.3, 1.0] }, "material": "matGalaxy", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "localFeatures": [{ "id": "galaxySpiralBand", "kind": "emissive", "description": "Curved spiral band of densely packed tiny stars high in the open sky upper-right, above the right tree canopy; pale blue-white #bcd8ff, subtle contrast against starfield.", "confidence": 0.8 }], "surfaceDetail": { "macroRoughness": 0.6, "microRoughness": 0.85, "bumpAmplitude": 0.15, "bump": { "type": "star-band", "amplitude": 0.12, "scale": [0.03, 0.03], "role": "dense tiny star dots concentrated in a curved diagonal band across the card" }, "displacement": { "type": "none", "amplitude": 0.0, "role": "material-only surface" }, "ao": { "strength": 0.1, "locality": "dust lanes between star-dot clusters" }, "locality": "band runs diagonally (lower-left to upper-right within the card), denser core, soft edges" } };
    node_galaxy_2.userData.actionProfile = { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } };
    (nodes["root"] ?? root).add(node_galaxy_2);
    nodes["galaxy"] = node_galaxy_2;
    const mesh_galaxy_2Geometry = endpoint_galaxy_2
        ? new THREE.CylinderGeometry(endpoint_galaxy_2.endRadius, endpoint_galaxy_2.baseRadius, endpoint_galaxy_2.length, 32, 12)
        : new THREE.PlaneGeometry(1, 1, 24, 24);
    const mesh_galaxy_2 = new THREE.Mesh(mesh_galaxy_2Geometry, materialMap["matGalaxy"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 }));
    mesh_galaxy_2.name = "Galaxy spiral";
    if (endpoint_galaxy_2) {
        mesh_galaxy_2.position.copy(endpoint_galaxy_2.midpoint);
        mesh_galaxy_2.quaternion.copy(endpoint_galaxy_2.quaternion);
    }
    mesh_galaxy_2.castShadow = options.castShadow ?? true;
    mesh_galaxy_2.receiveShadow = options.receiveShadow ?? true;
    mesh_galaxy_2.userData.sculptComponent = { "id": "galaxy", "name": "Galaxy spiral", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.8, "primitive": "plane-card", "topologyClass": "material-only", "topologyRationale": "Galaxy spiral: material-only form per surface_topology classification.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": null, "dimensions": { "width": 2.6, "height": 2.0, "depth": 0.1, "units": "world", "confidence": 0.8 }, "transform": { "position": [7.27, 8.37, -7.87], "rotation": [0.0, 0.0, 0.0], "scale": [3.0, 2.3, 1.0] }, "material": "matGalaxy", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "localFeatures": [{ "id": "galaxySpiralBand", "kind": "emissive", "description": "Curved spiral band of densely packed tiny stars high in the open sky upper-right, above the right tree canopy; pale blue-white #bcd8ff, subtle contrast against starfield.", "confidence": 0.8 }], "surfaceDetail": { "macroRoughness": 0.6, "microRoughness": 0.85, "bumpAmplitude": 0.15, "bump": { "type": "star-band", "amplitude": 0.12, "scale": [0.03, 0.03], "role": "dense tiny star dots concentrated in a curved diagonal band across the card" }, "displacement": { "type": "none", "amplitude": 0.0, "role": "material-only surface" }, "ao": { "strength": 0.1, "locality": "dust lanes between star-dot clusters" }, "locality": "band runs diagonally (lower-left to upper-right within the card), denser core, soft edges" } };
    node_galaxy_2.add(mesh_galaxy_2);
    meshes["galaxy"] = mesh_galaxy_2;
    colliders["galaxy"] = { "type": "sphere", "radius": 1.0 };
    const attachment_clouds_wispyBand_3 = null;
    const endpoint_clouds_wispyBand_3 = makeAttachmentEndpoint(attachment_clouds_wispyBand_3);
    const node_clouds_wispyBand_3 = new THREE.Group();
    node_clouds_wispyBand_3.name = "Wispy cloud arc__pivot";
    if (endpoint_clouds_wispyBand_3) {
        node_clouds_wispyBand_3.position.copy(endpoint_clouds_wispyBand_3.start);
        node_clouds_wispyBand_3.rotation.set(0, 0, 0);
        node_clouds_wispyBand_3.scale.set(1, 1, 1);
    }
    else {
        node_clouds_wispyBand_3.position.set(2.8, 3.6, -3.5); // patch: wispy-pos-right (bright core lands on reference ribbon x 900-1700)
        node_clouds_wispyBand_3.rotation.set(0.0, 0.0, 0.45); // patch: wispy-diagonal-2 (26deg like reference)
        node_clouds_wispyBand_3.scale.set(10.0, 0.42, 1.0); // patch: wispy-thin-band (thin diagonal ribbon, ~40px thick)
    }
    node_clouds_wispyBand_3.userData.sculptComponent = { "id": "clouds.wispyBand", "name": "Wispy cloud arc", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.8, "primitive": "plane-card", "topologyClass": "continuous-sculpt", "topologyRationale": "Wispy cloud arc: continuous-sculpt form per surface_topology classification.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": null, "dimensions": { "width": 7.2, "height": 1.0, "depth": 0.2, "units": "world", "confidence": 0.85 }, "transform": { "position": [1.8, 4.6, -3.0], "rotation": [0, 0, 0.45], "scale": [10.0, 1.2, 1.0] }, "material": "matWispy", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "localFeatures": [{ "id": "wispFeatherEdges", "kind": "linework", "description": "Feathery semi-translucent ribbon sweeping lower-center -> upper-right; thin filaments at edges with opacity falloff; dominant mid-air feature.", "confidence": 0.8 }], "colorMaterialRecipe": { "dominantAlbedo": "rgba(255,255,255,0.55)", "secondaryAlbedo": "rgba(223,232,245,0.5)", "materialClass": "unknown", "materialClassConfidence": 0.75 }, "surfaceDetail": { "macroRoughness": 0.9, "microRoughness": 0.95, "bumpAmplitude": 0.1, "bump": { "type": "feather-filament", "amplitude": 0.08, "scale": [0.14, 0.02], "role": "filament streaks along band axis, ends taper" }, "displacement": { "type": "feather-cards", "count": 16, "amplitude": 0.18, "role": "overlapping translucent feather cards along the ribbon axis" }, "ao": { "strength": 0.15, "locality": "between feather cards" }, "locality": "detail concentrated along the diagonal ribbon axis (u direction); width edges feathered" } };
    node_clouds_wispyBand_3.userData.actionProfile = { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } };
    (nodes["root"] ?? root).add(node_clouds_wispyBand_3);
    nodes["clouds.wispyBand"] = node_clouds_wispyBand_3;
    const mesh_clouds_wispyBand_3Geometry = endpoint_clouds_wispyBand_3
        ? new THREE.CylinderGeometry(endpoint_clouds_wispyBand_3.endRadius, endpoint_clouds_wispyBand_3.baseRadius, endpoint_clouds_wispyBand_3.length, 32, 12)
        : new THREE.PlaneGeometry(1, 1, 24, 24);
    const mesh_clouds_wispyBand_3 = new THREE.Mesh(mesh_clouds_wispyBand_3Geometry, materialMap["matWispy"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 }));
    mesh_clouds_wispyBand_3.name = "Wispy cloud arc";
    if (endpoint_clouds_wispyBand_3) {
        mesh_clouds_wispyBand_3.position.copy(endpoint_clouds_wispyBand_3.midpoint);
        mesh_clouds_wispyBand_3.quaternion.copy(endpoint_clouds_wispyBand_3.quaternion);
    }
    mesh_clouds_wispyBand_3.castShadow = options.castShadow ?? true;
    mesh_clouds_wispyBand_3.receiveShadow = options.receiveShadow ?? true;
    mesh_clouds_wispyBand_3.userData.sculptComponent = { "id": "clouds.wispyBand", "name": "Wispy cloud arc", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.8, "primitive": "plane-card", "topologyClass": "continuous-sculpt", "topologyRationale": "Wispy cloud arc: continuous-sculpt form per surface_topology classification.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": null, "dimensions": { "width": 7.2, "height": 1.0, "depth": 0.2, "units": "world", "confidence": 0.85 }, "transform": { "position": [1.8, 4.6, -3.0], "rotation": [0, 0, 0.45], "scale": [10.0, 1.2, 1.0] }, "material": "matWispy", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "localFeatures": [{ "id": "wispFeatherEdges", "kind": "linework", "description": "Feathery semi-translucent ribbon sweeping lower-center -> upper-right; thin filaments at edges with opacity falloff; dominant mid-air feature.", "confidence": 0.8 }], "colorMaterialRecipe": { "dominantAlbedo": "rgba(255,255,255,0.55)", "secondaryAlbedo": "rgba(223,232,245,0.5)", "materialClass": "unknown", "materialClassConfidence": 0.75 }, "surfaceDetail": { "macroRoughness": 0.9, "microRoughness": 0.95, "bumpAmplitude": 0.1, "bump": { "type": "feather-filament", "amplitude": 0.08, "scale": [0.14, 0.02], "role": "filament streaks along band axis, ends taper" }, "displacement": { "type": "feather-cards", "count": 16, "amplitude": 0.18, "role": "overlapping translucent feather cards along the ribbon axis" }, "ao": { "strength": 0.15, "locality": "between feather cards" }, "locality": "detail concentrated along the diagonal ribbon axis (u direction); width edges feathered" } };
    node_clouds_wispyBand_3.add(mesh_clouds_wispyBand_3); // patch: wisp-feather-cards
    {
        // feather cards: overlapping translucent planes along the band axis -> feathered ribbon
        mesh_clouds_wispyBand_3.material.opacity = Math.min(mesh_clouds_wispyBand_3.material.opacity ?? 1, 0.45);
        const _fcMat = (materialMap["matWispy"] ?? new THREE.MeshBasicMaterial({ color: 0xd8dce8, transparent: true })).clone();
        _fcMat.opacity = 0.3;
        const _fcGeo = new THREE.PlaneGeometry(1, 1, 12, 12);
        for (let _i = 0; _i < 16; _i++) {
            const _card = new THREE.Mesh(_fcGeo, _fcMat);
            _card.position.set((((_i / 15) - 0.5) * 8.8) / 10, (0.14 * Math.sin(_i * 2.399963)) / 1.2, 0.08 + 0.06 * ((_i * 0.618) % 1));
            _card.rotation.set(0.10 * Math.sin(_i * 1.3), 0.0, 0.30 * ((_i * 0.754877) % 1) - 0.15);
            _card.scale.set(1.4 / 10, (0.28 + 0.16 * ((_i * 0.381966) % 1)) / 0.42, 1); // patch: wispy-thin-cards (world height 0.28-0.44, matches thin ribbon)
            _card.renderOrder = 1;
            node_clouds_wispyBand_3.add(_card);
        }
        // patch: wispy-branch-wisps (3 short branching feathers off the upper band axis)
        {
            const _wMat = (materialMap["matWispy"] ?? new THREE.MeshBasicMaterial({ color: 0xd8dce8, transparent: true })).clone();
            _wMat.opacity = 0.22;
            const _wGeo = new THREE.PlaneGeometry(1, 1, 10, 10);
            for (let _w = 0; _w < 3; _w++) {
                const _wisp = new THREE.Mesh(_wGeo, _wMat);
                const _wt = 0.52 + 0.11 * _w;
                const _wlx = (_wt - 0.5) * 10.0;
                _wisp.position.set(_wlx + 0.35, (0.22 + 0.10 * (_w % 2)) / 0.42, 0.05);
                _wisp.rotation.set(0, 0, -0.55 - 0.25 * _w);
                const _wl = 1.5 + 0.5 * (_w % 2);
                _wisp.scale.set(_wl / 10, (0.30 + 0.08 * _w) / 0.42, 1);
                _wisp.renderOrder = 1;
                node_clouds_wispyBand_3.add(_wisp);
            }
        }
    }
    meshes["clouds.wispyBand"] = mesh_clouds_wispyBand_3;
    colliders["clouds.wispyBand"] = { "type": "sphere", "radius": 1.0 };
    const attachment_clouds_cumulusLayer_4 = null;
    const endpoint_clouds_cumulusLayer_4 = makeAttachmentEndpoint(attachment_clouds_cumulusLayer_4);
    const node_clouds_cumulusLayer_4 = new THREE.Group();
    node_clouds_cumulusLayer_4.name = "Cumulus bank__pivot";
    if (endpoint_clouds_cumulusLayer_4) {
        node_clouds_cumulusLayer_4.position.copy(endpoint_clouds_cumulusLayer_4.start);
        node_clouds_cumulusLayer_4.rotation.set(0, 0, 0);
        node_clouds_cumulusLayer_4.scale.set(1, 1, 1);
    }
    else {
        node_clouds_cumulusLayer_4.position.set(0.0, 1.6, -1.2); // patch: cumulus-lowered (cloud band at bottom edge) // patch: cumulus-fill-bottom (bank fills bottom third) // patch: cumulus-wide-flat (bank covers bottom third)
        node_clouds_cumulusLayer_4.rotation.set(0.0, 0.0, 0.0);
        node_clouds_cumulusLayer_4.scale.set(16.0, 4.5, 7.0); // patch: cumulus-wide-flat (bank covers bottom third)
    }
    node_clouds_cumulusLayer_4.userData.sculptComponent = { "id": "clouds.cumulusLayer", "name": "Cumulus bank", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.8, "primitive": "instanced-cluster", "topologyClass": "assembled-solid", "topologyRationale": "Cumulus bank: assembled-solid form per surface_topology classification.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": null, "dimensions": { "width": 9.0, "height": 1.5, "depth": 3.0, "units": "world", "confidence": 0.85 }, "transform": { "position": [0, 1.7, -1.2], "rotation": [0, 0, 0], "scale": [14.0, 1.8, 3.5] }, "material": "matCloud", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "localFeatures": [{ "id": "cumulusPuffRim", "kind": "fastener", "description": "Dense bank of rounded puffs (repeated module ~40 instances) filling bottom third; white tops with warm #ffd98a rim highlight, blue-gray #8fa6c9 shadow undersides; partially occludes tree bases.", "confidence": 0.8 }, { "id": "cumulusShadowUnderside", "kind": "stain", "description": "Blue-gray #8fa6c9 value zone concentrated on puff undersides (below midline).", "confidence": 0.8 }], "colorMaterialRecipe": { "dominantAlbedo": "rgba(255,255,255,0.92)", "secondaryAlbedo": "rgba(232,238,248,0.9)", "materialClass": "unknown", "materialClassConfidence": 0.8 }, "surfaceDetail": { "macroRoughness": 0.95, "microRoughness": 0.9, "bumpAmplitude": 0.25, "bump": { "type": "puff", "amplitude": 0.2, "scale": [0.5, 0.4], "role": "rounded cauliflower puffs, dense at horizon" }, "displacement": { "type": "puff-spheres", "count": 14, "amplitude": 0.35, "role": "overlapping rounded puff cards/spheres forming the bank" }, "ao": { "strength": 0.3, "locality": "underside of each puff (below midline)" }, "locality": "puffs overlap full width; shadows collect on undersides facing the camera-left" } };
    node_clouds_cumulusLayer_4.userData.actionProfile = { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } };
    (nodes["root"] ?? root).add(node_clouds_cumulusLayer_4);
    nodes["clouds.cumulusLayer"] = node_clouds_cumulusLayer_4;
    const mesh_clouds_cumulusLayer_4Geometry = endpoint_clouds_cumulusLayer_4
        ? new THREE.CylinderGeometry(endpoint_clouds_cumulusLayer_4.endRadius, endpoint_clouds_cumulusLayer_4.baseRadius, endpoint_clouds_cumulusLayer_4.length, 32, 12)
        : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
    const mesh_clouds_cumulusLayer_4 = new THREE.Mesh(mesh_clouds_cumulusLayer_4Geometry, materialMap["matCloud"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 }));
    mesh_clouds_cumulusLayer_4.name = "Cumulus bank";
    mesh_clouds_cumulusLayer_4.visible = false; // patch: cumulus-box-hidden (puffs only)
    if (endpoint_clouds_cumulusLayer_4) {
        mesh_clouds_cumulusLayer_4.position.copy(endpoint_clouds_cumulusLayer_4.midpoint);
        mesh_clouds_cumulusLayer_4.quaternion.copy(endpoint_clouds_cumulusLayer_4.quaternion);
    }
    mesh_clouds_cumulusLayer_4.castShadow = options.castShadow ?? true;
    mesh_clouds_cumulusLayer_4.receiveShadow = options.receiveShadow ?? true;
    mesh_clouds_cumulusLayer_4.userData.sculptComponent = { "id": "clouds.cumulusLayer", "name": "Cumulus bank", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.8, "primitive": "instanced-cluster", "topologyClass": "assembled-solid", "topologyRationale": "Cumulus bank: assembled-solid form per surface_topology classification.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": null, "dimensions": { "width": 9.0, "height": 1.5, "depth": 3.0, "units": "world", "confidence": 0.85 }, "transform": { "position": [0, 1.7, -1.2], "rotation": [0, 0, 0], "scale": [14.0, 1.8, 3.5] }, "material": "matCloud", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "localFeatures": [{ "id": "cumulusPuffRim", "kind": "fastener", "description": "Dense bank of rounded puffs (repeated module ~40 instances) filling bottom third; white tops with warm #ffd98a rim highlight, blue-gray #8fa6c9 shadow undersides; partially occludes tree bases.", "confidence": 0.8 }, { "id": "cumulusShadowUnderside", "kind": "stain", "description": "Blue-gray #8fa6c9 value zone concentrated on puff undersides (below midline).", "confidence": 0.8 }], "colorMaterialRecipe": { "dominantAlbedo": "rgba(255,255,255,0.92)", "secondaryAlbedo": "rgba(232,238,248,0.9)", "materialClass": "unknown", "materialClassConfidence": 0.8 }, "surfaceDetail": { "macroRoughness": 0.95, "microRoughness": 0.9, "bumpAmplitude": 0.25, "bump": { "type": "puff", "amplitude": 0.2, "scale": [0.5, 0.4], "role": "rounded cauliflower puffs, dense at horizon" }, "displacement": { "type": "puff-spheres", "count": 14, "amplitude": 0.35, "role": "overlapping rounded puff cards/spheres forming the bank" }, "ao": { "strength": 0.3, "locality": "underside of each puff (below midline)" }, "locality": "puffs overlap full width; shadows collect on undersides facing the camera-left" } };
    node_clouds_cumulusLayer_4.add(mesh_clouds_cumulusLayer_4);
    meshes["clouds.cumulusLayer"] = mesh_clouds_cumulusLayer_4;
    colliders["clouds.cumulusLayer"] = { "type": "sphere", "radius": 1.0 };
    const attachment_treeLeft_5 = null;
    const endpoint_treeLeft_5 = makeAttachmentEndpoint(attachment_treeLeft_5);
    const node_treeLeft_5 = new THREE.Group();
    node_treeLeft_5.name = "Left tree__pivot";
    if (endpoint_treeLeft_5) {
        node_treeLeft_5.position.copy(endpoint_treeLeft_5.start);
        node_treeLeft_5.rotation.set(0, 0, 0);
        node_treeLeft_5.scale.set(1, 1, 1);
    }
    else {
        node_treeLeft_5.position.set(-6.8, 1.7, -1.8);
        node_treeLeft_5.rotation.set(0.0, 0.0, 0.0);
        node_treeLeft_5.scale.set(1.0, 1.0, 1.0);
    }
    node_treeLeft_5.userData.sculptComponent = { "id": "treeLeft", "name": "Left tree", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.8, "primitive": "sphere", "topologyClass": "continuous-sculpt", "topologyRationale": "Left tree: continuous-sculpt form per surface_topology classification.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": null, "dimensions": { "width": 1.0, "height": 1.0, "depth": 1.0, "units": "world", "confidence": 0.8 }, "transform": { "position": [-6.8, 1.7, -1.8], "rotation": [0, 0, 0], "scale": [1.0, 1.0, 1.0] }, "material": "matFoliage", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "localFeatures": [{ "id": "twinFrameProfile", "kind": "contour", "description": "Large tree on left edge framing the scene; full round canopy silhouette with layered teal/cyan foliage and pale green-yellow top highlights, lit from above/behind.", "confidence": 0.8 }], "colorMaterialRecipe": { "dominantAlbedo": "rgba(30,95,90,1)", "secondaryAlbedo": "rgba(18,59,66,1)", "materialClass": "wood", "materialClassConfidence": 0.8 } };
    node_treeLeft_5.userData.actionProfile = { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } };
    (nodes["root"] ?? root).add(node_treeLeft_5);
    nodes["treeLeft"] = node_treeLeft_5;
    const mesh_treeLeft_5Geometry = endpoint_treeLeft_5
        ? new THREE.CylinderGeometry(endpoint_treeLeft_5.endRadius, endpoint_treeLeft_5.baseRadius, endpoint_treeLeft_5.length, 32, 12)
        : new THREE.SphereGeometry(0.5, 64, 40);
    const mesh_treeLeft_5 = new THREE.Mesh(mesh_treeLeft_5Geometry, materialMap["matFoliage"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 }));
    mesh_treeLeft_5.name = "Left tree";
    mesh_treeLeft_5.visible = false; // patch: hide-root-left
    if (endpoint_treeLeft_5) {
        mesh_treeLeft_5.position.copy(endpoint_treeLeft_5.midpoint);
        mesh_treeLeft_5.quaternion.copy(endpoint_treeLeft_5.quaternion);
    }
    mesh_treeLeft_5.castShadow = options.castShadow ?? true;
    mesh_treeLeft_5.receiveShadow = options.receiveShadow ?? true;
    mesh_treeLeft_5.userData.sculptComponent = { "id": "treeLeft", "name": "Left tree", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.8, "primitive": "sphere", "topologyClass": "continuous-sculpt", "topologyRationale": "Left tree: continuous-sculpt form per surface_topology classification.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": null, "dimensions": { "width": 1.0, "height": 1.0, "depth": 1.0, "units": "world", "confidence": 0.8 }, "transform": { "position": [-6.8, 1.7, -1.8], "rotation": [0, 0, 0], "scale": [1.0, 1.0, 1.0] }, "material": "matFoliage", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "localFeatures": [{ "id": "twinFrameProfile", "kind": "contour", "description": "Large tree on left edge framing the scene; full round canopy silhouette with layered teal/cyan foliage and pale green-yellow top highlights, lit from above/behind.", "confidence": 0.8 }], "colorMaterialRecipe": { "dominantAlbedo": "rgba(30,95,90,1)", "secondaryAlbedo": "rgba(18,59,66,1)", "materialClass": "wood", "materialClassConfidence": 0.8 } };
    node_treeLeft_5.add(mesh_treeLeft_5);
    meshes["treeLeft"] = mesh_treeLeft_5;
    colliders["treeLeft"] = { "type": "sphere", "radius": 1.0 };
    const attachment_treeLeft_trunk_6 = { "parentSocket": "treeLeft:rootBase", "localStart": [-0.0, -1.6, 0.0], "localEnd": [0.0, 2.6, 0.0], "contactType": "socket", "baseRadius": 0.38, "endRadius": 0.14, "embedDepth": 0.35, "overlap": 0.08, "gapTolerance": 0.02 };
    const endpoint_treeLeft_trunk_6 = makeAttachmentEndpoint(attachment_treeLeft_trunk_6);
    const node_treeLeft_trunk_6 = new THREE.Group();
    node_treeLeft_trunk_6.name = "Left trunk__pivot";
    if (endpoint_treeLeft_trunk_6) {
        node_treeLeft_trunk_6.position.copy(endpoint_treeLeft_trunk_6.start);
        node_treeLeft_trunk_6.rotation.set(0, 0, 0);
        node_treeLeft_trunk_6.scale.set(1, 1, 1);
    }
    else {
        node_treeLeft_trunk_6.position.set(0.0, 0.0, 0.0);
        node_treeLeft_trunk_6.rotation.set(0.0, 0.0, 0.0);
        node_treeLeft_trunk_6.scale.set(1.0, 1.0, 1.0);
    }
    node_treeLeft_trunk_6.userData.sculptComponent = { "id": "treeLeft.trunk", "name": "Left trunk", "level": "meso", "role": "support", "importance": 1.0, "confidence": 0.8, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Left trunk: assembled-solid tapered form; attachment cylinders between socket endpoints.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": "treeLeft", "dimensions": { "width": 0.64, "height": 1.9, "depth": 0.64, "units": "world", "confidence": 0.75 }, "transform": { "position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1] }, "material": "matBark", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "attachment": { "parentSocket": "treeLeft:rootBase", "localStart": [-0.0, -1.6, 0.0], "localEnd": [0.0, 2.6, 0.0], "contactType": "socket", "baseRadius": 0.38, "endRadius": 0.14, "embedDepth": 0.35, "overlap": 0.08, "gapTolerance": 0.02 }, "localFeatures": [{ "id": "trunkBarkRidges", "kind": "ridge", "description": "Dark tapered trunk (#2b2333) with vertical ridge relief; base radius 0.32 -> top 0.12; primary branches fork from upper third.", "confidence": 0.8 }], "colorMaterialRecipe": { "dominantAlbedo": "rgba(43,35,51,1)", "secondaryAlbedo": "rgba(36,29,43,1)", "materialClass": "wood", "materialClassConfidence": 0.85 }, "surfaceDetail": { "macroRoughness": 0.95, "microRoughness": 0.9, "bumpAmplitude": 0.15, "bump": { "type": "bark-ridge", "amplitude": 0.14, "scale": [0.05, 0.35], "role": "vertical bark ridges with dark cavity tones" }, "displacement": { "type": "none", "amplitude": 0.0, "role": "flat relief via normal/bump only" }, "ao": { "strength": 0.4, "locality": "ridge valleys" }, "locality": "ridges run vertically; heavier at base, lighter toward canopy" } };
    node_treeLeft_trunk_6.userData.actionProfile = { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } };
    (nodes["treeLeft"] ?? root).add(node_treeLeft_trunk_6);
    nodes["treeLeft.trunk"] = node_treeLeft_trunk_6;
    const mesh_treeLeft_trunk_6Geometry = endpoint_treeLeft_trunk_6
        ? new THREE.CylinderGeometry(endpoint_treeLeft_trunk_6.endRadius, endpoint_treeLeft_trunk_6.baseRadius, endpoint_treeLeft_trunk_6.length, 32, 12)
        : new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 16);
    const mesh_treeLeft_trunk_6 = new THREE.Mesh(mesh_treeLeft_trunk_6Geometry, materialMap["matBark"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 }));
    mesh_treeLeft_trunk_6.name = "Left trunk";
    if (endpoint_treeLeft_trunk_6) {
        mesh_treeLeft_trunk_6.position.copy(endpoint_treeLeft_trunk_6.midpoint);
        mesh_treeLeft_trunk_6.quaternion.copy(endpoint_treeLeft_trunk_6.quaternion);
    }
    mesh_treeLeft_trunk_6.castShadow = options.castShadow ?? true;
    mesh_treeLeft_trunk_6.receiveShadow = options.receiveShadow ?? true;
    mesh_treeLeft_trunk_6.userData.sculptComponent = { "id": "treeLeft.trunk", "name": "Left trunk", "level": "meso", "role": "support", "importance": 1.0, "confidence": 0.8, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Left trunk: assembled-solid tapered form; attachment cylinders between socket endpoints.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": "treeLeft", "dimensions": { "width": 0.64, "height": 1.9, "depth": 0.64, "units": "world", "confidence": 0.75 }, "transform": { "position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1] }, "material": "matBark", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "attachment": { "parentSocket": "treeLeft:rootBase", "localStart": [-0.0, -1.6, 0.0], "localEnd": [0.0, 2.6, 0.0], "contactType": "socket", "baseRadius": 0.38, "endRadius": 0.14, "embedDepth": 0.35, "overlap": 0.08, "gapTolerance": 0.02 }, "localFeatures": [{ "id": "trunkBarkRidges", "kind": "ridge", "description": "Dark tapered trunk (#2b2333) with vertical ridge relief; base radius 0.32 -> top 0.12; primary branches fork from upper third.", "confidence": 0.8 }], "colorMaterialRecipe": { "dominantAlbedo": "rgba(43,35,51,1)", "secondaryAlbedo": "rgba(36,29,43,1)", "materialClass": "wood", "materialClassConfidence": 0.85 }, "surfaceDetail": { "macroRoughness": 0.95, "microRoughness": 0.9, "bumpAmplitude": 0.15, "bump": { "type": "bark-ridge", "amplitude": 0.14, "scale": [0.05, 0.35], "role": "vertical bark ridges with dark cavity tones" }, "displacement": { "type": "none", "amplitude": 0.0, "role": "flat relief via normal/bump only" }, "ao": { "strength": 0.4, "locality": "ridge valleys" }, "locality": "ridges run vertically; heavier at base, lighter toward canopy" } };
    node_treeLeft_trunk_6.add(mesh_treeLeft_trunk_6);
    meshes["treeLeft.trunk"] = mesh_treeLeft_trunk_6;
    colliders["treeLeft.trunk"] = { "type": "sphere", "radius": 1.0 };
    const attachment_treeLeft_branches_7 = { "parentSocket": "treeLeft.trunk:forkA", "localStart": [0.0, 1.35, 0.0], "localEnd": [0.9, 2.2, 0.3], "contactType": "overlap", "baseRadius": 0.14, "endRadius": 0.05, "embedDepth": 0.12, "overlap": 0.12, "gapTolerance": 0.02 };
    const endpoint_treeLeft_branches_7 = makeAttachmentEndpoint(attachment_treeLeft_branches_7);
    const node_treeLeft_branches_7 = new THREE.Group();
    node_treeLeft_branches_7.name = "Left branch system__pivot";
    if (endpoint_treeLeft_branches_7) {
        node_treeLeft_branches_7.position.copy(endpoint_treeLeft_branches_7.start);
        node_treeLeft_branches_7.rotation.set(0, 0, 0);
        node_treeLeft_branches_7.scale.set(1, 1, 1);
    }
    else {
        node_treeLeft_branches_7.position.set(0.0, 0.0, 0.0);
        node_treeLeft_branches_7.rotation.set(0.0, 0.0, 0.0);
        node_treeLeft_branches_7.scale.set(1.0, 1.0, 1.0);
    }
    node_treeLeft_branches_7.userData.sculptComponent = { "id": "treeLeft.branches", "name": "Left branch system", "level": "meso", "role": "support", "importance": 1.0, "confidence": 0.8, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Left branch system: assembled-solid tapered form; attachment cylinders between socket endpoints.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": "treeLeft.trunk", "dimensions": { "width": 0.24, "height": 1.2, "depth": 0.24, "units": "world", "confidence": 0.7 }, "transform": { "position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1] }, "material": "matBark", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "attachment": { "parentSocket": "treeLeft.trunk:forkA", "localStart": [0.0, 1.35, 0.0], "localEnd": [0.9, 2.2, 0.3], "contactType": "overlap", "baseRadius": 0.14, "endRadius": 0.05, "embedDepth": 0.12, "overlap": 0.12, "gapTolerance": 0.02 }, "localFeatures": [{ "id": "branchForks", "kind": "seam", "description": "3-4 primary branches (tapered cylinders) forking from trunk upper third toward canopy; thick roots at trunk, thin tips at canopy rim.", "confidence": 0.8 }], "colorMaterialRecipe": { "dominantAlbedo": "rgba(43,35,51,1)", "secondaryAlbedo": "rgba(36,29,43,1)", "materialClass": "wood", "materialClassConfidence": 0.85 } };
    node_treeLeft_branches_7.userData.actionProfile = { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } };
    (nodes["treeLeft.trunk"] ?? root).add(node_treeLeft_branches_7);
    nodes["treeLeft.branches"] = node_treeLeft_branches_7;
    const mesh_treeLeft_branches_7Geometry = endpoint_treeLeft_branches_7
        ? new THREE.CylinderGeometry(endpoint_treeLeft_branches_7.endRadius, endpoint_treeLeft_branches_7.baseRadius, endpoint_treeLeft_branches_7.length, 32, 12)
        : new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 16);
    const mesh_treeLeft_branches_7 = new THREE.Mesh(mesh_treeLeft_branches_7Geometry, materialMap["matBark"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 }));
    mesh_treeLeft_branches_7.name = "Left branch system";
    if (endpoint_treeLeft_branches_7) {
        mesh_treeLeft_branches_7.position.copy(endpoint_treeLeft_branches_7.midpoint);
        mesh_treeLeft_branches_7.quaternion.copy(endpoint_treeLeft_branches_7.quaternion);
    }
    mesh_treeLeft_branches_7.castShadow = options.castShadow ?? true;
    mesh_treeLeft_branches_7.receiveShadow = options.receiveShadow ?? true;
    mesh_treeLeft_branches_7.userData.sculptComponent = { "id": "treeLeft.branches", "name": "Left branch system", "level": "meso", "role": "support", "importance": 1.0, "confidence": 0.8, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Left branch system: assembled-solid tapered form; attachment cylinders between socket endpoints.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": "treeLeft.trunk", "dimensions": { "width": 0.24, "height": 1.2, "depth": 0.24, "units": "world", "confidence": 0.7 }, "transform": { "position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1] }, "material": "matBark", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "attachment": { "parentSocket": "treeLeft.trunk:forkA", "localStart": [0.0, 1.35, 0.0], "localEnd": [0.9, 2.2, 0.3], "contactType": "overlap", "baseRadius": 0.14, "endRadius": 0.05, "embedDepth": 0.12, "overlap": 0.12, "gapTolerance": 0.02 }, "localFeatures": [{ "id": "branchForks", "kind": "seam", "description": "3-4 primary branches (tapered cylinders) forking from trunk upper third toward canopy; thick roots at trunk, thin tips at canopy rim.", "confidence": 0.8 }], "colorMaterialRecipe": { "dominantAlbedo": "rgba(43,35,51,1)", "secondaryAlbedo": "rgba(36,29,43,1)", "materialClass": "wood", "materialClassConfidence": 0.85 } };
    node_treeLeft_branches_7.add(mesh_treeLeft_branches_7);
    meshes["treeLeft.branches"] = mesh_treeLeft_branches_7;
    colliders["treeLeft.branches"] = { "type": "sphere", "radius": 1.0 };
    const attachment_treeLeft_canopy_8 = null;
    const endpoint_treeLeft_canopy_8 = makeAttachmentEndpoint(attachment_treeLeft_canopy_8);
    const node_treeLeft_canopy_8 = new THREE.Group();
    node_treeLeft_canopy_8.name = "Left canopy__pivot";
    if (endpoint_treeLeft_canopy_8) {
        node_treeLeft_canopy_8.position.copy(endpoint_treeLeft_canopy_8.start);
        node_treeLeft_canopy_8.rotation.set(0, 0, 0);
        node_treeLeft_canopy_8.scale.set(1, 1, 1);
    }
    else {
        node_treeLeft_canopy_8.position.set(0.0, 3.1, 0.0);
        node_treeLeft_canopy_8.rotation.set(0.0, 0.0, 0.0);
        node_treeLeft_canopy_8.scale.set(3.4, 2.7, 3.2);
    }
    node_treeLeft_canopy_8.userData.sculptComponent = { "id": "treeLeft.canopy", "name": "Left canopy", "level": "meso", "role": "body", "importance": 1.0, "confidence": 0.8, "primitive": "sphere", "topologyClass": "continuous-sculpt", "topologyRationale": "Left canopy: continuous-sculpt form per surface_topology classification.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": "treeLeft", "dimensions": { "width": 3.4, "height": 2.7, "depth": 3.2, "units": "world", "confidence": 0.8 }, "transform": { "position": [0.0, 3.1, 0.0], "rotation": [0, 0, 0], "scale": [3.4, 2.7, 3.2] }, "material": "matFoliage", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "localFeatures": [{ "id": "canopyGaps", "kind": "seam", "description": "Irregular gaps in canopy mass exposing dark trunk/branch silhouette; clumps overlap like layered cloud puffs.", "confidence": 0.8 }, { "id": "foliageHighlightZones", "kind": "gloss", "description": "Pale green-yellow #c8e6a0 highlight clumps on upper-lit canopy side; cooler teal #1e5f5a mid-tones; darker blue-teal shadow mass inside.", "confidence": 0.8 }], "colorMaterialRecipe": { "dominantAlbedo": "rgba(30,95,90,1)", "secondaryAlbedo": "rgba(18,59,66,1)", "materialClass": "wood", "materialClassConfidence": 0.8 }, "surfaceDetail": { "macroRoughness": 0.85, "microRoughness": 0.8, "bumpAmplitude": 0.2, "bump": { "type": "leaf-clump", "amplitude": 0.18, "scale": [0.12, 0.12], "role": "layered leaf clumps, highlight zones on upper-lit side" }, "displacement": { "type": "clump-spheres", "count": 10, "amplitude": 0.3, "role": "sphere clumps protruding from the canopy surface" }, "ao": { "strength": 0.35, "locality": "between clumps and under canopy edge" }, "locality": "clumps denser toward canopy rim; gaps show darker interior" } };
    node_treeLeft_canopy_8.userData.actionProfile = { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } };
    (nodes["treeLeft"] ?? root).add(node_treeLeft_canopy_8);
    nodes["treeLeft.canopy"] = node_treeLeft_canopy_8;
    const mesh_treeLeft_canopy_8Geometry = endpoint_treeLeft_canopy_8
        ? new THREE.CylinderGeometry(endpoint_treeLeft_canopy_8.endRadius, endpoint_treeLeft_canopy_8.baseRadius, endpoint_treeLeft_canopy_8.length, 32, 12)
        : new THREE.SphereGeometry(0.5, 64, 40);
    const mesh_treeLeft_canopy_8 = new THREE.Mesh(mesh_treeLeft_canopy_8Geometry, materialMap["matFoliage"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 }));
    mesh_treeLeft_canopy_8.name = "Left canopy";
    if (endpoint_treeLeft_canopy_8) {
        mesh_treeLeft_canopy_8.position.copy(endpoint_treeLeft_canopy_8.midpoint);
        mesh_treeLeft_canopy_8.quaternion.copy(endpoint_treeLeft_canopy_8.quaternion);
    }
    mesh_treeLeft_canopy_8.castShadow = options.castShadow ?? true;
    mesh_treeLeft_canopy_8.receiveShadow = options.receiveShadow ?? true;
    mesh_treeLeft_canopy_8.userData.sculptComponent = { "id": "treeLeft.canopy", "name": "Left canopy", "level": "meso", "role": "body", "importance": 1.0, "confidence": 0.8, "primitive": "sphere", "topologyClass": "continuous-sculpt", "topologyRationale": "Left canopy: continuous-sculpt form per surface_topology classification.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": "treeLeft", "dimensions": { "width": 3.4, "height": 2.7, "depth": 3.2, "units": "world", "confidence": 0.8 }, "transform": { "position": [0.0, 3.1, 0.0], "rotation": [0, 0, 0], "scale": [3.4, 2.7, 3.2] }, "material": "matFoliage", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "localFeatures": [{ "id": "canopyGaps", "kind": "seam", "description": "Irregular gaps in canopy mass exposing dark trunk/branch silhouette; clumps overlap like layered cloud puffs.", "confidence": 0.8 }, { "id": "foliageHighlightZones", "kind": "gloss", "description": "Pale green-yellow #c8e6a0 highlight clumps on upper-lit canopy side; cooler teal #1e5f5a mid-tones; darker blue-teal shadow mass inside.", "confidence": 0.8 }], "colorMaterialRecipe": { "dominantAlbedo": "rgba(30,95,90,1)", "secondaryAlbedo": "rgba(18,59,66,1)", "materialClass": "wood", "materialClassConfidence": 0.8 }, "surfaceDetail": { "macroRoughness": 0.85, "microRoughness": 0.8, "bumpAmplitude": 0.2, "bump": { "type": "leaf-clump", "amplitude": 0.18, "scale": [0.12, 0.12], "role": "layered leaf clumps, highlight zones on upper-lit side" }, "displacement": { "type": "clump-spheres", "count": 10, "amplitude": 0.3, "role": "sphere clumps protruding from the canopy surface" }, "ao": { "strength": 0.35, "locality": "between clumps and under canopy edge" }, "locality": "clumps denser toward canopy rim; gaps show darker interior" } };
    node_treeLeft_canopy_8.add(mesh_treeLeft_canopy_8);
    meshes["treeLeft.canopy"] = mesh_treeLeft_canopy_8;
    colliders["treeLeft.canopy"] = { "type": "sphere", "radius": 1.0 };
    const attachment_treeRight_9 = null;
    const endpoint_treeRight_9 = makeAttachmentEndpoint(attachment_treeRight_9);
    const node_treeRight_9 = new THREE.Group();
    node_treeRight_9.name = "Right tree__pivot";
    if (endpoint_treeRight_9) {
        node_treeRight_9.position.copy(endpoint_treeRight_9.start);
        node_treeRight_9.rotation.set(0, 0, 0);
        node_treeRight_9.scale.set(1, 1, 1);
    }
    else {
        node_treeRight_9.position.set(7.5, 1.5, -1.6);
        node_treeRight_9.rotation.set(0.0, 0.0, 0.0);
        node_treeRight_9.scale.set(1.0, 1.0, 1.0);
    }
    node_treeRight_9.userData.sculptComponent = { "id": "treeRight", "name": "Right tree", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.8, "primitive": "sphere", "topologyClass": "continuous-sculpt", "topologyRationale": "Right tree: continuous-sculpt form per surface_topology classification.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": null, "dimensions": { "width": 1.0, "height": 1.0, "depth": 1.0, "units": "world", "confidence": 0.8 }, "transform": { "position": [7.5, 1.5, -1.6], "rotation": [0, 0, 0], "scale": [1.0, 1.0, 1.0] }, "material": "matFoliage", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "localFeatures": [{ "id": "twinFrameProfileRight", "kind": "contour", "description": "Smaller mirrored framing tree on right edge; same teal/cyan foliage style with pale green-yellow top highlights; ~0.82 scale of left tree.", "confidence": 0.8 }], "colorMaterialRecipe": { "dominantAlbedo": "rgba(30,95,90,1)", "secondaryAlbedo": "rgba(18,59,66,1)", "materialClass": "wood", "materialClassConfidence": 0.8 } };
    node_treeRight_9.userData.actionProfile = { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } };
    (nodes["root"] ?? root).add(node_treeRight_9);
    nodes["treeRight"] = node_treeRight_9;
    const mesh_treeRight_9Geometry = endpoint_treeRight_9
        ? new THREE.CylinderGeometry(endpoint_treeRight_9.endRadius, endpoint_treeRight_9.baseRadius, endpoint_treeRight_9.length, 32, 12)
        : new THREE.SphereGeometry(0.5, 64, 40);
    const mesh_treeRight_9 = new THREE.Mesh(mesh_treeRight_9Geometry, materialMap["matFoliage"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 }));
    mesh_treeRight_9.name = "Right tree";
    mesh_treeRight_9.visible = false; // patch: hide-root-right
    if (endpoint_treeRight_9) {
        mesh_treeRight_9.position.copy(endpoint_treeRight_9.midpoint);
        mesh_treeRight_9.quaternion.copy(endpoint_treeRight_9.quaternion);
    }
    mesh_treeRight_9.castShadow = options.castShadow ?? true;
    mesh_treeRight_9.receiveShadow = options.receiveShadow ?? true;
    mesh_treeRight_9.userData.sculptComponent = { "id": "treeRight", "name": "Right tree", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.8, "primitive": "sphere", "topologyClass": "continuous-sculpt", "topologyRationale": "Right tree: continuous-sculpt form per surface_topology classification.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": null, "dimensions": { "width": 1.0, "height": 1.0, "depth": 1.0, "units": "world", "confidence": 0.8 }, "transform": { "position": [7.5, 1.5, -1.6], "rotation": [0, 0, 0], "scale": [1.0, 1.0, 1.0] }, "material": "matFoliage", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "localFeatures": [{ "id": "twinFrameProfileRight", "kind": "contour", "description": "Smaller mirrored framing tree on right edge; same teal/cyan foliage style with pale green-yellow top highlights; ~0.82 scale of left tree.", "confidence": 0.8 }], "colorMaterialRecipe": { "dominantAlbedo": "rgba(30,95,90,1)", "secondaryAlbedo": "rgba(18,59,66,1)", "materialClass": "wood", "materialClassConfidence": 0.8 } };
    node_treeRight_9.add(mesh_treeRight_9);
    meshes["treeRight"] = mesh_treeRight_9;
    colliders["treeRight"] = { "type": "sphere", "radius": 1.0 };
    const attachment_treeRight_trunk_10 = { "parentSocket": "treeRight:rootBase", "localStart": [0.0, -1.4, 0.0], "localEnd": [0.0, 2.3, 0.0], "contactType": "socket", "baseRadius": 0.32, "endRadius": 0.12, "embedDepth": 0.3, "overlap": 0.08, "gapTolerance": 0.02 };
    const endpoint_treeRight_trunk_10 = makeAttachmentEndpoint(attachment_treeRight_trunk_10);
    const node_treeRight_trunk_10 = new THREE.Group();
    node_treeRight_trunk_10.name = "Right trunk__pivot";
    if (endpoint_treeRight_trunk_10) {
        node_treeRight_trunk_10.position.copy(endpoint_treeRight_trunk_10.start);
        node_treeRight_trunk_10.rotation.set(0, 0, 0);
        node_treeRight_trunk_10.scale.set(1, 1, 1);
    }
    else {
        node_treeRight_trunk_10.position.set(0.0, 0.0, 0.0);
        node_treeRight_trunk_10.rotation.set(0.0, 0.0, 0.0);
        node_treeRight_trunk_10.scale.set(1.0, 1.0, 1.0);
    }
    node_treeRight_trunk_10.userData.sculptComponent = { "id": "treeRight.trunk", "name": "Right trunk", "level": "meso", "role": "support", "importance": 1.0, "confidence": 0.8, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Right trunk: assembled-solid tapered form; attachment cylinders between socket endpoints.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": "treeRight", "dimensions": { "width": 0.54, "height": 1.7, "depth": 0.54, "units": "world", "confidence": 0.75 }, "transform": { "position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1] }, "material": "matBark", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "attachment": { "parentSocket": "treeRight:rootBase", "localStart": [0.0, -1.4, 0.0], "localEnd": [0.0, 2.3, 0.0], "contactType": "socket", "baseRadius": 0.32, "endRadius": 0.12, "embedDepth": 0.3, "overlap": 0.08, "gapTolerance": 0.02 }, "localFeatures": [{ "id": "trunkBarkRidgesRight", "kind": "ridge", "description": "Dark tapered trunk with vertical ridge relief, mirrored and ~0.85 scale of left trunk.", "confidence": 0.8 }], "colorMaterialRecipe": { "dominantAlbedo": "rgba(43,35,51,1)", "secondaryAlbedo": "rgba(36,29,43,1)", "materialClass": "wood", "materialClassConfidence": 0.85 }, "surfaceDetail": { "macroRoughness": 0.95, "microRoughness": 0.9, "bumpAmplitude": 0.15, "bump": { "type": "bark-ridge", "amplitude": 0.14, "scale": [0.05, 0.35], "role": "vertical bark ridges with dark cavity tones" }, "displacement": { "type": "none", "amplitude": 0.0, "role": "flat relief via normal/bump only" }, "ao": { "strength": 0.4, "locality": "ridge valleys" }, "locality": "ridges run vertically; heavier at base, lighter toward canopy" } };
    node_treeRight_trunk_10.userData.actionProfile = { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } };
    (nodes["treeRight"] ?? root).add(node_treeRight_trunk_10);
    nodes["treeRight.trunk"] = node_treeRight_trunk_10;
    const mesh_treeRight_trunk_10Geometry = endpoint_treeRight_trunk_10
        ? new THREE.CylinderGeometry(endpoint_treeRight_trunk_10.endRadius, endpoint_treeRight_trunk_10.baseRadius, endpoint_treeRight_trunk_10.length, 32, 12)
        : new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 16);
    const mesh_treeRight_trunk_10 = new THREE.Mesh(mesh_treeRight_trunk_10Geometry, materialMap["matBark"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 }));
    mesh_treeRight_trunk_10.name = "Right trunk";
    if (endpoint_treeRight_trunk_10) {
        mesh_treeRight_trunk_10.position.copy(endpoint_treeRight_trunk_10.midpoint);
        mesh_treeRight_trunk_10.quaternion.copy(endpoint_treeRight_trunk_10.quaternion);
    }
    mesh_treeRight_trunk_10.castShadow = options.castShadow ?? true;
    mesh_treeRight_trunk_10.receiveShadow = options.receiveShadow ?? true;
    mesh_treeRight_trunk_10.userData.sculptComponent = { "id": "treeRight.trunk", "name": "Right trunk", "level": "meso", "role": "support", "importance": 1.0, "confidence": 0.8, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Right trunk: assembled-solid tapered form; attachment cylinders between socket endpoints.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": "treeRight", "dimensions": { "width": 0.54, "height": 1.7, "depth": 0.54, "units": "world", "confidence": 0.75 }, "transform": { "position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1] }, "material": "matBark", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "attachment": { "parentSocket": "treeRight:rootBase", "localStart": [0.0, -1.4, 0.0], "localEnd": [0.0, 2.3, 0.0], "contactType": "socket", "baseRadius": 0.32, "endRadius": 0.12, "embedDepth": 0.3, "overlap": 0.08, "gapTolerance": 0.02 }, "localFeatures": [{ "id": "trunkBarkRidgesRight", "kind": "ridge", "description": "Dark tapered trunk with vertical ridge relief, mirrored and ~0.85 scale of left trunk.", "confidence": 0.8 }], "colorMaterialRecipe": { "dominantAlbedo": "rgba(43,35,51,1)", "secondaryAlbedo": "rgba(36,29,43,1)", "materialClass": "wood", "materialClassConfidence": 0.85 }, "surfaceDetail": { "macroRoughness": 0.95, "microRoughness": 0.9, "bumpAmplitude": 0.15, "bump": { "type": "bark-ridge", "amplitude": 0.14, "scale": [0.05, 0.35], "role": "vertical bark ridges with dark cavity tones" }, "displacement": { "type": "none", "amplitude": 0.0, "role": "flat relief via normal/bump only" }, "ao": { "strength": 0.4, "locality": "ridge valleys" }, "locality": "ridges run vertically; heavier at base, lighter toward canopy" } };
    node_treeRight_trunk_10.add(mesh_treeRight_trunk_10);
    meshes["treeRight.trunk"] = mesh_treeRight_trunk_10;
    colliders["treeRight.trunk"] = { "type": "sphere", "radius": 1.0 };
    const attachment_treeRight_branches_11 = { "parentSocket": "treeRight.trunk:forkA", "localStart": [0.0, 1.2, 0.0], "localEnd": [-0.8, 2.0, 0.2], "contactType": "overlap", "baseRadius": 0.12, "endRadius": 0.045, "embedDepth": 0.1, "overlap": 0.1, "gapTolerance": 0.02 };
    const endpoint_treeRight_branches_11 = makeAttachmentEndpoint(attachment_treeRight_branches_11);
    const node_treeRight_branches_11 = new THREE.Group();
    node_treeRight_branches_11.name = "Right branch system__pivot";
    if (endpoint_treeRight_branches_11) {
        node_treeRight_branches_11.position.copy(endpoint_treeRight_branches_11.start);
        node_treeRight_branches_11.rotation.set(0, 0, 0);
        node_treeRight_branches_11.scale.set(1, 1, 1);
    }
    else {
        node_treeRight_branches_11.position.set(0.0, 0.0, 0.0);
        node_treeRight_branches_11.rotation.set(0.0, 0.0, 0.0);
        node_treeRight_branches_11.scale.set(1.0, 1.0, 1.0);
    }
    node_treeRight_branches_11.userData.sculptComponent = { "id": "treeRight.branches", "name": "Right branch system", "level": "meso", "role": "support", "importance": 1.0, "confidence": 0.8, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Right branch system: assembled-solid tapered form; attachment cylinders between socket endpoints.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": "treeRight.trunk", "dimensions": { "width": 0.2, "height": 1.0, "depth": 0.2, "units": "world", "confidence": 0.7 }, "transform": { "position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1] }, "material": "matBark", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "attachment": { "parentSocket": "treeRight.trunk:forkA", "localStart": [0.0, 1.2, 0.0], "localEnd": [-0.8, 2.0, 0.2], "contactType": "overlap", "baseRadius": 0.12, "endRadius": 0.045, "embedDepth": 0.1, "overlap": 0.1, "gapTolerance": 0.02 }, "localFeatures": [{ "id": "branchForksRight", "kind": "seam", "description": "3-4 primary branches forking from trunk upper third, mirrored toward -x.", "confidence": 0.8 }], "colorMaterialRecipe": { "dominantAlbedo": "rgba(43,35,51,1)", "secondaryAlbedo": "rgba(36,29,43,1)", "materialClass": "wood", "materialClassConfidence": 0.85 } };
    node_treeRight_branches_11.userData.actionProfile = { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } };
    (nodes["treeRight.trunk"] ?? root).add(node_treeRight_branches_11);
    nodes["treeRight.branches"] = node_treeRight_branches_11;
    const mesh_treeRight_branches_11Geometry = endpoint_treeRight_branches_11
        ? new THREE.CylinderGeometry(endpoint_treeRight_branches_11.endRadius, endpoint_treeRight_branches_11.baseRadius, endpoint_treeRight_branches_11.length, 32, 12)
        : new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 16);
    const mesh_treeRight_branches_11 = new THREE.Mesh(mesh_treeRight_branches_11Geometry, materialMap["matBark"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 }));
    mesh_treeRight_branches_11.name = "Right branch system";
    if (endpoint_treeRight_branches_11) {
        mesh_treeRight_branches_11.position.copy(endpoint_treeRight_branches_11.midpoint);
        mesh_treeRight_branches_11.quaternion.copy(endpoint_treeRight_branches_11.quaternion);
    }
    mesh_treeRight_branches_11.castShadow = options.castShadow ?? true;
    mesh_treeRight_branches_11.receiveShadow = options.receiveShadow ?? true;
    mesh_treeRight_branches_11.userData.sculptComponent = { "id": "treeRight.branches", "name": "Right branch system", "level": "meso", "role": "support", "importance": 1.0, "confidence": 0.8, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Right branch system: assembled-solid tapered form; attachment cylinders between socket endpoints.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": "treeRight.trunk", "dimensions": { "width": 0.2, "height": 1.0, "depth": 0.2, "units": "world", "confidence": 0.7 }, "transform": { "position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1] }, "material": "matBark", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "attachment": { "parentSocket": "treeRight.trunk:forkA", "localStart": [0.0, 1.2, 0.0], "localEnd": [-0.8, 2.0, 0.2], "contactType": "overlap", "baseRadius": 0.12, "endRadius": 0.045, "embedDepth": 0.1, "overlap": 0.1, "gapTolerance": 0.02 }, "localFeatures": [{ "id": "branchForksRight", "kind": "seam", "description": "3-4 primary branches forking from trunk upper third, mirrored toward -x.", "confidence": 0.8 }], "colorMaterialRecipe": { "dominantAlbedo": "rgba(43,35,51,1)", "secondaryAlbedo": "rgba(36,29,43,1)", "materialClass": "wood", "materialClassConfidence": 0.85 } };
    node_treeRight_branches_11.add(mesh_treeRight_branches_11);
    meshes["treeRight.branches"] = mesh_treeRight_branches_11;
    colliders["treeRight.branches"] = { "type": "sphere", "radius": 1.0 };
    const attachment_treeRight_canopy_12 = null;
    const endpoint_treeRight_canopy_12 = makeAttachmentEndpoint(attachment_treeRight_canopy_12);
    const node_treeRight_canopy_12 = new THREE.Group();
    node_treeRight_canopy_12.name = "Right canopy__pivot";
    if (endpoint_treeRight_canopy_12) {
        node_treeRight_canopy_12.position.copy(endpoint_treeRight_canopy_12.start);
        node_treeRight_canopy_12.rotation.set(0, 0, 0);
        node_treeRight_canopy_12.scale.set(1, 1, 1);
    }
    else {
        node_treeRight_canopy_12.position.set(0.0, 2.7, 0.0);
        node_treeRight_canopy_12.rotation.set(0.0, 0.0, 0.0);
        node_treeRight_canopy_12.scale.set(2.9, 2.3, 2.7);
    }
    node_treeRight_canopy_12.userData.sculptComponent = { "id": "treeRight.canopy", "name": "Right canopy", "level": "meso", "role": "body", "importance": 1.0, "confidence": 0.8, "primitive": "sphere", "topologyClass": "continuous-sculpt", "topologyRationale": "Right canopy: continuous-sculpt form per surface_topology classification.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": "treeRight", "dimensions": { "width": 2.9, "height": 2.3, "depth": 2.7, "units": "world", "confidence": 0.8 }, "transform": { "position": [0.0, 2.7, 0.0], "rotation": [0, 0, 0], "scale": [2.9, 2.3, 2.7] }, "material": "matFoliage", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "localFeatures": [{ "id": "canopyGapsRight", "kind": "seam", "description": "Irregular gaps exposing dark trunk/branch silhouette; clump-overlap canopy.", "confidence": 0.8 }, { "id": "foliageHighlightZonesRight", "kind": "gloss", "description": "Pale green-yellow highlight clumps on upper-lit side; cooler mid-tones; darker shadow mass.", "confidence": 0.8 }], "colorMaterialRecipe": { "dominantAlbedo": "rgba(30,95,90,1)", "secondaryAlbedo": "rgba(18,59,66,1)", "materialClass": "wood", "materialClassConfidence": 0.8 }, "surfaceDetail": { "macroRoughness": 0.85, "microRoughness": 0.8, "bumpAmplitude": 0.2, "bump": { "type": "leaf-clump", "amplitude": 0.18, "scale": [0.12, 0.12], "role": "layered leaf clumps, highlight zones on upper-lit side" }, "displacement": { "type": "clump-spheres", "count": 10, "amplitude": 0.3, "role": "sphere clumps protruding from the canopy surface" }, "ao": { "strength": 0.35, "locality": "between clumps and under canopy edge" }, "locality": "clumps denser toward canopy rim; gaps show darker interior" } };
    node_treeRight_canopy_12.userData.actionProfile = { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } };
    (nodes["treeRight"] ?? root).add(node_treeRight_canopy_12);
    nodes["treeRight.canopy"] = node_treeRight_canopy_12;
    const mesh_treeRight_canopy_12Geometry = endpoint_treeRight_canopy_12
        ? new THREE.CylinderGeometry(endpoint_treeRight_canopy_12.endRadius, endpoint_treeRight_canopy_12.baseRadius, endpoint_treeRight_canopy_12.length, 32, 12)
        : new THREE.SphereGeometry(0.5, 64, 40);
    const mesh_treeRight_canopy_12 = new THREE.Mesh(mesh_treeRight_canopy_12Geometry, materialMap["matFoliage"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 }));
    mesh_treeRight_canopy_12.name = "Right canopy";
    if (endpoint_treeRight_canopy_12) {
        mesh_treeRight_canopy_12.position.copy(endpoint_treeRight_canopy_12.midpoint);
        mesh_treeRight_canopy_12.quaternion.copy(endpoint_treeRight_canopy_12.quaternion);
    }
    mesh_treeRight_canopy_12.castShadow = options.castShadow ?? true;
    mesh_treeRight_canopy_12.receiveShadow = options.receiveShadow ?? true;
    mesh_treeRight_canopy_12.userData.sculptComponent = { "id": "treeRight.canopy", "name": "Right canopy", "level": "meso", "role": "body", "importance": 1.0, "confidence": 0.8, "primitive": "sphere", "topologyClass": "continuous-sculpt", "topologyRationale": "Right canopy: continuous-sculpt form per surface_topology classification.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": "treeRight", "dimensions": { "width": 2.9, "height": 2.3, "depth": 2.7, "units": "world", "confidence": 0.8 }, "transform": { "position": [0.0, 2.7, 0.0], "rotation": [0, 0, 0], "scale": [2.9, 2.3, 2.7] }, "material": "matFoliage", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "localFeatures": [{ "id": "canopyGapsRight", "kind": "seam", "description": "Irregular gaps exposing dark trunk/branch silhouette; clump-overlap canopy.", "confidence": 0.8 }, { "id": "foliageHighlightZonesRight", "kind": "gloss", "description": "Pale green-yellow highlight clumps on upper-lit side; cooler mid-tones; darker shadow mass.", "confidence": 0.8 }], "colorMaterialRecipe": { "dominantAlbedo": "rgba(30,95,90,1)", "secondaryAlbedo": "rgba(18,59,66,1)", "materialClass": "wood", "materialClassConfidence": 0.8 }, "surfaceDetail": { "macroRoughness": 0.85, "microRoughness": 0.8, "bumpAmplitude": 0.2, "bump": { "type": "leaf-clump", "amplitude": 0.18, "scale": [0.12, 0.12], "role": "layered leaf clumps, highlight zones on upper-lit side" }, "displacement": { "type": "clump-spheres", "count": 10, "amplitude": 0.3, "role": "sphere clumps protruding from the canopy surface" }, "ao": { "strength": 0.35, "locality": "between clumps and under canopy edge" }, "locality": "clumps denser toward canopy rim; gaps show darker interior" } };
    node_treeRight_canopy_12.add(mesh_treeRight_canopy_12); // patch: canopy-clumps-right
    {
        const _cpGeo = new THREE.SphereGeometry(0.5, 20, 14);
        const _cpMat = materialMap["matFoliage"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 });
        const _cp = new THREE.InstancedMesh(_cpGeo, _cpMat, 7);
        const _cm = new THREE.Matrix4();
        const _cpv = new THREE.Vector3();
        const _cq = new THREE.Quaternion();
        const _cs = new THREE.Vector3();
        for (let _i = 0; _i < 7; _i++) {
            const _a = (_i / 7) * Math.PI * 2;
            const _e = -0.5 + ((_i * 0.6180339887) % 1) * 0.9;
            const _d = new THREE.Vector3(Math.cos(_a) * Math.cos(_e), Math.sin(_e), Math.sin(_a) * Math.cos(_e));
            _cpv.copy(_d.multiplyScalar(0.66));
            _cq.setFromEuler(new THREE.Euler(0, _a, 0));
            const _sz = 0.15 + 0.13 * ((_i * 0.3819660113) % 1);
            _cs.set(_sz, _sz * 0.8, _sz);
            _cm.compose(_cpv, _cq, _cs);
            _cp.setMatrixAt(_i, _cm);
        }
        _cp.instanceMatrix.needsUpdate = true;
        _cp.castShadow = true;
        _cp.receiveShadow = true;
        _cp.name = "canopyClumps";
        node_treeRight_canopy_12.add(_cp);
    }
    meshes["treeRight.canopy"] = mesh_treeRight_canopy_12;
    colliders["treeRight.canopy"] = { "type": "sphere", "radius": 1.0 };
    const attachment_backdrop_13 = null;
    const endpoint_backdrop_13 = makeAttachmentEndpoint(attachment_backdrop_13);
    const node_backdrop_13 = new THREE.Group();
    node_backdrop_13.name = "Backdrop depth layer__pivot";
    if (endpoint_backdrop_13) {
        node_backdrop_13.position.copy(endpoint_backdrop_13.start);
        node_backdrop_13.rotation.set(0, 0, 0);
        node_backdrop_13.scale.set(1, 1, 1);
    }
    else {
        node_backdrop_13.position.set(0.0, 0.4, -4.5);
        node_backdrop_13.rotation.set(0.0, 0.0, 0.0);
        node_backdrop_13.scale.set(16.0, 0.6, 16.0);
    }
    node_backdrop_13.userData.sculptComponent = { "id": "backdrop", "name": "Backdrop depth layer", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.8, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Backdrop depth layer: assembled-solid form per surface_topology classification.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": null, "dimensions": { "width": 16, "height": 0.6, "depth": 16, "units": "world", "confidence": 0.7 }, "transform": { "position": [0, 0.4, -4.5], "rotation": [0, 0, 0], "scale": [16, 0.6, 16] }, "material": "matSilhouette", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "localFeatures": [{ "id": "darkSilhouetteLayer", "kind": "stain", "description": "Darker low-value masses behind the main trees at both bottom corners + dark ground glow; reinforces depth; reads as soft dark base, not hard terrain.", "confidence": 0.8 }], "colorMaterialRecipe": { "dominantAlbedo": "rgba(12,16,36,0.92)", "secondaryAlbedo": "rgba(19,26,54,0.92)", "materialClass": "unknown", "materialClassConfidence": 0.7 } };
    node_backdrop_13.userData.actionProfile = { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } };
    (nodes["root"] ?? root).add(node_backdrop_13);
    nodes["backdrop"] = node_backdrop_13;
    const mesh_backdrop_13Geometry = endpoint_backdrop_13
        ? new THREE.CylinderGeometry(endpoint_backdrop_13.endRadius, endpoint_backdrop_13.baseRadius, endpoint_backdrop_13.length, 32, 12)
        : new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 16);
    const mesh_backdrop_13 = new THREE.Mesh(mesh_backdrop_13Geometry, materialMap["matSilhouette"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 }));
    mesh_backdrop_13.name = "Backdrop depth layer";
    mesh_backdrop_13.position.set(0, -2.0, -0.325); // patch: backdrop-pushback (world [0,-0.8,-9.7] vs pivot scale 16/0.6/16)
    mesh_backdrop_13.scale.set(1.25, 0.5833, 1.25);
    mesh_backdrop_13.material = materialMap["matSilhouette"].clone(); // patch: backdrop-own-material
    mesh_backdrop_13.material.opacity = 0.25;
    mesh_backdrop_13.material.transparent = true;
    if (endpoint_backdrop_13) {
        mesh_backdrop_13.position.copy(endpoint_backdrop_13.midpoint);
        mesh_backdrop_13.quaternion.copy(endpoint_backdrop_13.quaternion);
    }
    mesh_backdrop_13.castShadow = options.castShadow ?? true;
    mesh_backdrop_13.receiveShadow = options.receiveShadow ?? true;
    mesh_backdrop_13.userData.sculptComponent = { "id": "backdrop", "name": "Backdrop depth layer", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.8, "primitive": "cylinder", "topologyClass": "assembled-solid", "topologyRationale": "Backdrop depth layer: assembled-solid form per surface_topology classification.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": null, "dimensions": { "width": 16, "height": 0.6, "depth": 16, "units": "world", "confidence": 0.7 }, "transform": { "position": [0, 0.4, -4.5], "rotation": [0, 0, 0], "scale": [16, 0.6, 16] }, "material": "matSilhouette", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "localFeatures": [{ "id": "darkSilhouetteLayer", "kind": "stain", "description": "Darker low-value masses behind the main trees at both bottom corners + dark ground glow; reinforces depth; reads as soft dark base, not hard terrain.", "confidence": 0.8 }], "colorMaterialRecipe": { "dominantAlbedo": "rgba(12,16,36,0.92)", "secondaryAlbedo": "rgba(19,26,54,0.92)", "materialClass": "unknown", "materialClassConfidence": 0.7 } };
    node_backdrop_13.add(mesh_backdrop_13);
    meshes["backdrop"] = mesh_backdrop_13;
    colliders["backdrop"] = { "type": "sphere", "radius": 1.0 };
    const attachment_backdrop_silhouetteTrees_14 = null;
    const endpoint_backdrop_silhouetteTrees_14 = makeAttachmentEndpoint(attachment_backdrop_silhouetteTrees_14);
    const node_backdrop_silhouetteTrees_14 = new THREE.Group();
    node_backdrop_silhouetteTrees_14.name = "Silhouette trees__pivot";
    if (endpoint_backdrop_silhouetteTrees_14) {
        node_backdrop_silhouetteTrees_14.position.copy(endpoint_backdrop_silhouetteTrees_14.start);
        node_backdrop_silhouetteTrees_14.rotation.set(0, 0, 0);
        node_backdrop_silhouetteTrees_14.scale.set(1, 1, 1);
    }
    else {
        node_backdrop_silhouetteTrees_14.position.set(-8.2, 2.2, -5.6);
        node_backdrop_silhouetteTrees_14.rotation.set(0.0, 0.0, 0.0);
        node_backdrop_silhouetteTrees_14.scale.set(2.4, 4.6, 1.0);
    }
    node_backdrop_silhouetteTrees_14.userData.sculptComponent = { "id": "backdrop.silhouetteTrees", "name": "Silhouette trees", "level": "meso", "role": "body", "importance": 1.0, "confidence": 0.8, "primitive": "plane-card", "topologyClass": "material-only", "topologyRationale": "Silhouette trees: material-only form per surface_topology classification.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": "backdrop", "dimensions": { "width": 2.4, "height": 4.6, "depth": 0.1, "units": "world", "confidence": 0.7 }, "transform": { "position": [-8.2, 2.2, -5.6], "rotation": [0, 0, 0], "scale": [2.4, 4.6, 1] }, "material": "matSilhouette", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "localFeatures": [{ "id": "silhouetteTreeCards", "kind": "stain", "description": "Two faint darker tree-shaped cards behind the foreground trees (mirror at +8.2 x), lower value #0c1024; painted tree silhouette canvas.", "confidence": 0.8 }], "surfaceDetail": { "macroRoughness": 1.0, "microRoughness": 1.0, "bumpAmplitude": 0.05, "bump": { "type": "soft-edge", "amplitude": 0.04, "scale": [0.08, 0.08], "role": "soft noise on silhouette card edges so they read as distant foliage mass" }, "displacement": { "type": "none", "amplitude": 0.0, "role": "flat cards" }, "ao": { "strength": 0.2, "locality": "tree-shape cutout edges" }, "locality": "detail at card silhouette edges only; interior stays flat dark" } };
    node_backdrop_silhouetteTrees_14.userData.actionProfile = { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } };
    root.add(node_backdrop_silhouetteTrees_14); // patch: silhouette-reparent (keep authored world transform)
    nodes["backdrop.silhouetteTrees"] = node_backdrop_silhouetteTrees_14;
    const mesh_backdrop_silhouetteTrees_14Geometry = endpoint_backdrop_silhouetteTrees_14
        ? new THREE.CylinderGeometry(endpoint_backdrop_silhouetteTrees_14.endRadius, endpoint_backdrop_silhouetteTrees_14.baseRadius, endpoint_backdrop_silhouetteTrees_14.length, 32, 12)
        : new THREE.PlaneGeometry(1, 1, 24, 24);
    const mesh_backdrop_silhouetteTrees_14 = new THREE.Mesh(mesh_backdrop_silhouetteTrees_14Geometry, materialMap["matSilhouette"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 }));
    mesh_backdrop_silhouetteTrees_14.name = "Silhouette trees";
    if (endpoint_backdrop_silhouetteTrees_14) {
        mesh_backdrop_silhouetteTrees_14.position.copy(endpoint_backdrop_silhouetteTrees_14.midpoint);
        mesh_backdrop_silhouetteTrees_14.quaternion.copy(endpoint_backdrop_silhouetteTrees_14.quaternion);
    }
    mesh_backdrop_silhouetteTrees_14.castShadow = options.castShadow ?? true;
    mesh_backdrop_silhouetteTrees_14.receiveShadow = options.receiveShadow ?? true;
    mesh_backdrop_silhouetteTrees_14.userData.sculptComponent = { "id": "backdrop.silhouetteTrees", "name": "Silhouette trees", "level": "meso", "role": "body", "importance": 1.0, "confidence": 0.8, "primitive": "plane-card", "topologyClass": "material-only", "topologyRationale": "Silhouette trees: material-only form per surface_topology classification.", "geometryDescriptor": { "topologyIntent": "stylized procedural form", "edgeTreatment": { "type": "none", "bevelRadius": 0.0, "segments": 1 }, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry" }, "parent": "backdrop", "dimensions": { "width": 2.4, "height": 4.6, "depth": 0.1, "units": "world", "confidence": 0.7 }, "transform": { "position": [-8.2, 2.2, -5.6], "rotation": [0, 0, 0], "scale": [2.4, 4.6, 1] }, "material": "matSilhouette", "actionProfile": { "animationRole": "static", "pivot": { "mode": "origin", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.9 }, "collider": { "type": "sphere", "radius": 1.0 }, "destruction": { "fractureGroup": null }, "transformChannels": { "translate": true, "rotate": true, "scale": true } }, "localFeatures": [{ "id": "silhouetteTreeCards", "kind": "stain", "description": "Two faint darker tree-shaped cards behind the foreground trees (mirror at +8.2 x), lower value #0c1024; painted tree silhouette canvas.", "confidence": 0.8 }], "surfaceDetail": { "macroRoughness": 1.0, "microRoughness": 1.0, "bumpAmplitude": 0.05, "bump": { "type": "soft-edge", "amplitude": 0.04, "scale": [0.08, 0.08], "role": "soft noise on silhouette card edges so they read as distant foliage mass" }, "displacement": { "type": "none", "amplitude": 0.0, "role": "flat cards" }, "ao": { "strength": 0.2, "locality": "tree-shape cutout edges" }, "locality": "detail at card silhouette edges only; interior stays flat dark" } };
    mesh_backdrop_silhouetteTrees_14.material = materialMap["matSilhouette"].clone(); // patch: silhouette-own-material
    node_backdrop_silhouetteTrees_14.add(mesh_backdrop_silhouetteTrees_14);
    meshes["backdrop.silhouetteTrees"] = mesh_backdrop_silhouetteTrees_14;
    colliders["backdrop.silhouetteTrees"] = { "type": "sphere", "radius": 1.0 };
    // repetition system: leafCards (InstancedMesh, random-spread, count=120, level=meso)
    {
        const parent = nodes["treeLeft.canopy"] ?? root;
        const geo = new THREE.PlaneGeometry(1, 1, 24, 24);
        const mat = materialMap["matFoliage"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 });
        const scl = [0.55, 0.55, 0.55];
        const axis = new THREE.Vector3(0.0, 0.0, 1.0).normalize();
        const radius = 1.25; // patch: leafcards-radius (leaf ring hugs the canopy sphere)
        const seed = Math.abs(axis.z) < 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
        const perp = new THREE.Vector3().crossVectors(axis, seed).normalize();
        // One InstancedMesh = one draw call for all repeated parts (teeth/fasteners/spokes),
        // replacing the former per-instance Mesh clone loop (real-time perf principle).
        const cluster = new THREE.InstancedMesh(geo, mat, 120);
        const _m = new THREE.Matrix4();
        const _p = new THREE.Vector3();
        const _q = new THREE.Quaternion();
        const _s = new THREE.Vector3(scl[0], scl[1], scl[2]);
        for (let i = 0; i < 120; i++) {
            const ang = ((0.0) + (i * 360) / 120) * Math.PI / 180;
            const dir = perp.clone().applyQuaternion(new THREE.Quaternion().setFromAxisAngle(axis, ang));
            _p.copy(radius > 0 ? dir.clone().multiplyScalar(radius * 0.5) : new THREE.Vector3());
            _q.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
            _m.compose(_p, _q, _s);
            cluster.setMatrixAt(i, _m);
        }
        cluster.instanceMatrix.needsUpdate = true;
        cluster.castShadow = options.castShadow ?? true;
        cluster.receiveShadow = options.receiveShadow ?? true;
        cluster.name = "leafCards";
        // patch: canopy-clumps-left
        {
            const _cpGeo = new THREE.SphereGeometry(0.5, 20, 14);
            const _cpMat = materialMap["matFoliage"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 });
            const _cp = new THREE.InstancedMesh(_cpGeo, _cpMat, 10);
            const _cm = new THREE.Matrix4();
            const _cpv = new THREE.Vector3();
            const _cq = new THREE.Quaternion();
            const _cs = new THREE.Vector3();
            for (let _i = 0; _i < 10; _i++) {
                const _a = (_i / 10) * Math.PI * 2;
                const _e = -0.55 + ((_i * 0.6180339887) % 1) * 0.95;
                const _d = new THREE.Vector3(Math.cos(_a) * Math.cos(_e), Math.sin(_e), Math.sin(_a) * Math.cos(_e));
                _cpv.copy(_d.multiplyScalar(0.68));
                _cq.setFromEuler(new THREE.Euler(0, _a, 0));
                const _sz = 0.16 + 0.14 * ((_i * 0.3819660113) % 1);
                _cs.set(_sz, _sz * 0.8, _sz);
                _cm.compose(_cpv, _cq, _cs);
                _cp.setMatrixAt(_i, _cm);
            }
            _cp.instanceMatrix.needsUpdate = true;
            _cp.castShadow = true;
            _cp.receiveShadow = true;
            _cp.name = "canopyClumps";
            parent.add(_cp);
        }
        parent.add(cluster);
    }
    // repetition system: starPoints (InstancedMesh, upper-hemisphere, count=300, level=meso)
    {
        const parent = nodes["starfield"] ?? root;
        const geo = new THREE.SphereGeometry(0.5, 24, 16); // patch: starpoints-density (lighter: 384 tris/instance)
        const mat = materialMap["matStar"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 });
        const scl = [0.12, 0.12, 0.12]; // patch: starpoints-scl
        const axis = new THREE.Vector3(0.0, 0.0, 1.0).normalize();
        const radius = 20.4;
        const seed = Math.abs(axis.z) < 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
        const perp = new THREE.Vector3().crossVectors(axis, seed).normalize();
        // One InstancedMesh = one draw call for all repeated parts (teeth/fasteners/spokes),
        // replacing the former per-instance Mesh clone loop (real-time perf principle).
        const cluster = new THREE.InstancedMesh(geo, mat, 500); // patch: starpoints-density2 (300 -> 500)
        const _m = new THREE.Matrix4();
        const _p = new THREE.Vector3();
        const _q = new THREE.Quaternion();
        const _s = new THREE.Vector3(scl[0], scl[1], scl[2]);
        var _starMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 });
        var _seed = 20260816;
        for (var i = 0; i < 500; i++) {
            // patch: starpoints-upper-hemisphere (golden-angle quasi-random spread on sky interior) // patch: starpoints-random (seeded LCG, organic scatter, 500)
            _seed = (_seed * 1664525 + 1013904223) % 2147483648;
            var _u1 = _seed / 2147483648;
            _seed = (_seed * 1664525 + 1013904223) % 2147483648;
            var _u2 = _seed / 2147483648;
            var _phi = _u1 * Math.PI * 2;
            var _cosT = 1 - _u2;
            var _sinT = Math.sqrt(Math.max(0, 1 - _cosT * _cosT));
            var dir = new THREE.Vector3(_sinT * Math.cos(_phi), _cosT, _sinT * Math.sin(_phi));
            _p.copy(dir.multiplyScalar(radius * 0.5));
            _q.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
            _m.compose(_p, _q, _s);
            cluster.setMatrixAt(i, _m);
        }
        cluster.instanceMatrix.needsUpdate = true;
        cluster.material = _starMat;
        cluster.castShadow = options.castShadow ?? true;
        cluster.receiveShadow = options.receiveShadow ?? true;
        cluster.name = "starPoints";
        cluster.frustumCulled = false; // patch: starpoints-frustumcull (instances span the upper sky; origin sphere is outside the frustum)
        parent.add(cluster);
    }
    // patch: starpoints-sparkle (bright 4-point marker stars, additive glow)
    {
        const _sparkCanvas = document.createElement('canvas');
        _sparkCanvas.width = 128; _sparkCanvas.height = 128;
        const _sctx = _sparkCanvas.getContext('2d');
        const _sgr = _sctx.createRadialGradient(64, 64, 2, 64, 64, 62);
        _sgr.addColorStop(0, 'rgba(255,255,255,1)');
        _sgr.addColorStop(0.3, 'rgba(255,255,255,0.9)');
        _sgr.addColorStop(0.6, 'rgba(255,255,255,0.3)');
        _sgr.addColorStop(1, 'rgba(255,255,255,0)');
        _sctx.fillStyle = _sgr;
        _sctx.fillRect(0, 0, 128, 128);
        _sctx.fillStyle = 'rgba(255,255,255,1)';
        _sctx.beginPath();
        _sctx.moveTo(64, 2); _sctx.lineTo(69, 59); _sctx.lineTo(126, 64); _sctx.lineTo(69, 69); _sctx.lineTo(64, 126); _sctx.lineTo(59, 69); _sctx.lineTo(2, 64); _sctx.lineTo(59, 59); _sctx.closePath();
        _sctx.fill();
        const _sparkTex = new THREE.CanvasTexture(_sparkCanvas);
        const _sparkMat = new THREE.SpriteMaterial({ map: _sparkTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
        const _sparkSpots = [[11.8, 10.6, -8.5, 0.55], [0.5, 12.5, -9.0, 0.45], [-9.5, 13.2, -7.0, 0.36]];
        for (const _s of _sparkSpots) {
            const _sp = new THREE.Sprite(_sparkMat.clone());
            _sp.position.set(_s[0], _s[1], _s[2]);
            _sp.scale.set(_s[3], _s[3], 1);
            _sp.renderOrder = 10;
            root.add(_sp);
        }
    }
    // repetition system: cloudPuffs (InstancedMesh, random-spread, count=40, level=meso)
    {
        const parent = nodes["clouds.cumulusLayer"] ?? root;
        const geo = new THREE.SphereGeometry(0.5, 64, 40);
        const mat = materialMap["matCloud"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 });
        const scl = [1.0, 1.0, 1.0];
        const axis = new THREE.Vector3(0.0, 1.0, 0.0).normalize(); // patch: cumulus-horizontal-ring (lying bank, not vertical hoop)
        const radius = 4.2;
        const seed = Math.abs(axis.z) < 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
        const perp = new THREE.Vector3().crossVectors(axis, seed).normalize();
        // One InstancedMesh = one draw call for all repeated parts (teeth/fasteners/spokes),
        // replacing the former per-instance Mesh clone loop (real-time perf principle).
        const cluster = new THREE.InstancedMesh(geo, mat, 40);
        const _m = new THREE.Matrix4();
        const _p = new THREE.Vector3();
        const _q = new THREE.Quaternion();
        const _s = new THREE.Vector3(scl[0], scl[1], scl[2]);
        for (let i = 0; i < 40; i++) {
            const ang = ((0.0) + (i * 360) / 40) * Math.PI / 180;
            const dir = perp.clone().applyQuaternion(new THREE.Quaternion().setFromAxisAngle(axis, ang));
            _p.copy(radius > 0 ? dir.clone().multiplyScalar(radius * 0.5) : new THREE.Vector3());
            _q.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
            _m.compose(_p, _q, _s);
            cluster.setMatrixAt(i, _m);
        }
        cluster.instanceMatrix.needsUpdate = true;
        cluster.castShadow = options.castShadow ?? true;
        cluster.receiveShadow = options.receiveShadow ?? true;
        cluster.name = "cloudPuffs";
        parent.add(cluster);
    }
    // patch: cloud-warm-crown (warm #ffd98a edge along the bank top)
    {
        const _cwParent = nodes["clouds.cumulusLayer"] ?? root;
        const _cwGeo = new THREE.SphereGeometry(0.5, 24, 16);
        const _cwMat = new THREE.MeshBasicMaterial({ color: 0xffe3b0, transparent: true, opacity: 0.55 }); // patch: cloud-warm-crown-soft (subtle top highlight)
        const _cwCluster = new THREE.InstancedMesh(_cwGeo, _cwMat, 40);
        const _cwAxis = new THREE.Vector3(0.0, 1.0, 0.0).normalize();
        const _cwRadius = 4.2;
        const _cwSeed = new THREE.Vector3(0, 0, 1);
        const _cwPerp = new THREE.Vector3().crossVectors(_cwAxis, _cwSeed).normalize();
        const _cm = new THREE.Matrix4();
        const _cp = new THREE.Vector3();
        const _cq = new THREE.Quaternion();
        const _cs = new THREE.Vector3(1.0, 0.18, 0.35);
        for (let i = 0; i < 40; i++) {
            _cp.set(-14.0 + (i / 39) * 28.0, 0.50, 0.12 * Math.sin(i * 0.9) + 0.05); // patch: cloud-warm-crown-row // patch: cloud-warm-crown-higher (world y 3.85 = cloud top)
            _cq.setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3(1, 0, 0));
            _cm.compose(_cp, _cq, _cs);
            _cwCluster.setMatrixAt(i, _cm);
        }
        _cwCluster.instanceMatrix.needsUpdate = true;
        _cwCluster.name = "cloudWarmCrown";
        _cwCluster.renderOrder = 11;
        _cwParent.add(_cwCluster);
    }
    // patch: contact-shadow-blobs (soft radial AO under both trees on the floor)
    {
        const _csCanvas = document.createElement('canvas');
        _csCanvas.width = 128; _csCanvas.height = 128;
        const _csCtx = _csCanvas.getContext('2d');
        const _csGrad = _csCtx.createRadialGradient(64, 64, 4, 64, 64, 62);
        _csGrad.addColorStop(0, 'rgba(2,4,10,0.62)');
        _csGrad.addColorStop(0.4, 'rgba(2,4,10,0.4)');
        _csGrad.addColorStop(0.75, 'rgba(2,4,10,0.15)');
        _csGrad.addColorStop(1, 'rgba(2,4,10,0)');
        _csCtx.fillStyle = _csGrad;
        _csCtx.fillRect(0, 0, 128, 128);
        const _csTex = new THREE.CanvasTexture(_csCanvas);
        const _csMat = new THREE.SpriteMaterial({ map: _csTex, transparent: true, depthWrite: false, blending: THREE.NormalBlending });
        // left tree: two overlapping blobs along its screen column; right tree: one wider blob
        const _csSpots = [[-12.9, -3.66, -11.9, 8.6], [-10.8, -3.32, -14.0, 7.0], [9.8, -4.57, -13.9, 9.0]];
        for (const _c of _csSpots) {
            const _cs = new THREE.Sprite(_csMat.clone());
            _cs.position.set(_c[0], _c[1], _c[2]);
            _cs.scale.set(_c[3], _c[3], 1);
            _cs.renderOrder = 9;
            root.add(_cs);
        }
    }
    root.userData.sculptRuntime = { nodes, meshes, sockets, colliders, destructionGroups };
    root.userData.lookDevTargets = { "qualityPriority": "reference-fidelity", "materialPass": { "albedoPaletteRequired": true, "roughnessVariationRequired": true, "normalOrBumpRequired": true, "localOverridesRequired": true, "minimumTextureResolution": 512, "preferredTextureResolution": 1024, "independentMapChannels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "requiredSurfaceFrequencyBands": ["macro", "meso", "micro"], "geometryReliefRequiredWhenSilhouetteAffected": true, "referencePbrExtraction": { "requiredWhenSourceImagePresent": false, "targetThreshold": 0.7, "stopOnLowConfidence": true, "documentedLimitation": "Stylized environment diorama: materials are procedural canvas textures sampled from reference palettes, not photogrammetric PBR extraction. Per-region albedo palettes and value ramps are derived from the reference image; no independent roughness/height/normal map extraction is attempted for painted illustration surfaces." } }, "lightingPass": { "exposure": 1.05, "toneMapping": "ACES Filmic", "keyFillRim": ["warm key from above/behind (moon-glow)", "cool hemisphere fill", "warm low rim on cumulus tops"], "contactShadowBehavior": "soft radial AO under trees and cloud bank on ground disc; contact shadows from key light" } };
    root.userData.actionReadiness = {
        note: 'Use root.userData.sculptRuntime.nodes for transforms, sockets for attachments, colliders for physics proxies, and destructionGroups for breakable sets.',
    };
    return root;
}
function createNightSkyDioramaLookDevLights(mode = 'neutral') {
    const lights = new THREE.Group();
    lights.name = "NightSkyDiorama look-dev lights";
    const hemi = new THREE.HemisphereLight(mode === 'reference' ? 0xfff0d6 : 0xf2f4ff, 0x363b42, mode === 'grazing' ? 0.28 : mode === 'reference' ? 0.72 : 0.85);
    lights.add(hemi);
    const key = new THREE.DirectionalLight(mode === 'reference' ? 0xffcf8a : 0xfff4e8, mode === 'grazing' ? 4.2 : mode === 'reference' ? 2.6 : 2.15);
    if (mode === 'grazing')
        key.position.set(7.5, 1.1, 4.0);
    else if (mode === 'reference')
        key.position.set(-4.5, 7.5, 5.0);
    else
        key.position.set(-4.0, 6.0, 5.5);
    key.castShadow = true;
    key.shadow.mapSize.set(4096, 4096);
    key.shadow.bias = -0.00025;
    key.shadow.normalBias = 0.018;
    key.shadow.radius = 7;
    key.shadow.blurSamples = 24;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 30;
    key.shadow.camera.left = -2.6;
    key.shadow.camera.right = 2.6;
    key.shadow.camera.top = 2.6;
    key.shadow.camera.bottom = -2.6;
    key.shadow.camera.updateProjectionMatrix();
    lights.add(key);
    const fill = new THREE.DirectionalLight(0xa8c4ff, mode === 'grazing' ? 0.12 : 0.42);
    fill.position.set(4.0, 3.0, 3.5);
    lights.add(fill);
    const rim = new THREE.DirectionalLight(0xffd98a, mode === 'grazing' ? 0.6 : mode === 'reference' ? 1.6 : 1.0); // patch: rim-warm-from-below (low warm glow on cumulus tops / canopy rims)
    rim.position.set(0.0, -2.8, -6.0);
    lights.add(rim);
    lights.userData.reviewMode = mode;
    lights.userData.lightingFromPhoto = [{ "id": "moon-glow-key", "type": "directional", "role": "key", "direction": [0.55, 0.8, -0.35], "color": "#ffe6b8", "intensity": 1.6, "evidenceRefs": ["zone-r1c0", "zone-r2c1"], "notes": "Warm pale key from above/behind (hidden moon glow); lights foliage tops and cumulus rims. Exposure 1.05, tone mapping ACES filmic." }, { "id": "cool-fill", "type": "hemisphere", "role": "fill", "skyColor": "#8fa6c9", "groundColor": "#0c1024", "intensity": 0.5, "evidenceRefs": ["full-object"], "notes": "Cool blue ambient from sky bounce; dark ground bounce keeps value range wide under ACES tone mapping." }, { "id": "warm-rim", "type": "directional", "role": "rim", "direction": [-0.2, -0.25, -0.95], "color": "#ffd98a", "intensity": 0.55, "evidenceRefs": ["zone-r2c1"], "notes": "Low warm rim brushing cumulus tops and canopy upper edges from the hidden low light source." }, { "id": "contact-shadow", "type": "ambient-occlusion", "role": "shadow", "color": "#05070f", "intensity": 0.8, "evidenceRefs": ["full-object"], "notes": "Contact shadows and ground AO: soft radial darkening under tree bases and cloud bank on the ground disc; ground shadow behavior." }];
    lights.userData.lookDevTargets = { "qualityPriority": "reference-fidelity", "materialPass": { "albedoPaletteRequired": true, "roughnessVariationRequired": true, "normalOrBumpRequired": true, "localOverridesRequired": true, "minimumTextureResolution": 512, "preferredTextureResolution": 1024, "independentMapChannels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "requiredSurfaceFrequencyBands": ["macro", "meso", "micro"], "geometryReliefRequiredWhenSilhouetteAffected": true, "referencePbrExtraction": { "requiredWhenSourceImagePresent": false, "targetThreshold": 0.7, "stopOnLowConfidence": true, "documentedLimitation": "Stylized environment diorama: materials are procedural canvas textures sampled from reference palettes, not photogrammetric PBR extraction. Per-region albedo palettes and value ramps are derived from the reference image; no independent roughness/height/normal map extraction is attempted for painted illustration surfaces." } }, "lightingPass": { "exposure": 1.05, "toneMapping": "ACES Filmic", "keyFillRim": ["warm key from above/behind (moon-glow)", "cool hemisphere fill", "warm low rim on cumulus tops"], "contactShadowBehavior": "soft radial AO under trees and cloud bank on ground disc; contact shadows from key light" } };
    return lights;
}
// PBR materials (clearcoat/iridescence/transmission/anisotropy) need an environment
// map to visually behave as intended — call this once per renderer and assign the
// result to scene.environment before rendering. No external HDR asset required.
function createNightSkyDioramaEnvironment(renderer) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const texture = pmrem.fromScene(new RoomEnvironment_js_1.RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    return texture;
}
// Plan 1.3 §3.2 — auto-framing by bounding box. The Divine Eye can only compare a
// render to the reference if the object is FRAMED consistently (an object framed
// differently scores as wrong even when its shape is right). This positions the camera
// deterministically from the object's bounding box so it fills the frame at a stable
// margin, and sets near/far to the object scale. Call after adding the model to the
// scene, and again on resize (after updating camera.aspect).
function frameNightSkyDioramaCamera(camera, object, options = {}) {
    const box = new THREE.Box3().setFromObject(object);
    if (box.isEmpty())
        return;
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const margin = options.margin ?? 1.15;
    const maxDim = Math.max(size.x, size.y, size.z) * margin;
    const fov = (camera.fov * Math.PI) / 180;
    // distance so the largest object dimension fits vertically in the frame
    const distance = (maxDim / 2) / Math.tan(fov / 2);
    const az = ((options.azimuthDeg ?? 0) * Math.PI) / 180;
    const el = ((options.elevationDeg ?? 0) * Math.PI) / 180;
    const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    camera.position.copy(center).addScaledVector(dir, distance);
    camera.near = Math.max(0.01, distance - maxDim);
    camera.far = distance + maxDim * 2;
    camera.lookAt(center);
    camera.updateProjectionMatrix();
}
// Plan 1.3 §3.2c — PRESENTATION composer (DOF + bloom). CRITICAL (R-POSTFX): this is
// for the showcase/hero render ONLY. The Divine Eye's EVALUATION render MUST use a
// plain renderer with NO composer — bloom blows highlights and DOF blurs edges, which
// would corrupt the deterministic IoU/DCD/edge/blowout signals. Enable dof/bloom ONLY
// when the reference photo actually exhibits them (detect_reference_effects.py authorizes).
function createNightSkyDioramaPresentationComposer(renderer, scene, camera, options = {}) {
    const composer = new EffectComposer_js_1.EffectComposer(renderer);
    composer.addPass(new RenderPass_js_1.RenderPass(scene, camera));
    if (options.dof) {
        composer.addPass(new BokehPass_js_1.BokehPass(scene, camera, {
            focus: options.dofFocus ?? 10.0,
            aperture: options.dofAperture ?? 0.0002,
            maxblur: 0.01,
        }));
    }
    if (options.bloom) {
        const size = new THREE.Vector2();
        renderer.getSize(size);
        composer.addPass(new UnrealBloomPass_js_1.UnrealBloomPass(size, options.bloomStrength ?? 0.4, 0.4, 0.85));
    }
    return composer;
}
function configureNightSkyDioramaRenderer(renderer) {
    // Load-bearing for view-dependent finishes (anodized / Doppler): without ACES + sRGB
    // the environment reflection reads flat/washed instead of a believable metal response.
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
}
function createNightSkyDioramaInspectControls(camera, domElement) {
    // View-dependent finishes only read correctly once the user orbits — their color
    // comes from the environment reflection, not albedo, so free rotation matters here.
    const controls = new OrbitControls_js_1.OrbitControls(camera, domElement);
    controls.enableDamping = true;
    controls.minDistance = 1.0;
    controls.maxDistance = 8.0;
    controls.autoRotate = false;
    return controls;
}
